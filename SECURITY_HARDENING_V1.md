# Security Hardening V1 — Maysan Secondary School

## Implemented
- Replaced open Firestore rules with deny-by-default RBAC rules based on Firebase Authentication custom claims.
- Removed the legacy open-rules copy from the hardened distribution to prevent accidental deployment. The original uploaded ZIP remains the audit/recovery copy.
- Removed the fixed universal OTP bypass (`123456`).
- Removed client-supplied `customCode` from OTP generation.
- OTPs are now generated with Node `crypto.randomInt`, hashed in memory, and compared with `timingSafeEqual`.
- Failed OTP delivery no longer creates a valid OTP and the browser no longer reports false-success when the backend is unavailable.
- Ethereal preview mail is development-only; production fails closed if no trusted mail provider exists.
- OTP was removed from email subject lines.
- SMTP TLS certificate verification is enabled in production.
- SMS simulator no longer logs OTP values and does not report success in production.
- Added in-memory rate limits for OTP send/verify endpoints.
- Protected legacy `/api/data/*` maintenance endpoints with a server-only `ADMIN_API_KEY`.
- Database reset additionally requires `ALLOW_DATABASE_RESET=true` and an explicit confirmation header.
- Server-side sync no longer trusts `sourceUser.role` supplied by the browser.
- Removed `userPasscodes` from central sync hydration, backup export and backup import.
- Added response security headers in Express and Netlify.
- Reduced generic API JSON body limit from 50 MB to 1 MB.

## Required before deploying the new `firestore.rules`
The strict rules depend on Firebase Authentication and custom claims. Existing legacy passcodes are **not** sufficient.

1. Create/link a Firebase Auth account for every administrator/teacher/student/parent/supervisor.
2. Store the Firebase UID on the matching Firestore profile as `authUid` (or `uid`).
3. Set a custom claim such as `role: 'admin'`, `role: 'teacher'`, etc. using a trusted Admin SDK environment.
4. For relation-scoped records (attendance, submissions, messages, notifications, finance, certificates), populate the relevant `*AuthUid` linkage fields used by the rules.
5. Test with Firebase Emulator Suite before deploying rules.
6. After migration, delete the legacy `userPasscodes` settings document from Firestore using an authenticated admin migration—not from the browser.

## Important transitional limitation
The UI still contains legacy passcode-based login components for compatibility. V1 stops synchronizing/exporting those secrets, but a complete production security model requires Security Hardening V2: replace RoleAuthModal/passcode management with Firebase Authentication, MFA for administrators, and server-side account provisioning.

## Private data removed from the web source bundle
- Production `initialData.ts` no longer embeds teacher/student/parent/attendance/graduate/supervisor/notification identity records.
- Legacy local JSON database snapshots were intentionally removed from the hardened distribution. The original uploaded ZIP remains the recovery copy.
- The optional Express `CentralDataStore` now reads from `SCHOOL_DATA_DIR` (default `.runtime-data`) so runtime records are not stored in the source/deploy tree.

## Migration tooling
The one-time Firebase Auth migration scripts require `firebase-admin`. Install it locally with `npm install --no-save firebase-admin`; it is intentionally not part of the production web dependency lock.
