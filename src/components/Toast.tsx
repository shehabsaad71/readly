/* ========================================
   FREE PDF TTS READER — Toast Notifications
   by Analyst Sandeep
   
   Renders toast notifications in the
   bottom-right corner. Auto-dismiss with
   smooth enter/exit animations.
   ======================================== */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ToastMessage, ToastType } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * Get background color for toast type.
 */
function getToastColors(type: ToastType): {
  bg: string;
  border: string;
  iconBg: string;
} {
  switch (type) {
    case 'success':
      return {
        bg: 'var(--bg-secondary)',
        border: 'rgba(34, 197, 94, 0.3)',
        iconBg: 'rgba(34, 197, 94, 0.12)',
      };
    case 'error':
      return {
        bg: 'var(--bg-secondary)',
        border: 'rgba(239, 68, 68, 0.3)',
        iconBg: 'rgba(239, 68, 68, 0.12)',
      };
    case 'warning':
      return {
        bg: 'var(--bg-secondary)',
        border: 'rgba(245, 158, 11, 0.3)',
        iconBg: 'rgba(245, 158, 11, 0.12)',
      };
    case 'info':
      return {
        bg: 'var(--bg-secondary)',
        border: 'rgba(59, 130, 246, 0.3)',
        iconBg: 'rgba(59, 130, 246, 0.12)',
      };
  }
}

/**
 * Single toast component with auto-dismiss countdown.
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const colors = getToastColors(toast.type);

  // Countdown progress bar
  useEffect(() => {
    const startTime = Date.now();
    const duration = toast.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  // Handle dismiss with exit animation
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280);
  };

  return (
    <div
      className={isExiting ? 'toast-exit' : 'toast-enter'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 24px var(--shadow-color)',
        maxWidth: '360px',
        minWidth: '280px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={handleDismiss}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.iconBg,
          fontSize: '16px',
        }}
      >
        {toast.icon}
      </div>

      {/* Message */}
      <div
        style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          paddingTop: '4px',
        }}
      >
        {toast.message}
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginTop: '2px',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'var(--bg-tertiary)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
        }}
        aria-label="Dismiss notification"
      >
        <X size={12} />
      </button>

      {/* Progress Bar (countdown) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          width: `${progress}%`,
          background: `linear-gradient(90deg, var(--accent-start), var(--accent-end))`,
          borderRadius: '0 2px 0 0',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}

/**
 * Toast container — renders all active toasts stacked.
 */
export default function ToastContainer({
  toasts,
  onDismiss,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}