# Synthesized Question Backlog: beads-ide-ux-v2

**Models Used:** Opus 4.6, GPT 5.3 (Gemini 3 Pro skipped - CLI not installed)

**Question Counts:**
- Raw questions from all 6 analyses: ~338 (Opus ~180, GPT ~158)
- After deduplication (merging similar): 89
- P0 + P1 + P2 + P3 = 89 (verified)

---

## P0: Must Answer (Critical - Both Models Flagged or High Impact)

### Dual Editing Surface & Conflict Resolution

1. **What is the conflict resolution strategy when a user edits the same step simultaneously in text mode (TOML) and the step editor panel?** [Opus, GPT]
   - This is the most likely source of data loss and user confusion. Every edit path must produce consistent results.

2. **Which editing surface is the source of truth in visual mode: the graph, the step list, or the panel details?** [Opus, GPT]
   - Editing confidence depends on clear authority; ambiguity creates "did it save?" anxiety.

3. **Does the step editor panel replace clicking into the text editor, or is it an additional way to edit? What happens if both are open?** [Opus, GPT]
   - Users need to know which edit "wins" if both surfaces are active.

### Unsaved Changes & Data Safety

4. **Does "unsaved changes" refer only to formula text, or also panel edits, layout preferences, and filters?** [Opus, GPT]
   - Warning scope must match user expectations; false warnings train users to ignore prompts.

5. **Does the app auto-save (like Google Docs) or require explicit save (like VS Code)? How is this communicated to users?** [Opus, GPT]
   - User expectations are shaped by familiar tools; the brief does not clarify which model we adopt.

6. **What happens when a user triggers "pour" or "sling" while they have unsaved changes?** [Opus]
   - Executing with stale saved state while the editor shows different content produces confusing results.

7. **What is the full flow when unsaved changes exist and user tries to navigate away: warning presentation, options (save/discard/cancel), and what happens for each?** [Opus, GPT]
   - This is one of the most common frustration points in any editor.

### Accessibility Beyond Compliance

8. **Can a user with a screen reader navigate the full formula structure, understand dependencies, and edit step properties?** [Opus, GPT]
   - Graph visualization needs a fundamentally different interaction model for non-sighted users.

9. **How does a user navigate between steps using only the keyboard in visual mode? What is the traversal pattern?** [Opus, GPT]
   - Tab order through a DAG is non-obvious; users need a predictable pattern and clear focus indicators.

10. **Can color-blind users distinguish expansion groups and cross-group edges without relying on color alone?** [Opus, GPT]
    - Six group colors are not all distinguishable under color blindness; secondary visual differentiators are essential.

### Core Domain Concepts

11. **What exactly is an "expansion group" in user-facing terms - a macro expansion, template instantiation, or sub-workflow?** [Opus, GPT]
    - The brief repeatedly references expansion groups but never defines the mechanism.

12. **What is a "bead" in the mental model of the target user - a task, unit of work, node in a dependency graph, or something else?** [Opus]
    - The entire product is named around beads but the brief never defines this core metaphor.

13. **What is the primary user persona: a developer writing formulas, an operator running them, or a manager reviewing results?** [Opus]
    - UX priorities differ dramatically based on this answer.

---

## P1: Should Answer (Important - At Least One Model Flagged or Moderate Impact)

### Visual Clarity & Information Architecture

14. **When a user views a complex formula with multiple overlapping expansion groups, how do we prevent visual overwhelm?** [Opus, GPT]
    - Information overload in graph views leads to cognitive fatigue and missed dependencies.

15. **What is the visual hierarchy within an expansion group container node? How do users distinguish group metadata from individual steps?** [Opus, GPT]
    - If the hierarchy is unclear, users waste time parsing the layout.

16. **Should cross-group edges be visible at all zoom levels, or only surface when zoomed in or on hover?** [Opus, GPT]
    - Cross-group edges are secondary most of the time but critical when debugging.

17. **What color strategy handles expansion groups when there are more groups than the 6-color palette supports?** [Opus, GPT]
    - Formulas with >6 groups will hit the color limit; design needs graceful fallback.

18. **What visual treatment distinguishes active/selected node vs hovered node vs focused (keyboard) node?** [Opus, GPT]
    - Three distinct visual states are needed to avoid ambiguity.

### Interaction Design

19. **What gesture triggers inline step editing in visual mode: single click, double click, or dedicated edit button?** [Opus, GPT]
    - This choice affects the entire node interaction model; ambiguous triggers cause accidental context changes.

20. **How does the user dismiss the step editor panel: close button, clicking away, Escape key, or auto-close when clicking another node?** [Opus]
    - Each approach has different implications for accidental data loss and workflow speed.

21. **Should updates save instantly, on explicit save, or both with undo? What determines the risk profile?** [Opus, GPT]
    - Determines user trust around edits.

22. **How does cross-group edge highlighting get triggered: on node selection, group selection, or via toggle control?** [Opus, GPT]
    - Interaction cost affects whether users actually use dependency insights.

23. **What is the expected behavior when users edit a step while a filter/search is active?** [GPT]
    - Prevents disorientation when edited items disappear or move.

### Discovery & Learnability

24. **How does a user discover keyboard shortcuts exist? Is there onboarding, tooltips, or contextual hints?** [Opus, GPT]
    - Without organic discovery mechanisms, shortcuts remain invisible and development effort is wasted.

25. **Where should keyboard shortcut help live: persistent affordance, command palette, modal overlay, or all three?** [Opus, GPT]
    - Multiple entry points ensure discoverability for different user types.

26. **Can users use the keyboard shortcuts panel as a reference while working, or does it block the workspace?** [Opus]
    - Forcing closure before continuing work defeats the purpose.

### Mode Switching & Consistency

27. **How does a user's experience transition when switching between text mode and visual mode mid-task?** [Opus, GPT]
    - Mode-switch penalties hurt productivity; mental model must stay consistent.

28. **What is the transition between text mode and visual mode: instant swap, crossfade, or slide animation?** [Opus]
    - The transition communicates the relationship between views.

29. **If a user switches modes while the step editor panel is open, what happens to in-progress edits?** [Opus, GPT]
    - Mode switching with open editing contexts creates potential for data loss.

### Scale & Performance

30. **Are we designing for 5 formulas with 5 steps each, or 500 formulas with 50+ steps? Does the UX scale?** [Opus, GPT]
    - The current codebase has 4 formulas; search and filtering only matter at scale.

31. **How should the IDE handle formulas with 50+ steps and dense cross-group dependencies?** [Opus, GPT]
    - Scaling behavior often breaks otherwise good UX patterns.

32. **What happens when a formula has zero expansion groups - does the outline view still provide value?** [Opus]
    - Not all formulas use expansions; visualization must still be coherent.

### Loading States & Feedback

33. **Do loading states explain what's happening ("parsing," "rendering," "saving") rather than showing generic spinners?** [Opus, GPT]
    - Ambiguous waiting increases frustration and support requests.

34. **What do users experience when loading is slow: skeleton, progress text, cancellable wait, or partial render?** [Opus, GPT]
    - Perceived performance strongly affects satisfaction.

35. **How should "Pour" and "Sling" actions communicate progress: progress bar, spinner, log stream, or combination?** [Opus]
    - These are potentially long-running operations; feedback must convey "something is happening" and "how far along."

### Error Recovery

36. **What is the error recovery flow when a step edit fails to save (e.g., TOML serialization error)?** [Opus, GPT]
    - User needs to know what went wrong, where, and how to fix it without losing the edit.

37. **What happens when a user opens a formula with malformed TOML: land in text mode with error highlighting or dedicated error state?** [Opus]
    - Error recovery is a frequent real-world scenario.

38. **What happens if a user creates a circular dependency using the step editor's dependency selector?** [Opus]
    - Error must be caught immediately with clear explanation, not after trying to cook.

---

## P2: Good to Have (Design-Relevant - Single Model Flagged)

### User Expectations

39. **Will expansion group containers behave like folders users can collapse and expand?** [Opus]
    - Users from node-based editors expect collapsibility.

40. **Can users drag steps between expansion groups?** [Opus]
    - If groups are visually distinct containers, users may assume they can reorganize by dragging.

41. **Will cross-group edge highlighting be toggleable?** [Opus]
    - Amber dashed animated edges may be visually loud; users may want to turn this off.

42. **Do users expect keyboard shortcuts to match conventions from IDEs (Cmd+S to save, Cmd+Z to undo)?** [Opus, GPT]
    - Deviating from conventions without documentation causes frustration.

43. **Will reduced motion support disable only decorative animations or also meaningful transitions?** [Opus]
    - Users who enable reduced motion still want to understand state changes.

44. **Do users expect group colors to stay consistent across sessions and views?** [GPT]
    - If colors shift unpredictably, users lose spatial memory.

### User Journey & Flows

45. **What is the user's primary goal when they open Beads IDE: authoring, debugging, or reviewing?** [Opus]
    - Each goal demands different UX priorities.

46. **How does a user recover from accidentally closing the step editor panel mid-edit?** [Opus]
    - If changes are lost, the panel becomes a source of anxiety.

47. **What is the ideal first-run flow for a new user entering visual mode for the first time?** [GPT]
    - Onboarding quality determines early retention.

48. **What should happen when search/filter yields no matches?** [Opus, GPT]
    - Empty-result recovery should be immediate and self-explanatory.

49. **What is the flow when a user navigates back to a formula after an interruption (meeting, break)?** [Opus, GPT]
    - Session resilience is critical for real workplace usage.

### Visual & Layout

50. **Where does the step editor panel physically appear: sub-panel within main area, within detail panel, or floating overlay?** [Opus]
    - Location determines whether it competes with the visual builder canvas for space.

51. **How should the sidebar communicate which formulas have unsaved changes?** [Opus]
    - Users navigating between multiple formulas need at-a-glance awareness.

52. **What contrast ratio targets should secondary text meet: WCAG AA (4.5:1) or AAA (7:1)?** [Opus, GPT]
    - Current secondary text colors likely fall below AA on dark backgrounds.

53. **Should loading skeletons pulse/shimmer or be static gray blocks?** [Opus]
    - Pulsing communicates "loading in progress" but must respect prefers-reduced-motion.

54. **Where does the formula search/filter input live: top of sidebar, command palette, or both?** [Opus, GPT]
    - Placement affects frequency of use and discoverability.

55. **How should toast notifications be positioned: top-right, bottom-right, or bottom-center?** [Opus]
    - Position interacts with 3-panel layout.

### States & Transitions

56. **What are the canonical states for the step editor panel: closed, loading, editing, saving, save-success, save-error?** [Opus]
    - Each state needs distinct visual treatment.

57. **How does the expansion group container animate when steps are added or removed?** [Opus]
    - Adding should feel like natural growth; abrupt resizing breaks spatial model.

58. **What visual state does a node enter when it is being edited in the step editor panel?** [Opus]
    - Users need spatial awareness of which node they're modifying.

59. **How does the system recover from a failed formula save: auto-retry, retry button, or persistent warning?** [Opus]
    - Auto-retry is convenient but may mask persistent issues.

60. **What happens to cross-group highlighting state after deselection or mode switch?** [GPT]
    - Predictable reset behavior reduces mental overhead.

### Edge Cases

61. **What happens if a user rapidly switches between formulas without saving?** [Opus]
    - Each switch could trigger warnings; repeated warnings become hostile.

62. **What happens if a user pastes invalid TOML into the text editor while step editor panel is open?** [Opus]
    - Parse errors should be surfaced clearly; panel should indicate it cannot reflect broken state.

63. **What happens if a user resizes browser window very small while expansion groups are visible?** [Opus]
    - Container nodes could overflow, overlap, or become unreadable.

64. **What happens when two users edit the same formula file simultaneously (via Git or shared filesystem)?** [Opus, GPT]
    - File-level conflicts are possible even without real-time collaboration.

65. **What happens if a user changes priority to a value outside 0-10 by editing TOML directly?** [Opus]
    - Panel shows priority as 0-10; must handle out-of-range values gracefully.

### Domain & Prior Art

66. **What is the precise distinction between "pour" (local) and "sling" (remote)?** [Opus]
    - These terms appear in UX flows but implications are unclear.

67. **What does "cooking" a formula mean: parsing, validating, executing, or all three?** [Opus]
    - Cook Preview is a primary action but semantics undefined.

68. **What are "waves" in the results view: execution batches, parallelism groups, or dependency layers?** [Opus]
    - Waves appear as first-class view mode but concept never defined.

69. **How do dependencies differ between "blocking deps" and "related deps" in user-facing behavior?** [Opus]
    - Formula files use both types but brief treats dependencies as single concept.

70. **Which competitor patterns are expected: workflow builders (n8n), CI DAG tools (GitHub Actions), or ETL editors?** [Opus, GPT]
    - Conventions differ and users transfer expectations.

### Success Criteria

71. **Can a new user understand formula structure within 60 seconds of opening the outline view?** [Opus]
    - Core comprehension test for visualization.

72. **Does time to edit a step property decrease compared to current text-editing workflow?** [Opus]
    - If visual editing isn't faster, it has no reason to exist.

73. **Do users naturally discover keyboard shortcuts, or do they remain mouse-dependent?** [Opus]
    - Discoverability is the real challenge.

74. **Can users correctly predict execution order from the visualization alone?** [Opus]
    - Ultimate test of whether visualization communicates right information.

---

## P3: Parking Lot (Technical Questions or Deferred)

### Technical / Implementation

75. **How should the IDE handle formulas with recursive instantiation (explore-module calling itself)?** [Opus]
    - Recursive formulas are a core pattern but visualization approach not addressed.

76. **What happens when a step has template variables ({{module_name}}) not yet filled in?** [Opus]
    - Partial/unresolved states need clear handling.

77. **What happens when a formula's expansion source is unavailable (referenced formula deleted)?** [Opus]
    - Broken references between formulas are realistic failure mode.

78. **How should the app respond when user toggles prefers-reduced-motion at OS level while app is open?** [Opus]
    - Should respond to media query change in real time.

79. **How should the visual builder handle semantic zoom at extreme zoom-out levels?** [Opus]
    - Nodes should collapse into summary representations while groups remain visible.

### Mobile & Responsive

80. **What about users on mobile devices or tablets?** [Opus]
    - 3-panel resizable layout won't work on small screens.

81. **What responsive behavior is expected when panel widths shrink: collapse, tabs, or priority stacking?** [GPT]
    - Layout resilience is critical for real-world screen sizes.

### Internationalization

82. **What about users whose primary language is not English?** [Opus]
    - All UI text needs to be internationalizable even if not localized now.

83. **How should terminology and labels handle multilingual teams?** [GPT]
    - Ambiguous labels amplify cognitive load globally.

### Extended Use & Environment

84. **What about users who work with the app for extended periods (4+ hours)?** [Opus]
    - Dark theme with blue-heavy colors can cause eye strain.

85. **What about users on low-powered devices or slow connections?** [Opus]
    - ReactFlow with many nodes is computationally expensive.

86. **What if users work in different environments (loud office, no monitor, with assistive tech)?** [GPT]
    - Inclusion means supporting varied contexts.

### Future Considerations

87. **What is the flow for a user who wants to compare two formulas side by side?** [Opus]
    - Understanding this desire helps ensure layout doesn't preclude it.

88. **Is the real unaddressed problem cross-formula dependency visualization rather than within-formula?** [Opus]
    - The actual complexity may be between formulas, not within them.

89. **Should the outline view replace the DAG, complement it, or serve a different audience?** [Opus]
    - Maintaining three view modes (text, outline, DAG) is expensive.

---

## Cross-Model Theme Summary

### Themes Identified by Both Models:

1. **Dual Editing Surface Conflict** - Text mode and step editor panel creating data loss risks
2. **Unsaved Changes Semantics** - What "unsaved" means and how to communicate save model
3. **Accessibility as Core Design** - Not just compliance, but practical assistive tech support
4. **Visual Complexity Management** - Preventing feature accumulation from degrading clarity
5. **Discovery & Learnability** - Making advanced features visible without cluttering UI
6. **State Persistence & Predictability** - Users need consistent mental models across sessions
7. **Clear Recovery Paths** - Every error state needs a visible, safe way forward
8. **Information Architecture Alignment** - UI structure must match user mental models
