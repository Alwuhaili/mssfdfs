import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// 1. Transparently ensure window.localStorage never throws SecurityError in sandboxed iframes
(() => {
  try {
    const testKey = '__test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    const memory = new Map<string, string>();
    const safeStore: Storage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, String(v));
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
      clear: () => {
        memory.clear();
      },
      key: (i: number) => Array.from(memory.keys())[i] ?? null,
      get length() {
        return memory.size;
      },
    };
    try {
      Object.defineProperty(window, 'localStorage', {
        value: safeStore,
        configurable: true,
        writable: true,
      });
    } catch {
      // Ignore if non-configurable
    }
  }
})();

// 2. Suppress benign ResizeObserver and cross-origin noise from bubbling as uncaught "Script error."
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('ResizeObserver') ||
      msg.includes('Script error.') ||
      msg.includes('websocket')
    ) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('ResizeObserver') ||
      reasonMsg.includes('websocket') ||
      reasonMsg.includes('PDF.js')
    ) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

