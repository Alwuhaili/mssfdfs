import { db, auth, authIsolationReady } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  buildRealtimeServerUpdatePayload,
  mergeRealtimeMessageBuckets as mergeMessageBuckets,
  restoreRealtimeMessagesAfterGenericFetch,
} from '../utils/messageSyncIsolation';
import { persistDirectMessageDocument } from './persistDirectMessage';

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
const MIGRATION_DOC_PATH = 'database/migration_collections_v1';
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
  'deletedLectureIds', // SECURITY_SYNC_ADMIN_SETTINGS_V1_3C3
  'deletedChallengeIds', // SECURITY_SYNC_ADMIN_SETTINGS_V1_3C4
  'notifications', // SECURITY_SYNC_ADMIN_NOTIFICATIONS_V1_3C5
  'auditLogs', // SECURITY_SYNC_ADMIN_AUDIT_LOGS_V1_3C6
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

// SECURITY_MESSAGING_IGNORE_MAILBOX_OVERLAY_V1_3D6B2
const stripMessageMailboxOverlay = (value: any) => {
  if (!isPlainObject(value)) return value;
  const { userStates, ...rest } = value;
  return rest;
};

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
  // SECURITY_MESSAGING_SCOPED_REALTIME_V1_3D4B
  private realtimeMessageBuckets: Record<string, any[]> = {};
  private realtimeEmitTimer: ReturnType<typeof setTimeout> | null = null;
  // SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
  private pendingRealtimeEmitIncludesMessages = false;
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
    const snap = await getDoc(doc(db, MIGRATION_DOC_PATH));
    return snap.exists() ? snap.data() : undefined;
  }

  private async writeMigrationMeta(patch: Record<string, any>) {
    const current = await this.readMigrationMeta();
    const merged = { ...(current || {}), ...clone(patch) };
    // Migration metadata lives in its own tiny sibling document.
    // Never append metadata to the very large legacy database/main document.
    await setDoc(doc(db, MIGRATION_DOC_PATH), merged, { merge: true });
    return merged;
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
   * - Stores migration state separately at database/migration_collections_v1.
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
        () => this.writeMigrationMeta({
          status: 'in_progress',
          schemaVersion: 1,
          storageMap,
          legacyDocument: LEGACY_DOC_PATH,
          legacyVersion: Number(legacyRecord?.version || 0),
          startedAt: new Date().toISOString(),
          startedBy: clone(sourceUser || {}),
          leaseOwner: this.clientId,
          leaseExpiresAt: Date.now() + 10 * 60 * 1000,
          note: 'Legacy database/main data is preserved unchanged. Migration metadata is stored separately in database/migration_collections_v1.',
        }),
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
              () => this.writeMigrationMeta({
                status: 'in_progress',
                leaseOwner: this.clientId,
                leaseExpiresAt: Date.now() + 10 * 60 * 1000,
                progressKey: key,
                progressCount: Math.min(start + slice.length, items.length),
                progressTotal: items.length,
              }),
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
      await this.withFirestoreRetry(() => this.writeMigrationMeta({
        status: 'completed',
        schemaVersion: 1,
        storageMap,
        version: initialVersion,
        legacyDocument: LEGACY_DOC_PATH,
        legacyVersion: Number(legacyRecord?.version || 0),
        completedAt: new Date().toISOString(),
        completedBy: clone(sourceUser || {}),
        originalPreserved: true,
        leaseOwner: null,
        leaseExpiresAt: 0,
      }), 'migration-complete');

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
          await this.writeMigrationMeta({
            status: 'failed',
            errorCode: err?.code || null,
            errorMessage: err?.message || 'فشل ترحيل قاعدة البيانات',
            failedAt: new Date().toISOString(),
            leaseOwner: null,
            leaseExpiresAt: 0,
          });
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

  // SECURITY_MESSAGING_SCOPED_FETCH_V1_3D4A
  private async readMessagesForCurrentUser(): Promise<any[]> {
    await authIsolationReady;
    const user = auth.currentUser;
    if (!user) return [];
    const token = await user.getIdTokenResult();
    const role = String(token.claims.role || '');
    if (['admin', 'director', 'school_manager'].includes(role)) {
      const snap = await getDocs(collection(db, 'messages'));
      return snap.docs.map((d) => stripInternalFields(d.data()));
    }
    const uid = user.uid;
    // SECURITY_MESSAGING_GROUP_QUERY_V1_3D5A
    const senderQuery = query(collection(db, 'messages'), where('senderAuthUid', '==', uid));
    const receiverQuery = query(collection(db, 'messages'), where('receiverAuthUid', '==', uid));
    const recipientQuery = query(collection(db, 'messages'), where('recipientAuthUids', 'array-contains', uid));
    const [senderSnap, receiverSnap, recipientSnap] = await Promise.all([
      getDocs(senderQuery),
      getDocs(receiverQuery),
      getDocs(recipientQuery),
    ]);
    const merged = new Map<string, any>();
    for (const snap of [senderSnap, receiverSnap, recipientSnap]) {
      for (const d of snap.docs) {
        const item = stripInternalFields(d.data());
        const id = typeof item?.id === 'string' && item.id ? item.id : d.id;
        merged.set(id, item);
      }
    }
    return [...merged.values()];
  }
  private async readKey(key: string, mode: StorageMode): Promise<any> {
    if (key === 'messages' && mode === 'collection') return this.readMessagesForCurrentUser();
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
      const migration = await this.readMigrationMeta();
      const version = Number(migration?.version || migration?.legacyVersion || 1);

      if (currentVersion !== undefined && !force && version <= currentVersion) {
        return { success: true, notModified: true, version };
      }

      const entries = await Promise.all(
        Object.entries(map).map(async ([key, mode]) => {
          try {
            return [key, await this.readKey(key, mode)] as const;
          } catch (err: any) {
            // Security rules intentionally deny collections outside the active user's scope.
            // A denied collection must not prevent permitted collections from loading.
            const code = String(err?.code || '');
            if (code.includes('permission-denied')) return null;
            throw err;
          }
        })
      );
      const data = Object.fromEntries(entries.filter((entry): entry is readonly [string, any] => entry !== null));

      this.currentVersion = Math.max(this.currentVersion, version);
      this.lastSyncedBy = migration?.completedBy || migration?.startedBy;
      this.lastModified = migration?.completedAt || migration?.startedAt;
      // SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
      const restored = restoreRealtimeMessagesAfterGenericFetch(clone(data), this.realtimeMessageBuckets);
      this.realtimeDataCache = restored;

      return {
        success: true,
        version,
        lastModified: migration?.completedAt || migration?.startedAt,
        lastSyncedBy: migration?.completedBy || migration?.startedBy,
        data: restored,
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

  private scheduleRealtimeEmit(includeMessages = false) {
    if (includeMessages) this.pendingRealtimeEmitIncludesMessages = true;
    if (this.realtimeEmitTimer) clearTimeout(this.realtimeEmitTimer);
    this.realtimeEmitTimer = setTimeout(() => {
      this.realtimeEmitTimer = null;
      const version = Math.max(this.currentVersion, 1);
      const emitIncludesMessages = this.pendingRealtimeEmitIncludesMessages;
      this.pendingRealtimeEmitIncludesMessages = false;
      this.notifyListeners({
        type: 'REALTIME_SERVER_UPDATE',
        payload: buildRealtimeServerUpdatePayload(this.realtimeDataCache, emitIncludesMessages),
        sourceVersion: version,
        lastSyncedBy: this.lastSyncedBy,
        lastModified: this.lastModified,
      });
    }, 80);
  }

  private mergeRealtimeMessageBuckets() {
    this.realtimeDataCache.messages = mergeMessageBuckets(this.realtimeMessageBuckets);
  }

  public isRealtimeStreamActive(): boolean {
    return this.realtimeStarted;
  }
  public async connectRealtimeStream() {
    if (typeof window === 'undefined' || !this.isOnline || this.realtimeStarted) return;

    try {
      const map = await this.ensureStorageMapLoaded();
      await authIsolationReady;
      const user = auth.currentUser;
      const token = user ? await user.getIdTokenResult() : null;
      const role = String(token?.claims?.role || '');
      const isAdminUser = Boolean(user) && ['admin', 'director', 'school_manager'].includes(role);
      this.realtimeStarted = true;

      // SECURITY_MESSAGING_USER_STATE_REALTIME_V1_3D6F2A
      if (user) {
        const userStateUnsub = onSnapshot(
          collection(db, 'messageUserStates', user.uid, 'items'),
          (snapshot) => {
            const states: Record<string, any> = {};
            snapshot.docs.forEach((stateDoc) => {
              const data = stripInternalFields(stateDoc.data());
              const messageId = typeof data?.messageId === 'string' && data.messageId ? data.messageId : stateDoc.id;
              states[messageId] = data;
            });
            this.notifyListeners({ type: 'MESSAGE_USER_STATES_UPDATE', payload: states });
          },
          (err) => console.warn('[SyncService] realtime message user states:', err)
        );
        this.unsubscribeRealtime.push(userStateUnsub);
      }

      // SECURITY_REALTIME_SCOPE_GUARD_V1_3D6F2B1
      const nonAdminUnsafeRealtimeKeys = new Set([
        'teachers', 'students', 'parents', 'supervisors', 'graduates',
        'attendance', 'submissions', 'financial', 'notifications', 'certificates',
        'annualPlans', 'dailyLessonPlans', 'customFolders', 'auditLogs',
        'deletedLectureIds', 'deletedChallengeIds',
      ]);

      for (const [key, mode] of Object.entries(map)) {
        if (!isAdminUser && nonAdminUnsafeRealtimeKeys.has(key)) continue;
        if (key === 'messages' && mode === 'collection') {
          this.realtimeMessageBuckets = {};
          if (!user) {
            this.realtimeDataCache.messages = [];
            continue;
          }

          if (isAdminUser) {
            const unsub = onSnapshot(
              collection(db, 'messages'),
              (snapshot) => {
                this.realtimeMessageBuckets.all = snapshot.docs.map((d) => stripInternalFields(d.data()));
                this.mergeRealtimeMessageBuckets();
                this.scheduleRealtimeEmit(true);
              },
              (err) => console.warn('[SyncService] realtime messages admin:', err)
            );
            this.unsubscribeRealtime.push(unsub);
            continue;
          }

          const uid = user.uid;
          const messageQueries = [
            ['sender', query(collection(db, 'messages'), where('senderAuthUid', '==', uid))],
            ['receiver', query(collection(db, 'messages'), where('receiverAuthUid', '==', uid))],
            ['recipient', query(collection(db, 'messages'), where('recipientAuthUids', 'array-contains', uid))],
          ] as const;

          for (const [bucketName, messageQuery] of messageQueries) {
            const unsub = onSnapshot(
              messageQuery,
              (snapshot) => {
                this.realtimeMessageBuckets[bucketName] = snapshot.docs.map((d) => stripInternalFields(d.data()));
                this.mergeRealtimeMessageBuckets();
                this.scheduleRealtimeEmit(true);
              },
              (err) => console.warn('[SyncService] realtime messages user query:', err)
            );
            this.unsubscribeRealtime.push(unsub);
          }
          continue;
        }

        if (mode === 'collection') {
          const unsub = onSnapshot(
            collection(db, key),
            (snapshot) => {
              this.realtimeDataCache[key] = snapshot.docs.map((d) => stripInternalFields(d.data()));
              this.scheduleRealtimeEmit();
            },
            (err) => console.warn('[SyncService] realtime collection:', err)
          );
          this.unsubscribeRealtime.push(unsub);
        } else {
          const unsub = onSnapshot(
            doc(db, SETTINGS_COLLECTION, key),
            (snapshot) => {
              this.realtimeDataCache[key] = snapshot.exists() ? clone(snapshot.data()?.value) : undefined;
              this.scheduleRealtimeEmit();
            },
            (err) => console.warn('[SyncService] realtime setting:', err)
          );
          this.unsubscribeRealtime.push(unsub);
        }
      }

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
    this.realtimeMessageBuckets = {};
    this.pendingRealtimeEmitIncludesMessages = false;
    if (this.realtimeEmitTimer) {
      clearTimeout(this.realtimeEmitTimer);
      this.realtimeEmitTimer = null;
    }
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
      if (baseItem === undefined || !deepEqual(key === 'messages' ? stripMessageMailboxOverlay(localItem) : localItem, key === 'messages' ? stripMessageMailboxOverlay(baseItem) : baseItem)) changedIds.add(id);
    }
    for (const id of baseMap.keys()) {
      if (!localMap.has(id)) changedIds.add(id);
    }

    // SECURITY_MESSAGING_NEW_MESSAGE_CREATE_V1_3C
    let ids = Array.from(changedIds);

    if (key === 'messages') {
      const newMessageIds = ids.filter((id) => !baseMap.has(id) && localMap.has(id));
      for (const id of newMessageIds) {
        const localItem = localMap.get(id);
        if (!localItem?.senderAuthUid) throw new Error('SECURITY: new message missing senderAuthUid');
        await setDoc(doc(db, key, safeDocId(id)), {
          ...clone(stripMessageMailboxOverlay(localItem)),
          __sync: { updatedAt: new Date().toISOString(), updatedBy: clone(sourceUser || {}) },
        });
      }
      ids = ids.filter((id) => !newMessageIds.includes(id));
    }

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
            const merged = key === 'messages' ? mergeValueThreeWay(stripMessageMailboxOverlay(baseItem), stripMessageMailboxOverlay(localItem), serverItem) : mergeValueThreeWay(baseItem, localItem, serverItem);
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
      const permittedUpdates = Object.fromEntries(
        Object.entries(updates || {}).filter(([key]) => !blocked.includes(key))
      );
      if (Object.keys(permittedUpdates).length === 0 && blocked.length > 0) {
        return { success: false, message: `لا توجد تغييرات مخولة للحفظ. تم منع: ${blocked.join(', ')}` };
      }

      for (const [key, localValue] of Object.entries(permittedUpdates)) {
        const mode = map[key] || this.chooseStorageMode(key, localValue);
        if (!map[key]) {
          map[key] = mode;
          this.storageMap = map;
          await this.writeMigrationMeta({ storageMap: map });
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


  /**
   * Commit exactly one entity document using Firestore transaction semantics.
   * This is used for latency-sensitive records (for example student edits) so
   * the UI does not depend on the generic debounced auto-sync loop.
   */
  public async upsertCollectionDocument(
    key: string,
    id: string,
    localItem: any,
    baseItem: any,
    sourceUser?: SyncUser
  ): Promise<SyncResponse> {
    if (!this.isOnline) return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };

    try {
      const migration = await this.readMigrationMeta();
      if (migration?.status !== 'completed') {
        return { success: false, message: 'ترحيل Collections لم يكتمل؛ تم منع الكتابة لحماية البيانات.' };
      }

      const map = await this.ensureStorageMapLoaded();
      const mode = map[key] || this.chooseStorageMode(key, [localItem]);
      if (mode !== 'collection') {
        return { success: false, message: `المفتاح ${key} ليس Collection في مخطط Firestore الحالي.` };
      }
      if (!this.canWriteKey(key, sourceUser)) {
        return { success: false, message: `تم منع حفظ ${key} بسبب الصلاحيات.` };
      }
      if (!id || !localItem) {
        return { success: false, message: 'معرف السجل أو بياناته غير صالحة.' };
      }

      const ref = doc(db, key, safeDocId(id));
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const serverItem = snap.exists() ? stripInternalFields(snap.data()) : undefined;

        let merged: any;
        if (serverItem === undefined) {
          merged = clone(localItem);
        } else if (baseItem === undefined) {
          // Unknown/stale client must not replace an existing record wholesale.
          merged = { ...clone(serverItem), ...clone(localItem) };
        } else {
          merged = mergeValueThreeWay(baseItem, localItem, serverItem);
        }

        tx.set(ref, {
          ...clone(merged),
          id,
          __sync: {
            updatedAt: new Date().toISOString(),
            updatedBy: clone(sourceUser || {}),
          },
        });
      });

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
      console.error(`[SyncService] direct ${key}/${id} update failed:`, err);
      return {
        success: false,
        message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل حفظ السجل في Firestore'}`,
      };
    }
  }

  // SECURITY_MESSAGING_USER_STATE_SERVICE_V1_3D6B
  public async readCurrentUserMessageStates(): Promise<Record<string, any>> {
    await authIsolationReady;
    const user = auth.currentUser;
    if (!user) return {};

    const snap = await getDocs(collection(db, 'messageUserStates', user.uid, 'items'));
    const states: Record<string, any> = {};
    snap.docs.forEach((stateDoc) => {
      const data = stripInternalFields(stateDoc.data());
      const messageId = typeof data?.messageId === 'string' && data.messageId ? data.messageId : stateDoc.id;
      states[messageId] = data;
    });
    return states;
  }

  // SECURITY_MESSAGING_PENDING_RECONCILE_V1_3D6F2C_STAGE0_1
  // Single-document re-read for bounded mailbox reconciliation only.
  // Must not use fetchServerData or scan the school database.
  public async readCurrentUserMessageState(messageId: string): Promise<any | null> {
    await authIsolationReady;
    const user = auth.currentUser;
    if (!user || !messageId) return null;

    const snap = await getDoc(doc(db, 'messageUserStates', user.uid, 'items', safeDocId(messageId)));
    if (!snap.exists()) return null;
    const data = stripInternalFields(snap.data());
    return data || null;
  }

  // SECURITY_MESSAGING_DIRECT_PERSIST_V1_3D6F2C_STAGE0_6
  public async persistDirectMessage(message: any, sourceUser?: SyncUser): Promise<SyncResponse> {
    await authIsolationReady;
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'SECURITY: authenticated sender required' };
    if (typeof message?.senderAuthUid !== 'string' || message.senderAuthUid !== user.uid) {
      return { success: false, message: 'SECURITY: senderAuthUid must match the signed-in Auth UID' };
    }
    const result = await persistDirectMessageDocument(db, message, sourceUser);
    return result.success
      ? { success: true, message: result.id }
      : { success: false, message: result.message };
  }

  public async upsertCurrentUserMessageState(messageId: string, patch: Record<string, any>): Promise<boolean> {
    await authIsolationReady;
    const user = auth.currentUser;
    if (!user || !messageId) return false;

    const allowedKeys = new Set(['folder', 'isRead', 'isStarred', 'isTrash', 'isSpam', 'isArchived', 'isDeleted', 'customFolderId']);
    const safePatch: Record<string, any> = {};
    for (const [key, value] of Object.entries(patch || {})) {
      if (allowedKeys.has(key) && value !== undefined) safePatch[key] = clone(value);
    }
    if (Object.keys(safePatch).length === 0) return false;

    try {
      await setDoc(doc(db, 'messageUserStates', user.uid, 'items', safeDocId(messageId)), {
        messageId,
        ownerAuthUid: user.uid,
        ...safePatch,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('[SyncService] message user state update failed:', err);
      return false;
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
      return {
        success: true,
        architecture: 'firestore-collections-v2-legacy-meta',
        migrationStatus: migration?.status || 'not_started',
        originalLegacyPreserved: true,
        version: Number(migration?.version || migration?.legacyVersion || 0),
        lastModified: migration?.completedAt || migration?.startedAt,
        lastSyncedBy: migration?.completedBy || migration?.startedBy,
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
