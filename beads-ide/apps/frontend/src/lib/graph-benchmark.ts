/**
 * Graph Library Benchmark Harness
 *
 * Evaluates React Flow, Cytoscape.js, and D3.js for graph rendering performance.
 * This is temporary spike code for library selection, not production code.
 *
 * Test parameters:
 * - 200 nodes, ~300 edges (1.5 edges/node average)
 * - Force-directed layout
 * - Target: <1s render, <100ms interaction latency
 */

export interface BenchmarkNode {
  id: string
  label: string
  x?: number
  y?: number
}

export interface BenchmarkEdge {
  id: string
  source: string
  target: string
}

export interface BenchmarkGraph {
  nodes: BenchmarkNode[]
  edges: BenchmarkEdge[]
}

export interface BenchmarkResult {
  library: string
  initialRenderMs: number
  panLatencyMs: number
  zoomLatencyMs: number
  dragLatencyMs: number
  hierarchicalLayoutSupport: boolean
  manualPositioningSupport: boolean
  eventApiQuality: 'excellent' | 'good' | 'limited'
  notes: string
}

/**
 * Generate a synthetic graph with the specified number of nodes.
 * Creates approximately 1.5 edges per node on average.
 */
export function generateSyntheticGraph(nodeCount: number): BenchmarkGraph {
  const nodes: BenchmarkNode[] = []
  const edges: BenchmarkEdge[] = []

  // Generate nodes in a grid-like initial layout
  const gridSize = Math.ceil(Math.sqrt(nodeCount))
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      x: (i % gridSize) * 100 + Math.random() * 20,
      y: Math.floor(i / gridSize) * 100 + Math.random() * 20
    })
  }

  // Generate edges - target ~1.5 edges per node = 300 edges for 200 nodes
  const targetEdges = Math.floor(nodeCount * 1.5)
  const edgeSet = new Set<string>()

  // First, create a spanning tree to ensure connectivity
  for (let i = 1; i < nodeCount; i++) {
    const source = Math.floor(Math.random() * i)
    const edgeKey = `${source}-${i}`
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey)
      edges.push({
        id: `edge-${edges.length}`,
        source: `node-${source}`,
        target: `node-${i}`
      })
    }
  }

  // Add random edges until we reach target
  while (edges.length < targetEdges) {
    const source = Math.floor(Math.random() * nodeCount)
    const target = Math.floor(Math.random() * nodeCount)
    if (source !== target) {
      const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push({
          id: `edge-${edges.length}`,
          source: `node-${source}`,
          target: `node-${target}`
        })
      }
    }
  }

  return { nodes, edges }
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = performance.now()
  const result = await fn()
  const timeMs = performance.now() - start
  return { result, timeMs }
}

/**
 * Measure execution time of a sync function
 */
export function measureTimeSync<T>(fn: () => T): { result: T; timeMs: number } {
  const start = performance.now()
  const result = fn()
  const timeMs = performance.now() - start
  return { result, timeMs }
}

/**
 * Run multiple iterations and return average time
 */
export async function measureAverage(
  fn: () => Promise<void> | void,
  iterations: number = 10
): Promise<number> {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    times.push(performance.now() - start)
  }
  return times.reduce((a, b) => a + b, 0) / times.length
}

/**
 * Library capability assessment
 */
export interface LibraryCapabilities {
  hierarchicalLayout: boolean
  manualPositioning: boolean
  clickEvents: boolean
  hoverEvents: boolean
  dragEvents: boolean
  customNodeRendering: boolean
  edgeLabels: boolean
  zoomControls: boolean
  panControls: boolean
  minimap: boolean
}

export const REACTFLOW_CAPABILITIES: LibraryCapabilities = {
  hierarchicalLayout: true, // via dagre or elkjs integration
  manualPositioning: true,  // native drag support
  clickEvents: true,        // onNodeClick, onEdgeClick
  hoverEvents: true,        // onNodeMouseEnter/Leave
  dragEvents: true,         // onNodeDrag, onNodeDragStop
  customNodeRendering: true,// custom node types
  edgeLabels: true,         // edge label prop
  zoomControls: true,       // built-in controls
  panControls: true,        // built-in controls
  minimap: true             // MiniMap component
}

export const CYTOSCAPE_CAPABILITIES: LibraryCapabilities = {
  hierarchicalLayout: true, // cola, dagre extensions
  manualPositioning: true,  // position property
  clickEvents: true,        // cy.on('tap')
  hoverEvents: true,        // cy.on('mouseover')
  dragEvents: true,         // cy.on('drag')
  customNodeRendering: true,// style selectors
  edgeLabels: true,         // label style
  zoomControls: true,       // zoom API
  panControls: true,        // pan API
  minimap: false            // requires extension
}

export const D3_CAPABILITIES: LibraryCapabilities = {
  hierarchicalLayout: true, // d3-hierarchy
  manualPositioning: true,  // direct DOM manipulation
  clickEvents: true,        // selection.on('click')
  hoverEvents: true,        // selection.on('mouseover')
  dragEvents: true,         // d3-drag
  customNodeRendering: true,// SVG/Canvas freedom
  edgeLabels: true,         // text elements
  zoomControls: true,       // d3-zoom
  panControls: true,        // d3-zoom
  minimap: false            // must implement
}

/**
 * Format benchmark results as markdown table
 */
export function formatResultsTable(results: BenchmarkResult[]): string {
  const header = '| Library | Initial Render | Pan Latency | Zoom Latency | Drag Latency | Hierarchical | Manual Position | Events |'
  const separator = '|---------|----------------|-------------|--------------|--------------|--------------|-----------------|--------|'

  const rows = results.map(r => {
    const renderStatus = r.initialRenderMs < 1000 ? `${r.initialRenderMs.toFixed(0)}ms` : `${r.initialRenderMs.toFixed(0)}ms`
    const panStatus = r.panLatencyMs < 100 ? `${r.panLatencyMs.toFixed(1)}ms` : `${r.panLatencyMs.toFixed(1)}ms`
    const zoomStatus = r.zoomLatencyMs < 100 ? `${r.zoomLatencyMs.toFixed(1)}ms` : `${r.zoomLatencyMs.toFixed(1)}ms`
    const dragStatus = r.dragLatencyMs < 100 ? `${r.dragLatencyMs.toFixed(1)}ms` : `${r.dragLatencyMs.toFixed(1)}ms`

    return `| ${r.library} | ${renderStatus} | ${panStatus} | ${zoomStatus} | ${dragStatus} | ${r.hierarchicalLayoutSupport ? 'Yes' : 'No'} | ${r.manualPositioningSupport ? 'Yes' : 'No'} | ${r.eventApiQuality} |`
  })

  return [header, separator, ...rows].join('\n')
}
