import React, { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

/**
 * App theme provider — light mode only.
 * Appearance / dark-mode toggles were removed from Settings.
 */
export function ThemeModeProvider({ children }) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#667eea' },
          secondary: { main: '#764ba2' },
          background: {
            default: '#f0f2f5',
            paper: '#ffffff',
          },
        },
        typography: { fontFamily: 'Inter, Roboto, sans-serif' },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
