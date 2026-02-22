/**
 * Wave view component for visualizing beads grouped by dependency frontiers.
 * Uses computeWaves() to group beads into waves that can execute in parallel.
 * Part of the three switchable result views: list / wave / graph.
 */
import type { CSSProperties, KeyboardEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  type Bead as WaveBead,
  type Wave,
  type WaveResult,
  computeWaves,
} from '@beads-ide/shared'
import type { GraphNode } from '@beads-ide/shared'

// --- Types ---

export interface WaveViewProps {
  /** Beads to group into waves */
  nodes: GraphNode[]
  /** Edges for computing waves (source -> target dependencies) */
  edges: { from: string; to: string; type: string }[]
  /** Callback when a bead is clicked */
  onBeadClick?: (beadId: string) => void
  /** Callback when a bead is double-clicked */
  onBeadDoubleClick?: (beadId: string) => void
}

// --- Styles ---

const containerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#1e1e1e',
  overflow: 'auto',
  padding: '16px',
}

const cycleWarningStyle: CSSProperties = {
  backgroundColor: '#7f1d1d',
  border: '1px solid #dc2626',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}

const cycleIconStyle: CSSProperties = {
  fontSize: '20px',
  color: '#fca5a5',
  flexShrink: 0,
}

const cycleContentStyle: CSSProperties = {
  flex: 1,
}

const cycleTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#fca5a5',
  marginBottom: '4px',
}

const cycleDescStyle: CSSProperties = {
  fontSize: '12px',
  color: '#fecaca',
  lineHeight: 1.5,
}

const cycleListStyle: CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#fecaca',
  marginTop: '8px',
  padding: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '4px',
  maxHeight: '100px',
  overflow: 'auto',
}

const waveContainerStyle: CSSProperties = {
  marginBottom: '16px',
}

const waveHeaderStyle = (isExpanded: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  backgroundColor: '#252526',
  borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
  cursor: 'pointer',
  border: '1px solid #3c3c3c',
  borderBottom: isExpanded ? 'none' : '1px solid #3c3c3c',
  transition: 'background-color 0.15s ease',
})

const waveExpandIconStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  transition: 'transform 0.2s ease',
}

const waveTitleStyle: CSSProperties = {
  flex: 1,
  fontSize: '14px',
  fontWeight: 600,
  color: '#e5e5e5',
}

const waveCountStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  padding: '2px 8px',
  backgroundColor: '#374151',
  borderRadius: '12px',
}

const waveLabelStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const waveContentStyle: CSSProperties = {
  padding: '12px',
  backgroundColor: '#1f2937',
  border: '1px solid #3c3c3c',
  borderTop: 'none',
  borderRadius: '0 0 8px 8px',
}

const beadGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '12px',
}

const beadCardStyle: CSSProperties = {
  padding: '12px',
  backgroundColor: '#252526',
  border: '1px solid #3c3c3c',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
}

const beadTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#e5e5e5',
  marginBottom: '6px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const beadIdStyle: CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#6b7280',
  marginBottom: '8px',
}

const beadMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#9ca3af',
  fontSize: '14px',
}

// --- Helper Functions ---

/** Get status color for visual indicator */
function getStatusColor(status: string): string {
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
    case 'review':
    case 'hooked':
      return '#cca700'
    default:
      return '#555'
  }
}

/** Get status icon for accessible display (not color-only) */
function getStatusIcon(status: string): { icon: string; label: string } {
  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
    case 'closed':
      return { icon: '●', label: 'Closed' }
    case 'in_progress':
    case 'active':
      return { icon: '◐', label: 'In Progress' }
    case 'blocked':
      return { icon: '⊘', label: 'Blocked' }
    case 'review':
    case 'hooked':
      return { icon: '◎', label: 'Review' }
    default:
      return { icon: '○', label: 'Open' }
  }
}

/** Get wave label based on level */
function getWaveLabel(level: number): string {
  if (level === 0) return 'Now'
  if (level === 1) return 'Next'
  return `Wave ${level + 1}`
}

/** Convert GraphNode[] and edges to WaveBead[] for computeWaves */
function convertToWaveBeads(
  nodes: GraphNode[],
  edges: { from: string; to: string; type: string }[]
): WaveBead[] {
  const nodeIds = new Set(nodes.map((n) => n.id))

  return nodes.map((node) => {
    // Find all edges where this node is the target (dependencies of this node)
    const dependencies = edges
      .filter((e) => e.to === node.id && nodeIds.has(e.from))
      .map((e) => ({
        source: e.from,
        target: e.to,
        type: e.type,
      }))

    return {
      id: node.id,
      dependencies,
    }
  })
}

// --- Components ---

interface BeadCardProps {
  node: GraphNode
  onClick?: (beadId: string) => void
  onDoubleClick?: (beadId: string) => void
}

/** Individual bead card within a wave */
function BeadCard({ node, onClick, onDoubleClick }: BeadCardProps) {
  const statusInfo = getStatusIcon(node.status)
  const statusColor = getStatusColor(node.status)

  const handleClick = useCallback(() => {
    onClick?.(node.id)
  }, [onClick, node.id])

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(node.id)
  }, [onDoubleClick, node.id])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.(node.id)
      }
    },
    [onClick, node.id]
  )

  return (
    <button
      type="button"
      style={beadCardStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#007acc'
        e.currentTarget.style.backgroundColor = '#2d2d2d'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#3c3c3c'
        e.currentTarget.style.backgroundColor = '#252526'
      }}
      aria-label={`${node.title}, Status: ${statusInfo.label}`}
    >
      <div style={beadTitleStyle}>{node.title}</div>
      <div style={beadIdStyle}>{node.id}</div>
      <div style={beadMetaStyle}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            backgroundColor: statusColor,
            color: node.status.toLowerCase() === 'blocked' ? '#fff' : '#000',
            fontWeight: 500,
          }}
          aria-hidden="true"
        >
          {statusInfo.icon} {node.status}
        </span>
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
          <span
            style={{
              fontSize: '10px',
              color: '#9ca3af',
            }}
          >
            P{node.priority}
          </span>
        )}
      </div>
    </button>
  )
}

interface WaveSectionProps {
  wave: Wave
  nodes: Map<string, GraphNode>
  defaultExpanded?: boolean
  onBeadClick?: (beadId: string) => void
  onBeadDoubleClick?: (beadId: string) => void
}

/** Collapsible wave section */
function WaveSection({
  wave,
  nodes,
  defaultExpanded = true,
  onBeadClick,
  onBeadDoubleClick,
}: WaveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const waveLabel = getWaveLabel(wave.level)
  const beadCount = wave.beadIds.length

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
    },
    [handleToggle]
  )

  return (
    <div style={waveContainerStyle}>
      {/* biome-ignore lint/a11y/useSemanticElements: custom collapsible header */}
      <div
        role="button"
        tabIndex={0}
        style={waveHeaderStyle(isExpanded)}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2d2d2d'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#252526'
        }}
        aria-expanded={isExpanded}
        aria-controls={`wave-${wave.level}-content`}
      >
        <span
          style={{
            ...waveExpandIconStyle,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        >
          ▶
        </span>
        <span style={waveTitleStyle}>
          Wave {wave.level + 1}
          <span style={{ ...waveLabelStyle, marginLeft: '8px' }}>({waveLabel})</span>
        </span>
        <span style={waveCountStyle}>
          {beadCount} {beadCount === 1 ? 'bead' : 'beads'}
        </span>
      </div>

      {isExpanded && (
        <div id={`wave-${wave.level}-content`} style={waveContentStyle}>
          <div style={beadGridStyle}>
            {wave.beadIds.map((beadId) => {
              const node = nodes.get(beadId)
              if (!node) return null
              return (
                <BeadCard
                  key={beadId}
                  node={node}
                  onClick={onBeadClick}
                  onDoubleClick={onBeadDoubleClick}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface CycleWarningProps {
  cycles: string[][]
}

/** Warning banner when cycles are detected */
function CycleWarning({ cycles }: CycleWarningProps) {
  const totalCycleNodes = cycles.reduce((sum, cycle) => sum + cycle.length, 0)

  return (
    <div style={cycleWarningStyle} role="alert">
      <span style={cycleIconStyle} aria-hidden="true">
        ⚠
      </span>
      <div style={cycleContentStyle}>
        <div style={cycleTitleStyle}>Dependency Cycle Detected</div>
        <div style={cycleDescStyle}>
          {cycles.length} cycle{cycles.length !== 1 ? 's' : ''} found involving {totalCycleNodes}{' '}
          bead{totalCycleNodes !== 1 ? 's' : ''}. These beads cannot be ordered into waves and will
          be shown in a flat list below.
        </div>
        <div style={cycleListStyle}>
          {cycles.map((cycle, i) => (
            <div key={cycle.join('-')}>
              Cycle {i + 1}: {cycle.join(' → ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---

/**
 * Wave view component that groups beads by dependency frontiers.
 * Uses Kahn's algorithm via computeWaves() to determine execution order.
 */
export function WaveView({ nodes, edges, onBeadClick, onBeadDoubleClick }: WaveViewProps) {
  // Convert to wave beads and compute waves
  const waveResult: WaveResult = useMemo(() => {
    if (nodes.length === 0) {
      return { waves: [], cycles: [], hasCycles: false }
    }

    const waveBeads = convertToWaveBeads(nodes, edges)
    return computeWaves(waveBeads)
  }, [nodes, edges])

  // Build node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    for (const node of nodes) {
      map.set(node.id, node)
    }
    return map
  }, [nodes])

  // Get nodes that are in cycles (for fallback list display)
  const cycleNodeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const cycle of waveResult.cycles) {
      for (const id of cycle) {
        ids.add(id)
      }
    }
    return ids
  }, [waveResult.cycles])

  // Empty state
  if (nodes.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={emptyStateStyle}>No beads to display</div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Cycle warning banner */}
      {waveResult.hasCycles && <CycleWarning cycles={waveResult.cycles} />}

      {/* Wave sections */}
      {waveResult.waves.map((wave, index) => (
        <WaveSection
          key={wave.level}
          wave={wave}
          nodes={nodeMap}
          defaultExpanded={index < 3} // First 3 waves expanded by default
          onBeadClick={onBeadClick}
          onBeadDoubleClick={onBeadDoubleClick}
        />
      ))}

      {/* Cycle beads shown as flat list */}
      {waveResult.hasCycles && cycleNodeIds.size > 0 && (
        <div style={waveContainerStyle}>
          <div style={{ ...waveHeaderStyle(true), backgroundColor: '#7f1d1d' }}>
            <span style={{ ...waveExpandIconStyle, color: '#fca5a5' }} aria-hidden="true">
              ⊘
            </span>
            <span style={{ ...waveTitleStyle, color: '#fca5a5' }}>
              Cyclic Dependencies
              <span style={{ ...waveLabelStyle, marginLeft: '8px', color: '#fecaca' }}>
                (unordered)
              </span>
            </span>
            <span style={{ ...waveCountStyle, backgroundColor: '#dc2626', color: '#fff' }}>
              {cycleNodeIds.size} {cycleNodeIds.size === 1 ? 'bead' : 'beads'}
            </span>
          </div>
          <div style={{ ...waveContentStyle, borderColor: '#dc2626' }}>
            <div style={beadGridStyle}>
              {Array.from(cycleNodeIds).map((beadId) => {
                const node = nodeMap.get(beadId)
                if (!node) return null
                return (
                  <BeadCard
                    key={beadId}
                    node={node}
                    onClick={onBeadClick}
                    onDoubleClick={onBeadDoubleClick}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
