/**
 * Central Data Synchronization Service for All Users
 * خدمة المزامنة المركزية لجميع المستخدمين والأدوار
 * ثانوية ميسان للمتميزات
 */

export interface SyncStatusInfo {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  version: number;
  lastModified: string | null;
  lastSyncedAt: string | null;
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

class CentralSyncService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload?: any; sourceVersion?: number }) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

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
        this.notifyListeners({ type: 'NETWORK_ONLINE' });
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners({ type: 'NETWORK_OFFLINE' });
      });
    }
  }

  public subscribe(callback: (event: { type: string; payload?: any; sourceVersion?: number }) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: { type: string; payload?: any; sourceVersion?: number }) {
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

  /**
   * Fetch latest state from central server
   */
  public async fetchServerData(currentVersion?: number, force: boolean = false): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
    }

    try {
      const url = new URL('/api/data/sync', window.location.origin);
      if (currentVersion !== undefined && !force) {
        url.searchParams.set('version', currentVersion.toString());
      }
      if (force) {
        url.searchParams.set('force', 'true');
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json: SyncResponse = await res.json();
      return json;
    } catch (err: any) {
      console.warn('[SyncService] Fetch data error:', err);
      return {
        success: false,
        message: err.message || 'فشل الاتصال بخادم المزامنة المركزي',
      };
    }
  }

  /**
   * Push updates to central server
   */
  public async pushUpdates(
    updates: any,
    sourceUser?: { id?: string; name?: string; role?: string },
    clientVersion?: number
  ): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
    }

    try {
      const res = await fetch('/api/data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          sourceUser,
          clientVersion,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json: SyncResponse = await res.json();
      if (json.success && json.version) {
        this.broadcastToTabs('SERVER_DATA_UPDATED', null, json.version);
      }
      return json;
    } catch (err: any) {
      console.warn('[SyncService] Push updates error:', err);
      return {
        success: false,
        message: err.message || 'فشل إرسال التحديثات إلى الخادم المركزي',
      };
    }
  }

  /**
   * Get Server Health & Entity Counts Status
   */
  public async getServerStatus(): Promise<any> {
    const startTime = Date.now();
    try {
      const res = await fetch('/api/data/status?t=' + Date.now(), {
        cache: 'no-store',
      });
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        return { success: false, latencyMs, message: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { ...data, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return { success: false, latencyMs, message: err.message };
    }
  }

  /**
   * Reset Central Database
   */
  public async resetServerDatabase(seedData?: any): Promise<SyncResponse> {
    try {
      const res = await fetch('/api/data/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seedData }),
      });
      const json: SyncResponse = await res.json();
      if (json.success) {
        this.broadcastToTabs('DATABASE_RESET', null, json.version);
      }
      return json;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const centralSyncService = new CentralSyncService();
