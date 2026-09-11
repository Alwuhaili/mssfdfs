import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  const docRef = doc(db, "database/main");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log("Version:", data.version);
    console.log("Students:", data.data?.students?.length);
    console.log("Teachers:", data.data?.teachers?.length);
  } else {
    console.log("No data");
  }
}
test();
