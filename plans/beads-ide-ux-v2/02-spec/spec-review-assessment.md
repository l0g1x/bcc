# Spec Review Assessment: beads-ide-ux-v2

**Reviewed:** 2026-02-23
**Spec version:** Validated (2026-02-23)
**Reviewer approach:** Dual assessment (completeness check + fresh review)

---

## Completeness Check

**Scope:** P0 + P1 (38 questions)
**Addressed:** 36/38
**Deferred:** 0
**Missing:** 2

### Coverage Matrix

All 13 P0 questions (1-13) are explicitly addressed in the spec's P0 table with clear answers, decision rationale, and source attribution. No gaps.

Of the 25 P1 questions (14-38), the spec addresses 23 explicitly. Two are missing:

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 31 | How should the IDE handle formulas with 50+ steps and dense cross-group dependencies? | **Missing** | The spec's P1 table groups "31-38" together with a reference to "See auto-answered table below," but the auto-answered table lists only 32, 33, 34, 36, 37, 38. Question 31 is absent from both tables. Question 30 (design scale) partially addresses this by setting a "50-100 formulas, 20-50 steps" target with "search/filter, lazy loading," but 31 asks specifically about dense cross-group dependency UX at scale -- a distinct interaction design question. |
| 35 | How should "Pour" and "Sling" actions communicate progress: progress bar, spinner, log stream, or combination? | **Missing** | Also absent from the auto-answered table. The spec mentions Pour/Sling only in the context of unsaved changes warnings (question 6). Progress communication for potentially long-running execution operations is not addressed anywhere in the spec. Question-triage.md also has no entry for 35. This question appears to have been dropped during the triage-to-spec pipeline. |

### Coverage Quality for Addressed Questions

The 36 addressed questions are generally well-handled:

- **P0 questions:** All 13 have specific, implementable answers with clear rationale. The architecture diagram (TOML-as-source-of-truth) resolves questions 1-3 elegantly.
- **Human decisions (13):** All recorded with "Human choice" attribution. The answers are internally consistent -- the save model decision (#5) correctly cascades through #4, #6, #21, #27, #29.
- **Auto-answered (25):** Answers cite industry standards (VS Code, Figma, WCAG) and codebase evidence. The auto-answered table in the spec is a compressed summary; the full answers live in question-triage.md with detailed rationale.

---

## Fresh Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Objective | Clear | The spec clearly defines five interconnected areas (expansion groups, accessibility, visual polish, UX flow, step editor panel). What changes vs. what stays is explicit -- the "Out of Scope" section (8 items) and "Integration Points > Existing Components to Leverage" section make boundaries clear. The architecture diagram shows the TOML-as-truth model is preserved, not replaced. |
| Done Criteria | Minor gap | The spec defines component states, user flows, and error handling, which are implicitly testable. However, there are no explicit acceptance criteria or test cases. For example, "skip navigation link, visible on focus" is implementable but there is no stated criterion like "screen reader announces 'Skip to main content' when page loads." The user flows (4 of them) are close to acceptance scenarios but lack pass/fail framing. |
| Scope | Clear | Files in scope are listed under "Integration Points > Existing Components to Leverage" (5 specific files). "Out of Scope" lists 8 explicitly excluded items. Components are well-bounded (5 components with clear responsibilities). The scope is unambiguous enough for implementation. |
| Constraints | Minor gap | Performance: question 30 sets a scale target (50-100 formulas, 20-50 steps) but no specific performance budgets (e.g., render time, interaction latency). Compatibility: no browser/OS requirements stated. Style: design system values are in context.md but the spec doesn't reference them or state whether they should be followed, extended, or replaced. Accessibility: WCAG level not explicitly stated (AA vs. AAA) -- question 52 (contrast ratios) was deferred to P2. |
| Dependencies | Clear | External dependencies are well-documented: ReactFlow, CodeMirror, Sonner, react-resizable-panels, Tailwind, smol-toml. Integration points reference specific existing files. No new external dependencies are introduced. The spec leverages what exists rather than introducing new libraries. |
| Safety | Minor gap | The spec notes "No schema changes required" and "All features work with existing structures," which limits migration risk. However, there is no explicit rollback plan if the UX changes degrade usability. The "Open Questions" section acknowledges 4 unresolved items but doesn't assess their risk. The `beforeunload` handler for unsaved changes is a safety mechanism but its failure modes aren't discussed (e.g., what if the browser ignores it, which Chrome does for some cases). |

---

## Prioritized Gaps

### Critical (must resolve)

None. The two missing questions (31, 35) are P1, not P0. No P0 questions are unaddressed, and no fresh assessment category received a "Major gap" rating. The spec is fundamentally sound.

### Important (should resolve)

1. **Question 31 -- Dense cross-group dependency UX at scale.** The spec sets a scale target (20-50 steps) but doesn't address what happens when those steps have dense cross-group edges. Progressive disclosure (question 14) covers group collapse, but tangled edge rendering at 30+ cross-group dependencies is a distinct visual problem. A brief answer would suffice: e.g., "edge bundling" or "highlight-on-demand only" or "defer to post-v2 if the 20-50 step target is met."

2. **Question 35 -- Pour/Sling progress communication.** These are primary user actions. The spec handles the unsaved-changes gate (question 6) but not what users see during execution. Even a one-line answer would close this: "Log stream in detail panel with elapsed time, matching existing Sonner toast pattern for completion."

3. **Acceptance criteria formalization.** The four user flows are good narrative descriptions but lack explicit pass/fail criteria. Converting each flow into a checklist (e.g., "Given: user has unsaved changes. When: user clicks sidebar link. Then: modal appears with three options.") would reduce ambiguity during implementation and review.

4. **Performance constraints.** The scale target exists but no performance budgets. For a reactive UI, stating targets like "mode switch < 100ms, node selection response < 50ms, initial render of 50-step formula < 1s" would prevent performance regressions from going unnoticed.

5. **WCAG conformance level.** The spec references WCAG 1.4.1 and describes accessibility features but doesn't state the target conformance level (AA is the practical standard for web apps). This affects implementation decisions around contrast ratios, focus indicators, and text sizing.

### Nice to Have

1. **Browser/OS compatibility statement.** The tech stack implies modern evergreen browsers, but stating "Chrome/Firefox/Safari latest two versions, macOS/Linux" would prevent edge-case work.

2. **Rollback plan.** Since this is a UX improvement (not a migration), rollback is essentially "revert the commits." But stating this explicitly removes ambiguity.

3. **Keyboard shortcut inventory.** The spec lists four core shortcuts (Cmd+S, Cmd+Z, Cmd+K, Escape) and mentions Cmd+Enter and Cmd+/ in passing. A complete shortcut table would be useful for implementation but could be deferred to the implementation beads.

4. **Priority field range.** Context.md says the step editor has "Priority (0-10)" but the spec says "Priority (0-4)." This discrepancy should be clarified -- it may reflect a deliberate scope change or a transcription error.

5. **Open Questions risk assessment.** The four open questions in the spec are flagged but not risk-rated. The recursive instantiation question (bullet 2) could affect the visual builder architecture; a brief "low risk for v2 because recursive formulas are rare" note would help.

---

## Conclusion

The spec is ready for implementation with minor additions. It addresses 36 of 38 in-scope questions with clear, internally consistent answers. The architecture decision (TOML-as-source-of-truth with explicit save model) is well-reasoned and correctly cascaded through all dependent questions. The five components are clearly bounded with defined states, behaviors, and integration points.

The two missing questions (31, 35) are P1-level gaps that can be closed with brief answers -- neither requires rethinking the spec's architecture. The three "Important" process gaps (acceptance criteria, performance budgets, WCAG level) are about implementation rigor rather than design clarity.

**Verdict:** Proceed to implementation beads. Address the 5 "Important" items in parallel -- they refine the spec but do not block work from starting.
