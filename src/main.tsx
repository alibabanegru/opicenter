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

// PWA Service Worker Registration
if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
  window.addEventListener("load", () => {
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
