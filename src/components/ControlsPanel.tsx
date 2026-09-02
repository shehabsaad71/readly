/* ========================================
   FREE PDF TTS READER — Controls Panel (Right Drawer)
   by Analyst Sandeep

   Redesign: Editorial Minimal Reader
   Desktop: right-side drawer overlay (380px)
   Mobile: bottom sheet
   ======================================== */

import { useState, useEffect } from 'react';
import { X, Mic, Type, Highlighter, Focus, Check, ArrowRight } from 'lucide-react';
import type { SpeechStatus, PdfDocumentData, VoiceInfo } from '../types';

interface ControlsPanelProps {
  status: SpeechStatus;
  currentIndex: number;
  rate: number;
  highlightMode: 'word' | 'sentence';
  pdfData: PdfDocumentData;
  currentPage: number;
  selectedVoice: VoiceInfo | null;
  onTogglePauseResume: () => void;
  onStop: () => void;
  onRateChange: (rate: number) => void;
  onHighlightModeChange: (mode: 'word' | 'sentence') => void;
  onToggleVoicePicker: () => void;
  isVoicePickerOpen: boolean;
  blurMode: boolean;
  onBlurModeToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2]; // Trimmed for cleaner UI

export default function ControlsPanel({
  rate,
  highlightMode,
  pdfData,
  selectedVoice,
  onRateChange,
  onHighlightModeChange,
  onToggleVoicePicker,
  blurMode,
  onBlurModeToggle,
  isOpen,
  onClose,
  isMobile = false,
}: ControlsPanelProps) {
  const [activeTab, setActiveTab] = useState<'playback' | 'voice' | 'reading'>('playback');
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setShouldRender(false);
  };

  if (!shouldRender) return null;

  const totalWords = pdfData.allWords.length;

  // Desktop layout constants
  const HEADER_HEIGHT = '70px';
  const FOOTER_HEIGHT = '80px'; // Playback dock + margin

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slightly darker
          zIndex: 49,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(8px)', // Stronger blur
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Drawer panel */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`glass-panel`}
        style={{
          position: 'fixed',
          backgroundColor: 'var(--bg-elevated)', // Fallback if glass fails
          top: isMobile ? 0 : HEADER_HEIGHT,
          right: 0,
          bottom: isMobile ? 0 : FOOTER_HEIGHT,
          width: '360px',
          maxWidth: '100vw',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: isOpen
            ? 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'slide-out-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          borderTopLeftRadius: isMobile ? 0 : '16px',
          borderBottomLeftRadius: isMobile ? 0 : '16px',
          border: isMobile ? 'none' : '1px solid var(--border-color)',
          borderRight: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            Settings
          </h2>
          <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Close">
            <button
              onClick={onClose}
              aria-label="Close controls"
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Segmented Control */}
        <div style={{ padding: '0 24px 16px 24px' }}>
          <div className="segmented-control">
            {[
              { key: 'playback' as const, label: 'Speed' },
              { key: 'voice' as const, label: 'Voice' },
              { key: 'reading' as const, label: 'Display' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`segmented-tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 24px 32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* ---- SPEED TAB ---- */}
          {activeTab === 'playback' && (
            <div className="stagger-appear">
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}>
                  {rate}<span style={{ fontSize: '24px', color: 'var(--text-muted)', fontWeight: 600 }}>×</span>
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  Reading Speed
                </div>
              </div>

              {/* Speed Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}>
                {SPEED_PRESETS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => onRateChange(s)}
                    className="stagger-appear"
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: rate === s ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      background: rate === s ? 'var(--accent-soft)' : 'var(--bg-primary)',
                      color: rate === s ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Document Stats Card */}
              <div className="stagger-appear" style={{
                marginTop: '32px',
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-tertiary)',
                animationDelay: '0.3s',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                }}>
                  Document Stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(totalWords / 1000).toFixed(1)}k
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Words</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {pdfData.estimatedReadTime}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- VOICE TAB ---- */}
          {activeTab === 'voice' && (
            <div className="stagger-appear">
              <button
                onClick={onToggleVoicePicker}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Mic size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px' }}>
                    Current Voice
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedVoice?.name || 'Device Default'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedVoice?.langDisplay || 'English (System)'}
                  </div>
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}>
                  <ArrowRight size={14} />
                </div>
              </button>

              <div style={{ marginTop: '24px', padding: '0 8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Tap the card above to open the full voice browser. You can search by language, gender, and name.
                </p>
              </div>
            </div>
          )}

          {/* ---- READING TAB ---- */}
          {activeTab === 'reading' && (
            <div className="stagger-appear">
              {/* Highlight Mode */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                  paddingLeft: '4px',
                }}>
                  Highlight Style
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['word', 'sentence'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onHighlightModeChange(mode)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '16px',
                        border: highlightMode === mode ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                        background: highlightMode === mode ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                      }}
                    >
                      {highlightMode === mode && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          color: 'var(--accent)',
                        }}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                      <div style={{
                        color: highlightMode === mode ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                        {mode === 'word' ? <Highlighter size={20} /> : <Type size={20} />}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: highlightMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>
                        {mode === 'word' ? 'Word' : 'Sentence'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Mode */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                  paddingLeft: '4px',
                }}>
                  Immersion
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '4px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <button
                    onClick={onBlurModeToggle}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: blurMode ? 'var(--accent)' : 'var(--bg-sunken)',
                        color: blurMode ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}>
                        <Focus size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Focus Mode</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dim distractions</div>
                      </div>
                    </div>

                    {/* Switch */}
                    <div style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: blurMode ? 'var(--accent)' : 'var(--border-color)',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: blurMode ? '22px' : '2px',
                        transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }} />
                    </div>
                  </button>

                  <div style={{
                    height: '1px',
                    backgroundColor: 'var(--border-subtle)',
                    margin: '0 12px'
                  }} />

                  {/* Dictionary Info */}
                  <div style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-secondary)',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-sunken)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Type size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Dictionary</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Right-click a word for meaning.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}