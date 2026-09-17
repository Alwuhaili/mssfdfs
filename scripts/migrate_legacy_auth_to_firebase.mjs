/**
 * Security Hardening V1 - Authentication Migration V2.2 - Diagnostic Resolver
 *
 * Safety properties:
 *  - ALWAYS performs a complete read-only preflight before any write.
 *  - Aborts before the first write if any conflict is found.
 *  - Links the real, already-existing admin Firebase Auth account (ADMIN_EMAIL).
 *  - Classifies duplicate identifiers before any write.
 *  - Classifies every duplicate identifier without changing source profiles.
 *  - Only identifiers unique across accounts are eligible for authDirectory.
 *  - Any identifier shared across accounts is excluded from authDirectory for ALL owners.
 *  - Verified Parent↔Student sharing is labeled FAMILY_SHARED; other duplicates are labeled SHARED/AMBIGUOUS.
 *  - Generates a local read-only diagnostic report with masked values and relationship evidence.
 *  - Validates existing authUid values before changing anything.
 *  - Idempotent: safe to re-run after a successful or partially interrupted apply.
 *  - Generates strong temporary passwords only for newly-created non-admin users.
 *  - Writes AUTH_MIGRATION_SECRETS_*.csv only when such passwords were generated.
 *
 * Usage:
 *   # Read-only preflight (recommended first):
 *   npm run migrate:auth -- --dry-run
 *
 *   # Apply. A second complete preflight is performed automatically first:
 *   npm run migrate:auth
 *
 * Required:
 *   ADMIN_EMAIL=<real existing Firebase Auth admin email>
 *
 * Optional:
 *   ADMIN_USERNAME, ADMIN_PHONE, FIREBASE_DATABASE_ID,
 *   FIREBASE_SERVICE_ACCOUNT_JSON (otherwise Application Default Credentials)
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceJson ? cert(JSON.parse(serviceJson)) : applicationDefault();
const app = getApps()[0] || initializeApp({ credential, projectId: config.projectId });
const auth = getAuth(app);
const databaseId = process.env.FIREBASE_DATABASE_ID || config.firestoreDatabaseId;
const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('--preflight');
const PROFILE_COLLECTIONS = [
  ['teachers', 'teacher'],
  ['students', 'student'],
  ['parents', 'parent'],
  ['supervisors', 'supervisor'],
];
const ADMIN_PROFILE_ID = 'admin-main';
const ADMIN_ROLE = 'admin';

const normalize = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const hash = (v) => createHash('sha256').update(normalize(v)).digest('hex');
const randomPassword = () => `${randomBytes(18).toString('base64url')}!9Aa`;
const csvEscape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const maskedUid = (uid) => uid ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : '(none)';
const syntheticEmail = (role, profileId) => `u-${hash(`${role}:${profileId}`).slice(0, 32)}@auth.maysan.local`;

function addConflict(conflicts, code, subject, details) {
  conflicts.push({ code, subject, details });
}

async function getAuthByEmailOrNull(email) {
  try { return await auth.getUserByEmail(email); }
  catch (e) {
    if (e?.code === 'auth/user-not-found') return null;
    throw e;
  }
}

async function getAuthByUidOrNull(uid) {
  if (!uid) return null;
  try { return await auth.getUser(uid); }
  catch (e) {
    if (e?.code === 'auth/user-not-found') return null;
    throw e;
  }
}

function claimsConflict(user, expected) {
  const claims = user?.customClaims || {};
  const relevant = ['role', 'profileId', 'profileCollection'];
  const occupied = relevant.some((k) => claims[k] !== undefined && claims[k] !== null && claims[k] !== '');
  if (!occupied) return null;
  for (const key of relevant) {
    const actual = String(claims[key] ?? '');
    const wanted = String(expected[key] ?? '');
    if (actual !== wanted) return `${key}=${JSON.stringify(actual)} but expected ${JSON.stringify(wanted)}`;
  }
  return null;
}


function stableUsername(role, profileId) {
  const prefixes = { student: 'student', teacher: 'teacher', parent: 'parent', supervisor: 'supervisor', admin: 'admin' };
  const clean = String(profileId || '').trim().replace(/^(std|prt|tch|tea|sup|admin)-/i, '').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${prefixes[role] || role}-${clean}`.toLowerCase();
}

function directoryIdentifiers(account) {
  const p = account.profile || {};
  const values = [
    ['email', p.email],
    ['username', stableUsername(account.role, account.profileId)],
    ['phone', p.phone],
    ['nationalId', p.nationalId],
    ['profileId', account.profileId],
  ];
  if (account.role === ADMIN_ROLE) {
    values.unshift(
      ['email', process.env.ADMIN_EMAIL],
      ['username', process.env.ADMIN_USERNAME || stableUsername(ADMIN_ROLE, ADMIN_PROFILE_ID)],
      ['phone', process.env.ADMIN_PHONE],
    );
  }
  const seen = new Set();
  return values
    .filter(([, value]) => normalize(value))
    .filter(([, value]) => {
      const h = hash(value);
      if (seen.has(h)) return false;
      seen.add(h);
      return true;
    })
    .map(([type, value]) => ({ type, hash: hash(value), rawValue: String(value).trim() }));
}

function accountKey(account) {
  return `${account.role}:${account.profileId}`;
}

function isVerifiedParentStudentPair(a, b) {
  const parent = a.role === 'parent' ? a : b.role === 'parent' ? b : null;
  const student = a.role === 'student' ? a : b.role === 'student' ? b : null;
  if (!parent || !student) return false;
  const parentStudentId = String(parent.profile?.studentId || '').trim();
  const studentParentId = String(student.profile?.parentId || '').trim();
  return parentStudentId === student.profileId || studentParentId === parent.profileId;
}

function maskValue(type, value) {
  const v = String(value || '').trim();
  if (!v) return '(empty)';
  if (type === 'email' && v.includes('@')) {
    const [local, domain] = v.split('@');
    const shown = local.slice(0, Math.min(2, local.length));
    return `${shown}${'*'.repeat(Math.max(3, local.length - shown.length))}@${domain}`;
  }
  if (type === 'phone') return v.length <= 4 ? '*'.repeat(v.length) : `${v.slice(0, 2)}${'*'.repeat(Math.max(4, v.length - 5))}${v.slice(-3)}`;
  if (type === 'nationalId') return v.length <= 4 ? '*'.repeat(v.length) : `${v.slice(0, 2)}${'*'.repeat(Math.max(4, v.length - 4))}${v.slice(-2)}`;
  if (type === 'profileId') return v;
  return v.length <= 3 ? '*'.repeat(v.length) : `${v.slice(0, 1)}${'*'.repeat(Math.max(3, v.length - 2))}${v.slice(-1)}`;
}

function analyzeIdentifierOwnership(accounts) {
  const occurrences = new Map();
  const accountByKey = new Map(accounts.map((a) => [accountKey(a), a]));
  for (const account of accounts) {
    for (const identifier of directoryIdentifiers(account)) {
      const item = { ...identifier, ownerKey: accountKey(account) };
      const list = occurrences.get(identifier.hash) || [];
      list.push(item);
      occurrences.set(identifier.hash, list);
    }
  }

  const selectedByAccount = new Map(accounts.map((a) => [accountKey(a), []]));
  const diagnostics = [];

  for (const [identifierHash, rawItems] of occurrences) {
    // Collapse same normalized value repeated in multiple fields of the SAME profile.
    const byOwner = new Map();
    for (const item of rawItems) {
      const list = byOwner.get(item.ownerKey) || [];
      list.push(item);
      byOwner.set(item.ownerKey, list);
    }

    if (byOwner.size === 1) {
      const [ownerKey, items] = [...byOwner.entries()][0];
      // One authDirectory hash can represent the normalized value regardless of which field exposed it.
      selectedByAccount.get(ownerKey).push(items[0]);
      continue;
    }

    const ownerKeys = [...byOwner.keys()];
    const ownerAccounts = ownerKeys.map((k) => accountByKey.get(k)).filter(Boolean);
    let classification = 'SHARED_IDENTIFIER';
    let relationship = 'No unique verified family relationship.';

    if (ownerAccounts.length === 2 && isVerifiedParentStudentPair(ownerAccounts[0], ownerAccounts[1])) {
      classification = 'FAMILY_SHARED_IDENTIFIER';
      relationship = 'Verified Parent↔Student relationship.';
    } else if (ownerAccounts.every((a) => a?.role === 'parent')) {
      classification = 'PARENT_SHARED_IDENTIFIER';
      relationship = 'Shared by multiple Parent profiles.';
    } else if (ownerAccounts.length > 2) {
      classification = 'MULTI_PROFILE_SHARED_IDENTIFIER';
      relationship = `Shared by ${ownerAccounts.length} profiles.`;
    }

    const fields = ownerKeys.map((k) => ({
      ownerKey: k,
      name: String(accountByKey.get(k)?.displayName || accountByKey.get(k)?.profile?.name || k),
      types: [...new Set((byOwner.get(k) || []).map((x) => x.type))],
      maskedValues: [...new Set((byOwner.get(k) || []).map((x) => maskValue(x.type, x.rawValue)))],
    }));

    diagnostics.push({
      hash: identifierHash,
      classification,
      relationship,
      decision: 'EXCLUDE_FROM_AUTH_DIRECTORY_FOR_ALL_OWNERS',
      fields,
    });
    // Deliberately select NONE of the owners for this shared hash.
  }

  return { selectedByAccount, diagnostics };
}

function writeDiagnosticReport(diagnostics) {
  if (!diagnostics.length) return null;
  const report = {
    generatedAt: new Date().toISOString(),
    projectId: config.projectId,
    databaseId: databaseId || '(default)',
    mode: 'READ_ONLY_PREFLIGHT',
    policy: {
      uniqueIdentifiers: 'ELIGIBLE_FOR_AUTH_DIRECTORY',
      sharedIdentifiers: 'EXCLUDED_FROM_AUTH_DIRECTORY_FOR_ALL_OWNERS',
      sourceProfiles: 'UNCHANGED',
    },
    cases: diagnostics.map((d, index) => ({ case: index + 1, ...d, hash: `${d.hash.slice(0, 10)}...` })),
  };
  const reportPath = path.join(root, `AUTH_MIGRATION_DIAGNOSTIC_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
  return reportPath;
}

async function loadAccounts() {
  const accounts = [];
  for (const [collectionName, role] of PROFILE_COLLECTIONS) {
    const snap = await db.collection(collectionName).get();
    for (const docSnap of snap.docs) {
      const profile = docSnap.data();
      const profileId = String(profile.id || docSnap.id);
      accounts.push({
        role,
        profileId,
        profileCollection: collectionName,
        profile,
        docRef: docSnap.ref,
        existingAuthUid: normalize(profile.authUid) ? String(profile.authUid).trim() : '',
        authEmail: syntheticEmail(role, profileId),
        displayName: String(profile.name || profileId),
        isAdmin: false,
      });
    }
  }

  const adminEmail = normalize(process.env.ADMIN_EMAIL);
  if (!validEmail(adminEmail)) {
    throw new Error('ADMIN_EMAIL must be the valid email of the already-existing Firebase Authentication admin account.');
  }
  accounts.push({
    role: ADMIN_ROLE,
    profileId: ADMIN_PROFILE_ID,
    profileCollection: '',
    profile: {},
    docRef: null,
    existingAuthUid: '',
    authEmail: adminEmail,
    displayName: 'إدارة ثانوية ميسان للمتميزات',
    isAdmin: true,
  });
  return accounts;
}

async function preflight() {
  const conflicts = [];
  const accounts = await loadAccounts();
  const directoryDocs = new Map();
  const plans = [];

  // V2.3: only globally unique identifiers are eligible for authDirectory. Shared values are diagnostic-only and excluded.
  const ownership = analyzeIdentifierOwnership(accounts);

  // Read only authDirectory entries selected as globally unique by V2.2.
  const uniqueHashes = [...new Set([...ownership.selectedByAccount.values()].flat().map((x) => x.hash))];
  for (let i = 0; i < uniqueHashes.length; i += 100) {
    const refs = uniqueHashes.slice(i, i + 100).map((h) => db.collection('authDirectory').doc(h));
    if (!refs.length) continue;
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) if (snap.exists) directoryDocs.set(snap.id, snap.data());
  }

  for (const account of accounts) {
    const expectedClaims = {
      role: account.role,
      profileId: account.profileId,
      profileCollection: account.profileCollection,
    };

    let userByUid = null;
    let userByEmail = null;

    if (account.existingAuthUid) {
      userByUid = await getAuthByUidOrNull(account.existingAuthUid);
      if (!userByUid) {
        addConflict(conflicts, 'AUTH_UID_NOT_FOUND', `${account.role}:${account.profileId}`,
          `Firestore authUid ${maskedUid(account.existingAuthUid)} does not exist in Firebase Auth.`);
      }
    }

    userByEmail = await getAuthByEmailOrNull(account.authEmail);

    if (account.isAdmin && !userByEmail) {
      addConflict(conflicts, 'ADMIN_AUTH_NOT_FOUND', 'admin:admin-main',
        'ADMIN_EMAIL does not match an existing Firebase Authentication account. V2 will not create a second admin.');
    }

    if (userByUid && userByEmail && userByUid.uid !== userByEmail.uid) {
      addConflict(conflicts, 'AUTH_UID_EMAIL_MISMATCH', `${account.role}:${account.profileId}`,
        `Firestore authUid ${maskedUid(userByUid.uid)} and expected Auth email belong to different Firebase users (${maskedUid(userByEmail.uid)}).`);
    }

    const resolvedUser = userByUid || userByEmail;
    if (resolvedUser) {
      const cc = claimsConflict(resolvedUser, expectedClaims);
      if (cc) {
        addConflict(conflicts, 'CLAIMS_OWNERSHIP_CONFLICT', `${account.role}:${account.profileId}`,
          `Existing Firebase user ${maskedUid(resolvedUser.uid)} already has incompatible migration claims: ${cc}`);
      }
    }

    // Existing authDirectory entries must not point to another account.
    const selectedIdentifiers = ownership.selectedByAccount.get(accountKey(account)) || [];
    for (const identifier of selectedIdentifiers) {
      const existing = directoryDocs.get(identifier.hash);
      if (!existing) continue;
      const existingUid = String(existing.uid || '').trim();
      const existingProfileId = String(existing.profileId || '').trim();
      const existingRole = String(existing.role || '').trim();
      const existingAuthEmail = normalize(existing.authEmail);

      if (existingProfileId && existingProfileId !== account.profileId) {
        addConflict(conflicts, 'DIRECTORY_PROFILE_CONFLICT', `${account.role}:${account.profileId}`,
          `${identifier.type} directory entry belongs to profileId=${existingProfileId}.`);
      }
      if (existingRole && existingRole !== account.role) {
        addConflict(conflicts, 'DIRECTORY_ROLE_CONFLICT', `${account.role}:${account.profileId}`,
          `${identifier.type} directory entry belongs to role=${existingRole}.`);
      }
      if (resolvedUser && existingUid && existingUid !== resolvedUser.uid) {
        addConflict(conflicts, 'DIRECTORY_UID_CONFLICT', `${account.role}:${account.profileId}`,
          `${identifier.type} directory entry points to another Firebase UID ${maskedUid(existingUid)}.`);
      }
      if (existingAuthEmail && existingAuthEmail !== normalize(account.authEmail)) {
        addConflict(conflicts, 'DIRECTORY_EMAIL_CONFLICT', `${account.role}:${account.profileId}`,
          `${identifier.type} directory entry points to a different internal auth email.`);
      }
    }

    plans.push({ ...account, expectedClaims, resolvedUser, selectedIdentifiers, allIdentifiers: directoryIdentifiers(account) });
  }

  return { plans, conflicts, diagnostics: ownership.diagnostics };
}

function printPreflight({ plans, conflicts, diagnostics = [], diagnosticReportPath = null }) {
  const counts = {};
  let create = 0;
  let link = 0;
  let eligibleAliases = 0;
  for (const p of plans) {
    counts[p.role] = (counts[p.role] || 0) + 1;
    eligibleAliases += (p.selectedIdentifiers || []).length;
    if (p.resolvedUser) link += 1;
    else if (!p.isAdmin) create += 1;
  }

  const family = diagnostics.filter((d) => d.classification === 'FAMILY_SHARED_IDENTIFIER').length;
  const parentShared = diagnostics.filter((d) => d.classification === 'PARENT_SHARED_IDENTIFIER').length;
  const otherShared = diagnostics.length - family - parentShared;

  console.log('==========================================');
  console.log(' AUTH MIGRATION V2.3.1 - APPLY-SAFE / CRASH-RECOVERY PREFLIGHT');
  console.log(' NO FIREBASE / FIRESTORE DATA HAS BEEN MODIFIED');
  console.log('==========================================');
  console.log(`Project:  ${config.projectId}`);
  console.log(`Database: ${databaseId || '(default)'}`);
  console.log('Profiles:', Object.entries(counts).map(([r, n]) => `${r}=${n}`).join(', '));
  console.log(`Existing Auth users to link/verify: ${link}`);
  console.log(`New non-admin Auth users planned:  ${create}`);
  console.log(`Unique login aliases eligible for authDirectory: ${eligibleAliases}`);
  console.log(`Shared identifier groups excluded from authDirectory: ${diagnostics.length}`);
  console.log(`  Verified Parent↔Student family-shared: ${family}`);
  console.log(`  Parent↔Parent shared: ${parentShared}`);
  console.log(`  Other/ambiguous shared: ${otherShared}`);
  console.log(`Blocking infrastructure/ownership conflicts: ${conflicts.length}`);

  if (diagnostics.length) {
    console.log('\nAUTOMATIC POLICY FOR SHARED IDENTIFIERS:');
    console.log('  - Original profile values remain unchanged.');
    console.log('  - Shared values are NOT written to authDirectory for any owner.');
    console.log('  - Each affected account must sign in using another unique identifier (or its profileId/internal login alias).');
    diagnostics.forEach((d, i) => console.log(`${i + 1}. [${d.classification}] ${d.fields.map((f) => `${f.ownerKey}(${f.types.join('+')})`).join(' ↔ ')} => ${d.decision}`));
  }

  if (diagnosticReportPath) console.log(`\nLocal masked diagnostic report: ${diagnosticReportPath}`);

  if (conflicts.length) {
    console.log('\nBLOCKING CONFLICTS (unrelated to ordinary shared profile values):');
    conflicts.forEach((c, i) => console.log(`${i + 1}. [${c.code}] ${c.subject}: ${c.details}`));
    console.log('\nRESULT: STOP. ZERO FIREBASE/FIRESTORE WRITES PERFORMED.');
  } else {
    console.log('\nRESULT: ZERO BLOCKING CONFLICTS. V2.3.1 preflight passed.');
    console.log(DRY_RUN ? 'Dry-run requested: exiting with ZERO FIREBASE/FIRESTORE WRITES.' : 'Apply phase may now begin.');
  }
  console.log('==========================================');
}

async function applyMigration(plans) {
  const journalPath = path.join(root, 'AUTH_MIGRATION_V231_RECOVERY.json');
  const csvPath = path.join(root, 'AUTH_MIGRATION_SECRETS_V231.csv');
  const atomicWrite = (file, text) => { const tmp = `${file}.tmp`; fs.writeFileSync(tmp, text, { mode: 0o600 }); fs.renameSync(tmp, file); try { fs.chmodSync(file, 0o600); } catch {} };
  const journal = fs.existsSync(journalPath)
    ? JSON.parse(fs.readFileSync(journalPath, 'utf8'))
    : { version: '2.3.1', runId: `v231-${Date.now()}`, createdAt: new Date().toISOString(), accounts: {} };
  if (journal.version !== '2.3.1' || !journal.accounts) throw new Error('Invalid V2.3.1 recovery journal.');
  const saveJournal = () => { journal.updatedAt = new Date().toISOString(); atomicWrite(journalPath, JSON.stringify(journal, null, 2)); };
  const writeCsv = () => {
    const rows = [['role','profileId','name','loginEmail','temporaryPassword']];
    for (const e of Object.values(journal.accounts)) if (e.createdByMigration && e.temporaryPassword) rows.push([e.role,e.profileId,e.displayName||'',e.authEmail,e.temporaryPassword]);
    if (rows.length > 1) atomicWrite(csvPath, rows.map(r => r.map(csvEscape).join(',')).join('\n'));
  };
  saveJournal();
  let created = 0, linked = 0, completed = 0;

  for (const plan of plans) {
    const key = accountKey(plan);
    const state = journal.accounts[key] ||= { role: plan.role, profileId: plan.profileId, displayName: plan.displayName, authEmail: plan.authEmail, status: 'PENDING', createdByMigration: false };

    // Abort if source identity changed after preflight.
    if (plan.docRef) {
      const snap = await plan.docRef.get();
      if (!snap.exists) throw new Error(`Apply stopped: profile disappeared: ${key}`);
      const actual = directoryIdentifiers({ ...plan, profile: snap.data() || {} }).map(x => `${x.type}:${x.hash}`).sort().join('|');
      const expected = (plan.allIdentifiers || []).map(x => `${x.type}:${x.hash}`).sort().join('|');
      if (actual !== expected) throw new Error(`Apply stopped before writing ${key}: identity fields changed after preflight. Re-run preflight.`);
    }

    let user = await getAuthByEmailOrNull(plan.authEmail);
    if (plan.existingAuthUid) {
      const byUid = await getAuthByUidOrNull(plan.existingAuthUid);
      if (!byUid) throw new Error(`Apply stopped: existing authUid disappeared for ${key}.`);
      if (user && user.uid !== byUid.uid) throw new Error(`Apply stopped: authUid/email ownership changed for ${key}.`);
      user = byUid;
    }

    if (!user) {
      if (plan.isAdmin) throw new Error('Invariant failed: admin must already exist before apply.');
      // Password is durable locally BEFORE remote Auth creation.
      state.temporaryPassword ||= randomPassword();
      state.status = 'PASSWORD_JOURNALED'; saveJournal();
      try {
        user = await auth.createUser({ email: plan.authEmail, password: state.temporaryPassword, displayName: plan.displayName, emailVerified: false, disabled: false });
        state.createdByMigration = true; state.uid = user.uid; state.status = 'AUTH_CREATED'; created++; saveJournal(); writeCsv();
      } catch (e) {
        if (e?.code !== 'auth/email-already-exists') throw e;
        user = await auth.getUserByEmail(plan.authEmail);
        state.uid = user.uid; state.status = 'AUTH_RECOVERED'; saveJournal();
      }
    } else { linked++; state.uid = user.uid; state.status = state.status === 'COMPLETED' ? 'COMPLETED' : 'AUTH_LINKED'; saveJournal(); }

    const cc = claimsConflict(user, plan.expectedClaims);
    if (cc) throw new Error(`Apply stopped: Firebase user ${maskedUid(user.uid)} acquired incompatible claims: ${cc}`);
    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), ...plan.expectedClaims });
    state.status = 'CLAIMS_SET'; saveJournal();

    // Atomic Firestore ownership recheck + profile/authDirectory writes.
    await db.runTransaction(async tx => {
      if (plan.docRef) {
        const fresh = await tx.get(plan.docRef);
        if (!fresh.exists) throw new Error(`Apply stopped: profile disappeared: ${key}`);
        const data = fresh.data() || {};
        const freshUid = String(data.authUid || '').trim();
        if (freshUid && freshUid !== user.uid) throw new Error(`Apply stopped: authUid changed concurrently for ${key}.`);
        const actual = directoryIdentifiers({ ...plan, profile: data }).map(x => `${x.type}:${x.hash}`).sort().join('|');
        const expected = (plan.allIdentifiers || []).map(x => `${x.type}:${x.hash}`).sort().join('|');
        if (actual !== expected) throw new Error(`Apply stopped: identity fields changed concurrently for ${key}.`);
      }
      const entries = [];
      for (const identifier of plan.selectedIdentifiers || []) {
        const ref = db.collection('authDirectory').doc(identifier.hash);
        entries.push({ identifier, ref, snap: await tx.get(ref) });
      }
      for (const { identifier, snap } of entries) if (snap.exists) {
        const d = snap.data() || {};
        if ((d.profileId && String(d.profileId) !== plan.profileId) || (d.role && String(d.role) !== plan.role) || (d.uid && String(d.uid) !== user.uid) || (d.authEmail && normalize(d.authEmail) !== normalize(plan.authEmail)))
          throw new Error(`Apply stopped: authDirectory ownership changed for ${key} (${identifier.type}).`);
      }
      if (plan.docRef) tx.set(plan.docRef, { authUid: user.uid, username: stableUsername(plan.role, plan.profileId), authMigratedAt: FieldValue.serverTimestamp() }, { merge: true });
      const directoryData = { authEmail: plan.authEmail, uid: user.uid, role: plan.role, profileId: plan.profileId, profileCollection: plan.profileCollection, updatedAt: FieldValue.serverTimestamp() };
      for (const { ref } of entries) tx.set(ref, directoryData, { merge: true });
    });

    state.status = 'COMPLETED'; state.completedAt = new Date().toISOString(); completed++; saveJournal(); writeCsv();
  }
  journal.status = 'COMPLETE'; journal.completedAt = new Date().toISOString(); saveJournal(); writeCsv();
  console.log('\n==========================================');
  console.log(' AUTH MIGRATION V2.3.1 - APPLY COMPLETE');
  console.log('==========================================');
  console.log(`New Firebase Auth users created this run: ${created}`);
  console.log(`Existing Firebase Auth users linked/verified this run: ${linked}`);
  console.log(`Accounts completed/verified this run: ${completed}`);
  console.log(`Crash-recovery journal: ${journalPath}`);
  if (fs.existsSync(csvPath)) console.log(`Temporary-password CSV: ${csvPath}`);
  console.log('Legacy passcodes were NOT deleted. Do not deploy strict rules or purge passcodes until post-migration verification passes.');
  console.log('==========================================');
}
try {
  const result = await preflight();
  const diagnosticReportPath = writeDiagnosticReport(result.diagnostics);
  printPreflight({ ...result, diagnosticReportPath });
  if (result.conflicts.length) process.exitCode = 2;
  else if (!DRY_RUN) await applyMigration(result.plans);
} catch (error) {
  console.error('\n==========================================');
  console.error(' AUTH MIGRATION V2.3.1 FAILED');
  console.error('==========================================');
  console.error('Code:', error?.code || 'unknown');
  console.error('Message:', error?.message || String(error));
  process.exitCode = 1;
}
