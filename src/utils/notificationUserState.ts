import type { NotificationItem } from '../types';
import { notificationHasAuthUidTargeting } from './notificationIdentity';

export type IsolatedNotificationUserState = {
  notificationId: string;
  isRead: boolean;
  isDeleted: boolean;
  updatedAt?: string;
};

export const NOTIFICATION_USER_STATE_KEYS = ['notificationId', 'isRead', 'isDeleted', 'updatedAt'] as const;

export function normalizeNotificationUserState(
  notificationId: string,
  data: any
): IsolatedNotificationUserState | null {
  if (!notificationId) return null;
  const id =
    typeof data?.notificationId === 'string' && data.notificationId.trim()
      ? data.notificationId.trim()
      : notificationId;
  if (id !== notificationId) return null;
  return {
    notificationId: id,
    isRead: data?.isRead === true,
    isDeleted: data?.isDeleted === true,
    updatedAt:
      typeof data?.updatedAt === 'string'
        ? data.updatedAt
        : data?.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : undefined,
  };
}

export function mergeNotificationUserStateMaps(
  remote: Record<string, any>,
  previous: Record<string, IsolatedNotificationUserState>
): Record<string, IsolatedNotificationUserState> {
  const remoteEntries = Object.entries(remote || {});
  if (remoteEntries.length === 0 && Object.keys(previous || {}).length > 0) {
    return previous;
  }
  const next: Record<string, IsolatedNotificationUserState> = {};
  for (const [id, data] of remoteEntries) {
    const normalized = normalizeNotificationUserState(id, data);
    if (normalized) next[id] = normalized;
  }
  return next;
}

export function applyIsolatedNotificationState(
  notif: NotificationItem,
  authUid: string | undefined,
  stateMap: Record<string, IsolatedNotificationUserState>
): { isRead: boolean; isDeleted: boolean } {
  if (notificationHasAuthUidTargeting(notif) && authUid) {
    const isolated = stateMap[notif.id];
    if (isolated) return { isRead: isolated.isRead === true, isDeleted: isolated.isDeleted === true };
    return { isRead: false, isDeleted: false };
  }
  return {
    isRead: notif.isRead === true,
    isDeleted: false,
  };
}
