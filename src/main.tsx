import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { initAnalytics } from './analytics';

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </StrictMode>,
);
