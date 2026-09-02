/* ========================================
   FREE PDF TTS READER — Zoom Controls
   by Analyst Sandeep
   
   Zoom in / out / fit-to-width controls.
   Shows current zoom percentage.
   MOBILE: Compact — hides percentage + divider
   ======================================== */

import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { ZoomMode } from '../types';

interface ZoomControlsProps {
  scale: number;
  mode: ZoomMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  isMobile?: boolean;
}

/** Min and max zoom levels */
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 0.15;

export default function ZoomControls({
  scale,
  mode,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  isMobile = false,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomIn = scale < MAX_ZOOM;
  const canZoomOut = scale > MIN_ZOOM;
  const isFitWidth = mode === 'fit-width';

  const btnSize = isMobile ? '28px' : '34px';

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '2px' : '4px',
        padding: isMobile ? '3px' : '4px',
        borderRadius: '12px',
      }}
    >
      {/* Zoom Out */}
      <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Zoom Out (Ctrl + -)">
        <button
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className="btn-icon"
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: '8px',
            opacity: canZoomOut ? 1 : 0.4,
            cursor: canZoomOut ? 'pointer' : 'not-allowed',
          }}
          aria-label="Zoom out"
        >
          <ZoomOut size={isMobile ? 14 : 16} />
        </button>
      </div>

      {/* Percentage Display — hide on mobile */}
      {!isMobile && (
        <div
          style={{
            minWidth: '52px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            padding: '0 4px',
            userSelect: 'none',
          }}
        >
          {percentage}%
        </div>
      )}

      {/* Zoom In */}
      <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Zoom In (Ctrl + =)">
        <button
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className="btn-icon"
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: '8px',
            opacity: canZoomIn ? 1 : 0.4,
            cursor: canZoomIn ? 'pointer' : 'not-allowed',
          }}
          aria-label="Zoom in"
        >
          <ZoomIn size={isMobile ? 14 : 16} />
        </button>
      </div>

      {/* Divider — hide on mobile */}
      {!isMobile && (
        <div
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'var(--border-color)',
            margin: '0 2px',
          }}
        />
      )}

      {/* Fit to Width */}
      <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Fit to Width (Ctrl + 0)">
        <button
          onClick={onFitWidth}
          className="btn-icon"
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: '8px',
            backgroundColor: isFitWidth ? 'var(--accent-start)' : undefined,
            color: isFitWidth ? 'white' : undefined,
            border: isFitWidth ? '1px solid var(--accent-start)' : undefined,
          }}
          aria-label="Fit to width"
        >
          <Maximize size={isMobile ? 14 : 16} />
        </button>
      </div>
    </div>
  );
}