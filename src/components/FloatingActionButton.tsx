/* ========================================
   FREE PDF TTS READER — Floating Action Button
   by Analyst Sandeep
   
   Mobile-friendly circular play/pause button.
   Fixed in bottom-right corner.
   Only visible on small screens or when
   the controls panel is far from view.
   ======================================== */

import { Play, Pause, Square } from 'lucide-react';
import type { SpeechStatus } from '../types';
import Waveform from './Waveform';

interface FloatingActionButtonProps {
  status: SpeechStatus;
  onTogglePauseResume: () => void;
  onStop: () => void;
  visible: boolean;
}

export default function FloatingActionButton({
  status,
  onTogglePauseResume,
  onStop,
  visible,
}: FloatingActionButtonProps) {
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  if (!visible || !isActive) return null;

  return (
    <div
      className="fab"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Waveform indicator */}
      {isPlaying && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 16px var(--shadow-color)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <Waveform isPlaying={true} size="small" />
        </div>
      )}

      {/* Stop Button */}
      <div className="tooltip-wrapper" data-tooltip="Stop (Esc)">
        <button
          onClick={onStop}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px var(--shadow-color)',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#ef4444';
            (e.currentTarget as HTMLElement).style.color = 'white';
            (e.currentTarget as HTMLElement).style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--bg-secondary)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLElement).style.borderColor =
              'var(--border-color)';
          }}
          aria-label="Stop reading"
        >
          <Square size={18} />
        </button>
      </div>

      {/* Play/Pause Button */}
      <div className="tooltip-wrapper" data-tooltip={isPlaying ? 'Pause (Space)' : 'Resume (Space)'}>
        <button
          onClick={onTogglePauseResume}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 6px 28px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 20px rgba(139, 92, 246, 0.4)';
          }}
          aria-label={isPlaying ? 'Pause reading' : 'Resume reading'}
        >
          {/* Shine effect */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
              animation: 'star-shine 2s ease infinite',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </span>
        </button>
      </div>

      {/* Status Badge */}
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-4px',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: '#f59e0b',
            color: 'white',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
            animation: 'fab-in 0.2s ease forwards',
          }}
        >
          PAUSED
        </div>
      )}
    </div>
  );
}
