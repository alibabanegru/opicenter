import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="always">
        <App />
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
);

// PWA Service Worker Registration (production only; unregister stale SW in Vite dev/preview)
if ("serviceWorker" in navigator) {
  const isDevOrPreview =
    Boolean((import.meta as any).env?.DEV) ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("ais-dev-");

  window.addEventListener("load", () => {
    if (isDevOrPreview) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("PWA ServiceWorker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("PWA ServiceWorker registration notice:", err);
      });
  });
}
