/**
 * Run ONLY after Firebase Auth migration has been tested successfully.
 * This removes legacy plaintext passcodes while preserving all other legacy data,
 * including the database/main document itself.
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

if (process.env.CONFIRM_PURGE_LEGACY_PASSCODES !== 'YES') {
  throw new Error('Set CONFIRM_PURGE_LEGACY_PASSCODES=YES after verifying Firebase Auth migration.');
}
const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceJson ? cert(JSON.parse(serviceJson)) : applicationDefault();
const app = getApps()[0] || initializeApp({ credential, projectId: config.projectId });
const databaseId = process.env.FIREBASE_DATABASE_ID || config.firestoreDatabaseId;
const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

const settingRef = db.collection('appSettings').doc('userPasscodes');
const settingSnap = await settingRef.get();
if (settingSnap.exists) await settingRef.delete();

const legacyRef = db.doc('database/main');
const legacySnap = await legacyRef.get();
if (legacySnap.exists && legacySnap.data()?.data?.userPasscodes !== undefined) {
  await legacyRef.update({ 'data.userPasscodes': FieldValue.delete() });
}

console.log('Legacy plaintext passcodes purged. database/main and all non-passcode legacy data were preserved.');
