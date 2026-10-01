/**
 * Firebase Admin adapter for NEW account provisioning.
 * Never import this file from src/ or any browser bundle.
 * Credentials come only from FIREBASE_SERVICE_ACCOUNT_JSON or Application Default Credentials.
 */
import fs from 'node:fs';
import path from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { ACCOUNT_PROVISION_MESSAGES, AccountPolicyError, assertCanProvision, messageForAliasField } from '../src/utils/newAccountPolicy.js';
import {
  ProvisionError,
  type AccountStore,
  type AuthGateway,
  type PlannedWrite,
} from './accountProvisioningCore.js';

const PUBLIC_PROJECT_DEFAULTS = {
  projectId: 'jaunty-ellipse-b8chg',
  firestoreDatabaseId: 'ai-studio-maysansecondarys-86fbb526-029b-4543-9539-440c4258ecaf',
};

const loadPublicFirebaseConfig = () => {
  const configured = {
    projectId: process.env.FIREBASE_PROJECT_ID || PUBLIC_PROJECT_DEFAULTS.projectId,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || PUBLIC_PROJECT_DEFAULTS.firestoreDatabaseId,
  };
  try {
    const file = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(file)) return configured;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || String(parsed.projectId || configured.projectId),
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || String(parsed.firestoreDatabaseId || configured.firestoreDatabaseId),
    };
  } catch {
    return configured;
  }
};

const notConfigured = () =>
  new ProvisionError('NOT_CONFIGURED', ACCOUNT_PROVISION_MESSAGES.notConfigured, 503);

let backendPromise: Promise<{ auth: AuthGateway; store: AccountStore; verifyAdmin: (authorization?: string) => Promise<{ uid: string; name?: string }> }> | null = null;

const readServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return cert(JSON.parse(raw));
  } catch {
    throw notConfigured();
  }
};

export function getProvisioningBackend() {
  if (!backendPromise) {
    backendPromise = Promise.resolve().then(() => {
      const credential = readServiceAccount();
      const hasAdc = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (!credential && !hasAdc) throw notConfigured();
      const config = loadPublicFirebaseConfig();
      const app = getApps()[0] || initializeApp({
        credential: credential || applicationDefault(),
        projectId: config.projectId,
      });
      const auth = getAuth(app);
      const db: Firestore = config.firestoreDatabaseId
        ? getFirestore(app, config.firestoreDatabaseId)
        : getFirestore(app);

      const authGateway: AuthGateway = {
        async createUser(input) {
          try {
            const user = await auth.createUser({
              email: input.email,
              password: input.password,
              displayName: input.displayName,
              emailVerified: false,
              disabled: false,
            });
            return { uid: user.uid };
          } catch {
            throw new ProvisionError('AUTH_CREATE_FAILED', ACCOUNT_PROVISION_MESSAGES.authFailed, 500);
          }
        },
        async setClaims(uid, claims) {
          await auth.setCustomUserClaims(uid, {
            role: claims.role,
            profileId: claims.profileId,
            profileCollection: claims.profileCollection,
          });
        },
        async deleteUser(uid) {
          try {
            await auth.deleteUser(uid);
          } catch (error: any) {
            if (error?.code === 'auth/user-not-found') return;
            throw error;
          }
        },
      };

      const store: AccountStore = {
        async getExisting(refs) {
          const snaps = await Promise.all(refs.map((ref) => db.collection(ref.collection).doc(ref.id).get()));
          return snaps.map((snap, index) => ({
            collection: refs[index].collection,
            id: refs[index].id,
            exists: snap.exists,
          }));
        },
        async createAll(docs: PlannedWrite[]) {
          try {
            await db.runTransaction(async (tx) => {
              const snaps = [];
              for (const doc of docs) {
                snaps.push({ doc, snap: await tx.get(db.collection(doc.collection).doc(doc.id)) });
              }
              for (const item of snaps) {
                if (item.snap.exists && !item.doc.optional) {
                  throw new Error(`PROVISION_CONFLICT:${item.doc.conflictField}`);
                }
              }
              for (const item of snaps) {
                if (item.snap.exists) continue;
                tx.set(item.snap.ref, item.doc.data);
              }
            });
          } catch (error: any) {
            const match = String(error?.message || '').match(/PROVISION_CONFLICT:([A-Za-z]+)/);
            if (match) {
              throw new ProvisionError('ALIAS_TAKEN', messageForAliasField(match[1]), 409);
            }
            if (error instanceof ProvisionError) throw error;
            throw new ProvisionError('SAVE_FAILED', ACCOUNT_PROVISION_MESSAGES.rolledBack, 500);
          }
        },
      };

      return {
        auth: authGateway,
        store,
        verifyAdmin: async (authorization?: string) => {
          const token = String(authorization || '').replace(/^Bearer\s+/i, '').trim();
          if (!token) throw new AccountPolicyError('FORBIDDEN', ACCOUNT_PROVISION_MESSAGES.forbidden);
          try {
            const decoded = await auth.verifyIdToken(token, true);
            assertCanProvision(decoded as unknown as Record<string, unknown>);
            const name = typeof decoded.name === 'string' && decoded.name.trim()
              ? decoded.name.trim().slice(0, 120)
              : 'إدارة المدرسة';
            return { uid: decoded.uid, name };
          } catch (error) {
            if (error instanceof AccountPolicyError) throw error;
            throw new AccountPolicyError('FORBIDDEN', ACCOUNT_PROVISION_MESSAGES.forbidden);
          }
        },
      };
    }).catch((error) => {
      backendPromise = null;
      throw error;
    });
  }
  return backendPromise;
}
