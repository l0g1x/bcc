# Beads IDE UX v2 - Codebase Context

## Overview

Beads IDE is a formula editor and molecule visualizer built with React 19, TypeScript, and modern web technologies. It provides an IDE-like interface for editing TOML-based formulas and visualizing their execution as dependency graphs.

## Technology Stack

- **Framework:** React 19.0 with TypeScript 5.7
- **Router:** TanStack React Router 1.95
- **State:** React Context + Hooks (no Redux/Zustand)
- **Styling:** Tailwind CSS 4.0 + inline CSSProperties
- **Graph Visualization:** XyFlow (ReactFlow) 12.10 + Dagre 2.0 (layout)
- **Code Editor:** CodeMirror 6.0
- **Notifications:** Sonner 2.0 (toast library)
- **Panels:** react-resizable-panels 2.1 (draggable layouts)
- **Data:** smol-toml 1.6 (TOML parsing)

## Architecture

### Route Structure
```
/                     → Landing page (welcome screen)
/formula/:name        → Formula editor (text/visual modes)
/results/:id          → Results viewer (list/wave/graph views)
```

### Component Organization
```
/components/
  ├── layout/           # Core UI structure (app-shell, sidebar, command-palette)
  ├── formulas/         # Formula editing (visual-builder, text-editor, step-editor-panel)
  ├── results/          # Visualization (graph-view, wave-view, graph-controls)
  ├── preview/          # Preview displays
  ├── beads/            # Bead details
  └── ui/               # Generic UI elements (error-page, offline-banner)
```

### Layout Architecture
- 3-panel resizable layout: Sidebar (20%) | Main (55%) | Detail (25%)
- Panel sizes persist to localStorage
- Sidebar collapsible to icon rail (4% width)

## Current UX Flows

### 1. Formula Editing Flow
1. Open Beads IDE → Landing page
2. Click formula in sidebar → Navigate to /formula/:name
3. Text Mode: Edit TOML in CodeMirror with syntax highlighting
4. Visual Mode: See DAG of steps, click nodes to edit in StepEditorPanel
5. Variables panel on right for editing variable values
6. Cook Preview button triggers re-parse

### 2. Execution Flows
- **Pour (Local):** Create beads locally from formula
- **Sling (Remote):** Dispatch formula to agents/crews

### 3. Results Viewing
- **List View:** Flat bead list with status indicators
- **Wave View:** Beads grouped by execution waves
- **Graph View:** Interactive dependency graph with clustering, fisheye, focus mode

## Design System

### Color Palette (Dark Theme)
- Backgrounds: `#1e1e1e`, `#252526`, `#1e293b`, `#0f172a`
- Text: `#e5e7eb`, `#cccccc` (light), `#9ca3af`, `#6b7280` (secondary)
- Primary action: `#3b82f6` (blue)
- Success: `#89d185` (green)
- Error: `#f87171`, `#ef4444` (red)
- Warning: `#f59e0b` (amber)

### Typography
- Sans: Inter, system-ui
- Mono: JetBrains Mono, Menlo
- Body: 13-14px
- Headings: 16-24px, weight 600

### Spacing
- Micro: 2-4px
- Compact: 8px
- Standard: 12-16px
- Generous: 24px

## Recent Changes (Already Implemented)

### Step Editor Panel
- New `StepEditorPanel` component for inline step editing in visual mode
- Fields: ID (read-only), Title, Description, Priority (0-10), Dependencies
- `NeedsSelector` component for multi-select dependency editing
- `toml-step-updater.ts` for TOML manipulation

### Expansion Group Visualization
- Container nodes wrapping expansion step groups
- Color-coded groups (indigo, emerald, amber, red, purple, sky)
- Cross-group edges highlighted (amber, dashed, animated)
- Group headers showing "Step N: Name" with step count

## Key Files

### Routes
- `apps/frontend/src/routes/__root.tsx` - Root layout
- `apps/frontend/src/routes/formula.$name.tsx` - Formula editor (550+ lines)
- `apps/frontend/src/routes/results.$id.tsx` - Results viewer (370+ lines)

### Core Components
- `apps/frontend/src/components/formulas/visual-builder.tsx` - ReactFlow DAG
- `apps/frontend/src/components/formulas/text-editor.tsx` - CodeMirror editor
- `apps/frontend/src/components/formulas/step-editor-panel.tsx` - Step editing
- `apps/frontend/src/components/results/graph-view.tsx` - Dependency graph

### Layout
- `apps/frontend/src/components/layout/app-shell.tsx` - 3-panel layout
- `apps/frontend/src/components/layout/sidebar.tsx` - Navigation
- `apps/frontend/src/components/layout/command-palette.tsx` - Cmd+K

## Accessibility Status

### Current Support
- ARIA roles on major sections (nav, main, aside)
- Keyboard navigation (Cmd+K, arrow keys in command palette)
- Status icons + colors (not color-only)
- Focus management in dialogs

### Known Gaps
- Form labels not using `<label htmlFor>`
- No skip-to-main navigation
- No `prefers-reduced-motion` support
- Tree structure uses divs instead of `<ul>/<li>`
- Some contrast issues with secondary text
