const SAFE_FIREBASE_CODE = /^(?:storage|auth|functions|app-check|firestore)?\/?[a-z0-9._-]{1,80}$/i;
const EMBEDDED_CODE = /\b((?:storage|auth|permission-denied|unauthenticated|unavailable)(?:\/[a-z0-9._-]+)?)\b/i;

export function formatLibraryUploadError(err: unknown): string {
  const codeRaw = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = err instanceof Error ? err.message : String(err || '');

  if (message.includes('LOCAL EMULATOR MODE fail-closed') || message.includes('storage/unavailable')) {
    return 'تعذر رفع الملف: storage/unavailable';
  }

  const code = SAFE_FIREBASE_CODE.test(codeRaw.trim()) ? codeRaw.trim() : '';
  if (code) {
    return `تعذر رفع الملف: ${code}`;
  }

  const embedded = message.match(EMBEDDED_CODE);
  if (embedded?.[1] && !/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(embedded[1])) {
    return `تعذر رفع الملف: ${embedded[1]}`;
  }

  const concise = message
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/Bearer\s+\S+/gi, '')
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '')
    .replace(/AIza[A-Za-z0-9_-]+/g, '')
    .trim()
    .slice(0, 180);

  if (!concise) {
    return 'تعذر رفع الملف.';
  }
  if (concise.startsWith('تعذر') || concise.startsWith('يجب') || concise.startsWith('يرجى')) {
    return concise;
  }
  return `تعذر رفع الملف: ${concise}`;
}
