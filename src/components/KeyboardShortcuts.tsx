/* ========================================
   FREE PDF TTS READER — Keyboard Shortcuts
   by Analyst Sandeep
   
   Quick-reference popup that appears
   when user presses the ? key.
   ======================================== */

import { X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A single shortcut row.
 */
function ShortcutRow({
  keys,
  action,
}: {
  keys: string;
  action: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <kbd
        style={{
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'monospace',
          fontWeight: 600,
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          boxShadow: '0 2px 0 var(--border-color)',
          minWidth: '80px',
          textAlign: 'center',
        }}
      >
        {keys}
      </kbd>
      <span
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'right',
        }}
      >
        {action}
      </span>
    </div>
  );
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content glass-strong"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⌨️</span>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close shortcuts"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div style={{ padding: '16px 24px' }}>
          {/* Section: Playback */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-start)',
              marginBottom: '8px',
            }}
          >
            Playback
          </div>
          <ShortcutRow keys="Space" action="Pause / Resume" />
          <ShortcutRow keys="Escape" action="Stop & clear highlights" />

          {/* Section: View */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-start)',
              marginTop: '16px',
              marginBottom: '8px',
            }}
          >
            View
          </div>
          <ShortcutRow keys="Ctrl + =" action="Zoom in" />
          <ShortcutRow keys="Ctrl + -" action="Zoom out" />
          <ShortcutRow keys="Ctrl + 0" action="Fit to width" />

          {/* Section: Other */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-start)',
              marginTop: '16px',
              marginBottom: '8px',
            }}
          >
            Other
          </div>
          <ShortcutRow keys="?" action="Toggle this panel" />

          {/* Section: Mouse */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-start)',
              marginTop: '16px',
              marginBottom: '8px',
            }}
          >
            Mouse
          </div>
          <ShortcutRow keys="Click" action="Read from word" />
          <ShortcutRow keys="Dbl Click" action="Instant pause" />
          <ShortcutRow keys="Rt Click" action="Word definition" />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={onClose}
            className="btn-gradient"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}