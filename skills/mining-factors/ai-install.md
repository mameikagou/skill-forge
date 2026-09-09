# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "mining-factors" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/mining-factors/` already exists
   - If YES: Ask the user "Skill 'mining-factors' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/mining-factors/`
- CREATE file: `$HOME/.claude/skills/mining-factors/SKILL.md`
- CREATE file: `$HOME/.claude/skills/mining-factors/agents/openai.yaml`
- CREATE file: `$HOME/.claude/skills/mining-factors/references/binance-us-equity-execution.md`
- CREATE file: `$HOME/.claude/skills/mining-factors/references/book-chapter-summaries.md`
- CREATE file: `$HOME/.claude/skills/mining-factors/references/research-lessons.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Run install script

Run the following command to download and execute the installer:

```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mining-factors/install.sh" | bash
```

This script will:
- Create `$HOME/.claude/skills/mining-factors/` directory
- Download all skill files from GitHub
- Verify the installation


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/mining-factors/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"mining-factors installed successfully!
- Location: ~/.claude/skills/mining-factors/
- Trigger: Use when mining, discovering, iterating, batch-testing, comparing, combining, transferring, or implementing quantitative
- To uninstall: delete the ~/.claude/skills/mining-factors/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/mining-factors/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
