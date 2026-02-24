# Codebase Context: explorer-onboarding

## App Structure
- **Monorepo layout**: TypeScript monorepo using pnpm with separate apps and packages
  - `/apps/frontend/` - React 19 + Vite app (UI)
  - `/apps/backend/` - Hono server on Node.js
  - `/packages/shared/` - Shared types and utilities

- **Frontend organization** (`/apps/frontend/src/`):
  - `routes/` - TanStack Router file-based routing (route tree auto-generated)
  - `components/` - React components organized by domain
    - `layout/` - AppShell, FormulaTree, CommandPalette, Sidebar
    - `formulas/` - Formula editor, visual builder, step editor
    - `ui/` - Reusable UI components (modals, panels, dialogs)
    - `beads/`, `results/`, `preview/`, `opencode/` - Feature-specific components
  - `contexts/` - React context providers (BeadSelection, FormulaSave, FormulaDirty, Announcement)
  - `hooks/` - Custom hooks for data fetching and business logic
  - `lib/` - Utilities (API client, TOML parsing/updating, formula parser, graph benchmarking)

- **Backend organization** (`/apps/backend/src/`):
  - `routes/` - API route handlers (formulas, beads, cook, sling, pour, graph, health)
  - `config.ts` - Configuration loader for project root and formula search paths
  - `cli.ts` - CLI invocation wrappers (bd, gt, bv commands)
  - `index.ts` - Hono app setup

## Existing UI Patterns

### Three-panel layout (AppShell)
- Left sidebar (20% default) - formula tree or icon rail when collapsed
- Center main content (55% default) - routes render here
- Right detail panel (25% default, optional) - contextual info
- Panels are resizable with localStorage persistence

### Landing page (`/` route)
- Center-aligned greeting with "Beads IDE" title
- Instructions to "Select a formula from the sidebar"
- Simple, dark themed (using custom brand color #38bdf8)

### Formula tree (sidebar)
- Groups formulas by search path (Gas Town, User, Project formulas)
- Expandable/collapsible groups with folder icons
- Individual formula items with file-code icons
- Visual dirty indicator (amber dot) for unsaved changes
- Loading skeleton animation
- Empty state showing where to place .formula.toml files
- Keyboard navigation support (Enter/Space to select)

### Modal patterns
- UnsavedChangesModal: Dialog-based with focus trap, used before navigation
- Styled with dark theme (#1e293b background, borders, buttons)
- Three-action pattern: Cancel, Discard, Save

### Command Palette (Cmd+K)
- Search-driven action dispatch
- Categories, icons, shortcuts displayed
- Dark theme with blue highlighting

### Color/Theme scheme
- Brand color: #38bdf8 (cyan-400)
- Dark backgrounds: #1e1e1e, #0f172a, #1e293b
- Text: #cccccc, #e2e8f0, #cbd5e1
- Accent: #094771 (blue for selection)
- Tailwind 4.0 + custom @theme definitions
- Zinc and slate color palette for UI

## Related Features

### Formula state management
- `useFormulas()` hook - fetches from `/api/formulas`, returns list grouped by search path
- `useFormulaDirty()` context - tracks which formulas have unsaved changes
- `useFormulaSave()` context - handles save operations
- `useFormulaContent()` hook - fetches formula TOML from backend

### Formula operations
- Cook (preview execution)
- Sling (distribute to targets)
- Pour (local execution)
- These trigger dialogs with input/output handling

### Navigation
- TanStack Router with file-based routes
- Current route: `/formula/$name` for formula editor
- Results route: `/results/$id` for result viewing
- Manual history.pushState used in FormulaTree for navigation

### API integration
- `/api/formulas` (GET) - list formulas with search paths
- `/api/formulas/:name` (PUT) - save formula content
- Connection state tracking (connected/disconnected/degraded)
- Toast notifications via Sonner for feedback

## Tech Stack

### Frontend
- React 19.0.0 + React Router (TanStack Router 1.95+)
- Vite 6.0 for dev server and bundling
- Tailwind CSS 4.0 with @tailwindcss/vite
- TypeScript 5.7
- react-resizable-panels for layout
- CodeMirror 6 for text editing
- XFlow/Dagre for graph visualization
- Sonner for toast notifications
- @xterm for terminal emulation

### Backend
- Hono 4.6 (lightweight web framework)
- Node.js server (@hono/node-server)
- CLI wrapper for bd, gt, bv commands
- TypeScript 5.7

### Build/QA
- Biome for linting/formatting
- Vitest for unit tests
- Playwright for e2e tests
- TypeScript for type checking

### State Management
React Context + local component state (no Redux/Zustand)

## Project Conventions

### File naming
- Components use PascalCase (e.g., FormulaTree.tsx)
- Hooks use camelCase prefixed with `use-` (e.g., use-formulas.ts)
- Routes in `/routes/` match file-based routing convention

### Styling
- Inline CSSProperties for most components (no CSS modules)
- Tailwind utility classes used in some places
- Dark theme default (no light mode support currently)

### API patterns
- apiFetch/apiPost/apiPut wrappers with error envelopes { data, error }
- Connection state management with listeners
- No response payload validation (trust backend structure)

### Error handling
- Error boundaries for React errors
- Try/catch for async operations
- Toast notifications for user-facing errors
- Graceful degradation (e.g., missing dirs in formula discovery)

### Accessibility
- ARIA labels and roles used consistently
- Skip-to-main-content link in root layout
- Semantic HTML where possible
- Focus management in modals and components

## Key Files to Reference

### Frontend
- `/apps/frontend/src/routes/__root.tsx` - Root layout structure, error boundary
- `/apps/frontend/src/components/layout/formula-tree.tsx` - Sidebar formula listing (main to refactor)
- `/apps/frontend/src/components/layout/app-shell.tsx` - Three-panel layout component
- `/apps/frontend/src/contexts/` - Context patterns for state
- `/apps/frontend/src/hooks/use-formulas.ts` - Formula fetch hook
- `/apps/frontend/src/lib/api.ts` - API client with error handling

### Backend
- `/apps/backend/src/config.ts` - Project root and search path logic (essential for onboarding)
- `/apps/backend/src/routes/formulas.ts` - Formula discovery and listing
- `/apps/backend/src/index.ts` - Server setup

### Shared
- `/packages/shared/src/ide-types.ts` - Formula and search path types
- `/packages/shared/src/index.ts` - Type exports

### Configuration
- `/apps/frontend/vite.config.ts` - Build and proxy setup
- `/apps/frontend/src/app.css` - Theme variables and Tailwind config
- `/apps/frontend/package.json` - Framework versions and scripts
