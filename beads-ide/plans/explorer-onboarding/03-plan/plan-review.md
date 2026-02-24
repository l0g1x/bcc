# Plan Review: explorer-onboarding

**Generated:** 2026-02-24
**Reviewers:** Forward (spec→plan), Reverse (plan→spec), Context (plan→codebase)

---

## Summary

| Category | P0 | P1 | P2 | Total |
|----------|----|----|----|----|
| Coverage Gaps | 0 | 2 | 3 | 5 |
| Scope Creep | 0 | 0 | 1 | 1 |
| Codebase Misalignment | 0 | 2 | 1 | 3 |
| Consistency Issues | 0 | 0 | 0 | 0 |
| **Total** | **0** | **4** | **5** | **9** |

**Verdict:** Plan is implementable with 4 P1 items to resolve before starting. No P0 blockers. Zero scope creep.

---

## P0 Findings (Must Fix)

*None identified.*

---

## P1 Findings (Should Fix)

### 1. Q4: No `.beads/` directory behavior undefined
- **Category:** Coverage Gap
- **Found by:** Forward
- **What:** The spec's open question Q4 asks what happens when a user opens a folder with no `.beads/` directory anywhere in its ancestry. The plan does not define the behavior (auto-create? show warning? block open?).
- **Impact:** The tree scan will work (scans from chosen root), but formula-write operations may fail silently if there's no recognized search path.
- **Action:** Update plan
- **Recommendation:** Add behavior to task 1.3: when `POST /api/workspace/open` is called on a path with no `.beads/` directory, auto-create `.beads/` at the root. This is consistent with the New Project flow and eliminates the ambiguity.

### 2. Backend endpoint performance not tested
- **Category:** Coverage Gap
- **Found by:** Forward
- **What:** Spec section 5.1 requires `GET /api/tree` to respond within 500ms for up to 200 formula files, measured with `performance.now()`. The plan's task 7.2 only measures frontend render time via Playwright. No backend unit test or assertion covers server-side latency.
- **Action:** Update plan
- **Recommendation:** Add acceptance criterion to task 1.5: "Backend unit test asserts `GET /api/tree` responds < 500ms for 200-file fixture."

### 3. `WorkspaceStateResponse` null root type inconsistency
- **Category:** Codebase Misalignment
- **Found by:** Context
- **What:** The shared type `WorkspaceStateResponse` defines `root: string` (non-nullable). The plan's startup sync (task 2.5) checks "if backend root is null." These are inconsistent.
- **Impact:** When no workspace root is configured, `GET /api/workspace` must return something. The TypeScript types will fail to compile if the logic expects a nullable root but the type says non-nullable.
- **Action:** Update plan
- **Recommendation:** Clarify in task 1.1: when no root is configured, `GET /api/workspace` returns `WorkspaceError` with code `NO_ROOT` (not a success response). Update task 2.5 to check for error response, not null root.

### 4. `useFormulas()` refresh scope unclear after Q63 resolution
- **Category:** Codebase Misalignment
- **Found by:** Context
- **What:** Plan task 6.3 adds `useFormulas()` refresh after workspace change. However, with Q63 resolution, `FormulaTree` is NOT rendered when `WorkspaceTree` is active. If `useFormulas()` is only called inside `FormulaTree`, the refresh may be a no-op.
- **Action:** Update plan (or accept as-is)
- **Recommendation:** Clarify in task 6.3: if `useFormulas()` is only used by formula operations (cook/sling/pour) that happen AFTER a formula is selected, the refresh is still needed. If `useFormulas()` is only used by `FormulaTree` which is not rendered, task 6.3 can be removed entirely. Verify by checking where `useFormulas()` is called before implementing.

---

## P2 Findings (Consider)

### 5. US-1 command palette coverage matrix incomplete
- **Category:** Coverage Gap (minor)
- **Found by:** Forward
- **What:** The coverage matrix's US-1 row lists plan sections "3.1, 3.2, 3.4" but omits task 6.1. The spec's US-1 AC explicitly requires "Open Folder and New Project accessible from command palette (Cmd+K)."
- **Recommendation:** Update coverage matrix US-1 row to include Phase 6 Task 6.1.

### 6. Welcome screen style details referenced indirectly
- **Category:** Coverage Gap (minor)
- **Found by:** Forward
- **What:** The spec's welcome screen dimensions (recent items 36px tall, 8px padding) are not enumerated in task 3.2 — it references "layout per spec section 3.1" instead.
- **Recommendation:** Acceptable as-is. The spec is the source of truth for styling. No change needed unless explicit checklist is preferred.

### 7. "Additional Gap Fixes" spec section not in coverage matrix
- **Category:** Coverage Gap (minor)
- **Found by:** Forward
- **What:** The spec's "Additional Gap Fixes" clarifications (browser title, treeExpanded scoping, TreeErrorState, useFormulas refresh, async FS) have no dedicated coverage matrix row, even though all five items are covered in plan tasks.
- **Recommendation:** Add coverage matrix row: "Additional Gap Fixes | Tasks 5.5, 2.3, 4.1, 6.3, 1.3 | Phases 5, 2, 4, 6, 1"

### 8. ArrowLeft/Right keyboard expand/collapse
- **Category:** Scope Creep (minor, acceptable)
- **Found by:** Reverse
- **What:** Task 4.4 adds ArrowLeft/Right for directory expand/collapse. The spec's US-3 says "arrow keys move focus" without enumerating directions.
- **Recommendation:** Accept as-is. This is the standard WAI-ARIA Treeview pattern. Omitting it would be wrong. Not scope creep — it's the correct interpretation of "keyboard navigation."

### 9. `FormulaDirtyProvider` framing incorrect (already mounted)
- **Category:** Codebase Misalignment (misleading, not harmful)
- **Found by:** Context
- **What:** Both the context analysis and plan treat `FormulaDirtyProvider` as "conspicuously absent from `__root.tsx`" and list it as a Medium-likelihood risk. The actual codebase shows the provider IS already mounted in `main.tsx`, wrapping the entire app.
- **Impact:** Task 2.1 will correctly find the provider already present. The risk table entry is wrong but the task handles it safely.
- **Recommendation:** Update risk table entry to "Low" likelihood or remove. Task 2.1 remains useful as verification but will reach the opposite conclusion from what context predicted.

---

## Coverage Summary

**Forward (Spec→Plan):**
- Fully covered: 18 sections
- Partially covered: 3 sections
- Not covered: 1 section (superseded: section 4.7 replaced by DirectoryBrowser per spec's own resolution)

**Reverse (Plan→Spec):**
- Spec-backed: 20 tasks
- Spec-implied: 4 tasks
- Infrastructure: 2 tasks
- Scope creep: 0 tasks
- Gold-plating: 0 tasks

**Context Alignment:**
- Aligned: 9 decisions
- Contradicts: 2 decisions (both safe to proceed)
- Unverifiable: 1 decision

---

## Action Items Before Implementation

1. **Task 1.3:** Add behavior for opening folder with no `.beads/`: auto-create `.beads/` directory
2. **Task 1.5:** Add backend performance test: `GET /api/tree` < 500ms for 200-file fixture
3. **Task 1.1:** Clarify `GET /api/workspace` returns `WorkspaceError` with `NO_ROOT` when no root configured
4. **Task 6.3:** Verify where `useFormulas()` is called; remove task if only used by non-rendered `FormulaTree`
5. **Coverage matrix:** Add US-1 → 6.1 reference, add "Additional Gap Fixes" row
6. **Risk table:** Update `FormulaDirtyProvider` to Low likelihood (already present in `main.tsx`)
