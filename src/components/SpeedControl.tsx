/* ========================================
   FREE PDF TTS READER — Speed Control
   by Analyst Sandeep
   
   Reading speed slider (0.5x to 3.0x).
   Shows current speed with visual feedback.
   ======================================== */

import { Gauge } from 'lucide-react';

interface SpeedControlProps {
  rate: number;
  onChange: (rate: number) => void;
  disabled?: boolean;
}

/** Speed presets for quick selection */
const SPEED_PRESETS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' },
  { value: 2.5, label: '2.5x' },
  { value: 3.0, label: '3x' },
];

/**
 * Get a label for the current speed.
 */
function getSpeedLabel(rate: number): string {
  if (rate <= 0.5) return 'Very Slow';
  if (rate <= 0.75) return 'Slow';
  if (rate <= 1.0) return 'Normal';
  if (rate <= 1.25) return 'Slightly Fast';
  if (rate <= 1.5) return 'Fast';
  if (rate <= 2.0) return 'Very Fast';
  if (rate <= 2.5) return 'Super Fast';
  return 'Maximum';
}

/**
 * Get color for the speed indicator.
 */
function getSpeedColor(rate: number): string {
  if (rate <= 0.75) return '#3b82f6';  // Blue - slow
  if (rate <= 1.25) return '#10b981';  // Green - normal
  if (rate <= 2.0) return '#f59e0b';   // Amber - fast
  return '#ef4444';                     // Red - very fast
}

export default function SpeedControl({
  rate,
  onChange,
  disabled = false,
}: SpeedControlProps) {
  const speedLabel = getSpeedLabel(rate);
  const speedColor = getSpeedColor(rate);
  const percentage = ((rate - 0.5) / (3.0 - 0.5)) * 100;

  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <Gauge size={14} />
          <span>Speed</span>
        </div>

        {/* Current Speed Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            {speedLabel}
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: speedColor,
              backgroundColor: `${speedColor}15`,
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            {rate.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Slider Track */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        {/* Background Track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--bg-tertiary)',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Filled Track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: `${percentage}%`,
            height: '4px',
            borderRadius: '2px',
            background: `linear-gradient(90deg, #3b82f6, ${speedColor})`,
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            transition: 'width 0.15s ease',
          }}
        />

        {/* Range Input */}
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.05"
          value={rate}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          style={{
            width: '100%',
            height: '20px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            zIndex: 1,
            margin: 0,
          }}
          aria-label={`Reading speed: ${rate}x`}
        />
      </div>

      {/* Speed Presets */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '2px',
          marginTop: '4px',
        }}
      >
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => !disabled && onChange(preset.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '4px 0',
              fontSize: '10px',
              fontWeight: Math.abs(rate - preset.value) < 0.05 ? 700 : 500,
              color:
                Math.abs(rate - preset.value) < 0.05
                  ? speedColor
                  : 'var(--text-muted)',
              backgroundColor:
                Math.abs(rate - preset.value) < 0.05
                  ? `${speedColor}15`
                  : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom slider thumb styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${speedColor};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${speedColor};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
          border: none;
          height: 4px;
        }
      `}</style>
    </div>
  );
}