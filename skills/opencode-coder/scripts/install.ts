#!/usr/bin/env bun
/**
 * install.ts — opencode-coder 自动安装脚本
 *
 * 做两件事：
 *   1. 将 opencode-agent/coder.md 复制到 ~/.config/opencode/agents/coder.md
 *   2. 在 ~/.config/opencode/opencode.json 中注册 coder agent（如果尚未注册）
 *
 * 用法：
 *   bun install.ts
 *
 * 安全设计：
 *   - 不会覆盖已有的 coder.md（除非加 --force）
 *   - 不会破坏 opencode.json 中的其他配置
 *   - 所有操作前打印将要做什么，操作后打印结果
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

// ============================================================================
// 路径常量
// ============================================================================

const HOME = homedir();
const OPENCODE_AGENTS_DIR = join(HOME, ".config", "opencode", "agents");
const OPENCODE_CONFIG_PATH = join(HOME, ".config", "opencode", "opencode.json");

// install.ts 在 scripts/ 目录下，coder.md 在 ../opencode-agent/ 目录下
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const SOURCE_CODER_MD = join(SCRIPT_DIR, "..", "opencode-agent", "coder.md");

const TARGET_CODER_MD = join(OPENCODE_AGENTS_DIR, "coder.md");

const FORCE = process.argv.includes("--force");

// ============================================================================
// 辅助函数
// ============================================================================

function log(msg: string): void {
  console.log(`  ${msg}`);
}

function success(msg: string): void {
  console.log(`  [OK] ${msg}`);
}

function warn(msg: string): void {
  console.log(`  [SKIP] ${msg}`);
}

function error(msg: string): never {
  console.error(`  [ERROR] ${msg}`);
  process.exit(1);
}

// ============================================================================
// Step 1: 复制 coder.md
// ============================================================================

function installCoderAgent(): void {
  console.log("\n--- Step 1: Install coder agent definition ---\n");

  if (!existsSync(SOURCE_CODER_MD)) {
    error(`Source file not found: ${SOURCE_CODER_MD}`);
  }

  if (existsSync(TARGET_CODER_MD) && !FORCE) {
    warn(`${TARGET_CODER_MD} already exists. Use --force to overwrite.`);
    return;
  }

  // 确保目标目录存在
  mkdirSync(OPENCODE_AGENTS_DIR, { recursive: true });

  copyFileSync(SOURCE_CODER_MD, TARGET_CODER_MD);
  success(`Copied coder.md → ${TARGET_CODER_MD}`);
}

// ============================================================================
// Step 2: 注册到 opencode.json
// ============================================================================

function registerCoderAgent(): void {
  console.log("\n--- Step 2: Register coder agent in opencode.json ---\n");

  if (!existsSync(OPENCODE_CONFIG_PATH)) {
    warn(`OpenCode config not found at ${OPENCODE_CONFIG_PATH}. Skipping registration.`);
    log("You may need to run 'opencode' once to generate the config, then re-run this installer.");
    return;
  }

  let config: Record<string, unknown>;
  try {
    const raw = readFileSync(OPENCODE_CONFIG_PATH, "utf-8");
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    error(`Failed to parse ${OPENCODE_CONFIG_PATH}: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 确保 agent 字段存在
  if (!config.agent || typeof config.agent !== "object") {
    config.agent = {};
  }

  const agents = config.agent as Record<string, unknown>;

  if (agents.coder && !FORCE) {
    warn(`"coder" agent already registered in opencode.json. Use --force to overwrite.`);
    return;
  }

  agents.coder = {
    description: "Code-only output agent — called by opencode-coder runner.ts",
  };

  try {
    writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
    success(`Registered "coder" agent in ${OPENCODE_CONFIG_PATH}`);
  } catch (e) {
    error(`Failed to write ${OPENCODE_CONFIG_PATH}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ============================================================================
// Main
// ============================================================================

console.log("opencode-coder installer");
console.log("========================");

installCoderAgent();
registerCoderAgent();

console.log("\n--- Done! ---\n");
log("The 'coder' agent is now available in OpenCode.");
log("You can verify with: opencode agent list");
log("opencode-coder skill will work automatically in Claude Code.\n");
