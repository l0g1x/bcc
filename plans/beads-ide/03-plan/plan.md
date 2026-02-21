# beads-ide - Implementation Plan

**Created:** 2026-02-21
**Status:** Draft
**Source Spec:** plans/beads-ide/02-spec/spec.md

---

## Overview

The Beads IDE is a greenfield local web application for designing, previewing, and analyzing workflow formulas and the beads they produce. It replaces editing `.formula.toml` files in a text editor with a purpose-built IDE featuring a formula editor, cook preview, and post-execution results analysis.

The implementation follows a **two-process architecture**: a Vite + React SPA (frontend) and a lightweight Node.js API server (backend) that proxies `bd`/`gt`/`bv` CLI commands. There is no existing UI code in the BCC project — this is a net-new build. The `openedi` project at `/home/krystian/gt/deacon/dogs/bravo/openedi/` provides the reference architecture for component patterns, styling, and tooling conventions.

This approach was chosen because: (a) the spec mandates a browser SPA, (b) the `bd` CLI already provides stable `--json` output for all data operations, (c) CLI proxying avoids coupling to Dolt's internal schema, and (d) the openedi patterns are proven and directly applicable.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project location | `beads-ide/` subdirectory in crew workspace | Collocated with formulas it edits |
| Monorepo tooling | npm workspaces (2 packages) | Simple for single operator; Turborepo overkill |
| Frontend framework | Vite + React + TypeScript | Spec requirement; matches openedi |
| Backend framework | Hono on Node.js | Lightweight, TypeScript-native, faster than Express |
| TOML library | `smol-toml` | Small, fast, ESM-native, handles round-trip parsing |
| Data layer | `bd` CLI proxy (Option A) | Lower risk; no Dolt schema coupling; stable `--json` API |
| Graph library | Evaluate in Phase 2C: React Flow → Cytoscape.js → D3.js | Must benchmark 200 nodes < 1s before committing |
| Text editor | CodeMirror 6 | TOML syntax highlighting, lightweight, extensible |
| State management | Local state (useState/useMemo) + route-level lifting | openedi pattern; no global store needed |
| Styling | Tailwind CSS v4 + `cn()` utility | openedi reference; `zinc` neutrals, `brand-*` accent |
| Icons | Lucide React | openedi reference |
| Toasts | Sonner | openedi reference |
| Linter/formatter | Biome | openedi reference; replaces ESLint + Prettier |
| Testing | Vitest (unit) + Playwright (E2E) | openedi reference |
| Visual formula builder | Read-only in MVP (TOML → visual) | Bidirectional sync too risky for MVP; add write-back post-MVP |

---

## Shared Abstractions

These are built in Phase 1 and consumed by all subsequent phases.

### 1. TypeScript Types (`packages/shared/src/types.ts`)
- **Purpose:** Single source of truth for Bead, Formula, Dependency, Wave, GraphMetrics, CookResult, and all supporting types
- **Consumers:** Frontend (all components), Backend (route handlers, CLI response parsing)
- **Derived from:** `docs/beads.md` (Go `Issue` struct) and `docs/formulas.md` (Go `Formula` struct)

### 2. API Client (`apps/frontend/src/lib/api.ts`)
- **Purpose:** Typed fetch wrapper for all backend API calls
- **Consumers:** All frontend hooks (`useFormula`, `useBeads`, `useGraph`)
- **Pattern:** Returns `ApiResponse<T>` envelope; handles connection errors globally

### 3. CLI Wrapper (`apps/backend/src/cli.ts`)
- **Purpose:** Secure `execFile`-style CLI invocation with argument validation
- **Consumers:** All backend route handlers
- **Security:** Allowlist validation for formula names (`^[a-zA-Z0-9_.-]+$`), variable keys/values; `cwd` locked to project root; no shell interpolation

### 4. Wave Computation (`packages/shared/src/wave.ts`)
- **Purpose:** Topological sort + level assignment on dependency graph
- **Consumers:** Frontend WaveView component, potentially backend for pre-computation
- **Algorithm:** BFS from zero-in-degree nodes using workflow dependency types (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`); cycle detection with fallback

---

## Phased Delivery

### Phase 1: Foundation & Shared Infrastructure

**Objective:** Project scaffolding, shared types, build tooling — everything needed before feature work begins.
**Prerequisites:** None (first phase)

#### Tasks

**1.1 Initialize project scaffolding**
- **What:** Create npm workspaces monorepo with frontend, backend, and shared packages
- **Files:**
  - Create: `beads-ide/package.json` — workspace root with `"workspaces": ["apps/*", "packages/*"]`
  - Create: `beads-ide/apps/frontend/package.json` — Vite + React deps
  - Create: `beads-ide/apps/backend/package.json` — Hono + Node deps
  - Create: `beads-ide/packages/shared/package.json` — shared types
  - Create: `beads-ide/biome.json` — single quotes, no semicolons, 2-space indent, 100-char width
  - Create: `beads-ide/tsconfig.base.json` — strict mode, ES2022, bundler resolution
- **Key details:** Follow openedi's Biome config. Enable `useImportType`, `noNonNullAssertion`, `noExplicitAny`. TypeScript project references between packages.
- **Acceptance criteria:**
  - [ ] `npm install` succeeds from workspace root
  - [ ] `npm run typecheck` passes across all packages
  - [ ] `npm run lint` (Biome) passes with zero errors
- **Dependencies:** None

**1.2 Define shared TypeScript types**
- **What:** Create all type definitions derived from `docs/beads.md` and `docs/formulas.md`
- **Files:**
  - Create: `beads-ide/packages/shared/src/types.ts` — Bead, BeadStatus, BeadType, Dependency, DependencyType, Formula, VarDef, Step, Gate, LoopSpec, OnCompleteSpec, ComposeRules
  - Create: `beads-ide/packages/shared/src/ide-types.ts` — Wave, GraphNode, GraphMetrics, GraphStats, FormulaFile, CookResult, ApiResponse, CliInvocation, SessionState, BeadsIDEConfig
  - Create: `beads-ide/packages/shared/src/index.ts` — barrel export
- **Key details:** Types must match the JSON output shape of `bd list --json` and `bd show --json`. Use `docs/beads.md` lines 17-75 and `docs/formulas.md` lines 1-250 as authoritative sources. See plan-context.md "Data Types & Interfaces" for complete type definitions.
- **Acceptance criteria:**
  - [ ] All types compile with strict TypeScript
  - [ ] Types match actual `bd list --json` output (verify with a manual JSON sample)
  - [ ] Types exported and importable from both frontend and backend
- **Dependencies:** 1.1

**1.3 Implement CLI wrapper with security**
- **What:** Backend utility for secure CLI invocation
- **Files:**
  - Create: `beads-ide/apps/backend/src/cli.ts` — `execFile` wrapper with allowlist validation
  - Create: `beads-ide/apps/backend/tests/cli.test.ts` — unit tests
- **Key details:** Use Node.js `child_process.execFile` (NOT `exec`). Validate: formula names against `^[a-zA-Z0-9_.-]+$`, variable keys against `^[a-zA-Z0-9_]+$`, variable values against `^[^\x00-\x1f]+$` (no control chars). Set `cwd` to project root where `.beads/redirect` resolves. Timeout: 30s default, 60s for cook. Return `{ stdout, stderr, exitCode }`.
- **Acceptance criteria:**
  - [ ] Rejects formula names with shell metacharacters (`;`, `|`, `&`, `` ` ``, `$`)
  - [ ] Uses `execFile` not `exec` (no shell)
  - [ ] Tests cover: valid invocation, rejected input, timeout, non-zero exit
- **Dependencies:** 1.1

**1.4 Implement wave computation**
- **What:** Topological sort + level assignment algorithm for dependency frontier grouping
- **Files:**
  - Create: `beads-ide/packages/shared/src/wave.ts` — `computeWaves(beads: Bead[]): WaveResult`
  - Create: `beads-ide/packages/shared/tests/wave.test.ts` — unit tests with fixtures
  - Create: `beads-ide/packages/shared/tests/fixtures/` — test dependency graphs (linear, diamond, cyclic, disconnected)
- **Key details:** Filter dependencies to workflow types only (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`). BFS from zero-in-degree nodes. Detect cycles via remaining nodes after BFS completes. Return `{ waves: Wave[], cycles: string[][], hasCycles: boolean }`.
- **Acceptance criteria:**
  - [ ] Linear chain A→B→C produces 3 waves
  - [ ] Diamond pattern produces correct parallelism (B and C in same wave)
  - [ ] Cyclic graph detected, returns cycle members, `hasCycles: true`
  - [ ] Empty input returns empty waves
  - [ ] 200 beads computes in < 50ms
- **Dependencies:** 1.2

**1.5 Set up Vite frontend skeleton**
- **What:** Minimal React app with TanStack Router, Tailwind, and app shell
- **Files:**
  - Create: `beads-ide/apps/frontend/vite.config.ts` — dev server on 5173, proxy `/api` → `localhost:3001`, `@/` path alias
  - Create: `beads-ide/apps/frontend/src/main.tsx` — React root + TanStack Router + Sonner Toaster
  - Create: `beads-ide/apps/frontend/src/app.css` — Tailwind v4 imports, `brand-*` CSS variables, dark mode
  - Create: `beads-ide/apps/frontend/src/routes/__root.tsx` — root layout (placeholder shell)
  - Create: `beads-ide/apps/frontend/src/routes/index.tsx` — landing page (placeholder)
  - Create: `beads-ide/apps/frontend/src/lib/utils.ts` — `cn()` utility (clsx + twMerge)
  - Create: `beads-ide/apps/frontend/src/lib/api.ts` — typed fetch wrapper returning `ApiResponse<T>`
  - Create: `beads-ide/apps/frontend/tsconfig.json` — extends base, includes path aliases
- **Key details:** Follow openedi's Vite config pattern. Named exports only (no default exports). Biome for formatting/linting.
- **Acceptance criteria:**
  - [ ] `npm run dev` starts frontend on localhost:5173
  - [ ] Root route renders a placeholder page
  - [ ] Tailwind styles apply (dark mode works)
  - [ ] API proxy forwards `/api/*` to backend
- **Dependencies:** 1.1

**1.6 Set up backend API server**
- **What:** Hono HTTP server with health check and config routes
- **Files:**
  - Create: `beads-ide/apps/backend/src/index.ts` — Hono app, bind `127.0.0.1:3001`, register routes
  - Create: `beads-ide/apps/backend/src/config.ts` — load formula search paths, CLI binary locations, project root detection
  - Create: `beads-ide/apps/backend/src/routes/health.ts` — `GET /api/health` verifies `bd` CLI available
  - Create: `beads-ide/apps/backend/tsconfig.json` — extends base
- **Key details:** Bind to `127.0.0.1` only (spec security requirement). Use `@hono/node-server` for Node.js runtime. Config resolves formula search paths: `formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`. Skip missing directories gracefully.
- **Acceptance criteria:**
  - [ ] `npm run dev` starts backend on localhost:3001
  - [ ] `GET /api/health` returns `{ ok: true, bd_version: "..." }`
  - [ ] Server does NOT bind to 0.0.0.0 (verify with `netstat`)
  - [ ] Config correctly resolves formula search paths
- **Dependencies:** 1.1, 1.3

#### Phase 1 Exit Criteria
- [ ] Both dev servers start (`npm run dev` from workspace root starts frontend + backend)
- [ ] Health check passes
- [ ] Shared types importable from both apps
- [ ] All unit tests pass (CLI wrapper, wave computation)
- [ ] Biome lint clean

---

### Phase 2: Backend API + Frontend Shell (Parallel Tracks)

**Objective:** Complete backend API and frontend application shell. Three parallel tracks.
**Prerequisites:** Phase 1 (shared types, CLI wrapper, both servers running)

#### Track A: Backend API Routes

**2A.1 Formula routes**
- **What:** CRUD + cook + sling endpoints for formulas
- **Files:**
  - Create: `beads-ide/apps/backend/src/routes/formulas.ts`
  - Create: `beads-ide/apps/backend/tests/routes/formulas.test.ts`
- **Key details:**
  - `GET /api/formulas` — scan all search paths, return `FormulaFile[]` with name, path, directory
  - `GET /api/formulas/:name` — read and return formula TOML content + parsed structure
  - `PUT /api/formulas/:name` — write formula TOML to disk (auto-save target)
  - `POST /api/formulas/:name/cook` — invoke `bd cook <path> --json`, return `CookResult`
  - `POST /api/formulas/:name/sling` — invoke `gt sling <formula> <target>`, return status
  - All CLI calls use the `cli.ts` wrapper with validation
- **Acceptance criteria:**
  - [ ] List returns formulas from all 4 search paths
  - [ ] Cook returns proto beads JSON or error with stderr
  - [ ] Sling invokes `gt sling` with validated arguments
  - [ ] Invalid formula names rejected (400 with error message)
- **Dependencies:** 1.3, 1.6

**2A.2 Bead routes**
- **What:** Read-only bead data endpoints
- **Files:**
  - Create: `beads-ide/apps/backend/src/routes/beads.ts`
  - Create: `beads-ide/apps/backend/tests/routes/beads.test.ts`
- **Key details:**
  - `GET /api/beads` — invoke `bd list --json`, pass through query params as filters
  - `GET /api/beads/:id` — invoke `bd show <id> --json`
  - Parse `bd` JSON output into `Bead[]` / `Bead` types
- **Acceptance criteria:**
  - [ ] Returns actual beads from the BCC database
  - [ ] Single bead lookup works with real bead IDs
  - [ ] Handles `bd` errors gracefully (non-zero exit → error response)
- **Dependencies:** 1.3, 1.6

**2A.3 Graph routes**
- **What:** Graph metrics and analytics endpoints
- **Files:**
  - Create: `beads-ide/apps/backend/src/routes/graph.ts`
  - Create: `beads-ide/apps/backend/tests/routes/graph.test.ts`
- **Key details:**
  - `GET /api/graph/metrics` — invoke `bv --robot-insights --output-format json`
  - `GET /api/graph/export` — invoke `bv --export-graph - --output-format json` (stdout export)
  - Parse `bv` output into `GraphMetrics` types
- **Acceptance criteria:**
  - [ ] Returns 9 graph metrics (PageRank, betweenness, HITS, etc.)
  - [ ] Handles missing `bv` binary gracefully
- **Dependencies:** 1.3, 1.6

#### Track B: Frontend Application Shell

**2B.1 App shell layout**
- **What:** VS Code-style multi-panel layout with resizable panels
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/layout/app-shell.tsx` — three-panel layout (sidebar, main, detail)
  - Create: `beads-ide/apps/frontend/src/components/layout/sidebar.tsx` — left sidebar container
  - Create: `beads-ide/apps/frontend/src/components/layout/panel-resizer.tsx` — drag handle for panel resizing
  - Update: `beads-ide/apps/frontend/src/routes/__root.tsx` — wrap in AppShell
- **Key details:** Resizable panels using CSS `resize` or a lightweight library (`react-resizable-panels`). Persist panel sizes in `SessionState` (localStorage). Sidebar default 250px, collapsible. Minimum 1280x720 viewport.
- **Acceptance criteria:**
  - [ ] Three-panel layout renders correctly at 1280x720
  - [ ] Panels resize via drag handle
  - [ ] Panel sizes persist across page reloads (localStorage)
  - [ ] Sidebar collapses/expands
- **Dependencies:** 1.5

**2B.2 Formula file tree**
- **What:** Left sidebar showing formulas from all search paths as a file tree
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/layout/formula-tree.tsx` — tree view of formulas
  - Create: `beads-ide/apps/frontend/src/hooks/use-formulas.ts` — fetch formula list from API
- **Key details:** Group by search path directory. Show formula name, directory source. Click to navigate to formula editor route. Icons from Lucide (FileCode for formulas, Folder for directories). Handle empty/missing directories gracefully.
- **Acceptance criteria:**
  - [ ] Shows formulas from all available search paths
  - [ ] Click navigates to `/formula/:name`
  - [ ] Empty directories not shown
  - [ ] Loading state while fetching
- **Dependencies:** 1.5, 2A.1

**2B.3 Command palette**
- **What:** Cmd+K quick action palette
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/layout/command-palette.tsx` — modal command list
  - Create: `beads-ide/apps/frontend/src/hooks/use-hotkeys.ts` — TanStack Hotkeys integration
- **Key details:** Actions: open formula, cook preview, sling, switch view (graph/list/wave). Filter by typing. Keyboard navigation (up/down/enter/escape). Use TanStack Hotkeys for Cmd+K binding. Follow openedi's modal pattern (Dialog with overlay).
- **Acceptance criteria:**
  - [ ] Cmd+K opens palette
  - [ ] Type to filter actions
  - [ ] Keyboard navigation works
  - [ ] Escape closes
  - [ ] Actions trigger correct navigation/operations
- **Dependencies:** 1.5

#### Track C: Graph Library Benchmark

**2C.1 Graph library evaluation**
- **What:** Benchmark graph rendering performance with 200 nodes to select library
- **Files:**
  - Create: `beads-ide/apps/frontend/src/lib/graph-benchmark.ts` — test harness generating 200-node graphs
  - (Temporary: spike code, not production)
- **Key details:** Test each candidate (React Flow, Cytoscape.js, D3.js force simulation) with:
  - 200 nodes, ~300 edges (1.5 edges/node average)
  - Force-directed layout
  - Measure: initial render time, interaction latency (pan/zoom/drag)
  - Target: <1s initial render, <100ms interactions on Chrome 1280x720
  - Also evaluate: hierarchical layout support, manual positioning, click/hover events
- **Acceptance criteria:**
  - [ ] At least one library meets <1s render target for 200 nodes
  - [ ] Decision documented with benchmark results
  - [ ] Library added to frontend dependencies
- **Dependencies:** 1.5

#### Phase 2 Exit Criteria
- [ ] All backend API routes respond correctly with real BCC data
- [ ] App shell renders with sidebar, main panel, resizable layout
- [ ] Formula tree shows actual formulas from search paths
- [ ] Command palette opens with Cmd+K
- [ ] Graph library selected with benchmark evidence

---

### Phase 3: MVP Feature Panels (Parallel Tracks)

**Objective:** Build the three MVP pillars: Formula Editor, Cook Preview, Results Analysis.
**Prerequisites:** Phase 2A (backend API routes), Phase 2B (frontend shell)

#### Track A: Formula Editor

**3A.1 TOML text editor**
- **What:** CodeMirror 6 editor for `.formula.toml` files
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/formulas/text-editor.tsx` — CodeMirror wrapper
  - Create: `beads-ide/apps/frontend/src/lib/formula-parser.ts` — TOML parse + validate against Formula type
  - Create: `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — formula editor route
  - Create: `beads-ide/packages/shared/tests/formula-parser.test.ts` — parser tests with real formula fixtures
  - Create: `beads-ide/packages/shared/tests/fixtures/` — copy of BCC formula files for testing
- **Key details:** CodeMirror 6 with `@codemirror/lang-json` (TOML syntax via custom or community extension). `smol-toml` for parsing. Validate parsed TOML against `Formula` type shape. Show inline diagnostics for parse errors. Editor fills main panel.
- **Acceptance criteria:**
  - [ ] Opens and renders real `.formula.toml` files (e.g., `explore-module.formula.toml`)
  - [ ] TOML syntax highlighting
  - [ ] Parse errors shown inline
  - [ ] Formula type validation (missing required fields flagged)
  - [ ] Ctrl+Z undo/redo works
- **Dependencies:** 2A.1, 2B.1

**3A.2 Variables panel**
- **What:** Form UI for formula variables alongside editor
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/formulas/vars-panel.tsx` — variable form
- **Key details:** Render each `VarDef` as a form field: text input (default), dropdown (if `enum`), checkbox (if `type: bool`). Show description, required indicator, default value. Highlight unbound required vars in red. Changes update the TOML source in the editor.
- **Acceptance criteria:**
  - [ ] Renders all vars from a formula
  - [ ] Required vars visually distinguished
  - [ ] Enum vars render as dropdown
  - [ ] Editing a var value updates the TOML source
- **Dependencies:** 3A.1

**3A.3 Auto-save with debounce**
- **What:** Save formula to disk on 500ms debounce after edit
- **Files:**
  - Create: `beads-ide/apps/frontend/src/hooks/use-auto-save.ts` — debounced save hook
- **Key details:** `useEffect` + `setTimeout(500ms)` pattern. Call `PUT /api/formulas/:name` with current TOML content. Show save indicator (subtle "Saved" text or checkmark). Handle save errors with toast.
- **Acceptance criteria:**
  - [ ] Saves 500ms after last keystroke
  - [ ] No save during active typing (debounce resets)
  - [ ] Save failure shows toast error
  - [ ] Visual indicator of save state (saving/saved/error)
- **Dependencies:** 3A.1, 2A.1

#### Track B: Cook Preview

**3B.1 Cook preview panel**
- **What:** Split view showing formula left, proto beads right
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/preview/cook-preview.tsx` — split view container
  - Create: `beads-ide/apps/frontend/src/components/preview/proto-bead-list.tsx` — proto bead cards
  - Create: `beads-ide/apps/frontend/src/hooks/use-cook.ts` — cook API hook with debounced trigger
- **Key details:** Right panel shows `CookResult.proto_beads` as cards (title, type badge, dependency count). Unbound vars from `CookResult.unbound_vars` highlighted in red with "Blocks pour" indicator. Cook errors shown inline with stderr. Re-cooks on debounced save (500ms) — NOT streaming. Show "Cooking..." spinner during invocation.
- **Acceptance criteria:**
  - [ ] Split view: formula editor left, preview right
  - [ ] Proto beads render as cards with title, type, status
  - [ ] Unbound variables highlighted in red
  - [ ] Cook error stderr shown inline
  - [ ] Re-cooks automatically on save
  - [ ] Loading spinner during cook
- **Dependencies:** 2A.1, 3A.1

#### Track C: Results List & Detail

**3C.1 Bead list view**
- **What:** List of beads with faceted filtering, grouped by epic/type/status
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/beads/bead-list.tsx` — bead list with grouping
  - Create: `beads-ide/apps/frontend/src/components/beads/bead-status-badge.tsx` — status pill (copy openedi `statusConfig` pattern)
  - Create: `beads-ide/apps/frontend/src/components/beads/bead-filters.tsx` — faceted filter panel
  - Create: `beads-ide/apps/frontend/src/hooks/use-beads.ts` — fetch beads from API
  - Create: `beads-ide/apps/frontend/src/routes/results.$id.tsx` — results analysis route
- **Key details:** Follow openedi's `transaction-list.tsx` pattern. Group by: epic parent, type, or status (user toggles). Filter by: status, type, priority, labels. Client-side filtering (<100ms for 200 beads). Status badge with `statusConfig` map: status → `{ label, color, bgColor }`.
- **Acceptance criteria:**
  - [ ] Lists actual beads from BCC database
  - [ ] Grouping by epic/type/status works
  - [ ] Filters narrow the list interactively
  - [ ] Client-side filter <100ms for 200 beads
  - [ ] Status badges render with correct colors
- **Dependencies:** 2A.2, 2B.1

**3C.2 Bead detail panel**
- **What:** Read-only side panel showing bead details
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/beads/bead-detail.tsx` — detail side panel
- **Key details:** Follow openedi's `transaction-detail-modal.tsx` slide-in pattern. Shows: title, description, design, acceptance criteria, status, priority, type, labels, assignee, dependencies, timestamps. Read-only (spec: not CRUD). Rich text rendering for description fields (markdown).
- **Acceptance criteria:**
  - [ ] Click bead in list opens detail panel
  - [ ] All bead fields rendered
  - [ ] Markdown in description renders correctly
  - [ ] Panel is read-only (no edit controls)
  - [ ] Close button/escape dismisses
- **Dependencies:** 3C.1

#### Phase 3 Exit Criteria
- [ ] Can open a formula, edit TOML, and see it auto-save
- [ ] Cook preview shows proto beads for a real formula
- [ ] Bead list shows actual BCC beads with working filters
- [ ] Bead detail panel shows full bead information

---

### Phase 4: Advanced Views (Parallel Tracks)

**Objective:** Wave view, graph visualization with metrics, sling integration.
**Prerequisites:** Phase 3 (all three MVP panels functional)

#### Track A: Wave View

**4A.1 Wave view component**
- **What:** Beads grouped by dependency frontier
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/results/wave-view.tsx` — wave grouping display
- **Key details:** Use `computeWaves()` from shared package. Render waves as collapsible sections: "Wave 1 (Now) — 5 beads", "Wave 2 (Next) — 8 beads", etc. Each section contains bead cards. If cycles detected, show warning banner and fall back to flat list. Tab switching: list/wave/graph views in results route.
- **Acceptance criteria:**
  - [ ] Waves computed from actual BCC bead dependencies
  - [ ] Beads grouped correctly by dependency frontier
  - [ ] Cycle warning shown when cycles exist
  - [ ] Fallback to list on cycle
  - [ ] View switcher (list/wave/graph) works
- **Dependencies:** 1.4, 3C.1

#### Track B: Graph View

**4B.1 Graph visualization with metrics**
- **What:** Interactive dependency graph with 9 metrics overlay
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/results/graph-view.tsx` — graph canvas
  - Create: `beads-ide/apps/frontend/src/components/results/graph-controls.tsx` — layout switcher, metric selector, zoom controls
  - Create: `beads-ide/apps/frontend/src/hooks/use-graph.ts` — graph data + metrics from API
- **Key details:** Use library selected in Phase 2C. Node shape by type (hexagon=epic, circle=task per spec). Edge style by dependency type (solid=blocks, dashed=related). 3 layout algorithms: force-directed (default), hierarchical, manual (positions saved in SessionState). Metrics overlay: select metric → node size/color reflects value. 9 metrics from `bv --robot-insights`. Dense graph handling: auto-cluster by epic at >30 visible nodes, focus mode (N-hop neighborhood).
- **Acceptance criteria:**
  - [ ] Renders 200 beads in <1s (Chrome, 1280x720)
  - [ ] Pan/zoom/drag <100ms
  - [ ] Three layout algorithms switch correctly
  - [ ] Metrics overlay changes node appearance
  - [ ] Node shapes differ by bead type
  - [ ] Edge styles differ by dependency type
  - [ ] Click node opens bead detail panel
- **Dependencies:** 2A.3, 2C.1, 3C.1

**4B.2 Dense graph handling**
- **What:** Simplification strategies for 50-200 bead graphs
- **Files:**
  - Update: `beads-ide/apps/frontend/src/components/results/graph-view.tsx` — add clustering, focus mode
  - Update: `beads-ide/apps/frontend/src/components/results/graph-controls.tsx` — add simplification toggles
- **Key details:** Auto-cluster by epic (collapse epic's children into single node). Focus mode: click node to show N-hop neighborhood (default N=2). Semantic zoom: show less detail when zoomed out (hide labels, simplify edges). Density indicator in health panel: warn >0.10, red >0.12.
- **Acceptance criteria:**
  - [ ] Epic clustering reduces visible nodes
  - [ ] Focus mode shows neighborhood of selected node
  - [ ] Density indicator shows correct value
  - [ ] Density warnings at thresholds
- **Dependencies:** 4B.1

#### Track C: Sling Integration

**4C.1 Sling workflow**
- **What:** Trigger `gt sling` from IDE with target selection
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/formulas/sling-dialog.tsx` — target selection modal
  - Update: `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — add Sling button
- **Key details:** From previewed formula, "Sling" button (or Cmd+K → "sling") opens dialog. User selects target (agent/crew) — populate from context or free text. Submit invokes `POST /api/formulas/:name/sling`. Status indicator while running. On completion, navigate to results view. On failure, toast with error.
- **Acceptance criteria:**
  - [ ] Sling button visible from formula editor
  - [ ] Dialog allows target selection
  - [ ] Invokes `gt sling` via backend
  - [ ] Status indicator during execution
  - [ ] Success navigates to results
  - [ ] Failure shows error toast
- **Dependencies:** 2A.1, 3A.1

#### Phase 4 Exit Criteria
- [ ] Wave view correctly groups beads by dependency frontier
- [ ] Graph renders 200 beads <1s with metrics overlay
- [ ] Sling triggers `gt sling` and shows results on completion
- [ ] All three result views (list/wave/graph) switchable

---

### Phase 5: Visual Builder, Polish & Testing

**Objective:** Read-only visual formula builder, error handling, accessibility, performance validation, E2E tests.
**Prerequisites:** Phase 4 (all features functional)

#### Tasks

**5.1 Visual formula builder (read-only)**
- **What:** Node-based DAG visualization of formula steps (read-only, TOML→visual)
- **Files:**
  - Create: `beads-ide/apps/frontend/src/components/formulas/visual-builder.tsx` — step DAG visualization
  - Update: `beads-ide/apps/frontend/src/routes/formula.$name.tsx` — add view toggle (text/visual)
- **Key details:** Render formula steps as nodes in a DAG based on `needs` dependencies. Show: step title, step id, dependency arrows. Use the same graph library from Phase 2C. Toggle between text editor and visual view (spec: "both modes stay in sync" — in MVP, visual is read-only from parsed TOML). Variables shown as input ports on nodes.
- **Acceptance criteria:**
  - [ ] Formula steps render as DAG nodes
  - [ ] Dependencies shown as directed edges
  - [ ] Toggle between text and visual view
  - [ ] Visual view updates when TOML changes (one-way sync)
- **Dependencies:** 3A.1, 2C.1

**5.2 Error handling for all failure modes**
- **What:** Implement all error scenarios from spec Error Handling section
- **Files:**
  - Update: `beads-ide/apps/frontend/src/lib/api.ts` — connection error detection, offline mode
  - Update: `beads-ide/apps/frontend/src/routes/__root.tsx` — error boundary
  - Create: `beads-ide/apps/frontend/src/components/ui/error-page.tsx` — "Cannot connect" page
  - Create: `beads-ide/apps/frontend/src/components/ui/offline-banner.tsx` — "Database unavailable" banner
- **Key details:** Per spec Error Handling table: backend not running → error page; cook fail → inline error; sling fail → toast with retry; database unavailable → degraded mode (formula editing still works); formula validation → inline highlighting; wave cycle → warning + list fallback.
- **Acceptance criteria:**
  - [ ] Backend down → error page renders (not blank screen)
  - [ ] Cook failure shows stderr inline
  - [ ] Sling failure shows toast with error details
  - [ ] Formula editing works even when database is down
- **Dependencies:** 3A.1, 3B.1, 4C.1

**5.3 Accessibility pass (WCAG 2.1 AA)**
- **What:** Ensure all components meet accessibility requirements
- **Files:**
  - Update: multiple component files across `components/`
- **Key details:** Per spec: screen reader tree/list alternative for graph; shape + icon as primary differentiators (not color alone); keyboard navigation for all operations; proper heading hierarchy; `aria-label` on icon-only buttons; `aria-live` for loading states; focus management in command palette and dialogs; `type="button"` on all non-submit buttons.
- **Acceptance criteria:**
  - [ ] All interactive elements keyboard-navigable
  - [ ] Screen reader can navigate formula tree, bead list
  - [ ] Graph has list/tree alternative view
  - [ ] No color-only encoding (shapes + icons always present)
  - [ ] Command palette traps focus correctly
- **Dependencies:** All Phase 3 + 4 tasks

**5.4 Performance benchmarks**
- **What:** Validate all performance targets from spec
- **Files:**
  - Create: `beads-ide/apps/frontend/tests/performance/` — benchmark scripts
- **Key details:** Test against spec targets: graph render <1s for 200 beads (Chrome, 1280x720), pan/zoom/drag <100ms, search/filter <100ms for 200 beads, cook re-invoke within 500ms debounce.
- **Acceptance criteria:**
  - [ ] Graph: 200 beads renders <1s (measured via Performance API)
  - [ ] Interactions: pan/zoom/drag <100ms
  - [ ] Filters: <100ms for 200 beads
  - [ ] Cook debounce fires correctly at 500ms
- **Dependencies:** 4B.1

**5.5 E2E tests**
- **What:** End-to-end test suite covering the full MVP workflow
- **Files:**
  - Create: `beads-ide/apps/frontend/tests/e2e/formula-workflow.spec.ts` — edit → cook → analyze flow
  - Create: `beads-ide/apps/frontend/tests/e2e/fixtures/` — test formula files, mock CLI responses
- **Key details:** Playwright with custom fixtures that set up test formulas and mock `bd`/`gt` CLI responses. Test: open formula → edit → auto-save → cook preview → view results → switch views (list/wave/graph). Use openedi's fixture pattern (`base.extend()` for setup/teardown).
- **Acceptance criteria:**
  - [ ] E2E: formula edit → cook → preview beads flow passes
  - [ ] E2E: results view → list/wave/graph switching works
  - [ ] E2E: command palette navigation works
  - [ ] Tests run in <60s
- **Dependencies:** All Phase 3 + 4 tasks

#### Phase 5 Exit Criteria
- [ ] Visual formula builder shows step DAG (read-only)
- [ ] All error scenarios handled gracefully
- [ ] Accessibility audit passes (keyboard nav, screen reader, no color-only encoding)
- [ ] Performance targets met with benchmark evidence
- [ ] E2E test suite passes

---

## Cross-Cutting Concerns

### Error Handling
Use try/catch with `finally` for loading state reset (openedi pattern). User-facing errors via `toast.error()` (Sonner). Backend returns `ApiResponse<T>` envelope with `{ data, error }` — never raw exceptions. Connection errors detected by `api.ts` fetch wrapper and surface as error page or degraded mode. See Phase 5.2 for full failure mode matrix.

### Testing Strategy
| Phase | Test Type | What |
|-------|-----------|------|
| 1 | Unit (Vitest) | CLI wrapper validation, wave computation, formula parser |
| 2 | Unit + Integration | Backend route handlers (real CLI calls), API client |
| 3-4 | Component | Individual panel rendering, filter logic |
| 5 | E2E (Playwright) | Full workflow: edit → cook → analyze |
| 5 | Performance | Graph render benchmarks at 50/100/200 nodes |

Test files in `tests/` directories (not co-located). Fixture files for formula TOML samples and mock CLI responses.

### Migration
No migration needed. The IDE is a greenfield project that reads existing data via CLI. No schema changes, no data migration, no backward compatibility concerns.

---

## Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Graph library fails 200-node benchmark | Medium | High | Phase 2C evaluates 3 candidates before committing; D3.js fallback has highest perf ceiling |
| TOML ↔ visual bidirectional sync too complex | High | Medium | MVP uses read-only visual view (TOML→visual only); write-back deferred to post-MVP |
| `bd cook` latency too high for debounced preview | Low | Medium | Measure in Phase 3; if >2s, increase debounce or add manual "Cook" button |
| Formula schema evolves (new fields in `bd`) | Low | Low | Types derived from docs, not hardcoded; update `shared/types.ts` when schema changes |
| CodeMirror TOML extension quality | Medium | Low | Fall back to plain text mode if TOML extension unreliable; syntax highlighting is nice-to-have |
| `bv` JSON output format unstable | Low | Medium | Backend parses and normalizes; frontend consumes typed `GraphMetrics` |

---

## Spec Coverage Matrix

| Spec Section | Plan Section | Phase |
|-------------|-------------|-------|
| Overview / Positioning | Architecture Decisions | — |
| What This Is / Is NOT | Architecture Decisions (scope boundaries) | — |
| Core Decisions: Identity & Scope | Architecture Decisions table | — |
| Core Decisions: MVP Scope | Phase 3 (three tracks = three pillars) | 3 |
| Core Decisions: Execution Model | 2A.1 (cook route), 4C.1 (sling) | 2, 4 |
| Core Decisions: Branching | Deferred (data branches via `bd`; no IDE UI for branch management in MVP) | — |
| What's In Scope: Formula editing | 3A.1-3A.3 (text editor, vars, auto-save) | 3 |
| What's In Scope: Cook preview | 3B.1 (cook preview panel) | 3 |
| What's In Scope: Sling integration | 4C.1 (sling workflow) | 4 |
| What's In Scope: Results analysis | 3C.1-3C.2 (list, detail) | 3 |
| What's In Scope: Wave view | 4A.1 (wave view) | 4 |
| What's In Scope: Graph with metrics | 4B.1-4B.2 (graph view, dense handling) | 4 |
| What's In Scope: Data layer | 2A.1-2A.3 (backend API routes) | 2 |
| What's Out of Scope | Not implemented (confirmed) | — |
| Post-MVP Features | Not implemented (confirmed deferred) | — |
| Terminology | Shared types (1.2), UI labels in components | 1, 3-4 |
| Architecture: Tech Stack | 1.1 (scaffolding), Architecture Decisions | 1 |
| Architecture: Backend Layer | 1.6, 2A.1-2A.3 (backend routes) | 1, 2 |
| Architecture: Data Layer | 1.3 (CLI wrapper), 2A.1-2A.3 (routes) | 1, 2 |
| Architecture: Branching Model | Out of MVP UI scope (branches created by formulas via CLI) | — |
| Architecture: IDE Replaces bv | 4B.1 (graph view with 9 metrics) | 4 |
| UI: Reference Patterns | 2B.1 (app shell), component patterns throughout | 2-4 |
| UI: Layout | 2B.1 (multi-panel layout) | 2 |
| UI: Navigation | 2B.2 (formula tree), 2B.3 (command palette) | 2 |
| UI: Formula Builder | 3A.1 (text), 5.1 (visual read-only) | 3, 5 |
| UI: Cook Preview | 3B.1 | 3 |
| UI: Results Analysis | 3C.1-3C.2, 4A.1, 4B.1 | 3, 4 |
| UI: Graph View | 4B.1-4B.2 | 4 |
| Workflows: Formula Editing | 3A.1-3A.3 | 3 |
| Workflows: Cook Preview | 3B.1 | 3 |
| Workflows: Sling | 4C.1 | 4 |
| Workflows: Results Analysis | 3C.1, 4A.1, 4B.1 | 3, 4 |
| First-Run Experience | 1.6 (health check), 2B.2 (formula gallery) | 1, 2 |
| Auto-Filled Answers: Editing & UX | 3A.1 (undo/redo), 3A.3 (auto-save) | 3 |
| Auto-Filled Answers: Graph Interaction | 4B.1 (drag, context menu, keyboard) | 4 |
| Auto-Filled Answers: Accessibility | 5.3 (WCAG 2.1 AA pass) | 5 |
| Auto-Filled Answers: Visual Encoding | 4B.1 (shape + icon for types, line-style for edges) | 4 |
| Auto-Filled Answers: Schema & Fields | 3C.2 (progressive disclosure in detail panel) | 3 |
| Auto-Filled Answers: Quality & Validation | 4B.2 (density warnings) | 4 |
| Technical Constraints: Performance | 2C.1 (benchmark), 5.4 (validation) | 2, 5 |
| Technical Constraints: Platform | 1.5 (Vite config, browser targets) | 1 |
| Technical Constraints: Scale | 4B.2 (dense graph handling) | 4 |
| Error Handling | 5.2 (all failure modes) | 5 |
| Security | 1.3 (CLI wrapper), 1.6 (localhost-only) | 1 |
| Testing Strategy | 5.5 (E2E), unit tests throughout | 1-5 |
| Success Criteria | Validated by E2E tests (5.5) and benchmarks (5.4) | 5 |

---

## Appendix: Key File Paths

### New Files (by phase)

| Path | Phase | Purpose |
|------|-------|---------|
| `beads-ide/package.json` | 1 | Workspace root |
| `beads-ide/biome.json` | 1 | Linter/formatter config |
| `beads-ide/tsconfig.base.json` | 1 | Shared TypeScript config |
| `beads-ide/packages/shared/src/types.ts` | 1 | Core domain types |
| `beads-ide/packages/shared/src/ide-types.ts` | 1 | IDE-specific types |
| `beads-ide/packages/shared/src/wave.ts` | 1 | Wave computation algorithm |
| `beads-ide/apps/backend/src/index.ts` | 1 | Backend entry point |
| `beads-ide/apps/backend/src/cli.ts` | 1 | Secure CLI wrapper |
| `beads-ide/apps/backend/src/config.ts` | 1 | Config + path resolution |
| `beads-ide/apps/backend/src/routes/health.ts` | 1 | Health check route |
| `beads-ide/apps/backend/src/routes/formulas.ts` | 2 | Formula CRUD + cook + sling |
| `beads-ide/apps/backend/src/routes/beads.ts` | 2 | Bead read proxy |
| `beads-ide/apps/backend/src/routes/graph.ts` | 2 | Graph metrics proxy |
| `beads-ide/apps/frontend/src/main.tsx` | 1 | Frontend entry point |
| `beads-ide/apps/frontend/src/routes/__root.tsx` | 1 | Root layout |
| `beads-ide/apps/frontend/src/lib/api.ts` | 1 | API client |
| `beads-ide/apps/frontend/src/lib/utils.ts` | 1 | cn() utility |
| `beads-ide/apps/frontend/src/components/layout/app-shell.tsx` | 2 | Multi-panel layout |
| `beads-ide/apps/frontend/src/components/layout/formula-tree.tsx` | 2 | Sidebar file tree |
| `beads-ide/apps/frontend/src/components/layout/command-palette.tsx` | 2 | Cmd+K palette |
| `beads-ide/apps/frontend/src/components/formulas/text-editor.tsx` | 3 | TOML editor |
| `beads-ide/apps/frontend/src/components/formulas/vars-panel.tsx` | 3 | Variable form |
| `beads-ide/apps/frontend/src/components/formulas/sling-dialog.tsx` | 4 | Sling target selection |
| `beads-ide/apps/frontend/src/components/formulas/visual-builder.tsx` | 5 | Step DAG (read-only) |
| `beads-ide/apps/frontend/src/components/preview/cook-preview.tsx` | 3 | Split view preview |
| `beads-ide/apps/frontend/src/components/preview/proto-bead-list.tsx` | 3 | Proto bead cards |
| `beads-ide/apps/frontend/src/components/beads/bead-list.tsx` | 3 | Bead list + grouping |
| `beads-ide/apps/frontend/src/components/beads/bead-detail.tsx` | 3 | Read-only detail panel |
| `beads-ide/apps/frontend/src/components/beads/bead-status-badge.tsx` | 3 | Status pill |
| `beads-ide/apps/frontend/src/components/beads/bead-filters.tsx` | 3 | Faceted filter panel |
| `beads-ide/apps/frontend/src/components/results/wave-view.tsx` | 4 | Wave grouping |
| `beads-ide/apps/frontend/src/components/results/graph-view.tsx` | 4 | Graph visualization |
| `beads-ide/apps/frontend/src/components/results/graph-controls.tsx` | 4 | Layout/metric controls |
| `beads-ide/apps/frontend/src/routes/formula.$name.tsx` | 3 | Formula editor route |
| `beads-ide/apps/frontend/src/routes/results.$id.tsx` | 3 | Results analysis route |

### Existing Files (referenced, not modified)

| Path | Why Referenced |
|------|---------------|
| `docs/beads.md` | Source of truth for Bead TypeScript types |
| `docs/formulas.md` | Source of truth for Formula TypeScript types |
| `formulas/*.formula.toml` | Content loaded by IDE formula tree |
| `.beads/config.yaml` | Backend reads for project config |
| `.beads/metadata.json` | Confirms Dolt backend mode |
