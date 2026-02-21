# Question Triage: beads-ide

**Scope selected:** P0+P1
**Questions in scope:** 94
**Auto-answerable:** 51
**Branch points for human:** 43

---

## Auto-Answerable Questions

| # | Question | Proposed Answer | Source |
|---|----------|-----------------|--------|
| 5 | What terminology needs standardization in the UI? | Yes, all domain jargon must have a glossary and tooltips. Use familiar terms in UI chrome (e.g., "Template" not "Formula," "Workflow" not "Molecule") with domain terms available as secondary labels. Progressive disclosure of jargon. | Best practice: every domain-heavy tool (Kubernetes Dashboard, Terraform Cloud) provides a terminology layer. Both models flag jargon as #1 adoption risk. |
| 11 | Do users expect undo/redo across all operations? | Yes. Ctrl+Z / Cmd+Z must work for bead creation, edge manipulation, field edits, and batch operations. Batch operations (formula pour) get transactional undo as a single unit. | Universal expectation. Every modern editor provides undo. Trust collapses without it. |
| 12 | What happens when a formula generates many wrong beads -- transactional rollback? | Yes, formula pour must be atomic with one-click rollback. Show the batch as a single undo-able transaction in history. | Best practice: Terraform apply, database migrations -- batch operations are transactional. Codebase already has atomic pour via CLI. |
| 13 | What happens when a user deletes a bead that other beads depend on? | Show a confirmation dialog listing all affected dependencies. Offer choices: cascade-delete dependents, orphan dependents (remove edges), or cancel. Never silently break edges. | Best practice: every relational editor (database tools, Figma components) warns on cascading deletes. |
| 15 | How does the IDE handle graphs with 200+ beads? | Provide semantic zoom (cluster by epic/type), collapse/expand groups, focus mode (show N-hop neighborhood of selected bead), and minimap. Default to clustered view above 50 nodes. | Best practice: Figma, large Miro boards, Grafana dashboards all use progressive detail + clustering. SKILL.md targets 50-200 beads. |
| 16 | When a user has 150 beads, how do they find the 3 that matter now? | Faceted filtering (status, type, assignee, labels, priority) + full-text search + saved views + "My Work" default filter showing assigned/in-progress/blocked beads. | Best practice: Linear, Jira, GitHub Issues all solve this with faceted filters. |
| 18 | Do users expect branch/diff to feel as simple as GitHub PRs? | Yes. Map to familiar GitHub mental model: branch list, diff view showing added/removed/changed beads and edges, merge button with conflict indicator. | Universal expectation from the target audience (developers, PMs in engineering orgs). |
| 21 | How does a user learn the bead schema (30+ fields, 18 dep types) without docs? | Progressive disclosure: show only title + type + status on creation. Reveal additional fields via "Add field" or contextual suggestions. Tooltips on every field. Schema complexity is hidden until needed. | Best practice: Notion, Linear, GitHub Issues all start with minimal fields and progressively reveal. |
| 22 | How does a user get from vague idea to structured bead graph? | Start with a single bead (just title + type). Let them add children, dependencies, and detail iteratively. Offer "Scaffold from template" (formula) as accelerator. Never require the full graph upfront. | Best practice: incremental refinement is how every successful planning tool works (Linear, Notion, even sticky notes). |
| 23 | Can a screen reader user navigate the dependency graph? | Must provide an accessible alternative: a structured tree/list view of the graph with ARIA labels, keyboard navigation, and relationship narration ("Bead X blocks Bead Y"). Graph visualization alone is insufficient. | Legal/ethical requirement: WCAG 2.1 AA. Graph-only UIs are inaccessible by definition. |
| 24 | Can colorblind users distinguish bead types, statuses, overlays? | Never rely on color alone. Use shape + icon + text label as primary differentiators. Color is supplemental. Provide a colorblind-safe palette option. | Legal/ethical requirement: WCAG 2.1 AA, 1.4.1 Use of Color. ~8% of male users affected. |
| 25 | Is the IDE usable with keyboard only? | Yes. All operations must be keyboard-accessible: Tab navigation, Enter to select, shortcuts for common actions (create bead, add edge, search, switch views). Provide a command palette (Cmd+K). | Legal/ethical requirement: WCAG 2.1 AA, 2.1.1 Keyboard. IDE framing attracts keyboard-heavy users. |
| 26 | Does the IDE work on 13-inch laptop screens? | Yes. Responsive layout with collapsible panels. Default to single-panel view on small screens with toggle to show graph/detail/formula panels. Minimum supported: 1280x720. | Best practice: VS Code, Figma, Linear all work on 13" laptops. Excluding common hardware is a non-starter. |
| 29 | Is the bead schema stable, or will it evolve -- how does IDE handle this? | Assume schema will evolve. IDE must be schema-driven (render fields from schema definition, not hardcoded). Custom fields and types already exist in schema. Use a field registry pattern. | Codebase context: schema already has 6 built-in + 8 custom types, custom dependency types. Evolution is built into the data model. |
| 33 | Do users expect real-time collaboration (Google Docs-style)? | Not in phase one. Single-user with branch-based async collaboration (like Git). Real-time multiplayer is a phase 2+ feature. State this explicitly in onboarding. | Codebase context: Dolt branching model is inherently async. Building real-time collab on top of branch-merge is architecturally contradictory for v1. |
| 35 | Do users expect bead editing to feel like Notion or Google Docs? | Yes for rich-text fields (description, design notes, acceptance criteria). Use a block-based editor (TipTap/ProseMirror). Non-text fields (status, priority, labels) use structured inputs. | Best practice: modern web tools have set the bar at block-based rich text. A textarea feels dated. |
| 37 | Do users expect keyboard shortcuts for everything? | Yes. Provide shortcuts for top-20 actions, a command palette (Cmd+K) for everything else, and a shortcut reference panel. "IDE" framing demands this. | Universal expectation for tools branded as "IDE." VS Code, JetBrains, Figma all provide extensive shortcuts. |
| 38 | Will users expect search and filtering to be fast and faceted? | Yes. Faceted search across type, status, label, assignee, priority, text content. Results in <100ms for 200 beads. Saved filters as views. | Best practice: every tool at this data scale provides faceted search. 200 items is trivially indexable client-side. |
| 40 | Do users expect formula output preview before committing? | Yes. "Dry run" preview is mandatory before pour. Show proto beads in a diff-style view (what will be created). Require explicit confirmation to pour. | Best practice: Terraform plan/apply, database migration preview. Codebase already has `bd cook` for preview and `bd mol pour` for commit -- mirror this in UI. |
| 41 | Do users expect the IDE to prevent invalid states, not just warn? | Prevent where possible (e.g., block cycle creation, enforce required fields on save). Warn for soft constraints (density thresholds, quality heuristics). Hard constraints are prevented; soft constraints are warned. | Best practice: form validation prevents invalid data; lint warnings flag quality issues. Mixed approach is standard. |
| 43 | Do users expect bead-to-source-code links to be bidirectional? | Yes, when source links exist they should be navigable in both directions. Click a bead to see linked files; click a source annotation to see the bead. Phase 1 can be bead-to-source only, with reverse index in phase 2. | Codebase context: BCC compiles codebases into bead graphs, so source-to-bead mapping is core to the system. Brief says "bridges beads to source code." |
| 46 | How should bead types be visually distinguished? | Shape + icon as primary (e.g., hexagon for epic, circle for task, diamond for bug, square for feature). Color as secondary reinforcement. Text label always visible. Consistent with colorblind accessibility. | Best practice: node-based editors (Unreal Blueprints, Node-RED, Figma layers) use shape+icon. Color alone fails accessibility. |
| 47 | How should edge types be visually distinguished? | Group 18 types into 4-5 visual categories: solid arrow for `blocks`, dashed for `related`, thick for `parent-child`, dotted for `discovered-from`, colored for custom. Label on hover. | Best practice: UML, ER diagrams, Mermaid.js all use line-style groups. 18 distinct visuals would be unlearnable. |
| 49 | Where does the bead detail editor live relative to the graph? | Side panel (right or bottom) that opens on bead selection. Graph remains visible and interactive. Panel is resizable and collapsible. Click-away or Escape closes it. | Best practice: VS Code (editor + sidebar), Figma (canvas + properties panel), Linear (list + detail). Side panel preserves context. |
| 53 | How does a user create their first bead in an empty graph? | Empty state shows a prominent "Create your first bead" button + option to "Start from template" (formula). Guided creation: just title + type. The bead appears on the canvas immediately. | Best practice: every modern tool designs the empty state as onboarding (Figma, Linear, Notion). Never show a blank void. |
| 54 | How does a user add a dependency edge between two beads? | Three methods: (1) drag from edge handle on source to target bead, (2) right-click source bead > "Add dependency" > click target, (3) keyboard shortcut to enter "edge mode" then click source and target. Default type is `blocks`; type selector appears after edge creation. | Best practice: every node editor (Node-RED, Unreal, Figma prototyping) uses drag-from-handle. Multiple methods serve different users. |
| 55 | How does a user switch between graph view and bead detail view? | Click a bead node to open detail panel (side panel). Click canvas background or press Escape to close. Graph viewport position is preserved. No full-page navigation -- both are always co-present. | Best practice: Figma, Miro, draw.io all keep canvas + detail co-present. Full-page switches break spatial memory. |
| 57 | How does a user filter the graph to focus on a subset? | Filter bar (top of graph) with dropdowns for status, type, assignee, label, priority. Active filters dim (not hide) non-matching beads to preserve spatial context. Toggle to fully hide non-matching. Keyboard shortcut to open filter. | Best practice: Figma layers panel filtering, GitHub Issues filters. Dimming preserves spatial context better than hiding. |
| 58 | What inputs are required vs optional when creating a bead? | Required: title only. Type defaults to "task" if unset. Everything else is optional. The system auto-generates ID, timestamps, and sets status to "open." Encourage but never block. | Best practice: minimize creation friction (Linear creates issues with just a title). Codebase context: `bd new` already works with minimal input. |
| 59 | How does a user know changes have been saved? | Auto-save with debounce (500ms after last edit). Show "Saving..." indicator in header during save, "Saved" with timestamp after. Unsaved changes show a dot on the tab/panel title. | Best practice: Google Docs, Figma, Notion all auto-save with status indicator. Manual save is dated. |
| 60 | How does a user trigger a graph quality check? | Ambient/automatic: quality indicators (density, cycle warnings) update live as the graph changes. A "Graph Health" panel shows all 9 metrics with green/yellow/red status. No manual trigger needed -- metrics are always current. | Codebase context: `bv` already computes all 9 metrics. Best practice: linters run continuously (ESLint, TypeScript), not on-demand. |
| 62 | How does a user bulk-edit multiple beads? | Multi-select (Shift+click, Cmd+click, or lasso on graph; checkboxes on list view). Bulk action bar appears: change status, set labels, reassign, reparent, delete. Show count of selected items. | Best practice: Gmail, Linear, Jira, Finder all use multi-select + bulk action bar. |
| 63 | How does a user navigate from bead to parent epic or child tasks? | Breadcrumb trail in bead detail panel showing hierarchy (Project > Epic > Feature > Task). Click any breadcrumb to navigate. Also: expand/collapse children in graph view. Tree view sidebar as alternative. | Best practice: file explorers, Jira epic/story hierarchy, Linear project navigation all use breadcrumbs + tree. |
| 69 | What happens when graph density exceeds the 0.12 upper bound? | Progressive warning: yellow indicator at density > 0.10, red at > 0.12. Show which edges are likely redundant (transitive reduction suggestions). Never block -- warn and suggest. | Codebase context: SKILL.md defines density target as 0.03-0.12. Anti-pattern is density > 0.15. |
| 70 | What happens when a formula references an unbound variable? | Catch at cook time (preview stage), not silently at pour time. Highlight the unbound variable in the formula builder. Block pour until all required variables are bound. Optional variables use defaults. | Codebase context: formulas have `required: true/false` on variables with defaults. Best practice: template engines validate before rendering. |
| 72 | What does the loading state look like? | Skeleton UI: show graph layout placeholder with animated pulse, then progressively render beads as they load. Minimap skeleton first, then nodes, then edges. Never a full-screen spinner. | Best practice: Facebook, Linear, Notion all use skeleton UI. Progressive loading is standard. |
| 73 | What does the "unsaved changes" state look like? | With auto-save, this state is transient (<1 second). Show a subtle dot indicator on the panel tab during the save debounce. If auto-save fails, show a persistent yellow banner with "Changes not saved -- Retry" action. | Best practice: VS Code dot on tab, Google Docs "Saving..." indicator. |
| 75 | What does "formula cooking" state look like? | Split view: formula definition on left, proto beads appearing on right as they are generated. Progress indicator if multi-step. Show bead count incrementing. Cancelable. | Codebase context: `bd cook` generates proto beads. Best practice: Terraform plan shows resources as they are evaluated. |
| 76 | What does "branch diverged" state look like vs "in sync"? | Git-style ahead/behind indicator on the branch label: "3 beads ahead, 1 behind main." Green checkmark for in-sync, orange divergence icon for diverged. One-click to view diff or merge. | Best practice: GitHub branch status, VS Code source control indicators. |
| 77 | How does the user transition from graph exploration to bead editing? | Click bead node opens detail panel alongside graph. Graph viewport position preserved. Edits in panel are reflected on the graph node in real-time (status color change, title update). Escape returns focus to graph. Zero navigation cost. | Best practice: Figma canvas + properties panel, Miro board + card detail. |
| 79 | What does "read-only" state look like viewing someone else's branch? | Gray/muted edit controls with lock icon. Banner at top: "Viewing [branch-name] (read-only). Create a branch to make changes." All interactive affordances (drag handles, edit buttons) are hidden or visually disabled. | Best practice: Google Docs "Viewing" mode, GitHub file view on other branches. |
| 84 | What is the difference between bond, dependency, edge? | In the UI, use one term consistently: "dependency." Bond is a formula-authoring concept (how templates wire connections). Edge is the graph-theory implementation detail. Users see "dependencies" everywhere; formula authors see "bonds" only in the formula builder. | Codebase context: schema uses "dependency," formulas use "bond," graph theory uses "edge." UI must unify. |
| 86 | Which dependency meanings must be standardized? | Mandatory to standardize: `blocks` (scheduling), `parent-child` (hierarchy), `related` (informational), `discovered-from` (provenance). Optional/custom: all others. These 4 cover 90%+ of usage. Show others under "More types." | Codebase context: 18 well-known types exist but usage is Pareto-distributed. Progressive disclosure. |
| 92 | What can we learn from Terraform plan/apply? | The cook/pour workflow should mirror terraform plan/apply exactly: (1) show what will change (additions, modifications), (2) require explicit confirmation, (3) provide atomic rollback. The UX convention is well-established and maps directly. | Direct structural parallel: `bd cook` = `terraform plan`, `bd mol pour` = `terraform apply`. |

---

## Branch Points (Human Decision Required)

| # | Question | Why Human Needed |
|---|----------|------------------|
| 1 | Will users expect this to feel like a project management tool or a code IDE? | Defines the entire UX direction. PM-tool means list-first, status-board primary. Code-IDE means panels, file-tree, editor-first. Multiple valid approaches; the product vision determines this. |
| 2 | What exactly is a "bead" -- task, decision, requirement, issue, or all of these? | Codebase uses "bead" as a generic container. The user-facing explanation determines the mental model. "Work item" vs "planning unit" vs "node" each imply different things. Only the product owner knows the intended framing. |
| 3 | What is the precise meaning of "molecule" -- workflow instance, template, running process? | Overloaded across formula type / spawned workflow / pour output. The simplification decision (rename? split concept? hide from users?) requires product judgment. |
| 4 | What is a "formula" to a non-technical user? | Template vs recipe vs macro vs workflow definition -- each sets different expectations for the formula builder's complexity and interaction model. |
| 6 | What is the user actually trying to accomplish on a typical day? | Planning vs tracking vs analyzing are different jobs. The primary job determines the default view, navigation, and feature hierarchy. Only the product owner knows the target use case. |
| 7 | Is the real problem that markdown PRDs are bad, or that intent-to-structure translation is lossy? | If the problem is the format, a better editor suffices. If the problem is the translation, AI-assisted structuring is needed. This determines whether the IDE is primarily an editor or a transformer. |
| 8 | Do users want to author graphs directly or describe work in natural language? | Direct authoring means graph editor is primary. NL-first means the graph is a derived artifact. Fundamentally different product architectures. |
| 9 | Is "multi-model convergence" a user need or a capability looking for a use case? | Both models question whether anyone has asked for this. If validated, it is a differentiator. If not, it is scope to cut. Only user research or product vision can answer. |
| 10 | Are we building for one person (operator) or a collaborative team platform? | Changes everything: auth, permissions, real-time sync, notification systems, branch ownership. The codebase currently serves a single operator. Expanding to teams is a 10x scope increase. |
| 14 | Will the graph visualization be the primary interface or a secondary view? | Defines the product identity. Graph-primary means spatial thinking. List-primary means linear thinking. Both are valid; this is a product vision call. |
| 17 | What does a merge conflict look like for a work graph -- how is it resolved? | No established UX pattern exists. Requires novel design. Per-field resolution? Per-bead resolution? Side-by-side? Three-way diff? The resolution model must be designed, and the acceptable complexity level is a product decision. |
| 19 | What does "canonical" mean and who decides what is canonical? | Convergence has no finish line without a definition. Is it majority-vote across models? Human override? Automated scoring? The governance model is a product/process decision. |
| 20 | What is the user's first 5-10 minutes like? | The first-run experience requires a specific onboarding strategy. Blank canvas + tutorial? Guided project creation? Import from existing? Sample project? This is a product design call with no universal right answer. |
| 27 | What problem does the IDE solve that the CLI does not? | Discoverability, visualization, speed, collaboration -- or something else entirely? The unique value proposition determines which features are load-bearing vs nice-to-have. Only the product owner can articulate this. |
| 28 | Is the core pain point that humans cannot author bead graphs, or that AI produces graphs humans cannot review? | Human-to-graph means the IDE is an authoring tool. Graph-to-human means it is a review/correction tool. The primary direction shapes every workflow. |
| 30 | What is explicitly out of scope in phase one? | Multiple valid phase-one scopes: bead CRUD only, CRUD + graph viz, CRUD + graph viz + formulas, full feature set. Each has different timelines and risks. Product owner must decide. |
| 31 | Does the runtime need to be visible in the IDE, or is this purely an authoring tool? | If authoring-only, the IDE is simpler but becomes a dead-end after planning. If runtime-visible, it needs execution status, agent activity, molecule progress. Major scope decision. |
| 32 | What is the relationship between IDE and `bv` (Beads Viewer)? | Replace, extend, wrap, or coexist? If the IDE replaces bv, all 9 metrics must be in the IDE. If it wraps bv, it is a shell. If they coexist, users need to understand when to use which. |
| 34 | Will users assume they can import from Jira, Linear, GitHub Issues, markdown PRDs? | If migration is expected, an import pipeline is table stakes for v1. If this is a greenfield-only tool, import can be deferred. Depends on the target adoption path. |
| 36 | Will users assume the formula builder works like Zapier/n8n? | If yes, a visual node-based builder is required. If no (and TOML editing is acceptable for the target user), a syntax-highlighted text editor suffices. Depends on the target user persona. |
| 39 | Will users expect notifications/feed of changes by other models/agents? | If multi-model convergence is in scope, a changelog is needed. If single-user, notifications are irrelevant. Depends on Q10 (single vs collaborative) and Q9 (multi-model validation). |
| 42 | Will users assume this replaces markdown completely, including review/approval? | If yes, review/approval workflows must be in the IDE. If no, users keep using PRs for approval and the IDE is authoring-only. Depends on the intended workflow boundary. |
| 44 | Single-page layout or multi-panel workspace like VS Code? | Multi-panel serves power users but overwhelms beginners. Single-page is simpler but limits context. Depends on Q1 (PM tool vs IDE identity) and the target user expertise level. |
| 45 | Force-directed, hierarchical, or user-positioned graph layout? | Force-directed is dynamic but unstable; hierarchical respects structure; manual gives control. Each shapes how users think. The choice reflects the product's stance on user control vs automation. |
| 48 | Should graph be the default landing view or a secondary panel? | Directly tied to Q14 (graph primary vs secondary). Landing view defines first impression and daily workflow. Depends on the identity decision. |
| 50 | Where does the formula builder live -- same workspace or separate mode? | Same workspace means power users can formula-author while viewing the graph. Separate mode means cleaner UI but more navigation. Depends on how central formula authoring is to the daily workflow. |
| 51 | How should dense graphs be simplified (clustering, collapsing, focus)? | Auto-cluster by epic, manual collapse, fisheye zoom, or focus mode (show N-hop neighborhood)? The approach reflects whether users think hierarchically or relationally. Product judgment call. |
| 52 | What established UI patterns should the IDE follow (VS Code, Figma, Linear, Notion)? | Each reference implies a different UX paradigm. VS Code = developer-centric panels. Figma = infinite canvas. Linear = minimalist list+detail. Notion = block-based documents. The choice cascades into every design decision. |
| 56 | How does a user create a Dolt branch for experimental work? | Should feel like Git branching but the naming, default behavior, and visibility need design. Auto-branch on experiment? Explicit "New Branch" button? Branch from context menu on a bead? Depends on how central branching is to the workflow. |
| 61 | How does a user compare two branches side-by-side? | Split view, tabbed comparison, overlay diff, or unified diff? Each has tradeoffs for graph data. Novel UX territory -- depends on what "comparison" means for a work graph (structural diff? content diff? both?). |
| 64 | What is the step-by-step flow for creating a bead graph from scratch? | Guided wizard vs blank canvas vs template-first. Depends on Q8 (direct authoring vs NL), Q20 (first experience), and the target user's comfort with graphs. |
| 65 | What is the step-by-step flow for instantiating a formula? | Select formula > bind variables > preview (cook) > confirm (pour). But the UI for variable binding could be form-based, inline, or wizard-style. Depends on Q36 (formula builder expectations). |
| 66 | What is the step-by-step flow for multi-model convergence? | Novel workflow with no established UX. Create branches per model > run models > compare outputs > select/merge best parts > distill to canonical. Each step needs UX invention. Depends on Q9 (whether this feature is validated). |
| 67 | What is the step-by-step flow for resolving a merge conflict? | Depends on Q17 (conflict resolution model). Per-bead, per-field, or whole-graph resolution? Three-way merge view or simple accept-left/accept-right? Novel design required. |
| 68 | What is the ideal first-run flow for someone migrating from markdown? | Import existing PRDs and convert? Side-by-side comparison of markdown vs beads? Guided walkthrough? Depends on Q34 (import expectations) and Q7 (whether markdown is the real problem). |
| 71 | What is the review/approval flow for proposed graph changes? | PR-style review, inline comments, approval gates, or trust-based merge? Depends on Q10 (single vs team), Q42 (replace approval rituals), and team governance norms. |
| 74 | What does "merge in progress" state look like? | Needs distinct merge mode UX. Depends on Q17 (conflict resolution model) and Q67 (merge flow). |
| 78 | What does multi-model convergence state look like (N branches compared)? | Split view for 2-5 branches simultaneously. Depends on Q9 (whether feature is validated) and Q66 (convergence flow). |
| 80 | What does the state look like when an agent is modifying beads in background? | Live indicator of agent activity. Depends on Q10 (single vs team), Q31 (runtime visibility), and whether agents run in the IDE or externally. |
| 81 | What is a "work graph" vs dependency graph, knowledge graph, project plan? | Requires a deliberate positioning statement. "Work graph" could mean any of these. The answer shapes how users explain the tool to others. Product messaging decision. |
| 82 | What does "branching" mean when both Git and Dolt branches exist? | Dual-layer version control creates ambiguity. The user-facing model must either unify them (one "branch" concept) or explicitly separate them (code branches vs work branches). Architecture + UX decision. |
| 83 | What is the difference between proto and poured bead -- should users see protos? | Proto beads are an implementation detail of cook/pour. Exposing them adds complexity; hiding them loses preview capability. The abstraction boundary is a design judgment call. |
| 85 | What does "phase" mean in formula context (liquid/vapor) vs compilation context (SCAN/ANALYZE/CONNECT/ENRICH)? | Two unrelated uses of "phase." Must either rename one, namespace them, or hide one from users. Terminology decision with product implications. |
| 87 | How does this compare to Linear, Jira, Shortcut -- what must we match or reject? | Explicit positioning against known tools. Which features are table stakes (must match) and which are deliberately omitted (reject)? Competitive strategy decision. |
| 88 | What can we learn from graph-first tools (Notion, Roam, Obsidian)? | Which interaction conventions to adopt. Product team should study specific prior art and choose. |
| 89 | How do DAG editors (Airflow, Prefect, n8n, Node-RED) handle visual workflow composition? | Formula builder design reference. Product team should choose which DAG editor model to follow. |
| 90 | What have GitHub Projects, Asana, Monday learned about graph view failure modes? | Evidence suggests graph views overwhelm past ~30 nodes. The target is 50-200 beads, which hits this limit immediately. Requires a deliberate strategy for managing scale that prior art suggests is very hard. |
| 91 | How do database branching tools (PlanetScale, Neon, Dolt) present branch/diff/merge? | Niche audience with no established conventions. Product team must decide how much to borrow vs invent. |
| 93 | What did markdown PRD workflows do well that users will miss? | Cannot be answered without user interviews. The strengths to preserve depend on specific team workflows. |
| 94 | How do teams currently handle competing model outputs? | Cannot be answered without user research. Convergence workflow design depends on understanding current practice. |

---

## Question Dependencies

**Q1 (PM tool vs code IDE identity)** unlocks:
- Q44 - single-page vs multi-panel follows directly from identity choice (PM = simpler layout, IDE = multi-panel)
- Q48 - graph as default landing follows from identity (IDE = graph primary, PM = list primary)
- Q52 - reference UI pattern follows from identity (PM = Linear/Notion, IDE = VS Code/Figma)
- Q14 - graph primary vs secondary is essentially the same question reframed

**Q6 (Primary daily job)** unlocks:
- Q20 - first experience design follows from what the user is trying to do
- Q64 - step-by-step graph creation flow depends on primary use case

**Q7 (Markdown is the problem vs translation is the problem)** unlocks:
- Q68 - migration flow depends on whether markdown is being replaced or augmented

**Q8 (Direct authoring vs NL-first)** unlocks:
- Q64 - graph creation flow is fundamentally different if NL-derived
- Q53 - first bead creation UX depends on authoring model (auto-answered if direct, but NL changes it)
- Q22 - vague-to-structured flow changes completely if AI does the structuring

**Q9 (Multi-model convergence validated?)** unlocks:
- Q19 - "canonical" definition is N/A if convergence is cut
- Q39 - notifications/feed is N/A if single-model
- Q66 - convergence flow is N/A if cut
- Q78 - convergence state UI is N/A if cut
- Q94 - competing model outputs is N/A if cut

**Q10 (Single operator vs team platform)** unlocks:
- Q33 - real-time collab is N/A if single-user (already auto-answered as "not phase 1," but depends on this)
- Q39 - notifications are N/A if single-user
- Q71 - review/approval flow is N/A if single-user
- Q79 - read-only branch state is N/A if single-user (auto-answered for the general case, but scope changes)
- Q80 - agent background state depends on whether agents are other "users"

**Q14 (Graph primary vs secondary)** unlocks:
- Q44 - layout follows from this
- Q45 - graph layout algorithm matters more if graph is primary
- Q48 - landing view is essentially the same question

**Q17 (Merge conflict UX model)** unlocks:
- Q67 - merge conflict resolution flow depends on the model chosen
- Q74 - merge-in-progress state depends on the flow

**Q27 (IDE's unique value over CLI)** unlocks:
- Q32 - bv relationship depends on whether the IDE subsumes visualization

**Q28 (Authoring tool vs review tool)** unlocks:
- Q8 - if review tool, then graph-to-human is primary, and NL authoring is secondary
- Q31 - if review tool, runtime visibility is more important

**Q30 (Phase one scope)** unlocks:
- Q31 - runtime visibility is in or out of phase one
- Q34 - import is in or out of phase one
- Q50 - formula builder is in or out of phase one
- Q66 - convergence workflow is in or out of phase one

**Q36 (Formula builder expectations: visual vs text)** unlocks:
- Q50 - formula builder placement depends on its complexity
- Q65 - formula instantiation flow depends on the builder model

**Q82 (Git branch vs Dolt branch mental model)** unlocks:
- Q56 - branch creation UX depends on how branching is presented
- Q76 - divergence state depends on which "branch" is being tracked (auto-answered for the general case)

---

## Interview Plan

**Round 1: Core Identity & Vision** (~8 questions)

These root questions unlock the most downstream decisions. Answer these first.

1. **Q10** - Single operator or team platform?
   - Unlocks: Q33, Q39, Q71, Q79, Q80
2. **Q1** - PM tool or code IDE feel?
   - Unlocks: Q14, Q44, Q48, Q52
3. **Q6** - Primary daily job: planning, tracking, or analyzing?
   - Unlocks: Q20, Q64
4. **Q8** - Direct graph authoring or NL-first with derived graphs?
   - Unlocks: Q53, Q64, Q22
5. **Q28** - Core pain: humans cannot author graphs, or AI graphs need human review?
   - Unlocks: Q8 confirmation, Q31
6. **Q27** - IDE's unique value over CLI (discoverability, visualization, speed, or what)?
   - Unlocks: Q32
7. **Q9** - Is multi-model convergence validated as a user need?
   - Unlocks: Q19, Q39, Q66, Q78, Q94
8. **Q30** - What is explicitly out of scope in phase one?
   - Unlocks: Q31, Q34, Q50, Q66

**Round 2: Cascaded Confirmations** (~15 questions)

Based on Round 1 answers, confirm the inferred positions or clarify where inference is ambiguous.

9. **Q14/Q48** - Graph primary or secondary? (Confirm based on Q1 answer)
10. **Q7** - Is markdown the problem or is lossy translation the problem?
11. **Q31** - Runtime visibility in IDE? (Confirm based on Q28, Q30)
12. **Q32** - IDE replaces, extends, or wraps bv? (Confirm based on Q27)
13. **Q17** - Merge conflict resolution model? (Novel UX -- needs human design input regardless)
14. **Q19** - Who decides "canonical"? (Only if Q9 confirms convergence)
15. **Q82** - How to present Git vs Dolt branches to users?
16. **Q36** - Formula builder: visual (Zapier-like) or text (TOML editor)?
17. **Q34** - Import from Jira/Linear/markdown expected in v1?
18. **Q42** - Does IDE replace approval rituals or just authoring?
19. **Q52** - Which reference UI to follow? (Confirm based on Q1)
20. **Q87** - What must match or explicitly reject vs Linear/Jira?
21. **Q81** - How to position "work graph" vs familiar concepts?
22. **Q83** - Should users see proto beads or is that hidden?
23. **Q85** - How to disambiguate "phase" (liquid/vapor vs SCAN/ANALYZE)?

**Round 3: Design Branch Points** (~12 questions)

Remaining independent questions that require human judgment.

24. **Q2** - What is a "bead" to the user?
25. **Q3** - What is a "molecule" to the user?
26. **Q4** - What is a "formula" to the user?
27. **Q20** - First 5-10 minute experience design
28. **Q44** - Single-page vs multi-panel layout (confirm Q1)
29. **Q45** - Graph layout algorithm: force-directed, hierarchical, or manual?
30. **Q50** - Formula builder: same workspace or separate mode?
31. **Q51** - Dense graph simplification strategy
32. **Q56** - Branch creation UX
33. **Q61** - Branch comparison UX (side-by-side, tabbed, overlay)
34. **Q68** - Migration first-run flow
35. **Q71** - Review/approval workflow design

**Round 4: Flow Design** (~8 questions)

Detailed user flows that depend on earlier decisions.

36. **Q64** - End-to-end graph creation flow
37. **Q65** - Formula instantiation flow
38. **Q66** - Multi-model convergence flow (if in scope)
39. **Q67** - Merge conflict resolution flow
40. **Q74** - Merge-in-progress state
41. **Q78** - Multi-model comparison state (if in scope)
42. **Q80** - Agent background activity state
43. **Q90** - Graph view failure mode strategy at 50-200 nodes

---

**Estimated dialogue:** ~43 questions for human, ~51 auto-noted
**Expected interview time:** ~60-90 minutes across 4 rounds
**Cascading savings:** Round 1 answers (8 questions) will likely auto-resolve 5-10 additional questions from later rounds, reducing actual human questions to ~33-38.
