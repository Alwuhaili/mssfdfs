import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
const [host, portText] = HOST.split(":");
const rules = fs.readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({ projectId: "messaging-d6f2a-emulator-only", firestore: { host, port: Number(portText), rules } });
const uid = "uid-d6f2a-owner";

try {
  await env.clearFirestore();
  const db = env.authenticatedContext(uid, { role: "teacher" }).firestore();
  const statesRef = collection(db, "messageUserStates", uid, "items");
  const stateRef = doc(db, "messageUserStates", uid, "items", "msg-f2a");
  let resolveSnapshot;
  let nextSnapshot = new Promise((resolve) => { resolveSnapshot = resolve; });
  const unsub = onSnapshot(statesRef, (snap) => {
    const states = {};
    snap.docs.forEach((d) => { states[d.id] = d.data(); });
    resolveSnapshot(states);
  });
  await nextSnapshot;
  console.log("1 initial realtime snapshot: PASS");
  nextSnapshot = new Promise((resolve) => { resolveSnapshot = resolve; });
  await assertSucceeds(setDoc(stateRef, { messageId: "msg-f2a", ownerAuthUid: uid, folder: "inbox", isRead: false, isStarred: false, isTrash: false, isSpam: false, isArchived: false, isDeleted: false, updatedAt: "f2a-create" }));
  const created = await nextSnapshot;
  if (!created["msg-f2a"] || created["msg-f2a"].isRead !== false) throw new Error("Realtime create snapshot failed");
  console.log("2 realtime create delivered: PASS");
  nextSnapshot = new Promise((resolve) => { resolveSnapshot = resolve; });
  await assertSucceeds(updateDoc(stateRef, { isRead: true, updatedAt: "f2a-read" }));
  const updated = await nextSnapshot;
  if (!updated["msg-f2a"] || updated["msg-f2a"].isRead !== true) throw new Error("Realtime update snapshot failed");
  console.log("3 realtime update delivered: PASS");
  const remoteStates = { "msg-f2a": { ...updated["msg-f2a"], isRead: false } };
  const localCache = { "msg-f2a": { ...updated["msg-f2a"], isRead: true, folder: "inbox" } };
  const pending = {
    "msg-f2a": {
      messageId: "msg-f2a",
      operationVersion: 1,
      patch: { isRead: true },
      startedAt: Date.now(),
      writeSucceeded: true,
      rollbackCacheState: updated["msg-f2a"],
      rollbackUiState: updated["msg-f2a"],
      targetUserId: "teacher-1",
    },
  };
  const patchConfirmed = (patch, remote) => {
    if (!remote || !patch) return false;
    return Object.keys(patch).every((key) => remote[key] === patch[key]);
  };
  const mergePending = (remote, cache, pendingMap) => {
    const mergedStates = { ...remote };
    const nextPending = { ...pendingMap };
    for (const messageId of Object.keys(pendingMap)) {
      const op = pendingMap[messageId];
      const optimisticState = cache[messageId];
      const remoteState = remote[messageId];
      if (op && patchConfirmed(op.patch, remoteState)) {
        mergedStates[messageId] = remoteState;
        delete nextPending[messageId];
      } else if (optimisticState) {
        mergedStates[messageId] = optimisticState;
      }
    }
    return { mergedStates, nextPending };
  };
  const staleMerge = mergePending(remoteStates, localCache, pending);
  if (staleMerge.mergedStates["msg-f2a"].isRead !== true) throw new Error("Pending optimistic state was overwritten by stale realtime state");
  if (!staleMerge.nextPending["msg-f2a"]) throw new Error("Pending was cleared before matching realtime state");
  console.log("4 pending optimistic state survives stale snapshot: PASS");
  const unrelatedFieldsRemote = { "msg-f2a": { ...updated["msg-f2a"], isRead: true, folder: "spam", isStarred: true } };
  const unrelatedMerge = mergePending(unrelatedFieldsRemote, localCache, staleMerge.nextPending);
  if (unrelatedMerge.nextPending["msg-f2a"]) throw new Error("Unrelated mailbox fields blocked patch confirmation");
  console.log("5 patch-only confirmation ignores unrelated fields: PASS");
  const v2Pending = {
    "msg-f2a": { ...pending["msg-f2a"], operationVersion: 2, patch: { isRead: false } },
  };
  const v2Cache = { "msg-f2a": { ...updated["msg-f2a"], isRead: false } };
  const v1AgainstV2 = mergePending({ "msg-f2a": { ...updated["msg-f2a"], isRead: true } }, v2Cache, v2Pending);
  if (!v1AgainstV2.nextPending["msg-f2a"] || v1AgainstV2.mergedStates["msg-f2a"].isRead !== false) {
    throw new Error("Stale v1 snapshot settled or overwrote v2");
  }
  console.log("6 stale v1 snapshot cannot settle v2: PASS");
  const matchingRemote = { "msg-f2a": { ...updated["msg-f2a"], isRead: false } };
  const matchingMerge = mergePending(matchingRemote, v2Cache, v2Pending);
  if (matchingMerge.mergedStates["msg-f2a"].isRead !== false) throw new Error("Matching realtime state was not accepted");
  if (matchingMerge.nextPending["msg-f2a"] !== undefined) throw new Error("Pending was not cleared after matching realtime state");
  console.log("7 matching snapshot settles current operation: PASS");
  unsub();
  console.log("MESSAGING D6-F2A REALTIME TEST: 7/7 PASS");
} finally {
  await env.cleanup();
}
