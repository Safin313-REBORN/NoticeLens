import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const rawBase = import.meta.env.BASE_URL || '/';
    const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    const swUrl = `${normalizedBase}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.warn('[NoticeLens SW] Registration notice:', err);
    });
  });
}

