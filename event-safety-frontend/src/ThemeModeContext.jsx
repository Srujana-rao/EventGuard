import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeModeContext = createContext({ mode: 'light', preference: 'system', setMode: () => {} });

export const useThemeMode = () => useContext(ThemeModeContext);

function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeModeProvider({ children }) {
  const [preference, setPreference] = useState(localStorage.getItem('themePreference') || 'system');
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  const setMode = (value) => {
    localStorage.setItem('themePreference', value);
    setPreference(value);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          primary: { main: '#667eea' },
          secondary: { main: '#764ba2' },
          background: {
            default: resolvedMode === 'dark' ? '#121212' : '#f0f2f5',
            paper: resolvedMode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: { fontFamily: 'Inter, Roboto, sans-serif' },
      }),
    [resolvedMode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode: resolvedMode, preference, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}