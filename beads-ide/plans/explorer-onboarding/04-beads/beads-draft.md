# Beads Draft: explorer-onboarding

**Generated:** 2026-02-24
**Source:** plans/explorer-onboarding/03-plan/plan.md
**Plan review status:** Reviewed (0 P0, 4 P1 resolved, 5 P2 resolved)

---

## Structure

### Feature Epic: explorer-onboarding

**Type:** epic
**Priority:** P1
**Description:** VS Code-style project onboarding and directory-first file tree explorer for Beads IDE. Replaces the current search-path-grouped formula listing with a workspace-rooted tree that shows `.formula.toml` files in their actual filesystem hierarchy.

---

### Sub-Epic: Phase 1 — Backend Foundation

**Type:** epic
**Priority:** P1
**Parent:** Feature epic
**Description:** All new backend endpoints functional and tested. Creates workspace management routes, tree scanning, and directory browsing APIs.

#### Issue: Add shared workspace types (1.1)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** None
**Description:**
Define all workspace-related TypeScript interfaces in the shared package.

**Files:**
- Modify: `/packages/shared/src/ide-types.ts` — append 8 new type definitions (TreeNode, TreeResponse, TreeError, WorkspaceOpenRequest, WorkspaceOpenResponse, WorkspaceInitRequest, WorkspaceInitResponse, WorkspaceStateResponse, WorkspaceError)
- Modify: `/packages/shared/src/index.ts` — add exports for new types

**Key details:**
Add these exact type definitions to `ide-types.ts`:

```typescript
export interface TreeNode {
  name: string
  path: string
  type: 'directory' | 'formula'
  formulaName?: string
  children?: TreeNode[]
}

export interface TreeResponse {
  ok: true
  root: string
  nodes: TreeNode[]
  totalCount: number
  truncated: boolean
}

export interface TreeError {
  ok: false
  error: string
  code: 'NO_ROOT' | 'NOT_FOUND' | 'READ_ERROR'
}

export interface WorkspaceOpenRequest {
  path: string
}

export interface WorkspaceOpenResponse {
  ok: true
  root: string
  formulaCount: number
}

export interface WorkspaceInitRequest {
  path: string
  template?: 'blank'
}

export interface WorkspaceInitResponse {
  ok: true
  root: string
  created: string[]
}

export interface WorkspaceStateResponse {
  ok: true
  root: string
  formulaCount: number
  searchPaths: string[]
}

export interface WorkspaceError {
  ok: false
  error: string
  code: 'NOT_FOUND' | 'NOT_DIRECTORY' | 'PERMISSION_DENIED' | 'ALREADY_INITIALIZED' | 'WRITE_ERROR' | 'NO_ROOT' | 'READ_ERROR'
}
```

- All types use `ok: true/false` envelope pattern matching existing `CookResult`, `SlingResult`
- Note: `GET /api/workspace` returns `WorkspaceError` with code `NO_ROOT` when no workspace root is configured (not a success response with null root)

**Acceptance Criteria:**
- [ ] `pnpm run typecheck --filter @beads-ide/shared` passes
- [ ] All 9 type interfaces exported from `@beads-ide/shared` (TreeNode, TreeResponse, TreeError, WorkspaceOpenRequest, WorkspaceOpenResponse, WorkspaceInitRequest, WorkspaceInitResponse, WorkspaceStateResponse, WorkspaceError)

#### Issue: Add workspace root management to config.ts (1.2)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** None
**Description:**
Add module-level `workspaceRoot` variable and accessor functions to enable hot-swapping the active root.

**Files:**
- Modify: `/apps/backend/src/config.ts` — add `let workspaceRoot: string | null = null`, `setWorkspaceRoot(path: string): void`, `getWorkspaceRoot(): string`

**Key details:**
- `setWorkspaceRoot(path)` sets the variable and calls `clearConfigCache()` to invalidate the cached config
- `getWorkspaceRoot()` returns `workspaceRoot ?? process.cwd()`
- Update `loadConfig()` to use `getWorkspaceRoot()` as the default cwd argument
- `clearConfigCache()` does NOT reset `workspaceRoot` — only the config cache

**Acceptance Criteria:**
- [ ] `setWorkspaceRoot('/some/path')` followed by `getConfig()` uses the new path
- [ ] Calling `setWorkspaceRoot()` twice uses the second path
- [ ] `clearConfigCache()` alone does not affect `workspaceRoot`

#### Issue: Create workspace routes file (1.3)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.1 (Add shared workspace types), Task 1.2 (Add workspace root management to config.ts)
**Description:**
New Hono route file with 5 endpoints for workspace management.

**Files:**
- Create: `/apps/backend/src/routes/workspace.ts`

**Key details:**
- `GET /api/workspace` — returns `WorkspaceStateResponse` with current root, formula count, search paths. Uses `getWorkspaceRoot()` and `getConfig()`. When no workspace root is configured (first launch), returns `WorkspaceError` with code `NO_ROOT` instead of a success response.
- `POST /api/workspace/open` — validates path exists and is directory, auto-creates `.beads/` directory if missing (resolves Q4), calls `setWorkspaceRoot(path)`, returns `WorkspaceOpenResponse`. Error codes: NOT_FOUND, NOT_DIRECTORY, PERMISSION_DENIED.
- `POST /api/workspace/init` — scaffolds `.beads/` + `formulas/` dirs, writes blank template file, then calls open logic. Error codes: ALREADY_INITIALIZED (if `.beads/` exists), WRITE_ERROR. Template content: `name = "new-formula"\nversion = 1\n\n[[steps]]\nid = "step-1"\ntitle = "First step"\ndescription = ""\n`
- `GET /api/tree` — recursive async scan using `fs.promises.readdir({ withFileTypes: true })`. Prunes directories without `.formula.toml` descendants. Stops at 500 nodes (sets `truncated: true`). Sorts: directories before files, then alphabetically.
- `GET /api/browse?path=<path>` — returns directory listing for the directory browser. Returns `{ entries: [{ name, type: "dir"|"file", path }] }`. Defaults to `os.homedir()` if no path. Validates path to prevent directory traversal.

**Patterns:**
- Follow `formulas.ts` pattern: `const workspace = new Hono()`, local `errorResponse()` helper, named export
- Use `.js` extension on imports (ESM project)
- Async FS: `fs.promises.readdir`, `fs.promises.stat`, `fs.promises.mkdir`, `fs.promises.writeFile`
- Path validation: `path.resolve(input) === input` normalization check

**Acceptance Criteria:**
- [ ] `curl localhost:3001/api/workspace` returns current state JSON
- [ ] `curl -X POST localhost:3001/api/workspace/open -d '{"path":"/tmp/test"}' -H 'Content-Type: application/json'` works for valid paths
- [ ] `curl localhost:3001/api/tree` returns tree structure
- [ ] `curl 'localhost:3001/api/browse?path=/home'` returns directory listing
- [ ] POST to invalid path returns appropriate error code

#### Issue: Register workspace routes (1.4)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.3 (Create workspace routes file)
**Description:**
Mount workspace routes in the main Hono app.

**Files:**
- Modify: `/apps/backend/src/index.ts` — add `import { workspace } from './routes/workspace.js'` and `app.route('/api', workspace)`

**Acceptance Criteria:**
- [ ] All 5 workspace endpoints accessible via `/api/*`

#### Issue: Write backend unit tests (1.5)

**Type:** task
**Priority:** P1
**Parent:** Phase 1
**Dependencies:** Task 1.3 (Create workspace routes file)
**Description:**
Vitest tests for workspace routes and tree scanner.

**Files:**
- Create: `/apps/backend/tests/routes/workspace.test.ts`

**Key details:**
- Follow `graph.test.ts` pattern: `const app = new Hono(); app.route('/api', workspace)`
- Test tree scanner with fixture directories: create temp dirs with `.formula.toml` files in `beforeAll`, scan them, assert structure
- Test path validation (no traversal outside allowed roots)
- Test node limit truncation
- Use `vi.spyOn` to mock filesystem operations where needed

**Acceptance Criteria:**
- [ ] `pnpm run test --filter @beads-ide/backend` passes
- [ ] Tests cover: GET /api/workspace, POST /api/workspace/open (success + errors), POST /api/workspace/init (success + errors), GET /api/tree (empty, normal, truncated), GET /api/browse
- [ ] Backend performance test: `GET /api/tree` responds < 500ms for 200-file fixture (per spec section 5.1)

---

### Sub-Epic: Phase 2 — Frontend State Layer

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Frontend hooks and startup sync working against live backend. Creates useWorkspaceConfig and useTree hooks.

#### Issue: Verify FormulaDirtyProvider presence (2.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** None
**Description:**
Confirm `FormulaDirtyProvider` is mounted in `__root.tsx` context tree; add if missing.

**Files:**
- Read: `/apps/frontend/src/routes/__root.tsx`
- Modify (if needed): `/apps/frontend/src/routes/__root.tsx` — add `<FormulaDirtyProvider>` wrapping `RootLayoutInner`

**Key details:**
- `useFormulaDirty()` is called by existing `FormulaTree` and will be called by new `WorkspaceTree`. If provider is missing, the hook will throw.
- Note: Provider is already mounted in `main.tsx` per plan review findings.

**Acceptance Criteria:**
- [ ] `useFormulaDirty()` works when called from any component under `__root.tsx`

#### Issue: Install @tanstack/react-virtual (2.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** None
**Description:**
Add virtualization dependency for tree component.

**Files:**
- Modify: `/apps/frontend/package.json` (via pnpm command)

**Key details:**
- Run `pnpm add @tanstack/react-virtual --filter @beads-ide/frontend`

**Acceptance Criteria:**
- [ ] Package appears in `apps/frontend/package.json` dependencies
- [ ] `import { useVirtualizer } from '@tanstack/react-virtual'` compiles without error

#### Issue: Create useWorkspaceConfig hook (2.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** None
**Description:**
localStorage state management hook for workspace configuration.

**Files:**
- Create: `/apps/frontend/src/hooks/use-workspace-config.ts`
- Modify: `/apps/frontend/src/hooks/index.ts` — add export

**Key details:**
- Interface: `{ version: 1, rootPath: string | null, recentRoots: string[], treeExpanded: Record<string, Record<string, boolean>> }`
- Version guard: if missing or version !== 1, initialize defaults
- Always wrap localStorage in try/catch (follow `use-keyboard-tip.ts` pattern)
- Storage key: `'workspaceConfig'`
- Return: `{ config, setRootPath, addRecentRoot, setTreeExpanded, clearConfig }`
- `addRecentRoot` prepends to array, caps at 5, deduplicates
- `treeExpanded` is nested: `rootPath -> dirPath -> expanded`

**Acceptance Criteria:**
- [ ] Hook reads/writes localStorage correctly
- [ ] Version mismatch triggers re-initialization
- [ ] `addRecentRoot` caps at 5 entries
- [ ] localStorage errors are caught and ignored

#### Issue: Create useTree hook (2.4)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 1.1 (Add shared workspace types), Task 1.4 (Register workspace routes)
**Description:**
Data fetching hook for `GET /api/tree`.

**Files:**
- Create: `/apps/frontend/src/hooks/use-tree.ts`
- Modify: `/apps/frontend/src/hooks/index.ts` — add export

**Key details:**
- Follow `use-formulas.ts` pattern: `useState` + `useCallback` + `useEffect`
- Use `apiFetch` from `lib/api.ts` (not raw fetch)
- Return: `{ nodes, root, totalCount, truncated, isLoading, error, refresh, lastUpdated }`
- `lastUpdated` is `Date | null` for refresh button tooltip

**Acceptance Criteria:**
- [ ] Hook returns tree data from live backend
- [ ] Loading state shows during fetch
- [ ] Error state populated on failure
- [ ] `refresh()` triggers re-fetch

#### Issue: Add startup workspace sync (2.5)

**Type:** task
**Priority:** P2
**Parent:** Phase 2
**Dependencies:** Task 2.3 (Create useWorkspaceConfig hook)
**Description:**
Effect in `__root.tsx` to reconcile localStorage with backend state.

**Files:**
- Modify: `/apps/frontend/src/routes/__root.tsx` — add sync effect using `useWorkspaceConfig` and `apiFetch('/api/workspace')`

**Key details:**
- On mount: call `GET /api/workspace` via `apiFetch`, compare response with `localStorage.workspaceConfig.rootPath`
- If backend returns `NO_ROOT` error but localStorage has a root: call `POST /api/workspace/open` with the localStorage root to restore
- If backend root differs from localStorage root (e.g., backend restarted): call `clearConfig()` from `useWorkspaceConfig()` to reset localStorage and navigate to `/` via `window.history.pushState({}, '', '/')` followed by `window.dispatchEvent(new PopStateEvent('popstate'))` to show welcome screen
- This runs once on mount via `useEffect` with empty dependency array

**Acceptance Criteria:**
- [ ] App syncs localStorage with backend on startup
- [ ] Backend restart (root loss) triggers welcome screen
- [ ] localStorage root is restored to backend after page refresh

---

### Sub-Epic: Phase 3 — Welcome Panel & Onboarding Flow

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Full onboarding flow from welcome screen to workspace open. Creates DirectoryBrowser, WelcomePanel, and NewProjectModal components.

#### Issue: Create DirectoryBrowser component (3.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 1.4 (Register workspace routes)
**Description:**
Modal component for browsing server-side directories.

**Files:**
- Create: `/apps/frontend/src/components/layout/directory-browser.tsx`
- Modify: `/apps/frontend/src/components/layout/index.ts` — add export

**Key details:**
- Props: `{ isOpen, onSelect, onCancel, initialPath? }`
- Uses native `<dialog>` element with `showModal()` (follow `UnsavedChangesModal` pattern in `/apps/frontend/src/components/ui/unsaved-changes-modal.tsx`: `useRef<HTMLDialogElement>`, `useEffect` calling `dialog.showModal()` or `dialog.close()` on `isOpen` change)
- Calls `apiFetch('/api/browse?path=<path>')` to fetch directory contents
- Displays: breadcrumb navigation, directory list, "Select This Folder" button
- Directories only (filter out files)
- Loading state: show "Loading..." text while directory contents are being fetched; use `useState` for `isLoading` flag
- Styling: `#1e293b` background, `#334155` border (match existing modals)

**Acceptance Criteria:**
- [ ] Modal opens and closes correctly
- [ ] Can navigate directories by clicking
- [ ] Breadcrumb shows current path, allows jumping back
- [ ] "Select This Folder" calls `onSelect(fullPath)`
- [ ] Keyboard: Escape closes modal

#### Issue: Create WelcomePanel component (3.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 3.1 (Create DirectoryBrowser component), Task 2.3 (Create useWorkspaceConfig hook)
**Description:**
Onboarding welcome screen with Open Folder, New Project, Recent list.

**Files:**
- Create: `/apps/frontend/src/components/layout/welcome-panel.tsx`
- Modify: `/apps/frontend/src/components/layout/index.ts` — add export

**Key details:**
- Sub-components: `WelcomePanel`, `RecentList`, `RecentItem` (all in same file, not exported)
- Consumes: `useWorkspaceConfig()` for recent roots
- Layout per spec section 3.1: centered title "Beads IDE" (#38bdf8), subtitle, two buttons, recent list
- "Open Folder" button opens `DirectoryBrowser`, then calls `apiPost('/api/workspace/open', { path })`
- After successful open: update localStorage via `setRootPath(path)` and `addRecentRoot(path)`
- Recent items: validate with `apiFetch('/api/browse?path=<p>')` (check existence), show warning icon for missing
- Clicking recent path triggers same open flow without picker
- "New Project" opens `DirectoryBrowser`, then opens `NewProjectModal`

**Acceptance Criteria:**
- [ ] Welcome screen renders when no root configured
- [ ] "Open Folder" → DirectoryBrowser → select → workspace opens → tree shows
- [ ] Recent list shows up to 5 items
- [ ] Missing paths have warning icon and are not clickable
- [ ] "New Project" flow starts (modal appears)

#### Issue: Create NewProjectModal component (3.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 1.4 (Register workspace routes)
**Description:**
Modal for new project creation with template picker.

**Files:**
- Create: `/apps/frontend/src/components/layout/new-project-modal.tsx`
- Modify: `/apps/frontend/src/components/layout/index.ts` — add export

**Key details:**
- Props: `{ isOpen, selectedPath, onComplete, onCancel }`
- Uses native `<dialog>` element with `showModal()` (follow `UnsavedChangesModal` pattern)
- Shows selected path, template picker (MVP: only "Blank formula" option)
- "Create" calls `apiPost('/api/workspace/init', { path, template: 'blank' })`
- On success: calls `onComplete()` which triggers same workspace open flow
- On error: shows inline error message below template picker

**Acceptance Criteria:**
- [ ] Modal shows selected folder path
- [ ] "Blank formula" template is pre-selected
- [ ] "Create" calls init endpoint
- [ ] Success: modal closes, workspace opens
- [ ] Error: inline message displayed

#### Issue: Update index.tsx for conditional welcome screen (3.4)

**Type:** task
**Priority:** P2
**Parent:** Phase 3
**Dependencies:** Task 3.2 (Create WelcomePanel component)
**Description:**
Render `WelcomePanel` when no root is configured.

**Files:**
- Modify: `/apps/frontend/src/routes/index.tsx` — import `useWorkspaceConfig`, conditionally render `WelcomePanel`

**Key details:**
- If `rootPath` is null/missing: render `<WelcomePanel />`
- Otherwise: render existing landing page content (or just empty since tree is in sidebar)
- Add `document.title` management: `'Beads IDE'` for welcome screen

**Acceptance Criteria:**
- [ ] `/` route shows welcome screen when no root
- [ ] After opening folder, `/` route shows normal content
- [ ] Browser title is "Beads IDE"

---

### Sub-Epic: Phase 4 — WorkspaceTree Component

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Directory tree with virtualization, dirty indicators, keyboard navigation. Main UI component for displaying workspace structure.

#### Issue: Create WorkspaceTree component (4.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 2.1 (Verify FormulaDirtyProvider presence), Task 2.2 (Install @tanstack/react-virtual), Task 2.3 (Create useWorkspaceConfig hook), Task 2.4 (Create useTree hook)
**Description:**
Main virtualized tree component replacing formula listing.

**Files:**
- Create: `/apps/frontend/src/components/layout/workspace-tree.tsx`
- Modify: `/apps/frontend/src/components/layout/index.ts` — add export

**Key details:**
- Sub-components in same file: `WorkspaceTree`, `DirectoryNode`, `FormulaNode`, `EmptyState`, `NodeLimitBanner`, `LoadingSkeleton`, `TreeErrorState`
- Internal type: `FlatTreeItem { id, path, name, type, formulaName?, depth, isExpanded?, isDirty? }`
- Consumes: `useTree()`, `useFormulaDirty()`, `useWorkspaceConfig()` (for expand state), `useFormulaSave()` (for modal guard — import from `../../contexts` not from `hooks`)
- Virtualization: `@tanstack/react-virtual` `useVirtualizer` on flattened tree
- Tree flattening: recursive `TreeNode[]` → `FlatTreeItem[]` based on expand state
- Expand/collapse: toggle in `treeExpanded` via `setTreeExpanded(rootPath, dirPath, expanded)`
- Inline CSSProperties at top of file (follow `formula-tree.tsx` exactly)
- Style values: `#2a2d2e` hover, `#094771` selected, `#fbbf24` dirty dot (6px), 22px item height, 16px/level indent
- SVG icons inline with `aria-hidden="true"`: chevron (▶/▼), folder/folder-open, file-code

**Acceptance Criteria:**
- [ ] Tree renders directories and formula files correctly
- [ ] Directories expand/collapse on click
- [ ] Expand state persists to localStorage per root
- [ ] Empty directories (no formula descendants) not shown
- [ ] Loading skeleton shows during fetch
- [ ] Empty state shows when zero formulas
- [ ] Node limit banner shows when truncated

#### Issue: Implement dirty state propagation (4.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 4.1 (Create WorkspaceTree component)
**Description:**
Show amber dirty indicator on formulas and propagate to parent directories.

**Files:**
- Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add dirty calculation logic

**Key details:**
- Call `useFormulaDirty()` to get `isDirty(name: string)` function
- During tree flattening: mark formula nodes with `isDirty` boolean
- Compute `directoriesDirty: Set<string>` by walking ancestors of dirty formulas
- Directory node shows amber dot if path is in `directoriesDirty` set

**Acceptance Criteria:**
- [ ] Dirty formula shows amber dot
- [ ] Parent directories of dirty formulas show amber dot
- [ ] Dot clears when formula is saved

#### Issue: Implement formula navigation (4.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 4.1 (Create WorkspaceTree component)
**Description:**
Clicking formula navigates to `/formula/:name` with UnsavedChangesModal guard.

**Files:**
- Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add click handler and modal logic

**Key details:**
- Navigation pattern (match `FormulaTree` exactly):
  ```typescript
  window.history.pushState({}, '', `/formula/${encodeURIComponent(formulaName)}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
  ```
- Before navigation: check `useFormulaSave()` for dirty state, show `UnsavedChangesModal` if needed
- Modal pattern: `const [showModal, setShowModal] = useState(false)`, `const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)`
- Import `UnsavedChangesModal` from `../ui/unsaved-changes-modal`

**Acceptance Criteria:**
- [ ] Clicking formula navigates to editor
- [ ] Unsaved changes trigger modal before navigation
- [ ] "Save" in modal saves, then navigates
- [ ] "Discard" navigates without saving
- [ ] "Cancel" cancels navigation

#### Issue: Implement keyboard navigation (4.4)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 4.1 (Create WorkspaceTree component)
**Description:**
Arrow keys, Enter, Space for tree navigation.

**Files:**
- Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — add onKeyDown handler

**Key details:**
- Track `focusedIndex` state
- ArrowUp/ArrowDown: move focus within flat list
- ArrowRight: expand directory (if collapsed)
- ArrowLeft: collapse directory (if expanded)
- Enter/Space: toggle expand for directory, navigate for formula
- Focus ring: 1px outline `#007acc`
- `tabIndex={0}` on container, `aria-activedescendant` for screen readers

**Acceptance Criteria:**
- [ ] Arrow keys navigate the tree
- [ ] Enter/Space activates selected item
- [ ] Focus visible with blue outline
- [ ] Screen reader announces focused item

#### Issue: Wire WorkspaceTree into sidebar (4.5)

**Type:** task
**Priority:** P2
**Parent:** Phase 4
**Dependencies:** Task 4.1 (Create WorkspaceTree component), Task 4.2 (Implement dirty state propagation), Task 4.3 (Implement formula navigation), Task 4.4 (Implement keyboard navigation)
**Description:**
Replace sidebar content with WorkspaceTree when root is configured.

**Files:**
- Modify: `/apps/frontend/src/routes/__root.tsx` — change `sidebarContent` prop

**Key details:**
- Import `WorkspaceTree` from `../components/layout`
- If `workspaceConfig.rootPath` is set: render `<WorkspaceTree />`
- If `rootPath` is null: sidebar is empty (welcome screen handles onboarding)
- `FormulaTree` is NOT deleted — leave it in codebase but don't render it

**Acceptance Criteria:**
- [ ] Sidebar shows `WorkspaceTree` when root is configured
- [ ] Sidebar is empty/minimal when no root (welcome screen is main content)
- [ ] Tree displays actual formulas from backend

---

### Sub-Epic: Phase 5 — Sidebar Header & Search

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Complete sidebar header with search filter, refresh, change folder functionality.

#### Issue: Create WorkspaceHeader component (5.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 4.5 (Wire WorkspaceTree into sidebar)
**Description:**
Sidebar header showing root path, refresh button, change folder button, search input.

**Files:**
- Create: `/apps/frontend/src/components/layout/workspace-header.tsx`
- Modify: `/apps/frontend/src/components/layout/index.ts` — add export

**Key details:**
- Layout per spec section 3.2: "EXPLORER" title, root basename, refresh icon, folder icon, search input
- Sub-components: `RootPathDisplay`, `RefreshButton`, `ChangeFolderButton` (all in same file)
- Consumes: `useWorkspaceConfig()` for root path, `useTree()` for refresh and lastUpdated
- Root basename with full path in `title` attribute
- Refresh icon: `⟳` SVG, `#888`, 14px, tooltip with last-updated timestamp
- Change folder icon: folder-open SVG, `#888`, 14px
- Search input: `#1e293b` background, `#cccccc` text, 12px, placeholder "Filter formulas..."

**Acceptance Criteria:**
- [ ] Header shows current root basename
- [ ] Full path visible in tooltip
- [ ] Refresh button triggers tree re-fetch
- [ ] Last-updated shows in refresh tooltip

#### Issue: Implement search filter (5.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 5.1 (Create WorkspaceHeader component)
**Description:**
Filter input that narrows visible tree items.

**Files:**
- Modify: `/apps/frontend/src/components/layout/workspace-header.tsx` — add filter state
- Modify: `/apps/frontend/src/components/layout/workspace-tree.tsx` — accept `filter` prop, filter flat list

**Key details:**
- `useState` for filter text in header, pass down to `WorkspaceTree`
- Debounce input at 150ms (use `setTimeout` pattern or simple debounce hook)
- Filter by formula name substring match (case-insensitive)
- When filter active: show only matching formulas and their ancestor directories
- Clear button in input when filter is non-empty

**Acceptance Criteria:**
- [ ] Typing filters tree in real-time
- [ ] Filter is debounced at 150ms
- [ ] Clear button resets filter
- [ ] Matching formulas and their parent dirs shown

#### Issue: Implement Change Folder flow (5.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** Task 3.1 (Create DirectoryBrowser component), Task 5.1 (Create WorkspaceHeader component)
**Description:**
Button that opens DirectoryBrowser with UnsavedChangesModal guard.

**Files:**
- Modify: `/apps/frontend/src/components/layout/workspace-header.tsx` — add change folder handler

**Key details:**
- Before opening browser: extract current formula name from `window.location.pathname` using `/^\/formula\/(.+)$/` regex match, then call `isDirty(formulaName)` via `useFormulaDirty()` to check for unsaved changes
- If unsaved: show `UnsavedChangesModal`, wait for resolution before proceeding
- After folder selection: call `apiPost('/api/workspace/open', { path })`
- Update localStorage via `setRootPath(path)` and `addRecentRoot(path)` from `useWorkspaceConfig()`
- Navigate to `/` via `window.history.pushState({}, '', '/')` + `window.dispatchEvent(new PopStateEvent('popstate'))`

**Acceptance Criteria:**
- [ ] Change Folder button opens directory browser
- [ ] Unsaved changes trigger modal first
- [ ] New folder opens successfully
- [ ] Tree updates to new root
- [ ] Route resets to `/`

#### Issue: Update sidebar collapse toggle (5.4)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** None
**Description:**
Replace text `<` / `>` with chevron SVG icons.

**Files:**
- Modify: `/apps/frontend/src/components/layout/sidebar.tsx` — replace toggle button content

**Key details:**
- SVG chevron icons: `‹` (collapsed) / `›` (expanded)
- Use inline SVG with `aria-hidden="true"`
- Same color as existing toggle: `#cccccc` (see `toggleButtonStyle` at line 29 of sidebar.tsx)

**Acceptance Criteria:**
- [ ] Chevron icons replace text
- [ ] Toggle still works correctly
- [ ] Accessibility maintained

#### Issue: Add document.title management (5.5)

**Type:** task
**Priority:** P2
**Parent:** Phase 5
**Dependencies:** None
**Description:**
Update browser title based on current formula.

**Files:**
- Modify: `/apps/frontend/src/routes/formula.$name.tsx` — set `document.title = \`${formulaName} - Beads IDE\``
- Modify: `/apps/frontend/src/routes/index.tsx` — set `document.title = 'Beads IDE'`

**Key details:**
- Use `useEffect` to set title on route mount
- Clean up not needed (just overwritten on navigation)

**Acceptance Criteria:**
- [ ] Browser title shows formula name when editing
- [ ] Browser title shows "Beads IDE" on welcome/home

---

### Sub-Epic: Phase 6 — Command Palette & Polish

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** Command palette integration, Open Recent validation, final polish.

#### Issue: Add workspace actions to command palette (6.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 6
**Dependencies:** Task 3.4 (Update index.tsx for conditional welcome screen), Task 5.3 (Implement Change Folder flow)
**Description:**
Register Open Folder, New Project, Change Folder as command palette actions.

**Files:**
- Modify: `/apps/frontend/src/components/layout/command-palette.tsx` — extend `useDefaultActions` signature and add 3 new actions
- Modify: `/apps/frontend/src/routes/__root.tsx` — pass handlers to `useDefaultActions`

**Key details:**
- Extend `useDefaultActions` params: `onOpenFolder?: () => void`, `onNewProject?: () => void`, `onChangeFolder?: () => void`
- New actions:
  ```typescript
  { id: 'open-folder', label: 'Open Folder...', description: 'Open a project folder', icon: '📁', category: 'Workspace', onSelect: handlers.onOpenFolder },
  { id: 'new-project', label: 'New Project...', description: 'Create a new Beads project', icon: '✨', category: 'Workspace', onSelect: handlers.onNewProject },
  { id: 'change-folder', label: 'Change Folder...', description: 'Switch to a different project folder', icon: '🔄', category: 'Workspace', onSelect: handlers.onChangeFolder },
  ```
- In `__root.tsx` `RootLayoutInner`: add modal state (`const [showDirBrowser, setShowDirBrowser] = useState(false)`, `const [showNewProject, setShowNewProject] = useState(false)`) and render `<DirectoryBrowser>` and `<NewProjectModal>` conditionally at the end of the component JSX (follow the pattern of `BeadDetail` modal at line ~163)
- Update the `useDefaultActions(...)` call at line ~89 to pass the new handler keys: `onOpenFolder: () => setShowDirBrowser(true)`, etc.
- "Change Folder" handler should extract formula name from URL, check `isDirty(name)`, and show `UnsavedChangesModal` if needed before opening browser

**Acceptance Criteria:**
- [ ] Cmd+K shows workspace actions
- [ ] "Open Folder" opens directory browser
- [ ] "New Project" opens new project flow
- [ ] "Change Folder" works with unsaved guard

#### Issue: Implement recent path validation (6.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 6
**Dependencies:** Task 3.2 (Create WelcomePanel component)
**Description:**
Check each recent path exists before showing as clickable.

**Files:**
- Modify: `/apps/frontend/src/components/layout/welcome-panel.tsx` — add path validation

**Key details:**
- On WelcomePanel mount: call `apiFetch('/api/browse?path=<p>')` for each recent path
- If error or not found: mark as invalid
- Invalid paths: show `#ef4444` warning icon, `cursor: not-allowed`, not clickable
- Valid paths: normal clickable behavior
- Use `Promise.all` for parallel validation

**Acceptance Criteria:**
- [ ] Valid recent paths are clickable
- [ ] Invalid paths show warning icon
- [ ] Invalid paths are not clickable
- [ ] Validation happens on mount

#### Issue: Refresh useFormulas after workspace change (6.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 6
**Dependencies:** Task 3.4 (Update index.tsx for conditional welcome screen), Task 4.5 (Wire WorkspaceTree into sidebar)
**Description:**
Invalidate formula list after workspace open/change.

**Files:**
- Modify: `/apps/frontend/src/routes/__root.tsx` or workspace open handlers — trigger `useFormulas` refresh

**Key details:**
- First: check where `useFormulas()` is called by searching the codebase (`grep -r "useFormulas"`)
- If `useFormulas()` is ONLY called inside `FormulaTree` (which is not rendered when `WorkspaceTree` is active per task 4.5), then this task is a no-op — mark complete with no changes
- If `useFormulas()` is called elsewhere (e.g., in cook/sling/pour operations), then after successful `POST /api/workspace/open` in workspace open handlers, call `refresh()` from `useFormulas()` to clear stale data
- Implementation path if needed: lift `useFormulas()` call to `__root.tsx` level and pass `refresh` function down to workspace open handlers via props or context

**Acceptance Criteria:**
- [ ] Formula list updates after workspace change
- [ ] No stale formulas from previous root shown

---

### Sub-Epic: Phase 7 — Testing & Validation

**Type:** epic
**Priority:** P2
**Parent:** Feature epic
**Description:** E2E tests, performance validation, and final cleanup.

#### Issue: Write Playwright E2E tests (7.1)

**Type:** task
**Priority:** P2
**Parent:** Phase 7
**Dependencies:** Task 6.1 (Add workspace actions to command palette), Task 6.2 (Implement recent path validation), Task 6.3 (Refresh useFormulas after workspace change)
**Description:**
Full end-to-end tests for onboarding flow.

**Files:**
- Create: `/apps/frontend/tests/e2e/workspace-onboarding.spec.ts`

**Key details:**
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

**Acceptance Criteria:**
- [ ] All E2E test scenarios pass
- [ ] `pnpm run test:e2e --filter @beads-ide/frontend` passes

#### Issue: Performance assertion (7.2)

**Type:** task
**Priority:** P2
**Parent:** Phase 7
**Dependencies:** Task 7.1 (Write Playwright E2E tests)
**Description:**
Verify tree renders within 500ms for 100-formula fixture.

**Files:**
- Modify: `/apps/frontend/tests/e2e/workspace-onboarding.spec.ts` — add performance test

**Key details:**
- Mock `GET /api/tree` with 100 formula nodes (generate fixture)
- Measure time from `page.goto('/')` to tree visible using `performance.now()`
- Assert < 500ms for frontend tree render
- Note: this is separate from the 200-file backend API test in task 1.5; this E2E test measures frontend rendering time, not backend response time

**Acceptance Criteria:**
- [ ] Frontend performance assertion passes: 100-formula tree renders in < 500ms

#### Issue: Final cleanup and validation (7.3)

**Type:** task
**Priority:** P2
**Parent:** Phase 7
**Dependencies:** Task 7.1 (Write Playwright E2E tests), Task 7.2 (Performance assertion)
**Description:**
Lint, typecheck, verify all quality gates.

**Files:**
- All modified and created files

**Key details:**
- `pnpm run check` (Biome lint + format) passes
- `pnpm run typecheck` (all workspaces) passes
- `pnpm run test` (all unit tests) passes
- `pnpm run test:e2e` (all E2E tests) passes
- Add TODO comment to `FormulaTree` marking it for removal after WorkspaceTree validation

**Acceptance Criteria:**
- [ ] All quality gates pass
- [ ] No lint or type errors
- [ ] FormulaTree marked with deprecation TODO

---

## Dependencies

| Blocked Task | Blocked By | Reason |
|-------------|------------|--------|
| Task 1.3 (Create workspace routes file) | Task 1.1 (Add shared workspace types) | Routes need shared types for request/response contracts |
| Task 1.3 (Create workspace routes file) | Task 1.2 (Add workspace root management to config.ts) | Routes call setWorkspaceRoot/getWorkspaceRoot |
| Task 1.4 (Register workspace routes) | Task 1.3 (Create workspace routes file) | Can only register routes after they exist |
| Task 1.5 (Write backend unit tests) | Task 1.3 (Create workspace routes file) | Tests need routes to test |
| Task 2.4 (Create useTree hook) | Task 1.1 (Add shared workspace types) | Hook needs TreeResponse/TreeError types from shared package |
| Task 2.4 (Create useTree hook) | Task 1.4 (Register workspace routes) | Hook calls /api/tree endpoint |
| Task 2.5 (Add startup workspace sync) | Task 2.3 (Create useWorkspaceConfig hook) | Sync uses the config hook |
| Task 3.1 (Create DirectoryBrowser component) | Task 1.4 (Register workspace routes) | Component calls /api/browse endpoint |
| Task 3.2 (Create WelcomePanel component) | Task 3.1 (Create DirectoryBrowser component) | WelcomePanel uses DirectoryBrowser modal |
| Task 3.2 (Create WelcomePanel component) | Task 2.3 (Create useWorkspaceConfig hook) | WelcomePanel reads/writes workspace config |
| Task 3.3 (Create NewProjectModal component) | Task 1.4 (Register workspace routes) | Modal calls /api/workspace/init endpoint |
| Task 3.4 (Update index.tsx for conditional welcome screen) | Task 3.2 (Create WelcomePanel component) | index.tsx renders WelcomePanel |
| Task 4.1 (Create WorkspaceTree component) | Task 2.1 (Verify FormulaDirtyProvider presence) | Tree uses useFormulaDirty hook |
| Task 4.1 (Create WorkspaceTree component) | Task 2.2 (Install @tanstack/react-virtual) | Tree uses virtualization |
| Task 4.1 (Create WorkspaceTree component) | Task 2.3 (Create useWorkspaceConfig hook) | Tree uses config for expand state |
| Task 4.1 (Create WorkspaceTree component) | Task 2.4 (Create useTree hook) | Tree uses the data fetching hook |
| Task 4.2 (Implement dirty state propagation) | Task 4.1 (Create WorkspaceTree component) | Adds to existing component |
| Task 4.3 (Implement formula navigation) | Task 4.1 (Create WorkspaceTree component) | Adds to existing component |
| Task 4.4 (Implement keyboard navigation) | Task 4.1 (Create WorkspaceTree component) | Adds to existing component |
| Task 4.5 (Wire WorkspaceTree into sidebar) | Task 4.1 (Create WorkspaceTree component) | Needs component to wire |
| Task 4.5 (Wire WorkspaceTree into sidebar) | Task 4.2 (Implement dirty state propagation) | Dirty state must work before integration |
| Task 4.5 (Wire WorkspaceTree into sidebar) | Task 4.3 (Implement formula navigation) | Navigation must work before integration |
| Task 4.5 (Wire WorkspaceTree into sidebar) | Task 4.4 (Implement keyboard navigation) | Keyboard nav must work before integration |
| Task 5.1 (Create WorkspaceHeader component) | Task 4.5 (Wire WorkspaceTree into sidebar) | Header accompanies tree in sidebar |
| Task 5.2 (Implement search filter) | Task 5.1 (Create WorkspaceHeader component) | Filter input is in header |
| Task 5.3 (Implement Change Folder flow) | Task 3.1 (Create DirectoryBrowser component) | Change folder opens directory browser |
| Task 5.3 (Implement Change Folder flow) | Task 5.1 (Create WorkspaceHeader component) | Change folder button is in header |
| Task 6.1 (Add workspace actions to command palette) | Task 3.4 (Update index.tsx for conditional welcome screen) | Actions rely on welcome flow working |
| Task 6.1 (Add workspace actions to command palette) | Task 5.3 (Implement Change Folder flow) | Change folder action needs handler |
| Task 6.2 (Implement recent path validation) | Task 3.2 (Create WelcomePanel component) | Validation is part of WelcomePanel |
| Task 6.3 (Refresh useFormulas after workspace change) | Task 3.4 (Update index.tsx for conditional welcome screen) | Refresh happens after workspace open |
| Task 6.3 (Refresh useFormulas after workspace change) | Task 4.5 (Wire WorkspaceTree into sidebar) | Needs tree integration complete |
| Task 7.1 (Write Playwright E2E tests) | Task 6.1 (Add workspace actions to command palette) | Tests cover all features |
| Task 7.1 (Write Playwright E2E tests) | Task 6.2 (Implement recent path validation) | Tests cover all features |
| Task 7.1 (Write Playwright E2E tests) | Task 6.3 (Refresh useFormulas after workspace change) | Tests cover all features |
| Task 7.2 (Performance assertion) | Task 7.1 (Write Playwright E2E tests) | Performance test is part of E2E suite |
| Task 7.3 (Final cleanup and validation) | Task 7.1 (Write Playwright E2E tests) | Cleanup after all tests written |
| Task 7.3 (Final cleanup and validation) | Task 7.2 (Performance assertion) | Cleanup after perf validated |

**Reading this table:** each row means the "Blocked Task" cannot start until "Blocked By" completes. This matches `bd dep add` argument order: `bd dep add <blocked-task-id> <blocked-by-id>`.

## Coverage Matrix

| Plan Task | Bead Title | Sub-Epic |
|-----------|------------|----------|
| 1.1 Add shared workspace types | Add shared workspace types | Phase 1: Backend Foundation |
| 1.2 Add workspace root management to config.ts | Add workspace root management to config.ts | Phase 1: Backend Foundation |
| 1.3 Create workspace routes file | Create workspace routes file | Phase 1: Backend Foundation |
| 1.4 Register workspace routes | Register workspace routes | Phase 1: Backend Foundation |
| 1.5 Write backend unit tests | Write backend unit tests | Phase 1: Backend Foundation |
| 2.1 Verify FormulaDirtyProvider presence | Verify FormulaDirtyProvider presence | Phase 2: Frontend State Layer |
| 2.2 Install @tanstack/react-virtual | Install @tanstack/react-virtual | Phase 2: Frontend State Layer |
| 2.3 Create useWorkspaceConfig hook | Create useWorkspaceConfig hook | Phase 2: Frontend State Layer |
| 2.4 Create useTree hook | Create useTree hook | Phase 2: Frontend State Layer |
| 2.5 Add startup workspace sync | Add startup workspace sync | Phase 2: Frontend State Layer |
| 3.1 Create DirectoryBrowser component | Create DirectoryBrowser component | Phase 3: Welcome Panel & Onboarding Flow |
| 3.2 Create WelcomePanel component | Create WelcomePanel component | Phase 3: Welcome Panel & Onboarding Flow |
| 3.3 Create NewProjectModal component | Create NewProjectModal component | Phase 3: Welcome Panel & Onboarding Flow |
| 3.4 Update index.tsx for conditional welcome screen | Update index.tsx for conditional welcome screen | Phase 3: Welcome Panel & Onboarding Flow |
| 4.1 Create WorkspaceTree component | Create WorkspaceTree component | Phase 4: WorkspaceTree Component |
| 4.2 Implement dirty state propagation | Implement dirty state propagation | Phase 4: WorkspaceTree Component |
| 4.3 Implement formula navigation | Implement formula navigation | Phase 4: WorkspaceTree Component |
| 4.4 Implement keyboard navigation | Implement keyboard navigation | Phase 4: WorkspaceTree Component |
| 4.5 Wire WorkspaceTree into sidebar | Wire WorkspaceTree into sidebar | Phase 4: WorkspaceTree Component |
| 5.1 Create WorkspaceHeader component | Create WorkspaceHeader component | Phase 5: Sidebar Header & Search |
| 5.2 Implement search filter | Implement search filter | Phase 5: Sidebar Header & Search |
| 5.3 Implement Change Folder flow | Implement Change Folder flow | Phase 5: Sidebar Header & Search |
| 5.4 Update sidebar collapse toggle | Update sidebar collapse toggle | Phase 5: Sidebar Header & Search |
| 5.5 Add document.title management | Add document.title management | Phase 5: Sidebar Header & Search |
| 6.1 Add workspace actions to command palette | Add workspace actions to command palette | Phase 6: Command Palette & Polish |
| 6.2 Implement recent path validation | Implement recent path validation | Phase 6: Command Palette & Polish |
| 6.3 Refresh useFormulas after workspace change | Refresh useFormulas after workspace change | Phase 6: Command Palette & Polish |
| 7.1 Write Playwright E2E tests | Write Playwright E2E tests | Phase 7: Testing & Validation |
| 7.2 Performance assertion | Performance assertion | Phase 7: Testing & Validation |
| 7.3 Final cleanup and validation | Final cleanup and validation | Phase 7: Testing & Validation |

**Plan tasks:** 30
**Beads mapped:** 30
**Coverage:** 100%

## Summary

- Feature epic: 1
- Sub-epics (phases): 7
- Issues (tasks): 30
- Blocker dependencies: 37
- Items ready immediately (no blockers): 7 (Tasks 1.1, 1.2, 2.1, 2.2, 2.3, 5.4, 5.5)
