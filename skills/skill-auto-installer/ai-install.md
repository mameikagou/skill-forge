# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "skill-auto-installer" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/skill-auto-installer/` already exists
   - If YES: Ask the user "Skill 'skill-auto-installer' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/skill-auto-installer/`
- CREATE file: `$HOME/.claude/skills/skill-auto-installer/scripts/install.ts`
- CREATE file: `$HOME/.claude/skills/skill-auto-installer/SKILL.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/skill-auto-installer/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/skill-auto-installer/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/skill-auto-installer/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"skill-auto-installer installed successfully!
- Location: ~/.claude/skills/skill-auto-installer/
- Trigger: 将任意 Claude Code 技能（Skill）转化为零摩擦自动安装包。当用户要求"让这个技能可分发"、"生成安装脚本"、"打包技能"、"创建 ai-install.md"、"让别人一行命令装我的 skill" 时触发。不适用于技能创建（
- To uninstall: delete the ~/.claude/skills/skill-auto-installer/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/skill-auto-installer/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
