/**
 * Collapsible expansion group in the outline view.
 * Groups steps that belong to the same expansion formula.
 */
import type { ProtoBead } from '@beads-ide/shared'
import { type CSSProperties, useCallback, useState } from 'react'
import { StepItem } from './step-item'

export interface ExpansionGroupProps {
  /** Group identifier (e.g., "step-1-beads-creation") */
  groupId: string
  /** Display label (e.g., "Step 1: Beads Creation") */
  label: string
  /** Steps in this group */
  steps: ProtoBead[]
  /** Group number for step numbering */
  groupNumber: number
  /** Whether this group depends on a previous group */
  dependsOnGroup?: string
  /** Currently selected step ID */
  selectedStepId: string | null
  /** Callback when a step is selected */
  onStepSelect: (stepId: string | null) => void
  /** Color for this group */
  color: string
  /** Initial expanded state */
  defaultExpanded?: boolean
  /** All available step IDs for dependency selection */
  availableStepIds?: string[]
  /** Callback when a step field is edited */
  onStepFieldChange?: (stepId: string, field: string, value: string | number | string[]) => void
  /** Position in parent tree (1-indexed) for aria-posinset */
  treePosition?: number
  /** Total siblings in parent tree for aria-setsize */
  treeSize?: number
}

const containerStyle: CSSProperties = {
  marginBottom: '8px',
}

const headerStyle = (color: string, isExpanded: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  cursor: 'pointer',
  backgroundColor: isExpanded ? `${color}10` : 'transparent',
  borderLeft: `3px solid ${color}`,
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

const crossGroupDepStyle: CSSProperties = {
  fontSize: '11px',
  color: '#f59e0b',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}

const stepsContainerStyle = (isExpanded: boolean): CSSProperties => ({
  display: isExpanded ? 'block' : 'none',
  borderLeft: '3px solid #334155',
  marginLeft: '3px',
})

const sourceStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  fontFamily: 'monospace',
  padding: '4px 16px 8px 32px',
  borderBottom: '1px solid #334155',
}

export function ExpansionGroup({
  groupId,
  label,
  steps,
  groupNumber,
  dependsOnGroup,
  selectedStepId,
  onStepSelect,
  color,
  defaultExpanded = true,
  availableStepIds = [],
  onStepFieldChange,
  treePosition,
  treeSize,
}: ExpansionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleStepClick = useCallback(
    (stepId: string) => {
      onStepSelect(selectedStepId === stepId ? null : stepId)
    },
    [selectedStepId, onStepSelect]
  )

  return (
    <div
      style={containerStyle}
      role="treeitem"
      aria-expanded={isExpanded}
      aria-level={1}
      aria-posinset={treePosition}
      aria-setsize={treeSize}
      aria-label={`${label}, ${steps.length} steps`}
    >
      {/* Group Header */}
      <button
        type="button"
        style={{ ...headerStyle(color, isExpanded), border: 'none', width: '100%', textAlign: 'left' }}
        onClick={toggleExpanded}
      >
        <span style={chevronStyle(isExpanded)} aria-hidden="true">▶</span>
        <span style={labelStyle}>{label}</span>
        <span style={countBadgeStyle} aria-hidden="true">{steps.length}</span>
        {dependsOnGroup && (
          <span style={crossGroupDepStyle} aria-hidden="true">
            ⟵ {dependsOnGroup}
          </span>
        )}
      </button>

      {/* Steps */}
      <fieldset style={{ ...stepsContainerStyle(isExpanded), margin: 0, padding: 0, border: 'none' }}>
        <legend style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
          {label} steps
        </legend>
        {/* Source expansion info */}
        <div style={sourceStyle} aria-hidden="true">
          expanded from: {groupId.replace(/^step-\d+-/, '')}
        </div>

        {/* Step items */}
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            number={`${groupNumber}.${index + 1}`}
            isSelected={selectedStepId === step.id}
            onClick={() => handleStepClick(step.id)}
            indent={1}
            availableStepIds={availableStepIds}
            onFieldChange={onStepFieldChange}
            treeLevel={2}
            treePosition={index + 1}
            treeSize={steps.length}
          />
        ))}
      </fieldset>
    </div>
  )
}
