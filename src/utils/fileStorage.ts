/**
 * IndexedDB Persistent Storage for Digital Library Files & PDF Documents
 * Provides reliable storage for large files (PDFs, Docs, Images) without hitting localStorage 5MB quota limits.
 */

const DB_NAME = 'maysan_digital_library_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// In-memory fallback cache in case IndexedDB is restricted in some sandboxes
const memoryCache = new Map<string, { dataUrl: string; blob?: Blob; name?: string; type?: string }>();

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result as IDBDatabase);
      };

      request.onerror = (err) => {
        console.warn('IndexedDB open error, falling back to memory cache:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB exception, falling back to memory cache:', e);
      resolve(null);
    }
  });
}

/**
 * Saves a file (DataURL or Blob) into IndexedDB
 */
export async function saveStoredFile(
  id: string,
  fileData: string | Blob | File,
  meta?: { name?: string; type?: string; size?: number }
): Promise<void> {
  if (!id) return;

  let dataUrl = typeof fileData === 'string' ? fileData : '';
  let blob: Blob | undefined = fileData instanceof Blob ? fileData : undefined;

  // If blob only, create DataURL or object URL
  if (blob && !dataUrl) {
    try {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob!);
      });
    } catch {
      dataUrl = '';
    }
  }

  // Always update memory cache
  memoryCache.set(id, {
    dataUrl,
    blob,
    name: meta?.name,
    type: meta?.type || (blob?.type || 'application/pdf'),
  });

  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        id,
        dataUrl,
        name: meta?.name || 'document.pdf',
        type: meta?.type || 'application/pdf',
        size: meta?.size || (dataUrl ? dataUrl.length : 0),
        savedAt: new Date().toISOString(),
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = (e) => {
        console.warn('Failed to save file to IndexedDB:', e);
        resolve();
      };
    } catch (e) {
      console.warn('Transaction error saving to IndexedDB:', e);
      resolve();
    }
  });
}

/**
 * Retrieves a file from IndexedDB or memory cache
 */
export async function getStoredFile(
  id: string
): Promise<{ dataUrl: string; blob?: Blob; name?: string; type?: string } | null> {
  if (!id) return null;

  // Check memory cache first
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }

  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = (event: any) => {
        const result = event.target.result;
        if (result && result.dataUrl) {
          const item = {
            dataUrl: result.dataUrl,
            name: result.name,
            type: result.type,
          };
          memoryCache.set(id, item);
          resolve(item);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Deletes a file from IndexedDB and memory cache
 */
export async function deleteStoredFile(id: string): Promise<void> {
  if (!id) return;
  memoryCache.delete(id);

  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Direct file download from DataURL or Blob with proper MIME type and fallback
 */
export async function downloadDataUrlOrBlob(
  dataUrlOrBlob: string | Blob,
  fileName: string
): Promise<boolean> {
  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  try {
    let url: string;
    let isCreatedUrl = false;

    if (dataUrlOrBlob instanceof Blob) {
      url = URL.createObjectURL(dataUrlOrBlob);
      isCreatedUrl = true;
    } else if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
      // For large base64 data URLs, convert to Blob first for reliable cross-browser download
      try {
        const parts = dataUrlOrBlob.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        url = URL.createObjectURL(blob);
        isCreatedUrl = true;
      } catch {
        url = dataUrlOrBlob;
      }
    } else if (typeof dataUrlOrBlob === 'string' && (dataUrlOrBlob.startsWith('blob:') || dataUrlOrBlob.startsWith('http'))) {
      url = dataUrlOrBlob;
    } else {
      return false;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName;
    link.target = '_self';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (isCreatedUrl) {
        URL.revokeObjectURL(url);
      }
    }, 15000);

    return true;
  } catch (err) {
    console.error('Error downloading file:', err);
    return false;
  }
}
