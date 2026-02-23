# Beads Review: beads-ide-ux-v2

**Reviewed:** 2026-02-23
**Epic:** bcc-n12k1
**Reviewers:** 3 parallel agents (completeness, dependencies, clarity)

---

## Executive Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Completeness | 97% | ✓ 1 task intentionally deferred |
| Dependencies | 96% | ⚠ 1 fix needed |
| Clarity | 75% | ⚠ Some refinement helpful |
| **Overall** | **89%** | **Ready with minor fixes** |

**Verdict:** Beads structure is sound. One dependency fix needed, clarity refinements optional.

---

## Pass 1: Completeness

### Coverage Matrix

| Phase | Plan Tasks | Beads | Coverage |
|-------|------------|-------|----------|
| 0 | 2 | 2 | 100% |
| 1 | 6 | 6 | 100% |
| 2 | 4 | 4 | 100% |
| 3 | 6 | 6 | 100% |
| 4 | 4 | 4 | 100% |
| 5 | 5 | 4 | 80% (5.4 deferred) |
| 6 | 2 | 2 | 100% |

### Findings

1. **Task 5.4 (Pour/Sling Log Stream) - Intentionally Deferred**
   - Plan marks as "STRETCH, HIGH effort, may defer to v2.1"
   - Decision already made in plan-review: Defer to v2.1
   - **Status:** Acceptable, not a gap

2. **Priority on bcc-n12k1.2 (Perf Baseline)**
   - Currently P1, should be P0 (Phase 0 prerequisite)
   - **Status:** Minor, can fix

---

## Pass 2: Dependencies

### Dependency Validation

| Criterion | Result |
|-----------|--------|
| Graph matches plan | ✓ 9/10 aspects |
| No circular deps | ✓ None found |
| Critical path correct | ✓ .1→.3→.4→.9→.10→.11 |
| Wave 1 correct | ⚠ 7/8 (see fix) |
| Phase deps set | ✓ All correct |

### Issue Found: Task .18 Dependency

**Problem:** beads-structure.md shows .18 blocking .23, but .23 also blocks .18 (implied circular).

**Reality from beads:**
- .18 (outline tree) has no blockers in beads
- .23 (border patterns) blocked by .8 AND .18

**Fix Required:** Remove .18 from "Ready Work" list in beads-structure.md since it's actually blocked by .23.

**Impact:** Minimal - just documentation correction.

---

## Pass 3: Clarity

### Clarity Scores by Phase

| Phase | Score | Notes |
|-------|-------|-------|
| 0 | 9/10 | Clear |
| 1 | 7/10 | Files not specified in bead descriptions |
| 2 | 7/10 | "Handle modal actions" vague |
| 3 | 7/10 | DAG nav needs behavior details |
| 4 | 8/10 | Clear |
| 5 | 6/10 | Edge reveal needs toggle detail |
| 6 | 8/10 | Clear |

### Beads Needing Refinement (Optional)

| Bead | Issue | Suggested Refinement |
|------|-------|---------------------|
| 1.3 | Generic | Add: "use useHotkey('mod+s', handleSave)" |
| 2.3 | Vague | Specify 3 flows: Save/Discard/Cancel |
| 3.4 | Complex | List 4 arrow behaviors |
| 5.3 | Incomplete | Add toggle button requirement |

---

## Wave Analysis (Validated)

### Wave 1 - Ready to Start (No Blockers)
- bcc-n12k1.1 - Add saveFormula() **[CRITICAL PATH]**
- bcc-n12k1.2 - Performance baseline
- bcc-n12k1.8 - Double-click to edit
- bcc-n12k1.13 - Skip navigation link
- bcc-n12k1.14 - Fix form labels
- bcc-n12k1.15 - Live region announcements
- bcc-n12k1.16 - DAG arrow key navigation
- bcc-n12k1.17 - Respect prefers-reduced-motion

**Total: 8 tasks can start immediately**

### Critical Path
```
.1 (10m) → .3 (2h) → .4 (2h) → .9 (2h) → .10 (2h) → .11 (2h)
```
Estimated: 6-8 hours minimum for save+navigation chain.

---

## Required Fixes (1)

### Fix 1: Update beads-structure.md Ready Work

**Current (incorrect):**
```
Tasks that can start immediately (no blockers):
...
8. bcc-n12k1.18 - Add outline view tree semantics
```

**Corrected:**
Remove .18 from this list (it's blocked by .23).

---

## Optional Improvements

1. **Add file references** to bead descriptions
2. **Expand AC** for complex beads (3.4, 5.3)
3. **Fix priority** on bcc-n12k1.2 from P1 to P0

---

## Conclusion

**Status:** Ready for implementation.

The beads structure correctly maps all plan tasks (except intentionally deferred 5.4). Dependencies are sound with one minor documentation fix needed. Clarity is acceptable for developers familiar with the plan.

**Recommended Next Steps:**
1. Apply Fix 1 (documentation update)
2. Start Wave 1 tasks immediately
3. Critical path blocker: Complete bcc-n12k1.1 (saveFormula) first
