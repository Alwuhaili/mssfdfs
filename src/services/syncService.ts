import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, writeBatch, disableNetwork, terminate } from 'firebase/firestore';

export interface SyncStatus {
  success: boolean;
  version?: number;
  lastModified?: string;
  lastSyncedBy?: {
    id?: string;
    name?: string;
    role?: string;
  };
  serverLatencyMs?: number;
  errorMessage?: string;
}

export interface SyncResponse {
  success: boolean;
  notModified?: boolean;
  version?: number;
  lastModified?: string;
  lastSyncedBy?: {
    id?: string;
    name?: string;
    role?: string;
  };
  data?: any;
  message?: string;
  serverTime?: string;
}

const BROADCAST_CHANNEL_NAME = 'maysan_gifted_school_sync_channel';
const FIREBASE_DOC_PATH = 'database/main';

class CentralSyncService {
  private isQuotaExceeded: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload?: any; sourceVersion?: number; lastSyncedBy?: any; lastModified?: string }) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private unsubscribeFirestore: (() => void) | null = null;
  private currentVersion: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
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

      // Start Firebase real-time stream
      this.connectRealtimeStream();
    }
  }

  public connectRealtimeStream() {
    if (typeof window === 'undefined') return;

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      
      try {
        this.unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
          
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.version && data.version > this.currentVersion) {
            this.currentVersion = data.version;
            
            // Format for compatibility with the existing AppContext payload expectancies
            this.notifyListeners({
              type: 'REALTIME_SERVER_UPDATE',
              payload: data.data,
              sourceVersion: data.version,
              lastSyncedBy: data.lastSyncedBy,
              lastModified: data.lastModified,
            });
            this.broadcastToTabs('SERVER_DATA_UPDATED', null, data.version);
          }
        }
      
        }, (err: any) => {
          
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
          this.isQuotaExceeded = true;
          console.error('Firebase Quota Exceeded in onSnapshot!');
          terminate(db).catch(() => {})
        }
        console.warn('[SyncService] Firebase onSnapshot error:', err);
      
        });
      } catch (err: any) {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
          this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
          console.error('Firebase Quota Exceeded!');
        }
      }
    } catch (err) {
      console.warn('[SyncService] Firebase setup error:', err);
    }
  }

  public subscribe(callback: (event: { type: string; payload?: any; sourceVersion?: number; lastSyncedBy?: any; lastModified?: string }) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: { type: string; payload?: any; sourceVersion?: number; lastSyncedBy?: any; lastModified?: string }) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public broadcastToTabs(type: string, payload?: any, sourceVersion?: number) {
    const event = { type, payload, sourceVersion, timestamp: Date.now() };
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (err) {
        console.warn('Broadcast postMessage failed:', err);
      }
    }
  }

  public async fetchServerData(currentVersion?: number, force: boolean = false): Promise<SyncResponse> {
    if (this.isQuotaExceeded) {
      return { success: false, message: 'تجاوز الحد اليومي المجاني لقاعدة البيانات' };
    }
    if (!this.isOnline) {
      return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
    }

    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        return { success: true, data: {}, version: 1 }; // Empty initial state
      }

      const data = snapshot.data();
      
      if (currentVersion !== undefined && !force && data.version <= currentVersion) {
        return { success: true, notModified: true, version: data.version };
      }

      this.currentVersion = data.version || 1;

      return {
        success: true,
        version: data.version,
        lastModified: data.lastModified,
        lastSyncedBy: data.lastSyncedBy,
        data: data.data,
        serverTime: new Date().toISOString()
      };
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
        console.error('Firebase Quota Exceeded!');
      }
      console.warn('[SyncService] Fetch data error:', err);
      return {
        success: false,
        message: err.message || 'فشل الاتصال بخادم Firebase',
      };
    }
  }

  public async pushUpdates(
    updates: any,
    sourceUser?: { id?: string; name?: string; role?: string },
    clientVersion?: number
  ): Promise<SyncResponse> {
    if (this.isQuotaExceeded) return { success: false, message: 'تجاوز الحد اليومي لقاعدة البيانات' };
    if (!this.isOnline) {
      return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
    }

    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      
      const newVersion = (this.currentVersion || 0) + 1;
      const lastModified = new Date().toISOString();
      const lastSyncedBy = sourceUser || { id: 'unknown', name: 'Unknown', role: 'user' };

      // In a real app we would merge changes intelligently (using transactions).
      // For now, we do a simple merge: read current, merge updates, write back.
      // Firebase transaction ensures atomic updates
      
      // But AppContext actually sends the ENTIRE state most of the time via getFullPayload.
      // Easiest is just to overwrite the entire data object if we assume updates has everything,
      // but if updates is partial, we should get current first.
      
      const snapshot = await getDoc(docRef);
      let currentData = snapshot.exists() ? snapshot.data().data || {} : {};
      
      // If it's an admin pushing, we trust their payload entirely.
      const isAdmin = sourceUser?.role === 'admin' || sourceUser?.id === 'admin-main';
      
      let mergedData = { ...currentData };
      if (isAdmin) {
         for (const key of Object.keys(updates)) {
             if (updates[key] !== undefined) mergedData[key] = updates[key];
         }
      } else {
         // Non-admin logic similar to the backend
         const ADMIN_EXCLUSIVE_KEYS = [
            "teachers", "students", "parents", "supervisors", "graduates", "certificates",
            "announcements", "timetable", "subjectQuotas", "financial", "schoolAdminData",
            "decisionSettings", "disciplinarySettings", "examSchedules",
         ];
         for (const key of Object.keys(updates)) {
            if (updates[key] === undefined) continue;
            if (ADMIN_EXCLUSIVE_KEYS.includes(key)) continue;
            
            // For array-based operational entities, we merge lists intelligently
            if (["submissions", "attendance", "messages", "lectures", "challenges", "annualPlans", "dailyLessonPlans"].includes(key) && Array.isArray(updates[key])) {
                const currentList = Array.isArray(mergedData[key]) ? [...mergedData[key]] : [];
                updates[key].forEach((item: any) => {
                    const matchIdx = currentList.findIndex((it: any) => it.id === item.id);
                    if (matchIdx >= 0) {
                        currentList[matchIdx] = { ...currentList[matchIdx], ...item };
                    } else {
                        currentList.push(item);
                    }
                });
                mergedData[key] = currentList;
            } else {
                mergedData[key] = updates[key];
            }
         }
      }

      const safeMergedData = JSON.parse(JSON.stringify(mergedData));
      const safeLastSyncedBy = JSON.parse(JSON.stringify(lastSyncedBy));
      
      await setDoc(docRef, {
        version: newVersion,
        lastModified: lastModified,
        lastSyncedBy: safeLastSyncedBy,
        data: safeMergedData,
        _timestamp: serverTimestamp()
      });

      this.currentVersion = newVersion;
      
      this.broadcastToTabs('SERVER_DATA_UPDATED', null, newVersion);

      return {
        success: true,
        version: newVersion,
        lastModified: lastModified,
        lastSyncedBy: lastSyncedBy
      };
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
        console.error('Firebase Quota Exceeded!');
      }
      console.warn('[SyncService] Push updates error:', err);
      return {
        success: false,
        message: err.message || 'فشل إرسال التحديثات إلى Firebase',
      };
    }
  }

  

  /**
   * Instantly mutates an array in Firebase database/main
   */
  public async directArrayMutation(key: string, dataArray: any[], sourceUser?: any): Promise<boolean> {
    if (this.isQuotaExceeded) return false;
    if (!this.isOnline) return false;
    try {
      
      const docRef = doc(db, 'database/main');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
         const data = snapshot.data();
         const newVersion = (data.version || 0) + 1;
         // Clean undefined values by round-tripping through JSON
         const safeDataArray = JSON.parse(JSON.stringify(dataArray));
         const safeSourceUser = JSON.parse(JSON.stringify(sourceUser || { id: 'admin-main', name: 'Direct Mutation', role: 'admin' }));
         
         await updateDoc(docRef, {
           [`data.${key}`]: safeDataArray,
           version: newVersion,
           lastModified: new Date().toISOString(),
           lastSyncedBy: safeSourceUser,
           _timestamp: serverTimestamp()
         });
         this.currentVersion = newVersion;
         this.broadcastToTabs('SERVER_DATA_UPDATED', null, newVersion);
         return true;
      }
      return false;
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
        console.error('Firebase Quota Exceeded!');
      }
      console.error('[SyncService] Direct mutation error:', err);
      return false;
    }
  }

  public async getServerStatus(): Promise<any> {
    const startTime = Date.now();
    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const snapshot = await getDoc(docRef);
      const latencyMs = Date.now() - startTime;
      
      if (!snapshot.exists()) {
         return { success: true, latencyMs, message: 'Database is empty', counts: {} };
      }
      
      const data = snapshot.data();
      const counts: any = {};
      if (data.data) {
         Object.keys(data.data).forEach(key => {
            if (Array.isArray(data.data[key])) {
               counts[key] = data.data[key].length;
            }
         });
      }
      
      return { 
         success: true, 
         version: data.version, 
         lastModified: data.lastModified, 
         lastSyncedBy: data.lastSyncedBy,
         totalKeys: Object.keys(data.data || {}).length,
         counts,
         latencyMs 
      };
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
        console.error('Firebase Quota Exceeded!');
      }
      const latencyMs = Date.now() - startTime;
      return { success: false, latencyMs, message: err.message };
    }
  }

  public async resetServerDatabase(seedData?: any): Promise<SyncResponse> {
    try {
      const docRef = doc(db, FIREBASE_DOC_PATH);
      const newVersion = (this.currentVersion || 0) + 1;
      await setDoc(docRef, {
        version: newVersion,
        lastModified: new Date().toISOString(),
        lastSyncedBy: { id: 'admin-main', name: 'System Admin', role: 'admin' },
        data: seedData || {},
        _timestamp: serverTimestamp()
      });
      
      this.broadcastToTabs('DATABASE_RESET', null, newVersion);
      return { success: true, version: newVersion };
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})
        console.error('Firebase Quota Exceeded!');
      }
      return { success: false, message: err.message };
    }
  }
}

export const centralSyncService = new CentralSyncService();
