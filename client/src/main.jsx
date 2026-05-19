import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider, useColorMode } from './context/ThemeContext';
import { TopbarProvider } from './context/TopbarContext';
import { SettingsProvider } from './context/SettingsContext';
import { lightTheme, darkTheme } from './theme';
import './i18n/index.js';
import App from './App.jsx';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[SW] registration failed:', err);
  });
}

function AppWithTheme() {
  const { mode } = useColorMode();
  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <TopbarProvider>
            <SettingsProvider>
              <CssBaseline />
              <App />
            </SettingsProvider>
          </TopbarProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeContextProvider>
        <AppWithTheme />
      </ThemeContextProvider>
    </BrowserRouter>
  </StrictMode>,
);
