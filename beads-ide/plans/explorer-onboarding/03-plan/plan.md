# explorer-onboarding - Implementation Plan

**Created:** 2026-02-24
**Status:** Draft
**Source Spec:** plans/explorer-onboarding/02-spec/spec.md

---

## Overview

This plan delivers VS Code-style project onboarding and a directory-first file tree explorer for Beads IDE. The feature replaces the current search-path-grouped formula listing with a workspace-rooted tree that shows `.formula.toml` files in their actual filesystem hierarchy.

The implementation follows a layered approach: backend-first foundation (workspace management, tree scanning, directory browsing), then frontend state management (localStorage hooks), then UI components (welcome panel, workspace tree), and finally integration polish (command palette, search, open recent). This ordering ensures each layer can be developed and tested independently against real APIs.

The architecture respects the existing monorepo structure (`apps/backend`, `apps/frontend`, `packages/shared`) and follows established patterns: Hono routes with local error helpers, React hooks with `apiFetch`/`apiPost`, inline CSSProperties styling, and native `<dialog>` modals. The new `WorkspaceTree` component mirrors `FormulaTree` patterns exactly (navigation via pushState, dirty indicators via context, UnsavedChangesModal guards).

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State storage | localStorage `workspaceConfig` key | Matches existing pattern (`beads-ide-panel-sizes`, `beads-ide-keyboard-tip-shown`). No server-side session needed. |
| Backend workspace mechanism | `setWorkspaceRoot()` + `clearConfigCache()` in `config.ts` | Config is already a cached singleton. Adding a `workspaceRoot` override variable avoids process restart while achieving clean-state guarantee. |
| Folder picker | Backend directory browser (`GET /api/browse`) | File System Access API returns basename only, not full path. Backend browser works in all browsers, returns full paths. |
| Tree virtualization | `@tanstack/react-virtual` | Spec requires 200-1000 file support. Package is lightweight, well-maintained, and integrates easily with flat-list tree pattern. |
| WorkspaceTree structure | Single file with sub-components | Matches `FormulaTree` pattern: all related components in one file, not exported separately. |
| Navigation pattern | `pushState` + `popstate` dispatch | Matches existing `FormulaTree` exactly. TanStack Router workaround is documented in spec section 4.8. |
| Search path visibility | Folder-only mode | Per spec Q63 resolution: when a root is set, hide Gas Town/User formula sections entirely. `WorkspaceTree` replaces `FormulaTree`. |

---

## Shared Abstractions

### 1. Workspace API Types

**Name:** `TreeNode`, `TreeResponse`, `TreeError`, `WorkspaceOpenRequest/Response`, `WorkspaceInitRequest/Response`, `WorkspaceStateResponse`, `WorkspaceError`
**Location:** `/packages/shared/src/ide-types.ts`
**Purpose:** Shared type definitions for all workspace-related API contracts
**Consumers:** Phase 1 (backend routes), Phase 2 (frontend hooks), Phase 3+ (all UI components)

### 2. useWorkspaceConfig Hook

**Name:** `useWorkspaceConfig()`
**Location:** `/apps/frontend/src/hooks/use-workspace-config.ts`
**Purpose:** Centralized localStorage read/write for `WorkspaceConfig` with version guard
**Consumers:** Phase 2 (startup sync), Phase 3 (welcome panel), Phase 4 (workspace tree), Phase 5 (sidebar header), Phase 6 (open recent)

### 3. useTree Hook

**Name:** `useTree()`
**Location:** `/apps/frontend/src/hooks/use-tree.ts`
**Purpose:** Data fetching for `GET /api/tree` with loading/error states
**Consumers:** Phase 4 (workspace tree), Phase 5 (sidebar header refresh button)

### 4. FormulaDirtyProvider Verification

**Name:** `FormulaDirtyProvider`
**Location:** Verify presence in `/apps/frontend/src/routes/__root.tsx`
**Purpose:** The `WorkspaceTree` calls `useFormulaDirty()` for dirty indicators. Provider must wrap the component tree.
**Consumers:** Phase 4 (workspace tree dirty propagation)
**Action:** If missing from `__root.tsx`, add it before `RootLayoutInner` in Phase 2.

---

## Phased Delivery

### Phase 1: Backend Foundation

**Objective:** All new backend endpoints functional and tested
**Prerequisites:** None (first phase)

#### Tasks

**1.1 Add shared workspace types**
- **What:** Define all workspace-related TypeScript interfaces in the shared package
- **Files:**
  - Modify: `/packages/shared/src/ide-types.ts` — append 8 new type definitions (TreeNode, TreeResponse, TreeError, WorkspaceOpenRequest, WorkspaceOpenResponse, WorkspaceInitRequest, WorkspaceInitResponse, WorkspaceStateResponse, WorkspaceError)
  - Modify: `/packages/shared/src/index.ts` — add exports for new types
- **Key details:** Use exact type definitions from spec section 5.5. Include all error codes. All types use `ok: true/false` envelope pattern matching existing `CookResult`, `SlingResult`.
- **Acceptance criteria:**
  - [ ] `pnpm run typecheck --filter @beads-ide/shared` passes
  - [ ] All 8 type interfaces exported from `@beads-ide/shared`
- **Dependencies:** None

**1.2 Add workspace root management to config.ts**
- **What:** Add module-level `workspaceRoot` variable and accessor functions to enable hot-swapping the active root
- **Files:**
  - Modify: `/apps/backend/src/config.ts` — add `let workspaceRoot: string | null = null`, `setWorkspaceRoot(path: string): void`, `getWorkspaceRoot(): string`
- **Key details:**
  - `setWorkspaceRoot(path)` sets the variable and calls `clearConfigCache()` to invalidate the cached config
  - `getWorkspaceRoot()` returns `workspaceRoot ?? process.cwd()`
  - Update `loadConfig()` to use `getWorkspaceRoot()` as the default cwd argument
  - `clearConfigCache()` does NOT reset `workspaceRoot` — only the config cache
- **Acceptance criteria:**
  - [ ] `setWorkspaceRoot('/some/path')` followed by `getConfig()` uses the new path
  - [ ] Calling `setWorkspaceRoot()` twice uses the second path
  - [ ] `clearConfigCache()` alone does not affect `workspaceRoot`
- **Dependencies:** None

**1.3 Create workspace routes file**
- **What:** New Hono route file with 5 endpoints for workspace management
- **Files:**
  - Create: `/apps/backend/src/routes/workspace.ts`
- **Key details:**
  - `GET /api/workspace` — returns `WorkspaceStateResponse` with current root, formula count, search paths. Uses `getWorkspaceRoot()` and `getConfig()`.
  - `POST /api/workspace/open` — validates path exists and is directory, calls `setWorkspaceRoot(path)`, returns `WorkspaceOpenResponse`. Error codes: NOT_FOUND, NOT_DIRECTORY, PERMISSION_DENIED.
  - `POST /api/workspace/init` — scaffolds `.beads/` + `formulas/` dirs, writes blank template file, then calls open logic. Error codes: ALREADY_INITIALIZED (if `.beads/` exists), WRITE_ERROR. Template content: `name = "new-formula"\nversion = 1\n\n[[steps]]\nid = "step-1"\ntitle = "First step"\ndescription = ""\n`
  - `GET /api/tree` — recursive async scan using `fs.promises.readdir({ withFileTypes: true })`. Prunes directories without `.formula.toml` descendants. Stops at 500 nodes (sets `truncated: true`). Sorts: directories before files, then alphabetically.
  - `GET /api/browse?path=<path>` — returns directory listing for the directory browser. Returns `{ entries: [{ name, type: "dir"|"file", path }] }`. Defaults to `os.homedir()` if no path. Validates path to prevent directory traversal.
- **Key details (patterns):**
  - Follow `formulas.ts` pattern: `const workspace = new Hono()`, local `errorResponse()` helper, named export
  - Use `.js` extension on imports (ESM project)
  - Async FS: `fs.promises.readdir`, `fs.promises.stat`, `fs.promises.mkdir`, `fs.promises.writeFile`
  - Path validation: `path.resolve(input) === input` normalization check
- **Acceptance criteria:**
  - [ ] `curl localhost:3001/api/workspace` returns current state JSON
  - [ ] `curl -X POST localhost:3001/api/workspace/open -d '{"path":"/tmp/test"}' -H 'Content-Type: application/json'` works for valid paths
  - [ ] `curl localhost:3001/api/tree` returns tree structure
  - [ ] `curl 'localhost:3001/api/browse?path=/home'` returns directory listing
  - [ ] POST to invalid path returns appropriate error code
- **Dependencies:** 1.1, 1.2

**1.4 Register workspace routes**
- **What:** Mount workspace routes in the main Hono app
- **Files:**
  - Modify: `/apps/backend/src/index.ts` — add `import { workspace } from './routes/workspace.js'` and `app.route('/api', workspace)`
- **Acceptance criteria:**
  - [ ] All 5 workspace endpoints accessible via `/api/*`
- **Dependencies:** 1.3

**1.5 Write backend unit tests**
- **What:** Vitest tests for workspace routes and tree scanner
- **Files:**
  - Create: `/apps/backend/tests/routes/workspace.test.ts`
- **Key details:**
  - Follow `graph.test.ts` pattern: `const app = new Hono(); app.route('/api', workspace)`
  - Test tree scanner with fixture directories: create temp dirs with `.formula.toml` files in `beforeAll`, scan them, assert structure
  - Test path validation (no traversal outside allowed roots)
  - Test node limit truncation
  - Use `vi.spyOn` to mock filesystem operations where needed
- **Acceptance criteria:**
  - [ ] `pnpm run test --filter @beads-ide/backend` passes
  - [ ] Tests cover: GET /api/workspace, POST /api/workspace/open (success + errors), POST /api/workspace/init (success + errors), GET /api/tree (empty, normal, truncated), GET /api/browse
- **Dependencies:** 1.3, 1.4

#### Phase 1 Exit Criteria
- [ ] All 5 workspace endpoints return correct responses when called with curl
- [ ] Backend unit tests pass
- [ ] `pnpm run typecheck --filter @beads-ide/backend` passes
- [ ] `pnpm run check` (Biome) passes

---

### Phase 2: Frontend State Layer

**Objective:** Frontend hooks and startup sync working against live backend
**Prerequisites:** Phase 1 — workspace endpoints must be functional

#### Tasks

**2.1 Verify FormulaDirtyProvider presence**
- **What:** Confirm `FormulaDirtyProvider` is mounted in `__root.tsx` context tree; add if missing
- **Files:**
  - Read: `/apps/frontend/src/routes/__root.tsx`
  - Modify (if needed): `/apps/frontend/src/routes/__root.tsx` — add `<FormulaDirtyProvider>` wrapping `RootLayoutInner`
- **Key details:** `useFormulaDirty()` is called by existing `FormulaTree` and will be called by new `WorkspaceTree`. If provider is missing, the hook will throw.
- **Acceptance criteria:**
  - [ ] `useFormulaDirty()` works when called from any component under `__root.tsx`
- **Dependencies:** None

**2.2 Install @tanstack/react-virtual**
- **What:** Add virtualization dependency for tree component
- **Files:**
  - Modify: `/apps/frontend/package.json` (via pnpm command)
- **Key details:** Run `pnpm add @tanstack/react-virtual --filter @beads-ide/frontend`
- **Acceptance criteria:**
  - [ ] Package appears in `apps/frontend/package.json` dependencies
  - [ ] `import { useVirtualizer } from '@tanstack/react-virtual'` compiles without error
- **Dependencies:** None

**2.3 Create useWorkspaceConfig hook**
- **What:** localStorage state management hook for workspace configuration
- **Files:**
  - Create: `/apps/frontend/src/hooks/use-workspace-config.ts`
  - Modify: `/apps/frontend/src/hooks/index.ts` — add export
- **Key details:**
  - Interface: `{ version: 1, rootPath: string | null, recentRoots: string[], treeExpanded: Record<string, Record<string, boolean>> }`
  - Version guard: if missing or version !== 1, initialize defaults
  - Always wrap localStorage in try/catch (follow `use-keyboard-tip.ts` pattern)
  - Storage key: `'workspaceConfig'`
  - Return: `{ config, setRootPath, addRecentRoot, setTreeExpanded, clearConfig }`
  - `addRecentRoot` prepends to array, caps at 5, deduplicates
  - `treeExpanded` is nested: `rootPath -> dirPath -> expanded`
- **Acceptance criteria:**
  - [ ] Hook reads/writes localStorage correctly
  - [ ] Version mismatch triggers re-initialization
  - [ ] `addRecentRoot` caps at 5 entries
  - [ ] localStorage errors are caught and ignored
- **Dependencies:** None

**2.4 Create useTree hook**
- **What:** Data fetching hook for `GET /api/tree`
- **Files:**
  - Create: `/apps/frontend/src/hooks/use-tree.ts`
  - Modify: `/apps/frontend/src/hooks/index.ts` — add export
- **Key details:**
  - Follow `use-formulas.ts` pattern: `useState` + `useCallback` + `useEffect`
  - Use `apiFetch` from `lib/api.ts` (not raw fetch)
  - Return: `{ nodes, root, totalCount, truncated, isLoading, error, refresh, lastUpdated }`
  - `lastUpdated` is `Date | null` for refresh button tooltip
- **Acceptance criteria:**
  - [ ] Hook returns tree data from live backend
  - [ ] Loading state shows during fetch
  - [ ] Error state populated on failure
  - [ ] `refresh()` triggers re-fetch
- **Dependencies:** Phase 1 complete

**2.5 Add startup workspace sync**
- **What:** Effect in `__root.tsx` to reconcile localStorage with backend state
- **Files:**
  - Modify: `/apps/frontend/src/routes/__root.tsx` — add sync effect using `useWorkspaceConfig` and `apiFetch('/api/workspace')`
- **Key details:**
  - On mount: call `GET /api/workspace`, compare `root` with `localStorage.workspaceConfig.rootPath`
  - If backend root is null but localStorage has a root: call `POST /api/workspace/open` with the localStorage root
  - If backend root differs from localStorage root (e.g., backend restarted): clear localStorage and show welcome screen
  - This runs once on mount
- **Acceptance criteria:**
  - [ ] App syncs localStorage with backend on startup
  - [ ] Backend restart (root loss) triggers welcome screen
  - [ ] localStorage root is restored to backend after page refresh
- **Dependencies:** 2.3, 2.4

#### Phase 2 Exit Criteria
- [ ] `useWorkspaceConfig` and `useTree` hooks return correct data
- [ ] Startup sync reconciles localStorage with backend
- [ ] `FormulaDirtyProvider` is confirmed mounted
- [ ] `@tanstack/react-virtual` installed
- [ ] `pnpm run typecheck --filter @beads-ide/frontend` passes

---

### Phase 3: Welcome Panel & Onboarding Flow

**Objective:** Full onboarding flow from welcome screen to workspace open
**Prerequisites:** Phase 2 — hooks must be functional

#### Tasks

**3.1 Create DirectoryBrowser component**
- **What:** Modal component for browsing server-side directories
- **Files:**
  - Create: `/apps/frontend/src/components/layout/directory-browser.tsx`
  - Modify: `/apps/frontend/src/components/layout/index.ts` — add export
- **Key details:**
  - Props: `{ isOpen, onSelect, onCancel, initialPath? }`
  - Uses native `<dialog>` element with `showModal()` (follow `UnsavedChangesModal` pattern)
  - Calls `apiFetch('/api/browse?path=<path>')` to fetch directory contents
  - Displays: breadcrumb navigation, directory list, "Select This Folder" button
  - Directories only (filter out files)
  - Styling: `#1e293b` background, `#334155` border (match existing modals)
- **Acceptance criteria:**
  - [ ] Modal opens and closes correctly
  - [ ] Can navigate directories by clicking
  - [ ] Breadcrumb shows current path, allows jumping back
  - [ ] "Select This Folder" calls `onSelect(fullPath)`
  - [ ] Keyboard: Escape closes modal
- **Dependencies:** Phase 1 (`GET /api/browse` endpoint)

**3.2 Create WelcomePanel component**
- **What:** Onboarding welcome screen with Open Folder, New Project, Recent list
- **Files:**
  - Create: `/apps/frontend/src/components/layout/welcome-panel.tsx`
  - Modify: `/apps/frontend/src/components/layout/index.ts` — add export
- **Key details:**
  - Sub-components: `WelcomePanel`, `RecentList`, `RecentItem` (all in same file, not exported)
  - Consumes: `useWorkspaceConfig()` for recent roots
  - Layout per spec section 3.1: centered title "Beads IDE" (#38bdf8), subtitle, two buttons, recent list
  - "Open Folder" button opens `DirectoryBrowser`, then calls `apiPost('/api/workspace/open', { path })`
  - After successful open: update localStorage via `setRootPath(path)` and `addRecentRoot(path)`
  - Recent items: validate with `apiFetch('/api/browse?path=<p>')` (check existence), show warning icon for missing
  - Clicking recent path triggers same open flow without picker
  - "New Project" opens `DirectoryBrowser`, then opens `NewProjectModal`
- **Acceptance criteria:**
  - [ ] Welcome screen renders when no root configured
  - [ ] "Open Folder" → DirectoryBrowser → select → workspace opens → tree shows
  - [ ] Recent list shows up to 5 items
  - [ ] Missing paths have warning icon and are not clickable
  - [ ] "New Project" flow starts (modal appears)
- **Dependencies:** 3.1, 2.3

**3.3 Create NewProjectModal component**
- **What:** Modal for new project creation with template picker
- **Files:**
  - Create: `/apps/frontend/src/components/layout/new-project-modal.tsx`
  - Modify: `/apps/frontend/src/components/layout/index.ts` — add export
- **Key details:**
  - Props: `{ isOpen, selectedPath, onComplete, onCancel }`
  - Uses native `<dialog>` element with `showModal()` (follow `UnsavedChangesModal` pattern)
  - Shows selected path, template picker (MVP: only "Blank formula" option)
  - "Create" calls `apiPost('/api/workspace/init', { path, template: 'blank' })`
  - On success: calls `onComplete()` which triggers same workspace open flow
  - On error: shows inline error message below template picker
- **Acceptance criteria:**
  - [ ] Modal shows selected folder path
  - [ ] "Blank formula" template is pre-selected
  - [ ] "Create" calls init endpoint
  - [ ] Success: modal closes, workspace opens
  - [ ] Error: inline message displayed
- **Dependencies:** Phase 1 (`POST /api/workspace/init` endpoint)

**3.4 Update index.tsx for conditional welcome screen**
- **What:** Render `WelcomePanel` when no root is configured
- **Files:**
  - Modify: `/apps/frontend/src/routes/index.tsx` — import `useWorkspaceConfig`, conditionally render `WelcomePanel`
- **Key details:**
  - If `rootPath` is null/missing: render `<WelcomePanel />`
  - Otherwise: render existing landing page content (or just empty since tree is in sidebar)
  - Add `document.title` management: `'Beads IDE'` for welcome screen
- **Acceptance criteria:**
  - [ ] `/` route shows welcome screen when no root
  - [ ] After opening folder, `/` route shows normal content
  - [ ] Browser title is "Beads IDE"
- **Dependencies:** 3.2

#### Phase 3 Exit Criteria
- [ ] User can complete full onboarding: welcome → pick folder → workspace opens
- [ ] New Project flow creates workspace with template
- [ ] Recent paths display and work
- [ ] Missing recent paths show warning icon

---

### Phase 4: WorkspaceTree Component

**Objective:** Directory tree with virtualization, dirty indicators, keyboard navigation
**Prerequisites:** Phase 2 — `useTree` hook, `FormulaDirtyProvider` verification

#### Tasks

**4.1 Create WorkspaceTree component**
- **What:** Main virtualized tree component replacing formula listing
- **Files:**
  - Create: `/apps/frontend/src/components/layout/workspace-tree.tsx`
  - Modify: `/apps/frontend/src/components/layout/index.ts` — add export
- **Key details:**
  - Sub-components in same file: `WorkspaceTree`, `DirectoryNode`, `FormulaNode`, `EmptyState`, `NodeLimitBanner`, `LoadingSkeleton`, `TreeErrorState`
  - Internal type: `FlatTreeItem { id, path, name, type, formulaName?, depth, isExpanded?, isDirty? }`
  - Consumes: `useTree()`, `useFormulaDirty()`, `useWorkspaceConfig()` (for expand state), `useFormulaSave()` (for modal guard)
  - Virtualization: `@tanstack/react-virtual` `useVirtualizer` on flattened tree
  - Tree flattening: recursive `TreeNode[]` → `FlatTreeItem[]` based on expand state
  - Expand/collapse: toggle in `treeExpanded` via `setTreeExpanded(rootPath, dirPath, expanded)`
  - Inline CSSProperties at top of file (follow `formula-tree.tsx` exactly)
  - Style values: `#2a2d2e` hover, `#094771` selected, `#fbbf24` dirty dot (6px), 22px item height, 16px/level indent
  - SVG icons inline with `aria-hidden="true"`: chevron (▶/▼), folder/folder-open, file-code
- **Acceptance criteria:**
  - [ ] Tree renders directories and formula files correctly
  - [ ] Directories expand/collapse on click
  - [ ] Expand state persists to localStorage per root
  - [ ] Empty directories (no formula descendants) not shown
  - [ ] Loading skeleton shows during fetch
  - [ ] Empty state shows when zero formulas
  - [ ] Node limit banner shows when truncated
- **Dependencies:** 2.2, 2.3, 2.4, 2.1

**4.2 Implement dirty state propagation**
- **What:** Show amber dirty indicator on formulas and propagate to parent directories
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add dirty calculation logic
- **Key details:**
  - Call `useFormulaDirty()` to get `isDirty(name: string)` function
  - During tree flattening: mark formula nodes with `isDirty` boolean
  - Compute `directoriesDirty: Set<string>` by walking ancestors of dirty formulas
  - Directory node shows amber dot if path is in `directoriesDirty` set
- **Acceptance criteria:**
  - [ ] Dirty formula shows amber dot
  - [ ] Parent directories of dirty formulas show amber dot
  - [ ] Dot clears when formula is saved
- **Dependencies:** 4.1

**4.3 Implement formula navigation**
- **What:** Clicking formula navigates to `/formula/:name` with UnsavedChangesModal guard
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add click handler and modal logic
- **Key details:**
  - Navigation pattern (match `FormulaTree` exactly):
    ```typescript
    window.history.pushState({}, '', `/formula/${encodeURIComponent(formulaName)}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    ```
  - Before navigation: check `useFormulaSave()` for dirty state, show `UnsavedChangesModal` if needed
  - Modal pattern: `const [showModal, setShowModal] = useState(false)`, `const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)`
  - Import `UnsavedChangesModal` from `../ui/unsaved-changes-modal`
- **Acceptance criteria:**
  - [ ] Clicking formula navigates to editor
  - [ ] Unsaved changes trigger modal before navigation
  - [ ] "Save" in modal saves, then navigates
  - [ ] "Discard" navigates without saving
  - [ ] "Cancel" cancels navigation
- **Dependencies:** 4.1

**4.4 Implement keyboard navigation**
- **What:** Arrow keys, Enter, Space for tree navigation
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add onKeyDown handler
- **Key details:**
  - Track `focusedIndex` state
  - ArrowUp/ArrowDown: move focus within flat list
  - ArrowRight: expand directory (if collapsed)
  - ArrowLeft: collapse directory (if expanded)
  - Enter/Space: toggle expand for directory, navigate for formula
  - Focus ring: 1px outline `#007acc`
  - `tabIndex={0}` on container, `aria-activedescendant` for screen readers
- **Acceptance criteria:**
  - [ ] Arrow keys navigate the tree
  - [ ] Enter/Space activates selected item
  - [ ] Focus visible with blue outline
  - [ ] Screen reader announces focused item
- **Dependencies:** 4.1

**4.5 Wire WorkspaceTree into sidebar**
- **What:** Replace sidebar content with WorkspaceTree when root is configured
- **Files:**
  - Modify: `/apps/frontend/src/routes/__root.tsx` — change `sidebarContent` prop
- **Key details:**
  - Import `WorkspaceTree` from `../components/layout`
  - If `workspaceConfig.rootPath` is set: render `<WorkspaceTree />`
  - If `rootPath` is null: sidebar is empty (welcome screen handles onboarding)
  - `FormulaTree` is NOT deleted — leave it in codebase but don't render it
- **Acceptance criteria:**
  - [ ] Sidebar shows `WorkspaceTree` when root is configured
  - [ ] Sidebar is empty/minimal when no root (welcome screen is main content)
  - [ ] Tree displays actual formulas from backend
- **Dependencies:** 4.1, 4.2, 4.3, 4.4

#### Phase 4 Exit Criteria
- [ ] Tree renders correctly with virtualization
- [ ] Dirty indicators work (formulas and directories)
- [ ] Navigation works with modal guard
- [ ] Keyboard navigation complete
- [ ] Tree appears in sidebar when workspace is open

---

### Phase 5: Sidebar Header & Search

**Objective:** Complete sidebar header with search filter, refresh, change folder
**Prerequisites:** Phase 4 — WorkspaceTree must be functional

#### Tasks

**5.1 Create WorkspaceHeader component**
- **What:** Sidebar header showing root path, refresh button, change folder button, search input
- **Files:**
  - Create: `/apps/frontend/src/components/layout/workspace-header.tsx`
  - Modify: `/apps/frontend/src/components/layout/index.ts` — add export
- **Key details:**
  - Layout per spec section 3.2: "EXPLORER" title, root basename, refresh icon, folder icon, search input
  - Sub-components: `RootPathDisplay`, `RefreshButton`, `ChangeFolderButton` (all in same file)
  - Consumes: `useWorkspaceConfig()` for root path, `useTree()` for refresh and lastUpdated
  - Root basename with full path in `title` attribute
  - Refresh icon: `⟳` SVG, `#888`, 14px, tooltip with last-updated timestamp
  - Change folder icon: folder-open SVG, `#888`, 14px
  - Search input: `#1e293b` background, `#cccccc` text, 12px, placeholder "Filter formulas..."
- **Acceptance criteria:**
  - [ ] Header shows current root basename
  - [ ] Full path visible in tooltip
  - [ ] Refresh button triggers tree re-fetch
  - [ ] Last-updated shows in refresh tooltip
- **Dependencies:** Phase 4

**5.2 Implement search filter**
- **What:** Filter input that narrows visible tree items
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/workspace-header.tsx` — add filter state
  - Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — accept `filter` prop, filter flat list
- **Key details:**
  - `useState` for filter text in header, pass down to `WorkspaceTree`
  - Debounce input at 150ms (use `setTimeout` pattern or simple debounce hook)
  - Filter by formula name substring match (case-insensitive)
  - When filter active: show only matching formulas and their ancestor directories
  - Clear button in input when filter is non-empty
- **Acceptance criteria:**
  - [ ] Typing filters tree in real-time
  - [ ] Filter is debounced at 150ms
  - [ ] Clear button resets filter
  - [ ] Matching formulas and their parent dirs shown
- **Dependencies:** 5.1

**5.3 Implement Change Folder flow**
- **What:** Button that opens DirectoryBrowser with UnsavedChangesModal guard
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/workspace-header.tsx` — add change folder handler
- **Key details:**
  - Before opening browser: check for unsaved changes via `useFormulaDirty()`
  - If unsaved: show `UnsavedChangesModal`, wait for resolution
  - After folder selection: call `apiPost('/api/workspace/open', { path })`
  - Update localStorage, add to recent roots
  - Navigate to `/` (reset route)
- **Acceptance criteria:**
  - [ ] Change Folder button opens directory browser
  - [ ] Unsaved changes trigger modal first
  - [ ] New folder opens successfully
  - [ ] Tree updates to new root
  - [ ] Route resets to `/`
- **Dependencies:** 3.1, 5.1

**5.4 Update sidebar collapse toggle**
- **What:** Replace text `<` / `>` with chevron SVG icons
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/sidebar.tsx` — replace toggle button content
- **Key details:**
  - SVG chevron icons: `‹` (collapsed) / `›` (expanded)
  - Use inline SVG with `aria-hidden="true"`
  - Same color and size as existing toggle: `#888`, clickable
- **Acceptance criteria:**
  - [ ] Chevron icons replace text
  - [ ] Toggle still works correctly
  - [ ] Accessibility maintained
- **Dependencies:** None

**5.5 Add document.title management**
- **What:** Update browser title based on current formula
- **Files:**
  - Modify: `/apps/frontend/src/routes/formula.$name.tsx` — set `document.title = \`${formulaName} - Beads IDE\``
  - Modify: `/apps/frontend/src/routes/index.tsx` — set `document.title = 'Beads IDE'`
- **Key details:**
  - Use `useEffect` to set title on route mount
  - Clean up not needed (just overwritten on navigation)
- **Acceptance criteria:**
  - [ ] Browser title shows formula name when editing
  - [ ] Browser title shows "Beads IDE" on welcome/home
- **Dependencies:** None

#### Phase 5 Exit Criteria
- [ ] Sidebar header complete with all elements
- [ ] Search filter works with debounce
- [ ] Change folder flow works with unsaved guard
- [ ] Collapse toggle uses chevrons
- [ ] Browser title updates

---

### Phase 6: Command Palette & Polish

**Objective:** Command palette integration, Open Recent validation, final polish
**Prerequisites:** Phase 3 complete (WelcomePanel), Phase 5 complete (WorkspaceHeader)

#### Tasks

**6.1 Add workspace actions to command palette**
- **What:** Register Open Folder, New Project, Change Folder as command palette actions
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/command-palette.tsx` — extend `useDefaultActions` signature and add 3 new actions
  - Modify: `/apps/frontend/src/routes/__root.tsx` — pass handlers to `useDefaultActions`
- **Key details:**
  - Extend `useDefaultActions` params: `onOpenFolder?: () => void`, `onNewProject?: () => void`, `onChangeFolder?: () => void`
  - New actions:
    ```typescript
    { id: 'open-folder', label: 'Open Folder...', description: 'Open a project folder', icon: '📁', category: 'Workspace', onSelect: handlers.onOpenFolder },
    { id: 'new-project', label: 'New Project...', description: 'Create a new Beads project', icon: '✨', category: 'Workspace', onSelect: handlers.onNewProject },
    { id: 'change-folder', label: 'Change Folder...', description: 'Switch to a different project folder', icon: '🔄', category: 'Workspace', onSelect: handlers.onChangeFolder },
    ```
  - In `__root.tsx`: create handler functions that open DirectoryBrowser/NewProjectModal
  - "Change Folder" should check unsaved state first
- **Acceptance criteria:**
  - [ ] Cmd+K shows workspace actions
  - [ ] "Open Folder" opens directory browser
  - [ ] "New Project" opens new project flow
  - [ ] "Change Folder" works with unsaved guard
- **Dependencies:** Phase 3, Phase 5

**6.2 Implement recent path validation**
- **What:** Check each recent path exists before showing as clickable
- **Files:**
  - Modify: `/apps/frontend/src/components/layout/welcome-panel.tsx` — add path validation
- **Key details:**
  - On WelcomePanel mount: call `apiFetch('/api/browse?path=<p>')` for each recent path
  - If error or not found: mark as invalid
  - Invalid paths: show `#ef4444` warning icon, `cursor: not-allowed`, not clickable
  - Valid paths: normal clickable behavior
  - Use `Promise.all` for parallel validation
- **Acceptance criteria:**
  - [ ] Valid recent paths are clickable
  - [ ] Invalid paths show warning icon
  - [ ] Invalid paths are not clickable
  - [ ] Validation happens on mount
- **Dependencies:** Phase 3

**6.3 Refresh useFormulas after workspace change**
- **What:** Invalidate formula list after workspace open/change
- **Files:**
  - Modify: `/apps/frontend/src/routes/__root.tsx` or workspace open handlers — trigger `useFormulas` refresh
- **Key details:**
  - `useFormulas()` exposes `refresh: doFetch` in its return
  - After successful `POST /api/workspace/open`: call this refresh
  - If `useFormulas` is called inside `FormulaTree` only, lift to `__root.tsx` level or use callback ref
- **Acceptance criteria:**
  - [ ] Formula list updates after workspace change
  - [ ] No stale formulas from previous root shown
- **Dependencies:** Phase 3, Phase 4

#### Phase 6 Exit Criteria
- [ ] Command palette actions work
- [ ] Recent path validation works
- [ ] Formula list refreshes on workspace change

---

### Phase 7: Testing & Validation

**Objective:** E2E tests, performance validation, cleanup
**Prerequisites:** Phases 1-6 complete

#### Tasks

**7.1 Write Playwright E2E tests**
- **What:** Full end-to-end tests for onboarding flow
- **Files:**
  - Create: `/apps/frontend/tests/e2e/workspace-onboarding.spec.ts`
- **Key details:**
  - Extend `base.extend<TestFixtures>()` with `apiMock` fixture
  - Add workspace API mocks to `ApiMock` class: `/api/workspace`, `/api/tree`, `/api/browse`
  - Test scenarios:
    1. Initial welcome screen (no root configured)
    2. Open folder flow (pick → select → tree shows)
    3. New project flow (pick → template → create → tree shows)
    4. Tree navigation (expand, collapse, select formula)
    5. Formula opening (click → navigate to editor)
    6. Dirty indicator (unsaved changes show dot)
    7. Change folder with unsaved guard
    8. Search filter
    9. Open recent (valid and invalid paths)
    10. Command palette actions
- **Acceptance criteria:**
  - [ ] All E2E test scenarios pass
  - [ ] `pnpm run test:e2e --filter @beads-ide/frontend` passes
- **Dependencies:** Phases 1-6

**7.2 Performance assertion**
- **What:** Verify tree renders within 500ms for 100-formula fixture
- **Files:**
  - Modify: `/apps/frontend/tests/e2e/workspace-onboarding.spec.ts` — add performance test
- **Key details:**
  - Mock `GET /api/tree` with 100 formula nodes (generate fixture)
  - Measure time from `page.goto('/')` to tree visible
  - Assert < 500ms
- **Acceptance criteria:**
  - [ ] Performance assertion passes for 100-formula tree
- **Dependencies:** 7.1

**7.3 Final cleanup and validation**
- **What:** Lint, typecheck, verify all quality gates
- **Files:**
  - All modified and created files
- **Key details:**
  - `pnpm run check` (Biome lint + format) passes
  - `pnpm run typecheck` (all workspaces) passes
  - `pnpm run test` (all unit tests) passes
  - `pnpm run test:e2e` (all E2E tests) passes
  - Add TODO comment to `FormulaTree` marking it for removal after WorkspaceTree validation
- **Acceptance criteria:**
  - [ ] All quality gates pass
  - [ ] No lint or type errors
  - [ ] FormulaTree marked with deprecation TODO
- **Dependencies:** 7.1, 7.2

#### Phase 7 Exit Criteria
- [ ] All Playwright E2E tests pass
- [ ] Performance assertion passes
- [ ] All lint, type, and unit test checks pass
- [ ] Feature is complete and ready for deployment

---

## Cross-Cutting Concerns

### Error Handling

**Frontend:**
- Use `apiFetch` / `apiPost` from `lib/api.ts` — returns `{ data, error }` envelope, never throws
- Check `if (error)` and handle appropriately (usually `toast.error(message)`)
- For workspace errors (invalid path, permissions): show inline error in modal or panel
- For tree errors: show `TreeErrorState` component with error message and "Retry" button

**Backend:**
- All endpoints use `{ ok: false, error: string, code: string }` envelope
- Local `errorResponse(error: string, code: XxxError['code'])` helper in each route file
- HTTP status codes: 400 (validation/client), 404 (not found), 500 (server errors)
- Path validation: normalize with `path.resolve()`, check `fs.stat` for existence/directory type

### Testing Strategy

**Unit tests (Vitest):**
- Backend route tests: `new Hono()` + mount route + `app.request()` pattern
- Tree scanner tests: fixture directories created in `beforeAll`, assertions on scanned structure
- Hook tests: Mock localStorage, test version guard and state management

**E2E tests (Playwright):**
- Use `ApiMock` fixture with `page.route()` intercepts
- Cover full user flows, not just component states
- Performance assertion: tree render < 500ms for 100 formulas
- Test keyboard navigation, dirty guards, error states

### Migration

**No migration needed.** The feature adds new functionality without changing existing data structures or APIs. Existing formula operations (cook, sling, pour) continue to work via `/api/formulas` endpoints.

`FormulaTree` is NOT deleted — it remains in codebase but is not rendered when `WorkspaceTree` is active. A follow-up task can remove it after `WorkspaceTree` is validated in production.

---

## Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `FormulaDirtyProvider` not mounted | M | H | Phase 2 task 2.1 verifies and fixes if needed. Test immediately. |
| Tree virtualization performance issues | L | M | `@tanstack/react-virtual` is well-tested. Use 100-formula fixture for performance regression test. |
| Directory browser security (path traversal) | M | H | Backend validates paths with `path.resolve()` normalization. Consider allowlist of browsable roots (home directory, project roots). |
| Backend workspace root lost on restart | H | L | Documented behavior: frontend re-syncs from localStorage on startup and re-opens the workspace. Acceptable for MVP. |
| Expand state localStorage grows unbounded | L | L | `treeExpanded` is scoped per root. Old roots naturally fall off as `recentRoots` caps at 5. Can add cleanup later. |
| Large tree (500+ nodes) causes jank | M | M | Backend enforces 500-node limit with `truncated: true`. Frontend shows banner. Search filter reduces visible nodes. |

---

## Spec Coverage Matrix

| Spec Section | Plan Section | Phase |
|-------------|-------------|-------|
| 1. Overview | Overview | All phases |
| 2. User Stories - US-1 (Open Folder) | 3.1, 3.2, 3.4 | Phase 3 |
| 2. User Stories - US-2 (New Project) | 3.3 | Phase 3 |
| 2. User Stories - US-3 (Browse and select) | 4.1, 4.2, 4.3, 4.4 | Phase 4 |
| 2. User Stories - US-4 (Switch folders) | 5.3 | Phase 5 |
| 2. User Stories - US-5 (Open Recent) | 3.2, 6.2 | Phase 3, 6 |
| 2. User Stories - US-6 (Performance) | 4.1, 7.2 | Phase 4, 7 |
| 3.1 Welcome Screen | 3.2 | Phase 3 |
| 3.2 Sidebar Header | 5.1, 5.4 | Phase 5 |
| 3.3 Directory Tree | 4.1, 4.2, 4.3, 4.4 | Phase 4 |
| 3.4 New Project Template Picker | 3.3 | Phase 3 |
| 4.1 Workspace Config (localStorage) | 2.3 | Phase 2 |
| 4.2 Backend: Workspace State | 1.2, 1.3 | Phase 1 |
| 4.3 Backend: Tree Endpoint | 1.3 | Phase 1 |
| 4.4 Frontend: New Components | 3.1, 3.2, 3.3, 4.1, 5.1 | Phases 3-5 |
| 4.5 Virtualization | 4.1 | Phase 4 |
| 4.6 Dirty State Propagation | 4.2 | Phase 4 |
| 4.7 Folder Picker Integration | Replaced by 3.1 (DirectoryBrowser) | Phase 3 |
| 4.8 Navigation | 4.3 | Phase 4 |
| 4.9 Command Palette Integration | 6.1 | Phase 6 |
| 5.1 GET /api/tree | 1.3 | Phase 1 |
| 5.2 POST /api/workspace/open | 1.3 | Phase 1 |
| 5.3 POST /api/workspace/init | 1.3 | Phase 1 |
| 5.4 GET /api/workspace | 1.3 | Phase 1 |
| 5.5 Shared Types | 1.1 | Phase 1 |
| Review Resolution: Folder Picker | 1.3 (GET /api/browse), 3.1 (DirectoryBrowser) | Phase 1, 3 |
| Q63 Resolution: Folder-only mode | 4.5 | Phase 4 |

---

## Appendix: Key File Paths

### New Files

| Path | Phase | Purpose |
|------|-------|---------|
| `/apps/backend/src/routes/workspace.ts` | 1 | Workspace management routes (5 endpoints) |
| `/apps/backend/tests/routes/workspace.test.ts` | 1 | Backend unit tests |
| `/apps/frontend/src/hooks/use-workspace-config.ts` | 2 | localStorage WorkspaceConfig management |
| `/apps/frontend/src/hooks/use-tree.ts` | 2 | Tree data fetching hook |
| `/apps/frontend/src/components/layout/directory-browser.tsx` | 3 | Backend-powered directory picker modal |
| `/apps/frontend/src/components/layout/welcome-panel.tsx` | 3 | Onboarding welcome screen |
| `/apps/frontend/src/components/layout/new-project-modal.tsx` | 3 | New project creation modal |
| `/apps/frontend/src/components/layout/workspace-tree.tsx` | 4 | Virtualized directory tree |
| `/apps/frontend/src/components/layout/workspace-header.tsx` | 5 | Sidebar header with search |
| `/apps/frontend/tests/e2e/workspace-onboarding.spec.ts` | 7 | Playwright E2E tests |

### Modified Files

| Path | Phase | Changes |
|------|-------|---------|
| `/packages/shared/src/ide-types.ts` | 1 | Add 8 workspace-related types |
| `/packages/shared/src/index.ts` | 1 | Export new types |
| `/apps/backend/src/config.ts` | 1 | Add workspaceRoot variable and accessor functions |
| `/apps/backend/src/index.ts` | 1 | Register workspace routes |
| `/apps/frontend/package.json` | 2 | Add @tanstack/react-virtual |
| `/apps/frontend/src/hooks/index.ts` | 2 | Export new hooks |
| `/apps/frontend/src/routes/__root.tsx` | 2, 4, 6 | Add FormulaDirtyProvider (if needed), startup sync, sidebar content, handlers |
| `/apps/frontend/src/components/layout/index.ts` | 3, 4, 5 | Export new components |
| `/apps/frontend/src/routes/index.tsx` | 3, 5 | Conditional WelcomePanel, document.title |
| `/apps/frontend/src/components/layout/sidebar.tsx` | 5 | Chevron toggle icons |
| `/apps/frontend/src/components/layout/command-palette.tsx` | 6 | Extend useDefaultActions with workspace actions |
| `/apps/frontend/src/routes/formula.$name.tsx` | 5 | document.title management |
