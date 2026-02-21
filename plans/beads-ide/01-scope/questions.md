# Multimodal Scope Questions: beads-ide

## Models Used
- Opus 4.6: ✓
- GPT 5.3: ✓
- Gemini 3 Pro: ✗ Skipped (CLI not installed)

## Summary
- Raw questions from analyses: 357 (Opus: 199, GPT: 158)
- After deduplication: 187 unique questions
- P0: 32, P1: 62, P2: 58, P3: 35

---

## P0: Must Answer (Critical)

These questions were flagged by both models or have critical impact on feasibility and adoption.

### Identity & Mental Model

1. **Will users expect this to feel like a project management tool (Jira, Linear) or a code IDE (VS Code)?** (Opus, GPT)
The name "IDE" sets strong expectations. GPT frames this as interaction style mismatch causing early rejection. Opus notes daily cognitive friction from naming. The product must pick a primary metaphor.

2. **What exactly is a "bead" -- is it a task, decision, requirement, issue, or all of these?** (Opus, GPT)
Opus notes the schema uses "Issue" as Go struct while CLI uses "bead." GPT asks about user mental models. Without a clear answer, authoring and graph interpretation become inconsistent.

3. **What is the precise meaning of "molecule" -- workflow instance, template, running process, or all three at different times?** (Opus, GPT)
Opus identifies overloading across formula type / spawned workflow / pour output. GPT asks how users should distinguish molecule from epic, feature, gate, slot, agent. Critical for daily planning.

4. **What is a "formula" to a non-technical user -- template, recipe, macro, workflow definition, or programming language?** (Opus, GPT)
Opus notes formulas combine aspects of all. GPT asks whether "formula" implies low/no-code or syntax-heavy authoring. Mismatch causes immediate rejection.

5. **What terminology needs standardization in the UI (bead, molecule, formula, branch, canonical, pour, cook, wisp, liquid, vapor)?** (Opus, GPT)
Both models flag domain jargon as the single largest adoption risk. Opus counts terms like convoy, gate, wisp, liquid phase. GPT emphasizes UI-level standardization.

### Core Workflow & Purpose

6. **What is the user actually trying to accomplish on a typical day -- planning work, tracking progress, or analyzing architecture?** (Opus, GPT)
Opus notes the IDE spans planning, execution, and analysis. GPT asks what "job" the user completes in one sitting (plan, align, decide, handoff). Without a primary workflow, the tool serves none well.

7. **Is the real problem that markdown PRDs are a bad authoring format, or that the translation from intent to structured work is lossy regardless of format?** (Opus, GPT)
Opus asks whether a better editor solves the root cause. GPT asks whether markdown is actually the bottleneck or if review/approval latency is. Must answer to justify the IDE's existence.

8. **Do users actually want to author work graphs directly, or do they want to describe work in natural language and have the graph be derived?** (Opus)
If users prefer natural language input with graph preview, the IDE's primary interface should be fundamentally different from a graph editor. Critical architectural question.

9. **Is "multi-model convergence" a user need or a capability looking for a use case?** (Opus, GPT)
Both models question whether anyone has asked for this. Opus is explicit about it being a "technical possibility promoted to a feature." GPT asks what human value convergence solves: confidence, speed, or diversity.

10. **Are we building a tool for one person (the codebase compiler operator) or a collaborative platform for teams?** (Opus, GPT)
Opus notes this changes everything: single-user means no collaboration, multi-user means collaboration is table stakes. GPT asks about real-time collaboration expectations shaped by modern shared editing tools.

### Undo, Safety & Recovery

11. **Do users expect undo/redo to work across all operations (bead creation, edge manipulation, formula changes, batch operations)?** (Opus, GPT)
Both models flag undo as critical for trust. Opus notes trust collapses without Ctrl+Z. GPT notes fear of irreversible edits reduces exploration. Both flag the architectural challenge of mixed-operation undo.

12. **What happens when a user runs a formula that generates many wrong beads -- is there transactional rollback?** (Opus, GPT)
Opus asks about batch undo for 50 wrong beads. GPT asks about recovery flow for bulk incorrect dependencies. Opus notes pour creates beads atomically from CLI but graph undo is single-action, creating a mismatch.

13. **What happens when a user deletes a bead that other beads depend on?** (Opus, GPT)
Cascading dependency breakage is a common graph editing hazard. Both models ask whether the IDE warns, prevents deletion, or tombstones the bead. GPT asks about confirmation thresholds for destructive actions.

### Graph Visualization & Scale

14. **Will users expect the graph visualization to be the primary interface or a secondary view?** (Opus, GPT)
Opus notes some users think visually, others in lists. GPT asks whether non-visual thinkers can succeed without dense graph views. The choice defines the product's identity.

15. **How does the IDE handle graphs with 200+ beads where visualization becomes unreadable?** (Opus, GPT)
Opus notes the upper bound is 500 beads and no force-directed layout handles that. GPT asks about overloaded-state flows. Both flag clustering, collapsing, and focus modes as essential.

16. **When a user has 150 beads, how do they find the 3 that matter right now?** (Opus, GPT)
Opus asks about filtering, sorting, pinning, focus mode. GPT asks about default filters/views for overloaded graphs. Without this, the tool becomes unusable at exactly the point where it should be most valuable.

### Branching & Merge Conflicts

17. **What does a merge conflict look like for a work graph -- and how is it resolved?** (Opus, GPT)
All perspectives in both models flag this. Opus: "work graph merge conflicts have no established resolution model." GPT: "conflict recovery must be understandable to non-specialists." Novel UX design required before development.

18. **Do users expect branch and diff workflows to feel as simple as GitHub PRs?** (Opus, GPT)
Both models map Dolt branching to users' GitHub/GitLab mental model. Users will expect familiar diff views, conflict markers, and merge previews.

19. **What does "canonical" mean in "distill to canonical" and who decides what is canonical?** (Opus, GPT)
Opus asks who arbitrates and what happens when models disagree fundamentally. GPT asks what a "good convergence session" looks like. Without clear definition, convergence has no finish line.

### Onboarding & First Experience

20. **What is the user's first 5-10 minutes like -- what do they see when they open the IDE for the first time?** (Opus, GPT)
Both models flag first impressions as deterministic for adoption. Opus: "An empty graph with no guidance will make users close the tab." GPT: "Early wins determine long-term adoption."

21. **How does a user learn the bead schema (30+ fields, 18 dependency types) without reading documentation?** (Opus, GPT)
Opus emphasizes progressive disclosure. GPT asks whether domain-heavy terminology alienates newcomers. Both agree dumping all fields overwhelms.

22. **How does a user get from vague idea to structured bead graph without feeling overwhelmed?** (Opus, GPT)
Opus asks about the transition from exploring a codebase to planning work. GPT frames this as early-stage ambiguity where many tools lose users.

### Accessibility

23. **Can a screen reader user navigate and edit the dependency graph?** (Opus, GPT)
Both flag graph visualization as inherently visual. Opus: "Without an alternative representation, blind and low-vision users are completely locked out." GPT: "Complex relational data is often inaccessible without intentional narration."

24. **Can colorblind users distinguish bead types, statuses, and metric overlays?** (Opus, GPT)
Both note roughly 8% of male users affected. Dependency/status meaning cannot rely on color alone.

25. **Is the IDE usable with keyboard only (no mouse)?** (Opus, GPT)
Both note graph manipulation typically requires drag-and-drop. Users with motor impairments or strong keyboard preferences need an alternative interaction model.

26. **Does the IDE work on 13-inch laptop screens or does it require a large monitor?** (Opus, GPT)
Both flag that graph visualization, bead editing panels, and formula builders competing for screen real estate could make the IDE unusable on common hardware.

### Problem Validation

27. **What problem does the IDE solve that the CLI does not -- is it discoverability, visualization, speed, or something else?** (Opus, GPT)
Opus: if the CLI is functionally complete, the IDE must offer a categorically different experience. GPT asks what the replacement behavior and true competitor set are.

28. **Is the core pain point that humans cannot effectively author bead graphs, or that AI agents produce graphs that humans cannot review and correct?** (Opus)
The direction of the workflow (human-to-graph vs graph-to-human) fundamentally changes design priorities. Must answer before any wireframing.

29. **Is the bead schema stable, or will it continue to evolve -- and how does the IDE handle schema evolution?** (Opus, GPT)
Opus notes 40+ fields and custom types suggest ongoing evolution. GPT asks about lifecycle for rare statuses (tombstone, pinned, hooked). IDE must accommodate change without hardcoding layouts.

### Scope Boundaries

30. **What is explicitly out of scope in phase one?** (Opus, GPT)
GPT asks directly. Opus asks whether the IDE can be adopted incrementally (bead CRUD first, then graph viz, then formulas) or requires all features at once.

31. **Does the "separate runtime" for executing work graphs need to be visible in the IDE, or is this purely an authoring tool?** (Opus, GPT)
Opus: if users cannot see execution status, the IDE becomes a dead-end. GPT asks about the boundary between "work graph authoring" and "workflow execution runtime."

32. **What is the relationship between the IDE and the `bv` (Beads Viewer) tool -- is the IDE replacing it, extending it, or wrapping it?** (Opus)
The brief mentions graph visualization and all 9 metrics, which is exactly what `bv` already does. Critical to avoid duplicate tooling confusion.

---

## P1: Should Answer (Important)

### User Expectations & Experience

33. **Do users expect real-time collaboration (Google Docs-style)?** (Opus, GPT)
Modern web-based tools have trained users to expect multiplayer. Both models flag this. If single-user, state it upfront.

34. **Will users assume they can import existing work (from Jira, Linear, GitHub Issues, markdown PRDs) into the IDE?** (Opus, GPT)
Opus: any tool that claims to "replace" a workflow must offer a migration path. GPT asks about migration expectations from current PRD artifacts.

35. **Do users expect bead editing to feel like writing in Notion or Google Docs?** (Opus, GPT)
"Rich-text editing" sets the bar at modern block-based editors. If it feels like a basic textarea, it will feel dated on first use.

36. **Will users assume the formula builder works like a no-code workflow tool (Zapier, n8n, Retool)?** (Opus, GPT)
Opus: if this is actually a TOML editor with syntax highlighting, users expecting drag-and-drop will be disappointed.

37. **Do users expect keyboard shortcuts for everything?** (Opus)
The "IDE" framing attracts power users who navigate entirely by keyboard. Common operations requiring mouse clicks will feel slow.

38. **Will users expect search and filtering to be fast and faceted?** (Opus)
With 50-200 beads and complex metadata, users need to slice by type, status, label, assignee, priority. Title-only text matching is insufficient.

39. **Will users expect notifications or a feed of changes made by other models/agents?** (Opus, GPT)
Multi-model convergence implies multiple actors. GPT asks about social visibility (who changed what and why). Both expect a changelog or activity feed.

40. **Do users expect to see formula output (generated beads) before committing it?** (Opus, GPT)
Both flag "dry run" previews as table stakes. GPT asks about the template-select, variable-fill, preview, confirm sequence.

41. **Do users expect the IDE to prevent invalid states, not just warn about them?** (GPT)
GPT notes users expect safety rails in visual tools, especially for shared work graphs. This distinguishes warning-based from prevention-based design.

42. **Will users assume this replaces markdown completely, including review and approval rituals?** (GPT)
If required steps still live outside the IDE, users perceive it as partial, not replacement.

43. **Do users expect links between beads and source code to be bidirectional and obvious?** (Opus, GPT)
Opus mentions "bridges beads to source code." GPT: one-way linking feels incomplete and breaks mental continuity.

### Graph & Visualization Design

44. **Should the IDE use a single-page layout or a multi-panel workspace like VS Code?** (Opus, GPT)
Opus: multi-panel provides simultaneous context but risks overwhelming new users. GPT asks about the default layout split.

45. **Should the dependency graph use a force-directed layout, hierarchical layout, or user-positioned nodes?** (Opus)
Force-directed is dynamic but unstable; hierarchical respects parent-child structure; manual gives control. Each shapes how users think about their graph.

46. **How should different bead types be visually distinguished (color, shape, icon, size)?** (Opus, GPT)
With 14+ bead types, visual encoding must be systematic. GPT asks about visual encoding without relying on text alone.

47. **How should edge types be visually distinguished (line style, color, arrowhead)?** (Opus)
18 dependency types need a learnable visual vocabulary. Dashed vs. solid, color-coded groups, or labeled edges.

48. **Should the graph visualization be the default landing view or a secondary panel?** (Opus, GPT)
Opus: if graph-first, users orient spatially; if list-first, users orient textually. The choice defines the product identity.

49. **Where does the bead detail editor live relative to the graph?** (Opus, GPT)
Side panel keeps graph context visible; modal gives focused editing space. GPT asks how users switch context without losing work.

50. **Where does the formula builder live -- same workspace or separate mode?** (Opus, GPT)
Both flag this as a key layout decision. Separate mode reduces clutter but increases navigation cost.

51. **How should dense graphs be visually simplified (clustering, collapsing, focus modes)?** (Opus, GPT)
Both flag this at scale. Opus mentions fisheye, semantic zoom. GPT mentions focus modes.

52. **What established UI patterns should the IDE follow (VS Code, Figma, Linear, Notion)?** (Opus, GPT)
Each implies different UX values. GPT asks which design patterns should remain consistent with other internal tools.

### Interaction Design

53. **How does a user create their very first bead in an empty graph?** (Opus, GPT)
Both flag the empty-state experience. Opus: guided creation, formula templates, or import -- not a blank void. GPT: empty states set product comprehension in the first minute.

54. **How does a user add a dependency edge between two beads?** (Opus, GPT)
The most frequent graph-editing action. Opus: must be fast (drag-drop or keyboard shortcut). GPT: drag-and-drop, quick action menu, or guided flow for non-experts.

55. **How does a user switch between graph view and bead detail view?** (Opus, GPT)
Opus: click a node to open detail, Escape to return -- seamless, not full page navigation. GPT: context-switch friction is a major productivity killer.

56. **How does a user create a Dolt branch for experimental work?** (Opus)
Must feel lightweight like creating a Git branch, not a formal administrative action.

57. **How does a user filter the graph to focus on a subset of beads?** (Opus, GPT)
Both flag filtering by status, label, type, assignee as essential. The mechanism (sidebar filters, search bar, graph lasso) shapes the experience.

58. **What inputs are required vs. optional when creating a bead?** (Opus, GPT)
Both flag the balance: too many required fields blocks creation, too few produces low-quality beads.

59. **How does a user know their changes have been saved?** (Opus, GPT)
Opus: auto-save with visible indicator. GPT: autosave vs manual save behavior for rich-text and graph edits.

60. **How does a user trigger a graph quality check (density, cycles, metrics)?** (Opus, GPT)
Opus: if metrics require manual "run analysis," users skip it. Both suggest ambient or auto-triggered metrics.

61. **How does a user compare two branches side-by-side?** (Opus, GPT)
Multi-model convergence requires comparing branch outputs. Without visual diff, users must compare mentally across tabs.

62. **How does a user bulk-edit multiple beads (change status, reassign, reparent)?** (Opus, GPT)
Both flag batch operations as essential for scaling. Multi-select on graph or list view with bulk action bar.

63. **How does a user navigate from a bead to its parent epic or child tasks?** (Opus)
Parent-child navigation is primary hierarchy traversal. Breadcrumbs, tree views, or clickable edges must be consistent.

### User Flows

64. **What is the step-by-step flow for creating a bead graph from scratch?** (Opus, GPT)
Opus: new users need a guided path. GPT: defines the baseline end-to-end experience.

65. **What is the step-by-step flow for instantiating a formula into a working molecule?** (Opus, GPT)
Both flag this as the power-user flow: select formula, bind variables, preview, confirm pour.

66. **What is the step-by-step flow for the multi-model convergence workflow?** (Opus, GPT)
Branch-per-model is a novel flow with no established UX pattern. Needs careful choreography.

67. **What is the step-by-step flow for resolving a merge conflict in the work graph?** (Opus, GPT)
Both flag this as requiring per-bead or per-field resolution mechanisms. More complex than text conflicts.

68. **What is the ideal first-run flow for someone migrating from markdown planning?** (GPT)
Adoption depends on reducing migration anxiety. Must address how existing artifacts translate.

69. **What happens when graph density exceeds the 0.12 upper bound?** (Opus)
Over-connected graphs are a known anti-pattern. Should warn progressively (yellow at 0.10, red at 0.12).

70. **What happens when a formula references a variable that was not bound?** (Opus, GPT)
Opus: does the builder catch at authoring time, cook time, or fail silently? GPT: feedback for invalid or risky actions.

71. **What is the review/approval flow for proposed graph changes before they become canonical?** (GPT)
Aligns planning quality with governance. Maps to convergence workflow decision points.

### States & Transitions

72. **What does the loading state look like when the graph is being fetched?** (Opus, GPT)
Both flag performance perception. Opus: skeleton graph or progressive loading feels faster than a spinner. GPT: loading states for graph-heavy screens.

73. **What does the "unsaved changes" state look like across the IDE?** (Opus, GPT)
Both flag this as critical for confidence. Dot on tab, banner, or changed background color.

74. **What does the "merge in progress" state look like?** (Opus, GPT)
Merging may involve conflict resolution across multiple beads. Needs distinct merge mode with clear entry/exit.

75. **What does the "formula cooking" state look like?** (Opus, GPT)
Both ask about feedback during processing. Opus: formula input on left, proto output appearing on right. GPT: state for no output or unexpected output.

76. **What does the "branch diverged" state look like compared to "branch in sync"?** (Opus)
Should be as clear as a Git ahead/behind indicator with visual cue and one-click path to diff or merge.

77. **How does the user transition from graph exploration to bead editing and back?** (Opus, GPT)
Most common state transition. Must be instant, preserve graph viewport position. GPT: smooth transitions reduce cognitive overhead.

78. **What does the multi-model convergence state look like (N branches being compared)?** (Opus)
Comparing 2-5 model branches simultaneously requires split view, tabbed comparison, or overlay diff.

79. **What does the "read-only" state look like when viewing someone else's branch?** (Opus, GPT)
Must be visually obvious. GPT asks about visual affordances for editable vs read-only states across panels.

80. **What does the state look like when an agent is actively modifying beads in the background?** (Opus)
Agent activity is concurrent and potentially surprising. Needs live indicator without disrupting user focus.

### Domain Concepts

81. **What is a "work graph" and how does it differ from a dependency graph, knowledge graph, or project plan?** (Opus)
Users will try to map to something familiar. Fuzzy boundaries cause incorrect usage.

82. **What does "branching" mean when both Git branches and Dolt branches exist simultaneously?** (Opus)
Dual-layer version control makes "create a branch" ambiguous. Users need a clear mental model of which layer they operate on.

83. **What is the difference between a "proto" and a poured bead -- and should users see or manipulate protos?** (Opus)
Three-stage pipeline (formula -> proto -> real bead) may be an implementation detail that does not need IDE exposure.

84. **What is the difference between a "bond" vs a "dependency" vs an "edge"?** (Opus)
Formula system uses "bond," graph uses "dependency/edge," brief uses "dependency graph." May not be synonyms.

85. **What does "phase" mean in formula context (liquid vs vapor) vs BCC compilation context (SCAN/ANALYZE/CONNECT/ENRICH)?** (Opus, GPT)
Two unrelated uses of "phase" in the same domain. GPT asks about domain distinction between ephemeral (vapor) and persistent (liquid) work.

86. **Which dependency meanings are mandatory to standardize (e.g., `blocks` vs `related`) and which are optional?** (GPT)
Shared semantics required for trustworthy graph interpretation.

### Prior Art

87. **How does this compare to Linear, Jira, or Shortcut -- and what must we match or explicitly reject?** (Opus, GPT)
Both flag inevitable comparison to issue trackers. Unmet expectations from that comparison will be the primary source of dissatisfaction.

88. **What can we learn from graph-first tools (Notion relations, Roam, Obsidian graph view) about how users interact with graph visualizations?** (Opus, GPT)
Both note graph visualization has established conventions for zoom, filter, search, layout. GPT flags interaction norms whose violation increases rejection.

89. **How do existing DAG editors (Airflow, Prefect, Dagster, n8n, Node-RED) handle visual workflow composition?** (Opus)
Formula authoring is essentially visual workflow composition. Prior art is extensive.

90. **What has GitHub Projects, Asana, or Monday learned about failure modes of "graph views" of project work?** (Opus, GPT)
Strong evidence graph views overwhelm users past ~30 nodes. The target of 50-200 beads hits this immediately. GPT asks about prior "visual planning" tool failures.

91. **How do database branching tools (PlanetScale, Neon, Dolt Hosted) present branch/diff/merge to users?** (Opus, GPT)
Database branching conventions are not well-established outside a niche audience.

92. **What can we learn from Terraform's plan/apply model about previewing changes before committing?** (Opus)
The cook/pour workflow is structurally identical to terraform plan/apply. Well-understood UX convention.

93. **What did markdown PRD workflows do well that users will miss?** (GPT)
Replacing a tool means preserving critical strengths, not just fixing weaknesses.

94. **How do teams currently handle "competing model outputs" from different agents/tools?** (GPT)
Convergence workflows must align with existing decision rituals.

---

## P2: Good to Have

### User Behavior Edge Cases

95. **What happens if a user creates a bead with no title, no description, and no type?** (Opus)
Users often create placeholder items. System needs to handle minimal/empty beads gracefully.

96. **What if a user tries to create a circular dependency chain (A blocks B blocks C blocks A)?** (Opus, GPT)
Opus: does the IDE prevent the last edge, show warning, or allow it? GPT asks about feedback for risky actions.

97. **What happens when a user pastes a 10,000-word document into a bead description?** (Opus)
Rich-text editor and storage layer need to handle this without performance degradation.

98. **What if a user opens the same bead graph in two browser tabs and makes conflicting edits?** (Opus)
Inevitable with daily use. Without conflict detection, last-write-wins silently destroys work.

99. **What if a user accidentally triggers `bd mol pour` twice with the same formula?** (Opus)
Duplicate instantiation could create duplicate beads. Idempotency guarantees or clear warning needed.

100. **What happens when a user wants to reorganize their graph -- move 20 beads from one epic to another?** (Opus, GPT)
Opus: if must re-parent beads one by one, reorganization is prohibitively tedious. GPT: bulk cleanup after messy exploration.

101. **What if a user creates a formula with a loop that would generate 500+ beads?** (Opus)
Runaway generation needs guardrails: confirmation dialogs, limits, dry-run previews.

102. **What happens when the user's Git repo and Dolt database get out of sync?** (Opus)
Dual-layer foundation introduces consistency risk. Users will not know which to trust.

103. **What if a user tries to use the IDE on a repository that has no .beads/ directory yet?** (Opus)
First-time setup must be seamless. IDE should offer to initialize, not show cryptic error.

104. **What happens when a user is halfway through editing and their browser crashes?** (Opus, GPT)
Opus: auto-save and draft recovery expected in web editors. GPT: what happens when users leave with unsaved changes.

105. **What if a user creates custom bead types or dependency types that collide with future built-in types?** (Opus)
Namespace collisions between user-defined and system-defined types could cause confusing behavior.

106. **What if a user wants to revert a merge that happened three merges ago?** (Opus)
Point-in-time rollback in a branching system is complex. Users expect "undo merge" like Git revert.

107. **What if users start with one model branch, then change strategy midstream?** (GPT)
Strategy pivots are normal; rigid flows create sunk-cost frustration.

108. **What if users rename concepts repeatedly while still deciding scope?** (GPT)
Iterative naming is common; identity/history must stay understandable.

109. **What if users disagree with teammates about the "canonical" distilled graph?** (GPT)
Decision traceability is essential for trust and conflict resolution.

110. **What if users try to use the IDE like a whiteboard, not a strict planner?** (GPT)
Tools that reject divergent thinking push ideation elsewhere.

111. **What if users accidentally edit the wrong branch and realize late?** (GPT)
Recovery experiences shape whether users feel safe in daily use.

112. **What if users import low-quality or incomplete ideas and expect the IDE to help structure them?** (GPT)
Most inputs are imperfect; strict assumptions create dead ends.

113. **What if users misuse fields (stuffing multiple ideas into one bead) for speed?** (GPT)
Real behavior often bends rules; tool should guide cleanup, not punish.

114. **What if users create dependencies they do not fully understand just to "make it pass"?** (GPT)
Superficial compliance leads to poor execution quality. Semantic drift undermines analytics.

115. **What if users want to compare two very different solution shapes, not just linear revisions?** (GPT)
Innovation requires side-by-side divergence, not only incremental diffs.

### Accessibility & Inclusion (Extended)

116. **Is the terminology accessible to non-native English speakers?** (Opus, GPT)
Both flag metaphorical English (molecule, formula, pour, cook, wisp, liquid, vapor) does not translate literally.

117. **Can a user who has never used graph-based tools understand the interface without training?** (Opus, GPT)
Opus: the IDE assumes familiarity with directed graphs. GPT: users from linear task list tools (Trello, Todoist) need significant onboarding.

118. **What about users with cognitive disabilities or attention disorders who need simplified views?** (Opus, GPT)
Both flag a graph with 150 nodes as cognitively overwhelming. A simplified or focus mode serves these users and all users.

119. **Is the rich-text editor accessible (proper ARIA labels, heading structure, list semantics)?** (Opus)
Rich-text editors are notoriously inaccessible. Content becomes opaque to screen reader users without semantic structure.

120. **Are error messages and warnings written in plain language?** (Opus)
"Cycle detected in dependency subgraph rooted at bead 47a3" vs "Bead X and Bead Y are blocking each other." The difference determines self-service.

121. **Can the IDE be used effectively by someone who joins a project mid-stream?** (Opus, GPT)
Onboarding to an existing graph is distinct from creating from scratch. Needs orientation features for latecomers. GPT asks about onboarding for different experience levels.

122. **Does the IDE respect system-level accessibility settings (high contrast, reduced motion, font size)?** (Opus)
Graph animations and small labels that ignore OS-level settings make the tool unusable for dependent users.

123. **What about users working in constrained environments (slow connections, older hardware, corporate proxies)?** (Opus, GPT)
Both flag performance budgets and graceful degradation for real-world environments.

124. **Are time pressure and "live collaboration" expectations excluding thoughtful, async contributors?** (GPT)
Inclusive workflows should support different working styles and time zones.

125. **Can users from different roles (PM, engineer, designer, QA) all interpret the same graph?** (GPT)
Shared understanding required for cross-functional execution.

### Information Architecture (Extended)

126. **What is the critical path through the graph?** (Opus)
The single most actionable metric for planning. Tells users what to unblock first. Deserves prominent treatment.

127. **What labels and dimensions are in use across the graph?** (Opus)
Labels using the `dimension:value` convention are a de facto taxonomy. Surfacing active dimensions helps filter and slice.

128. **How does the current bead relate to source code artifacts?** (Opus, GPT)
Opus: if the bridge is invisible, beads become disconnected documentation. GPT: cross-linking to source context must not distract from planning.

129. **What molecule workflows are currently running or recently completed?** (Opus)
Molecules are multi-step workflows with observable state. Users need a run log or status panel.

130. **What are the acceptance criteria for the bead being edited?** (Opus, GPT)
Opus: burying criteria in a tab means they get written once and forgotten. GPT asks whether acceptance criteria should be distinct blocks or a unified field.

131. **What is the status distribution across the graph (open, in_progress, blocked, closed)?** (Opus, GPT)
Both flag a status breakdown for project-health snapshot. GPT asks about globally summarized health, status counts, and risk hotspots.

132. **What are the primary user roles, and what information does each need first on entry?** (GPT)
Determines default dashboard content. Avoids overwhelming users with irrelevant data.

133. **What information architecture supports both top-down planning and bottom-up detail editing?** (GPT)
Different users start from different mental models. Architecture must serve both.

### Visual & Layout (Extended)

134. **Should the IDE have a dark mode, light mode, or both?** (Opus)
Developers strongly prefer dark mode. Graph readability can differ between modes.

135. **Where does the formula catalog / template browser live?** (Opus)
If formulas are a primary entry point, they deserve prominent placement.

136. **Should bead creation flow use a modal, slide-over panel, or inline creation on the graph?** (Opus)
Inline is fast and spatial; modal is thorough but breaks flow. Hybrid approaches may work best.

137. **What persistent navigation elements are required (project switcher, filters, breadcrumbs, saved views)?** (GPT)
Prevents disorientation in large workspaces.

138. **How should rich-text fields be displayed to balance readability and editability?** (GPT)
Content quality depends on comfortable writing surfaces.

### States & Transitions (Extended)

139. **What does the empty state look like for each major panel (graph, formula list, branch list)?** (Opus, GPT)
Each empty state is a teaching moment. Guide toward the first meaningful action.

140. **What does the error state look like when Dolt is unreachable?** (Opus)
Backend failure should not lock the entire IDE. Show cached data with degraded-mode banner if possible.

141. **How does the user transition from bead editing to formula authoring?** (Opus)
Should preserve context (which bead, what they were thinking) and return them afterward.

142. **What does the "conflict detected" state look like during a merge?** (Opus, GPT)
Opus: which bead fields conflict, what each branch says, per-field resolution. GPT: conflict states explained in user terms.

143. **What does the "graph quality warning" state look like (density too high, cycles detected)?** (Opus)
Non-blocking but persistent. Yellow/red indicator with click-to-diagnose path, not dismissible toast.

144. **How does the user transition from viewing proto beads (preview) to committing them as real beads?** (Opus)
Proto beads are previews. The transition to real beads is a commitment moment ("Pour" button with confirmation).

145. **What partial-failure states should exist when some updates apply and others do not?** (GPT)
Users need precise recovery actions for partial failures.

146. **What visual transitions should confirm major milestones (flow complete, convergence accepted)?** (GPT)
Reinforces completion and outcome confidence.

147. **What guardrail states should appear before irreversible transitions?** (GPT)
Protects against accidental destructive actions.

148. **How should transition rules be communicated when moving work between states?** (GPT)
Reduces invalid transitions and process drift.

### Problem Depth (Extended)

149. **Is the formula system's complexity (inheritance, loops, conditions, aspects, composition) a feature or a sign the underlying model is too complex?** (Opus, GPT)
Opus: a visual builder for the same complexity may not help if the complexity itself is the problem. GPT: which prior template-driven planning became too rigid?

150. **Is the Dolt branching/merging workflow solving a real user pain or an engineering elegance?** (Opus, GPT)
Opus: users may just want conflict-free collaboration. GPT: where do existing branching/merge concepts in product planning break down today?

151. **Is the work graph the right abstraction for all target users, or is it an expert tool for power users only?** (Opus, GPT)
Opus: graph thinking is cognitively demanding. GPT: which users are most harmed today (PM, eng manager, agent, reviewer)?

152. **What parts of planning should remain intentionally outside the graph?** (GPT)
Over-formalization can reduce clarity and candid decision-making. Strategy narrative, political context, sensitive notes may not belong.

---

## P3: Parking Lot

These are technically-oriented, implementation-detail, or edge-case questions that can wait until after core product decisions are made.

### Domain Edge Cases (Technical)

153. **How does the IDE handle beads with `ephemeral: true` (wisps) that may have been auto-compacted between sessions?** (Opus)
Wisps have TTL-based compaction (6h to 7d). Graph changes between sessions without user action.

154. **How does the IDE handle beads with the `tombstone` status -- are they visible, filtered, or shown specially?** (Opus, GPT)
Soft-deleted beads still exist in database with dependencies pointing to them. GPT asks about deleted/archived bead representation.

155. **What happens when a user imports a bead graph from one repo and references beads from another repo?** (Opus)
Cross-repo federation via `source_repo` and `source_system` fields. Multi-repo graph scope undefined.

156. **How does the IDE handle the `defer_until` field -- should deferred beads be hidden, dimmed, or shown normally?** (Opus)
Deferred beads are hidden from `bd ready` in CLI but graph view has no convention for temporal visibility.

157. **How does the IDE handle beads with the `pinned` status that never close -- do they distort metrics?** (Opus)
Pinned beads accumulate and could skew density, PageRank, and attention metrics over time.

158. **What happens when a formula's `on_complete` runtime hook spawns molecules that conflict with current graph state?** (Opus)
Runtime expansion is non-deterministic. IDE cannot preview what `on_complete` will produce.

159. **How does the IDE handle the `provides:*` reserved label namespace that can only be set by `bd ship`?** (Opus)
Some labels are CLI-command-restricted. Users encounter confusing permission errors if IDE allows label editing.

160. **What happens when graph metrics (PageRank, betweenness) mean nothing to users?** (Opus, GPT)
Opus: raw values without interpretation make users ignore the feature. GPT: how should "work graph quality" be understood by non-graph experts?

161. **What is the GUPP system referenced by the "hooked" status?** (Opus)
A status value references a system not defined in brief or schema documentation.

162. **What is HOP in the context of quality scores and validations?** (Opus)
Schema references HOP fields without defining the acronym or quality workflow.

163. **What is a "rig" and how does it relate to agents, roles, and the IDE user's workflow?** (Opus)
Bead schema includes rig, agent, role, and convoy types implying agent orchestration. Brief says "a separate runtime executes it."

164. **What is a "wisp" semantically -- user concept or infrastructure detail?** (Opus)
Distinction between liquid/vapor/wisp/ephemeral beads touches workflow decisions but terminology is unexplained.

### Technical Implementation Questions

165. **What happens when a user edits a bead on a branch they do not own?** (Opus, GPT)
Multi-user or multi-agent scenarios need clear permission signals.

166. **What happens when two agents edit the same graph simultaneously?** (Opus)
Concurrent edits are inevitable in multi-model workflow. Needs optimistic concurrency pattern.

167. **What happens when the user is offline or the Dolt connection drops?** (Opus, GPT)
Both flag queued saves, reconnection indicators. GPT asks about stable internet assumptions.

168. **What happens when a bead has 10+ dependencies creating visual hairballs?** (Opus)
Needs edge bundling, grouping, or dedicated "connections" panel.

169. **What happens when a formula produces more beads than expected?** (Opus)
Preview step must make output volume clear and let users adjust.

170. **What happens when a merge has irreconcilable conflicts?** (Opus)
Needs abort-merge flow that cleanly returns to pre-merge state without data loss.

171. **What happens when a formula references another formula that does not exist or has been deleted?** (Opus)
Formula composition creates fragile chains. IDE must handle broken references.

172. **What feedback does the user see when a formula "cook" is processing?** (Opus, GPT)
Progress indicator with incremental preview builds trust and catches errors early.

173. **How does a user edit a formula template's variables and steps?** (Opus)
Form-based builder vs raw text editor. Power users may want both.

174. **How does a user explain to a teammate what they did in the IDE?** (Opus)
Shareability: link to specific graph state, export snapshot, generate summary.

175. **What is the user's workflow for presenting the work graph to a non-technical stakeholder?** (Opus)
Graph with jargon labels is meaningless to PM or exec. Needs export or translation view.

176. **Are touch/tablet interactions supported, or is this desktop-only?** (Opus)
Sketching bead graphs on a tablet during meetings. Mouse-only excludes this use case.

177. **How does the IDE handle right-to-left (RTL) languages in bead content?** (Opus)
Rich-text editor and graph labels must handle bidirectional text.

### Process & Governance

178. **How should the system represent intentionally unresolved dependencies or speculative branches?** (GPT)
Real planning includes uncertainty, not only resolved structure.

179. **How do you handle cross-team beads with no single owner?** (GPT)
Shared accountability frequently causes stalled work.

180. **How should archived, canceled, or legally sensitive work be represented without distorting metrics?** (GPT)
Lifecycle edge states can pollute planning quality signals.

181. **How should recurring operational work coexist with one-off project work in the same graph?** (GPT)
Mixed cadence work needs different planning semantics.

182. **What happens when a team uses the same bead for discovery, delivery, and postmortem phases?** (GPT)
Phase transitions can destroy traceability unless modeled intentionally.

183. **How should regional/legal contexts affect planning artifacts (data residency, audit retention)?** (GPT)
Compliance obligations vary by jurisdiction and industry.

184. **How should culturally different planning styles (top-down vs collaborative) map to a single graph model?** (GPT)
Rigid process assumptions can block global adoption.

185. **How do you represent work initiated outside product/engineering (legal, security, customer escalations)?** (GPT)
Planning tools fail when they ignore non-engineering drivers.

186. **How should temporary "war-room" workflows during incidents be captured without corrupting long-term planning?** (GPT)
Crisis work is valid but structurally noisy.

187. **What is an acceptable error rate for dependency meaning misuse?** (GPT)
Semantic drift undermines all analytics and decision support. Requires explicit tolerance threshold.

---

## Cross-Model Themes

### 1. Terminology and Cognitive Overload
Both Opus and GPT identify domain jargon as the single largest adoption risk. The bead vocabulary (molecule, formula, pour, cook, wisp, liquid, vapor, convoy, gate) creates barriers for new users, non-native English speakers, and non-technical stakeholders. Combined with 30+ bead fields, 18 dependency types, and 9 metrics, the information density requires aggressive progressive disclosure or the tool will be unusable for anyone who is not already an expert.

### 2. Undo/Rollback as Trust Infrastructure
Both models independently and emphatically flag undo/redo and transactional rollback as fundamental to user trust. The challenge is architectural: graph edits, formula-generated batch operations, and branch merges all require different undo mechanics. Without reliable recovery across all operation types, users will avoid experimentation, which defeats the purpose of branching and formula authoring.

### 3. Graph vs. List: The Identity Question
Both models grapple with whether the graph visualization or structured list view should be the primary interface. This is not merely a layout decision -- it defines the product's identity, determines every subsequent design choice, and governs whether spatial thinkers or linear thinkers feel at home. The consensus is that both must coexist, but one must be primary.

### 4. Merge Conflicts in Structured Data Are Unsolved UX
Both models flag that while Git text merge conflicts have well-understood resolution UX, work graph merge conflicts (conflicting status changes, contradictory dependency edits, divergent descriptions) have no established resolution model. This is the single biggest UX design risk in the project and requires novel design work before development.

### 5. Speculative Features Need Validation
Both models question whether multi-model convergence, formula authoring, and Dolt branching solve validated user problems or represent technical capabilities promoted to features. Opus is direct: "It is unclear whether any user has actually asked for this." GPT frames it as needing explicit scope discipline. Early user research to validate or invalidate these assumptions is prerequisite to design and development.
