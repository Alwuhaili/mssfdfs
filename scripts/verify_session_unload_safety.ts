import {
  activePersistenceWriteCount,
  admitAuthenticatedLogout,
  applyCanonicalGuestMemoryPurge,
  armLogoutUnloadBypass,
  createSessionAdmissionGate,
  endActivePersistenceWrite,
  GUEST_PRESERVED_PUBLIC_KEYS,
  GUEST_PRIVATE_ARRAY_KEYS,
  GUEST_PRIVATE_OBJECT_KEYS,
  shouldWarnOnBeforeUnload,
  tryBeginPersistenceWrite,
} from '../src/utils/sessionUnloadSafety.ts';

let pass = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total += 1;
  try {
    fn();
    pass += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const CANONICAL_SAMPLE = {
  teachers: [{ id: 't1' }],
  students: [{ id: 's1', name: 'سرية' }],
  parents: [{ id: 'p1' }],
  supervisors: [{ id: 'sv1' }],
  graduates: [{ id: 'g1' }],
  exams: [{ id: 'e1' }],
  submissions: [{ id: 'sub1' }],
  attendance: [{ id: 'a1' }],
  announcements: [{ id: 'an1' }],
  messages: [{ id: 'm1' }],
  lectures: [{ id: 'l1' }],
  timetable: [{ id: 'tt1' }],
  subjectQuotas: [{ id: 'q1' }],
  financial: [{ id: 'f1' }],
  notifications: [{ id: 'n1' }],
  certificates: [{ id: 'c1' }],
  academicEnrollments: [{ id: 'ae1' }],
  accelerationPolicies: [{ id: 'ap1' }],
  accelerationAttempts: [{ id: 'aa1' }],
  calendarEvents: [{ id: 'cal1' }],
  customFolders: [{ id: 'cf1' }],
  auditLogs: [{ id: 'log1' }],
  annualPlans: [{ id: 'anp1' }],
  dailyLessonPlans: [{ id: 'dlp1' }],
  examSchedules: [{ id: 'es1' }],
  challenges: [{ id: 'ch1' }],
  deletedLectureIds: ['x'],
  deletedChallengeIds: ['y'],
  userPasscodes: { admin: 'secret' },
  notificationUserStates: { n1: { isRead: true } },
  schoolAdminData: { schoolNameEn: 'Maysan Secondary' },
  activeTakingExam: { id: 'exam-live' },
};

test('A logout admission succeeds with zero active writes', () => {
  const gate = createSessionAdmissionGate();
  const result = admitAuthenticatedLogout(gate);
  assert(result.admitted === true, 'admitted');
  assert(gate.logoutInProgress === true, 'closed');
  assert(activePersistenceWriteCount(gate.writes) === 0, 'still zero');
});

test('B logout admission succeeds while a write is already active', () => {
  const gate = createSessionAdmissionGate();
  assert(tryBeginPersistenceWrite(gate) === true, 'write started');
  const result = admitAuthenticatedLogout(gate);
  assert(result.admitted === true, 'admitted despite active write');
  assert(gate.logoutInProgress === true, 'closed');
  assert(activePersistenceWriteCount(gate.writes) === 1, 'existing write unchanged');
});

test('C repeated logout admission is already-in-progress', () => {
  const gate = createSessionAdmissionGate();
  assert(admitAuthenticatedLogout(gate).admitted === true, 'first');
  const second = admitAuthenticatedLogout(gate);
  assert(second.admitted === false, 'second');
  if (!second.admitted) assert(second.reason === 'already-in-progress', 'reason');
});

test('D once logout begins, new writes are rejected', () => {
  const gate = createSessionAdmissionGate();
  assert(admitAuthenticatedLogout(gate).admitted === true, 'logout');
  assert(tryBeginPersistenceWrite(gate) === false, 'write refused');
  assert(activePersistenceWriteCount(gate.writes) === 0, 'not incremented');
});

test('E already-started write can decrement after logout begins', () => {
  const gate = createSessionAdmissionGate();
  assert(tryBeginPersistenceWrite(gate) === true, 'write started');
  assert(admitAuthenticatedLogout(gate).admitted === true, 'logout');
  assert(tryBeginPersistenceWrite(gate) === false, 'no new write');
  assert(activePersistenceWriteCount(gate.writes) === 1, 'started write remains');
  endActivePersistenceWrite(gate.writes);
  assert(activePersistenceWriteCount(gate.writes) === 0, 'settled');
});

test('F active write counter never becomes negative', () => {
  const gate = createSessionAdmissionGate();
  endActivePersistenceWrite(gate.writes);
  endActivePersistenceWrite(gate.writes);
  assert(activePersistenceWriteCount(gate.writes) === 0, 'not negative');
});

test('G beforeunload warns when count > 0 and bypass is unset', () => {
  assert(
    shouldWarnOnBeforeUnload({
      activePersistenceWrites: 1,
      logoutUnloadBypass: false,
    }) === true,
    'warn'
  );
});

test('H beforeunload does not warn when count === 0', () => {
  assert(
    shouldWarnOnBeforeUnload({
      activePersistenceWrites: 0,
      logoutUnloadBypass: false,
    }) === false,
    'no warn'
  );
});

test('I intentional bypass can be armed after logout even when a write remains', () => {
  const gate = createSessionAdmissionGate();
  assert(tryBeginPersistenceWrite(gate) === true, 'write started');
  assert(admitAuthenticatedLogout(gate).admitted === true, 'logout');
  assert(armLogoutUnloadBypass(gate) === true, 'armed');
  assert(gate.logoutUnloadBypass === true, 'flag');
  assert(activePersistenceWriteCount(gate.writes) === 1, 'write still settling');
});

test('J armed intentional bypass suppresses beforeunload warning', () => {
  const gate = createSessionAdmissionGate();
  tryBeginPersistenceWrite(gate);
  admitAuthenticatedLogout(gate);
  armLogoutUnloadBypass(gate);
  assert(
    shouldWarnOnBeforeUnload({
      activePersistenceWrites: activePersistenceWriteCount(gate.writes),
      logoutUnloadBypass: gate.logoutUnloadBypass,
    }) === false,
    'no warn'
  );
});

test('K bypass cannot be armed before logout begins', () => {
  const gate = createSessionAdmissionGate();
  assert(armLogoutUnloadBypass(gate) === false, 'blocked');
  assert(gate.logoutUnloadBypass === false, 'unset');
});

test('L canonical guest purge clears private state, preserves schoolAdminData, is idempotent', () => {
  const first = applyCanonicalGuestMemoryPurge(CANONICAL_SAMPLE);
  const second = applyCanonicalGuestMemoryPurge(first);
  for (const key of GUEST_PRIVATE_ARRAY_KEYS) {
    assert(Array.isArray(second[key]) && second[key].length === 0, key);
  }
  for (const key of GUEST_PRIVATE_OBJECT_KEYS) {
    assert(Object.keys(second[key] || {}).length === 0, key);
  }
  assert(second.schoolAdminData === CANONICAL_SAMPLE.schoolAdminData, 'preserved');
  assert(GUEST_PRESERVED_PUBLIC_KEYS.includes('schoolAdminData'), 'listed');
  assert(JSON.stringify(first.students) === JSON.stringify(second.students), 'idempotent');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
