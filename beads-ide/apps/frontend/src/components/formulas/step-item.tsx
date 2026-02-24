/**
 * Step item in the outline view.
 * Shows step number, title, description preview, and dependency badges.
 * Expands inline for editing when selected.
 */
import type { ProtoBead } from '@beads-ide/shared'
import { type CSSProperties, type ChangeEvent, useCallback } from 'react'
import { NeedsSelector } from './needs-selector'

/** Priority levels 0-9 for visual dot indicators */
const PRIORITY_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export interface StepItemProps {
  /** The step data */
  step: ProtoBead
  /** Display number (e.g., "1.3" or "3") */
  number: string
  /** Whether this step is currently selected/expanded for editing */
  isSelected: boolean
  /** Callback when step is clicked */
  onClick: () => void
  /** Indent level for visual hierarchy */
  indent?: number
  /** Available step IDs for dependency selection (excluding this step) */
  availableStepIds?: string[]
  /** Callback when a field is edited */
  onFieldChange?: (stepId: string, field: string, value: string | number | string[]) => void
  /** Tree nesting level for aria-level */
  treeLevel?: number
  /** Position in parent group (1-indexed) for aria-posinset */
  treePosition?: number
  /** Total siblings in parent group for aria-setsize */
  treeSize?: number
}

const containerStyle = (isSelected: boolean): CSSProperties => ({
  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
  borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
  transition: 'background-color 0.15s ease',
})

const headerStyle = (isSelected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '10px 16px',
  cursor: 'pointer',
})

const numberStyle: CSSProperties = {
  fontSize: '12px',
  fontFamily: 'monospace',
  color: '#6b7280',
  minWidth: '32px',
  flexShrink: 0,
}

const statusStyle: CSSProperties = {
  fontSize: '10px',
  color: '#6b7280',
  marginRight: '4px',
}

const contentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#e2e8f0',
  marginBottom: '2px',
}

const descriptionStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '400px',
}

const depsContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
  flexShrink: 0,
}

const depBadgeStyle = (isGate: boolean | undefined): CSSProperties => ({
  fontSize: '10px',
  fontFamily: 'monospace',
  color: isGate ? '#f59e0b' : '#6b7280',
  backgroundColor: isGate ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
  padding: isGate ? '2px 6px' : '0',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
})

const gateBadgeStyle: CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#f59e0b',
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  padding: '2px 6px',
  borderRadius: '4px',
  marginBottom: '2px',
}

// --- Inline Edit Styles ---

const editContainerStyle: CSSProperties = {
  padding: '12px 16px 16px 48px',
  borderTop: '1px solid #334155',
  backgroundColor: 'rgba(59, 130, 246, 0.05)',
}

const fieldRowStyle: CSSProperties = {
  marginBottom: '12px',
}

const labelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#9ca3af',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '500px',
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#e5e7eb',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

const priorityContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const priorityInputStyle: CSSProperties = {
  ...inputStyle,
  width: '70px',
  maxWidth: '70px',
  textAlign: 'center',
}

const priorityDotsStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
}

const priorityDotStyle = (filled: boolean): CSSProperties => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: filled ? '#3b82f6' : '#374151',
  transition: 'background-color 0.1s ease',
})

const needsLabelStyle: CSSProperties = {
  ...labelStyle,
  marginBottom: '8px',
}

/**
 * Formats a step ID for display (shortens if it has a group prefix).
 */
function formatDepId(depId: string, currentStepId: string): string {
  const currentPrefix = currentStepId.includes('.')
    ? currentStepId.split('.')[0]
    : null

  if (currentPrefix && depId.startsWith(`${currentPrefix}.`)) {
    return depId.split('.').slice(1).join('.')
  }

  if (depId.includes('.')) {
    const parts = depId.split('.')
    return parts[0]
  }

  return depId
}

export function StepItem({
  step,
  number,
  isSelected,
  onClick,
  indent = 0,
  availableStepIds = [],
  onFieldChange,
  treeLevel = 1,
  treePosition,
  treeSize,
}: StepItemProps) {
  const hasNeeds = step.needs && step.needs.length > 0
  const isGate = step.needs && step.needs.length > 1

  // Truncate description for preview
  const descPreview = step.description
    ? step.description.split('\n')[0].slice(0, 80)
    : ''

  // Filter out current step from available dependencies
  const otherStepIds = availableStepIds.filter((id) => id !== step.id)

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onFieldChange?.(step.id, 'title', e.target.value)
    },
    [step.id, onFieldChange]
  )

  const handleDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onFieldChange?.(step.id, 'description', e.target.value)
    },
    [step.id, onFieldChange]
  )

  const handlePriorityChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value, 10)
      if (!Number.isNaN(value) && value >= 0 && value <= 10) {
        onFieldChange?.(step.id, 'priority', value)
      }
    },
    [step.id, onFieldChange]
  )

  const handleNeedsChange = useCallback(
    (ids: string[]) => {
      onFieldChange?.(step.id, 'needs', ids)
    },
    [step.id, onFieldChange]
  )

  return (
    <div
      style={{
        ...containerStyle(isSelected),
        paddingLeft: `${indent * 16}px`,
      }}
      role="treeitem"
      aria-selected={isSelected}
      aria-level={treeLevel}
      aria-posinset={treePosition}
      aria-setsize={treeSize}
      aria-label={`Step ${number}: ${step.title}`}
    >
      {/* Header row - always visible */}
      <div
        style={headerStyle(isSelected)}
        onClick={onClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <span style={numberStyle}>
          <span style={statusStyle}>●</span>
          {number}
        </span>

        <div style={contentStyle}>
          <div style={titleStyle} title={step.title}>
            {step.title}
          </div>
          {!isSelected && descPreview && (
            <div style={descriptionStyle} title={step.description}>
              {descPreview}
              {step.description && step.description.length > 80 ? '...' : ''}
            </div>
          )}
        </div>

        {!isSelected && hasNeeds && (
          <div style={depsContainerStyle}>
            {isGate && <span style={gateBadgeStyle}>GATE ×{step.needs!.length}</span>}
            {step.needs!.slice(0, isGate ? 2 : 1).map((depId) => (
              <span key={depId} style={depBadgeStyle(isGate)}>
                ← {formatDepId(depId, step.id)}
              </span>
            ))}
            {isGate && step.needs!.length > 2 && (
              <span style={depBadgeStyle(true)}>+{step.needs!.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Inline edit fields - shown when selected */}
      {isSelected && onFieldChange && (
        <div style={editContainerStyle}>
          {/* Title */}
          <div style={fieldRowStyle}>
            <div style={labelStyle}>Title</div>
            <input
              type="text"
              value={step.title}
              onChange={handleTitleChange}
              style={inputStyle}
              placeholder="Step title..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Priority */}
          <div style={fieldRowStyle}>
            <div style={labelStyle}>Priority</div>
            <div style={priorityContainerStyle}>
              <input
                type="number"
                min={0}
                max={10}
                value={step.priority}
                onChange={handlePriorityChange}
                style={priorityInputStyle}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={priorityDotsStyle}>
                {PRIORITY_LEVELS.map((level) => (
                  <div key={`priority-dot-${level}`} style={priorityDotStyle(level < step.priority)} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                {step.priority === 0 ? 'Highest' : step.priority >= 8 ? 'Low' : ''}
              </span>
            </div>
          </div>

          {/* Dependencies */}
          <div style={fieldRowStyle}>
            <div style={needsLabelStyle}>Dependencies (needs)</div>
            <NeedsSelector
              selectedIds={step.needs ?? []}
              availableIds={otherStepIds}
              onChange={handleNeedsChange}
            />
          </div>

          {/* Description */}
          <div style={fieldRowStyle}>
            <div style={labelStyle}>Description</div>
            <textarea
              value={step.description}
              onChange={handleDescriptionChange}
              style={textareaStyle}
              placeholder="Step description..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
