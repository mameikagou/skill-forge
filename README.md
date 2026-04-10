# skill-forge

A collection of Claude Code skills. Install any skill by pasting one line into Claude Code.

## Install Skills

Copy any line below into your Claude Code conversation. Claude will fetch the instructions and install the skill automatically.

### opencode-coder

Delegates code generation to cheap external models (MiniMax-M2.7, GPT-5.3-Codex) for 95% cost savings. Claude reads, dispatches, and reviews; the external model writes code.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/opencode-coder/ai-install.md and follow the instructions inside.
```

### write-skill

Skill architect that helps you create new Claude Code skills conforming to Anthropic's spec. Extracts requirements through minimal interaction and outputs compliant SKILL.md files.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/write-skill/ai-install.md and follow the instructions inside.
```

### skill-auto-installer

Packages any existing skill into a zero-friction auto-install bundle (ai-install.md). Supports GitHub Raw, npm, and local distribution channels.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/skill-auto-installer/ai-install.md and follow the instructions inside.
```

### code-graph

Builds a local LSP code graph so Claude can efficiently read large codebases without traversing every source file. (Work in progress)

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/code-graph/ai-install.md and follow the instructions inside.
```

## Install All Skills at Once

Paste this into Claude Code to install every skill in one go:

```
Fetch the following URLs one by one and follow the instructions inside each:
1. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/opencode-coder/ai-install.md
2. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/write-skill/ai-install.md
3. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/skill-auto-installer/ai-install.md
4. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/code-graph/ai-install.md
```

## npm (opencode-coder only)

```
Run 'npx @skill-forge/opencode-coder init-skill' and follow the output.
```

## Uninstall

Delete the skill directory:

```bash
rm -rf ~/.claude/skills/{skill-name}
```
