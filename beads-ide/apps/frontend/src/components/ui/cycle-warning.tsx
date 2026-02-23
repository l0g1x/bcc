/**
 * Warning banner for cycle detection in dependency graphs.
 * Shown when wave computation detects cycles that prevent proper execution ordering.
 * Includes option to switch to list view as fallback.
 */
import type { CSSProperties } from 'react'

export interface CycleWarningProps {
  /** Groups of bead IDs that form cycles */
  cycles: string[][]
  /** Callback to switch to list view */
  onSwitchToList?: () => void
  /** Custom message (optional) */
  message?: string
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#78350f',
  borderBottom: '1px solid #92400e',
  color: '#fef3c7',
  fontSize: '13px',
}

const iconStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  flexShrink: 0,
  marginTop: '2px',
}

const contentStyle: CSSProperties = {
  flex: 1,
}

const titleStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: '4px',
}

const cycleListStyle: CSSProperties = {
  marginTop: '8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  padding: '8px 10px',
  borderRadius: '4px',
  maxHeight: '80px',
  overflowY: 'auto',
}

const cycleItemStyle: CSSProperties = {
  color: '#fde68a',
  marginBottom: '4px',
}

const buttonStyle: CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#fff',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  flexShrink: 0,
}

/**
 * Warning icon (circular arrow indicating cycle)
 */
function CycleIcon() {
  return (
    <svg
      style={iconStyle}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Cycle detected"
    >
      <title>Cycle detected</title>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  )
}

/**
 * Warning banner component for dependency cycle detection.
 * Shows affected beads and offers a list view fallback.
 */
export function CycleWarning({
  cycles,
  onSwitchToList,
  message = 'Dependency cycles detected. Wave execution ordering cannot be computed for affected beads.',
}: CycleWarningProps) {
  if (cycles.length === 0) return null

  const totalAffected = cycles.reduce((sum, cycle) => sum + cycle.length, 0)

  return (
    <div style={bannerStyle} role="alert">
      <CycleIcon />
      <div style={contentStyle}>
        <div style={titleStyle}>
          Cycle Detected ({totalAffected} bead{totalAffected !== 1 ? 's' : ''} affected)
        </div>
        <div>{message}</div>
        {cycles.length > 0 && (
          <div style={cycleListStyle}>
            {cycles.map((cycle, i) => (
              <div key={cycle.join('-')} style={cycleItemStyle}>
                Cycle {i + 1}: {cycle.join(' → ')} → {cycle[0]}
              </div>
            ))}
          </div>
        )}
      </div>
      {onSwitchToList && (
        <button
          type="button"
          style={buttonStyle}
          onClick={onSwitchToList}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
          }}
        >
          Switch to List View
        </button>
      )}
    </div>
  )
}
