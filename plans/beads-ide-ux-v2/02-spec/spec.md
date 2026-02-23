# Beads IDE Formula Visualization v2

## Summary

Replace the current ReactFlow DAG visualization with a **nested outline view** that presents formulas as an expandable tree structure. This provides clearer hierarchy, better context visibility, and a more familiar interaction model.

## Problem Statement

The current visual builder has several UX issues:

1. **Step progression unclear** - DAG layout doesn't convey execution order intuitively
2. **Grouping feels weak** - Container nodes don't strongly convey expansion hierarchy
3. **Missing context** - Variables, metadata, and outputs are disconnected from the visualization
4. **Clunky editing** - Clicking nodes to edit in a side panel feels indirect

## Solution: Outline View

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ ◆ beads-workflow                                    v1  │ ↗ │
│   workflow • 12 steps • 2 expansions                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ▼ Variables                                           (1)   │
│   └─ feature ─────────────── [________________] required    │
│                                                             │
│ ▼ Step 1: Beads Creation                              (7)   │
│   │ expanded from: beads-creation-expansion                 │
│   │                                                         │
│   ├─● 1.1  Gather context                                   │
│   │       Collect codebase information...                   │
│   │                                                         │
│   ├─● 1.2  Draft structure                      needs: 1.1  │
│   │       Create initial beads hierarchy...                 │
│   │                                                         │
│   ├─● 1.3  Review completeness                  needs: 1.2  │
│   ├─● 1.4  Review dependencies                  needs: 1.3  │
│   ├─● 1.5  Review clarity                       needs: 1.4  │
│   ├─● 1.6  Execute                              needs: 1.5  │
│   └─● 1.7  Report and commit                    needs: 1.6  │
│                                                             │
│ ▼ Step 2: Beads Review                                (5)   │
│   │ expanded from: beads-review-expansion                   │
│   │ ⟵ needs: Step 1                                        │
│   │                                                         │
│   ├─● 2.1  Load inputs                                      │
│   ├─● 2.2  Dispatch reviewers                   needs: 2.1  │
│   ├─● 2.3  Consolidate                          needs: 2.2  │
│   ├─● 2.4  Present and resolve                  needs: 2.3  │
│   └─● 2.5  Commit                               needs: 2.4  │
│                                                             │
│ ─ Complete                                      needs: Step 2│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Elements

#### 1. Formula Header
- Formula name with icon indicating type (workflow, template, etc.)
- Version badge
- Summary line: type, total steps, expansion count
- Quick action: open in text editor

#### 2. Variables Section
- Collapsible section showing all formula variables
- Inline editing for variable values (no side panel needed)
- Required indicator, type hints, descriptions on hover

#### 3. Expansion Groups
- Collapsible containers for each expansion
- Header shows: step number, title, step count
- Subheader shows: source expansion formula name
- Cross-group dependency indicator when group depends on previous group

#### 4. Step Items
- Numbered within their group (1.1, 1.2, etc.)
- Status indicator (●) - can show open/done/blocked for execution view
- Title (primary)
- Description preview (secondary, truncated)
- Dependency badge showing what this step needs
- Click to expand inline or select for side panel editing

#### 5. Dependency Visualization
- Inline badges showing `needs: X.Y` for intra-group deps
- Group-level indicator for cross-group deps (`⟵ needs: Step 1`)
- Optional: connecting lines on left margin for visual tracing

### Interaction Model

#### Navigation
- **Click step** → Select for editing (side panel or inline expand)
- **Click group header** → Collapse/expand group
- **Click variable** → Inline edit value
- **Keyboard**: Arrow keys navigate, Enter to select, Space to expand/collapse

#### Editing Modes

**Option A: Side Panel (Current)**
- Click step → StepEditorPanel opens on right
- Edit fields in panel
- Changes reflect in outline

**Option B: Inline Expand (Preferred)**
- Click step → Expands inline to show editable fields
- Edit directly in the outline
- More direct, less context switching

```
├─● 1.2  Draft structure                          needs: 1.1  │
│       ┌─────────────────────────────────────────────────┐   │
│       │ title:    [Draft structure____________]         │   │
│       │ priority: [2] ●●○○○○○○○○                        │   │
│       │ needs:    [✓ 1.1 Gather context]                │   │
│       │ description:                                    │   │
│       │ ┌─────────────────────────────────────────────┐ │   │
│       │ │ Create initial beads hierarchy based on    │ │   │
│       │ │ the gathered context...                    │ │   │
│       │ └─────────────────────────────────────────────┘ │   │
│       └─────────────────────────────────────────────────┘   │
```

### Component Architecture

```
FormulaOutlineView
├── FormulaHeader
│   ├── FormulaIcon
│   ├── FormulaTitle
│   ├── VersionBadge
│   └── FormulaMeta
├── VariablesSection
│   └── VariableRow (inline editable)
├── ExpansionGroup (repeated)
│   ├── GroupHeader
│   │   ├── CollapseToggle
│   │   ├── GroupNumber
│   │   ├── GroupTitle
│   │   ├── StepCount
│   │   └── CrossGroupDep
│   ├── ExpansionSource
│   └── StepList
│       └── StepItem (repeated)
│           ├── StepNumber
│           ├── StatusIndicator
│           ├── StepTitle
│           ├── StepDescription
│           ├── DependencyBadge
│           └── InlineEditor (when expanded)
└── CompleteStep
```

### State Management

```typescript
interface OutlineState {
  // Collapse state per group
  expandedGroups: Set<string>

  // Currently selected step (for editing)
  selectedStepId: string | null

  // Inline editing mode
  inlineEditingStepId: string | null

  // Variable values (for inline editing)
  varValues: Record<string, string>
}
```

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `formula-outline-view.tsx` | Create | New outline view component |
| `expansion-group.tsx` | Create | Collapsible expansion group |
| `step-item.tsx` | Create | Step row with inline editing |
| `variables-section.tsx` | Create | Inline variable editor |
| `formula-header.tsx` | Create | Formula metadata header |
| `formula.$name.tsx` | Modify | Add "Outline" view mode |
| `visual-builder.tsx` | Keep | Retain for users who prefer DAG |

### View Mode Toggle

Add Outline as a third view mode:

```
[ Text ]  [ Outline ]  [ Visual ]
```

- **Text**: Raw TOML editing (CodeMirror)
- **Outline**: Tree structure (new)
- **Visual**: ReactFlow DAG (existing)

Keep all three to allow experimentation and find what works best for different use cases.

## Implementation Phases

### Phase 1: Core Outline View
- FormulaOutlineView component
- ExpansionGroup with collapse/expand
- StepItem with selection
- Basic styling matching current design system

### Phase 2: Inline Editing
- VariablesSection with inline inputs
- StepItem inline expand for editing
- TOML sync on edit

### Phase 3: Polish
- Keyboard navigation
- Dependency visualization (connecting lines)
- Animations for expand/collapse
- Step reordering via drag

## Open Questions

1. Should Graph view be kept or removed entirely?
2. Should step numbers be hierarchical (1.1, 1.2) or flat (1, 2, 3...)?
3. How to handle very long descriptions - truncate or scroll?
4. Should there be a "compact" mode that hides descriptions?
