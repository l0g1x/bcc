# Beads Draft: beads-ide

**Generated:** 2026-02-21
**Source:** plans/beads-ide/03-plan/plan.md
**Plan review status:** Reviewed

---

## Structure

### Feature Epic: beads-ide

**Type:** epic
**Priority:** P1
**Description:** The Beads IDE is a greenfield local web application for designing, previewing, and analyzing workflow formulas and the beads they produce. It replaces editing `.formula.toml` files in a text editor with a purpose-built IDE featuring a formula editor, cook preview, and post-execution results analysis. The implementation follows a two-process architecture: a Vite + React SPA (frontend) and a lightweight Node.js API server (backend) that proxies `bd`/`gt`/`bv` CLI commands. There is no existing UI code in the BCC project — this is a net-new build. The `openedi` project at `/home/krystian/gt/deacon/dogs/bravo/openedi/` provides the reference architecture for component patterns, styling, and tooling conventions.

---

### Sub-Epic: Phase 1 — Foundation & Shared Infrastructure

**Type:** epic
**Priority:** P1
**Parent:** Feature epic
**Description:** Project scaffolding, shared types, build tooling — everything needed before feature work begins. Establishes the npm workspaces monorepo, TypeScript types derived from `docs/beads.md` and `docs/formulas.md`, the secure CLI wrapper, wave computation algorithm, Vite frontend skeleton, and Hono backend server.

**Exit Criteria:**
- Both dev servers start (`npm run dev` from workspace root starts frontend + backend)
- Health check passes
- Shared types importable from both apps
- All unit tests pass (CLI wrapper, wave computation)
- Biome lint clean

#### Issue: Initialize project scaffolding (1.1)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** None
**Description:**
Create the npm workspaces monorepo with frontend, backend, and shared packages for the Beads IDE project. The project lives in a `beads-ide/` subdirectory in the crew workspace, collocated with the formulas it edits. The `openedi` project at `/home/krystian/gt/deacon/dogs/bravo/openedi/` is the reference for Biome config and TypeScript conventions.

Files to create:
- `beads-ide/package.json` — workspace root with `"workspaces": ["apps/*", "packages/*"]`
- `beads-ide/apps/frontend/package.json` — Vite + React deps
- `beads-ide/apps/backend/package.json` — Hono + Node deps
- `beads-ide/packages/shared/package.json` — shared types package
- `beads-ide/biome.json` — single quotes, no semicolons, 2-space indent, 100-char width
- `beads-ide/tsconfig.base.json` — strict mode, ES2022, bundler resolution

Key details: Follow openedi's Biome config. Enable `useImportType`, `noNonNullAssertion`, `noExplicitAny`. Set up TypeScript project references between packages.

**Acceptance Criteria:**
- [ ] `npm install` succeeds from workspace root
- [ ] `npm run typecheck` passes across all packages
- [ ] `npm run lint` (Biome) passes with zero errors

---

#### Issue: Define shared TypeScript types (1.2)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.1 (Initialize project scaffolding)
**Description:**
Create all shared TypeScript type definitions for the Beads IDE. Types are derived from `docs/beads.md` (Go `Issue` struct, lines 17-75) and `docs/formulas.md` (Go `Formula` struct, lines 1-250) and must match the actual JSON output shape of `bd list --json` and `bd show --json`.

Files to create:
- `beads-ide/packages/shared/src/types.ts` — core domain types: `Bead`, `BeadStatus`, `BeadType`, `Dependency`, `DependencyType`, `Formula`, `VarDef`, `Step`, `Gate`, `LoopSpec`, `OnCompleteSpec`, `ComposeRules`
- `beads-ide/packages/shared/src/ide-types.ts` — IDE-specific types: `Wave`, `GraphNode`, `GraphMetrics`, `GraphStats`, `FormulaFile`, `CookResult`, `ApiResponse`, `CliInvocation`, `SessionState`, `BeadsIDEConfig`
- `beads-ide/packages/shared/src/index.ts` — barrel export for all types

Key details: Types are the single source of truth consumed by both frontend (all components) and backend (route handlers, CLI response parsing). Derive all type definitions directly from `docs/beads.md` lines 17-75 (Go `Issue` struct → `Bead` type, status/type enums, dependency struct) and `docs/formulas.md` lines 1-250 (Go `Formula` struct → `Formula` type, `VarDef`, `Step`, `Gate`, etc.). Run `bd list --json | head -1` and `bd show <any-id> --json` to verify type shapes match actual CLI output.

**Acceptance Criteria:**
- [ ] All types compile with strict TypeScript
- [ ] Types match actual `bd list --json` output (verify with a manual JSON sample)
- [ ] Types exported and importable from both frontend and backend

---

#### Issue: Implement CLI wrapper with security (1.3)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.1 (Initialize project scaffolding)
**Description:**
Create a secure backend utility for invoking `bd`, `gt`, and `bv` CLI commands without shell injection vulnerabilities. This wrapper is used by all backend route handlers.

Files to create:
- `beads-ide/apps/backend/src/cli.ts` — `execFile` wrapper with allowlist validation
- `beads-ide/apps/backend/tests/cli.test.ts` — unit tests

Key details:
- Use Node.js `child_process.execFile` (NOT `exec`) — no shell interpolation
- Validate inputs: formula names against `^[a-zA-Z0-9_.-]+$`, variable keys against `^[a-zA-Z0-9_]+$`, variable values against `^[^\x00-\x1f]+$` (no control chars)
- Set `cwd` to project root where `.beads/redirect` resolves
- Default timeout: 30s; cook timeout: 60s
- Return `{ stdout, stderr, exitCode }`
- **CLI flag verification (prerequisite for 2A.1/2A.3):** Run `bd cook formulas/explore-module.formula.toml --json` and check if stdout is valid JSON. Run `bv --export-graph - --output-format json` and check if stdout is JSON (not HTML). If `--json` flag is not recognized by `bd cook`, fallback: parse the plain-text stdout from `bd cook` line-by-line. If `--output-format json` is not supported by `bv --export-graph`, fallback: `bv` may write an HTML file — parse the graph data from the HTML or use `bv --robot-insights --output-format json` only. Document findings in `beads-ide/docs/cli-flags.md`.

**Acceptance Criteria:**
- [ ] Rejects formula names with shell metacharacters (`;`, `|`, `&`, `` ` ``, `$`)
- [ ] Uses `execFile` not `exec` (no shell)
- [ ] Tests cover: valid invocation, rejected input, timeout, non-zero exit
- [ ] CLI flag verification: confirm `bd cook --json` and `bv --export-graph --output-format json` produce expected output

---

#### Issue: Implement wave computation (1.4)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.2 (Define shared TypeScript types)
**Description:**
Create the topological sort and level assignment algorithm that groups beads into dependency frontiers ("waves"). This is a shared computation used by the frontend WaveView component and potentially the backend for pre-computation.

Files to create:
- `beads-ide/packages/shared/src/wave.ts` — `computeWaves(beads: Bead[]): WaveResult`
- `beads-ide/packages/shared/tests/wave.test.ts` — unit tests with fixtures
- `beads-ide/packages/shared/tests/fixtures/` — test dependency graphs (linear, diamond, cyclic, disconnected)

Key details:
- Filter dependencies to workflow types only: `blocks`, `parent-child`, `conditional-blocks`, `waits-for`
- Algorithm: BFS from zero-in-degree nodes
- Detect cycles via remaining nodes after BFS completes
- Return `{ waves: Wave[], cycles: string[][], hasCycles: boolean }`

**Acceptance Criteria:**
- [ ] Linear chain A→B→C produces 3 waves
- [ ] Diamond pattern produces correct parallelism (B and C in same wave)
- [ ] Cyclic graph detected, returns cycle members, `hasCycles: true`
- [ ] Empty input returns empty waves
- [ ] 200 beads computes in < 50ms

---

#### Issue: Set up Vite frontend skeleton (1.5)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.1 (Initialize project scaffolding)
**Description:**
Create a minimal React application with TanStack Router, Tailwind CSS v4, and the app shell structure. This skeleton is the foundation for all frontend feature work. Follow openedi's Vite config pattern at `/home/krystian/gt/deacon/dogs/bravo/openedi/`.

Files to create:
- `beads-ide/apps/frontend/vite.config.ts` — dev server on port 5173, proxy `/api` → `localhost:3001`, `@/` path alias
- `beads-ide/apps/frontend/src/main.tsx` — React root + TanStack Router + Sonner Toaster
- `beads-ide/apps/frontend/src/app.css` — Tailwind v4 imports, `brand-*` CSS variables, dark mode
- `beads-ide/apps/frontend/src/routes/__root.tsx` — root layout (placeholder shell)
- `beads-ide/apps/frontend/src/routes/index.tsx` — landing page (placeholder)
- `beads-ide/apps/frontend/src/lib/utils.ts` — `cn()` utility (clsx + twMerge)
- `beads-ide/apps/frontend/src/lib/api.ts` — typed fetch wrapper returning `ApiResponse<T>`
- `beads-ide/apps/frontend/tsconfig.json` — extends base config, includes path aliases

Key details: Named exports only (no default exports). Biome for formatting/linting. The `api.ts` fetch wrapper handles connection errors globally using the `ApiResponse<T>` envelope pattern.

**Acceptance Criteria:**
- [ ] `npm run dev` starts frontend on localhost:5173
- [ ] Root route renders a placeholder page
- [ ] Tailwind styles apply (dark mode works)
- [ ] API proxy forwards `/api/*` to backend

---

#### Issue: Set up backend API server (1.6)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.1 (Initialize project scaffolding), Task 1.3 (Implement CLI wrapper with security)
**Description:**
Create the Hono HTTP server that serves as the backend for the Beads IDE. The server proxies CLI commands and exposes a typed REST API to the frontend. It must bind to `127.0.0.1` only (not `0.0.0.0`) per spec security requirements.

Files to create:
- `beads-ide/apps/backend/src/index.ts` — Hono app, bind `127.0.0.1:3001`, register routes
- `beads-ide/apps/backend/src/config.ts` — load formula search paths, CLI binary locations, project root detection
- `beads-ide/apps/backend/src/routes/health.ts` — `GET /api/health` verifies `bd` CLI is available
- `beads-ide/apps/backend/tsconfig.json` — extends base TypeScript config

Key details:
- Use `@hono/node-server` for the Node.js runtime adapter
- Config resolves formula search paths in order: `formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`; skip missing directories gracefully
- `GET /api/health` returns `{ ok: true, bd_version: "..." }`
- `GET /api/config` returns `{ formula_paths: [...], project_root: "...", ... }`

**Acceptance Criteria:**
- [ ] `npm run dev` starts backend on localhost:3001
- [ ] `GET /api/health` returns `{ ok: true, bd_version: "..." }`
- [ ] `GET /api/config` returns `{ formula_paths: [...], project_root: "...", ... }`
- [ ] Server does NOT bind to 0.0.0.0 (verify with `netstat`)
- [ ] Config correctly resolves formula search paths

---

### Sub-Epic: Phase 2 — Backend API + Frontend Shell

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Complete backend API routes and frontend application shell in three parallel tracks: Track A builds the backend REST API routes for formulas, beads, and graph data; Track B builds the VS Code-style multi-panel layout, formula file tree, and command palette; Track C benchmarks graph rendering libraries to select one capable of handling 200 nodes under the performance target.

**Exit Criteria:**
- All backend API routes respond correctly with real BCC data
- App shell renders with sidebar, main panel, resizable layout
- Formula tree shows actual formulas from search paths
- Command palette opens with Cmd+K
- Graph library selected with benchmark evidence

#### Issue: Formula routes (2A.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.2 (Define shared TypeScript types), Task 1.3 (Implement CLI wrapper with security), Task 1.6 (Set up backend API server)
**Description:**
Implement the backend REST API routes for formula CRUD, cook, and sling operations. All CLI invocations use the `cli.ts` wrapper from `beads-ide/apps/backend/src/cli.ts` with full input validation.

Files to create:
- `beads-ide/apps/backend/src/routes/formulas.ts` — formula route handlers
- `beads-ide/apps/backend/tests/routes/formulas.test.ts` — integration tests

Endpoints:
- `GET /api/formulas` — scan all configured search paths (`formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`), return `FormulaFile[]` with name, path, directory
- `GET /api/formulas/:name` — read and return formula TOML content + parsed structure
- `PUT /api/formulas/:name` — write formula TOML to disk (target for auto-save)
- `POST /api/formulas/:name/cook` — invoke `bd cook <path> --json`, return `CookResult`
- `POST /api/formulas/:name/sling` — invoke `gt sling <formula> <target>`, return status

Key details: Formula names validated against `^[a-zA-Z0-9_.-]+$` before any CLI invocation. Invalid names return 400 with error message.

**Acceptance Criteria:**
- [ ] List returns formulas from all 4 search paths
- [ ] Cook returns proto beads JSON or error with stderr
- [ ] Sling invokes `gt sling` with validated arguments
- [ ] Invalid formula names rejected (400 with error message)

---

#### Issue: Bead routes (2A.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.2 (Define shared TypeScript types), Task 1.3 (Implement CLI wrapper with security), Task 1.6 (Set up backend API server)
**Description:**
Implement read-only backend API routes that proxy `bd` CLI commands to expose bead data to the frontend. All responses are parsed into the typed `Bead[]` / `Bead` shapes defined in `beads-ide/packages/shared/src/types.ts`.

Files to create:
- `beads-ide/apps/backend/src/routes/beads.ts` — bead route handlers
- `beads-ide/apps/backend/tests/routes/beads.test.ts` — integration tests

Endpoints:
- `GET /api/beads` — invoke `bd list --json`, pass through query params as filters
- `GET /api/beads/:id` — invoke `bd show <id> --json`

Key details: Parse `bd` JSON output into `Bead[]` / `Bead` types from the shared package. Non-zero exit from `bd` CLI returns a structured error response (not a crash). Uses the `cli.ts` wrapper from `beads-ide/apps/backend/src/cli.ts`.

**Acceptance Criteria:**
- [ ] Returns actual beads from the BCC database
- [ ] Single bead lookup works with real bead IDs
- [ ] Handles `bd` errors gracefully (non-zero exit → error response)

---

#### Issue: Graph routes (2A.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.2 (Define shared TypeScript types), Task 1.3 (Implement CLI wrapper with security), Task 1.6 (Set up backend API server)
**Description:**
Implement backend API routes that proxy `bv` CLI commands to expose graph metrics and graph export data. The backend normalizes `bv` output into typed `GraphMetrics` shapes defined in `beads-ide/packages/shared/src/ide-types.ts`.

Files to create:
- `beads-ide/apps/backend/src/routes/graph.ts` — graph route handlers
- `beads-ide/apps/backend/tests/routes/graph.test.ts` — integration tests

Endpoints:
- `GET /api/graph/metrics` — invoke `bv --robot-insights --output-format json`
- `GET /api/graph/export` — invoke `bv --export-graph - --output-format json` (stdout export)

Key details: Parse `bv` output into `GraphMetrics` types. The 9 graph metrics are: PageRank, betweenness centrality, HITS (authority + hub), critical path length, eigenvector centrality, degree (in/out), density, cycle count, and topological sort order. Map each to a named property on the `GraphMetrics` interface from `beads-ide/packages/shared/src/ide-types.ts`. If `bv` binary is missing, return a structured error response (not a crash) — missing `bv` is a gracefully handled degraded state. Uses the `cli.ts` wrapper from `beads-ide/apps/backend/src/cli.ts`.

**Acceptance Criteria:**
- [ ] Returns 9 graph metrics (PageRank, betweenness, HITS, etc.)
- [ ] Handles missing `bv` binary gracefully

---

#### Issue: App shell layout (2B.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.5 (Set up Vite frontend skeleton)
**Description:**
Build the VS Code-style three-panel layout with resizable panels that forms the outer shell of the Beads IDE. All feature panels (formula editor, bead list, detail) are mounted inside this shell.

Files to create:
- `beads-ide/apps/frontend/src/components/layout/app-shell.tsx` — three-panel layout (sidebar, main, detail)
- `beads-ide/apps/frontend/src/components/layout/sidebar.tsx` — left sidebar container
- `beads-ide/apps/frontend/src/components/layout/panel-resizer.tsx` — drag handle for panel resizing

Files to update:
- `beads-ide/apps/frontend/src/routes/__root.tsx` — wrap content in AppShell

Key details:
- Resizable panels using CSS `resize` or a lightweight library (`react-resizable-panels`)
- Persist panel sizes in `SessionState` (localStorage key)
- Sidebar default 250px, collapsible to icon rail
- Minimum supported viewport: 1280x720

**Acceptance Criteria:**
- [ ] Three-panel layout renders correctly at 1280x720
- [ ] Panels resize via drag handle
- [ ] Panel sizes persist across page reloads (localStorage)
- [ ] Sidebar collapses/expands

---

#### Issue: Formula file tree (2B.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.5 (Set up Vite frontend skeleton), Task 2A.1 (Formula routes)
**Description:**
Build the left sidebar tree view that lists all formulas discovered across all configured search paths. This is the primary navigation entry point into the formula editor.

Files to create:
- `beads-ide/apps/frontend/src/components/layout/formula-tree.tsx` — tree view of formulas grouped by search path directory
- `beads-ide/apps/frontend/src/hooks/use-formulas.ts` — fetch formula list from `GET /api/formulas`

Key details:
- Group formulas by search path directory
- Show formula name and directory source
- Click navigates to `/formula/:name` route
- Icons from Lucide React: `FileCode` for formulas, `Folder` for directories
- Empty directories not shown
- Empty state: when no formulas are found in any search path, show "Create your first formula" guided flow with instructions for placing a `.formula.toml` file in one of the search paths (`formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`)
- Show loading skeleton while fetching

**Acceptance Criteria:**
- [ ] Shows formulas from all available search paths
- [ ] Click navigates to `/formula/:name`
- [ ] Empty directories not shown
- [ ] Loading state while fetching
- [ ] Empty state: "Create your first formula" guidance when no formulas exist

---

#### Issue: Command palette (2B.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.5 (Set up Vite frontend skeleton)
**Description:**
Build a Cmd+K quick action palette that provides keyboard-driven access to all major IDE actions. Follows the modal Dialog pattern from openedi.

Files to create:
- `beads-ide/apps/frontend/src/components/layout/command-palette.tsx` — modal command list with search filtering
- `beads-ide/apps/frontend/src/hooks/use-hotkeys.ts` — TanStack Hotkeys integration for Cmd+K binding

Key details:
- Actions include: open formula, cook preview, sling, switch view (graph/list/wave)
- Type to filter actions list
- Keyboard navigation: up/down arrows, Enter to select, Escape to close
- Use TanStack Hotkeys for Cmd+K binding
- Follow openedi's modal pattern (Dialog with overlay)

**Acceptance Criteria:**
- [ ] Cmd+K opens palette
- [ ] Type to filter actions
- [ ] Keyboard navigation works
- [ ] Escape closes
- [ ] Actions trigger correct navigation/operations

---

#### Issue: Graph library evaluation (2C.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.5 (Set up Vite frontend skeleton)
**Description:**
Benchmark graph rendering performance with 200 nodes to select the graph library for Phase 4's graph visualization. The architecture decision table in the plan designates this as an explicit evaluation step before committing to a library.

Files to create:
- `beads-ide/apps/frontend/src/lib/graph-benchmark.ts` — test harness generating 200-node synthetic graphs (temporary spike code, not production)

Candidates to evaluate: React Flow, Cytoscape.js, D3.js force simulation.

Test parameters for each candidate:
- 200 nodes, ~300 edges (1.5 edges/node average)
- Force-directed layout
- Measure initial render time (target: <1s)
- Measure interaction latency — pan/zoom/drag (target: <100ms)
- Environment: Chrome, 1280x720

Also evaluate: hierarchical layout support, manual node positioning, click/hover event APIs.

Key details: The selected library is added to frontend dependencies and used in tasks 4B.1 (graph visualization) and 5.1 (visual formula builder). Write the decision record to `beads-ide/docs/graph-library-decision.md` with a table of library × metric results and a "Selected: [library name]" line at the top.

**Acceptance Criteria:**
- [ ] At least one library meets <1s render target for 200 nodes
- [ ] Decision documented in `beads-ide/docs/graph-library-decision.md` with benchmark results table
- [ ] Library added to frontend dependencies

---

### Sub-Epic: Phase 3 — MVP Feature Panels

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Build the three MVP pillars in parallel tracks: Track A implements the formula editor (TOML text editor, variables panel, auto-save); Track B implements the cook preview panel; Track C implements bead results list and read-only detail panel. These three tracks together deliver the core end-to-end workflow: edit formula → cook → view results.

**Exit Criteria:**
- Can open a formula, edit TOML, and see it auto-save
- Cook preview shows proto beads for a real formula
- Bead list shows actual BCC beads with working filters
- Bead detail panel shows full bead information

#### Issue: TOML text editor (3A.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 2A.1 (Formula routes), Task 2B.1 (App shell layout)
**Description:**
Build the CodeMirror 6 TOML editor that is the primary interface for editing `.formula.toml` files. This is the central component of the formula editor route and the foundation for the auto-save hook and variables panel.

Files to create:
- `beads-ide/apps/frontend/src/components/formulas/text-editor.tsx` — CodeMirror 6 wrapper component
- `beads-ide/apps/frontend/src/lib/formula-parser.ts` — TOML parse + validate against `Formula` type from `beads-ide/packages/shared/src/types.ts`
- `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — formula editor route (TanStack Router file-based route)
- `beads-ide/packages/shared/tests/formula-parser.test.ts` — parser tests with real formula fixtures
- `beads-ide/packages/shared/tests/fixtures/` — copies of BCC formula files for testing (e.g., `explore-module.formula.toml`)

Key details:
- CodeMirror 6 for the editor. For TOML syntax highlighting: search npm for `codemirror-lang-toml` or similar community packages. If no suitable TOML extension exists, fall back to plain text mode — TOML syntax highlighting is nice-to-have, not blocking. The `smol-toml` parser handles all structural validation regardless of editor highlighting.
- `smol-toml` library for TOML parsing (small, fast, ESM-native)
- Validate parsed TOML against `Formula` type shape; show inline diagnostics for parse errors
- Editor fills the main panel of the app shell
- Undo/redo via CodeMirror's built-in history extension

**Acceptance Criteria:**
- [ ] Opens and renders real `.formula.toml` files (e.g., `explore-module.formula.toml`)
- [ ] TOML syntax highlighting
- [ ] Parse errors shown inline
- [ ] Formula type validation (missing required fields flagged)
- [ ] Ctrl+Z undo/redo works

---

#### Issue: Variables panel (3A.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 3A.1 (TOML text editor)
**Description:**
Build a form UI panel alongside the TOML editor that renders each formula variable (`VarDef`) as a structured form field. Changes to variable values in the form update the TOML source in the CodeMirror editor.

Files to create:
- `beads-ide/apps/frontend/src/components/formulas/vars-panel.tsx` — variable form panel

Key details:
- Render each `VarDef` (from `beads-ide/packages/shared/src/types.ts`) as a form field
- Field type mapping: text input (default), dropdown/select (if `enum` values present), checkbox (if `type: bool`)
- Show: description text, required indicator (red asterisk), default value hint
- Highlight unbound required variables in red
- Editing a var value updates the TOML source in the CodeMirror editor instance

**Acceptance Criteria:**
- [ ] Renders all vars from a formula
- [ ] Required vars visually distinguished
- [ ] Enum vars render as dropdown
- [ ] Editing a var value updates the TOML source

---

#### Issue: Auto-save with debounce (3A.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 3A.1 (TOML text editor), Task 2A.1 (Formula routes)
**Description:**
Implement debounced auto-save that writes the formula to disk 500ms after the user stops typing. Calls `PUT /api/formulas/:name` from `beads-ide/apps/backend/src/routes/formulas.ts`.

Files to create:
- `beads-ide/apps/frontend/src/hooks/use-auto-save.ts` — debounced save hook

Key details:
- `useEffect` + `setTimeout(500ms)` pattern; clear timeout on each new keystroke (debounce reset)
- Calls `PUT /api/formulas/:name` with current TOML content via `beads-ide/apps/frontend/src/lib/api.ts`
- Show save state indicator: subtle "Saving..." → "Saved" text or checkmark icon
- Save errors surface via `toast.error()` (Sonner)

**Acceptance Criteria:**
- [ ] Saves 500ms after last keystroke
- [ ] No save during active typing (debounce resets)
- [ ] Save failure shows toast error
- [ ] Visual indicator of save state (saving/saved/error)

---

#### Issue: Cook preview panel (3B.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 2A.1 (Formula routes), Task 3A.1 (TOML text editor)
**Description:**
Build the split-view cook preview panel that shows the formula editor on the left and the proto bead results on the right. Re-cooks automatically when the formula is saved via the auto-save hook.

Files to create:
- `beads-ide/apps/frontend/src/components/preview/cook-preview.tsx` — split view container component
- `beads-ide/apps/frontend/src/components/preview/proto-bead-list.tsx` — proto bead cards list
- `beads-ide/apps/frontend/src/hooks/use-cook.ts` — cook API hook with debounced trigger

Key details:
- Right panel renders `CookResult.proto_beads` (from `beads-ide/packages/shared/src/ide-types.ts`) as cards with: title, type badge, dependency count
- Unbound vars from `CookResult.unbound_vars` highlighted in red with "Blocks pour" indicator
- Cook errors shown inline with stderr content
- Re-cooks on debounced save (500ms) — NOT streaming
- Show "Cooking..." spinner during invocation
- User-facing label: "Here's what will be created" (not "Proto beads" per terminology rules)

**Acceptance Criteria:**
- [ ] Split view: formula editor left, preview right
- [ ] Proto beads render as cards with title, type, status
- [ ] Unbound variables highlighted in red
- [ ] Cook error stderr shown inline
- [ ] Re-cooks automatically on save
- [ ] Loading spinner during cook

---

#### Issue: Bead list view (3C.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 2A.2 (Bead routes), Task 2B.1 (App shell layout)
**Description:**
Build the bead results list view with faceted filtering and grouping. This is the primary results analysis panel, following openedi's `transaction-list.tsx` pattern at `/home/krystian/gt/deacon/dogs/bravo/openedi/`.

Files to create:
- `beads-ide/apps/frontend/src/components/beads/bead-list.tsx` — bead list with grouping support
- `beads-ide/apps/frontend/src/components/beads/bead-status-badge.tsx` — status pill using `statusConfig` pattern: status → `{ label, color, bgColor }`
- `beads-ide/apps/frontend/src/components/beads/bead-filters.tsx` — faceted filter panel
- `beads-ide/apps/frontend/src/hooks/use-beads.ts` — fetch beads from `GET /api/beads`
- `beads-ide/apps/frontend/src/routes/results.$id.tsx` — results analysis route (TanStack Router file-based route)

Key details:
- Grouping modes (user-toggleable): by epic parent, by type, by status
- Filter dimensions: status, type, priority, labels
- Client-side filtering only (target: <100ms for 200 beads)
- Status badges use `statusConfig` map per openedi pattern

**Acceptance Criteria:**
- [ ] Lists actual beads from BCC database
- [ ] Grouping by epic/type/status works
- [ ] Filters narrow the list interactively
- [ ] Client-side filter <100ms for 200 beads
- [ ] Status badges render with correct colors

---

#### Issue: Bead detail panel (3C.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 3C.1 (Bead list view)
**Description:**
Build the read-only slide-in side panel that shows full bead details when a bead is clicked in the list. Follows openedi's `transaction-detail-modal.tsx` slide-in pattern at `/home/krystian/gt/deacon/dogs/bravo/openedi/`.

Files to create:
- `beads-ide/apps/frontend/src/components/beads/bead-detail.tsx` — read-only detail side panel

Key details:
- Fields to display: title, description, design, acceptance criteria, status, priority, type, labels, assignee, dependencies, timestamps
- Read-only only — no edit controls (per spec)
- Markdown rendering for description and other rich-text fields
- Progressive disclosure: show summary fields first, expand for full detail
- Close via close button or Escape key

**Acceptance Criteria:**
- [ ] Click bead in list opens detail panel
- [ ] All bead fields rendered
- [ ] Markdown in description renders correctly
- [ ] Panel is read-only (no edit controls)
- [ ] Close button/escape dismisses

---

### Sub-Epic: Phase 4 — Advanced Views

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Build the advanced result views and execution workflows in three parallel tracks: Track A implements the wave view (beads grouped by dependency frontier); Track B implements interactive graph visualization with 9 metrics overlay and dense graph handling; Track C implements pour (local execution with rollback) and sling (agent dispatch) workflows.

**Exit Criteria:**
- Wave view correctly groups beads by dependency frontier
- Graph renders 200 beads <1s with metrics overlay
- Pour instantiates beads locally with rollback option
- Sling triggers `gt sling` and shows results on completion
- All three result views (list/wave/graph) switchable

#### Issue: Wave view component (4A.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 1.4 (Implement wave computation), Task 3C.1 (Bead list view)
**Description:**
Build the wave view that groups beads into dependency frontier "waves" using the `computeWaves()` function from `beads-ide/packages/shared/src/wave.ts`. This is one of three switchable result views (list / wave / graph).

Files to create:
- `beads-ide/apps/frontend/src/components/results/wave-view.tsx` — wave grouping display component

Key details:
- Import `computeWaves` from `beads-ide/packages/shared/src/wave.ts`
- Render waves as collapsible sections: "Wave 1 (Now) — 5 beads", "Wave 2 (Next) — 8 beads", etc.
- Each section contains bead cards (reuse components from 3C.1)
- If cycles detected (`hasCycles: true`), show warning banner and fall back to flat list
- View switcher tab bar: list / wave / graph — mounted in the results route (`beads-ide/apps/frontend/src/routes/results.$id.tsx`)
- Terminology: use "Wave" not "Level" or "Tier"

**Acceptance Criteria:**
- [ ] Waves computed from actual BCC bead dependencies
- [ ] Beads grouped correctly by dependency frontier
- [ ] Cycle warning shown when cycles exist
- [ ] Fallback to list on cycle
- [ ] View switcher (list/wave/graph) works

---

#### Issue: Graph visualization with metrics (4B.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 2A.3 (Graph routes), Task 2C.1 (Graph library evaluation), Task 3C.1 (Bead list view), Task 3C.2 (Bead detail panel)
**Description:**
Build the interactive dependency graph visualization using the library selected in Task 2C.1 (see `beads-ide/docs/graph-library-decision.md` for the selected library and benchmark results). Overlays 9 graph metrics from `GET /api/graph/metrics` on node appearance.

Files to create:
- `beads-ide/apps/frontend/src/components/results/graph-view.tsx` — graph canvas component
- `beads-ide/apps/frontend/src/components/results/graph-controls.tsx` — layout switcher, metric selector, zoom controls
- `beads-ide/apps/frontend/src/hooks/use-graph.ts` — graph data + metrics from API

Key details:
- Node shape by bead type: hexagon = epic, circle = task (per spec)
- Edge style by dependency type: solid = blocks, dashed = related
- Three layout algorithms: force-directed (default), hierarchical, manual (positions saved in `SessionState` localStorage)
- Metrics overlay: selecting a metric changes node size/color to reflect metric value
- 9 metrics sourced from `bv --robot-insights` via `GET /api/graph/metrics`
- Dense graph handling: auto-cluster by epic at >30 visible nodes, focus mode (N-hop neighborhood, default N=2)
- Clicking a node opens the bead detail panel from 3C.2

**Acceptance Criteria:**
- [ ] Renders 200 beads in <1s (Chrome, 1280x720)
- [ ] Pan/zoom/drag <100ms
- [ ] Three layout algorithms switch correctly
- [ ] Metrics overlay changes node appearance
- [ ] Node shapes differ by bead type
- [ ] Edge styles differ by dependency type
- [ ] Click node opens bead detail panel

---

#### Issue: Dense graph handling (4B.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 4B.1 (Graph visualization with metrics)
**Description:**
Add simplification strategies to the graph view for handling 50-200 bead dense graphs. Extends `graph-view.tsx` and `graph-controls.tsx` created in task 4B.1.

Files to update:
- `beads-ide/apps/frontend/src/components/results/graph-view.tsx` — add clustering and focus mode
- `beads-ide/apps/frontend/src/components/results/graph-controls.tsx` — add simplification toggles

Key details:
- Epic clustering: collapse an epic's child beads into a single cluster node to reduce visible node count
- Focus mode: click a node to show N-hop neighborhood (default N=2); all other nodes dimmed/hidden
- Semantic zoom: show less detail when zoomed out (hide labels, simplify edges)
- Fisheye distortion: magnify area around cursor while compressing periphery (optional simplification mode)
- Density indicator in a health panel: warn at >0.10 density, red at >0.12

**Acceptance Criteria:**
- [ ] Epic clustering reduces visible nodes
- [ ] Focus mode shows neighborhood of selected node
- [ ] Fisheye distortion available as simplification option
- [ ] Density indicator shows correct value
- [ ] Density warnings at thresholds

---

#### Issue: Pour workflow (local execution) (4C.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 2A.1 (Formula routes), Task 3B.1 (Cook preview panel)
**Description:**
Implement the pour workflow that instantiates real beads locally via `bd mol pour`. This is the local execution path, distinct from sling (agent dispatch). Triggered from the cook preview once proto beads are visible.

Files to create:
- `beads-ide/apps/frontend/src/components/formulas/pour-dialog.tsx` — confirmation dialog with rollback option
- `beads-ide/apps/backend/src/routes/pour.ts` — pour endpoint (uses `cli.ts` wrapper)

Files to update:
- `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — add Pour button (visible when cook preview shows proto beads)

Key details:
- Pour button appears in formula route when proto beads exist from cook
- Confirmation dialog shows what will be created (bead count and types)
- On success: navigate to results view showing newly created beads
- On failure: `toast.error()` with error details (Sonner)
- Rollback button available post-pour: check `bd mol --help` for the exact rollback subcommand (likely `bd mol rollback` or `bd mol undo`). If no rollback command exists, use `bd close --cancel` or document the gap. The backend endpoint should expose whatever CLI command is available for undoing a pour.

**Acceptance Criteria:**
- [ ] Pour button visible from cook preview when proto beads exist
- [ ] Confirmation dialog shows bead count and types
- [ ] Invokes `bd mol pour` via backend
- [ ] Success navigates to results view
- [ ] Failure shows error toast
- [ ] Rollback option available after pour

---

#### Issue: Sling workflow (4C.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 2A.1 (Formula routes), Task 3A.1 (TOML text editor)
**Description:**
Implement the sling workflow that dispatches a formula to an agent or crew via `gt sling`. This is the agent dispatch path, distinct from pour (local execution). Triggered from the formula editor.

Files to create:
- `beads-ide/apps/frontend/src/components/formulas/sling-dialog.tsx` — target selection modal

Files to update:
- `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — add Sling button

Key details:
- Sling button in formula editor (and accessible via Cmd+K → "sling")
- Dialog: user selects target (agent/crew) — populated from context or free text entry
- Submit invokes `POST /api/formulas/:name/sling` from `beads-ide/apps/backend/src/routes/formulas.ts`
- Status indicator while `gt sling` runs
- On completion: navigate to results view
- On failure: `toast.error()` with error details and retry button (Sonner)

**Acceptance Criteria:**
- [ ] Sling button visible from formula editor
- [ ] Dialog allows target selection
- [ ] Invokes `gt sling` via backend
- [ ] Status indicator during execution
- [ ] Success navigates to results
- [ ] Failure shows error toast with retry button

---

### Sub-Epic: Phase 5 — Visual Builder, Polish & Testing

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Add the read-only visual formula builder, implement all error handling failure modes, conduct the WCAG 2.1 AA accessibility pass, validate all performance targets with benchmarks, and run the full end-to-end Playwright test suite.

**Exit Criteria:**
- Visual formula builder shows step DAG (read-only)
- All error scenarios handled gracefully
- Accessibility audit passes (keyboard nav, screen reader, no color-only encoding)
- Performance targets met with benchmark evidence
- E2E test suite passes

#### Issue: Visual formula builder (read-only) (5.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 3A.1 (TOML text editor), Task 2C.1 (Graph library evaluation)
**Description:**
Build the read-only node-based DAG visualization of formula steps. In MVP, the visual view is one-way only: TOML is parsed and rendered as a graph (TOML → visual); write-back is deferred to post-MVP. Uses the same graph library selected in Task 2C.1 (see `beads-ide/docs/graph-library-decision.md`).

Files to create:
- `beads-ide/apps/frontend/src/components/formulas/visual-builder.tsx` — step DAG visualization

Files to update:
- `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — add view toggle (text editor / visual view)

Key details:
- Render formula steps (from `beads-ide/packages/shared/src/types.ts` `Step` type) as nodes in a DAG
- Edges represent `needs` dependencies between steps
- Show on each node: step title, step id
- Variables shown as input ports on nodes
- Toggle between text editor and visual view; visual view updates when TOML changes (one-way sync via formula-parser.ts)
- Uses the graph library from `beads-ide/apps/frontend/src/lib/graph-benchmark.ts` decision

**Acceptance Criteria:**
- [ ] Formula steps render as DAG nodes
- [ ] Dependencies shown as directed edges
- [ ] Toggle between text and visual view
- [ ] Visual view updates when TOML changes (one-way sync)

---

#### Issue: Error handling for all failure modes (5.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 3A.1 (TOML text editor), Task 3B.1 (Cook preview panel), Task 4C.1 (Pour workflow), Task 4C.2 (Sling workflow)
**Description:**
Implement robust error handling for all failure modes identified in the spec Error Handling table. Ensures the IDE degrades gracefully rather than showing blank screens or crashing.

Files to update:
- `beads-ide/apps/frontend/src/lib/api.ts` — connection error detection, offline/degraded mode signaling
- `beads-ide/apps/frontend/src/routes/__root.tsx` — React error boundary

Files to create:
- `beads-ide/apps/frontend/src/components/ui/error-page.tsx` — "Cannot connect to backend" full-page error
- `beads-ide/apps/frontend/src/components/ui/offline-banner.tsx` — "Database unavailable" degraded mode banner

Failure mode matrix (from spec):
- Backend not running → error page (not blank screen)
- Cook failure → inline error with stderr in cook preview panel
- Sling failure → `toast.error()` with retry
- Database unavailable → degraded mode: formula editing still works, bead data unavailable banner shown
- Formula validation error → inline highlighting in editor
- Wave cycle detected → warning banner + list fallback

Key details: All fetch errors flow through `beads-ide/apps/frontend/src/lib/api.ts` which returns `ApiResponse<T>` with `{ data, error }` envelope. Use `try/catch` with `finally` for loading state reset (openedi pattern). User-facing errors via `toast.error()` (Sonner).

**Acceptance Criteria:**
- [ ] Backend down → error page renders (not blank screen)
- [ ] Cook failure shows stderr inline
- [ ] Sling failure shows toast with error details
- [ ] Formula editing works even when database is down

---

#### Issue: Accessibility pass (WCAG 2.1 AA) (5.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 3A.2 (Variables panel), Task 3A.3 (Auto-save with debounce), Task 3C.2 (Bead detail panel), Task 4A.1 (Wave view component), Task 4B.2 (Dense graph handling), Task 4C.1 (Pour workflow), Task 4C.2 (Sling workflow)
**Description:**
Conduct a comprehensive accessibility audit and remediation pass across all components to meet WCAG 2.1 AA. This is a cross-cutting pass over multiple component files in `beads-ide/apps/frontend/src/components/`.

Files to update (known remediation targets):
- `components/layout/command-palette.tsx` — focus trap, keyboard nav
- `components/layout/formula-tree.tsx` — keyboard nav, aria-expanded
- `components/formulas/pour-dialog.tsx` — focus trap
- `components/formulas/sling-dialog.tsx` — focus trap
- `components/beads/bead-status-badge.tsx` — shape + icon (not color-only)
- `components/beads/bead-detail.tsx` — heading hierarchy, aria-labels
- `components/results/graph-view.tsx` — list/tree alternative, aria-labels
- All icon-only buttons across `components/` — add `aria-label`
- All loading states — add `aria-live` regions

Key details per spec:
- Screen reader alternative for graph: list/tree view accessible to screen readers
- Shape + icon as primary differentiators (not color alone) for node types and bead status
- Keyboard navigation for all operations (no mouse-only actions)
- Proper heading hierarchy throughout
- `aria-label` on all icon-only buttons
- `aria-live` regions for loading states
- Focus management in command palette and dialogs (focus trap)
- `type="button"` on all non-submit buttons
- Skeleton loading used for all data-dependent panels (no full-screen spinners)
- Terminology enforcement: verify "Cook" not "Compile", "Wave" not "Level", "dependency" not "bond"
- Terminology: show only top-4 dependency types in UI (blocks, related, parent-child, duplicate)
- Terminology: hide BCC compilation phases (SCAN/ANALYZE/CONNECT/ENRICH) — "Phase" refers only to bead lifecycle

**Acceptance Criteria:**
- [ ] All interactive elements keyboard-navigable
- [ ] Screen reader can navigate formula tree, bead list
- [ ] Graph has list/tree alternative view
- [ ] No color-only encoding (shapes + icons always present)
- [ ] Command palette traps focus correctly
- [ ] Skeleton loading used for all data-dependent panels (no full-screen spinners)
- [ ] Terminology enforcement verified: "Cook" not "Compile", "Wave" not "Level", etc.
- [ ] Only top-4 dependency types shown in UI (blocks, related, parent-child, duplicate)
- [ ] BCC compilation phases (SCAN/ANALYZE/CONNECT/ENRICH) not exposed to users

---

#### Issue: Performance benchmarks (5.4)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 4B.1 (Graph visualization with metrics)
**Description:**
Validate all performance targets from the spec using automated benchmark scripts. Produces measurable evidence that the IDE meets its performance requirements.

Files to create:
- `beads-ide/apps/frontend/tests/performance/` — benchmark scripts

Performance targets to validate (from spec):
- Graph render: benchmarks at 50, 100, and 200 beads against <1s target (Chrome, 1280x720) — measured via Performance API
- Graph interactions: pan/zoom/drag <100ms
- Search/filter: <100ms for 200 beads (client-side)
- Cook re-invoke: debounce fires correctly at 500ms

**Acceptance Criteria:**
- [ ] Graph: 50 beads renders <1s
- [ ] Graph: 100 beads renders <1s
- [ ] Graph: 200 beads renders <1s (measured via Performance API)
- [ ] Interactions: pan/zoom/drag <100ms
- [ ] Filters: <100ms for 200 beads
- [ ] Cook debounce fires correctly at 500ms

---

#### Issue: E2E tests (5.5)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 3A.2 (Variables panel), Task 3A.3 (Auto-save with debounce), Task 3C.2 (Bead detail panel), Task 4A.1 (Wave view component), Task 4B.2 (Dense graph handling), Task 4C.1 (Pour workflow), Task 4C.2 (Sling workflow)
**Description:**
Build the Playwright end-to-end test suite covering the full MVP workflow. Uses custom fixtures to set up test formulas and mock `bd`/`gt` CLI responses, following openedi's fixture pattern (`base.extend()` for setup/teardown).

Files to create:
- `beads-ide/apps/frontend/tests/e2e/formula-workflow.spec.ts` — edit → cook → analyze flow
- `beads-ide/apps/frontend/tests/e2e/fixtures/` — test formula files and mock CLI responses

Key details:
- Full workflow test: open formula → edit → auto-save → cook preview → view results → switch views (list/wave/graph)
- Mock `bd`/`gt` CLI responses in fixtures to avoid database dependency in CI
- Follow openedi's fixture pattern: `base.extend()` for setup/teardown
- All tests must complete in <60s total

**Acceptance Criteria:**
- [ ] E2E: formula edit → cook → preview beads flow passes
- [ ] E2E: results view → list/wave/graph switching works
- [ ] E2E: command palette navigation works
- [ ] Tests run in <60s

---

## Dependencies

| Blocked Task | Blocked By | Reason |
|---|---|---|
| 1.2 (Define shared TypeScript types) | 1.1 (Initialize project scaffolding) | Needs workspace and tsconfig to compile |
| 1.3 (Implement CLI wrapper with security) | 1.1 (Initialize project scaffolding) | Needs backend package structure |
| 1.4 (Implement wave computation) | 1.2 (Define shared TypeScript types) | Imports `Bead` and `Dependency` types |
| 1.5 (Set up Vite frontend skeleton) | 1.1 (Initialize project scaffolding) | Needs frontend package structure |
| 1.6 (Set up backend API server) | 1.1 (Initialize project scaffolding) | Needs backend package structure |
| 1.6 (Set up backend API server) | 1.3 (Implement CLI wrapper with security) | Server registers CLI wrapper for health check |
| 2A.1 (Formula routes) | 1.2 (Define shared TypeScript types) | Returns FormulaFile[] and CookResult types |
| 2A.1 (Formula routes) | 1.3 (Implement CLI wrapper with security) | All CLI calls use the wrapper |
| 2A.1 (Formula routes) | 1.6 (Set up backend API server) | Routes registered on the Hono server |
| 2A.2 (Bead routes) | 1.2 (Define shared TypeScript types) | Parses bd output into Bead[] types |
| 2A.2 (Bead routes) | 1.3 (Implement CLI wrapper with security) | All CLI calls use the wrapper |
| 2A.2 (Bead routes) | 1.6 (Set up backend API server) | Routes registered on the Hono server |
| 2A.3 (Graph routes) | 1.2 (Define shared TypeScript types) | Parses bv output into GraphMetrics types |
| 2A.3 (Graph routes) | 1.3 (Implement CLI wrapper with security) | All CLI calls use the wrapper |
| 2A.3 (Graph routes) | 1.6 (Set up backend API server) | Routes registered on the Hono server |
| 2B.1 (App shell layout) | 1.5 (Set up Vite frontend skeleton) | Extends the root layout from skeleton |
| 2B.2 (Formula file tree) | 1.5 (Set up Vite frontend skeleton) | Needs frontend skeleton |
| 2B.2 (Formula file tree) | 2A.1 (Formula routes) | Fetches formula list from API |
| 2B.3 (Command palette) | 1.5 (Set up Vite frontend skeleton) | Needs frontend skeleton and TanStack Hotkeys |
| 2C.1 (Graph library evaluation) | 1.5 (Set up Vite frontend skeleton) | Benchmark runs in the frontend app |
| 3A.1 (TOML text editor) | 2A.1 (Formula routes) | Loads formula via API and saves via PUT |
| 3A.1 (TOML text editor) | 2B.1 (App shell layout) | Editor mounts in main panel |
| 3A.2 (Variables panel) | 3A.1 (TOML text editor) | Reads and updates the CodeMirror editor state |
| 3A.3 (Auto-save with debounce) | 3A.1 (TOML text editor) | Hooks into editor change events |
| 3A.3 (Auto-save with debounce) | 2A.1 (Formula routes) | Calls PUT /api/formulas/:name |
| 3B.1 (Cook preview panel) | 2A.1 (Formula routes) | Calls POST /api/formulas/:name/cook |
| 3B.1 (Cook preview panel) | 3A.1 (TOML text editor) | Triggered by editor save events |
| 3C.1 (Bead list view) | 2A.2 (Bead routes) | Fetches bead data from API |
| 3C.1 (Bead list view) | 2B.1 (App shell layout) | List mounts in main panel |
| 3C.2 (Bead detail panel) | 3C.1 (Bead list view) | Detail opens from list click |
| 4A.1 (Wave view component) | 1.4 (Implement wave computation) | Imports computeWaves from shared |
| 4A.1 (Wave view component) | 3C.1 (Bead list view) | Reuses bead card components |
| 4B.1 (Graph visualization with metrics) | 2A.3 (Graph routes) | Fetches metrics from API |
| 4B.1 (Graph visualization with metrics) | 2C.1 (Graph library evaluation) | Uses selected library |
| 4B.1 (Graph visualization with metrics) | 3C.1 (Bead list view) | Reuses bead card components |
| 4B.1 (Graph visualization with metrics) | 3C.2 (Bead detail panel) | Click node opens bead detail |
| 4B.2 (Dense graph handling) | 4B.1 (Graph visualization with metrics) | Extends graph-view.tsx |
| 4C.1 (Pour workflow) | 2A.1 (Formula routes) | Pour endpoint added to backend |
| 4C.1 (Pour workflow) | 3B.1 (Cook preview panel) | Pour button appears in cook preview |
| 4C.2 (Sling workflow) | 2A.1 (Formula routes) | Sling endpoint on formula routes |
| 4C.2 (Sling workflow) | 3A.1 (TOML text editor) | Sling button in formula editor route |
| 5.1 (Visual formula builder) | 3A.1 (TOML text editor) | Parses formula TOML to render DAG |
| 5.1 (Visual formula builder) | 2C.1 (Graph library evaluation) | Uses selected graph library |
| 5.2 (Error handling) | 3A.1 (TOML text editor) | Adds error boundary over formula route |
| 5.2 (Error handling) | 3B.1 (Cook preview panel) | Adds cook failure inline error handling |
| 5.2 (Error handling) | 4C.1 (Pour workflow) | Adds pour failure error handling |
| 5.2 (Error handling) | 4C.2 (Sling workflow) | Adds sling failure toast with retry |
| 5.3 (Accessibility pass) | 3A.2 (Variables panel) | Remediates vars panel accessibility |
| 5.3 (Accessibility pass) | 3A.3 (Auto-save with debounce) | Verifies save indicator aria-live |
| 5.3 (Accessibility pass) | 3C.2 (Bead detail panel) | Remediates detail panel accessibility |
| 5.3 (Accessibility pass) | 4A.1 (Wave view component) | Remediates wave view accessibility |
| 5.3 (Accessibility pass) | 4B.2 (Dense graph handling) | Verifies graph list alternative |
| 5.3 (Accessibility pass) | 4C.1 (Pour workflow) | Remediates pour dialog accessibility |
| 5.3 (Accessibility pass) | 4C.2 (Sling workflow) | Remediates sling dialog accessibility |
| 5.4 (Performance benchmarks) | 4B.1 (Graph visualization with metrics) | Benchmarks the graph component |
| 5.5 (E2E tests) | 3A.2 (Variables panel) | Tests vars panel in workflow |
| 5.5 (E2E tests) | 3A.3 (Auto-save with debounce) | Tests auto-save in workflow |
| 5.5 (E2E tests) | 3C.2 (Bead detail panel) | Tests detail panel in workflow |
| 5.5 (E2E tests) | 4A.1 (Wave view component) | Tests view switching |
| 5.5 (E2E tests) | 4B.2 (Dense graph handling) | Tests graph view in workflow |
| 5.5 (E2E tests) | 4C.1 (Pour workflow) | Tests pour in workflow |
| 5.5 (E2E tests) | 4C.2 (Sling workflow) | Tests sling in workflow |

---

## Coverage Matrix

| Plan Task | Bead Title | Sub-Epic |
|---|---|---|
| 1.1 | Initialize project scaffolding | Phase 1 — Foundation & Shared Infrastructure |
| 1.2 | Define shared TypeScript types | Phase 1 — Foundation & Shared Infrastructure |
| 1.3 | Implement CLI wrapper with security | Phase 1 — Foundation & Shared Infrastructure |
| 1.4 | Implement wave computation | Phase 1 — Foundation & Shared Infrastructure |
| 1.5 | Set up Vite frontend skeleton | Phase 1 — Foundation & Shared Infrastructure |
| 1.6 | Set up backend API server | Phase 1 — Foundation & Shared Infrastructure |
| 2A.1 | Formula routes | Phase 2 — Backend API + Frontend Shell |
| 2A.2 | Bead routes | Phase 2 — Backend API + Frontend Shell |
| 2A.3 | Graph routes | Phase 2 — Backend API + Frontend Shell |
| 2B.1 | App shell layout | Phase 2 — Backend API + Frontend Shell |
| 2B.2 | Formula file tree | Phase 2 — Backend API + Frontend Shell |
| 2B.3 | Command palette | Phase 2 — Backend API + Frontend Shell |
| 2C.1 | Graph library evaluation | Phase 2 — Backend API + Frontend Shell |
| 3A.1 | TOML text editor | Phase 3 — MVP Feature Panels |
| 3A.2 | Variables panel | Phase 3 — MVP Feature Panels |
| 3A.3 | Auto-save with debounce | Phase 3 — MVP Feature Panels |
| 3B.1 | Cook preview panel | Phase 3 — MVP Feature Panels |
| 3C.1 | Bead list view | Phase 3 — MVP Feature Panels |
| 3C.2 | Bead detail panel | Phase 3 — MVP Feature Panels |
| 4A.1 | Wave view component | Phase 4 — Advanced Views |
| 4B.1 | Graph visualization with metrics | Phase 4 — Advanced Views |
| 4B.2 | Dense graph handling | Phase 4 — Advanced Views |
| 4C.1 | Pour workflow (local execution) | Phase 4 — Advanced Views |
| 4C.2 | Sling workflow | Phase 4 — Advanced Views |
| 5.1 | Visual formula builder (read-only) | Phase 5 — Visual Builder, Polish & Testing |
| 5.2 | Error handling for all failure modes | Phase 5 — Visual Builder, Polish & Testing |
| 5.3 | Accessibility pass (WCAG 2.1 AA) | Phase 5 — Visual Builder, Polish & Testing |
| 5.4 | Performance benchmarks | Phase 5 — Visual Builder, Polish & Testing |
| 5.5 | E2E tests | Phase 5 — Visual Builder, Polish & Testing |

---

## Summary

- Feature epic: 1
- Sub-epics (phases): 5
- Issues (tasks): 29
- Blocker dependencies: 62
- Items ready immediately (no blockers): 1 (task 1.1)
