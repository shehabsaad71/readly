/* ========================================
   FREE PDF TTS READER — Fuzzy Search
   by Analyst Sandeep
   
   Elastic-search-like voice matching.
   Typing "ind fem" finds:
     "Microsoft Heera - Hindi (India)" + Female
   
   Strategy:
   1. Split query into tokens
   2. Each token matched against all searchable fields
   3. Score based on match quality
   4. Sort by best score
   ======================================== */

import type { VoiceInfo } from '../types';

/**
 * Calculate how well a single token matches a target string.
 * Returns a score from 0 (no match) to 100 (perfect match).
 * 
 * Scoring:
 *   - Exact match:           100
 *   - Starts with token:      80
 *   - Word starts with token: 60
 *   - Contains token:         40
 *   - No match:                0
 */
function tokenMatchScore(token: string, target: string): number {
  const lowerToken = token.toLowerCase();
  const lowerTarget = target.toLowerCase();

  // Exact match
  if (lowerTarget === lowerToken) return 100;

  // Target starts with token
  if (lowerTarget.startsWith(lowerToken)) return 80;

  // Any word in target starts with token
  const words = lowerTarget.split(/[\s\-_(),./]+/);
  for (const word of words) {
    if (word.startsWith(lowerToken)) return 60;
  }

  // Target contains token anywhere
  if (lowerTarget.includes(lowerToken)) return 40;

  return 0;
}

/**
 * Common abbreviations and aliases for search.
 * Users might type these shortcuts.
 */
const ALIASES: Record<string, string[]> = {
  // Countries
  'us': ['united states', 'american', 'en-us'],
  'usa': ['united states', 'american', 'en-us'],
  'uk': ['united kingdom', 'british', 'en-gb', 'great britain'],
  'gb': ['united kingdom', 'british', 'en-gb', 'great britain'],
  'ind': ['india', 'indian', 'hindi', 'en-in'],
  'aus': ['australia', 'australian', 'en-au'],
  'can': ['canada', 'canadian', 'en-ca'],
  'nz': ['new zealand', 'en-nz'],
  'fr': ['france', 'french', 'fr-fr'],
  'de': ['germany', 'german', 'de-de'],
  'es': ['spain', 'spanish', 'es-es'],
  'it': ['italy', 'italian', 'it-it'],
  'jp': ['japan', 'japanese', 'ja-jp'],
  'kr': ['korea', 'korean', 'ko-kr'],
  'cn': ['china', 'chinese', 'zh-cn'],
  'br': ['brazil', 'brazilian', 'portuguese', 'pt-br'],
  'ru': ['russia', 'russian', 'ru-ru'],
  'ar': ['arabic', 'ar-sa'],
  'nl': ['netherlands', 'dutch', 'nl-nl'],
  'pt': ['portugal', 'portuguese', 'pt-pt'],
  'mx': ['mexico', 'mexican', 'es-mx'],
  'za': ['south africa', 'en-za'],
  'ie': ['ireland', 'irish', 'en-ie'],
  'sg': ['singapore', 'en-sg'],
  'hk': ['hong kong', 'zh-hk'],
  'tw': ['taiwan', 'zh-tw'],

  // Gender shortcuts
  'fem': ['female', 'woman', 'girl'],
  'mal': ['male', 'man', 'boy'],
  'f': ['female'],
  'm': ['male'],

  // Language shortcuts
  'eng': ['english', 'en-'],
  'hin': ['hindi', 'hi-'],
  'spa': ['spanish', 'es-'],
  'fre': ['french', 'fr-'],
  'ger': ['german', 'de-'],
  'ita': ['italian', 'it-'],
  'por': ['portuguese', 'pt-'],
  'chi': ['chinese', 'zh-'],
  'jap': ['japanese', 'ja-'],
  'kor': ['korean', 'ko-'],
  'ara': ['arabic', 'ar-'],
  'rus': ['russian', 'ru-'],
  'dut': ['dutch', 'nl-'],

  // Voice quality
  'nat': ['natural', 'neural'],
  'online': ['online', 'remote', 'network'],
  'local': ['local', 'offline'],
  'ms': ['microsoft'],
  'goog': ['google'],
};

/**
 * Expand a token using aliases.
 * "ind" → ["ind", "india", "indian", "hindi", "en-in"]
 */
function expandToken(token: string): string[] {
  const lower = token.toLowerCase();
  const expanded = [lower];

  // Check if token matches any alias key
  for (const [key, values] of Object.entries(ALIASES)) {
    if (key === lower || key.startsWith(lower)) {
      expanded.push(...values);
    }
  }

  return [...new Set(expanded)];
}

/**
 * Build a searchable string from a VoiceInfo object.
 * Combines all relevant fields into one string for matching.
 */
function buildSearchableText(voice: VoiceInfo): string {
  return [
    voice.name,
    voice.lang,
    voice.langDisplay,
    voice.country,
    voice.gender,
    voice.isLocal ? 'local offline' : 'online remote',
  ].join(' ');
}

/**
 * Score how well a voice matches the search query.
 * 
 * Algorithm:
 * 1. Split query into tokens: "ind fem" → ["ind", "fem"]
 * 2. Expand each token with aliases: "ind" → ["ind", "india", "indian", ...]
 * 3. For each token, find the best match score against voice text
 * 4. ALL tokens must match (AND logic) — if any token scores 0, total = 0
 * 5. Final score = average of all token scores
 */
export function scoreVoiceMatch(voice: VoiceInfo, query: string): number {
  const trimmed = query.trim();
  if (trimmed.length === 0) return 100; // Empty query matches everything

  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return 100;

  const searchText = buildSearchableText(voice);
  let totalScore = 0;

  for (const token of tokens) {
    const expandedTokens = expandToken(token);
    let bestTokenScore = 0;

    // Try each expanded version of the token, keep best score
    for (const expanded of expandedTokens) {
      const score = tokenMatchScore(expanded, searchText);
      bestTokenScore = Math.max(bestTokenScore, score);
    }

    // If ANY token doesn't match at all, the voice doesn't match
    if (bestTokenScore === 0) return 0;

    totalScore += bestTokenScore;
  }

  // Average score across all tokens
  return totalScore / tokens.length;
}

/**
 * Search and rank voices by query.
 * Returns voices sorted by relevance (best match first).
 * Only includes voices with score > 0.
 */
export function searchVoices(
  voices: VoiceInfo[],
  query: string
): VoiceInfo[] {
  const trimmed = query.trim();

  if (trimmed.length === 0) return voices;

  // Score each voice
  const scored = voices
    .map((voice) => ({
      voice,
      score: scoreVoiceMatch(voice, trimmed),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.voice);
}

/**
 * Filter voices by gender.
 */
export function filterVoicesByGender(
  voices: VoiceInfo[],
  gender: 'all' | 'male' | 'female'
): VoiceInfo[] {
  if (gender === 'all') return voices;
  return voices.filter((v) => v.gender === gender);
}

/**
 * Combined search + filter.
 * First searches by query, then filters by gender.
 */
export function searchAndFilterVoices(
  voices: VoiceInfo[],
  query: string,
  gender: 'all' | 'male' | 'female'
): VoiceInfo[] {
  const searched = searchVoices(voices, query);
  return filterVoicesByGender(searched, gender);
}