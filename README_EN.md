# dsh-trellis-sun

<div align="center">
  <b style="font-size: 1.3em;">Trellis Workflow Extension for DeepSeek Harness</b><br />
  <sub>Structured Stage Progression · Step State Machine · Verification Gates · Spec-Delta Merge · Evidence-Based Review · Optional Read-Only Planning</sub><br /><br />
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <img alt="Node Version" src="https://img.shields.io/badge/Node.js-≥20-green.svg" />
  <img alt="Step State Machine" src="https://img.shields.io/badge/Steps-5--State%20Machine-blue.svg" />
  <img alt="Verification Gate" src="https://img.shields.io/badge/Gate-Verified%20Check-success.svg" />
  <img alt="Spec Delta" src="https://img.shields.io/badge/Spec--Delta%20Merged-purple.svg" />
  <img alt="Evidence Review" src="https://img.shields.io/badge/Review-Evidence--Based-orange.svg" />
</div>

<div align="center">
  🌏 <a href="./README.md">中文</a> · <a href="./README_EN.md"><b>English</b></a>
</div>

---

> **sun-Trellis fork** — this repo is forked from upstream `@banana-peeljj12/dsh-trellis` v0.5.1 and tracks DSH 0.2.2-rc.5 / Cordis 4.1.0. The package is published as `dsh-trellis-sun`; bundled skills are prefixed `dsh-trellis-sun-*` and bundled tools `dsh_trellis_sun_*`, so they coexist with an existing Trellis skill set instead of overwriting it. See [FORK.md](./FORK.md) for the divergence list.

## Overview

`dsh-trellis-sun` is an engineering workflow extension for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness), inspired by the stage specifications and state machine design of [Trellis](https://github.com/mindfold-ai/trellis).

In complex, multi-turn AI coding workflows, typical pain points include:
1. **Writing code without a clear design**: Jumping directly into implementation often causes structural drift or regressions.
2. **Fragmented task checklists**: Maintaining separate checklists across different notes or files leads to state divergence.
3. **Missing quality verification**: Marking tasks as done without running tests or consulting human reviewers.

`dsh-trellis-sun` addresses these issues through a unified step state machine, explicit stage progressions, and runtime tool filtering to ensure that models follow a disciplined "plan first, implement later, verify before closing" workflow.

---

## Core Features

- **Structured Stage Progression**: Standardized workflow tracks for feature development (`feat`), bug fixes (`issue`), and code refactoring (`refactor`).
- **Single Execution Contract**: Uses `task.json.steps` as the single authoritative source of truth for step statuses, preventing checklist divergence.
- **Verification Gates**: Standard step states (`pending`, `in_progress`, `verifying`, `blocked`, `completed`) with explicit support for automated AI testing and human sign-off gates before marking steps complete.
- **Optional Read-Only Planning**: When enabled via settings, code-writing tools (`write` / `edit`) are filtered out during planning phases, leaving only a sandboxed artifact channel for design documentation.
- **Session-Level Isolation**: Session pointers are stored independently under `.trellis/.runtime/sessions/`, preventing multi-session or subagent race conditions.
- **Dual-Mode Task Board (Visual Language v2)**: A compact task popover by default (active bound task pinned at the top as a hero card with an inline step checklist; open tasks grouped cleanly by status below), expanding into a full-screen board (tasks grouped by In Progress / Planning / Completed with `⌘K` search and workflow filters); the right-hand details drawer provides a **Step Tracker checklist**, stage track nodes, and an artifact file list. The board adheres to a **single-accent color system** and **restrained interaction** — it never mutates task state directly; the only advance path is the **Advance Task** button injecting an instruction into the composer for the Agent to execute, and artifact clicks produce native `@.trellis/tasks/...` file references handled by DSH.
- **Git Cleanliness Check (scoped mode supported)**: Automatically verifies that the Git working tree is clean and committed before closing or archiving a task. When the working tree contains uncommitted changes unrelated to the current task, pass the task's actual changed files via `modified_files` to `dsh_trellis_sun_task_update` / `dsh_trellis_sun_task_archive`: the check then scopes to those files (which must themselves be committed), and uncommitted changes outside the list only emit a warning instead of blocking. Omitting the parameter keeps the global strict check.
- **Incremental Spec Proposals (`spec-delta`)**: the feat `design` stage produces `spec-delta.md` next to `design.md` — ADDED / MODIFIED / REMOVED entries describing what this change adds to the resident spec — and **both must be approved before `impl`**. At archive time `dsh-trellis-sun-finish-work` merges each entry verbatim: the old text must match the target file character for character and section anchors must exist and stay unique, otherwise it **stops and asks** instead of merging silently. This is a different artefact from the post-implementation lessons captured by `update-spec`.
- **Auditable check & evidence-based review**: the check change set is computed deterministically from `git diff` (never from memory), rules are resolved path by path, every changed file needs a verdict in the coverage list, and tool failures are reported as errors rather than as "clean". Reviews run on a pinned Git snapshot and require file:line + quoted source + actual output; weak evidence is downgraded to "suspected" and non-convergence escalates to a human after 3 rounds. Two levels: a per-task small review (depth) and a version-freeze big review (breadth) that calls an external OCR tool — the mechanics are copied into the skill text, the tool is not bundled.
- **Graph queries as an external dependency**: optionally mount `codebase-memory-mcp` through DSH's built-in MCP client to look up layering and blast radius at design, module context before implementation, and affected packages during check. The shared protocol lives in `skills/_templates/graph-queries.md` (index hygiene, bounded retries, the stale-daemon and Windows DACL traps, degradation rules). Without the service, without an index, or on query failure it degrades to text search; Qt parsing precision is untested and not claimed.
- **Tiered artifact whitelist**: the deliverable channel only advertises the 10 artifacts current workflows produce, while 4 retired names (`implement.md` / `checklist.yaml` / `check.md` / `design-review.md`) stay writable so historical tasks remain updateable. The tool description separates the two tiers, so a new task never aims at a name that seeding prunes.

---

## Getting Started

### 1. Installation

Ensure Node.js ≥ 20 is installed. This fork ships through git and is **not published to npm**, so install it from a clone:

```sh
git clone https://github.com/supersun3757/dsh-trellis-sun
dsh plugin --profile web add link:<absolute path of the clone>
```

After installation, **restart the DSH service**.

> **Desktop app (DeepSeek Harness App): use the bundled carrier CLI.** The ordinary `dsh`
> CLI refuses to touch the `desktop` profile with
> `error: profile "desktop" is managed exclusively by the Electron application` (that name is
> hard-coded as protected). Use the CLI shipped inside the app instead:
>
> ```sh
> & "F:\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add link:F:\dsh-plugins\dsh-trellis-sun
> ```
>
> For a local development checkout, install it as `link:<absolute repo path>`. Afterwards
> **fully quit and relaunch the desktop app** (including the tray icon — confirm no
> `DeepSeek Harness.exe` remains in Task Manager) for the change to take effect.

> **After upgrading the plugin or editing its skills, the copies inside a project do not update by themselves.**
> Seeding is gated on the project's `.agents/skills/.trellis-version` marker — an unchanged version is skipped
> entirely (otherwise every startup would overwrite the tree). So after swapping the package or changing
> `skills/**`, pick one:
>
> ```sh
> # A) force a re-seed into one project (overwrites same-named skills/templates, prunes retired ones)
> node scripts/install.mjs --reseed --project <project root>
> # preview the change set first: append --dry-run
> ```
>
> B) bump `package.json`'s version and restart the host — already-seeded projects then take the overwrite
> branch. `--reseed` cannot be combined with `--uninstall` / `--fix-deps` / `--patch-harness` / `--auto`.

> **Version compatibility**: the `@deepseek-ai/dsh-*` peer ranges a plugin declares must cover
> the running DSH version. DSH validates those ranges both in the install preflight (before pnpm
> runs) and at profile startup; a mismatch produces `installation rejected` and the plugin is not
> loaded. This is a declaration problem, not a code problem: upstream once left
> `^0.1.7-rc.1` (= `>=0.1.7-rc.1 <0.2.0-0`) on a `0.2.0-rc.2` runtime and got
> `installation rejected` outright. If the plugin suddenly stops working after a DSH upgrade,
> check the peer ranges first. This repository targets **DSH 0.2.2-rc.5 / Cordis 4.1.0**
> (the Cordis 4.1.0 `waterfall` tail-argument change is fixed on this branch); see
> [FORK.md](./FORK.md) for the divergence and
> [`docs/ref/dsh-0.2.0-rc.2-audit.md`](docs/ref/dsh-0.2.0-rc.2-audit.md) for the upstream audit evidence.

### 2. Configure Allowed Directories (Important)

By default, the plugin will not intercept any unconfigured workspaces. Add your target workspace directory to the allowlist:

1. Open the DSH Web UI, click the **Plugins** icon on the left sidebar, and click **dsh-trellis-sun** under the **Installed** tab to enter its detail page (the configuration form is rendered directly on the top-level plugin detail page, without needing to expand "Included Components");
2. Under **Allowed Projects (allowlist)**, add the absolute path of your workspace root directory — either type it manually or click **Browse…** to pick a folder via the system folder picker, then click Save (hot-reloaded).

> **Note**: To prevent the model from editing source code prior to plan approval, enable **Enforce Read-Only Planning (`enforceReadonlyPlanning`)** on the same detail page.

### 3. Usage

When describing complex tasks in chat, the model will guide you through creating and advancing Trellis tasks:

- **New Features**: Creates `feat-mm-dd-name`, advancing through `prd` → `design` → `impl` → `review` → `check`;
- **Bug Fixes**: Creates `issue-mm-dd-name`, advancing through `report` → `analyze` → `fix` → `fix-note`;
- **Refactoring**: Creates `refactor-mm-dd-name`, advancing through `scan` → `design` → `apply` → `done`.

To bypass workflow interception in a specific turn, include `no-trellis` in your prompt.

---

## Workflow Tracks

The plugin provides three standard tracks mapped to the task stage (`work.stage`):

| Track | Naming Pattern | Stage Progression | Description |
|---|---|---|---|
| **Feature (`feat`)** | `feat-MM-DD-name` | `prd` → `design` → `impl` → `review` → `check` | For new feature development or major functionality changes |
| **Issue (`issue`)** | `issue-MM-DD-name` | `report` → `analyze` → `fix` → `fix-note` | For bug diagnosis, fixing anomalies, and regression testing |
| **Refactor (`refactor`)** | `refactor-MM-DD-name` | `scan` → `design` → `apply` → `done` | For behavior-preserving optimizations and cleanups |

> **Spec delta**: the feat `design` stage produces both `design.md` and `spec-delta.md`, and both must be `approved` before `impl`; at archive time `dsh-trellis-sun-finish-work` merges the delta into the resident spec before committing and archiving. A quick change that touches no spec states `No delta: <reason>` instead.

---

## Key Mechanisms

### 1. Step State Machine & Verification Gates

The `steps` array in `task.json` serves as the execution list and supports 5 states:

- `pending`: Waiting to be worked on;
- `in_progress`: Actively working on the step;
- `verifying`: Implementation done, awaiting verification;
- `blocked`: Blocked by external causes (requires `blockedReason`);
- `completed`: Verified and closed.

#### Verification Modes:
- **Automated Verification (`verification: 'ai'`)**: The model must run test commands and record `verified: true` with `verificationNotes` evidence via `dsh_trellis_sun_task_update` in an initial call before the step can be marked `completed` in a subsequent call.
- **Human Approval Gate (`verification: 'human'`)**: Reserved for critical or high-risk changes. The step cannot be marked `completed` unless confirmed by the user and saved with `verifiedBy: 'human'`.
- **Completion Audit**: When closing or archiving a task, the plugin validates that all steps are completed and verified, and that the Git working tree is clean.
- **The gate only trusts persisted state**: completion checks read the `verification` and `verified` values **already on disk**. Downgrading `verification` and setting `completed` in the same call, or writing `verified: true` in that same call, is rejected — it takes two calls. Replacing `steps` wholesale is validated against the persisted list, so a `{status: 'completed', steps: []}` shortcut no longer passes.

### 2. Dual-Mode Task Board (Compact Popover & Full-Screen Board)

In the DSH Web UI, the session header phase chip provides an interactive task board with dual presentation modes:

#### Compact Popover View & Full-Screen Board
The default popover pins the active bound task at the top in a prominent card featuring a live **Step Tracker checklist** (bolding active step with acceptance criteria and collapsible completed steps), with other tasks grouped by status below. Clicking the top-right maximize icon expands it into a roomy full-screen board with `⌘K` search and a comprehensive details drawer:

<p align="center">
  <img src="./docs/images/web-kanban-list.png" width="38%" alt="Compact task popover with pinned active card" />
  &nbsp;
  <img src="./docs/images/web-kanban-lanes.png" width="59%" alt="Full-screen task board with details drawer" />
</p>

#### Workflow Filter & Comprehensive Details
Users can instantly filter by workflow type (Features / Issues / Refactors). Scoping down to a specific workflow track (such as refactoring) displays matching tasks alongside stage pipeline nodes, full step state machine status, and artifact files:

<p align="center">
  <img src="./docs/images/web-kanban-refactor.png" width="85%" alt="Refactor workflow filter with details drawer" />
</p>

- **Single-Accent Visual Language**: Workflow types are rendered in clean, uncolored text; brand blue is reserved for active session bindings and in-progress steps, while red/amber alerts appear strictly for external blockers and human verification gates.
- **Restrained Interaction**: The board serves strictly for observation and intent steering without mutating state behind the model's back. The right-hand **Advance Task** button simply injects structured prompts into the composer for the Agent to carry out.
- **Native File Navigation**: Clicking "Open" on any artifact resolves a native `@.trellis/tasks/...` reference, seamlessly opening DSH's native sidebar preview.

### 3. Read-Only Planning (Optional Enforcement)

When `enforceReadonlyPlanning: true` is configured, the plugin TRIMS ONLY the specified tools based on the current workflow state (denylist semantics — every other tool, including tools registered by other plugins, is kept):

| Authorization State | Condition | Trimmed Tools | Description |
|---|---|---|---|
| `undecided` | In allowlist, no active task, not skipped | `write` / `edit` + `dsh_trellis_sun_task_update` / `dsh_trellis_sun_artifact_update` / `dsh_trellis_sun_task_archive` / `dsh_trellis_sun_ui_update` | Removes code-write and task-write tools to avoid blindly rewriting source; `dsh_trellis_sun_task_create` / `dsh_trellis_sun_task_skip` and all other tools (including other plugins') are kept |
| `planning` | Task is in planning stages (`prd`, `design`, `scan`, `report`) | `write` / `edit` + `dsh_trellis_sun_task_create` / `dsh_trellis_sun_task_skip` / `dsh_trellis_sun_task_archive` / `dsh_trellis_sun_ui_update` | Removes generic `write` / `edit` tools and task-lifecycle tools; deliverables can only be updated through the artifact tool; `dsh_trellis_sun_task_update` / `dsh_trellis_sun_artifact_update` and all other tools are kept |
| `authorized` | Task is in implementation stages (`impl`, `fix`, `apply`) or skipped | None (no trimming) | Restores the full tool surface |

> Note: `dsh_trellis_sun_artifact_update` only permits writing whitelisted documentation inside the active task directory (`.trellis/tasks/<slug>/`), preventing path traversal.

---

### 4. Deliverables and the Artifact Whitelist

Deliverable documents in a task directory can only be written through `dsh_trellis_sun_artifact_update`, under two constraints: the file name must be whitelisted, and the path must be a direct child of the active task directory (the slug charset is defined once for the whole repo — `.`, `..` and slugs containing separators are rejected).

The whitelist has two tiers:

| Tier | Contents | Purpose |
|---|---|---|
| Current outputs (10) | `prd.md`, `design.md`, `spec-delta.md`, `review.md`, `report.md`, `analysis.md`, `fix-note.md`, `scan.md`, `refactor-design.md`, `apply-notes.md` | Each ships a template and belongs to a stage; the tool description presents these as the targets |
| Retired names (4) | `implement.md`, `checklist.yaml`, `check.md`, `design-review.md` | No current workflow produces them and their templates are pruned, but historical tasks still contain them, so they stay writable instead of turning old tasks read-only |

A contract test pins both directions: every current name ships a template, every retired name ships none and is still accepted.

### 5. spec-delta: the Spec Increment of a Change

`spec-delta.md` is authored and approved alongside `design.md`, with three kinds of entries:

- **ADDED**: a new section or bullet, naming the target file and the insertion anchor;
- **MODIFIED**: which section changes, the verbatim old text (must match the target file character for character), and the new text;
- **REMOVED**: which section goes away and the verbatim text being deleted.

With no increment, write `No delta: <reason>` — never leave it blank and never delete the file. At archive time `dsh-trellis-sun-finish-work` merges each entry mechanically: **no incidental rewriting, no "improving" the wording**. If any entry does not line up (the target changed after approval, an anchor is missing or duplicated) it stops and asks, surfacing the conflict to the user instead of merging silently. The result is recorded in the delta's merge-record section and in the developer journal.

Versus `update-spec`: a delta is an **ex ante** proposal that is merged mechanically at archive time (the spec increment of the change itself); `update-spec` captures **ex post** lessons learned during implementation.

### 6. review and check: Verifiable Inspection

**check** (`dsh-trellis-sun-check`) runs in four steps: (1) scope — the change set is computed deterministically with `git diff --name-only`, never listed from memory; (2) rules — paths are resolved through a path → rule lookup, and an unmatched path is labelled "no applicable spec" rather than inventing one; (3) coverage — every changed file gets a verdict line, and one missing file blocks sign-off; (4) fail-closed — tool failures (invalid output, non-zero exit, cancellation, truncation) are reported as errors, never as "clean".

**review** (the feat review stage plus an independent subagent) is evidence-based: pinned Git snapshot, file:line + quoted source + actual output as the only acceptable evidence, weak evidence downgraded to "suspected", stable issue ids with per-round state, and escalation to a human after 3 non-converging rounds.

**Two levels**: the per-task small review goes deep (it has the prd / design / spec-delta context); the version-freeze big review goes wide (cross-module consistency and accumulated residue, run end to end by an external OCR tool — the mechanics are copied into the skill text, the tool is not bundled).

### 7. Graph Queries (External Dependency, Optional)

The graph service itself (`codebase-memory-mcp`) is an **external dependency**: it is not bundled and not shipped with the package. The plugin only carries the behaviour layer — when to query, what to query, what to do when the query fails — in the shared `skills/_templates/graph-queries.md`, with each skill stating just its own stage's points:

- **design**: query layering and blast radius before writing `design.md` / `spec-delta.md`, and put the affected modules into the design;
- **before-dev**: query the modules involved before implementation and hand the file list and call edges to the implementer as context;
- **check**: enumerate affected packages with the graph during cross-package consistency checks instead of guessing with grep.

The only supported connection is DSH's built-in `@deepseek-ai/dsh-mcp-client` mounted natively (stdio pointing at the binary). Preconditions: `codebase-memory-mcp --version` must print a version; `cli list_projects` must start, `index_status --project` must show a recent `indexed_at`, and a re-index must move that timestamp forward. When the service is missing, has no index, or a query fails, the documented degradation path takes over (`grep` / `glob` / `read`) and the artifact must state "graph service not installed / unverified". Qt parsing precision has not been measured, so any Qt-level conclusion needs text or runtime evidence of its own.

---

## Provided Tools

The plugin registers the following specialized tools:

- **`dsh_trellis_sun_task_create`**: Creates a new task with initial `task.json`, seeds templates, and binds to the current session.
- **`dsh_trellis_sun_task_update`**: Advances task stages, updates step progress, records verification evidence, or modifies task metadata without changing the current session binding. An explicit `slug` selects only the update target; use the board's activate button to switch tasks.
- **`dsh_trellis_sun_artifact_update`**: Safely updates task deliverables. Current outputs are `prd.md` / `design.md` / `spec-delta.md` / `review.md` / `report.md` / `analysis.md` / `fix-note.md` / `scan.md` / `refactor-design.md` / `apply-notes.md`; `implement.md` / `checklist.yaml` / `check.md` / `design-review.md` are marked compatibility-only and exist for historical tasks. Paths are confined to the active task directory.
- **`dsh_trellis_sun_task_archive`**: Archives a completed task to `.trellis/tasks/archive/YYYY-MM/` and unbinds the session.
- **`dsh_trellis_sun_task_skip`**: Skips the Trellis workflow for the active session upon user approval, unlocking write tools.
- **`dsh_trellis_sun_state`**: Inspects and reports Trellis runtime state and task information for the current workspace.
- **`dsh_trellis_sun_ui_update`**: Manually refreshes the web header phase chip.

---

## Configuration Reference

Configure via the Web UI (sidebar **Plugins** icon → **dsh-trellis-sun** detail page) or in `~/.dsh/settings.yaml`:

| Key | Type | Default | Description |
|---|---|---|---|
| `allowlist` | `string[]` | `[]` | **Project Allowlist**: Absolute paths of enabled workspace roots. Empty disables interception |
| `enforceReadonlyPlanning` | `boolean` | `false` | **Read-Only Planning**: Strips code modification tools during planning stages when enabled |
| `injectSpecIndex` | `boolean` | `true` | **Inject project docs**: when `.trellis/doc.json` exists, injects the document **bodies** listed in `files` (caps come from the two injection-budget keys below; anything cut is truncated and marked with its path); without it, the legacy `.trellis/spec/` index scan is preserved |
| `docFileBudgetKB` | `number` | `8` | **Per-file injection budget (KB)**: how many KB of one document body may be injected, hard cap 128KB; a project can override it via `budgets.fileKB` in `.trellis/doc.json` |
| `docTotalBudgetKB` | `number` | `32` | **Total body injection budget (KB)**: how many KB of bodies may be injected in total, hard cap 512KB; a project can override it via `budgets.totalKB` in `.trellis/doc.json` |
| `skipKeywords` | `string[]` | `['no-trellis']` | **Skip Keywords**: Suppresses the per-turn breadcrumb and interception when the user message contains one of these words. The session-level prompt sections (`injectSpecIndex` / `enforceReadonlyPlanning`) are not suppressed per turn — turn them off with their own switches |
| `injectStep` | `number` | `1` | Breadcrumb prompt injection step index (default: first step of turn) |
| `inline` | `boolean` | `false` | Enables codex-inline style phase dispatch |

---

## Project Documentation Entry

A project can declare the Markdown files Trellis should read in `.trellis/doc.json`:

```json
{
  "root": ".trellis/spec",
  "files": [
    ".trellis/spec/guides/index.md",
    ".trellis/spec/trellis-workflow/task-engine/index.md"
  ],
  "budgets": { "fileKB": 16, "totalKB": 64 }
}
```

- `files`: the runtime injection whitelist. Every entry is a project-relative Markdown file path. Multiple files are supported, injected in order, and deduplicated. **Bodies are injected**, not paths.
- `budgets` (optional): this project's own injection budget in KB — write only the field you want to override. Precedence: **`budgets` in `doc.json` > the `docFileBudgetKB` / `docTotalBudgetKB` settings > built-in 8KB / 32KB**, with hard caps of 128KB per file and 512KB in total (out-of-range values are clamped). `0`, negative numbers or non-numbers count as "not configured" and fall through to the next source.
- **Budgets**: per-file and total caps (default 8KB / 32KB, UTF-8 bytes). Anything over the budget is truncated and marked `truncated / over budget — read <path>` so the model can fetch the rest; unreadable files are marked with their path too. The prompt header echoes the caps actually in effect.
- `root`: Skill metadata only. `dsh-trellis-sun-spec-bootstrap` and `dsh-trellis-sun-update-spec` use it as the default documentation root for discovery and updates. It neither prefixes nor filters `files`, and changing it never changes runtime injection.
- Without `.trellis/doc.json`, the legacy `.trellis/spec/` scan is preserved (index only, no bodies). Once explicitly configured, unlisted legacy Specs are no longer injected.
- An invalid explicit config produces a short repair diagnostic instead of silently falling back to the legacy tree.
- Add any new long-lived injected document to `files`. Existing Docs projects can use the migration branch of `dsh-trellis-sun-spec-bootstrap`; new projects use its initialization branch.
- **Visual editor**: switch to **"Project docs"** in the conversation's top-level view bar (next to Chat / Trajectory / Git) to view and edit the current project's `.trellis/doc.json`: add, remove and reorder files, edit the project's own "Injection budget" (per-file / total KB — blank inherits the plugin setting, an invalid value is marked inline and blocks saving), see each file's injection status (full body / truncated to the effective cap / path only) and budget usage, and seed a first draft from the existing `.trellis/spec` index when nothing is configured. A save takes effect on the very next injection — no restart.

---

## Repository Structure

```text
dsh-trellis-sun/
├── lib/
│   ├── index.js            # Plugin entry: registers pre-step hooks, tool filtering, and API routes
│   ├── task.js             # Task engine: step state machine, verification gates, and audits
│   ├── skills.js           # Skills provider: provisions workflow skills and artifact templates, prunes retired templates
│   ├── breadcrumb.js       # Context builder: extracts focused steps and formats prompts
│   ├── readonly.js         # Authorization logic: undecided / planning / authorized states
│   ├── spec.js             # Spec index: reads the .trellis/doc.json files whitelist and injects bodies within budget
│   ├── state.js            # State resolution: stage inference, session pointers, slug charset checks
│   ├── artifact.js         # Sandboxed writes: tiered whitelist (current outputs / retired names) and path safety
│   ├── archive.js          # Archiving logic: completion validation, directory migration, Git checks
│   ├── git.js              # Git checks: working-tree cleanliness and pinned snapshots (read-only, degrades safely)
│   ├── board.js            # Kanban data: aggregates active tasks and archive buckets
│   ├── client.js           # Web client: phase chip, dual-mode board (compact popover + full-screen board), and settings panel
│   ├── meta.js             # Plugin identity, config schema, and default allowlist
│   ├── resolve.js          # Project resolution: decides "trellis-active" from the session cwd (pure path handling)
│   ├── settings.js         # Settings wiring: Loader-entry driven Config form read/write
│   ├── trust.js            # Local browser-trust fence for the Web read-only API (not an auth layer)
│   └── types/index.d.ts    # TypeScript type definitions
├── scripts/
│   ├── install.mjs         # Install/wiring CLI: --reseed, --project, --fix-deps, --patch-harness
│   └── extract-changelog.mjs  # Extracts one release's bilingual body from CHANGELOG
├── skills/                 # 15 bundled workflow skills + _templates/ (stage templates, work-types and graph-queries protocols)
├── docs/images/            # Screenshots and architecture diagrams
└── test/                   # Automated unit test suite (node --test)
```

---

## License & Acknowledgements

- Licensed under the [MIT License](./LICENSE);
- Thanks to [Trellis](https://github.com/mindfold-ai/trellis) (Mindfold) for the conceptual foundation of stage specifications and breadcrumb injection;
- Thanks to [CodeStable](https://github.com/codestable/CodeStable) for the three standard workflow track classifications;
- Thanks to [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) for the modern, extensible agent runtime.
