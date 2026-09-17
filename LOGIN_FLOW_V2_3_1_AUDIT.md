# Login Flow Audit — V2.3.1 Firebase-first

## Implemented
- Firebase Authentication is always attempted first through `FirebaseAuthService.login()`.
- `authDirectory/{sha256(normalizedIdentifier)}` resolves email / stable username / phone / nationalId / profileId without listing the directory.
- Firebase ID-token custom claims (`role`, `profileId`, `profileCollection`) are authoritative for role selection.
- Non-admin profiles are re-read after authentication and `profile.authUid` must match the Firebase UID.
- The UI derives `currentUser.role` from the authenticated account, not from cached/local role state.
- Firebase Auth uses in-memory persistence and now waits for `auth.authStateReady()` before signing out a restored session. Refresh, typed URL, QR scan, or reopened tab therefore starts as Guest.
- Legacy authentication is a temporary fallback only when BOTH Vite DEV mode and `VITE_ALLOW_LEGACY_AUTH=true` are present. Firebase is still attempted first.
- Legacy fallback no longer uses a role-wide/demo password as the final validator; an explicitly stored legacy per-user/admin passcode is required.
- Password/passcode auto-fill was removed from the login modal.

## Production policy
Set `VITE_ALLOW_LEGACY_AUTH=false` (or omit it) in Netlify/production. Because the code also requires `import.meta.env.DEV`, production builds cannot enter the legacy fallback path even if the variable is accidentally set to true.

## authDirectory design note
The current client-side Firebase email/password flow requires a pre-auth resolver, so Firestore rules permit GET of a known hashed alias but deny LIST. The resolver returns the internal Firebase auth email. This is materially safer than listing, but it is still an account-enumeration surface for guessable identifiers. A future hardening phase should move identifier resolution + sign-in mediation to a trusted backend if stronger anti-enumeration controls are required.

## Shared identifiers
Shared aliases excluded by Migration V2.3.1 remain non-login aliases. Affected users must use a unique stable username/profileId or another unique identifier.

## Verification status
Static source audit completed. Full TypeScript compilation was attempted but the extracted artifact does not contain a complete installed dependency tree; compilation reports missing project dependencies (React/Firebase/Express/etc.), so a clean `npm install` + production build must be run on the user's Windows copy before deployment.
