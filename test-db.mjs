import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  const docRef = doc(db, "database/main");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    console.log("Version:", data.version);
    console.log("Students length:", data.data?.students?.length);
    console.log("Teachers length:", data.data?.teachers?.length);
  }
}
test();
