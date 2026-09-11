import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function check() {
  const docRef = doc(db, "database/main");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("Data exists, Version:", snap.data().version);
    process.exit(0);
  } else {
    console.log("No data found! Restoring from backup again...");
    try {
       const data = JSON.parse(fs.readFileSync('db-backup.json', 'utf8'));
       await setDoc(docRef, data);
       console.log("Restored successfully.");
       process.exit(0);
    } catch(e) {
       console.error("Restore failed:", e);
       process.exit(1);
    }
  }
}
check();
