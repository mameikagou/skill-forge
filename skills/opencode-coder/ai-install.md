# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "opencode-coder" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/opencode-coder/` already exists
   - If YES: Ask the user "Skill 'opencode-coder' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/opencode-coder/`
- CREATE file: `$HOME/.claude/skills/opencode-coder/SKILL.md`
- CREATE file: `$HOME/.claude/skills/opencode-coder/references/model-guide.md`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/runner.sh`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/runner.ts`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/cleaner.ts`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/xml-parser.ts`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/install.ts`
- CREATE file: `$HOME/.claude/skills/opencode-coder/scripts/prompt-builder.ts`
- CREATE file: `$HOME/.claude/skills/opencode-coder/opencode-agent/coder.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/cheap-hands/main/skills/opencode-coder/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/opencode-coder/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/opencode-coder/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"opencode-coder installed successfully!
- Location: ~/.claude/skills/opencode-coder/
- Trigger: 通过 OpenCode CLI 的 coder agent 调用 MiniMax-M2.7 或 GPT-5.3-Codex 执行 1-3 个代码文件的批量修改/重写。当修改量超过 10 行或涉及 2-3 个文件联动时自动触发，也可通过 /o
- To uninstall: delete the ~/.claude/skills/opencode-coder/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/opencode-coder/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
