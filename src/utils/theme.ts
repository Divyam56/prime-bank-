export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'primebank_theme';

/**
 * Returns the currently preferred theme mode.
 * Reads from localStorage if available, falls back to system media preference or default 'light'.
 */
export function getInitialTheme(storage = typeof window !== 'undefined' ? window.localStorage : undefined): ThemeMode {
  try {
    if (storage) {
      const stored = storage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (_) {
    // fallback gracefully if security restrictions block storage access
  }
  return 'light';
}

/**
 * Applies the theme to the document root element and saves to localStorage.
 */
export function applyTheme(theme: ThemeMode, storage = typeof window !== 'undefined' ? window.localStorage : undefined): void {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  try {
    if (storage) {
      storage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch (_) {
    // ignore storage failure
  }
}
