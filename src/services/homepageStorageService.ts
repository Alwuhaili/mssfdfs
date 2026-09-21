// HOME-018_STORAGE_HARDENING_V1
// Homepage images upload to Firebase Storage. Firestore stores HTTPS URLs only.

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../lib/firebase';
import { sanitizeHomepagePathId } from '../utils/publicHomepageImageUrl';

export { sanitizeHomepagePathId };

export const MAX_HOMEPAGE_IMAGE_BYTES = 2 * 1024 * 1024;
export const HOMEPAGE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export const HOMEPAGE_IMAGE_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type HomepageImageMime = keyof typeof HOMEPAGE_IMAGE_MIME_TYPES;

export type HomepageImageTarget =
  | { kind: 'logo' }
  | { kind: 'principal' }
  | { kind: 'faculty'; teacherId: string }
  | { kind: 'news'; newsId: string }
  | { kind: 'gallery'; galleryId: string }
  | { kind: 'honor'; sourceType: 'student' | 'graduate'; sourceId: string };

export type HomepageImageUploadResult = {
  storagePath: string;
  downloadUrl: string;
  mimeType: HomepageImageMime;
  fileSizeBytes: number;
};

export type HomepageStorageErrorCode =
  | 'not-signed-in'
  | 'not-admin'
  | 'invalid-file'
  | 'invalid-type'
  | 'too-large'
  | 'invalid-id'
  | 'upload-failed';

export class HomepageStorageError extends Error {
  code: HomepageStorageErrorCode;
  constructor(code: HomepageStorageErrorCode, message: string) {
    super(message);
    this.name = 'HomepageStorageError';
    this.code = code;
  }
}

const ADMIN_ROLES = new Set(['admin', 'director', 'school_manager']);

function uniqueObjectToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

function extensionForMime(mime: string): string | null {
  return HOMEPAGE_IMAGE_MIME_TYPES[mime as HomepageImageMime] || null;
}

function validateHomepageImageFile(file: File): HomepageImageMime {
  if (!file || !(file instanceof File)) {
    throw new HomepageStorageError('invalid-file', 'لم يتم اختيار ملف صورة صالح.');
  }
  if (file.size <= 0) {
    throw new HomepageStorageError('invalid-file', 'ملف الصورة فارغ.');
  }
  if (file.size > MAX_HOMEPAGE_IMAGE_BYTES) {
    throw new HomepageStorageError('too-large', 'حجم الصورة أكبر من الحد المسموح (2 ميجابايت).');
  }
  const mime = String(file.type || '').trim().toLowerCase();
  if (mime === 'image/svg+xml' || mime.includes('svg')) {
    throw new HomepageStorageError('invalid-type', 'ملفات SVG غير مسموحة.');
  }
  const ext = extensionForMime(mime);
  if (!ext) {
    throw new HomepageStorageError('invalid-type', 'يُسمح فقط بصور JPEG أو PNG أو WebP.');
  }
  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.svg')) {
    throw new HomepageStorageError('invalid-type', 'ملفات SVG غير مسموحة.');
  }
  return mime as HomepageImageMime;
}

function buildHomepageStoragePath(target: HomepageImageTarget, mime: HomepageImageMime): string {
  const ext = HOMEPAGE_IMAGE_MIME_TYPES[mime];
  const unique = `${Date.now()}-${uniqueObjectToken().slice(0, 16)}`;
  if (target.kind === 'logo') return `homepage/school/logo/${unique}.${ext}`;
  if (target.kind === 'principal') return `homepage/school/principal/${unique}.${ext}`;
  if (target.kind === 'faculty') {
    const id = sanitizeHomepagePathId(target.teacherId);
    if (!id) throw new HomepageStorageError('invalid-id', 'معرف عضو الهيئة التدريسية غير صالح.');
    return `homepage/faculty/${id}/${unique}.${ext}`;
  }
  if (target.kind === 'news') {
    const id = sanitizeHomepagePathId(target.newsId);
    if (!id) throw new HomepageStorageError('invalid-id', 'معرف الخبر غير صالح.');
    return `homepage/news/${id}/${unique}.${ext}`;
  }
  if (target.kind === 'gallery') {
    const id = sanitizeHomepagePathId(target.galleryId);
    if (!id) throw new HomepageStorageError('invalid-id', 'معرف صورة المعرض غير صالح.');
    return `homepage/gallery/${id}/${unique}.${ext}`;
  }
  const sourceType = target.sourceType === 'graduate' ? 'graduate' : 'student';
  const id = sanitizeHomepagePathId(target.sourceId);
  if (!id) throw new HomepageStorageError('invalid-id', 'معرف سجل لوحة الشرف غير صالح.');
  return `homepage/honor/${sourceType}/${id}/${unique}.${ext}`;
}

async function assertHomepageAdmin(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new HomepageStorageError('not-signed-in', 'يجب تسجيل الدخول لرفع صور الصفحة الرئيسية.');
  }
  const token = await user.getIdTokenResult();
  const role = String(token.claims.role || '');
  if (!ADMIN_ROLES.has(role)) {
    throw new HomepageStorageError('not-admin', 'رفع صور الصفحة الرئيسية مسموح للإدارة فقط.');
  }
}

export function homepageStorageErrorMessage(error: unknown): string {
  if (error instanceof HomepageStorageError) return error.message;
  return 'تعذر رفع الصورة إلى التخزين السحابي.';
}

export async function uploadHomepageImage(
  file: File,
  target: HomepageImageTarget
): Promise<HomepageImageUploadResult> {
  await assertHomepageAdmin();
  const mimeType = validateHomepageImageFile(file);
  const storagePath = buildHomepageStoragePath(target, mimeType);
  const objectRef = ref(storage, storagePath);
  try {
    const snapshot = await uploadBytes(objectRef, file, {
      contentType: mimeType,
      cacheControl: 'public,max-age=31536000,immutable',
      customMetadata: {
        source: 'homepage-v1',
        kind: target.kind,
      },
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    if (!downloadUrl.toLowerCase().startsWith('https://')) {
      throw new HomepageStorageError('upload-failed', 'رابط التخزين المستلم غير آمن.');
    }
    if (downloadUrl.toLowerCase().startsWith('data:')) {
      throw new HomepageStorageError('upload-failed', 'رُفض رابط بيانات محلي.');
    }
    return {
      storagePath,
      downloadUrl,
      mimeType,
      fileSizeBytes: file.size,
    };
  } catch (error) {
    if (error instanceof HomepageStorageError) throw error;
    throw new HomepageStorageError('upload-failed', homepageStorageErrorMessage(error));
  }
}
