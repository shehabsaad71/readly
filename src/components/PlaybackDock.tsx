/* ========================================
   FREE PDF TTS READER — Playback Dock
   by Analyst Sandeep

   Sticky bottom bar: play/pause, progress,
   speed, voice, highlight, focus, "Controls"
   ======================================== */

import { Play, Pause, Square, Gauge, Mic, Highlighter, Eye, Settings, Type } from 'lucide-react';
import type { SpeechStatus, PdfDocumentData, VoiceInfo } from '../types';
import Waveform from './Waveform';

interface PlaybackDockProps {
    status: SpeechStatus;
    currentIndex: number;
    rate: number;
    highlightMode: 'word' | 'sentence';
    pdfData: PdfDocumentData;
    selectedVoice: VoiceInfo | null;
    onTogglePauseResume: () => void;
    onStop: () => void;
    onRateChange: (rate: number) => void;
    onHighlightModeChange: (mode: 'word' | 'sentence') => void;
    onToggleVoicePicker: () => void;
    blurMode: boolean;
    onBlurModeToggle: () => void;
    onOpenDrawer: () => void;
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

export default function PlaybackDock({
    status,
    currentIndex,
    rate,
    highlightMode,
    pdfData,
    selectedVoice,
    onTogglePauseResume,
    onStop,
    onRateChange,
    onHighlightModeChange,
    onToggleVoicePicker,
    blurMode,
    onBlurModeToggle,
    onOpenDrawer,
}: PlaybackDockProps) {
    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const isActive = isPlaying || isPaused;
    const totalWords = pdfData.allWords.length;
    const progressPercent = totalWords > 0 && currentIndex >= 0 ? (currentIndex / totalWords) * 100 : 0;

    // Speed dropdown state
    const cycleSpeed = () => {
        const currentIdx = SPEED_PRESETS.indexOf(rate);
        const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % SPEED_PRESETS.length : 2;
        onRateChange(SPEED_PRESETS[nextIdx]);
    };

    return (
        <div
            style={{
                position: 'relative',
                flexShrink: 0,
                backgroundColor: 'var(--dock-bg)',
                borderTop: '1px solid var(--dock-border)',
                zIndex: 30,
                animation: 'dock-in 0.3s ease forwards',
            }}
        >
            {/* Progress bar — thin strip at very top of dock */}
            {currentIndex >= 0 && totalWords > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: 'var(--border-subtle)',
                    }}
                >
                    <div
                        className="global-progress-fill"
                        style={{
                            height: '100%',
                            width: `${progressPercent}%`,
                            backgroundColor: 'var(--accent)',
                            borderRadius: '0 2px 2px 0',
                            transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                    />
                </div>
            )}

            {/* Dock content */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    maxWidth: '1320px',
                    margin: '0 auto',
                }}
            >
                {/* LEFT: Play/Pause + Stop */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Play/Pause */}
                    <div className="tooltip-wrapper" data-tooltip={isPlaying ? 'Pause reading' : 'Start reading'}>
                        <button
                            onClick={onTogglePauseResume}
                            aria-label={isPlaying ? 'Pause reading' : isPaused ? 'Resume reading' : 'Start reading'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: window.innerWidth < 480 ? '36px' : '44px',
                                height: window.innerWidth < 480 ? '36px' : '44px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'var(--accent)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)';
                                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                            }}
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                        </button>
                    </div>

                    {/* Stop — only when active */}
                    {isActive && (
                        <div className="tooltip-wrapper" data-tooltip="Stop reading">
                            <button
                                onClick={onStop}
                                aria-label="Stop reading"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--error)';
                                    (e.currentTarget as HTMLElement).style.color = 'white';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--error)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <Square size={14} />
                            </button>
                        </div>
                    )}

                    {/* Waveform — small, while playing */}
                    {isPlaying && (
                        <div style={{ flexShrink: 0, opacity: 0.8 }}>
                            <Waveform isPlaying={true} size="small" />
                        </div>
                    )}
                </div>

                {/* CENTER: Status + progress text */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isActive ? (
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: isPlaying ? 'var(--accent)' : 'var(--warning)',
                                whiteSpace: 'nowrap',
                                display: window.innerWidth < 480 ? 'none' : 'inline',
                            }}
                        >
                            {isPlaying ? 'Reading…' : 'Paused'}
                        </span>
                    ) : (
                        <span
                            className="no-select"
                            style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                display: window.innerWidth < 480 ? 'none' : 'inline',
                            }}
                        >
                            Click any word to play
                        </span>
                    )}
                    {currentIndex >= 0 && totalWords > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {/* Minimal progress on mobile */}
                            {window.innerWidth < 480
                                ? `${Math.round(progressPercent)}%`
                                : `${currentIndex.toLocaleString()} / ${totalWords.toLocaleString()} words · ${Math.round(progressPercent)}%`
                            }
                        </span>
                    )}
                </div>

                {/* RIGHT: Quick controls — hide labels on narrow screens via CSS */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        overflowX: window.innerWidth < 480 ? 'auto' : 'visible',
                        maxWidth: window.innerWidth < 480 ? '160px' : 'none',
                        scrollbarWidth: 'none', // Hide scrollbar
                        maskImage: window.innerWidth < 480 ? 'linear-gradient(to right, transparent, black 10px, black 90%, transparent)' : 'none',
                    }}
                >
                    {/* Speed chip */}
                    <div className="tooltip-wrapper" data-tooltip={`Speed: ${rate}×`}>
                        <button
                            onClick={cycleSpeed}
                            aria-label={`Speed ${rate}×`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontFamily: 'var(--font-ui)',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                            }}
                        >
                            <Gauge size={14} />
                            {rate}×
                        </button>
                    </div>

                    {/* Voice button */}
                    <div className="tooltip-wrapper" data-tooltip={selectedVoice?.name || 'Select voice'}>
                        <button
                            onClick={onToggleVoicePicker}
                            aria-label="Select voice"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                            }}
                        >
                            <Mic size={14} />
                        </button>
                    </div>

                    {/* Highlight mode toggle */}
                    <div className="tooltip-wrapper" data-tooltip={`Highlight: ${highlightMode}`}>
                        <button
                            onClick={() => onHighlightModeChange(highlightMode === 'word' ? 'sentence' : 'word')}
                            aria-label={`Highlight mode: ${highlightMode}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-color)',
                                background: highlightMode === 'sentence' ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                                color: highlightMode === 'sentence' ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Highlighter size={14} />
                        </button>
                    </div>

                    {/* Focus mode toggle — Hide on mobile/tablet */}
                    <div
                        className="tooltip-wrapper mobile-hide-1280"
                        data-tooltip={blurMode ? 'Focus: On' : 'Focus: Off'}
                    >
                        <button
                            onClick={onBlurModeToggle}
                            aria-label={blurMode ? 'Disable focus mode' : 'Enable focus mode'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-color)',
                                background: blurMode ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                                color: blurMode ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Eye size={14} />
                        </button>
                    </div>

                    {/* Dictionary Info — Hide on mobile */}
                    <div
                        className="tooltip-wrapper"
                        data-tooltip="Right-click a word for meaning."
                        style={{ display: window.innerWidth < 480 ? 'none' : 'block' }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--accent)',
                                transition: 'all 0.15s ease',
                                cursor: 'help',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                                (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                                (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                            }}
                        >
                            <Type size={14} />
                        </div>
                    </div>

                    {/* Separator */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: 'var(--border-color)',
                            margin: '0 4px',
                            flexShrink: 0,
                        }}
                    />

                    {/* Controls drawer button */}
                    <div className="tooltip-wrapper" data-tooltip="More controls">
                        <button
                            onClick={onOpenDrawer}
                            aria-label="Open controls panel"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                            }}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
