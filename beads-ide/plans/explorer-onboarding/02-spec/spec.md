# Spec: Explorer Onboarding

**Feature:** explorer-onboarding
**Status:** Draft
**Date:** 2026-02-24

---

## 1. Overview

This feature adds VS Code-style project onboarding and a proper file-tree explorer to Beads IDE.

Currently, the sidebar lists formulas by search-path group (Gas Town, User, Project). There is no way to set a workspace root from the UI, and users must rely on the backend's `process.cwd()` heuristic to discover formulas. The landing page offers no guidance when no formulas are found.

After this feature:

- First-time users (or users with no root configured) see an onboarding welcome screen with "New Project" and "Open Folder" actions.
- Choosing "Open Folder" sends the selected path to the backend, which restarts with that path as the new project root and derives search paths from it.
- The sidebar replaces the flat search-path groups with a directory-first file tree showing all `.formula.toml` files under the root.
- A "Change Folder" button in the sidebar header lets users switch roots at any time.
- "Open Recent" lists the 5 most recently used roots on the welcome screen.
- The tree is virtualized to support workspaces with 200-1000 formula files.
- Sidebar search filters the tree in real time.
- "New Project" scaffolds a minimal workspace structure (`.beads/` + `formulas/` directories) and opens it.

The feature targets Chrome and Edge only (requires the File System Access API for picking directories).

---

## 2. User Stories

### US-1: First launch — Open Folder

> As a developer starting Beads IDE for the first time, I want to point it at my project directory so that it discovers my formulas automatically.

**Acceptance criteria:**
- The `/` route shows a welcome screen (not the formula editor) when no root is configured in localStorage.
- The welcome screen has an "Open Folder" primary button and a "New Project" secondary button.
- Clicking "Open Folder" opens the OS directory picker (File System Access API `showDirectoryPicker`).
- After the user selects a folder, the backend restarts with that path as the new project root.
- The sidebar replaces the welcome screen with the directory tree for the selected root.
- The selected path is saved to `localStorage` under `workspaceConfig`.
- "Open Folder" and "New Project" are also accessible from the command palette (Cmd+K).

### US-2: First launch — New Project

> As a developer starting a new project, I want to create a fresh workspace with the correct structure so that Beads IDE recognizes it immediately.

**Acceptance criteria:**
- Clicking "New Project" opens the OS directory picker.
- After the user selects a folder, the frontend calls `POST /api/workspace/init` with the chosen path.
- The backend creates `.beads/` and `formulas/` subdirectories at that path.
- A template picker modal appears, letting the user choose "Blank formula" (MVP: only option).
- If the user selects a template, the backend creates the template file in `formulas/`.
- The backend restarts with the new path as project root.
- The sidebar shows the new (nearly empty) tree with an `EmptyState` component prompting the user to add `.formula.toml` files.

### US-3: Browse and select a formula

> As a developer with a project open, I want to navigate my formula files in the sidebar tree so that I can select one to edit.

**Acceptance criteria:**
- The sidebar shows a directory-first tree: directories as collapsible nodes, `.formula.toml` files as leaf nodes.
- Directories without any `.formula.toml` descendants are not shown.
- Clicking a formula leaf navigates to `/formula/:name`.
- Keyboard navigation: arrow keys move focus, Enter/Space open the selected formula, matching the existing pattern.
- Expand/collapse state for directories is persisted to localStorage per root.
- A formula leaf that has unsaved changes shows an amber dirty indicator dot.
- Parent directories propagate the dirty indicator upward if any descendant formula is dirty.
- A search/filter input pinned at the top of the sidebar filters visible files as the user types.

### US-4: Switch folders

> As a developer who works across multiple projects, I want to change the active workspace folder so that I see a different project's formulas.

**Acceptance criteria:**
- A "Change Folder" button is always visible in the sidebar header.
- Clicking it opens the OS directory picker.
- If a formula is currently open with unsaved changes, the `UnsavedChangesModal` fires before switching.
- After confirmation, the backend restarts with the new path.
- The current route resets to `/` (the tree clears and the new tree loads).
- The new root is prepended to the "Open Recent" list (capped at 5 entries).

### US-5: Open Recent

> As a developer who returns to the same projects regularly, I want to re-open a recent folder with one click from the welcome screen.

**Acceptance criteria:**
- The welcome screen shows up to 5 recent root paths below the primary actions.
- Clicking a recent path triggers the same backend-restart flow as "Open Folder" without a picker dialog.
- Paths that no longer exist on disk are shown with a warning icon and are not clickable.
- Recent paths are stored in `localStorage.workspaceConfig.recentRoots` as an ordered array (most recent first).

### US-6: Large workspace performance

> As a developer with a large project (200-1000 formula files), I want the tree to load and scroll without jank.

**Acceptance criteria:**
- The tree is virtualized using `@tanstack/react-virtual` (or equivalent).
- The tree renders within 500ms for a fixture of 100 formula files (measured by Playwright).
- The backend enforces a hard node limit of 500 tree nodes; if exceeded, a warning banner appears in the sidebar with a count.
- The sidebar search filter is debounced at 150ms.

---

## 3. UI/UX Design

### 3.1 Welcome Screen

The welcome screen is a **conditional state of the `/` route** (`routes/index.tsx`), not a separate route. When `localStorage.workspaceConfig.rootPath` is absent or null, the route renders the welcome state instead of the standard landing page.

**Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│           Beads IDE                     │  ← title, brand color #38bdf8
│                                         │
│    Open a folder to get started.        │  ← subtitle
│                                         │
│  [ Open Folder ]  [ New Project ]       │  ← primary and secondary buttons
│                                         │
│  Recent                                 │  ← shown only if recentRoots non-empty
│  › ~/projects/my-project                │
│  › ~/projects/other-project             │
│  › /data/work/workspace                 │
│                                         │
└─────────────────────────────────────────┘
```

- Background: `#0f172a` (matches app shell)
- Title: `#38bdf8`, 24px
- Subtitle: `#cbd5e1`, 14px
- "Open Folder": filled button, `#38bdf8` background, `#0f172a` text
- "New Project": outlined button, `#38bdf8` border and text
- Recent items: list with folder icon, path displayed as `~/relative/path` (tilde-abbreviated). Items are 36px tall with 8px left padding. Hover: `#2a2d2e`. Missing paths: `#ef4444` warning icon, cursor not-allowed.
- No "Recent" heading shown if `recentRoots` is empty.

### 3.2 Sidebar Header

The sidebar header area changes to show the active workspace root.

**Layout when a root is active:**

```
┌──────────────────────────────────────┐
│ EXPLORER                [⟳] [folder] │  ← title + refresh + change-folder icons
│ ──────────────────────────────────── │
│ my-project              ▸ Change     │  ← basename of root + change link
│ ──────────────────────────────────── │
│ [ 🔍 Filter formulas... ]            │  ← search input
└──────────────────────────────────────┘
```

- "EXPLORER" text: uppercase, `#bbbbbb`, 11px (matches VS Code convention)
- Root basename: `#e2e8f0`, 12px, with full path in `title` attribute for tooltip
- Refresh icon (⟳): `#888`, 14px, triggers `GET /api/tree` refresh. Shows last-updated timestamp in tooltip.
- Change Folder icon (folder-open): `#888`, 14px. Clicking opens the picker flow.
- Search input: `#1e293b` background, `#cccccc` text, 12px, `#38bdf8` focus ring. Placeholder: "Filter formulas..."
- Sidebar collapse toggle is a chevron icon (`‹` / `›`), replacing the current text `<` / `>`.

### 3.3 Directory Tree

The new `WorkspaceTree` component replaces the sidebar's formula listing. It renders the tree returned by `GET /api/tree`.

**Tree item anatomy:**

```
  [▶] [folder-icon]  my-subdirectory         ← DirectoryNode (collapsed)
  [▼] [folder-open]  src                     ← DirectoryNode (expanded)
         [file-code] my-formula  ●            ← FormulaNode (● = dirty)
         [file-code] other-formula            ← FormulaNode (clean)
```

- Indentation: 16px per nesting level (padding-left only, no indent guides in MVP).
- Directory node: chevron (▶ collapsed, ▼ expanded) + folder icon + name. Click toggles expand.
- Formula node: file-code icon + name (without `.formula.toml` extension) + optional dirty dot.
- Dirty dot: `#fbbf24` (amber), 6px circle, positioned to the right of the name.
- Directory dirty indicator: same amber dot if any descendant formula is dirty.
- Selected formula: full-row highlight `#094771`, same as existing `itemActiveStyle`.
- Hover: `#2a2d2e`, same as existing `itemHoverStyle`.
- Focus (keyboard): 1px outline `#007acc`.
- Item height: 22px (same as existing formula tree items).

**Loading state:** `LoadingSkeleton` component shown while `GET /api/tree` is in flight. Three animated placeholder rows.

**Empty state:** `EmptyState` component shown when the tree returns zero `.formula.toml` files. Shows the root path and a hint: "Add `.formula.toml` files to `formulas/` or `.beads/formulas/` to see them here."

**Node limit warning:** If the backend returns `truncated: true`, a yellow banner appears above the tree: "Showing 500 of N files. Use the filter to narrow results."

### 3.4 New Project Template Picker

A modal that appears after the user selects a directory for "New Project".

```
┌─────────────────────────────────────────┐
│  New Project                        [X] │
│                                         │
│  Folder: ~/projects/my-new-project      │
│                                         │
│  Choose a template:                     │
│                                         │
│  ┌──────────────────┐                  │
│  │  Blank formula   │  ← selected      │
│  └──────────────────┘                  │
│                                         │
│                 [Cancel]  [Create]      │
└─────────────────────────────────────────┘
```

- Modal uses the existing modal pattern (`#1e293b` background, dark border).
- MVP ships with one template: "Blank formula" (creates `formulas/new-formula.formula.toml` with minimal TOML scaffold).
- "Create" calls `POST /api/workspace/init`, then triggers backend restart.
- If creation fails, inline error is shown below the template picker.

---

## 4. Technical Architecture

### 4.1 Workspace Config (localStorage)

A new `workspaceConfig` key in localStorage stores the persistent state:

```typescript
interface WorkspaceConfig {
  version: 1
  rootPath: string | null         // currently active root
  recentRoots: string[]           // up to 5, most recent first
  treeExpanded: Record<string, boolean>  // path -> expanded state per root
}
```

On first load, if the key is missing or `version` does not match, the config is cleared and the welcome screen is shown.

A new `useWorkspaceConfig` hook manages reads and writes to this structure.

### 4.2 Backend: Workspace State

The backend acquires a new mutable workspace root separate from `process.cwd()`. When the frontend calls `POST /api/workspace/open` or `POST /api/workspace/init`, the backend:

1. Validates the given path exists and is a directory.
2. Calls `clearConfigCache()` (already exists in `config.ts`).
3. Calls `loadConfig(newPath)` and caches the result.
4. Returns `{ ok: true }`.

The frontend then polls `GET /api/health` until the backend is responsive again (or with a short delay, since the backend does not restart the process—it hot-reloads the config cache). This is the **full restart** model in behavior but implemented as a config cache clear, which is safe because the backend is stateless beyond the cached config.

Note: The original decision was "full restart". After reviewing `config.ts`, the `clearConfigCache()` + `loadConfig(newPath)` approach achieves the same clean-state guarantee without killing the process. The process restart is not needed because all runtime state derives from the cached config. The frontend should still show a brief loading state (skeleton) after the switch.

### 4.3 Backend: Tree Endpoint

A new route file `apps/backend/src/routes/workspace.ts` handles workspace management. The `GET /api/tree` endpoint performs a recursive directory scan:

```typescript
interface TreeNode {
  name: string
  path: string           // full filesystem path
  type: 'directory' | 'formula'
  formulaName?: string   // for type=formula: name without extension
  children?: TreeNode[]  // for type=directory
}

interface TreeResponse {
  ok: true
  root: string
  nodes: TreeNode[]    // top-level children of root
  totalCount: number
  truncated: boolean   // true if node limit was hit
}
```

The scan logic:
- Walks the directory tree recursively using Node.js `fs.readdirSync` / `fs.statSync`.
- Includes a directory node only if it contains at least one `.formula.toml` descendant (prune empty branches).
- Includes only `.formula.toml` files as leaf nodes (ignores `.formula.json` for the tree; they are still accessible via `/api/formulas`).
- Stops adding nodes once 500 are accumulated; sets `truncated: true`.
- Uses `node:path` for all path operations (cross-platform safe).
- Response payload is sorted: directories before files at each level, then alphabetically within each group.

### 4.4 Frontend: New Components

**Component hierarchy:**

```
Sidebar (existing layout shell)
  WorkspaceHeader          ← new
    RootPathDisplay
    RefreshButton
    ChangeFolderButton
  SearchInput              ← new (pinned below header)
  WorkspaceTree            ← new (replaces FormulaTree output area)
    DirectoryNode          ← new (recursive)
      FormulaNode          ← new
    EmptyState             ← new
    NodeLimitBanner        ← new
  WelcomePanel             ← new (shown when no root)
    OpenFolderButton
    NewProjectButton
    RecentList
      RecentItem
  NewProjectModal          ← new (modal overlay)
    TemplatePicker
```

**File locations:**
- `apps/frontend/src/components/layout/workspace-tree.tsx` — `WorkspaceTree`, `DirectoryNode`, `FormulaNode`
- `apps/frontend/src/components/layout/workspace-header.tsx` — `WorkspaceHeader`
- `apps/frontend/src/components/layout/welcome-panel.tsx` — `WelcomePanel`, `RecentList`, `RecentItem`
- `apps/frontend/src/components/layout/new-project-modal.tsx` — `NewProjectModal`, `TemplatePicker`
- `apps/frontend/src/hooks/use-workspace-config.ts` — localStorage state management
- `apps/frontend/src/hooks/use-tree.ts` — data fetching for `GET /api/tree`

**Coexistence with FormulaTree:** `FormulaTree` is NOT deleted in this feature. The sidebar renders either `WorkspaceTree` (when a root is configured) or `WelcomePanel` (when not). `FormulaTree` remains mounted behind a feature flag or route condition and can be removed in a follow-up once `WorkspaceTree` is validated. Formula operations (cook, sling, pour) continue to use `useFormulas()` and the flat `/api/formulas` list—the tree is navigation only.

### 4.5 Virtualization

`WorkspaceTree` uses `@tanstack/react-virtual` for the item list. The tree is flattened into a `FlatTreeItem[]` array before rendering (common pattern for virtualized trees). Expand/collapse toggles update the flat list and re-render.

```typescript
interface FlatTreeItem {
  id: string           // unique key (use path)
  path: string
  name: string
  type: 'directory' | 'formula'
  formulaName?: string
  depth: number        // nesting level for indentation
  isExpanded?: boolean // for directory nodes
  isDirty?: boolean    // for formula nodes
}
```

### 4.6 Dirty State Propagation

The existing `useFormulaDirty()` context provides a `Set<string>` of dirty formula names. `WorkspaceTree` maps dirty formula names to paths using the `TreeNode` data, then walks ancestors to compute which directory nodes should also show the dirty indicator. This is computed on each render via a simple Set membership check—no additional state management needed.

### 4.7 Folder Picker Integration

The frontend uses the File System Access API:

```typescript
async function pickFolder(): Promise<string | null> {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' })
    return handle.name  // basename only from FSAA
  } catch {
    return null  // user cancelled
  }
}
```

**Important constraint:** `showDirectoryPicker` returns a `FileSystemDirectoryHandle`, not a full filesystem path. The handle's `.name` property is only the basename. To get the full path (required to send to the backend), the frontend requests the full path string from the user.

Two options:
1. **Input fallback** (MVP): After picker, show a text input pre-filled with the basename, asking the user to confirm or type the full path. This is safe and works in all browsers.
2. **path property** (Chrome 86+): Some browsers expose `handle.resolve()` for relative paths, but not a full absolute path.

**Decision:** Use a hybrid approach. Show the picker for discoverability. After pick, display a confirmation dialog with an editable path text field. Pre-fill with the basename. The user types or pastes the full path. The backend validates it. This avoids the security sandbox restrictions of the File System Access API while still providing a modern picker UX.

### 4.8 Navigation

Formula selection in `WorkspaceTree` uses the same navigation pattern as `FormulaTree`: `window.history.pushState` + `popstate` event dispatch to notify TanStack Router. This is a known workaround; a follow-up can refactor to `router.navigate()`.

### 4.9 Command Palette Integration

`POST /api/workspace/open` and the New Project flow are registered as command palette actions in `useDefaultActions` (in `__root.tsx`):

```
"Open Folder..."         → triggers pickFolder() flow
"New Project..."         → triggers newProject() flow
"Change Folder..."       → triggers pickFolder() flow (same as Open Folder when root is set)
```

---

## 5. API Design

### 5.1 GET /api/tree

Returns the formula file tree for the current workspace root.

**Request:** No body. Optional query param `?root=<path>` (reserved for future multi-root support; ignored in MVP—always uses active root).

**Response (success):**
```json
{
  "ok": true,
  "root": "/home/user/projects/my-project",
  "nodes": [
    {
      "name": "formulas",
      "path": "/home/user/projects/my-project/formulas",
      "type": "directory",
      "children": [
        {
          "name": "deploy-pipeline.formula.toml",
          "path": "/home/user/projects/my-project/formulas/deploy-pipeline.formula.toml",
          "type": "formula",
          "formulaName": "deploy-pipeline"
        }
      ]
    }
  ],
  "totalCount": 1,
  "truncated": false
}
```

**Response (error):**
```json
{
  "ok": false,
  "error": "Root path not configured",
  "code": "NO_ROOT"
}
```

**Error codes:** `NO_ROOT`, `NOT_FOUND`, `READ_ERROR`

**Performance:** Must respond within 500ms for workspaces with up to 200 formula files. Measured in dev with `performance.now()` log.

---

### 5.2 POST /api/workspace/open

Sets a new active workspace root and reloads the backend configuration.

**Request body:**
```json
{
  "path": "/home/user/projects/my-project"
}
```

**Response (success):**
```json
{
  "ok": true,
  "root": "/home/user/projects/my-project",
  "formulaCount": 12
}
```

**Response (error):**
```json
{
  "ok": false,
  "error": "Path does not exist: /home/user/bad-path",
  "code": "NOT_FOUND"
}
```

**Error codes:** `NOT_FOUND`, `NOT_DIRECTORY`, `PERMISSION_DENIED`

**Side effects:** Clears `cachedConfig`, loads new config via `loadConfig(path)`, caches it. Subsequent calls to `getConfig()` use the new root.

---

### 5.3 POST /api/workspace/init

Scaffolds a new workspace at the given path and sets it as the active root.

**Request body:**
```json
{
  "path": "/home/user/projects/my-new-project",
  "template": "blank"
}
```

`template` is optional; defaults to `"blank"`. MVP supports only `"blank"`.

**Response (success):**
```json
{
  "ok": true,
  "root": "/home/user/projects/my-new-project",
  "created": [
    "/home/user/projects/my-new-project/.beads",
    "/home/user/projects/my-new-project/formulas",
    "/home/user/projects/my-new-project/formulas/new-formula.formula.toml"
  ]
}
```

**Response (error):**
```json
{
  "ok": false,
  "error": "Directory already contains a .beads folder",
  "code": "ALREADY_INITIALIZED"
}
```

**Error codes:** `NOT_FOUND`, `NOT_DIRECTORY`, `ALREADY_INITIALIZED`, `WRITE_ERROR`

**Side effects:** Creates `.beads/` and `formulas/` directories, writes template file, then calls `POST /api/workspace/open` logic to set as active root.

---

### 5.4 GET /api/workspace

Returns the current workspace state.

**Response:**
```json
{
  "ok": true,
  "root": "/home/user/projects/my-project",
  "formulaCount": 12,
  "searchPaths": [
    "/home/user/projects/my-project/formulas",
    "/home/user/.beads/formulas"
  ]
}
```

Used by the frontend on startup to sync the localStorage config with the actual backend state (in case the backend was restarted pointing at a different directory).

---

### 5.5 Shared Types

New types added to `packages/shared/src/ide-types.ts`:

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

---

## 6. Implementation Plan

### Phase 1: Backend Foundation

Build all new backend endpoints and types before touching the frontend. This lets the frontend work against a real API from day one.

**Tasks:**
1. Add `TreeNode`, `TreeResponse`, `WorkspaceOpenRequest/Response`, `WorkspaceInitRequest/Response`, `WorkspaceStateResponse`, `WorkspaceError` types to `packages/shared/src/ide-types.ts`.
2. Add a `workspaceRoot` module-level variable to `apps/backend/src/config.ts` that overrides `process.cwd()` when set. Add `setWorkspaceRoot(path)` and `getWorkspaceRoot()` functions.
3. Create `apps/backend/src/routes/workspace.ts` with:
   - `GET /api/workspace` — returns current state
   - `POST /api/workspace/open` — sets root, clears config cache
   - `POST /api/workspace/init` — scaffolds workspace, then calls open logic
   - `GET /api/tree` — recursive scan returning `TreeResponse`
4. Register the new routes in `apps/backend/src/index.ts`.
5. Write Vitest unit tests for the tree scanner (fixture directory with nested `.formula.toml` files).

**Exit criteria:** All four endpoints return correct responses when called with `curl`. Unit tests pass.

---

### Phase 2: localStorage and Config Hook

Wire up the frontend config layer before building any UI.

**Tasks:**
1. Create `apps/frontend/src/hooks/use-workspace-config.ts`. Implements `WorkspaceConfig` read/write with version guard.
2. Create `apps/frontend/src/hooks/use-tree.ts`. Fetches `GET /api/tree`, handles loading/error states, returns `TreeNode[]`.
3. On app startup (`__root.tsx` or a new `useWorkspaceSync` effect): call `GET /api/workspace` and reconcile with localStorage. If backend root differs from localStorage root, update localStorage to match.

**Exit criteria:** `useWorkspaceConfig` reads/writes correctly. `useTree` returns data from the live backend. `workspaceConfig.rootPath` is set after calling `POST /api/workspace/open` from a test harness.

---

### Phase 3: Welcome Panel and Onboarding Flow

Build the welcome screen and the folder-picking flow end-to-end.

**Tasks:**
1. Create `apps/frontend/src/components/layout/welcome-panel.tsx` with `WelcomePanel`, `RecentList`, `RecentItem`.
2. Create `apps/frontend/src/components/layout/new-project-modal.tsx` with `NewProjectModal`, `TemplatePicker`.
3. Implement the folder picker flow (hybrid: `showDirectoryPicker` + path confirmation input).
4. Update `apps/frontend/src/routes/index.tsx` to conditionally render `WelcomePanel` when `rootPath` is null.
5. Register "Open Folder" and "New Project" as command palette actions in `useDefaultActions`.

**Exit criteria:** A user can complete the full onboarding flow: open welcome screen → pick folder → see loading state → see tree (or empty state). "Open Folder" works from the command palette.

---

### Phase 4: WorkspaceTree Component

Build the directory tree, replacing the formula listing in the sidebar.

**Tasks:**
1. Create `apps/frontend/src/components/layout/workspace-tree.tsx`. Implement `WorkspaceTree`, `DirectoryNode`, `FormulaNode`, `EmptyState`, `NodeLimitBanner`.
2. Implement the flat-list virtualization with `@tanstack/react-virtual`. Wire expand/collapse to localStorage.
3. Implement dirty state propagation from `useFormulaDirty()` to directory nodes.
4. Implement formula navigation (pushState + popstate pattern, matching existing `FormulaTree`).
5. Wire `WorkspaceTree` into the sidebar: show it when `rootPath` is set, show `WelcomePanel` otherwise. `FormulaTree` remains mounted but hidden (or removed from render).
6. Keyboard navigation: arrow keys, Enter, Space.

**Exit criteria:** The tree renders correctly for a real workspace. Selecting a formula navigates to the editor. Dirty indicator appears correctly. Keyboard navigation works. Expand/collapse state persists across page reloads.

---

### Phase 5: Sidebar Header and Search

Polish the sidebar header and add the filter input.

**Tasks:**
1. Create `apps/frontend/src/components/layout/workspace-header.tsx`.
2. Implement search/filter input. Debounce at 150ms. Filter the flat-list by matching formula name substrings.
3. Implement "Change Folder" button with `UnsavedChangesModal` guard.
4. Implement refresh button with last-updated timestamp tooltip.
5. Implement chevron collapse toggle (replace `<` / `>` text).
6. Show root basename in header with full path in `title` attribute.

**Exit criteria:** Filter narrows the tree. Change Folder works. Refresh re-fetches the tree. Collapse toggle works with the chevron.

---

### Phase 6: Open Recent

Add the recent roots list to the welcome screen and the sidebar.

**Tasks:**
1. Add `recentRoots` management to `useWorkspaceConfig`: prepend on open, cap at 5, deduplicate.
2. Render `RecentList` in `WelcomePanel` if `recentRoots` is non-empty.
3. Validate each recent path against `GET /api/workspace` (or a lightweight `HEAD`-style check) and show warning icon for missing paths.

**Exit criteria:** Open recent paths work. Missing paths are visually marked. List caps at 5.

---

### Phase 7: Validation and Cleanup

**Tasks:**
1. Write Playwright e2e tests: full onboarding flow, folder switch with dirty guard, search filter, open recent.
2. Assert tree renders within 500ms for a 100-formula fixture.
3. Remove or formally deprecate `FormulaTree` (or leave a TODO comment marking it for removal once `WorkspaceTree` is stable).
4. Check Biome linting passes across all new files.
5. TypeScript type-check passes across the monorepo (`tsc --noEmit`).

**Exit criteria:** All Playwright tests pass. Performance assertion passes. No lint or type errors.

---

## 7. Out of Scope

The following items are explicitly not included in this feature:

- **Light mode / theme switching.** The app is dark-only. No light mode support is added.
- **i18n and RTL.** All text is English. Left-to-right layout only.
- **Tablet and mobile layout.** The three-panel layout targets desktop (1200px+) only.
- **Real-time file watching.** The tree does not auto-update when files change on disk. The user must click the refresh button.
- **Tabs / multi-formula editing.** No tab system. Switching formulas replaces the editor content.
- **Multi-root workspaces.** Only one active root at a time. The `?root=` query param in `GET /api/tree` is reserved but not implemented.
- **Indent guides (tree lines).** Padding-only indentation. Vertical indent lines are a follow-up.
- **Left-edge accent bar on selected formula.** Full-row highlight (`#094771`) is kept as-is.
- **Formula metadata in tree.** Only formula name and dirty indicator. No last-modified, step count, or error state in the tree items.
- **Predictive preloading.** No pre-fetching tree data for recent roots.
- **Feature flags / gradual rollout.** The new tree ships to all users at once.
- **Documentation updates.** No README or help pages updated as part of this feature.
- **Lazy tree loading.** The full tree is fetched in one request. Lazy child-loading is not implemented.
- **Drag-and-drop formula reordering.** The tree is read-only for navigation; no drag-and-drop.
- **Formula creation from tree context menu.** New formulas are created from the formula editor, not the tree.
- **`.formula.json` files in the tree.** The tree shows only `.formula.toml`. `.formula.json` files are still accessible via `/api/formulas` and existing `FormulaTree`.
- **Browser compatibility beyond Chrome/Edge.** Safari and Firefox do not support `showDirectoryPicker`. The app works in those browsers, but the folder-picker button falls back to a plain text input for the path.

---

## 8. Open Questions

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 1 | What is the blank formula template content? | Unresolved | Needs a minimal valid `.formula.toml` example. Should have at least `name`, `version`, and one empty step. |
| 2 | Should the backend workspace root survive a server restart (persisted to disk)? | Unresolved | Currently, setting the root via `POST /api/workspace/open` only survives until the server process restarts. If the backend is restarted (e.g., for a code change), it reverts to `process.cwd()`. Options: (A) write root to a `.beads-ide-state.json` file on disk; (B) accept the limitation and let the frontend re-open on next load; (C) use an environment variable or CLI flag. MVP can accept option B since the frontend re-syncs from localStorage on startup. |
| 3 | How does the backend get an absolute path when `showDirectoryPicker` only returns a basename? | Partially resolved | The hybrid approach (picker + text input for full path) is specified, but the UX could be surprising. An alternative is to skip the picker entirely and just show a text field for the path. The picker is used for UX discovery, not for the actual path. Confirm whether the picker is worth the added complexity. |
| 4 | What happens when the user opens a folder that has no `.beads/` directory? | Unresolved | The backend's `resolveProjectRoot` walks up to find `.beads/`. If the chosen folder has no `.beads/` anywhere in its ancestry, `getFormulaSearchPaths` will look in `formulas/` relative to the chosen folder directly. The tree endpoint should still work (scanning from the chosen root), but the formula-write flow may fail if there is no recognized search path. Needs a defined behavior: auto-create `.beads/`? Show a warning? Block the open? |
| 5 | Should the tree search filter also search inside formula TOML content (full-text), or only by filename? | Unresolved | Filename-only is the MVP assumption, but users may expect content search. Confirm scope. |
| 6 | Is `@tanstack/react-virtual` already in the dependency tree, or is it a new dependency to add? | Unresolved | Needs a check of `apps/frontend/package.json`. If not present, requires `pnpm add`. |
| 7 | Should "Open Folder" in the command palette be shown only when no root is configured, or always? | Unresolved | Showing it always is simpler. Showing it conditionally requires the command palette to read `workspaceConfig`. Recommend always showing it; when a root is already set it acts as "Change Folder". |
| 8 | What is the exact minimal TOML for the blank template? | Unresolved | Needs agreement with the formula schema. Candidate: `name = "new-formula"\nversion = 1\n\n[[steps]]\nid = "step-1"\ntitle = "First step"\ndescription = ""`. |

---

## Spec Review Clarifications

*Added after completeness assessment*

### Q63 Resolution: Search Path Visibility
**Decision:** Folder-only. When a folder is opened via "Open Folder", the sidebar shows ONLY formulas from that folder. Gas Town and User formula sections are hidden entirely. This simplifies the UX and removes the confusing multi-source grouping for new users.

**Implementation:** `WorkspaceTree` replaces `FormulaTree` entirely when a root is set. No coexistence.

### Backend Restart Behavior
**Decision:** Show welcome screen. If the backend restarts and loses the configured root, treat as a fresh start. The frontend should:
1. Detect mismatch between localStorage root and backend state
2. Clear localStorage `workspaceConfig`
3. Show welcome screen for user to re-select folder

### Additional Gap Fixes

1. **Browser `<title>`:** Update to `[formula name] - Beads IDE` when editing, `Beads IDE` otherwise.

2. **`treeExpanded` scoping:** Change to `Record<rootPath, Record<dirPath, boolean>>` to scope expand state per workspace root.

3. **Error UI for tree:** Add `TreeErrorState` component showing error message + "Retry" button when `GET /api/tree` fails.

4. **`useFormulas()` refresh:** Add `invalidateFormulas()` call after successful `POST /api/workspace/open` to force re-fetch.

5. **Async FS calls:** Change `readdirSync`/`statSync` to async `fs.promises.readdir`/`fs.promises.stat` in tree scan.
