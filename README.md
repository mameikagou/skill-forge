# skill-forge

A monorepo of Claude Code skills — tools that make Claude itself more capable.

## Skills

| Skill | Status | Description |
|-------|--------|-------------|
| [opencode-coder](skills/opencode-coder/) | ✅ Ready | Delegates code generation to cheap models (MiniMax, Codex) — 95% cost savings |
| [write-skill](skills/write-skill/) | 📦 Placeholder | Teaches Claude to write skills conforming to Anthropic's spec |
| [skill-auto-installer](skills/skill-auto-installer/) | 📦 Placeholder | Packages any skill for one-command user installation |
| [code-graph](skills/code-graph/) | 📦 Placeholder | Builds local LSP code graph for efficient codebase reading |

## Setup

```bash
# Install dependencies (links workspaces)
bun install

# Run all tests
bun test

# Run tests for a specific skill
cd skills/opencode-coder && bun test
```

## Structure

```
skill-forge/
├── package.json              # Bun workspace root
├── packages/
│   └── shared/               # Shared utilities (@skill-forge/shared)
└── skills/
    ├── opencode-coder/       # Cost arbitrage: Opus thinks, cheap models type
    ├── write-skill/          # Meta-skill: write skills the right way
    ├── skill-auto-installer/ # Package skills for distribution
    └── code-graph/           # LSP-based code graph for reading
```

## License

MIT
