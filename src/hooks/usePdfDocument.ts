/* ========================================
   FREE PDF TTS READER — PDF Document Hook
   by Analyst Sandeep
   
   Handles:
   - Loading PDF from file input
   - Extracting all pages
   - Extracting words with positions
   - Calculating stats (word count, read time)
   - Setting up PDF.js worker
   ======================================== */

import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfDocumentData, PdfPageData, PdfWord } from '../types';
import {
  splitTextItemIntoWords,
  estimateReadTime,
  isSpeakable,
} from '../utils/textProcessing';

// ---- Setup PDF.js Worker ----
// PDF.js needs a web worker to process PDFs without freezing the UI.
// We point it to the worker file from the pdfjs-dist package.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * State for the PDF loading process.
 */
interface PdfLoadingState {
  /** Whether a PDF is currently being loaded */
  isLoading: boolean;
  /** Loading progress message */
  loadingMessage: string;
  /** Loading progress percentage (0-100) */
  progress: number;
  /** Error message if loading failed */
  error: string | null;
}

/**
 * Hook to manage PDF document loading and text extraction.
 * 
 * Usage:
 *   const { pdfData, loadPdf, isLoading, ... } = usePdfDocument();
 *   
 *   // When user uploads a file:
 *   await loadPdf(file);
 *   
 *   // Access extracted data:
 *   pdfData.allWords — flat array of every word
 *   pdfData.pages — array of page data
 *   pdfData.totalPages — page count
 */
export function usePdfDocument() {
  const [pdfData, setPdfData] = useState<PdfDocumentData | null>(null);
  const [loadingState, setLoadingState] = useState<PdfLoadingState>({
    isLoading: false,
    loadingMessage: '',
    progress: 0,
    error: null,
  });

  // Keep reference to the PDF document for rendering pages later
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  /**
   * Extract words from a single PDF page.
   */
  const extractPageWords = useCallback(
    async (
      pdfDoc: PDFDocumentProxy,
      pageIndex: number,
      globalWordOffset: number
    ): Promise<PdfPageData> => {
      const pageNumber = pageIndex + 1;
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      const pageHeight = viewport.height;
      const words: PdfWord[] = [];
      let wordIndexInPage = 0;

      for (const item of textContent.items) {
        // Skip non-text items (like marked content)
        if (!('str' in item) || !item.str) continue;

        const textItem = item as {
          str: string;
          transform: number[];
          width: number;
          height: number;
        };

        // Skip empty strings and whitespace-only
        if (textItem.str.trim().length === 0) continue;

        const itemWords = splitTextItemIntoWords(
          textItem.str,
          textItem.transform,
          textItem.width,
          textItem.height,
          pageIndex,
          pageHeight,
          globalWordOffset + wordIndexInPage,
          wordIndexInPage
        );

        words.push(...itemWords);
        wordIndexInPage += itemWords.length;
      }

      // Clean up page resources
      page.cleanup();

      return {
        pageIndex,
        pageNumber,
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        words,
      };
    },
    []
  );

  /**
   * Load a PDF file and extract all text data.
   */
  const loadPdf = useCallback(
    async (file: File): Promise<boolean> => {
      // Reset state
      setLoadingState({
        isLoading: true,
        loadingMessage: 'Reading PDF file...',
        progress: 0,
        error: null,
      });
      setPdfData(null);

      try {
        // ---- Step 1: Read file as ArrayBuffer ----
        setLoadingState((prev) => ({
          ...prev,
          loadingMessage: 'Reading PDF file...',
          progress: 5,
        }));

        const arrayBuffer = await file.arrayBuffer();

        // ---- Step 2: Load PDF document ----
        setLoadingState((prev) => ({
          ...prev,
          loadingMessage: 'Loading PDF document...',
          progress: 15,
        }));

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          // Enable these for better text extraction
          useSystemFonts: true,
        });

        const pdfDoc = await loadingTask.promise;
        pdfDocRef.current = pdfDoc;

        const totalPages = pdfDoc.numPages;

        setLoadingState((prev) => ({
          ...prev,
          loadingMessage: `Extracting text from ${totalPages} pages...`,
          progress: 25,
        }));

        // ---- Step 3: Extract words from each page ----
        const pages: PdfPageData[] = [];
        let globalWordOffset = 0;

        for (let i = 0; i < totalPages; i++) {
          const pageProgress = 25 + Math.round((i / totalPages) * 65);

          setLoadingState((prev) => ({
            ...prev,
            loadingMessage: `Extracting page ${i + 1} of ${totalPages}...`,
            progress: pageProgress,
          }));

          const pageData = await extractPageWords(pdfDoc, i, globalWordOffset);
          pages.push(pageData);
          globalWordOffset += pageData.words.length;

          // Yield to main thread every page to keep UI responsive
          if (i % 1 === 0) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        }

        // ---- Step 4: Build flat word array ----
        setLoadingState((prev) => ({
          ...prev,
          loadingMessage: 'Preparing document...',
          progress: 92,
        }));

        const allWords = pages.flatMap((page) => page.words);

        // Re-index global indices to ensure they're sequential
        allWords.forEach((word, index) => {
          word.globalIndex = index;
        });

        // Count only speakable words for stats
        const speakableCount = allWords.filter((w) =>
          isSpeakable(w.originalText)
        ).length;

        const docData: PdfDocumentData = {
          totalPages,
          pages,
          allWords,
          totalWordCount: speakableCount,
          estimatedReadTime: estimateReadTime(speakableCount),
          fileName: file.name,
          fileSize: file.size,
        };

        // ---- Step 5: Done! ----
        setPdfData(docData);
        setLoadingState({
          isLoading: false,
          loadingMessage: '',
          progress: 100,
          error: null,
        });

        return true;
      } catch (err) {
        console.error('PDF loading error:', err);

        let errorMessage = 'Failed to load PDF. ';

        if (err instanceof Error) {
          if (err.message.includes('Invalid PDF')) {
            errorMessage += 'The file does not appear to be a valid PDF.';
          } else if (err.message.includes('password')) {
            errorMessage += 'This PDF is password-protected and cannot be opened.';
          } else if (err.message.includes('worker')) {
            errorMessage += 'PDF processing engine failed to load. Try refreshing the page.';
          } else {
            errorMessage += err.message;
          }
        } else {
          errorMessage += 'An unknown error occurred.';
        }

        setLoadingState({
          isLoading: false,
          loadingMessage: '',
          progress: 0,
          error: errorMessage,
        });

        return false;
      }
    },
    [extractPageWords]
  );

  /**
   * Get the PDF.js document proxy for rendering pages.
   * Components use this to render canvas for each page.
   */
  const getPdfDoc = useCallback((): PDFDocumentProxy | null => {
    return pdfDocRef.current;
  }, []);

  /**
   * Clear the current PDF and reset everything.
   */
  const clearPdf = useCallback(() => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    setPdfData(null);
    setLoadingState({
      isLoading: false,
      loadingMessage: '',
      progress: 0,
      error: null,
    });
  }, []);

  return {
    // Data
    pdfData,
    pdfDoc: pdfDocRef.current,
    getPdfDoc,

    // Loading state
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.loadingMessage,
    loadingProgress: loadingState.progress,
    loadingError: loadingState.error,

    // Actions
    loadPdf,
    clearPdf,
  };
}