// HOME-018_STORAGE_HARDENING_V1
// Public homepage image fields may only be empty or https:// URLs.

const MAX_PUBLIC_IMAGE_URL_LENGTH = 2000;

export function sanitizeHomepagePathId(value: unknown): string {
  const raw = String(value ?? '').trim();
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return cleaned.slice(0, 80);
}

export function looksLikeLegacyHomepageDataUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('data:');
}

export function sanitizePublicHttpsImageUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_PUBLIC_IMAGE_URL_LENGTH) return '';
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }
  if (!lower.startsWith('https://')) return '';
  if (lower.includes('\\') || lower.includes('\n') || lower.includes('\r')) return '';
  return trimmed;
}

export function persistPrivateHomepageImageUrl(next: unknown, previous: unknown): string {
  const nextValue = typeof next === 'string' ? next.trim() : '';
  const previousValue = typeof previous === 'string' ? previous.trim() : '';
  const https = sanitizePublicHttpsImageUrl(nextValue);
  if (https) return https;
  if (!nextValue) return '';
  if (nextValue === previousValue) return previousValue;
  return previousValue;
}
