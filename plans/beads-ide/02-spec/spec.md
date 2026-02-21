# Beads IDE Specification

**Version:** 1.0 (Draft)
**Date:** 2026-02-21
**Status:** Brainstorming Complete, Pending Review

---

## Overview

### Positioning Statement

**"A work-graph IDE for agent orchestration"**

The Beads IDE is a web-based tool for designing formulas, executing multi-model workflows, and tracking the resulting bead graphs. It replaces scattered CLI tools (`bd`, `bv`) with a unified workspace that surfaces visualization, discoverability, and execution tracking in one interface.

### What This Is NOT

- Not a project management tool (no kanban, sprints, time tracking)
- Not a team collaboration platform (single operator in v1)
- Not a real-time collaborative editor
- Not an execution runtime (separate from Gas Town)

---

## Core Decisions

### Identity & Scope

| Decision | Answer |
|----------|--------|
| Target user | Single operator (v1) |
| Product feel | Hybrid - list view + graph view, user switches |
| Primary workflow | Formula-centric: design → execute → track |
| Authoring model | NL + Formula-first (AI assists translation) |
| Core pain solved | Both authoring AND review of work graphs |
| IDE value over CLI | All: visualization, discoverability, speed, integration |
| Multi-model convergence | Core workflow - v1 scope |
| Data layer | Dolt via dolt-server / DoltHub remotes |

### What's In Scope (v1)

- Dolt integration (read/write via dolt-server, remotes)
- Formula authoring (visual + text hybrid builder)
- Multi-model convergence workflow
- Runtime visibility (bead status from formula execution)
- Source code bridging (tentative - may revisit)
- Full molecule tracking (which molecule spawned which beads)

### What's Out of Scope (v1)

- Real-time collaboration
- Custom field/type creation (use built-in schema)
- Import from external tools (Jira, Linear, etc.)
- Kanban boards, sprint planning, time tracking
- Notifications system

---

## Terminology

The IDE uses a chemistry metaphor:

| Term | User-Facing | Definition |
|------|-------------|------------|
| Bead | Context-dependent | Collective noun for work items. UI shows type-specific names. |
| Task/Epic/Bug/etc. | Yes | Specific bead types shown to users |
| Formula | Yes | Template defining a workflow |
| Molecule | Yes | Instantiated workflow (poured from formula) |
| Atom | Yes | Individual step within a molecule |
| Wisp | Internal | Ephemeral atom (vapor phase, auto-compacts) |
| Proto | Internal | Preview beads before pour (hidden from users) |

### Terminology Simplifications

- "Dependency" everywhere (not "bond" or "edge")
- Show top-4 dependency types (blocks, parent-child, related, discovered-from)
- Hide BCC compilation phases (SCAN/ANALYZE/CONNECT/ENRICH)
- "Phase" only refers to bead lifecycle (liquid/vapor)

---

## Architecture

### Data Layer

- **Dolt** as the database (not SQLite)
- Connect to dolt-server or DoltHub remotes
- IDE only manages Dolt branches (not Git branches)
- Git branches managed externally (CLI, GitHub)

### Branching Model

**Branch-per-initiative:**

```
draft/<category>/<title>
```

- Category: feature, enhancement, refactor, bug, research
- Created when starting a workflow chain
- Multiple formulas execute on same branch (spec → plan → beads-creation)
- Only merge to main after full chain completes
- Main = finalized beads, exposed to runtime (Gas Town)

**Key constraint:** No auto-merge to main. Always requires explicit human approval.

### IDE Replaces bv

All 9 graph metrics and visualization built into IDE:
- PageRank, betweenness, HITS, critical path
- Eigenvector, degree, density, cycles, topo sort

---

## User Interface

### Reference UI Patterns

Blend of:
- **Linear** - list view, minimal chrome, keyboard-first
- **n8n/Node-RED** - formula builder canvas
- **VS Code** - panels, command palette, file tree

### Layout

- **Multi-panel** (VS Code style) on desktop
- **Adaptive** - simplified single-panel on small screens
- **Resizable panels**: file tree (left) + main editor + side panel (right)

### Navigation

- **Beads as files/folders** in left sidebar file tree (VS Code/Cursor pattern)
- **Default view**: Remember last (list or graph)
- **Command palette**: Cmd+K for quick actions
- **TanStack Hotkeys** for keyboard shortcuts

### Graph View

**Multiple layout algorithms** (user switches):
- Force-directed (clusters/relationships)
- Hierarchical (parent-child structure)
- Manual (full control, positions saved)

**Dense graph handling** (50-200 beads):
- Default: clustered + filtered (~20-30 visible nodes)
- Auto-cluster by epic/molecule
- Filter to active work (hide closed/archived)
- All simplification strategies available:
  - Focus mode (N-hop neighborhood)
  - Semantic zoom
  - Fisheye distortion

### Formula Builder

- **Same workspace** as panel alongside graph/list
- **Hybrid**: visual node-based + "view source" text toggle
- Both modes stay in sync
- Variables UI: form, inline editing, NL prompt (all available)

### Sidecar LLM Exploration

New feature:
- LLM chat panel alongside main workspace
- Explore/iterate on ideas conversationally
- Import results + chat history into IDE
- Preserves reasoning provenance

---

## Workflows

### Creating a New Initiative

**Entry points** (all available):
- Form (modal with category dropdown + title)
- Command palette (Cmd+K → "new feature: my-feature-name")
- NL prompt ("I want to build a beads IDE")

**Flow:**
1. User initiates new initiative
2. Creates `draft/<category>/<title>` branch
3. Opens formula gallery (or existing work if data exists)

### Formula Execution (Cook/Pour)

**Variable binding:**
- Form (generated from formula variables)
- Inline (editable placeholders)
- NL prompt (AI extracts variables)

**Preview (cook):**
- Split view: formula definition left, preview beads right
- No "proto" terminology - shows "Here's what will be created"

**Confirm (pour):**
- Button + summary: "Pour 12 beads with 8 dependencies?"
- One click to confirm

**Execution:**
- Foreground with escape hatch
- Watch progress, can "send to background" if slow
- Notify when complete

### Multi-Model Convergence

**When:** At designated synthesis stages within each formula

**Flow:**
1. Formula dispatches same prompt to 3 models (Opus, GPT, Gemini)
2. Each model writes beads to its own branch
3. AI clusters semantically similar beads
4. AI proposes synthesized canonical for each cluster
5. User reviews: **bulk approve with exceptions**
6. Canonical beads created with `derived-from` links
7. Source beads preserved (provenance)

**Canonical decision mode:** Configurable default
- AI proposes, human approves (most control)
- AI decides, human reviews (faster)
- Human decides, AI assists (most manual)

### Final Review Before Merge

After completing full chain (spec → plan → beads-creation):

1. **Summary view**: All beads created, grouped by formula/stage
2. **Diff against main**: What's being added
3. **Quality gate**: Graph metrics pass/fail (with override)
4. **Checklist**: Workflow verification (spec ✓, plan ✓, beads ✓)
5. **Manual approval**: Explicit merge to main

### Runtime Visibility

- **Status only**: Beads show status (open → in_progress → closed)
- **Molecule tracking**: Which molecule spawned which beads, step progress
- No live agent details or activity feed

---

## First-Run Experience

1. **Connect to Dolt** (dolt-server or DoltHub)
2. **If empty**: Formula gallery ("Pick a workflow to start")
3. **If data exists**: Show existing molecules/beads (auto-detect)

---

## Auto-Filled Answers (Best Practices)

These questions were answered based on industry standards and codebase context:

### Editing & UX
- Full undo/redo across all operations (Ctrl+Z)
- Formula pour is transactional with one-click rollback
- Auto-save with debounce (500ms)
- Rich-text via TipTap/ProseMirror for description fields
- Side panel for bead detail editing

### Graph Interaction
- Drag-from-handle for edge creation
- Three methods: drag, context menu, keyboard mode
- Side panel co-present with graph (no full-page navigation)
- Faceted filtering (status, type, assignee, labels, priority)

### Accessibility (WCAG 2.1 AA)
- Screen reader tree/list alternative for graph
- Shape + icon as primary differentiators (not color alone)
- Keyboard navigation for all operations
- Command palette (Cmd+K)
- Minimum 1280x720 screen support

### Visual Encoding
- Shape + icon for bead types (hexagon=epic, circle=task, etc.)
- Line-style groups for edge types (solid=blocks, dashed=related, etc.)
- Skeleton loading (progressive, no full-screen spinner)
- Git-style ahead/behind indicators for branches

### Schema & Fields
- Progressive disclosure (start minimal, reveal via "Add field")
- Schema-driven rendering (not hardcoded)
- Required to create bead: title only

### Quality & Validation
- Ambient metrics (always visible health panel)
- Density warnings at >0.10, red at >0.12
- Prevent cycles, enforce required fields
- Warn for soft constraints (don't block)

---

## Technical Decisions

### Dependencies
- TanStack Hotkeys for keyboard shortcuts
- TipTap/ProseMirror for rich text editing
- Dolt as data layer (not SQLite)

### What the IDE Does NOT Manage
- Git branches (managed externally)
- Formula execution runtime (Gas Town)
- Agent orchestration (separate system)

---

## Open Questions (TBD)

1. **Source code bridging details**: Exact interaction model for bead-to-code links
2. **Review workflow details**: Specific UI for the approval gate before merge
3. **Sidecar LLM integration**: How chat history is linked to resulting beads

---

## Success Criteria

1. User can create a valid bead graph using only the IDE (no CLI knowledge required)
2. Formula authoring is faster than TOML editing
3. Multi-model convergence workflow completes in under 30 minutes
4. Graph remains usable at 200 beads
5. IDE replaces bv for daily visualization needs

---

## Q&A Reference

This spec was generated from 44 questions answered across 4 rounds of brainstorming dialogue. For full question-answer details, see:
- `plans/beads-ide/01-scope/questions.md` (187 scope questions)
- `plans/beads-ide/01-scope/question-triage.md` (triage and interview plan)

---

## Appendix: Chemistry Metaphor

```
Formula → (cook/pour) → Molecule → (contains) → Atoms → (ephemeral) → Wisps
   │                        │                       │
   │                        │                       └── Individual steps
   │                        └── Instantiated workflow
   └── Template definition
```

**Lifecycle phases:**
- **Liquid**: Persistent beads (survive indefinitely)
- **Vapor**: Ephemeral beads (auto-compact after TTL)
