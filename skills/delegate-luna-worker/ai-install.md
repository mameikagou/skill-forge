# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "delegate-luna-worker" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/delegate-luna-worker/` already exists
   - If YES: Ask the user "Skill 'delegate-luna-worker' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/delegate-luna-worker/`
- CREATE file: `$HOME/.claude/skills/delegate-luna-worker/SKILL.md`
- CREATE file: `$HOME/.claude/skills/delegate-luna-worker/references/delegation-contract.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Create skill directory

Run: `mkdir -p $HOME/.claude/skills/delegate-luna-worker`

### Step 2: Write SKILL.md

Write the following content to `$HOME/.claude/skills/delegate-luna-worker/SKILL.md`:

```
---
name: delegate-luna-worker
description: Install or configure the luna-worker Agent and delegate clearly bounded work to GPT-6 Luna with max reasoning under active main-agent oversight. Use when the user explicitly asks to set up or use Luna, Luna Max, luna-worker, or a Luna subagent, especially for implementation that needs a detailed prompt, strict change boundaries, protection against over-design, shared-worktree coordination, and direct main-agent intervention when quality is low.
---

# Delegate Luna Worker

Use the custom Agent defined at `~/.codex/agents/luna-worker.toml`. This skill installs or repairs that configuration when explicitly requested, then coordinates delegation. The Agent configuration owns the model, reasoning effort, and worker behavior. The main agent remains an active technical owner: it controls direction and acceptance, participates in implementation when useful, and directly repairs low-quality or over-designed work when that is faster and safer.

## Install or repair the Agent

Run this workflow when the user explicitly asks to install, configure, repair, or show the configuration for Luna Worker. Do not overwrite an existing customized Agent blindly: inspect it first and preserve unrelated supported settings unless the user requests the canonical replacement.

Resolve the target as `$CODEX_HOME/agents/luna-worker.toml` when `CODEX_HOME` is set, otherwise `~/.codex/agents/luna-worker.toml`. Create the `agents` directory if needed, then use `apply_patch` to create or minimally update the file to this canonical configuration:

```toml
name = "luna-worker"
description = "Executes clearly bounded delegated tasks with GPT-6 Luna at maximum reasoning effort. Use when ownership, scope, constraints, and a concrete deliverable can be stated upfront."
model = "gpt-6-luna"
model_reasoning_effort = "max"

developer_instructions = '''
You are a focused worker for clearly bounded delegated tasks.

Treat the delegation as a contract. Identify the requested outcome, owned files or responsibility, constraints, required validation, and expected handoff from the task message. Work only within that boundary. You are not alone in the workspace: preserve unrelated and concurrent changes, never revert work you do not own, and adapt to changes made by other agents. The main agent may inspect and directly edit the shared worktree while you run; preserve those edits, do not revert them, and continue around them.

Inspect the minimum relevant context, then execute autonomously. For implementation tasks, make the smallest complete change through the existing live path and run proportionate non-destructive checks. Reuse before adding abstractions. Do not generalize for hypothetical future modes or add frameworks, managers, adapter hierarchies, compatibility paths, config layers, helper packages, report systems, broad refactors, or parallel ownership unless the task contract explicitly authorizes the exact surface. For research, diagnosis, or review tasks, remain read-only unless edits are explicitly requested. Do not broaden the task, perform external writes, make destructive changes, or create commits unless the delegation explicitly authorizes them.

If a necessary ambiguity cannot be resolved from local context without risking a materially different result, stop and report the exact blocker and the smallest decision needed. Otherwise, make reasonable local assumptions and state any assumption that materially affects the result.

Return a concise handoff containing: outcome, files changed or evidence inspected, validation performed and results, and any remaining risk or blocker. Do not claim success without verification appropriate to the task.
'''
```

After writing the file:

1. Parse it with an available TOML parser without installing dependencies globally. Assert that `name`, `description`, `model`, `model_reasoning_effort`, and `developer_instructions` exist; assert `name = "luna-worker"`, `model = "gpt-6-luna"`, `model_reasoning_effort = "max"`, and non-empty description and instructions.
2. Run a Codex configuration diagnostic when available. Distinguish validation of the main Codex configuration from validation of the Agent file; do not claim the diagnostic parsed the Agent unless it did.
3. Show the user a unified diff limited to this file. For a new file, diff it against `/dev/null`; for an update, preserve a pre-edit snapshot and diff old against new. Do not expose unrelated configuration.
4. Explain that Agent discovery is snapshotted when a Codex task starts. A new task or Codex restart is required before `spawn_agent` can select a newly created or changed Agent. Runtime verification consists of spawning `luna-worker` after reload and confirming that the child turn uses `gpt-6-luna` with `max` effort.

If no TOML parser is available, report that syntax validation is pending instead of installing a global package or claiming success. Do not start a separate Codex instance solely for runtime validation unless the user explicitly requests it.

## Prepare the delegation

Delegate only when the user's request explicitly authorizes Luna or subagent work. Before writing the task, inspect the current repository, worktree, applicable instructions, dirty files, live process or data state, and approved architecture. Read [delegation-contract.md](references/delegation-contract.md) completely, then convert the relevant sections into a detailed, task-specific prompt. A short generic prompt is not sufficient for repository, migration, or data work.

The prompt must make change boundaries operational and contain:

- The concrete outcome and stopping condition.
- Exact repository and worktree paths, branch state, known commits, dirty files, completed work, failed attempts, and live runtime or data facts already verified.
- Owned files, modules, responsibilities, existing entrypoints, dependencies, and data or artifact roots that Luna may change or write.
- Exact protected paths and unrelated work that Luna must not stage, rewrite, reformat, move, or delete.
- The approved architecture and existing live path that must be reused.
- Prohibited additions such as new top-level packages, duplicate CLIs, parallel databases, compatibility layers, one-off scripts, speculative abstractions, and unrelated refactors.
- Ordered execution steps, required validation, real completion evidence, progress checkpoints, escalation conditions, and expected handoff.
- A reminder that the main agent may directly intervene in the shared worktree and Luna must preserve those edits.

Resolve details from the current context when safe. Ask the user only if an unresolved choice would materially change the result or ownership boundary.

Do not rely on phrases such as “follow the existing style” or “avoid over-engineering” without naming the exact allowed and forbidden surfaces for the current task. Before authorizing any new surface, require the prompt to identify the verified gap, reader, owner, lifecycle, replacement target, and smallest acceptance test.

## Spawn the worker

Call `spawn_agent` with:

- `agent_type: "luna-worker"`
- `fork_turns: "none"`
- A short snake_case `task_name`
- The complete task contract in `message`

Do not pass a model or reasoning-effort override. Do not use a full-history fork with a custom Agent type; the runtime rejects that combination. Include every fact the worker needs in the message because it receives no conversation history.

If the runtime reports `unknown agent_type 'luna-worker'`, the current task's Agent registry is stale. Tell the user to start a new task or restart Codex so the newly installed Agent is loaded. Do not silently substitute a generic worker or a different model.

## Coordinate and verify

Do not wait passively for Luna's final handoff. Continue useful conflict-free work and inspect the shared worktree, diff, tests, processes, and artifacts at natural checkpoints. Freeze the smallest acceptance set before implementation and prevent Luna from turning review concerns into extra gates or a broader redesign.

When Luna drifts or over-designs, send a concrete correction immediately, naming the files, behavior, and smaller approved direction. If Luna's implementation is materially low quality, unsafe, stuck in repeated churn, or unnecessarily heavy, directly modify or replace the affected work. Tell Luna before or immediately after intervening, identify the main-agent-owned edits, and instruct it to continue without reverting them. Delegation does not prevent the main agent from participating in the main implementation path.

Treat Luna's report as a claim, not proof. Check the authoritative diff and runtime state against the contract at matching scope. Verify that the requested outcome works through the approved path, protected work remains untouched, tests and real evidence cover the acceptance set, and no speculative framework or duplicate owner remains. Use `followup_task` for a narrow correction when that is more efficient; otherwise repair the issue directly and reassign Luna to the next bounded task or to evidence collection. Report that Luna was used and distinguish its claims from validation performed by the main agent.

```

### Step 3: Download reference files

Run: `curl -fsSL "https://raw.githubusercontent.com/mameikagou/skill-forge/main/skills/delegate-luna-worker/references/delegation-contract.md" --create-dirs -o "$HOME/.claude/skills/delegate-luna-worker/references/delegation-contract.md"`


### Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Verify installation

Read `$HOME/.claude/skills/delegate-luna-worker/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Report to user

Tell the user:
"delegate-luna-worker installed successfully!
- Location: ~/.claude/skills/delegate-luna-worker/
- Trigger: Install or configure the luna-worker Agent and delegate clearly bounded work to GPT-6 Luna with max reasoning under ac
- To uninstall: delete the ~/.claude/skills/delegate-luna-worker/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/delegate-luna-worker/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
