/**
 * SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
 * SECURITY_MESSAGING_PENDING_RECONCILE_V1_3D6F2C_STAGE0_1
 * Shared-content messages stay isolated from generic full-cache sync.
 * Per-user mailbox state remains in messageUserStates/{uid}/items/{messageId}.
 */

export const MESSAGE_MAILBOX_STATE_KEYS = [
  'folder',
  'isRead',
  'isStarred',
  'isTrash',
  'isSpam',
  'isArchived',
  'isDeleted',
  'customFolderId',
] as const;

export type RemoteMessageApplySource = 'hydration' | 'realtime' | 'generic-fetch';

/**
 * Dedicated mailbox snapshots usually arrive well under 1s.
 * Generic emit debounce is 80ms; the 6s school poll must never be the fallback.
 * 2500ms bounds a missed snapshot without waiting on fetchServerData.
 */
export const MAILBOX_PENDING_RECONCILE_MS = 2500;

export type PendingMailboxOperation = {
  messageId: string;
  operationVersion: number;
  patch: Record<string, any>;
  startedAt: number;
  writeSucceeded: boolean;
  rollbackCacheState: any;
  rollbackUiState: any;
  targetUserId: string;
};

export function mergeRealtimeMessageBuckets(buckets: Record<string, any[]> | null | undefined): any[] {
  const merged = new Map<string, any>();
  for (const bucket of Object.values(buckets || {})) {
    if (!Array.isArray(bucket)) continue;
    for (const item of bucket) {
      const id = typeof item?.id === 'string' && item.id ? item.id : '';
      if (id) merged.set(id, item);
    }
  }
  return [...merged.values()];
}

export function hasRealtimeMessageBuckets(buckets: Record<string, any[]> | null | undefined): boolean {
  return Object.keys(buckets || {}).length > 0;
}

export function restoreRealtimeMessagesAfterGenericFetch(
  fetchedData: Record<string, any> | null | undefined,
  realtimeMessageBuckets: Record<string, any[]> | null | undefined
): Record<string, any> {
  const next = { ...(fetchedData || {}) };
  if (hasRealtimeMessageBuckets(realtimeMessageBuckets)) {
    next.messages = mergeRealtimeMessageBuckets(realtimeMessageBuckets);
  }
  return next;
}

export function buildRealtimeServerUpdatePayload(
  cache: Record<string, any> | null | undefined,
  includeMessages: boolean
): Record<string, any> {
  const payload = JSON.parse(JSON.stringify(cache || {}));
  if (!includeMessages) delete payload.messages;
  return payload;
}

export function shouldApplyRemoteMessages(args: {
  source: RemoteMessageApplySource;
  payloadHasMessages: boolean;
  realtimeActive: boolean;
}): boolean {
  if (!args.payloadHasMessages) return false;
  if (args.source === 'hydration' || args.source === 'realtime') return true;
  return !args.realtimeActive;
}

export function mailboxKeysFromPatch(patch: Record<string, any> | null | undefined): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const key of MESSAGE_MAILBOX_STATE_KEYS) {
    if (patch && patch[key] !== undefined) safe[key] = patch[key];
  }
  return safe;
}

export function createPendingMailboxOperation(args: {
  messageId: string;
  operationVersion: number;
  patch: Record<string, any>;
  startedAt?: number;
  writeSucceeded?: boolean;
  rollbackCacheState?: any;
  rollbackUiState?: any;
  targetUserId: string;
}): PendingMailboxOperation {
  return {
    messageId: args.messageId,
    operationVersion: args.operationVersion,
    patch: mailboxKeysFromPatch(args.patch),
    startedAt: args.startedAt ?? Date.now(),
    writeSucceeded: Boolean(args.writeSucceeded),
    rollbackCacheState: args.rollbackCacheState,
    rollbackUiState: args.rollbackUiState,
    targetUserId: args.targetUserId,
  };
}

export function mailboxPatchConfirmedBySnapshot(
  patch: Record<string, any> | null | undefined,
  remote: any
): boolean {
  const safe = mailboxKeysFromPatch(patch);
  if (!remote || typeof remote !== 'object' || Object.keys(safe).length === 0) return false;
  for (const [key, value] of Object.entries(safe)) {
    if (remote[key] !== value) return false;
  }
  return true;
}

export function shouldSettlePendingMailboxOperation(
  pendingOp: PendingMailboxOperation | null | undefined,
  remote: any,
  expectedVersion?: number
): boolean {
  if (!pendingOp) return false;
  if (expectedVersion !== undefined && pendingOp.operationVersion !== expectedVersion) return false;
  return mailboxPatchConfirmedBySnapshot(pendingOp.patch, remote);
}

export function isStaleMailboxReconciliation(
  pendingOp: PendingMailboxOperation | null | undefined,
  scheduledVersion: number
): boolean {
  return !pendingOp || pendingOp.operationVersion !== scheduledVersion;
}

export function shouldStartMailboxReconciliation(args: {
  pendingOp: PendingMailboxOperation | null | undefined;
  scheduledVersion: number;
  writeSucceeded: boolean;
}): boolean {
  if (!args.writeSucceeded) return false;
  if (!args.pendingOp) return false;
  return args.pendingOp.operationVersion === args.scheduledVersion;
}

export type MailboxReconcileAction = 'ignore' | 'settle' | 'rollback';

export function reconcileMailboxOperationFromDirectRead(args: {
  pendingOp: PendingMailboxOperation | null | undefined;
  scheduledVersion: number;
  remote: any;
}): { action: MailboxReconcileAction; remote?: any } {
  if (isStaleMailboxReconciliation(args.pendingOp, args.scheduledVersion)) {
    return { action: 'ignore' };
  }
  if (mailboxPatchConfirmedBySnapshot(args.pendingOp!.patch, args.remote)) {
    return { action: 'settle', remote: args.remote };
  }
  return { action: 'rollback' };
}

export function mergeMessageUserStatesWithPending(
  remoteStates: Record<string, any> | null | undefined,
  localCache: Record<string, any> | null | undefined,
  pending: Record<string, PendingMailboxOperation> | null | undefined
): { merged: Record<string, any>; nextPending: Record<string, PendingMailboxOperation>; confirmedIds: string[] } {
  const merged: Record<string, any> = { ...(remoteStates || {}) };
  const nextPending: Record<string, PendingMailboxOperation> = { ...(pending || {}) };
  const confirmedIds: string[] = [];

  for (const messageId of Object.keys(pending || {})) {
    const pendingOp = pending?.[messageId];
    const optimistic = localCache?.[messageId];
    const remote = remoteStates?.[messageId];
    if (pendingOp && shouldSettlePendingMailboxOperation(pendingOp, remote)) {
      merged[messageId] = remote;
      delete nextPending[messageId];
      confirmedIds.push(messageId);
    } else if (optimistic) {
      merged[messageId] = optimistic;
    }
  }

  return { merged, nextPending, confirmedIds };
}

export function clearMailboxReconciliationTimer(
  timers: Record<string, ReturnType<typeof setTimeout> | undefined>,
  messageId: string,
  clearTimer: (handle: ReturnType<typeof setTimeout>) => void = clearTimeout
): void {
  const handle = timers[messageId];
  if (handle !== undefined) clearTimer(handle);
  delete timers[messageId];
}

export function clearAllMailboxReconciliationTimers(
  timers: Record<string, ReturnType<typeof setTimeout> | undefined>,
  clearTimer: (handle: ReturnType<typeof setTimeout>) => void = clearTimeout
): void {
  for (const messageId of Object.keys(timers)) {
    clearMailboxReconciliationTimer(timers, messageId, clearTimer);
  }
}

export function prepareDirectMessageForPersistence(message: any): Record<string, any> {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('SECURITY: message required');
  }
  const id = typeof message.id === 'string' ? message.id.trim() : '';
  if (!id) throw new Error('SECURITY: message id required');
  if (typeof message.senderAuthUid !== 'string' || !message.senderAuthUid.trim()) {
    throw new Error('SECURITY: new message missing senderAuthUid');
  }
  const { userStates: _userStates, __sync: _sync, ...rest } = message;
  return {
    ...rest,
    id,
    senderAuthUid: message.senderAuthUid.trim(),
  };
}

export function mergePendingDirectMessages(
  remoteMessages: any[] | null | undefined,
  pending: Record<string, any> | null | undefined
): any[] {
  const list = Array.isArray(remoteMessages) ? [...remoteMessages] : [];
  const seen = new Set(list.map((item) => (typeof item?.id === 'string' ? item.id : '')).filter(Boolean));
  const extras: any[] = [];
  for (const pendingMessage of Object.values(pending || {})) {
    const id = typeof pendingMessage?.id === 'string' ? pendingMessage.id : '';
    if (id && !seen.has(id)) extras.push(pendingMessage);
  }
  return extras.length ? [...extras, ...list] : list;
}

export function settlePendingDirectMessages(
  remoteMessages: any[] | null | undefined,
  pending: Record<string, any> | null | undefined
): Record<string, any> {
  const next: Record<string, any> = { ...(pending || {}) };
  const remoteIds = new Set(
    (Array.isArray(remoteMessages) ? remoteMessages : [])
      .map((item) => (typeof item?.id === 'string' ? item.id : ''))
      .filter(Boolean)
  );
  for (const id of Object.keys(next)) {
    if (remoteIds.has(id)) delete next[id];
  }
  return next;
}
