/**
 * Graph controls panel for dense graph simplification.
 * Provides toggles for clustering, focus mode, and visual simplification.
 */
import type { CSSProperties } from 'react'

export interface GraphSimplificationState {
  /** Collapse epic children into cluster nodes */
  epicClustering: boolean
  /** Show only N-hop neighborhood of selected node */
  focusMode: boolean
  /** Number of hops to show in focus mode (default 2) */
  focusHops: number
  /** Enable semantic zoom (hide labels when zoomed out) */
  semanticZoom: boolean
  /** Enable fisheye distortion around cursor */
  fisheyeMode: boolean
  /** Currently selected node ID (for focus mode) */
  selectedNodeId: string | null
}

export const DEFAULT_SIMPLIFICATION_STATE: GraphSimplificationState = {
  epicClustering: false,
  focusMode: false,
  focusHops: 2,
  semanticZoom: true,
  fisheyeMode: false,
  selectedNodeId: null,
}

export interface DensityHealth {
  density: number
  nodeCount: number
  edgeCount: number
  level: 'healthy' | 'warning' | 'critical'
}

export function getDensityHealth(density: number, nodeCount: number, edgeCount: number): DensityHealth {
  let level: DensityHealth['level'] = 'healthy'
  if (density > 0.12) {
    level = 'critical'
  } else if (density > 0.10) {
    level = 'warning'
  }
  return { density, nodeCount, edgeCount, level }
}

interface GraphControlsProps {
  state: GraphSimplificationState
  onStateChange: (state: GraphSimplificationState) => void
  density: DensityHealth
}

const controlsContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px',
  backgroundColor: '#252526',
  borderRadius: '6px',
  fontSize: '12px',
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const controlRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
}

const labelStyle: CSSProperties = {
  color: '#ccc',
  fontSize: '12px',
}

const checkboxStyle: CSSProperties = {
  width: '14px',
  height: '14px',
  accentColor: '#007acc',
  cursor: 'pointer',
}

const selectStyle: CSSProperties = {
  backgroundColor: '#3c3c3c',
  border: '1px solid #555',
  borderRadius: '3px',
  color: '#ccc',
  padding: '2px 6px',
  fontSize: '11px',
}

const healthIndicatorBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '4px',
  fontSize: '11px',
}

function getHealthColor(level: DensityHealth['level']): string {
  switch (level) {
    case 'critical':
      return '#f14c4c'
    case 'warning':
      return '#cca700'
    case 'healthy':
      return '#89d185'
  }
}

function getHealthBgColor(level: DensityHealth['level']): string {
  switch (level) {
    case 'critical':
      return 'rgba(241, 76, 76, 0.15)'
    case 'warning':
      return 'rgba(204, 167, 0, 0.15)'
    case 'healthy':
      return 'rgba(137, 209, 133, 0.15)'
  }
}

export function GraphControls({ state, onStateChange, density }: GraphControlsProps) {
  const updateState = (partial: Partial<GraphSimplificationState>) => {
    onStateChange({ ...state, ...partial })
  }

  return (
    <div style={controlsContainerStyle}>
      {/* Density Health Indicator */}
      <div
        style={{
          ...healthIndicatorBaseStyle,
          backgroundColor: getHealthBgColor(density.level),
          border: `1px solid ${getHealthColor(density.level)}`,
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getHealthColor(density.level),
          }}
        />
        <span style={{ color: getHealthColor(density.level), fontWeight: 500 }}>
          Density: {(density.density * 100).toFixed(1)}%
        </span>
        <span style={{ color: '#888', marginLeft: 'auto' }}>
          {density.nodeCount} nodes, {density.edgeCount} edges
        </span>
      </div>

      {/* Clustering Section */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Clustering</span>
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={state.epicClustering}
              onChange={(e) => updateState({ epicClustering: e.target.checked })}
              style={checkboxStyle}
            />{' '}
            Epic Clustering
          </label>
        </div>
      </div>

      {/* Focus Mode Section */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Focus Mode</span>
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={state.focusMode}
              onChange={(e) => updateState({ focusMode: e.target.checked })}
              style={checkboxStyle}
            />{' '}
            Enable Focus
          </label>
          <select
            value={state.focusHops}
            onChange={(e) => updateState({ focusHops: Number.parseInt(e.target.value, 10) })}
            style={selectStyle}
            disabled={!state.focusMode}
          >
            <option value={1}>1 hop</option>
            <option value={2}>2 hops</option>
            <option value={3}>3 hops</option>
          </select>
        </div>
        {state.focusMode && !state.selectedNodeId && (
          <span style={{ color: '#888', fontSize: '10px', fontStyle: 'italic' }}>
            Click a node to focus
          </span>
        )}
        {state.focusMode && state.selectedNodeId && (
          <span style={{ color: '#007acc', fontSize: '10px' }}>
            Focused: {state.selectedNodeId}
          </span>
        )}
      </div>

      {/* Visual Simplification Section */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Visual Simplification</span>
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={state.semanticZoom}
              onChange={(e) => updateState({ semanticZoom: e.target.checked })}
              style={checkboxStyle}
            />{' '}
            Semantic Zoom
          </label>
        </div>
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={state.fisheyeMode}
              onChange={(e) => updateState({ fisheyeMode: e.target.checked })}
              style={checkboxStyle}
            />{' '}
            Fisheye Distortion
          </label>
        </div>
      </div>
    </div>
  )
}
