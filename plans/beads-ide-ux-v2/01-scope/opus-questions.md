# Opus 4.6 Analysis: beads-ide-ux-v2

## User Advocate Perspective

### Feature Brief Summary

Comprehensive UI/UX improvements for beads-ide covering five areas: (1) expansion group visualization, (2) accessibility improvements, (3) visual polish, (4) UX flow improvements, and (5) a step editor panel for inline editing.

---

### 1. User Expectations

1. **Will expansion group containers behave like folders I can collapse and expand?** Users coming from any node-based editor (Figma, Unreal Blueprints, Blender geometry nodes) will expect container groups to be collapsible -- if they cannot collapse them, the visualization becomes cluttered at scale and the grouping feels cosmetic rather than functional.

2. **Can I drag steps between expansion groups?** Users will assume that if groups are visually distinct containers, they can reorganize steps by dragging them across groups -- if this is not possible, the visual metaphor overpromises.

3. **Will cross-group edge highlighting be toggleable?** Amber dashed animated edges sound visually loud; users who work with formulas that have many cross-group dependencies will want to turn this off once they have understood the structure, or filter to edges involving a specific step.

4. **Does the step editor panel update the TOML in real time?** Users expect inline edits to be reflected immediately in the text editor -- any lag or requirement to manually sync will feel broken.

5. **Will keyboard shortcuts match conventions I already know?** Users who spend time in VS Code, JetBrains, or similar IDEs will expect Cmd+S to save, Cmd+Z to undo, Cmd+Shift+P for command palette, and Escape to close panels. Deviating from these without documentation will cause frustration.

6. **Does "unsaved changes" mean my work is at risk of being lost?** Users will assume the app auto-saves (like Google Docs or Notion) unless clearly told otherwise -- an unsaved changes warning that appears for the first time when they try to navigate away will create anxiety about all previous sessions.

7. **Will formula search/filter work like a search bar I am used to?** Users expect fuzzy matching, instant results as they type, and the ability to search by step name, description, or tag -- a strict exact-match search will feel primitive.

8. **Will the loading states give me an estimated time or just a spinner?** Users tolerate waiting when they know how long it will take; an indefinite spinner with no progress feedback for operations longer than 2-3 seconds feels like the app might be frozen.

9. **Will reduced motion support disable only decorative animations or also meaningful transitions?** Users who enable reduced motion still want to understand state changes -- they expect the app to replace animations with instant transitions, not remove visual feedback entirely.

10. **Will accessibility improvements be visible to me or only to screen reader users?** Many accessibility features (proper labels, semantic structure) also improve the experience for power users who navigate by keyboard, use browser extensions, or work on low-end hardware -- users expect these improvements to feel snappier overall, not just be invisible ARIA attributes.

11. **Does the step editor panel replace clicking into the text editor, or is it an additional way to edit?** Users need to know whether this is the primary editing surface in visual mode or a convenience layer -- ambiguity here leads to confusion about which edit "wins" if both are open.

12. **Will the "better contrast" changes affect my ability to distinguish between different step types at a glance?** Users who have built spatial memory around the current color scheme will be disoriented if colors change significantly without a transition period or theme option.

13. **Can I use the keyboard shortcuts panel as a reference while working, or does it block the workspace?** Users expect a shortcuts overlay to be dismissable but also pinnable (like a cheat sheet) -- forcing them to close it before continuing work defeats the purpose.

### 2. User Journey

1. **What is the user's primary goal when they open Beads IDE -- are they authoring a new formula, debugging an existing one, or reviewing someone else's work?** Each of these goals demands different UX priorities (e.g., authoring favors quick editing, debugging favors visualization, reviewing favors read-only clarity), and the improvements should serve the most common case first.

2. **How often does a user switch between text mode and visual mode in a single session?** If switching is frequent, any friction in the transition (re-rendering, losing scroll position, resetting selection) will compound into significant frustration.

3. **What is the user's emotional state when they encounter an unsaved changes warning?** They are almost certainly trying to leave -- either to check results, switch formulas, or respond to something urgent. The warning must be fast, clear, and never feel like a trap.

4. **What happens right before a user opens the step editor panel?** They have likely clicked a node in the visual builder -- the transition from "exploring the graph" to "editing a specific step" should feel like zooming in, not like opening a separate application.

5. **What happens after a user edits a step in the step editor panel?** They probably want to see the effect on the graph immediately -- if dependencies changed, the layout should update. If nothing visually changes, they may wonder if the edit took effect.

6. **How does a user discover keyboard shortcuts exist?** If the only way to find them is through a menu item, most users will never know. A subtle onboarding hint or tooltip on first use matters.

7. **What is the user doing when they encounter a loading state?** They just triggered an action (pour, sling, cook preview) and are waiting for feedback -- their attention is highest in the first 500ms, and if nothing acknowledges their action, they may click again.

8. **How does a user recover from accidentally closing the step editor panel mid-edit?** If their changes are lost, the panel becomes a source of anxiety rather than convenience. If changes persist, they need a way to discard them intentionally.

9. **Does the user understand what "expansion groups" are, or is this internal jargon?** The feature should be named and presented in terms users understand (e.g., "step groups," "execution phases," "sub-workflows") -- domain-specific terminology without explanation creates a learning cliff.

10. **What is the user's workflow when they need to find a specific formula among many?** If they have 5 formulas, scrolling is fine. If they have 50, they need search. If they have 500, they need search plus categorization plus recent/favorites. The filter feature must be designed for the upper end of realistic usage.

11. **When a user sees cross-group edges highlighted, what action do they take next?** Highlighting is informational, but users need to do something with that information -- click the edge to navigate to the connected step, understand why the dependency exists, or resolve a problem. If the highlight does not lead to an action, it is visual noise.

12. **How does a user's experience degrade on a slow network or offline?** The brief mentions loading states but does not mention offline resilience -- users working in poor network conditions (common in field engineering or remote work) will blame the app for network problems if there is no offline indicator or graceful degradation.

### 3. Edge Cases (User Behavior)

1. **What happens if a user edits the same step simultaneously in the text editor and the step editor panel?** Conflict resolution between two editing surfaces for the same data is notoriously difficult -- the app must have a clear policy (last write wins, lock one while the other is active, or live sync).

2. **What happens if a user creates a circular dependency using the step editor panel's dependency selector?** The NeedsSelector allows multi-select dependency editing -- if a user selects a dependency that creates a cycle, the error must be caught immediately with a clear explanation, not after they try to cook the formula.

3. **What happens if a user triggers "pour" or "sling" while they have unsaved changes?** The unsaved changes warning should not only apply to navigation -- executing a formula with stale saved state while the editor shows different content will produce confusing results.

4. **What happens if a user rapidly switches between formulas without saving?** Each switch could trigger an unsaved changes warning. If the user is exploring multiple formulas to compare them, repeated warnings become hostile. There should be a "discard and switch" fast path.

5. **What happens if a user resizes their browser window to a very small size while expansion groups are visible?** Container nodes with many children could overflow, overlap, or become unreadable. The layout algorithm needs a minimum size or scrolling behavior for groups.

6. **What happens if a user opens the keyboard shortcuts panel and then tries to use a keyboard shortcut?** The panel might intercept the keypress. The shortcuts panel should be read-only and not capture keyboard input that the user intends for the editor.

7. **What happens if a user pastes invalid TOML into the text editor while the step editor panel is open?** The step editor panel's state could become stale or inconsistent with the text. Parse errors should be surfaced clearly, and the panel should indicate it cannot reflect the current (broken) state.

8. **What happens if a user changes the priority of a step to a value outside 0-10 by editing the TOML directly?** The step editor panel shows priority as 0-10 -- if the raw TOML allows other values, the panel must handle this gracefully (clamp, warn, or display the actual value).

9. **What happens if a user with a screen reader navigates the visual builder graph?** ReactFlow is inherently visual and mouse-driven -- the accessibility improvements must address how non-sighted users understand and interact with the DAG, not just add ARIA labels to nodes.

10. **What happens if a user tries to undo changes made in the step editor panel using Cmd+Z?** If undo only works in the text editor, the step editor panel feels disconnected. If undo works in the panel but not in the text editor at the same time, the user faces split undo histories.

11. **What happens if a user applies formula search/filter and then tries to create a new formula?** The filter context should not affect creation -- but users might expect the new formula to appear in the filtered list, which it will not if it does not match the filter.

12. **What happens if a user is editing a step and another user (or background process) modifies the same formula file on disk?** File-level conflicts are especially dangerous in IDE-like tools. The app should detect external changes and offer to reload or merge.

13. **What happens if a user navigates away from the formula editor using the browser's back button instead of the app's navigation?** The unsaved changes warning must intercept browser navigation, not just in-app route changes. This requires `beforeunload` handling, which is famously unreliable on mobile browsers.

14. **What happens if a user has many expansion groups (10+) in a single formula?** Six colors are defined (indigo, emerald, amber, red, purple, sky) -- what happens when groups exceed the color palette? Color recycling could make groups indistinguishable.

15. **What happens if a user tries to use the step editor panel on a read-only formula or one they do not have permission to edit?** The panel should either not appear or clearly indicate it is in read-only mode -- allowing edits that silently fail would be deeply confusing.

### 4. Accessibility & Inclusion

1. **Who uses this app with a screen reader, and have they been consulted?** Adding ARIA labels and semantic structure is necessary but not sufficient -- actual screen reader users often have workflows that differ dramatically from what sighted developers assume. Without user testing, accessibility improvements risk being technically compliant but practically unusable.

2. **What about users with low vision who do not use screen readers but need high contrast?** The brief mentions "better contrast" but does not mention a high-contrast mode or respecting OS-level contrast preferences (`prefers-contrast`). These users fall between sighted and screen reader users and are often overlooked.

3. **What about users with motor impairments who rely on keyboard-only navigation?** The brief mentions keyboard shortcuts and skip navigation, but does not address tab order, focus trapping in modals, or the ability to interact with the ReactFlow graph without a mouse. Graph interaction is the core feature and must be keyboard-accessible.

4. **What about users with cognitive disabilities who need simpler interfaces?** The app has a 3-panel layout, multiple editing modes, expansion groups, and cross-group edge highlighting. For users with attention or processing difficulties, this is overwhelming. Is there a simplified view or progressive disclosure strategy?

5. **What about colorblind users viewing expansion group colors?** Six group colors (indigo, emerald, amber, red, purple, sky) are not all distinguishable under protanopia, deuteranopia, or tritanopia. Groups need a secondary visual differentiator (pattern, icon, or label) beyond color.

6. **What about users on mobile devices or tablets?** The 3-panel resizable layout will not work on small screens. If mobile is not supported, is there a clear message? If it is partially supported, which features degrade gracefully?

7. **What about users whose primary language is not English?** All UI text, labels, error messages, and keyboard shortcut descriptions need to be internationalizable -- even if localization is not happening now, hardcoded English strings make future localization expensive.

8. **What about users with photosensitive conditions viewing animated cross-group edges?** Dashed animated edges could trigger discomfort in users with vestibular disorders or photosensitivity. The `prefers-reduced-motion` support must specifically address these animations.

9. **What about users on low-powered devices or slow connections?** ReactFlow with many nodes, animated edges, and container groups is computationally expensive. Users on older hardware or Chromebooks may experience jank that makes the tool unusable. Are there performance budgets?

10. **What about neurodiverse users who rely on consistent spatial layout?** If the graph layout algorithm repositions nodes when dependencies change, users who have built spatial memory of a formula's structure will lose their mental model. Layout stability matters.

11. **What about users who zoom their browser to 200% or more?** WCAG requires content to be usable at 200% zoom. The 3-panel layout, step editor panel, and graph visualization all need to work at high zoom levels without content being clipped or overlapping.

12. **Are we assuming all users understand DAG (directed acyclic graph) visualization?** The visual builder is a core feature, but not all users have experience reading node-and-edge diagrams. Is there alternative way to understand the formula structure for users who find graph visualization confusing?

13. **What about users who work with the app for extended periods (4+ hours)?** Dark theme with blue-heavy primary colors can cause eye strain. Are there options for warmer color temperatures or a light theme for daytime use?

14. **What about users who rely on browser autofill or password managers for form fields?** If form labels are not properly associated with inputs, autofill and password managers will not work correctly. The `<label htmlFor>` fix addresses this, but the implementation must be verified with actual autofill tools.

### Summary of Critical Concerns

The most important user-facing risks in this feature brief are:

1. **Dual editing surfaces (text editor + step editor panel) without clear conflict resolution.** This is the most likely source of data loss and user confusion. Every edit path must produce consistent results.

2. **Accessibility improvements that are technically correct but untested with real assistive technology users.** Compliance is not the same as usability. The graph visualization in particular needs a fundamentally different interaction model for non-sighted users.

3. **Visual complexity creep.** Each individual improvement (group containers, animated edges, loading states, contrast fixes) is reasonable in isolation, but together they risk making the interface noisier rather than clearer. There should be a visual complexity budget.

4. **Unsaved changes warnings that frustrate rather than protect.** The warning system must account for rapid switching, browser navigation, execution triggers, and external file changes -- not just simple "navigate away" scenarios.

5. **Color-only differentiation in expansion groups.** Six colors are insufficient for larger formulas and are not accessible to colorblind users. A secondary visual channel (shape, pattern, label) is essential.

---

## Product Designer Perspective

### Perspective: UX Designer Creating Wireframes

This analysis examines the proposed comprehensive UI/UX improvements for Beads IDE across five feature areas: (1) Expansion group visualization, (2) Accessibility improvements, (3) Visual polish, (4) UX flow improvements, and (5) Step editor panel. Each question below is framed from a design perspective -- what should this look and feel like, and how will users interact with it.

---

### 1. Information Architecture

**Q1.1: What is the visual hierarchy within an expansion group container node?**
Users need to immediately distinguish group metadata (title, step count) from the individual steps inside -- if the hierarchy is unclear, users will waste time parsing the layout instead of understanding their formula's structure.

**Q1.2: When a user views a complex formula with multiple overlapping expansion groups, how do we prevent the canvas from becoming visually overwhelming?**
Information overload in graph views leads to cognitive fatigue and missed dependencies; we need a clear strategy for progressive disclosure as complexity grows.

**Q1.3: Should cross-group edges be visible at all zoom levels, or only surface when the user zooms in or hovers?**
Cross-group edges are a secondary concern most of the time, but critical when debugging dependency chains -- showing them always could add clutter while hiding them could cause users to miss important connections.

**Q1.4: In the step editor panel, what is the priority ranking of fields -- which should be immediately visible vs. tucked into an expandable section?**
ID, Title, and Dependencies are likely high-frequency editing targets, while Description and Priority may be secondary -- getting this wrong means users scroll past noise to reach what they need.

**Q1.5: How should the sidebar communicate which formulas have unsaved changes?**
Users navigating between multiple formulas need persistent, at-a-glance awareness of pending work to avoid accidentally losing edits.

**Q1.6: Where in the information hierarchy does the keyboard shortcuts panel sit -- is it a discoverable overlay, a dedicated settings section, or a tooltip system?**
If shortcuts are buried in settings, power users won't discover them; if they're too prominent, they'll distract from the editing workflow.

**Q1.7: For formula search/filter, should results show formula names only, or include metadata like step count, last modified date, and tags?**
Richer search results help users distinguish between similarly named formulas, but too much metadata in the results list creates clutter and slows scanning.

**Q1.8: When the results graph view shows clustered beads, how should the cluster summary communicate its contents without requiring expansion?**
Users need a quick mental model of what a cluster contains (count, status distribution, key bead names) before deciding to drill in.

**Q1.9: How should the loading state skeleton reflect the actual layout the user is about to see?**
A loading skeleton that mirrors the real layout reduces perceived wait time and prevents jarring layout shifts when content appears.

**Q1.10: What information should the skip navigation link expose -- just "Skip to main content" or a richer set of landmark targets (sidebar, editor, preview, step panel)?**
A single skip link is the minimum accessibility requirement, but offering multiple landmark targets dramatically improves navigation for screen reader users in a multi-panel IDE layout.

**Q1.11: In visual mode, should expansion group metadata (description, expansion type, variable bindings) be visible in the group header or only accessible via interaction?**
Showing too much metadata in the header crowds the graph canvas, but hiding it forces users to click into each group to understand its purpose.

**Q1.12: How should the command palette (Cmd+K) surface recently used formulas vs. all available formulas?**
Recency-weighted results reduce friction for power users working on a small set of formulas, but must not hide the full catalog from users who need to explore.

**Q1.13: When the step editor panel is open, should the visual builder canvas resize or should the panel overlay it?**
Resizing preserves context but reduces canvas space; overlaying preserves canvas size but hides part of the graph -- this tradeoff directly impacts the editing experience.

**Q1.14: What persistent status indicators should be visible in the app shell header -- connection status, formula validation state, last save time?**
Users working in a local-first tool with remote sling capability need confidence that their environment is healthy without interrupting their workflow.

### 2. Interaction Design

**Q2.1: How does the user create, resize, and rearrange expansion groups in visual mode -- drag to create, right-click context menu, or toolbar action?**
The creation gesture sets the baseline for how intuitive the grouping feature feels; a drag-to-select-and-group pattern is natural but may conflict with canvas panning.

**Q2.2: When a user clicks a cross-group edge, what happens -- does it highlight both connected groups, show a tooltip with dependency details, or navigate to the dependency?**
Cross-group edges represent important structural decisions; the interaction on click determines whether users can quickly understand and debug inter-group dependencies.

**Q2.3: How does the unsaved changes warning present itself -- a blocking modal, an inline banner, a toast notification, or a browser beforeunload prompt?**
A blocking modal is safest but most disruptive; a toast might be dismissed too easily -- the severity of data loss risk should match the interruption level.

**Q2.4: What gesture triggers inline step editing in visual mode -- single click, double click, or a dedicated edit button on the node?**
Single click is fastest but may conflict with node selection; double click is a common "edit" convention but less discoverable -- this choice affects the entire node interaction model.

**Q2.5: How does the user dismiss the step editor panel -- explicit close button, clicking away, pressing Escape, or does it auto-close when clicking another node?**
Each approach has different implications for accidental data loss and workflow speed; the dismiss behavior needs to be consistent with how users expect panels to behave in IDE-like tools.

**Q2.6: How does the formula search/filter handle progressive typing -- instant filter, debounced search, or explicit submit?**
Instant filtering feels responsive but may cause performance issues with large formula sets; debounced search balances responsiveness with efficiency.

**Q2.7: What feedback does the user receive when they successfully save a step edit -- a toast, a subtle flash on the node, a checkmark animation, or just the panel closing?**
Save confirmation needs to be noticeable enough to build trust but not so prominent that it interrupts flow during rapid editing sessions.

**Q2.8: How does reduced motion preference affect the animated cross-group edges -- do they become static dashed lines, solid lines with a distinct color, or something else?**
Animated edges are a key visual signal for cross-group connections; the reduced-motion alternative must preserve the same informational value without motion.

**Q2.9: When a user triggers a keyboard shortcut, should there be a brief visual indicator of what action was performed?**
Keyboard shortcuts are invisible by nature; a brief, unobtrusive indicator (like VS Code's command echo) confirms the action happened and helps users learn the mapping.

**Q2.10: How does the user navigate between steps using only the keyboard in visual mode?**
Tab order through a DAG is non-obvious -- users need a predictable traversal pattern (e.g., topological order, left-to-right) and clear focus indicators on each node.

**Q2.11: What happens when a user tries to add a circular dependency in the NeedsSelector -- is the invalid option disabled, shown with an error state, or simply missing from the list?**
Preventing impossible states is better than error recovery; disabling with an explanation is more educational than silently omitting options.

**Q2.12: How does the user invoke the keyboard shortcuts panel -- a menu item, a dedicated shortcut (e.g., Cmd+/), a help icon, or all three?**
Multiple entry points ensure discoverability for different user types; relying on only one path means some users will never find it.

**Q2.13: When editing a step's dependencies in the NeedsSelector, how does the user understand which steps are available and what each one does?**
A flat list of step IDs is insufficient for complex formulas; showing step titles, descriptions, or even a mini-preview helps users make informed selections.

**Q2.14: How should the "Pour" and "Sling" actions communicate progress -- a progress bar, a spinner, a log stream, or a combination?**
These are potentially long-running operations; the feedback mechanism must convey both "something is happening" and "how far along it is" to prevent user anxiety and repeated clicks.

**Q2.15: When the user applies a filter in formula search, how do they clear it -- a clear button, backspace in the search field, or an Escape key press?**
Each clear mechanism serves a different user workflow; supporting all three ensures no one is frustrated by the filter persisting when they want to reset.

### 3. User Flows

**Q3.1: What is the happy path for a user creating a new expansion group from scratch in visual mode?**
Defining the step-by-step flow from "I want to group these steps" to "the group is visible and correctly configured" ensures we design all intermediate states and transitions.

**Q3.2: What happens when a user opens a formula with malformed TOML -- do they land in text mode with error highlighting, or do they see a dedicated error state?**
Error recovery is a frequent real-world scenario; the flow from "something is wrong" to "I fixed it" needs to be smooth and not block the user from editing.

**Q3.3: When a user has unsaved changes and tries to navigate away, what is the full flow -- warning, options (save/discard/cancel), and what happens for each choice?**
This is one of the most common frustration points in any editor; the flow needs to handle all three user intents (save and go, discard and go, stay) with minimal friction.

**Q3.4: What is the flow for a first-time user discovering keyboard shortcuts organically?**
If shortcuts are not surfaced during natural use (e.g., via tooltips on hover, context menu hints), most users will never discover them and the feature investment is wasted.

**Q3.5: What happens when the user is on a slow connection and loads a large formula -- what do they see at each stage of loading?**
Without designed loading states, users see blank panels or layout jumps; the loading flow should progressively reveal content in a predictable order (shell, then sidebar, then editor content).

**Q3.6: What is the flow for a user who wants to edit a step's properties in visual mode using only the keyboard?**
This flow tests the intersection of accessibility and the step editor panel feature; if any step requires a mouse, the feature is not truly accessible.

**Q3.7: What happens when the visual builder has zero steps (empty formula) -- what does the canvas show?**
Empty states are the first thing a new user sees; a blank canvas with no guidance is a dead end, while a helpful prompt ("Add your first step") creates a clear starting point.

**Q3.8: What is the flow when a user searches for a formula that does not exist?**
The empty search results state should either guide the user to broaden their search or offer to create a new formula, rather than just showing "No results."

**Q3.9: When a user has many expansion groups and the graph becomes deeply nested, how do they navigate back to the top-level overview?**
Zoom-to-fit, breadcrumbs, or a minimap are all possible navigation aids; without one, users get lost in large graphs.

**Q3.10: What is the error recovery flow when a step edit fails to save (e.g., TOML serialization error)?**
The user needs to know what went wrong, where the error is, and how to fix it -- without losing the edit they just attempted.

**Q3.11: What happens when the user switches from visual mode to text mode while the step editor panel is open?**
Mode switching with open editing contexts creates potential for confusion and data loss; the transition needs explicit handling.

**Q3.12: What is the flow for a user who wants to compare two formulas side by side?**
Even if not in scope for v2, understanding this desire helps ensure the layout architecture does not preclude it in the future.

**Q3.13: When a user triggers "Sling" (remote execution), what is the feedback flow from initiation through to completion -- especially if they navigate away and come back?**
Long-running remote operations need persistent status tracking that survives navigation; otherwise users will re-trigger or lose track of execution status.

### 4. Visual & Layout

**Q4.1: Where does the step editor panel physically appear in the 3-panel layout -- as a sub-panel within the main editor area, within the detail panel on the right, or as a floating overlay?**
The panel's location determines whether it competes with the visual builder canvas for space and how it relates to the existing detail/variables panel.

**Q4.2: Should expansion group containers use a solid background fill, a subtle border, or a combination -- and how do overlapping groups resolve visually?**
The visual treatment of group containers must clearly delineate membership without obscuring the nodes inside or creating visual noise when groups are adjacent.

**Q4.3: What is the color strategy for expansion groups when there are more groups than the 6-color palette supports?**
Formulas with more than 6 expansion groups will hit the color limit; the design needs a graceful fallback (cycling with pattern variation, user-assigned colors, or luminance shifts).

**Q4.4: How should the skip navigation link be styled -- visible on focus only (standard pattern), always visible, or a toggle in accessibility settings?**
Visible-on-focus is the established convention and avoids layout disruption for mouse users while remaining available to keyboard users.

**Q4.5: What contrast ratio targets should secondary text meet -- WCAG AA (4.5:1) or AAA (7:1)?**
The current secondary text colors (#9ca3af, #6b7280) on dark backgrounds likely fall below AA; choosing a target determines how much the palette needs to shift.

**Q4.6: How should the keyboard shortcuts panel be laid out -- categorized by context (editor, graph, navigation), alphabetical, or by frequency of use?**
Categorization by context matches how users think about shortcuts (what am I doing right now?), while frequency-based ordering serves power users who want to learn the most impactful shortcuts first.

**Q4.7: Should loading skeletons pulse/shimmer or be static gray blocks?**
Pulsing skeletons communicate "loading in progress" more clearly than static blocks, but must respect prefers-reduced-motion by becoming static for users who request it.

**Q4.8: Where does the formula search/filter input live -- at the top of the sidebar, in the command palette, or both?**
Sidebar placement is persistent and visible; command palette placement is powerful but transient -- the choice affects whether search feels like a primary or secondary workflow.

**Q4.9: How does the visual builder canvas handle the layout shift when expansion group containers are toggled on/off?**
Abrupt re-layouts are disorienting; an animated transition or a "fit to view" after toggle helps users maintain spatial orientation.

**Q4.10: What visual treatment distinguishes an active/selected node from a hovered node from a focused (keyboard) node?**
Three distinct visual states are needed to avoid ambiguity; using only color risks failing accessibility requirements -- consider ring style, shadow, scale, or border changes.

**Q4.11: Should the unsaved changes indicator be a dot on the tab/sidebar item, a modified title (e.g., prepending a bullet), or a persistent banner in the editor?**
Each approach has different visibility and intrusiveness; the indicator must be noticeable without being alarming, since unsaved changes are a normal working state.

**Q4.12: How should toast notifications from Sonner be positioned -- top-right (standard), bottom-right (less intrusive), or bottom-center (centered attention)?**
Toast position interacts with the 3-panel layout; top-right may overlap with the detail panel, while bottom-center may overlap with the editor content.

**Q4.13: What is the visual treatment for the step editor panel's dependency list -- tags/chips, a vertical list with checkboxes, or a draggable ordered list?**
Tags/chips are compact and familiar from multi-select patterns; a vertical list with checkboxes scales better for many dependencies; draggable lists add ordering capability but complexity.

**Q4.14: How should the expansion group header visually connect to its contained nodes -- does it look like a card wrapping them, a labeled region, or a background zone?**
The container metaphor affects whether users perceive the group as a "folder" (openable/closable) or a "region" (always visible), which drives expectations about interaction.

### 5. States & Transitions

**Q5.1: What are the states of the step editor panel -- closed, loading, editing, saving, save-success, save-error -- and what does each state look like?**
Each state needs a distinct visual treatment; missing a state (e.g., no saving indicator) creates uncertainty about whether the save actually happened.

**Q5.2: How does the expansion group container animate when steps are added to or removed from the group?**
Adding a step should feel like the container naturally grows to accommodate it; removing should feel like it gracefully shrinks -- abrupt resizing breaks the spatial model.

**Q5.3: What is the transition between text mode and visual mode -- an instant swap, a crossfade, or a slide animation?**
The transition communicates the relationship between the two views; a harsh swap suggests two separate tools, while a smooth transition suggests two views of the same data.

**Q5.4: When the sidebar collapses to the icon rail, how do unsaved change indicators persist -- tooltip on hover, a dot on the icon, or a badge count?**
The collapsed sidebar has minimal space; the indicator must be visible at icon-rail size to prevent users from forgetting about unsaved work.

**Q5.5: What happens visually when a cross-group edge is highlighted -- does the rest of the graph dim, do the connected groups glow, or does the edge simply become more prominent?**
Highlighting context determines how much the user's attention is directed; dimming the rest is strongest but most disruptive, while subtle edge emphasis is gentler but may be missed.

**Q5.6: How does the formula search/filter animate between no-results and results-found states?**
An empty-to-populated transition should feel responsive; a populated-to-empty transition should be gentle (not alarming) and offer guidance.

**Q5.7: What is the loading state for the step editor panel when it opens for a step with complex dependency data?**
If the panel opens instantly but dependencies take time to resolve, the user might start editing before all data is loaded -- a brief loading state prevents premature interaction.

**Q5.8: How does the system recover from a failed formula save -- does it retry automatically, offer a retry button, or keep the editor in a dirty state with a persistent warning?**
Auto-retry is convenient but may mask persistent issues; a retry button with clear error messaging gives the user control and understanding.

**Q5.9: What is the transition when a user drags a step from one expansion group to another?**
This interaction involves removing from one container, animating across the canvas, and inserting into another -- the transition must feel physical and intentional, not teleportation-like.

**Q5.10: How does the graph view handle the transition from a small formula (5 steps) to a large formula (50+ steps) in terms of automatic zoom and layout?**
A fit-to-view that works well for 5 nodes may make 50 nodes illegibly small; the system needs a strategy for when auto-zoom should stop and scrolling/panning should take over.

**Q5.11: What visual state does a node enter when it is being edited in the step editor panel?**
The node should have a distinct "currently editing" appearance (e.g., highlighted border, subtle glow) so users maintain spatial awareness of which node they're modifying.

**Q5.12: How should the app handle loss of focus or backgrounding during a long-running "Pour" or "Sling" operation?**
If the user switches tabs or minimizes, the operation continues but feedback stops being visible -- the app should surface completion status when the user returns (e.g., a persistent notification or changed UI state).

**Q5.13: What is the visual state of a disabled form field vs. a read-only field vs. an editable field in the step editor panel?**
The step ID is read-only and other fields are editable; the visual distinction must be immediately clear so users do not waste time trying to edit non-editable fields or miss editable ones.

**Q5.14: How does the system transition when a user toggles prefers-reduced-motion at the OS level while the app is open?**
The app should respond to the media query change in real time; animations should gracefully cease without causing layout jumps or visual artifacts.

**Q5.15: What happens to the expansion group visualization when the user zooms out far enough that individual nodes are no longer legible?**
At extreme zoom-out levels, nodes should collapse into summary representations (dots, counts, status colors) while group containers remain visible -- this is a semantic zoom strategy.

### Summary of Key Design Tensions

1. **Density vs. Clarity**: The 3-panel IDE layout is already space-constrained; adding a step editor panel, expansion group containers, and filter UI requires careful spatial budgeting.

2. **Discoverability vs. Clean UI**: Keyboard shortcuts, skip navigation, and advanced features need to be findable without cluttering the interface for everyday use.

3. **Animation vs. Accessibility**: Animated edges, transitions, and loading states add polish but must have complete reduced-motion alternatives that preserve informational value.

4. **Progressive Disclosure vs. Context**: Expansion groups, cross-group edges, and step metadata all benefit from progressive disclosure, but hiding too much forces users into extra clicks to understand their formula's structure.

5. **Consistency vs. Context-Specificity**: The same interaction patterns (click, double-click, hover) may need to mean different things in text mode vs. visual mode vs. results view -- the design must make these differences learnable.

---

## Domain Expert Perspective

### Feature Brief Summary

Comprehensive UI/UX improvements for beads-ide covering: (1) expansion group visualization with container nodes and cross-group edge highlighting, (2) accessibility improvements, (3) visual polish, (4) UX flow improvements, and (5) step editor panel for inline editing. The spec additionally proposes a nested outline view to replace or supplement the current ReactFlow DAG.

---

### Domain Concepts

#### What terminology is assumed but not defined?

1. **What exactly is a "bead" in the mental model of the target user -- a task, a unit of work, a node in a dependency graph, or something else?** The entire product is named around beads but the brief never defines this core metaphor, and users need a shared mental model to make sense of the UI.

2. **What is the precise distinction between "pour" (local) and "sling" (remote) -- are these deployment modes, execution strategies, or something else entirely?** These terms appear in the UX flows but their implications for what the user sees and expects are unclear.

3. **What does "phase" mean (vapor, liquid) in the formula model, and should the UI communicate phase to the user?** Formulas have a phase field but the brief never explains what phases mean or whether users need to understand them.

4. **What is an "expansion" in concrete terms -- a macro expansion, a template instantiation, or a sub-workflow?** The brief repeatedly references expansion groups but never defines the mechanism, which directly affects how users will reason about nesting and hierarchy.

5. **What is the relationship between a "formula" and a "molecule" -- does one contain the other, are they different views of the same thing, or are they distinct concepts?** The codebase mentions both "formula editor" and "molecule visualizer" but the relationship is never stated.

6. **What does "cooking" a formula mean -- parsing, validating, executing, or all three?** The "Cook Preview" button is a primary action but its semantics are undefined.

7. **What are "waves" in the results view -- execution batches, parallelism groups, or dependency layers?** Waves appear as a first-class view mode but the concept is never defined for users unfamiliar with topological sorting.

8. **What is a "crew" in this context -- a team of human users, a set of AI agents, or a configuration?** The codebase directory structure references crews, and the sling action dispatches to "agents/crews."

9. **What does "priority" (0-10) mean in practice -- execution order, importance weighting, or resource allocation hint?** The step editor exposes priority but without defined semantics users will assign arbitrary values.

10. **How do "blocking deps" differ from "related deps" in user-facing behavior -- does the UI need to visually distinguish these, and do users understand the distinction?** The formula files use both types but the brief treats dependencies as a single concept.

11. **What is a "recursion guard" from the user's perspective -- a safety mechanism they configure, an automatic limit, or something they need to understand at all?** Formulas contain recursion guards but it is unclear whether the IDE should surface or hide this complexity.

12. **What does "robot-insights" and "robot-triage" mean to a user -- are these AI-generated recommendations, graph analytics, or automated decisions?** These appear in formula step descriptions and presumably drive some of the results views.

### Prior Art

#### What do existing products do?

1. **How do visual workflow builders like n8n, Retool Workflows, and Temporal UI handle the tension between DAG visualization and sequential step editing?** Most successful tools offer both views but default to one; understanding which default works better for our user type matters.

2. **What can we learn from how VS Code's outline view, JetBrains' Structure panel, or Xcode's navigator present hierarchical code structure?** These are direct prior art for the proposed outline view and their conventions set user expectations.

3. **How do GitHub Actions, GitLab CI, and CircleCI visualize multi-stage pipelines with parallel execution and dependencies?** CI/CD pipeline UIs solve nearly the same visualization problem (DAG of steps with groups and dependencies) and users may expect similar patterns.

4. **How does Figma handle inline property editing versus panel-based editing for selected objects?** The brief proposes both inline and panel editing modes -- Figma's approach to this tension is widely studied and understood.

5. **What conventions do tools like Notion, Linear, and Jira use for keyboard-first navigation in structured data?** If we are building keyboard shortcuts, users will benchmark against these tools.

6. **How do Apache Airflow and Prefect display DAG execution status in real-time -- do they favor graph or timeline views?** These are the closest prior art for "results viewing" of workflow execution and their UX choices reflect years of iteration.

7. **What do accessibility-focused IDE competitors (like Eclipse's longstanding accessibility work) teach us about screen reader interaction with tree structures and graph views?** Graph visualizations are notoriously difficult for screen readers; prior art here could save us from reinventing solutions.

8. **How do Miro and FigJam handle grouping, container nodes, and cross-group connections in freeform canvas tools?** The expansion group visualization is essentially a grouping/container problem, and canvas tools have well-established patterns.

9. **What conventions do TOML/YAML editors (like Lens for Kubernetes, or Stoplight Studio for OpenAPI) use for visual editing of structured config files?** Our core editing problem is "make a config file editable in a visual way" which these tools have addressed.

10. **How do Lucidchart and draw.io handle accessibility for graph/diagram content -- do they provide alternative text representations?** Since we have both graph and outline views, understanding how diagramming tools handle a11y could inform whether the outline view IS the accessible alternative.

11. **What unsaved-changes patterns do Google Docs (auto-save), VS Code (explicit save with dot indicator), and Notion (auto-save with "Saving..." indicator) use, and which matches our users' expectations?** The brief asks about unsaved changes handling, and user expectations here are strongly shaped by tool familiarity.

### Problem Depth

#### Is this the real problem or a symptom?

1. **Is the DAG visualization actually confusing, or is the underlying formula structure (TOML with expansions) inherently hard to reason about regardless of visualization?** If the data model is the problem, no amount of UI polish will fix comprehension issues.

2. **Are users actually editing formulas in the IDE, or are they primarily viewing/debugging execution results -- and does our UX prioritization reflect actual usage patterns?** The brief focuses heavily on editing UX but if most usage is read-only results viewing, we may be optimizing the wrong flows.

3. **Is the step editor panel needed because visual mode editing is clunky, or because the text editor (TOML) is too error-prone for non-developers?** Understanding which user pain point drives the step editor determines how it should work.

4. **Are expansion groups a visualization challenge or a conceptual challenge -- do users struggle to see groups or to understand what expansion means?** Better container nodes will not help if users do not understand the expansion concept itself.

5. **Is accessibility being prioritized because of actual user needs (users with disabilities), compliance requirements, or general engineering quality goals?** The answer shapes how deep we go -- WCAG AA compliance is very different from "add some ARIA labels."

6. **Are keyboard shortcuts being requested because power users want them, or because the current mouse-dependent interaction model is slow for everyone?** This determines whether shortcuts are a power-user feature or a core interaction redesign.

7. **Is the unsaved changes warning needed because users lose work, or because the save/sync model is unclear?** If the underlying save model were transparent, the warning might be unnecessary.

8. **Is formula search/filter needed because users have many formulas, or because the sidebar organization is inadequate?** With four formulas in the current workspace, search seems premature -- understanding scale expectations matters.

9. **Are loading states missing because the app is slow, or because async operations lack feedback?** Skeleton loaders for a fast local tool may feel more distracting than helpful.

10. **Is the contrast issue a design problem or a Tailwind configuration problem -- are we fixing symptoms of an inconsistent design system rather than establishing one?** The color palette section shows many overlapping grays; systematizing tokens may be more impactful than adjusting individual values.

11. **Is the real unaddressed problem that formulas reference each other recursively (explore-module calls itself, discover-and-dive calls explore-module) and there is no way to visualize this cross-formula dependency graph?** The brief focuses on within-formula visualization but the actual complexity may be between formulas.

12. **Does the existing three-panel layout actually work for this use case, or is the fundamental layout wrong?** The brief treats the panel layout as fixed, but if users spend most time in one panel, a different layout paradigm might be more effective.

### Edge Cases (Domain)

#### What unusual but valid scenarios exist?

1. **What happens when a formula has zero expansion groups -- is the outline view still useful, or does it degrade to a flat list identical to the DAG?** Not all formulas use expansions, and the visualization must still be coherent for simple linear workflows.

2. **What happens when expansion groups have cross-group dependencies that create a non-linear reading order -- does the outline view mislead users about execution flow?** The outline view implies top-to-bottom order, but cross-group dependencies may mean Step 2.3 runs before Step 1.7.

3. **How should the UI handle formulas with circular dependencies or other graph errors -- is this a validation error, a visual warning, or should the editor prevent it entirely?** The formulas themselves include cycle detection steps, suggesting cycles are a real concern.

4. **What happens when a step has template variables (like `{{module_name}}`) that are not yet filled in -- how does the visual builder render unresolved templates?** Every real formula uses template variables extensively, and partial/unresolved states need clear handling.

5. **How does the UI handle formulas with recursive instantiation (explore-module calling itself at reduced depth) -- is this visible in the expansion groups?** Recursive formulas are a core pattern but the brief does not address how recursion appears in the IDE.

6. **What happens when a user edits TOML in text mode that creates an invalid state for visual mode -- does switching modes show an error, a partial render, or silently lose data?** Mode synchronization is a fundamental edge case for any multi-view editor.

7. **How should the IDE handle formulas that are syntactically valid TOML but semantically invalid (e.g., needs referencing a non-existent step ID)?** Semantic validation is different from parse validation and the UI needs to communicate both.

8. **What happens when the sidebar has dozens or hundreds of formulas -- does the current flat list scale, and does the proposed search/filter address this?** Scale varies dramatically between individual developers and teams.

9. **How should the results graph view handle execution that is still in progress -- do nodes animate, show spinners, or update incrementally?** The brief discusses loading states but not partial/streaming results.

10. **What happens when a formula's expansion source is unavailable (e.g., the referenced expansion formula was deleted or renamed)?** Broken references between formulas are a realistic failure mode.

11. **How should the IDE handle very long step descriptions (the current formulas have multi-line descriptions with code blocks, jq commands, and decision trees)?** The truncation question in the spec is more serious than it appears -- real step descriptions are mini-documents.

12. **What if a formula has steps with no dependencies at all (fully parallel) -- does the outline view's sequential presentation mislead users into thinking there is an ordering?** Parallel-first formulas may be common and the outline view inherently suggests sequence.

13. **How should the UI handle a step whose `needs` array references steps in a different expansion group -- is this always a "cross-group edge" or can it be an error?** Cross-group references are highlighted but might sometimes be mistakes.

14. **What happens when two users are editing the same formula file simultaneously (via Git or shared filesystem)?** The brief mentions no collaboration model, but file-level conflicts are possible even without real-time collab.

### Success Criteria

#### How would we know this succeeded?

1. **Can a new user understand the structure of a formula (steps, dependencies, expansions, variables) within 60 seconds of opening the outline view, without reading documentation?** This is the core comprehension test for the new visualization.

2. **Does the time to edit a step property (e.g., change a dependency) decrease compared to the current text-editing workflow?** If visual/inline editing is not faster than editing TOML directly, it has no reason to exist.

3. **Can a user with a screen reader navigate the full formula structure, understand dependencies, and edit step properties?** This is the concrete test for the accessibility improvements.

4. **Do users naturally discover keyboard shortcuts, or do they remain mouse-dependent?** Discoverability is the real challenge -- building shortcuts that nobody knows about is wasted effort.

5. **Does the unsaved changes warning prevent data loss without being annoying (i.e., users do not disable or ignore it)?** The balance between safety and friction determines if this feature succeeds.

6. **Can users distinguish cross-group dependencies from within-group dependencies at a glance in both the DAG and outline views?** This is the core test for expansion group visualization.

7. **Does the loading state improvement reduce perceived wait time, or does it just add visual noise to an already-fast operation?** Loading skeletons on fast operations can feel worse than a blank screen.

8. **Does the formula search/filter save time compared to scrolling the sidebar?** Only matters at scale; for small formula counts, search adds cognitive overhead.

9. **Do users choose the outline view over the DAG view, or do they ignore it?** If the new view is not adopted, the development effort was wasted -- measuring view mode selection is essential.

10. **Can users correctly predict execution order from the visualization alone (without running the formula)?** This is the ultimate test of whether the visualization communicates the right information.

11. **Does the reduced-motion support actually get used, and does the application still feel responsive without animations?** Reduced motion must not degrade the experience to the point where it feels broken.

12. **After the accessibility improvements, does the application pass automated WCAG AA audits (axe, Lighthouse)?** Automated testing catches the mechanical issues; manual testing with assistive technology catches the experiential ones.

13. **Is the error rate for dependency specification lower in visual/outline mode compared to raw TOML editing?** If the structured editors reduce mistakes, that is a concrete quality improvement.

14. **Do the contrast improvements resolve readability complaints without making the dark theme feel washed out or losing the IDE aesthetic?** Contrast improvements that sacrifice visual identity will be reverted.

15. **When a parse error occurs after a TOML edit, can the user identify and fix the error within 30 seconds using the error feedback provided?** Error recovery speed is a direct measure of UX quality.

### Summary of Critical Gaps

The brief covers five broad areas but lacks clarity on several foundational questions:

1. **User identity**: Who is the primary user -- a developer writing formulas, an operator running them, or a manager reviewing results? The UX priorities differ dramatically.

2. **Scale assumptions**: The current codebase has 4 formulas with 3-7 steps each. Are we designing for this scale, or for hundreds of formulas with dozens of steps? Search, filtering, and virtualization only matter at scale.

3. **The expansion model**: Expansions are the central complexity in the data model, but the brief never fully defines what they are, how they are created, or what users need to understand about them. The entire outline view design depends on this concept being clear.

4. **Cross-formula relationships**: Formulas reference other formulas (recursive instantiation, formula composition). The brief only addresses within-formula visualization, but the harder UX problem may be understanding the relationships between formulas.

5. **Read vs. write ratio**: If the IDE is primarily a viewer (for debugging execution results), the editing UX improvements are lower priority than results visualization. If it is primarily an editor, the reverse is true. The brief does not state which.

6. **The outline view vs. DAG tension**: The spec proposes adding a third view mode, but the problem statement suggests the DAG view is insufficient. Should the outline view replace the DAG, complement it, or serve a different audience? Maintaining three view modes (text, outline, DAG) is expensive.

---

## Cross-Perspective Themes (Opus)

### 1. Dual Editing Surfaces & Conflict Resolution
All three perspectives raise concerns about having both a text editor (TOML) and a step editor panel creating conflicts and data loss risks. The User Advocate emphasizes this as the single most likely source of confusion and data loss. The Product Designer highlights the need for explicit handling when switching between modes. The Domain Expert points out that mode synchronization edge cases must be resolved. **Key questions**: What is the authoritative edit surface? How are simultaneous edits handled? What prevents data loss when users edit the same step in both text and visual modes?

### 2. Unsaved Changes & Data Safety
Multiple perspectives address the tension around unsaved changes warnings, auto-save expectations, and navigation triggers. The User Advocate questions whether the app auto-saves and what "unsaved" means psychologically. The Product Designer explores different warning presentation strategies (modal vs banner vs toast). The Domain Expert asks whether the warning is solving a real problem or masking a broken save/sync model. **Key insight**: User expectations are shaped by tools like Google Docs (auto-save) and VS Code (explicit save), and the brief does not clarify which model we are adopting or how to make it transparent.

### 3. Accessibility Beyond Compliance
All three perspectives recognize that accessibility is not just adding ARIA labels and respecting prefers-reduced-motion. The User Advocate identifies that screen readers need a fundamentally different interaction model for graph visualization. The Product Designer addresses the three distinct visual states needed (hover, active, focused). The Domain Expert notes that prior art from Eclipse and accessible diagramming tools should inform the approach. **Critical need**: Real user testing with people who use assistive technology, not just automated WCAG audits.

### 4. Visual Complexity vs Clarity
There is tension between adding new features (expansion groups, cross-group edge highlighting, loading states, contrast improvements) and keeping the interface comprehensible. The User Advocate warns about "visual complexity creep" making the interface noisier. The Product Designer raises the "Density vs. Clarity" tension and proposes progressive disclosure. The Domain Expert questions whether individual improvements are addressing symptoms rather than root causes. **Design principle needed**: A visual complexity budget that prevents the accumulation of features from degrading the overall experience.

### 5. Discovery & Learnability of Advanced Features
Keyboard shortcuts, skip navigation, and the outline view will only be valuable if users discover them organically. The User Advocate emphasizes that most users will never find buried menu items. The Product Designer details multiple entry points for shortcuts. The Domain Expert questions whether shortcuts are truly discoverable or just wasted development effort. **Fundamental challenge**: Without onboarding hints, tooltips, or context-specific prompts, advanced features become invisible and the feature investment is wasted.

### 6. Scale Assumptions Deeply Unclear
Different UX solutions are needed for different scales (5 formulas vs 50 vs 500; 5 steps vs 50 vs 500). The User Advocate raises this for formula search and expansion group color palette overflow. The Product Designer references it in information architecture and loading strategy. The Domain Expert notes that the current codebase has 4 formulas, making search premature. **Critical gap**: The brief does not define the target scale, so it is unclear whether search, filtering, virtualization, and other scaling features are justified or premature optimizations.
