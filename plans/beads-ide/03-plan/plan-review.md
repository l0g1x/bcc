# Plan Review: beads-ide Implementation Plan

## Review Methodology

Three independent review agents performed bidirectional traceability analysis:

1. **Forward (Spec → Plan):** Verified every spec section has corresponding plan coverage
2. **Reverse (Plan → Spec):** Verified every plan task traces back to a spec requirement (no scope creep)
3. **Context (Plan → Codebase):** Verified plan decisions align with existing codebase patterns and integration surfaces

## Aggregate Scores

| Dimension | P0 | P1 | P2 |
|-----------|----|----|-----|
| Coverage Gaps (spec → plan) | 0 | 6 | 4 |
| Scope Creep (plan → spec) | 0 | 0 | 0 |
| Codebase Misalignment (plan → context) | 0 | 4 | 3 |
| **Deduplicated Totals** | **0** | **8** | **7** |

After deduplication (TipTap flagged by both Forward and Context; fisheye by both Forward and Reverse; visual builder by both Forward and Reverse):

- **P0 (blocking):** 0
- **P1 (must address before implementation):** 8
- **P2 (address during implementation):** 7

---

## P1 Findings

### P1-1: NL prompt for variables completely absent
- **Sources:** Reverse (P1)
- **Spec requirement:** "Variables UI: form, inline editing, NL prompt (all available)" — §UI: Formula Builder
- **Plan state:** Task 3A.2 implements form mode only. Inline editing covered by TOML editor (3A.1). NL prompt (AI-assisted variable translation) has no task anywhere across all 5 phases.
- **Action:** Update plan — add NL prompt as deferred post-MVP with explicit rationale, or add a task for it. The spec says "all available" which implies MVP scope.

### P1-2: Visual builder delivers read-only, spec says bidirectional
- **Sources:** Forward (P1), Reverse (P1)
- **Spec requirement:** "Both modes stay in sync" — §UI: Formula Builder (MVP Core)
- **Plan state:** Task 5.1 explicitly delivers one-way (TOML→visual only). Architecture Decisions table and Technical Risks document this as deliberate.
- **Action:** Accept as documented MVP risk — plan already acknowledges this. Update spec to mark bidirectional sync as stretch goal, OR accept the plan's risk-based deferral without spec change since the plan documents the rationale.

### P1-3: `bd mol pour` / transactional rollback missing
- **Sources:** Forward (P1)
- **Spec requirement:** "Formula pour is transactional with one-click rollback" — §Auto-Filled Answers: Editing & UX. Spec execution model includes both cook (preview) and pour (local instantiation).
- **Plan state:** Plan implements cook (preview) + sling (agent dispatch) but has no task for pour (local bead instantiation). The local execution path is incomplete.
- **Action:** Update plan — add pour as a task in Phase 3B or 4C, or document as deferred with rationale.

### P1-4: TipTap omission not documented as deliberate
- **Sources:** Forward (P1), Context (P2)
- **Spec requirement:** TipTap listed in §Architecture: Tech Stack for rich text description fields
- **Plan state:** Task 3C.2 says "Rich text rendering for description fields (markdown)" — uses markdown rendering instead of TipTap. Since bead detail is read-only, a markdown renderer suffices. But the substitution is silent — not in Architecture Decisions table.
- **Action:** Update plan — add TipTap → markdown renderer substitution to Architecture Decisions table with rationale (read-only bead detail doesn't need block editor).

### P1-5: First-run "Create your first formula" guided flow missing
- **Sources:** Forward (P1)
- **Spec requirement:** §First-Run Experience — 4-step flow including "if no formulas: show 'Create your first formula' guided flow"
- **Plan state:** Task 1.6 covers health check, Task 2B.2 covers formula tree, but the empty-state onboarding path has no task or acceptance criterion.
- **Action:** Update plan — add acceptance criterion to Task 2B.2 for empty-state handling.

### P1-6: Branch status display / ahead-behind indicators absent
- **Sources:** Forward (P1)
- **Spec requirement:** "Git-style ahead/behind indicators for branches" — §Visual Encoding. "No auto-merge to main. Always requires explicit human approval." — §Branching Model.
- **Plan state:** Coverage matrix says "Deferred (data branches via `bd`; no IDE UI for branch management in MVP)." But branch *status display* (read-only indicators) is different from branch *management*. The plan conflates them.
- **Action:** Update plan — either add a branch status indicator task or explicitly document that branch status visibility (not just management) is deferred with rationale.

### P1-7: `/api/config` route not implemented
- **Sources:** Context (P1)
- **Spec requirement:** Not directly in spec, but context's Backend API Surface documents `GET /api/config — return current config (paths, etc.)`
- **Plan state:** Plan implements `config.ts` as an internal module but does not expose an HTTP endpoint.
- **Action:** Update plan — add `GET /api/config` to Task 1.6 or create a note that config is internal-only.

### P1-8: CLI flag assumptions unverified
- **Sources:** Context (P1, P1)
- **Two assumptions:**
  - `bv --export-graph - --output-format json` — context only documents HTML output for `--export-graph`
  - `bd cook <path> --json` — context does not list `--json` flag for `bd cook` (unlike `bd list --json`)
- **Plan state:** Tasks 2A.1 and 2A.3 assume these flags exist.
- **Action:** Add implementation note to plan — verify CLI flags early in Phase 1 (during task 1.3 CLI wrapper). If flags don't exist, parse stdout or file output.

---

## P2 Findings

### P2-1: Fisheye distortion missing from dense graph handling
- **Sources:** Forward (P2), Reverse (P2)
- **Spec requirement:** "All simplification strategies available: Focus mode, Semantic zoom, Fisheye distortion" — §UI: Graph View
- **Plan state:** Task 4B.2 implements focus mode and semantic zoom but does not mention fisheye.
- **Action:** Add fisheye distortion to Task 4B.2 acceptance criteria.

### P2-2: Sling failure retry button missing
- **Sources:** Reverse (P2)
- **Spec requirement:** "`gt sling` fails → Toast notification with error details, retry button" — §Error Handling
- **Plan state:** Task 4C.1 says "Failure shows error toast" but no retry action.
- **Action:** Add retry button to Task 4C.1 acceptance criteria.

### P2-3: Formula name validation regex mismatch
- **Sources:** Context (P2)
- **Plan regex:** `^[a-zA-Z0-9_.-]+$` (includes `.`)
- **Context regex:** `^[a-zA-Z0-9_-]+$` (no `.`)
- **Issue:** Formula filenames contain `.` (e.g., `explore-module.formula.toml`), so the plan's regex is actually correct for real filenames. Context's regex may be wrong.
- **Action:** Keep plan's regex. Add note that context's regex is stricter and may need updating.

### P2-4: Formula save HTTP method mismatch (PUT vs POST)
- **Sources:** Context (P2)
- **Plan:** `PUT /api/formulas/:name`
- **Context:** `POST /api/formulas/:name`
- **Action:** Standardize to `PUT` (idempotent file write is semantically PUT). Update context if needed.

### P2-5: Terminology enforcement has no dedicated task
- **Sources:** Forward (P2)
- **Spec requirement:** §Terminology Simplifications — show top-4 dependency types, hide BCC phases, hide "proto" label, use "dependency" not "bond"
- **Action:** Add cross-cutting acceptance criterion to Task 5.2 or create a terminology checklist in the plan's Cross-Cutting Concerns section.

### P2-6: Adaptive single-panel layout below 1280x720
- **Sources:** Forward (P2)
- **Spec requirement:** "Adaptive — simplified single-panel on small screens" — §UI: Layout
- **Plan state:** Enforces 1280x720 minimum, no task for small-screen adaptation.
- **Action:** Accept — 1280x720 is the stated minimum. Adaptive layout is an edge case below the floor. Document as out of scope.

### P2-7: Skeleton loading not explicit acceptance criterion
- **Sources:** Forward (P2)
- **Spec requirement:** "Skeleton loading (progressive, no full-screen spinner)" — §Visual Encoding
- **Action:** Add to Task 5.3 (accessibility pass) or as cross-cutting pattern note.

---

## Contradictions (Low Severity)

### C-1: `BeadsIDEConfig` default port 7777 vs 3001
- Context type definition says `port: number; // default 7777`
- Plan and context layout diagram both use 3001
- **Action:** When implementing, set default to 3001 and update the type definition comment.

### C-2: openedi uses ESLint alongside Biome
- Plan says Biome "replaces ESLint + Prettier"
- openedi reference actually uses both simultaneously
- **Action:** Accept plan's approach (Biome-only for beads-ide). No change needed.

---

## Scope Creep Assessment

**No scope creep found.** All 24 plan tasks trace to spec requirements or are necessary infrastructure (scaffolding, type definitions). The plan does not introduce features, libraries, or complexity beyond what the spec requires. Notable:

- npm workspaces monorepo: justified by two-process architecture
- Phase 2C benchmark spike: explicitly spec-mandated
- Wave computation in Phase 1: consumed by Wave view (MVP core)
- Split types into `types.ts` / `ide-types.ts`: reasonable separation

---

## Resolution Summary

| ID | Finding | Severity | Resolution | Applied |
|----|---------|----------|------------|---------|
| P1-1 | NL prompt for variables absent | P1 | Defer post-MVP — added to Architecture Decisions table with rationale | Yes |
| P1-2 | Visual builder read-only vs bidirectional | P1 | Accept — already documented as deliberate MVP risk | Yes (no change) |
| P1-3 | `bd mol pour` missing | P1 | Added Task 4C.1 (pour workflow) with confirmation, rollback, backend route | Yes |
| P1-4 | TipTap → markdown not documented | P1 | Added to Architecture Decisions table: "Markdown renderer (not TipTap)" with rationale | Yes |
| P1-5 | First-run empty state missing | P1 | Added acceptance criterion to Task 2B.2 for empty-state guided flow | Yes |
| P1-6 | Branch status indicators absent | P1 | Updated coverage matrix entries with explicit deferral rationale (status visibility + management) | Yes |
| P1-7 | `/api/config` route missing | P1 | Added `GET /api/config` endpoint to Task 1.6 with acceptance criterion | Yes |
| P1-8 | CLI flag assumptions unverified | P1 | Added implementation note + acceptance criterion to Task 1.3 for early flag verification | Yes |
| P2-1 | Fisheye distortion missing | P2 | Added to Task 4B.2 acceptance criteria | Yes |
| P2-2 | Sling retry button missing | P2 | Added retry button to Task 4C.2 (formerly 4C.1) acceptance criteria | Yes |
| P2-3 | Formula regex includes `.` | P2 | Kept plan's regex — correct for real filenames | Yes (no change) |
| P2-4 | PUT vs POST for formula save | P2 | Kept PUT — semantically correct for idempotent writes | Yes (no change) |
| P2-5 | Terminology enforcement | P2 | Added Terminology Enforcement section to Cross-Cutting Concerns | Yes |
| P2-6 | Adaptive layout below min | P2 | Accepted — below 1280x720 minimum viewport floor | Yes (no change) |
| P2-7 | Skeleton loading not explicit | P2 | Added Loading States section to Cross-Cutting Concerns + Task 5.3 criterion | Yes |

**P1 resolved:** 8 of 8
**P2 resolved:** 7 of 7
**Plan updated:** Yes — 15 edits applied
**Spec updated:** No
