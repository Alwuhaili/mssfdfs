import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function run() {
  const docRef = doc(db, "database/main");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    fs.writeFileSync('db-backup.json', JSON.stringify(snap.data(), null, 2));
    console.log("Backed up successfully to db-backup.json");
    process.exit(0);
  } else {
    console.log("No data found");
    process.exit(1);
  }
}
run();
