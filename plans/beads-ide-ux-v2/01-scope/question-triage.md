# Question Triage: beads-ide-ux-v2

**Scope selected:** P0 + P1
**Questions in scope:** 38
**Auto-answerable:** 25
**Branch points for human:** 13

---

## Auto-Answerable Questions

| # | Question (shortened) | Proposed Answer | Source |
|---|---------------------|-----------------|--------|
| 1 | Conflict resolution when editing same step in TOML and step editor simultaneously? | Not possible in current architecture. TOML is the single source of truth. The step editor panel modifies the TOML string via `updateStepField()` -- both surfaces write to `tomlContent` state. Text mode and visual mode are never visible simultaneously (toggle switches between them). The step editor panel appears only in visual/flow mode and writes directly to the same TOML state. No conflict is possible because there is only one data path. | Codebase: `formula.$name.tsx` lines 260-275 show `handleStepFieldChange` calls `updateStepField` on `tomlContent`. Both surfaces mutate the same React state. |
| 2 | Which editing surface is source of truth: graph, step list, or panel? | TOML text is the single source of truth. The visual builder is a read-only rendering of cooked output. The step editor panel writes back to TOML. This is the VS Code model: file is truth, views are projections. | Codebase: `visual-builder.tsx` is stateless (receives `steps` as props). `formula.$name.tsx` line 7 comment: "Visual view updates automatically when TOML changes (one-way sync)." |
| 3 | Does step editor panel replace or supplement text editor? What if both open? | It is a supplemental editing surface available only in visual/flow modes. Text mode and visual mode are mutually exclusive (toggle). When in visual mode, the step editor appears as a side panel. They cannot both be "open" simultaneously. | Codebase: `formula.$name.tsx` lines 290, 453-498 show view modes are exclusive. `showSidePanel` only renders when `viewMode === 'visual' \|\| viewMode === 'flow'`. |
| 7 | Full flow when unsaved changes exist and user navigates away? | Follow VS Code convention: show modal dialog with Save / Don't Save / Cancel. Save writes to disk, Don't Save discards, Cancel returns to editor. Browser `beforeunload` event prevents accidental tab close. This is universal across VS Code, JetBrains, Sublime, and every major editor. | Industry standard: VS Code, JetBrains IDEs, Figma (for unsaved files), Google Docs (different model but same intent). |
| 8 | Can screen reader users navigate formula structure and edit step properties? | Require: (1) formula outline view as accessible tree with ARIA tree roles, (2) step editor panel with proper form labels, (3) live region announcements for graph changes. The outline view is the accessible alternative to the visual DAG -- this is the pattern used by GitHub (code view vs. rich diff), Figma (layers panel for canvas). Graph visualization should have `aria-label` describing structure and a "skip to outline view" link. | Industry: GitHub accessibility model, WAI-ARIA Authoring Practices for tree views. Codebase gap: known gap is form labels not using `<label htmlFor>`. |
| 9 | Keyboard navigation pattern between steps in visual mode? | Arrow keys for directional navigation in the DAG (Up/Down for upstream/downstream, Left/Right for siblings at same rank). Tab cycles through interactive elements within a node. Enter or Space opens the step editor. Escape deselects. This follows ReactFlow's built-in keyboard support plus DAG-aware traversal. Outline view uses standard tree keyboard nav (Up/Down, Left/Right expand/collapse). | Industry: ReactFlow keyboard support, WAI-ARIA tree pattern, VS Code outline keyboard nav. |
| 10 | Can color-blind users distinguish expansion groups without color alone? | Add secondary differentiators: (1) distinct border patterns per group (solid, dashed, dotted, dash-dot, double, thick), (2) group icon/number badge in header, (3) pattern fills or hatching at low opacity. The current 6-color palette (indigo, emerald, amber, red, purple, sky) is not fully distinguishable under protanopia/deuteranopia. Must pair each color with a unique non-color signal. | Industry standard: WCAG 1.4.1 "Use of Color." Codebase: `visual-builder.tsx` lines 121-128 show 6 colors with no secondary differentiators. |
| 14 | How to prevent visual overwhelm with complex overlapping expansion groups? | Progressive disclosure: (1) collapsed groups by default showing only header + step count, (2) expand on click, (3) semantic zoom -- groups auto-collapse when zoomed out past threshold, (4) minimap for orientation, (5) focus mode that dims non-selected groups. This is how n8n, Figma, and Miro handle complex canvases. | Industry: n8n (collapsible sub-workflows), Figma (frame collapse), Miro (grouping), Blender (node group collapse). Codebase already has MiniMap. |
| 15 | Visual hierarchy within expansion group container? | Group header is visually distinct (colored bar with group name + step count -- already implemented). Steps inside are standard nodes. Metadata (step count, group name) lives in the header row; individual step nodes show step-level info. The container border + background color separates group chrome from step content. | Codebase: `visual-builder.tsx` lines 324-360 show GroupNode with header containing label and step count, distinct from child StepNodes. |
| 17 | Color strategy when more than 6 expansion groups? | Cycle through the 6-color palette with modular arithmetic (already implemented via `colorIndex % GROUP_COLORS.length`). Add secondary differentiator (border pattern, number badge) to distinguish groups sharing a color. This is the standard approach in charting libraries (D3, Chart.js) and IDE themes. | Codebase: `visual-builder.tsx` line 322: `GROUP_COLORS[data.colorIndex % GROUP_COLORS.length]`. Already cycles. Need to add secondary differentiator for collision cases. |
| 18 | Visual treatment for active/selected vs hovered vs keyboard-focused node? | Three distinct states: (1) **Selected**: 2px solid blue border + blue glow shadow (already implemented), (2) **Hovered**: slightly lighter background + subtle border change (CSS `:hover`), (3) **Keyboard focused**: 2px dashed outline offset (CSS `:focus-visible` with `outline`). Never rely on color alone for any state. | Industry: VS Code tree items, Figma layer selection, WAI-ARIA focus management. Codebase: `visual-builder.tsx` lines 132-163 show selected state; hover and focus states need addition. |
| 20 | How to dismiss step editor panel? | All of: close button (X), Escape key, clicking another node (replaces content), clicking empty canvas (closes). This matches VS Code sidebar panel behavior and Figma inspector behavior. The close button already exists and Escape is already hinted in the tooltip. | Codebase: `step-editor-panel.tsx` line 242 shows close button with `title="Close (Esc)"`. `formula.$name.tsx` lines 566-569 show pane click deselects. |
| 22 | How is cross-group edge highlighting triggered? | On node selection: highlight all edges connected to the selected node and dim others. On group selection (click group header): highlight all cross-group edges for that group. No separate toggle needed for MVP -- selection-driven highlighting is the standard pattern in ReactFlow, n8n, and GitHub Actions workflow viewer. | Industry: ReactFlow default behavior, n8n node selection, GitHub Actions job dependency highlighting. |
| 24 | How do users discover keyboard shortcuts exist? | Three-tier discovery: (1) Tooltips on toolbar buttons show shortcut hint (e.g., "Cook Preview (Cmd+Enter)"), (2) Command palette (Cmd+K) shows shortcuts next to each action, (3) First-session toast or subtle hint banner "Tip: Press Cmd+K for keyboard shortcuts." This is the VS Code + Figma pattern. | Industry: VS Code (tooltips + command palette), Figma (tooltips + help menu), Slack (Cmd+/ shortcut list). Codebase: command palette already exists at `command-palette.tsx`. |
| 25 | Where should keyboard shortcut help live? | All three: (1) persistent affordance via `?` icon in bottom-right or status bar, (2) command palette entry "Keyboard Shortcuts", (3) modal overlay triggered by `Cmd+/` or `?`. VS Code does all three. Command palette already exists. | Industry: VS Code (Cmd+K Cmd+S), GitHub (press `?`), Figma (Cmd+/ or Help menu). |
| 26 | Can users reference shortcuts panel while working? | Yes -- either as a non-modal side panel or a pinnable overlay. Must not block workspace. VS Code opens shortcuts as a tab (non-modal). Figma uses a floating panel. Either pattern works; non-modal is the clear best practice. | Industry: VS Code (opens as editor tab), Figma (floating panel), JetBrains (searchable dialog). |
| 28 | Transition animation between text and visual mode? | Instant swap with no animation. Mode toggle is a tab-like control (already implemented as toggle buttons). Cross-fades or slides would add latency to a frequent action and create a false impression of spatial relationship. VS Code, JetBrains, and GitHub all use instant swap for editor mode toggles. | Industry: VS Code (instant toggle between split/preview for markdown), GitHub (instant Code/Preview toggle), JetBrains (instant Design/Text for XML). |
| 32 | What happens when formula has zero expansion groups? | The outline/visual view shows a flat list of step nodes with no group containers. This already works -- the code checks `groupPrefixes.size === 0` and returns step nodes directly without groups. The view is still coherent as a simple DAG. | Codebase: `visual-builder.tsx` lines 485-487: `if (groupPrefixes.size === 0) return { initialNodes: layoutedStepNodes, initialEdges: edges }`. |
| 33 | Do loading states explain what is happening? | Yes. Use descriptive loading messages: "Loading formula...", "Cooking formula...", "Saving...", "Parsing TOML...". Already partially implemented. Generic spinners should be replaced with context-specific messages. This is the pattern in VS Code ("Loading extensions..."), Vercel ("Building..."), and GitHub Actions (step-level status). | Codebase: `formula.$name.tsx` lines 443-447 already show "Loading formula..." vs "Cooking formula..." conditionally. Extend this pattern. |
| 34 | Slow loading experience: skeleton, progress, or partial render? | Skeleton UI for initial load (panel shapes shimmer), descriptive text for cooking/parsing ("Cooking formula... 12 steps"), cancellable for long operations (>5s). This follows Vercel, GitHub, and VS Code patterns. Partial render is acceptable for visual builder (show nodes as they compute). | Industry: GitHub (skeleton for code view), Vercel (progress text for builds), VS Code (partial rendering for large files). |
| 36 | Error recovery when step edit fails to save (TOML serialization error)? | Keep the user's edit in the form fields (don't discard). Show inline error below the field with specific message ("Invalid TOML: unclosed string at line 14"). Offer "Revert to last saved" as escape hatch. Red border on the errored field. This is the standard form validation pattern. | Industry: VS Code (red squiggly + problems panel), Figma (inline validation), every web form. Codebase: `formula.$name.tsx` lines 263-270 already re-parse after field change and capture errors. |
| 37 | What happens when user opens formula with malformed TOML? | Land in text mode with error highlighting. Show parse errors inline (red squiggles via CodeMirror) and in a problems panel/banner. Do not attempt visual mode rendering. This is exactly what VS Code does with malformed JSON/YAML. The current code already handles this: parse errors are captured and displayed. | Codebase: `formula.$name.tsx` lines 222-229 parse on load and set errors. Line 451 shows error display. CodeMirror supports error decorations. |
| 38 | What happens if user creates circular dependency via step editor? | Validate immediately on selection in the NeedsSelector. If adding dep X would create a cycle, disable that option with tooltip "Adding this dependency would create a circular reference: A -> B -> ... -> A". Do not allow the invalid state to persist. This is the pattern in GitHub Actions (rejects circular job dependencies), n8n (prevents circular connections), and Terraform (rejects circular module refs). | Industry: n8n (prevents circular connections at draw time), GitHub Actions (build-time cycle detection), Make/Bazel (immediate cycle error). |

---

## Branch Points (Human Decision Required)

| # | Question (shortened) | Why Human Needed |
|---|---------------------|------------------|
| 4 | Does "unsaved changes" cover only formula text, or also panel edits, layout, filters? | Scope of "unsaved" is a product decision. Broader scope = more warnings = more annoyance. Narrower scope = risk of silent data loss for layout preferences. VS Code tracks only file content; Figma tracks everything. Which mental model fits beads IDE? |
| 5 | Auto-save (Google Docs model) vs explicit save (VS Code model)? | Fundamental UX philosophy choice. Auto-save reduces data loss risk but removes user control over when changes become "real." Explicit save gives control but requires user discipline. The codebase currently has no save-to-disk mechanism at all -- edits live only in React state. This is a high-impact architectural decision. |
| 6 | What happens when user triggers pour/sling with unsaved changes? | Depends on answer to #5 (save model). If auto-save: no issue, state is always saved. If explicit save: must decide between (a) auto-save before execution, (b) warn and block, or (c) execute from last saved state with warning. Each has real tradeoffs for user trust. |
| 11 | What is an "expansion group" in user-facing terms? | Domain-specific terminology that only the product owner can define. Is it a macro expansion (like C preprocessor), a template instantiation (like Terraform modules), or a sub-workflow (like n8n sub-flows)? The metaphor choice affects how users think about editing, debugging, and composition. The codebase treats it as step ID prefix grouping but the conceptual model is undefined. |
| 12 | What is a "bead" in the user mental model? | Core product metaphor that defines the entire UX. A bead could be a task (Jira-like), a unit of work (CI job), a dependency graph node (Make target), or something novel. The answer shapes terminology, iconography, onboarding, and documentation. Only the product creators know the intended metaphor. |
| 13 | Primary user persona: developer, operator, or manager? | UX priorities diverge dramatically. Developer persona prioritizes: text editing speed, keyboard shortcuts, terminal integration. Operator persona prioritizes: execution monitoring, error recovery, status at a glance. Manager persona prioritizes: overview, progress tracking, reporting. Cannot infer from codebase -- current UI has elements for all three. |
| 16 | Should cross-group edges be visible at all zoom levels? | Genuine tradeoff. Always-visible edges add noise at low zoom but ensure no hidden dependencies. On-demand edges (hover/zoom) reduce clutter but risk users missing critical cross-group dependencies. The right answer depends on whether the primary use case is authoring (hide clutter) or debugging (show everything). Depends on #13 (persona). |
| 19 | What gesture triggers inline step editing: single click, double click, or edit button? | Real tradeoff with no consensus. Single click (current implementation) is fastest but conflicts with selection. Double click is conventional for "open/edit" but adds latency. Dedicated edit button is safest but adds visual clutter. n8n uses double-click, Figma uses double-click, VS Code uses single-click for selection + Enter for edit. Current code uses single click for both select and open panel. |
| 21 | Should updates save instantly, on explicit save, or both with undo? | Directly tied to #5 (save model). This is the same decision viewed from the interaction angle. If auto-save: instant with undo (Cmd+Z). If explicit: save button/Cmd+S. "Both" (auto-save + undo) is a valid third option (Figma model). Cannot auto-answer without #5. |
| 23 | Expected behavior when editing a step while filter/search is active? | Multiple valid approaches: (a) edited step stays visible regardless of filter (Figma behavior), (b) step disappears if edit makes it no longer match filter (VS Code behavior), (c) filter auto-clears on edit (simpler but disorienting). No clear industry consensus -- depends on whether filters are seen as persistent workspace state or temporary lenses. |
| 27 | How does user experience transition when switching modes mid-task? | Depends on answers to #5 (save model) and #29 (in-progress edits on switch). If auto-save: seamless transition, all edits preserved. If explicit save: need to decide whether mode switch triggers save prompt or silently preserves in-memory state. The "feel" of the transition (jarring vs smooth) depends on these upstream decisions. |
| 29 | If user switches modes while step editor panel is open, what happens to in-progress edits? | Depends on #5 (save model). If auto-save/live-write-to-state: edits are already in TOML state, safe to close panel. If buffered/explicit-save: must decide whether to (a) warn, (b) auto-save panel state, or (c) discard. Current implementation writes to state immediately via `onFieldChange`, so edits are preserved -- but this may change with save model decision. |
| 30 | Design scale: 5 formulas with 5 steps or 500 formulas with 50+ steps? | Product roadmap question. Current codebase has 4 formulas with 5-7 steps each. If scale target is 500+, need virtualization, search, pagination, and lazy loading. If staying small (< 20 formulas, < 20 steps), current approach is fine. The answer drives significant architectural decisions around performance and UX patterns. |

---

## Question Dependencies

```
#5 (save model) ──┬──> #4 (unsaved changes scope)
                   ├──> #6 (pour/sling with unsaved)
                   ├──> #21 (instant vs explicit save)
                   ├──> #27 (mode switch experience)
                   └──> #29 (panel edits on mode switch)

#13 (primary persona) ──┬──> #16 (cross-group edge visibility)
                         ├──> #30 (design scale target)
                         └──> #19 (edit gesture choice -- influenced but not blocked)

#11 (expansion group definition) ──> #15 (hierarchy within group -- partially answered by codebase)
                                  ──> #14 (visual overwhelm -- partially answered)

#12 (bead mental model) ──> #11 (expansion group definition -- conceptually linked)

#30 (scale target) ──> #31 (handling 50+ step formulas)

#5 (save model) + #19 (edit gesture) ──> #20 (dismiss panel behavior -- partially answered)

#1, #2, #3 are pre-answered by codebase (no downstream blockers)
```

---

## Interview Plan

**Round 1: Core Decisions** (4 questions)

These unlock the most downstream answers:

1. **#13 - Primary user persona?** Unlocks: #16 (edge visibility), #30 (scale), influences #19 (gesture)
2. **#12 - What is a "bead"?** Unlocks: #11 (expansion group definition), shapes all terminology
3. **#5 - Auto-save or explicit save?** Unlocks: #4, #6, #21, #27, #29 (5 downstream questions)
4. **#11 - What is an "expansion group" in user terms?** Unlocks: clarity on #14, #15 visualization

**Round 2: Cascaded Confirmations** (5 questions)

Based on Round 1 answers, confirm inferred positions:

5. **#19 - Edit gesture: single click, double click, or button?** (Informed by persona from #13)
6. **#30 - Scale target: small or large?** (Informed by persona from #13)
7. **#6 - Pour/sling with unsaved changes?** (Determined by #5 save model answer)
8. **#16 - Cross-group edges always visible or on-demand?** (Informed by #13 persona)
9. **#23 - Behavior when editing during active filter?** (Standalone but informed by overall UX philosophy)

**Round 3: Standalone Branch Points** (4 questions)

No dependencies, but human judgment needed:

10. **#4 - Scope of "unsaved changes" tracking?** (Informed by #5 but still a distinct product call)
11. **#21 - Instant save, explicit save, or both with undo?** (Confirm approach from #5)
12. **#27 - Mode switch experience with pending edits?** (Confirm based on #5 + #29)
13. **#29 - Panel edits on mode switch?** (Confirm based on #5)

---

**Estimated dialogue:** ~13 questions for human (effectively ~6-8 after cascading from Round 1), ~25 auto-noted

**Cascading efficiency:** Round 1's 4 questions directly resolve or strongly constrain 9 additional questions. If the human answers Round 1 decisively, Round 2 and Round 3 may reduce to quick confirmations rather than open-ended discussions.

---

## Notes on Auto-Answered Questions

Several questions (#1, #2, #3) were flagged as critical by both models but are already resolved by the codebase architecture. The TOML-as-source-of-truth pattern with one-way sync to visual views eliminates the entire class of dual-editing-surface conflicts. This is a strength of the current design that should be preserved and documented rather than redesigned.

Questions #8, #9, #10 (accessibility) have clear answers from WCAG guidelines and WAI-ARIA authoring practices. The work needed is implementation, not design decisions.

Questions #33, #34, #36, #37, #38 (loading states, error recovery) follow well-established patterns from VS Code and similar developer tools. The answers are conventional and do not require human input.
