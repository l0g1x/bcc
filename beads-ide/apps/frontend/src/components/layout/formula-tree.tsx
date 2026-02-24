import type { FormulaListItem } from '@beads-ide/shared'
/**
 * Formula tree component for the sidebar.
 * Displays formulas grouped by search path directory.
 */
import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useFormulaDirty, useFormulaSave } from '../../contexts'
import { useFormulas } from '../../hooks'
import { UnsavedChangesModal } from '../ui/unsaved-changes-modal'

// Styles
const treeContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const groupStyle: CSSProperties = {
  marginBottom: '8px',
}

const groupHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
  borderRadius: '3px',
  fontSize: '11px',
  color: '#cccccc',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  userSelect: 'none',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
}

const groupHeaderHoverStyle: CSSProperties = {
  ...groupHeaderStyle,
  backgroundColor: '#2a2d2e',
}

const groupItemsStyle: CSSProperties = {
  paddingLeft: '12px',
}

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
  borderRadius: '3px',
  fontSize: '13px',
  color: '#cccccc',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
}

const itemHoverStyle: CSSProperties = {
  ...itemStyle,
  backgroundColor: '#2a2d2e',
}

const itemActiveStyle: CSSProperties = {
  ...itemStyle,
  backgroundColor: '#094771',
  color: '#ffffff',
}

const iconStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  flexShrink: 0,
}

const dirtyDotStyle: CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#fbbf24',
  flexShrink: 0,
  marginLeft: 'auto',
}

const skeletonStyle: CSSProperties = {
  height: '24px',
  backgroundColor: '#3c3c3c',
  borderRadius: '3px',
  marginBottom: '4px',
  animation: 'pulse 1.5s ease-in-out infinite',
}

const emptyStateStyle: CSSProperties = {
  padding: '16px',
  textAlign: 'center',
  color: '#858585',
  fontSize: '12px',
}

const emptyStateHeadingStyle: CSSProperties = {
  fontSize: '14px',
  color: '#cccccc',
  marginBottom: '12px',
}

const searchPathListStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '11px',
  fontFamily: 'monospace',
  backgroundColor: '#1e1e1e',
  padding: '8px',
  borderRadius: '4px',
  marginTop: '12px',
}

const searchPathItemStyle: CSSProperties = {
  padding: '2px 0',
  color: '#569cd6',
}

const errorStyle: CSSProperties = {
  padding: '12px',
  color: '#f48771',
  fontSize: '12px',
  backgroundColor: '#3c1f1e',
  borderRadius: '4px',
  margin: '8px',
}

// SVG Icons (Lucide-style) - marked as decorative with aria-hidden
function FolderIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg
        style={iconStyle}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <path d="M2 10h20" />
      </svg>
    )
  }
  return (
    <svg
      style={iconStyle}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function FileCodeIcon() {
  return (
    <svg
      style={iconStyle}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      style={{
        ...iconStyle,
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// Group formulas by search path label
interface FormulaGroup {
  label: string
  searchPath: string
  formulas: FormulaListItem[]
}

function groupFormulas(formulas: FormulaListItem[]): FormulaGroup[] {
  const groups = new Map<string, FormulaGroup>()

  for (const formula of formulas) {
    const key = formula.searchPath
    let group = groups.get(key)
    if (!group) {
      group = {
        label: formula.searchPathLabel,
        searchPath: formula.searchPath,
        formulas: [],
      }
      groups.set(key, group)
    }
    group.formulas.push(formula)
  }

  // Convert to array and sort groups by label
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label))
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: intentional ARIA status role on loading skeleton container
    <div style={treeContainerStyle} role="status" aria-live="polite" aria-label="Loading formulas">
      <style>
        {`@keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }`}
      </style>
      <span
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
        }}
      >
        Loading formulas...
      </span>
      <div style={{ ...skeletonStyle, width: '60%' }} aria-hidden="true" />
      <div style={{ ...skeletonStyle, width: '80%', marginLeft: '12px' }} aria-hidden="true" />
      <div style={{ ...skeletonStyle, width: '70%', marginLeft: '12px' }} aria-hidden="true" />
      <div style={{ ...skeletonStyle, width: '65%', marginTop: '8px' }} aria-hidden="true" />
      <div style={{ ...skeletonStyle, width: '75%', marginLeft: '12px' }} aria-hidden="true" />
    </div>
  )
}

// Empty state component
function EmptyState({ searchPaths }: { searchPaths: string[] }) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyStateHeadingStyle}>Create your first formula</div>
      <p>
        No formulas found. Place a <code>.formula.toml</code> file in one of these directories:
      </p>
      <div style={searchPathListStyle}>
        {searchPaths.length > 0 ? (
          searchPaths.map((path) => (
            <div key={path} style={searchPathItemStyle}>
              {path}
            </div>
          ))
        ) : (
          <>
            <div style={searchPathItemStyle}>formulas/</div>
            <div style={searchPathItemStyle}>.beads/formulas/</div>
            <div style={searchPathItemStyle}>~/.beads/formulas/</div>
            <div style={searchPathItemStyle}>$GT_ROOT/.beads/formulas/</div>
          </>
        )}
      </div>
    </div>
  )
}

// Formula group component
interface FormulaGroupProps {
  group: FormulaGroup
  selectedFormula: string | null
  onSelectFormula: (name: string) => void
  isFormulaDirty: (name: string) => boolean
}

function FormulaGroupSection({
  group,
  selectedFormula,
  onSelectFormula,
  isFormulaDirty,
}: FormulaGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const [headerHovered, setHeaderHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Handle keyboard navigation within the group
  const handleKeyDown = (e: React.KeyboardEvent, formula: { name: string }) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectFormula(formula.name)
    }
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: div group widget, fieldset would disrupt sidebar layout
    <div style={groupStyle} role="group" aria-label={group.label}>
      <button
        type="button"
        style={headerHovered ? groupHeaderHoverStyle : groupHeaderStyle}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        aria-expanded={expanded}
        aria-label={`${group.label}, ${group.formulas.length} formulas`}
      >
        <ChevronIcon expanded={expanded} />
        <FolderIcon expanded={expanded} />
        <span>{group.label}</span>
        <span style={{ color: '#858585', marginLeft: 'auto' }} aria-hidden="true">
          {group.formulas.length}
        </span>
      </button>

      {expanded && (
        // biome-ignore lint/a11y/useSemanticElements: div group widget, fieldset would disrupt layout
        <div style={groupItemsStyle} role="group">
          {group.formulas.map((formula) => {
            const isSelected = selectedFormula === formula.name
            const isHovered = hoveredItem === formula.name

            let style = itemStyle
            if (isSelected) {
              style = itemActiveStyle
            } else if (isHovered) {
              style = itemHoverStyle
            }

            return (
              <button
                type="button"
                key={formula.path}
                style={style}
                onClick={() => onSelectFormula(formula.name)}
                onKeyDown={(e) => handleKeyDown(e, formula)}
                onMouseEnter={() => setHoveredItem(formula.name)}
                onMouseLeave={() => setHoveredItem(null)}
                aria-pressed={isSelected}
                aria-label={`Formula: ${formula.name}${isFormulaDirty(formula.name) ? ', unsaved changes' : ''}`}
              >
                <FileCodeIcon />
                <span>{formula.name}</span>
                {isFormulaDirty(formula.name) && (
                  <span style={dirtyDotStyle} aria-hidden="true" title="Unsaved changes" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Main component
export interface FormulaTreeProps {
  /** Currently selected formula name */
  selectedFormula?: string | null
  /** Callback when a formula is selected */
  onSelectFormula?: (name: string) => void
}

export function FormulaTree({ selectedFormula = null, onSelectFormula }: FormulaTreeProps) {
  const { formulas, isLoading, error, searchPaths } = useFormulas()
  const { isDirty, setDirty } = useFormulaDirty()
  const { save, canSave } = useFormulaSave()

  // Track pending navigation when dirty
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const groups = useMemo(() => groupFormulas(formulas), [formulas])

  // Get current formula from URL
  const getCurrentFormula = useCallback((): string | null => {
    const path = window.location.pathname
    const match = path.match(/^\/formula\/(.+)$/)
    if (match) {
      return decodeURIComponent(match[1])
    }
    return null
  }, [])

  // Perform the actual navigation
  const navigateTo = useCallback(
    (name: string) => {
      if (onSelectFormula) {
        onSelectFormula(name)
      }
      window.history.pushState({}, '', `/formula/${encodeURIComponent(name)}`)
      // Dispatch popstate to notify TanStack Router of the change
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    [onSelectFormula]
  )

  const handleSelectFormula = useCallback(
    (name: string) => {
      const currentFormula = getCurrentFormula()

      // If navigating to a different formula and current one is dirty, show modal
      if (currentFormula && currentFormula !== name && isDirty(currentFormula)) {
        setPendingNavigation(name)
        setShowModal(true)
        return
      }

      // Otherwise navigate directly
      navigateTo(name)
    },
    [getCurrentFormula, isDirty, navigateTo]
  )

  // Modal handlers
  const handleSave = useCallback(async () => {
    if (canSave()) {
      await save()
    }
    setShowModal(false)
    if (pendingNavigation) {
      navigateTo(pendingNavigation)
      setPendingNavigation(null)
    }
  }, [canSave, save, pendingNavigation, navigateTo])

  const handleDiscard = useCallback(() => {
    const currentFormula = getCurrentFormula()
    if (currentFormula) {
      setDirty(currentFormula, false)
    }
    setShowModal(false)
    if (pendingNavigation) {
      navigateTo(pendingNavigation)
      setPendingNavigation(null)
    }
  }, [getCurrentFormula, setDirty, pendingNavigation, navigateTo])

  const handleCancel = useCallback(() => {
    setShowModal(false)
    setPendingNavigation(null)
  }, [])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <strong>Failed to load formulas</strong>
        <br />
        {error.message}
      </div>
    )
  }

  if (formulas.length === 0) {
    return <EmptyState searchPaths={searchPaths} />
  }

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: landmark region container, section requires heading per WCAG */}
      <div style={treeContainerStyle} role="region" aria-label="Formula files">
        {groups.map((group) => (
          <FormulaGroupSection
            key={group.searchPath}
            group={group}
            selectedFormula={selectedFormula}
            onSelectFormula={handleSelectFormula}
            isFormulaDirty={isDirty}
          />
        ))}
      </div>

      <UnsavedChangesModal
        isOpen={showModal}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
      />
    </>
  )
}
