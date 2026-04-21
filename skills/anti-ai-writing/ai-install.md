# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "anti-ai-writing" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/anti-ai-writing/` already exists
   - If YES: Ask the user "Skill 'anti-ai-writing' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/anti-ai-writing/`
- DOWNLOAD from GitHub: `$HOME/.claude/skills/anti-ai-writing/SKILL.md`
- DOWNLOAD from GitHub: `$HOME/.claude/skills/anti-ai-writing/SKILL-EN.md`
- MODIFY: `$HOME/.claude/settings.json` (only if needed to register skills directory)

## Installation Steps

### Step 1: Create skill directory

Run: `mkdir -p $HOME/.claude/skills/anti-ai-writing`

### Step 2: Download Chinese skill file (SKILL.md)

Run:
```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/anti-ai-writing/SKILL.md" -o "$HOME/.claude/skills/anti-ai-writing/SKILL.md"
```

If this fails, abort installation.

### Step 3: Download English skill file (SKILL-EN.md)

Run:
```bash
curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/anti-ai-writing/SKILL-EN.md" -o "$HOME/.claude/skills/anti-ai-writing/SKILL-EN.md"
```

If this fails, abort installation.

### Step 4: Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Step 5: Verify installation

Read both installed files and confirm:
- `$HOME/.claude/skills/anti-ai-writing/SKILL.md` has valid YAML frontmatter with `name` and `description`
- `$HOME/.claude/skills/anti-ai-writing/SKILL-EN.md` has valid YAML frontmatter with `name` and `description`
- Neither file is empty or corrupted

If verification fails, run rollback.

### Step 6: Report to user

Tell the user:
"anti-ai-writing installed successfully!
- Location: ~/.claude/skills/anti-ai-writing/
- Chinese (SKILL.md): 知网/万方/维普/PaperPass
- English (SKILL-EN.md): Turnitin/GPTZero/Copyleaks/Originality.ai/Grammarly
- Trigger: 当用户要求降 AI 率、去 AI 味、降低查重率、改写论文时触发
- To uninstall: delete the ~/.claude/skills/anti-ai-writing/ directory"

## Rollback

If ANY step fails:
1. Run: `rm -rf $HOME/.claude/skills/anti-ai-writing/`
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
