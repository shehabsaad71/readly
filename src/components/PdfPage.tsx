/* ========================================
   FREE PDF TTS READER — PDF Page
   by Analyst Sandeep
   
   Renders a single PDF page with:
   - Canvas layer (images/diagrams — never blurred)
   - Text layer (clickable words with highlighting)
   - Premium gradient spotlight blur overlay
   - MOBILE: Performance optimizations (DPI cap, blur disable)
   ======================================== */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { PdfPageData, PdfWord } from '../types';
import { getSentenceRange } from '../utils/textProcessing';

interface PdfPageProps {
  pdfDoc: PDFDocumentProxy;
  pageData: PdfPageData;
  scale: number;
  currentWordIndex: number;
  highlightMode: 'word' | 'sentence';
  allWords: PdfWord[];
  onWordClick: (globalIndex: number) => void;
  onWordDoubleClick: () => void;
  onWordRightClick: (word: PdfWord, position: { x: number; y: number }) => void;
  onPageMeasured?: (pageIndex: number, height: number) => void;
  blurMode: boolean;
  speechStatus: string;
}

const LINE_GROUP_TOLERANCE = 3;

// ========== PERFORMANCE: Detect mobile/tablet ==========
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 1024 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};
// ========================================================

function getLinePositions(words: PdfWord[]): { top: number; height: number }[] {
  if (words.length === 0) return [];

  const lines: { top: number; height: number }[] = [];
  const sorted = [...words].sort((a, b) => a.rect.top - b.rect.top);

  let currentLineTop = sorted[0].rect.top;
  let currentLineHeight = sorted[0].rect.height;

  for (let i = 1; i < sorted.length; i++) {
    const word = sorted[i];
    if (Math.abs(word.rect.top - currentLineTop) <= LINE_GROUP_TOLERANCE) {
      currentLineHeight = Math.max(currentLineHeight, word.rect.height);
    } else {
      lines.push({ top: currentLineTop, height: currentLineHeight });
      currentLineTop = word.rect.top;
      currentLineHeight = word.rect.height;
    }
  }
  lines.push({ top: currentLineTop, height: currentLineHeight });

  return lines;
}

function getWordLineIndex(wordTop: number, lines: { top: number; height: number }[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (Math.abs(wordTop - lines[i].top) <= LINE_GROUP_TOLERANCE) {
      return i;
    }
  }
  return -1;
}

export default function PdfPage({
  pdfDoc,
  pageData,
  scale,
  currentWordIndex,
  highlightMode,
  allWords,
  onWordClick,
  onWordDoubleClick,
  onWordRightClick,
  onPageMeasured,
  blurMode,
  speechStatus,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  const activeRenderTaskRef = useRef<RenderTask | null>(null);
  const renderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRenderedScaleRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // ========== PERFORMANCE: Cache mobile detection ==========
  const isMobile = useMemo(() => isMobileDevice(), []);
  // ==========================================================

  const displayWidth = pageData.originalWidth * scale;
  const displayHeight = pageData.originalHeight * scale;

  const linePositions = useMemo(() => getLinePositions(pageData.words), [pageData.words]);

  const currentWordOnThisPage = useMemo(() => {
    if (currentWordIndex < 0) return false;
    return pageData.words.some((w) => w.globalIndex === currentWordIndex);
  }, [currentWordIndex, pageData.words]);

  // Get current line position for the gradient spotlight
  const currentLineInfo = useMemo(() => {
    if (!currentWordOnThisPage || currentWordIndex < 0) return null;
    // ========== PERFORMANCE: Skip calculation on mobile ==========
    if (isMobile) return null;
    // ==============================================================
    const currentWord = pageData.words.find((w) => w.globalIndex === currentWordIndex);
    if (!currentWord) return null;

    const lineIdx = getWordLineIndex(currentWord.rect.top, linePositions);
    if (lineIdx < 0) return null;

    const line = linePositions[lineIdx];
    const padding = line.height * 0.5;
    return {
      top: (line.top - padding) * scale,
      height: (line.height + padding * 2) * scale,
    };
  }, [currentWordOnThisPage, currentWordIndex, pageData.words, linePositions, scale, isMobile]);

  // ========== PERFORMANCE: Disable blur overlays on mobile ==========
  const showBlurOverlays = !isMobile && blurMode && speechStatus === 'playing' && currentWordIndex >= 0;
  // ===================================================================
  const showFullPageBlur = showBlurOverlays && !currentWordOnThisPage;
  const showSplitBlur = showBlurOverlays && currentWordOnThisPage && currentLineInfo !== null;

  useEffect(() => {
    if (pageContainerRef.current && onPageMeasured) {
      const height = pageContainerRef.current.offsetHeight;
      if (height > 0) onPageMeasured(pageData.pageIndex, height);
    }
  }, [displayHeight, onPageMeasured, pageData.pageIndex]);

  const cancelActiveRender = useCallback(() => {
    if (activeRenderTaskRef.current) {
      try { activeRenderTaskRef.current.cancel(); } catch { /* ignore */ }
      activeRenderTaskRef.current = null;
    }
  }, []);

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !isMountedRef.current) return;

    cancelActiveRender();
    const renderScale = scale;

    try {
      const page = await pdfDoc.getPage(pageData.pageNumber);
      if (!isMountedRef.current) { page.cleanup(); return; }

      const viewport = page.getViewport({ scale: renderScale });

      // ========== PERFORMANCE: Cap DPI on mobile ==========
      const rawDpr = window.devicePixelRatio || 1;
      const dpr = isMobile ? Math.min(rawDpr, 2.0) : rawDpr;
      // =====================================================

      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) { page.cleanup(); return; }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      const renderTask = page.render({ canvasContext: ctx, viewport, canvas } as any);
      activeRenderTaskRef.current = renderTask;
      await renderTask.promise;
      activeRenderTaskRef.current = null;

      if (isMountedRef.current) {
        lastRenderedScaleRef.current = renderScale;
        setIsRendered(true);
      }
      page.cleanup();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Rendering cancelled')) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error(`Error rendering page ${pageData.pageNumber}:`, err);
    }
  }, [pdfDoc, pageData.pageNumber, scale, cancelActiveRender, isMobile]);

  useEffect(() => {
    if (renderDebounceRef.current) {
      clearTimeout(renderDebounceRef.current);
      renderDebounceRef.current = null;
    }
    if (lastRenderedScaleRef.current === null) {
      setIsRendered(false);
      renderPage();
      return;
    }
    cancelActiveRender();
    renderDebounceRef.current = setTimeout(() => {
      renderDebounceRef.current = null;
      const scaleDiff = Math.abs(scale - (lastRenderedScaleRef.current || scale));
      if (scaleDiff > 0.5) setIsRendered(false);
      renderPage();
    }, 150);
    return () => {
      if (renderDebounceRef.current) { clearTimeout(renderDebounceRef.current); renderDebounceRef.current = null; }
    };
  }, [scale, renderPage, cancelActiveRender]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelActiveRender();
      if (renderDebounceRef.current) { clearTimeout(renderDebounceRef.current); renderDebounceRef.current = null; }
    };
  }, [cancelActiveRender]);

  const sentenceRange =
    highlightMode === 'sentence' && currentWordIndex >= 0
      ? getSentenceRange(allWords, currentWordIndex) : null;

  const isWordHighlighted = (word: PdfWord): boolean => {
    if (currentWordIndex < 0) return false;
    return word.globalIndex === currentWordIndex;
  };

  const isInSentence = (word: PdfWord): boolean => {
    if (!sentenceRange) return false;
    return word.globalIndex >= sentenceRange.start && word.globalIndex <= sentenceRange.end;
  };

  // ---- Build gradient spotlight overlay using CSS gradient ----
  const spotlightGradient = useMemo(() => {
    if (!showSplitBlur || !currentLineInfo) return null;

    const clearTop = Math.max(0, currentLineInfo.top);
    const clearBottom = Math.min(displayHeight, currentLineInfo.top + currentLineInfo.height);

    const fadeZone = 60;

    const gradientTop = Math.max(0, clearTop - fadeZone);
    const gradientBottom = Math.min(displayHeight, clearBottom + fadeZone);

    const pGradTop = (gradientTop / displayHeight) * 100;
    const pClearTop = (clearTop / displayHeight) * 100;
    const pClearBottom = (clearBottom / displayHeight) * 100;
    const pGradBottom = (gradientBottom / displayHeight) * 100;

    return `linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.35) 0%,
      rgba(0, 0, 0, 0.35) ${pGradTop}%,
      rgba(0, 0, 0, 0.15) ${pClearTop}%,
      rgba(0, 0, 0, 0) ${pClearTop + 0.5}%,
      rgba(0, 0, 0, 0) ${pClearBottom - 0.5}%,
      rgba(0, 0, 0, 0.15) ${pClearBottom}%,
      rgba(0, 0, 0, 0.35) ${pGradBottom}%,
      rgba(0, 0, 0, 0.35) 100%
    )`;
  }, [showSplitBlur, currentLineInfo, displayHeight]);

  return (
    <div
      ref={pageContainerRef}
      data-page={pageData.pageNumber}
      style={{
        position: 'relative',
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        margin: '0 auto 12px auto',
        backgroundColor: 'white',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      />

      {/* Loading Skeleton */}
      {!isRendered && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          gap: '10px', padding: '40px 48px',
          justifyContent: 'flex-start', paddingTop: '60px',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              height: '10px',
              width: i === 0 ? '45%' : i === 7 ? '55%' : `${70 + (i * 3) % 25}%`,
              borderRadius: '4px',
            }} />
          ))}
        </div>
      )}

      {/* Text Layer — Clickable Words */}
      <div
        className="pdf-text-layer"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        {pageData.words.map((word) => {
          const highlighted = isWordHighlighted(word);
          const inSentence = isInSentence(word);
          const left = word.rect.left * scale;
          const top = word.rect.top * scale;
          const width = word.rect.width * scale;
          const height = word.rect.height * scale;
          const fontSize = word.fontSize * scale;

          return (
            <span
              key={word.id}
              id={word.id}
              data-global-index={word.globalIndex}
              className={[
                'pdf-word',
                highlighted ? 'word-highlight' : '',
                inSentence && !highlighted ? 'sentence-highlight' : '',
              ].filter(Boolean).join(' ')}
              style={{
                position: 'absolute',
                left: `${left}px`, top: `${top}px`,
                width: `${width}px`, height: `${height}px`,
                fontSize: `${fontSize}px`,
                lineHeight: `${height}px`,
                fontFamily: word.fontFamily,
                cursor: 'pointer',
                userSelect: 'none', WebkitUserSelect: 'none',
                color: 'transparent',
                zIndex: highlighted ? 5 : 2,
              }}
              // Accessibility Props
              tabIndex={0}
              role="button"
              aria-label={`Read word: ${word.originalText}`}
              onClick={(e) => { e.stopPropagation(); onWordClick(word.globalIndex); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onWordClick(word.globalIndex);
                }
              }}
              onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onWordDoubleClick(); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onWordRightClick(word, { x: e.clientX, y: e.clientY }); }}
              title={word.originalText}
            >
              {word.originalText}
            </span>
          );
        })}
      </div>

      {/* Full page dim */}
      {showFullPageBlur && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 6, pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
        }} />
      )}

      {/* Gradient spotlight */}
      {showSplitBlur && spotlightGradient && (
        <div style={{
          position: 'absolute', inset: 0,
          background: spotlightGradient,
          zIndex: 6, pointerEvents: 'none',
          transition: 'background 0.15s ease',
        }} />
      )}

      {/* Page Number Badge */}
      <div style={{
        position: 'absolute',
        bottom: '8px', right: '8px',
        padding: '2px 8px', borderRadius: '4px',
        fontSize: '10px', fontWeight: 600,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white', zIndex: 10, pointerEvents: 'none',
      }}>
        {pageData.pageNumber}
      </div>
    </div>
  );
}