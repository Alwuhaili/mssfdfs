# Migration V2.3 — Stable Username + Unique Identity Enforcement

## Stable usernames
Names are never login identifiers. V2.3 generates deterministic usernames from role + immutable profile ID:
- `student-<profileId-with-role-prefix-removed>`
- `teacher-<...>`
- `parent-<...>`
- `supervisor-<...>`
- admin remains linked to the existing Firebase Auth account; a stable admin username alias is also supported.

The migration writes `username` into each profile only during APPLY, never during preflight.

## Identity uniqueness
For new/edit flows, email, phone and nationalId are normalized and checked across students, teachers, parents and supervisors. A record may keep its own current identifier during edit, but cannot take an identifier owned by another profile.

Arabic user-facing errors:
- Email: البريد الإلكتروني مستخدم بالفعل. إذا كان هذا البريد يعود لك، يرجى تسجيل الدخول بدل إنشاء حساب جديد.
- Phone: رقم الهاتف مستخدم بالفعل لحساب آخر. يرجى استخدام رقم هاتف آخر أو مراجعة الإدارة.
- National ID: رقم المعرّف مسجل بالفعل في النظام. لا يمكن إنشاء حساب آخر باستخدام المعرّف نفسه.

## Migration policy
- `name` is NEVER inserted into authDirectory.
- stable username is always an intended login alias.
- email/phone/nationalId are eligible only when globally unique in legacy data.
- legacy duplicates are not modified automatically; shared identifiers are excluded and reported.
- authUid/claims/authDirectory ownership conflicts remain blocking.

## Important enforcement boundary
The UI validation added to AppContext prevents ordinary create/edit flows from submitting duplicates. This is not a substitute for an atomic trusted-server reservation if multiple admins/devices can create users concurrently. Before production enrollment is opened broadly, move identity reservation + profile creation into one trusted server/Admin-SDK transaction or equivalent backend operation. Firestore profile data should not be treated as globally unique merely because the client checked it first.
