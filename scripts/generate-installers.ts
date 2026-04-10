#!/usr/bin/env bun
/**
 * generate-installers.ts — 自动为每个 skill 生成 ai-install.md（和 install.sh）
 *
 * 核心思路（大白话）：
 *   就像快递打包流水线——扫描 skills/* 每个 skill 目录，
 *   根据目录复杂度（SIMPLE/MEDIUM/COMPLEX）选择不同打包策略，
 *   生成标准化的 ai-install.md，让任何 AI agent 读了就能帮用户安装。
 *
 * 与 skill-auto-installer/SKILL.md 定义的规范完全对齐：
 *   - SIMPLE（仅 SKILL.md）→ 内嵌全文
 *   - MEDIUM（SKILL.md + references/）→ 内嵌 SKILL.md + curl references
 *   - COMPLEX（有 scripts/）→ 生成 install.sh + ai-install.md 调用 install.sh
 *
 * 用法：
 *   bun scripts/generate-installers.ts          # 生成/覆盖 ai-install.md
 *   bun scripts/generate-installers.ts --check  # 检查是否同步（CI 用）
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseSkillManifest } from "../packages/shared/src/yaml-frontmatter";

// ============================================================================
// 常量
// ============================================================================

const REPO_OWNER = "mameikagou";
const REPO_NAME = "skill-forge";
const REPO_BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;

const ROOT_DIR = join(import.meta.dirname!, "..");
const SKILLS_DIR = join(ROOT_DIR, "skills");

const CHECK_MODE = process.argv.includes("--check");

// ============================================================================
// 复杂度分级
// ============================================================================

type Complexity = "SIMPLE" | "MEDIUM" | "COMPLEX";

interface SkillInfo {
  /** skill 目录名（如 "opencode-coder"） */
  dirName: string;
  /** skill 目录绝对路径 */
  dirPath: string;
  /** SKILL.md 原始内容 */
  skillMdContent: string;
  /** 解析后的 manifest */
  name: string;
  description: string;
  version: string;
  /** 复杂度分级 */
  complexity: Complexity;
  /** 需要安装的文件列表（相对于 skill 目录） */
  files: string[];
}

/** 递归收集目录下所有文件（相对路径），排除 node_modules、.git、ai-install.md、install.sh */
function collectFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  const SKIP = new Set(["node_modules", ".git", "__tests__", "dist", "src"]);
  const SKIP_FILES = new Set(["ai-install.md", "install.sh", "package.json", "bun.lock", "README.md", "README.zh-CN.md"]);

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      results.push(...collectFiles(join(dir, entry.name), relPath));
    } else {
      if (SKIP_FILES.has(entry.name)) continue;
      results.push(relPath);
    }
  }
  return results;
}

/** 判定 skill 复杂度 */
function classifyComplexity(dirPath: string): Complexity {
  const hasScripts = existsSync(join(dirPath, "scripts"));
  const hasRefs = existsSync(join(dirPath, "references"));
  const hasOtherDirs = readdirSync(dirPath, { withFileTypes: true }).some(
    (e) => e.isDirectory() && !["node_modules", ".git", "__tests__", "dist", "src", "scripts", "references"].includes(e.name)
  );

  if (hasScripts || hasOtherDirs) return "COMPLEX";
  if (hasRefs) return "MEDIUM";
  return "SIMPLE";
}

// ============================================================================
// ai-install.md 模板生成
// ============================================================================

function generateAiInstallMd(skill: SkillInfo): string {
  const { name, description, complexity, files, dirName } = skill;
  const skillRawBase = `${RAW_BASE}/skills/${dirName}`;

  // 安全声明：列出每一个将被创建的文件
  const securityLines = files.map((f) => `- CREATE file: \`$HOME/.claude/skills/${name}/${f}\``).join("\n");

  // 安装步骤
  let installSteps: string;

  if (complexity === "SIMPLE") {
    // SIMPLE：直接内嵌 SKILL.md
    installSteps = generateSimpleSteps(skill);
  } else if (complexity === "MEDIUM") {
    // MEDIUM：内嵌 SKILL.md + curl references
    installSteps = generateMediumSteps(skill, skillRawBase);
  } else {
    // COMPLEX：调用 install.sh
    installSteps = generateComplexSteps(skill, skillRawBase);
  }

  return `# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "${name}" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if \`$HOME/.claude/skills/${name}/\` already exists
   - If YES: Ask the user "Skill '${name}' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: \`$HOME/.claude/skills/${name}/\`
${securityLines}
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

${installSteps}

### Ensure skills directory is registered

Read \`$HOME/.claude/settings.json\`. Check if the \`"skills"\` array contains
a path that covers \`$HOME/.claude/skills/\`. If not, add \`"$HOME/.claude/skills"\`
to the array.

### Verify installation

Read \`$HOME/.claude/skills/${name}/SKILL.md\` and confirm:
- YAML frontmatter has valid \`name\` and \`description\` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"${name} installed successfully!
- Location: ~/.claude/skills/${name}/
- Trigger: ${description.slice(0, 120)}
- To uninstall: delete the ~/.claude/skills/${name}/ directory"

## Rollback

If ANY step fails:
1. Delete the \`$HOME/.claude/skills/${name}/\` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
`;
}

/** SIMPLE：内嵌全部 SKILL.md */
function generateSimpleSteps(skill: SkillInfo): string {
  return `### Step 1: Create skill directory

Run: \`mkdir -p $HOME/.claude/skills/${skill.name}\`

### Step 2: Write SKILL.md

Write the following content to \`$HOME/.claude/skills/${skill.name}/SKILL.md\`:

\`\`\`
${skill.skillMdContent}
\`\`\`
`;
}

/** MEDIUM：内嵌 SKILL.md + curl 下载 references */
function generateMediumSteps(skill: SkillInfo, rawBase: string): string {
  const refFiles = skill.files.filter((f) => f.startsWith("references/"));

  let curlSteps = refFiles
    .map(
      (f, i) =>
        `Run: \`curl -fsSL "${rawBase}/${f}" --create-dirs -o "$HOME/.claude/skills/${skill.name}/${f}"\``
    )
    .join("\n\n");

  return `### Step 1: Create skill directory

Run: \`mkdir -p $HOME/.claude/skills/${skill.name}\`

### Step 2: Write SKILL.md

Write the following content to \`$HOME/.claude/skills/${skill.name}/SKILL.md\`:

\`\`\`
${skill.skillMdContent}
\`\`\`

### Step 3: Download reference files

${curlSteps}
`;
}

/** COMPLEX：生成 install.sh 并在 ai-install.md 中调用 */
function generateComplexSteps(skill: SkillInfo, rawBase: string): string {
  return `### Step 1: Run install script

Run the following command to download and execute the installer:

\`\`\`bash
curl -fsSL "${rawBase}/install.sh" | bash
\`\`\`

This script will:
- Create \`$HOME/.claude/skills/${skill.name}/\` directory
- Download all skill files from GitHub
- Verify the installation
`;
}

/** 为 COMPLEX 技能生成 install.sh */
function generateInstallSh(skill: SkillInfo): string {
  const { name, files, dirName } = skill;
  const rawBase = `${RAW_BASE}/skills/${dirName}`;

  // 收集所有需要创建的子目录
  const dirs = new Set<string>();
  for (const f of files) {
    const parts = f.split("/");
    if (parts.length > 1) {
      dirs.add(parts.slice(0, -1).join("/"));
    }
  }

  const mkdirLines = Array.from(dirs)
    .map((d) => `mkdir -p "$SKILL_DIR/${d}"`)
    .join("\n");

  const curlLines = files
    .map((f) => `curl -fsSL "$REPO_BASE/${f}" -o "$SKILL_DIR/${f}"`)
    .join("\n");

  return `#!/usr/bin/env bash
set -euo pipefail

# Auto-generated by generate-installers.ts — do not edit manually
# Installs the "${name}" skill to ~/.claude/skills/${name}/

SKILL_DIR="$HOME/.claude/skills/${name}"
REPO_BASE="${rawBase}"

echo "Installing ${name}..."

# Create directory structure
mkdir -p "$SKILL_DIR"
${mkdirLines}

# Download files
${curlLines}

# Verify
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "ERROR: Installation failed - SKILL.md not found"
  rm -rf "$SKILL_DIR"
  exit 1
fi

echo ""
echo "${name} installed successfully!"
echo "  Location: $SKILL_DIR"
echo "  To uninstall: rm -rf $SKILL_DIR"
`;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let outOfSync = false;

  for (const dirName of skillDirs) {
    const dirPath = join(SKILLS_DIR, dirName);
    const skillMdPath = join(dirPath, "SKILL.md");

    if (!existsSync(skillMdPath)) {
      console.warn(`[SKIP] ${dirName}: no SKILL.md found`);
      continue;
    }

    const skillMdContent = readFileSync(skillMdPath, "utf-8");
    const manifest = parseSkillManifest(skillMdContent);

    if (!manifest) {
      console.warn(`[SKIP] ${dirName}: failed to parse SKILL.md frontmatter`);
      continue;
    }

    const complexity = classifyComplexity(dirPath);
    const files = collectFiles(dirPath);

    const skillInfo: SkillInfo = {
      dirName,
      dirPath,
      skillMdContent,
      name: manifest.name,
      description: manifest.description,
      version: manifest.metadata.version,
      complexity,
      files,
    };

    console.log(`[${complexity}] ${manifest.name} (${dirName}) — ${files.length} files`);

    // 生成 ai-install.md
    const aiInstallContent = generateAiInstallMd(skillInfo);
    const aiInstallPath = join(dirPath, "ai-install.md");

    // COMPLEX 技能额外生成 install.sh
    const installShContent = complexity === "COMPLEX" ? generateInstallSh(skillInfo) : null;
    const installShPath = join(dirPath, "install.sh");

    if (CHECK_MODE) {
      // --check 模式：只比对，不写
      const existingAiInstall = existsSync(aiInstallPath)
        ? readFileSync(aiInstallPath, "utf-8")
        : "";

      if (existingAiInstall !== aiInstallContent) {
        console.error(`  [OUT OF SYNC] ${dirName}/ai-install.md`);
        outOfSync = true;
      } else {
        console.log(`  [OK] ai-install.md is up to date`);
      }

      if (installShContent) {
        const existingInstallSh = existsSync(installShPath)
          ? readFileSync(installShPath, "utf-8")
          : "";
        if (existingInstallSh !== installShContent) {
          console.error(`  [OUT OF SYNC] ${dirName}/install.sh`);
          outOfSync = true;
        } else {
          console.log(`  [OK] install.sh is up to date`);
        }
      }
    } else {
      // 写入模式
      writeFileSync(aiInstallPath, aiInstallContent);
      console.log(`  -> ${relative(ROOT_DIR, aiInstallPath)}`);

      if (installShContent) {
        writeFileSync(installShPath, installShContent, { mode: 0o755 });
        console.log(`  -> ${relative(ROOT_DIR, installShPath)}`);
      }
    }
  }

  if (CHECK_MODE && outOfSync) {
    console.error("\nai-install.md files are out of sync! Run: bun run generate");
    process.exit(1);
  }

  if (!CHECK_MODE) {
    console.log("\nDone! All ai-install.md files generated.");
  }
}

main();
