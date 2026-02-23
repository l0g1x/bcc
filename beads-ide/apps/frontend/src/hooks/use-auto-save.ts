/**
 * Debounced auto-save hook for formula editor.
 *
 * Saves formula content 500ms after the user stops typing.
 * Provides save state indicator and error handling via Sonner toasts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { saveFormula } from '@/lib/api';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 500;

export interface UseAutoSaveOptions {
  /** Formula name (filename without extension) */
  name: string;
  /** Current content to save */
  content: string;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  /** Current save state */
  saveState: SaveState;
  /** Manually trigger a save (bypasses debounce) */
  saveNow: () => Promise<void>;
}

/**
 * Hook for debounced auto-save of formula content.
 *
 * @example
 * ```tsx
 * const { saveState } = useAutoSave({
 *   name: 'my-formula',
 *   content: formulaContent,
 * });
 *
 * return (
 *   <div>
 *     {saveState === 'saving' && <span>Saving...</span>}
 *     {saveState === 'saved' && <span>Saved</span>}
 *   </div>
 * );
 * ```
 */
export function useAutoSave({
  name,
  content,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isMountedRef = useRef(true);

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Save function
  const performSave = useCallback(
    async (contentToSave: string) => {
      if (!isMountedRef.current) return;

      setSaveState('saving');

      try {
        await saveFormula(name, contentToSave);

        if (!isMountedRef.current) return;

        lastSavedContentRef.current = contentToSave;
        setSaveState('saved');

        // Reset to idle after showing "Saved" briefly
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveState('idle');
          }
        }, 2000);
      } catch (error) {
        if (!isMountedRef.current) return;

        setSaveState('error');
        const message =
          error instanceof Error ? error.message : 'Failed to save formula';
        toast.error(message);

        // Reset to idle after error
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveState('idle');
          }
        }, 3000);
      }
    },
    [name]
  );

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(async () => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await performSave(content);
  }, [content, performSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Skip if content hasn't changed from last saved version
    if (content === lastSavedContentRef.current) return;

    // Clear existing timeout (debounce reset on new keystroke)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave(content);
    }, DEBOUNCE_MS);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [content, enabled, performSave]);

  return {
    saveState,
    saveNow,
  };
}
