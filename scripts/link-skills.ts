#!/usr/bin/env bun
/**
 * link-skills.ts — 把各 harness 的技能安装目录指回本仓库（单一来源）
 *
 * 核心思路（大白话）：
 *   安装目录不再是"抄一份副本"，而是"钉一张指向仓库的书签"——
 *   仓库改了，所有 harness 下次加载就是新内容，不再出现 codex/claude 各漂一份。
 *
 * 为什么是"真实目录 + 文件级软链"而不是整个目录软链：
 *   目录级软链依赖扫描器 follow symlink（各 harness 行为不一，容易整目录消失）；
 *   文件级软链只要 harness 用普通 readFile 就能穿透，兼容性最高。
 *
 * 用法：
 *   bun scripts/link-skills.ts          # 建立/刷新软链
 *   bun scripts/link-skills.ts --copy   # 降级：改为复制文件（给不认软链的 harness）
 */

import { readdirSync, mkdirSync, rmSync, lstatSync, symlinkSync, copyFileSync, existsSync, readlinkSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const ROOT = join(import.meta.dirname!, "..");
const SKILLS_DIR = join(ROOT, "skills");
const COPY_MODE = process.argv.includes("--copy");

/** 要接入的 harness 全局技能目录 */
const HARNESS_DIRS = [
  join(homedir(), ".codex/skills"), //   Codex
  join(homedir(), ".claude/skills"), //  Claude Code
  join(homedir(), ".agents/skills"), //  Pi（Agent Skills 标准共享目录）
  join(homedir(), ".gemini/config/skills"), // Antigravity CLI
];

/** 强制安装到所有 harness 的技能 */
const ALWAYS_INSTALL = ["mining-factors"];

/** 安装产物与包文件，不镜像进 harness */
const EXCLUDE = new Set(["ai-install.md", "install.sh", "package.json"]);

function listSourceFiles(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listSourceFiles(join(dir, e.name), rel));
    else if (EXCLUDE.has(e.name)) continue;
    else out.push(rel);
  }
  return out;
}

function placeFile(srcFile: string, dstFile: string): "created" | "updated" | "unchanged" {
  mkdirSync(dirname(dstFile), { recursive: true });
  if (existsSync(dstFile) || isLink(dstFile)) {
    const st = lstatSyncSafe(dstFile);
    if (st?.isSymbolicLink() && readlinkTarget(dstFile) === srcFile) return "unchanged";
    rmSync(dstFile, { force: true });
  }
  if (COPY_MODE) copyFileSync(srcFile, dstFile);
  else symlinkSync(srcFile, dstFile);
  return existsSync(dstFile) ? (lstatSyncSafe(dstFile)?.isSymbolicLink() ? "created" : "updated") : "created";
}

function isLink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function lstatSyncSafe(p: string) {
  try {
    return lstatSync(p);
  } catch {
    return null;
  }
}

function readlinkTarget(p: string): string | null {
  try {
    return readlinkSync(p);
  } catch {
    return null;
  }
}

/** 把一个源文件同步到目标位置（目标目录不是软链，是真实目录+软链文件） */
function ensureMirror(dstDir: string, rel: string, srcFile: string, stats: { changed: number; same: number }) {
  const dstFile = join(dstDir, rel);
  const result = placeFile(srcFile, dstFile);
  if (result === "unchanged") stats.same++;
  else stats.changed++;
}

/** 删除安装目录里的多余文件（安装器残留的旧副本、已删文件的僵尸链接），再清理空目录 */
function pruneExtra(dstDir: string, wanted: Set<string>, stats: { removed: number }) {
  if (!existsSync(dstDir)) return;
  const walk = (dir: string, prefix = "") => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full, rel);
      else if (!wanted.has(rel)) {
        rmSync(full, { force: true });
        stats.removed++;
      }
    }
  };
  walk(dstDir);
  const pruneEmpty = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) pruneEmpty(join(dir, e.name));
    }
    if (dir !== dstDir && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
  };
  pruneEmpty(dstDir);
}

let totalChanged = 0;
const skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(SKILLS_DIR, e.name, "SKILL.md")))
  .map((e) => e.name);

for (const harnessDir of HARNESS_DIRS) {
  if (!existsSync(harnessDir) && !ALWAYS_INSTALL.length) continue;
  for (const name of skillNames) {
    const srcSkill = join(SKILLS_DIR, name);
    const dstSkill = join(harnessDir, name);
    const force = ALWAYS_INSTALL.includes(name);
    const alreadyThere = existsSync(dstSkill);
    if (!force && !alreadyThere) continue; // 只转换该环境已装的 forge 技能

    // 若整个目录此前是指向仓库的目录级软链，先拆掉换成真实目录
    if (isLink(dstSkill)) rmSync(dstSkill, { force: true });
    mkdirSync(dstSkill, { recursive: true });

    const files = listSourceFiles(srcSkill);
    const stats = { changed: 0, same: 0, removed: 0 };
    for (const rel of files) {
      ensureMirror(dstSkill, rel, join(srcSkill, rel), stats);
    }
    pruneExtra(dstSkill, new Set(files), stats);
    if (stats.changed || stats.removed) {
      console.log(`${homedirRelative(dstSkill)}: ${stats.changed} linked, ${stats.removed} pruned (${stats.same} ok)`);
      totalChanged += stats.changed + stats.removed;
    } else {
      console.log(`${homedirRelative(dstSkill)}: up to date`);
    }
  }
}

/**
 * Codex 全局提示词：仓库 agents/codex-AGENTS.md 是唯一来源。
 * - Windows CODEX_HOME（Codex App）：AGENTS.md 软链到它。
 * - WSL ~/.codex：Multica 给每个任务新建 codex-home，只复制 config.toml、不复制 AGENTS.md，
 *   所以把内容写进 config.toml 顶部的 developer_instructions，不再放 AGENTS.md，免得直接开 Codex 时读两遍。
 */
const CODEX_AGENTS_SRC = join(ROOT, "agents/codex-AGENTS.md");
const WINDOWS_CODEX_HOME = "/mnt/c/Users/admin/.codex";
const WSL_CODEX_CONFIG = join(homedir(), ".codex/config.toml");
const BLOCK_BEGIN = "# BEGIN skill-forge developer_instructions (generated from agents/codex-AGENTS.md)";
const BLOCK_END = "# END skill-forge developer_instructions";

if (existsSync(WINDOWS_CODEX_HOME)) {
  const dst = join(WINDOWS_CODEX_HOME, "AGENTS.md");
  const result = placeFile(CODEX_AGENTS_SRC, dst);
  console.log(`${dst}: ${result === "unchanged" ? "up to date" : "linked"}`);
  if (result !== "unchanged") totalChanged++;
}

if (existsSync(WSL_CODEX_CONFIG)) {
  const instructions = readFileSync(CODEX_AGENTS_SRC, "utf8");
  if (instructions.includes("'''")) throw new Error("codex-AGENTS.md 里不能出现 ''' ，TOML 字面量字符串放不下");
  const block = `${BLOCK_BEGIN}\ndeveloper_instructions = '''\n${instructions}'''\n${BLOCK_END}\n\n`;
  const current = readFileSync(WSL_CODEX_CONFIG, "utf8");
  const start = current.indexOf(BLOCK_BEGIN);
  const rest = start === -1 ? current : current.slice(current.indexOf(BLOCK_END) + BLOCK_END.length).replace(/^\n+/, "");
  const next = block + rest;
  if (next !== current) {
    writeFileSync(WSL_CODEX_CONFIG, next);
    totalChanged++;
    console.log(`~/.codex/config.toml: developer_instructions updated`);
  } else {
    console.log(`~/.codex/config.toml: up to date`);
  }
  const wslAgents = join(homedir(), ".codex/AGENTS.md");
  if (isLink(wslAgents) && readlinkTarget(wslAgents) === CODEX_AGENTS_SRC) rmSync(wslAgents);
}

function homedirRelative(p: string): string {
  return p.replace(homedir() + "/", "~/");
}

console.log(totalChanged === 0 ? "\n所有 harness 已与仓库一致。" : `\n完成（${COPY_MODE ? "复制" : "软链"}模式）。仓库即唯一来源。`);
