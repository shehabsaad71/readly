/* ========================================
   FREE PDF TTS READER — Speech Hook
   by Analyst Sandeep
   
   UPGRADED: Human-sounding pause system
   
   Handles:
   - Playing speech from any word
   - Pause / Resume / Stop
   - Word-by-word highlight tracking
   - Chunked speech (fixes Chrome 15-sec bug)
   - PUNCTUATION-AWARE PAUSES (NEW)
   - HEADING DETECTION & EMPHASIS (NEW)
   - SPEED-SCALED PAUSE TIMING (NEW)
   - onboundary event for accurate sync
   - Timer fallback when onboundary unavailable
   - Mid-read voice switching
   - Speed control
   ======================================== */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PdfWord, SpeechStatus, SpeechSubChunk } from '../types';
import type { VoiceInfo } from '../types';
import {
  buildSpokenText,
  findNearestSpeakableWord,
  analyzePauses,
} from '../utils/textProcessing';
import type { SpokenTextMapping } from '../utils/textProcessing';

/** How many words per speech chunk (avoids Chrome 15-sec cutoff) */
const CHUNK_SIZE = 200;

/** How often to check if speech is still alive (ms) */
const WATCHDOG_INTERVAL = 5000;

/**
 * Hook to manage text-to-speech with word-level highlighting
 * and human-sounding pauses.
 */
export function useSpeech() {
  // ---- State ----
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [rate, setRate] = useState<number>(1.0);
  const [highlightMode, setHighlightMode] = useState<'word' | 'sentence'>('word');

  // ---- Refs ----
  const allWordsRef = useRef<PdfWord[]>([]);
  const voiceRef = useRef<VoiceInfo | null>(null);
  const rateRef = useRef<number>(1.0);
  const statusRef = useRef<SpeechStatus>('idle');
  const currentIndexRef = useRef<number>(-1);
  const chunkStartRef = useRef<number>(0);
  const mappingRef = useRef<SpokenTextMapping | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const boundaryWorkedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const shouldContinueRef = useRef<boolean>(true);
  const onWordChangeRef = useRef<((index: number) => void) | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // NEW: refs for sub-chunk pause system
  const subChunksRef = useRef<SpeechSubChunk[]>([]);
  const currentSubChunkRef = useRef<number>(0);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subChunkResolveRef = useRef<((value: 'ended' | 'cancelled' | 'error') => void) | null>(null);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const updateCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
    setCurrentIndex(index);
    onWordChangeRef.current?.(index);
  }, []);

  const updateStatus = useCallback((newStatus: SpeechStatus) => {
    statusRef.current = newStatus;
    isPausedRef.current = newStatus === 'paused';
    setStatus(newStatus);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  /**
   * Timer-based fallback for word highlighting.
   * (Same as before — for Firefox/Safari)
   */
  const startTimerFallback = useCallback(
    (wordIndices: number[], startFromIdx: number) => {
      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (wordIndices.length === 0) return;

      const charsPerSecond = 12.5 * rateRef.current;
      let idx = startFromIdx;

      const scheduleNext = () => {
        if (idx >= wordIndices.length) return;
        if (statusRef.current !== 'playing') return;

        const globalIndex = wordIndices[idx];
        updateCurrentIndex(globalIndex);

        const word = allWordsRef.current[globalIndex];
        const wordChars = word ? word.spokenText.length : 4;
        const wordDuration = Math.max(
          (wordChars / charsPerSecond) * 1000,
          80
        );

        idx++;
        timerRef.current = setTimeout(scheduleNext, wordDuration);
      };

      scheduleNext();
    },
    [updateCurrentIndex]
  );

  /**
   * Speak a single sub-chunk (a portion of text between pauses).
   * Returns a promise that resolves when done speaking + pause is done.
   */
  // REPLACE WITH (just remove fullMapping):
  const speakSubChunk = useCallback(
    (
      subChunk: SpeechSubChunk,
      voice: VoiceInfo
    ): Promise<'ended' | 'cancelled' | 'error'> => {
      return new Promise((resolve) => {
        const synth = window.speechSynthesis;

        if (subChunk.text.trim().length === 0) {
          resolve('ended');
          return;
        }

        // Pre-calculate word offsets for robust O(1) mapping during playback
        // This prevents sync drift caused by real-time string splitting
        const spokenTokens = subChunk.text.split(' ');
        const wordRanges: { start: number; end: number; wordIndex: number }[] = [];
        let charOffset = 0;
        const limit = Math.min(spokenTokens.length, subChunk.wordIndices.length);

        for (let i = 0; i < limit; i++) {
          const tokenLen = spokenTokens[i].length;
          wordRanges.push({
            start: charOffset,
            end: charOffset + tokenLen, // Range is [start, end)
            wordIndex: subChunk.wordIndices[i]
          });
          charOffset += tokenLen + 1; // +1 for the space
        }

        // Store resolve so pause/stop can use it
        subChunkResolveRef.current = resolve;

        const utterance = new SpeechSynthesisUtterance(subChunk.text);
        utterance.voice = voice.voice;
        utterance.rate = Math.max(0.1, Math.min(10, rateRef.current * subChunk.rateMultiplier));
        utterance.pitch = Math.max(0, Math.min(2, 1.0 + subChunk.pitchOffset));
        utterance.volume = Math.max(0, Math.min(1, subChunk.volumeMultiplier));
        utteranceRef.current = utterance;

        boundaryWorkedRef.current = false;

        // ---- onboundary: word-level tracking (Chrome/Edge) ----
        utterance.onboundary = (event: SpeechSynthesisEvent) => {
          if (event.name !== 'word') return;
          if (statusRef.current !== 'playing') return;

          // If we receive a boundary event, the browser supports it.
          // Kill any fallback timer immediately to avoid "fighting" updates.
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }

          boundaryWorkedRef.current = true;
          const charIndex = event.charIndex;

          // Find the word that covers this charIndex
          // Fuzzy lookup: if exact match fails, find the closest one
          let match: typeof wordRanges[0] | undefined;

          if (wordRanges.length > 0) {
            match = wordRanges.find(r => charIndex >= r.start && charIndex < r.end + 2); // +2 tolerance

            if (!match) {
              // Fallback: Find the closest range
              // This handles cases where browser charIndex drifts significantly
              match = wordRanges.reduce((prev, curr) => {
                return (Math.abs(curr.start - charIndex) < Math.abs(prev.start - charIndex) ? curr : prev);
              });
            }
          }

          if (match) {
            updateCurrentIndex(match.wordIndex);
          }
        };

        // ---- onstart ----
        utterance.onstart = () => {
          if (subChunk.wordIndices.length > 0) {
            updateCurrentIndex(subChunk.wordIndices[0]);
          }

          // Check if onboundary works after a moment
          // Scale timeout by rate: slower speech needs longer wait
          const waitTime = Math.max(500, 500 / rateRef.current);
          setTimeout(() => {
            if (!boundaryWorkedRef.current && statusRef.current === 'playing') {
              startTimerFallback(subChunk.wordIndices, 1);
            }
          }, waitTime);
        };

        // ---- onend: sub-chunk finished speaking ----
        utterance.onend = () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          utteranceRef.current = null;

          // Highlight last word of this sub-chunk
          if (subChunk.wordIndices.length > 0) {
            updateCurrentIndex(subChunk.wordIndices[subChunk.wordIndices.length - 1]);
          }

          // ---- INSERT PAUSE AFTER THIS SUB-CHUNK ----
          if (subChunk.pauseAfter > 0 && statusRef.current === 'playing') {
            pauseTimeoutRef.current = setTimeout(() => {
              pauseTimeoutRef.current = null;
              subChunkResolveRef.current = null;
              resolve('ended');
            }, subChunk.pauseAfter);
          } else {
            subChunkResolveRef.current = null;
            resolve('ended');
          }
        };

        // ---- onerror ----
        utterance.onerror = (event) => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          utteranceRef.current = null;
          subChunkResolveRef.current = null;

          if (event.error === 'canceled' || event.error === 'interrupted') {
            resolve('cancelled');
          } else {
            console.error('Speech error:', event.error);
            resolve('error');
          }
        };

        synth.speak(utterance);

        // Watchdog for Chrome silent stop
        if (watchdogRef.current) clearInterval(watchdogRef.current);
        watchdogRef.current = setInterval(() => {
          if (statusRef.current !== 'playing') return;
          if (synth.speaking || synth.pending) return;

          clearInterval(watchdogRef.current!);
          watchdogRef.current = null;

          if (pauseTimeoutRef.current) return; // We're in a pause

          utteranceRef.current = null;
          subChunkResolveRef.current = null;
          resolve('ended');
        }, WATCHDOG_INTERVAL);
      });
    },
    [updateCurrentIndex, startTimerFallback]
  );

  /**
   * Speak a chunk of words with human-sounding pauses.
   * This replaces the old speakChunk that sent everything as one utterance.
   */
  const speakChunk = useCallback(
    async (
      chunkStart: number,
      allWords: PdfWord[],
      voice: VoiceInfo
    ): Promise<'ended' | 'cancelled' | 'error'> => {
      // Build the text and mapping (same as before)
      const mapping = buildSpokenText(allWords, chunkStart, CHUNK_SIZE);
      mappingRef.current = mapping;
      chunkStartRef.current = chunkStart;

      if (mapping.text.trim().length === 0) {
        return 'ended';
      }

      // ---- NEW: Analyze pauses within this chunk ----
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, allWords.length);
      const chunkWords = allWords.slice(chunkStart, chunkEnd);
      const analysis = analyzePauses(chunkWords, chunkStart, rateRef.current);

      subChunksRef.current = analysis.subChunks;
      currentSubChunkRef.current = 0;

      // ---- Speak each sub-chunk sequentially with pauses ----
      for (let i = 0; i < analysis.subChunks.length; i++) {
        if (statusRef.current === 'stopped' || statusRef.current === 'idle') {
          return 'cancelled';
        }
        if (!shouldContinueRef.current) {
          return 'cancelled';
        }

        // If paused, wait
        if (statusRef.current === 'paused') {
          return 'cancelled';
        }

        currentSubChunkRef.current = i;
        const subChunk = analysis.subChunks[i];
        const result = await speakSubChunk(subChunk, voice);

        if (result === 'cancelled') return 'cancelled';
        if (result === 'error') continue; // Skip bad sub-chunks
      }

      return 'ended';
    },
    [speakSubChunk]
  );

  /**
   * Main reading loop (same structure as before).
   */
  const readingLoop = useCallback(
    async (startIndex: number, allWords: PdfWord[], voice: VoiceInfo) => {
      shouldContinueRef.current = true;
      let currentStart = startIndex;

      while (currentStart < allWords.length && shouldContinueRef.current) {
        if (statusRef.current === 'stopped' || statusRef.current === 'idle') {
          break;
        }

        const result = await speakChunk(currentStart, allWords, voice);

        if (result === 'cancelled') break;
        if (result === 'error') {
          currentStart += CHUNK_SIZE;
          continue;
        }

        currentStart += CHUNK_SIZE;

        // Small delay between major chunks
        if (currentStart < allWords.length && shouldContinueRef.current) {
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      if (
        currentStart >= allWords.length &&
        statusRef.current === 'playing'
      ) {
        updateStatus('idle');
        updateCurrentIndex(-1);
        onCompleteRef.current?.();
      }
    },
    [speakChunk, updateStatus, updateCurrentIndex]
  );

  // ---- Public API ----

  const playFromWord = useCallback(
    async (wordIndex: number, allWords: PdfWord[], voice: VoiceInfo | null) => {
      if (!voice) return;
      if (allWords.length === 0) return;

      const synth = window.speechSynthesis;
      synth.cancel();

      // Brief delay after cancel() for browser compatibility (Firefox/Safari)
      await new Promise(resolve => setTimeout(resolve, 50));

      clearAllTimers();
      shouldContinueRef.current = false;

      const speakableIndex = findNearestSpeakableWord(allWords, wordIndex);

      allWordsRef.current = allWords;
      voiceRef.current = voice;

      updateStatus('playing');
      updateCurrentIndex(speakableIndex);

      // Reset shouldContinue AFTER cancelling previous loops,
      // so the new reading loop can start
      shouldContinueRef.current = true;

      setTimeout(() => {
        if (!shouldContinueRef.current) return;
        readingLoop(speakableIndex, allWords, voice);
      }, 100);
    },
    [clearAllTimers, readingLoop, updateStatus, updateCurrentIndex]
  );

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const synth = window.speechSynthesis;
    synth.pause();
    clearAllTimers();
    updateStatus('paused');
  }, [clearAllTimers, updateStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;

    const synth = window.speechSynthesis;
    updateStatus('playing');

    // If we were in a pause timeout (between sub-chunks),
    // we need to restart from the current position
    if (!synth.paused && !synth.speaking) {
      // We were paused between sub-chunks
      // Restart from current word
      const currentIdx = currentIndexRef.current;
      const allWords = allWordsRef.current;
      const voice = voiceRef.current;

      if (currentIdx >= 0 && allWords.length > 0 && voice) {
        shouldContinueRef.current = true;
        readingLoop(currentIdx, allWords, voice);
      }
    } else {
      // We were paused mid-utterance
      synth.resume();

      if (!boundaryWorkedRef.current && mappingRef.current) {
        const currentGlobal = currentIndexRef.current;
        const currentSubChunk = subChunksRef.current[currentSubChunkRef.current];
        if (currentSubChunk) {
          const idx = currentSubChunk.wordIndices.indexOf(currentGlobal);
          if (idx >= 0) {
            startTimerFallback(currentSubChunk.wordIndices, idx + 1);
          }
        }
      }
    }
  }, [updateStatus, readingLoop, startTimerFallback]);

  const togglePauseResume = useCallback(() => {
    if (statusRef.current === 'playing') {
      pause();
    } else if (statusRef.current === 'paused') {
      resume();
    }
  }, [pause, resume]);

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    shouldContinueRef.current = false;
    synth.cancel();
    clearAllTimers();
    updateStatus('idle');
    updateCurrentIndex(-1);
    utteranceRef.current = null;
    mappingRef.current = null;
    subChunksRef.current = [];
    currentSubChunkRef.current = 0;
  }, [clearAllTimers, updateStatus, updateCurrentIndex]);

  const changeVoice = useCallback(
    (newVoice: VoiceInfo) => {
      voiceRef.current = newVoice;

      if (
        statusRef.current === 'playing' ||
        statusRef.current === 'paused'
      ) {
        const currentIdx = currentIndexRef.current;
        const allWords = allWordsRef.current;

        if (currentIdx >= 0 && allWords.length > 0) {
          const synth = window.speechSynthesis;
          synth.cancel();
          clearAllTimers();
          shouldContinueRef.current = false;

          setTimeout(() => {
            updateStatus('playing');
            shouldContinueRef.current = true;
            readingLoop(currentIdx, allWords, newVoice);
          }, 150);
        }
      }
    },
    [clearAllTimers, readingLoop, updateStatus]
  );

  const changeRate = useCallback(
    (newRate: number) => {
      setRate(newRate);
      rateRef.current = newRate;

      if (statusRef.current === 'playing') {
        const currentIdx = currentIndexRef.current;
        const allWords = allWordsRef.current;
        const voice = voiceRef.current;

        if (currentIdx >= 0 && allWords.length > 0 && voice) {
          const synth = window.speechSynthesis;
          synth.cancel();
          clearAllTimers();
          shouldContinueRef.current = false;

          setTimeout(() => {
            updateStatus('playing');
            shouldContinueRef.current = true;
            readingLoop(currentIdx, allWords, voice);
          }, 150);
        }
      }
    },
    [clearAllTimers, readingLoop, updateStatus]
  );

  const onWordChange = useCallback(
    (callback: ((index: number) => void) | null) => {
      onWordChangeRef.current = callback;
    },
    []
  );

  const onComplete = useCallback(
    (callback: (() => void) | null) => {
      onCompleteRef.current = callback;
    },
    []
  );

  const readSelection = useCallback(
    (text: string, voice: VoiceInfo | null) => {
      if (!voice || !text.trim()) return;

      const synth = window.speechSynthesis;
      synth.cancel();
      clearAllTimers();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice.voice;
      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;

      updateStatus('playing');

      utterance.onend = () => {
        updateStatus('idle');
      };

      utterance.onerror = () => {
        updateStatus('idle');
      };

      synth.speak(utterance);
    },
    [clearAllTimers, updateStatus]
  );

  useEffect(() => {
    return () => {
      const synth = window.speechSynthesis;
      synth.cancel();
      clearAllTimers();
      shouldContinueRef.current = false;
    };
  }, [clearAllTimers]);

  return {
    status,
    currentIndex,
    rate,
    highlightMode,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isStopped: status === 'stopped' || status === 'idle',

    playFromWord,
    pause,
    resume,
    togglePauseResume,
    stop,
    changeVoice,
    changeRate,
    setHighlightMode,
    readSelection,

    onWordChange,
    onComplete,
  };
}