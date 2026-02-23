# Beads IDE UX v2 - Scope Questions

## Priority 0 (Must Answer Before Spec)

### Visual Design
1. **Design system consistency:** Should we migrate all inline CSSProperties to Tailwind classes for consistency, or keep the hybrid approach?
2. **Theme support:** Should we add light theme support, or focus solely on dark theme polish?
3. **Component library:** Should we adopt a component library (Radix, shadcn/ui) for accessibility primitives, or build custom?

### Accessibility
4. **WCAG level target:** What accessibility compliance level should we target (A, AA, or AAA)?
5. **Screen reader priority:** Which flows are highest priority for screen reader optimization?

### UX Flows
6. **Unsaved changes:** How should unsaved changes be handled - auto-save, explicit save, or prompt on navigation?
7. **Keyboard-first scope:** Should keyboard shortcuts cover all actions, or just primary workflows?

## Priority 1 (Should Answer)

### Visual Builder
8. **Step drag-reorder:** Should users be able to reorder steps by dragging in visual mode?
9. **Edge editing:** Should dependency edges be editable by dragging (connect/disconnect)?
10. **Undo/redo scope:** Should undo/redo work across text and visual modes, or be mode-specific?

### Navigation
11. **Breadcrumbs:** Should we add breadcrumb navigation for context (Formula > Step > Field)?
12. **Recent formulas:** Should sidebar show recently opened formulas?
13. **Formula search:** Should search be in sidebar or command palette only?

### Feedback
14. **Auto-save indicator:** How should auto-save status be shown (explicit indicator, or subtle)?
15. **Error recovery:** Should we offer "undo last change" on parse errors?

## Priority 2 (Nice to Have)

### Performance
16. **Lazy loading:** Should formula content be lazy-loaded on navigation?
17. **Virtual scrolling:** Should large step lists use virtual scrolling?

### Polish
18. **Animations:** What animation level is appropriate (none, subtle, full)?
19. **Loading skeletons:** Should all loading states use skeleton loaders?

### Advanced Features
20. **Formula templates:** Should we offer starter templates for common patterns?
21. **Diff view:** Should we show diffs when comparing formula versions?
22. **Collaboration:** Any multi-user editing considerations?

## Priority 3 (Future Consideration)

23. **Mobile support:** Any mobile/tablet considerations?
24. **Offline editing:** Should formulas be editable offline?
25. **Plugin system:** Should the editor support plugins/extensions?
