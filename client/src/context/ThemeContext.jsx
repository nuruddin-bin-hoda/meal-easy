import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('meal-easy-color-mode') || 'light',
  );

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('meal-easy-color-mode', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ThemeContext);
}
