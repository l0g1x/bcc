/**
 * Formula header showing name, version, type, and summary stats.
 */
import type { CSSProperties } from 'react'

export interface FormulaHeaderProps {
  /** Formula name */
  name: string
  /** Formula version */
  version?: number
  /** Formula type (workflow, template, etc.) */
  type?: string
  /** Total step count */
  stepCount: number
  /** Number of expansion groups */
  expansionCount: number
}

const containerStyle: CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #334155',
  backgroundColor: '#1e293b',
}

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '6px',
}

const iconStyle: CSSProperties = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  fontSize: '14px',
}

const titleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#e2e8f0',
  fontFamily: 'monospace',
}

const versionBadgeStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#94a3b8',
  backgroundColor: '#374151',
  padding: '2px 8px',
  borderRadius: '4px',
}

const metaStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  display: 'flex',
  gap: '8px',
}

const metaSeparator: CSSProperties = {
  color: '#475569',
}

export function FormulaHeader({
  name,
  version,
  type,
  stepCount,
  expansionCount,
}: FormulaHeaderProps) {
  return (
    <div style={containerStyle}>
      <div style={titleRowStyle}>
        <div style={iconStyle}>◆</div>
        <span style={titleStyle}>{name}</span>
        {version !== undefined && (
          <span style={versionBadgeStyle}>v{version}</span>
        )}
      </div>
      <div style={metaStyle}>
        {type && <span>{type}</span>}
        {type && <span style={metaSeparator}>•</span>}
        <span>{stepCount} steps</span>
        {expansionCount > 0 && (
          <>
            <span style={metaSeparator}>•</span>
            <span>{expansionCount} expansions</span>
          </>
        )}
      </div>
    </div>
  )
}
