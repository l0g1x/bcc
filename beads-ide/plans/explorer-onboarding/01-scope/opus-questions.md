# Opus 4.6 Analysis: explorer-onboarding

## User Advocate Perspective

**Feature brief**: Add VS Code-style onboarding (New Project/Open Folder) and fix the explorer UI. User selects a root folder (e.g. ~/gt/), then sees a proper file tree of all .formula.toml files under that folder. Current issues: no onboarding flow, janky icons, broken alignment, unclear current directory, confusing 'Gas Town' vs 'User' formula distinction.

### 1. User Expectations

1. **Will users expect "Open Folder" to work like VS Code's "Open Folder"?** Users who have used VS Code will assume this opens a system-native file picker, grants full access to the folder, and remembers the choice persistently -- if it behaves differently (e.g. only scans for .formula.toml files, or uses a non-native picker), they will feel misled by the familiar terminology.

2. **Will users expect to see ALL files inside the opened folder, not just .formula.toml files?** A "file tree" universally means the full directory contents; showing only formula files makes this more of a "formula browser" -- users will wonder where the rest of their files went and whether something is broken.

3. **Will users expect to be able to create new .formula.toml files from within the IDE?** "New Project" implies creation, not just discovery; if they can only open existing folders of existing formulas, users will be confused about what "New Project" actually does.

4. **Will users expect drag-and-drop to open a folder?** VS Code and most desktop IDEs support drag-and-drop of folders onto the window; omitting this will feel like a gap, especially for macOS users who drag from Finder.

5. **Will users expect the opened folder to persist across browser sessions and page reloads?** If they reopen the app tomorrow and see the onboarding screen again instead of their folder, they will be frustrated and question the tool's reliability.

6. **Will users expect to open multiple folders or a single workspace?** VS Code supports multi-root workspaces; users may want to see formulas from two unrelated projects side by side. If we only support one root, that constraint must be obvious.

7. **Will users expect a "Recent Folders" list?** Every modern IDE and many file managers show recently opened locations; without this, power users who switch between projects will have to navigate the file picker repeatedly.

8. **Will users expect the root folder path to be visible at all times?** Currently the brief says "unclear current directory" is a known issue; users need a persistent breadcrumb or path indicator so they always know *where* they are. This is table stakes for file-based tooling.

9. **Will users assume the app is indexing or watching the folder for changes?** If they add a new .formula.toml file on disk, users will expect it to appear in the tree without a manual refresh -- file watchers are standard in VS Code, and their absence will feel broken.

10. **Will users expect right-click context menus on tree items?** VS Code's explorer supports right-click for rename, delete, copy path, reveal in OS file manager, etc. Users will instinctively right-click and be confused when nothing happens.

11. **Will users expect "Open Folder" to also configure the backend's search paths?** Currently the backend has hardcoded search path logic (formulas/, .beads/formulas/, etc.); if the frontend lets users pick ~/gt/ but the backend still searches its own paths, the tree and the API will be out of sync and users will see inconsistent results.

12. **Will users expect keyboard shortcuts for the onboarding actions?** VS Code users will instinctively try Ctrl+O / Cmd+O to open a folder; if this doesn't work, the app feels less professional.

### 2. User Journey

1. **What is the user's primary goal when they first open Beads IDE?** They want to find and edit a specific formula file quickly; the onboarding flow should get out of their way in under 5 seconds, not become a ceremony. Every unnecessary step between "open app" and "editing a formula" is a failure.

2. **What is the user's emotional state on first launch?** They are likely evaluating the tool, possibly skeptical, and will make a snap judgment in the first 10 seconds. If the first screen feels empty, confusing, or requires reading documentation, they may close the tab and not return.

3. **What context does the user bring from their previous action?** They probably just ran a command in a terminal, or were told by a teammate to use Beads IDE; they know the path to their project but may not know the internal structure (.beads/formulas/, etc.). The onboarding should not assume familiarity with the formula search path conventions.

4. **What happens after they select a root folder -- what do they expect to see immediately?** A clear, responsive tree showing their formulas, ideally expanded one level deep. If the tree takes more than 200ms to populate, they will perceive lag. If it shows nothing (because there are no formulas yet), they need a clear, actionable empty state.

5. **What does a returning user expect?** They expect the app to remember their last state: which folder was open, which formula was selected, which tree nodes were expanded. Having to re-select the folder every time destroys the "pick up where I left off" workflow.

6. **What if the user has formulas in multiple directories?** Their mental model might be "I'm working on project X" (one folder) or "I want to see all my formulas across projects" (multi-folder). The feature needs to clearly communicate which model it supports.

7. **What happens if the user opens a folder with zero .formula.toml files?** This is the "empty garage" moment. The current empty state shows technical paths (formulas/, .beads/formulas/); a better experience would offer to create a sample formula or explain in plain language what to do next.

8. **What does the user do right before they need to switch folders?** They probably finish editing in one project and want to jump to another. If switching folders requires navigating through the onboarding flow again, it will feel like a regression from the "always-on sidebar" they have now.

9. **Is the user always at a desktop, or could they be on a tablet or narrow screen?** The three-panel layout with a tree sidebar assumes ample horizontal space; if anyone uses this on a smaller screen, the sidebar collapse behavior becomes critical to usability.

10. **What happens after the user selects a formula from the tree?** The formula editor opens in the main panel. But does the tree stay visible? Does the selected item stay highlighted? Does the user have a clear path back to the tree? The transition from "browse" to "edit" mode must feel seamless, not like a page change.

11. **Will users expect to search/filter within the file tree?** In large projects with dozens of formula files, scrolling through a tree is slow. A filter input at the top of the tree (like VS Code's "type to filter") is expected. Without it, the Command Palette (Cmd+K) becomes the only search mechanism, which is non-discoverable.

12. **What happens if the backend server is not running when they first open the app?** The onboarding flow might load fine (it's static UI) but then fail silently when trying to scan the folder. The error experience during onboarding is especially critical because users haven't yet built any trust in the tool.

### 3. Edge Cases (User Behavior)

1. **What if the user selects their home directory (~/) as the root folder?** This could trigger a scan of thousands of directories. Without a depth limit or timeout, the app could hang or appear frozen. Users will absolutely try this, especially if they are unsure where their formulas live.

2. **What if the user selects a folder they don't have read permissions for?** The tree will be empty or the API will error. The error message needs to be specific ("Permission denied for /root/secret") rather than generic ("Failed to load formulas").

3. **What if the user opens a folder on a network drive or mounted volume that disconnects?** File watchers will fail, the tree will go stale, and subsequent operations will error. The app needs to degrade gracefully, not crash or show a blank sidebar.

4. **What if the user opens a folder, then renames or moves it in their OS file manager?** The stored path becomes invalid on next app launch. The app should detect this and prompt to re-select rather than showing a cryptic error.

5. **What if the user has symlinks in their folder structure?** A symlink loop could cause infinite recursion in the file scanner. The backend needs cycle detection, and the tree needs to handle it without confusing the user.

6. **What if the user is editing a formula, then decides to switch to a different root folder?** This is the "change your mind halfway" scenario. If they have unsaved changes, the app needs to prompt -- but the current UnsavedChangesModal is per-formula navigation, not per-folder switch. This is a new interaction that doesn't exist yet.

7. **What if the user clicks "New Project" but doesn't actually want to create anything -- they just want to open an existing folder?** The naming of "New Project" vs "Open Folder" must be unambiguous. If "New Project" implies creating scaffolding files, that's very different from "Open Folder."

8. **What if the user opens the same folder in two browser tabs?** Will they see the same state? Will saves from one tab appear in the other? Will file watching cause conflicts? Multi-tab usage is common and must be at least non-destructive.

9. **What if the user pastes a path into the folder picker instead of navigating to it?** Not all file pickers support paste. If we use the browser's native directory picker API, its capabilities are limited and vary by browser. Users who know the exact path will be frustrated if they have to click through a tree to get there.

10. **What if the user selects a folder that contains thousands of .formula.toml files?** The tree needs to handle large lists gracefully -- virtualization, pagination, or at minimum a loading indicator. Rendering 500+ tree nodes at once will cause visible jank.

11. **What if the user accidentally dismisses the onboarding screen and doesn't know how to get back to it?** There must be a persistent way to change the root folder after initial setup -- a menu item, a button in the sidebar header, or a command palette action. Onboarding should not be a one-shot experience.

12. **What if the user expects "Open Folder" to open a folder from a URL or remote location?** Some teams may work with formulas stored in remote repositories. The feature needs to clearly communicate it's for local folders only, if that's the case.

13. **What if the user cancels the folder picker dialog?** The app should return to its previous state gracefully, not leave the user on a blank screen or in an inconsistent state. The onboarding screen should remain visible and responsive.

14. **What if the user's browser does not support the File System Access API (showDirectoryPicker)?** Firefox and some privacy-hardened browsers don't support it. The feature needs a fallback or a clear message about browser requirements. Silently failing is unacceptable.

### 4. Accessibility & Inclusion

1. **Can screen reader users navigate the file tree effectively?** The current tree uses ARIA roles (region, group, aria-expanded, aria-pressed) but the tree pattern should follow the WAI-ARIA Treeview pattern (role="tree", role="treeitem") for proper screen reader announcement of hierarchy and expand/collapse state.

2. **Can keyboard-only users complete the entire onboarding flow without a mouse?** Selecting "Open Folder," navigating the file picker, and confirming the selection must all be achievable with keyboard alone. The browser's native file picker typically handles this, but any custom UI (like a recent folders list) must also be keyboard-navigable.

3. **Is the file tree navigable with arrow keys following the standard tree keyboard pattern?** Users expect Up/Down to move between items, Left/Right to collapse/expand, Home/End to jump to first/last. The current implementation only handles Enter/Space. This is a significant gap for keyboard users.

4. **Are the icons purely decorative, or do they convey information that's only available visually?** The folder icon, file-code icon, chevron, and dirty dot all carry meaning. While the dirty dot has a title attribute, screen reader users get the information through the aria-label. But the distinction between Gas Town vs User formulas is conveyed only through visual group labels -- is the grouping clear to non-visual users?

5. **Is the color contrast sufficient for users with low vision?** The current color scheme uses #858585 on #252526 for secondary text, which may not meet WCAG AA contrast ratio (4.5:1). The onboarding screen buttons and text need to be checked against both AA and AAA standards.

6. **Can users with motor impairments interact with the small tree items?** Tree items are styled with 4px vertical padding and 13px font size, resulting in hit targets that may be smaller than the recommended 44x44px minimum (WCAG 2.5.5). On touch devices, this will be especially problematic.

7. **What happens for users who have disabled JavaScript or have slow connections?** While a React SPA inherently requires JavaScript, slow initial load could leave users staring at a blank page. The onboarding should include a noscript fallback or at minimum a fast-loading shell.

8. **Can users who rely on browser zoom (up to 200%) still use the onboarding and tree effectively?** The three-panel layout with fixed minimum sizes could cause content to be clipped or overflow at high zoom levels. The sidebar minimum size of 5% could become unusably small when zoomed.

9. **Are we assuming all users read left-to-right?** The sidebar is on the left, the tree indentation goes right, and the layout is LTR-assumed. Users with RTL languages (Arabic, Hebrew) would need mirrored layout. If internationalization is a future goal, the onboarding text and layout should be designed with this in mind.

10. **Are we assuming all users speak English?** The onboarding text, button labels ("New Project", "Open Folder"), error messages, and empty states are all hardcoded in English. If the tool has an international user base, this is a limitation that should be acknowledged.

11. **Can users with cognitive disabilities understand the "Gas Town" vs "User" formula distinction?** These are domain-specific labels that carry no inherent meaning. Even experienced developers may not immediately understand the categorization. The onboarding should either explain these terms or replace them with universally understood labels (e.g., "Shared Formulas" vs "My Formulas").

12. **Are animations and transitions respectable of users who prefer reduced motion?** The skeleton loading animation, chevron rotation, and any potential onboarding transitions should respect the prefers-reduced-motion media query. The current skeleton pulse animation does not check this preference.

13. **Is the dark-only theme a barrier for any users?** Some users with certain visual conditions (e.g., astigmatism, some forms of dyslexia) find dark themes harder to read. While VS Code also defaults to dark, it offers light theme options. If Beads IDE is dark-only, this should be a conscious decision with stated rationale.

### 5. Critical Concerns (Summary)

**Highest-priority user risks:**

- **Browser API compatibility**: The File System Access API (showDirectoryPicker) is not available in Firefox. If this is the chosen approach, a significant portion of users will be completely blocked. This must be resolved with a fallback or by communicating the requirement upfront.

- **"File tree" vs "Formula browser" mismatch**: The brief says "file tree of all .formula.toml files" but the words "file tree" set an expectation of seeing ALL files. This naming mismatch will cause confusion. The UI should clearly label this as a "Formula Explorer" or similar, not a generic file tree.

- **Folder persistence across sessions**: If users have to re-select their folder on every visit, the onboarding becomes ongoing friction rather than a one-time setup. localStorage or IndexedDB persistence is essential, with the File System Access API's ability to re-request permission on return visits handled gracefully.

- **Empty folder experience**: A user who selects a folder with no formulas is at the most vulnerable moment -- they've committed to trying the tool but gotten nothing useful back. The empty state must be helpful, not just informative. Offer to create a sample formula, link to documentation, or explain what a .formula.toml file is.

- **Backend/frontend alignment**: The backend currently discovers formulas based on hardcoded search paths relative to a project root. The proposed feature lets users pick any arbitrary folder. If these two systems are not unified, the sidebar will show one thing and the API will operate on another, leading to silent bugs and user confusion.

- **Discoverability of folder switching**: If onboarding is shown only on first launch, users need a clear, always-available way to change their root folder later. Burying it in a settings page or command palette is insufficient -- it should be visible in the sidebar header.

---

## Product Designer Perspective

### Feature Summary

Add VS Code-style onboarding (New Project / Open Folder) and fix the explorer UI. User selects a root folder (e.g. ~/gt/), then sees a proper file tree of all .formula.toml files under that folder. Current issues: no onboarding flow, janky icons, broken alignment, unclear current directory, confusing "Gas Town" vs "User" formula distinction.

### Current State Assessment

The existing sidebar (`formula-tree.tsx`) groups formulas by search path using labels like "Gas Town formulas", "User formulas", "Project formulas", and "Project .beads". These labels are generated server-side in `formulas.ts` based on where formula files physically reside on disk. The sidebar header simply reads "EXPLORER" with a collapse toggle (`<` / `>`). The landing page shows a centered "Beads IDE" heading and "Select a formula from the sidebar" -- no affordance to open a project, change directory, or understand what directory is currently loaded. The backend resolves a project root by walking up directories looking for `.beads/`, then searches four hardcoded path patterns for `.formula.toml` files. There is no mechanism for the user to choose or change the root folder at runtime.

### Information Architecture

**IA-Q1: What should the user see when they launch the app for the very first time with no project root detected?**
Why it matters: The current landing page assumes formulas already exist and tells the user to "select a formula from the sidebar." If no `.beads/` directory exists up the tree, `resolveProjectRoot` falls back to `process.cwd()`, which may be meaningless. First-time users hit a dead end with no guidance. This is the single most critical gap -- the app provides zero pathway from "I just opened this" to "I am productive."

**IA-Q2: Should the onboarding distinguish between "no project root found" and "project root found but no formulas exist"?**
Why it matters: These are different problems requiring different solutions. "No project" means the user needs to select or create a workspace. "No formulas" means the workspace is valid but empty -- the user needs to create their first formula. Conflating them produces a confusing error state. The current `EmptyState` component already handles the "no formulas" case by listing search paths, but it does not handle "no project root" at all.

**IA-Q3: How should the current working directory / project root be surfaced in the UI?**
Why it matters: Users currently have no way to tell what directory the app is looking at. The sidebar header says "EXPLORER" with no path indicator. VS Code shows the workspace name in the sidebar header and the window title. Without this, users cannot confirm they are looking at the right project, especially when multiple projects exist.

**IA-Q4: What is the correct information hierarchy for the sidebar: project root > subdirectories > formula files, or flat group-by-search-path as it is now?**
Why it matters: The current grouping by search path label ("Gas Town formulas", "User formulas") is an implementation detail exposed to the user. Users think in terms of folder structure, not search path resolution order. A file-tree hierarchy rooted at the selected folder would match the user's mental model (as it does in VS Code). However, formulas from `~/.beads/formulas/` and `$GT_ROOT/.beads/formulas/` live outside the project root, so the tree needs a way to show "external" formula sources without confusion.

**IA-Q5: Should the file tree show only `.formula.toml` files, or also show the surrounding directory structure for context?**
Why it matters: Showing only formula files is simpler and reduces noise, but removes the context that helps users understand where their formulas live relative to other project files. VS Code shows the full tree. A middle ground -- showing the directory hierarchy but only rendering `.formula.toml` leaves -- would maintain spatial context without clutter. The decision affects how deeply we need to scan the filesystem and how much data the backend must serve.

**IA-Q6: How should "Gas Town formulas" vs "User formulas" vs "Project formulas" be explained to a new user?**
Why it matters: The current labels are opaque. A user encountering "Gas Town formulas" for the first time has no idea what that means, where those files live, or why they are separate from "User formulas." The distinction maps to physical directories (`$GT_ROOT/.beads/formulas/` vs `~/.beads/formulas/` vs `./formulas/`) but this mapping is not communicated. Either the labels need to be self-explanatory, or tooltips/descriptions need to provide the path mapping, or the grouping scheme needs to change entirely.

**IA-Q7: What metadata should be visible for each formula in the tree (name only, path, last modified, dirty state, error state, step count)?**
Why it matters: Currently each formula shows its name, a file-code icon, and an optional dirty dot. More metadata (e.g., file path on hover, step count badge, last-modified timestamp) could help users differentiate formulas with similar names across different search paths. However, too much metadata creates visual noise. The right balance depends on typical project size -- a project with 5 formulas needs less disambiguation than one with 50.

**IA-Q8: Should the sidebar show a search/filter input for formulas, and where should it appear?**
Why it matters: As the number of formulas grows, scrolling through a tree becomes slow. VS Code's explorer has a filter-on-type feature and the separate search panel. Since this app already has Cmd+K for command palette search, a dedicated sidebar filter might be redundant -- or it might be essential if users primarily navigate via the tree. Need to decide whether Cmd+K is sufficient or a persistent filter bar belongs in the sidebar.

**IA-Q9: How should the "Open Folder" action relate to the backend's search path configuration?**
Why it matters: Currently the backend resolves search paths at startup and caches the config. If the user opens a different folder at runtime, the backend needs a mechanism to re-resolve or accept a new root. This is an architectural question with UX implications: does "Open Folder" restart the backend, send a new root via API, or is it purely a frontend filter on an existing broader scan? The answer determines whether the feature is a frontend-only change or requires backend work.

**IA-Q10: What should the title bar / window header communicate?**
Why it matters: The app currently has no title bar or breadcrumb showing context. VS Code shows "filename - project - VS Code" in the title bar. For Beads IDE, the header could show the project root path, the currently selected formula, and the app name. This helps with window identification when multiple instances are open and provides constant orientation about what the user is working on.

**IA-Q11: Should "New Project" create a `.beads/` directory and scaffolded files, or just set the working directory?**
Why it matters: If "New Project" only sets a directory pointer, the user still needs to manually create formula files. If it scaffolds a `.beads/formulas/` directory and a starter `.formula.toml`, the user can immediately see something in the tree and start editing. The scaffolding approach dramatically shortens time-to-first-success but introduces opinions about project structure.

**IA-Q12: How should recently opened projects be tracked and presented?**
Why it matters: VS Code's welcome screen shows recent projects for quick reopening. If users switch between multiple projects, a recent-projects list on the landing page avoids repetitive folder selection. This requires persisting project history (localStorage or backend file), which introduces data management questions but significantly improves return-visit UX.

### Visual Design

**VD-Q1: What icon system should replace the current inline SVG icons, and how should formula-type-specific icons be differentiated?**
Why it matters: The current icons are hand-drawn Lucide-style SVGs embedded directly in the component. They lack visual polish and consistency -- the folder icon and file-code icon have different stroke weights and visual density, contributing to the "janky" feel. Adopting a proper icon library (Lucide React, Phosphor, Codicons) ensures consistent sizing, weight, and alignment. Additionally, `.formula.toml` files could use a distinctive icon (e.g., a beaker/flask) rather than the generic file-code icon to reinforce the domain.

**VD-Q2: How should the alignment issue between chevron, folder icon, label, and count badge be fixed?**
Why it matters: The current layout uses flexbox with `gap: 6px`, but the chevron icon, folder icon, and text don't align on the same baseline. The count badge floats right with `marginLeft: auto` but has no visual container, making it look disconnected. VS Code solves this with a strict 20px indent per nesting level, icon slots of fixed width, and right-aligned badges with subtle backgrounds. The fix needs explicit icon slot widths and consistent vertical centering.

**VD-Q3: What visual treatment should distinguish the onboarding/welcome state from the normal working state?**
Why it matters: The current landing page is sparse text on a dark background. An effective onboarding screen needs visual hierarchy: a prominent call-to-action ("Open Folder" button), secondary actions ("New Project", "Recent Projects"), and contextual help. VS Code's welcome tab uses card-based layout with icons, short descriptions, and keyboard shortcut hints. The design should feel purposeful without being overwhelming.

**VD-Q4: How should tree indentation levels be visualized (indent guides, nesting lines, padding only)?**
Why it matters: The current tree uses `paddingLeft: 12px` for one level of nesting. If we move to a real directory tree with multiple levels, users need visual guides to track parent-child relationships. VS Code uses subtle vertical indent guides (1px lines). Without them, deeply nested items look disconnected from their parent. The indent guide style (solid, dashed, colored on hover) affects readability.

**VD-Q5: What should the empty sidebar look like when no folder is open (pre-onboarding state)?**
Why it matters: Currently the sidebar always shows the formula tree or a loading skeleton. Before the user has opened a folder, the sidebar should either be hidden, show a minimal prompt ("Open a folder to get started"), or display the onboarding actions directly. An empty sidebar with just "EXPLORER" and nothing else looks broken. This state needs intentional design to communicate "this is where your files will appear."

**VD-Q6: How should the "Open Folder" and "New Project" buttons be styled -- primary brand buttons, ghost buttons, or card-based actions?**
Why it matters: The visual weight of these CTAs determines whether users notice and click them. If they look like regular text links, they blend into the dark background. If they are large colored buttons, they dominate the screen and feel out of place in an IDE aesthetic. VS Code uses text links with icons in the welcome tab but prominent buttons in the empty explorer. The style should match the overall dark theme (#1e1e1e backgrounds, #38bdf8 brand accent).

**VD-Q7: How should the dirty indicator (unsaved changes dot) work with file-tree nesting -- should parent folders also show a dirty indicator?**
Why it matters: The current amber dot appears next to individual formula names. In a tree structure, if a formula deep in a collapsed subtree has unsaved changes, the user would not see the indicator. Propagating dirty state up to parent folders (as VS Code does with git status decorations) ensures the indicator is always visible. This requires additional state tracking but prevents data loss from navigating away.

**VD-Q8: What hover, focus, and active states should tree items have?**
Why it matters: Current hover is a flat `#2a2d2e` background and active is `#094771`. These states lack transition animations, focus rings for keyboard navigation, and visual feedback on click. VS Code uses subtle background transitions, a 1px left border accent for the active item, and visible focus outlines. Improving these micro-interactions makes the tree feel responsive and polished rather than static.

**VD-Q9: How should the sidebar collapse/expand toggle be redesigned?**
Why it matters: The current toggle is a plain `<` / `>` character button with no icon, no tooltip, and no animation. It looks like a developer placeholder. Replacing it with a proper chevron icon, adding a tooltip ("Collapse Sidebar" / Cmd+B), and animating the sidebar width transition would match user expectations from VS Code. The collapsed state currently shows a narrow icon rail but has no content in it.

**VD-Q10: Should the selected/active formula have a left-edge accent bar (VS Code style) or full-row highlight?**
Why it matters: The current full-row highlight (`#094771`) works but can be visually heavy when combined with hover states on adjacent items. VS Code uses a combination: a 2px left border accent on the active item plus a more subtle background. This creates a persistent "you are here" marker that is visible even while hovering other items. It also works better with keyboard navigation where focus and selection can differ.

**VD-Q11: What should the loading state look like during folder scanning (skeleton, spinner, progress bar)?**
Why it matters: When the user selects "Open Folder" and the backend scans for `.formula.toml` files, there is a latency window. The current loading skeleton (pulsing gray bars) is generic. A more informative loading state could show "Scanning for formulas..." with an indeterminate progress bar, or progressively reveal found formulas as the scan completes. The choice affects perceived performance.

**VD-Q12: How should the folder path be truncated or abbreviated in the sidebar header?**
Why it matters: A path like `/home/krystian/gt/bcc/crew/krystian/beads-ide` does not fit in a 200px-wide sidebar. It needs truncation strategy: show only the last segment ("beads-ide"), use ellipsis in the middle ("~/gt/.../beads-ide"), or show the full path on hover via tooltip. VS Code shows just the folder name with the full path in a tooltip. The truncation approach affects whether users can distinguish similarly-named projects.

### Interaction Design

**IX-Q1: What is the complete flow for a first-time user from app launch to editing their first formula?**
Why it matters: This is the critical path. Currently: launch app -> see "Beads IDE" heading -> look at sidebar -> if formulas exist, click one -> editor opens. If no formulas exist, user sees an empty state telling them to place files in specific directories, which requires leaving the app. The ideal flow: launch app -> see welcome/onboarding -> click "Open Folder" -> system file picker -> select directory -> tree populates -> click a formula -> editor opens. Every friction point in this flow risks losing the user.

**IX-Q2: Should "Open Folder" use the native OS file picker (via `<input type="file" webkitdirectory>`) or a custom in-app file browser?**
Why it matters: The native file picker is familiar and accessible but has limitations: `webkitdirectory` is not supported in all browsers, it uploads file contents rather than just paths, and it cannot be pre-navigated to a specific directory. Since this is likely a local Electron-like app (Vite dev server), the backend could provide a directory listing API and the frontend could build a custom picker. However, this is significant engineering effort. The File System Access API (`showDirectoryPicker()`) is another option but has limited browser support.

**IX-Q3: How should the user switch between projects / root folders after initial selection?**
Why it matters: Once a folder is open, users need to switch to a different project. VS Code uses File > Open Folder and also shows recent workspaces. For Beads IDE, this could be a command palette action, a sidebar header dropdown, or a menu item. The mechanism must handle unsaved changes in the current project before switching. Currently there is no concept of "switching projects" at all.

**IX-Q4: What happens when the user selects a folder that contains no `.formula.toml` files?**
Why it matters: This is a likely scenario -- users might select the wrong folder, or select a folder where they intend to create formulas but haven't yet. The app should clearly communicate "No formulas found in this folder" and offer next steps: "Create a new formula" button, "Try a different folder" link, or guidance on expected file structure. Simply showing an empty tree with no explanation would be confusing.

**IX-Q5: Should tree nodes (folders) be expandable/collapsible, and should their state persist across sessions?**
Why it matters: In a deep directory tree, users need to collapse irrelevant subtrees to focus on their working area. VS Code persists collapse state per-workspace. If the tree resets to fully-expanded on every page load, users with large projects waste time re-collapsing folders. Persistence via localStorage keyed by project root would solve this. The current formula groups are collapsible but start expanded with no persistence.

**IX-Q6: What keyboard shortcuts should be supported in the tree (arrow keys, Enter, Home/End, type-ahead)?**
Why it matters: Power users (the primary audience for an IDE-like tool) expect keyboard-driven navigation. The current implementation supports Enter/Space to select but not arrow keys for moving between items, Home/End for jumping to first/last, or type-ahead filtering. VS Code's tree supports all of these plus Ctrl+Shift+E to focus the explorer. Missing keyboard support makes the app feel incomplete for its target audience.

**IX-Q7: How should drag-and-drop work in the file tree (if at all)?**
Why it matters: VS Code supports drag-to-move files in the explorer. For Beads IDE, drag-and-drop could enable reorganizing formulas between directories. However, this is high-complexity and may not be needed for v1. The question is whether to design the tree markup in a way that allows drag-and-drop to be added later (proper drag handles, drop zones) or to explicitly exclude it from the design.

**IX-Q8: What confirmation or feedback should the user see after selecting "Open Folder"?**
Why it matters: After the user picks a folder, the app needs to scan it for formulas. During this time, the user needs feedback: (a) the folder was accepted, (b) scanning is in progress, (c) scanning is complete with results. If the scan is fast (<200ms), a simple transition to the populated tree suffices. If it is slow (scanning a large directory tree), a progress indicator prevents the user from thinking the action failed.

**IX-Q9: Should the "New Project" flow include a formula template picker (blank formula, workflow template, multi-step template)?**
Why it matters: "New Project" without any starter content leaves the user at a blank screen. Offering templates reduces the time-to-first-formula and teaches users about formula structure. VS Code's "New File" offers language-specific templates. For Beads IDE, templates could demonstrate different formula patterns (simple single-step, multi-step workflow with dependencies, formula with variables). However, this adds scope and could be deferred to a later iteration.

**IX-Q10: How should the app handle the case where the backend is unreachable during onboarding?**
Why it matters: The app uses a Vite dev proxy to reach the Hono backend. If the backend is down, API calls fail and the current connection state tracker shows an offline banner. During onboarding, a backend failure is especially jarring -- the user has not even started using the app and already sees an error. The onboarding flow should gracefully handle this: show a clear "Cannot connect to backend" message with troubleshooting steps rather than silently failing to load formulas.

**IX-Q11: Should there be an "Open Recent" list, and how many items should it hold?**
Why it matters: For returning users, the fastest path to productivity is reopening their last project. An "Open Recent" list (5-10 items) on the welcome screen eliminates the need to navigate the file picker every time. This is a standard IDE pattern. The list should show the project name, full path, and last-opened timestamp. Items should be removable (right-click > Remove from Recent) for privacy.

**IX-Q12: How should the app behave when resizing the sidebar with the file tree -- should the tree truncate names, wrap, or scroll horizontally?**
Why it matters: Long formula names or deep directory paths can overflow the sidebar width. The current implementation has no text overflow handling -- names extend beyond the panel boundary. The tree should truncate names with ellipsis, show the full name on hover tooltip, and scroll vertically but never horizontally (horizontal scrolling in a sidebar is a poor pattern). VS Code uses ellipsis truncation with tooltip on hover.

### Consistency

**CO-Q1: How does the proposed onboarding pattern align with the existing command palette (Cmd+K) workflow?**
Why it matters: The command palette already provides a search-driven action dispatch. "Open Folder" and "New Project" could be command palette actions in addition to (or instead of) dedicated UI buttons. VS Code supports "File: Open Folder" via the command palette. For Beads IDE, registering these as command palette actions (in `useDefaultActions`) ensures that keyboard-driven users can trigger them without touching the mouse, maintaining consistency with the existing interaction paradigm.

**CO-Q2: Should the onboarding welcome screen be a dedicated route (e.g., `/welcome`) or a conditional state of the landing page (`/`)?**
Why it matters: The current landing page at `/` shows "Beads IDE" and "Select a formula from the sidebar." The onboarding screen could replace this when no project is open, or it could be a separate route. A conditional state is simpler (no new routes) but mixes concerns. A dedicated route is cleaner architecturally but requires route guards to redirect when a project is already open. The app uses TanStack Router with file-based routing, so a new route means a new file in `routes/`.

**CO-Q3: Can the existing `UnsavedChangesModal` pattern be reused for confirming project switches?**
Why it matters: The app already has a three-action modal (Cancel, Discard, Save) used when navigating between formulas with unsaved changes. Switching projects is a similar "you have unsaved work" scenario. Reusing the same modal component with different messaging ("You have unsaved changes. Save before switching projects?") maintains consistency and avoids building a new modal. The `UnsavedChangesModal` in `unsaved-changes-modal.tsx` accepts `isOpen`, `onSave`, `onDiscard`, `onCancel` -- this interface works for project switching.

**CO-Q4: How should the sidebar header styling change to accommodate a project name and path?**
Why it matters: The current sidebar header is minimal: "EXPLORER" label and a collapse toggle. Adding a project name/path requires rethinking the header layout. It needs to fit within the existing `headerStyle` (36px min-height, `#252526` background, `#3c3c3c` border-bottom) while accommodating more content. Options: two-line header (project name + path), single line with dropdown, or a breadcrumb. The style must remain consistent with the dark theme and 11px uppercase label convention.

**CO-Q5: Should error states in the file tree follow the same pattern as the existing `errorStyle` (red background, red text)?**
Why it matters: The current error state for failed formula loading uses a red-tinted container (`#3c1f1e` background, `#f48771` text). Errors during folder selection, scanning, or project initialization should use the same visual language for consistency. However, some errors (e.g., "permission denied on folder") might benefit from more actionable messaging than the current pattern provides. The error pattern could be extended with an action button ("Try Again", "Choose Different Folder").

**CO-Q6: How should toast notifications be used during onboarding vs. inline feedback?**
Why it matters: The app uses Sonner toasts for transient feedback (save success, cook output, keyboard tip). During onboarding, should folder selection success/failure use toasts, inline messages, or state transitions? Toasts are appropriate for transient confirmations but not for persistent errors that require action. A failed folder scan should be shown inline (in the sidebar or main area), while a successful scan could trigger a brief toast before transitioning to the tree view.

**CO-Q7: Does the existing `react-resizable-panels` layout need modification to support the onboarding state?**
Why it matters: The three-panel layout (sidebar, main, detail) is always rendered by `AppShell`. During onboarding, the sidebar might be empty or contain onboarding actions, and the detail panel is irrelevant. The layout could: (a) keep all panels but adapt content, (b) hide the sidebar and show a full-width welcome screen, or (c) show the sidebar with onboarding actions and the main area with the welcome page. Option (a) is most consistent with the existing architecture. Option (b) feels more polished but requires conditional layout logic.

**CO-Q8: Should the file tree component be built on top of the existing `FormulaTree` or be a new component?**
Why it matters: The current `FormulaTree` (425 lines) handles formula grouping, selection, dirty state, and modal integration. A VS Code-style file tree has fundamentally different data structure (hierarchical directory tree vs. flat group-by-path). Refactoring `FormulaTree` risks breaking existing functionality. Building a new `FileExplorer` component that composes `FormulaTree` or replaces it would be cleaner. However, state management (dirty tracking, save integration, unsaved changes modal) needs to be shared.

**CO-Q9: How should the existing Tailwind theme tokens (sidebar colors, brand colors) be applied to new onboarding components?**
Why it matters: The app defines theme tokens in `app.css` (`--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-accent`, brand-50 through brand-950) but most components use hardcoded hex values in CSSProperties objects. New components should use the theme tokens for consistency and future-proofing (e.g., eventual light mode support). The onboarding screen should use `var(--color-brand-400)` for the primary CTA, `var(--color-sidebar)` for sidebar backgrounds, etc., rather than hardcoding `#38bdf8` and `#252526`.

**CO-Q10: How does the proposed file tree interact with the existing formula fetch hook (`useFormulas`)?**
Why it matters: `useFormulas()` fetches from `/api/formulas` which returns formulas grouped by search path. A file-tree view needs hierarchical directory data, not a flat list. Either the backend needs a new endpoint (e.g., `/api/tree` returning nested directory structure), or the frontend needs to reconstruct hierarchy from the flat formula list plus path information. Reusing the existing hook avoids backend changes but may require supplementary data. The hook's `refresh()` function would need to be called when the user opens a new folder.

**CO-Q11: Should the onboarding flow respect the existing accessibility patterns (ARIA labels, focus management, keyboard navigation)?**
Why it matters: The codebase has strong accessibility patterns: ARIA labels on all interactive elements, focus trapping in modals, keyboard event handlers, skip-to-content link, and screen reader text. New onboarding components must maintain this standard. The "Open Folder" button needs an ARIA label, the welcome screen needs landmark roles, the file picker needs focus management, and the project switch flow needs announcement via `aria-live` regions. Accessibility is not optional -- it is an existing convention that must be upheld.

**CO-Q12: How should the "New Project" / "Open Folder" actions be made discoverable beyond the welcome screen (menu bar, sidebar action, command palette)?**
Why it matters: Once the user has opened a project, the welcome screen disappears. They need another way to access "Open Folder" for switching projects. VS Code puts these in the File menu, the command palette, and as sidebar context actions. For Beads IDE, the command palette (`Cmd+K > Open Folder`) is the minimum. A sidebar header dropdown or context menu button would provide a more discoverable secondary path. Consistency with the existing action dispatch system (`useDefaultActions`) means registering these in the command palette action list.

### Design Recommendations Summary

**Highest priority items (address the core problems):**
1. Welcome/onboarding screen replacing the empty landing page when no project is loaded
2. "Open Folder" mechanism to select a root directory at runtime
3. Project root path display in the sidebar header
4. Consistent icon system replacing hand-drawn SVGs
5. Tree alignment fix (fixed-width icon slots, proper indentation)

**Important but deferrable:**
6. Recent projects list on the welcome screen
7. Full directory tree hierarchy (vs. improved group-by-path)
8. Sidebar search/filter
9. Keyboard navigation improvements (arrow keys, type-ahead)
10. "New Project" with template scaffolding

**Key design principle:** The onboarding flow should feel like a natural extension of the existing app, not a separate experience. Use the same dark theme, brand colors, component patterns, and interaction paradigms. The welcome screen should live within the existing `AppShell` layout rather than replacing it, so the transition from "no project" to "project open" is a content change, not a layout change.

---

## Tech Lead Perspective

### Feature Summary
Add VS Code-style onboarding (New Project / Open Folder) and replace the flat formula-group sidebar with a proper file tree rooted at a user-selected folder. Fix alignment, icon jank, unclear labels ("Gas Town" vs "User"), and missing current-directory context.

### Architecture

**Q1. Where does the "selected root folder" state live and who owns it?**
Today the backend's `config.ts` derives search paths from the server's `process.cwd()` and hardcoded relative paths. The user has no way to change the root at runtime. The new feature needs a durable "workspace root" concept. Does it live in localStorage on the frontend, in a backend config endpoint, or in a `.beads/workspace.json` file? This matters because every downstream component (formula discovery, API calls, relative-path display) depends on it.

**Q2. Does introducing a "root folder" concept break the existing multi-search-path model?**
Currently `getFormulaSearchPaths()` returns 4 distinct search paths (project formulas, .beads/formulas, ~/. beads/formulas, $GT_ROOT/.beads/formulas). Switching to "user picks ~/gt/" implies a single root with recursive scanning. Do we replace search paths entirely, or layer the root-folder tree on top of the existing search-path grouping? Getting this wrong means formulas from GT_ROOT or home-dir disappear.

**Q3. Do we need a new backend endpoint for recursive directory listing?**
The current `/api/formulas` does a flat `readdirSync` per search path. A proper file tree requires recursive directory traversal -- returning nested folder structure, not just formula names. This likely needs a new endpoint (`GET /api/tree?root=...` or similar) or a significant rework of the existing formulas route. What is the API contract?

**Q4. Should the tree show only `.formula.toml` files or all files?**
VS Code shows all files. The brief says "a proper file tree of all .formula.toml files under that folder." If we filter to only `.formula.toml`, the tree will have large gaps and collapsed empty directories. If we show all files, we need file-type icons and potentially opening non-formula files. This decision changes the scope by 2-3x.

**Q5. How does the "Open Folder" action reach the backend given browser security constraints?**
Browsers cannot access the filesystem via `<input type="file">` for directories with full path info (only the File System Access API gives that, and it is Chromium-only). Since this is a local dev tool, the backend can list directories, but the frontend needs a way to send a path string. Do we add a folder-picker dialog that calls the backend to list directories? Or do we use the native File System Access API and require Chrome?

**Q6. Should onboarding state persist across sessions and how?**
When a user completes "Open Folder" and picks `~/gt/`, should that choice survive a page reload? A backend restart? A machine restart? This determines whether we store state in localStorage, in a backend config file, or in a `.beads/` settings file. Wrong persistence layer means users re-do onboarding on every refresh.

**Q7. What is the component decomposition for the new sidebar?**
Currently we have one monolith: `FormulaTree.tsx` (507 lines including styles). The new design needs: `WelcomeScreen` (onboarding), `FolderPicker` (root selection), `FileTree` (recursive tree), `FileTreeItem` (individual node), `TreeHeader` (current directory display + change-folder button). How do these compose inside the existing `Sidebar` component?

**Q8. How does the new tree integrate with TanStack Router navigation?**
Currently `FormulaTree` uses `window.history.pushState` + `PopStateEvent` to navigate, which is a fragile hack around TanStack Router. Should the new implementation switch to proper `useNavigate()` from TanStack Router? This is a chance to fix the navigation model, but it also changes how unsaved-changes interception works.

**Q9. Does the "New Project" action create files on disk, and where?**
"New Project" in VS Code creates a folder and scaffolds files. Here, does "New Project" create a `.beads/` directory and a template `formulas/` directory? Does it create a sample `.formula.toml`? The backend needs a `POST /api/project` or similar endpoint to handle scaffolding. Without a clear spec, this becomes scope creep.

**Q10. How does the three-panel AppShell change for the onboarding state?**
When no folder is selected (first launch), the sidebar is empty and the main content shows the landing page. Should the entire layout switch to a single centered onboarding view (like VS Code's "Get Started" tab), or should the three-panel layout remain with the onboarding view in the main panel? This affects `AppShell.tsx` and `__root.tsx`.

**Q11. What happens to the existing search-path labels ("Gas Town formulas", "User formulas", "Project .beads")?**
The brief says these are confusing. Are they being removed entirely in favor of the folder-based tree, or renamed, or moved to a secondary section? If we keep them as "pinned sources" alongside the tree, we need a dual-list UI. If we remove them, formulas from $GT_ROOT and ~/.beads will be invisible unless the user manually opens those folders.

**Q12. Does the backend need to support multiple concurrent workspace roots?**
If two browser tabs open the IDE pointed at different folders, the single cached `BeadsConfig` in `config.ts` cannot serve both. Should the backend become stateless with respect to project root (accepting it as a query parameter), or do we scope each workspace to its own backend instance?

### Implementation

**Q13. Can we reuse `react-resizable-panels` for the tree, or do we need a tree widget library?**
The existing codebase uses `react-resizable-panels` for layout but has no tree widget. Building a recursive, virtualized, keyboard-navigable file tree from scratch is substantial (500+ lines minimum). Libraries like `react-arborist` or `@tanstack/react-tree` provide this. Trade-off: dependency cost vs development time. Which approach aligns with the project's "no Redux/Zustand" minimalism?

**Q14. How do we handle recursive directory scanning without blocking the backend event loop?**
The current `discoverFormulasInPath()` uses `readdirSync`/`statSync`. Recursing through a large directory tree (e.g., `~/gt/` with thousands of files) with sync I/O will block the Hono server. We need `readdir` with `{ recursive: true }` (Node 20+) or async `opendir`/`walk`. What is the target Node.js version, and what is the maximum expected tree depth?

**Q15. What existing code in `formula-tree.tsx` can be salvaged?**
The current `FormulaTree` has: grouping logic, dirty-state integration, unsaved-changes modal, keyboard navigation, loading/error/empty states, and hover styling. The tree structure changes completely, but dirty-state tracking, the unsaved-changes modal, and the loading skeleton pattern should be reusable. The SVG icons and inline styles are what the brief wants to fix -- those get replaced.

**Q16. How do we implement the folder picker UI without native OS dialogs?**
Since we cannot pop open a native folder picker from the browser, we have two options: (a) a text input where the user types a path, with autocomplete from a backend endpoint that lists directories, or (b) a modal with a tree-browser that navigates the filesystem via backend calls. Option (b) is much more work but much better UX. Which do we build?

**Q17. What icon system replaces the current hand-rolled SVGs?**
The brief says "janky icons" and "broken alignment." The current code has inline SVG components (FolderIcon, FileCodeIcon, ChevronIcon) with hardcoded viewBox/stroke. Should we switch to an icon library (lucide-react, @phosphor-icons/react, VS Code codicons) or keep inline SVGs but fix the rendering? An icon library adds a dependency but guarantees consistency.

**Q18. How does the dirty-state tracking change for a tree model?**
Currently `useFormulaDirty()` is keyed by formula name (a simple string). In a tree model, a dirty file should also visually "bubble up" to its parent folders (like VS Code showing a dot on the folder containing modified files). This requires the dirty context to understand the tree hierarchy, not just flat names.

**Q19. What is the migration path for existing users who have the current sidebar layout?**
If `localStorage` has saved panel sizes and collapsed state from the old UI, the new UI must handle those gracefully. The storage key `beads-ide-panel-sizes` will persist; if the sidebar structure changes dramatically, stale cached sizes could cause layout issues. Do we version the storage key or add migration logic?

**Q20. How do we handle the case where the selected root folder is deleted or unmounted?**
If the user selects `~/gt/myproject` and that folder gets removed, the backend tree endpoint will error. The frontend needs graceful degradation: show the onboarding screen again, display a "folder not found" error, or prompt to re-select. This is an edge case but must be handled.

**Q21. What changes are needed in the shared types package?**
`FormulaListItem` currently has `name`, `path`, `searchPath`, `searchPathLabel`. A tree node needs additional fields: `type` (file/directory), `children` (for directories), `depth`, possibly `isExpanded`. Do we add new types (`TreeNode`, `FileTreeResponse`) to `@beads-ide/shared`, or keep tree types frontend-only?

**Q22. Should the backend "Open Folder" / root-change be a restart or a hot-reload?**
Currently the config is cached with `getConfig()` and only cleared via `clearConfigCache()`. Changing the project root at runtime means invalidating all cached state, re-scanning formula paths, and notifying the frontend to refetch. Do we use WebSockets for push notification, or does the frontend poll?

### Performance

**Q23. What is the expected file count for a typical workspace root?**
If users point the tree at `~/gt/` which has 50,000+ files across many projects, returning the entire tree in one API call is infeasible. We need to understand the expected scale. Should the tree use lazy loading (expand-on-click fetches children) or load everything upfront? Lazy loading is more complex but necessary for large workspaces.

**Q24. Should the tree be virtualized to handle large directories?**
Rendering 500+ tree nodes in the DOM causes jank, especially with hover effects and icons. Libraries like `react-window` or `react-arborist` provide virtualization. The current sidebar renders all items eagerly. At what node count does this become a problem, and should we virtualize from day one?

**Q25. How often should the tree refresh to pick up filesystem changes?**
Currently `useFormulas()` fetches once on mount. If the user creates a new `.formula.toml` file via their terminal, the sidebar does not update. Options: manual refresh button, polling interval, or filesystem watcher (backend uses `fs.watch`/`chokidar` and pushes changes via SSE/WebSocket). Polling is simple; watchers are more responsive but add complexity.

**Q26. What is the cost of recursive `readdirSync` on large directories?**
Profiling `readdirSync` with `{ recursive: true }` on a directory with 10,000 entries can take 100-500ms. If this blocks the Hono request handler, all other API calls stall. Should we use a worker thread, pre-scan on startup and cache, or use async iteration? This is the single biggest performance risk.

**Q27. Should we cache the tree structure and serve diffs?**
After the initial full scan, subsequent requests could return only changes (added/removed/renamed files). This reduces payload size and frontend re-render cost. However, implementing a diff protocol is complex. Is this over-engineering for v1, or is it necessary for responsiveness?

**Q28. Will the "Open Folder" action block the UI while scanning?**
When the user picks a new root folder, the backend needs to scan it. If the scan takes 2 seconds, the frontend needs a loading state. Currently the loading skeleton is optimized for the flat formula list. The tree loading state needs to show progressive population or a spinner. How do we prevent the UI from feeling frozen?

**Q29. What is the payload size for the tree API response?**
Each tree node needs at minimum: `name`, `path`, `type`, `children`. For 5,000 files, a naive JSON response could be 500KB+. Should we paginate, use a flat list with parent references (more compact), or a nested structure (easier to render)? Wire format matters for perceived performance.

**Q30. Should we debounce tree expansion to prevent rapid API calls?**
If each directory expansion triggers a backend call (lazy loading model), a user rapidly clicking through directories could fire dozens of concurrent requests. Debouncing or queuing requests prevents server overload. But it also makes the UI feel sluggish. What is the right balance?

**Q31. How does the tree interact with the existing formula fetch for cook/sling operations?**
Cook and Sling need a formula path. Currently they use `findFormulaByName()` which searches the known search paths. If the user selects a formula from the tree (which might be outside the traditional search paths), the backend needs to accept the full path, not just the name. This changes the API contract for cook/sling/pour endpoints.

**Q32. Can we preload the tree for commonly used workspace roots?**
If the IDE remembers recently opened folders (like VS Code's "Recent" list), we could preload the tree structure for the last-used folder on backend startup. This eliminates the scan-on-open delay for returning users. But it assumes the folder still exists and has not changed. Is the complexity worth the UX gain?

### Maintainability

**Q33. How do we test the tree component with deeply nested structures?**
The current test setup (Vitest + Playwright) can test the flat formula list easily. Testing a recursive tree with expand/collapse, drag-and-drop potential, keyboard navigation, and lazy loading requires more sophisticated test fixtures. Do we create a mock filesystem backend, or use msw to intercept tree API calls?

**Q34. What happens when the tree API contract changes?**
The frontend and backend share types via `@beads-ide/shared`. Adding tree-specific types creates a new surface area for breaking changes. If the backend changes the tree response shape, the frontend breaks silently (current pattern: "No response payload validation -- trust backend structure"). Should we add runtime validation (zod) for tree responses?

**Q35. How do we prevent the sidebar from becoming a second monolith?**
`formula-tree.tsx` is already 507 lines. The new tree component with onboarding, folder picker, recursive rendering, lazy loading, and dirty-state integration could easily become 1000+ lines. What is the file/component decomposition strategy, and how do we enforce it? Should we create a `components/explorer/` directory?

**Q36. What documentation is needed for the "Open Folder" / workspace model?**
The current README and code comments assume a fixed search-path model. Introducing user-selected roots changes the mental model for contributors. We need: architecture decision record for the workspace model, API docs for new endpoints, and inline comments explaining the folder resolution logic.

**Q37. How do we handle regressions in the existing formula operations?**
Cook, Sling, Pour, and Burn all depend on `findFormulaByName()` which uses the existing search-path model. If the tree introduces formulas from arbitrary paths, these operations might fail because they cannot resolve the formula. We need integration tests covering: formula from traditional search path, formula from arbitrary tree location, formula that moves between paths.

**Q38. What is the strategy for styling the new tree consistently?**
The codebase has mixed styling: inline CSSProperties objects in `formula-tree.tsx`, Tailwind classes in the landing page, and CSS custom properties in `app.css`. The brief asks to fix "janky" icons and "broken alignment." Should the new tree use Tailwind exclusively (matching the landing page), inline styles (matching the existing sidebar), or CSS modules? Consistency requires a deliberate choice.

**Q39. How do we version the workspace configuration for backward compatibility?**
If we store workspace root in localStorage or a config file, future changes to the schema need migration. Version 1 might store `{ root: "/path" }`, version 2 might add `{ root: "/path", excludePatterns: [...], showHidden: false }`. Without a version field and migration logic, stale configs cause subtle bugs.

**Q40. What accessibility requirements does the tree introduce?**
The current sidebar has basic ARIA: `role="group"`, `aria-expanded`, `aria-pressed`, `aria-label`. A file tree needs the `tree` and `treeitem` ARIA roles, `aria-level` for depth, `aria-setsize`/`aria-posinset` for position, and proper keyboard navigation (Arrow keys for navigation, Enter to open, Home/End for first/last). This is a significant a11y undertaking. Do we follow WAI-ARIA Treeview pattern exactly?

**Q41. How do we ensure the onboarding flow is not shown to returning users?**
The onboarding screen ("New Project" / "Open Folder") should appear on first launch but not on subsequent launches if the user already has a workspace open. If we use localStorage, clearing browser data shows onboarding again (annoying for power users). If we use a backend config file, the onboarding state is machine-global (wrong for multi-user). What is the right persistence strategy?

**Q42. What is the testing strategy for cross-platform path handling?**
The backend uses `resolve`, `join`, `dirname` from `node:path`. On Windows, paths use backslashes; on Mac/Linux, forward slashes. If the tree shows paths in the UI, they need to be normalized. The current code assumes Unix paths everywhere. Do we need to handle Windows compatibility, or is this strictly a Mac/Linux tool?

**Q43. How do we monitor for performance regressions in the tree?**
The codebase has `lib/graph-benchmark.ts` for graph performance. Should we add similar benchmarks for tree rendering (time to expand 100 nodes, time to filter, time for initial load)? Without benchmarks, performance regressions in the tree will only surface as user complaints.

**Q44. What is the plan for feature flags or gradual rollout?**
Given the scope (new onboarding, new tree, new backend endpoints, changed API contracts), should we build behind a feature flag? This allows shipping incrementally: first the tree without onboarding, then onboarding, then the icon fixes. Without flags, it is all-or-nothing, which increases deployment risk.

### Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large directory scanning blocks backend | High | Async I/O, worker threads, lazy loading |
| Browser cannot do native folder picker | Medium | Backend-powered folder browser or text input with autocomplete |
| Breaking existing search-path model | High | Layer tree on top of search paths; keep backward compat |
| Tree component becomes unmaintainable monolith | Medium | Strict component decomposition up front |
| Accessibility regression in tree widget | Medium | Follow WAI-ARIA Treeview pattern; automated a11y tests |
| Mixed styling approach causes inconsistency | Low | Decide Tailwind vs inline before writing code |
| No runtime type validation for tree API | Medium | Add zod schemas for new endpoints |
| Stale workspace config after folder deletion | Low | Health check on startup, graceful fallback to onboarding |

---

## Cross-Perspective Themes

### Theme 1: Backend/Frontend State Alignment
Multiple perspectives identified tension between frontend folder selection and backend formula discovery. The User Advocate warns about inconsistency ("the sidebar will show one thing and the API will operate on another"), the Product Designer questions "How should the 'Open Folder' action relate to the backend's search path configuration?", and the Tech Lead directly asks whether the feature breaks the existing multi-search-path model. This is the single biggest architectural risk and must be resolved upfront with a clear decision on whether to replace, layer, or coexist with the current search-path model.

### Theme 2: Onboarding Persistence and State Management
All three perspectives emphasized that users must not re-do onboarding on every visit. The User Advocate points out "users will be frustrated and question the tool's reliability," the Product Designer questions where state lives and how it persists, and the Tech Lead asks which persistence layer (localStorage, backend config, .beads/workspace.json) is correct. This is not a minor UX detail -- it's essential for first-launch success and returning user experience.

### Theme 3: Filesystem Scale and Performance
Both the Product Designer and Tech Lead identified performance as a critical constraint. The Designer questions "what is the expected file count?" and "should we virtualize from day one?", while the Tech Lead details specific risks: "recursive readdirSync on 10,000 entries can take 100-500ms" and "rendering 500+ tree nodes causes jank." The User Advocate corroborates by noting "users will perceive lag" if the tree takes >200ms to populate. Performance is not a v2 concern; it must be addressed in the design phase.

### Theme 4: Confusing Domain Terminology ("Gas Town" vs "User" Formulas)
All three perspectives flagged the opacity of current labels. The User Advocate asks "Can users with cognitive disabilities understand the distinction?", the Product Designer notes "the current labels are opaque" and "users have no idea what that means," and the Tech Lead acknowledges this is confusing and must be resolved (renamed, removed, or explained). Replacing these labels with clear, self-explanatory terms (e.g., "Shared Formulas" vs "My Formulas" or "Project Formulas" vs "External Formulas") is a high-priority item for all three perspectives.

### Theme 5: Empty State and First-Launch Friction
The Advocate, Designer, and Tech Lead all emphasized the criticality of the first-launch experience. The Advocate describes it as the "vulnerable moment" where users have committed to trying the tool but gotten nothing back. The Designer calls it "the single most critical gap -- the app provides zero pathway from 'I just opened this' to 'I am productive.'" The Tech Lead asks "where does the onboarding state live?" reflecting the need for clear design. A comprehensive onboarding flow with helpful empty states is not optional; it's necessary for user retention.
