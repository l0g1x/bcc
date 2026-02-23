/**
 * Collapsible variables section in the outline view.
 * Shows formula variables with inline editing.
 */
import type { FormulaVariable } from '@beads-ide/shared'
import { type CSSProperties, useCallback, useState } from 'react'

export interface VariablesSectionProps {
  /** Variable definitions */
  vars: Record<string, FormulaVariable>
  /** Current variable values */
  values: Record<string, string>
  /** Callback when a variable value changes */
  onValueChange: (key: string, value: string) => void
  /** Initial expanded state */
  defaultExpanded?: boolean
  /** Position in parent tree (1-indexed) for aria-posinset */
  treePosition?: number
  /** Total siblings in parent tree for aria-setsize */
  treeSize?: number
}

const containerStyle: CSSProperties = {
  marginBottom: '8px',
}

const headerStyle = (isExpanded: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  cursor: 'pointer',
  backgroundColor: isExpanded ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
  borderLeft: '3px solid #8b5cf6',
  transition: 'background-color 0.15s ease',
})

const chevronStyle = (isExpanded: boolean): CSSProperties => ({
  fontSize: '12px',
  color: '#6b7280',
  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
  transition: 'transform 0.15s ease',
})

const labelStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#e2e8f0',
  flex: 1,
}

const countBadgeStyle: CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  backgroundColor: '#374151',
  padding: '2px 8px',
  borderRadius: '10px',
}

const varsContainerStyle = (isExpanded: boolean): CSSProperties => ({
  display: isExpanded ? 'block' : 'none',
  borderLeft: '3px solid #334155',
  marginLeft: '3px',
  padding: '8px 0',
})

const varRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '6px 16px 6px 32px',
}

const varNameStyle: CSSProperties = {
  fontSize: '13px',
  fontFamily: 'monospace',
  color: '#a5b4fc',
  fontWeight: 500,
  minWidth: '120px',
}

const varInputStyle: CSSProperties = {
  flex: 1,
  maxWidth: '300px',
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '6px 10px',
  color: '#e5e7eb',
  fontSize: '13px',
  fontFamily: 'monospace',
  outline: 'none',
}

const requiredStyle: CSSProperties = {
  fontSize: '11px',
  color: '#f87171',
  fontWeight: 600,
}

const descriptionStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  marginLeft: '132px',
  padding: '2px 16px 8px 32px',
}

export function VariablesSection({
  vars,
  values,
  onValueChange,
  defaultExpanded = true,
  treePosition,
  treeSize,
}: VariablesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const entries = Object.entries(vars)

  if (entries.length === 0) {
    return null
  }

  return (
    <div
      style={containerStyle}
      role="treeitem"
      aria-expanded={isExpanded}
      aria-level={1}
      aria-posinset={treePosition}
      aria-setsize={treeSize}
      aria-label={`Variables, ${entries.length} items`}
    >
      {/* Header */}
      <div
        style={headerStyle(isExpanded)}
        onClick={toggleExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpanded()
          }
        }}
      >
        <span style={chevronStyle(isExpanded)} aria-hidden="true">▶</span>
        <span style={labelStyle}>Variables</span>
        <span style={countBadgeStyle} aria-hidden="true">{entries.length}</span>
      </div>

      {/* Variables */}
      <div style={varsContainerStyle(isExpanded)} role="group">
        {entries.map(([key, def]) => (
          <div key={key} role="treeitem" aria-level={2}>
            <div style={varRowStyle}>
              <span style={varNameStyle}>{key}</span>
              <input
                type={def.type === 'int' ? 'number' : 'text'}
                value={values[key] ?? def.default ?? ''}
                onChange={(e) => onValueChange(key, e.target.value)}
                placeholder={def.default || `Enter ${key}...`}
                style={varInputStyle}
                aria-label={key}
              />
              {def.required && <span style={requiredStyle}>required</span>}
            </div>
            {def.description && (
              <div style={descriptionStyle}>{def.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
