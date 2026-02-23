# Plan Context: beads-ide-ux-v2

**Generated:** 2026-02-23
**Source:** 3-agent parallel codebase analysis

---

## Codebase Architecture Summary

### Core Files

| File | Lines | Responsibility |
|------|-------|----------------|
| `apps/frontend/src/routes/formula.$name.tsx` | 567 | Main formula editor route, state management hub |
| `apps/frontend/src/components/formulas/visual-builder.tsx` | 643 | ReactFlow DAG visualization |
| `apps/frontend/src/components/formulas/step-editor-panel.tsx` | 357 | Step property editor panel |
| `apps/frontend/src/components/layout/command-palette.tsx` | 423 | Searchable command modal |
| `apps/frontend/src/components/formulas/formula-outline-view.tsx` | 261 | Tree view of formula steps |
| `apps/frontend/src/lib/toml-step-updater.ts` | 180 | TOML field mutation utilities |
| `apps/frontend/src/hooks/use-hotkeys.ts` | 210 | Keyboard shortcut registration |

### State Flow

```
[Disk File] → useFormulaContent() → tomlContent (useState)
                    ↓
            parseAndValidateFormula()
                    ↓
            useCook(formulaPath) → CookResult
                    ↓
            [Visual/Text/Outline Views]
```

### Key Findings

**Already Implemented:**
- ReactFlow with dagre layout
- 6-color expansion group palette
- Step editor panel with all fields
- Command palette with Cmd+K
- Basic ARIA attributes
- Sonner toast notifications
- react-resizable-panels layout

**Critical Gaps:**
- No save mechanism (changes never persisted)
- No dirty state tracking
- No navigation guards
- No beforeunload handler
- No skip navigation link
- No DAG keyboard navigation
- No Pour/Sling progress streaming

### Backend API

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/formulas/:name` | GET | Working |
| `/api/formulas/:name` | PUT | Exists but unused by frontend |
| `/api/pour` | POST | Sync execution, no streaming |
| `/api/sling` | POST | Sync execution, no streaming |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| No autosave = lost work | High | Implement explicit save + beforeunload |
| No progress streaming | Medium | Start with polling, upgrade to SSE later |
| ReactFlow keyboard nav | Medium | Custom key handler using dagre graph |
| Performance at 50+ steps | Low | Dagre already memoized, add virtualization if needed |

---

## Extension Points Identified

1. **useHotkey hook** - Add Cmd+S, Cmd+Z, Escape handlers
2. **formula.$name.tsx state** - Add `isDirty`, `savedContent` tracking
3. **visual-builder.tsx** - Add `onKeyDown` for arrow navigation
4. **command-palette.tsx** - Extend for shortcuts display panel
5. **app-shell.tsx** - Add skip navigation link
