import { createRoot } from 'react-dom/client';
import './tokens/global.css';
import { App } from './app/App';

createRoot(document.getElementById('app')!).render(<App />);

// Installable and offline: the service worker only runs in production builds, so it never caches a dev server.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
