# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "antigravity-chat-read" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/antigravity-chat-read/` already exists
   - If YES: Ask the user "Skill 'antigravity-chat-read' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/antigravity-chat-read/`
- CREATE file: `$HOME/.claude/skills/antigravity-chat-read/SKILL.md`
- CREATE file: `$HOME/.claude/skills/antigravity-chat-read/scripts/cli.test.ts`
- CREATE file: `$HOME/.claude/skills/antigravity-chat-read/scripts/cli.ts`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/antigravity-chat-read/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/antigravity-chat-read/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/antigravity-chat-read/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"antigravity-chat-read installed successfully!
- Location: ~/.claude/skills/antigravity-chat-read/
- Trigger: 用 Bun CLI 只读搜索本机 Antigravity 会话名称、列出会话、读取用户和助手正文；支持条数、倒序跳过、角色筛选与稳定游标分页。用户要求读取反重力聊天上下文时使用。
- To uninstall: delete the ~/.claude/skills/antigravity-chat-read/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/antigravity-chat-read/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
