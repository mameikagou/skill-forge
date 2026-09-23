# skill-forge

A collection of Claude Code skills. Install any skill by pasting one line into Claude Code.

## Install Skills

本地已 clone 本仓库的多环境用户：直接 `bun run link:skills`，把 codex / claude / pi(~/.agents/skills) / antigravity(~/.gemini/config/skills) 的安装目录换成指向仓库的文件级软链（sanity、mining-factors 强制接入，其余 forge 技能仅在已装时转换），仓库从此是唯一来源；仓库改动即时对所有 harness 生效，不认软链的环境用 `bun run link:skills -- --copy` 降级为同步副本。

Copy any line below into your Claude Code conversation. Claude will fetch the instructions and install the skill automatically.

### antigravity-chat-read

Read local Antigravity conversation text with a dependency-free Bun CLI: session/title lookup, newest-first messages, role filtering, skip, and stable step cursors. Verified display-name mappings stay local; live Multica display-name lookup is not currently available through the task CLI.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/antigravity-chat-read/ai-install.md and follow the instructions inside.
```

### route-openmemory

Routes, classifies, stores, queries, deduplicates, and migrates records in the original OpenMemory service across the three canonical projects and five memory sectors.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/route-openmemory/ai-install.md and follow the instructions inside.
```

### route-longmemory

Uses the self-hosted LongMemory service for project-scoped context, recall, ingestion, durable decisions, task continuity, provenance verification, and conflict checks while OpenMemory remains available in parallel.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/route-longmemory/ai-install.md and follow the instructions inside.
```

### clash-party-safe-update

Diagnoses Windows/WSL TUN failures and guards Clash Party rule updates without routine restarts. Includes read-only inspection, physical-interface forwarding checks, reload safeguards, and a local rollback procedure.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/clash-party-safe-update/ai-install.md and follow the instructions inside.
```

### suization（酥化）

Turns real project notes into strong, interview-ready technical chains, resume bullets, and deep-dive preparation without inventing ownership or metrics.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/suization/ai-install.md and follow the instructions inside.
```

### sanity

Pure reviewer for quantitative research ideas, campaigns and system mainlines: checks the frozen business contract, knowledge evidence, fatal flaws, campaign depth and system entropy. Factor-research substantive rules (ruler matching, rank-vs-magnitude, holding contracts, weak-factor protection, independence counting) live only in mining-factors; sanity references them and issues verdicts. Keeps weak-factor combination research permissive while guarding against leakage, fake breadth, and execution errors.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/sanity/ai-install.md and follow the instructions inside.
```

### mining-factors

Mines factors and implements the complete trading strategy: factor combination, entry, holding, replacement, exit, sizing, costs, and sample-out-of-sample evaluation. Single source of truth for how factor research is done correctly — the sanity reviewer references these rules instead of duplicating them. It keeps a bounded, source-backed chapter synthesis of the original factor-investing book and corrects it in place as the source is reread.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mining-factors/ai-install.md and follow the instructions inside.
```

### mainline-drift-audit

Audits plans and implementations for parallel systems, duplicated truth, directory-scanned state, unbounded artifacts, and database or data-lake bypasses.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mainline-drift-audit/ai-install.md and follow the instructions inside.
```

### sandbox-dev-environment

Uses the BotMux development environment correctly, distinguishing native owner sessions from Podman guests and covering the data lake, staging/publish flow, approved books, review skills, and network diagnostics.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/sandbox-dev-environment/ai-install.md and follow the instructions inside.
```

### dsh-worker-review

Delegates bounded coding and PR implementation to DeepSeek Harness models such as OpenRouter Ox Alpha, while Sol, Codex, or Claude retains workspace selection, diff review, testing, and the final decision. It runs in the exact checkout supplied by the reviewer and never creates Git worktrees, branches, commits, or PRs.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/dsh-worker-review/ai-install.md and follow the instructions inside.
```

### delegate-luna-worker

Installs or repairs the Luna Worker Agent and delegates clearly bounded work to GPT-6 Luna with maximum reasoning effort. It requires detailed task prompts with exact change boundaries, constrains speculative over-design, and keeps the main agent active so it can directly repair low-quality work while Luna continues around those edits.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/delegate-luna-worker/ai-install.md and follow the instructions inside.
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

### quant-ui-sync

Maintain the analyze2quant research frontend and result visibility whenever a factor, strategy, spec, or run is completed or materially changed: formal run registration via `research run-spec`, `api`-schema projections shared by UI and AI, and no page-model copies or file scans.

```
Fetch https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/quant-ui-sync/ai-install.md and follow the instructions inside.
```

## Install All Skills at Once

Paste this into Claude Code to install every skill in one go:

```
Fetch the following URLs one by one and follow the instructions inside each:
1. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/suization/ai-install.md
2. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/write-skill/ai-install.md
3. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/skill-auto-installer/ai-install.md
4. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mainline-drift-audit/ai-install.md
5. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/sandbox-dev-environment/ai-install.md
6. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/dsh-worker-review/ai-install.md
7. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/delegate-luna-worker/ai-install.md
8. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/mining-factors/ai-install.md
9. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/sanity/ai-install.md
10. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/quant-ui-sync/ai-install.md
11. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/clash-party-safe-update/ai-install.md
12. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/route-openmemory/ai-install.md
13. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/route-longmemory/ai-install.md
14. https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/antigravity-chat-read/ai-install.md
```

## Uninstall

Delete the skill directory:

```bash
rm -rf ~/.claude/skills/{skill-name}
```
