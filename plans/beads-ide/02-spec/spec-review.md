# Spec Review: beads-ide

## Review Configuration

- **Spec:** plans/beads-ide/02-spec/spec.md
- **Models Used:** Opus 4.6 (succeeded), GPT 5.3 (succeeded), Gemini 3 Pro (skipped - CLI not installed)
- **Categories:** All (Codebase Match, Design Quality, Security, Error Handling, Performance, etc.)
- **Context Source:** Existing context.md from Step 1

---

## Model Comparison

| # | Issue | Opus 4.6 | GPT 5.3 | Agree? |
|---|-------|----------|---------|--------|
| 1 | `gt sling` vs `bd cook`/`bd mol pour` | HIGH: `gt sling` undocumented in BCC, unclear mapping to cook/pour pipeline | CRITICAL: Spec core execution path uses `gt sling` but docs define `bd cook` + `bd mol pour` | Yes - severity differs |
| 2 | SQLite-to-Dolt transition unaddressed | HIGH: Codebase uses SQLite, spec says Dolt, no migration path | HIGH: Spec assumes direct Dolt, but operational model is SQLite+CLI | Yes |
| 3 | Missing API/communication layer | HIGH: Browser SPA cannot connect directly to MySQL-wire dolt-server | - (implicit in #2) | Opus only |
| 4 | Cook preview "live updates" unrealistic | HIGH: `bd cook` is batch CLI, no streaming API | - | Opus only |
| 5 | Missing referenced document | MEDIUM: spec-review-assessment.md referenced but doesn't exist | HIGH: Same finding | Yes |
| 6 | Security for CLI invocation | - | HIGH: No controls for command construction, escaping, allowlists | GPT only |
| 7 | Scope contradiction (not CRUD but has CRUD UX) | - | MEDIUM: "Not general bead CRUD" conflicts with bead create/edit UX statements | GPT only |
| 8 | Error handling missing | MEDIUM: No failure scenarios for dolt-server down, cook errors, sling failure | MEDIUM: No failure-mode matrix for cook, pour, Dolt unavailable | Yes |
| 9 | Test strategy missing | LOW: No testing approach mentioned | MEDIUM: No test plan, ownership, or edge-case scenarios | Yes |
| 10 | Branch naming convention unvalidated | MEDIUM: `draft/<category>/<title>` is new, not in any existing docs | - | Opus only |
| 11 | Formula location discrepancy | MEDIUM: Formulas at `formulas/` not `.beads/formulas/` as per search paths | - | Opus only |
| 12 | Terminology table incomplete | MEDIUM: Cook, Pour, Sling missing from glossary | - | Opus only |
| 13 | Acceptance criteria not verifiable | - | MEDIUM: "Shows accurate structure" and "replaces bv" are subjective | GPT only |
| 14 | Beads.md dep count wrong (18 vs 19) | MEDIUM: Table has 19 entries, header says 18 | - | Opus only |
| 15 | Performance targets lack conditions | LOW: No browser, device class, or interaction type specified | LOW: No benchmark protocol | Yes |
| 16 | TipTap vs ProseMirror | LOW: They're not alternatives - TipTap wraps ProseMirror | - | Opus only |
| 17 | Context doc describes larger scope than MVP | LOW: context.md "Must Handle" section exceeds MVP | - | Opus only |
| 18 | Appendix includes out-of-scope concepts | LOW: Wisps, Atoms, Molecules in appendix but not in MVP | - | Opus only |
| 19 | Graph library deferred creates risk | MEDIUM: Complex requirements may not be met by any single library | LOW: TanStack Hotkeys unvalidated | Partial |
| 20 | Context doc custom type count wrong | MEDIUM: Says 8 custom types, actually 9 | - | Opus only |

---

## All Issues by Severity

### CRITICAL (1 issue)

**1. Execution command mismatch: `gt sling` vs `bd cook`/`bd mol pour`**
- **What:** The spec's core execution path references `gt sling` 12+ times, but BCC codebase documents define formula execution as `bd cook` (preview) + `bd mol pour` (instantiate). `gt sling` is a Gas Town orchestration command for dispatching work to agents -- it is NOT a formula execution command.
- **Where:** Spec sections: MVP Scope, What's In Scope, Sling Workflow, Success Criteria
- **Evidence:** `docs/formulas.md` line 12 defines pipeline: `.formula.toml → bd cook → Proto → bd mol pour → Real beads`. No mention of `gt sling` in formula docs.
- **Recommendation:** Clarify the relationship. `gt sling` dispatches a formula + molecule to an agent/crew. The IDE may want to support BOTH: (a) local cook/pour for direct execution, and (b) `gt sling` for dispatching to remote agents. These are different workflows.
- **Ambiguity:** Is the IDE meant for local formula execution (cook/pour) or for dispatching to agents (sling)? Or both?

### HIGH (4 issues)

**2. Data layer inconsistency: SQLite vs Dolt**
- **What:** Spec declares "Dolt via dolt-server" but the actual codebase uses SQLite. The `bd` CLI reads/writes SQLite with JSONL sync. No migration path or adapter layer specified.
- **Where:** Architecture > Data Layer, Tech Stack table
- **Evidence:** `docs/beads.md` line 3: "Go structs, validated against SQLite schema". `docs/formulas.md` line 210-211: proto and real beads stored in `.beads/ DB` (SQLite).
- **Recommendation:** For MVP, proxy through `bd` CLI (`bd list --json`, `bd show --json`). Add Dolt as a post-MVP migration once the CLI tools support it.
- **Ambiguity:** Should MVP use bd CLI as data layer or attempt direct Dolt integration?

**3. Missing API/backend layer**
- **What:** A browser SPA cannot directly connect to dolt-server (MySQL wire protocol) or invoke CLI commands. No intermediary service is specified.
- **Where:** Architecture section
- **Evidence:** Spec says "Vite + React SPA" and "Connect to local dolt-server" but provides no bridge between them.
- **Recommendation:** Add a lightweight backend (Node HTTP server or Go service) that: (a) proxies `bd` CLI commands for the SPA, (b) serves formula files, (c) invokes cook/pour/sling.

**4. Cook preview "live updates" vs CLI reality**
- **What:** Spec says "Cook preview: updates live as formula is edited" but `bd cook` is a batch CLI operation (outputs JSON to stdout), not a streaming service.
- **Where:** Technical Constraints, Cook Preview Workflow
- **Evidence:** `docs/formulas.md` line 187: "Default (ephemeral): `bd cook` outputs JSON to stdout."
- **Recommendation:** Clarify: "live" means re-invoke `bd cook` on debounced save (e.g., 500ms after last edit). Specify expected cook latency for typical formulas.

**5. Security for CLI invocation**
- **What:** IDE triggers CLI commands but no security controls specified: no argument allowlists, no shell injection prevention, no working-directory restrictions.
- **Where:** Sling Workflow, Architecture
- **Recommendation:** Add security section: use `execFile`-style arg arrays (no shell interpolation), validate all user-provided values, restrict working directory.

### MEDIUM (8 issues)

**6. Missing referenced document**
- **What:** Spec references `spec-review-assessment.md` which was deleted after the review step.
- **Recommendation:** Remove reference from Q&A Reference section.

**7. Scope contradiction: "not CRUD" but has CRUD UX**
- **What:** Spec says "Not a general bead CRUD tool" but Auto-Filled Answers section describes bead creation, editing, and detail panels.
- **Recommendation:** Clarify: bead viewing/inspection is in MVP (read-only from results), but direct bead authoring is post-MVP.

**8. Error handling missing**
- **What:** No failure scenarios documented for: dolt-server down, cook errors on malformed formulas, sling failure, formula validation errors, concurrent modification.
- **Recommendation:** Add Error Handling section with failure modes and expected UX behavior.

**9. Terminology table incomplete**
- **What:** "Cook," "Pour," and "Sling" used throughout spec but not defined in terminology table.
- **Recommendation:** Add these terms with user-facing definitions.

**10. Branch naming convention unvalidated**
- **What:** `draft/<category>/<title>` convention appears only in this spec, not in any existing project docs.
- **Recommendation:** Mark as "proposed convention" rather than existing.

**11. Formula directory discrepancy**
- **What:** Formulas in this project are at `formulas/` but formula search paths spec says `.beads/formulas/`.
- **Recommendation:** Clarify which directories the IDE scans for formulas.

**12. Test strategy missing**
- **What:** No testing approach, test targets, or validation strategy.
- **Recommendation:** Add brief testing section (unit tests for formula parsing, integration tests for CLI invocation, performance benchmarks for graph rendering).

**13. Graph library deferred creates risk**
- **What:** Complex graph requirements (3 layout algorithms, semantic zoom, fisheye, 9 metrics overlay) but library choice deferred.
- **Recommendation:** At minimum identify 2-3 candidate libraries and validate feasibility.

### LOW (5 issues)

**14. Performance targets lack conditions** - Specify browser, device class, interaction types.

**15. TipTap/ProseMirror clarification** - TipTap wraps ProseMirror; use "TipTap (built on ProseMirror)."

**16. Context doc scope mismatch** - context.md describes full vision, not MVP. Add note.

**17. Appendix includes out-of-scope concepts** - Wisps/Atoms/Molecules in appendix but not in MVP.

**18. Beads.md dep count** - Header says 18, table has 19 entries.

---

## Reasoning

### Issue #1 (gt sling): Both models agree this is the top issue. GPT rates CRITICAL, Opus rates HIGH. I agree with CRITICAL -- the spec's execution model is built on a command that serves a different purpose than what the spec implies. `gt sling` dispatches work to agents; it's not a formula cook/pour command. The spec needs to decide whether the IDE does local cook/pour or dispatches to agents.

### Issue #2 (SQLite vs Dolt): Both agree. The practical path for MVP is to proxy through `bd` CLI rather than attempting direct Dolt integration, since the CLI tools don't support Dolt yet.

### Issue #5 (Security): GPT-only finding. Valid concern -- any tool that invokes CLI commands from a web UI needs injection prevention. Worth adding even for a local single-operator tool.

### Issue #7 (Scope contradiction): GPT-only finding. Valid -- the Auto-Filled Answers section describes bead CRUD behaviors that don't belong in a formula-centric MVP. These should be marked as post-MVP.

---

## Ambiguities Summary

| # | Issue | Ambiguity | Options |
|---|-------|-----------|---------|
| 1 | Execution model | Is the IDE for local cook/pour, dispatching to agents via sling, or both? | A: Local cook/pour only, B: Sling to agents only, C: Both |
| 2 | Data layer | Should MVP proxy through bd CLI or attempt direct Dolt? | A: bd CLI adapter, B: Direct Dolt, C: Decide during implementation |

---

## Summary

- **Total Issues:** 18 (1 critical, 4 high, 8 medium, 5 low)
- **Ambiguities Requiring Decision:** 2
- **Model Agreement Rate:** 50% (10 of 20 issues found by both models)
- **Models That Failed:** Gemini 3 Pro (CLI not installed)
