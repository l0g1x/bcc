/**
 * Unsaved changes confirmation modal.
 * Shown when navigating away from content with unsaved changes.
 * Provides Save, Discard, and Cancel actions.
 */
import { type CSSProperties, useCallback, useEffect, useRef } from 'react'

/** Props for the unsaved changes modal */
export interface UnsavedChangesModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to save changes before proceeding */
  onSave: () => void
  /** Callback to discard changes and proceed */
  onDiscard: () => void
  /** Callback to cancel and stay on current content */
  onCancel: () => void
  /** Custom title (default: "Unsaved Changes") */
  title?: string
  /** Custom message (default: "You have unsaved changes. Do you want to save them before leaving?") */
  message?: string
  /** Custom label for save button (default: "Save") */
  saveLabel?: string
  /** Custom label for discard button (default: "Discard") */
  discardLabel?: string
  /** Custom label for cancel button (default: "Cancel") */
  cancelLabel?: string
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const dialogStyle: CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '8px',
  border: '1px solid #334155',
  width: '100%',
  maxWidth: '400px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #334155',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#e2e8f0',
  margin: 0,
}

const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px',
  fontSize: '18px',
  lineHeight: 1,
}

const contentStyle: CSSProperties = {
  padding: '20px',
}

const messageStyle: CSSProperties = {
  fontSize: '14px',
  color: '#cbd5e1',
  lineHeight: 1.5,
}

const footerStyle: CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid #334155',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
}

const buttonBaseStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 0.15s',
}

const cancelButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#374151',
  color: '#e5e7eb',
}

const discardButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#dc2626',
  color: '#fff',
}

const saveButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#4f46e5',
  color: '#fff',
}

/**
 * Modal dialog for confirming unsaved changes.
 * Uses native dialog element for proper focus trap (WCAG 2.1 AA).
 */
export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Do you want to save them before leaving?',
  saveLabel = 'Save',
  discardLabel = 'Discard',
  cancelLabel = 'Cancel',
}: UnsavedChangesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Manage dialog open/close with showModal for proper focus trap
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Handle native dialog cancel event (Escape key)
  const handleDialogCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault()
      onCancel()
    },
    [onCancel]
  )

  // Handle overlay click to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel()
      }
    },
    [onCancel]
  )

  // Handle keyboard events on overlay
  const handleOverlayKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === dialogRef.current) {
        onCancel()
      }
    },
    [onCancel]
  )

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      style={{
        ...overlayStyle,
        border: 'none',
        padding: 0,
        maxWidth: '100vw',
        maxHeight: '100vh',
      }}
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-message"
      onCancel={handleDialogCancel}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <h2 id="unsaved-changes-title" style={titleStyle}>
            {title}
          </h2>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onCancel}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div style={contentStyle}>
          <p id="unsaved-changes-message" style={messageStyle}>
            {message}
          </p>
        </div>

        <div style={footerStyle}>
          <button type="button" style={cancelButtonStyle} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" style={discardButtonStyle} onClick={onDiscard}>
            {discardLabel}
          </button>
          <button type="button" style={saveButtonStyle} onClick={onSave}>
            {saveLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
