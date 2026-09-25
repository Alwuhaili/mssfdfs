import { buildLibraryStoragePath, validateLibraryFile } from './libraryFileValidation';

export interface LibraryUploadBinaryResult {
  storagePath: string;
  downloadUrl: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface LibraryUploadTransactionInput<TResource> {
  file: File;
  ownerUid: string;
  resourceId: string;
  uploadFile: (
    file: File,
    options: { uploaderId: string; resourceId: string }
  ) => Promise<LibraryUploadBinaryResult>;
  persistAfterUpload: (uploaded: LibraryUploadBinaryResult) => Promise<TResource>;
  rollbackFile: (storagePath: string) => Promise<void>;
}

export async function executeLibraryUploadTransaction<TResource>(
  input: LibraryUploadTransactionInput<TResource>
): Promise<TResource> {
  validateLibraryFile(input.file);

  const ownerUid = input.ownerUid?.trim();
  const resourceId = input.resourceId?.trim();
  if (!ownerUid) {
    throw new Error('تعذر التحقق من هوية رافع الملف.');
  }
  if (!resourceId) {
    throw new Error('معرف المورد غير صالح.');
  }

  const expectedPath = buildLibraryStoragePath(ownerUid, resourceId, input.file.name);
  let uploadedPath: string | undefined;

  try {
    const uploaded = await input.uploadFile(input.file, {
      uploaderId: ownerUid,
      resourceId,
    });
    uploadedPath = uploaded.storagePath;

    if (uploaded.storagePath !== expectedPath) {
      throw new Error('مسار ملف المكتبة لا يطابق المسار القانوني.');
    }

    return await input.persistAfterUpload(uploaded);
  } catch (error) {
    if (uploadedPath) {
      try {
        await input.rollbackFile(uploadedPath);
      } catch (rollbackError) {
        console.error('Library Storage rollback failed:', rollbackError);
      }
    }
    throw error;
  }
}
