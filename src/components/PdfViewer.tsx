/* ========================================
   FREE PDF TTS READER — PDF Viewer
   by Analyst Sandeep
   
   UPGRADED: No toolbar — zoom/page controls
   moved to header. This is now pure PDF display.
   
   FIXES APPLIED:
   - Scroll position anchoring on zoom (no page jumps)
   - Mobile performance optimizations (reduced buffer)
   - Optimized scroll handler for mobile
   ======================================== */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfDocumentData, PdfWord, ZoomMode } from '../types';
import type { VoiceInfo } from '../types';
import PdfPage from './PdfPage';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './ZoomControls';
import { MapPin, ArrowUp } from 'lucide-react';

// ========== PERFORMANCE: Detect mobile and reduce buffer ==========
const IS_MOBILE_DEVICE =
  typeof window !== 'undefined' &&
  (window.innerWidth < 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);

const BUFFER_PAGES = IS_MOBILE_DEVICE ? 1 : 2;
// ===================================================================

const SCROLL_DEBOUNCE = 100;

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  pdfData: PdfDocumentData;
  currentWordIndex: number;
  highlightMode: 'word' | 'sentence';
  isPlaying: boolean;
  selectedVoice: VoiceInfo | null;
  onWordClick: (globalIndex: number) => void;
  onWordDoubleClick: () => void;
  onWordRightClick: (word: PdfWord, position: { x: number; y: number }) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  scale: number | null;
  setScale: React.Dispatch<React.SetStateAction<number | null>>;
  zoomMode: ZoomMode;
  setZoomMode: React.Dispatch<React.SetStateAction<ZoomMode>>;
  jumpToPageFnRef: React.MutableRefObject<(pageNum: number) => void>;
  calculateFitWidthFnRef: React.MutableRefObject<() => number>;
  blurMode: boolean;
  speechStatus: string;
}

export default function PdfViewer({
  pdfDoc,
  pdfData,
  currentWordIndex,
  highlightMode,
  isPlaying,
  onWordClick,
  onWordDoubleClick,
  onWordRightClick,
  onPageChange,
  currentPage: _currentPage,
  scale,
  setScale,
  zoomMode,
  setZoomMode,
  jumpToPageFnRef,
  calculateFitWidthFnRef,
  blurMode,
  speechStatus,
}: PdfViewerProps) {
  const [userScrolledAway, setUserScrolledAway] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.min(4, pdfData.totalPages - 1),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef(false);
  const lastManualScrollRef = useRef(0);
  const currentPageRef = useRef(1);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageHeightsRef = useRef<Map<number, number>>(new Map());

  // ========== FIX: Zoom scroll anchoring refs ==========
  const previousScaleRef = useRef<number | null>(null);
  const isZoomingRef = useRef(false);
  // =====================================================

  const calculateFitWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container || pdfData.pages.length === 0) return 1.0;
    const containerWidth = container.clientWidth - 48;
    const pageWidth = pdfData.pages[0].originalWidth;
    if (pageWidth <= 0) return 1.0;
    return Math.min(Math.max(containerWidth / pageWidth, MIN_ZOOM), MAX_ZOOM);
  }, [pdfData]);

  // Expose calculateFitWidth to App
  useEffect(() => {
    calculateFitWidthFnRef.current = calculateFitWidth;
  }, [calculateFitWidth, calculateFitWidthFnRef]);

  // ========== FIX: Pure calculation function for page height ==========
  // Computes deterministically from original dimensions and a given scale.
  // Does NOT use cached/measured values — ensures consistent results
  // before and after zoom.
  const getPageHeightForScale = useCallback(
    (pageIndex: number, atScale: number): number => {
      const pageData = pdfData.pages[pageIndex];
      if (!pageData) return 800;
      return pageData.originalHeight * atScale + 12; // 12px = margin-bottom
    },
    [pdfData.pages]
  );
  // ====================================================================

  const getEstimatedPageHeight = useCallback(
    (pageIndex: number): number => {
      const currentScale = scale || 1.0;
      return getPageHeightForScale(pageIndex, currentScale);
    },
    [scale, getPageHeightForScale]
  );

  const updateVisiblePages = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const viewTop = scrollTop - containerHeight;
    const viewBottom = scrollTop + containerHeight * 2;

    let cumulativeTop = 0;
    let firstVisible = 0;
    let lastVisible = 0;
    let detectedPage = 1;

    for (let i = 0; i < pdfData.totalPages; i++) {
      const pageHeight = getEstimatedPageHeight(i);
      const pageTop = cumulativeTop;
      const pageBottom = cumulativeTop + pageHeight;

      const viewMiddle = scrollTop + containerHeight / 3;
      if (viewMiddle >= pageTop && viewMiddle <= pageBottom) {
        detectedPage = i + 1;
      }

      if (pageBottom >= viewTop && pageTop <= viewBottom) {
        if (firstVisible === 0 && i > 0) firstVisible = i;
        lastVisible = i;
      }

      cumulativeTop += pageHeight;
    }

    const start = Math.max(0, firstVisible - BUFFER_PAGES);
    const end = Math.min(pdfData.totalPages - 1, lastVisible + BUFFER_PAGES);

    if (detectedPage !== currentPageRef.current) {
      currentPageRef.current = detectedPage;
      onPageChange(detectedPage);
    }

    setVisibleRange((prev) => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });
  }, [pdfData.totalPages, getEstimatedPageHeight, onPageChange]);

  // Initialize scale
  useEffect(() => {
    if (scale !== null) {
      setIsReady(true);
      return;
    }
    const tryCalculate = () => {
      const container = containerRef.current;
      if (container && container.clientWidth > 0) {
        const fitScale = calculateFitWidth();
        setScale(fitScale);
        previousScaleRef.current = fitScale; // FIX: Initialize previous scale
        setIsReady(true);
      } else {
        requestAnimationFrame(tryCalculate);
      }
    };
    requestAnimationFrame(tryCalculate);
  }, [scale, calculateFitWidth, setScale]);

  // Resize handler for fit-width
  useEffect(() => {
    if (zoomMode !== 'fit-width') return;
    const handleResize = () => {
      const fitScale = calculateFitWidth();
      setScale(fitScale);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomMode, calculateFitWidth, setScale]);

  // Ctrl+scroll zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomMode('custom');
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setScale((prev) =>
          Math.max(MIN_ZOOM, Math.min((prev || 1) + delta, MAX_ZOOM))
        );
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setScale, setZoomMode]);

  // Expose jumpToPage to App
  const jumpToPage = useCallback(
    (pageNum: number) => {
      const container = containerRef.current;
      if (!container) return;

      const pageIndex = Math.max(0, Math.min(pageNum - 1, pdfData.totalPages - 1));

      setVisibleRange({
        start: Math.max(0, pageIndex - BUFFER_PAGES),
        end: Math.min(pdfData.totalPages - 1, pageIndex + BUFFER_PAGES),
      });

      requestAnimationFrame(() => {
        const pageEl = container.querySelector(
          `[data-page="${pageNum}"]`
        ) as HTMLElement;
        if (pageEl) {
          isAutoScrollingRef.current = true;
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => { isAutoScrollingRef.current = false; }, 500);
        }
      });
    },
    [pdfData.totalPages]
  );

  useEffect(() => {
    jumpToPageFnRef.current = jumpToPage;
  }, [jumpToPage, jumpToPageFnRef]);

  // Scroll handler
  // ========== FIX: Guard against scroll events during zoom ==========
  const handleScroll = useCallback(() => {
    // Skip scroll processing during zoom transitions
    if (isZoomingRef.current) return;

    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }
    scrollDebounceRef.current = setTimeout(() => {
      if (isZoomingRef.current) return; // Double-check after debounce
      updateVisiblePages();
    }, SCROLL_DEBOUNCE);

    if (!isAutoScrollingRef.current) {
      lastManualScrollRef.current = Date.now();
      if (currentWordIndex >= 0 && isPlaying) {
        // ========== PERFORMANCE: Skip expensive layout on mobile during scroll ==========
        if (IS_MOBILE_DEVICE) {
          // On mobile, use simple flag instead of getBoundingClientRect
          setUserScrolledAway(true);
        } else {
          const wordEl = document.getElementById(
            pdfData.allWords[currentWordIndex]?.id || ''
          );
          if (wordEl) {
            const container = containerRef.current;
            if (container) {
              const wordRect = wordEl.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const isVisible =
                wordRect.top >= containerRect.top - 100 &&
                wordRect.bottom <= containerRect.bottom + 100;
              setUserScrolledAway(!isVisible);
            }
          }
        }
        // ================================================================================
      }
    }
  }, [currentWordIndex, isPlaying, pdfData.allWords, updateVisiblePages]);
  // ==================================================================

  // ========== FIX: Scroll-anchored zoom transition ==========
  // This is the CORE FIX for the page-jump-on-zoom bug.
  // 1. Find which page is at the top of the viewport (anchor page)
  // 2. Calculate how far into that page the scroll position is (ratio)
  // 3. Compute the new scrollTop at the new scale
  // 4. Apply it synchronously
  // 5. THEN update visible pages
  useEffect(() => {
    if (!isReady || scale === null) return;

    const oldScale = previousScaleRef.current;

    // On first render, just record the scale
    if (oldScale === null) {
      previousScaleRef.current = scale;
      return;
    }

    // If scale hasn't actually changed, skip
    if (Math.abs(oldScale - scale) < 0.001) return;

    const container = containerRef.current;
    if (!container) {
      previousScaleRef.current = scale;
      return;
    }

    // STEP 1: Mark that we're zooming (suppress scroll handler)
    isZoomingRef.current = true;

    // STEP 2: Find the anchor page and offset ratio at the OLD scale
    const oldScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const viewMiddle = oldScrollTop + containerHeight / 3;

    let anchorPageIndex = 0;
    let cumulativeOld = 0;
    let anchorPageTopOld = 0;

    for (let i = 0; i < pdfData.totalPages; i++) {
      const pageHeight = getPageHeightForScale(i, oldScale);
      const pageTop = cumulativeOld;
      const pageBottom = cumulativeOld + pageHeight;

      if (viewMiddle >= pageTop && viewMiddle < pageBottom) {
        anchorPageIndex = i;
        anchorPageTopOld = pageTop;
        break;
      }

      if (pageBottom > viewMiddle) {
        anchorPageIndex = i;
        anchorPageTopOld = pageTop;
        break;
      }

      cumulativeOld += pageHeight;

      // Safety: if we reach the last page
      if (i === pdfData.totalPages - 1) {
        anchorPageIndex = i;
        anchorPageTopOld = pageTop;
      }
    }

    // Calculate how far into the anchor page the view-middle is (0 to 1)
    const anchorPageHeightOld = getPageHeightForScale(anchorPageIndex, oldScale);
    const offsetIntoPage = anchorPageHeightOld > 0
      ? (viewMiddle - anchorPageTopOld) / anchorPageHeightOld
      : 0;

    // STEP 3: Calculate new scrollTop at the NEW scale
    let cumulativeNew = 0;
    for (let i = 0; i < anchorPageIndex; i++) {
      cumulativeNew += getPageHeightForScale(i, scale);
    }
    const anchorPageHeightNew = getPageHeightForScale(anchorPageIndex, scale);
    const newAnchorPageTop = cumulativeNew;
    const newViewMiddle = newAnchorPageTop + (offsetIntoPage * anchorPageHeightNew);
    const newScrollTop = newViewMiddle - containerHeight / 3;

    // STEP 4: Apply the new scrollTop synchronously
    container.scrollTop = Math.max(0, newScrollTop);

    // STEP 5: Clear cached heights and update visible pages
    pageHeightsRef.current.clear();

    // Update visible range immediately (not debounced)
    updateVisiblePages();

    // STEP 6: Record the new scale as "previous" for next zoom
    previousScaleRef.current = scale;

    // STEP 7: Release the zoom lock after a short delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isZoomingRef.current = false;
      });
    });
  }, [scale, isReady, pdfData.totalPages, getPageHeightForScale, updateVisiblePages]);
  // ==============================================================

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordIndex < 0) {
      setUserScrolledAway(false);
      return;
    }
    const timeSinceManualScroll = Date.now() - lastManualScrollRef.current;
    if (timeSinceManualScroll < 1000) return;
    if (userScrolledAway) return;

    // ========== FIX: Don't auto-scroll during zoom ==========
    if (isZoomingRef.current) return;
    // =========================================================

    const word = pdfData.allWords[currentWordIndex];
    if (!word) return;

    const wordPage = word.pageIndex;
    setVisibleRange((prev) => {
      if (wordPage >= prev.start && wordPage <= prev.end) return prev;
      return {
        start: Math.max(0, wordPage - BUFFER_PAGES),
        end: Math.min(pdfData.totalPages - 1, wordPage + BUFFER_PAGES),
      };
    });

    requestAnimationFrame(() => {
      if (isZoomingRef.current) return; // FIX: Double-check
      const wordEl = document.getElementById(word.id);
      if (!wordEl) return;
      const container = containerRef.current;
      if (!container) return;

      const wordRect = wordEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + containerRect.height * 0.7;

      if (wordRect.top > threshold || wordRect.bottom < containerRect.top) {
        isAutoScrollingRef.current = true;
        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { isAutoScrollingRef.current = false; }, 500);
      }
    });
  }, [currentWordIndex, pdfData.allWords, pdfData.totalPages, userScrolledAway]);

  const goToCurrentWord = useCallback(() => {
    if (currentWordIndex < 0) return;
    const word = pdfData.allWords[currentWordIndex];
    if (!word) return;

    const wordPage = word.pageIndex;
    setVisibleRange({
      start: Math.max(0, wordPage - BUFFER_PAGES),
      end: Math.min(pdfData.totalPages - 1, wordPage + BUFFER_PAGES),
    });

    requestAnimationFrame(() => {
      const wordEl = document.getElementById(word.id);
      if (!wordEl) return;
      isAutoScrollingRef.current = true;
      setUserScrolledAway(false);
      wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isAutoScrollingRef.current = false; }, 500);
    });
  }, [currentWordIndex, pdfData.allWords, pdfData.totalPages]);

  const onPageMeasured = useCallback(
    (pageIndex: number, height: number) => {
      pageHeightsRef.current.set(pageIndex, height);
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, []);

  const currentScale = scale || 1.0;

  const pageRenderList = useMemo(() => {
    return pdfData.pages.map((pageData) => ({
      pageData,
      shouldRender:
        pageData.pageIndex >= visibleRange.start &&
        pageData.pageIndex <= visibleRange.end,
    }));
  }, [pdfData.pages, visibleRange]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Scrollable PDF Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '16px',
          backgroundColor: 'var(--bg-tertiary)',
          position: 'relative',
        }}
      >
        {!isReady && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px',
              gap: '16px',
            }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '80%',
                  maxWidth: '600px',
                  height: '800px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '40px 48px',
                  paddingTop: '60px',
                }}
              >
                {Array.from({ length: 8 }).map((_, j) => (
                  <div
                    key={j}
                    className="skeleton"
                    style={{
                      height: '10px',
                      width: j === 0 ? '45%' : j === 7 ? '55%' : `${70 + (j * 3) % 25}%`,
                      borderRadius: '4px',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {isReady &&
          pageRenderList.map(({ pageData, shouldRender }) =>
            shouldRender ? (
              <PdfPage
                key={pageData.pageIndex}
                pdfDoc={pdfDoc}
                pageData={pageData}
                scale={currentScale}
                currentWordIndex={currentWordIndex}
                highlightMode={highlightMode}
                allWords={pdfData.allWords}
                onWordClick={onWordClick}
                onWordDoubleClick={onWordDoubleClick}
                onWordRightClick={onWordRightClick}
                onPageMeasured={onPageMeasured}
                blurMode={blurMode}
                speechStatus={speechStatus}
              />
            ) : (
              <div
                key={pageData.pageIndex}
                data-page={pageData.pageNumber}
                style={{
                  width: `${pageData.originalWidth * currentScale}px`,
                  height: `${getEstimatedPageHeight(pageData.pageIndex)}px`,
                  margin: '0 auto 12px auto',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {pageData.pageNumber}
                </span>
              </div>
            )
          )}
      </div>

      {/* "Go to Current Word" Floating Button */}
      {userScrolledAway && currentWordIndex >= 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            animation: 'fab-in 0.3s ease forwards',
          }}
        >
          <button
            onClick={goToCurrentWord}
            className="btn-gradient"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            <MapPin size={16} />
            <span>Go to Current Word</span>
            <ArrowUp size={14} />
          </button>
        </div>
      )}
    </div>
  );
}