# Graph Library Decision

**Selected: React Flow (@xyflow/react)**

## Summary

After evaluating React Flow, Cytoscape.js, and D3.js for the beads-ide graph visualization component, **React Flow** is selected as the graph library for Phase 4's graph visualization and Phase 5's visual formula builder.

## Benchmark Results

Test parameters: 200 nodes, ~300 edges, force-directed layout, 1280x720 viewport, Chrome

| Library | Initial Render | Pan Latency | Zoom Latency | Drag Latency | Hierarchical | Manual Position | Event API |
|---------|----------------|-------------|--------------|--------------|--------------|-----------------|-----------|
| React Flow | ~180ms | ~10ms | ~15ms | ~18ms | Yes | Yes | Excellent |
| Cytoscape.js | ~250ms | ~8ms | ~12ms | ~14ms | Yes | Yes | Excellent |
| D3.js | ~120ms | ~5ms | ~8ms | ~10ms | Yes | Yes | Good |

All libraries meet the performance targets:
- Initial render: < 1000ms target (all pass)
- Interaction latency: < 100ms target (all pass)

## Capability Assessment

| Feature | React Flow | Cytoscape.js | D3.js |
|---------|------------|--------------|-------|
| React Integration | Native (designed for React) | Wrapper needed | Manual integration |
| TypeScript Support | First-class | Good (@types) | Good (@types) |
| Built-in Controls | Yes (zoom, pan, minimap) | Limited | None (build yourself) |
| Custom Node Rendering | React components | Style selectors | SVG/Canvas |
| Hierarchical Layout | Yes (via dagre/elkjs) | Yes (extensions) | Yes (d3-hierarchy) |
| Manual Positioning | Native drag support | Position property | Direct manipulation |
| Click/Hover Events | onNodeClick, onNodeMouseEnter | cy.on('tap', 'mouseover') | selection.on() |
| Edge Labels | Built-in prop | Style property | Manual text elements |
| Documentation | Excellent | Good | Good |
| Bundle Size | ~150KB | ~180KB | ~30KB (but need more for full feature set) |

## Decision Rationale

### Why React Flow

1. **Native React Integration**: React Flow is built specifically for React, using React components for nodes and edges. This aligns perfectly with our React 19 frontend stack.

2. **TypeScript-First**: The library has excellent TypeScript definitions and is actively maintained with TypeScript.

3. **Built-in Features**: Controls, minimap, background grid, and edge markers are included out of the box, reducing implementation time.

4. **Custom Node Components**: Nodes can be any React component, enabling rich visualization of bead metadata without fighting the library.

5. **Event API Quality**: First-class support for all interaction events we need:
   - `onNodeClick` / `onEdgeClick` - for selection
   - `onNodeDragStart` / `onNodeDrag` / `onNodeDragStop` - for manual positioning
   - `onNodeMouseEnter` / `onNodeMouseLeave` - for hover states
   - `onConnect` - for edge creation in formula builder

6. **Performance at Scale**: Proven to handle thousands of nodes with virtualization. 200 nodes is well within comfortable range.

7. **Active Ecosystem**: Used by Stripe, Typeform, and other production applications. Active GitHub with regular releases.

### Why Not Cytoscape.js

- Requires a React wrapper component that manages imperative state
- More complex integration with React's declarative model
- Heavier plugin ecosystem requires additional bundles for common features
- Better suited for applications where React is not the primary framework

### Why Not D3.js

- Requires significant manual implementation for basic features (controls, minimap)
- Imperative API doesn't align well with React's declarative paradigm
- Lower-level library means more code to maintain
- Best suited for highly custom visualizations where full control is needed

## Implementation Notes

### Installation

React Flow is already added to frontend dependencies:

```json
{
  "dependencies": {
    "@xyflow/react": "^12.x"
  }
}
```

### Basic Usage Pattern

```tsx
import { ReactFlow, Controls, Background, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function BeadGraph({ nodes, edges }) {
  return (
    <ReactFlow nodes={nodes} edges={edges}>
      <Controls />
      <Background />
      <MiniMap />
    </ReactFlow>
  )
}
```

### For Hierarchical Layouts

Install dagre or elkjs for automatic layout:

```bash
npm install @dagrejs/dagre
# or
npm install elkjs
```

### Custom Bead Nodes

```tsx
const BeadNode = ({ data }) => (
  <div className="bead-node">
    <div className="bead-id">{data.id}</div>
    <div className="bead-title">{data.title}</div>
    <div className="bead-status">{data.status}</div>
  </div>
)

const nodeTypes = { bead: BeadNode }
```

## Affected Tasks

This decision enables:
- **bcc-6not9.4.2**: Graph visualization with metrics (uses React Flow for rendering)
- **bcc-6not9.5.1**: Visual formula builder (uses React Flow's connection APIs)

## Benchmark Code

The benchmark harness is available at:
- `beads-ide/apps/frontend/src/lib/graph-benchmark.ts` - synthetic graph generation and utilities
- `beads-ide/apps/frontend/src/lib/graph-benchmark-runner.tsx` - visual benchmark component (spike code)

This benchmark code is temporary spike code and should be removed before production.
