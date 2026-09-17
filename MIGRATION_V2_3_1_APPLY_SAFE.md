# Migration V2.3.1 — Apply-Safe / Crash-Recovery

Safety changes over V2.3:

- Full preflight remains mandatory before apply.
- Stable usernames remain role + profileId based; names are never login usernames.
- Shared legacy identifiers remain excluded from authDirectory.
- Temporary password is persisted in a local mode-0600 recovery journal BEFORE Firebase Auth createUser.
- Recovery journal is updated after each state transition: PENDING → PASSWORD_JOURNALED → AUTH_CREATED/AUTH_RECOVERED → CLAIMS_SET → COMPLETED.
- Secrets CSV is rebuilt incrementally from the recovery journal for accounts created by this migration.
- Apply re-reads identity fields and aborts if they changed after preflight.
- authUid ownership and authDirectory ownership are rechecked at apply time.
- Firestore profile linkage and selected authDirectory aliases are committed in one transaction per account.
- Existing unrelated Firebase custom claims are preserved.
- Reruns reuse deterministic Auth email, existing authUid, and the local recovery journal.

## Files containing secrets

`AUTH_MIGRATION_V231_RECOVERY.json` and `AUTH_MIGRATION_SECRETS_V231.csv` are local sensitive files. Keep them off Git/source control and cloud sync. Delete them securely only after post-migration verification and credential distribution/password reset are complete.

## First command

Run preflight only:

`npm run migrate:auth:preflight`

Do not run apply until the preflight output has been reviewed and reports zero blocking conflicts.

## Login Flow hardening patch
This release artifact also includes the Firebase-first login-flow patch documented in `LOGIN_FLOW_V2_3_1_AUDIT.md`.
