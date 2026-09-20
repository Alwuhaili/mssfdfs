import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
const [host, portText] = HOST.split(":");
const rules = fs.readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({ projectId: "messaging-d6a-emulator-only", firestore: { host, port: Number(portText), rules } });

const u1 = "uid-recipient-1";
const u2 = "uid-recipient-2";
const sender = "uid-sender";

try {
  await env.clearFirestore();
  const db1 = env.authenticatedContext(u1, { role: "teacher" }).firestore();
  const db2 = env.authenticatedContext(u2, { role: "parent" }).firestore();
  const sdb = env.authenticatedContext(sender, { role: "teacher" }).firestore();
  const r1 = doc(db1, "messageUserStates/uid-recipient-1/items/msg-d6a");
  const r2 = doc(db2, "messageUserStates/uid-recipient-2/items/msg-d6a");

  await assertSucceeds(setDoc(r1, { messageId: "msg-d6a", ownerAuthUid: u1, folder: "inbox", isRead: false, isStarred: false, isTrash: false, isSpam: false, isArchived: false, isDeleted: false, updatedAt: "test" }));
  console.log("1 owner create: PASS");
  await assertSucceeds(getDoc(r1));
  console.log("2 owner read: PASS");
  await assertSucceeds(updateDoc(r1, { isRead: true }));
  console.log("3 owner mark read: PASS");
  await assertSucceeds(updateDoc(r1, { isStarred: true }));
  console.log("4 owner star: PASS");
  await assertSucceeds(updateDoc(r1, { folder: "trash", isTrash: true }));
  console.log("5 owner trash: PASS");
  await assertFails(getDoc(doc(db2, "messageUserStates/uid-recipient-1/items/msg-d6a")));
  console.log("6 other user read denied: PASS");
  await assertFails(updateDoc(doc(db2, "messageUserStates/uid-recipient-1/items/msg-d6a"), { isRead: false }));
  console.log("7 other user update denied: PASS");
  await assertFails(updateDoc(r1, { ownerAuthUid: u2 }));
  console.log("8 ownerAuthUid immutable: PASS");
  await assertFails(updateDoc(r1, { messageId: "other" }));
  console.log("9 messageId immutable: PASS");
  await assertFails(updateDoc(r1, { evilField: true }));
  console.log("10 unknown field denied: PASS");
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "messages/msg-d6a"), { id: "msg-d6a", senderAuthUid: sender, receiverAuthUid: u1, senderId: "teacher-1", subject: "test", content: "test" }); });
  await assertFails(updateDoc(doc(db1, "messages/msg-d6a"), { content: "hacked" }));
  console.log("11 recipient cannot update shared message: PASS");
  await assertSucceeds(setDoc(r2, { messageId: "msg-d6a", ownerAuthUid: u2, folder: "inbox", isRead: false, isStarred: false, isTrash: false, isSpam: false, isArchived: false, isDeleted: false, updatedAt: "test" }));
  const snap1 = await getDoc(r1);
  const snap2 = await getDoc(r2);
  if (snap1.data().isRead !== true || snap2.data().isRead !== false) throw new Error("Mailbox state isolation failed");
  console.log("12 per-user state isolation: PASS");
  console.log("MESSAGING D6-A EMULATOR TEST: 12/12 PASS");
} finally {
  await env.cleanup();
}
