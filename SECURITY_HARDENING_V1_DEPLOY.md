# Security Hardening V1 — Deployment Order

> Important: do not deploy the strict Firestore rules before migrating accounts to Firebase Authentication.

## 1. Take an external Firestore backup
Create a Firebase/Google Cloud backup before changing authentication or rules. Do not use the old browser JSON backup as the security backup.

## 2. Enable Firebase Authentication
Enable Email/Password sign-in for project `jaunty-ellipse-b8chg`.

## 3. Prepare Admin SDK credentials locally
Download a service-account JSON from Firebase/Google Cloud to a private machine. Never upload it to Netlify or commit it.

Install the migration-only SDK locally:

```bash
npm install --no-save firebase-admin
```

Set:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/private/path/service-account.json
ADMIN_EMAIL=your-real-admin-login@example.com
ADMIN_INITIAL_PASSWORD='a-new-strong-temporary-password'
ADMIN_USERNAME=admin_maysan
FIREBASE_DATABASE_ID=ai-studio-maysansecondarys-86fbb526-029b-4543-9539-440c4258ecaf
```

## 4. Migrate existing accounts

```bash
npm run migrate:auth
```

The script:
- creates/links Firebase Auth users;
- assigns role/profile Custom Claims;
- writes `authUid` into Firestore profiles;
- creates hash-keyed `authDirectory` entries for email/username/phone/ID login;
- generates strong temporary passwords when an old passcode is too weak;
- outputs a local `AUTH_MIGRATION_SECRETS_*.csv` only for newly-created accounts.

Securely distribute temporary passwords, then delete that CSV.

## 5. Test authentication before closing Firestore
Test admin, one teacher, one student, one parent, and one supervisor. A page refresh must return to Guest mode and require login again.

## 6. Deploy strict rules
`firebase.json` points to the named Firestore database and `firestore.rules`.

```bash
firebase deploy --only firestore,storage
```

The old open rules are kept only as text under `security-audit/` and are not referenced by Firebase deployment configuration.

## 7. Configure Netlify/server environment
At minimum:

```bash
NODE_ENV=production
ADMIN_API_KEY=<32+ random bytes, server-only>
ALLOW_DATABASE_RESET=false
VITE_ALLOW_LEGACY_AUTH=false
VITE_ALLOW_CLIENT_SIDE_INTEGRATION_SECRETS=false
```

Recommended after App Check configuration:

```bash
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=<site-key>
```

Never expose `ADMIN_API_KEY`, SMTP password, Twilio auth token, Resend key, or service-account JSON as `VITE_*` variables.

## 8. Purge legacy plaintext passcodes
Only after Firebase Auth has been verified:

```bash
CONFIRM_PURGE_LEGACY_PASSCODES=YES node scripts/purge_legacy_passcodes.mjs
```

This removes only legacy passcode fields/documents. It does **not** delete `database/main` or migration metadata.

## 9. Production checks
- Opening the URL/QR shows Guest.
- No private school collection is fetched before login.
- Refresh after login returns to Guest.
- Wrong roles cannot read/write prohibited collections.
- `/api/data/*` returns 401/503 without the server admin key.
- `/api/data/reset` remains 403 unless deliberately enabled with both safeguards.
- OTP cannot use `123456` as a master code and cannot be client-selected.
