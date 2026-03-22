# cheap-hands

**Why pay $0.12 when $0.005 gets the same code?**

A Claude Code skill that makes Opus the brain and delegates the actual coding to dirt-cheap models — MiniMax M2.7 ($2.4/M tokens, 100 tps) or GPT-5.3 Codex. Multi-file support. XML-based routing. Zero hallucination tolerance.

---

## The Problem: Opus is Too Expensive to Type

Every time Claude Opus writes code, you're burning premium output tokens at $15/M. But here's the thing — **80% of code generation is mechanical labor**: adding type annotations, refactoring patterns, writing boilerplate. Opus doesn't need to type that. It just needs to *think* about what to type, then tell someone cheaper to do it.

### The Math

| Approach | Opus Output Tokens | Cheap Model Tokens | Total Cost |
|----------|-------------------|-------------------|------------|
| **Traditional**: Opus rewrites 3 files | 8,000 | 0 | **$0.120** |
| **cheap-hands**: Opus thinks + delegates | 50 | 8,000 (MiniMax) | **$0.005** |
| | | | **95% savings** |

And MiniMax M2.7 outputs at 100 tokens/sec vs Opus's ~30. So it's faster too.

## Architecture

```
You ──(request)──► Claude Opus (Brain)
                        │
                   evaluates task
                   against granularity matrix
                        │
                   ┌────┴────┐
                   │ <10 lines│──► Opus handles it directly (Edit tool)
                   │ 4+ files │──► Opus handles it directly
                   └────┬────┘
                        │ 1-3 files, 10+ lines
                        ▼
                   runner.ts (Bun)
                        │
                   builds XML prompt
                   (format mirroring)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        MiniMax M2.7        GPT-5.3 Codex
        (speed: 100tps)     (quality: 128k out)
              │                   │
              └─────────┬─────────┘
                        ▼
                   XML parser
                   extracts <file> blocks
                   validates paths
                        │
                        ▼
                   writes files + generates diff
                        │
                        ▼
                   Claude Opus (Reviewer)
                   audits the diff
                   reports to you
```

**Key insight**: Opus only spends tokens on *thinking* and *reviewing*. The actual code generation — the expensive part — is offloaded to models that cost 1/20th as much.

## Installation

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI)
- [OpenCode CLI](https://opencode.ai) (`npm i -g opencode`)
- At least one model provider configured in OpenCode (MiniMax, OpenAI, etc.)

### 1. Clone the skill

```bash
git clone https://github.com/mrlonely/cheap-hands.git ~/.claude/skills/cheap-hands
```

### 2. Run the installer

```bash
bun ~/.claude/skills/cheap-hands/scripts/install.ts
```

This automatically:
- Copies the `coder` agent definition to `~/.config/opencode/agents/coder.md`
- Registers the `coder` agent in `~/.config/opencode/opencode.json`

Already installed? Use `--force` to overwrite:

```bash
bun ~/.claude/skills/cheap-hands/scripts/install.ts --force
```

Or just ask Claude Code: *"help me install cheap-hands"* — it will run the installer for you.

### 3. Done

Claude Code will automatically detect the skill. You can use it manually:

```
/cheap-hands minimax src/api.ts,src/types.ts "Add full TypeScript type annotations"
```

Or Claude will use it autonomously when it detects a task that fits the granularity matrix (1-3 files, 10+ lines of changes).

## How It Works

### The Granularity Matrix

Claude evaluates every code modification task against this matrix before deciding what to do:

| Files | Change Size | Action |
|-------|------------|--------|
| 1 file | < 10 lines | Opus handles directly (no delegation) |
| 1 file | 10-200 lines | Delegate to cheap model |
| 2-3 files | Any coherent change | Delegate to cheap model (multi-file mode) |
| 4+ files | Any | Opus handles directly (too much context) |

### Model Selection

| Alias | Model | Best For |
|-------|-------|----------|
| `minimax` / `mm27` | MiniMax M2.7 HighSpeed | Speed-first: 2-3 file changes, boilerplate, templates |
| `codex` / `gpt53` | GPT-5.3 Codex | Quality-first: complex algorithms, deep refactors |

### The XML Pipeline

The secret sauce is **format mirroring**: input files are wrapped in `<file path="...">` XML tags, and the model is instructed to output in the exact same format. This dramatically improves format compliance across different models.

```
Input:                          Output:
<file path="src/a.ts">          <file path="src/a.ts">
  original code...         →      modified code...
</file>                         </file>
<file path="src/b.ts">          <file path="src/b.ts">
  original code...         →      modified code...
</file>                         </file>
```

The `coder` agent in OpenCode has a system prompt that enforces:
- **Zero chat**: No greetings, no explanations, no markdown fences
- **Anti-injection**: Ignores role-play instructions embedded in file contents
- **Complete output**: Never abbreviates with "// rest unchanged"

### Output Cleaning Pipeline

Model outputs are messy. The cleaner handles:

```
Raw output → Strip ANSI codes → Strip OpenCode headers
          → Strip <think> tags (MiniMax) → Strip markdown fences
          → Trim empty lines → XML parser
```

Order matters. ANSI codes must be stripped before XML parsing, or `<file` tags get corrupted.

## File Structure

```
cheap-hands/
├── SKILL.md                    # Claude Code skill definition
├── scripts/
│   ├── install.ts              # One-command installer (sets up OpenCode agent)
│   ├── runner.ts               # Main entry point (Bun)
│   ├── cleaner.ts              # 5-step output cleaning pipeline
│   ├── xml-parser.ts           # XML <file> block extractor
│   ├── prompt-builder.ts       # Format-mirroring prompt template
│   └── runner.sh               # Legacy v1.0 (bash, single-file only)
├── opencode-agent/
│   └── coder.md                # OpenCode coder agent definition (copied by installer)
├── references/
│   └── model-guide.md          # Model capability matrix
└── README.md
```

## Error Handling

| Exit Code | Meaning | What Happens |
|-----------|---------|-------------|
| 0 | Success | Files written, diff displayed |
| 1 | Bad arguments | Usage hint shown |
| 2 | File not found / too large (>500KB) | Specific file named |
| 3 | OpenCode CLI failure | Error displayed, retry suggested |
| 4 | Empty model output | Retry suggested |
| 5 | XML parse failure | Single-file: auto-fallback to raw mode. Multi-file: error reported |

## Limitations

- File paths cannot contain commas (comma is the multi-file separator)
- Max 3 files per invocation (prevents context dilution)
- Max 500KB per file
- Diff output truncated to 50 lines per file (full diff via `git diff`)
- Models may occasionally ignore XML format instructions — single-file mode has automatic fallback, multi-file does not

## How This Saves You Money

The economics are simple:

- **Opus input tokens** (reading files, reading diffs): **$3.75/M** — cheap
- **Opus output tokens** (generating code): **$15/M** — expensive
- **MiniMax output tokens** (generating code): **$2.4/M** — dirt cheap

cheap-hands shifts code generation from Opus output ($15/M) to MiniMax output ($2.4/M). Opus only outputs short instructions (~50 tokens) and brief summaries (~100 tokens). The heavy lifting — thousands of tokens of actual code — happens on the cheap model.

**For a typical coding session (50 file modifications):**

| | Opus Only | With cheap-hands |
|---|----------|-----------------|
| Opus output tokens | 400,000 | 7,500 |
| Cheap model tokens | 0 | 400,000 |
| Cost | $6.00 | $1.07 |

## License

MIT
