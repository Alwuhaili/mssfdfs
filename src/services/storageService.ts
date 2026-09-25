import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type UploadMetadata,
} from 'firebase/storage';

import { storage } from '../lib/firebase';
import {
  buildLibraryStoragePath,
  getLibraryFileExtension,
  isCanonicalLibraryStoragePath,
  MAX_LIBRARY_FILE_SIZE,
  validateLibraryFile,
} from '../utils/libraryFileValidation';

export {
  buildLibraryStoragePath,
  getLibraryFileExtension,
  MAX_LIBRARY_FILE_SIZE,
  validateLibraryFile,
} from '../utils/libraryFileValidation';

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

const assertLibraryStorageReady = (): void => {
  try {
    void (storage as { app?: unknown }).app;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '');
    if (message.includes('LOCAL EMULATOR MODE fail-closed')) {
      throw new Error('تعذر رفع الملف: storage/unavailable');
    }
    throw error;
  }
};

export const uploadLibraryFile = async (
  file: File,
  options: LibraryStorageUploadOptions
): Promise<LibraryStorageUploadResult> => {
  validateLibraryFile(file);

  if (!options.uploaderId?.trim()) {
    throw new Error('تعذر التحقق من هوية رافع الملف.');
  }

  if (!options.resourceId?.trim()) {
    throw new Error('معرف المورد غير صالح.');
  }

  assertLibraryStorageReady();

  const storagePath = buildLibraryStoragePath(
    options.uploaderId,
    options.resourceId,
    file.name
  );

  const objectRef = ref(storage, storagePath);
  const extension = getLibraryFileExtension(file.name);

  const metadata: UploadMetadata = {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      uploaderId: options.uploaderId,
      resourceId: options.resourceId,
      originalFileName: file.name,
      fileExtension: extension,
      source: 'digital-library-v2',
    },
  };

  options.onProgress?.(0);

  // Single-object create. Resumable chunk PUTs are Storage `update`s, and
  // library objects are immutable (`allow update: if false`).
  const snapshot = await uploadBytes(objectRef, file, metadata);
  options.onProgress?.(100);

  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    storagePath,
    downloadUrl,
    originalFileName: file.name,
    fileExtension: extension,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
  };
};

export const deleteLibraryFile = async (
  storagePath?: string | null
): Promise<void> => {
  if (!storagePath?.trim()) {
    return;
  }

  if (!isCanonicalLibraryStoragePath(storagePath)) {
    throw new Error('تم رفض حذف ملف خارج مساحة المكتبة الرقمية.');
  }

  assertLibraryStorageReady();

  await deleteObject(ref(storage, storagePath));
};

export const getLibraryFileUrl = async (
  storagePath: string
): Promise<string> => {
  if (!storagePath.startsWith('library/')) {
    throw new Error('مسار ملف المكتبة غير صالح.');
  }

  assertLibraryStorageReady();

  return getDownloadURL(ref(storage, storagePath));
};
