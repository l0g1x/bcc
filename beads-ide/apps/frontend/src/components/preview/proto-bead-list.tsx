/**
 * Proto bead cards list component.
 * Displays the beads that will be created when a formula is poured.
 */
import type { ProtoBead } from '@beads-ide/shared'

/** Props for the proto bead card */
interface ProtoBeadCardProps {
  bead: ProtoBead
}

/** Priority badge config with colors and icons (WCAG 2.1 AA - not color-only) */
const priorityConfig: Record<number, { color: string; icon: string; label: string }> = {
  0: { color: '#22c55e', icon: '▲▲', label: 'Critical' }, // green - highest priority
  1: { color: '#eab308', icon: '▲', label: 'High' }, // yellow - high priority
  2: { color: '#f97316', icon: '◆', label: 'Medium' }, // orange - medium priority
  3: { color: '#ef4444', icon: '▼', label: 'Low' }, // red - low priority
}

/**
 * Card displaying a single proto bead.
 */
function ProtoBeadCard({ bead }: ProtoBeadCardProps) {
  const priority = priorityConfig[bead.priority] ?? {
    color: '#6b7280',
    icon: '○',
    label: 'Unknown',
  }
  const dependencyCount = bead.needs?.length ?? 0

  return (
    <div
      style={{
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: '#1f2937',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#f9fafb',
            flex: 1,
          }}
        >
          {bead.title}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: priority.color,
            color: '#000',
            fontWeight: 500,
          }}
          aria-label={`Priority ${bead.priority}: ${priority.label}`}
        >
          <span aria-hidden="true">{priority.icon}</span>
          P{bead.priority}
        </span>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginBottom: '8px',
          lineHeight: 1.4,
          maxHeight: '3.5em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {bead.description.split('\n')[0]}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: '#6b7280',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#374151',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {bead.id}
        </span>
        {dependencyCount > 0 && (
          <span>
            {dependencyCount} {dependencyCount === 1 ? 'dependency' : 'dependencies'}
          </span>
        )}
      </div>
    </div>
  )
}

/** Props for the proto bead list */
export interface ProtoBeadListProps {
  /** List of proto beads to display */
  beads: ProtoBead[]
  /** Optional title override */
  title?: string
}

/**
 * List of proto bead cards showing what will be created.
 */
export function ProtoBeadList({
  beads,
  title = "Here's what will be created",
}: ProtoBeadListProps) {
  if (beads.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        No steps defined in this formula
      </div>
    )
  }

  // Sort by priority (0 = highest), then by id
  const sortedBeads = [...beads].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return a.id.localeCompare(b.id)
  })

  return (
    <div>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#d1d5db',
          marginBottom: '12px',
        }}
      >
        {title}
      </h3>
      <div>
        {sortedBeads.map((bead) => (
          <ProtoBeadCard key={bead.id} bead={bead} />
        ))}
      </div>
    </div>
  )
}
