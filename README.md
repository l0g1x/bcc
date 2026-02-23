# BCC - Beads Compiler Collection

Compile any codebase into a richly-connected bead graph for AI agent navigation. Like `gcc` compiles source code into machine code, `bcc` compiles a codebase into a dependency-rich bead graph optimized for graph-theoretic analysis.

<img width="3555" height="2129" alt="image" src="https://github.com/user-attachments/assets/4ac51c77-d731-4592-963c-639f08a5fa81" />


## Overview

BCC consists of:

- **Formulas** - TOML-based workflow definitions for codebase analysis
- **Beads IDE** - Web-based IDE for editing formulas and visualizing bead graphs
- **Skills** - Agent capabilities for compiling codebases into bead graphs

## Project Structure

```
bcc/
├── beads-ide/          # Web IDE for formula editing and graph visualization
│   ├── apps/
│   │   ├── frontend/   # React + Vite + TanStack Router
│   │   └── backend/    # Hono API server
│   └── packages/
│       └── shared/     # Shared types and utilities
├── formulas/           # BCC workflow formulas (WIP)
├── plans/              # Design documents and specs
└── docs/               # Documentation
```

## Beads IDE

A web-based IDE for working with Gas Town formulas and bead graphs.

### Features

- **Formula Editor** - CodeMirror 6-based TOML editor with syntax highlighting and validation
- **Visual Builder** - React Flow DAG visualization of formula steps
- **Flow View** - Dependency graph with bottleneck and gate detection
- **Outline View** - Hierarchical step listing with inline editing
- **Cook Preview** - Real-time formula expansion preview
- **Sling Workflow** - Dispatch formulas to agents
- **Pour Workflow** - Local formula instantiation
- **OpenCode Terminal** - Embedded AI assistant via xterm.js
- **Graph View** - Bead graph visualization with 9 metrics analysis
- **Command Palette** - Cmd+K quick actions

### Quick Start

```bash
cd beads-ide

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

The frontend runs on http://localhost:5173 and the backend on http://localhost:3001.

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run Biome linter |
| `pnpm check` | Run Biome checks |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm bench` | Run performance benchmarks |

### Tech Stack

- **Frontend**: React 19, Vite 6, TanStack Router, Tailwind CSS 4
- **Backend**: Hono, Node.js
- **Editor**: CodeMirror 6
- **Visualization**: React Flow, dagre
- **Terminal**: xterm.js with OpenCode SDK
- **Testing**: Vitest, Playwright
- **Linting**: Biome

## Requirements

- Node.js >= 20
- pnpm (for beads-ide)
- Gas Town CLI tools (`gt`, `bd`, `bv`) for full functionality
