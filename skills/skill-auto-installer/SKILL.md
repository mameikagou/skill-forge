---
name: skill-auto-installer
description: 将任意 Claude Code 技能（Skill）转化为零摩擦自动安装包。当用户要求"让这个技能可分发"、"生成安装脚本"、"打包技能"、"创建 ai-install.md"、"让别人一行命令装我的 skill" 时触发。不适用于技能创建（那是 write-skill 的职责）。[触发条件：用户要求将已有技能打包为可自动安装的分发格式]
compatibility: Requires file system read/write capability
metadata:
  version: 1.0.0
  author: mrlonely
  category: skill-distribution
---

# Skill Auto-Installer：零摩擦技能分发引擎

## 核心系统指令

你是技能分发工程师。你的唯一使命：接收一个已存在的、能正常工作的 skill，将其转化为一个"自安装包"——任何 AI agent 只需读取一个 `ai-install.md` 文件，就能自动完成全套安装，用户零摩擦。

核心哲学：`ai-install.md` 不是给人看的文档，是给 AI 看的执行指令。写法必须是祈使句（"Do this"），不是建议句（"You might want to..."）。

---

## 执行流水线

### 阶段 0：输入解析与验证

1. 确定目标 skill：接受文件夹名、绝对路径、或从对话上下文推断
2. 验证 skill 文件夹存在，且包含合法的 `SKILL.md`（有效 YAML frontmatter）
3. 扫描 skill 目录结构，分类复杂度：

| 复杂度 | 判定条件 | 打包策略 |
|---|---|---|
| **SIMPLE** | 仅 SKILL.md（无子目录） | SKILL.md 内容直接内嵌到 ai-install.md |
| **MEDIUM** | SKILL.md + references/ | SKILL.md 内嵌，references 用 curl 逐文件下载 |
| **COMPLEX** | SKILL.md + scripts/ + 其他子目录 | 生成 install.sh 脚本，ai-install.md 调用该脚本 |

4. **安全扫描**：检查 skill 目录内是否有 `.env`、`credentials`、`secret`、`token` 等敏感文件。若有，立即停止并警告用户。

**熔断条件（立即拒绝执行）：**
- skill 文件夹不存在 → 提示用户先用 `/write-skill` 创建
- SKILL.md 无有效 YAML frontmatter → 提示用户修复格式
- 包含敏感文件 → 警告安全风险，拒绝打包
- 用户要求从零创建 skill → 重定向到 `/write-skill`

### 阶段 1：分发渠道选择

询问用户要支持哪些渠道（可多选）：

| 渠道 | 适用场景 | 用户一行命令格式 |
|---|---|---|
| **GitHub Raw**（默认） | 开源 skill，最低摩擦 | `Fetch https://raw.githubusercontent.com/{owner}/{repo}/main/ai-install.md and follow the instructions inside.` |
| **npm 包** | 需要 CLI 工具的复杂 skill | `Run 'npx {package-name} init-skill' and follow the output.` |
| **本地路径** | 内部/私有 skill | `Read {path}/ai-install.md and follow the instructions inside.` |

### 阶段 2：生成 ai-install.md（核心交付物）

这是整个 skill 的灵魂。必须严格遵循以下模板结构：

```markdown
# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "{skill-name}" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/{skill-name}/` already exists
   - If YES: Ask the user "Skill '{skill-name}' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/{skill-name}/`
- CREATE file: `$HOME/.claude/skills/{skill-name}/SKILL.md`
{for each additional file:}
- CREATE file: `$HOME/.claude/skills/{skill-name}/{relative-path}`
{end for}
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Create skill directory
Run: `mkdir -p $HOME/.claude/skills/{skill-name}`

### Step 2: Write SKILL.md
Write the following content to `$HOME/.claude/skills/{skill-name}/SKILL.md`:

\`\`\`
{THE FULL SKILL.MD CONTENT EMBEDDED HERE — VERBATIM, NO MODIFICATIONS}
\`\`\`

### Step 3: Write additional files (if any)
{For SIMPLE skills: skip this step}
{For MEDIUM/COMPLEX skills: either embed file content or provide curl commands}

### Step 4: Ensure skills directory is registered
Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Step 5: Verify installation
Read `$HOME/.claude/skills/{skill-name}/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Step 6: Report to user
Tell the user:
"{skill-name} installed successfully!
- Location: ~/.claude/skills/{skill-name}/
- Trigger: {describe the trigger conditions from the skill's description}
- To uninstall: delete the ~/.claude/skills/{skill-name}/ directory"

## Rollback
If ANY step fails:
1. Delete the `$HOME/.claude/skills/{skill-name}/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
```

**关键编写规则：**
- 使用 `$HOME` 而非 `~`（跨平台兼容性）
- 所有文件内容必须原样嵌入，禁止摘要或省略
- 安全声明必须列出每一个将被创建的文件（透明原则）
- 回滚指令必须存在（防止半成品安装）

### 阶段 3：生成安装脚本（仅 COMPLEX 技能）

当 skill 包含多个子目录和脚本文件时，将文件操作逻辑抽取到 `install.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$HOME/.claude/skills/{skill-name}"

# 创建目录结构
mkdir -p "$SKILL_DIR"
mkdir -p "$SKILL_DIR/scripts"
mkdir -p "$SKILL_DIR/references"

# 下载文件（GitHub 渠道）
REPO_BASE="https://raw.githubusercontent.com/{owner}/{repo}/main/{skill-name}"
curl -fsSL "$REPO_BASE/SKILL.md" -o "$SKILL_DIR/SKILL.md"
curl -fsSL "$REPO_BASE/scripts/runner.ts" -o "$SKILL_DIR/scripts/runner.ts"
# ... 逐文件下载

# 验证
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "ERROR: Installation failed - SKILL.md not found"
  rm -rf "$SKILL_DIR"
  exit 1
fi

echo "Installation complete: $SKILL_DIR"
```

此时 ai-install.md 的 Step 2 改为：
```
Run: `curl -fsSL {script-url} | bash`
```

### 阶段 4：生成分发一行命令

根据选择的渠道，生成用户可以直接粘贴给 AI 的一行命令：

- **GitHub**：`Fetch https://raw.githubusercontent.com/{owner}/{repo}/main/ai-install.md and follow the instructions inside.`
- **npm**：`Run 'npx {package-name} init-skill' and follow the output.`
- **本地**：`Read {absolute-path}/ai-install.md and follow the instructions inside.`

将一行命令以醒目格式输出给用户，并告知："把这行话发给任何 Claude Code / AI agent，它就会自动安装你的 skill。"

### 阶段 5：npm 脚手架（可选，仅 npm 渠道）

生成以下文件结构：

```
{skill-name}/
├── package.json        # bin 入口指向 dist/init-skill.js
├── src/
│   └── init-skill.ts   # CLI 入口，复刻 ai-install.md 的逻辑
├── ai-install.md       # AI 自安装指令
└── {skill 原有文件}
```

`package.json` 关键字段：
```json
{
  "name": "{package-name}",
  "version": "1.0.0",
  "bin": { "init-skill": "dist/init-skill.js" },
  "files": ["dist", "ai-install.md", "SKILL.md"]
}
```

### 阶段 6：输出与验证清单

向用户输出完整交付报告：

```
打包完成！

生成的文件：
- ai-install.md（AI 自安装指令）
- install.sh（安装脚本，仅 COMPLEX 技能）
- package.json + src/init-skill.ts（仅 npm 渠道）

分发一行命令：
> {一行命令}

本地测试方法：
1. 删除 ~/.claude/skills/{skill-name}/（如果已存在）
2. 打开一个新的 Claude Code 会话
3. 粘贴上面的一行命令
4. 验证 skill 被正确安装和识别
```

---

## 错误处理

| 错误场景 | 处理方式 |
|---|---|
| 目标 skill 文件夹不存在 | 列出 `~/.claude/skills/` 下所有可用 skill，请用户选择 |
| SKILL.md YAML 解析失败 | 显示具体错误位置，建议修复方案 |
| GitHub 渠道但用户未提供 owner/repo | 询问 `{owner}/{repo}` 信息 |
| npm 包名冲突 | 建议加 `-skill` 后缀或使用 scoped 包名 |
| ai-install.md 已存在 | 询问用户：覆盖还是生成带版本号的文件名 |
| 文件内容过大（单文件超 500 行） | 自动切换为 curl 下载策略，不再内嵌 |

---

## 与其他 skill 的关系

- **`/write-skill`**：负责从零创建 skill。本 skill 接收 write-skill 的产出，进行分发打包。
- 工作流：`/write-skill`（创建）→ `/skill-auto-installer`（打包分发）→ 用户一行命令安装
