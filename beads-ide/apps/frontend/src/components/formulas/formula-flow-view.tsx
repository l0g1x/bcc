/**
 * Formula flow view - execution-focused visualization.
 * Shows steps organized by execution waves with blocking relationships.
 * Highlights bottleneck steps that block multiple downstream steps.
 */
import type { CookResult, ProtoBead } from '@beads-ide/shared'
import { type CSSProperties, useMemo } from 'react'

export interface FormulaFlowViewProps {
  /** Cook result containing formula data */
  result: CookResult
  /** Currently selected step ID */
  selectedStepId: string | null
  /** Callback when step is selected */
  onStepSelect: (stepId: string | null) => void
}

const containerStyle: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  backgroundColor: '#0f172a',
  padding: '24px',
}

const headerStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const legendStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  fontSize: '11px',
  color: '#9ca3af',
  marginLeft: 'auto',
}

const legendItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const waveContainerStyle: CSSProperties = {
  marginBottom: '32px',
}

const waveLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const waveLineStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  backgroundColor: '#334155',
}

const stepsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  justifyContent: 'center',
}

const stepCardStyle = (
  isSelected: boolean,
  isBottleneck: boolean,
  isGate: boolean
): CSSProperties => ({
  backgroundColor: isSelected
    ? 'rgba(59, 130, 246, 0.15)'
    : isBottleneck
      ? 'rgba(239, 68, 68, 0.1)'
      : isGate
        ? 'rgba(245, 158, 11, 0.1)'
        : '#1e293b',
  border: isSelected
    ? '2px solid #3b82f6'
    : isBottleneck
      ? '1px solid #ef4444'
      : isGate
        ? '1px solid #f59e0b'
        : '1px solid #334155',
  borderRadius: '8px',
  padding: '12px 16px',
  minWidth: '200px',
  maxWidth: '280px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
})

const stepTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#e2e8f0',
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const stepIdStyle: CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  color: '#6b7280',
  marginBottom: '8px',
}

const badgeRowStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
}

const badgeStyle = (type: 'blocks' | 'needs' | 'gate'): CSSProperties => ({
  fontSize: '10px',
  fontFamily: 'monospace',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor:
    type === 'blocks'
      ? 'rgba(239, 68, 68, 0.2)'
      : type === 'gate'
        ? 'rgba(245, 158, 11, 0.2)'
        : 'rgba(107, 114, 128, 0.2)',
  color: type === 'blocks' ? '#fca5a5' : type === 'gate' ? '#fcd34d' : '#9ca3af',
})

const bottleneckIndicator: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#ef4444',
}

const gateIndicator: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#f59e0b',
}

const arrowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px 0',
  color: '#475569',
  fontSize: '16px',
}

interface StepWithMeta extends ProtoBead {
  wave: number
  blocks: string[] // Steps that depend on this step
  isBottleneck: boolean // Blocks 2+ steps
  isGate: boolean // Has 2+ needs
}

/**
 * Compute execution waves and blocking relationships.
 */
function computeFlowData(steps: ProtoBead[]): {
  waves: StepWithMeta[][]
  maxWave: number
} {
  if (!steps || steps.length === 0) {
    return { waves: [], maxWave: 0 }
  }

  const stepMap = new Map<string, ProtoBead>()
  for (const step of steps) {
    stepMap.set(step.id, step)
  }

  // Build reverse dependency map (what does each step block?)
  const blocksMap = new Map<string, string[]>()
  for (const step of steps) {
    blocksMap.set(step.id, [])
  }
  for (const step of steps) {
    if (step.needs) {
      for (const needId of step.needs) {
        const blocks = blocksMap.get(needId)
        if (blocks) {
          blocks.push(step.id)
        }
      }
    }
  }

  // Compute waves (topological levels)
  const waveMap = new Map<string, number>()
  const computeWave = (stepId: string, visited: Set<string>): number => {
    if (waveMap.has(stepId)) return waveMap.get(stepId) ?? 0
    if (visited.has(stepId)) return 0 // Cycle detected

    visited.add(stepId)
    const step = stepMap.get(stepId)
    if (!step || !step.needs || step.needs.length === 0) {
      waveMap.set(stepId, 0)
      return 0
    }

    let maxDepWave = -1
    for (const needId of step.needs) {
      if (stepMap.has(needId)) {
        maxDepWave = Math.max(maxDepWave, computeWave(needId, visited))
      }
    }
    const wave = maxDepWave + 1
    waveMap.set(stepId, wave)
    return wave
  }

  for (const step of steps) {
    computeWave(step.id, new Set())
  }

  // Build steps with metadata
  const stepsWithMeta: StepWithMeta[] = steps.map((step) => {
    const blocks = blocksMap.get(step.id) ?? []
    return {
      ...step,
      wave: waveMap.get(step.id) ?? 0,
      blocks,
      isBottleneck: blocks.length >= 2,
      isGate: (step.needs?.length ?? 0) >= 2,
    }
  })

  // Group by wave
  const maxWave = Math.max(...stepsWithMeta.map((s) => s.wave), 0)
  const waves: StepWithMeta[][] = []
  for (let w = 0; w <= maxWave; w++) {
    waves.push(stepsWithMeta.filter((s) => s.wave === w))
  }

  return { waves, maxWave }
}

/**
 * Format step ID for display (shorten if has group prefix).
 */
function formatStepId(stepId: string): string {
  if (stepId.includes('.')) {
    const parts = stepId.split('.')
    return parts[parts.length - 1]
  }
  return stepId
}

export function FormulaFlowView({
  result,
  selectedStepId,
  onStepSelect,
}: FormulaFlowViewProps) {
  const { waves } = useMemo(() => {
    return computeFlowData(result.steps ?? [])
  }, [result.steps])

  const totalSteps = result.steps?.length ?? 0
  const bottleneckCount = waves.flat().filter((s) => s.isBottleneck).length
  const gateCount = waves.flat().filter((s) => s.isGate).length

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Execution Flow</span>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
          {totalSteps} steps in {waves.length} waves
        </span>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={bottleneckIndicator} />
            <span>Bottleneck ({bottleneckCount})</span>
          </div>
          <div style={legendItemStyle}>
            <div style={gateIndicator} />
            <span>Gate ({gateCount})</span>
          </div>
        </div>
      </div>

      {waves.map((waveSteps, waveIndex) => (
        <div key={`wave-${waveSteps.map(s => s.id).join('-')}`}>
          <div style={waveContainerStyle}>
            <div style={waveLabelStyle}>
              <span>Wave {waveIndex + 1}</span>
              <span style={{ fontWeight: 400, textTransform: 'none' }}>
                ({waveSteps.length} parallel)
              </span>
              <div style={waveLineStyle} />
            </div>

            <div style={stepsRowStyle}>
              {waveSteps.map((step) => (
                <button
                  type="button"
                  key={step.id}
                  style={{ ...stepCardStyle(
                    selectedStepId === step.id,
                    step.isBottleneck,
                    step.isGate
                  ), textAlign: 'left' }}
                  onClick={() =>
                    onStepSelect(selectedStepId === step.id ? null : step.id)
                  }
                >
                  <div style={stepTitleStyle} title={step.title}>
                    {step.title}
                  </div>
                  <div style={stepIdStyle}>{formatStepId(step.id)}</div>
                  <div style={badgeRowStyle}>
                    {step.isGate && (
                      <span style={badgeStyle('gate')}>
                        ← {step.needs?.length} inputs
                      </span>
                    )}
                    {step.isBottleneck && (
                      <span style={badgeStyle('blocks')}>
                        → blocks {step.blocks.length}
                      </span>
                    )}
                    {!step.isGate && !step.isBottleneck && step.needs && step.needs.length > 0 && (
                      <span style={badgeStyle('needs')}>← 1 input</span>
                    )}
                    {!step.isGate && !step.isBottleneck && step.blocks.length === 1 && (
                      <span style={badgeStyle('needs')}>→ 1 output</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Arrow between waves */}
          {waveIndex < waves.length - 1 && <div style={arrowStyle}>↓</div>}
        </div>
      ))}

      {waves.length === 0 && (
        <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
          No steps to display
        </div>
      )}
    </div>
  )
}
