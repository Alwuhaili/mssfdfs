import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

export interface SyncUser {
  id?: string;
  name?: string;
  role?: string;
}

export interface SyncResponse {
  success: boolean;
  notModified?: boolean;
  conflict?: boolean;
  version?: number;
  lastModified?: string;
  lastSyncedBy?: SyncUser;
  data?: any;
  message?: string;
  serverTime?: string;
}

type SyncEvent = {
  type: string;
  payload?: any;
  sourceVersion?: number;
  lastSyncedBy?: SyncUser;
  lastModified?: string;
};

type StorageMode = 'collection' | 'setting';
type StorageMap = Record<string, StorageMode>;

const LEGACY_DOC_PATH = 'database/main';
const MIGRATION_META_PATH = 'system/migration_collections_v1';
const STATE_META_PATH = 'system/state_collections_v1';
const SETTINGS_COLLECTION = 'appSettings';
const BROADCAST_CHANNEL_NAME = 'maysan_gifted_school_sync_channel_v2';

/**
 * Arrays whose items normally have a stable `id` are migrated to real Firestore
 * collections. If a legacy array does not have stable IDs, migration stores that
 * key as a single settings document instead so no data is altered or invented.
 */
const PREFERRED_COLLECTION_KEYS = new Set([
  'teachers',
  'students',
  'parents',
  'supervisors',
  'graduates',
  'exams',
  'submissions',
  'attendance',
  'announcements',
  'messages',
  'lectures',
  'financial',
  'notifications',
  'certificates',
  'calendarEvents',
  'challenges',
  'auditLogs',
  'annualPlans',
  'dailyLessonPlans',
  'examSchedules',
  'customFolders',
]);

const ADMIN_EXCLUSIVE_KEYS = new Set([
  'teachers',
  'students',
  'parents',
  'supervisors',
  'graduates',
  'certificates',
  'announcements',
  'timetable',
  'subjectQuotas',
  'financial',
  'schoolAdminData',
  'decisionSettings',
  'disciplinarySettings',
  'examSchedules',
]);

const clone = <T,>(value: T): T => {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const isPlainObject = (value: any): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const stableStringify = (value: any): string => {
  if (value === undefined) return '__undefined__';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

const deepEqual = (a: any, b: any) => stableStringify(a) === stableStringify(b);

const stripInternalFields = (value: any) => {
  if (!isPlainObject(value)) return value;
  const { __sync, ...rest } = value;
  return rest;
};

const safeDocId = (id: string): string => encodeURIComponent(id).replace(/%/g, '_');

const hasStableIds = (value: any): value is Array<Record<string, any> & { id: string }> =>
  Array.isArray(value) &&
  value.every((item) => isPlainObject(item) && typeof item.id === 'string' && item.id.trim().length > 0);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mergeValueThreeWay(base: any, local: any, server: any): any {
  if (deepEqual(local, base)) return clone(server);
  if (deepEqual(server, base)) return clone(local);

  if (isPlainObject(base) && isPlainObject(local) && isPlainObject(server)) {
    const result: Record<string, any> = clone(server);
    const keys = new Set([...Object.keys(base), ...Object.keys(local)]);
    for (const key of keys) {
      const baseValue = base[key];
      const localHasKey = Object.prototype.hasOwnProperty.call(local, key);
      if (localHasKey && !deepEqual(local[key], baseValue)) {
        result[key] = mergeValueThreeWay(baseValue, local[key], server?.[key]);
      } else if (!localHasKey && Object.prototype.hasOwnProperty.call(base, key)) {
        if (deepEqual(server?.[key], baseValue)) delete result[key];
      }
    }
    return result;
  }

  // Same scalar/non-mergeable value changed on both sides: Firestore wins.
  return clone(server);
}

class CentralSyncService {
  private listeners = new Set<(event: SyncEvent) => void>();
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeRealtime: Array<() => void> = [];
  private realtimeStarted = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentVersion = 0;
  private storageMap: StorageMap = {};
  private realtimeDataCache: Record<string, any> = {};
  private realtimeEmitTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedBy?: SyncUser;
  private lastModified?: string;
  private migrationPromise: Promise<SyncResponse> | null = null;
  private readonly clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn('[SyncService] BroadcastChannel unavailable:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners({ type: 'NETWORK_ONLINE' });
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.stopRealtimeStream();
        this.notifyListeners({ type: 'NETWORK_OFFLINE' });
      });
    }
  }

  public subscribe(callback: (event: SyncEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('[SyncService] listener error:', err);
      }
    });
  }

  private broadcastToTabs(type: string, payload?: any, sourceVersion?: number) {
    if (!this.broadcastChannel) return;
    try {
      this.broadcastChannel.postMessage({ type, payload, sourceVersion, timestamp: Date.now() });
    } catch (err) {
      console.warn('[SyncService] Broadcast failed:', err);
    }
  }

  private canWriteKey(key: string, sourceUser?: SyncUser): boolean {
    const isAdmin =
      sourceUser?.role === 'admin' ||
      sourceUser?.role === 'director' ||
      sourceUser?.id === 'admin-main';
    return isAdmin || !ADMIN_EXCLUSIVE_KEYS.has(key);
  }

  private async readMigrationMeta() {
    const snap = await getDoc(doc(db, MIGRATION_META_PATH));
    return snap.exists() ? snap.data() : undefined;
  }

  private async readStateMeta() {
    const snap = await getDoc(doc(db, STATE_META_PATH));
    if (!snap.exists()) return undefined;
    return snap.data();
  }

  private chooseStorageMode(key: string, value: any): StorageMode {
    if (PREFERRED_COLLECTION_KEYS.has(key) && hasStableIds(value)) return 'collection';
    return 'setting';
  }

  private isRetryableFirestoreError(err: any): boolean {
    const code = String(err?.code || '');
    const message = String(err?.message || '');
    return (
      code.includes('resource-exhausted') ||
      code.includes('unavailable') ||
      code.includes('aborted') ||
      code.includes('deadline-exceeded') ||
      message.includes('429') ||
      message.toLowerCase().includes('too many requests')
    );
  }

  private async withFirestoreRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        if (!this.isRetryableFirestoreError(err) || attempt === 5) throw err;
        const waitMs = Math.min(20000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
        console.warn(`[SyncService] ${label} throttled; retrying in ${waitMs}ms`, err?.code || err?.message);
        await delay(waitMs);
      }
    }
    throw lastError;
  }

  private async waitForMigrationCompleted(timeoutMs = 300000): Promise<any> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const meta = await this.readMigrationMeta();
      if (meta?.status === 'completed' && meta?.storageMap) {
        this.storageMap = clone(meta.storageMap);
        this.currentVersion = Number(meta.version || this.currentVersion || 0);
        return meta;
      }
      if (meta?.status === 'failed') {
        throw new Error(meta?.errorMessage || 'Collections migration failed.');
      }
      await delay(1200);
    }
    throw new Error('انتهت مهلة انتظار اكتمال ترحيل Firestore Collections.');
  }

  /**
   * One-time, resumable migration.
   * - Reads the legacy database/main document.
   * - Copies data to collections/settings.
   * - Never deletes or modifies database/main.
   * - While status=in_progress, new clients refuse normal writes.
   */
  private async runCollectionsMigration(seedData?: any, sourceUser?: SyncUser): Promise<SyncResponse> {
    if (!this.isOnline) return { success: false, message: 'الجهاز غير متصل بالإنترنت' };

    try {
      const existingMeta = await this.readMigrationMeta();
      if (existingMeta?.status === 'completed' && existingMeta?.storageMap) {
        this.storageMap = clone(existingMeta.storageMap);
        this.currentVersion = Number(existingMeta.version || 0);
        return {
          success: true,
          version: this.currentVersion,
          message: 'Collections migration already completed',
        };
      }

      const isAdmin =
        sourceUser?.role === 'admin' ||
        sourceUser?.role === 'director' ||
        sourceUser?.id === 'admin-main';

      // If another client is already migrating, never start a second migration.
      // Non-admin clients simply wait for the administrator to finish.
      const now = Date.now();
      const activeLease =
        existingMeta?.status === 'in_progress' &&
        Number(existingMeta?.leaseExpiresAt || 0) > now &&
        existingMeta?.leaseOwner &&
        existingMeta.leaseOwner !== this.clientId;

      if (activeLease) {
        try {
          const completed = await this.waitForMigrationCompleted();
          return {
            success: true,
            version: Number(completed?.version || 0),
            message: 'اكتمل الترحيل بواسطة جهاز آخر.',
          };
        } catch (err: any) {
          return { success: false, message: err?.message || 'تعذر انتظار اكتمال الترحيل.' };
        }
      }

      if (!isAdmin) {
        if (existingMeta?.status === 'in_progress') {
          try {
            const completed = await this.waitForMigrationCompleted();
            return { success: true, version: Number(completed?.version || 0) };
          } catch (err: any) {
            return { success: false, message: err?.message || 'الترحيل لم يكتمل بعد.' };
          }
        }
        return {
          success: false,
          message: 'يجب تنفيذ ترحيل قاعدة البيانات أول مرة من حساب الإدارة.',
        };
      }

      const legacySnap = await getDoc(doc(db, LEGACY_DOC_PATH));
      const legacyRecord = legacySnap.exists() ? legacySnap.data() : undefined;
      const legacyData = clone(legacyRecord?.data || seedData || {});

      if (!legacyData || Object.keys(legacyData).length === 0) {
        return { success: false, message: 'لا توجد بيانات قديمة أو بيانات تهيئة يمكن ترحيلها.' };
      }

      const storageMap: StorageMap = {};
      for (const [key, value] of Object.entries(legacyData)) {
        storageMap[key] = this.chooseStorageMode(key, value);
      }

      await this.withFirestoreRetry(
        () => setDoc(
          doc(db, MIGRATION_META_PATH),
          {
            status: 'in_progress',
            schemaVersion: 1,
            storageMap,
            legacyDocument: LEGACY_DOC_PATH,
            legacyVersion: Number(legacyRecord?.version || 0),
            startedAt: serverTimestamp(),
            startedBy: clone(sourceUser || {}),
            leaseOwner: this.clientId,
            leaseExpiresAt: Date.now() + 10 * 60 * 1000,
            note: 'Legacy database/main is intentionally preserved and not deleted.',
          },
          { merge: true }
        ),
        'migration-lock'
      );

      // Migrate entity collections in throttled batches to avoid another 429 burst.
      for (const [key, value] of Object.entries(legacyData)) {
        const mode = storageMap[key];
        if (mode === 'collection') {
          const items = value as any[];
          const CHUNK = 50;
          for (let start = 0; start < items.length; start += CHUNK) {
            const batch = writeBatch(db);
            const slice = items.slice(start, start + CHUNK);
            for (const item of slice) {
              const ref = doc(db, key, safeDocId(item.id));
              batch.set(
                ref,
                {
                  ...clone(item),
                  __sync: {
                    migratedFromLegacy: true,
                    migratedAt: new Date().toISOString(),
                  },
                },
                { merge: true }
              );
            }
            await this.withFirestoreRetry(() => batch.commit(), `migrate-${key}`);
            await this.withFirestoreRetry(
              () => setDoc(doc(db, MIGRATION_META_PATH), {
                status: 'in_progress',
                leaseOwner: this.clientId,
                leaseExpiresAt: Date.now() + 10 * 60 * 1000,
                progressKey: key,
                progressCount: Math.min(start + slice.length, items.length),
                progressTotal: items.length,
              }, { merge: true }),
              'migration-progress'
            );
            await delay(650);
          }
        } else {
          await this.withFirestoreRetry(
            () => setDoc(
              doc(db, SETTINGS_COLLECTION, key),
              {
                value: clone(value),
                __sync: {
                  migratedFromLegacy: true,
                  migratedAt: new Date().toISOString(),
                },
              },
              { merge: true }
            ),
            `migrate-setting-${key}`
          );
          await delay(250);
        }
      }

      const initialVersion = Math.max(1, Number(legacyRecord?.version || 0));
      await this.withFirestoreRetry(() => setDoc(
        doc(db, STATE_META_PATH),
        {
          version: initialVersion,
          schemaVersion: 1,
          lastModified: new Date().toISOString(),
          lastSyncedBy: clone(sourceUser || {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ), 'migration-state-meta');

      await this.withFirestoreRetry(() => setDoc(
        doc(db, MIGRATION_META_PATH),
        {
          status: 'completed',
          schemaVersion: 1,
          storageMap,
          version: initialVersion,
          legacyDocument: LEGACY_DOC_PATH,
          legacyVersion: Number(legacyRecord?.version || 0),
          completedAt: serverTimestamp(),
          completedBy: clone(sourceUser || {}),
          originalPreserved: true,
          leaseOwner: null,
          leaseExpiresAt: 0,
        },
        { merge: true }
      ), 'migration-complete');

      this.storageMap = storageMap;
      this.currentVersion = initialVersion;

      return {
        success: true,
        version: initialVersion,
        message: 'تم ترحيل البيانات إلى Collections مع الاحتفاظ بـ database/main دون حذف.',
      };
    } catch (err: any) {
      console.error('[SyncService] migration failed:', err);
      try {
        const meta = await this.readMigrationMeta();
        if (meta?.leaseOwner === this.clientId) {
          await setDoc(doc(db, MIGRATION_META_PATH), {
            status: 'failed',
            errorCode: err?.code || null,
            errorMessage: err?.message || 'فشل ترحيل قاعدة البيانات',
            failedAt: serverTimestamp(),
            leaseOwner: null,
            leaseExpiresAt: 0,
          }, { merge: true });
        }
      } catch {}
      return {
        success: false,
        message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل ترحيل قاعدة البيانات'}`,
      };
    }
  }

  public async ensureCollectionsMigration(seedData?: any, sourceUser?: SyncUser): Promise<SyncResponse> {
    if (this.migrationPromise) return this.migrationPromise;
    this.migrationPromise = this.runCollectionsMigration(seedData, sourceUser).finally(() => {
      this.migrationPromise = null;
    });
    return this.migrationPromise;
  }

  private async ensureStorageMapLoaded(): Promise<StorageMap> {
    if (Object.keys(this.storageMap).length > 0) return this.storageMap;
    let meta = await this.readMigrationMeta();
    if (meta?.status !== 'completed' || !meta?.storageMap) {
      meta = await this.waitForMigrationCompleted();
    }
    this.storageMap = clone(meta.storageMap);
    return this.storageMap;
  }

  private async readKey(key: string, mode: StorageMode): Promise<any> {
    if (mode === 'collection') {
      const snap = await getDocs(collection(db, key));
      return snap.docs.map((d) => stripInternalFields(d.data()));
    }
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, key));
    if (!snap.exists()) return undefined;
    return clone(snap.data()?.value);
  }

  public async fetchServerData(currentVersion?: number, force = false): Promise<SyncResponse> {
    if (!this.isOnline) return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };

    try {
      const map = await this.ensureStorageMapLoaded();
      const state = await this.readStateMeta();
      const version = Number(state?.version || 0);

      if (currentVersion !== undefined && !force && version <= currentVersion) {
        return { success: true, notModified: true, version };
      }

      const entries = await Promise.all(
        Object.entries(map).map(async ([key, mode]) => [key, await this.readKey(key, mode)] as const)
      );
      const data = Object.fromEntries(entries);

      this.currentVersion = Math.max(this.currentVersion, version);
      this.lastSyncedBy = state?.lastSyncedBy;
      this.lastModified = state?.lastModified;
      this.realtimeDataCache = clone(data);

      return {
        success: true,
        version,
        lastModified: state?.lastModified,
        lastSyncedBy: state?.lastSyncedBy,
        data,
        serverTime: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[SyncService] fetch failed:', err);
      return {
        success: false,
        message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل تحميل بيانات Firestore'}`,
      };
    }
  }

  private scheduleRealtimeEmit() {
    if (this.realtimeEmitTimer) clearTimeout(this.realtimeEmitTimer);
    this.realtimeEmitTimer = setTimeout(() => {
      this.realtimeEmitTimer = null;
      const version = Math.max(this.currentVersion, 1);
      this.notifyListeners({
        type: 'REALTIME_SERVER_UPDATE',
        payload: clone(this.realtimeDataCache),
        sourceVersion: version,
        lastSyncedBy: this.lastSyncedBy,
        lastModified: this.lastModified,
      });
    }, 80);
  }

  public async connectRealtimeStream() {
    if (typeof window === 'undefined' || !this.isOnline || this.realtimeStarted) return;

    try {
      const map = await this.ensureStorageMapLoaded();
      this.realtimeStarted = true;

      for (const [key, mode] of Object.entries(map)) {
        if (mode === 'collection') {
          const unsub = onSnapshot(
            collection(db, key),
            (snapshot) => {
              this.realtimeDataCache[key] = snapshot.docs.map((d) => stripInternalFields(d.data()));
              this.scheduleRealtimeEmit();
            },
            (err) => console.warn(`[SyncService] realtime ${key}:`, err)
          );
          this.unsubscribeRealtime.push(unsub);
        } else {
          const unsub = onSnapshot(
            doc(db, SETTINGS_COLLECTION, key),
            (snapshot) => {
              this.realtimeDataCache[key] = snapshot.exists() ? clone(snapshot.data()?.value) : undefined;
              this.scheduleRealtimeEmit();
            },
            (err) => console.warn(`[SyncService] realtime setting ${key}:`, err)
          );
          this.unsubscribeRealtime.push(unsub);
        }
      }

      const metaUnsub = onSnapshot(
        doc(db, STATE_META_PATH),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const state = snapshot.data();
          this.currentVersion = Number(state.version || this.currentVersion || 0);
          this.lastSyncedBy = state.lastSyncedBy;
          this.lastModified = state.lastModified;
          this.scheduleRealtimeEmit();
        },
        (err) => console.warn('[SyncService] realtime state meta:', err)
      );
      this.unsubscribeRealtime.push(metaUnsub);
    } catch (err) {
      this.realtimeStarted = false;
      console.warn('[SyncService] could not start realtime listeners:', err);
    }
  }

  public stopRealtimeStream() {
    this.unsubscribeRealtime.forEach((unsub) => {
      try { unsub(); } catch { /* ignore */ }
    });
    this.unsubscribeRealtime = [];
    this.realtimeStarted = false;
  }

  private async patchCollectionKey(
    key: string,
    localValue: any,
    baseValue: any,
    sourceUser?: SyncUser
  ) {
    const local = Array.isArray(localValue) ? localValue : [];
    const base = Array.isArray(baseValue) ? baseValue : [];

    if (!hasStableIds(local) || !hasStableIds(base)) {
      throw new Error(`المفتاح ${key} لا يحتوي معرف id ثابت لكل عنصر، لذلك لا يمكن مزامنته كـ Collection بأمان.`);
    }

    const baseMap = new Map(base.map((item) => [item.id, item]));
    const localMap = new Map(local.map((item) => [item.id, item]));
    const changedIds = new Set<string>();

    for (const [id, localItem] of localMap.entries()) {
      const baseItem = baseMap.get(id);
      if (baseItem === undefined || !deepEqual(localItem, baseItem)) changedIds.add(id);
    }
    for (const id of baseMap.keys()) {
      if (!localMap.has(id)) changedIds.add(id);
    }

    const ids = Array.from(changedIds);
    const CHUNK = 60;

    for (let start = 0; start < ids.length; start += CHUNK) {
      const chunk = ids.slice(start, start + CHUNK);
      await runTransaction(db, async (tx) => {
        const serverSnapshots = await Promise.all(
          chunk.map((id) => tx.get(doc(db, key, safeDocId(id))))
        );

        chunk.forEach((id, index) => {
          const ref = doc(db, key, safeDocId(id));
          const baseItem = baseMap.get(id);
          const localItem = localMap.get(id);
          const snap = serverSnapshots[index];
          const serverItem = snap.exists() ? stripInternalFields(snap.data()) : undefined;

          // Local deletion: only delete when server still equals our base snapshot.
          if (baseItem !== undefined && localItem === undefined) {
            if (serverItem !== undefined && deepEqual(serverItem, baseItem)) tx.delete(ref);
            return;
          }

          // New local item: never replace an existing server item on ID collision.
          if (baseItem === undefined && localItem !== undefined) {
            if (serverItem === undefined) {
              tx.set(ref, {
                ...clone(localItem),
                __sync: { updatedAt: new Date().toISOString(), updatedBy: clone(sourceUser || {}) },
              });
            }
            return;
          }

          if (baseItem !== undefined && localItem !== undefined) {
            // Another client deleted the item after our base: deletion wins.
            if (serverItem === undefined) return;
            const merged = mergeValueThreeWay(baseItem, localItem, serverItem);
            tx.set(ref, {
              ...clone(merged),
              __sync: { updatedAt: new Date().toISOString(), updatedBy: clone(sourceUser || {}) },
            });
          }
        });
      });
    }
  }

  private async patchSettingKey(
    key: string,
    localValue: any,
    baseValue: any,
    sourceUser?: SyncUser
  ) {
    const ref = doc(db, SETTINGS_COLLECTION, key);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const serverValue = snap.exists() ? clone(snap.data()?.value) : undefined;
      const merged = mergeValueThreeWay(baseValue, localValue, serverValue);
      tx.set(
        ref,
        {
          value: clone(merged),
          __sync: { updatedAt: new Date().toISOString(), updatedBy: clone(sourceUser || {}) },
        },
        { merge: true }
      );
    });
  }

  /**
   * Normal write path after migration.
   * Only changed entity documents are written. No client can replace the entire DB.
   */
  public async patchKeys(
    updates: Record<string, any>,
    baseValues: Record<string, any>,
    sourceUser?: SyncUser
  ): Promise<SyncResponse> {
    if (!this.isOnline) return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };

    try {
      const migration = await this.readMigrationMeta();
      if (migration?.status !== 'completed') {
        return { success: false, message: 'ترحيل Collections لم يكتمل؛ تم منع الكتابة لحماية البيانات.' };
      }
      const map = await this.ensureStorageMapLoaded();

      const blocked = Object.keys(updates || {}).filter((key) => !this.canWriteKey(key, sourceUser));
      if (blocked.length > 0) {
        return { success: false, message: `تم منع حفظ الحقول بسبب الصلاحيات: ${blocked.join(', ')}` };
      }

      for (const [key, localValue] of Object.entries(updates || {})) {
        const mode = map[key] || this.chooseStorageMode(key, localValue);
        if (!map[key]) {
          map[key] = mode;
          this.storageMap = map;
          await setDoc(doc(db, MIGRATION_META_PATH), { storageMap: map }, { merge: true });
        }

        if (mode === 'collection') {
          await this.patchCollectionKey(key, localValue, baseValues?.[key], sourceUser);
        } else {
          await this.patchSettingKey(key, localValue, baseValues?.[key], sourceUser);
        }
      }

      // No global document is written here. A global counter would itself become a
      // write hotspot. Concurrency safety lives in each entity transaction.
      this.currentVersion = Math.max(this.currentVersion + 1, Date.now());
      this.lastSyncedBy = clone(sourceUser || {});
      this.lastModified = new Date().toISOString();
      const version = this.currentVersion;

      this.broadcastToTabs('SERVER_DATA_UPDATED', undefined, version);
      return {
        success: true,
        version,
        lastModified: this.lastModified,
        lastSyncedBy: this.lastSyncedBy,
      };
    } catch (err: any) {
      console.error('[SyncService] patch failed:', err);
      return {
        success: false,
        message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل حفظ التغييرات في Firestore'}`,
      };
    }
  }

  public async pushUpdates(updates: any, sourceUser?: SyncUser, _clientVersion?: number): Promise<SyncResponse> {
    const current = await this.fetchServerData(undefined, true);
    if (!current.success) return current;
    return this.patchKeys(updates || {}, current.data || {}, sourceUser);
  }

  public async directObjectMutation(key: string, dataObj: any, sourceUser?: SyncUser): Promise<boolean> {
    const current = await this.fetchServerData(undefined, true);
    if (!current.success) return false;
    const res = await this.patchKeys({ [key]: dataObj }, { [key]: current.data?.[key] }, sourceUser);
    return res.success;
  }

  public async directArrayMutation(key: string, dataArray: any[], sourceUser?: SyncUser): Promise<boolean> {
    const current = await this.fetchServerData(undefined, true);
    if (!current.success) return false;
    const res = await this.patchKeys({ [key]: dataArray }, { [key]: current.data?.[key] }, sourceUser);
    return res.success;
  }

  public async getServerStatus() {
    try {
      const migration = await this.readMigrationMeta();
      const state = await this.readStateMeta();
      return {
        success: true,
        architecture: 'firestore-collections-v1',
        migrationStatus: migration?.status || 'not_started',
        originalLegacyPreserved: migration?.originalPreserved === true || migration?.status === 'in_progress',
        version: Number(state?.version || 0),
        lastModified: state?.lastModified,
        lastSyncedBy: state?.lastSyncedBy,
        storageMap: migration?.storageMap || {},
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر قراءة حالة الخادم' };
    }
  }

  /**
   * Explicit destructive reset of the NEW collections only. Legacy database/main
   * remains untouched. This is intentionally not used by startup or reconnect.
   */
  public async resetServerDatabase(seedData?: any): Promise<SyncResponse> {
    const current = await this.fetchServerData(undefined, true);
    if (!current.success) return current;
    return this.patchKeys(seedData || {}, current.data || {}, { id: 'admin-main', name: 'إدارة المدرسة', role: 'admin' });
  }

  /**
   * Kept for AppContext compatibility. After this rebuild, initialization means
   * ensuring the migration exists, not creating database/main.
   */
  public async initializeIfEmpty(seedData: any, sourceUser?: SyncUser): Promise<SyncResponse> {
    const migration = await this.ensureCollectionsMigration(seedData, sourceUser);
    if (!migration.success) return migration;
    return this.fetchServerData(undefined, true);
  }
}

export const centralSyncService = new CentralSyncService();
