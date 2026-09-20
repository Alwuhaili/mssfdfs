import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) {
  throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
}
const [host, portText] = HOST.split(":");
const rules = fs.readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({
  projectId: "notifications-d6f2-emulator-only",
  firestore: { host, port: Number(portText), rules },
});

const recipient = "uid-n1";
const other = "uid-n2";
const outsider = "uid-n3";
const adminUid = "uid-admin";

function mergeNotificationRealtimeBuckets(buckets) {
  const merged = new Map();
  for (const items of Object.values(buckets)) {
    for (const item of items || []) {
      const id = typeof item?.id === "string" && item.id.trim() ? item.id : "";
      if (!id) continue;
      merged.set(id, item);
    }
  }
  return [...merged.values()];
}

let pass = 0;
let total = 0;
async function test(name, fn) {
  total++;
  try {
    await fn();
    pass++;
    console.log("PASS", name);
  } catch (err) {
    console.error("FAIL", name, err.message);
  }
}

try {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "notifications/n-single"), {
      id: "n-single",
      title: "single",
      targetAuthUid: recipient,
    });
    await setDoc(doc(db, "notifications/n-multi"), {
      id: "n-multi",
      title: "multi",
      targetAuthUids: [recipient, other],
    });
    await setDoc(doc(db, "notifications/n-legacy"), {
      id: "n-legacy",
      title: "legacy",
      targetRole: "student",
      targetStudentId: "s1",
    });
  });

  const recDb = env.authenticatedContext(recipient, { role: "student" }).firestore();
  const otherDb = env.authenticatedContext(other, { role: "parent" }).firestore();
  const outDb = env.authenticatedContext(outsider, { role: "teacher" }).firestore();
  const adminDb = env.authenticatedContext(adminUid, { role: "admin" }).firestore();
  const anonDb = env.unauthenticatedContext().firestore();

  await test("single targetAuthUid recipient can read", async () => {
    await assertSucceeds(getDoc(doc(recDb, "notifications/n-single")));
  });
  await test("wrong UID cannot read", async () => {
    await assertFails(getDoc(doc(outDb, "notifications/n-single")));
  });
  await test("targetAuthUids member can read", async () => {
    await assertSucceeds(getDoc(doc(recDb, "notifications/n-multi")));
    await assertSucceeds(getDoc(doc(otherDb, "notifications/n-multi")));
  });
  await test("non-member cannot read", async () => {
    await assertFails(getDoc(doc(outDb, "notifications/n-multi")));
  });
  await test("unauthenticated user cannot read", async () => {
    await assertFails(getDoc(doc(anonDb, "notifications/n-single")));
  });
  await test("admin behavior remains valid", async () => {
    await assertSucceeds(getDoc(doc(adminDb, "notifications/n-single")));
    await assertSucceeds(getDoc(doc(adminDb, "notifications/n-multi")));
    await assertSucceeds(getDoc(doc(adminDb, "notifications/n-legacy")));
    await assertSucceeds(getDocs(collection(adminDb, "notifications")));
  });
  await test("non-admin cannot create arbitrary notification", async () => {
    await assertFails(
      setDoc(doc(recDb, "notifications/n-forged"), {
        id: "n-forged",
        title: "forged",
        targetAuthUid: recipient,
      })
    );
  });
  await test("non-admin cannot modify shared notification document", async () => {
    await assertFails(updateDoc(doc(recDb, "notifications/n-single"), { title: "hacked" }));
    await assertFails(updateDoc(doc(recDb, "notifications/n-single"), { isRead: true }));
  });
  await test("scoped read merges single + array targets", async () => {
    const singleQ = query(collection(recDb, "notifications"), where("targetAuthUid", "==", recipient));
    const multiQ = query(collection(recDb, "notifications"), where("targetAuthUids", "array-contains", recipient));
    const [singleSnap, multiSnap] = await Promise.all([getDocs(singleQ), getDocs(multiQ)]);
    const buckets = {
      targetAuthUid: singleSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      targetAuthUids: multiSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
    const merged = mergeNotificationRealtimeBuckets(buckets);
    const ids = merged.map((item) => item.id).sort();
    if (ids.join(",") !== "n-multi,n-single") throw new Error(`merged ids=${ids.join(",")}`);
  });
  await test("duplicate notification id is deduplicated", async () => {
    const merged = mergeNotificationRealtimeBuckets({
      targetAuthUid: [{ id: "n-dup", title: "a" }],
      targetAuthUids: [{ id: "n-dup", title: "b" }, { id: "n-other", title: "c" }],
    });
    if (merged.length !== 2) throw new Error(`expected 2, got ${merged.length}`);
    if (!merged.find((item) => item.id === "n-dup") || !merged.find((item) => item.id === "n-other")) {
      throw new Error("missing ids after dedupe");
    }
  });
  await test("realtime merge does not erase the other query's results", async () => {
    const buckets = {
      targetAuthUid: [{ id: "n-single", title: "single" }],
      targetAuthUids: [{ id: "n-multi", title: "multi" }],
    };
    buckets.targetAuthUid = [{ id: "n-single-updated", title: "updated" }];
    const merged = mergeNotificationRealtimeBuckets(buckets);
    const ids = merged.map((item) => item.id).sort();
    if (!ids.includes("n-multi") || !ids.includes("n-single-updated")) {
      throw new Error(`erased bucket: ${ids.join(",")}`);
    }
  });
  await test("listener cleanup covers both queries", async () => {
    const called = [];
    const unsubscribeRealtime = [
      () => called.push("targetAuthUid"),
      () => called.push("targetAuthUids"),
    ];
    unsubscribeRealtime.forEach((unsub) => unsub());
    if (called.join(",") !== "targetAuthUid,targetAuthUids") throw new Error(called.join(","));
  });

  await test("legacy UID-less notification is not readable by non-admin", async () => {
    await assertFails(getDoc(doc(recDb, "notifications/n-legacy")));
  });
} finally {
  await env.cleanup();
}

console.log(`NOTIFICATION D6F2 FIRESTORE TEST: ${pass}/${total} PASS`);
if (pass !== total) process.exit(1);
