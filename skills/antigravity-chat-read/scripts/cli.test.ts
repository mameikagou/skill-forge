import { afterEach, beforeEach, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, readRecent, listSessions, resolveName } from './cli';
import { Database } from 'bun:sqlite';

const id = '11111111-1111-4111-8111-111111111111';
let temp: string, roots: string[];
beforeEach(() => {
  temp = mkdtempSync(join(tmpdir(), 'agy-reader-test-'));
  roots = [join(temp, 'a'), join(temp, 'b')];
  roots.forEach(p => mkdirSync(p));
});
afterEach(() => rmSync(temp, { recursive: true, force: true }));
const message = (i: number, content = `message ${i}`) => ({ step_index: i, content,
  source: i % 2 ? 'MODEL' : 'USER_EXPLICIT', type: i % 2 ? 'PLANNER_RESPONSE' : 'USER_INPUT',
  status: 'DONE', created_at: '2026-09-20T10:00:00Z' });
function write(rows: unknown[], account = 0, tail = '') {
  const path = join(roots[account], id, '.system_generated/logs/transcript_full.jsonl');
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, rows.map(x => JSON.stringify(x) + '\n').join('') + tail);
  return path;
}
test('default latest five and selectable count are newest first', () => {
  write(Array.from({ length: 12 }, (_, i) => message(i)));
  expect(readRecent(id, undefined, roots).messages.map(x => x.step_index)).toEqual([11, 10, 9, 8, 7]);
  expect(readRecent(id, 2, roots).messages.map(x => x.step_index)).toEqual([11, 10]);
  expect(readRecent(id, 20, roots).count).toBe(12);
});
test('filters internal data and unfinished responses', () => {
  write([{ ...message(1), thinking: 'PRIVATE', tool_calls: ['PRIVATE'] },
    { ...message(3), status: 'RUNNING' },
    { ...message(5), type: 'GENERIC', content: 'PRIVATE' },
    { ...message(7), content: '', thinking: 'PRIVATE' }]);
  const result = readRecent(id, 5, roots);
  expect(result.count).toBe(1);
  expect(JSON.stringify(result)).not.toContain('PRIVATE');
});
test('supports B store and empty history', () => {
  write([], 1);
  expect(readRecent(id, 5, roots).count).toBe(0);
  write([message(1)], 1);
  expect(readRecent(id, 5, roots).count).toBe(1);
});
test('rejects invalid ID, arbitrary paths and invalid counts', () => {
  for (const value of ['../secret', '/etc/passwd', id + '/x'])
    expect(() => readRecent(value, 5, roots)).toThrow();
  for (const limit of [0, -1, 1.2, NaN, Infinity, 1001])
    expect(() => readRecent(id, limit, roots)).toThrow();
});
test('missing session and ambiguous UUID fail explicitly', () => {
  expect(() => readRecent(id, 5, roots)).toThrow('not found');
  write([message(1)]); write([message(2)], 1);
  expect(() => readRecent(id, 5, roots)).toThrow('both stores');
});
test('deduplicates same file', () => {
  write([message(1)]);
  expect(readRecent(id, 5, [roots[0], roots[0]]).count).toBe(1);
});
test('refuses directory symlinks', () => {
  write([message(1)], 1);
  symlinkSync(join(roots[1], id), join(roots[0], id));
  expect(() => readRecent(id, 5, roots)).toThrow('safely');
});
test('skips partially written tail and reports it', () => {
  write([message(1)], 0, '{"step_index":');
  const result = readRecent(id, 5, roots);
  expect(result.skipped_incomplete_tail).toBe(true);
  expect(result.count).toBe(1);
});
test('interior corruption and truncated text fail', () => {
  write([message(1)], 0, 'corrupt\n' + JSON.stringify(message(2)));
  expect(() => readRecent(id, 5, roots)).toThrow('Invalid record');
  write([{ ...message(1), truncated_fields: ['content'] }]);
  expect(() => readRecent(id, 5, roots)).toThrow('truncated');
});
test('preserves long unicode across chunk boundaries without writes', () => {
  const text = '中文🙂'.repeat(20000);
  const path = write([], 0, JSON.stringify(message(1, text)));
  const before = readFileSync(path), mtime = statSync(path).mtimeMs;
  expect(readRecent(id, 5, roots).messages[0].content).toBe(text);
  expect(readFileSync(path)).toEqual(before);
  expect(statSync(path).mtimeMs).toBe(mtime);
});
test('strips only user envelope', () => {
  write([message(0, '<USER_REQUEST>\nhello <tag>\n</USER_REQUEST>\n<ADDITIONAL_METADATA>PRIVATE</ADDITIONAL_METADATA>')]);
  expect(readRecent(id, 5, roots).messages[0].content).toBe('hello <tag>');
});
test('CLI supports session, limit and skip with defaults', () => {
  expect(parseArgs(['--session', id])).toEqual({ session: id, limit: 5, skip: 0 });
  expect(parseArgs([id, '-n', '20'])).toEqual({ session: id, limit: 20, skip: 0 });
  expect(parseArgs(['--limit', '2', '-s', id])).toEqual({ session: id, limit: 2, skip: 0 });
  for (const args of [[], ['--session'], [id, '-n'], [id, '-n', '1.5'], [id, '--mcp'],
    [id, '--session', id], [id, '-n', '5', '-n', '10']]) expect(() => parseArgs(args)).toThrow();
});

test('skip counts public messages and preserves descending pagination', () => {
  const rows = Array.from({ length: 12 }, (_, i) => message(i));
  write(rows.flatMap(row => [row, { ...message(100), type: 'GENERIC' },
    { ...message(101), status: 'RUNNING' }]));
  expect(readRecent(id, 5, roots, 0).messages.map(x => x.step_index)).toEqual([11, 10, 9, 8, 7]);
  expect(readRecent(id, 5, roots, 5).messages.map(x => x.step_index)).toEqual([6, 5, 4, 3, 2]);
  expect(readRecent(id, 5, roots, 10).messages.map(x => x.step_index)).toEqual([1, 0]);
  expect(readRecent(id, 5, roots, 12).count).toBe(0);
  expect(readRecent(id, 5, roots, 100).messages).toEqual([]);
  expect(readRecent(id, 5, roots, 10).skip).toBe(10);
});
test('skip argument parsing and invalid values', () => {
  expect(parseArgs([id, '--skip', '10', '-n', '5'])).toEqual({ session: id, skip: 10, limit: 5 });
  expect(parseArgs(['--skip', '0', id])).toEqual({ session: id, skip: 0, limit: 5 });
  for (const args of [[id, '--skip'], [id, '--skip', '-1'], [id, '--skip', '1.5'],
    [id, '--skip', 'a'], [id, '--skip', '0', '--skip', '1']]) expect(() => parseArgs(args)).toThrow();
  for (const skip of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    expect(() => readRecent(id, 5, roots, skip)).toThrow('skip');
});

test('role filtering precedes skip and cursor bounds are exclusive', () => {
  write(Array.from({ length: 12 }, (_, i) => message(i)));
  const page = readRecent(id, 2, roots, 1, { role: 'user', beforeStep: 10 });
  expect(page.messages.map(x => x.step_index)).toEqual([6, 4]);
  expect(page.has_more).toBe(true);
  expect(page.next_cursor).toBe(4);
  const next = readRecent(id, 2, roots, 0, { role: 'user', beforeStep: page.next_cursor! });
  expect(next.messages.map(x => x.step_index)).toEqual([2, 0]);
  expect(next.has_more).toBe(false);
  expect(next.next_cursor).toBeNull();
});
test('cursor remains stable when newer messages arrive', () => {
  const original = Array.from({ length: 6 }, (_, i) => message(i));
  write(original);
  const first = readRecent(id, 2, roots);
  write([...original, message(6), message(7)]);
  expect(readRecent(id, 2, roots, 0, { beforeStep: first.next_cursor! }).messages.map(x => x.step_index)).toEqual([3, 2]);
});
test('empty and exact-size pages report end of history', () => {
  write([message(1)]);
  expect(readRecent(id, 1, roots).has_more).toBe(false);
  expect(readRecent(id, 1, roots, 0, { beforeStep: 0 }).next_cursor).toBeNull();
});
test('new flags validate and reject conflicting selectors', () => {
  expect(parseArgs(['--name', 'Demo', '--role', 'user', '--cursor', '0']).beforeStep).toBe(0);
  expect(parseArgs(['sessions', '--name', 'Demo']).limit).toBe(20);
  for (const args of [[id, '--name', 'Demo'], [id, '--role', 'system'],
    [id, '--cursor', '2', '--before-step', '3'], ['sessions', '--session', id], ['--name', '']])
    expect(() => parseArgs(args)).toThrow();
  expect(() => readRecent(id, 5, roots, 0, { beforeStep: -1 })).toThrow();
});

test('name search uses titles or explicit mappings and refuses ambiguous results', () => {
  // Give each synthetic account its own parent store, matching the real layout.
  roots = [join(temp, 'store-a/brain'), join(temp, 'store-b/brain')];
  for (const root of roots) {
    mkdirSync(root, { recursive: true });
    const db = new Database(join(root, '../conversation_summaries.db'));
    db.exec('CREATE TABLE conversation_summaries (conversation_id TEXT, title TEXT, preview TEXT, last_modified_time TEXT)');
    if (root === roots[0]) {
      const q = db.query('INSERT INTO conversation_summaries VALUES (?, ?, ?, ?)');
      q.run(id, 'Demo Research', 'preview', '2026-09-20T10:00:00Z');
      q.run('22222222-2222-4222-8222-222222222222', 'Demo Notes', '', '2026-09-19T10:00:00Z');
    }
    db.close();
  }
  expect(listSessions('demo', roots, {}).sessions.length).toBe(2);
  expect(() => resolveName('Demo', roots, {})).toThrow('ambiguous');
  expect(resolveName('Demo Research', roots, {}).conversation_id).toBe(id);
  expect(resolveName('Display Name', roots, { 'Display Name': id }).conversation_id).toBe(id);
  expect(() => resolveName('unknown', roots, {})).toThrow('No matching');
  expect(() => resolveName('Demo Research', [roots[0], join(temp, 'missing')], {})).toThrow('unavailable');
});
