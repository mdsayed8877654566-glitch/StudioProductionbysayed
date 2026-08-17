import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { storeService } from './services/storeService';
import { applyThemeColor, updateDynamicBrowserMeta } from './utils/themeUtils';

// Immediate early theme & branding application before React mount
try {
  const initialSettings = storeService.getSettings();
  applyThemeColor(initialSettings.primaryColor);
  updateDynamicBrowserMeta(initialSettings);
} catch (e) {
  // safe fallback
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
