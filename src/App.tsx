/* ========================================
   FREE PDF TTS READER
   by Analyst Sandeep

   Main Application Component
   Redesign: Editorial Minimal Reader
   Layout: Document Bar + Reading Canvas + Playback Dock
   ======================================== */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PdfWord } from './types';

// Hooks
import { useTheme } from './hooks/useTheme';
import { usePdfDocument } from './hooks/usePdfDocument';
import { useVoices } from './hooks/useVoices';
import { useSpeech } from './hooks/useSpeech';
import { useDictionary } from './hooks/useDictionary';
import { useToast } from './hooks/useToast';

// Components
import ThemeToggle from './components/ThemeToggle';
import WelcomeModal, { shouldShowWelcome } from './components/WelcomeModal';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import PdfUploader from './components/PdfUploader';
import PdfViewer from './components/PdfViewer';
import ControlsPanel from './components/ControlsPanel';
import PlaybackDock from './components/PlaybackDock';
import VoicePicker from './components/VoicePicker';
import DefinitionPopup from './components/DefinitionPopup';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ZoomControls, { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './components/ZoomControls';
import { BookOpen, HelpCircle, FileUp, Globe, Mail } from 'lucide-react';
import logo from './assets/logo.png';

export default function App() {
  const theme = useTheme();
  const pdf = usePdfDocument();
  const voices = useVoices();
  const speech = useSpeech();
  const dictionary = useDictionary();
  const toast = useToast();

  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Zoom state
  const [scale, setScale] = useState<number | null>(null);
  const [zoomMode, setZoomMode] = useState<'fit-width' | 'custom'>('fit-width');

  // Focus blur mode state
  const [blurMode, setBlurMode] = useState(false);

  // Controls drawer state (replaces mobile drawer — works on all sizes)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Jump to page state
  const [jumpToPage, setJumpToPage] = useState('');
  const [jumpError, setJumpError] = useState('');
  const jumpErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToPageFnRef = useRef<(pageNum: number) => void>(() => { });
  const calculateFitWidthFnRef = useRef<() => number>(() => 1.0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => { await pdf.loadPdf(file); },
    [pdf]
  );

  useEffect(() => {
    if (pdf.pdfData) {
      toast.pdfLoaded(pdf.pdfData.totalPages, pdf.pdfData.totalWordCount, pdf.pdfData.estimatedReadTime);
      if (pdf.pdfData.totalWordCount === 0) toast.noTextFound();
      // Clear dictionary cache from previous PDF to free memory
      dictionary.clearCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — toast & dictionary refs are stable
  }, [pdf.pdfData]);

  useEffect(() => {
    if (voices.noVoicesAvailable) toast.noVoicesFound();
  }, [voices.noVoicesAvailable]);

  // Debounce to prevent single-click (play) firing before double-click (pause)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWordClick = useCallback(
    (globalIndex: number) => {
      if (!pdf.pdfData) return;
      // Delay to allow double-click detection first
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        speech.playFromWord(globalIndex, pdf.pdfData!.allWords, voices.selectedVoice);
      }, 200);
    },
    [pdf.pdfData, speech, voices.selectedVoice]
  );

  const handleWordDoubleClick = useCallback(() => {
    // Cancel the pending single-click play so we don't play+pause
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (speech.isPlaying) speech.pause();
  }, [speech]);

  const handleWordRightClick = useCallback(
    (word: PdfWord, position: { x: number; y: number }) => {
      dictionary.lookup(word.originalText, position);
    },
    [dictionary]
  );

  const handleVoiceSelect = useCallback(
    (voiceInfo: typeof voices.selectedVoice) => {
      if (!voiceInfo) return;
      voices.selectVoice(voiceInfo);
      speech.changeVoice(voiceInfo);
      // Removed toast to update in background
    },
    [voices, speech]
  );

  const handleRateChange = useCallback(
    (newRate: number) => {
      speech.changeRate(newRate);
      // Removed toast to update in background
    },
    [speech]
  );

  const handleThemeCycle = useCallback(() => {
    theme.cycleTheme();
    // Removed toast to update in background
  }, [theme]);

  const handleHighlightModeChange = useCallback(
    (mode: 'word' | 'sentence') => { speech.setHighlightMode(mode); },
    [speech]
  );

  const handleBlurModeToggle = useCallback(() => {
    setBlurMode((prev) => !prev);
  }, []);

  useEffect(() => {
    speech.onComplete(() => { toast.readingComplete(); });
  }, [speech, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (speech.status === 'idle') {
          toast.info('Click any word in the PDF to start reading');
          return;
        }
        speech.togglePauseResume();
        return;
      }

      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showVoicePicker) { setShowVoicePicker(false); return; }
        if (dictionary.isOpen) { dictionary.close(); return; }
        if (isDrawerOpen) { setIsDrawerOpen(false); return; }
        speech.stop();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speech, dictionary, showShortcuts, showVoicePicker, isDrawerOpen]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomMode('custom');
    setScale((prev) => Math.min((prev || 1) + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomMode('custom');
    setScale((prev) => Math.max((prev || 1) - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleFitWidth = useCallback(() => {
    setZoomMode('fit-width');
    const fitScale = calculateFitWidthFnRef.current();
    setScale(fitScale);
  }, []);

  // Jump to page handler
  const handleJumpToPage = useCallback(
    (pageNum: number) => {
      if (jumpErrorTimeoutRef.current) {
        clearTimeout(jumpErrorTimeoutRef.current);
      }

      if (!pdf.pdfData) return;

      if (isNaN(pageNum) || pageNum < 1) {
        setJumpError('Min page is 1');
        jumpErrorTimeoutRef.current = setTimeout(() => setJumpError(''), 2500);
        return;
      }
      if (pageNum > pdf.pdfData.totalPages) {
        setJumpError(`Max is ${pdf.pdfData.totalPages}`);
        jumpErrorTimeoutRef.current = setTimeout(() => setJumpError(''), 2500);
        return;
      }

      setJumpError('');
      jumpToPageFnRef.current(pageNum);
    },
    [pdf.pdfData]
  );

  // Keyboard zoom shortcuts
  useEffect(() => {
    if (!pdf.pdfData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
        else if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
        else if (e.key === '0') { e.preventDefault(); handleFitWidth(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdf.pdfData, handleZoomIn, handleZoomOut, handleFitWidth]);

  useEffect(() => {
    return () => {
      if (jumpErrorTimeoutRef.current) clearTimeout(jumpErrorTimeoutRef.current);
    };
  }, []);

  const showPdfViewer = pdf.pdfData && pdf.getPdfDoc();
  const showUploader = !pdf.pdfData;

  const currentScale = scale || 1.0;

  return (
    <ErrorBoundary>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          // @ts-ignore
          height: '100dvh',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          transition: 'background-color 0.3s ease, color 0.3s ease',
          position: 'relative',
        }}
      >
        {/* ---- Document Bar (Top) ---- */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '8px 12px' : '8px 16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            flexShrink: 0,
            zIndex: 20,
            minHeight: isMobile ? '48px' : '52px',
            gap: isMobile ? '8px' : '12px',
          }}
        >
          {/* LEFT: App mark + document name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
            <img
              src={logo}
              alt="Logo"
              className="no-select"
              style={{
                height: '32px',
                width: 'auto',
                flexShrink: 0,
                objectFit: 'contain'
              }}
            />
            <div style={{ minWidth: 0, display: window.innerWidth < 480 ? 'none' : 'block' }}>
              <h1
                className="gradient-text no-select"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  lineHeight: '1.2',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                PDF TTS Reader
              </h1>
              {showPdfViewer && pdf.pdfData && !isMobile && (
                <p
                  title={pdf.pdfData.fileName}
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                    cursor: 'default',
                  }}
                >
                  {pdf.pdfData.fileName}
                </p>
              )}
              {!showPdfViewer && !isMobile && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Free · Private · Local
                </p>
              )}
            </div>
          </div>

          {/* CENTER: Page nav + Zoom (only when PDF loaded) */}
          {showPdfViewer && (
            <div
              style={{
                flex: '1 1 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              {/* Page indicator */}
              {pdf.pdfData && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <BookOpen size={13} style={{ opacity: 0.6 }} />
                  <span>
                    <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currentPage}
                    </strong>{' '}
                    / {pdf.pdfData.totalPages}
                  </span>

                  {/* Go to page input — desktop only */}
                  {!isMobile && (
                    <div style={{ position: 'relative', marginLeft: '4px' }}>
                      <input
                        type="number"
                        min={1}
                        max={pdf.pdfData.totalPages}
                        value={jumpToPage}
                        onChange={(e) => {
                          // Only allow positive integers: strip decimals, negatives, leading zeros
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          setJumpToPage(cleaned);
                          if (jumpError) setJumpError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const num = parseInt(jumpToPage, 10);
                            handleJumpToPage(num);
                            if (num >= 1 && num <= pdf.pdfData!.totalPages) {
                              setJumpToPage('');
                              (e.target as HTMLInputElement).blur();
                            }
                          }
                        }}
                        onFocus={(e) => {
                          e.target.select();
                          e.target.style.borderColor = 'var(--accent)';
                          e.target.style.boxShadow = '0 0 0 2px var(--focus-ring)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = jumpError ? 'var(--error)' : 'var(--border-color)';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Go to"
                        style={{
                          width: '56px',
                          padding: '3px 6px',
                          borderRadius: '8px',
                          border: `1.5px solid ${jumpError ? 'var(--error)' : 'var(--border-color)'}`,
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 500,
                          outline: 'none',
                          textAlign: 'center',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                          fontFamily: 'var(--font-ui)',
                        }}
                      />
                      {jumpError && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#fff',
                            backgroundColor: 'var(--error)',
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                            animation: 'jump-error-in 0.2s ease forwards',
                            pointerEvents: 'none',
                          }}
                        >
                          {jumpError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Zoom controls — desktop */}
              {!isMobile && (
                <ZoomControls
                  scale={currentScale}
                  mode={zoomMode}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onFitWidth={handleFitWidth}
                  isMobile={isMobile}
                />
              )}
            </div>
          )}

          {/* Spacer when no PDF */}
          {!showPdfViewer && <div style={{ flex: '1 1 auto' }} />}

          {/* RIGHT: Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Upload New PDF */}
            {pdf.pdfData && (
              <div className="tooltip-wrapper tooltip-bottom" data-tooltip="New PDF">
                <button
                  onClick={() => { speech.stop(); pdf.clearPdf(); setScale(null); setZoomMode('fit-width'); setIsDrawerOpen(false); }}
                  className="btn-icon"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                  aria-label="Upload new PDF"
                >
                  <FileUp size={16} />
                </button>
              </div>
            )}

            {/* Website */}
            <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Website">
              <a
                href="https://shehabsaad71.github.io/shehab/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
                aria-label="Open website"
              >
                <Globe size={18} />
              </a>
            </div>

            {/* Email */}
            <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Copy Email">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('fuuytf1@gmail.com');
                  toast.info('Email copied to clipboard');
                }}
                className="btn-icon"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                }}
                aria-label="Copy Contact Email"
              >
                <Mail size={18} />
              </button>
            </div>

            {/* Help */}
            <div className="tooltip-wrapper tooltip-bottom" data-tooltip="Help">
              <button
                onClick={() => setShowWelcome(true)}
                className="btn-icon"
                style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)' }}
                aria-label="Show instructions"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle theme={theme.theme} onCycleTheme={handleThemeCycle} />
          </div>
        </header>

        {/* ---- Reading Progress Bar ---- */}
        {showPdfViewer && (
          <div
            style={{
              flexShrink: 0,
              height: '2px',
              backgroundColor: speech.currentIndex >= 0 ? 'var(--progress-track)' : 'transparent',
              position: 'relative',
              zIndex: 19,
            }}
          >
            {speech.currentIndex >= 0 && pdf.pdfData && pdf.pdfData.allWords.length > 0 && (
              <div
                className="global-progress-fill"
                style={{
                  height: '100%',
                  width: `${(speech.currentIndex / pdf.pdfData.allWords.length) * 100}%`,
                  backgroundColor: 'var(--accent)',
                  borderRadius: '0 2px 2px 0',
                  transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            )}
          </div>
        )}

        {/* ---- Main Content (Reading Canvas) ---- */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {showUploader && (
            <PdfUploader
              onFileSelect={handleFileSelect}
              isLoading={pdf.isLoading}
              loadingMessage={pdf.loadingMessage}
              loadingProgress={pdf.loadingProgress}
              error={pdf.loadingError}
              isMobile={isMobile}
            />
          )}

          {showPdfViewer && pdf.pdfData && pdf.getPdfDoc() && (
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <PdfViewer
                pdfDoc={pdf.getPdfDoc()!}
                pdfData={pdf.pdfData}
                currentWordIndex={speech.currentIndex}
                highlightMode={speech.highlightMode}
                isPlaying={speech.isPlaying}
                selectedVoice={voices.selectedVoice}
                onWordClick={handleWordClick}
                onWordDoubleClick={handleWordDoubleClick}
                onWordRightClick={handleWordRightClick}
                onPageChange={setCurrentPage}
                currentPage={currentPage}
                scale={scale}
                setScale={setScale}
                zoomMode={zoomMode}
                setZoomMode={setZoomMode}
                jumpToPageFnRef={jumpToPageFnRef}
                calculateFitWidthFnRef={calculateFitWidthFnRef}
                blurMode={blurMode}
                speechStatus={speech.status}
              />
            </div>
          )}
        </div>

        {/* ---- Bottom Playback Dock (only when PDF loaded) ---- */}
        {showPdfViewer && pdf.pdfData && (
          <PlaybackDock
            status={speech.status}
            currentIndex={speech.currentIndex}
            rate={speech.rate}
            highlightMode={speech.highlightMode}
            pdfData={pdf.pdfData}
            selectedVoice={voices.selectedVoice}
            onTogglePauseResume={speech.togglePauseResume}
            onStop={speech.stop}
            onRateChange={handleRateChange}
            onHighlightModeChange={handleHighlightModeChange}
            onToggleVoicePicker={() => setShowVoicePicker((prev) => !prev)}
            blurMode={blurMode}
            onBlurModeToggle={handleBlurModeToggle}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {/* ---- Controls Drawer (right panel / bottom sheet) ---- */}
        {showPdfViewer && pdf.pdfData && (
          <ControlsPanel
            status={speech.status}
            currentIndex={speech.currentIndex}
            rate={speech.rate}
            highlightMode={speech.highlightMode}
            pdfData={pdf.pdfData}
            currentPage={currentPage}
            selectedVoice={voices.selectedVoice}
            onTogglePauseResume={speech.togglePauseResume}
            onStop={speech.stop}
            onRateChange={handleRateChange}
            onHighlightModeChange={handleHighlightModeChange}
            onToggleVoicePicker={() => setShowVoicePicker((prev) => !prev)}
            isVoicePickerOpen={showVoicePicker}
            blurMode={blurMode}
            onBlurModeToggle={handleBlurModeToggle}
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            isMobile={isMobile}
          />
        )}

        {/* ---- Voice Picker Overlay ---- */}
        {showVoicePicker && (
          <VoicePicker
            voices={voices.voices}
            filteredVoices={voices.filteredVoices}
            selectedVoice={voices.selectedVoice}
            isLoading={voices.isLoading}
            noVoicesAvailable={voices.noVoicesAvailable}
            searchQuery={voices.searchQuery}
            genderFilter={voices.genderFilter}
            onSearchChange={voices.setSearchQuery}
            onGenderChange={voices.setGenderFilter}
            onSelectVoice={handleVoiceSelect}
            onPreviewVoice={voices.previewVoice}
            isOpen={showVoicePicker}
            onClose={() => setShowVoicePicker(false)}
            isMobile={isMobile}
          />
        )}

        {/* ---- Modals & Overlays ---- */}
        <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
        <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <DefinitionPopup state={dictionary.state} isOpen={dictionary.isOpen} onClose={dictionary.close} isMobile={isMobile} />
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      </div>
    </ErrorBoundary>
  );
}
