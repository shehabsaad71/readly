/* ========================================
   FREE PDF TTS READER — Theme Toggle
   by Analyst Sandeep
   Redesign: Warm Premium Reader
   ======================================== */

import { Sun, Moon, BookOpen } from 'lucide-react';
import type { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onCycleTheme: () => void;
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const size = 16;
  switch (theme) {
    case 'light': return <Sun size={size} />;
    case 'dark': return <Moon size={size} />;
    case 'sepia': return <BookOpen size={size} />;
  }
}

function getNextThemeLabel(theme: Theme): string {
  switch (theme) {
    case 'light': return 'Dark Mode';
    case 'dark': return 'Sepia Mode';
    case 'sepia': return 'Light Mode';
  }
}

export default function ThemeToggle({ theme, onCycleTheme }: ThemeToggleProps) {
  return (
    <div className="tooltip-wrapper tooltip-bottom" data-tooltip={getNextThemeLabel(theme)}>
      <button
        onClick={onCycleTheme}
        className="btn-icon"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
        }}
        aria-label={getNextThemeLabel(theme)}
      >
        <ThemeIcon theme={theme} />
      </button>
    </div>
  );
}