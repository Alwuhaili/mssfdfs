/**
 * Bulletproof Storage Utility with In-Memory Fallback
 * Prevents DOMException / SecurityError in sandboxed or third-party iframes
 */

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        if (value !== null) return value;
      }
    } catch {
      // Storage access blocked or restricted in iframe sandbox
    }
    return memoryStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage blocked or quota exceeded
    }
    memoryStore.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage blocked
    }
    memoryStore.delete(key);
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Storage blocked
    }
    memoryStore.clear();
  },
};
