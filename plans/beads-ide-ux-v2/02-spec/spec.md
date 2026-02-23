# beads-ide-ux-v2 - Design Specification

**Created:** 2026-02-23
**Status:** Validated
**Brainstorming Mode:** With scope questions (P0 + P1)

---

## Overview

Beads IDE UX v2 is a comprehensive UI/UX improvement initiative for the Beads IDE formula editor and molecule visualizer. The project addresses five interconnected areas: expansion group visualization, accessibility improvements, visual polish, UX flow improvements, and an inline step editor panel.

**Problem:** The current IDE has functional but unpolished UX patterns that create friction for daily users. Specific pain points include unclear grouping visualization, accessibility gaps (missing form labels, no skip navigation), inconsistent visual styling, no unsaved changes protection, and context-switching overhead between text and visual editing modes.

**Target Users:** All three personas equally - developers authoring formulas, operators running and monitoring execution, and managers reviewing results. The UX must serve authoring efficiency, monitoring clarity, and overview comprehension without favoring one over others.

**Core Value:** A more polished, accessible, and efficient IDE that reduces cognitive load when working with complex formulas while maintaining the power of the underlying formula/bead system.

---

## Scope Questions & Answers

### Summary
- **Questions addressed:** 38 (P0 + P1) — all complete
- **Auto-answered (best practices):** 23
- **Human decisions:** 15 (includes Q31, Q35 added post-review)
- **Deferred to P2/P3:** 51

### P0: Critical Decisions

| # | Question | Answer | How Decided |
|---|----------|--------|-------------|
| 1 | Conflict resolution for dual editing surfaces? | N/A - architecture prevents conflicts. TOML is single source of truth; both surfaces write to same state. | Codebase analysis - `formula.$name.tsx` shows unified state |
| 2 | Source of truth in visual mode? | TOML text. Visual builder is read-only projection; step editor writes to TOML. | Codebase - VS Code model already implemented |
| 3 | Step editor replaces or supplements text editor? | Supplements. Text/visual modes are mutually exclusive. Panel only appears in visual/flow modes. | Codebase - view modes are exclusive |
| 4 | Unsaved changes scope? | Formula content only. Layout, zoom, panel state not tracked as "unsaved." | Human choice - reduces warning noise |
| 5 | Auto-save or explicit save? | Explicit save (VS Code model). Cmd+S to save, unsaved indicator, warning on navigation. | Human choice - user control prioritized |
| 6 | Pour/sling with unsaved changes? | Warn and let user choose: "Save and Execute / Execute Without Saving / Cancel" | Human choice - safety with options |
| 7 | Navigation away with unsaved changes? | VS Code convention: modal dialog with Save / Don't Save / Cancel. Browser beforeunload for tab close. | Best practice - universal editor pattern |
| 8 | Screen reader navigation of formula structure? | Outline view as accessible tree with ARIA tree roles. Step editor with proper form labels. Live region announcements. | Best practice - WAI-ARIA, GitHub model |
| 9 | Keyboard navigation in visual mode? | Arrow keys for DAG traversal (Up/Down upstream/downstream, Left/Right siblings). Tab within nodes. Enter opens step editor. Escape deselects. | Best practice - ReactFlow + DAG-aware traversal |
| 10 | Color-blind differentiation for groups? | Secondary differentiators: distinct border patterns per group (solid, dashed, dotted, etc.), group number badges in headers. | Best practice - WCAG 1.4.1 |
| 11 | What is an "expansion group" in user terms? | Template instantiation at cook time. Steps from same expansion share ID prefix and are visually grouped. Visual lineage, not runtime scope. | Human clarification - formula docs review |
| 12 | What is a "bead" in user mental model? | Rich work tracking unit with statuses, dependencies, agent coordination. More than task or CI step - unified work/coordination primitive. | Human clarification - schema docs review |
| 13 | Primary user persona? | All three equally: developer, operator, manager. UI must serve authoring, monitoring, and overview. | Human choice - broad applicability |

### P1: Important Decisions

| # | Question | Answer | How Decided |
|---|----------|--------|-------------|
| 14 | Preventing visual overwhelm with complex groups? | Progressive disclosure: collapsed groups by default, expand on click, semantic zoom (auto-collapse when zoomed out), minimap for orientation. | Best practice - n8n, Figma, Miro patterns |
| 15 | Visual hierarchy within expansion groups? | Group header (colored bar + step count) visually distinct from step nodes inside. Already implemented. | Codebase - `visual-builder.tsx` |
| 16 | Cross-group edge visibility at zoom levels? | Always fully visible. Dependencies should never be hidden. | Human choice - prioritize visibility over cleanliness |
| 17 | Color strategy for >6 expansion groups? | Modular cycling (already implemented). Add secondary differentiator (border pattern, number badge) for collision cases. | Codebase + best practice extension |
| 18 | Visual treatment for node states (selected, hovered, focused)? | Three distinct states: Selected (blue border + glow), Hovered (lighter bg + subtle border), Keyboard focused (dashed outline). | Best practice - never rely on color alone |
| 19 | Edit trigger gesture? | Double-click to edit. Single-click selects. Standard convention (Figma, Finder). | Human choice - clear separation of select vs edit |
| 20 | How to dismiss step editor panel? | All of: X button, Escape key, click another node, click empty canvas. | Best practice - VS Code/Figma pattern |
| 21 | Instant save or explicit? | Explicit (Cmd+S). Confirms save model choice #5. | Human choice - consistency with #5 |
| 22 | Cross-group edge highlighting trigger? | On node/group selection. Highlight connected edges, dim others. Standard pattern. | Best practice - ReactFlow, n8n default |
| 23 | Behavior when editing step with filter active? | Keep edited step visible regardless of filter match. Prevents "where did it go?" confusion. | Human choice - Figma pattern recommendation |
| 24 | How users discover keyboard shortcuts? | Three-tier: tooltips on buttons (e.g., "Cook Preview (Cmd+Enter)"), command palette shows shortcuts, first-session hint. | Best practice - VS Code + Figma |
| 25 | Where keyboard shortcut help lives? | All three: ? icon affordance, command palette entry, modal via Cmd+/. | Best practice - VS Code |
| 26 | Can shortcuts panel stay open while working? | Yes - non-modal side panel or pinnable overlay. Must not block workspace. | Best practice - VS Code opens as tab |
| 27 | Mode switch experience with edits? | Instant swap. Edits already in TOML state, so safe to close panel. | Human choice + codebase confirms safety |
| 28 | Mode switch animation? | Instant swap, no animation. Tab-like toggle. No false impression of spatial relationship. | Best practice - VS Code, GitHub, JetBrains |
| 29 | Panel edits on mode switch? | Close panel, edits preserved. Current implementation already writes to TOML state immediately. | Codebase + human confirmation |
| 30 | Design scale? | Medium (50-100 formulas, 20-50 steps). Add search/filter, lazy loading. No full virtualization yet. | Human choice - practical near-term target |
| 31 | Dense cross-group dependency UX at scale? | Progressive reveal: hide cross-group edges by default, show via toggle or on node/group selection. Prevents visual clutter while preserving discoverability. | Human choice - clarity over comprehensive display |
| 32-34, 36-38 | Loading states, error recovery, etc. | See auto-answered table below | Best practices from VS Code, Figma, WCAG |
| 35 | Pour/Sling progress communication? | Log stream in detail panel with elapsed time counter + step status indicators (pending/running/complete icons). Sonner toast on completion. | Human choice - maximum visibility during execution |

### Auto-Answered Questions (Best Practices)

| # | Question | Answer | Source |
|---|----------|--------|--------|
| 32 | Zero expansion groups handling? | Flat DAG, already works | Codebase |
| 33 | Loading states descriptive? | Yes - "Loading formula...", "Cooking...", "Saving..." | Extend existing pattern |
| 34 | Slow loading experience? | Skeleton UI + progress text + cancellable for >5s | Industry standard |
| 36 | Error recovery on save failure? | Keep edit in form, inline error, red border, "Revert" option | Standard form validation |
| 37 | Opening malformed TOML? | Land in text mode with error highlighting | VS Code pattern |
| 38 | Circular dependency in step editor? | Validate immediately, disable invalid options with tooltip | n8n, GitHub Actions |

---

## Design

### Architecture Overview

The design preserves and extends the existing TOML-as-source-of-truth architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOML Content State                        │
│                    (Single Source of Truth)                      │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌───────────┐       ┌─────────────┐      ┌──────────────┐
   │Text Editor│       │Visual Builder│      │Step Editor   │
   │(CodeMirror)│      │(ReactFlow)  │      │Panel         │
   │ read/write │      │ read-only   │      │ read/write   │
   └───────────┘       └─────────────┘      └──────────────┘
```

**Key Decisions:**
1. Text and visual modes remain mutually exclusive (toggle)
2. Step editor panel writes directly to TOML state via `updateStepField()`
3. No conflict resolution needed - single data path
4. Explicit save model - changes live in memory until Cmd+S

### Components

**Component 1: Step Editor Panel**
- **Responsibility:** Inline editing of step properties in visual/flow modes
- **Location:** Right side panel (resizable), appears when node double-clicked
- **Fields:** ID (read-only), Title, Description, Priority (0-4), Dependencies (NeedsSelector)
- **States:** closed, loading, editing, saving, save-success, save-error
- **Behavior:** Double-click node to open, Escape/X/click-away to close

**Component 2: Expansion Group Visualization**
- **Responsibility:** Visual grouping of steps from same expansion
- **Visual treatment:** Container node with colored header (group name + step count)
- **Colors:** 6-color palette with modular cycling + secondary differentiators (border patterns)
- **Interaction:** Click header to select group, double-click node inside to edit
- **Accessibility:** Number badges + distinct border patterns for color-blind users

**Component 3: Unsaved Changes System**
- **Scope:** Formula content only (not layout/zoom)
- **Indicators:** Dot in sidebar, modified title, header badge
- **Triggers:** Any TOML state change (via text or panel edit)
- **Navigation warning:** Modal with Save / Don't Save / Cancel
- **Pour/Sling warning:** "You have unsaved changes. Save and Execute / Execute Without Saving / Cancel"

**Component 4: Keyboard Shortcuts System**
- **Discovery:** Tooltips on toolbar buttons, command palette hints, first-session toast
- **Help panel:** ? icon (bottom-right), Cmd+/ modal, command palette entry
- **Panel behavior:** Non-modal, pinnable, searchable
- **Core shortcuts:** Cmd+S (save), Cmd+Z (undo), Cmd+K (command palette), Escape (deselect/close)

**Component 5: Accessibility Improvements**
- **Skip navigation:** "Skip to main content" link, visible on focus
- **Form labels:** All inputs use `<label htmlFor>` properly
- **Semantic structure:** Tree roles for outline view, landmarks for panels
- **Reduced motion:** Respect `prefers-reduced-motion`, replace animations with instant transitions
- **Keyboard nav:** Arrow keys for DAG traversal, Tab within nodes, Enter to edit, Escape to deselect

### Data Model

No schema changes required. All features work with existing structures:

- **TOML content:** Stored in React state, written to disk on explicit save
- **View preferences:** localStorage (panel sizes, last view mode)
- **Expansion groups:** Derived from step ID prefixes at render time (no new storage)

### User Flows

**Flow 1: Editing a Step in Visual Mode**
1. User views formula in visual mode
2. Single-click node to select (shows outline, highlights edges)
3. Double-click node to open step editor panel
4. Edit fields (Title, Description, Priority, Dependencies)
5. Changes reflect immediately in TOML state
6. Press Escape or click away to close panel
7. Unsaved indicator appears
8. Cmd+S to save to disk

*Acceptance Criteria:*
- [ ] Given: User is in visual mode. When: User single-clicks a node. Then: Node shows blue selection border + glow, connected edges highlight.
- [ ] Given: User has a node selected. When: User double-clicks the node. Then: Step editor panel opens within 100ms.
- [ ] Given: Step editor is open. When: User edits any field. Then: Unsaved indicator appears in sidebar and header.
- [ ] Given: User has edited fields. When: User presses Escape. Then: Panel closes, changes remain in state (not discarded).
- [ ] Given: Unsaved changes exist. When: User presses Cmd+S. Then: File saves, unsaved indicator disappears, success toast appears.

**Flow 2: Handling Unsaved Changes on Navigation**
1. User has unsaved changes (indicator visible)
2. User tries to navigate away (sidebar, browser back, close tab)
3. Modal appears: "You have unsaved changes"
4. Options: Save (saves then navigates), Don't Save (discards then navigates), Cancel (stays)

*Acceptance Criteria:*
- [ ] Given: Unsaved changes exist. When: User clicks a different formula in sidebar. Then: Modal appears with three buttons.
- [ ] Given: Modal is shown. When: User clicks "Save". Then: File saves, navigation proceeds, user lands on new formula.
- [ ] Given: Modal is shown. When: User clicks "Don't Save". Then: Changes discarded, navigation proceeds.
- [ ] Given: Modal is shown. When: User clicks "Cancel" or presses Escape. Then: Modal closes, user stays on current formula, changes preserved.
- [ ] Given: Unsaved changes exist. When: User closes browser tab. Then: Browser `beforeunload` dialog appears.

**Flow 3: Discovering Keyboard Shortcuts**
1. User hovers toolbar button, sees tooltip with shortcut hint
2. User opens command palette (Cmd+K), sees shortcuts next to each action
3. First session: subtle toast "Tip: Press Cmd+/ for keyboard shortcuts"
4. User presses Cmd+/ or clicks ? icon
5. Shortcuts panel opens as non-modal overlay
6. User can pin it for reference while working

*Acceptance Criteria:*
- [ ] Given: User hovers any toolbar button. When: Tooltip appears. Then: Tooltip includes keyboard shortcut (e.g., "Cook Preview (Cmd+Enter)").
- [ ] Given: User has never used IDE before. When: Page loads. Then: Toast appears within 5s: "Tip: Press Cmd+/ for keyboard shortcuts".
- [ ] Given: User presses Cmd+/. When: Shortcuts panel opens. Then: Panel is non-modal (user can still interact with canvas).
- [ ] Given: Shortcuts panel is open. When: User clicks pin icon. Then: Panel remains visible across mode switches.

**Flow 4: Navigating with Screen Reader**
1. User focuses the page, skip link appears
2. User activates skip link to jump to main content
3. User navigates to outline view (accessible tree)
4. Arrow keys navigate tree structure
5. Enter on step opens step editor panel
6. Form fields have proper labels read by screen reader
7. Live region announces changes (step selected, saved, etc.)

*Acceptance Criteria:*
- [ ] Given: Page loads. When: User presses Tab once. Then: "Skip to main content" link is visible and focused.
- [ ] Given: Skip link is focused. When: User presses Enter. Then: Focus moves to main content area.
- [ ] Given: User is in outline view. When: Screen reader reads the tree. Then: Each node announces its role ("tree item"), name, and position ("3 of 5").
- [ ] Given: Step editor is open. When: Screen reader reads form. Then: Each input is announced with its label (not just "text field").
- [ ] Given: User saves a file. When: Save completes. Then: Live region announces "Formula saved" (aria-live="polite").

**Flow 5: Executing Pour/Sling with Progress Feedback**
1. User clicks Pour or Sling button
2. If unsaved changes, warning modal appears (per Flow 2 pattern)
3. Execution starts, detail panel shows log stream
4. Elapsed time counter updates every second
5. Step status indicators show pending → running → complete
6. On completion, Sonner toast announces success/failure
7. Log stream persists for review

*Acceptance Criteria:*
- [ ] Given: User clicks Pour. When: Execution starts. Then: Detail panel opens (if closed) showing log stream.
- [ ] Given: Execution is running. When: Time passes. Then: Elapsed counter increments (format: "0:42" or "1:23:45").
- [ ] Given: Execution is running. When: A step completes. Then: Step status icon changes from spinner to checkmark.
- [ ] Given: Execution completes successfully. When: All steps done. Then: Sonner toast "Pour completed in X:XX" appears.
- [ ] Given: Execution fails. When: Error occurs. Then: Sonner toast "Pour failed: [reason]" appears, log stream shows error.

### Performance Budgets

Target metrics for the design scale (50-100 formulas, 20-50 steps):

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Mode switch (text ↔ visual) | < 100ms | Time from click to render complete |
| Node selection response | < 50ms | Time from click to visual feedback |
| Step editor panel open | < 100ms | Time from double-click to panel visible |
| Initial formula render (50 steps) | < 1s | Time from route load to interactive |
| Save to disk | < 500ms | Time from Cmd+S to success toast |
| Search/filter response | < 100ms | Time from keystroke to filtered results |

These budgets apply to a typical development machine. Formulas exceeding the scale target (20-50 steps) may have degraded performance; this is acceptable for v2.

### Accessibility Conformance

**Target:** WCAG 2.1 Level AA

This means:
- **Contrast:** 4.5:1 for normal text, 3:1 for large text and UI components
- **Focus indicators:** Visible focus ring on all interactive elements
- **Keyboard access:** All functionality available via keyboard
- **Screen reader:** Semantic structure, proper labels, live region announcements
- **Motion:** Respect `prefers-reduced-motion` media query

Level AAA conformance (e.g., 7:1 contrast, sign language) is not targeted for v2.

### Error Handling

**TOML Parse Errors:**
- Display: CodeMirror red squiggles + problems banner
- Recovery: User edits text to fix error
- Visual mode: Disabled until parse succeeds

**Save Failures:**
- Display: Inline error below field, red border, toast notification
- Recovery: Keep edit in form, offer "Retry" and "Revert to last saved"

**Circular Dependencies:**
- Prevention: NeedsSelector validates immediately, disables invalid options
- Display: Tooltip on disabled option: "Adding this would create a cycle: A -> B -> ... -> A"

**Empty States:**
- No formula: "Select a formula from the sidebar or create a new one"
- No search results: "No formulas match your search. Try a different term."
- No selected step: Step editor panel shows placeholder: "Double-click a step to edit"

### Integration Points

**Existing Components to Leverage:**
- `visual-builder.tsx` - Extend for group container improvements
- `step-editor-panel.tsx` - Already implemented, needs state refinements
- `command-palette.tsx` - Add shortcuts display
- `formula.$name.tsx` - Add unsaved state management
- MiniMap component - Already available, ensure it works with groups

**Patterns to Follow:**
- Sonner for toast notifications (already in use)
- react-resizable-panels for panel layouts (already in use)
- Tailwind color system for theming (already in use)

---

## Out of Scope

The following were considered but explicitly excluded from this version:

- **Real-time collaboration** - Multi-user editing requires significant infrastructure
- **Formula versioning/history** - Useful but adds complexity; use git for now
- **Dark/light theme toggle** - Focus on dark theme polish only
- **Mobile/tablet support** - 3-panel layout doesn't translate; desktop-first
- **Offline editing** - Formulas are local files already; no special handling
- **Plugin/extension system** - Future consideration
- **Variable/placeholder visual editing** - Template vars edited in text mode only
- **Cross-formula dependency visualization** - Within-formula only for v2

---

## Open Questions

Questions that emerged during brainstorming needing future resolution:

- [ ] Should the outline view replace or complement the DAG view? (Currently: complement)
- [ ] How to handle formulas with recursive instantiation in visualization?
- [ ] What about formula templates/presets for common patterns?
- [ ] Performance profiling needed for 50+ step formulas with groups

---

## Next Steps

Recommended path forward:

1. [x] Run multimodal spec review (Step 4 of pipeline) to catch gaps
2. [x] Address findings from review (Q31, Q35, acceptance criteria, performance budgets, WCAG level)
3. [ ] Create implementation beads (design-to-beads)
4. [ ] Prioritize: accessibility fixes first (quick wins), then unsaved changes, then visual polish

---

## Appendix: Source Files

- `plans/beads-ide-ux-v2/01-scope/questions.md` - Synthesized 89-question backlog
- `plans/beads-ide-ux-v2/01-scope/context.md` - Codebase context analysis
- `plans/beads-ide-ux-v2/01-scope/question-triage.md` - Triage: 25 auto-answered, 13 human decisions
- `plans/beads-ide-ux-v2/01-scope/opus-questions.md` - Opus 4.6 raw analysis
- `plans/beads-ide-ux-v2/01-scope/gpt-questions.md` - GPT 5.3 raw analysis
- `docs/beads.md` - Bead schema reference
- `docs/formulas.md` - Formula/expansion system reference
