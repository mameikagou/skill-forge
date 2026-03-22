#!/usr/bin/env node
/**
 * init-skill.ts — npx CLI 入口，安装 opencode-coder skill
 *
 * 复刻 ai-install.md 的安装逻辑，但用 Node.js API 执行：
 *   1. mkdir -p ~/.claude/skills/opencode-coder/
 *   2. 从 npm 包自身复制 SKILL.md、scripts/、references/、opencode-agent/
 *   3. 注册到 ~/.claude/settings.json
 *
 * 为什么从包自身复制而不是 curl：
 *   npx 已经下载了包，文件就在 node_modules 里，直接复制更快更可靠。
 */

import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const HOME = homedir();
const SKILL_NAME = "opencode-coder";
const SKILL_DIR = join(HOME, ".claude", "skills", SKILL_NAME);
const SETTINGS_PATH = join(HOME, ".claude", "settings.json");

// init-skill.ts 编译后在 dist/ 目录，包根目录在上一级
const PKG_ROOT = join(dirname(new URL(import.meta.url).pathname), "..");

const FORCE = process.argv.includes("--force");

function log(msg: string): void {
  console.log(`  ${msg}`);
}

function main(): void {
  console.log(`\nInstalling ${SKILL_NAME} skill...\n`);

  // Step 1: 检查是否已安装
  if (existsSync(SKILL_DIR) && !FORCE) {
    console.log(`Skill already installed at ${SKILL_DIR}`);
    console.log("Use --force to overwrite.");
    process.exit(0);
  }

  // Step 2: 复制技能文件
  mkdirSync(SKILL_DIR, { recursive: true });

  const filesToCopy = ["SKILL.md", "scripts", "references", "opencode-agent"];
  for (const f of filesToCopy) {
    const src = join(PKG_ROOT, f);
    if (!existsSync(src)) continue;
    const dest = join(SKILL_DIR, f);
    cpSync(src, dest, { recursive: true });
    log(`Copied ${f}`);
  }

  // Step 3: 注册 skills 目录到 settings.json
  const skillsBase = join(HOME, ".claude", "skills");
  try {
    if (existsSync(SETTINGS_PATH)) {
      const raw = readFileSync(SETTINGS_PATH, "utf-8");
      const settings = JSON.parse(raw) as Record<string, unknown>;

      if (!Array.isArray(settings.skills)) {
        settings.skills = [];
      }

      const skills = settings.skills as string[];
      const alreadyRegistered = skills.some(
        (p) => p === skillsBase || p === "$HOME/.claude/skills" || p === "~/.claude/skills"
      );

      if (!alreadyRegistered) {
        skills.push(skillsBase);
        writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
        log("Registered skills directory in settings.json");
      }
    }
  } catch (e) {
    log(`Warning: could not update settings.json: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 4: 报告
  console.log(`\n${SKILL_NAME} installed successfully!`);
  console.log(`  Location: ${SKILL_DIR}`);
  console.log(`  To uninstall: rm -rf ${SKILL_DIR}\n`);
}

main();
