/* ========================================
   FREE PDF TTS READER — Voice Picker
   by Analyst Sandeep
   
   Voice selection panel with:
   - Fuzzy/elastic search
   - Gender filter (Male/Female/All)
   - Voice preview/sample button
   - Language display
   - Selected voice indicator
   - MOBILE: Full-screen overlay
   ======================================== */

import { Search, Volume2, Check, Users, User, HelpCircle, X, Mic } from 'lucide-react';
import type { VoiceInfo, GenderGuess } from '../types';

interface VoicePickerProps {
  voices: VoiceInfo[];
  filteredVoices: VoiceInfo[];
  selectedVoice: VoiceInfo | null;
  isLoading: boolean;
  noVoicesAvailable: boolean;
  searchQuery: string;
  genderFilter: 'all' | 'male' | 'female';
  onSearchChange: (query: string) => void;
  onGenderChange: (gender: 'all' | 'male' | 'female') => void;
  onSelectVoice: (voice: VoiceInfo) => void;
  onPreviewVoice: (voice: VoiceInfo) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

/**
 * Get icon for gender.
 */
function GenderIcon({ gender }: { gender: GenderGuess }) {
  switch (gender) {
    case 'female':
      return <User size={12} />;
    case 'male':
      return <Users size={12} />;
    default:
      return <HelpCircle size={12} />;
  }
}

/**
 * Get color for gender badge.
 */
function getGenderColor(gender: GenderGuess): { bg: string; text: string } {
  switch (gender) {
    case 'female':
      return { bg: 'rgba(236, 72, 153, 0.12)', text: '#ec4899' };
    case 'male':
      return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' };
  }
}

/**
 * Get label for gender.
 */
function getGenderLabel(gender: GenderGuess): string {
  switch (gender) {
    case 'female':
      return 'Likely Female';
    case 'male':
      return 'Likely Male';
    default:
      return 'Unknown';
  }
}

export default function VoicePicker({
  filteredVoices,
  selectedVoice,
  isLoading,
  noVoicesAvailable,
  searchQuery,
  genderFilter,
  onSearchChange,
  onGenderChange,
  onSelectVoice,
  onPreviewVoice,
  isOpen,
  onClose,
  isMobile = false,
}: VoicePickerProps) {
  if (!isOpen) return null;

  // Mobile: full-screen overlay. Desktop: absolute sidebar.
  const containerStyle: React.CSSProperties = isMobile
    ? {
      position: 'fixed',
      inset: 0,
      zIndex: 70, // Higher than ControlsPanel (50)
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)',
      animation: 'slide-in-up 0.3s ease forwards',
    }
    : {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '340px',
      zIndex: 70, // Higher than ControlsPanel (50)
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      animation: 'slide-in-right 0.3s ease forwards',
    };

  return (
    <div
      className={isMobile ? '' : 'glass-strong'}
      style={containerStyle}
    >
      {/* Slide animations */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* ---- Header ---- */}
      <div
        style={{
          padding: isMobile ? '16px' : '16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Mic size={18} style={{ color: 'var(--accent-start)' }} />
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Voice Picker
            </h3>
          </div>
          <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Close">
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              aria-label="Close voice picker"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: '10px',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search: "US", "female", "Google"...'
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: isMobile ? '16px' : '13px', // 16px prevents iOS zoom
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-start)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
          {searchQuery && (
            <div className="tooltip-wrapper" data-tooltip="Clear search">
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
                aria-label="Clear search"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Gender Filter */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
          }}
        >
          {(
            [
              { value: 'all', label: 'All', icon: '👥' },
              { value: 'female', label: 'Female', icon: '♀' },
              { value: 'male', label: 'Male', icon: '♂' },
            ] as const
          ).map((option) => (
            <div key={option.value} className="tooltip-wrapper" style={{ flex: 1 }} data-tooltip={`Filter: ${option.label}`}>
              <button
                onClick={() => onGenderChange(option.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 8px' : '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor:
                    genderFilter === option.value
                      ? 'var(--accent-start)'
                      : 'var(--border-color)',
                  backgroundColor:
                    genderFilter === option.value
                      ? 'var(--accent-soft)'
                      : 'var(--bg-primary)',
                  color:
                    genderFilter === option.value
                      ? 'var(--accent-start)'
                      : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: genderFilter === option.value ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Result Count */}
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* ---- Voice List ---- */}
      <div
        role="listbox"
        aria-label="Available voices"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '8px',
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '60px', borderRadius: '10px' }}
              />
            ))}
          </div>
        )}

        {/* No Voices */}
        {noVoicesAvailable && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
            }}
          >
            <Volume2
              size={32}
              style={{ margin: '0 auto 12px auto', opacity: 0.5, display: 'block' }}
            />
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              No voices found
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
              Try using Google Chrome or Microsoft Edge for the best voice selection.
            </p>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !noVoicesAvailable && filteredVoices.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
            }}
          >
            <Search
              size={32}
              style={{ margin: '0 auto 12px auto', opacity: 0.5, display: 'block' }}
            />
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              No matches
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
              Try different search terms like "English", "US", or "female".
            </p>
          </div>
        )}

        {/* Voice Items */}
        {filteredVoices.map((voiceInfo) => {
          const isSelected = selectedVoice?.name === voiceInfo.name;
          const genderColor = getGenderColor(voiceInfo.gender);

          return (
            <div
              key={voiceInfo.name}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelectVoice(voiceInfo);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectVoice(voiceInfo);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: isMobile ? '12px' : '10px 12px',
                borderRadius: '10px',
                marginBottom: '4px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent)' : 'transparent',
                backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                }
              }}
            >
              {/* Selected Check / Number */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--accent-start), var(--accent-end))'
                    : 'var(--bg-tertiary)',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {isSelected ? <Check size={12} /> : null}
              </div>

              {/* Voice Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Voice Name */}
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {voiceInfo.name}
                </div>

                {/* Language + Gender */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '2px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Language */}
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {voiceInfo.langDisplay}
                  </span>

                  {/* Gender Badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: genderColor.bg,
                      color: genderColor.text,
                    }}
                  >
                    <GenderIcon gender={voiceInfo.gender} />
                    {getGenderLabel(voiceInfo.gender)}
                  </span>

                  {/* Local/Online Badge */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      opacity: 0.7,
                    }}
                  >
                    {voiceInfo.isLocal ? '💻' : '☁️'}
                  </span>
                </div>
              </div>

              {/* Preview Button */}
              <div className="tooltip-wrapper" data-tooltip="Preview voice">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewVoice(voiceInfo);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '40px' : '32px',
                    height: isMobile ? '40px' : '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--accent-start)';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--accent-start)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--bg-primary)';
                    (e.currentTarget as HTMLElement).style.color =
                      'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border-color)';
                  }}
                  aria-label={`Preview ${voiceInfo.name}`}
                >
                  <Volume2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Footer ---- */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: '1.4',
          flexShrink: 0,
        }}
      >
        💡 Gender labels are best-effort estimates.
        <br />
        Use Chrome or Edge for the most voices.
      </div>
    </div>
  );
}