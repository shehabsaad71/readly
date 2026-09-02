/* ========================================
   FREE PDF TTS READER — Definition Popup
   by Analyst Sandeep
   
   Premium popup for word definitions.
   Appears on right-click.
   Shows phonetic, part of speech, definitions.
   Handles loading, errors, offline gracefully.
   MOBILE: Bottom sheet instead of positioned popup
   ======================================== */

import { X, Volume2, Wifi, BookOpen, Loader } from 'lucide-react';
import type { DictionaryState } from '../types';

interface DefinitionPopupProps {
  state: DictionaryState;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

/**
 * Play pronunciation audio if available.
 */
function playAudio(url: string) {
  try {
    const audio = new Audio(url);
    audio.play().catch(() => {
      // Ignore audio play errors
    });
  } catch {
    // Ignore errors
  }
}

export default function DefinitionPopup({
  state,
  isOpen,
  onClose,
  isMobile = false,
}: DefinitionPopupProps) {
  if (!isOpen) return null;

  // Find audio URL from phonetics
  const audioUrl = state.result?.phonetics?.find((p) => p.audio)?.audio;

  // ============ MOBILE: Bottom sheet ============
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 44,
            animation: 'overlay-in 0.2s ease forwards',
          }}
        />
        {/* Bottom Sheet */}
        <div
          className="definition-popup"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 45,
            animation: 'slide-in-up-def 0.3s ease forwards',
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <style>{`
            @keyframes slide-in-up-def {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
          <div
            style={{
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 -8px 32px var(--shadow-color)',
              maxHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag Handle */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0 4px 0',
              flexShrink: 0,
            }}>
              <div style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'var(--border-color)',
              }} />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px 12px 16px',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={14} style={{ color: 'var(--accent-start)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Definition
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                aria-label="Close definition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: '16px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
              }}
            >
              {renderContent(state, audioUrl)}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '8px 16px',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Wifi size={10} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Powered by Free Dictionary API · Requires internet
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============ DESKTOP: Positioned popup ============
  const popupWidth = 340;
  const popupMaxHeight = 400;
  const padding = 16;

  let left = state.position.x;
  let top = state.position.y + 10;

  if (left + popupWidth > window.innerWidth - padding) {
    left = window.innerWidth - popupWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }
  if (top + popupMaxHeight > window.innerHeight - padding) {
    top = state.position.y - popupMaxHeight - 10;
  }
  if (top < padding) {
    top = padding;
  }

  return (
    <div
      className="definition-popup"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
        maxHeight: `${popupMaxHeight}px`,
        zIndex: 45,
        animation: 'modal-in 0.2s ease forwards',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="glass-strong"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 8px 32px var(--shadow-color), 0 0 0 1px var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={14} style={{ color: 'var(--accent-start)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Definition
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Close definition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            maxHeight: `${popupMaxHeight - 60}px`,
          }}
        >
          {renderContent(state, audioUrl)}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Wifi size={10} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Powered by Free Dictionary API · Requires internet
          </span>
        </div>
      </div>
    </div>
  );
}

/** Shared content renderer for both mobile and desktop */
function renderContent(state: DictionaryState, audioUrl: string | undefined) {
  // Loading
  if (state.isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
        <Loader size={24} style={{ color: 'var(--accent-start)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Looking up "{state.word}"...
        </span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error
  if (state.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px', textAlign: 'center' }}>
        <Wifi size={24} style={{ color: 'var(--text-muted)' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
          {state.error}
        </p>
      </div>
    );
  }

  // Result
  if (state.result) {
    return (
      <div>
        {/* Word + Phonetic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {state.result.word}
          </h3>
          {state.result.phonetic && (
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {state.result.phonetic}
            </span>
          )}
          {audioUrl && (
            <button
              onClick={() => playAudio(audioUrl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              aria-label="Play pronunciation"
              title="Play pronunciation"
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>

        {/* Meanings */}
        {state.result.meanings.map((meaning, mIdx) => (
          <div key={mIdx} style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '4px',
                marginBottom: '8px',
                background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                color: 'white',
              }}
            >
              {meaning.partOfSpeech}
            </div>

            {meaning.definitions.map((def, dIdx) => (
              <div
                key={dIdx}
                style={{
                  marginBottom: '10px',
                  paddingLeft: '12px',
                  borderLeft: '2px solid var(--border-color)',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
                    {dIdx + 1}.
                  </span>
                  {def.definition}
                </p>
                {def.example && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px', paddingLeft: '16px' }}>
                    "{def.example}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // No result
  return (
    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
      Right-click a word to see its definition.
    </div>
  );
}