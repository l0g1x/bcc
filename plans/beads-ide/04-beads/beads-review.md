# Beads Review: beads-ide

**Generated:** 2026-02-21
**Reviewers:** Forward (plan→beads), Reverse (beads→plan), Dependencies (graph integrity)

---

## Summary

| Category | P0 | P1 | P2 | Total |
|----------|----|----|----|----|
| Coverage Gaps | 0 | 0 | 0 | 0 |
| Conversion Scope Creep | 0 | 0 | 0 | 0 |
| Dependency Errors | 6 | 0 | 0 | 6 |
| Content Fidelity | 0 | 0 | 2 | 2 |
| **Total** | **6** | **0** | **2** | **8** |

---

## P0 Findings (Must Fix)

### 1. Accessibility pass (5.3) missing blocker on Formula file tree (2.5)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** Task 5.3 description explicitly lists `formula-tree.tsx` (built in 2.5) as a file to update for accessibility (keyboard nav, aria-expanded), but has no blocker dependency on 2.5.
- **Impact:** Accessibility pass on formula tree runs before the component exists.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.3 bcc-nxk2o.2.5
  ```

### 2. Accessibility pass (5.3) missing blocker on Command palette (2.6)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** Task 5.3 description explicitly lists `command-palette.tsx` (built in 2.6) as a file to update for accessibility (focus trap, keyboard nav), but has no blocker dependency on 2.6.
- **Impact:** Accessibility audit of command palette can begin before the component is built.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.3 bcc-nxk2o.2.6
  ```

### 3. Accessibility pass (5.3) missing blocker on Cook preview panel (3.4)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** Task 3.4 (cook preview) contains loading states and inline error display, both listed in 5.3's accessibility requirements (aria-live for loading, inline errors). No blocker dependency exists.
- **Impact:** Cook preview loading states and inline error aria-live regions are missed during the accessibility pass.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.3 bcc-nxk2o.3.4
  ```

### 4. Accessibility pass (5.3) missing blocker on Bead list view (3.5)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** Task 5.3 acceptance criteria require screen reader navigation of bead list, which is built in 3.5. No blocker dependency exists.
- **Impact:** Bead list screen reader navigation AC cannot be verified before 3.5 exists.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.3 bcc-nxk2o.3.5
  ```

### 5. E2E tests (5.5) missing blocker on TOML text editor (3.1)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** E2E test description specifies "open formula → edit → auto-save → cook preview → view results" as the test flow. The formula editor route (`formula.$name.tsx`) is created in 3.1. No blocker dependency exists.
- **Impact:** E2E test for formula edit flow can be scheduled before the formula editor route exists.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.5 bcc-nxk2o.3.1
  ```

### 6. E2E tests (5.5) missing blocker on Cook preview panel (3.4)
- **Category:** Dependency Error
- **Found by:** Dependencies
- **What:** E2E test covers "cook preview" as an explicit step in the full workflow. Cook preview panel is built in 3.4. No blocker dependency exists.
- **Impact:** E2E workflow test for cook preview step is unblocked before the cook preview component is built.
- **Fix command:**
  ```bash
  bd dep add bcc-nxk2o.5.5 bcc-nxk2o.3.4
  ```

---

## P1 Findings (Should Fix)

None.

---

## P2 Findings (Consider)

### 7. Graph benchmark "temporary code" qualifier dropped
- **Category:** Content Fidelity
- **Found by:** Forward
- **What:** Plan describes `graph-benchmark.ts` as "temporary spike code, not production." This qualifier is absent from the bead (bcc-nxk2o.2.7) description. The benchmark is self-evidently throwaway, but the cleanup signal is lost.
- **Fix suggestion:** No action needed — benchmark nature is obvious from context.

### 8. Fisheye distortion marked "optional" in bead body
- **Category:** Content Fidelity
- **Found by:** Forward
- **What:** Plan body lists fisheye distortion as a required feature. Bead bcc-nxk2o.4.3 body adds "(optional)" to fisheye. However, acceptance criteria are identical in both: "Fisheye distortion available as simplification option." AC governs implementation.
- **Fix suggestion:** No action needed — AC is correct and governs implementation.

---

## Parallelism Report

- **Dependency waves:** 9
- **Maximum parallel width:** 7 beads (Wave 6)
- **Critical path:** 8 beads (1.1 → 1.3 → 1.6 → 2.1 → 3.1 → 3.4 → 4.4 → 5.2)
- **Ready queue:** bcc-nxk2o.1.1 (Initialize project scaffolding)

### Dependency Waves

| Wave | Beads | Parallel Width |
|------|-------|---------------|
| 1 | 1.1 | 1 |
| 2 | 1.2, 1.3, 1.5 | 3 |
| 3 | 1.4, 1.6, 2B.1, 2B.3, 2C.1 | 5 |
| 4 | 2A.1, 2A.2, 2A.3 | 3 |
| 5 | 2B.2, 3A.1, 3C.1 | 3 |
| 6 | 3A.2, 3A.3, 3B.1, 3C.2, 4A.1, 4C.2, 5.1 | 7 |
| 7 | 4B.1, 4C.1 | 2 |
| 8 | 4B.2, 5.2, 5.4 | 3 |
| 9 | 5.3, 5.5 | 2 |

---

## Coverage Summary

**Forward (Plan→Beads):**
- Fully matched: 29 tasks (100%)
- Partially matched: 2 tasks (cosmetic P2 only)
- No matching bead: 0

**Reverse (Beads→Plan):**
- Plan-backed: 29 beads
- Structural (epics): 6 beads
- Scope creep: 0

**Dependencies:**
- Correctly constrained: 56 of 62
- Missing blockers: 6
- Over-constrained: 0

---

## Resolution Summary

| ID | Finding | Severity | Resolution | Applied |
|----|---------|----------|------------|---------|
| 1 | 5.3 missing dep on 2.5 | P0 | `bd dep add bcc-nxk2o.5.3 bcc-nxk2o.2.5` | Yes ✓ |
| 2 | 5.3 missing dep on 2.6 | P0 | `bd dep add bcc-nxk2o.5.3 bcc-nxk2o.2.6` | Yes ✓ |
| 3 | 5.3 missing dep on 3.4 | P0 | `bd dep add bcc-nxk2o.5.3 bcc-nxk2o.3.4` | Yes ✓ |
| 4 | 5.3 missing dep on 3.5 | P0 | `bd dep add bcc-nxk2o.5.3 bcc-nxk2o.3.5` | Yes ✓ |
| 5 | 5.5 missing dep on 3.1 | P0 | `bd dep add bcc-nxk2o.5.5 bcc-nxk2o.3.1` | Yes ✓ |
| 6 | 5.5 missing dep on 3.4 | P0 | `bd dep add bcc-nxk2o.5.5 bcc-nxk2o.3.4` | Yes ✓ |
| 7 | Graph benchmark "temporary" dropped | P2 | No action needed | N/A |
| 8 | Fisheye "optional" in body | P2 | No action needed — AC governs | N/A |

**P0 resolved:** 6 of 6 (auto-applied — restorative dependency fixes)
**P2 resolved:** 2 of 2 (no action needed)
**Cycle check:** Clean ✓
**Dependencies total:** 68 (was 62, added 6)
