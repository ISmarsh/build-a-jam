/**
 * useTheme — custom hook for toggling light/dark mode
 *
 * LEARNING NOTES - CUSTOM HOOKS + DOM SIDE EFFECTS:
 *
 * This hook combines several React concepts:
 * 1. useState — tracks the current theme
 * 2. useEffect — syncs the theme to the DOM (class on <html>) and localStorage
 * 3. Side effects on the DOM — React normally owns the DOM, but toggling a class
 *    on <html> is outside React's tree. useEffect is the right place for this.
 *
 * Angular comparison: Angular Material's theming is CSS-only (overlay classes).
 * React has no built-in theme system, so we build one with a hook + CSS variables.
 * This is a common pattern in React — you'll see it in next-themes, shadcn/ui docs, etc.
 */

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'build-a-jam-theme';

/**
 * Reads the initial theme from localStorage or system preference.
 * Runs once at hook initialization — not a side effect, just a read.
 */
function getInitialTheme(): Theme {
  // 1. Check localStorage for a saved preference
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  // 2. Check system preference (prefers-color-scheme media query)
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';

  // 3. Default to dark (matches the app's original design)
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sync theme to <html> class and localStorage whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme } as const;
}
