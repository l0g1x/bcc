# Plan Review: beads-ide-ux-v2

**Reviewed:** 2026-02-23
**Plan version:** Draft
**Reviewers:** 3 parallel agents (coverage, traceability, codebase alignment)

---

## Executive Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Spec→Plan Coverage | 77% | ⚠ Gaps identified |
| Plan→Spec Traceability | 95% | ✓ No orphan tasks |
| Plan→Codebase Alignment | 88% | ⚠ 1 blocker |
| **Overall** | **87%** | **Proceed with fixes** |

**Verdict:** Plan is sound but requires 4 fixes before implementation.

---

## Critical Blockers (Must Fix)

### 1. Missing saveFormula() API Function

**Location:** `apps/frontend/src/lib/api.ts`

**Issue:** Backend PUT endpoint exists, but no frontend API wrapper. This blocks ALL save functionality.

**Fix Required:**
```typescript
// Add to api.ts
export async function saveFormula(name: string, content: string): Promise<void> {
  const { data, error } = await apiFetch<FormulaWriteResponse>(
    `/api/formulas/${name}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  )
  if (error) throw new Error(error.message)
  return data
}
```

**Effort:** 10 minutes

---

## Important Gaps (Should Fix)

### 2. Performance Budgets Not Addressed

**Spec defines 6 targets:**
- Mode switch < 100ms
- Node selection < 50ms
- Panel open < 100ms
- Initial render < 1s
- Save < 500ms
- Search/filter < 100ms

**Plan status:** No dedicated tasks for measurement or optimization.

**Recommendation:** Add Phase 0.5 for baseline measurements before implementation, and Phase 6 for performance validation after.

### 3. Edit Gesture Unresolved

**Spec Decision #19:** Double-click to edit (not single-click)
**Plan Open Question #3:** "Double-click vs single-click?"
**Issue:** No task assigned to implement this change.

**Recommendation:** Add task 1.6 to change node interaction from single-click select to double-click edit in visual-builder.tsx.

### 4. Outline View Tree Structure Missing

**Spec Flow 4 requires:** "Outline view as accessible tree with ARIA tree roles"
**Plan status:** DAG arrow navigation covered, but outline panel not mentioned.

**Recommendation:** Either:
- Add Phase 3.6 for outline view tree semantics, OR
- Explicitly defer to v2.1 in spec's "Out of Scope" section

---

## Acceptable Deferrals

### Progress Streaming (Task 5.4)

**Status:** Marked as "STRETCH, may defer to v2.1"
**Assessment:** Acceptable. Polling fallback is reasonable for v2.0. Log stream can be added later.

### Undo (Cmd+Z)

**Status:** Listed in Open Questions as "Defer to v2.1?"
**Assessment:** Acceptable deferral. Browser provides basic undo in text fields.

---

## Coverage Matrix

### Components (5/5 covered)

| Component | Plan Phase | Status |
|-----------|------------|--------|
| Step Editor Panel | 5.5 | ✓ |
| Expansion Groups | 5.1-5.3 | ✓ |
| Unsaved Changes | 1+2 | ✓ |
| Keyboard Shortcuts | 4 | ✓ |
| Accessibility | 3 | ✓ |

### User Flows (4.5/5 covered)

| Flow | Plan Phases | Status |
|------|-------------|--------|
| Flow 1: Editing | 1.2, 1.4, 5.5 | ✓ |
| Flow 2: Navigation | 2.1-2.4, 1.5 | ✓ |
| Flow 3: Shortcuts | 4.1-4.4 | ✓ |
| Flow 4: Screen Reader | 3.1-3.4 | ⚠ Missing outline tree |
| Flow 5: Pour/Sling | 2.4, 5.4 | ⚠ 5.4 deferred |

### Acceptance Criteria (16/19 covered)

- 3 missing: Edge highlighting on selection, outline tree semantics, progress streaming (deferred)

---

## Codebase Alignment

### Files Verified Present

All 11 referenced files exist:
- ✓ `routes/formula.$name.tsx`
- ✓ `components/formulas/visual-builder.tsx`
- ✓ `components/formulas/step-editor-panel.tsx`
- ✓ `hooks/use-hotkeys.ts` (production-ready!)
- ✓ `hooks/use-sling.ts` (pattern template)
- ✓ `hooks/use-auto-save.ts` (exists but incomplete)
- ✓ `lib/api.ts` (needs saveFormula)
- ✓ Backend PUT endpoint

### Positive Findings

1. **use-hotkeys.ts** is fully implemented with cross-platform support
2. **use-auto-save.ts** exists with debounce logic (needs saveFormula fix)
3. **Command palette** already displays shortcuts
4. **Backend API** is ready, no changes needed

---

## Dependency Issues

**One potential conflict:**
- Phase 3.4 (arrow nav) and Phase 5.3 (edge reveal) both touch edge behavior
- Recommendation: Design edge highlighting UX before parallel execution

**Otherwise:** Dependency graph is sound.

---

## Revised Task List

### Add These Tasks

| ID | Task | Phase | Effort |
|----|------|-------|--------|
| 0.1 | Add saveFormula() to api.ts | Pre-1 | 10m |
| 1.6 | Implement double-click to edit | Phase 1 | 1h |
| 3.6 | Add ARIA tree roles to outline view (OR defer) | Phase 3 | 2h |
| 6.1 | Performance baseline measurement | Post-5 | 2h |
| 6.2 | Performance validation | Post-5 | 2h |

### Update These Tasks

| ID | Current | Update |
|----|---------|--------|
| 1.1 | Create use-save.ts | Note: use-auto-save.ts exists, clarify relationship |
| 5.4 | Log stream (stretch) | Mark explicitly as "v2.1 scope" |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| saveFormula() blocks Phase 1 | 100% | HIGH | Fix in first commit |
| Performance regressions | Medium | Medium | Add baseline measurements |
| Edge highlight conflicts | Low | Low | Design UX upfront |
| Outline view missing | Medium | Medium | Decision: implement or defer |

---

## Recommendations

1. **Before starting Phase 1:**
   - Add saveFormula() to api.ts (10 min)
   - Clarify use-auto-save.ts vs use-save.ts relationship
   - Add task 1.6 for double-click

2. **Decide now:**
   - Outline view: Implement (Phase 3.6) or defer (add to Out of Scope)?
   - Performance: Add measurement phase or accept implicit budgets?

3. **Document deferrals:**
   - Update spec "Out of Scope" with: Cmd+Z, progress streaming, outline view (if deferred)

4. **Proceed with implementation:**
   - Plan is 87% ready
   - Fixes are minor (< 1 day total)
   - No architectural blockers

---

## Conclusion

**Plan Status:** Ready for implementation with minor adjustments.

**Next Steps:**
1. Apply the 4 fixes above
2. Get stakeholder sign-off on deferrals
3. Create implementation beads (design-to-beads)
4. Begin Phase 1
