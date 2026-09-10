import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_TEACHERS } from './src/data/initialData';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function updateTeachers() {
  try {
    const docRef = doc(db, 'database/main');
    const snapshot = await getDoc(docRef);
    let data = snapshot.exists() ? snapshot.data() : { data: {} };
    
    // Set teachers to ONLY what is in INITIAL_TEACHERS
    data.data.teachers = INITIAL_TEACHERS;
    
    // Also remove the virtual students if needed? The user explicitly said:
    // "حذف جميع حسابات واسماء المدرسات الافتراضيات"
    // "يرجى عمل كل ماهو مطلوب" (Remove virtual teachers).
    // Let's also check if they wanted student removal. "وكذلك حدث اسماء الطالبات" earlier, but now "حذف جميع حسابات واسماء المدرسات الافتراضيات". I will stick to teachers only as specifically requested right now.
    
    data.version = (data.version || 0) + 1;
    data.lastModified = new Date().toISOString();
    
    await setDoc(docRef, data);
    
    console.log("Virtual teachers successfully removed from Firebase! Count:", INITIAL_TEACHERS.length);
    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

updateTeachers();
