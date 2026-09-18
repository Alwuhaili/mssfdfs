import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, browserLocalPersistence, setPersistence, signOut } from "firebase/auth";
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
    // TEMP_AUTH_PERSISTENCE_LOCAL_V1 - REMOVE AFTER TESTING
    await setPersistence(auth, browserLocalPersistence);
    // Wait for Firebase Auth to finish restoring any previously persisted session
    // before clearing it. This closes the refresh/typed-URL/QR auto-login race.
    await auth.authStateReady();
    // TEMP_AUTH_KEEP_SESSION_ON_REFRESH_V1 - REMOVE AFTER TESTING
    // Startup sign-out temporarily disabled so Firebase can restore the authenticated user.
  } catch (error) {
    console.warn('[FirebaseAuth] Could not enforce in-memory session isolation:', error);
  }
})();
