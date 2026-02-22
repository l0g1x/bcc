import type { FormulaVariable, ProtoBead } from '@beads-ide/shared'
import dagre from '@dagrejs/dagre'
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
/**
 * Visual formula builder component.
 * Read-only DAG visualization of formula steps using React Flow.
 * TOML → visual (one-way sync); write-back is deferred to post-MVP.
 */
import { type CSSProperties, useCallback, useMemo } from 'react'

import '@xyflow/react/dist/style.css'

// --- Types ---

interface StepNodeData extends Record<string, unknown> {
  id: string
  title: string
  description: string
  priority: number
  variables: string[]
}

// --- Layout Utilities ---

const NODE_WIDTH = 220
const NODE_HEIGHT = 80

/**
 * Compute hierarchical layout using dagre.
 */
function layoutNodes(nodes: Node<StepNodeData>[], edges: Edge[]): Node<StepNodeData>[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const position = g.node(node.id)
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    }
  })
}

// --- Styles ---

const nodeContainerStyle: CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '8px',
  padding: '12px 14px',
  minWidth: `${NODE_WIDTH}px`,
  cursor: 'default',
}

const nodeTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const nodeIdStyle: CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#94a3b8',
}

const variablePortStyle: CSSProperties = {
  position: 'absolute',
  left: '-8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  top: '50%',
  transform: 'translateY(-50%)',
}

const variableChipStyle: CSSProperties = {
  fontSize: '9px',
  fontFamily: 'monospace',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '2px 6px',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
}

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
}

// --- Custom Node Component ---

function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  return (
    <div style={nodeContainerStyle}>
      {/* Target handle (incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#6366f1', border: 'none', width: 8, height: 8 }}
      />

      {/* Variable input ports */}
      {data.variables.length > 0 && (
        <div style={variablePortStyle}>
          {data.variables.map((varName) => (
            <div key={varName} style={variableChipStyle}>
              ${varName}
            </div>
          ))}
        </div>
      )}

      {/* Node content */}
      <div style={nodeTitleStyle} title={data.title}>
        {data.title}
      </div>
      <div style={nodeIdStyle}>{data.id}</div>

      {/* Source handle (outgoing edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#6366f1', border: 'none', width: 8, height: 8 }}
      />
    </div>
  )
}

const nodeTypes = { step: StepNode }

// --- Main Component ---

export interface VisualBuilderProps {
  /** Formula steps (proto beads) to visualize */
  steps: ProtoBead[]
  /** Variable definitions (used to detect which vars are used in steps) */
  vars?: Record<string, FormulaVariable>
}

/**
 * Extracts variable references from text using ${var} syntax.
 */
function extractVariables(text: string): string[] {
  const matches = text.match(/\$\{([^}]+)\}/g)
  if (!matches) return []
  return matches.map((m) => m.slice(2, -1))
}

/**
 * Visual formula builder displaying steps as a DAG.
 * Read-only: changes in TOML propagate to graph, not vice versa.
 */
export function VisualBuilder({ steps, vars }: VisualBuilderProps) {
  // Convert steps to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!steps || steps.length === 0) {
      return { initialNodes: [], initialEdges: [] }
    }

    // Create nodes
    const nodes: Node<StepNodeData>[] = steps.map((step) => {
      // Extract variable references from title and description
      const titleVars = extractVariables(step.title)
      const descVars = extractVariables(step.description)
      const allVars = [...new Set([...titleVars, ...descVars])]

      return {
        id: step.id,
        type: 'step',
        position: { x: 0, y: 0 },
        data: {
          id: step.id,
          title: step.title,
          description: step.description,
          priority: step.priority,
          variables: allVars,
        },
      }
    })

    // Create edges from needs dependencies
    const edges: Edge[] = []
    for (const step of steps) {
      if (step.needs && step.needs.length > 0) {
        for (const needId of step.needs) {
          edges.push({
            id: `${needId}->${step.id}`,
            source: needId,
            target: step.id,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            animated: false,
          })
        }
      }
    }

    // Apply dagre layout
    const layoutedNodes = layoutNodes(nodes, edges)

    return { initialNodes: layoutedNodes, initialEdges: edges }
  }, [steps])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // No-op for read-only mode
  const onConnect = useCallback(() => {}, [])

  if (!steps || steps.length === 0) {
    return <div style={emptyStateStyle}>No steps to display</div>
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={true}
        style={{ backgroundColor: '#0f172a' }}
      >
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-left"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
        <MiniMap
          nodeColor="#1e293b"
          maskColor="rgba(15, 23, 42, 0.8)"
          style={{ backgroundColor: '#1e293b' }}
        />
      </ReactFlow>
    </div>
  )
}
