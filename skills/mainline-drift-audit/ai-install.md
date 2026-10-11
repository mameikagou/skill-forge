# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "mainline-drift-audit" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/mainline-drift-audit/` already exists
   - If YES: Ask the user "Skill 'mainline-drift-audit' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/mainline-drift-audit/`
- CREATE file: `$HOME/.claude/skills/mainline-drift-audit/SKILL.md`
- CREATE file: `$HOME/.claude/skills/mainline-drift-audit/agents/openai.yaml`
- CREATE file: `$HOME/.claude/skills/mainline-drift-audit/scripts/scan_repo.py`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mainline-drift-audit/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/mainline-drift-audit/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/mainline-drift-audit/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"mainline-drift-audit installed successfully!
- Location: ~/.claude/skills/mainline-drift-audit/
- Trigger: 审查代码和方案有没有偏离主线、另起一套（新引擎、新 CLI、新数据库、新账户、新结果目录、重复模块、自写净值成交、绕开数据湖、只加不删、产物无限增长）。在批准技术方案前、实现后、清理时、改回测或研究入口前，或用户问"走没走主线""是不是在拉
- To uninstall: delete the ~/.claude/skills/mainline-drift-audit/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/mainline-drift-audit/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
