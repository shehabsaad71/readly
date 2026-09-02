/* ========================================
   FREE PDF TTS READER — Type Definitions
   by Analyst Sandeep
   ======================================== */

// -------- Theme --------
export type Theme = 'light' | 'dark' | 'sepia';

// -------- PDF --------
export interface PdfWord {
  /** Unique ID like "page-0-word-42" */
  id: string;
  /** Original text with punctuation: "Hello," */
  originalText: string;
  /** Cleaned text for speech: "Hello" */
  spokenText: string;
  /** Page index (0-based) */
  pageIndex: number;
  /** Word index within the page */
  wordIndexInPage: number;
  /** Global word index across all pages */
  globalIndex: number;
  /** Position on the PDF page (in PDF coordinate units) */
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  /** Font size in PDF units */
  fontSize: number;
  /** Font family from PDF */
  fontFamily: string;
}

export interface PdfPageData {
  /** Page index (0-based) */
  pageIndex: number;
  /** Page number (1-based, for display) */
  pageNumber: number;
  /** Original PDF page width in points */
  originalWidth: number;
  /** Original PDF page height in points */
  originalHeight: number;
  /** All words extracted from this page */
  words: PdfWord[];
}

export interface PdfDocumentData {
  /** Total number of pages */
  totalPages: number;
  /** All pages with their words */
  pages: PdfPageData[];
  /** Flat array of ALL words across all pages (for speech) */
  allWords: PdfWord[];
  /** Total word count */
  totalWordCount: number;
  /** Estimated read time in minutes */
  estimatedReadTime: number;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
}

// -------- Speech / TTS --------
export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'stopped';

export interface SpeechState {
  /** Current status */
  status: SpeechStatus;
  /** Index of the currently spoken word in allWords[] */
  currentWordIndex: number;
  /** The word currently being spoken */
  currentWord: PdfWord | null;
  /** Selected voice */
  selectedVoice: SpeechSynthesisVoice | null;
  /** Reading speed (0.5 to 3.0) */
  rate: number;
  /** Whether highlight mode is "word" or "sentence" */
  highlightMode: 'word' | 'sentence';
}

// -------- Voice --------
export type GenderGuess = 'male' | 'female' | 'unknown';

export interface VoiceInfo {
  /** The native SpeechSynthesisVoice object */
  voice: SpeechSynthesisVoice;
  /** Display name */
  name: string;
  /** Language code like "en-US" */
  lang: string;
  /** Language display name like "English (United States)" */
  langDisplay: string;
  /** Country extracted from lang code */
  country: string;
  /** Best-effort gender guess */
  gender: GenderGuess;
  /** Whether this is a local or remote voice */
  isLocal: boolean;
}

// -------- Dictionary --------
export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface DictionaryResult {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
}

export interface DictionaryState {
  /** The word being looked up */
  word: string;
  /** Loading state */
  isLoading: boolean;
  /** Result from API */
  result: DictionaryResult | null;
  /** Error message if failed */
  error: string | null;
  /** Position to show popup */
  position: { x: number; y: number };
}

// -------- Toast Notifications --------
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  icon: string;
  message: string;
  duration: number;
}

// -------- Zoom --------
export type ZoomMode = 'custom' | 'fit-width';

export interface ZoomState {
  /** Current scale (1.0 = 100%) */
  scale: number;
  /** Zoom mode */
  mode: ZoomMode;
}

// -------- App State --------
export interface AppState {
  /** Whether a PDF is loaded */
  isPdfLoaded: boolean;
  /** Whether the welcome modal is visible */
  showWelcome: boolean;
  /** Whether the keyboard shortcuts popup is visible */
  showShortcuts: boolean;
  /** Whether the voice picker panel is open */
  showVoicePicker: boolean;
  /** Current visible page number (1-based) */
  currentVisiblePage: number;
  /** Whether user has manually scrolled away from current word */
  userScrolledAway: boolean;
}

// ============================================
// PAUSE & PROSODY TYPES (for human-sounding TTS)
// ============================================

/** A sub-chunk within a larger speech chunk — one utterance + pause after */
export interface SpeechSubChunk {
  /** The text to speak */
  text: string;
  /** Word indices (global) covered by this sub-chunk */
  wordIndices: number[];
  /** Pause in ms AFTER this sub-chunk finishes speaking */
  pauseAfter: number;
  /** Rate multiplier (1.0 = normal, 0.92 = slower for headings) */
  rateMultiplier: number;
  /** Volume multiplier (1.0 = normal, 1.07 = emphasis) */
  volumeMultiplier: number;
  /** Pitch offset (-0.1 to +0.1 added to base pitch) */
  pitchOffset: number;
  /** What type of content this is */
  contentType: 'heading' | 'subheading' | 'bullet' | 'quote' | 'emphasis' | 'body';
}

/** Result of analyzing where pauses should go within a word range */
export interface PauseAnalysis {
  subChunks: SpeechSubChunk[];
}

/** Heading classification level */
export type HeadingLevel = 'heading' | 'subheading' | 'body';