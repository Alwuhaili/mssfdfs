import {
  MAILBOX_PENDING_RECONCILE_MS,
  buildRealtimeServerUpdatePayload,
  restoreRealtimeMessagesAfterGenericFetch,
  shouldApplyRemoteMessages,
  mergeMessageUserStatesWithPending,
  mergePendingDirectMessages,
  settlePendingDirectMessages,
  prepareDirectMessageForPersistence,
  createPendingMailboxOperation,
  mailboxPatchConfirmedBySnapshot,
  shouldSettlePendingMailboxOperation,
  shouldStartMailboxReconciliation,
  reconcileMailboxOperationFromDirectRead,
  isStaleMailboxReconciliation,
  clearMailboxReconciliationTimer,
  clearAllMailboxReconciliationTimers,
} from '../src/utils/messageSyncIsolation.ts';

let pass = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    pass++;
    console.log('PASS', name);
  } catch (err) {
    console.error('FAIL', name, err.message);
  }
}

function ok(value, message) {
  if (!value) throw new Error(message);
}

function pendingOp(overrides = {}) {
  return createPendingMailboxOperation({
    messageId: 'msg-f2a',
    operationVersion: 1,
    patch: { isRead: true },
    targetUserId: 'teacher-1',
    rollbackCacheState: { messageId: 'msg-f2a', isRead: false, folder: 'inbox' },
    rollbackUiState: { isRead: false, folder: 'inbox' },
    ...overrides,
  });
}

test('unrelated realtime collection update omits stale generic messages', () => {
  const staleMessages = [{ id: 'msg-old', body: 'stale-from-generic-cache' }];
  const liveMessages = [{ id: 'msg-live', body: 'from-dedicated-listener' }];
  const cache = {
    messages: staleMessages,
    timetable: [{ id: 'slot-1' }],
    lectures: [{ id: 'lec-1' }],
  };

  const unrelatedPayload = buildRealtimeServerUpdatePayload(cache, false);
  ok(!Object.prototype.hasOwnProperty.call(unrelatedPayload, 'messages'), 'generic emit must omit messages');
  ok(Array.isArray(unrelatedPayload.timetable), 'unrelated collections remain in generic emit');

  let currentMessages = liveMessages;
  if (shouldApplyRemoteMessages({
    source: 'realtime',
    payloadHasMessages: Array.isArray(unrelatedPayload.messages),
    realtimeActive: true,
  })) {
    currentMessages = unrelatedPayload.messages;
  }
  ok(currentMessages === liveMessages, 'AppContext must keep dedicated listener messages');
  ok(currentMessages[0].body === 'from-dedicated-listener', 'stale generic cache must not replace messages');
});

test('dedicated message realtime emit still applies message content', () => {
  const cache = {
    messages: [{ id: 'msg-live', body: 'updated-content' }],
    timetable: [{ id: 'slot-1' }],
  };
  const payload = buildRealtimeServerUpdatePayload(cache, true);
  ok(payload.messages[0].body === 'updated-content', 'message listener emit must include messages');
  ok(shouldApplyRemoteMessages({
    source: 'realtime',
    payloadHasMessages: Array.isArray(payload.messages),
    realtimeActive: true,
  }), 'dedicated message payload must be applied');
});

test('generic fetch cannot clobber newer realtime message buckets', () => {
  const fetched = {
    messages: [{ id: 'msg-1', body: 'stale-fetch' }],
    timetable: [{ id: 'slot-1' }],
  };
  const buckets = {
    sender: [{ id: 'msg-1', body: 'newer-realtime' }],
    receiver: [{ id: 'msg-2', body: 'from-receiver-query' }],
  };
  const restored = restoreRealtimeMessagesAfterGenericFetch(fetched, buckets);
  ok(restored.messages.find((m) => m.id === 'msg-1').body === 'newer-realtime', 'bucket content must win over fetch');
  ok(restored.messages.some((m) => m.id === 'msg-2'), 'live buckets must be preserved');
  ok(
    !shouldApplyRemoteMessages({
      source: 'generic-fetch',
      payloadHasMessages: Array.isArray(restored.messages),
      realtimeActive: true,
    }),
    'generic force-fetch must not apply messages while realtime is active'
  );
});

test('A confirmation checks only the current operation patch keys', () => {
  const patch = { isRead: true };
  ok(mailboxPatchConfirmedBySnapshot(patch, { isRead: true, folder: 'archive', isStarred: true }), 'only patch keys are required');
  ok(!mailboxPatchConfirmedBySnapshot(patch, { isRead: false, folder: 'archive' }), 'mismatching patch key must not confirm');
});

test('B unrelated remote mailbox fields do not prevent confirmation', () => {
  const pending = { 'msg-f2a': pendingOp({ patch: { isRead: true } }) };
  const localCache = { 'msg-f2a': { messageId: 'msg-f2a', isRead: true, folder: 'inbox', isStarred: false } };
  const remote = { 'msg-f2a': { messageId: 'msg-f2a', isRead: true, folder: 'spam', isStarred: true, customFolderId: 'x' } };
  const { merged, nextPending, confirmedIds } = mergeMessageUserStatesWithPending(remote, localCache, pending);
  ok(confirmedIds.includes('msg-f2a'), 'unrelated fields must not block confirmation');
  ok(nextPending['msg-f2a'] === undefined, 'pending settles when patch keys match');
  ok(merged['msg-f2a'].folder === 'spam', 'confirmed remote document is accepted after patch match');
});

test('C stale snapshot from operation v1 cannot settle operation v2', () => {
  const pending = { 'msg-f2a': pendingOp({ operationVersion: 2, patch: { isRead: false } }) };
  const localCache = { 'msg-f2a': { messageId: 'msg-f2a', isRead: false } };
  const v1Snapshot = { 'msg-f2a': { messageId: 'msg-f2a', isRead: true } };
  const { merged, nextPending } = mergeMessageUserStatesWithPending(v1Snapshot, localCache, pending);
  ok(nextPending['msg-f2a'].operationVersion === 2, 'v2 must remain pending');
  ok(merged['msg-f2a'].isRead === false, 'optimistic v2 must survive stale v1 snapshot');
  ok(!shouldSettlePendingMailboxOperation(pending['msg-f2a'], v1Snapshot['msg-f2a'], 2), 'v1 snapshot must not confirm v2');
});

test('D matching snapshot settles the current operation', () => {
  const pending = { 'msg-f2a': pendingOp({ operationVersion: 2, patch: { isRead: false } }) };
  const localCache = { 'msg-f2a': { messageId: 'msg-f2a', isRead: false } };
  const matching = mergeMessageUserStatesWithPending(
    { 'msg-f2a': { messageId: 'msg-f2a', isRead: false, folder: 'inbox' } },
    localCache,
    pending
  );
  ok(matching.nextPending['msg-f2a'] === undefined, 'matching snapshot settles pending');
  ok(matching.merged['msg-f2a'].isRead === false, 'matching remote is stored');
});

test('E successful write + missing realtime confirmation triggers bounded direct reconciliation', () => {
  const op = pendingOp({ writeSucceeded: true, operationVersion: 3 });
  ok(shouldStartMailboxReconciliation({ pendingOp: op, scheduledVersion: 3, writeSucceeded: true }), 'ACK of current op schedules reconcile');
  ok(!shouldStartMailboxReconciliation({ pendingOp: op, scheduledVersion: 3, writeSucceeded: false }), 'failed write must not schedule reconcile');
  ok(!shouldStartMailboxReconciliation({ pendingOp: op, scheduledVersion: 2, writeSucceeded: true }), 'older version must not schedule');
  ok(MAILBOX_PENDING_RECONCILE_MS === 2500, 'bounded interval remains 2500ms');
});

test('F matching direct re-read settles pending', () => {
  const op = pendingOp({ operationVersion: 4, patch: { isRead: true }, writeSucceeded: true });
  const decision = reconcileMailboxOperationFromDirectRead({
    pendingOp: op,
    scheduledVersion: 4,
    remote: { messageId: 'msg-f2a', isRead: true, folder: 'trash' },
  });
  ok(decision.action === 'settle', 'matching direct read settles');
  ok(decision.remote.isRead === true, 'settlement uses the direct document');
});

test('G mismatching direct re-read does not silently accept stale state', () => {
  const op = pendingOp({ operationVersion: 4, patch: { isRead: true }, writeSucceeded: true });
  const stale = { messageId: 'msg-f2a', isRead: false, folder: 'inbox' };
  const decision = reconcileMailboxOperationFromDirectRead({
    pendingOp: op,
    scheduledVersion: 4,
    remote: stale,
  });
  ok(decision.action === 'rollback', 'mismatch must rollback rather than accept stale');
  ok(decision.remote === undefined, 'stale document must not become the settled cache');
});

test('H an old reconciliation timer cannot rollback or settle a newer operation', () => {
  const v2 = pendingOp({ operationVersion: 2, patch: { isRead: false }, writeSucceeded: true });
  ok(isStaleMailboxReconciliation(v2, 1), 'v1 timer is stale against v2');
  const ignored = reconcileMailboxOperationFromDirectRead({
    pendingOp: v2,
    scheduledVersion: 1,
    remote: { isRead: true },
  });
  ok(ignored.action === 'ignore', 'v1 timer must not settle or rollback v2');
});

test('I cleanup removes pending reconciliation resources', () => {
  const cleared = [];
  const timers = { 'msg-f2a': 11, 'msg-other': 22 };
  clearMailboxReconciliationTimer(timers, 'msg-f2a', (handle) => cleared.push(handle));
  ok(timers['msg-f2a'] === undefined, 'per-id timer is removed');
  ok(cleared.includes(11), 'per-id timer handle is cleared');
  clearAllMailboxReconciliationTimers(timers, (handle) => cleared.push(handle));
  ok(Object.keys(timers).length === 0, 'all timers are removed');
  ok(cleared.includes(22), 'remaining timer handles are cleared');
});

test('pending optimistic mailbox state survives stale snapshot', () => {
  const pending = { 'msg-f2a': pendingOp({ patch: { isRead: true } }) };
  const localCache = { 'msg-f2a': { messageId: 'msg-f2a', isRead: true, folder: 'inbox' } };
  const { merged, nextPending } = mergeMessageUserStatesWithPending(
    { 'msg-f2a': { messageId: 'msg-f2a', isRead: false, folder: 'inbox' } },
    localCache,
    pending
  );
  ok(merged['msg-f2a'].isRead === true, 'optimistic isRead must survive stale snapshot');
  ok(nextPending['msg-f2a'].operationVersion === 1, 'pending must remain until a matching snapshot');
});

test('prepareDirectMessageForPersistence strips userStates and keeps addressing', () => {
  const prepared = prepareDirectMessageForPersistence({
    id: 'msg-same',
    senderAuthUid: 'uid-a',
    receiverAuthUid: 'uid-b',
    recipientAuthUids: ['uid-b'],
    recipients: [{ id: 'e2e-teacher-b', authUid: 'uid-b' }],
    userStates: { 'e2e-teacher-a': { isRead: true } },
    subject: 'hello',
  });
  ok(prepared.id === 'msg-same', 'id must be preserved');
  ok(prepared.senderAuthUid === 'uid-a', 'senderAuthUid must be preserved');
  ok(prepared.receiverAuthUid === 'uid-b', 'receiverAuthUid must be preserved');
  ok(prepared.recipientAuthUids[0] === 'uid-b', 'recipientAuthUids must be preserved');
  ok(prepared.recipients[0].authUid === 'uid-b', 'recipients[].authUid must be preserved');
  ok(!Object.prototype.hasOwnProperty.call(prepared, 'userStates'), 'userStates must be stripped');
});

test('prepareDirectMessageForPersistence fails closed without senderAuthUid', () => {
  let failed = false;
  try {
    prepareDirectMessageForPersistence({ id: 'msg-same', senderId: 'e2e-teacher-a' });
  } catch (err) {
    failed = String(err.message).includes('senderAuthUid');
  }
  ok(failed, 'missing senderAuthUid must fail closed and must not use senderId');
});

test('pending sent message survives a scoped realtime snapshot that omits it', () => {
  const pending = {
    'msg-new': { id: 'msg-new', senderAuthUid: 'uid-a', subject: 'optimistic' },
  };
  const remote = [{ id: 'msg-old', senderAuthUid: 'uid-a' }];
  const merged = mergePendingDirectMessages(remote, pending);
  ok(merged[0].id === 'msg-new', 'optimistic send must remain until write is observed');
  ok(merged.some((m) => m.id === 'msg-old'), 'remote messages remain');
  const settled = settlePendingDirectMessages(
    [{ id: 'msg-new' }, { id: 'msg-old' }],
    pending
  );
  ok(!settled['msg-new'], 'pending send is released after remote observation');
});

console.log(`MESSAGING STAGE0 ISOLATION TEST: ${pass}/${total} PASS`);
if (pass !== total) process.exit(1);
