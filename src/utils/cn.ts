/* ========================================
   FREE PDF TTS READER — Class Name Utility
   by Analyst Sandeep
   
   Simple utility to merge CSS class names.
   Handles conditional classes cleanly.
   
   Usage:
     cn('base-class', isActive && 'active', isDark && 'dark')
     → "base-class active" (if isActive=true, isDark=false)
   ======================================== */

/**
 * Merge class names, filtering out falsy values.
 * 
 * Examples:
 *   cn('btn', 'btn-primary')           → "btn btn-primary"
 *   cn('btn', false, 'active')         → "btn active"
 *   cn('btn', undefined, null, '')     → "btn"
 *   cn('btn', isPlaying && 'playing')  → "btn playing" or "btn"
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}