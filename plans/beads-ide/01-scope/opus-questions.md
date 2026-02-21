# Opus 4.6 Analysis: beads-ide

## User Advocate Perspective

**Perspective:** A user who will use this feature daily.
**Feature:** Web-based IDE for beads -- replacing markdown PRD workflow with direct bead graph authoring, rich-text editing, interactive dependency graph visualization, formula builder, and Dolt-powered branching/diffing/merging.

---

## User Expectations

**1. Will users expect this to feel like a project management tool (Jira, Linear) or a code IDE (VS Code)?**
The name "IDE" sets strong expectations around code editing, autocomplete, and keyboard shortcuts. If it behaves more like a project tracker, the naming will cause daily cognitive friction.

**2. Do users expect to be able to start working immediately without learning bead terminology?**
Terms like "molecule," "formula," "convoy," "gate," "wisp," "liquid phase," and "tombstone" are domain-specific jargon. Users coming from any other tool will expect familiar vocabulary or at minimum inline definitions, and will bounce hard without them.

**3. Will users assume they can import existing work (from Jira, Linear, GitHub Issues, markdown PRDs) into the IDE?**
Any tool that claims to "replace" a workflow must offer a migration path. Users will look for import on day one, and its absence will feel like a dealbreaker for anyone with existing project data.

**4. Do users expect real-time collaboration (Google Docs-style)?**
Modern web-based tools have trained users to expect multiplayer. If this is single-user, that needs to be stated upfront or users will be confused when they cannot share a session with a colleague.

**5. Will users expect the graph visualization to be the primary interface, or a secondary view?**
Some users think visually, others think in lists. If the graph is the only way to navigate, list-oriented users will feel lost. If the graph is secondary, graph-oriented users will feel the tool undersells its core value.

**6. Do users expect undo/redo to work across all operations (bead creation, edge manipulation, formula changes)?**
Every modern editor supports Ctrl+Z. If a user accidentally wires a dependency wrong and cannot undo it, trust in the tool collapses immediately.

**7. Will users expect offline support?**
If this is a web app backed by Dolt and Git, users may assume they need connectivity. But daily users editing on planes, trains, or spotty WiFi will quickly resent a tool that requires a server to function.

**8. Do users expect bead editing to feel like writing in Notion or Google Docs?**
"Rich-text editing of bead fields" sets the bar at modern block-based editors. If the editor feels like a basic textarea with markdown preview, it will feel dated on first use.

**9. Will users assume the formula builder works like a no-code workflow tool (Zapier, n8n, Retool)?**
The concept of "composing molecule workflows" maps to visual workflow builders in user mental models. If this is actually a TOML editor with syntax highlighting, users expecting drag-and-drop will be disappointed.

**10. Do users expect keyboard shortcuts for everything?**
The "IDE" framing attracts power users who navigate entirely by keyboard. If common operations (create bead, wire dependency, switch branch) require mouse clicks through menus, power users will find the tool slow.

**11. Will users expect search and filtering to be fast and faceted (by type, status, label, assignee, priority)?**
With 50-200 beads per repo and complex metadata, users need to slice and dice quickly. If search is limited to title-only text matching, daily users will waste significant time navigating.

**12. Do users expect the branching/merging UI to feel like GitHub's PR interface?**
Dolt branching is conceptually similar to Git branching, but applied to structured data. Users will map this to their GitHub/GitLab mental model and expect diff views, conflict markers, and merge previews that feel familiar.

**13. Will users expect notifications or a feed of changes made by other models/agents?**
Multi-model convergence implies multiple actors editing the graph. Users will want to know what changed, who changed it, and when -- a changelog or activity feed is an implicit expectation.

**14. Do users expect to see the formula output (generated beads) before committing it?**
"Dry run" previews are table stakes for any generative tool. If `bd cook` just creates beads without a preview step, users will feel they have lost control.

---

## User Journey

**1. What is the user's first 5 minutes like -- what do they see when they open the IDE for the first time?**
First impressions determine adoption. An empty graph with no guidance will make users close the tab. A guided onboarding or sample project could mean the difference between retention and abandonment.

**2. What is the user actually trying to accomplish on a typical day -- planning work, tracking progress, or analyzing architecture?**
The IDE spans planning (bead creation), execution (status tracking), and analysis (graph metrics). If it tries to serve all three equally, it may serve none of them well. Users need a clear primary workflow.

**3. What emotional state is the user in when they open this tool?**
If they are in a planning session, they are creative and exploratory. If they are checking on blocked work, they are stressed and impatient. If they are onboarding to a new codebase, they are confused and seeking orientation. The UI must accommodate all three emotional contexts.

**4. What tool are they coming FROM right before opening the IDE?**
If they just finished a conversation in Slack or a meeting, they need fast capture. If they are coming from VS Code, they expect the IDE to feel like an extension of their editor. The transition cost matters.

**5. What happens AFTER they finish a session in the IDE -- where does the output go?**
The brief says "produces the work graph; a separate runtime executes it." Users need to understand what happens next. If the graph just sits there with no visible downstream effect, users will question why they authored it.

**6. How does a user learn the bead schema without reading documentation?**
30+ fields per bead, 18 dependency types, 14+ issue types -- this is a complex data model. Users need progressive disclosure: show the basics first, reveal complexity as needed. Dumping all fields in a creation form will overwhelm.

**7. What does the user do when they make a mistake in a formula and it generates 50 wrong beads?**
Batch undo or rollback is critical. If the user has to manually delete 50 beads one by one, they will never trust the formula builder again.

**8. How does a user explain to a teammate what they did in the IDE?**
Shareability matters. Can they link to a specific graph state? Can they export a snapshot? Can they generate a summary? Without this, the IDE becomes a private tool that creates collaboration friction.

**9. When a user has 150 beads in a graph, how do they find the 3 that matter right now?**
Scale is the enemy of usability. Filtering, sorting, pinning, and "focus mode" (show only a subgraph) become essential at scale. Without these, the tool becomes unusable at exactly the point where it should be most valuable.

**10. What does the user do when they disagree with a model's suggested changes in a convergence workflow?**
Multi-model convergence requires conflict resolution UI. If the user cannot easily compare, accept, reject, or modify model suggestions, the "convergence" feature becomes a source of confusion rather than value.

**11. How does a user transition from exploring a codebase (BCC scan) to planning work (bead authoring)?**
The IDE bridges beads to source code. This transition -- from "I see the architecture" to "I know what to build" -- is the core value proposition. If it feels like two disconnected tools, the bridge metaphor fails.

**12. What is the user's workflow when they need to present the work graph to a non-technical stakeholder?**
Graph visualizations with jargon labels (molecule, convoy, gate) are meaningless to a product manager or executive. Users need an export or view mode that translates bead graphs into language stakeholders understand.

---

## Edge Cases (User Behavior)

**1. What happens if a user creates a bead with no title, no description, and no type -- just clicks "create" immediately?**
Users often create placeholder items to come back to later. The system needs to handle minimal/empty beads gracefully rather than blocking creation with required-field validation that interrupts flow.

**2. What if a user tries to create a circular dependency chain (A blocks B blocks C blocks A)?**
The context mentions cycle detection warnings, but what happens in practice? Does the IDE prevent the last edge? Show a warning and allow it? Users testing the tool will try this within minutes.

**3. What happens when a user pastes a 10,000-word document into a bead's description field?**
Some users will paste entire PRDs, meeting transcripts, or spec documents into bead fields. The rich-text editor and storage layer need to handle this without performance degradation.

**4. What if a user opens the same bead graph in two browser tabs and makes conflicting edits?**
This is inevitable with daily use. Without conflict detection, the last-write-wins behavior will silently destroy work.

**5. What happens if a user deletes a bead that other beads depend on?**
Cascading dependency breakage is a common graph editing hazard. Does the IDE warn? Prevent deletion? Tombstone the bead? The user needs clear feedback about downstream consequences.

**6. What if a user tries to merge two Dolt branches with conflicting bead edits to the same field?**
Merge conflicts in structured data are harder to resolve than text conflicts. If the UI just shows "conflict" without helping the user understand what diverged, the branching feature becomes unusable.

**7. What happens when a user runs a formula that references variables they have not defined?**
Partial configuration is common. Does the formula builder catch this at authoring time, at cook time, or does it fail silently with empty values?

**8. What if a user accidentally triggers `bd mol pour` twice with the same formula?**
Duplicate instantiation could create duplicate beads. Users need idempotency guarantees or at minimum a clear warning that they are about to create duplicates.

**9. What happens when a user wants to reorganize their graph -- move 20 beads from one epic to another?**
Bulk operations are essential for daily use. If the user must re-parent beads one by one, reorganization becomes prohibitively tedious.

**10. What if a user creates a formula with a loop that would generate 500+ beads?**
Runaway generation from misconfigured formulas could overwhelm the graph. Users need guardrails (confirmation dialogs, limits, dry-run previews) before mass generation.

**11. What happens when the user's Git repo and Dolt database get out of sync?**
The dual-layer foundation introduces a consistency risk. If the user sees different state in their Git history vs. Dolt, they will not know which to trust.

**12. What if a user tries to use the IDE on a repository that has no .beads/ directory yet?**
First-time setup for a new repo needs to be seamless. If the IDE shows a cryptic error instead of offering to initialize, the onboarding experience breaks.

**13. What happens when a user is halfway through editing a bead and their browser crashes?**
Auto-save and draft recovery are expected in any web-based editor. Losing work to a browser crash will erode trust faster than almost any other failure mode.

**14. What if a user creates custom bead types or dependency types that collide with future built-in types?**
Namespace collisions between user-defined and system-defined types could cause confusing behavior in future updates. Users need guidance on naming conventions or reserved namespaces.

**15. What happens when a user applies a metric overlay (PageRank, betweenness) and the numbers mean nothing to them?**
Graph analytics are powerful but opaque. If the IDE shows raw metric values without interpretation ("this bead is a bottleneck," "this cluster is isolated"), most users will ignore the feature entirely.

**16. What if a user wants to revert a merge that happened three merges ago?**
Point-in-time rollback in a branching system is complex. Users will expect "undo merge" to work like Git revert, but Dolt semantics may differ in ways that surprise them.

---

## Accessibility & Inclusion

**1. Can a screen reader user navigate and edit the dependency graph?**
Graph visualization is inherently visual. Without an alternative representation (tree view, list of edges, keyboard navigation), blind and low-vision users are completely locked out of a core feature.

**2. Can a colorblind user distinguish bead types, statuses, and metric overlays?**
If the graph relies on color alone to encode type (red=bug, blue=feature) or status (green=closed, yellow=in_progress), roughly 8% of male users will struggle to read it.

**3. Is the IDE usable with keyboard only (no mouse)?**
Graph manipulation typically requires drag-and-drop. Users with motor impairments, RSI, or strong keyboard preferences need an alternative interaction model for wiring dependencies and moving nodes.

**4. Does the IDE work on a 13-inch laptop screen, or does it require a large monitor?**
Graph visualization, bead editing panels, and formula builders competing for screen real estate could make the IDE unusable on smaller screens -- which is what most developers actually use.

**5. Is the terminology accessible to non-native English speakers?**
"Molecule," "formula," "pour," "cook," "wisp," "liquid phase," "vapor" -- this is metaphorical English that does not translate literally. Non-native speakers may struggle to build mental models around these terms.

**6. Can a user who has never used graph-based tools understand the interface without training?**
The IDE assumes familiarity with directed graphs, dependency types, and workflow composition. Users whose background is in linear task lists (Trello, Todoist) will need significant onboarding support.

**7. What about users with cognitive disabilities or attention disorders who need simplified views?**
A graph with 150 nodes, 18 edge types, and 9 metric overlays is cognitively overwhelming. A "simplified" or "focus" mode that shows only immediately relevant information would serve these users (and frankly, all users).

**8. Is the rich-text editor accessible (proper ARIA labels, heading structure, list semantics)?**
Rich-text editors are notoriously inaccessible. If bead descriptions use a custom editor that does not expose semantic structure to assistive technology, the content becomes opaque to screen reader users.

**9. Are error messages and warnings written in plain language?**
"Cycle detected in dependency subgraph rooted at bead 47a3" is developer-speak. "Bead X and Bead Y are blocking each other -- this creates a loop that cannot be resolved" is user-speak. The difference determines whether users can self-serve or need support.

**10. Can the IDE be used effectively by someone who joins a project mid-stream and has no context on the existing graph?**
Onboarding to an existing bead graph is a distinct challenge from creating one from scratch. The IDE needs orientation features (overview, guided tour of graph structure, "start here" indicators) for latecomers.

**11. Does the IDE respect system-level accessibility settings (high contrast mode, reduced motion, font size preferences)?**
Graph animations, hover effects, and small node labels that ignore OS-level accessibility preferences will make the tool unusable for users who depend on those settings.

**12. What about users working in constrained environments (slow connections, older hardware, corporate proxies)?**
A web-based IDE that requires fast internet and modern hardware excludes users in many real-world work environments. Performance budgets and graceful degradation matter.

**13. Are touch/tablet interactions supported, or is this desktop-only?**
Some users may want to sketch out bead graphs on a tablet during meetings. If the IDE is mouse-only with no touch support, this use case is excluded.

**14. How does the IDE handle right-to-left (RTL) languages in bead content?**
If users write bead descriptions in Arabic, Hebrew, or other RTL languages, the rich-text editor and graph labels must handle bidirectional text correctly or the content becomes garbled.

---

## Summary of Top Concerns (User Advocate)

1. **Terminology barrier:** The bead domain vocabulary (molecule, formula, pour, cook, wisp, liquid, vapor, convoy, gate) is the single largest adoption risk. Every unfamiliar term is a moment where a user considers going back to markdown.

2. **Progressive disclosure:** 30+ bead fields, 18 dependency types, 9 metrics, 3 formula types -- the complexity is appropriate for the domain but lethal for onboarding. The IDE must reveal capability gradually.

3. **Graph accessibility:** The dependency graph is the centerpiece feature, but graph UIs are among the hardest to make accessible. Without serious investment in keyboard navigation, screen reader support, and alternative views, the IDE excludes a significant user population.

4. **Undo and recovery:** Daily users will make mistakes constantly -- wrong edges, accidental deletions, bad formula runs. The quality of the undo/rollback experience will determine whether users feel safe experimenting.

5. **Migration path:** Claiming to "replace the markdown PRD workflow" demands a story for existing work. Users will not manually re-enter their current project state into a new tool.

---

## Product Designer Perspective

## 1. Information Architecture

### What information does the user need to see?

1. **What is the current shape of the work graph at a glance?**
   Users need instant orientation — how many beads exist, how dense the graph is, whether it's healthy — so they know where they are before drilling in.

2. **Which bead am I looking at and what are its most important fields?**
   With 30+ fields per bead, the IDE must establish a clear visual hierarchy: title and status dominate, then description and dependencies, then metadata — otherwise every bead detail panel becomes a wall of noise.

3. **What are the direct dependencies of the selected bead (blocks, blocked-by, parent-child)?**
   Dependency edges are the primary structural information; hiding them forces users to hold graph topology in their heads, which defeats the purpose of a visual IDE.

4. **What is the overall health of the graph right now (density, cycles, orphans)?**
   If quality metrics are buried behind a menu, users will never check them and the graph will rot — these must be ambient indicators, not on-demand reports.

5. **Which beads are in a problem state (blocked, cyclic, orphaned, overloaded)?**
   Problem beads need to surface automatically; users should not have to hunt for trouble.

6. **What branch am I on and is it diverged from canonical?**
   Dolt branching is central to the workflow, and if users lose track of which branch they're editing, they'll corrupt the canonical graph.

7. **What formula templates are available and what do they produce?**
   Formulas are reusable workflow scaffolds, and users need to browse them like a catalog — name, description, expected output count — without opening each file.

8. **What has changed since my last save / commit / merge?**
   A diff indicator is essential for confidence; without it, users will compulsively save or, worse, lose work because they assumed it was saved.

9. **Who or what is assigned to a bead (human, agent, unassigned)?**
   Assignment drives workflow; if it's hidden, beads pile up without owners and nothing moves.

10. **What is the critical path through the graph?**
    Critical path is the single most actionable metric for planning — it tells you what to unblock first — and deserves prominent, always-visible treatment.

11. **What labels and dimensions are in use across the graph?**
    Labels using the `dimension:value` convention are a de facto taxonomy; surfacing the active dimensions helps users filter and slice the graph meaningfully.

12. **How does the current bead relate to source code artifacts?**
    The IDE bridges beads to code; if that bridge is invisible, users will treat beads as disconnected documentation rather than living work items.

13. **What is the status distribution across the graph (open, in_progress, blocked, closed)?**
    A status breakdown gives users a project-health snapshot without requiring them to mentally tally individual beads.

14. **What molecule workflows are currently running or recently completed?**
    Molecules are multi-step workflows with observable state; users need a run log or status panel so they know what agents are doing.

15. **What are the acceptance criteria for the bead I'm editing?**
    Acceptance criteria define "done"; burying them in a tab means they get written once and forgotten, undermining their value.

---

## 2. Interaction Design

### How does the user trigger this feature?

1. **How does a user create their very first bead in an empty graph?**
   The empty-state experience sets the tone for the entire product; if users stare at a blank canvas with no guidance, they'll bounce immediately.

2. **How does a user add a dependency edge between two beads?**
   This is the most frequent graph-editing action; it must be fast (drag-drop or keyboard shortcut), not buried behind a modal or form.

3. **How does a user instantiate a formula into real beads (the "pour" action)?**
   This is a high-consequence action that creates many beads at once — it needs a preview step, variable binding UI, and a clear confirmation moment.

4. **How does a user switch between graph view and bead detail view?**
   These are the two primary modes; the transition must be seamless (click a node to open detail, Escape to return) rather than a full page navigation.

5. **How does a user create a Dolt branch for experimental work?**
   Branching must feel lightweight — like creating a Git branch — not like a formal administrative action, or users won't use it.

6. **How does a user merge a branch back to canonical?**
   Merge is high-stakes; the IDE must show exactly what will change (diff), flag conflicts, and provide a clear resolve-or-abort choice.

7. **How does a user filter the graph to focus on a subset of beads?**
   With 50-200 beads per repo, filtering by status, label, type, or assignee is essential; the mechanism (sidebar filters, search bar, graph lasso) shapes the experience.

8. **How does a user undo a destructive action (deleting a bead, removing an edge)?**
   Without undo, every action carries anxiety; the IDE needs either undo/redo or a soft-delete pattern with recovery.

9. **What inputs are required vs. optional when creating a bead?**
   If creation requires too many fields, users won't create beads; if it requires too few, beads will be low-quality — the balance determines adoption.

10. **How does a user know their changes have been saved?**
    Auto-save with a visible indicator (saved/unsaved) removes cognitive overhead; explicit save buttons create anxiety about data loss.

11. **How does a user trigger a graph quality check (density, cycles, metrics)?**
    If metrics require a manual "run analysis" step, users will skip it; ambient or auto-triggered metrics encourage continuous quality maintenance.

12. **How does a user edit a formula template's variables and steps?**
    Formula authoring is inherently structured (TOML with nested steps); a form-based builder is more approachable than a raw text editor, but power users may want both.

13. **How does a user compare two branches side-by-side?**
    Multi-model convergence requires comparing branch outputs; without a visual diff, users must do this mentally across tabs, which doesn't scale.

14. **What feedback does the user see when a formula "cook" is processing?**
    Cooking a formula into proto beads may take time; a progress indicator with incremental preview (beads appearing one by one) builds trust and lets users catch errors early.

15. **How does a user navigate from a bead to its parent epic or child tasks?**
    Parent-child navigation is the primary way users move through the hierarchy; breadcrumbs, tree views, or clickable edges all work, but the pattern must be consistent.

16. **How does a user bulk-edit multiple beads (e.g., change status, reassign)?**
    Batch operations prevent tedious one-by-one editing; multi-select on the graph or list view with a bulk action bar is standard but must feel natural here.

---

## 3. User Flows

### Happy Path

1. **What is the step-by-step flow for creating a bead graph from scratch?**
   New users need a guided path — create first epic, add child features, wire dependencies — or they'll create a flat unstructured pile of beads.

2. **What is the step-by-step flow for instantiating a formula into a working molecule?**
   This is the power-user flow: select formula, bind variables, preview proto beads, confirm pour, see new beads appear in graph — each step must feel deliberate and reversible.

3. **What is the step-by-step flow for the multi-model convergence workflow?**
   Branch-per-model means: create N branches, let models work, compare outputs, distill canonical — this is a novel flow with no established UX pattern, so it needs careful choreography.

4. **What is the step-by-step flow for resolving a merge conflict in the work graph?**
   Conflicts in graph merges are more complex than text conflicts; the IDE must show which beads/edges differ and let users pick per-bead or per-edge resolutions.

5. **What is the step-by-step flow for wiring a dependency subgraph between two epics?**
   Cross-epic dependencies are where graphs get complex; the flow must guide users to create the right edge types (blocks vs. related vs. discovered-from) without making it bureaucratic.

### Error Path

6. **What happens when the user creates a dependency cycle?**
   Cycles break topological sort and critical path — the IDE must detect and warn immediately, showing the cycle visually, not just as a text error.

7. **What happens when graph density exceeds the 0.12 upper bound?**
   Over-connected graphs are a known anti-pattern; the IDE should warn progressively (yellow at 0.10, red at 0.12) rather than hard-blocking.

8. **What happens when a formula references a variable that wasn't bound?**
   Unbound variables during "pour" would create malformed beads; the IDE must validate bindings before execution and highlight missing required fields.

9. **What happens when a merge has irreconcilable conflicts?**
   The IDE needs an abort-merge flow that cleanly returns to the pre-merge state without data loss.

10. **What happens when the user tries to edit a bead on a branch they don't own?**
    Multi-user or multi-agent scenarios need clear permission signals; editing a read-only branch should be visually distinct from an editable one.

### Edge Cases

11. **What does the IDE show when the graph is empty (zero beads)?**
    Empty state is the user's first impression; it should offer guided creation, formula templates, or import — not a blank void.

12. **What happens when the graph has 200+ beads and the visualization becomes cluttered?**
    At scale, the graph needs clustering, collapsing, or focus+context techniques (fisheye, semantic zoom) to remain usable.

13. **What happens when a bead has 10+ dependencies?**
    Highly connected beads create visual hairballs; the IDE needs strategies for taming them — edge bundling, grouping, or a dedicated "connections" panel.

14. **What happens when a formula produces more beads than the user expected?**
    A formula might generate 30+ beads from one pour; the preview step must make the output volume clear and let users proceed or adjust.

15. **What happens when two agents are editing the same graph simultaneously?**
    Concurrent edits are inevitable in the multi-model workflow; the IDE needs a conflict resolution or optimistic concurrency pattern to avoid lost writes.

16. **What happens when the user is offline or the Dolt connection drops?**
    If the IDE relies on a live backend, network interruptions must be handled gracefully — queued saves, reconnection indicators, not silent data loss.

---

## 4. Visual & Layout

### Where does this live in the product?

1. **Should the IDE use a single-page layout or a multi-panel workspace like VS Code?**
   A multi-panel layout (graph + detail + sidebar) provides simultaneous context but risks overwhelming new users; a single focus area is simpler but requires more navigation.

2. **Should the graph visualization be the default landing view or a secondary panel?**
   If graph-first, users orient spatially; if list-first, users orient textually — the choice defines the product's identity as a visual tool vs. a structured editor.

3. **Where does the bead detail editor live relative to the graph?**
   A side panel (VS Code style) keeps graph context visible; a modal or overlay gives focused editing space — the right choice depends on how often users edit while referencing the graph.

4. **Where does the formula builder live — same workspace or separate mode?**
   Formula authoring is a distinct activity from bead editing; a separate mode reduces clutter but increases navigation cost.

5. **Where do graph health metrics appear — persistent header bar, floating overlay, or dedicated panel?**
   Metrics should be ambient (always partially visible) but expandable; hiding them entirely means users forget to check graph quality.

6. **Where does the Dolt branch/merge UI live — top bar, sidebar, or dedicated view?**
   Branch awareness needs to be persistent (always visible, like a Git branch indicator in VS Code) but branch management (create, merge, diff) can be on-demand.

7. **Should the dependency graph use a force-directed layout, hierarchical layout, or user-positioned nodes?**
   Force-directed is dynamic but unstable; hierarchical respects parent-child structure; manual positioning gives control but requires effort — each shapes how users think about their graph.

8. **How should different bead types be visually distinguished (color, shape, icon, size)?**
   With 14+ bead types, visual encoding must be systematic — too many colors become noise, but insufficient differentiation makes the graph homogeneous and unreadable.

9. **How should edge types be visually distinguished (line style, color, arrowhead)?**
   18 well-known dependency types need a visual vocabulary; dashed vs. solid, color-coded groups, or labeled edges — the encoding must be learnable and scannable.

10. **Should the IDE have a dark mode, light mode, or both?**
    Developers strongly prefer dark mode; a graph-heavy IDE in light mode may cause eye strain during long sessions — but graph readability can differ between modes.

11. **Where does the formula catalog / template browser live?**
    If formulas are a primary workflow entry point, they deserve prominent placement (sidebar section, command palette); if secondary, a nested menu suffices.

12. **How should the IDE handle responsive layout or minimum viewport requirements?**
    Graph visualization needs screen real estate; if the IDE must work on small screens or half-width windows, the layout strategy changes fundamentally.

13. **Should the bead creation flow use a modal, a slide-over panel, or inline creation on the graph?**
    Inline creation (click canvas to place a bead) is fast and spatial; modal creation is thorough but breaks flow — hybrid approaches (quick-create inline, full-edit in panel) may work best.

14. **What established UI patterns should the IDE follow (VS Code, Figma, Linear, Notion)?**
    Each reference app implies different UX values: VS Code = power/flexibility, Figma = spatial/collaborative, Linear = speed/keyboard, Notion = blocks/structure — the IDE should pick a primary influence.

---

## 5. States & Transitions

### What states can this be in?

1. **What does the loading state look like when the graph is being fetched from Dolt?**
   Initial load time sets the user's performance expectation; a skeleton graph or progressive loading (beads appearing incrementally) feels faster than a spinner.

2. **What does the empty state look like for each major panel (graph, formula list, branch list)?**
   Each empty state is a teaching moment — guide the user toward the first meaningful action rather than showing a blank space.

3. **What does the error state look like when Dolt is unreachable?**
   A backend failure should not lock the entire IDE; if possible, show cached data with a degraded-mode banner rather than a full error page.

4. **What does the "unsaved changes" state look like across the IDE?**
   Users need to know at a glance whether their current work is persisted; a dot on the tab, a banner, or a changed background color are all conventions worth considering.

5. **What does the "merge in progress" state look like?**
   Merging may involve conflict resolution across multiple beads; the IDE needs a distinct merge mode with clear entry and exit points so users don't accidentally leave mid-merge.

6. **What does the "formula cooking" state look like (processing a formula into proto beads)?**
   Cooking is a transformation step; showing the formula input on the left and proto bead output appearing on the right creates a satisfying cause-and-effect visualization.

7. **What does the "branch diverged" state look like compared to "branch in sync"?**
   Branch status should be as clear as a Git ahead/behind indicator — number of divergent changes, visual cue (color), and a one-click path to diff or merge.

8. **How does the user transition from graph exploration to bead editing and back?**
   This is the most common state transition; it must be instant (no page reload), preserve graph viewport position, and clearly indicate which bead is being edited.

9. **How does the user transition from bead editing to formula authoring?**
   If a user realizes they need a formula while editing a bead, the transition should preserve their context (which bead, what they were thinking) and return them afterward.

10. **What does the "conflict detected" state look like during a merge?**
    Conflicts need visual specificity: which bead fields conflict, what each branch says, and a clear per-field resolution mechanism — not a generic "conflict" error with no detail.

11. **What does the "graph quality warning" state look like (density too high, cycles detected)?**
    Warnings should be non-blocking but persistent — a yellow/red indicator in the metrics bar with a click-to-diagnose path, not a dismissible toast that vanishes.

12. **What does the multi-model convergence state look like (N branches being compared)?**
    Comparing 2-5 model branches simultaneously requires either a split view, a tabbed comparison, or an overlay diff — the visual approach defines whether convergence feels manageable or overwhelming.

13. **How does the user transition from viewing proto beads (preview) to committing them as real beads?**
    Proto beads are previews; the transition to real beads is a commitment moment that should feel distinct — a "Pour" button with confirmation, not an auto-save.

14. **What does the "read-only" state look like when viewing someone else's branch?**
    Read-only must be visually obvious (greyed-out edit controls, a banner, a lock icon) so users don't waste time trying to edit and wondering why nothing happens.

15. **What does the state look like when an agent is actively modifying beads in the background?**
    Agent activity is concurrent and potentially surprising; the IDE should show a live indicator of agent actions (bead X updated, edge Y added) without disrupting the user's focus.

---

## Summary of Key Design Tensions (Product Designer)

The beads-ide faces several core UX tensions that will shape every wireframe:

- **Power vs. Approachability**: 30+ bead fields, 18 edge types, 9 metrics, formula TOML — exposing all of this without overwhelming new users requires progressive disclosure done right.
- **Graph-first vs. List-first**: The product's identity hinges on whether the graph visualization or a structured list is the primary navigation mode.
- **Ambient metrics vs. On-demand analysis**: Graph health indicators must be visible enough to influence behavior without cluttering the workspace.
- **Speed of creation vs. Quality of data**: Quick bead creation encourages adoption; thorough bead creation ensures graph quality — the IDE must support both and nudge toward the latter.
- **Single-user editing vs. Multi-agent concurrency**: The multi-model convergence workflow means the graph is being edited by multiple agents simultaneously, requiring real-time conflict awareness.
- **Visual graph manipulation vs. Structured form editing**: Some operations (wiring dependencies) are naturally spatial; others (setting priority, writing acceptance criteria) are naturally textual — the IDE must blend both seamlessly.

---

## Domain Expert Perspective

## Domain Concepts

### What terminology is assumed but not defined?

1. **What is a "work graph" and how does it differ from a dependency graph, a knowledge graph, or a project plan?**
   Users encountering "work graph" will try to map it to something they already know, and if the boundaries are fuzzy they will use the tool incorrectly or set wrong expectations.

2. **What exactly is "direct bead graph authoring" and how does it differ from editing issues in a tracker?**
   The brief positions the IDE against "markdown PRD workflows," but the alternative — direct graph authoring — is not a well-established interaction paradigm and users will need a mental model for what they are actually doing.

3. **What is the precise meaning of "molecule" in this context — is it a workflow instance, a template, a running process, or all three at different times?**
   The term "molecule" is overloaded across the codebase (formula type, spawned workflow, pour output, compound structure) and users will be confused about which they are looking at in the IDE.

4. **What does "canonical" mean in "distill to canonical" and who decides what is canonical?**
   Multi-model convergence assumes a notion of ground truth, but the brief does not define what canonical means, who arbitrates it, or what happens when models disagree fundamentally rather than superficially.

5. **What is a "formula" to a non-technical user — a template, a recipe, a macro, a workflow definition, or a programming language?**
   Formulas combine aspects of all of these (variables, loops, conditionals, composition, inheritance), and the IDE must pick a metaphor that users can hold in their heads.

6. **What is the difference between a "bead" and an "issue" — are they the same thing, or does "bead" carry additional semantics?**
   The schema file uses "Issue" as the Go struct name, the CLI uses "bead" as the noun, and the IDE will need to pick one term and stick with it or users will be perpetually confused.

7. **What does "phase" mean in the formula context (liquid vs vapor) vs the BCC compilation context (SCAN/ANALYZE/CONNECT/ENRICH)?**
   Two completely unrelated uses of "phase" exist in the same domain, and the IDE will surface both, creating ambiguity.

8. **What is a "proto" and why would a user care about the distinction between a formula, a proto, and a poured bead?**
   The three-stage compilation pipeline (formula -> proto -> real bead) is an implementation detail that may or may not need to be exposed to IDE users, but the brief does not clarify whether users should see or manipulate protos.

9. **What does "branching" mean when both Git branches and Dolt branches exist simultaneously — which is being branched, and what is the user's mental model?**
   Dual-layer version control means "create a branch" is ambiguous, and users will not instinctively understand which layer they are operating on.

10. **What is a "rig" and how does it relate to agents, roles, and the IDE user's workflow?**
    The bead schema includes rig, agent, role, and convoy types that imply an agent orchestration system, but the brief says "a separate runtime executes it" — so what does the IDE user need to know about these concepts?

11. **What is the "GUPP system" referenced by the "hooked" status?**
    A status value references a system that is not defined anywhere in the brief or schema documentation, leaving a gap in understanding the workflow lifecycle.

12. **What is "HOP" in the context of quality scores and validations?**
    The schema references HOP fields (quality_score, crystallizes, validations) without defining the acronym or the quality workflow it implies.

13. **What does "wisp" mean semantically — is it a concept users think about, or purely an infrastructure detail?**
    The distinction between liquid/vapor/wisp/ephemeral beads touches workflow design decisions that users make, but the terminology is non-standard and unexplained.

14. **What is a "bond" vs a "dependency" vs an "edge"?**
    The formula system uses "bond" (bond_points, bonded_from), the graph uses "dependency/edge," and the brief uses "dependency graph" — but these may not be synonyms and users need to know which is which.

## Prior Art

### What do existing products do?

1. **How does this compare to Linear, Jira, or Shortcut — and specifically, what do users of those tools expect from an "IDE for work" that we must either match or explicitly reject?**
   Users will inevitably compare the IDE to issue trackers, and unmet expectations from that comparison will be the primary source of dissatisfaction.

2. **What can we learn from graph-first tools like Notion's relation databases, Roam Research's bidirectional links, or Obsidian's graph view about how users actually interact with graph visualizations?**
   Graph visualization is a solved UX problem in some domains, and users have strong expectations about zoom, filter, search, and layout that we should not reinvent badly.

3. **How do existing DAG editors (Apache Airflow UI, Prefect, Dagster, n8n, Node-RED) handle the core problem of visually composing workflows with dependencies?**
   Formula authoring is essentially visual workflow composition, and the prior art for this is extensive and opinionated — users will expect drag-and-drop, connection handles, and live validation.

4. **What has GitHub Projects, Asana, or Monday.com learned about the failure modes of "graph views" of project work — and why do most of them default to list/board views?**
   There is strong evidence that graph views overwhelm users past ~30 nodes, and the brief's target of 50-200 beads will hit this wall immediately.

5. **How do database branching tools (PlanetScale, Neon, Dolt's own Hosted product) present branch/diff/merge to users — and what conventions exist?**
   Dolt-powered branching is a key feature, but database branching is unfamiliar to most users, and the UX conventions are not well-established outside of a niche audience.

6. **What can we learn from Figma's branching model about how creative workers think about branches, reviews, and merging?**
   Figma's branching is the closest mainstream analogue to "branch a work graph, edit it, merge it back," and its UX decisions (what to show in diffs, how to resolve conflicts) are directly relevant.

7. **How do existing multi-model AI comparison tools (Chatbot Arena, TypingMind, OpenRouter Playground) present model outputs side-by-side, and what do users expect from a "convergence" workflow?**
   Branch-per-model convergence has no established UX convention, and users will not have a mental model for what "distill to canonical" looks like in practice.

8. **What do IDE users (VS Code, JetBrains) expect from "source code bridging" — is it go-to-definition, inline annotations, file tree integration, or something else entirely?**
   The brief mentions "bridges beads to source code" without specifying the interaction model, and developers have very strong expectations about what code navigation feels like.

9. **How do spreadsheet tools (Excel, Google Sheets) and low-code platforms (Airtable, Retool) handle the problem of editing structured data with many fields (30+ fields per bead)?**
   The bead schema has 40+ fields across multiple categories, and existing tools have well-tested patterns for progressive disclosure, field grouping, and form layout that we should study.

10. **What have tools like Miro, Whimsical, and FigJam learned about collaborative graph/diagram editing — particularly around real-time cursors, conflict resolution, and undo/redo?**
    If the IDE supports multiple users (or multiple AI agents) editing the same graph, the collaboration model matters enormously and prior art is rich.

11. **How do BPMN editors (Camunda Modeler, bpmn.io) handle the visual composition of workflows with gates, conditions, loops, and parallel branches?**
    The formula system's gates, loops, conditions, and branch rules map almost 1:1 to BPMN concepts, and that domain has decades of UX research.

12. **What can we learn from Terraform's plan/apply model about previewing changes before committing them?**
    The `bd cook --dry-run` / `bd mol pour` workflow is structurally identical to `terraform plan` / `terraform apply`, and the UX convention of "show what will happen, then do it" is well-understood.

## Problem Depth

### Is this the real problem or a symptom?

1. **Is the real problem that markdown PRDs are a bad authoring format, or that the translation from intent to structured work is lossy regardless of format?**
   If the loss happens during decomposition (not during authoring), then a better editor for the output does not fix the root cause, and the IDE may solve the wrong problem.

2. **Is the core pain point that humans cannot effectively author bead graphs, or that AI agents produce bead graphs that humans cannot review and correct?**
   The direction of the workflow (human-to-graph vs graph-to-human) fundamentally changes the IDE's design priorities.

3. **Do users actually want to author work graphs directly, or do they want to describe work in natural language and have the graph be derived?**
   If the answer is the latter, the IDE's primary interface should be a natural language input with graph preview, not a graph editor — and the brief assumes the opposite.

4. **Is the formula system's complexity (inheritance, loops, conditions, aspects, composition, advice, pointcuts) a feature or a sign that the underlying model is too complex for direct authoring?**
   If users struggle with TOML formula files, a visual builder for the same complexity may not help — the complexity itself may be the problem.

5. **Is the Dolt branching/merging workflow solving a real user pain (collaborative work planning) or an engineering elegance (database version control)?**
   Users may not think about work planning as something that needs branching and merging — they may just want conflict-free collaboration.

6. **Is "multi-model convergence" a user need or a capability looking for a use case?**
   The brief assumes users want to run multiple AI models on the same work graph and merge the results, but it is unclear whether any user has actually asked for this or whether it is a technical possibility being promoted to a feature.

7. **What problem does the IDE solve that the CLI does not — is it discoverability, visualization, speed, or something else?**
   If the CLI is functionally complete, the IDE must offer a categorically different experience (not just a GUI wrapper) to justify its existence.

8. **Is the work graph the right abstraction for the users we are targeting, or is it an expert tool that will only serve power users?**
   Graph thinking is cognitively demanding, and if the target audience includes non-technical stakeholders (PMs, designers), the IDE may need radically different views that hide the graph entirely.

9. **Are we building a tool for one person (the codebase compiler operator) or a collaborative platform for teams?**
   The answer changes everything: single-user means no collaboration features, no permissions, no real-time sync; multi-user means all of those are table stakes.

10. **Does the "separate runtime" for executing work graphs need to be visible in the IDE, or is the IDE purely an authoring tool with no execution visibility?**
    If users author work graphs but cannot see their execution status, the IDE becomes a dead-end in the workflow — you author, switch to another tool to monitor, then come back to edit.

11. **Is the bead schema stable, or will it continue to evolve — and how does the IDE handle schema evolution?**
    The schema has 40+ fields, custom types, custom statuses, and custom dependency types, suggesting ongoing evolution that the IDE must accommodate without hardcoding field layouts.

12. **What is the relationship between the IDE and the `bv` (Beads Viewer) tool — is the IDE replacing `bv`, extending it, or wrapping it?**
    The brief mentions graph visualization and all 9 metrics, which is exactly what `bv` already does, creating potential confusion about which tool to use when.

## Edge Cases (Domain)

### What unusual but valid scenarios exist?

1. **What happens when a user creates a cycle in the dependency graph — is it prevented, warned, or allowed with degraded metrics?**
   Cycles are explicitly called out as anti-patterns that "break most graph algorithms," but they can be created through the CLI today, and the IDE must decide whether to enforce what the CLI does not.

2. **What happens when two Dolt branches modify the same bead differently — what does a "merge conflict" look like for a work graph?**
   Git merge conflicts have well-understood resolution UX; work graph merge conflicts (conflicting status changes, contradictory dependency edits, divergent descriptions) have no established resolution model.

3. **What happens when a formula references another formula that does not exist or has been deleted?**
   Formula composition (extends, expand, compose.aspects) creates fragile chains, and the IDE must handle broken references gracefully.

4. **How does the IDE handle a graph with 500+ beads — the brief's stated upper limit — where graph visualization becomes unreadable?**
   The sweet spot is 50-200 beads, but the upper bound is 500, and no force-directed graph layout handles 500 nodes usefully without aggressive filtering or clustering.

5. **What happens when an agent is actively executing a molecule while the user edits the same beads in the IDE?**
   Concurrent modification between human IDE users and AI agent execution is a fundamental conflict that the brief acknowledges ("Handle agent molecule execution alongside IDE edits") but does not resolve.

6. **What happens when a user tries to "pour" a formula with unresolvable variable references or invalid conditions?**
   The cook/pour pipeline has validation rules (required vars, enum constraints, regex patterns), and the IDE must surface these errors in a way that helps the user fix them.

7. **How does the IDE handle beads with `ephemeral: true` (wisps) that may have been auto-compacted or deleted between sessions?**
   Wisps have TTL-based compaction (6h to 7d), meaning the graph the user sees may change between sessions without any user action.

8. **What happens when a user wants to undo a `bd mol pour` that created 20 beads with dependencies — is there a transactional rollback?**
   Pour creates multiple beads atomically from the CLI perspective, but undo in a graph editor typically means single-action undo, creating a mismatch.

9. **How does the IDE handle beads with the `tombstone` status — are they visible, filtered, or shown with special treatment?**
   Soft-deleted beads still exist in the database and may still have dependencies pointing to them, creating ghost nodes in the graph.

10. **What happens when a user imports a bead graph from one repository and tries to reference beads from another repository?**
    The schema includes `source_repo` and `source_system` fields suggesting cross-repo federation, but the IDE's scope for multi-repo graphs is undefined.

11. **How does the IDE handle the `defer_until` field — should deferred beads be hidden from the graph, dimmed, or shown normally?**
    Deferred beads are hidden from `bd ready` in the CLI, but the graph view has no convention for temporal visibility.

12. **What happens when the Dolt database and the Git repository are out of sync — which is the source of truth?**
    The dual-layer foundation means two version control systems that can diverge, and the IDE must either prevent divergence or help users reconcile it.

13. **How does the IDE handle beads with the `pinned` status that are meant to stay open indefinitely — do they distort graph metrics?**
    Pinned beads are permanent context markers that never close, which could accumulate and skew density, PageRank, and attention metrics over time.

14. **What happens when a formula's `on_complete` runtime hook spawns molecules that conflict with the current graph state?**
    Runtime expansion is non-deterministic (depends on step output), and the IDE cannot preview what `on_complete` will produce because it depends on execution results.

15. **How does the IDE handle the `provides:*` reserved label namespace that can only be set by `bd ship`?**
    If the IDE allows label editing but some labels are CLI-command-restricted, users will encounter confusing permission errors.

## Success Criteria

### How would we know this succeeded?

1. **Does the IDE reduce the time from "I have a feature idea" to "I have a well-structured, dependency-wired bead graph ready for agent execution" compared to the CLI workflow?**
   This is the fundamental value proposition: if the IDE is not measurably faster or higher-quality than `bd` CLI commands, it does not justify its existence.

2. **Can a user who has never used the `bd` CLI successfully create a valid bead graph with proper dependencies using only the IDE?**
   If the IDE still requires CLI knowledge, it has failed as a self-sufficient authoring environment.

3. **Do users actually use the graph visualization, or do they spend most of their time in list/form views editing individual beads?**
   Usage telemetry will reveal whether graph authoring is the real workflow or a marketing feature — and the answer should drive investment.

4. **Can users successfully create, pour, and modify formulas through the IDE without resorting to manual TOML editing?**
   Formula authoring is the most complex feature in the brief, and if users cannot do it visually, the formula builder has failed.

5. **Do the Dolt branch/diff/merge workflows actually get used, and if so, for what — multi-model convergence, collaborative editing, or experimental planning?**
   The use case for work graph branching is speculative, and success means discovering which use case actually sticks.

6. **Can users understand and act on graph metrics (PageRank, betweenness, HITS) without graph theory knowledge?**
   The IDE surfaces 9 graph metrics, but if users cannot translate "high betweenness centrality" into "this is a critical bottleneck," the visualization is wasted screen space.

7. **Does the IDE maintain graph quality targets (density 0.03-0.12, edge-per-node 0.7-1.4) as users edit, or does unconstrained editing produce pathological graphs?**
   Quality guardrails in real-time are harder than post-hoc validation, and the difference determines whether users produce good graphs or bad ones.

8. **Can a user perform a complete multi-model convergence workflow (branch per model, review diffs, distill to canonical) in under 30 minutes?**
   If the convergence workflow is too cumbersome, users will skip it and just use one model's output, defeating the feature's purpose.

9. **Does the IDE survive contact with a real 200-bead graph from a production codebase without becoming sluggish, unreadable, or confusing?**
   The gap between demo-quality (10-20 beads) and production-quality (200 beads) is where most graph tools fail.

10. **Do users trust the IDE enough to use it as their primary work planning tool, replacing their existing PRD/issue tracker workflow?**
    Trust requires reliability, predictability, and recoverability — if users fear data loss or graph corruption, they will maintain parallel workflows in markdown and issue trackers.

11. **Can the IDE handle the full bead schema (40+ fields) without overwhelming users — specifically, do users find the fields they need within 3 clicks?**
    Progressive disclosure of 40+ fields is a genuine UX challenge, and success means users never feel lost or overwhelmed by the field count.

12. **Does the "bridge to source code" feature actually get used, or is it a novelty?**
    Bridging beads to source code is mentioned in the brief but vaguely specified — success means users navigate fluidly between work items and code, not that a link exists but nobody clicks it.

13. **Can the IDE be adopted incrementally (start with bead CRUD, add graph viz later, add formulas later) or does it require all features at once to be useful?**
    If the IDE only works when all features are present, the adoption curve is steep; if it is useful with just bead editing, adoption can be gradual and feedback-driven.

---

## Cross-Perspective Themes (Opus)

### 1. Cognitive Load & Progressive Disclosure

All three perspectives emphasize the challenge of complexity without overwhelming users:

- **User Advocate** identifies "terminology barrier" and "progressive disclosure" as top concerns, noting that 30+ bead fields, 18 dependency types, and domain jargon like "molecule," "formula," "pour," and "wisp" create daily friction.
- **Product Designer** lists "Power vs. Approachability" as a core design tension: exposing 30+ bead fields, 18 edge types, 9 metrics, and formula TOML without overwhelming new users requires careful progressive disclosure.
- **Domain Expert** questions whether the schema's 40+ fields and complex terminology actually represent necessary complexity or whether "the complexity itself may be the problem" — suggesting that even with progressive disclosure, the underlying model may be too complex for direct authoring.

The consensus: Progressive disclosure is not optional; it is fundamental to whether this product is even usable for newcomers. But disclosure alone may not be enough if the underlying model is inherently complex.

### 2. Undo/Rollback as Critical Reliability Feature

All three perspectives independently flag undo and rollback as essential for user trust:

- **User Advocate** emphasizes that "undo and recovery" determines whether users feel safe experimenting, and notes that without it "trust in the tool collapses immediately" after accidental mistakes like wiring wrong dependencies.
- **Product Designer** designs for it in multiple contexts: how users undo destructive actions (deleting a bead, removing an edge), how they handle batch operations on formula-generated beads, and how they reconcile merge conflicts.
- **Domain Expert** discusses the technical challenge: "Pour creates multiple beads atomically from the CLI perspective, but undo in a graph editor typically means single-action undo, creating a mismatch" and asks whether transactional rollback is even feasible.

The consensus: Undo/redo is table stakes for adoption, but implementing it across graph edits, formula generation, and batch operations is architecturally non-trivial.

### 3. Visual Graph Interaction vs. Structured Form Editing

All three perspectives grapple with the inherent tension between spatial and textual interaction:

- **User Advocate** questions whether "the graph visualization is the primary interface or a secondary view" and notes that "some users think visually, others think in lists."
- **Product Designer** identifies "Visual graph manipulation vs. Structured form editing" as a core design tension: "Some operations (wiring dependencies) are naturally spatial; others (setting priority, writing acceptance criteria) are naturally textual — the IDE must blend both seamlessly."
- **Domain Expert** frames it as a design choice with massive implications: "Graph-first vs. List-first" fundamentally defines the product's identity and "the product's identity hinges on whether the graph visualization or a structured list is the primary navigation mode."

The consensus: The IDE cannot choose graph-first or list-first; it must support both simultaneously. But the choice of which is primary determines every other design decision downstream.

### 4. Merge Conflicts in Structured Data

All three perspectives independently identify merge conflicts as a critical unsolved problem:

- **User Advocate** asks: "What if a user tries to merge two Dolt branches with conflicting bead edits to the same field?" and notes that "merge conflicts in structured data are harder to resolve than text conflicts."
- **Product Designer** designs the interaction: "Conflicts need visual specificity: which bead fields conflict, what each branch says, and a clear per-field resolution mechanism — not a generic 'conflict' error with no detail" and specifies a "merge mode with clear entry and exit points."
- **Domain Expert** states plainly: "Git merge conflicts have well-understood resolution UX; work graph merge conflicts (conflicting status changes, contradictory dependency edits, divergent descriptions) have no established resolution model."

The consensus: Dolt branching is a cornerstone feature, but there is no prior art for resolving conflicts in work graphs. This requires novel UX design before feature development can begin.

### 5. Unknown Use Cases & Speculative Features

All three perspectives flag the fundamental ambiguity about what users actually want vs. what the brief assumes:

- **User Advocate** asks repeatedly: "What is the user actually trying to accomplish on a typical day?" and "What does the user do when they disagree with a model's suggested changes?" — surfacing that the assumed "multi-model convergence" workflow may not reflect how users will actually use the tool.
- **Product Designer** designs for multi-model convergence without questioning whether it is real: "What is the step-by-step flow for the multi-model convergence workflow?" and "Comparing 2-5 model branches simultaneously requires either a split view, a tabbed comparison, or an overlay diff."
- **Domain Expert** is explicit: "Is 'multi-model convergence' a user need or a capability looking for a use case? The brief assumes users want to run multiple AI models on the same work graph and merge the results, but it is unclear whether any user has actually asked for this or whether it is a technical possibility being promoted to a feature."

The consensus: The brief describes features (graph visualization, formula builder, multi-model convergence) but does not validate that these features solve real user problems. Early user research to validate or invalidate assumptions is prerequisite to design and development.
