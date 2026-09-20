#!/usr/bin/env bun
import { closeSync, constants, fstatSync, openSync, readSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';

const ROOTS = [join(homedir(), '.gemini/antigravity-cli/brain'),
  join(homedir(), '.local/share/agy-accounts/account-b/brain')];
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX_LINE = 16 * 1024 * 1024;
const MAX_SCAN = 64 * 1024 * 1024;
type Message = { role: 'user' | 'assistant'; created_at: string | null;
  step_index: number | null; content: string };

function openTranscript(root: string, session: string): number {
  // Linux directory descriptors keep resolution anchored even if a directory moves.
  let directory = openSync(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    for (const part of [session, '.system_generated', 'logs']) {
      const child = openSync(`/proc/self/fd/${directory}/${part}`,
        constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
      closeSync(directory);
      directory = child;
    }
    const fd = openSync(`/proc/self/fd/${directory}/transcript_full.jsonl`,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    if (!fstatSync(fd).isFile()) {
      closeSync(fd);
      throw new Error('Transcript is not a regular file.');
    }
    return fd;
  } finally { closeSync(directory); }
}

function* reverseLines(fd: number): Generator<Buffer> {
  let remaining = fstatSync(fd).size;
  let pending = Buffer.alloc(0);
  let scanned = 0;
  while (remaining > 0) {
    const size = Math.min(65536, remaining);
    scanned += size;
    if (scanned > MAX_SCAN) throw new Error('Scan exceeds 64 MiB; no partial result returned.');
    remaining -= size;
    const chunk = Buffer.allocUnsafe(size);
    if (readSync(fd, chunk, 0, size, remaining) !== size)
      throw new Error('Transcript changed while reading; retry.');
    const data = Buffer.concat([chunk, pending]);
    let end = data.length;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] !== 10) continue;
      const line = data.subarray(i + 1, end);
      if (line.length > MAX_LINE) throw new Error('Record exceeds 16 MiB; no text truncated.');
      if (line.length && line.toString().trim()) yield line;
      end = i;
    }
    pending = Buffer.from(data.subarray(0, end));
    if (pending.length > MAX_LINE) throw new Error('Record exceeds 16 MiB; no text truncated.');
  }
  if (pending.length && pending.toString().trim()) yield pending;
}

function publicMessage(record: Record<string, unknown>): Message | null {
  if (record.status !== 'DONE') return null;
  let role: Message['role'];
  if (record.type === 'USER_INPUT' && record.source === 'USER_EXPLICIT') role = 'user';
  else if (record.type === 'PLANNER_RESPONSE' && record.source === 'MODEL') role = 'assistant';
  else return null;
  let content = record.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  if (record.truncated_fields && (!Array.isArray(record.truncated_fields) || record.truncated_fields.length))
    throw new Error('Selected message has truncated fields; cannot return full text.');
  if (role === 'user' && content.startsWith('<USER_REQUEST>')) {
    const end = content.lastIndexOf('</USER_REQUEST>');
    if (end >= 14) content = content.slice(14, end).replace(/^\n+|\n+$/g, '');
  }
  return { role, created_at: typeof record.created_at === 'string' ? record.created_at : null,
    step_index: typeof record.step_index === 'number' ? record.step_index : null, content };
}

type ReadOptions = { role?: 'all' | 'user' | 'assistant'; beforeStep?: number };
export function readRecent(session: string, limit = 5, roots = ROOTS, skip = 0, options: ReadOptions = {}) {
  const role = options.role ?? 'all';
  if (!['all', 'user', 'assistant'].includes(role)) throw new Error('role must be all, user or assistant.');
  const beforeStep = options.beforeStep;
  if (beforeStep !== undefined && (!Number.isSafeInteger(beforeStep) || beforeStep < 0))
    throw new Error('before-step must be a non-negative safe integer.');
  if (!UUID.test(session)) throw new Error('session must be an Antigravity UUID, not a path or title.');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000)
    throw new Error('limit must be an integer between 1 and 1000.');
  if (!Number.isSafeInteger(skip) || skip < 0)
    throw new Error('skip must be a non-negative safe integer.');
  session = session.toLowerCase();
  const matches = new Map<string, number>();
  try {
    for (const root of roots) {
      let fd: number;
      try { fd = openTranscript(root, session); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw new Error('Cannot safely open transcript: permissions, symlink or invalid file.');
      }
      const stat = fstatSync(fd);
      const identity = `${stat.dev}:${stat.ino}`;
      if (matches.has(identity)) closeSync(fd);
      else matches.set(identity, fd);
    }
    if (!matches.size) throw new Error('Full transcript not found in the local A/B stores.');
    if (matches.size > 1) throw new Error('Session UUID exists in both stores; refusing to guess.');
    const messages: Message[] = [];
    let skipped = 0;
    let hasMore = false;
    let skippedIncompleteTail = false;
    let first = true;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    for (const line of reverseLines(matches.values().next().value!)) {
      let record: Record<string, unknown>;
      try {
        record = JSON.parse(decoder.decode(line));
        if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error();
      } catch {
        if (first) { first = false; skippedIncompleteTail = true; continue; }
        throw new Error('Invalid record inside transcript; no partial result returned.');
      }
      first = false;
      const message = publicMessage(record);
      if (!message || (role !== 'all' && message.role !== role)) continue;
      if (!Number.isSafeInteger(message.step_index) || message.step_index! < 0)
        throw new Error('Message lacks a valid step_index; stable pagination is unavailable.');
      if (beforeStep !== undefined && message.step_index! >= beforeStep) continue;
      if (skipped < skip) { skipped++; continue; }
      if (messages.length === limit) { hasMore = true; break; }
      messages.push(message);
    }
    return { conversation_id: session, limit, skip, role, before_step: beforeStep ?? null,
      count: messages.length, has_more: hasMore,
      next_cursor: hasMore ? messages[messages.length - 1].step_index : null,
      order: 'newest_to_oldest', source: 'local_antigravity_transcript_full',
      skipped_incomplete_tail: skippedIncompleteTail, messages };
  } finally { for (const fd of matches.values()) closeSync(fd); }
}


type SessionInfo = { conversation_id: string; title: string; summary: string;
  updated_at: string; account: string; names: string[] };
type NameMap = Record<string, string>;
function localNames(): NameMap {
  try {
    const value = JSON.parse(readFileSync(join(homedir(), '.config/antigravity-chat-read/names.json'), 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.entries(value).some(([k, v]) => !k.trim() || typeof v !== 'string' || !UUID.test(v)))
      throw new Error('Invalid names.json; expected display-name to UUID mapping.');
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}
export function listSessions(name = '', roots = ROOTS, names: NameMap = localNames()) {
  const sessions: SessionInfo[] = [];
  const warnings: string[] = [];
  for (const [index, root] of roots.entries()) {
    let db: Database;
    try { db = new Database(join(root, '../conversation_summaries.db'), { readonly: true }); }
    catch { warnings.push(`Session index unavailable for account ${index + 1}.`); continue; }
    try {
      const rows = db.query('SELECT conversation_id, title, preview, last_modified_time FROM conversation_summaries').all() as
        { conversation_id: string; title: string; preview: string; last_modified_time: string }[];
      for (const row of rows) {
        if (!UUID.test(row.conversation_id)) continue;
        const aliases = Object.entries(names).filter(([, id]) => id.toLowerCase() === row.conversation_id.toLowerCase()).map(([n]) => n);
        if (name && ![row.title, ...aliases].some(x => x.toLowerCase().includes(name.toLowerCase()))) continue;
        sessions.push({ conversation_id: row.conversation_id, title: row.title,
          summary: (row.preview || '').replace(/\s+/g, ' ').slice(0, 240),
          updated_at: row.last_modified_time, account: index === 0 ? 'a' : index === 1 ? 'b' : String(index + 1), names: aliases });
      }
    } finally { db.close(); }
  }
  sessions.sort((a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0) || a.conversation_id.localeCompare(b.conversation_id));
  return { sessions, warnings };
}
export function resolveName(name: string, roots = ROOTS, names: NameMap = localNames()) {
  if (!name.trim()) throw new Error('name must not be empty.');
  const { sessions, warnings } = listSessions(name, roots, names);
  if (warnings.length) throw new Error('Cannot resolve name uniquely: one or more session indexes unavailable. Use --session UUID.');
  const exact = sessions.filter(x => [x.title, ...x.names].some(n => n.toLowerCase() === name.toLowerCase()));
  const candidates = exact.length ? exact : sessions;
  if (candidates.length !== 1) throw new Error(candidates.length ?
    'Name is ambiguous; use sessions --name to inspect candidates, then --session UUID.' :
    'No matching local title or verified display-name mapping. Multica display-name lookup is not available through the current task CLI.');
  return candidates[0];
}

type Args = { session?: string; name?: string; limit: number; skip: number;
  command?: 'sessions'; role?: 'all' | 'user' | 'assistant'; beforeStep?: number };
export function parseArgs(input: string[]): Args {
  const args = [...input];
  const result: Args = { limit: 5, skip: 0 };
  if (args[0] === 'sessions') { result.command = 'sessions'; args.shift(); result.limit = 20; }
  const seen = new Set<string>();
  const flags: Record<string, string> = { '--session': 'session', '-s': 'session', '--name': 'name',
    '--limit': 'limit', '-n': 'limit', '--skip': 'skip', '--role': 'role',
    '--before-step': 'beforeStep', '--cursor': 'beforeStep' };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    let key = flags[flag];
    let value: string;
    if (!key && !flag.startsWith('-') && !result.command) { key = 'session'; value = flag; }
    else {
      if (!key) throw new Error(`Unknown argument: ${flag}`);
      value = args[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
    }
    if (seen.has(key)) throw new Error(`Specify ${key} only once.`);
    seen.add(key);
    if (['limit', 'skip', 'beforeStep'].includes(key)) {
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${flag} requires a non-negative safe integer.`);
      (result as any)[key] = Number(value);
    } else (result as any)[key] = value;
  }
  if (result.limit < 1 || result.limit > 1000) throw new Error('limit must be between 1 and 1000.');
  if (result.role && !['all', 'user', 'assistant'].includes(result.role)) throw new Error('role must be all, user or assistant.');
  if (result.name !== undefined && !result.name.trim()) throw new Error('name must not be empty.');
  if (result.command) {
    if (result.session || result.role || result.beforeStep !== undefined) throw new Error('sessions accepts only name, limit and skip.');
  } else if (!!result.session === !!result.name) throw new Error('Specify exactly one of --session UUID or --name NAME.');
  return result;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(`Usage:
  agy-chat-read (--session UUID | --name NAME) [--limit N] [--skip N]
                [--role all|user|assistant] [--before-step STEP | --cursor STEP]
  agy-chat-read sessions [--name TEXT] [--limit N] [--skip N]
Default: latest 5 completed public messages, newest first; skip=0, role=all.
Use next_cursor as --cursor with the same session/role and skip=0 for the next page.
Name matches local titles or verified names.json entries; it is not a live Multica title search.`);
  } else {
    try {
      const arg = parseArgs(args);
      if (arg.command === 'sessions') {
        const result = listSessions(arg.name);
        const selected = result.sessions.slice(arg.skip, arg.skip + arg.limit);
        const hasMore = arg.skip + selected.length < result.sessions.length;
        console.log(JSON.stringify({ sessions: selected, count: selected.length, limit: arg.limit,
          skip: arg.skip, has_more: hasMore, next_skip: hasMore ? arg.skip + selected.length : null,
          warnings: result.warnings }, null, 2));
      } else {
        const match = arg.name ? resolveName(arg.name) : undefined;
        console.log(JSON.stringify(readRecent(match?.conversation_id ?? arg.session!, arg.limit, ROOTS,
          arg.skip, { role: arg.role, beforeStep: arg.beforeStep }), null, 2));
      }
    } catch (error) {
      console.error(JSON.stringify({ error: (error as Error).message }));
      process.exitCode = 1;
    }
  }
}
