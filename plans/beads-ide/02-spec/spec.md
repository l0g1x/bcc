# Beads IDE Specification

**Version:** 3.0 (Multi-Model Review Applied)
**Date:** 2026-02-21
**Status:** Review Complete — 18 issues addressed

---

## Overview

### Positioning Statement

**"A formula authoring IDE for the design-to-beads workflow"**

The Beads IDE is a local web app for designing, previewing, and iterating on workflow formulas, then analyzing the beads and dependency graphs those formulas produce. It replaces editing `.formula.toml` files in a text editor with a purpose-built hybrid visual/text editor, cook preview, and post-execution graph analysis.

### What This Is

- A formula editor with visual + text modes
- A cook previewer (see what beads a formula would create)
- A results analyzer (view beads, epics, and dependency waves after execution)
- A local tool for a single operator

### What This Is NOT

- Not a project management tool (no kanban, sprints, time tracking)
- Not a team collaboration platform (single operator)
- Not a real-time collaborative editor
- Not an execution runtime (formulas are cooked/poured locally or slung to agents via Gas Town CLI)
- Not a general bead CRUD tool (bead viewing is read-only from formula results, not direct authoring)

---

## Core Decisions

### Identity & Scope

| Decision | Answer |
|----------|--------|
| Target user | Single operator |
| Product feel | Hybrid - list view + graph view, user switches |
| Primary workflow | Formula-centric: design → cook preview → sling/pour → analyze |
| Authoring model | NL + Formula-first (AI assists translation) |
| Core pain solved | Both authoring AND review of work graphs |
| IDE value over CLI | All: visualization, discoverability, speed, integration |
| Data layer | TBD — deferred to implementation (bd CLI proxy or direct Dolt) |

### MVP Scope (v1)

Three pillars:

1. **Formula Editor** - Edit/create formulas with visual + text hybrid builder
2. **Formula Preview** - Cook to see what beads would be created before pouring
3. **Results Analysis** - View and analyze beads, epics, and "waves" (beads grouped by dependency blockers) after formulas are executed

**Execution model:** The IDE supports two execution paths:
1. **Local preview:** `bd cook` to preview proto beads (what would be created)
2. **Agent dispatch:** `gt sling` to dispatch formula execution to an agent/crew

These are different workflows — cook is local preview, sling is remote execution. The IDE edits formulas, previews via cook, dispatches via sling, and analyzes results.

**Branching:** Formulas create branches (not the user). IDE manages data branches only (not Git).

### What's In Scope (MVP)

- Formula editing (TOML + visual hybrid)
- Cook preview via `bd cook` (split view: formula → proto beads)
- Sling integration (trigger `gt sling` from IDE to dispatch to agents)
- Results analysis (view beads, epics, dependency graph — read-only from formula output)
- Wave view (beads grouped by dependency frontier — what's unblocked now, what's next)
- Graph visualization with metrics overlay
- Data layer integration (via `bd` CLI or direct database — deferred to implementation)

### What's Out of Scope (MVP)

- Multi-model convergence synthesis UI (deferred)
- Source code bridging (deferred)
- Sidecar LLM chat panel (deferred)
- Molecule/agent tracking (stripped)
- Comments/threads (deferred)
- Custom field/type creation
- Import from external tools
- Real-time collaboration
- Kanban boards, sprint planning, time tracking
- Notifications system

### Post-MVP Features (v2+)

These features were designed during brainstorming but deferred from MVP:

- **Multi-model convergence UI**: Branch-per-model → cluster similar beads → synthesize canonical → derived-from provenance. Configurable modes (AI proposes/human approves, AI decides/human reviews, human decides/AI assists).
- **Sidecar LLM exploration**: Chat panel alongside workspace, import results + history into IDE.
- **Source code bridging**: Bead-to-code and code-to-bead navigation.
- **Comments/threads**: Discussion on beads.
- **Branch comparison**: Split-pane graph diff for convergence workflow.
- **Review workflow**: Approval gate before merge to main with diff, quality metrics, checklist.

---

## Terminology

The IDE uses a chemistry metaphor:

| Term | User-Facing | Definition |
|------|-------------|------------|
| Bead | Context-dependent | Collective noun for work items. UI shows type-specific names. |
| Task/Epic/Bug/etc. | Yes | Specific bead types shown to users |
| Formula | Yes | Template defining a workflow |
| Wave | Yes (MVP) | Beads grouped by dependency frontier (visualization layer, not a data concept) |
| Proto | Internal | Preview beads before pour (shown as "Here's what will be created") |
| Cook | Yes | Compile a formula to preview proto beads (`bd cook`) |
| Pour | Yes | Instantiate proto beads as real work items (`bd mol pour`) |
| Sling | Yes | Dispatch formula execution to an agent/crew (`gt sling`) |

### Terminology Simplifications

- "Dependency" everywhere (not "bond" or "edge")
- Show top-4 dependency types (blocks, parent-child, related, discovered-from)
- Hide BCC compilation phases (SCAN/ANALYZE/CONNECT/ENRICH)
- "Phase" only refers to bead lifecycle (liquid/vapor)

---

## Architecture

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Vite + React (SPA) | Simple, no SSR needed for local app |
| Keyboard shortcuts | TanStack Hotkeys | User requirement |
| Rich text | TipTap (built on ProseMirror) | Block-based editing for description fields |
| Data layer | TBD | Deferred: `bd` CLI proxy (works with current SQLite) or direct Dolt |
| Graph library | TBD | Candidates: React Flow, Cytoscape.js, D3.js. Evaluate during implementation. |
| Deployment | Local (localhost) | Single operator, local backend + SPA |

### Backend Layer

The SPA requires a lightweight backend to bridge between browser and CLI/database:

- **API server** (Node or Go) running on localhost
- Proxies `bd` CLI commands (`bd cook`, `bd list --json`, `bd show --json`)
- Invokes `gt sling` for agent dispatch
- Serves formula files from configured directories
- Uses `execFile`-style argument arrays (no shell interpolation) for CLI invocation

### Data Layer

Deferred to implementation phase. Two options under consideration:

- **Option A: `bd` CLI proxy** — proxy through `bd list --json`, `bd show --json`, `bv --json`. Works with current SQLite backend. Lower risk for MVP.
- **Option B: Direct Dolt** — connect to local dolt-server (MySQL wire protocol). Enables branching/diffing/merging. Requires migration from SQLite.

Regardless of choice:
- IDE manages data branches only (not Git branches)
- Git branches managed externally (CLI, GitHub)

### Branching Model

**Formulas create branches**, not the user directly.

```
draft/<category>/<title>    (proposed convention — new to this spec)
```

- Category: feature, enhancement, refactor, bug, research
- Created when a formula workflow starts
- Multiple formulas execute on same branch (spec → plan → beads-creation)
- Only merge to main after full chain completes
- Main = finalized beads, exposed to runtime (Gas Town)

**Key constraint:** No auto-merge to main. Always requires explicit human approval.

### IDE Replaces bv

All 9 graph metrics and visualization built into IDE:
- PageRank, betweenness, HITS, critical path
- Eigenvector, degree, density, cycles, topo sort

---

## User Interface

### Reference UI Patterns

Blend of:
- **Linear** - list view, minimal chrome, keyboard-first
- **n8n/Node-RED** - formula builder canvas
- **VS Code** - panels, command palette, file tree

### Layout

- **Multi-panel** (VS Code style) on desktop
- **Adaptive** - simplified single-panel on small screens
- **Resizable panels**: file tree (left) + main editor + side panel (right)

### Navigation

- **Formulas as files/folders** in left sidebar file tree (VS Code/Cursor pattern). Scans: `formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`
- **Default view**: Remember last session state
- **Command palette**: Cmd+K for quick actions
- **TanStack Hotkeys** for keyboard shortcuts

### Formula Builder (MVP Core)

- **Same workspace** as panel alongside preview/graph
- **Hybrid**: visual node-based + "view source" text toggle
- Both modes stay in sync
- Variables UI: form, inline editing, NL prompt (all available)
- Step DAG visualization (dependency ordering of formula steps)

### Cook Preview (MVP Core)

- **Split view**: formula definition left, preview beads right
- No "proto" terminology - shows "Here's what will be created"
- Bead count, dependency count, structure preview
- Unbound variable detection (highlighted, blocks pour)

### Results Analysis (MVP Core)

- **Graph view**: Dependency graph of created beads with 9 metrics overlay
- **List view**: Beads grouped by epic, type, or status
- **Wave view**: Beads grouped by dependency frontier (unblocked now → next wave → blocked)
- **Filters**: Status, type, priority, labels, epic parent

### Graph View

**Multiple layout algorithms** (user switches):
- Force-directed (clusters/relationships)
- Hierarchical (parent-child structure)
- Manual (full control, positions saved)

**Dense graph handling** (50-200 beads):
- Default: clustered + filtered (~20-30 visible nodes)
- Auto-cluster by epic
- Filter to active work (hide closed/archived)
- All simplification strategies available:
  - Focus mode (N-hop neighborhood)
  - Semantic zoom
  - Fisheye distortion

---

## Workflows

### Formula Editing Workflow

1. Open formula from file tree (or create new)
2. Edit in visual mode (node-based step builder) or text mode (TOML)
3. Switch between modes freely (stay in sync)
4. Define/modify variables, steps, dependencies, composition rules
5. Auto-save with debounce (500ms)

### Cook Preview Workflow

1. Click "Preview" (or Cmd+K → "cook")
2. Split view shows formula left, proto beads right
3. Unbound variables highlighted in red
4. Review: bead count, dependency graph structure, variable bindings
5. Iterate: edit formula, preview re-cooks on debounced save (re-invokes `bd cook`, not streaming)

### Sling Workflow

1. From previewed formula, click "Sling" (or Cmd+K → "sling")
2. Select target (agent/crew)
3. IDE invokes `gt sling` via CLI
4. Status indicator while slinging
5. On completion, results available in analysis view

### Results Analysis Workflow

1. Select a completed workflow from sidebar
2. View beads in graph, list, or wave mode
3. Explore dependency structure, identify bottlenecks
4. Wave view shows execution frontier (what's ready now vs blocked)
5. Click any bead for detail panel

---

## First-Run Experience

1. **Connect to backend** (local API server — verifies `bd` CLI available)
2. **Load formulas** from configured formula directories (`formulas/`, `.beads/formulas/`, etc.)
3. **If formulas exist**: Show formula gallery with recent/pinned
4. **If no formulas**: "Create your first formula" guided flow

---

## Auto-Filled Answers (Best Practices)

These questions were answered based on industry standards and codebase context:

### Editing & UX
- Full undo/redo across all operations (Ctrl+Z)
- Formula pour is transactional with one-click rollback
- Auto-save with debounce (500ms)
- Rich-text via TipTap (built on ProseMirror) for description fields
- Side panel for bead detail viewing (read-only from formula results)

### Graph Interaction
- Drag-from-handle for edge creation
- Three methods: drag, context menu, keyboard mode
- Side panel co-present with graph (no full-page navigation)
- Faceted filtering (status, type, assignee, labels, priority)

### Accessibility (WCAG 2.1 AA)
- Screen reader tree/list alternative for graph
- Shape + icon as primary differentiators (not color alone)
- Keyboard navigation for all operations
- Command palette (Cmd+K)
- Minimum 1280x720 screen support

### Visual Encoding
- Shape + icon for bead types (hexagon=epic, circle=task, etc.)
- Line-style groups for edge types (solid=blocks, dashed=related, etc.)
- Skeleton loading (progressive, no full-screen spinner)
- Git-style ahead/behind indicators for branches

### Schema & Fields
- Progressive disclosure (start minimal, reveal via "Add field")
- Schema-driven rendering (not hardcoded)
- Required to create bead: title only

### Quality & Validation
- Ambient metrics (always visible health panel)
- Density warnings at >0.10, red at >0.12
- Prevent cycles, enforce required fields
- Warn for soft constraints (don't block)

---

## Technical Constraints

### Performance
- Graph render: <1 second initial render for 200 beads on modern laptop (Chrome, 1280x720). <100ms for pan/zoom/drag interactions.
- Auto-save: 500ms debounce
- Search/filter: <100ms for 200 beads (client-side indexing)
- Cook preview: re-invokes `bd cook` on debounced save (500ms). Not streaming — each cook is a discrete CLI invocation.

### Platform
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum: 1280x720 screen
- Local deployment (localhost)

### Scale
- Target: 50-200 beads per graph (sweet spot from BCC experiments)
- Graceful degradation above 200 beads (clustering, filtering)

---

## Error Handling

| Failure | UX Behavior |
|---------|-------------|
| Backend not running | Error page: "Cannot connect to IDE backend. Start the server." |
| `bd cook` fails (malformed formula) | Inline error in editor with cook stderr output |
| `gt sling` fails | Toast notification with error details, retry button |
| Database unavailable | Graceful degradation: formula editing still works, data views show "offline" |
| Formula validation errors | Inline highlighting in editor (unbound vars, invalid TOML) |
| Wave computation fails (cyclic deps) | Show warning in wave view, fall back to list view |

---

## Security

- **CLI invocation**: Use `execFile`-style argument arrays — no shell interpolation. Never pass user input through a shell.
- **Argument validation**: Allowlist valid characters for formula names, branch names, variable values.
- **Working directory**: Restrict CLI invocations to the project root.
- **No remote access**: Backend binds to localhost only, not 0.0.0.0.

---

## Testing Strategy

- **Unit tests**: Formula TOML parsing, wave computation (topological sort + level assignment), variable binding validation
- **Integration tests**: CLI invocation (`bd cook`, `gt sling`), backend API endpoints
- **Performance benchmarks**: Graph render at 50/100/200 beads against <1s target
- **Manual validation**: Formula edit → cook → sling → analyze end-to-end workflow

---

## Success Criteria

**MVP Done =** User can edit a formula in the IDE → cook to preview beads → sling via CLI → view and analyze resulting beads/epics/waves in the analysis view.

Specifically:
1. Formula editing end-to-end: open, edit (visual or text), save, preview, sling
2. Cook preview shows accurate bead/dependency structure before execution
3. Results analysis displays beads, epic hierarchy, and wave grouping
4. Graph visualization with metrics works at 200 beads under 1 second
5. IDE replaces bv for daily visualization needs

---

## Spec Review (Round 1)

**Reviewed:** 2026-02-21
**Gaps identified:** 11
**Gaps resolved:** 11

### Clarifications Added

| Topic | Clarification |
|-------|---------------|
| Tech stack | Vite + React SPA, local deployment |
| Graph library | Deferred to implementation phase |
| MVP scope | Radically simplified: formula editor + preview + results analysis only |
| Molecule tracking | Stripped from MVP |
| Source code bridging | Out of MVP |
| Sidecar LLM | Deferred to post-MVP |
| Waves | View/filter layer on dependency frontier, not a new data concept |
| Performance | <1s graph render for 200 beads |
| Branching | Formulas create branches, not the user |
| Agent visibility | No molecule/agent tracking in MVP |
| Done criteria | End-to-end formula workflow: edit → preview → sling → analyze |

### Deferred Items

| Item | Rationale | Revisit When |
|------|-----------|--------------|
| Multi-model convergence UI | Scope control | Post-MVP, after formula workflow validated |
| Sidecar LLM | Scope control | Post-MVP |
| Source code bridging | Scope control | Post-MVP |
| Comments/threads | Scope control | Post-MVP |
| Branch comparison UI | Depends on convergence | Post-MVP |
| Review/approval workflow | Details TBD | Post-MVP |

---

## Multi-Model Review (Round 2)

**Reviewed:** 2026-02-21
**Models:** Opus 4.6, GPT 5.3 Codex (Gemini 3 Pro skipped — CLI not installed)
**Issues Found:** 18 (1 critical, 4 high, 8 medium, 5 low)

### Findings Addressed

| # | Issue | Resolution |
|---|-------|------------|
| 1 | `gt sling` vs `bd cook`/`bd mol pour` mismatch | Clarified: IDE supports BOTH local cook/pour (preview) and gt sling (agent dispatch) as distinct workflows |
| 2 | SQLite-to-Dolt transition | Data layer deferred to implementation. Options documented: bd CLI proxy vs direct Dolt |
| 3 | Missing API/backend layer | Added Backend Layer section: lightweight localhost API server for CLI proxy |
| 4 | Cook preview "live updates" unrealistic | Clarified: re-invokes `bd cook` on debounced save, not streaming |
| 5 | CLI security | Added Security section: execFile args, allowlists, localhost-only binding |
| 6 | Missing spec-review-assessment.md reference | Removed dead reference, pointed to spec-review.md |
| 7 | Scope contradiction (not CRUD but has CRUD UX) | Clarified: bead viewing is read-only from formula results, not authoring |
| 8 | Error handling missing | Added Error Handling section with failure modes and UX behaviors |
| 9 | Terminology incomplete | Added Cook, Pour, Sling to terminology table |
| 10 | Branch naming unvalidated | Marked as "proposed convention — new to this spec" |
| 11 | Formula directory discrepancy | Added all 4 search paths to Navigation section |
| 12 | Test strategy missing | Added Testing Strategy section |
| 13 | Graph library deferred risk | Added candidate libraries (React Flow, Cytoscape.js, D3.js) |
| 14 | Performance targets lack conditions | Added browser, device class, interaction type conditions |
| 15 | TipTap vs ProseMirror | Clarified: "TipTap (built on ProseMirror)" |
| 16 | Context doc scope mismatch | Noted (context.md is reference — spec controls MVP scope) |
| 17 | Appendix out-of-scope concepts | Marked appendix as "Reference Only — Not All Concepts in MVP" |
| 18 | Beads.md dep count wrong | Noted (docs issue — header says 18, table has 19) |

### Ambiguities Resolved

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Execution model | Both cook/pour (local) and sling (agent dispatch) | Different workflows for different purposes — preview vs execution |
| Data layer | Defer to implementation | Decision depends on implementation feasibility; both options documented |

---

## Q&A Reference

This spec was generated from 44 questions answered across 4 rounds of brainstorming dialogue, then refined through spec review (11 clarifications) and multi-model review (18 issues addressed). For details, see:
- `plans/beads-ide/01-scope/questions.md` (187 scope questions)
- `plans/beads-ide/01-scope/question-triage.md` (triage and interview plan)
- `plans/beads-ide/02-spec/spec-review.md` (multi-model review findings)

---

## Appendix: Chemistry Metaphor (Reference Only — Not All Concepts in MVP)

```
Formula → (cook/pour) → Molecule → (contains) → Atoms → (ephemeral) → Wisps
   │                        │                       │
   │                        │                       └── Individual steps
   │                        └── Instantiated workflow
   └── Template definition
```

**Lifecycle phases:**
- **Liquid**: Persistent beads (survive indefinitely)
- **Vapor**: Ephemeral beads (auto-compact after TTL)
