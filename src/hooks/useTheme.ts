/* ========================================
   FREE PDF TTS READER — Theme Hook
   by Analyst Sandeep
   
   Manages Light / Dark / Sepia themes.
   - Saves preference to localStorage
   - Defaults to system preference
   - Applies data-theme attribute to <html>
   ======================================== */

import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

const STORAGE_KEY = 'pdf-tts-theme';

/**
 * Detect the user's system color scheme preference.
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Load saved theme from localStorage, or fall back to system preference.
 */
function loadSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'sepia') {
      return saved;
    }
  } catch {
    // localStorage might not be available
  }
  return 'dark'; // Default to dark mode for all users
}

/**
 * Apply theme to the document.
 * Sets data-theme attribute on <html> element.
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // Also update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const colors: Record<Theme, string> = {
    light: '#ffffff',
    dark: '#0f0f23',
    sepia: '#f5f0e8',
  };

  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colors[theme]);
  }
}

/**
 * Theme labels for display.
 */
export const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  sepia: 'Sepia',
};

/**
 * Theme icons for display.
 */
export const THEME_ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  sepia: '📜',
};

/**
 * Order of theme cycling: Light → Dark → Sepia → Light
 */
const THEME_CYCLE: Theme[] = ['light', 'dark', 'sepia'];

/**
 * Hook to manage application theme.
 * 
 * Returns:
 *   - theme: current theme
 *   - setTheme: set a specific theme
 *   - cycleTheme: cycle to next theme
 *   - themeLabel: display label
 *   - themeIcon: display icon
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(loadSavedTheme);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes (if user hasn't manually set one)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Only auto-switch if user hasn't manually saved a preference
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Set theme and save to localStorage.
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Cycle to the next theme: Light → Dark → Sepia → Light
   */
  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const currentIndex = THEME_CYCLE.indexOf(current);
      const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
      const nextTheme = THEME_CYCLE[nextIndex];

      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage errors
      }

      return nextTheme;
    });
  }, []);

  return {
    theme,
    setTheme,
    cycleTheme,
    themeLabel: THEME_LABELS[theme],
    themeIcon: THEME_ICONS[theme],
  };
}