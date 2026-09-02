/* ========================================
   FREE PDF TTS READER — Dictionary Hook
   by Analyst Sandeep
   
   Fetches word definitions from the
   Free Dictionary API (no key needed).
   
   API: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
   
   Features:
   - Fetch definition on right-click
   - Show phonetic, part of speech, definitions
   - Graceful offline fallback
   - Caching to avoid repeated API calls
   - Position popup near the clicked word
   ======================================== */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DictionaryState, DictionaryResult } from '../types';

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/** Cache definitions to avoid repeated API calls */
const definitionCache = new Map<string, DictionaryResult | null>();

/** Maximum cache size to prevent memory issues */
const MAX_CACHE_SIZE = 500;

/**
 * Clean a word for dictionary lookup.
 * Remove punctuation, convert to lowercase.
 */
function cleanForLookup(word: string): string {
  return word
    .replace(/[^a-zA-Z'-]/g, '') // Keep letters, hyphens, apostrophes
    .toLowerCase()
    .trim();
}

/**
 * Check if a word is worth looking up.
 * Skip very short words, numbers, etc.
 */
function isLookupWorthy(word: string): boolean {
  const cleaned = cleanForLookup(word);
  if (cleaned.length < 2) return false;
  if (/^\d+$/.test(cleaned)) return false; // Pure numbers
  return true;
}

/**
 * Hook to manage dictionary lookups.
 * 
 * Usage:
 *   const dict = useDictionary();
 *   
 *   // When user right-clicks a word:
 *   dict.lookup('example', { x: 100, y: 200 });
 *   
 *   // Show popup:
 *   dict.state.isLoading — show spinner
 *   dict.state.result   — show definition
 *   dict.state.error    — show error message
 *   
 *   // Close popup:
 *   dict.close();
 */
export function useDictionary() {
  const [state, setState] = useState<DictionaryState>({
    word: '',
    isLoading: false,
    result: null,
    error: null,
    position: { x: 0, y: 0 },
  });

  const [isOpen, setIsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch definition from the Free Dictionary API.
   */
  const fetchDefinition = useCallback(
    async (word: string): Promise<DictionaryResult | null> => {
      const cleaned = cleanForLookup(word);
      if (!cleaned) return null;

      // Check cache first
      if (definitionCache.has(cleaned)) {
        return definitionCache.get(cleaned) || null;
      }

      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_BASE}/${encodeURIComponent(cleaned)}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Word not found in dictionary
            definitionCache.set(cleaned, null);
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          definitionCache.set(cleaned, null);
          return null;
        }

        // Parse the first result
        const entry = data[0];
        const result: DictionaryResult = {
          word: entry.word || cleaned,
          phonetic: entry.phonetic || undefined,
          phonetics: entry.phonetics || [],
          meanings: (entry.meanings || []).slice(0, 3).map(
            (m: {
              partOfSpeech: string;
              definitions: { definition: string; example?: string }[];
            }) => ({
              partOfSpeech: m.partOfSpeech || 'unknown',
              definitions: (m.definitions || []).slice(0, 2).map(
                (d: { definition: string; example?: string }) => ({
                  definition: d.definition || '',
                  example: d.example || undefined,
                })
              ),
            })
          ),
        };

        // Cache the result
        if (definitionCache.size >= MAX_CACHE_SIZE) {
          // Remove oldest entry
          const firstKey = definitionCache.keys().next().value;
          if (firstKey !== undefined) {
            definitionCache.delete(firstKey);
          }
        }
        definitionCache.set(cleaned, result);

        return result;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Request was aborted — not an error
          return null;
        }

        // Check if it's a network error (offline)
        if (err instanceof TypeError && err.message.includes('fetch')) {
          throw new Error('offline');
        }

        throw err;
      }
    },
    []
  );

  /**
   * Look up a word and show the definition popup.
   */
  const lookup = useCallback(
    async (word: string, position: { x: number; y: number }) => {
      const cleaned = cleanForLookup(word);

      if (!isLookupWorthy(word)) {
        setState({
          word: cleaned || word,
          isLoading: false,
          result: null,
          error: 'This word is too short to look up.',
          position,
        });
        setIsOpen(true);
        return;
      }

      // Show loading state immediately
      setState({
        word: cleaned,
        isLoading: true,
        result: null,
        error: null,
        position,
      });
      setIsOpen(true);

      try {
        const result = await fetchDefinition(word);

        if (result) {
          setState({
            word: result.word,
            isLoading: false,
            result,
            error: null,
            position,
          });
        } else {
          setState({
            word: cleaned,
            isLoading: false,
            result: null,
            error: `No definition found for "${cleaned}". Try a different word.`,
            position,
          });
        }
      } catch (err) {
        let errorMessage: string;

        if (err instanceof Error && err.message === 'offline') {
          errorMessage =
            '🌐 You appear to be offline.\n\nWord definitions require an internet connection. ' +
            'Reading aloud works offline, but definitions need internet.\n\n' +
            '💡 Tip: Check your internet connection and try again.';
        } else {
          errorMessage =
            '⚠️ Could not fetch definition.\n\nPlease check your internet connection and try again.';
        }

        setState({
          word: cleaned,
          isLoading: false,
          result: null,
          error: errorMessage,
          position,
        });
      }
    },
    [fetchDefinition]
  );

  /**
   * Close the definition popup.
   */
  const close = useCallback(() => {
    setIsOpen(false);

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clear the definition cache.
   * Call this when loading a new PDF to free memory.
   */
  const clearCache = useCallback(() => {
    definitionCache.clear();
  }, []);

  /**
   * Close popup when clicking outside or pressing Escape.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't close on Escape if it's meant for stopping speech
      // The speech hook handles Escape separately
      // But if the popup is open and nothing is playing, close it
      if (e.key === 'Escape') {
        close();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the popup itself
      if (target.closest('.definition-popup')) return;
      close();
    };

    // Delay adding listener to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    isOpen,
    lookup,
    close,
    clearCache,
  };
}