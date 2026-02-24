# Question Backlog: explorer-onboarding

**Source:** Opus 4.6 (single model)
**Raw questions:** 143
**Unique questions:** 143

## P0: Must Answer (Critical)

1. CO-Q12: How should the "New Project" / "Open Folder" actions be made discoverable beyond the welcome screen (menu bar, sidebar action, command palette)? — Product Designer
2. CO-Q1: How does the proposed onboarding pattern align with the existing command palette (Cmd+K) workflow? — Product Designer
3. CO-Q2: Should the onboarding welcome screen be a dedicated route (e.g., `/welcome`) or a conditional state of the landing page (`/`)? — Product Designer
4. CO-Q6: How should toast notifications be used during onboarding vs. inline feedback? — Product Designer
5. CO-Q7: Does the existing `react-resizable-panels` layout need modification to support the onboarding state? — Product Designer
6. CO-Q8: Should the file tree component be built on top of the existing `FormulaTree` or be a new component? — Product Designer
7. CO-Q9: How should the existing Tailwind theme tokens (sidebar colors, brand colors) be applied to new onboarding components? — Product Designer
8. Can keyboard-only users complete the entire onboarding flow without a mouse? — User Advocate
9. Can users who rely on browser zoom (up to 200%) still use the onboarding and tree effectively? — User Advocate
10. IA-Q1: What should the user see when they launch the app for the very first time with no project root detected? — Product Designer
11. IA-Q2: Should the onboarding distinguish between "no project root found" and "project root found but no formulas exist"? — Product Designer
12. IA-Q3: How should the current working directory / project root be surfaced in the UI? — Product Designer
13. IA-Q4: What is the correct information hierarchy for the sidebar: project root > subdirectories > formula files, or flat group-by-search-path as it is now? — Product Designer
14. IX-Q10: How should the app handle the case where the backend is unreachable during onboarding? — Product Designer
15. IX-Q11: Should there be an "Open Recent" list, and how many items should it hold? — Product Designer
16. IX-Q12: How should the app behave when resizing the sidebar with the file tree -- should the tree truncate names, wrap, or scroll horizontally? — Product Designer
17. IX-Q3: How should the user switch between projects / root folders after initial selection? — Product Designer
18. IX-Q5: Should tree nodes (folders) be expandable/collapsible, and should their state persist across sessions? — Product Designer
19. Q10. How does the three-panel AppShell change for the onboarding state? — Tech Lead
20. Q22. Should the backend "Open Folder" / root-change be a restart or a hot-reload? — Tech Lead
21. Q24. Should the tree be virtualized to handle large directories? — Tech Lead
22. Q41. How do we ensure the onboarding flow is not shown to returning users? — Tech Lead
23. Q6. Should onboarding state persist across sessions and how? — Tech Lead
24. VD-Q12: How should the folder path be truncated or abbreviated in the sidebar header? — Product Designer
25. VD-Q2: How should the alignment issue between chevron, folder icon, label, and count badge be fixed? — Product Designer
26. VD-Q3: What visual treatment should distinguish the onboarding/welcome state from the normal working state? — Product Designer
27. VD-Q5: What should the empty sidebar look like when no folder is open (pre-onboarding state)? — Product Designer
28. VD-Q6: How should the "Open Folder" and "New Project" buttons be styled -- primary brand buttons, ghost buttons, or card-based actions? — Product Designer
29. VD-Q9: How should the sidebar collapse/expand toggle be redesigned? — Product Designer
30. What does a returning user expect? — User Advocate
31. What does the user do right before they need to switch folders? — User Advocate
32. What happens after the user selects a formula from the tree? — User Advocate
33. What happens after they select a root folder -- what do they expect to see immediately? — User Advocate
34. What if the user accidentally dismisses the onboarding screen and doesn't know how to get back to it? — User Advocate
35. What is the user's emotional state on first launch? — User Advocate
36. What is the user's primary goal when they first open Beads IDE? — User Advocate
37. Will users expect "Open Folder" to also configure the backend's search paths? — User Advocate
38. Will users expect "Open Folder" to work like VS Code's "Open Folder"? — User Advocate
39. Will users expect a "Recent Folders" list? — User Advocate
40. Will users expect drag-and-drop to open a folder? — User Advocate
41. Will users expect keyboard shortcuts for the onboarding actions? — User Advocate
42. Will users expect right-click context menus on tree items? — User Advocate
43. Will users expect the opened folder to persist across browser sessions and page reloads? — User Advocate
44. Will users expect the root folder path to be visible at all times? — User Advocate
45. Will users expect to be able to create new .formula.toml files from within the IDE? — User Advocate
46. Will users expect to open multiple folders or a single workspace? — User Advocate
47. Will users expect to search/filter within the file tree? — User Advocate
48. Will users expect to see ALL files inside the opened folder, not just .formula.toml files? — User Advocate

## P1: Should Answer (Important)

49. Are we assuming all users read left-to-right? — User Advocate
50. Are we assuming all users speak English? — User Advocate
51. CO-Q10: How does the proposed file tree interact with the existing formula fetch hook (`useFormulas`)? — Product Designer
52. CO-Q3: Can the existing `UnsavedChangesModal` pattern be reused for confirming project switches? — Product Designer
53. CO-Q4: How should the sidebar header styling change to accommodate a project name and path? — Product Designer
54. CO-Q5: Should error states in the file tree follow the same pattern as the existing `errorStyle` (red background, red text)? — Product Designer
55. Can users with cognitive disabilities understand the "Gas Town" vs "User" formula distinction? — User Advocate
56. IA-Q10: What should the title bar / window header communicate? — Product Designer
57. IA-Q11: Should "New Project" create a `.beads/` directory and scaffolded files, or just set the working directory? — Product Designer
58. IA-Q12: How should recently opened projects be tracked and presented? — Product Designer
59. IA-Q5: Should the file tree show only `.formula.toml` files, or also show the surrounding directory structure for context? — Product Designer
60. IA-Q6: How should "Gas Town formulas" vs "User formulas" vs "Project formulas" be explained to a new user? — Product Designer
61. IA-Q7: What metadata should be visible for each formula in the tree (name only, path, last modified, dirty state, error state, step count)? — Product Designer
62. IA-Q8: Should the sidebar show a search/filter input for formulas, and where should it appear? — Product Designer
63. IA-Q9: How should the "Open Folder" action relate to the backend's search path configuration? — Product Designer
64. IX-Q1: What is the complete flow for a first-time user from app launch to editing their first formula? — Product Designer
65. IX-Q2: Should "Open Folder" use the native OS file picker (via `<input type="file" webkitdirectory>`) or a custom in-app file browser? — Product Designer
66. IX-Q4: What happens when the user selects a folder that contains no `.formula.toml` files? — Product Designer
67. IX-Q6: What keyboard shortcuts should be supported in the tree (arrow keys, Enter, Home/End, type-ahead)? — Product Designer
68. IX-Q7: How should drag-and-drop work in the file tree (if at all)? — Product Designer
69. IX-Q8: What confirmation or feedback should the user see after selecting "Open Folder"? — Product Designer
70. IX-Q9: Should the "New Project" flow include a formula template picker (blank formula, workflow template, multi-step template)? — Product Designer
71. Is the dark-only theme a barrier for any users? — User Advocate
72. Is the file tree navigable with arrow keys following the standard tree keyboard pattern? — User Advocate
73. Is the user always at a desktop, or could they be on a tablet or narrow screen? — User Advocate
74. Q1. Where does the "selected root folder" state live and who owns it? — Tech Lead
75. Q11. What happens to the existing search-path labels ("Gas Town formulas", "User formulas", "Project .beads")? — Tech Lead
76. Q12. Does the backend need to support multiple concurrent workspace roots? — Tech Lead
77. Q13. Can we reuse `react-resizable-panels` for the tree, or do we need a tree widget library? — Tech Lead
78. Q14. How do we handle recursive directory scanning without blocking the backend event loop? — Tech Lead
79. Q15. What existing code in `formula-tree.tsx` can be salvaged? — Tech Lead
80. Q16. How do we implement the folder picker UI without native OS dialogs? — Tech Lead
81. Q18. How does the dirty-state tracking change for a tree model? — Tech Lead
82. Q19. What is the migration path for existing users who have the current sidebar layout? — Tech Lead
83. Q2. Does introducing a "root folder" concept break the existing multi-search-path model? — Tech Lead
84. Q20. How do we handle the case where the selected root folder is deleted or unmounted? — Tech Lead
85. Q21. What changes are needed in the shared types package? — Tech Lead
86. Q23. What is the expected file count for a typical workspace root? — Tech Lead
87. Q25. How often should the tree refresh to pick up filesystem changes? — Tech Lead
88. Q26. What is the cost of recursive `readdirSync` on large directories? — Tech Lead
89. Q27. Should we cache the tree structure and serve diffs? — Tech Lead
90. Q28. Will the "Open Folder" action block the UI while scanning? — Tech Lead
91. Q29. What is the payload size for the tree API response? — Tech Lead
92. Q3. Do we need a new backend endpoint for recursive directory listing? — Tech Lead
93. Q30. Should we debounce tree expansion to prevent rapid API calls? — Tech Lead
94. Q31. How does the tree interact with the existing formula fetch for cook/sling operations? — Tech Lead
95. Q32. Can we preload the tree for commonly used workspace roots? — Tech Lead
96. Q33. How do we test the tree component with deeply nested structures? — Tech Lead
97. Q34. What happens when the tree API contract changes? — Tech Lead
98. Q35. How do we prevent the sidebar from becoming a second monolith? — Tech Lead
99. Q36. What documentation is needed for the "Open Folder" / workspace model? — Tech Lead
100. Q37. How do we handle regressions in the existing formula operations? — Tech Lead
101. Q38. What is the strategy for styling the new tree consistently? — Tech Lead
102. Q39. How do we version the workspace configuration for backward compatibility? — Tech Lead
103. Q4. Should the tree show only `.formula.toml` files or all files? — Tech Lead
104. Q42. What is the testing strategy for cross-platform path handling? — Tech Lead
105. Q43. How do we monitor for performance regressions in the tree? — Tech Lead
106. Q44. What is the plan for feature flags or gradual rollout? — Tech Lead
107. Q5. How does the "Open Folder" action reach the backend given browser security constraints? — Tech Lead
108. Q7. What is the component decomposition for the new sidebar? — Tech Lead
109. Q8. How does the new tree integrate with TanStack Router navigation? — Tech Lead
110. Q9. Does the "New Project" action create files on disk, and where? — Tech Lead
111. VD-Q10: Should the selected/active formula have a left-edge accent bar (VS Code style) or full-row highlight? — Product Designer
112. VD-Q11: What should the loading state look like during folder scanning (skeleton, spinner, progress bar)? — Product Designer
113. VD-Q4: How should tree indentation levels be visualized (indent guides, nesting lines, padding only)? — Product Designer
114. VD-Q7: How should the dirty indicator (unsaved changes dot) work with file-tree nesting -- should parent folders also show a dirty indicator? — Product Designer
115. VD-Q8: What hover, focus, and active states should tree items have? — Product Designer
116. What context does the user bring from their previous action? — User Advocate
117. What happens for users who have disabled JavaScript or have slow connections? — User Advocate
118. What happens if the backend server is not running when they first open the app? — User Advocate
119. What happens if the user opens a folder with zero .formula.toml files? — User Advocate
120. Will users assume the app is indexing or watching the folder for changes? — User Advocate

## P2: Good to Have

121. Are animations and transitions respectable of users who prefer reduced motion? — User Advocate
122. Are the icons purely decorative, or do they convey information that's only available visually? — User Advocate
123. CO-Q11: Should the onboarding flow respect the existing accessibility patterns (ARIA labels, focus management, keyboard navigation)? — Product Designer
124. Can screen reader users navigate the file tree effectively? — User Advocate
125. Can users with motor impairments interact with the small tree items? — User Advocate
126. Is the color contrast sufficient for users with low vision? — User Advocate
127. Q17. What icon system replaces the current hand-rolled SVGs? — Tech Lead
128. Q40. What accessibility requirements does the tree introduce? — Tech Lead
129. VD-Q1: What icon system should replace the current inline SVG icons, and how should formula-type-specific icons be differentiated? — Product Designer

## P3: Parking Lot (Defer)

130. What if the user cancels the folder picker dialog? — User Advocate
131. What if the user clicks "New Project" but doesn't actually want to create anything -- they just want to open an existing folder? — User Advocate
132. What if the user expects "Open Folder" to open a folder from a URL or remote location? — User Advocate
133. What if the user has formulas in multiple directories? — User Advocate
134. What if the user has symlinks in their folder structure? — User Advocate
135. What if the user is editing a formula, then decides to switch to a different root folder? — User Advocate
136. What if the user opens a folder on a network drive or mounted volume that disconnects? — User Advocate
137. What if the user opens a folder, then renames or moves it in their OS file manager? — User Advocate
138. What if the user opens the same folder in two browser tabs? — User Advocate
139. What if the user pastes a path into the folder picker instead of navigating to it? — User Advocate
140. What if the user selects a folder that contains thousands of .formula.toml files? — User Advocate
141. What if the user selects a folder they don't have read permissions for? — User Advocate
142. What if the user selects their home directory (~/) as the root folder? — User Advocate
143. What if the user's browser does not support the File System Access API (showDirectoryPicker)? — User Advocate

## Cross-Cutting Themes

### Theme 1: Backend/Frontend State Alignment
Multiple perspectives identified tension between frontend folder selection and backend formula discovery. The User Advocate warns about inconsistency ("the sidebar will show one thing and the API will operate on another"), the Product Designer questions how "Open Folder" relates to backend's search path configuration, and the Tech Lead directly asks whether the feature breaks the existing multi-search-path model. This is the single biggest architectural risk and must be resolved upfront with a clear decision on whether to replace, layer, or coexist with the current search-path model.

### Theme 2: Onboarding Persistence and State Management
All three perspectives emphasized that users must not re-do onboarding on every visit. The User Advocate points out "users will be frustrated and question the tool's reliability," the Product Designer questions where state lives and how it persists, and the Tech Lead asks which persistence layer (localStorage, backend config, .beads/workspace.json) is correct. This is not a minor UX detail -- it's essential for first-launch success and returning user experience.

### Theme 3: Filesystem Scale and Performance
Both the Product Designer and Tech Lead identified performance as a critical constraint. The Designer questions "what is the expected file count?" and "should we virtualize from day one?", while the Tech Lead details specific risks: "recursive readdirSync on 10,000 entries can take 100-500ms" and "rendering 500+ tree nodes causes jank." The User Advocate corroborates by noting "users will perceive lag" if the tree takes >200ms to populate. Performance is not a v2 concern; it must be addressed in the design phase.

### Theme 4: Confusing Domain Terminology ("Gas Town" vs "User" Formulas)
All three perspectives flagged the opacity of current labels. The User Advocate asks "Can users with cognitive disabilities understand the distinction?", the Product Designer notes "the current labels are opaque" and "users have no idea what that means," and the Tech Lead acknowledges this is confusing and must be resolved (renamed, removed, or explained). Replacing these labels with clear, self-explanatory terms (e.g., "Shared Formulas" vs "My Formulas" or "Project Formulas" vs "External Formulas") is a high-priority item for all three perspectives.

### Theme 5: Empty State and First-Launch Friction
The Advocate, Designer, and Tech Lead all emphasized the criticality of the first-launch experience. The Advocate describes it as the "vulnerable moment" where users have committed to trying the tool but gotten nothing back. The Designer calls it "the single most critical gap -- the app provides zero pathway from 'I just opened this' to 'I am productive.'" The Tech Lead asks "where does the onboarding state live?" reflecting the need for clear design. A comprehensive onboarding flow with helpful empty states is not optional; it's necessary for user retention.
