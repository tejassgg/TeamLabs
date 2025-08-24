import { useTheme } from '../../../context/ThemeContext';

// Custom hook for theme-aware classes
export const useThemeClasses = () => {
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  return getThemeClasses;
};
