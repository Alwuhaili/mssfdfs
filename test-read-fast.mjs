import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function check() {
  const docRef = doc(db, "database/main");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("SUCCESS Data exists! Version:", snap.data().version);
    process.exit(0);
  } else {
    console.log("STILL NO DATA");
    process.exit(1);
  }
}
check();
