import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
console.log("Config used:", config.projectId, config.firestoreDatabaseId);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function run() {
  console.log("Reading backup...");
  const data = JSON.parse(fs.readFileSync('db-backup.json', 'utf8'));
  console.log("Parsed backup, size:", Object.keys(data.data || {}).length);
  const docRef = doc(db, "database/main");
  try {
    console.log("Setting doc...");
    await setDoc(docRef, data);
    console.log("Set doc SUCCESS!");
    process.exit(0);
  } catch(e) {
    console.error("Set doc FAILED!", e.message);
    process.exit(1);
  }
}
run();
setTimeout(() => { console.error("TIMEOUT!"); process.exit(1); }, 10000);
