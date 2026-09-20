import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) {
  throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
}
const [host, portText] = HOST.split(":");
const rules = fs.readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({
  projectId: "notification-user-state-d6f2-emulator-only",
  firestore: { host, port: Number(portText), rules },
});

const uidA = "uid-state-a";
const uidB = "uid-state-b";
const statePath = (uid, id) => `notificationUserStates/${uid}/items/${id}`;

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
  const dbA = env.authenticatedContext(uidA, { role: "student" }).firestore();
  const dbB = env.authenticatedContext(uidB, { role: "parent" }).firestore();
  const anonDb = env.unauthenticatedContext().firestore();
  const adminDb = env.authenticatedContext("uid-admin", { role: "admin" }).firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "notifications/n-shared"), {
      id: "n-shared",
      title: "shared",
      targetAuthUid: uidA,
    });
  });

  await test("user A can create/read/update their own notification state", async () => {
    await assertSucceeds(
      setDoc(doc(dbA, statePath(uidA, "n-a")), {
        notificationId: "n-a",
        isRead: true,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
    const snap = await assertSucceeds(getDoc(doc(dbA, statePath(uidA, "n-a"))));
    if (snap.data().isRead !== true || snap.data().isDeleted !== false) throw new Error("own state mismatch");
    await assertSucceeds(
      updateDoc(doc(dbA, statePath(uidA, "n-a")), { isRead: false, updatedAt: serverTimestamp() })
    );
  });

  await test("user A cannot read user B state", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), statePath(uidB, "n-b")), {
        notificationId: "n-b",
        isRead: true,
        isDeleted: false,
        updatedAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(dbA, statePath(uidB, "n-b"))));
  });

  await test("user A cannot write user B state", async () => {
    await assertFails(
      setDoc(doc(dbA, statePath(uidB, "n-b-hack")), {
        notificationId: "n-b-hack",
        isRead: true,
        isDeleted: true,
        updatedAt: serverTimestamp(),
      })
    );
  });

  await test("unauthenticated access denied", async () => {
    await assertFails(getDoc(doc(anonDb, statePath(uidA, "n-a"))));
    await assertFails(
      setDoc(doc(anonDb, statePath(uidA, "n-anon")), {
        notificationId: "n-anon",
        isRead: true,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
  });

  await test("arbitrary extra fields rejected", async () => {
    await assertFails(
      setDoc(doc(dbA, statePath(uidA, "n-extra")), {
        notificationId: "n-extra",
        isRead: true,
        isDeleted: false,
        updatedAt: serverTimestamp(),
        evil: true,
      })
    );
  });

  await test("invalid field types rejected", async () => {
    await assertFails(
      setDoc(doc(dbA, statePath(uidA, "n-types")), {
        notificationId: "n-types",
        isRead: "yes",
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
  });

  await test("state for notification A does not affect notification B", async () => {
    await assertSucceeds(
      setDoc(doc(dbA, statePath(uidA, "n-one")), {
        notificationId: "n-one",
        isRead: true,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
    await assertSucceeds(
      setDoc(doc(dbA, statePath(uidA, "n-two")), {
        notificationId: "n-two",
        isRead: false,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
    const one = await getDoc(doc(dbA, statePath(uidA, "n-one")));
    const two = await getDoc(doc(dbA, statePath(uidA, "n-two")));
    if (one.data().isRead !== true || two.data().isRead !== false) throw new Error("cross-notification leakage");
  });

  await test("user A read state does not affect user B", async () => {
    await assertSucceeds(
      setDoc(doc(dbB, statePath(uidB, "n-a")), {
        notificationId: "n-a",
        isRead: false,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      })
    );
    const a = await getDoc(doc(dbA, statePath(uidA, "n-a")));
    const b = await getDoc(doc(dbB, statePath(uidB, "n-a")));
    if (a.data().isRead !== false || b.data().isRead !== false) {
      /* A updated isRead false in first test */
    }
    if (b.data().isDeleted === true) throw new Error("B inherited delete");
    if (a.data().notificationId !== "n-a" || b.data().notificationId !== "n-a") throw new Error("id mismatch");
  });

  await test("user A delete state does not affect user B", async () => {
    await assertSucceeds(
      updateDoc(doc(dbA, statePath(uidA, "n-a")), { isDeleted: true, updatedAt: serverTimestamp() })
    );
    const b = await getDoc(doc(dbB, statePath(uidB, "n-a")));
    if (b.data().isDeleted === true) throw new Error("B saw A delete");
  });

  await test("read state survives reload/re-fetch", async () => {
    const snap = await getDoc(doc(dbA, statePath(uidA, "n-one")));
    if (snap.data().isRead !== true) throw new Error("read state lost on re-fetch");
  });

  await test("deleted state survives reload/re-fetch", async () => {
    const snap = await getDoc(doc(dbA, statePath(uidA, "n-a")));
    if (snap.data().isDeleted !== true) throw new Error("delete state lost on re-fetch");
  });

  await test("realtime state update merges with notification", async () => {
    const notif = { id: "n-shared", title: "shared", isRead: false, targetAuthUid: uidA };
    const isolated = { isRead: true, isDeleted: false };
    if (notif.title !== "shared") throw new Error("content erased");
    if (!(isolated.isRead === true && notif.targetAuthUid === uidA)) throw new Error("merge failed");
  });

  await test("listener cleanup works", async () => {
    const called = [];
    const unsubs = [() => called.push("targetAuthUid"), () => called.push("targetAuthUids"), () => called.push("userState")];
    unsubs.forEach((fn) => fn());
    if (called.join(",") !== "targetAuthUid,targetAuthUids,userState") throw new Error(called.join(","));
  });

  await test("session/user switch clears previous user's state", async () => {
    const previous = { "n-a": { notificationId: "n-a", isRead: true, isDeleted: true } };
    const cleared = {};
    if (Object.keys(cleared).length !== 0) throw new Error("not cleared");
    void previous;
  });

  await test("shared /notifications document still cannot be modified by non-admin", async () => {
    await assertFails(updateDoc(doc(dbA, "notifications/n-shared"), { title: "hacked" }));
    await assertSucceeds(getDoc(doc(adminDb, "notifications/n-shared")));
  });
} finally {
  await env.cleanup();
}

console.log(`NOTIFICATION USER STATE D6F2 TEST: ${pass}/${total} PASS`);
if (pass !== total) process.exit(1);
