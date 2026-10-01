import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { ACCOUNT_PROVISION_MESSAGES, assertCanProvision } from '../src/utils/newAccountPolicy.ts';
import {
  executeAccountProvisioning,
  hashLoginIdentifier,
  prepareAccount,
  syntheticAuthEmail,
  type AccountStore,
  type AuthGateway,
  type PlannedWrite,
} from '../server/accountProvisioningCore.ts';

let pass = 0;
let total = 0;

function test(name, fn) {
  total += 1;
  return Promise.resolve()
    .then(fn)
    .then(() => {
      pass += 1;
      console.log('PASS', name);
    })
    .catch((error) => {
      console.error('FAIL', name, error?.message || error);
    });
}

function ok(value, message) {
  if (!value) throw new Error(message);
}

const PASSWORD = 'Provision-Secret-91';
const teacherId = 'tech-1710000000000-abcde';
const studentId = 'std-1710000000000-abcde';
const parentId = 'prt-1710000000000-fghij';
const supervisorId = 'sup-1710000000000-abcde';

function memoryBackend(seed: Array<[string, any]> = []) {
  const docs = new Map<string, any>(seed);
  const created = [];
  const deleted = [];
  const claims = new Map();
  let seq = 0;
  const auth: AuthGateway = {
    async createUser() {
      seq += 1;
      const uid = `new-uid-${seq}`;
      created.push(uid);
      return { uid };
    },
    async setClaims(uid, value) {
      claims.set(uid, value);
    },
    async deleteUser(uid) {
      if (!created.includes(uid)) throw new Error(`refusing to delete pre-existing uid ${uid}`);
      deleted.push(uid);
    },
  };
  const store: AccountStore = {
    async getExisting(refs) {
      return refs.map((ref) => ({ ...ref, exists: docs.has(`${ref.collection}/${ref.id}`) }));
    },
    async createAll(writes: PlannedWrite[]) {
      for (const write of writes) {
        const key = `${write.collection}/${write.id}`;
        if (docs.has(key) && !write.optional) throw new Error(`exists ${write.conflictField}`);
      }
      for (const write of writes) {
        const key = `${write.collection}/${write.id}`;
        if (docs.has(key) && write.optional) continue;
        docs.set(key, write);
      }
    },
  };
  return { auth, store, docs, created, deleted, claims };
}

const teacherInput = {
  role: 'teacher' as const,
  profileId: teacherId,
  username: ' Teacher.One ',
  password: PASSWORD,
  confirmPassword: PASSWORD,
  email: 'Teacher@Example.com',
  phone: '0770 123-4567',
  nationalId: 'ab-1234',
  profile: { name: 'أ. زينب', subject: 'فيزياء', initialPassword: PASSWORD, passcode: 'nope' },
};

await test('teacher creation writes one uid, claims, and every present alias', async () => {
  const backend = memoryBackend();
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1', name: 'الإدارة' }, { accounts: [teacherInput] });
  ok(result.accounts.length === 1, 'one account');
  ok(result.accounts[0].authUid === 'new-uid-1', 'uid from this operation');
  ok(result.accounts[0].username === 'teacher.one', 'username normalized');
  const claim = backend.claims.get('new-uid-1');
  ok(claim.role === 'teacher' && claim.profileId === teacherId && claim.profileCollection === 'teachers', 'claims');
  const profile = backend.docs.get(`teachers/${teacherId}`);
  ok(profile.data.authUid === 'new-uid-1', 'authUid stored');
  ok(profile.data.initialPassword === undefined && profile.data.passcode === undefined, 'secrets stripped');
  ok(!JSON.stringify([...backend.docs.values()]).includes(PASSWORD), 'password absent from writes');
  const aliases = [...backend.docs.values()].filter((doc) => doc.collection === 'authDirectory');
  const fields = aliases.map((doc) => doc.conflictField).sort();
  ok(fields.includes('username') && fields.includes('email') && fields.includes('phone') && fields.includes('nationalId') && fields.includes('profileId'), `aliases ${fields.join(',')}`);
  ok(aliases.every((doc) => doc.data.uid === 'new-uid-1' && doc.data.authEmail === syntheticAuthEmail('teacher', teacherId)), 'aliases share one uid');
  ok(backend.docs.has(`authDirectory/${hashLoginIdentifier('07701234567')}`), 'canonical phone alias');
  ok(backend.docs.has(`authDirectory/${hashLoginIdentifier('0770 123-4567')}`), 'typed phone alias');
  ok(backend.deleted.length === 0, 'no rollback on success');
});

await test('duplicate username is rejected before a Firebase user is created', async () => {
  const prepared = prepareAccount(teacherInput);
  const username = prepared.aliases.find((alias) => alias.field === 'username');
  const backend = memoryBackend([[`authDirectory/${username.hash}`, { taken: true }]]);
  let message = '';
  try {
    await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: [teacherInput] });
  } catch (error) {
    message = error.message;
  }
  ok(message === ACCOUNT_PROVISION_MESSAGES.usernameTaken, message);
  ok(backend.created.length === 0, 'no auth user');
  ok(!backend.docs.has(`teachers/${teacherId}`), 'no profile');
});

await test('password mismatch and short password do not create users', async () => {
  const backend = memoryBackend();
  let mismatch = '';
  try {
    await executeAccountProvisioning(backend, { uid: 'admin-1' }, {
      accounts: [{ ...teacherInput, confirmPassword: 'different-password' }],
    });
  } catch (error) {
    mismatch = error.message;
  }
  let short = '';
  try {
    await executeAccountProvisioning(backend, { uid: 'admin-1' }, {
      accounts: [{ ...teacherInput, password: 'short', confirmPassword: 'short' }],
    });
  } catch (error) {
    short = error.message;
  }
  ok(mismatch === ACCOUNT_PROVISION_MESSAGES.passwordMismatch, mismatch);
  ok(short === ACCOUNT_PROVISION_MESSAGES.passwordShort, short);
  ok(backend.created.length === 0, 'no auth user');
});

await test('backend failure rolls back only the user created by this operation', async () => {
  const backend = memoryBackend();
  backend.store.createAll = async () => {
    throw new Error('firestore down');
  };
  let message = '';
  try {
    await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: [teacherInput] });
  } catch (error) {
    message = error.message;
  }
  ok(message === ACCOUNT_PROVISION_MESSAGES.rolledBack, message);
  ok(backend.deleted.join(',') === backend.created.join(','), 'deleted only new uids');
  ok(backend.deleted.length === 1, 'one compensation delete');
  ok(!backend.docs.has(`teachers/${teacherId}`), 'profile not kept');
});

await test('student without nationalId and parent without email get separate uids and no invented aliases', async () => {
  const backend = memoryBackend();
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1' }, {
    accounts: [
      {
        role: 'student' as const,
        profileId: studentId,
        username: 'student.one',
        password: PASSWORD,
        confirmPassword: PASSWORD,
        phone: '',
        email: '',
        nationalId: '',
        profile: { name: 'زهراء', gradeLevel: 'الصف السادس العلمي', section: 'أ', parentId, parentName: 'محمد', parentPhone: '07801112233', parentEmail: '' },
      },
      {
        role: 'parent' as const,
        profileId: parentId,
        username: 'parent.one',
        password: 'Parent-Secret-91',
        confirmPassword: 'Parent-Secret-91',
        email: '',
        phone: '07801112233',
        profile: { name: 'محمد', studentId, phone: '07801112233' },
      },
    ],
    extraDocuments: [{
      collection: 'financial',
      id: 'fin-1710000000000-abcde',
      data: { id: 'fin-1710000000000-abcde', studentId, studentName: 'زهراء', totalAmount: 1 },
    }],
  });
  ok(result.accounts[0].authUid !== result.accounts[1].authUid, 'independent uids');
  const student = backend.docs.get(`students/${studentId}`).data;
  const parent = backend.docs.get(`parents/${parentId}`).data;
  ok(student.authUid !== parent.authUid, 'profiles keep distinct authUid');
  ok(student.nationalId === undefined, 'no invented national id');
  ok(student.username === 'student.one' && parent.username === 'parent.one', 'independent usernames');
  ok(parent.email === undefined, 'no invented parent email');
  ok(!JSON.stringify(parent).includes('gmail.com'), 'no fake gmail');
  const studentAliases = [...backend.docs.values()].filter((doc) => doc.collection === 'authDirectory' && doc.data.uid === student.authUid);
  ok(!studentAliases.some((doc) => doc.conflictField === 'nationalId' || doc.conflictField === 'email'), 'student has no empty aliases');
  ok(studentAliases.some((doc) => doc.conflictField === 'username') && studentAliases.some((doc) => doc.conflictField === 'profileId'), 'student username and profile id');
  const parentAliases = [...backend.docs.values()].filter((doc) => doc.collection === 'authDirectory' && doc.data.uid === parent.authUid);
  ok(!parentAliases.some((doc) => doc.conflictField === 'email'), 'parent has no email alias');
  ok(parentAliases.some((doc) => doc.conflictField === 'phone'), 'parent phone alias');
  ok(backend.claims.get(student.authUid).role === 'student', 'student claims');
  ok(backend.claims.get(parent.authUid).role === 'parent' && backend.claims.get(parent.authUid).profileCollection === 'parents', 'parent claims');
  ok(backend.docs.has('financial/fin-1710000000000-abcde'), 'financial written with the accounts');
  ok(!JSON.stringify([...backend.docs.values()]).includes(PASSWORD), 'student password not stored');
  ok(!JSON.stringify([...backend.docs.values()]).includes('Parent-Secret-91'), 'parent password not stored');
});

await test('supervisor aliases and claims follow the same account', async () => {
  const backend = memoryBackend();
  await executeAccountProvisioning(backend, { uid: 'admin-1' }, {
    accounts: [{
      role: 'supervisor' as const,
      profileId: supervisorId,
      username: 'supervisor.one',
      password: PASSWORD,
      confirmPassword: PASSWORD,
      email: 'sup@example.com',
      phone: '',
      nationalId: '',
      profile: { name: 'د. حيدر', title: 'مشرف', specialization: 'رياضيات' },
    }],
  });
  const claim = backend.claims.get('new-uid-1');
  ok(claim.role === 'supervisor' && claim.profileCollection === 'supervisors' && claim.profileId === supervisorId, 'supervisor claims');
  const aliases = [...backend.docs.values()].filter((doc) => doc.collection === 'authDirectory');
  ok(aliases.every((doc) => doc.data.uid === 'new-uid-1'), 'one uid');
  ok(aliases.some((doc) => doc.conflictField === 'email'), 'email alias');
  ok(!aliases.some((doc) => doc.conflictField === 'phone' || doc.conflictField === 'nationalId'), 'empty phone and national id skipped');
});

await test('login hash and synthetic auth email match the migration contract', () => {
  const normalized = 'teacher.one';
  ok(hashLoginIdentifier('  Teacher.One  ') === createHash('sha256').update(normalized, 'utf8').digest('hex'), 'login hash');
  const raw = `${'teacher'}:${teacherId}`;
  const expected = `u-${createHash('sha256').update(raw, 'utf8').digest('hex').slice(0, 32)}@auth.maysan.local`;
  ok(syntheticAuthEmail('teacher', teacherId) === expected, expected);
});

await test('only an admin claim can provision', () => {
  let denied = false;
  try { assertCanProvision({ role: 'teacher' }); } catch { denied = true; }
  ok(denied, 'teacher denied');
  assertCanProvision({ role: 'admin' });
});

await test('ui no longer invents teacher email, student national id, parent gmail, or supervisor contact', () => {
  const modals = fs.readFileSync(new URL('../src/components/AddUserModals.tsx', import.meta.url), 'utf8');
  const supervisors = fs.readFileSync(new URL('../src/components/SupervisorManagementHub.tsx', import.meta.url), 'utf8');
  ok(!modals.includes('maysan-gifted.edu.iq'), 'teacher fake email removed');
  ok(!modals.includes('9000000000'), 'random national id removed');
  ok(!modals.includes('parentName.toLowerCase()'), 'parent gmail generator removed');
  ok(!supervisors.includes('supervisor.${Date.now()'), 'supervisor fake email removed');
  ok(!supervisors.includes("0770' + Math.floor"), 'supervisor fake phone removed');
  ok(modals.includes('await addTeacher') && modals.includes('await addStudent'), 'modals await creation');
  ok(modals.includes('جاري إنشاء الحساب...'), 'pending label');
});

function linkedAccounts(contact: { phone?: string; email?: string; studentNationalId?: string; parentNationalId?: string }) {
  const phone = contact.phone || '';
  const email = contact.email || '';
  return [
    {
      role: 'student' as const,
      profileId: studentId,
      username: 'student.one',
      password: PASSWORD,
      confirmPassword: PASSWORD,
      phone,
      email,
      nationalId: contact.studentNationalId || '',
      profile: {
        name: 'زهراء',
        gradeLevel: 'الصف السادس العلمي',
        section: 'أ',
        parentId,
        parentName: 'محمد',
        parentPhone: phone || '07801110000',
        parentEmail: email,
      },
    },
    {
      role: 'parent' as const,
      profileId: parentId,
      username: 'parent.one',
      password: 'Parent-Secret-91',
      confirmPassword: 'Parent-Secret-91',
      email,
      phone: phone || '07801110000',
      nationalId: contact.parentNationalId || '',
      profile: { name: 'محمد', studentId, phone: phone || '07801110000', email },
    },
  ];
}

const aliasDocsFor = (backend, uid) =>
  [...backend.docs.values()].filter((doc) => doc.collection === 'authDirectory' && doc.data?.uid === uid);

await test('student and parent keep different usernames and uids when they share a phone', async () => {
  const phone = '07805556677';
  const backend = memoryBackend();
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: linkedAccounts({ phone }) });
  const student = result.accounts.find((account) => account.role === 'student');
  const parent = result.accounts.find((account) => account.role === 'parent');
  ok(student.username !== parent.username && student.authUid !== parent.authUid, 'distinct login identities');
  ok(student.profile.phone === phone && parent.profile.phone === phone, 'contact phone kept on both profiles');
  ok(!backend.docs.has(`authDirectory/${hashLoginIdentifier(phone)}`), 'shared phone is not a login alias');
  ok(aliasDocsFor(backend, student.authUid).some((doc) => doc.conflictField === 'username'), 'student username login');
  ok(aliasDocsFor(backend, student.authUid).some((doc) => doc.conflictField === 'profileId'), 'student profile login');
  ok(aliasDocsFor(backend, parent.authUid).some((doc) => doc.conflictField === 'username'), 'parent username login');
  ok(aliasDocsFor(backend, parent.authUid).some((doc) => doc.conflictField === 'profileId'), 'parent profile login');
});

await test('an existing phone alias stays with its owner when student and parent also store that number', async () => {
  const phone = '07805556677';
  const hash = hashLoginIdentifier(phone);
  const backend = memoryBackend([[
    `authDirectory/${hash}`,
    { collection: 'authDirectory', id: hash, data: { uid: 'legacy-uid', profileId: 'prt-old', authEmail: 'kept@auth.maysan.local' }, conflictField: 'phone' },
  ]]);
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: linkedAccounts({ phone }) });
  const student = result.accounts.find((account) => account.role === 'student');
  const parent = result.accounts.find((account) => account.role === 'parent');
  ok(student.profile.phone === phone && parent.profile.phone === phone, 'contact numbers stored');
  ok(student.authUid !== parent.authUid, 'separate accounts');
  const kept = backend.docs.get(`authDirectory/${hash}`);
  ok(kept.data.uid === 'legacy-uid' && kept.data.profileId === 'prt-old', 'directory alias not overwritten');
  ok(aliasDocsFor(backend, student.authUid).some((doc) => doc.conflictField === 'profileId'), 'student profileId login');
  ok(aliasDocsFor(backend, parent.authUid).some((doc) => doc.conflictField === 'username'), 'parent username login');
});

await test('student and parent can share an email without overwriting authDirectory', async () => {
  const email = 'family@example.com';
  const hash = hashLoginIdentifier(email);
  const backend = memoryBackend([[
    `authDirectory/${hash}`,
    { collection: 'authDirectory', id: hash, data: { uid: 'legacy-uid', profileId: 'tea-old' }, conflictField: 'email' },
  ]]);
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: linkedAccounts({ email, phone: '07801110000' }) });
  ok(result.accounts[0].authUid !== result.accounts[1].authUid, 'separate uids');
  ok(result.accounts.every((account) => account.profile.email === email), 'email remains contact data');
  ok(backend.docs.get(`authDirectory/${hash}`).data.uid === 'legacy-uid', 'existing email alias kept');
  ok(result.accounts.every((account) => aliasDocsFor(backend, account.authUid).some((doc) => doc.conflictField === 'username')), 'username login remains');
  ok(result.accounts.every((account) => aliasDocsFor(backend, account.authUid).some((doc) => doc.conflictField === 'profileId')), 'profileId login remains');
});

await test('duplicate nationalId, username, and profileId still fail before any auth user is created', async () => {
  const nationalHash = hashLoginIdentifier('AB123456');
  const nationalBackend = memoryBackend([[`authDirectory/${nationalHash}`, { data: { uid: 'legacy-uid' } }]]);
  let nationalMessage = '';
  try {
    await executeAccountProvisioning(nationalBackend, { uid: 'admin-1' }, { accounts: linkedAccounts({ studentNationalId: 'AB123456' }) });
  } catch (error: any) {
    nationalMessage = error.message;
  }
  ok(nationalMessage === ACCOUNT_PROVISION_MESSAGES.nationalIdTaken, nationalMessage);
  ok(nationalBackend.created.length === 0, 'national id created no user');

  const usernameBackend = memoryBackend([[`authDirectory/${hashLoginIdentifier('student.one')}`, { data: { uid: 'legacy-uid' } }]]);
  let usernameMessage = '';
  try {
    await executeAccountProvisioning(usernameBackend, { uid: 'admin-1' }, { accounts: [linkedAccounts({})[0]] });
  } catch (error: any) {
    usernameMessage = error.message;
  }
  ok(usernameMessage === ACCOUNT_PROVISION_MESSAGES.usernameTaken, usernameMessage);
  ok(usernameBackend.created.length === 0, 'username created no user');

  const profileBackend = memoryBackend([[`students/${studentId}`, { data: { id: studentId, authUid: 'legacy-uid' } }]]);
  let profileMessage = '';
  try {
    await executeAccountProvisioning(profileBackend, { uid: 'admin-1' }, { accounts: [linkedAccounts({})[0]] });
  } catch (error: any) {
    profileMessage = error.message;
  }
  ok(profileMessage === ACCOUNT_PROVISION_MESSAGES.profileTaken, profileMessage);
  ok(profileBackend.created.length === 0, 'profile id created no user');
  ok(profileBackend.docs.get(`students/${studentId}`).data.authUid === 'legacy-uid', 'old profile untouched');
});

await test('teacher email alias stays strict even when the address already exists', async () => {
  const hash = hashLoginIdentifier('teacher@example.com');
  const backend = memoryBackend([[`authDirectory/${hash}`, { data: { uid: 'legacy-uid' } }]]);
  let message = '';
  try {
    await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: [teacherInput] });
  } catch (error: any) {
    message = error.message;
  }
  ok(message === ACCOUNT_PROVISION_MESSAGES.emailTaken, message);
  ok(backend.created.length === 0, 'teacher was not created');
  ok(backend.docs.get(`authDirectory/${hash}`).data.uid === 'legacy-uid', 'teacher did not replace the alias');
});

await test('a student reuses an occupied phone without taking that login alias', async () => {
  const phone = '07809998877';
  const hash = hashLoginIdentifier(phone);
  const backend = memoryBackend([[
    `authDirectory/${hash}`,
    { collection: 'authDirectory', id: hash, data: { uid: 'legacy-uid', profileId: 'prt-old' }, conflictField: 'phone' },
  ]]);
  const accounts = linkedAccounts({});
  accounts[0].phone = phone;
  const result = await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts });
  const student = result.accounts.find((account) => account.role === 'student');
  ok(student.profile.phone === phone, 'student profile keeps the shared contact');
  ok(backend.docs.get(`authDirectory/${hash}`).data.uid === 'legacy-uid', 'occupied phone alias unchanged');
  ok(aliasDocsFor(backend, student.authUid).some((doc) => doc.conflictField === 'username'), 'student username login');
  ok(aliasDocsFor(backend, student.authUid).some((doc) => doc.conflictField === 'profileId'), 'student profile login');
  ok(aliasDocsFor(backend, student.authUid).every((doc) => doc.id !== hash), 'student did not receive the occupied phone alias');
});

await test('account creation writes one server audit per account and no client duplicate or secrets', async () => {
  const backend = memoryBackend();
  await executeAccountProvisioning(backend, { uid: 'admin-1' }, { accounts: linkedAccounts({ phone: '07801110000' }) });
  const audits = [...backend.docs.values()].filter((doc) => doc.collection === 'auditLogs');
  ok(audits.length === 2, `audit count ${audits.length}`);
  const raw = JSON.stringify(audits);
  ok(!raw.includes(PASSWORD) && !raw.includes('Parent-Secret-91'), 'passwords absent');
  ok(!raw.includes('authEmail') && !raw.includes('eyJ') && !raw.includes('service_account'), 'tokens and auth email absent');
  const app = fs.readFileSync(new URL('../src/context/AppContext.tsx', import.meta.url), 'utf8');
  const teacherFn = app.slice(app.indexOf('const addTeacher = async'), app.indexOf('const identityRecords'));
  const studentFn = app.slice(app.indexOf('const addStudent = async'), app.indexOf('const updateTeacher = async'));
  const supervisorFn = app.slice(app.indexOf('const addSupervisor = async'), app.indexOf('const updateSupervisor = async'));
  ok(!teacherFn.includes('addAuditLog') && !studentFn.includes('addAuditLog') && !supervisorFn.includes('addAuditLog'), 'client create audit removed');
  const home = fs.readFileSync(new URL('../src/components/SchoolHomeOverview.tsx', import.meta.url), 'utf8');
  ok(!home.includes('addTeacher('), 'homepage does not create a teacher profile');
  ok(home.includes('AddTeacherModal'), 'homepage opens the full teacher form');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exitCode = 1;
