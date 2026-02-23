# Beads Structure: beads-ide-ux-v2

**Created:** 2026-02-23
**Epic:** bcc-n12k1
**Total tasks:** 28

---

## Epic Overview

**ID:** bcc-n12k1
**Title:** beads-ide-ux-v2: UX improvements
**Status:** Open
**Priority:** P1

---

## Task Hierarchy

### Phase 0: Prerequisites (2 tasks)
| ID | Description | Priority | Blocks |
|----|-------------|----------|--------|
| bcc-n12k1.1 | 0.1: Add saveFormula() API function | P0 | bcc-n12k1.3 |
| bcc-n12k1.2 | 0.2: Performance baseline measurement | P1 | - |

### Phase 1: Save Infrastructure (6 tasks)
| ID | Description | Priority | Blocked By | Blocks |
|----|-------------|----------|------------|--------|
| bcc-n12k1.3 | 1.1: Create useSave hook | P0 | bcc-n12k1.1 | .4, .5 |
| bcc-n12k1.4 | 1.2: Add dirty state tracking | P0 | bcc-n12k1.3 | .6, .7, .9 |
| bcc-n12k1.5 | 1.3: Wire Cmd+S shortcut | P0 | bcc-n12k1.3 | .19-.22 |
| bcc-n12k1.6 | 1.4: Add unsaved indicator | P0 | bcc-n12k1.4 | - |
| bcc-n12k1.7 | 1.5: Add beforeunload handler | P0 | bcc-n12k1.4 | - |
| bcc-n12k1.8 | 1.6: Double-click to edit | P0 | - | .23 |

### Phase 2: Navigation Protection (4 tasks)
| ID | Description | Priority | Blocked By |
|----|-------------|----------|------------|
| bcc-n12k1.9 | 2.1: Create unsaved changes modal | P0 | bcc-n12k1.4 |
| bcc-n12k1.10 | 2.2: Add navigation guard to sidebar | P0 | bcc-n12k1.9 |
| bcc-n12k1.11 | 2.3: Handle modal actions | P0 | bcc-n12k1.10 |
| bcc-n12k1.12 | 2.4: Pour/Sling unsaved warning | P0 | bcc-n12k1.9 |

### Phase 3: Accessibility (6 tasks)
| ID | Description | Priority | Blocks |
|----|-------------|----------|--------|
| bcc-n12k1.13 | 3.1: Add skip navigation link | P0 | - |
| bcc-n12k1.14 | 3.2: Fix form labels | P0 | - |
| bcc-n12k1.15 | 3.3: Add live region announcements | P0 | - |
| bcc-n12k1.16 | 3.4: DAG arrow key navigation | P0 | - |
| bcc-n12k1.17 | 3.5: Respect prefers-reduced-motion | P0 | - |
| bcc-n12k1.18 | 3.6: Add outline view tree semantics | P0 | .23 |

### Phase 4: Shortcuts Discovery (4 tasks)
| ID | Description | Priority | Blocked By |
|----|-------------|----------|------------|
| bcc-n12k1.19 | 4.1: Add shortcut tooltips | P1 | bcc-n12k1.5 |
| bcc-n12k1.20 | 4.2: Create shortcuts panel | P1 | bcc-n12k1.5 |
| bcc-n12k1.21 | 4.3: Add first-session toast | P1 | bcc-n12k1.5 |
| bcc-n12k1.22 | 4.4: Extend command palette | P1 | bcc-n12k1.5 |

### Phase 5: Visual Polish (4 tasks)
| ID | Description | Priority | Blocked By | Blocks |
|----|-------------|----------|------------|--------|
| bcc-n12k1.23 | 5.1: Add border patterns to groups | P1 | .8, .18 | .24 |
| bcc-n12k1.24 | 5.2: Add number badges to groups | P1 | bcc-n12k1.23 | .25 |
| bcc-n12k1.25 | 5.3: Progressive edge reveal | P1 | bcc-n12k1.24 | .26 |
| bcc-n12k1.26 | 5.5: Step editor panel polish | P1 | bcc-n12k1.25 | .27 |

### Phase 6: Performance Validation (2 tasks)
| ID | Description | Priority | Blocked By |
|----|-------------|----------|------------|
| bcc-n12k1.27 | 6.1: Measure post-implementation | P1 | bcc-n12k1.26 |
| bcc-n12k1.28 | 6.2: Performance optimization | P1 | bcc-n12k1.27 |

---

## Dependency Graph Summary

```
Phase 0 (.1) ──► Phase 1 (.3-.8) ──┬──► Phase 2 (.9-.12)
                                   │
                                   └──► Phase 4 (.19-.22)
                                              │
Phase 3 (.13-.18) ────────────────────────────┴──► Phase 5 (.23-.26)
                                                          │
                                                          ▼
                                                   Phase 6 (.27-.28)
```

**Parallel tracks:**
- Phase 0.2 (perf baseline) can run anytime
- Phase 3 can run in parallel with Phase 1-2
- Phase 4 can run after Phase 1.3 (Cmd+S)

**Critical path:**
0.1 → 1.1 → 1.2 → 2.1 → 2.2 → 2.3 (longest save/navigation chain)

---

## Wave Analysis

**Wave 1 (no blockers):**
- bcc-n12k1.1 (saveFormula)
- bcc-n12k1.2 (perf baseline)
- bcc-n12k1.8 (double-click)
- bcc-n12k1.13-17 (Phase 3.1-3.5)

**Wave 2 (after Wave 1):**
- bcc-n12k1.3 (useSave hook)
- bcc-n12k1.18 (outline tree)

**Wave 3+:** Sequential chains

---

## Ready Work

Tasks that can start immediately (no blockers):
1. bcc-n12k1.1 - Add saveFormula() (CRITICAL)
2. bcc-n12k1.2 - Performance baseline
3. bcc-n12k1.8 - Double-click to edit
4. bcc-n12k1.13 - Skip navigation link
5. bcc-n12k1.14 - Fix form labels
6. bcc-n12k1.15 - Live region announcements
7. bcc-n12k1.16 - DAG arrow key navigation
8. bcc-n12k1.17 - Respect prefers-reduced-motion
