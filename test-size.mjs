import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
const app = initializeApp(config);
const db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);

async function test() {
  try {
    const docRef = doc(db, "database/main");
    const snap = await getDoc(docRef);
    if(snap.exists()){
      const data = snap.data();
      const str = JSON.stringify(data);
      console.log("Document size in bytes:", str.length);
    } else {
      console.log("Document does not exist");
    }
    process.exit(0);
  } catch (err) {
    console.error("Firestore Error:", err.code, err.message);
    process.exit(1);
  }
}

test();
