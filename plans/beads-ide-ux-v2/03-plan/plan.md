# Implementation Plan: beads-ide-ux-v2

**Created:** 2026-02-23
**Spec:** plans/beads-ide-ux-v2/02-spec/spec.md
**Status:** Draft

---

## Overview

This plan implements the 5 components from the spec:
1. Step Editor Panel improvements
2. Expansion Group Visualization enhancements
3. Unsaved Changes System
4. Keyboard Shortcuts System
5. Accessibility Improvements

Total estimated effort: 8-12 implementation days across 5 phases.

---

## Phase 0: Prerequisites (Blockers)

**Goal:** Fix critical blockers before main implementation.

### 0.1 Add saveFormula() API Function
- **File:** `apps/frontend/src/lib/api.ts`
- **Add:** Export function calling `PUT /api/formulas/:name`
- **Effort:** 10 minutes
- **Acceptance:** Function exported, can be imported by hooks

### 0.2 Performance Baseline Measurement
- **Files:** Key routes and components
- **Measure:**
  - Mode switch latency (text ↔ visual)
  - Node selection response time
  - Initial render time (50-step formula)
- **Output:** Baseline metrics documented
- **Acceptance:** Numbers recorded for post-implementation comparison

**Phase 0 Dependencies:** None
**Phase 0 Outputs:** API ready, baseline metrics recorded

---

## Phase 1: Save Infrastructure (P0 - Foundation)

**Goal:** Enable explicit save with dirty state tracking. All other features depend on this.

### 1.1 Create useSave Hook
- **File:** `apps/frontend/src/hooks/use-save.ts`
- **Pattern:** Mirror existing `use-sling.ts` structure
- **API:** `PUT /api/formulas/:name` with `{ content: string }`
- **Returns:** `{ save, isLoading, error, lastSaved }`
- **Acceptance:** Hook callable, API responds 200, file written to disk

### 1.2 Add Dirty State Tracking
- **File:** `apps/frontend/src/routes/formula.$name.tsx`
- **Changes:**
  - Add `savedContent` state (set on load and after save)
  - Compute `isDirty = tomlContent !== savedContent`
  - Pass `isDirty` to header/sidebar components
- **Acceptance:** `isDirty` true after any edit, false after save

### 1.3 Wire Cmd+S Shortcut
- **File:** `apps/frontend/src/routes/formula.$name.tsx`
- **Use:** `useHotkey('mod+s', handleSave)`
- **Behavior:** Call `save(tomlContent)`, show toast on success/error
- **Acceptance:** Cmd+S triggers save, toast appears, `isDirty` becomes false

### 1.4 Add Unsaved Indicator
- **Files:**
  - `apps/frontend/src/components/layout/formula-tree.tsx` (sidebar dot)
  - `apps/frontend/src/routes/formula.$name.tsx` (header badge)
- **Visual:** Small dot next to formula name, asterisk in title
- **Acceptance:** Indicator visible when `isDirty`, hidden when saved

### 1.5 Add beforeunload Handler
- **File:** `apps/frontend/src/routes/formula.$name.tsx`
- **Effect:** `useEffect` adding `beforeunload` listener when `isDirty`
- **Acceptance:** Browser shows native dialog on tab close with unsaved changes

### 1.6 Implement Double-Click to Edit
- **File:** `apps/frontend/src/components/formulas/visual-builder.tsx`
- **Change:** Single-click selects node, double-click opens step editor
- **Pattern:** Use click timing or `onDoubleClick` event
- **Acceptance:** Single-click shows selection outline, double-click opens panel

**Phase 1 Dependencies:** Phase 0 (saveFormula)
**Phase 1 Outputs:** Working save, visible dirty state, browser protection

---

## Phase 2: Navigation Protection (P0 - Data Safety)

**Goal:** Prevent accidental data loss when navigating away.

### 2.1 Create Unsaved Changes Modal
- **File:** `apps/frontend/src/components/ui/unsaved-changes-modal.tsx`
- **Props:** `{ isOpen, onSave, onDiscard, onCancel }`
- **UI:** Dialog with "You have unsaved changes" + 3 buttons
- **Acceptance:** Modal renders, buttons trigger callbacks, Escape cancels

### 2.2 Add Navigation Guard to Sidebar
- **File:** `apps/frontend/src/components/layout/formula-tree.tsx`
- **Changes:**
  - Accept `isDirty` and `onNavigate` props
  - Check `isDirty` before `window.history.pushState`
  - If dirty, show modal via callback
- **Acceptance:** Clicking another formula with unsaved changes shows modal

### 2.3 Handle Modal Actions
- **File:** `apps/frontend/src/routes/formula.$name.tsx`
- **Save:** Call save API, wait, then navigate
- **Discard:** Reset `tomlContent` to `savedContent`, then navigate
- **Cancel:** Close modal, stay on current formula
- **Acceptance:** All 3 flows work correctly

### 2.4 Pour/Sling Unsaved Warning
- **Files:** `apps/frontend/src/routes/formula.$name.tsx`
- **Check:** Before opening Pour/Sling dialog, check `isDirty`
- **Modal:** "Save and Execute / Execute Without Saving / Cancel"
- **Acceptance:** Warning appears, all 3 options work

**Phase 2 Dependencies:** Phase 1 (dirty state, save)
**Phase 2 Outputs:** Full navigation protection

---

## Phase 3: Keyboard & Accessibility (P0 - Compliance)

**Goal:** WCAG 2.1 AA compliance and keyboard-first interaction.

### 3.1 Add Skip Navigation Link
- **File:** `apps/frontend/src/routes/__root.tsx`
- **Element:** `<a href="#main-content" className="skip-link">Skip to main content</a>`
- **Styling:** Hidden by default, visible on `:focus`
- **Target:** Add `id="main-content"` to main panel in app-shell
- **Acceptance:** Tab once shows link, Enter skips to main

### 3.2 Fix Form Labels
- **File:** `apps/frontend/src/components/formulas/step-editor-panel.tsx`
- **Changes:**
  - Add `id` to each input
  - Change `<label>` to `<label htmlFor="input-id">`
  - Remove redundant `aria-label` where `htmlFor` exists
- **Acceptance:** Screen reader announces label when input focused

### 3.3 Add Live Region Announcements
- **File:** `apps/frontend/src/routes/__root.tsx` or new hook
- **Create:** `aria-live="polite"` region for status messages
- **Announce:**
  - "Formula saved"
  - "[Step name] selected"
  - "Unsaved changes"
- **Acceptance:** VoiceOver/NVDA announces state changes

### 3.4 DAG Arrow Key Navigation
- **File:** `apps/frontend/src/components/formulas/visual-builder.tsx`
- **Handler:** `onKeyDown` on container div
- **Keys:**
  - ArrowUp: Select first upstream dependency
  - ArrowDown: Select first downstream dependent
  - ArrowLeft/Right: Cycle siblings (same wave)
  - Enter: Open step editor panel
  - Escape: Deselect
- **Graph:** Use existing dagre edges to compute neighbors
- **Acceptance:** Arrow keys navigate DAG, focus visible on nodes

### 3.5 Respect prefers-reduced-motion
- **File:** `apps/frontend/src/index.css` or Tailwind config
- **Media query:** `@media (prefers-reduced-motion: reduce)`
- **Apply:** Disable transitions, animations, set `transition: none`
- **Acceptance:** No animations when OS setting enabled

### 3.6 Add Outline View Tree Semantics
- **File:** `apps/frontend/src/components/formulas/formula-outline-view.tsx`
- **Add:** ARIA tree roles (`role="tree"`, `role="treeitem"`, `aria-level`, `aria-posinset`, `aria-setsize`)
- **Behavior:** Arrow keys navigate tree, screen reader announces position
- **Acceptance:** VoiceOver reads "Step X, tree item, 3 of 5, level 2"

**Phase 3 Dependencies:** None (can parallel with Phase 2)
**Phase 3 Outputs:** WCAG 2.1 AA compliant interface

---

## Phase 4: Keyboard Shortcuts Discovery (P1 - UX Polish)

**Goal:** Help users discover and remember shortcuts.

### 4.1 Add Shortcut Tooltips
- **Files:** All toolbar buttons
- **Pattern:** `title="Cook Preview (Cmd+Enter)"` or tooltip component
- **Shortcuts to document:**
  - Cmd+S - Save
  - Cmd+K - Command palette
  - Cmd+Enter - Cook preview
  - Cmd+Shift+S - Sling
  - Escape - Deselect/close
- **Acceptance:** Hover shows shortcut in tooltip

### 4.2 Create Shortcuts Panel
- **File:** `apps/frontend/src/components/ui/shortcuts-panel.tsx`
- **Content:** Categorized list of all shortcuts
- **Trigger:** Cmd+/ or ? icon click
- **UI:** Non-modal overlay, searchable, pinnable
- **Acceptance:** Panel opens, shows all shortcuts, can pin

### 4.3 Add First-Session Toast
- **File:** `apps/frontend/src/routes/formula.$name.tsx`
- **Check:** `localStorage.getItem('beads-ide-shortcuts-shown')`
- **Toast:** "Tip: Press Cmd+/ for keyboard shortcuts" (Sonner)
- **Set:** `localStorage.setItem(...)` after showing
- **Acceptance:** Toast shows once per browser, never again

### 4.4 Extend Command Palette
- **File:** `apps/frontend/src/components/layout/command-palette.tsx`
- **Add:** Shortcut hints next to each action (right-aligned, muted)
- **Example:** "Cook Preview" ... "Cmd+Enter"
- **Acceptance:** Shortcuts visible in palette

**Phase 4 Dependencies:** Phase 1 (for Cmd+S to work)
**Phase 4 Outputs:** Full shortcut discoverability

---

## Phase 5: Visual Polish & Progress (P1 - Experience)

**Goal:** Expansion group refinements and Pour/Sling progress.

### 5.1 Add Border Patterns to Groups
- **File:** `apps/frontend/src/components/formulas/visual-builder.tsx`
- **Patterns:** Cycle through: solid, dashed, dotted, double, groove, ridge
- **Apply:** To GroupNode border style based on group index
- **Acceptance:** >6 groups distinguishable without color alone

### 5.2 Add Number Badges to Groups
- **File:** `apps/frontend/src/components/formulas/visual-builder.tsx`
- **Badge:** Small circle with group number (1, 2, 3...) in header
- **Styling:** High contrast, visible at zoom levels
- **Acceptance:** Each group has unique number badge

### 5.3 Progressive Edge Reveal
- **File:** `apps/frontend/src/components/formulas/visual-builder.tsx`
- **Default:** Cross-group edges hidden or very faint
- **Reveal:** On node/group selection, highlight connected edges
- **Toggle:** Optional toolbar button "Show all edges"
- **Acceptance:** Dense graphs cleaner by default, edges visible on selection

### 5.4 Pour/Sling Log Stream (Stretch)
- **Backend:** Modify `pour.ts`/`sling.ts` to stream stdout via SSE
- **Frontend:** `apps/frontend/src/hooks/use-pour-stream.ts`
- **UI:** Detail panel with scrolling log, elapsed counter
- **Status:** Step icons (pending → running → complete)
- **Note:** This is HIGH effort, may defer to v2.1

### 5.5 Step Editor Panel Polish
- **File:** `apps/frontend/src/components/formulas/step-editor-panel.tsx`
- **Add:** Escape key handler to close
- **Add:** Validation error display (red border, message)
- **Add:** Loading state during save
- **Acceptance:** Escape closes, errors visible, save shows spinner

**Phase 5 Dependencies:** Phases 1-3 complete
**Phase 5 Outputs:** Polished visual experience

---

## Phase 6: Performance Validation (P1 - Quality Gate)

**Goal:** Verify implementation meets spec performance budgets.

### 6.1 Measure Post-Implementation Performance
- **Compare:** Against Phase 0.2 baseline
- **Targets:**
  - Mode switch < 100ms
  - Node selection < 50ms
  - Step editor open < 100ms
  - Initial render (50 steps) < 1s
  - Save < 500ms
  - Search/filter < 100ms
- **Acceptance:** All targets met or regressions documented

### 6.2 Performance Optimization (If Needed)
- **Triggers:** Any target missed by >20%
- **Actions:** Profile, optimize, re-measure
- **Acceptance:** All targets met or exceptions approved

**Phase 6 Dependencies:** Phases 1-5 complete
**Phase 6 Outputs:** Performance validated, ready for release

---

## Dependency Graph

```
Phase 0 (Prerequisites) ──► Phase 1 (Save) ──┬──► Phase 2 (Navigation)
                                              │
                                              └──► Phase 4 (Shortcuts)
                                                        │
                           Phase 3 (A11y) ─────────────┴──► Phase 5 (Polish)
                                                                  │
                                                                  ▼
                                                           Phase 6 (Perf)
```

Phase 0 must complete first (blockers).
Phases 1 and 3 can run in parallel after Phase 0.
Phases 2 and 4 depend on Phase 1.
Phase 5 depends on Phases 1-3.
Phase 6 validates after all implementation complete.

---

## Implementation Order (Recommended)

| Week | Tasks | Output |
|------|-------|--------|
| 1 | 0.1-0.2, 1.1-1.6, 3.1-3.2 | Blockers fixed, save working, skip link, labels |
| 2 | 2.1-2.4, 3.3-3.6 | Navigation safe, live regions, arrow nav, outline tree |
| 3 | 4.1-4.4, 5.1-5.3 | Shortcuts discoverable, groups polished |
| 4 | 5.5, 6.1-6.2, testing | Panel polish, performance validation, QA |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/frontend/src/hooks/use-save.ts` | Save hook |
| `apps/frontend/src/components/ui/unsaved-changes-modal.tsx` | Navigation modal |
| `apps/frontend/src/components/ui/shortcuts-panel.tsx` | Shortcuts help |
| `apps/frontend/src/components/ui/skip-link.tsx` | Skip navigation |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/frontend/src/routes/formula.$name.tsx` | Dirty state, save, shortcuts, navigation |
| `apps/frontend/src/routes/__root.tsx` | Skip link, live region |
| `apps/frontend/src/components/formulas/visual-builder.tsx` | Keyboard nav, edge reveal, badges |
| `apps/frontend/src/components/formulas/step-editor-panel.tsx` | Labels, escape, validation |
| `apps/frontend/src/components/layout/command-palette.tsx` | Shortcut hints |
| `apps/frontend/src/components/layout/formula-tree.tsx` | Navigation guard, dirty indicator |
| `apps/frontend/src/components/layout/app-shell.tsx` | main-content ID |

---

## Acceptance Criteria Summary

From spec, implemented:
- [ ] Save with Cmd+S, unsaved indicator, success toast
- [ ] Navigation modal with Save/Don't Save/Cancel
- [ ] Pour/Sling unsaved warning
- [ ] Browser beforeunload protection
- [ ] Skip navigation link
- [ ] Proper form labels
- [ ] Live region announcements
- [ ] Arrow key DAG navigation
- [ ] Reduced motion support
- [ ] Shortcut tooltips on buttons
- [ ] Shortcuts panel (Cmd+/)
- [ ] First-session toast
- [ ] Command palette shortcut hints
- [ ] Border patterns for groups
- [ ] Number badges for groups
- [ ] Progressive edge reveal
- [ ] Step editor Escape to close

---

## Open Questions

1. **Undo (Cmd+Z):** Spec mentions but not detailed. **Decision: Defer to v2.1.**
2. **Progress streaming:** High effort. **Decision: Defer to v2.1, polling fallback for v2.0.**
3. ~~**Double-click vs single-click:**~~ **Resolved: Task 1.6 implements double-click per spec.**

---

## Next Steps

1. Review plan with stakeholder
2. Create implementation beads (design-to-beads)
3. Begin Phase 1 implementation
