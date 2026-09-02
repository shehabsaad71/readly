/* ========================================
   FREE PDF TTS READER — Voices Hook
   by Analyst Sandeep
   
   Handles:
   - Discovering all available TTS voices
   - Gender heuristic labeling
   - Language display names
   - Search and filter
   - Saving last selected voice
   - Voice sample preview
   ======================================== */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceInfo, GenderGuess } from '../types';
import { searchAndFilterVoices } from '../utils/fuzzySearch';

const STORAGE_KEY = 'pdf-tts-selected-voice';

// ---- Gender Heuristic ----
// These names are commonly associated with male/female voices.
// We label them as "likely" since we can't be 100% sure.

const FEMALE_KEYWORDS = [
  'female', 'woman', 'girl', 'feminine',
  // Microsoft voices
  'zira', 'hazel', 'heera', 'priya', 'kalpana', 'hemant',
  'susan', 'linda', 'catherine', 'tracy', 'huihui',
  'hanhan', 'irina', 'paulina', 'sabina', 'helena',
  'hortense', 'julie', 'caroline', 'hedda', 'katja',
  'haruka', 'sayaka', 'ayumi',
  // Google voices
  'google uk english female',
  'google us english female',
  // Apple voices
  'samantha', 'karen', 'moira', 'tessa', 'fiona',
  'victoria', 'allison', 'ava', 'nicky', 'kate',
  'serena', 'joana', 'luciana', 'monica', 'mei-jia',
  'sin-ji', 'ting-ting', 'milena', 'laura', 'alva',
  'kanya', 'lekha', 'sara', 'ellen', 'mariska',
  'yelda', 'zosia',
  // Common female names
  'alice', 'anna', 'clara', 'elena', 'emma', 'eva',
  'isabella', 'jenny', 'lisa', 'maria', 'natasha',
  'nina', 'olivia', 'sophia', 'stella',
];

const MALE_KEYWORDS = [
  'male', 'man', 'boy', 'masculine',
  // Microsoft voices
  'david', 'mark', 'richard', 'george', 'sean',
  'james', 'ravi', 'frank', 'cosimo', 'pablo',
  'claude', 'guillaume', 'stefan', 'andika',
  'ichiro', 'naayf', 'pattara', 'zhiwei',
  'kangkang', 'danny',
  // Google voices
  'google uk english male',
  'google us english male',
  // Apple voices
  'alex', 'daniel', 'fred', 'junior', 'ralph',
  'tom', 'thomas', 'luca', 'jorge', 'diego',
  'yuri', 'maged', 'tarik', 'xander',
  // Common male names
  'adam', 'brian', 'chris', 'eric', 'ivan',
  'jack', 'kevin', 'michael', 'oliver', 'peter',
  'robert', 'ryan', 'william',
];

/**
 * Guess the gender of a voice based on its name.
 * Returns 'male', 'female', or 'unknown'.
 */
function guessGender(voiceName: string): GenderGuess {
  const lower = voiceName.toLowerCase();

  // Check female keywords first (more specific names)
  for (const keyword of FEMALE_KEYWORDS) {
    if (lower.includes(keyword)) return 'female';
  }

  // Check male keywords
  for (const keyword of MALE_KEYWORDS) {
    if (lower.includes(keyword)) return 'male';
  }

  return 'unknown';
}

/**
 * Convert a language code to a human-readable display name.
 * "en-US" → "English (United States)"
 */
function getLanguageDisplayName(langCode: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const name = displayNames.of(langCode);
    if (name) return name;
  } catch {
    // Intl.DisplayNames might not support this code
  }

  // Fallback: manual mapping for common codes
  const fallbacks: Record<string, string> = {
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'en-AU': 'English (Australia)',
    'en-IN': 'English (India)',
    'en-CA': 'English (Canada)',
    'en-ZA': 'English (South Africa)',
    'en-IE': 'English (Ireland)',
    'en-NZ': 'English (New Zealand)',
    'en-SG': 'English (Singapore)',
    'hi-IN': 'Hindi (India)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'fr-FR': 'French (France)',
    'de-DE': 'German (Germany)',
    'it-IT': 'Italian (Italy)',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    'ja-JP': 'Japanese (Japan)',
    'ko-KR': 'Korean (Korea)',
    'zh-CN': 'Chinese (China)',
    'zh-TW': 'Chinese (Taiwan)',
    'ar-SA': 'Arabic (Saudi Arabia)',
    'ru-RU': 'Russian (Russia)',
    'nl-NL': 'Dutch (Netherlands)',
  };

  return fallbacks[langCode] || langCode;
}

/**
 * Extract country from language code.
 * "en-US" → "US"
 * "en" → ""
 */
function extractCountry(langCode: string): string {
  const parts = langCode.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : '';
}

/**
 * Convert a raw SpeechSynthesisVoice to our VoiceInfo format.
 */
function toVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
  return {
    voice,
    name: voice.name,
    lang: voice.lang,
    langDisplay: getLanguageDisplayName(voice.lang),
    country: extractCountry(voice.lang),
    gender: guessGender(voice.name),
    isLocal: voice.localService,
  };
}

/**
 * Load the previously selected voice name from localStorage.
 */
function loadSavedVoiceName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the selected voice name to localStorage.
 */
function saveVoiceName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to manage TTS voices.
 * 
 * Features:
 * - Auto-discovers all available voices
 * - Handles async voice loading (Chrome loads voices after a delay)
 * - Gender heuristic labeling
 * - Search and filter
 * - Remembers last selected voice
 * - Voice sample preview
 * 
 * Usage:
 *   const {
 *     voices,
 *     filteredVoices,
 *     selectedVoice,
 *     selectVoice,
 *     searchQuery,
 *     setSearchQuery,
 *     genderFilter,
 *     setGenderFilter,
 *     previewVoice,
 *   } = useVoices();
 */
export function useVoices() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const previewUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Load voices from the browser.
   * Chrome loads voices asynchronously, so we need to handle both
   * immediate and delayed loading.
   */
  const loadVoices = useCallback(() => {
    const synth = window.speechSynthesis;
    const rawVoices = synth.getVoices();

    if (rawVoices.length === 0) {
      // Voices not loaded yet (common in Chrome)
      return;
    }

    // Convert to VoiceInfo objects
    const voiceInfos = rawVoices.map(toVoiceInfo);

    // Sort: local voices first, then by language, then by name
    voiceInfos.sort((a, b) => {
      // Local voices first
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      // Then by language
      if (a.lang < b.lang) return -1;
      if (a.lang > b.lang) return 1;
      // Then by name
      return a.name.localeCompare(b.name);
    });

    setVoices(voiceInfos);
    setIsLoading(false);

    // Try to restore previously selected voice
    const savedName = loadSavedVoiceName();
    if (savedName) {
      const savedVoice = voiceInfos.find((v) => v.name === savedName);
      if (savedVoice) {
        setSelectedVoice(savedVoice);
        return;
      }
    }

    // Default: select first English voice, or first available
    const defaultVoice =
      voiceInfos.find((v) => v.lang.startsWith('en-') && v.isLocal) ||
      voiceInfos.find((v) => v.lang.startsWith('en-')) ||
      voiceInfos[0] ||
      null;

    if (defaultVoice) {
      setSelectedVoice(defaultVoice);
    }
  }, []);

  // Load voices on mount
  useEffect(() => {
    const synth = window.speechSynthesis;

    // Try loading immediately
    loadVoices();

    // Chrome fires this event when voices are ready
    synth.addEventListener('voiceschanged', loadVoices);

    // Safety timeout: if voices never load, stop showing loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
      clearTimeout(timeout);
    };
  }, [loadVoices]);

  /**
   * Select a voice and save to localStorage.
   */
  const selectVoice = useCallback((voiceInfo: VoiceInfo) => {
    setSelectedVoice(voiceInfo);
    saveVoiceName(voiceInfo.name);
  }, []);

  /**
   * Preview a voice with a sample phrase.
   */
  const previewVoice = useCallback((voiceInfo: VoiceInfo) => {
    const synth = window.speechSynthesis;

    // Stop any current preview
    if (previewUtteranceRef.current) {
      synth.cancel();
    }

    const sampleText = 'Hello! This is a preview of my voice. How does it sound?';
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voiceInfo.voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    previewUtteranceRef.current = utterance;

    utterance.onend = () => {
      previewUtteranceRef.current = null;
    };

    utterance.onerror = () => {
      previewUtteranceRef.current = null;
    };

    synth.speak(utterance);
  }, []);

  /**
   * Stop any voice preview.
   */
  const stopPreview = useCallback(() => {
    const synth = window.speechSynthesis;
    synth.cancel();
    previewUtteranceRef.current = null;
  }, []);

  /**
   * Get filtered and searched voices.
   */
  const filteredVoices = searchAndFilterVoices(voices, searchQuery, genderFilter);

  /**
   * Check if a voice is currently previewing.
   */
  const isPreviewing = previewUtteranceRef.current !== null;

  return {
    // All voices
    voices,
    // Filtered/searched voices
    filteredVoices,
    // Currently selected voice
    selectedVoice,
    // Loading state
    isLoading,
    // Whether no voices were found
    noVoicesAvailable: !isLoading && voices.length === 0,

    // Actions
    selectVoice,
    previewVoice,
    stopPreview,
    isPreviewing,

    // Search & filter
    searchQuery,
    setSearchQuery,
    genderFilter,
    setGenderFilter,
  };
}