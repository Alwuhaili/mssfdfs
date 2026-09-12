import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export interface SyncStatus {
  success: boolean;
  version?: number;
  lastModified?: string;
  lastSyncedBy?: SyncUser;
  serverLatencyMs?: number;
  errorMessage?: string;
}

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

const BROADCAST_CHANNEL_NAME = 'maysan_gifted_school_sync_channel';
const FIREBASE_DOC_PATH = 'database/main';

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

/**
 * Three-way object merge:
 * - base   = value last known by this client
 * - local  = value after the user's local edit
 * - server = newest authoritative Firestore value
 *
 * Only fields actually changed by the local client are applied to the newest
 * server object. Unrelated changes made by other clients are preserved.
 */
const mergeObjectThreeWay = (base: any, local: any, server: any): any => {
  if (deepEqual(local, base)) return clone(server);
  if (deepEqual(server, base)) return clone(local);

  if (!isPlainObject(base) || !isPlainObject(local) || !isPlainObject(server)) {
    // Both sides changed the same scalar/non-mergeable value. Firestore remains
    // authoritative to prevent a stale client from overwriting a newer value.
    return clone(server);
  }

  const result: Record<string, any> = clone(server);
  const keys = new Set([...Object.keys(base), ...Object.keys(local)]);

  for (const key of keys) {
    const baseValue = base[key];
    const localHasKey = Object.prototype.hasOwnProperty.call(local, key);
    const localValue = local[key];

    if (localHasKey && !deepEqual(localValue, baseValue)) {
      const serverValue = server[key];
      result[key] = mergeValueThreeWay(baseValue, localValue, serverValue);
    } else if (!localHasKey && Object.prototype.hasOwnProperty.call(base, key)) {
      // Local explicitly removed this key. Delete only if nobody changed it on server.
      if (deepEqual(server[key], baseValue)) delete result[key];
    }
  }

  return result;
};

const arrayHasStableIds = (value: any[]): boolean =>
  value.every((item) => isPlainObject(item) && typeof item.id === 'string' && item.id.length > 0);

/**
 * Three-way array merge by entity id. This is what prevents an old browser from
 * replacing a newer students/teachers/etc. array. We compute only the entities
 * that changed locally relative to the client's last Firestore snapshot and
 * apply those changes to the newest server array inside a transaction.
 */
const mergeArrayThreeWay = (base: any[], local: any[], server: any[]): any[] => {
  if (deepEqual(local, base)) return clone(server);
  if (deepEqual(server, base)) return clone(local);

  if (!arrayHasStableIds(base) || !arrayHasStableIds(local) || !arrayHasStableIds(server)) {
    // For primitive arrays (e.g. deleted IDs), do not let stale data overwrite
    // a newer server value. Only replace when server still equals base.
    return clone(server);
  }

  const baseMap = new Map(base.map((item) => [item.id, item]));
  const localMap = new Map(local.map((item) => [item.id, item]));
  const serverMap = new Map(server.map((item) => [item.id, clone(item)]));

  // Explicit local deletions.
  for (const [id, baseItem] of baseMap.entries()) {
    if (!localMap.has(id)) {
      const serverItem = serverMap.get(id);
      // Do not delete an entity that another client modified after our base snapshot.
      if (serverItem !== undefined && deepEqual(serverItem, baseItem)) {
        serverMap.delete(id);
      }
    }
  }

  // Local additions and edits.
  for (const [id, localItem] of localMap.entries()) {
    const baseItem = baseMap.get(id);
    if (baseItem !== undefined && deepEqual(localItem, baseItem)) continue;

    const serverItem = serverMap.get(id);
    if (baseItem === undefined) {
      // New local entity. IDs are generated uniquely; preserve server on an unlikely collision.
      if (serverItem === undefined) serverMap.set(id, clone(localItem));
      continue;
    }

    if (serverItem === undefined) {
      // Another client deleted it after our base snapshot; server wins.
      continue;
    }

    serverMap.set(id, mergeObjectThreeWay(baseItem, localItem, serverItem));
  }

  // Preserve server ordering, then append genuinely new local entities.
  const result: any[] = [];
  const emitted = new Set<string>();
  for (const item of server) {
    const merged = serverMap.get(item.id);
    if (merged !== undefined) {
      result.push(merged);
      emitted.add(item.id);
    }
  }
  for (const item of local) {
    if (!emitted.has(item.id) && serverMap.has(item.id)) {
      result.push(serverMap.get(item.id));
      emitted.add(item.id);
    }
  }

  return result;
};

function mergeValueThreeWay(base: any, local: any, server: any): any {
  if (deepEqual(local, base)) return clone(server);
  if (deepEqual(server, base)) return clone(local);

  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(server)) {
    return mergeArrayThreeWay(base, local, server);
  }

  if (isPlainObject(base) && isPlainObject(local) && isPlainObject(server)) {
    return mergeObjectThreeWay(base, local, server);
  }

  // Same scalar was changed concurrently: newest Firestore value wins.
  return clone(server);
}

class CentralSyncService {
  private isQuotaExceeded = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<(event: SyncEvent) => void>();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private unsubscribeFirestore: (() => void) | null = null;
  private currentVersion = 0;

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
        this.connectRealtimeStream();
        this.notifyListeners({ type: 'NETWORK_ONLINE' });
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
        this.notifyListeners({ type: 'NETWORK_OFFLINE' });
      });

      this.connectRealtimeStream();
    }
  }

  public connectRealtimeStream() {
    if (typeof window === 'undefined' || !this.isOnline) return;

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    const docRef = doc(db, FIREBASE_DOC_PATH);
    this.unsubscribeFirestore = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const record = snapshot.data();
        const version = Number(record?.version || 0);

        // Versions are strictly monotonic because all writes use runTransaction().
        if (version > this.currentVersion) {
          this.currentVersion = version;
          this.notifyListeners({
            type: 'REALTIME_SERVER_UPDATE',
            payload: clone(record.data || {}),
            sourceVersion: version,
            lastSyncedBy: record.lastSyncedBy,
            lastModified: record.lastModified,
          });
          this.broadcastToTabs('SERVER_DATA_UPDATED', undefined, version);
        }
      },
      (err: any) => {
        this.handleFirestoreError(err, 'Realtime listener');
      }
    );
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
        console.error('[SyncService] Listener error:', err);
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

  private handleFirestoreError(err: any, context: string) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota') ||
      err?.message?.includes('resource-exhausted')
    ) {
      this.isQuotaExceeded = true;
    }
    console.warn(`[SyncService] ${context}:`, err);
  }

  private canWriteKey(key: string, sourceUser?: SyncUser): boolean {
    const isAdmin = sourceUser?.role === 'admin' || sourceUser?.id === 'admin-main';
    return isAdmin || !ADMIN_EXCLUSIVE_KEYS.has(key);
  }

  public async fetchServerData(currentVersion?: number, force = false): Promise<SyncResponse> {
    if (this.isQuotaExceeded) {
      return { success: false, message: 'تجاوزت قاعدة البيانات الحصة المتاحة حالياً' };
    }
    if (!this.isOnline) {
      return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
    }

    try {
      const snapshot = await getDoc(doc(db, FIREBASE_DOC_PATH));
      if (!snapshot.exists()) {
        return { success: true, data: {}, version: 0 };
      }

      const record = snapshot.data();
      const version = Number(record.version || 0);
      if (currentVersion !== undefined && !force && version <= currentVersion) {
        return { success: true, notModified: true, version };
      }

      this.currentVersion = Math.max(this.currentVersion, version);
      return {
        success: true,
        version,
        lastModified: record.lastModified,
        lastSyncedBy: record.lastSyncedBy,
        data: clone(record.data || {}),
        serverTime: new Date().toISOString(),
      };
    } catch (err: any) {
      this.handleFirestoreError(err, 'Fetch data');
      return { success: false, message: err?.message || 'فشل الاتصال بقاعدة Firebase' };
    }
  }

  /**
   * The only normal write path.
   * `updates` contains only top-level keys changed in React state.
   * `baseValues` contains the values from the last Firestore snapshot seen by this client.
   * A Firestore transaction merges the local delta into the newest server document.
   */
  public async patchKeys(
    updates: Record<string, any>,
    baseValues: Record<string, any>,
    sourceUser?: SyncUser
  ): Promise<SyncResponse> {
    if (this.isQuotaExceeded) return { success: false, message: 'تجاوزت قاعدة البيانات الحصة المتاحة حالياً' };
    if (!this.isOnline) return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };

    const allowedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates || {})) {
      if (value === undefined || !this.canWriteKey(key, sourceUser)) continue;
      allowedUpdates[key] = clone(value);
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return { success: true, notModified: true, version: this.currentVersion };
    }

    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const result = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(docRef);
        if (!snapshot.exists()) {
          throw new Error('قاعدة Firestore المركزية غير مهيأة. تم منع الكتابة التلقائية لحماية البيانات.');
        }

        const record = snapshot.data();
        const serverData = clone(record.data || {});
        const mergedData = clone(serverData);

        for (const [key, localValue] of Object.entries(allowedUpdates)) {
          const baseValue = clone(baseValues?.[key]);
          const serverValue = clone(serverData?.[key]);
          mergedData[key] = mergeValueThreeWay(baseValue, localValue, serverValue);
        }

        const newVersion = Number(record.version || 0) + 1;
        const lastModified = new Date().toISOString();
        const lastSyncedBy = clone(sourceUser || { id: 'unknown', name: 'Unknown', role: 'user' });

        transaction.set(docRef, {
          ...record,
          version: newVersion,
          lastModified,
          lastSyncedBy,
          data: mergedData,
          _timestamp: serverTimestamp(),
        });

        return { newVersion, lastModified, lastSyncedBy, mergedData };
      });

      this.currentVersion = Math.max(this.currentVersion, result.newVersion);
      this.broadcastToTabs('SERVER_DATA_UPDATED', undefined, result.newVersion);

      return {
        success: true,
        version: result.newVersion,
        lastModified: result.lastModified,
        lastSyncedBy: result.lastSyncedBy,
        data: clone(result.mergedData),
      };
    } catch (err: any) {
      this.handleFirestoreError(err, 'Patch keys');
      return { success: false, message: err?.message || 'فشل حفظ التغييرات في Firebase' };
    }
  }

  /**
   * Backwards-compatible alias. New AppContext should call patchKeys().
   * This method still performs a transaction and never blindly replaces database/main.
   */
  public async pushUpdates(
    updates: any,
    sourceUser?: SyncUser,
    _clientVersion?: number
  ): Promise<SyncResponse> {
    const current = await this.fetchServerData(undefined, true);
    if (!current.success) return current;
    return this.patchKeys(updates || {}, current.data || {}, sourceUser);
  }

  /**
   * Compatibility methods for older components. They are transaction-safe, but the
   * corrected AppContext no longer calls them; all writes flow through patchKeys().
   */
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

  public async getServerStatus(): Promise<any> {
    const startTime = Date.now();
    const result = await this.fetchServerData(undefined, true);
    const latencyMs = Date.now() - startTime;
    if (!result.success) return { success: false, latencyMs, message: result.message };

    const counts: Record<string, number> = {};
    Object.entries(result.data || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) counts[key] = value.length;
    });

    return {
      success: true,
      version: result.version,
      lastModified: result.lastModified,
      lastSyncedBy: result.lastSyncedBy,
      totalKeys: Object.keys(result.data || {}).length,
      counts,
      latencyMs,
    };
  }

  /**
   * Destructive operation. It is intentionally explicit and transaction-versioned.
   * Never call this automatically during startup or reconnect.
   */
  public async resetServerDatabase(seedData?: any): Promise<SyncResponse> {
    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const result = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(docRef);
        const oldVersion = snapshot.exists() ? Number(snapshot.data()?.version || 0) : 0;
        const newVersion = oldVersion + 1;
        const lastModified = new Date().toISOString();
        const lastSyncedBy = { id: 'admin-main', name: 'System Admin', role: 'admin' };
        const data = clone(seedData || {});

        transaction.set(docRef, {
          version: newVersion,
          lastModified,
          lastSyncedBy,
          data,
          _timestamp: serverTimestamp(),
        });

        return { newVersion, lastModified, lastSyncedBy, data };
      });

      this.currentVersion = result.newVersion;
      this.broadcastToTabs('DATABASE_RESET', undefined, result.newVersion);
      return {
        success: true,
        version: result.newVersion,
        lastModified: result.lastModified,
        lastSyncedBy: result.lastSyncedBy,
        data: result.data,
      };
    } catch (err: any) {
      this.handleFirestoreError(err, 'Reset database');
      return { success: false, message: err?.message || 'فشل إعادة ضبط قاعدة البيانات' };
    }
  }

  /**
   * One-time initialization helper. It can create database/main only when it does not
   * already exist, so an old client can never seed over a real production database.
   */
  public async initializeIfEmpty(seedData: any, sourceUser?: SyncUser): Promise<SyncResponse> {
    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const result = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(docRef);
        if (snapshot.exists()) {
          const record = snapshot.data();
          return {
            created: false,
            version: Number(record.version || 0),
            data: clone(record.data || {}),
            lastModified: record.lastModified,
            lastSyncedBy: record.lastSyncedBy,
          };
        }

        const version = 1;
        const lastModified = new Date().toISOString();
        const lastSyncedBy = clone(sourceUser || { id: 'admin-main', name: 'Initial Setup', role: 'admin' });
        const data = clone(seedData || {});
        transaction.set(docRef, {
          version,
          lastModified,
          lastSyncedBy,
          data,
          _timestamp: serverTimestamp(),
        });
        return { created: true, version, data, lastModified, lastSyncedBy };
      });

      this.currentVersion = Math.max(this.currentVersion, result.version);
      return {
        success: true,
        version: result.version,
        data: result.data,
        lastModified: result.lastModified,
        lastSyncedBy: result.lastSyncedBy,
        message: result.created ? 'تمت تهيئة قاعدة البيانات لأول مرة' : 'قاعدة البيانات موجودة مسبقاً',
      };
    } catch (err: any) {
      this.handleFirestoreError(err, 'Initialize database');
      return { success: false, message: err?.message || 'فشل تهيئة قاعدة البيانات' };
    }
  }
}

export const centralSyncService = new CentralSyncService();
