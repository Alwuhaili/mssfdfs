import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  const docRef = doc(db, "database/main");
  try {
    await updateDoc(docRef, {
      "data.sync_test_ping": Date.now(),
      version: 999,
      _timestamp: serverTimestamp()
    });
    console.log("updateDoc succeeded");
    process.exit(0);
  } catch (err) {
    console.error("updateDoc failed:", err.message);
    process.exit(1);
  }
}
setTimeout(() => { console.error("Timeout"); process.exit(1); }, 4000);
test();
