import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, inMemoryPersistence, setPersistence, signOut } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined;
if (appCheckSiteKey && typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('[AppCheck] Initialization failed:', error);
  }
}

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const storage = getStorage(app);

export const auth = getAuth(app);

/**
 * Security Hardening V1:
 * Authentication is intentionally page-memory-only. A typed URL, QR scan, refresh,
 * closed/reopened tab, or browser restart must begin as a guest and require a fresh login.
 * This also clears any legacy Firebase Auth session that may have been persisted previously.
 */
export const authIsolationReady = (async () => {
  try {
    await setPersistence(auth, inMemoryPersistence);
    // Wait for Firebase Auth to finish restoring any previously persisted session
    // before clearing it. This closes the refresh/typed-URL/QR auto-login race.
    await auth.authStateReady();
    if (auth.currentUser) await signOut(auth);
  } catch (error) {
    console.warn('[FirebaseAuth] Could not enforce in-memory session isolation:', error);
  }
})();
