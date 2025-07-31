import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Removed color mode context and toggle function

// Static theme without mode toggle
const theme = createTheme({
  palette: {
    mode: 'light',  // fixed light mode palette
    primary: {
      main: '#1a73e8', // Brand blue
      light: '#42a5f5',
      dark: '#0f62fe',
    },
    secondary: {
      main: '#00c853',
      lightest: '#e6ffed',
    },
    error: {
      main: '#d93025',
      lightest: '#fce8e6',
    },
    warning: {
      main: '#ffb300',
    },
    info: {
      main: '#2196f3',
    },
    background: {
      default: '#f8f9fa', // fixed light background for page
      paper: '#ffffff',   // fixed white for cards/papers
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
    },
    grey: {
      200: '#e0e0e0',
      300: '#c0c0c0',
      500: '#808080',
      700: '#424242',
      800: '#212121',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.06)',
    '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 8px 16px rgba(0, 0, 0, 0.1)',
    ...Array(23).fill('none'),
  ],
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
