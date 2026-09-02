/* ========================================
   FREE PDF TTS READER — Toast Hook
   by Analyst Sandeep
   
   Lightweight toast notification system.
   
   Features:
   - Multiple toasts can stack
   - Auto-dismiss with configurable duration
   - 4 types: success, error, warning, info
   - Smooth enter/exit animations
   - No external library needed
   ======================================== */

import { useState, useCallback, useRef } from 'react';
import type { ToastMessage, ToastType } from '../types';

/** Maximum number of toasts visible at once */
const MAX_TOASTS = 4;

/** Default duration per toast type (ms) */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

/** Default icons per toast type */
const DEFAULT_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Generate a unique ID for each toast.
 */
let toastCounter = 0;
function generateId(): string {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

/**
 * Hook to manage toast notifications.
 * 
 * Usage:
 *   const toast = useToast();
 *   
 *   toast.success('PDF loaded successfully!');
 *   toast.error('Failed to load PDF');
 *   toast.warning('No voices available');
 *   toast.info('Voice changed to Microsoft Zira');
 *   
 *   // Custom:
 *   toast.show({
 *     type: 'success',
 *     icon: '🎉',
 *     message: 'Reading Complete!',
 *     duration: 4000,
 *   });
 *   
 *   // In JSX:
 *   toast.toasts — array of active toasts to render
 *   toast.dismiss(id) — manually dismiss a toast
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  /**
   * Dismiss a specific toast by ID.
   */
  const dismiss = useCallback((id: string) => {
    // Clear the auto-dismiss timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Show a toast notification.
   */
  const show = useCallback(
    (options: {
      type?: ToastType;
      icon?: string;
      message: string;
      duration?: number;
    }) => {
      const type = options.type || 'info';
      const id = generateId();

      const toast: ToastMessage = {
        id,
        type,
        icon: options.icon || DEFAULT_ICONS[type],
        message: options.message,
        duration: options.duration || DEFAULT_DURATIONS[type],
      };

      setToasts((prev) => {
        // Remove oldest if we exceed max
        const updated = [...prev, toast];
        if (updated.length > MAX_TOASTS) {
          const removed = updated.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return updated;
      });

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        dismiss(id);
      }, toast.duration);

      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss]
  );

  /**
   * Convenience methods for each toast type.
   */
  const success = useCallback(
    (message: string, icon?: string, duration?: number) => {
      return show({ type: 'success', message, icon, duration });
    },
    [show]
  );

  const error = useCallback(
    (message: string, icon?: string, duration?: number) => {
      return show({ type: 'error', message, icon, duration });
    },
    [show]
  );

  const warning = useCallback(
    (message: string, icon?: string, duration?: number) => {
      return show({ type: 'warning', message, icon, duration });
    },
    [show]
  );

  const info = useCallback(
    (message: string, icon?: string, duration?: number) => {
      return show({ type: 'info', message, icon, duration });
    },
    [show]
  );

  /**
   * Clear all toasts.
   */
  const clearAll = useCallback(() => {
    // Clear all timers
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    setToasts([]);
  }, []);

  /**
   * Pre-built toast messages for common app events.
   */
  const pdfLoaded = useCallback(
    (pages: number, words: number, readTime: number) => {
      return success(
        `PDF loaded! ${pages} pages, ${words.toLocaleString()} words · ~${readTime} min read`,
        '📄',
        4000
      );
    },
    [success]
  );

  const voiceChanged = useCallback(
    (voiceName: string) => {
      return info(`Voice: ${voiceName}`, '🔊', 2000);
    },
    [info]
  );

  const themeChanged = useCallback(
    (themeName: string) => {
      return info(`Theme: ${themeName}`, '🎨', 2000);
    },
    [info]
  );

  const speedChanged = useCallback(
    (speed: number) => {
      return info(`Speed: ${speed}x`, '⚡', 2000);
    },
    [info]
  );

  const readingComplete = useCallback(() => {
    return success('Reading Complete!', '🎉', 4000);
  }, [success]);

  const noTextFound = useCallback(() => {
    return warning(
      'No extractable text found in this PDF. It may be a scanned document.',
      '📄',
      6000
    );
  }, [warning]);

  const noVoicesFound = useCallback(() => {
    return warning(
      'No voices found. Try using Google Chrome or Microsoft Edge for the best experience.',
      '🔇',
      6000
    );
  }, [warning]);

  const offlineWarning = useCallback(() => {
    return warning(
      'You appear to be offline. Word definitions need internet, but reading works offline.',
      '🌐',
      5000
    );
  }, [warning]);

  return {
    // Toast data
    toasts,

    // Generic methods
    show,
    dismiss,
    clearAll,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // Pre-built app-specific toasts
    pdfLoaded,
    voiceChanged,
    themeChanged,
    speedChanged,
    readingComplete,
    noTextFound,
    noVoicesFound,
    offlineWarning,
  };
}