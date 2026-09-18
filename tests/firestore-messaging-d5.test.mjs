import fs from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) {
  throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
}
const [host, portText] = HOST.split(":");
const port = Number(portText);
const rules = fs.readFileSync("firestore.rules", "utf8");

const env = await initializeTestEnvironment({
  projectId: "messaging-d5-emulator-only",
  firestore: { host, port, rules },
});

const senderUid = "uid-sender";
const recipient1Uid = "uid-recipient-1";
const recipient2Uid = "uid-recipient-2";
const outsiderUid = "uid-outsider";

try {
  await env.clearFirestore();

  const senderDb = env.authenticatedContext(senderUid, { role: "teacher" }).firestore();
  const recipient1Db = env.authenticatedContext(recipient1Uid, { role: "teacher" }).firestore();
  const recipient2Db = env.authenticatedContext(recipient2Uid, { role: "parent" }).firestore();
  const outsiderDb = env.authenticatedContext(outsiderUid, { role: "student" }).firestore();

  await assertSucceeds(setDoc(doc(senderDb, "messages/d5-group"), {
    id: "msg-2000000000000-d5test",
    senderAuthUid: senderUid,
    senderId: "teacher-1",
    senderName: "Sender",
    receiverId: "group",
    receiverName: "Group",
    recipientAuthUids: [recipient1Uid, recipient2Uid],
    subject: "D5 group test",
    content: "emulator only",
    timestamp: "test",
    isRead: false,
    folder: "sent",
    isDraft: false,
    isSpam: false,
  }));

  await assertSucceeds(getDoc(doc(senderDb, "messages/d5-group")));
  await assertSucceeds(getDoc(doc(recipient1Db, "messages/d5-group")));
  await assertSucceeds(getDoc(doc(recipient2Db, "messages/d5-group")));
  await assertFails(getDoc(doc(outsiderDb, "messages/d5-group")));

  const recipientQuery = query(
    collection(recipient1Db, "messages"),
    where("recipientAuthUids", "array-contains", recipient1Uid)
  );
  const recipientSnap = await assertSucceeds(getDocs(recipientQuery));
  if (recipientSnap.size !== 1) throw new Error(`Expected 1 recipient result, got ${recipientSnap.size}`);

  const outsiderQuery = query(
    collection(outsiderDb, "messages"),
    where("recipientAuthUids", "array-contains", outsiderUid)
  );
  const outsiderSnap = await assertSucceeds(getDocs(outsiderQuery));
  if (outsiderSnap.size !== 0) throw new Error(`Expected 0 outsider results, got ${outsiderSnap.size}`);

  console.log("MESSAGING D5-A EMULATOR TEST: PASS");
  console.log("1 sender create: PASS");
  console.log("2 sender read: PASS");
  console.log("3 recipient-1 direct read: PASS");
  console.log("4 recipient-2 direct read: PASS");
  console.log("5 outsider direct read denied: PASS");
  console.log("6 recipient array-contains query: PASS");
  console.log("7 outsider scoped query empty: PASS");
} finally {
  await env.cleanup();
}
