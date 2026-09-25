import { readFileSync } from 'node:fs';
import {
  assertNoWriteBackFromSnapshot,
  planCollectionPersistence,
} from '../src/utils/explicitPersistence.ts';
import {
  activePersistenceWriteCount,
  createSessionAdmissionGate,
  endActivePersistenceWrite,
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

const app = readFileSync('src/context/AppContext.tsx', 'utf8');
const certUi = readFileSync('src/components/StudentCertificateManager.tsx', 'utf8');
const gradesUi = readFileSync('src/components/StudentManualGradesEditorModal.tsx', 'utf8');

test('no generic database debounce timer', () => {
  assert(!app.includes('pushDebounceTimer'), 'pushDebounceTimer removed');
  assert(!app.includes('suppressDebouncedAutoPushRef'), 'suppress flag removed');
  assert(!app.includes('Debounced auto-push'), 'debounce effect removed');
});

test('no full-payload auto-persist', () => {
  assert(!app.includes('const getFullPayload'), 'getFullPayload removed');
  assert(!app.includes('pushUpdates('), 'no AppContext pushUpdates');
});

test('edit without save does not persist grades', () => {
  const start = app.indexOf('const updateSubjectGrade =');
  const end = app.indexOf('const batchUpdateStudentGrades');
  const body = app.slice(start, end);
  assert(start >= 0 && end > start, 'updateSubjectGrade block');
  assert(!body.includes('persistCollectionDoc'), 'no persist on grade typing');
  assert(!body.includes('persistEntityFromArray'), 'no entity persist on typing');
});

test('wait without save has no debounce write path', () => {
  assert(!app.includes('debounceDelay'), 'no persist debounce delay');
  assert(!app.includes('setTimeout(async () =>'), 'no delayed persist timer in AppContext');
});

test('certificate save is a targeted awaited write', () => {
  const start = app.indexOf('const batchUpdateStudentGrades = async');
  const end = app.indexOf('const commitCertificate = async');
  const body = app.slice(start, end);
  assert(body.includes("persistCollectionDoc('certificates'"), 'certificates/{id}');
  assert(body.includes('return persistCollectionDoc'), 'awaited');
  assert(gradesUi.includes('const ok = await batchUpdateStudentGrades'), 'UI awaits save');
  assert(gradesUi.includes('if (!ok)'), 'failure is not success');
  assert(certUi.includes('void commitCertificate(cert.id)'), 'inline grade Save commits');
});

test('student add/update use students/{id}', () => {
  assert(app.includes("persistCollectionDoc('students'"), 'student upsert');
  assert(app.includes("deleteCollectionDoc('students'"), 'student delete');
});

test('teacher add/update use teachers/{id}', () => {
  assert(app.includes("persistCollectionDoc('teachers'"), 'teacher upsert');
  assert(app.includes("deleteCollectionDoc('teachers'"), 'teacher delete');
});

test('library lecture write is lectures/{id}', () => {
  const start = app.indexOf('const addLecture = async');
  const end = app.indexOf('const deleteLecture = async');
  const body = app.slice(start, end);
  assert(body.includes("upsertCollectionDocument('lectures'"), 'lectures path');
  assert(body.includes('await runTrackedPersistenceWrite'), 'awaited');
  assert((body.match(/upsertCollectionDocument\('lectures'/g) || []).length === 1, 'one lecture write');
});

test('homepage school admin is dedicated settings write', () => {
  const start = app.indexOf('const updateSchoolAdminData = async');
  const end = app.indexOf('const persistPublicHomepageNews');
  const body = app.slice(start, end);
  assert(body.includes('patchSettingFields'), 'schoolAdminData path');
  assert(!body.includes('pushUpdates'), 'not full payload');
});

test('collection persistence helpers await every targeted write', () => {
  const start = app.indexOf('const persistChangedCollectionDocs = async');
  const end = app.indexOf('const beginPendingSyncMutation');
  const body = app.slice(start, end);
  assert(start >= 0 && end > start, 'async persistence helpers');
  assert(body.includes('await Promise.all'), 'batch helper awaits all writes');
  assert(!body.includes('void persistCollectionDoc'), 'batch helper has no fire-and-forget upsert');
  assert(!body.includes('void deleteCollectionDoc'), 'batch helper has no fire-and-forget delete');
  assert(body.includes('return persistCollectionDoc'), 'entity helper returns targeted write');
});

test('timetable save is targeted and awaited before local success', () => {
  const start = app.indexOf('const updateTimetableSlot = async');
  const end = app.indexOf('const exportDataJSON');
  const body = app.slice(start, end);
  assert(body.includes("await persistCollectionDoc('timetable'"), 'slot writes are awaited');
  assert(body.includes("await deleteCollectionDoc('timetable'"), 'slot delete is awaited');
  assert(body.includes("await persistChangedCollectionDocs('timetable'"), 'full timetable write is awaited');
  assert(body.includes('if (ok) setTimetable'), 'local timetable success follows Firestore success');
  assert(!body.includes("void persistCollectionDoc('timetable'"), 'no fire-and-forget timetable write');
});

test('snapshot apply does not write back', () => {
  const start = app.indexOf('const applyRemoteData =');
  const end = app.indexOf('// Initial Server Hydration');
  const body = app.slice(start, end);
  assert(!body.includes('persistCollectionDoc'), 'no persist from snapshot');
  assert(!body.includes('pushUpdates'), 'no push from snapshot');
  assert(assertNoWriteBackFromSnapshot({ snapshotApplied: true, persistenceInvoked: false }) === true, 'helper');
});

test('force sync is fetch-only', () => {
  const start = app.indexOf('const forceSyncAll = async');
  const end = app.indexOf('const resetCentralDatabase');
  const body = app.slice(start, end);
  assert(body.includes('fetchServerData'), 'read');
  assert(!body.includes('pushUpdates'), 'no write');
});

test('collection persist plan is targeted', () => {
  const previous = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  const next = [{ id: 'a', name: 'A2' }, { id: 'c', name: 'C' }];
  const withoutDeletes = planCollectionPersistence(previous, next);
  assert(withoutDeletes.upserts.map((x) => x.id).join(',') === 'a,c', 'upserts only');
  assert(withoutDeletes.deletes.length === 0, 'no inferred deletes');
  const withDeletes = planCollectionPersistence(previous, next, { includeDeletes: true });
  assert(withDeletes.deletes.join(',') === 'b', 'explicit replace may delete');
});

test('active write returns to zero after success and failure', () => {
  const okGate = createSessionAdmissionGate();
  assert(tryBeginPersistenceWrite(okGate) === true, 'begin success path');
  assert(activePersistenceWriteCount(okGate.writes) === 1, 'active');
  endActivePersistenceWrite(okGate.writes);
  assert(activePersistenceWriteCount(okGate.writes) === 0, 'zero after success');

  const failGate = createSessionAdmissionGate();
  assert(tryBeginPersistenceWrite(failGate) === true, 'begin failure path');
  try {
    throw new Error('write failed');
  } catch {
    endActivePersistenceWrite(failGate.writes);
  }
  assert(activePersistenceWriteCount(failGate.writes) === 0, 'zero after failure');
});

test('real active write retains unload protection', () => {
  const gate = createSessionAdmissionGate();
  tryBeginPersistenceWrite(gate);
  assert(
    shouldWarnOnBeforeUnload({
      activePersistenceWrites: activePersistenceWriteCount(gate.writes),
      logoutUnloadBypass: false,
    }) === true,
    'warn during write'
  );
  endActivePersistenceWrite(gate.writes);
  assert(
    shouldWarnOnBeforeUnload({
      activePersistenceWrites: activePersistenceWriteCount(gate.writes),
      logoutUnloadBypass: false,
    }) === false,
    'no warn after settle'
  );
});

test('polling skipped when realtime is active', () => {
  assert(app.includes('if (!force && centralSyncService.isRealtimeStreamActive()) return'), 'skip duplicate fetch');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
