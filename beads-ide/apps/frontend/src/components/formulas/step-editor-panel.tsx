/**
 * Step editor panel for editing step fields in the Visual/Flow view.
 * Redesigned with more space and a Tiptap markdown editor for descriptions.
 */
import type { ProtoBead } from '@beads-ide/shared'
import { type CSSProperties, type ChangeEvent, useCallback, useState } from 'react'
import { MarkdownEditor } from './markdown-editor'
import { NeedsSelector } from './needs-selector'

export interface StepEditorPanelProps {
  /** The step being edited */
  step: ProtoBead
  /** All available step IDs for dependency selection */
  availableStepIds: string[]
  /** Callback when a field changes */
  onFieldChange: (stepId: string, field: string, value: string | number | string[]) => void
  /** Callback when panel is closed */
  onClose: () => void
}

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0f172a',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #334155',
  backgroundColor: '#1e293b',
  flexShrink: 0,
}

const headerTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const stepIdBadgeStyle: CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#6b7280',
  backgroundColor: '#1e293b',
  padding: '2px 8px',
  borderRadius: '4px',
  border: '1px solid #334155',
}

const closeButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '4px 8px',
  borderRadius: '4px',
  lineHeight: 1,
  transition: 'color 0.1s ease',
}

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '20px',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const labelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const collapsibleLabelStyle: CSSProperties = {
  ...labelStyle,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const chevronStyle = (isExpanded: boolean): CSSProperties => ({
  fontSize: '10px',
  transition: 'transform 0.15s ease',
  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
})

const inputStyle: CSSProperties = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#e5e7eb',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
}

const priorityContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const priorityInputStyle: CSSProperties = {
  ...inputStyle,
  width: '70px',
  textAlign: 'center',
  padding: '8px 10px',
}

const priorityDotsStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
  flex: 1,
}

const priorityDotStyle = (filled: boolean): CSSProperties => ({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: filled ? '#3b82f6' : '#374151',
  transition: 'background-color 0.1s ease',
  cursor: 'pointer',
})

const priorityLabelStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  minWidth: '50px',
}

const descriptionSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '20px',
}

/**
 * Panel for editing a step's fields (title, description, priority, dependencies).
 * Features a rich markdown editor for descriptions.
 */
export function StepEditorPanel({
  step,
  availableStepIds,
  onFieldChange,
  onClose,
}: StepEditorPanelProps) {
  const [showDeps, setShowDeps] = useState(true)

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onFieldChange(step.id, 'title', e.target.value)
    },
    [step.id, onFieldChange]
  )

  const handleDescriptionChange = useCallback(
    (value: string) => {
      onFieldChange(step.id, 'description', value)
    },
    [step.id, onFieldChange]
  )

  const handlePriorityChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value, 10)
      if (!Number.isNaN(value) && value >= 0 && value <= 10) {
        onFieldChange(step.id, 'priority', value)
      }
    },
    [step.id, onFieldChange]
  )

  const handlePriorityDotClick = useCallback(
    (index: number) => {
      // Clicking a dot sets priority to that index + 1
      // Clicking the same dot toggles it off (sets to index)
      const newPriority = step.priority === index + 1 ? index : index + 1
      onFieldChange(step.id, 'priority', Math.max(0, Math.min(10, newPriority)))
    },
    [step.id, step.priority, onFieldChange]
  )

  const handleNeedsChange = useCallback(
    (ids: string[]) => {
      onFieldChange(step.id, 'needs', ids)
    },
    [step.id, onFieldChange]
  )

  const toggleDeps = useCallback(() => {
    setShowDeps((prev) => !prev)
  }, [])

  // Filter out current step from available dependencies
  const otherStepIds = availableStepIds.filter((id) => id !== step.id)
  const hasNeeds = step.needs && step.needs.length > 0

  // Priority label
  const priorityLabel =
    step.priority === 0 ? 'Highest' : step.priority <= 3 ? 'High' : step.priority <= 6 ? 'Medium' : 'Low'

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerTitleStyle}>
          <span>Edit Step</span>
          <span style={stepIdBadgeStyle}>{step.id}</span>
        </div>
        <button
          type="button"
          style={closeButtonStyle}
          onClick={onClose}
          aria-label="Close step editor"
          title="Close (Esc)"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e2e8f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Title */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={step.title}
            onChange={handleTitleChange}
            style={inputStyle}
            aria-label="Step title"
            placeholder="Enter step title..."
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151'
            }}
          />
        </div>

        {/* Priority */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Priority</label>
          <div style={priorityContainerStyle}>
            <input
              type="number"
              min={0}
              max={10}
              value={step.priority}
              onChange={handlePriorityChange}
              style={priorityInputStyle}
              aria-label="Step priority"
            />
            <div style={priorityDotsStyle}>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  style={priorityDotStyle(i < step.priority)}
                  onClick={() => handlePriorityDotClick(i)}
                  title={`Set priority to ${i + 1}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handlePriorityDotClick(i)
                    }
                  }}
                />
              ))}
            </div>
            <span style={priorityLabelStyle}>{priorityLabel}</span>
          </div>
        </div>

        {/* Dependencies - Collapsible */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <button
              type="button"
              style={{ ...collapsibleLabelStyle, background: 'none', border: 'none', padding: 0 }}
              onClick={toggleDeps}
            >
              <span style={chevronStyle(showDeps)}>▶</span>
              <span>Dependencies</span>
              {hasNeeds && (
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '4px',
                  }}
                >
                  {step.needs?.length}
                </span>
              )}
            </button>
          </div>
          {showDeps && (
            <NeedsSelector
              selectedIds={step.needs ?? []}
              availableIds={otherStepIds}
              onChange={handleNeedsChange}
            />
          )}
        </div>

        {/* Description - Takes remaining space */}
        <div style={descriptionSectionStyle}>
          <label style={labelStyle}>Description</label>
          <MarkdownEditor
            value={step.description}
            onChange={handleDescriptionChange}
            placeholder="Describe what this step does..."
            minHeight="250px"
          />
        </div>
      </div>
    </div>
  )
}
