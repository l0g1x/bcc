/**
 * Formula outline view - tree-style visualization of formula structure.
 * Shows formula metadata, variables, and steps grouped by expansion.
 */
import type { CookResult, FormulaVariable, ProtoBead } from '@beads-ide/shared'
import { type CSSProperties, useMemo } from 'react'
import { ExpansionGroup } from './expansion-group'
import { FormulaHeader } from './formula-header'
import { StepItem } from './step-item'
import { VariablesSection } from './variables-section'

export interface FormulaOutlineViewProps {
  /** Cook result containing formula data */
  result: CookResult
  /** Current variable values */
  varValues: Record<string, string>
  /** Callback when variable value changes */
  onVarChange: (key: string, value: string) => void
  /** Currently selected step ID */
  selectedStepId: string | null
  /** Callback when step is selected */
  onStepSelect: (stepId: string | null) => void
  /** All available step IDs for dependency selection */
  availableStepIds?: string[]
  /** Callback when a step field is edited */
  onStepFieldChange?: (stepId: string, field: string, value: string | number | string[]) => void
}

const containerStyle: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  backgroundColor: '#0f172a',
}

const contentStyle: CSSProperties = {
  paddingBottom: '32px',
}

const ungroupedHeaderStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  padding: '16px 16px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// Group colors for visual distinction
const GROUP_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#a855f7', // Purple
  '#0ea5e9', // Sky
]

interface StepGroup {
  id: string
  label: string
  steps: ProtoBead[]
  dependsOnGroup?: string
}

/**
 * Extract group prefix from step ID.
 * e.g., "step-1-beads-creation.load-inputs" → "step-1-beads-creation"
 */
function getGroupPrefix(stepId: string): string | null {
  const dotIndex = stepId.indexOf('.')
  if (dotIndex === -1) return null
  return stepId.substring(0, dotIndex)
}

/**
 * Format group label from prefix.
 * e.g., "step-1-beads-creation" → "Step 1: Beads Creation"
 */
function formatGroupLabel(prefix: string): string {
  const match = prefix.match(/^step-(\d+)-(.+)$/)
  if (match) {
    const stepNum = match[1]
    const name = match[2]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    return `Step ${stepNum}: ${name}`
  }
  return prefix
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Group steps by their expansion prefix.
 */
function groupSteps(steps: ProtoBead[]): { groups: StepGroup[]; ungrouped: ProtoBead[] } {
  const groupMap = new Map<string, ProtoBead[]>()
  const ungrouped: ProtoBead[] = []
  const groupOrder: string[] = []

  for (const step of steps) {
    const prefix = getGroupPrefix(step.id)
    if (prefix) {
      if (!groupMap.has(prefix)) {
        groupMap.set(prefix, [])
        groupOrder.push(prefix)
      }
      groupMap.get(prefix)!.push(step)
    } else {
      ungrouped.push(step)
    }
  }

  // Build groups with cross-group dependency detection
  const groups: StepGroup[] = []
  const groupIds = new Set(groupOrder)

  for (const prefix of groupOrder) {
    const groupSteps = groupMap.get(prefix)!

    // Check if any step in this group depends on a step from a different group
    let dependsOnGroup: string | undefined
    for (const step of groupSteps) {
      if (step.needs) {
        for (const needId of step.needs) {
          const needPrefix = getGroupPrefix(needId)
          if (needPrefix && needPrefix !== prefix && groupIds.has(needPrefix)) {
            dependsOnGroup = formatGroupLabel(needPrefix)
            break
          }
        }
      }
      if (dependsOnGroup) break
    }

    groups.push({
      id: prefix,
      label: formatGroupLabel(prefix),
      steps: groupSteps,
      dependsOnGroup,
    })
  }

  return { groups, ungrouped }
}

export function FormulaOutlineView({
  result,
  varValues,
  onVarChange,
  selectedStepId,
  onStepSelect,
  availableStepIds = [],
  onStepFieldChange,
}: FormulaOutlineViewProps) {
  const { groups, ungrouped } = useMemo(() => {
    return groupSteps(result.steps ?? [])
  }, [result.steps])

  const stepCount = result.steps?.length ?? 0
  const expansionCount = groups.length

  return (
    <div style={containerStyle}>
      {/* Formula Header */}
      <FormulaHeader
        name={result.formula ?? 'Unknown'}
        version={result.version}
        type={result.type}
        stepCount={stepCount}
        expansionCount={expansionCount}
      />

      <div style={contentStyle}>
        {/* Variables Section */}
        {result.vars && Object.keys(result.vars).length > 0 && (
          <VariablesSection
            vars={result.vars}
            values={varValues}
            onValueChange={onVarChange}
          />
        )}

        {/* Expansion Groups */}
        {groups.map((group, index) => (
          <ExpansionGroup
            key={group.id}
            groupId={group.id}
            label={group.label}
            steps={group.steps}
            groupNumber={index + 1}
            dependsOnGroup={group.dependsOnGroup}
            selectedStepId={selectedStepId}
            onStepSelect={onStepSelect}
            color={GROUP_COLORS[index % GROUP_COLORS.length]}
            availableStepIds={availableStepIds}
            onStepFieldChange={onStepFieldChange}
          />
        ))}

        {/* Ungrouped Steps */}
        {ungrouped.length > 0 && (
          <>
            <div style={ungroupedHeaderStyle}>Other Steps</div>
            {ungrouped.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                number={String(groups.length + index + 1)}
                isSelected={selectedStepId === step.id}
                onClick={() =>
                  onStepSelect(selectedStepId === step.id ? null : step.id)
                }
                availableStepIds={availableStepIds}
                onFieldChange={onStepFieldChange}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
