# Authentication Migration V2.2 — Diagnostic Resolver

Run read-only preflight first:

    npm run migrate:auth:preflight

V2.2 policy:
- Source Firestore profiles are never changed during preflight.
- Only identifiers unique across all accounts are eligible for `authDirectory`.
- Any normalized identifier shared by two or more accounts is excluded from `authDirectory` for every owner.
- Verified Parent↔Student duplicates are classified as `FAMILY_SHARED_IDENTIFIER`.
- Parent↔Parent duplicates are classified as `PARENT_SHARED_IDENTIFIER`.
- Cross-field collisions such as Student nationalId == Parent phone are classified and excluded rather than guessed.
- A local masked `AUTH_MIGRATION_DIAGNOSTIC_*.json` report is generated. This is a local filesystem write only; it does not write Firebase Auth or Firestore.
- Existing `authDirectory`, `authUid`, Firebase Auth UID/email, and migration custom-claim ownership conflicts remain blocking.
- Apply is idempotent-oriented but not globally atomic across Firebase Auth and Firestore.

Do not run `npm run migrate:auth` until the preflight output has been reviewed and reports zero blocking conflicts.
