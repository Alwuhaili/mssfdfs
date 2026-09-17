import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
  type UploadTaskSnapshot,
} from 'firebase/storage';

import { storage } from '../lib/firebase';

export interface LibraryStorageUploadResult {
  storagePath: string;
  downloadUrl: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface LibraryStorageUploadOptions {
  uploaderId: string;
  resourceId: string;
  onProgress?: (progress: number) => void;
}

export const MAX_LIBRARY_FILE_SIZE =
  50 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
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
]);

const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: [
    'application/pdf',
  ],

  doc: [
    'application/msword',
    'application/octet-stream',
  ],

  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],

  ppt: [
    'application/vnd.ms-powerpoint',
    'application/octet-stream',
  ],

  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream',
  ],

  xls: [
    'application/vnd.ms-excel',
    'application/octet-stream',
  ],

  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ],

  txt: [
    'text/plain',
    'application/octet-stream',
  ],

  csv: [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain',
    'application/octet-stream',
  ],

  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],

  mp4: ['video/mp4'],
  webm: ['video/webm'],
  mov: [
    'video/quicktime',
    'video/mp4',
    'application/octet-stream',
  ],

  mp3: [
    'audio/mpeg',
    'audio/mp3',
    'application/octet-stream',
  ],

  wav: [
    'audio/wav',
    'audio/x-wav',
    'application/octet-stream',
  ],

  m4a: [
    'audio/mp4',
    'audio/x-m4a',
    'application/octet-stream',
  ],
};

const sanitizeSegment = (
  value: string
): string =>
  value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '')
    .slice(0, 120);

export const getLibraryFileExtension = (
  fileName: string
): string => {

  const clean = fileName.trim().toLowerCase();
  const index = clean.lastIndexOf('.');

  if (index <= 0 || index === clean.length - 1) {
    return '';
  }

  return clean.slice(index + 1);
};

export const validateLibraryFile = (
  file: File
): void => {

  if (!(file instanceof File)) {
    throw new Error(
      'لم يتم تحديد ملف صالح.'
    );
  }

  if (file.size <= 0) {
    throw new Error(
      'الملف فارغ ولا يمكن رفعه.'
    );
  }

  if (file.size > MAX_LIBRARY_FILE_SIZE) {
    throw new Error(
      'حجم الملف يتجاوز الحد الأقصى المسموح وهو 50 ميغابايت.'
    );
  }

  const extension =
    getLibraryFileExtension(file.name);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(
      `امتداد الملف .${extension || '?'} غير مسموح به في المكتبة الرقمية.`
    );
  }

  const browserMime =
    (file.type || '').toLowerCase().trim();

  const expectedMimes =
    MIME_BY_EXTENSION[extension] || [];

  if (
    browserMime &&
    expectedMimes.length > 0 &&
    !expectedMimes.includes(browserMime)
  ) {
    throw new Error(
      'نوع الملف لا يتطابق مع امتداده. تم إيقاف الرفع لأسباب أمنية.'
    );
  }
};

export const buildLibraryStoragePath = (
  uploaderId: string,
  resourceId: string,
  fileName: string
): string => {

  const safeUploader =
    sanitizeSegment(uploaderId);

  const safeResource =
    sanitizeSegment(resourceId);

  const safeName =
    sanitizeSegment(fileName);

  if (
    !safeUploader ||
    !safeResource ||
    !safeName
  ) {
    throw new Error(
      'تعذر إنشاء مسار آمن للملف.'
    );
  }

  return (
    `library/${safeUploader}/` +
    `${safeResource}/${safeName}`
  );
};

export const uploadLibraryFile = async (
  file: File,
  options: LibraryStorageUploadOptions
): Promise<LibraryStorageUploadResult> => {

  validateLibraryFile(file);

  if (!options.uploaderId?.trim()) {
    throw new Error(
      'تعذر التحقق من هوية رافع الملف.'
    );
  }

  if (!options.resourceId?.trim()) {
    throw new Error(
      'معرف المورد غير صالح.'
    );
  }

  const storagePath =
    buildLibraryStoragePath(
      options.uploaderId,
      options.resourceId,
      file.name
    );

  const objectRef =
    ref(storage, storagePath);

  const extension =
    getLibraryFileExtension(file.name);

  const metadata: UploadMetadata = {
    contentType:
      file.type ||
      'application/octet-stream',

    customMetadata: {
      uploaderId:
        options.uploaderId,

      resourceId:
        options.resourceId,

      originalFileName:
        file.name,

      fileExtension:
        extension,

      source:
        'digital-library-v2',
    },
  };

  const uploadTask =
    uploadBytesResumable(
      objectRef,
      file,
      metadata
    );

  const snapshot =
    await new Promise<UploadTaskSnapshot>(
      (resolve, reject) => {

        uploadTask.on(
          'state_changed',

          (state) => {
            if (
              options.onProgress &&
              state.totalBytes > 0
            ) {
              const progress =
                Math.round(
                  (
                    state.bytesTransferred /
                    state.totalBytes
                  ) * 100
                );

              options.onProgress(
                progress
              );
            }
          },

          reject,

          () =>
            resolve(
              uploadTask.snapshot
            )
        );
      }
    );

  const downloadUrl =
    await getDownloadURL(
      snapshot.ref
    );

  return {
    storagePath,
    downloadUrl,
    originalFileName:
      file.name,
    fileExtension:
      extension,
    mimeType:
      file.type ||
      'application/octet-stream',
    fileSizeBytes:
      file.size,
  };
};

export const deleteLibraryFile = async (
  storagePath?: string | null
): Promise<void> => {

  if (!storagePath?.trim()) {
    return;
  }

  if (
    !storagePath.startsWith(
      'library/'
    )
  ) {
    throw new Error(
      'تم رفض حذف ملف خارج مساحة المكتبة الرقمية.'
    );
  }

  await deleteObject(
    ref(storage, storagePath)
  );
};

export const getLibraryFileUrl = async (
  storagePath: string
): Promise<string> => {

  if (
    !storagePath?.startsWith(
      'library/'
    )
  ) {
    throw new Error(
      'مسار ملف المكتبة غير صالح.'
    );
  }

  return getDownloadURL(
    ref(storage, storagePath)
  );
};