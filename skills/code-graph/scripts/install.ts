#!/usr/bin/env bun
/**
 * install.ts — code-graph 本地安装脚本
 *
 * 将 SKILL.md 复制到 ~/.claude/skills/code-graph/
 */

import { existsSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const SKILL_NAME = "code-graph";
const HOME = homedir();
const SKILL_DIR = join(HOME, ".claude", "skills", SKILL_NAME);
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const PKG_ROOT = join(SCRIPT_DIR, "..");

const FORCE = process.argv.includes("--force");

if (existsSync(SKILL_DIR) && !FORCE) {
  console.log(`${SKILL_NAME} already installed at ${SKILL_DIR}. Use --force to overwrite.`);
  process.exit(0);
}

mkdirSync(SKILL_DIR, { recursive: true });

for (const f of ["SKILL.md"]) {
  const src = join(PKG_ROOT, f);
  if (!existsSync(src)) continue;
  cpSync(src, join(SKILL_DIR, f), { recursive: true });
  console.log(`  Copied ${f}`);
}

console.log(`\n${SKILL_NAME} installed to ${SKILL_DIR}`);
