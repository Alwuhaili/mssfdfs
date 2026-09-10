import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function migrate() {
  const dataStr = readFileSync('./data/maysan_school_database.json', 'utf8');
  const localDb = JSON.parse(dataStr);
  const data = localDb.data || {};
  
  for (const t of (data.teachers || [])) {
    await setDoc(doc(db, 'teachers', t.id), t);
  }
  for (const s of (data.students || [])) {
    await setDoc(doc(db, 'students', s.id), s);
  }
  console.log("Migrated teachers and students to collections");
  process.exit(0);
}
migrate();
