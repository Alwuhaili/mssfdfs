/**
 * Helper utility to safely dispatch custom DOM events across all environments,
 * preventing "TypeError: Illegal constructor" in iframe / webview runtimes.
 */
export const dispatchCustomEvent = (eventName: string, detail?: Record<string, unknown>) => {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let event: Event | null = null;

    // 1. Try document.createEvent('CustomEvent') which works reliably across all iframes without throwing Illegal constructor
    if (typeof document.createEvent === 'function') {
      try {
        const custEvt = document.createEvent('CustomEvent');
        custEvt.initCustomEvent(eventName, true, true, detail);
        event = custEvt;
      } catch {
        // Fallback if initCustomEvent fails
      }
    }

    // 2. Try document.createEvent('Event')
    if (!event && typeof document.createEvent === 'function') {
      try {
        const evt = document.createEvent('Event');
        evt.initEvent(eventName, true, true);
        if (detail) (evt as unknown as Record<string, unknown>).detail = detail;
        event = evt;
      } catch {
        // Fallback
      }
    }

    // 3. Try new CustomEvent(...) constructor if available
    if (!event && typeof CustomEvent === 'function') {
      try {
        event = new CustomEvent(eventName, { detail, bubbles: true, cancelable: true });
      } catch {
        // Catch Illegal constructor error safely
      }
    }

    // 4. Try new Event(...) constructor if available
    if (!event && typeof Event === 'function') {
      try {
        event = new Event(eventName, { bubbles: true, cancelable: true });
        if (detail) (event as unknown as Record<string, unknown>).detail = detail;
      } catch {
        // Catch Illegal constructor error safely
      }
    }

    if (event) {
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.warn(`Failed to dispatch custom event: ${eventName}`, err);
  }
};
