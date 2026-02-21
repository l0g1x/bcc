# Codebase Analysis: beads-ide

**Generated:** 2026-02-21
**Source:** 3-agent parallel exploration

---

## Architecture Overview

### Project Structure & Context

The BCC (Beads Compiler Collection) workspace at `/home/krystian/gt/bcc/crew/krystian` is a **CLI-only project with zero existing UI code**. It contains documentation, formula templates, and operational scripts. There is no frontend, backend server, package.json, or build system in this directory.

**Top-level directory layout:**

```
/home/krystian/gt/bcc/crew/krystian/
├── .beads/                  # Symlink redirect → ../../.beads (shared bead DB)
├── .claude/                 # Claude Code configuration
├── .opencode/               # OpenCode editor config
├── .git/                    # Git repo
├── .runtime/                # Gas Town runtime state (gitignored)
├── docs/
│   ├── beads.md             # Full bead data schema (source: ~/beads/internal/types/types.go)
│   └── formulas.md          # Formula schema reference (source: ~/beads/internal/formula/types.go)
├── formulas/                # BCC-specific workflow formula templates (4 files)
│   ├── analyze-api-boundary.formula.toml
│   ├── discover-and-dive.formula.toml
│   ├── explore-module.formula.toml
│   └── future-work-scaffold.formula.toml
├── mail/                    # Agent mail inbox directory
├── plans/                   # Feature planning workspace
│   └── beads-ide/           # This feature's planning directory
├── README.md                # "BCC - Beads Compiler Collection"
├── SKILL.md                 # BCC compiler specification (21KB), 4-phase architecture
└── state.json               # Polecat session state
```

**Shared bead database:** Lives at `/home/krystian/gt/bcc/.beads/`, accessible via `.beads/redirect` symlink. Uses **Dolt (MySQL wire protocol, server mode)**, not SQLite, as configured in `/home/krystian/gt/bcc/.beads/metadata.json`:

```json
{
  "backend": "dolt",
  "database": "dolt",
  "dolt_database": "bcc",
  "dolt_mode": "server",
  "jsonl_export": "issues.jsonl"
}
```

**Broader BCC Rig Context:**

```
/home/krystian/gt/bcc/
├── .beads/                  # Shared bead DB (Dolt, server mode)
├── config.json              # Rig config: name=bcc, prefix=bcc, git_url=github
├── crew/
│   └── krystian/            # The current workspace
├── mayor/rig/               # Mayor's workspace (SKILL.md, formulas, docs)
├── plugins/                 # Empty
├── polecats/                # Polecat agent directories
├── refinery/                # Merge queue processor
├── settings/                # Empty
└── witness/                 # Per-rig health monitor
```

### Beads IDE is a Greenfield Build

The IDE is a **net-new project** that sits adjacent to the BCC rig workspace. It does not extend any existing code — there is nothing to extend. It must be created as a new directory structure. Recommended placement:

```
/home/krystian/gt/bcc/crew/krystian/beads-ide/
├── frontend/                # Vite + React SPA
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── backend/                 # Node.js API server (localhost)
    ├── src/
    └── package.json
```

Alternatively, using a monorepo with npm workspaces (simpler than Turborepo for 2 packages):

```
beads-ide/
├── package.json             # Workspace root
├── apps/
│   ├── frontend/            # Vite + React SPA (port 5173)
│   └── backend/             # Node.js API server (port 3001)
└── packages/
    └── shared/              # Shared TypeScript types (Formula, Bead, etc.)
```

### Reference Architecture: openedi

The most relevant existing UI project is `openedi` at `/home/krystian/gt/deacon/dogs/bravo/openedi/`. Its patterns are directly applicable:

**Tech stack alignment:**
- `openedi` uses: Vite + React + TypeScript + Tailwind CSS v4 + TanStack Router + Biome
- `beads-ide` spec calls for: Vite + React SPA + TanStack Hotkeys + TipTap
- Both are local SPAs, TypeScript-strict, component-based

**openedi package structure (reference):**

```
openedi/
├── apps/web/
│   ├── src/
│   │   ├── components/      # React components by domain
│   │   ├── routes/          # TanStack Router file-based routing
│   │   └── lib/             # Shared utilities
│   └── package.json
└── packages/
    ├── ui/                  # Shared UI components
    ├── backend/             # Convex backend (NOT applicable here)
    ├── shared/              # Shared types/utilities
    └── config/              # Shared tooling config
```

**Key difference:** `openedi` uses Convex for real-time backend. `beads-ide` uses a **lightweight Node.js API server** proxying `bd` CLI — no real-time sync needed (single operator, local tool).

### Formula Search Paths (Critical for IDE)

The `gt formula list` command resolves formulas from three locations in priority order:

1. **`.beads/formulas/`** (project level) — in BCC: currently 0 formulas (directory may not exist yet)
2. **`~/.beads/formulas/`** (user level) — may contain user formulas
3. **`$GT_ROOT/.beads/formulas/`** (orchestrator level) — 59 formulas at `/home/krystian/gt/.beads/formulas/`

The spec defines **four** formula search paths:
- `formulas/` (project root — BCC convention, not a `gt formula list` search path)
- `.beads/formulas/` (project beads)
- `~/.beads/formulas/` (user)
- `$GT_ROOT/.beads/formulas/` (Gas Town)

**In BCC project:**
- `formulas/` = `/home/krystian/gt/bcc/crew/krystian/formulas/` (4 reference formulas exist)
- `.beads/formulas/` = `/home/krystian/gt/bcc/.beads/formulas/` (via symlink; may not exist)
- `~/.beads/formulas/` = `$HOME/.beads/formulas/`
- `$GT_ROOT/.beads/formulas/` = `/home/krystian/gt/.beads/formulas/` (59 formulas)

The IDE's file tree must handle all four and gracefully skip missing directories.

---

## Integration Surface

### Files That Will Need Modification

**Existing files in BCC project** — No existing UI code exists, so no application files need modification. However, two categories of existing files serve as authoritative data contracts:

#### `/home/krystian/gt/bcc/crew/krystian/docs/beads.md`
- **Consumed by:** Schema definitions for TypeScript types the IDE uses
- **What the spec requires:** The IDE renders all bead fields: `title`, `description`, `design`, `acceptance_criteria`, `notes`, `status`, `priority`, `issue_type`, `assignee`, `labels`, `dependencies`, `created_at`, `updated_at`, `closed_at`, and computed fields `dependency_count`, `dependent_count`, `comment_count`
- **Impact:** No modification. This is the source of truth from which the IDE's `Bead` TypeScript interface is derived.

#### `/home/krystian/gt/bcc/crew/krystian/docs/formulas.md`
- **Consumed by:** The formula editor's schema understanding and TOML parser configuration
- **What the spec requires:** The visual formula builder must understand the full `Formula` struct: `vars`, `steps`, `compose`, `advice`, `pointcuts`, recursive `children`, `loop`, `gate`, `on_complete`
- **Impact:** No modification. This is the authoritative source from which the IDE's `Formula` TypeScript interface is derived.

#### `/home/krystian/gt/bcc/crew/krystian/formulas/*.formula.toml`
- **4 files:** `explore-module.formula.toml`, `analyze-api-boundary.formula.toml`, `discover-and-dive.formula.toml`, `future-work-scaffold.formula.toml`
- **Consumed by:** Formula file tree (left sidebar) — these are loaded and displayed as existing formulas
- **Impact:** No modification. These are content the IDE reads and displays.

#### `/home/krystian/gt/bcc/.beads/config.yaml`
- **Current content:** `prefix: bcc`, `sync.mode: dolt-native`
- **Impact:** The backend API server reads this to locate the `.beads/` directory. No modification needed.

**New files to create:** The beads-ide is a new project. All application files will be created as described in the Frontend Architecture section.

---

## Patterns & Conventions

### Project Structure Pattern

The IDE frontend should mirror `openedi`'s structure under `src/`:

```
src/
  routes/            # TanStack Router pages (one file per route)
  components/
    layout/          # sidebar, header, panels
    formulas/        # formula-domain components
    beads/           # bead-domain components
    graph/           # graph visualization components
    ui/              # shared primitives (Button, Badge, etc.)
  lib/               # utils, hooks, API client
  hooks/             # custom hooks
  main.tsx
  app.css
```

### Component Structure Pattern

Each feature domain follows:
1. **Feature index barrel** (`index.ts`) — re-exports all public components and types
2. **One component per file**, named with domain prefix: `formula-list.tsx`, `formula-editor.tsx`
3. **Types co-located** with components that own them, exported from the same file
4. **Helper sub-components** defined in the same file as their parent (private, not exported)
5. **Utility functions** (e.g., `formatTimestamp`) at the top of the file before the exported component

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case.tsx` | `formula-editor.tsx`, `bead-list.tsx` |
| Components | `PascalCase` named export (no default exports) | `export function FormulaEditor(...)` |
| Types/Interfaces | `PascalCase` | `FormulaEditorProps`, `Bead` |
| Props interfaces | `ComponentNameProps` | `FormulaEditorProps`, `BeadListProps` |
| Helper functions | `camelCase`, descriptive verb | `formatTimestamp`, `getStatusLabel` |
| Route files | TanStack convention: path-based | `formulas.tsx`, `formulas.$name.tsx` |
| Constants | `SCREAMING_SNAKE_CASE` for module-level | `const VALID_FORMULA_NAMES = [...]` |
| Config/data objects | `camelCase` const arrays | `const beadStatuses = [...]` |

### Styling Pattern

**Tailwind CSS v4** with `cn()` utility for conditional classes:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Always use `cn()` for conditional class merging. Never string-concatenate Tailwind classes.

**Color palette:** `zinc` for neutrals, `brand-*` for primary accent (custom CSS variable in `app.css`), semantic colors (`red`, `green`, `yellow`) for status. Dark mode is `dark:` variant throughout.

**Typography scale:** `text-xs`, `text-sm` (body), `text-lg font-semibold` (headings). `font-mono` for code/IDs.

**Status badges:** Rounded-full pills with `px-2 py-0.5 text-xs font-medium`. Config objects map status → `{ label, color, bgColor }`.

### State Management Pattern

No global state library. Uses:
- `useState` for local UI state (tabs, selected items, filter visibility)
- `useMemo` for derived data (maps from arrays)
- `useCallback` for stable callback refs (keyboard handlers)
- Props-down for shared state (lift state to route, pass down as props)

Route-level components own all data-fetching state. Children are pure/controlled.

### Path Aliases

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  }
}
```

```typescript
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

Import using `@/` prefix for all src-relative imports.

### Routing

**TanStack Router v1** with file-based routes under `src/routes/`. Route files define and export `Route`:

```typescript
export const Route = createFileRoute('/formulas')({
  component: FormulasPage,
})

function FormulasPage() { ... }
```

Root layout in `__root.tsx` wraps all pages in the sidebar+main layout.

### Icon Library

**Lucide React** exclusively (`lucide-react`). Named imports:
```typescript
import { AlertCircle, ChevronRight, X } from 'lucide-react'
```

Size via Tailwind: `className="h-4 w-4"` or `h-5 w-5`.

### Toast Notifications

**Sonner** (`sonner`) via `<Toaster position="top-right" richColors />` in `main.tsx`. Invoke via `toast()` / `toast.error()` / `toast.success()`.

### UI Primitives

**CVA (class-variance-authority)** + **Radix UI Slot** for Button. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`.

### Error Handling Pattern

Mutations use try/catch with local loading state. Use `toast.error(message)` for user-facing errors:

```typescript
const handleSave = async (formula: Formula) => {
  setSaving(true)
  try {
    await saveFormula(formula)
    toast.success('Formula saved')
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    setSaving(false)
  }
}
```

### Formatter & Linter

**Biome** (`@biomejs/biome`) handles both formatting AND linting (replaces ESLint + Prettier):

**Key style rules:**
- Single quotes for JS strings
- No semicolons (except where required)
- 2-space indentation
- 100 char line width
- Trailing commas in multi-line (ES5 style)

**Linting rules enforced:**
- `"useImportType": "error"` — must use `import type` for type-only imports
- `"noNonNullAssertion": "warn"` — avoid `!` non-null assertions
- `"noExplicitAny": "warn"` — avoid `any` type
- `"noUselessFragments": "warn"` — no unnecessary `<>` wrappers

### TypeScript Strictness

`tsconfig.json` enables full strict mode:
- `"strict": true`
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"noFallthroughCasesInSwitch": true`

Target: ES2022. Module resolution: bundler.

### Anti-Patterns to Avoid

1. **No default exports** — always named exports
2. **No `any` type** — use proper typing or `unknown`
3. **No `!` non-null assertions** — use optional chaining or null checks
4. **No global state** — keep state local or lift to route level
5. **No shell interpolation in CLI calls** — use `execFile`-style argument arrays (security requirement from spec)
6. **No useless fragments** — `<>` wrappers only when required

### Testing Approach

| Test Type | Framework | Location |
|-----------|-----------|----------|
| Unit | Vitest | `tests/` directory adjacent to `src/` |
| E2E | Playwright | `tests/e2e/` |
| No co-located tests | — | All tests in `tests/` dirs |

**Unit test organization:** Tests live in `packages/<name>/tests/` (separate from `src/`), with one test file per source file. Use fixture files for complex inputs (TOML formulas, test data).

**Vitest pattern with fixture files:**
```typescript
import { describe, expect, it } from 'vitest'

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8')
}

describe('formulaParser', () => {
  describe('valid formulas', () => {
    it('should parse explore-module.formula.toml', () => { ... })
  })
})
```

**E2E pattern:** Custom fixtures that set up test data (formulas, beads) and tear down automatically. Authentic tests against real backend.

**Priority test targets from spec:**
- Formula TOML parsing
- Wave computation (topological sort + level assignment)
- Variable binding validation
- CLI invocation security (allowlist validation)

### Closest Precedent Feature

The best precedent in `openedi` is the **Transaction Monitor** — specifically the Transactions page with its list/filter/detail-panel pattern:

- Left sidebar navigation (file tree analog)
- Primary list view with filtering
- Detail side-panel (slide-in modal for transaction details)
- Multi-tab content within the detail view
- CLI/backend data proxying pattern

**Relevant openedi files:**
```
apps/web/src/routes/transactions.tsx
apps/web/src/components/transactions/
  transaction-list.tsx
  transaction-filters.tsx
  transaction-detail-modal.tsx
  transaction-status-badge.tsx
apps/web/src/components/layout/
  header.tsx
  sidebar.tsx
```

The **Errors page** (`routes/errors.tsx`) shows how to build a dashboard with stat cards, tabs, and multiple sub-list components all within a single route file.

### Status Config Pattern (for Beads)

Copy the `statusConfig` pattern from `transaction-status-badge.tsx`:

```typescript
const statusConfig: Record<BeadStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  blocked: { label: 'Blocked', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  // ... 8 statuses total
}
```

### Auto-Save Debounce (500ms)

Standard approach using `useEffect` + `setTimeout`:
```typescript
const [draftValue, setDraftValue] = useState(initialValue)
useEffect(() => {
  const timer = setTimeout(() => saveFormula(draftValue), 500)
  return () => clearTimeout(timer)
}, [draftValue])
```

---

## Key Files Reference

### CLI Tool Layer (What the IDE Wraps)

The IDE sits entirely on top of existing CLI tools. There are no importable libraries — only external process invocations.

```
┌─────────────────────────────────────────────────┐
│                  Beads IDE (new)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Formula  │  │  Cook    │  │   Results     │ │
│  │ Editor   │  │ Preview  │  │   Analyzer    │ │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘ │
└───────┼─────────────┼───────────────┼───────────┘
        │             │               │
        ▼             ▼               ▼
┌──────────────┐ ┌─────────┐ ┌───────────────────┐
│ File System  │ │bd cook  │ │bd list --json     │
│ .formula.    │ │bd mol   │ │bd show --json     │
│ toml files   │ │pour     │ │bv --robot-*       │
└──────────────┘ └─────────┘ │bv --export-graph  │
                             └───────────────────┘
        │
        ▼
┌──────────────────────────────┐
│           gt sling           │
│  (agent/crew dispatch)       │
└──────────────────────────────┘
```

### CLI Tool Versions and Capabilities

| Tool | Binary | Version | Key Flags |
|------|--------|---------|-----------|
| `bd` | `/home/krystian/.local/bin/bd` | 0.52.0 (dev) | `--json`, `--db`, `--actor` |
| `bv` | `/home/krystian/.local/bin/bv` | (no version flag) | `--robot-insights`, `--robot-triage`, `--robot-plan`, `--export-graph`, `--output-format json` |
| `gt` | `/home/krystian/.local/bin/gt` | v0.7.0-427-g05bd99ff | `sling`, `formula list`, `formula show` |

### Key `bd` Commands for IDE Integration

**Formula operations:**
- `bd cook <formula-file>` — compile formula to proto (JSON output)
- `bd cook <formula> --var key=value` — runtime cook with substitution
- `bd cook <formula> --dry-run` — preview without creating
- `bd mol pour <proto-id>` — instantiate proto as persistent molecule
- `gt sling <bead-id> <target>` — dispatch work to agent

**Data queries:**
- `bd list --json` — list beads as JSON array
- `bd show <id> --json` — show single bead as JSON
- `bd list --format dot` or `--format digraph` — dependency graph output
- `bv --robot-insights` — graph analytics (PageRank, betweenness, etc.)
- `bv --export-graph <file>` — export interactive HTML graph
- `bv --output-format json --robot-insights` — JSON analytics output

**Formula management:**
- `gt formula list` — list all formulas across search paths
- `gt formula show <name>` — display formula details

### Data Layer: Dolt (MySQL Wire Protocol)

The bead database backend is **Dolt running as a server** (`dolt-mode: server`), accessed by `bd` via localhost MySQL connection. The IDE should NOT connect directly to Dolt — it should proxy through `bd` CLI commands (Option A from the spec). Direct Dolt access would require:
- MySQL wire protocol client
- Knowledge of Dolt's internal schema
- Version coupling to the Dolt schema

The `bd` CLI handles all schema concerns and provides stable `--json` output. This is the right boundary for MVP.

---

## Backend API Surface

The backend server is a new artifact that exposes a localhost-only HTTP API. These are the routes implied by spec requirements:

### Formula Routes
```
GET  /api/formulas              # List all formulas from search paths
GET  /api/formulas/:name        # Get single formula content
POST /api/formulas/:name        # Save formula content (text mode save)
POST /api/formulas/:name/cook   # Invoke bd cook, return CookResult
POST /api/formulas/:name/sling  # Invoke gt sling, return status
```

### Bead Routes (Read-Only)
```
GET  /api/beads                 # bd list --json with filter params
GET  /api/beads/:id             # bd show <id> --json
```

### Graph Routes
```
GET  /api/graph/metrics         # bv --robot-insights --json
GET  /api/graph/export          # bv --export-graph --json
```

### System Routes
```
GET  /api/health                # verify bd CLI available
GET  /api/config                # return current config (paths, etc.)
```

### Security Constraints

Every CLI invocation in the backend must:
1. Use `execFile` (Node) or `Bun.spawn` (Bun) — NOT `exec` or `shell: true`
2. Validate formula names against `^[a-zA-Z0-9_-]+$` before passing as args
3. Validate variable keys and values against an allowlist
4. Set `cwd` to the project root where `.beads/redirect` resolves correctly
5. Bind only to `127.0.0.1:PORT`, not `0.0.0.0`

### Suggested Backend Framework

**Express or Hono** (Node.js) — lightweight, well-known, good TypeScript support. Alternatively, **Bun HTTP server** following the `openedi` as2-server pattern (lightweight, no framework).

### Backend Project Structure

```
backend/
├── src/
│   ├── index.ts             # Entry point, route registration
│   ├── routes/
│   │   ├── formulas.ts      # Formula CRUD + cook + sling
│   │   ├── beads.ts         # Bead read proxy
│   │   └── graph.ts         # bv proxy
│   ├── cli.ts               # execFile wrapper with security validation
│   └── config.ts            # Config file loading
├── package.json
└── tsconfig.json
```

---

## Frontend Architecture & Components

### Suggested Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/              # TanStack Router routes
│   │   ├── __root.tsx
│   │   ├── index.tsx        # Default: last session or formula gallery
│   │   ├── formula.$name.tsx  # Formula editor + preview
│   │   └── results.$id.tsx    # Results analysis view
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # VS Code-style multi-panel layout
│   │   │   ├── FormulaTree.tsx   # Left sidebar file tree
│   │   │   └── CommandPalette.tsx # Cmd+K
│   │   ├── formulas/
│   │   │   ├── FormulaEditor.tsx  # Hybrid visual/text
│   │   │   ├── VisualBuilder.tsx  # Node-based step builder
│   │   │   ├── TextEditor.tsx     # TOML text mode
│   │   │   └── VarsPanel.tsx      # Variables form UI
│   │   ├── beads/
│   │   │   ├── BeadList.tsx       # Bead list with filtering
│   │   │   ├── BeadDetail.tsx     # Side panel: bead detail (read-only)
│   │   │   └── BeadStatusBadge.tsx # Status pill component
│   │   ├── preview/
│   │   │   ├── CookPreview.tsx    # Split view: formula left, protos right
│   │   │   └── ProtoBeadList.tsx  # Proto bead cards
│   │   ├── results/
│   │   │   ├── GraphView.tsx      # Dependency graph + metrics
│   │   │   ├── ListView.tsx       # Bead list grouped by epic/type/status
│   │   │   └── WaveView.tsx       # Dependency frontier grouping
│   │   └── ui/
│   │       └── (Button, Badge, Dialog, etc.)
│   ├── lib/
│   │   ├── types.ts               # All TypeScript interfaces
│   │   ├── wave.ts                # Wave computation (topo sort + levels)
│   │   ├── formula-parser.ts      # TOML parse + Formula struct validation
│   │   ├── utils.ts               # cn(), helpers
│   │   └── api.ts                 # API client (fetch wrapper)
│   ├── hooks/
│   │   ├── useFormula.ts          # Formula load/save/cook
│   │   ├── useBeads.ts            # Bead list queries
│   │   └── useGraph.ts            # Graph metrics + layout
│   ├── app.css                    # Tailwind + theme CSS
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

### Component Integration with openedi Patterns

| beads-ide Feature | Closest openedi Analog | Key Differences |
|---|---|---|
| Formula file tree (left sidebar) | `sidebar.tsx` nav links | Needs file system tree, not static links |
| Formula editor (main panel) | No analog (text editor) | New: CodeMirror or Monaco for TOML; node canvas for visual |
| Cook preview panel | Transaction detail modal tabs | Right panel, not modal; split view |
| Bead list (results analysis) | `transaction-list.tsx` | Domain types differ; grouping by epic/wave |
| Status badge | `transaction-status-badge.tsx` | Copy pattern; map bead status → color |
| Graph view | No analog | Net-new; use React Flow / Cytoscape |
| Wave view | No analog | Net-new; topological sort + level assignment |
| Filter panel | `transaction-filters.tsx` | Same pattern; filter by type, status, label |
| Detail side panel | `transaction-detail-modal.tsx` | Same slide-in pattern; read-only bead fields |
| Error display (cook fail) | Inline validation errors in modal | Inline in editor panel |

---

## Data Types & Interfaces

### Core Bead Type

Derived from `docs/beads.md` and Go `Issue` struct. The IDE must consume this shape via `bd list --json` and `bd show --json`:

```typescript
interface Bead {
  id: string;                    // e.g., "bcc-xxx"
  title: string;                 // max 500 chars
  description: string;
  design: string;
  acceptance_criteria: string;
  notes: string;
  status: BeadStatus;            // 8 built-in values
  priority: 0 | 1 | 2 | 3 | 4; // P0=highest
  issue_type: BeadType;          // 6 built-in + custom
  assignee: string;
  owner: string;
  estimated_minutes: number | null;
  created_at: string;            // ISO datetime
  created_by: string;
  updated_at: string;
  closed_at: string | null;
  close_reason: string;
  due_at: string | null;
  defer_until: string | null;
  external_ref: string | null;
  source_system: string;
  metadata: Record<string, unknown>;
  labels: string[];              // separate DB table, returned as array in JSON
  dependencies: Dependency[];    // separate DB table
  // Formula-related (JSONL-only fields):
  source_formula: string;
  source_location: string;
  is_template: boolean;          // true = proto bead
  ephemeral: boolean;
  // Computed fields in JSON output:
  dependency_count: number;
  dependent_count: number;
  comment_count: number;
}

type BeadStatus =
  | 'open' | 'in_progress' | 'blocked' | 'deferred'
  | 'closed' | 'tombstone' | 'pinned' | 'hooked';

type BeadType =
  | 'bug' | 'feature' | 'task' | 'epic' | 'chore' | 'event'
  | 'molecule' | 'gate' | 'convoy' | 'merge-request'
  | 'slot' | 'agent' | 'role' | 'rig' | 'message';

interface Dependency {
  issue_id: string;
  depends_on_id: string;
  type: DependencyType;
  created_at: string;
  created_by: string;
  metadata: string;              // JSON blob
  thread_id: string;
}

// 18 well-known types. The IDE's graph uses top-4:
// 'blocks', 'parent-child', 'related', 'discovered-from'
// Only workflow types affect readiness: 'blocks', 'parent-child',
// 'conditional-blocks', 'waits-for'
type DependencyType = string;    // any string up to 50 chars
```

### Formula Types

Derived from `docs/formulas.md` and Go `Formula` struct:

```typescript
interface Formula {
  formula: string;               // unique name identifier
  description: string;
  version: number;               // currently 1
  type: 'workflow' | 'expansion' | 'aspect';
  phase: 'liquid' | 'vapor';
  extends: string[];
  vars: Record<string, VarDef>;
  steps: Step[];
  template: Step[];              // for expansion type
  compose: ComposeRules;
  advice: AdviceRule[];
  pointcuts: Pointcut[];
  // Added by parser:
  source: string;                // filesystem path where loaded from
}

interface VarDef {
  description: string;
  default: string;
  required: boolean;
  enum: string[];
  pattern: string;
  type: 'string' | 'int' | 'bool';
}

interface Step {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'bug' | 'feature' | 'epic' | 'chore' | '';
  priority: number | null;
  labels: string[];
  assignee: string;
  needs: string[];
  depends_on: string[];
  condition: string;
  children: Step[];
  expand: string;
  expand_vars: Record<string, string>;
  gate: Gate | null;
  loop: LoopSpec | null;
  on_complete: OnCompleteSpec | null;
  waits_for: string;
}

interface Gate {
  type: 'gh:run' | 'gh:pr' | 'timer' | 'human' | 'mail';
  id: string;
  timeout: string;
}

interface LoopSpec {
  count: number;
  until: string;
  max: number;
  range: string;
  var: string;
  body: Step[];
}

interface OnCompleteSpec {
  for_each: string;
  bond: string;
  vars: Record<string, string>;
  parallel: boolean;
  sequential: boolean;
}

interface ComposeRules {
  bond_points: BondPoint[];
  hooks: Hook[];
  expand: ExpandRule[];
  map: MapRule[];
  branch: BranchRule[];
  gate: GateRule[];
  aspects: string[];
}
```

### IDE-Layer Types

```typescript
// Wave computation output (spec: "beads grouped by dependency frontier")
interface Wave {
  index: number;                 // 0 = unblocked now, 1 = next wave, etc.
  label: string;                 // "Wave 1 (Now)", "Wave 2 (Next)", etc.
  beads: Bead[];
}

// Graph visualization node
interface GraphNode {
  id: string;
  bead: Bead;
  x: number;
  y: number;
  metrics: GraphMetrics;
}

// All 9 metrics from bv (spec: "9 graph metrics overlay")
interface GraphMetrics {
  pagerank: number;
  betweenness: number;
  hits_hub: number;
  hits_authority: number;
  critical_path: boolean;
  eigenvector: number;
  degree: number;
}

// Graph-level computed values
interface GraphStats {
  density: number;               // warn >0.10, red >0.12
  cycles: string[][];            // cycle detection
  topo_sort: string[];           // topological ordering
}

// Formula file tree entry (for sidebar)
interface FormulaFile {
  name: string;
  path: string;
  formula: Formula | null;       // null if not yet parsed
  directory: string;             // which search path it came from
}

// Cook preview result
interface CookResult {
  proto_beads: Bead[];           // is_template: true
  unbound_vars: string[];        // vars without values
  error: string | null;          // cook stderr if failed
}

// Backend API response envelope
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// CLI invocation config (spec: Security — execFile-style arg arrays)
interface CliInvocation {
  command: string;               // 'bd' or 'gt'
  args: string[];                // NO shell interpolation, validated
  cwd: string;                   // restricted to project root
}

// Session state (localStorage + optional server-side)
interface SessionState {
  last_open_formula: string | null;
  last_view: 'graph' | 'list' | 'wave';
  panel_sizes: { sidebar: number; editor: number; preview: number };
  graph_layout: 'force' | 'hierarchical' | 'manual';
  graph_node_positions: Record<string, { x: number; y: number }>;
  active_filters: {
    status: BeadStatus[];
    type: BeadType[];
    labels: string[];
  };
}

// Backend configuration
interface BeadsIDEConfig {
  port: number;                  // default 7777
  formula_search_paths: string[];
  bd_binary: string;             // default 'bd'
  gt_binary: string;             // default 'gt'
  bv_binary: string;             // default 'bv'
  project_root: string;
}
```

---

## Constraints & Considerations

### Architectural Boundaries the IDE Must Respect

**1. CLI invocation security boundary**
The spec mandates `execFile`-style argument arrays — never shell interpolation. The backend API server is the only component that may invoke CLI tools. The frontend never calls CLI directly. This is a hard security constraint from the spec.

**2. Formula file system boundary**
Formulas are `.formula.toml` files on disk. The IDE reads/writes them through the backend API. The backend resolves formula search paths (`formulas/`, `.beads/formulas/`, `~/.beads/formulas/`, `$GT_ROOT/.beads/formulas/`) and exposes a unified formula list to the frontend.

**3. Read-only bead viewing**
The spec is explicit: bead viewing in the IDE is read-only from formula results. The IDE does NOT support direct bead CRUD. This boundary simplifies the data layer significantly — no write path through `bd update` or `bd create` from the IDE.

**4. Data branch isolation**
The IDE manages Dolt data branches only (not Git branches). Git is managed externally. The backend must understand this distinction and only expose `bd branch` commands for data branching, never `git branch`.

**5. Localhost-only binding**
The backend API server must bind to `127.0.0.1` only, not `0.0.0.0`. This is a security constraint from the spec.

**6. No streaming cook preview**
`bd cook` is invoked as a discrete CLI call per debounced save (500ms). The IDE does not stream cook output. Each cook invocation returns the full proto JSON synchronously.

### What Architectural Constraints Shape Implementation

**A. No existing frontend patterns in BCC**
There is nothing to be "consistent with" in the BCC project UI layer — it doesn't exist. The openedi project provides the closest reference but uses Convex (not applicable). The team must establish new conventions for this project.

**B. Dolt sync.mode: dolt-native**
The BCC project's `.beads/config.yaml` shows `sync.mode: dolt-native`. This means `bd` commands operate against the Dolt server, not a local SQLite file. The IDE backend must ensure `bd` commands run with the correct working directory set to a path where `.beads/redirect` resolves to the correct Dolt database.

**C. Formula file format is TOML**
Formulas are `.formula.toml` files. The frontend TOML editor must handle TOML parsing/serialization. This requires a TOML library in the frontend (e.g., `@iarna/toml` or `smol-toml`). The spec calls for both visual (node-based) and text (TOML source) modes that stay in sync — this is the most complex authoring challenge.

**D. Graph library is unresolved**
The spec defers graph library selection to implementation (candidates: React Flow, Cytoscape.js, D3.js). This is the highest-risk technical decision. React Flow is the most developer-friendly but has licensing considerations for complex graphs. Cytoscape.js is more capable for large graphs (200 nodes) but lower-level. D3.js requires the most custom code but maximum flexibility.

**Critical Risk: Graph Library Selection**
The graph library decision should be made **first** before other UI work. The 200-bead / <1s render target is the most technically constraining requirement. Recommend:
1. Build a prototype with React Flow rendering 200 nodes + force-directed layout
2. Measure initial render time against the <1s target
3. If React Flow fails the benchmark, evaluate Cytoscape.js next
4. D3.js as fallback (highest performance ceiling, highest implementation cost)

**E. Wave computation is a new algorithm**
The "wave view" (beads grouped by dependency frontier) must be implemented as a topological sort + level assignment algorithm. This is novel logic not present anywhere in the current codebase. It runs client-side on the proto/bead dependency graph. The spec notes it can fail on cyclic deps (fall back to list view).

**Wave Computation Algorithm:**
1. Build adjacency from dependency types that affect readiness: `blocks`, `parent-child`, `conditional-blocks`, `waits-for`
2. Compute in-degree for each bead
3. BFS from zero-in-degree nodes: Wave 0 = unblocked now
4. Reduce in-degrees; next wave = newly zero-in-degree nodes
5. Repeat until all nodes assigned
6. Handle cycles: detect via DFS, warn user, assign cycle beads to a "Blocked (Cycle)" group

**File location:** `lib/wave.ts`

**Cycle handling error state:** "Wave computation fails (cyclic deps) → Show warning in wave view, fall back to list view"

**Critical Risk: TOML ↔ Visual Mode Sync**
The formula editor's dual-mode (visual node-based + TOML source) requires a bidirectional parser. Changes in TOML must update the visual canvas; changes in the canvas must regenerate valid TOML. This is non-trivial — the formula schema supports nested steps, conditions, loops, gates, composition rules, and inheritance. The implementation should start with a read-only visual view (TOML → visual) and add write-back later.

### What Needs No Changes

**Nothing in the current BCC codebase needs to change** to support this feature. The IDE is purely additive:
- No changes to `bd` CLI (already has `--json` and `cook` commands)
- No changes to `bv` (already has `--robot-insights`, `--output-format json`)
- No changes to `gt` (already has `sling` command)
- No changes to formula files (read/write via file system)
- No changes to `.beads/` schema or Dolt backend

The only "wiring" needed is the backend API server that invokes these CLI tools and the frontend that consumes the API.

### Build & Test Infrastructure

The current BCC workspace has:
- No `package.json`
- No Makefile
- No build scripts
- No test runner
- No CI/CD configuration

The IDE requires a complete frontend + backend build system. Suggested `package.json` scripts:

**Frontend:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint src/",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Backend:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  }
}
```

### Development Startup

Running the IDE locally requires starting two processes:

```bash
# Terminal 1: Backend API server
cd beads-ide/backend && npm run dev   # starts on localhost:3001

# Terminal 2: Frontend dev server
cd beads-ide/frontend && npm run dev  # starts on localhost:5173, proxies /api → :3001
```

The Vite config would proxy API calls:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

### Error Handling Scenarios

| Spec Failure Scenario | Where in Code | Response Shape |
|----------------------|---------------|----------------|
| Backend not running | Frontend: `lib/api.ts` fetch timeout/connection refused | Show error page: "Cannot connect to IDE backend. Start the server." |
| `bd cook` fails (malformed formula) | `server/routes/formulas.ts` cook handler | Return `CookResult{ error: <stderr>, proto_beads: [] }` |
| `gt sling` fails | `server/routes/formulas.ts` sling handler | Return `{ error: <stderr>, status: 'failed' }` |
| Database unavailable | `server/routes/beads.ts` — `bd list` exits non-zero | Degrade: formula editing still works, bead routes return error state |
| Formula validation errors | `src/lib/formula-parser.ts` — client-side TOML validation | `{ valid: false, errors: [{ path, message }] }` |
| Wave computation cycle | `src/lib/wave.ts` cycle detection | `{ waves: [], cycles: string[][], fallback: true }` |
| Unbound variables | `CookPreview.tsx` — check `CookResult.unbound_vars` | Highlight vars in red, disable pour/sling button |

### Accessibility Requirements (WCAG 2.1 AA)

The spec requires WCAG 2.1 AA compliance throughout:
- Errors must not rely on color alone (pair with icon + text label)
- All interactive elements must be keyboard-navigable
- Screen reader alternatives for icons (use Lucide's title attribute or aria-label)
- Proper heading hierarchy
- Form labels associated with inputs
- Loading states announced via aria-live

---

## Summary of Key Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Project location | `beads-ide/` subdirectory within BCC crew workspace OR new rig | Collocated with the formulas it edits; colocation natural |
| Monorepo tooling | npm workspaces (simple), not Turborepo | Single operator, 2 packages, no build caching needed |
| Frontend framework | Vite + React + TypeScript | Matches openedi, spec requirement |
| Backend framework | Express or Hono (Node.js) | Lightweight, well-known, good TypeScript support |
| TOML library | `smol-toml` or `@iarna/toml` | Required for formula file editing |
| Data layer | `bd` CLI proxy (Option A) | Lower risk, no Dolt schema coupling |
| Graph library | React Flow (recommend evaluating first) | Best DX for React, handles 200 nodes; evaluate first for benchmark |
| State management | Zustand or React Context | Simple local app, no complex sync |
| Styling | Tailwind CSS v4 | Matches openedi reference, fast iteration |
| Icon library | Lucide React | Matches openedi reference |
| Toast notifications | Sonner | Matches openedi reference |
| TypeScript config | Strict mode | Matches openedi reference |
| Test framework | Vitest | Matches openedi, fast, native ESM |
| Formatter/linter | Biome | Matches openedi reference project |
| E2E testing | Playwright with custom fixtures | Matches openedi pattern; fixtures set up test formulas |
| CI/CD | Refinery formula variables | No separate CI files needed; use Gas Town workflow |
