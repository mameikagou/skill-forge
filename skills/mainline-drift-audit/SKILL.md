---
name: mainline-drift-audit
description: Audit technical proposals and repository implementations for mainline drift, parallel systems, adopt-before-build and dependency reuse, repeated wheel-building, one-off research infrastructure, duplicate CLIs/configs/tests/reports, fake formal results, data-lake bypasses, incorrect paths, protected planning evidence, and unbounded artifacts. Audit against the repository's own frozen AGENTS.md responsibility map when one exists. Use before approving a plan or architecture migration, after implementation, during cleanup, before research campaigns or backtest changes, or whenever the user asks whether a proposal or codebase is “走主线”, “反复拉屎”, “自造轮子”, “屎山”, or accumulating unexplained disk usage.
---

# Mainline Drift Audit

Perform an evidence-based, read-only audit by default. Do not fix, delete, move, commit, or generate an audit document unless the user explicitly asks.

## Current repository contracts (quant workspace)

When auditing repositories under `mrlonely-code`, the frozen facts are:

- `analyze2quant/` is the single target mainline for new quantitative-research production code (one Python distribution, one CLI/API, one research UI, one append-only PostgreSQL migration chain, required `infra/`). New engines only as thin adapters under `engines/` declared in `research.routing`; new data sources through `providers/` and `lake/`; new pages only inside the existing `web.py` + `web/`; new commands only through `commands/` into the single `cli.py`.
- `analyze/` is a migration source and historical evidence store, not a second implementation site. Its `.planning/`, research conclusions, failure records, and human decision reports are protected evidence even though its code is superseded.
- `analyze2quant/AGENTS.md` holds the authoritative repository responsibility map, and `tests/test_repository_map.py` fails when a managed file or directory lacks a declared owner. Treat a missing ownership entry as a P1 finding, and treat that test as the model recurrence guard: prefer ownership-map enforcement over more documentation.
- The 2026-08-31 system audit (`analyze2quant/planning/reports/analyze主线与数据库审计-2026-08-31.md`) justified the cutover: legacy `qrant_research_prod` becomes a hashed read-only cold archive, and `analyze2quant_prod` owns the only active writer and migration chain. Any proposal that keeps both writable is reviving the blocked state.

## Audit goal

Answer four questions:

1. What is the repository's one official path for this responsibility?
2. What code, entrypoint, data flow, or artifact bypasses that path?
3. What is duplicated, fake, obsolete, or growing without a lifecycle?
4. What exact constraint would stop recurrence?

Treat a technically feasible proposal that violates the architecture as a finding. Treat working code that violates the architecture as a finding. Do not excuse duplication because a plan looks thorough or tests pass.

## Adopt before build and reuse gate

Before approving or implementing any new engine, broker, ledger, backtester, registry, CLI, or data pipeline, establish whether the capability already exists. Do not accept “temporary”, “small”, “research-only”, or “compatible” as evidence of a gap.

1. Inventory the live repository path: package boundaries, entrypoints, catalogs, registries, writers, tests, and configured output roots.
2. Read declared dependencies and lockfiles. Check whether the repository already depends on an official or mature open-source implementation that owns the capability.
3. Trace the existing end-to-end call path and inspect the official implementation's documented limits. Search mature external implementations only after checking the repository's own path.
4. Record a capability-gap matrix before allowing new code:

| Capability | Existing repository path | Declared dependency or mature implementation | Verified gap | Thin adapter allowed? | Owner and deletion target | Evidence/acceptance test |
|---|---|---|---|---|---|---|
| matching/order/fill/account/fees/PnL | | | | | | |
| data/factor/signal/target weights | | | | | | |
| registry/CLI/API/artifacts | | | | | | |

5. Choose exactly one decision for each row:

- `REUSE`: extend or call the official path.
- `ADAPT`: add only a thin boundary adapter for the verified gap; it must not become a second owner of execution state.
- `BLOCKED`: the claimed gap is unverified, or the proposal would build a replacement engine, broker, ledger, accounting path, registry, or parallel surface.

An explicit gap permits a thin adapter, not a shadow implementation. If the gap is in matching, order lifecycle, fills, account state, fees, or PnL, stop and escalate the formal-engine decision instead of recreating that responsibility.

## Engine ownership boundary

When an official or mature external engine is adopted, it owns matching, order lifecycle, fills, cash and positions, margin, fees, corporate actions, valuation, and PnL. Self-owned code may provide only:

- source/raw/canonical data preparation and validation;
- factor, model, or signal calculation;
- public `target_weights` or equivalent target intent;
- a thin adapter that maps the public contract into the approved engine;
- result registration and report projections from the authoritative registry.

Do not add a self-built broker, paper account, order/fill ledger, fee calculator, NAV/PnL calculator, shadow company-action account, or compatibility runtime around the official engine. If the engine cannot represent a required rule, fail closed and record the gap; do not silently maintain an external shadow state.

## Select the audit mode

Choose the smallest mode that answers the request:

- `proposal`: audit a technical plan, design discussion, migration proposal, or architecture document before implementation;
- `implementation`: audit a diff, branch, commit range, or completed implementation against the approved direction;
- `repository`: audit existing architecture, entrypoints, stale systems, and disk artifacts;
- `full`: audit the proposal, implementation, repository residue, and artifact lifecycle together.

Default to `proposal` when the user provides or points to a new plan. Default to `implementation` when the user asks about code changes. Do not scan the whole repository when a focused proposal review is sufficient, but inspect enough live code to verify the proposal's claims.

## Problems to detect

Check for these failure patterns:

- No official engine, data path, registry, or output contract was frozen before development.
- A “temporary”, “lightweight”, “compatible”, “research-only”, or “quick” implementation duplicates an official engine.
- A research improvement (holding rule, factor, model) is built on a temporary nomination list, a separately trained ranker, or its own account instead of the live strategy, then compared only against an index (e.g. a Livermore rule on a price-only top-10 while the daily card uses another ranking).
- A formal backtest is replaced by hand-written cash, positions, broker, fills, fees, or NAV logic.
- Research and formal execution boundaries are blurred, so approximate returns are presented as formal results.
- One-off scripts, Round/Phase/date-specific modules, or abandoned prototypes live in production `src/`.
- Every research round creates another CLI, config tree, report system, test tree, artifact root, or database.
- The same information is written to several of JSON, JSONL, YAML, Markdown, CSV, Parquet, MLflow, and SQLite.
- Run directories copy full source datasets, canonical tables, factor panels, model inputs, positions, or provider data.
- Large intermediate data has no TTL, quota, promotion rule, shared cache, or garbage collection.
- Failed and rejected experiments retain the same large artifacts as promoted results.
- Relative/absolute path bugs recreate `home/...`, `apps/...`, or the repository itself inside an output directory.
- Default paths depend on the current working directory and silently write to the wrong repository path.
- Mock, random, fabricated, placeholder, or demo output is reachable from a formal CLI or product page.
- Runtime business logic bypasses the local data lake and downloads external data directly.
- Multiple MLflow stores, provider copies, catalogs, registries, or “latest” pointers describe the same state.
- Old configs, scripts, tests, reports, and artifacts preserve an architecture that the source no longer supports.
- Tests lock in a wrong architecture by asserting duplicate files or parallel entrypoints exist.
- Documentation is duplicated, stale, or treated as stronger evidence than live code.
- Cleanup code deletes planning, research conclusions, reports, canonical data, or promoted results together with rebuildable caches.
- Artifact registry rows whose files no longer exist (or exist unregistered), while read paths silently skip missing objects instead of failing closed, so pages, runs, and artifact tables give contradictory answers.
- UI/page snapshot tables that persist computed results as stored JSON copies instead of live projections from the single authoritative read model.
- State-machine enums polluted with per-campaign free text, so recorded `active`/status values can no longer drive recovery.
- A legacy service and the new mainline sharing one database with two migration owners, freezing the cutover permanently instead of retiring the old writer.
- Backups on the same physical volume as primary data counted as disaster protection, or a runtime database role holding superuser/createdb.
- A proposal claims a capability is missing without checking the existing implementation.
- A proposal introduces a new package, CLI, registry, database, config root, artifact root, report schema, or engine when the existing mainline can be extended.
- A proposal approves a new build without a capability-gap matrix covering repository code, declared dependencies, and official or mature external implementations.
- A proposal adds dual-write or compatibility behavior without an owner, deletion target, and same-phase exit condition.
- A proposal describes additions in detail but does not identify which old paths become invalid and must be removed.
- A proposal defines directories and file formats before defining the business capability, source of truth, and consuming path.
- A proposal makes every signal date, experiment, phase, or candidate create another directory or document bundle.
- A proposal has no disk budget, retention rule, path boundary, failure cleanup, or promoted-result policy.
- A proposal's tests validate file generation rather than correctness, engine identity, timing integrity, and mainline reuse.
- A replacement deletes or compresses protected planning, human-authored research/failure/history documents, explicitly retained human decision reports, canonical data, or historical decisions instead of preserving them as evidence.

## Proposal audit

Audit a technical proposal before allowing implementation.

### Verify the proposal against reality

Read the proposed document or discussion completely. Then inspect the applicable `AGENTS.md`, current package boundaries, official entrypoint, existing engine, data catalog, registry, artifact writer, and relevant tests.

Verify every important proposal claim:

- “There is no existing capability” requires evidence from live code.
- “This reuses the mainline” requires an end-to-end call path.
- “This is temporary” requires a deletion target and exit condition in the same plan.
- “This is only metadata” requires a list of actual stored fields and files.
- “This is rebuildable” requires a named authoritative source and deterministic rebuild path.
- “This is a formal backtest” requires the approved formal engine.

Do not approve a proposal based only on its own description.

### Build the proposed surface delta

List what the proposal adds, changes, reuses, and deletes:

| Surface | Reuse | Add | Delete/replace | Verdict |
|---|---|---|---|---|
| engine/runtime | | | | |
| top-level package | | | | |
| CLI/API entrypoint | | | | |
| database/registry | | | | |
| config root/schema | | | | |
| artifact root/files | | | | |
| reports/documents | | | | |
| tests | | | | |

An addition is not free merely because it is small. Require a concrete reason whenever a new surface cannot fit the existing one.

Prefer a net simplification. If a migration adds a new surface, require the replaced surface to be removed in the same plan unless external sequencing makes that impossible. In that case require a named owner, deadline, blocked entrypoint, and measurable exit condition.

### Check responsibility and truth ownership

For every state or result, identify exactly one authority:

- source/canonical data;
- factor definition and score;
- model experiment;
- target position;
- formal order/fill/account state;
- performance and risk result;
- user-facing report.

Block proposals that let two engines, databases, file trees, or registries own the same truth. Caches and projections must name their authority and rebuild rule.

### Choose persistence by reader

Require every persistent output to name its reader before choosing a format.

- Put human-readable plans, progress notes, decisions, reports, and postmortems in prose only when a named human workflow needs them.
- Put machine state, identities, parameters, metrics, errors, hashes, attempts, locks, and object relationships in the repository's one official database or registry.
- Put large tabular details and time series in the official data lake or Parquet store, and register their path, schema, hash, size, and lifecycle in the database.
- Keep transient logs, caches, and rebuildable intermediates temporary with a TTL or deterministic cleanup; do not persist garbage merely because file ledgers are forbidden.
- Treat tests as non-production readers: redirect every writer to a test temporary root, then run the writer twice and prove repository data and artifact roots remain byte-for-byte unchanged.
- Treat a human report as a projection of database facts, not a second authority. Store only its path and hash in the database when traceability is needed.

Block a proposal that creates persistent Markdown, YAML, JSON, JSONL, or CSV for content with no explicit human reader when the content belongs in the official database. Block a dashboard or API that reconstructs formal state by scanning directories when the state should be queried from the database.

During a database migration, require one active writer at every moment. Allow a hashed read-only source snapshot for rollback or audit, but block sustained dual-write, silent fallback, or compatibility reads after cutover. Require the old active path and its tests to be removed in the migration plan.

### Check the complete lifecycle

Require the plan to state:

- creation trigger;
- reader/consumer;
- update policy;
- size bound;
- cleanup trigger;
- retention for rejected and promoted runs;
- failure and interruption cleanup;
- path root and containment rule;
- migration and rollback behavior;
- branch synchronization order.

If a generated file has no named reader, classify it as unnecessary. If a large intermediate has no cleanup trigger, block the plan.

## Same-phase replacement and protected evidence

When a new mainline replaces an old implementation, freeze the replacement list before execution. Delete the replaced production code, CLI/API entrypoints, configs, imports, catalog entries, and corresponding tests in the same phase. Remove or block the old command; do not leave compatibility aliases or a second path “for now”.

Preserve evidence that explains what happened: `.planning/` files, human-authored research conclusions, failure records, historical decisions, and human-authored reports explicitly retained as decision evidence. Do not delete, squash, compress, or rewrite those records to hide an obsolete path. Append a `superseded` or `retired` marker, link the replacement, and label old commands or paths as historical and non-runnable. Treat generated or rebuildable runtime reports under artifact/report roots as ordinary outputs: require a reader, lifecycle, retention rule, and cleanup decision, and allow their deletion when replaced. Keep canonical data and promoted results unless a separate, explicit data-retention decision authorizes their removal.

For an implementation audit, compare `git diff --name-status` with both lists:

- execution surfaces allowed to be deleted now;
- protected evidence that must have no delete status.

Treat a protected delete, an active stale entrypoint, or a preserved document that still presents a retired command as current as a failed replacement gate.

### Detect document-driven architecture

Block plans that primarily deliver a directory taxonomy or document bundle. Four analysis steps do not justify four storage systems.

Reject patterns such as:

```text
phase/
  metrics.json
  tables/
  README.md
  assessment.json
  assessment.md
```

Require the minimum persistent representation. Store structured state once, large data once, and prose only when a human actually needs prose.

### Proposal verdict

Use:

- `PASS`: reuses the mainline, preserves one source of truth, has bounded artifacts, and removes replaced paths;
- `REVISE`: direction is sound but specific ownership, deletion, lifecycle, or acceptance details are missing;
- `BLOCKED`: creates a parallel mainline, duplicated truth, fake formal path, unbounded artifacts, compatibility trap, or document/file system instead of capability.

Return required plan edits as concise replacement decisions. Do not rewrite or save the plan unless asked.

## Workflow

### 1. Establish the official path

Find the Git root. Read every applicable `AGENTS.md`, then inspect the real package metadata, main CLI, catalogs/registries, and only the relevant planning or migration document.

Build a small internal map:

| Responsibility | Official implementation | Official entrypoint | Authoritative data | Allowed output |
|---|---|---|---|---|

If the official path cannot be identified from live code and explicit repository rules, report that as the first finding. Do not invent a preferred architecture.

### 2. Audit the proposal before its implementation

When a proposal exists, run the Proposal audit before reviewing code. Freeze:

- approved mainline and responsibility boundaries;
- allowed new surfaces;
- exact replacement/deletion list;
- authoritative state for every output;
- artifact limits and cleanup behavior;
- acceptance criteria.

Implementation cannot compensate for a blocked proposal.

### 3. Inspect the current change first

When there are uncommitted changes or a target commit range, inspect that diff before scanning the whole repository. Trace every new entrypoint to its data source and output files.

Ask of each addition:

- Could the existing mainline perform this job?
- Did this create a second representation of existing state?
- Is the file long-lived product code or a one-time experiment?
- Does the test verify behavior, or merely preserve a new pile of files?

Compare implementation against the frozen proposal. Report both unauthorized additions and promised deletions that did not happen.

### 4. Run the mechanical scan

Run:

```bash
python3 <skill-dir>/scripts/scan_repo.py <repo-root>
```

Use `--json` only when machine-readable output is useful. The script is read-only and reports suspicious paths, large artifact families, repeated artifact names, source filenames containing experiment identifiers, multiple run stores, and source literals that write known bulky intermediates.

Do not treat script output as a verdict. Open the relevant source and verify every reported problem.

### 5. Trace architecture and artifacts

Audit these paths end to end:

```text
CLI/API -> orchestrator -> official engine -> data source -> registry -> artifacts
```

Look for side branches that skip a component, implement it again, or write elsewhere.

For disk growth, distinguish:

- source data: expensive or impossible to recreate;
- canonical data: authoritative normalized data;
- shared cache: rebuildable and deduplicated;
- run artifact: metrics or promoted outputs worth retaining;
- transient intermediate: delete after the consuming stage;
- garbage: obsolete, duplicated, fake, or unreachable.

Never recommend deleting a large directory solely because it is large.

### 6. Apply hard decision rules

Mark the audit BLOCKED when any of these is present:

- a second formal engine or hand-written execution/accounting path;
- a formal result produced by mock, random, placeholder, or approximate logic;
- a runtime write outside configured data/artifact roots;
- a run copying full canonical/provider/source data;
- an unbounded artifact producer with no retention policy;
- a new parallel CLI/config/report/test/artifact system for one research round;
- deletion that mixes rebuildable garbage with planning, canonical data, or promoted results.
- a proposal that adds dual ownership or dual-write without a same-phase exit;
- a proposal that adds infrastructure before proving the mainline cannot carry the capability;
- a proposal that leaves replaced systems active “for compatibility”;
- a proposal that cannot name the reader and lifecycle of each generated artifact.

Require evidence before allowing an exception. “Temporary” is not an exception.

### 7. Report findings in chat

Lead with findings, ordered by severity. Do not create Markdown reports unless requested.

For every finding include:

- severity: `P0`, `P1`, `P2`, or `P3`;
- exact file and line, directory, or command;
- which official path it bypasses or duplicates;
- concrete impact: false result, maintenance split, disk growth, path corruption, or lost reproducibility;
- exact action: delete, merge into mainline, make transient, share once, or retain;
- recurrence guard: code assertion, allowlist, quota, lifecycle rule, or architecture test.

Every audit must also state:

- `Dependency/reuse decision`: `REUSE`, `ADAPT`, or `BLOCKED`, with the capability-gap matrix, declared dependencies, official/mature implementation checked, and the owner of each truth.
- `Planning-preservation verdict`: `PASS` only when `.planning/`, human-authored research/failure/history documents, and human-authored reports explicitly retained as decision evidence are retained or explicitly marked superseded; otherwise `BLOCKED`. Generated or rebuildable runtime reports are judged under the artifact lifecycle and retention checks, not protected by this verdict.

Use these severities:

- `P0`: false formal result, data corruption/loss, future leakage, destructive cleanup risk.
- `P1`: parallel engine/mainline, unbounded growth, runtime path escape, fake production entrypoint.
- `P2`: duplicate entrypoint/config/store, stale code, or repeated artifact.
- `P3`: naming, minor residue, or documentation hygiene.

Finish with a compact verdict:

```text
Proposal: PASS/REVISE/BLOCKED/NOT_REVIEWED
Mainline: PASS/BLOCKED
Dependency/reuse: REUSE/ADAPT/BLOCKED
Planning preservation: PASS/BLOCKED
Artifacts: PASS/BLOCKED
Data safety: PASS/BLOCKED
Delete now: <exact targets or none>
Keep: <protected targets>
Required guards: <smallest enforceable set>
```

## Recurrence guards

Prefer enforceable guards over more documentation:

- one allowlisted engine per market and responsibility;
- one data root, registry, MLflow store, and artifact root;
- source-level tests forbidding known duplicate engines and output filenames;
- an artifact writer allowlist instead of unrestricted file writes;
- per-run and per-campaign byte budgets that fail closed;
- content-addressed shared caches instead of copies inside run directories;
- automatic cleanup in `finally` for transient intermediates;
- promotion-aware retention: rejected runs keep metrics, promoted runs keep only necessary reproducibility assets;
- path containment checks using resolved paths before every write;
- architecture tests that fail on new top-level packages, CLIs, catalogs, or artifact roots.
- An ownership-map test that requires every managed file or directory to declare its owner in `AGENTS.md` before it can exist.
- Fail-closed artifact availability: register only objects verified by path, size, schema, and hash; a lost object becomes `missing`/`quarantined` and the read model surfaces it instead of skipping it.
- Cutover writer rule: exactly one active writer at every moment; after cutover the legacy database is a hashed read-only cold archive with application write grants revoked.

Do not propose a new management framework merely to enforce these rules. Add the smallest guard to the existing mainline.
