/**
 * Pour confirmation dialog.
 * Shows what will be created and provides pour/cancel actions.
 * Includes rollback option after successful pour.
 */
import { useState, useCallback, useEffect, type CSSProperties, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import type { CookResult, PourResult } from '@beads-ide/shared';
import { usePour } from '../../hooks/use-pour';

/** Props for the pour dialog */
export interface PourDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Proto ID to pour */
  protoId: string;
  /** Cook result with proto bead preview */
  cookResult: CookResult;
  /** Variable values to pass to pour */
  vars?: Record<string, string>;
  /** Callback after successful pour */
  onPourSuccess?: (result: PourResult) => void;
}

/** Props for bead preview list */
interface BeadPreviewListProps {
  beads: Array<{ id?: string; title: string; type?: string; priority?: number }>;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '8px',
  border: '1px solid #334155',
  width: '100%',
  maxWidth: '480px',
  maxHeight: '80vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #334155',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#e2e8f0',
  margin: 0,
};

const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px',
  fontSize: '18px',
  lineHeight: 1,
};

const contentStyle: CSSProperties = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1,
};

const sectionStyle: CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle: CSSProperties = {
  fontSize: '14px',
  color: '#e2e8f0',
  fontFamily: 'monospace',
};

const beadListStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const beadItemStyle: CSSProperties = {
  backgroundColor: '#0f172a',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #334155',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const beadTitleStyle: CSSProperties = {
  flex: 1,
  fontSize: '13px',
  color: '#e2e8f0',
};

const beadTypeStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6366f1',
  backgroundColor: '#1e1b4b',
  padding: '2px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
};

const footerStyle: CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid #334155',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

const buttonBaseStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 0.15s',
};

const cancelButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#374151',
  color: '#e5e7eb',
};

const pourButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#4f46e5',
  color: '#fff',
};

const burnButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#dc2626',
  color: '#fff',
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const successMessageStyle: CSSProperties = {
  backgroundColor: '#064e3b',
  border: '1px solid #10b981',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '16px',
};

const successTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#10b981',
  marginBottom: '4px',
};

const successTextStyle: CSSProperties = {
  fontSize: '13px',
  color: '#a7f3d0',
};

/**
 * Renders a preview list of beads to be created.
 */
function BeadPreviewList({ beads }: BeadPreviewListProps) {
  if (beads.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>
        No beads will be created
      </div>
    );
  }

  return (
    <ul style={beadListStyle}>
      {beads.map((bead, index) => (
        <li key={bead.id || index} style={beadItemStyle}>
          <span style={beadTitleStyle}>{bead.title}</span>
          {bead.type && <span style={beadTypeStyle}>{bead.type}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Pour confirmation dialog with preview and rollback support.
 */
export function PourDialog({
  isOpen,
  onClose,
  protoId,
  cookResult,
  vars,
  onPourSuccess,
}: PourDialogProps) {
  const { pour, burn, isLoading } = usePour();
  const [pourResult, setPourResult] = useState<PourResult | null>(null);
  const [isBurning, setIsBurning] = useState(false);

  const handlePour = useCallback(async () => {
    try {
      const result = await pour({ proto_id: protoId, vars });

      if (result.ok) {
        setPourResult(result);
        toast.success(`Created ${result.bead_count ?? 0} beads`, {
          description: `Molecule: ${result.molecule_id ?? 'unknown'}`,
        });
        onPourSuccess?.(result);
      } else {
        toast.error('Pour failed', {
          description: result.error ?? 'Unknown error',
        });
      }
    } catch (err) {
      toast.error('Pour failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [pour, protoId, vars, onPourSuccess]);

  const handleBurn = useCallback(async () => {
    if (!pourResult?.molecule_id) return;

    setIsBurning(true);
    try {
      const result = await burn(pourResult.molecule_id, true);

      if (result.ok) {
        toast.success('Rollback complete', {
          description: `Deleted ${result.deleted_count ?? 0} beads`,
        });
        setPourResult(null);
        onClose();
      } else {
        toast.error('Rollback failed', {
          description: result.error ?? 'Unknown error',
        });
      }
    } catch (err) {
      toast.error('Rollback failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsBurning(false);
    }
  }, [burn, pourResult, onClose]);

  const handleClose = useCallback(() => {
    setPourResult(null);
    onClose();
  }, [onClose]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const steps = cookResult.steps ?? [];
  const beadCount = steps.length;
  const hasPoured = pourResult?.ok;

  const handleOverlayKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClose();
    }
  };

  return (
    <div
      style={overlayStyle}
      onClick={handleClose}
      onKeyDown={handleOverlayKeyDown}
      role="presentation"
    >
      <dialog
        open
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-labelledby="pour-dialog-title"
      >
        <div style={headerStyle}>
          <h2 id="pour-dialog-title" style={titleStyle}>
            {hasPoured ? 'Pour Complete' : 'Confirm Pour'}
          </h2>
          <button
            style={closeButtonStyle}
            onClick={handleClose}
            aria-label="Close dialog"
            type="button"
          >
            &times;
          </button>
        </div>

        <div style={contentStyle}>
          {hasPoured && (
            <div style={successMessageStyle}>
              <div style={successTitleStyle}>Successfully created molecule</div>
              <div style={successTextStyle}>
                {pourResult.bead_count ?? 0} beads created
                {pourResult.molecule_id && (
                  <span style={{ fontFamily: 'monospace', marginLeft: '8px' }}>
                    ({pourResult.molecule_id})
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <div style={labelStyle}>Formula</div>
            <div style={valueStyle}>{protoId}</div>
          </div>

          <div style={sectionStyle}>
            <div style={labelStyle}>
              {hasPoured ? 'Created Beads' : 'Beads to Create'} ({beadCount})
            </div>
            <BeadPreviewList beads={steps} />
          </div>
        </div>

        <div style={footerStyle}>
          {hasPoured ? (
            <>
              <button
                style={{
                  ...burnButtonStyle,
                  ...(isBurning ? disabledButtonStyle : {}),
                }}
                onClick={handleBurn}
                disabled={isBurning}
                type="button"
              >
                {isBurning ? 'Rolling back...' : 'Rollback'}
              </button>
              <button
                style={cancelButtonStyle}
                onClick={handleClose}
                type="button"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                style={cancelButtonStyle}
                onClick={handleClose}
                disabled={isLoading}
                type="button"
              >
                Cancel
              </button>
              <button
                style={{
                  ...pourButtonStyle,
                  ...(isLoading || beadCount === 0 ? disabledButtonStyle : {}),
                }}
                onClick={handlePour}
                disabled={isLoading || beadCount === 0}
                type="button"
              >
                {isLoading ? 'Pouring...' : `Pour ${beadCount} Beads`}
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
