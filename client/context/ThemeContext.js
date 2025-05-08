import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // On mount, load theme from localStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) setTheme(stored);
  }, []);

  // Listen for system theme changes if 'system' is selected
  useEffect(() => {
    const getSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    };
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
      const listener = (e) => setResolvedTheme(e.matches ? 'dark' : 'light');
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.className = resolvedTheme;
    }
  }, [resolvedTheme, theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 