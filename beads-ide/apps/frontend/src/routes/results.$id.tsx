/**
 * Results route for viewing bead collections with switchable views.
 * Supports three view modes: list, wave, and graph.
 */
import { createFileRoute } from '@tanstack/react-router'
import type { GraphEdge, GraphNode } from '@beads-ide/shared'
import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { GraphView, WaveView } from '../components/results'

// --- Types ---

type ViewMode = 'list' | 'wave' | 'graph'

// --- Styles ---

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#1e1e1e',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #3c3c3c',
  backgroundColor: '#252526',
}

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#e5e5e5',
}

const viewSwitcherStyle: CSSProperties = {
  display: 'flex',
  gap: '2px',
  backgroundColor: '#1e1e1e',
  borderRadius: '6px',
  padding: '3px',
}

const viewButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 500,
  color: isActive ? '#ffffff' : '#9ca3af',
  backgroundColor: isActive ? '#007acc' : 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
})

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
}

const loadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#9ca3af',
  fontSize: '14px',
}

const emptyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#9ca3af',
  fontSize: '14px',
  gap: '8px',
}

const listContainerStyle: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  padding: '16px',
}

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  marginBottom: '8px',
  backgroundColor: '#252526',
  borderRadius: '6px',
  border: '1px solid #3c3c3c',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
}

// --- Route Definition ---

export const Route = createFileRoute('/results/$id')({
  component: ResultsPage,
})

// --- List View Component ---

interface ListViewProps {
  nodes: GraphNode[]
  onBeadClick?: (beadId: string) => void
  onBeadDoubleClick?: (beadId: string) => void
}

/** Simple list view of beads */
function ListView({ nodes, onBeadClick, onBeadDoubleClick }: ListViewProps) {
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'closed':
        return '#89d185'
      case 'in_progress':
      case 'active':
        return '#007acc'
      case 'blocked':
        return '#f14c4c'
      default:
        return '#555'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'closed':
        return '●'
      case 'in_progress':
      case 'active':
        return '◐'
      case 'blocked':
        return '⊘'
      default:
        return '○'
    }
  }

  return (
    <div style={listContainerStyle}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        {nodes.length} {nodes.length === 1 ? 'bead' : 'beads'}
      </div>
      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          style={{ ...listItemStyle, textAlign: 'left', width: '100%' }}
          onClick={() => onBeadClick?.(node.id)}
          onDoubleClick={() => onBeadDoubleClick?.(node.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#007acc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#3c3c3c'
          }}
        >
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: getStatusColor(node.status),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: node.status.toLowerCase() === 'blocked' ? '#fff' : '#000',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {getStatusIcon(node.status)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#e5e5e5',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.title}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280' }}>
              {node.id}
            </div>
          </div>
          {node.type && (
            <span
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                padding: '2px 6px',
                backgroundColor: '#374151',
                borderRadius: '4px',
              }}
            >
              {node.type}
            </span>
          )}
          {node.priority !== undefined && (
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>P{node.priority}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// --- Main Component ---

function ResultsPage() {
  const { id } = Route.useParams()
  const [viewMode, setViewMode] = useState<ViewMode>('wave')
  const [isLoading] = useState(false)

  // Mock data for now - in real implementation, this would come from an API call
  // based on the results ID (molecule ID, epic ID, etc.)
  const { nodes, edges, density } = useMemo(() => {
    // TODO: Replace with actual API call using the id parameter
    const mockNodes: GraphNode[] = [
      { id: `${id}-1`, title: 'Setup infrastructure', status: 'closed', type: 'task', priority: 0 },
      {
        id: `${id}-2`,
        title: 'Create database schema',
        status: 'closed',
        type: 'task',
        priority: 1,
      },
      { id: `${id}-3`, title: 'Implement API layer', status: 'in_progress', type: 'task', priority: 1 },
      { id: `${id}-4`, title: 'Build frontend components', status: 'open', type: 'task', priority: 2 },
      { id: `${id}-5`, title: 'Write tests', status: 'open', type: 'task', priority: 2 },
      { id: `${id}-6`, title: 'Deploy to staging', status: 'blocked', type: 'task', priority: 3 },
    ]

    const mockEdges: GraphEdge[] = [
      { from: `${id}-1`, to: `${id}-2`, type: 'blocks' },
      { from: `${id}-1`, to: `${id}-3`, type: 'blocks' },
      { from: `${id}-2`, to: `${id}-3`, type: 'blocks' },
      { from: `${id}-3`, to: `${id}-4`, type: 'blocks' },
      { from: `${id}-3`, to: `${id}-5`, type: 'blocks' },
      { from: `${id}-4`, to: `${id}-6`, type: 'blocks' },
      { from: `${id}-5`, to: `${id}-6`, type: 'blocks' },
    ]

    return {
      nodes: mockNodes,
      edges: mockEdges,
      density: 0.3,
    }
  }, [id])

  const handleBeadClick = useCallback((beadId: string) => {
    console.log('Bead clicked:', beadId)
    // TODO: Show bead detail panel
  }, [])

  const handleBeadDoubleClick = useCallback((beadId: string) => {
    console.log('Bead double-clicked:', beadId)
    // TODO: Navigate to bead or open in editor
  }, [])

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading results...</div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>Results: {id}</div>
        </div>
        <div style={emptyStyle}>
          <span style={{ fontSize: '32px' }}>📭</span>
          <span>No beads found</span>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header with view switcher */}
      <div style={headerStyle}>
        <div style={titleStyle}>Results: {id}</div>
        <div style={viewSwitcherStyle} role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            style={viewButtonStyle(viewMode === 'list')}
            onClick={() => setViewMode('list')}
            aria-selected={viewMode === 'list'}
            aria-controls="results-view"
          >
            <span aria-hidden="true">≡</span> List
          </button>
          <button
            type="button"
            role="tab"
            style={viewButtonStyle(viewMode === 'wave')}
            onClick={() => setViewMode('wave')}
            aria-selected={viewMode === 'wave'}
            aria-controls="results-view"
          >
            <span aria-hidden="true">◇</span> Wave
          </button>
          <button
            type="button"
            role="tab"
            style={viewButtonStyle(viewMode === 'graph')}
            onClick={() => setViewMode('graph')}
            aria-selected={viewMode === 'graph'}
            aria-controls="results-view"
          >
            <span aria-hidden="true">◎</span> Graph
          </button>
        </div>
      </div>

      {/* View content */}
      <div id="results-view" role="tabpanel" style={contentStyle}>
        {viewMode === 'list' && (
          <ListView
            nodes={nodes}
            onBeadClick={handleBeadClick}
            onBeadDoubleClick={handleBeadDoubleClick}
          />
        )}
        {viewMode === 'wave' && (
          <WaveView
            nodes={nodes}
            edges={edges}
            onBeadClick={handleBeadClick}
            onBeadDoubleClick={handleBeadDoubleClick}
          />
        )}
        {viewMode === 'graph' && (
          <GraphView
            nodes={nodes}
            edges={edges}
            density={density}
            onBeadClick={handleBeadClick}
            onBeadDoubleClick={handleBeadDoubleClick}
          />
        )}
      </div>
    </div>
  )
}
