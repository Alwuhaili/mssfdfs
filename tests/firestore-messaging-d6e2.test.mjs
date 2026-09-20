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
  updateDoc,
  deleteDoc,
  deleteField,
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
  projectId: "messaging-d6e2-emulator-only",
  firestore: { host, port, rules },
});

const senderUid = "uid-sender";
const recipient1Uid = "uid-recipient-1";
const recipient2Uid = "uid-recipient-2";
const outsiderUid = "uid-outsider";

try {
  await env.clearFirestore();

  const senderDb = env.authenticatedContext(senderUid, { role: "teacher" }).firestore();
  const recipientDb = env.authenticatedContext(recipient1Uid, { role: "parent" }).firestore();
  const adminDb = env.authenticatedContext("uid-admin", { role: "admin" }).firestore();

  const base = {
    id: "d6e2-direct", senderAuthUid: senderUid, senderId: "teacher-1", senderName: "Sender",
    receiverId: "parent-1", receiverAuthUid: recipient1Uid, receiverName: "Recipient",
    subject: "D6-E2", content: "safe", timestamp: "test", isRead: false
  };

  await assertSucceeds(setDoc(doc(senderDb, "messages/d6e2-direct"), base));
  console.log("1 valid direct create: PASS");

  await assertSucceeds(setDoc(doc(senderDb, "messages/d6e2-group"), { ...base, id: "d6e2-group", receiverId: "broadcast", recipientAuthUids: [recipient1Uid, recipient2Uid] }));
  console.log("2 valid group/broadcast create: PASS");

  await assertFails(setDoc(doc(senderDb, "messages/d6e2-spoof"), { ...base, id: "d6e2-spoof", senderAuthUid: outsiderUid }));
  console.log("3 spoofed senderAuthUid denied: PASS");

  await assertFails(setDoc(doc(senderDb, "messages/d6e2-userstates"), { ...base, id: "d6e2-userstates", userStates: { x: { isRead: true } } }));
  console.log("4 create userStates denied: PASS");

  await assertFails(updateDoc(doc(senderDb, "messages/d6e2-direct"), { senderAuthUid: outsiderUid }));
  console.log("5 senderAuthUid mutation denied: PASS");

  await assertFails(updateDoc(doc(senderDb, "messages/d6e2-direct"), { userStates: { x: { isRead: true } } }));
  console.log("6 update userStates denied: PASS");

  await assertFails(setDoc(doc(senderDb, "messages/d6e2-bad-list"), { ...base, id: "d6e2-bad-list", recipientAuthUids: "not-a-list" }));
  console.log("7 invalid recipientAuthUids denied: PASS");

  await assertFails(setDoc(doc(senderDb, "messages/d6e2-bad-receiver"), { ...base, id: "d6e2-bad-receiver", receiverAuthUid: 12345 }));
  console.log("8 invalid receiverAuthUid denied: PASS");

  await assertSucceeds(updateDoc(doc(senderDb, "messages/d6e2-direct"), { subject: "updated safely", content: "updated safely" }));
  console.log("9 legitimate sender update: PASS");

  await assertFails(deleteDoc(doc(recipientDb, "messages/d6e2-direct")));
  console.log("10 recipient delete denied: PASS");

  await assertFails(setDoc(doc(adminDb, "messages/d6e2-admin-spoof"), { ...base, id: "d6e2-admin-spoof", senderAuthUid: outsiderUid }));
  console.log("11 admin spoofed senderAuthUid denied: PASS");

  await assertSucceeds(deleteDoc(doc(senderDb, "messages/d6e2-direct")));
  console.log("12 sender delete own message: PASS");

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "messages/d6e2-legacy"), {
      ...base,
      id: "d6e2-legacy",
      userStates: { legacyProfile: { isRead: true, isStarred: false } }
    });
  });

  await assertSucceeds(updateDoc(doc(senderDb, "messages/d6e2-legacy"), { subject: "legacy safe update" }));
  console.log("13 unchanged legacy userStates allowed: PASS");

  await assertFails(updateDoc(doc(senderDb, "messages/d6e2-legacy"), { userStates: { legacyProfile: { isRead: false, isStarred: true } } }));
  console.log("14 legacy userStates mutation denied: PASS");

  await assertSucceeds(updateDoc(doc(senderDb, "messages/d6e2-legacy"), { userStates: deleteField() }));
  console.log("15 legacy userStates removal allowed: PASS");

  console.log("MESSAGING D6-E2 EMULATOR TEST: 15/15 PASS");

} finally {
  await env.cleanup();
}
