/* ========================================
   FREE PDF TTS READER — Text Processing
   by Analyst Sandeep
   
   UPGRADED: Human-sounding pause system
   
   Contains:
   - buildSpokenText()         — Original: builds utterance text + char mapping
   - findNearestSpeakableWord() — Original: finds next speakable word
   - analyzePauses()           — NEW: splits words into sub-chunks with pauses
   - Heading detection         — NEW: detects headings from font/text signals
   - Pause configuration       — NEW: punctuation → pause duration mapping
   ======================================== */

import type { PdfWord, SpeechSubChunk, PauseAnalysis, HeadingLevel } from '../types';

// =============================================
// SECTION A: ORIGINAL FUNCTIONS (restored)
// These are required by useSpeech.ts
// =============================================

/**
 * Mapping from spoken text back to word indices.
 * Used by onboundary events for word highlighting.
 */
export interface SpokenTextMapping {
  /** The concatenated text string sent to SpeechSynthesisUtterance */
  text: string;
  /** Map of character position → global word index */
  charToWordIndex: Map<number, number>;
  /** Array of global indices of speakable words in this chunk */
  speakableIndices: number[];
}

/**
 * Characters/patterns that should not be spoken aloud.
 */
const UNSPEAKABLE_PATTERN = /^[\s\u200B\uFEFF\u00AD\u2028\u2029•●○■□▪▸▹※†‡§¶©®™°|~`^\\/<>{}[\]_=+]+$/;

/**
 * Check if a word has any speakable content.
 */
export function isSpeakable(wordOrText: PdfWord | string): boolean {
  const text = typeof wordOrText === 'string'
    ? wordOrText.trim()
    : wordOrText.spokenText.trim();

  if (text.length === 0) return false;
  if (UNSPEAKABLE_PATTERN.test(text)) return false;
  return true;
}
  

/**
 * Clean a word's text for speech synthesis.
 * Removes weird characters but keeps meaningful punctuation.
 */
function cleanForSpeech(text: string): string {
  let cleaned = text;

  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B\uFEFF\u00AD]/g, '');

  // Replace bullet-like characters with nothing (they make weird sounds)
  cleaned = cleaned.replace(/[•●○■□▪▸▹※†‡§¶]/g, '');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Build the spoken text string and character-to-word mapping
 * for a chunk of words.
 *
 * This is the function that creates the text sent to
 * SpeechSynthesisUtterance, along with a map so onboundary
 * events can be translated back to word indices.
 *
 * @param allWords - The complete array of all words in the document
 * @param startIndex - Global index to start from
 * @param count - How many words to include in this chunk
 * @returns SpokenTextMapping with text, charToWordIndex, and speakableIndices
 */
export function buildSpokenText(
  allWords: PdfWord[],
  startIndex: number,
  count: number
): SpokenTextMapping {
  const charToWordIndex = new Map<number, number>();
  const speakableIndices: number[] = [];
  let text = '';

  const endIndex = Math.min(startIndex + count, allWords.length);

  for (let i = startIndex; i < endIndex; i++) {
    const word = allWords[i];
    if (!isSpeakable(word)) continue;

    const cleaned = cleanForSpeech(word.spokenText);
    if (cleaned.length === 0) continue;

    // Record character position → word index
    const charPos = text.length;
    charToWordIndex.set(charPos, i);
    speakableIndices.push(i);

    // Add word to text with space separator
    if (text.length > 0) {
      text += ' ';
    }
    text += cleaned;
  }

  return { text, charToWordIndex, speakableIndices };
}

/**
 * Find the nearest speakable word at or after the given index.
 * If the clicked word is unspeakable (like a bullet symbol),
 * this finds the next real word.
 *
 * @param allWords - All words in the document
 * @param index - The starting index to search from
 * @returns The index of the nearest speakable word
 */
export function findNearestSpeakableWord(
  allWords: PdfWord[],
  index: number
): number {
  // Try forward first
  for (let i = index; i < allWords.length; i++) {
    if (isSpeakable(allWords[i])) return i;
  }
  // Try backward
  for (let i = index - 1; i >= 0; i--) {
    if (isSpeakable(allWords[i])) return i;
  }
  return index; // fallback
}


// =============================================
// SECTION B: NEW PAUSE SYSTEM
// Human-sounding pauses between speech chunks
// =============================================

// ---- Pause Configuration (base values at 1× speed, in ms) ----
const BASE_PAUSES = {
  // Word-level (short)
  comma: 250,
  dash: 350,
  parenthesis: 200,
  ellipsis: 500,
  // Sentence-level (medium)
  period: 600,
  question: 650,
  exclamation: 650,
  semicolon: 500,
  colon: 550,
  // Structural (long)
  lineBreak: 700,
  paragraphBreak: 900,
  // Headings
  heading: 1500,
  subheading: 1200,
  bulletPoint: 600,
  // Special
  quote: 300,
  afterNumber: 200,
  beforeEmphasis: 50,
};

// ---- Speed-Aware Pause Scaling ----
const SPEED_PAUSE_MULTIPLIERS: Record<number, number> = {
  0.5: 1.4,
  0.75: 1.2,
  1.0: 1.0,
  1.25: 0.85,
  1.5: 0.75,
  1.75: 0.65,
  2.0: 0.6,
  2.5: 0.5,
  3.0: 0.4,
};

/**
 * Get pause multiplier for a given speed (interpolates between known values).
 */
function getSpeedPauseMultiplier(speed: number): number {
  const knownSpeeds = Object.keys(SPEED_PAUSE_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => a - b);

  // Exact match
  if (SPEED_PAUSE_MULTIPLIERS[speed] !== undefined) {
    return SPEED_PAUSE_MULTIPLIERS[speed];
  }

  // Clamp to range
  if (speed <= knownSpeeds[0]) return SPEED_PAUSE_MULTIPLIERS[knownSpeeds[0]];
  if (speed >= knownSpeeds[knownSpeeds.length - 1]) {
    return SPEED_PAUSE_MULTIPLIERS[knownSpeeds[knownSpeeds.length - 1]];
  }

  // Interpolate
  for (let i = 0; i < knownSpeeds.length - 1; i++) {
    if (speed >= knownSpeeds[i] && speed <= knownSpeeds[i + 1]) {
      const lower = knownSpeeds[i];
      const upper = knownSpeeds[i + 1];
      const ratio = (speed - lower) / (upper - lower);
      return SPEED_PAUSE_MULTIPLIERS[lower] +
        (SPEED_PAUSE_MULTIPLIERS[upper] - SPEED_PAUSE_MULTIPLIERS[lower]) * ratio;
    }
  }

  return 1.0;
}

/**
 * Scale a base pause by current speed.
 */
function scalePause(basePause: number, speed: number): number {
  return Math.round(basePause * getSpeedPauseMultiplier(speed));
}

// ---- Emphasis Words ----
const EMPHASIS_WORDS = new Set([
  'important', 'note', 'warning', 'remember', 'key',
  'critical', 'must', 'never', 'always', 'caution',
  'attention', 'essential', 'crucial', 'vital',
  'significant', 'mandatory', 'required', 'urgent',
  'danger', 'notice', 'tip', 'hint',
]);

function isEmphasisWord(word: string): boolean {
  return EMPHASIS_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, ''));
}

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  return letters.length > 1 && letters === letters.toUpperCase();
}

// ---- Abbreviation Detection ----
const ABBREVIATIONS = new Set([
  'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr',
  'st', 'ave', 'blvd', 'dept', 'est', 'govt',
  'inc', 'corp', 'ltd', 'vs', 'etc', 'approx',
  'e.g', 'i.e', 'a.m', 'p.m', 'u.s', 'u.k',
]);

function isAbbreviation(word: string): boolean {
  const clean = word.toLowerCase().replace(/[.,;:!?]$/, '');
  return ABBREVIATIONS.has(clean) || /^[A-Z]\.([A-Z]\.)*$/.test(word);
}

function isURL(text: string): boolean {
  return /https?:\/\/|www\.|\.com|\.org|\.net|\.io/i.test(text);
}

function isEmail(text: string): boolean {
  return /\S+@\S+\.\S+/.test(text);
}

// ---- Bullet Point Detection ----
function isBulletStart(text: string): boolean {
  return /^[•●○■□▪▸▹\-–—*]\s*$/.test(text.trim()) ||
    /^\d+[.)]\s*$/.test(text.trim()) ||
    /^[a-zA-Z][.)]\s*$/.test(text.trim());
}

// ---- Numbered Heading Pattern ----
function isNumberedHeadingStart(words: PdfWord[], startIdx: number): boolean {
  if (startIdx >= words.length) return false;
  const text = words[startIdx].originalText.trim();

  return /^(\d+\.)+$/.test(text) ||
    /^Chapter$/i.test(text) ||
    /^Section$/i.test(text) ||
    /^Part$/i.test(text) ||
    /^[A-Z]\.$/.test(text);
}

// ---- Heading Detection from PdfWord properties ----

/**
 * Estimate body font size from a set of words.
 */
function estimateBodyFontSizeFromWords(words: PdfWord[]): number {
  const sizeCounts: Record<number, number> = {};

  words.forEach((w) => {
    const size = Math.round(w.fontSize || 0);
    if (size > 0) {
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    }
  });

  let maxCount = 0;
  let bodySize = 12;

  Object.entries(sizeCounts).forEach(([size, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bodySize = Number(size);
    }
  });

  return bodySize;
}

/**
 * Detect if a sequence of words starting at `idx` is a heading.
 * Uses font size, font name, word count, and patterns.
 *
 * Returns the heading level and how many words the heading spans.
 */
function detectHeadingAtPosition(
  words: PdfWord[],
  idx: number,
  bodyFontSize: number
): { level: HeadingLevel; wordSpan: number } {
  const word = words[idx];
  if (!word) return { level: 'body', wordSpan: 0 };

  let score = 0;

  // A. Font Size
  if (word.fontSize > 0 && bodyFontSize > 0) {
    const ratio = word.fontSize / bodyFontSize;
    if (ratio >= 1.3) score += 3;
    else if (ratio >= 1.15) score += 2;
  }

  // B. Font Weight (check fontFamily for "Bold")
  if (word.fontFamily && /bold/i.test(word.fontFamily)) score += 2;

  // C. Numbered pattern
  if (isNumberedHeadingStart(words, idx)) score += 2;

  // Find how many consecutive words share the same font properties
  // (headings typically have consistent formatting)
  let span = 1;
  for (let j = idx + 1; j < words.length && j < idx + 15; j++) {
    const nextWord = words[j];

    // Check if same page
    if (nextWord.pageIndex !== word.pageIndex) break;

    // Check if same font size (within tolerance)
    const sizeDiff = Math.abs((nextWord.fontSize || 0) - (word.fontSize || 0));
    if (sizeDiff > 1) break;

    // Check if same font family
    if (nextWord.fontFamily !== word.fontFamily) break;

    span++;
  }

  // D. Short line (headings are usually short)
  if (span <= 8 && score >= 2) score += 2;
  else if (span <= 12) score += 1;
  if (span > 15) score -= 2;

  // E. Check if line doesn't end with sentence punctuation
  const lastWordInSpan = words[idx + span - 1];
  if (lastWordInSpan) {
    const lastChar = lastWordInSpan.originalText.trim().slice(-1);
    if (!/[.,;]/.test(lastChar)) score += 1;
  }

  // F. All caps check
  let allCapsCount = 0;
  for (let j = idx; j < idx + span && j < words.length; j++) {
    if (isAllCaps(words[j].originalText)) allCapsCount++;
  }
  if (allCapsCount > span * 0.5 && span >= 2) score += 1;

  // Classify
  let level: HeadingLevel;
  if (score >= 6) level = 'heading';
  else if (score >= 4) level = 'subheading';
  else level = 'body';

  return { level, wordSpan: level !== 'body' ? span : 0 };
}

/**
 * Detect what pause should come AFTER a word based on its
 * ending punctuation.
 */
function getPauseAfterWord(word: PdfWord, speed: number): number {
  const text = word.originalText.trim();
  if (text.length === 0) return 0;

  // Don't pause after abbreviations
  if (isAbbreviation(text)) return 0;

  // Don't pause inside URLs or emails
  if (isURL(text) || isEmail(text)) return 0;

  const lastChar = text.slice(-1);

  // Check for ellipsis (word might end with "...")
  if (/\.{2,}$/.test(text) || /…$/.test(text)) {
    return scalePause(BASE_PAUSES.ellipsis, speed);
  }

  switch (lastChar) {
    case '.': return scalePause(BASE_PAUSES.period, speed);
    case '?': return scalePause(BASE_PAUSES.question, speed);
    case '!': return scalePause(BASE_PAUSES.exclamation, speed);
    case ';': return scalePause(BASE_PAUSES.semicolon, speed);
    case ':': return scalePause(BASE_PAUSES.colon, speed);
    case ',': return scalePause(BASE_PAUSES.comma, speed);
    case '—':
    case '–': return scalePause(BASE_PAUSES.dash, speed);
    case ')': return scalePause(BASE_PAUSES.parenthesis, speed);
    default: return 0;
  }
}

/**
 * Check if there's a page break between two words.
 */
function isPageBreak(words: PdfWord[], idx: number): boolean {
  if (idx <= 0 || idx >= words.length) return false;
  return words[idx].pageIndex !== words[idx - 1].pageIndex;
}

/**
 * Check if there's a line/paragraph break between two words.
 * Uses vertical position difference on the same page.
 */
function isLineBreak(words: PdfWord[], idx: number): boolean {
  if (idx <= 0 || idx >= words.length) return false;
  const prev = words[idx - 1];
  const curr = words[idx];

  if (prev.pageIndex !== curr.pageIndex) return true;

  // Check vertical gap (words on different lines have different top positions)
  const lineHeight = Math.max(prev.rect.height, curr.rect.height, 10);
  const verticalGap = Math.abs(curr.rect.top - prev.rect.top);

  return verticalGap > lineHeight * 0.8;
}

/**
 * Check if there's a paragraph break (larger vertical gap).
 */
function isParagraphBreak(words: PdfWord[], idx: number): boolean {
  if (idx <= 0 || idx >= words.length) return false;
  const prev = words[idx - 1];
  const curr = words[idx];

  if (prev.pageIndex !== curr.pageIndex) return true;

  const lineHeight = Math.max(prev.rect.height, curr.rect.height, 10);
  const verticalGap = Math.abs(curr.rect.top - prev.rect.top);

  // Paragraph break = gap larger than ~1.8× line height
  return verticalGap > lineHeight * 1.8;
}

/**
 * Get prosody adjustments based on speed.
 */
function getProsodyIntensity(speed: number): number {
  if (speed <= 1) return 1.0;
  return Math.max(0.3, 1 - (speed - 1) * 0.5);
}


// =============================================
// SECTION C: MAIN ANALYZE PAUSES FUNCTION
// This is called by useSpeech.ts
// =============================================

/**
 * Analyze a chunk of PdfWords and split them into sub-chunks
 * with appropriate pauses, emphasis, and prosody.
 *
 * This is the CORE function that makes speech human-sounding.
 *
 * @param chunkWords - The words in this chunk (slice of allWords)
 * @param globalStartIndex - The global index of the first word in chunkWords
 * @param speed - Current playback speed (e.g., 1.0, 1.5)
 * @returns PauseAnalysis with array of SpeechSubChunks
 */
export function analyzePauses(
  chunkWords: PdfWord[],
  globalStartIndex: number,
  speed: number
): PauseAnalysis {
  if (chunkWords.length === 0) {
    return { subChunks: [] };
  }

  const subChunks: SpeechSubChunk[] = [];
  const bodyFontSize = estimateBodyFontSizeFromWords(chunkWords);
  const prosodyIntensity = getProsodyIntensity(speed);

  let i = 0;

  while (i < chunkWords.length) {
    const word = chunkWords[i];
    

    // Skip unspeakable words
    if (!isSpeakable(word)) {
      i++;
      continue;
    }

    // ---- Check for heading ----
    const headingResult = detectHeadingAtPosition(chunkWords, i, bodyFontSize);

    if (headingResult.level === 'heading' || headingResult.level === 'subheading') {
      const span = headingResult.wordSpan;
      const headingWords: PdfWord[] = [];
      const headingIndices: number[] = [];

      for (let j = i; j < i + span && j < chunkWords.length; j++) {
        if (isSpeakable(chunkWords[j])) {
          headingWords.push(chunkWords[j]);
          headingIndices.push(globalStartIndex + j);
        }
      }

      if (headingWords.length > 0) {
        const headingText = headingWords
          .map((w) => cleanForSpeech(w.spokenText))
          .filter(Boolean)
          .join(' ');

        const isH1 = headingResult.level === 'heading';

        subChunks.push({
          text: headingText,
          wordIndices: headingIndices,
          pauseAfter: scalePause(
            isH1 ? BASE_PAUSES.heading : BASE_PAUSES.subheading,
            speed
          ),
          rateMultiplier: isH1 ? 0.92 : 0.95,
          volumeMultiplier: Math.min(1.0, 1 + 0.07 * prosodyIntensity),
          pitchOffset: 0,
          contentType: headingResult.level,
        });
      }

      i += span;
      continue;
    }

    // ---- Check for bullet point ----
    if (isBulletStart(word.originalText)) {
      // Skip the bullet character itself, collect following words
      i++;

      const bulletWords: PdfWord[] = [];
      const bulletIndices: number[] = [];

      while (i < chunkWords.length) {
        const bWord = chunkWords[i];

        // Stop at next line break, heading, or bullet
        if (isLineBreak(chunkWords, i) && bulletWords.length > 0) break;
        if (isBulletStart(bWord.originalText)) break;

        if (isSpeakable(bWord)) {
          bulletWords.push(bWord);
          bulletIndices.push(globalStartIndex + i);
        }
        i++;
      }

      if (bulletWords.length > 0) {
        // Split bullet content on internal punctuation
        const bulletSubChunks = splitWordsOnPunctuation(
          bulletWords, bulletIndices, speed, prosodyIntensity, 'bullet'
        );
        subChunks.push(...bulletSubChunks);

        // Ensure last sub-chunk has bullet pause
        if (subChunks.length > 0) {
          const last = subChunks[subChunks.length - 1];
          last.pauseAfter = Math.max(
            last.pauseAfter,
            scalePause(BASE_PAUSES.bulletPoint, speed)
          );
        }
      }

      continue;
    }

    // ---- Regular body text ----
    // Collect words until a natural break point
    const bodyWords: PdfWord[] = [];
    const bodyIndices: number[] = [];

    while (i < chunkWords.length) {
      const bWord = chunkWords[i];

      // Stop at headings
      const nextHeading = detectHeadingAtPosition(chunkWords, i, bodyFontSize);
      if (nextHeading.level !== 'body' && bodyWords.length > 0) break;
      if (nextHeading.level !== 'body' && bodyWords.length === 0) break;

      // Stop at bullet points
      if (isBulletStart(bWord.originalText) && bodyWords.length > 0) break;

      // Stop at paragraph breaks (but include current word first)
      const hitParagraphBreak = isParagraphBreak(chunkWords, i) && bodyWords.length > 0;

      if (isSpeakable(bWord)) {
        bodyWords.push(bWord);
        bodyIndices.push(globalStartIndex + i);
      }

      i++;

      // After adding the word, check if it ends a sentence or has punctuation
      const pauseAfterThis = getPauseAfterWord(bWord, speed);

      if (pauseAfterThis >= scalePause(BASE_PAUSES.period, speed)) {
        // Sentence end — create a sub-chunk up to here
        break;
      }

      if (hitParagraphBreak) break;

      // Check for page break
      if (i < chunkWords.length && isPageBreak(chunkWords, i)) break;
    }

    if (bodyWords.length > 0) {
      const bodySubChunks = splitWordsOnPunctuation(
        bodyWords, bodyIndices, speed, prosodyIntensity, 'body'
      );
      subChunks.push(...bodySubChunks);

      // Add structural pause if next word is on a new line/paragraph
      if (subChunks.length > 0 && i < chunkWords.length) {
        const last = subChunks[subChunks.length - 1];

        if (isParagraphBreak(chunkWords, i)) {
          last.pauseAfter = Math.max(
            last.pauseAfter,
            scalePause(BASE_PAUSES.paragraphBreak, speed)
          );
        } else if (isLineBreak(chunkWords, i)) {
          last.pauseAfter = Math.max(
            last.pauseAfter,
            scalePause(BASE_PAUSES.lineBreak, speed)
          );
        } else if (isPageBreak(chunkWords, i)) {
          last.pauseAfter = Math.max(
            last.pauseAfter,
            scalePause(BASE_PAUSES.paragraphBreak, speed)
          );
        }
      }
    }
  }

  // Anti-stacking: deduplicate adjacent pauses
  return { subChunks: deduplicateSubChunkPauses(subChunks) };
}


/**
 * Split a sequence of body/bullet words into sub-chunks
 * at punctuation boundaries (commas, semicolons, etc.)
 *
 * This creates the fine-grained pause points within a sentence.
 */
function splitWordsOnPunctuation(
  words: PdfWord[],
  globalIndices: number[],
  speed: number,
  prosodyIntensity: number,
  defaultType: 'body' | 'bullet' | 'quote'
): SpeechSubChunk[] {
  const subChunks: SpeechSubChunk[] = [];

  let currentWords: string[] = [];
  let currentIndices: number[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleaned = cleanForSpeech(word.spokenText);
    if (!cleaned) continue;

    currentWords.push(cleaned);
    currentIndices.push(globalIndices[i]);

    // Check if this word ends with punctuation that deserves a pause
    const pause = getPauseAfterWord(word, speed);

    // Check for emphasis
    const hasEmphasis = isEmphasisWord(word.originalText) ||
      isAllCaps(word.originalText);

    if (pause > 0) {
      // Create sub-chunk up to this punctuation point
      const text = currentWords.join(' ');
      const isQuestion = word.originalText.trim().endsWith('?');

      // Determine content type
      let contentType = defaultType as SpeechSubChunk['contentType'];
      if (hasEmphasis || currentWords.some((w) =>
        isEmphasisWord(w) || isAllCaps(w)
      )) {
        contentType = 'emphasis';
      }

      subChunks.push({
        text,
        wordIndices: [...currentIndices],
        pauseAfter: pause,
        rateMultiplier: 1.0,
        volumeMultiplier: contentType === 'emphasis'
          ? Math.min(1.0, 1 + 0.07 * prosodyIntensity)
          : 1.0,
        pitchOffset: isQuestion ? 0.05 * prosodyIntensity : 0,
        contentType,
      });

      currentWords = [];
      currentIndices = [];
    }
  }

  // Remaining words (no trailing punctuation)
  if (currentWords.length > 0) {
    const hasEmphasis = currentWords.some((w) =>
      isEmphasisWord(w) || isAllCaps(w)
    );

    subChunks.push({
      text: currentWords.join(' '),
      wordIndices: [...currentIndices],
      pauseAfter: 0, // No punctuation → no pause (will be set by caller if needed)
      rateMultiplier: 1.0,
      volumeMultiplier: hasEmphasis
        ? Math.min(1.0, 1 + 0.07 * prosodyIntensity)
        : 1.0,
      pitchOffset: 0,
      contentType: hasEmphasis ? 'emphasis' : defaultType,
    });
  }

  return subChunks;
}


/**
 * Anti-stacking: when consecutive sub-chunks both have pauses,
 * keep only the longer one. Headings always keep their pauses.
 */
function deduplicateSubChunkPauses(subChunks: SpeechSubChunk[]): SpeechSubChunk[] {
  for (let i = 0; i < subChunks.length - 1; i++) {
    const current = subChunks[i];
    const next = subChunks[i + 1];

    // Headings always keep their pause
    if (current.contentType === 'heading' || current.contentType === 'subheading') {
      continue;
    }
    if (next.contentType === 'heading' || next.contentType === 'subheading') {
      // If current pause is shorter than what heading provides, drop current
      if (current.pauseAfter > 0 && current.pauseAfter < next.pauseAfter) {
        current.pauseAfter = 0;
      }
    }
  }

  return subChunks;
}
// =============================================
// SECTION D: PDF TEXT EXTRACTION HELPERS
// Used by usePdfDocument.ts
// =============================================

/**
 * Split a PDF text item (a run of text from PDF.js) into
 * individual PdfWord objects with position data.
 *
 * PDF.js gives us text items like "Hello world, this is"
 * and we need to split them into individual words with
 * their positions on the page.
 *
 * @param str - The text string from PDF.js text item
 * @param transform - The 6-element transform matrix [a, b, c, d, tx, ty]
 * @param itemWidth - Total width of the text item in PDF units
 * @param itemHeight - Height of the text item in PDF units
 * @param pageIndex - Which page (0-based)
 * @param pageHeight - Total page height (for coordinate flip)
 * @param globalIndexStart - Starting global word index
 * @param pageWordIndexStart - Starting word index within the page
 * @returns Array of PdfWord objects
 */
export function splitTextItemIntoWords(
  str: string,
  transform: number[],
  itemWidth: number,
  itemHeight: number,
  pageIndex: number,
  pageHeight: number,
  globalIndexStart: number,
  pageWordIndexStart: number
): PdfWord[] {
  const words: PdfWord[] = [];

  // Split the text item into individual words
  const parts = str.split(/(\s+)/);

  // Extract position from transform matrix
  // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
  const tx = transform[4];
  const ty = transform[5];
  const fontSize = Math.abs(transform[3]) || Math.abs(transform[0]) || itemHeight;

  // Font family from transform (PDF.js doesn't give us this directly in textContent,
  // but we can extract it from the item if available)
  const fontFamily = '';

  // Calculate character width (approximate - evenly distribute across item width)
  const totalChars = str.length;
  const charWidth = totalChars > 0 ? itemWidth / totalChars : 0;

  let charOffset = 0;
  let wordIdx = 0;

  for (const part of parts) {
    // Skip whitespace parts
    if (/^\s*$/.test(part)) {
      charOffset += part.length;
      continue;
    }

    // Calculate word position
    const wordLeft = tx + charOffset * charWidth;
    const wordWidth = part.length * charWidth;

    // PDF coordinate system has origin at bottom-left,
    // but we want top-left for HTML rendering
    const wordTop = pageHeight - ty - fontSize;

    // Clean text for speech (remove special chars but keep punctuation)
    const spokenText = part
      .replace(/[\u200B\uFEFF\u00AD]/g, '')  // Zero-width chars
      .replace(/[•●○■□▪▸▹※†‡§¶]/g, '')       // Bullet chars
      .trim();

    const globalIndex = globalIndexStart + wordIdx;
    const wordIndexInPage = pageWordIndexStart + wordIdx;

    words.push({
      id: `page-${pageIndex}-word-${wordIndexInPage}`,
      originalText: part,
      spokenText: spokenText || part,
      pageIndex,
      wordIndexInPage,
      globalIndex,
      rect: {
        left: wordLeft,
        top: wordTop,
        width: Math.max(wordWidth, 1),
        height: Math.max(fontSize, 1),
      },
      fontSize,
      fontFamily,
    });

    charOffset += part.length;
    wordIdx++;
  }

  return words;
}

/**
 * Estimate reading time in minutes based on word count.
 * Uses average reading speed of ~200 words per minute.
 *
 * @param wordCount - Number of speakable words
 * @returns Estimated reading time in minutes (rounded up)
 */
export function estimateReadTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 200;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
// =============================================
// SECTION E: SENTENCE RANGE DETECTION
// Used by PdfPage.tsx for sentence highlighting
// =============================================

/**
 * Find the start and end indices of the sentence containing
 * the word at the given index.
 * 
 * Used for "sentence" highlight mode — when the user wants
 * the entire sentence highlighted instead of just one word.
 *
 * @param allWords - All words in the document
 * @param wordIndex - The index of the current word
 * @returns Object with start and end indices of the sentence
 */
export function getSentenceRange(
  allWords: PdfWord[],
  wordIndex: number
): { start: number; end: number } {
  if (allWords.length === 0 || wordIndex < 0 || wordIndex >= allWords.length) {
    return { start: wordIndex, end: wordIndex };
  }

  // Sentence-ending punctuation
  const isSentenceEnd = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    const lastChar = trimmed.slice(-1);
    return lastChar === '.' || lastChar === '?' || lastChar === '!';
  };

  // ---- Find sentence START ----
  // Walk backward from wordIndex until we find a sentence-ending word
  // (the word AFTER that is our sentence start)
  let start = wordIndex;
  for (let i = wordIndex - 1; i >= 0; i--) {
    const word = allWords[i];

    // Stop at page boundary
    if (word.pageIndex !== allWords[wordIndex].pageIndex) {
      start = i + 1;
      break;
    }

    // Stop if previous word ends a sentence
    if (isSentenceEnd(word.originalText)) {
      start = i + 1;
      break;
    }

    start = i;
  }

  // ---- Find sentence END ----
  // Walk forward from wordIndex until we find a sentence-ending word
  let end = wordIndex;
  for (let i = wordIndex; i < allWords.length; i++) {
    const word = allWords[i];

    // Stop at page boundary
    if (word.pageIndex !== allWords[wordIndex].pageIndex) {
      end = i - 1;
      break;
    }

    end = i;

    // Stop if this word ends a sentence
    if (isSentenceEnd(word.originalText)) {
      break;
    }
  }

  return { start, end };
}