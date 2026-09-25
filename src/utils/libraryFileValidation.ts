export const MAX_LIBRARY_FILE_SIZE = 50 * 1024 * 1024;

export const ALLOWED_LIBRARY_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'txt',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'mp4',
  'webm',
  'mov',
  'mp3',
  'wav',
  'm4a',
  'zip',
  'rar',
  '7z',
]);

const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/octet-stream'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  ppt: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream'],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  txt: ['text/plain', 'application/octet-stream'],
  csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  mov: ['video/quicktime', 'video/mp4', 'application/octet-stream'],
  mp3: ['audio/mpeg', 'audio/mp3', 'application/octet-stream'],
  wav: ['audio/wav', 'audio/x-wav', 'application/octet-stream'],
  m4a: ['audio/mp4', 'audio/x-m4a', 'application/octet-stream'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  rar: ['application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream'],
  '7z': ['application/x-7z-compressed', 'application/octet-stream'],
};

export const isCanonicalLibraryStoragePath = (storagePath: string | null | undefined): boolean => {
  const path = String(storagePath || '').trim();
  if (!path.startsWith('library/')) return false;
  if (path.includes('..') || path.includes('\\') || path.startsWith('http://') || path.startsWith('https://') || path === '#') {
    return false;
  }
  const parts = path.split('/');
  return parts.length === 4 && parts[0] === 'library' && parts.every((part) => part.length > 0);
};

const sanitizeLibraryPathSegment = (value: string): string =>
  value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '')
    .slice(0, 120);

export const buildLibraryStoragePath = (
  uploaderId: string,
  resourceId: string,
  fileName: string
): string => {
  const safeUploader = sanitizeLibraryPathSegment(uploaderId);
  const safeResource = sanitizeLibraryPathSegment(resourceId);
  const safeName = sanitizeLibraryPathSegment(fileName);

  if (!safeUploader || !safeResource || !safeName) {
    throw new Error('تعذر إنشاء مسار آمن للملف.');
  }

  return `library/${safeUploader}/${safeResource}/${safeName}`;
};

export const getLibraryFileExtension = (fileName: string): string => {
  const clean = fileName.trim().toLowerCase();
  const index = clean.lastIndexOf('.');
  if (index <= 0 || index === clean.length - 1) return '';
  return clean.slice(index + 1);
};

export const validateLibraryFile = (file: File): void => {
  if (!(file instanceof File)) {
    throw new Error('لم يتم تحديد ملف صالح.');
  }
  if (file.size <= 0) {
    throw new Error('الملف فارغ ولا يمكن رفعه.');
  }
  if (file.size > MAX_LIBRARY_FILE_SIZE) {
    throw new Error('حجم الملف يتجاوز الحد الأقصى المسموح وهو 50 ميغابايت.');
  }
  const extension = getLibraryFileExtension(file.name);
  if (!ALLOWED_LIBRARY_EXTENSIONS.has(extension)) {
    throw new Error(`امتداد الملف .${extension || '?'} غير مسموح به في المكتبة الرقمية.`);
  }
  const browserMime = (file.type || '').toLowerCase().trim();
  const expectedMimes = MIME_BY_EXTENSION[extension] || [];
  if (browserMime && expectedMimes.length > 0 && !expectedMimes.includes(browserMime)) {
    throw new Error('نوع الملف لا يتطابق مع امتداده. تم إيقاف الرفع لأسباب أمنية.');
  }
};
