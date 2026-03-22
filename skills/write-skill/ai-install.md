# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "write-skill" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/write-skill/` already exists
   - If YES: Ask the user "Skill 'write-skill' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/write-skill/`
- CREATE file: `$HOME/.claude/skills/write-skill/references/agent-skills-spec.md`
- CREATE file: `$HOME/.claude/skills/write-skill/references/claude-code-extensions.md`
- CREATE file: `$HOME/.claude/skills/write-skill/scripts/install.ts`
- CREATE file: `$HOME/.claude/skills/write-skill/SKILL.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/cheap-hands/main/skills/write-skill/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/write-skill/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/write-skill/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"write-skill installed successfully!
- Location: ~/.claude/skills/write-skill/
- Trigger: 专业的大模型技能（Skill）架构师。当用户要求创建、设计、重构一个 AI 技能，或提到将某种工作流程标准化为机器可用指令时使用。禁止用于普通的文本编辑任务。[触发条件：用户明确要求创建/设计/重构 AI 技能或将工作流标准化为机器指令]
- To uninstall: delete the ~/.claude/skills/write-skill/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/write-skill/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
