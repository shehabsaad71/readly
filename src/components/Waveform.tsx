/* ========================================
   FREE PDF TTS READER — Waveform Animation
   by Analyst Sandeep
   
   Fully inline animated waveform.
   Shows ONLY when playing. Empty when idle.
   No CSS class dependency — all styles inline.
   ======================================== */

import { useEffect, useRef } from 'react';

interface WaveformProps {
  isPlaying: boolean;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: {
    barWidth: 3,
    barGap: 2,
    heights: [6, 10, 8, 14, 9],
    containerHeight: 18,
  },
  medium: {
    barWidth: 3,
    barGap: 2,
    heights: [8, 14, 10, 18, 12],
    containerHeight: 22,
  },
  large: {
    barWidth: 4,
    barGap: 2,
    heights: [10, 18, 14, 22, 16],
    containerHeight: 26,
  },
};

const BAR_DELAYS = [0, 0.15, 0.3, 0.1, 0.25];

export default function Waveform({
  isPlaying,
  size = 'medium',
}: WaveformProps) {
  const config = SIZES[size];
  const totalWidth =
    config.heights.length * config.barWidth +
    (config.heights.length - 1) * config.barGap;
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);

  // Inject keyframes once into the document
  useEffect(() => {
    if (styleSheetRef.current) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes waveform-bounce {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1.0); }
      }
    `;
    document.head.appendChild(style);
    styleSheetRef.current = style;

    return () => {
      if (styleSheetRef.current) {
        document.head.removeChild(styleSheetRef.current);
        styleSheetRef.current = null;
      }
    };
  }, []);

  // Show nothing when not playing
  if (!isPlaying) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: `${config.containerHeight}px`,
          width: `${totalWidth}px`,
          minHeight: `${config.containerHeight}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  // Animated bars when playing
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${config.barGap}px`,
        height: `${config.containerHeight}px`,
        width: `${totalWidth}px`,
        minHeight: `${config.containerHeight}px`,
      }}
      aria-label="Audio is playing"
      role="img"
    >
      {config.heights.map((height, i) => (
        <div
          key={i}
          style={{
            width: `${config.barWidth}px`,
            height: `${height}px`,
            borderRadius: `${config.barWidth}px`,
            background: 'var(--accent)',
            transformOrigin: 'bottom',
            animation: `waveform-bounce 0.8s ${BAR_DELAYS[i]}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}