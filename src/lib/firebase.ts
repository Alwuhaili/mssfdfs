import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// The config file includes firestoreDatabaseId when a non-default database is created.
const app = initializeApp(firebaseConfig);

// If firestoreDatabaseId is provided, we must use it, otherwise use default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
