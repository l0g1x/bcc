# Opus 4.6 Spec Review: explorer-onboarding

## Summary

This is a well-structured spec with detailed UI wireframes, clear API contracts, and a phased implementation plan. The core architecture (config cache clear + hot-reload rather than process restart) is sound and well-matched to the existing codebase. However, there are several issues: the File System Access API approach is fundamentally broken for this use case (cannot get full paths from the browser sandbox), the `useFormulaDirty` context does not expose a `Set<string>` as the spec claims, `loadConfig()` does not accept an arbitrary path override for the workspace root, and `@tanstack/react-virtual` is not in the dependency tree. The spec also has 8 unresolved open questions, at least 3 of which (Q1, Q4, Q8) would block implementation.

## Verified Claims

### Correct: `clearConfigCache()` exists in `config.ts`
The spec states the backend can use `clearConfigCache()` to reset state. Verified at `/apps/backend/src/config.ts` line 136:
```typescript
export function clearConfigCache(): void {
  cachedConfig = null
}
```

### Correct: `loadConfig()` exists and accepts a `cwd` parameter
At `/apps/backend/src/config.ts` line 107:
```typescript
export function loadConfig(cwd: string = process.cwd()): BeadsConfig {
```
However, see issue below regarding how this actually works.

### Correct: `useFormulaDirty()` context exists and provides `isDirty` / `setDirty`
At `/apps/frontend/src/contexts/formula-dirty-context.tsx` lines 9-12:
```typescript
interface FormulaDirtyContextValue {
  isDirty: (name: string) => boolean
  setDirty: (name: string, dirty: boolean) => void
}
```

### Correct: FormulaTree uses `pushState` + `popstate` for navigation
At `/apps/frontend/src/components/layout/formula-tree.tsx` lines 412-414:
```typescript
window.history.pushState({}, '', `/formula/${encodeURIComponent(name)}`)
window.dispatchEvent(new PopStateEvent('popstate'))
```

### Correct: Sidebar collapse toggle uses `<` / `>` text
At `/apps/frontend/src/components/layout/sidebar.tsx` line 72:
```typescript
{collapsed ? '>' : '<'}
```
The spec correctly identifies this as a target for replacement with chevron icons.

### Correct: `UnsavedChangesModal` exists with the three-action pattern
Verified at `/apps/frontend/src/components/ui/unsaved-changes-modal.tsx` with `onSave`, `onDiscard`, `onCancel` props (lines 9-28).

### Correct: Backend routes are registered in `index.ts` with `app.route('/api', ...)`
Verified at `/apps/backend/src/index.ts` lines 21-27. New workspace routes would follow this pattern.

### Correct: `useDefaultActions` exists in command-palette.tsx
Verified at `/apps/frontend/src/components/layout/command-palette.tsx` line 428. It accepts handler callbacks and returns `CommandAction[]`. The spec's plan to register "Open Folder" and "New Project" here is feasible.

### Correct: Landing page is at `routes/index.tsx`
Verified at `/apps/frontend/src/routes/index.tsx`. It renders a simple centered greeting. The spec's plan to conditionally render a WelcomePanel here is feasible.

### Correct: `FormulaDirtyProvider` is mounted at the app root level
Verified at `/apps/frontend/src/main.tsx` line 24 (via grep). It wraps the entire app.

### Correct: Backend uses Hono framework
Verified at `/apps/backend/src/index.ts` line 12: `const app = new Hono()`.

### Correct: No `@tanstack/react-virtual` in dependencies
Verified by reading `/apps/frontend/package.json`. The dependency is not present. Open question Q6 correctly flags this.

### Correct: File naming conventions
The spec proposes files like `workspace-tree.tsx`, `workspace-header.tsx`, `use-workspace-config.ts`, `use-tree.ts`. These match the existing codebase conventions: component files use kebab-case (e.g., `formula-tree.tsx`, `app-shell.tsx`), hooks use `use-` prefix (e.g., `use-formulas.ts`, `use-cook.ts`).

### Correct: Shared types live in `packages/shared/src/ide-types.ts`
Verified at `/packages/shared/src/ide-types.ts`. The file already contains 479 lines of type definitions for formulas, cook, sling, pour, etc. Adding workspace types here is the right location.

### Correct: Style patterns match existing code
The spec references colors `#094771` for active selection, `#2a2d2e` for hover, `#fbbf24` for dirty dot, `#1e293b` for dark backgrounds. All verified in `formula-tree.tsx` (lines 69-72 for `itemActiveStyle`, line 64 for hover, line 85 for dirty dot).

## Issues Found

### Critical (blocks implementation)

1. **File System Access API cannot provide full filesystem paths to the backend.**
   The spec acknowledges this in Section 4.7 and Open Question Q3, but the proposed "hybrid approach" (picker + text input) undermines the entire UX promise of the feature. The `showDirectoryPicker` API returns a `FileSystemDirectoryHandle` whose `.name` is only the basename (e.g., `"my-project"`, not `/home/user/projects/my-project`). The spec proposes showing a text field asking the user to type the full path after picking. This is a poor UX that would confuse users -- if they have to type a path anyway, the picker adds no value. **Recommendation:** Since this is a local-first tool with a co-located backend (localhost:3001), consider an alternative approach: add a `GET /api/workspace/browse?start=/home/user` backend endpoint that returns directory listings, and build a custom directory browser in the frontend. This avoids browser sandbox restrictions entirely. Alternatively, accept the text-input-only approach and drop the `showDirectoryPicker` dependency, which also resolves the Chrome/Edge-only limitation.

2. **`loadConfig()` does not set a persistent workspace root -- it derives from `resolveProjectRoot()`.**
   The spec says (Section 4.2): "Calls `loadConfig(newPath)` and caches the result." While `loadConfig(cwd)` does accept a path parameter, `getConfig()` at line 126-131 always calls `loadConfig()` with NO argument (defaults to `process.cwd()`):
   ```typescript
   export function getConfig(): BeadsConfig {
     if (!cachedConfig) {
       cachedConfig = loadConfig()
     }
     return cachedConfig
   }
   ```
   So after `clearConfigCache()`, the next `getConfig()` call will reload from `process.cwd()`, NOT from the path the frontend sent. The spec's implementation plan (Phase 1, task 2) correctly identifies that a `workspaceRoot` module-level variable and `setWorkspaceRoot()` / `getWorkspaceRoot()` functions need to be added, but this is a design gap -- the `clearConfigCache()` + `loadConfig(newPath)` approach described in Section 4.2 will NOT work as written. `getConfig()` must be modified to use the stored workspace root.

3. **Three unresolved open questions block implementation.**
   - **Q1 / Q8 (blank formula template content):** The `POST /api/workspace/init` endpoint needs to write a template file, but the TOML content is undefined. Cannot implement Phase 1 task 3 without this.
   - **Q4 (folder without `.beads/` directory):** `resolveProjectRoot()` walks UP the directory tree looking for `.beads/`. If the user opens `/home/user/projects/new-project` which has no `.beads/`, the function returns the input `startDir` (line 56). But subsequent `getFormulaSearchPaths()` may not find any paths. The spec needs to define behavior: should `POST /api/workspace/open` auto-create `.beads/`? Fail? Warn? This affects the core happy path.

### Important (should fix before implementation)

4. **Spec says `useFormulaDirty()` provides a `Set<string>` -- it does not.**
   Section 4.6 states: "The existing `useFormulaDirty()` context provides a `Set<string>` of dirty formula names." The actual context exposes `isDirty(name: string) => boolean` and `setDirty(name: string, dirty: boolean) => void` (see `formula-dirty-context.tsx` lines 9-12). The internal `Set<string>` is not exposed. The `WorkspaceTree` component will need to use the `isDirty()` function per-formula rather than iterating a Set. For dirty propagation to directory ancestors, the spec's approach of "walks ancestors to compute which directory nodes should also show the dirty indicator" will need to call `isDirty()` for each formula leaf under each directory, which is less efficient than accessing the Set directly. **Recommendation:** Either expose the Set from the context, or accept the per-formula check approach and document it. For 200-1000 formulas, the overhead is negligible.

5. **`useFormulas()` hook does not expose an `invalidateFormulas()` function.**
   Section "Spec Review Clarifications" item 4 says: "Add `invalidateFormulas()` call after successful `POST /api/workspace/open`." The `useFormulas()` hook (at `/apps/frontend/src/hooks/use-formulas.ts`) exposes a `refresh` function (line 82), not `invalidateFormulas`. The spec should reference `refresh()` or clarify that the hook needs modification.

6. **Vite proxy targets `localhost:3001` but backend binds to `127.0.0.1:3001`.**
   The Vite config at `/apps/frontend/vite.config.ts` line 26 uses `target: 'http://localhost:3001'` while the backend at `/apps/backend/src/index.ts` line 33 binds to `hostname: '127.0.0.1'`. On most systems `localhost` resolves to `127.0.0.1`, but on some IPv6-preferring systems this can cause connection failures. This is not introduced by this spec but is worth noting since the new workspace endpoints will go through the same proxy. Not a blocker, but something to be aware of during testing.

7. **Backend route file does not exist yet: `apps/backend/src/routes/workspace.ts`.**
   This is expected (it will be created in Phase 1), but the spec should clarify that this file is entirely new. The existing route pattern in `index.ts` uses named exports (e.g., `import { formulas } from './routes/formulas.js'`). The spec should specify that the new file exports a `workspace` Hono instance, and the registration line in `index.ts` should be `app.route('/api', workspace)`.

8. **Async FS calls in Section "Additional Gap Fixes" item 5 contradicts Section 4.3.**
   Section 4.3 describes the tree scan using `fs.readdirSync` / `fs.statSync`. The "Additional Gap Fixes" section at the end says to change these to async `fs.promises.readdir` / `fs.promises.stat`. These are contradictory. Since Hono route handlers are async, the async approach is better for not blocking the event loop during large directory scans. The spec should settle on one approach. **Recommendation:** Use async throughout since Hono handlers are `async (c) => {...}`.

9. **`treeExpanded` type in Section 4.1 does not match the corrected version in "Additional Gap Fixes".**
   Section 4.1 defines `treeExpanded: Record<string, boolean>` (flat path-to-boolean). The "Additional Gap Fixes" section changes it to `Record<rootPath, Record<dirPath, boolean>>` for per-workspace scoping. The spec should present only the corrected version to avoid confusion during implementation.

10. **`FormulaTree` is rendered via `__root.tsx` with no conditional logic currently.**
    At `/apps/frontend/src/routes/__root.tsx` line 137:
    ```typescript
    sidebarContent={<FormulaTree />}
    ```
    The spec says `FormulaTree` should coexist behind a feature flag or route condition (Section 4.4). But currently `FormulaTree` is unconditionally rendered as the sidebar content. The implementation will need to replace this line with conditional logic based on `workspaceConfig.rootPath`. This should be explicitly called out as a modification to `__root.tsx`.

### Minor (nice to have)

11. **The spec references `@tanstack/react-virtual` with "(or equivalent)" but should commit to one.**
    Open Question Q6 asks whether the dependency exists. It does not. The spec should commit to `@tanstack/react-virtual` and note the `pnpm add` step in Phase 4.

12. **The 500-node hard limit is arbitrary and may need tuning.**
    Section US-6 and Section 4.3 specify a 500-node limit. For workspaces with deep nesting but few formulas, 500 nodes could be hit before all formulas are included (since directory nodes count toward the limit). Consider making the limit configurable via an environment variable.

13. **The spec mentions `.formula.json` files are excluded from the tree but still accessible via `/api/formulas`.**
    The existing `discoverFormulasInPath()` in `formulas.ts` (line 72) discovers both `.formula.toml` AND `.formula.json`:
    ```typescript
    if (entry.endsWith('.formula.toml') || entry.endsWith('.formula.json')) {
    ```
    The tree endpoint only shows `.formula.toml`. This asymmetry could confuse users who have `.formula.json` files. The out-of-scope section documents this, which is fine, but the `EmptyState` hint ("Add `.formula.toml` files...") should also mention that `.formula.json` files exist but are not shown in the tree.

14. **The `Placeholder` type import in `index.ts` is a code smell.**
    At `/apps/backend/src/index.ts` line 1:
    ```typescript
    import type { Placeholder } from '@beads-ide/shared'
    ```
    This is used only for the root endpoint (line 16). This is pre-existing and unrelated to this spec, but worth noting as something to clean up.

15. **No CORS consideration for the new endpoints.**
    The existing backend does not configure CORS (relies on Vite proxy in dev). This is fine but should be noted for production deployment considerations if the frontend is ever served from a different origin.

16. **The spec does not mention error handling for `POST /api/workspace/init` when the target path does not exist.**
    The endpoint should create the directory if it doesn't exist, or the user should pre-create it via the OS picker. The spec defines `NOT_FOUND` as an error code but doesn't clarify whether the endpoint should `mkdir -p` the path.

## Recommendations

1. **Replace `showDirectoryPicker` with a backend-driven directory browser.** Build a `GET /api/filesystem/list?path=/home/user` endpoint that returns directory entries. This sidesteps all browser sandbox limitations, works on all browsers, and gives the backend full path information. The frontend renders a simple tree picker modal. This is a more significant design change but solves the problem cleanly.

2. **Resolve the 3 blocking open questions (Q1/Q8 template content, Q4 missing `.beads/` behavior) before starting Phase 1.** These affect the API contract and cannot be deferred.

3. **Fix the `getConfig()` / workspace root mechanism.** Add `setWorkspaceRoot(path)` and modify `getConfig()` to use it, as described in Phase 1 task 2. Update Section 4.2 to reflect this accurately rather than claiming `clearConfigCache()` + `loadConfig(newPath)` is sufficient.

4. **Consolidate the spec.** Remove contradictions between the main body and the "Additional Gap Fixes" / "Spec Review Clarifications" addenda. The corrected versions should replace the originals inline, not append at the bottom.

5. **Add explicit modification callouts for existing files.** The spec should list every existing file that needs modification (not just new files), specifically:
   - `/apps/frontend/src/routes/__root.tsx` -- conditional sidebar rendering
   - `/apps/frontend/src/routes/index.tsx` -- conditional WelcomePanel
   - `/apps/backend/src/index.ts` -- register workspace routes
   - `/apps/backend/src/config.ts` -- add `setWorkspaceRoot()` / `getWorkspaceRoot()`
   - `/packages/shared/src/ide-types.ts` -- add workspace types
   - `/packages/shared/src/index.ts` -- export new types
   - `/apps/frontend/package.json` -- add `@tanstack/react-virtual`

6. **Use async FS throughout the tree scanner.** Commit to `fs.promises` in Section 4.3 and remove the sync references.
