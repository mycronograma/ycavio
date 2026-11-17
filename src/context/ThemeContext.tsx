import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'neon' | 'neon-light' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  isNeon: boolean;
  isNeonLight: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'mycronograma_theme';
const LEGACY_THEME_STORAGE_KEY = 'trilha_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored =
        localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed === 'light' ||
          parsed === 'dark' ||
          parsed === 'neon' ||
          parsed === 'neon-light' ||
          parsed === 'system'
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading theme from localStorage', e);
    }
    return 'dark';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const [isNeon, setIsNeon] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('neon');
  });

  const [isNeonLight, setIsNeonLight] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('neon-light');
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      let activeIsDark = false;
      let activeIsNeon = false;
      let activeIsNeonLight = false;

      if (theme === 'neon') {
        activeIsDark = true;
        activeIsNeon = true;
      } else if (theme === 'neon-light') {
        activeIsDark = false;
        activeIsNeonLight = true;
      } else if (theme === 'dark') {
        activeIsDark = true;
      } else if (theme === 'light') {
        activeIsDark = false;
      } else {
        activeIsDark = mediaQuery.matches;
      }

      setIsDark(activeIsDark);
      setIsNeon(activeIsNeon);
      setIsNeonLight(activeIsNeonLight);

      root.classList.toggle('dark', activeIsDark);
      root.classList.toggle('neon', activeIsNeon);
      root.classList.toggle('neon-light', activeIsNeonLight);
    };

    updateResolvedTheme();

    const handleSystemChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('neon');
    } else if (theme === 'neon') {
      setTheme('neon-light');
    } else if (theme === 'neon-light') {
      setTheme('light');
    } else {
      setTheme(isDark ? 'neon' : 'neon-light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, isNeon, isNeonLight, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
