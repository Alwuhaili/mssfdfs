import {
  applyParentProjectionPatches,
  canRunParentStudentSelfHeal,
  canViewSchoolTimetable,
  decideParentStudentSelfHealRun,
  EMPTY_PARENT_SELF_HEAL_GUARD,
  filterTimetableForLinkedStudent,
  nextParentStudentSelfHealGuard,
  parentSelfHealBlockedGenerationAfterFailure,
  parentStudentSelfHealUpdatesSignature,
  planParentStudentSelfHeal,
  resolveActiveParentRecord,
  resolveLinkedStudentForParent,
} from '../src/utils/parentStudentLink.ts';
import { canPersistTimetableWrites, resolveTimetableSettings } from '../src/utils/timetableSettings.ts';
import type { GradeLevel, Parent, Student, TimetableSlot } from '../src/types.ts';

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

const parent = (partial: Partial<Parent>): Parent => ({
  id: 'prt-1',
  name: 'ولي الأمر',
  phone: '07800000000',
  email: 'parent@example.com',
  studentId: 'std-real',
  studentName: 'الطالبة المرتبطة',
  gradeLevel: 'الصف الرابع العلمي' as GradeLevel,
  studentSection: 'ب',
  ...partial,
});

const student = (partial: Partial<Student>): Student => ({
  id: 'std-other',
  name: 'طالبة أخرى',
  nationalId: '111',
  parentName: 'ولي الأمر',
  parentPhone: '07800000000',
  parentEmail: 'parent@example.com',
  gradeLevel: 'الصف السادس العلمي',
  section: 'أ',
  gpa: 90,
  status: 'منتظمة',
  enrollmentYear: '2026',
  ...partial,
});

test('A Parent.studentId selects the real linked student', () => {
  const linked = resolveLinkedStudentForParent(parent({}), [
    student({ id: 'std-real', name: 'الطالبة المرتبطة', parentId: 'prt-1', section: 'ب', gradeLevel: 'الصف الرابع العلمي' }),
    student({ id: 'std-other', name: 'نغم علي الكعبي' }),
  ]);
  assert(linked?.studentId === 'std-real', 'id');
  assert(linked?.studentName === 'الطالبة المرتبطة', 'name');
  assert(linked?.section === 'ب', 'section');
});

test('B missing linked student yields null, never Nagham', () => {
  const linked = resolveLinkedStudentForParent(parent({ studentId: '' }), [
    student({ id: 'std-other', name: 'نغم علي الكعبي' }),
  ]);
  assert(linked === null, 'null');
  assert(JSON.stringify(linked) !== JSON.stringify({ name: 'نغم علي الكعبي' }), 'no nagham');
});

test('C similar parentName/email/phone does not link another student', () => {
  const linked = resolveLinkedStudentForParent(
    parent({ studentId: 'std-real', studentName: 'الطالبة المرتبطة' }),
    [
      student({
        id: 'std-imposter',
        name: 'نغم علي الكعبي',
        parentName: 'ولي الأمر',
        parentEmail: 'parent@example.com',
        parentPhone: '07800000000',
      }),
    ]
  );
  assert(linked?.studentId === 'std-real', 'keeps parent.studentId');
  assert(linked?.studentName !== 'نغم علي الكعبي', 'not imposter');
});

test('D students[0] is not used as fallback', () => {
  const linked = resolveLinkedStudentForParent(parent({ studentId: 'missing' }), [
    student({ id: 'std-first', name: 'الأولى في القائمة' }),
  ]);
  assert(linked?.studentId === 'missing', 'declared id');
  assert(linked?.studentName === 'الطالبة المرتبطة', 'parent projection name');
  assert(linked?.fromAuthoritativeStudentRecord === false, 'not list[0]');
});

test('E parent timetable uses linked gradeLevel and section', () => {
  const slots: TimetableSlot[] = [
    { id: '1', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف الرابع العلمي', section: 'ب', subject: 'الحاسوب', teacherName: 'أ' },
    { id: '2', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف الرابع العلمي', section: 'أ', subject: 'فيزياء', teacherName: 'ب' },
    { id: '3', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف السادس العلمي', section: 'ب', subject: 'كيمياء', teacherName: 'ج' },
  ];
  const filtered = filterTimetableForLinkedStudent(slots, {
    gradeLevel: 'الصف الرابع العلمي',
    section: 'ب',
  });
  assert(filtered.length === 1 && filtered[0].subject === 'الحاسوب', 'class filter');
});

test('F missing section yields no timetable slots', () => {
  const filtered = filterTimetableForLinkedStudent(
    [{ id: '1', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف الرابع العلمي', section: 'أ', subject: 'x', teacherName: 'y' }],
    { gradeLevel: 'الصف الرابع العلمي' }
  );
  assert(filtered.length === 0, 'no invented section');
});

test('G parent can view timetable', () => {
  assert(canViewSchoolTimetable('parent') === true, 'view');
});

test('H parent cannot persist timetable writes', () => {
  assert(canPersistTimetableWrites('parent', 'parent') === false, 'no persist');
});

test('I admin timetable persist unchanged', () => {
  assert(canPersistTimetableWrites('admin', 'admin') === true, 'admin persist');
  assert(canViewSchoolTimetable('admin') === true, 'admin view');
});

test('J teacher and student view without persist', () => {
  assert(canViewSchoolTimetable('teacher') === true && canPersistTimetableWrites('teacher', 'teacher') === false, 'teacher');
  assert(canViewSchoolTimetable('student') === true && canPersistTimetableWrites('student', 'student') === false, 'student');
});

test('K legacy timetable settings defaults unchanged', () => {
  const resolved = resolveTimetableSettings(undefined);
  assert(resolved.periodsPerDay === 7, '7');
  assert(resolved.workingDays.join() === 'الأحد,الإثنين,الثلاثاء,الأربعاء,الخميس', 'days');
});

test('parent record resolved by id not email', () => {
  const resolved = resolveActiveParentRecord(
    { id: 'prt-1', email: 'shared@example.com' },
    [
      parent({ id: 'prt-other', email: 'shared@example.com', studentId: 'wrong' }),
      parent({ id: 'prt-1', email: 'shared@example.com', studentId: 'std-real' }),
    ]
  );
  assert(resolved?.id === 'prt-1', 'id match');
});

test('slot without section is not treated as شعبة أ', () => {
  const filtered = filterTimetableForLinkedStudent(
    [{ id: '1', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف الرابع العلمي', subject: 'بلا شعبة', teacherName: 'أ' }],
    { gradeLevel: 'الصف الرابع العلمي', section: 'أ' }
  );
  assert(filtered.length === 0, 'empty section is not أ');
});

test('slot section أ appears only for linked section أ', () => {
  const slotA: TimetableSlot = {
    id: 'a',
    day: 'الأحد',
    period: 1,
    timeSlot: '',
    gradeLevel: 'الصف الرابع العلمي',
    section: 'أ',
    subject: 'عربي',
    teacherName: 'أ',
  };
  assert(filterTimetableForLinkedStudent([slotA], { gradeLevel: 'الصف الرابع العلمي', section: 'أ' }).length === 1, 'أ sees أ');
  assert(filterTimetableForLinkedStudent([slotA], { gradeLevel: 'الصف الرابع العلمي', section: 'ب' }).length === 0, 'ب does not see أ');
});

test('slot section ب does not appear for linked section أ', () => {
  const filtered = filterTimetableForLinkedStudent(
    [{ id: 'b', day: 'الأحد', period: 1, timeSlot: '', gradeLevel: 'الصف الرابع العلمي', section: 'ب', subject: 'فيزياء', teacherName: 'ب' }],
    { gradeLevel: 'الصف الرابع العلمي', section: 'أ' }
  );
  assert(filtered.length === 0, 'ب hidden from أ');
});

test('slot section الكل is not guessed as أ and is not a documented shared timetable cell', () => {
  const slot: TimetableSlot = {
    id: 'all',
    day: 'الأحد',
    period: 1,
    timeSlot: '',
    gradeLevel: 'الصف الرابع العلمي',
    section: 'الكل',
    subject: 'نشاط',
    teacherName: 'إدارة',
  };
  assert(filterTimetableForLinkedStudent([slot], { gradeLevel: 'الصف الرابع العلمي', section: 'أ' }).length === 0, 'not أ');
  assert(filterTimetableForLinkedStudent([slot], { gradeLevel: 'الصف الرابع العلمي', section: 'ب' }).length === 0, 'not shared class');
});

const linkedStudent = (partial: Partial<Student> = {}): Student =>
  student({
    id: 'std-real',
    name: 'الطالبة المرتبطة',
    parentId: 'prt-1',
    gradeLevel: 'الصف الرابع العلمي',
    section: 'ب',
    ...partial,
  });

const adminReady = {
  role: 'admin',
  currentUserRole: 'admin',
  hydrated: true,
  authoritativeParents: true,
  authoritativeStudents: true,
  pendingParents: false,
  pendingStudents: false,
};

test('self-heal A missing studentSection patches section only', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  assert(plan.updates.length === 1, 'one update');
  assert(plan.updates[0].parentId === 'prt-1', 'parentId');
  assert(plan.updates[0].studentId === 'std-real', 'studentId');
  assert(plan.updates[0].patch.studentSection === 'ب', 'section');
  assert(plan.updates[0].patch.studentName === undefined, 'no name');
  assert(plan.updates[0].patch.gradeLevel === undefined, 'no grade');
});

test('self-heal B stale studentName patches name only', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentName: 'اسم قديم' })],
    [linkedStudent()]
  );
  assert(plan.updates.length === 1, 'one');
  assert(plan.updates[0].patch.studentName === 'الطالبة المرتبطة', 'name');
  assert(Object.keys(plan.updates[0].patch).join(',') === 'studentName', 'only name');
});

test('self-heal C stale gradeLevel patches grade only', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ gradeLevel: 'الصف الأول المتوسط' })],
    [linkedStudent()]
  );
  assert(plan.updates.length === 1, 'one');
  assert(plan.updates[0].patch.gradeLevel === 'الصف الرابع العلمي', 'grade');
  assert(Object.keys(plan.updates[0].patch).join(',') === 'gradeLevel', 'only grade');
});

test('self-heal D all three stale patches only projection fields', () => {
  const plan = planParentStudentSelfHeal(
    [
      parent({
        studentName: 'قديم',
        gradeLevel: 'الصف الأول المتوسط',
        studentSection: undefined,
      }),
    ],
    [linkedStudent()]
  );
  assert(plan.updates.length === 1, 'one');
  assert(plan.updates[0].patch.studentName === 'الطالبة المرتبطة', 'name');
  assert(plan.updates[0].patch.gradeLevel === 'الصف الرابع العلمي', 'grade');
  assert(plan.updates[0].patch.studentSection === 'ب', 'section');
  assert(Object.keys(plan.updates[0].patch).sort().join(',') === 'gradeLevel,studentName,studentSection', 'only three');
});

test('self-heal E already correct yields no update', () => {
  const plan = planParentStudentSelfHeal([parent({})], [linkedStudent()]);
  assert(plan.updates.length === 0, 'none');
  assert(plan.unchanged.length === 1, 'unchanged');
  assert(plan.unchanged[0].code === 'UNCHANGED', 'code');
});

test('self-heal F missing studentId is UNLINKED', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentId: '', studentName: 'الطالبة المرتبطة' })],
    [linkedStudent()]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.unlinked.length === 1, 'unlinked');
  assert(plan.unlinked[0].code === 'UNLINKED', 'code');
});

test('self-heal G missing Student is MISSING_STUDENT', () => {
  const plan = planParentStudentSelfHeal([parent({})], []);
  assert(plan.updates.length === 0, 'none');
  assert(plan.missingStudents.length === 1, 'missing');
  assert(plan.missingStudents[0].code === 'MISSING_STUDENT', 'code');
});

test('self-heal H conflicting Student.parentId is CONFLICT', () => {
  const plan = planParentStudentSelfHeal(
    [parent({})],
    [linkedStudent({ parentId: 'prt-other' })]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.conflicts.length === 1, 'conflict');
  assert(plan.conflicts[0].code === 'CONFLICT', 'code');
});

test('self-heal I two parents same studentId is AMBIGUOUS', () => {
  const plan = planParentStudentSelfHeal(
    [
      parent({ id: 'prt-1', studentSection: undefined }),
      parent({ id: 'prt-2', studentSection: undefined }),
    ],
    [linkedStudent({ parentId: 'prt-1' })]
  );
  assert(plan.updates.length === 0, 'no write');
  assert(plan.ambiguous.length === 2, 'both flagged');
});

test('self-heal J empty Student.section is not guessed as أ', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent({ section: '' })]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.unchanged[0]?.code === 'INVALID_STUDENT_SECTION', 'invalid');
  assert(!JSON.stringify(plan).includes('"studentSection":"أ"'), 'no أ');
});

test('self-heal K Student.section الكل is rejected', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent({ section: 'الكل' })]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.unchanged[0]?.code === 'INVALID_STUDENT_SECTION', 'invalid');
  assert(plan.updates.every((item) => item.patch.studentSection !== 'الكل'), 'not الكل');
});

test('self-heal L matching names with different IDs do not link', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentId: 'std-real', studentName: 'نغم علي الكعبي', studentSection: undefined })],
    [student({ id: 'std-other', name: 'نغم علي الكعبي', parentId: 'prt-1', section: 'ب' })]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.missingStudents.length === 1, 'missing by id');
});

test('self-heal M matching phone/email with different IDs do not link', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentId: 'std-missing' })],
    [
      student({
        id: 'std-other',
        parentId: 'prt-1',
        parentPhone: '07800000000',
        parentEmail: 'parent@example.com',
      }),
    ]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.missingStudents.length === 1, 'id only');
});

test('self-heal N second planner pass after patch is empty', () => {
  const firstParents = [parent({ studentName: 'قديم', studentSection: undefined })];
  const first = planParentStudentSelfHeal(firstParents, [linkedStudent()]);
  assert(first.updates.length === 1, 'first write');
  const after = applyParentProjectionPatches(firstParents, first);
  const second = planParentStudentSelfHeal(after, [linkedStudent()]);
  assert(second.updates.length === 0, 'second empty');
});

test('self-heal O empty Student.parentId is fail-closed', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent({ parentId: '' })]
  );
  assert(plan.updates.length === 0, 'none');
  assert(plan.conflicts.length === 1, 'conflict bucket');
  assert(plan.conflicts[0].code === 'STUDENT_PARENT_ID_MISSING', 'code');
});

test('self-heal P non-admin cannot run', () => {
  assert(
    canRunParentStudentSelfHeal({ ...adminReady, role: 'parent', currentUserRole: 'parent' }) === false,
    'parent'
  );
  assert(
    canRunParentStudentSelfHeal({ ...adminReady, role: 'teacher', currentUserRole: 'teacher' }) === false,
    'teacher'
  );
  assert(
    canRunParentStudentSelfHeal({ ...adminReady, role: 'principal', currentUserRole: 'principal' }) === false,
    'principal'
  );
  assert(canPersistTimetableWrites('admin', 'admin') === true, 'admin timetable');
});

test('self-heal Q pending students or parents cannot run', () => {
  assert(canRunParentStudentSelfHeal({ ...adminReady, pendingStudents: true }) === false, 'students');
  assert(canRunParentStudentSelfHeal({ ...adminReady, pendingParents: true }) === false, 'parents');
  assert(canRunParentStudentSelfHeal({ ...adminReady, hydrated: false }) === false, 'loading');
});

test('self-heal R admin authoritative stable data allows planned patches', () => {
  assert(canRunParentStudentSelfHeal(adminReady) === true, 'can run');
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  assert(canRunParentStudentSelfHeal(adminReady) && plan.updates.length === 1, 'planned');
  assert(plan.updates[0].patch.studentSection === 'ب', 'targeted section');
});

test('self-heal signature empty plan commits without attempting write', () => {
  const signature = parentStudentSelfHealUpdatesSignature({ updates: [] });
  const decision = decideParentStudentSelfHealRun({
    updatesCount: 0,
    signature,
    inFlight: false,
    guard: EMPTY_PARENT_SELF_HEAL_GUARD,
    currentGeneration: 0,
  });
  assert(decision.action === 'commit-empty', decision.action);
  const next = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'empty-plan',
    signature,
  });
  assert(next.lastCommittedSignature === signature, 'committed empty');
});

test('self-heal signature success blocks redundant execution of the same plan', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  const signature = parentStudentSelfHealUpdatesSignature(plan);
  const afterSuccess = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'attempt-success',
    signature,
  });
  const again = decideParentStudentSelfHealRun({
    updatesCount: plan.updates.length,
    signature,
    inFlight: false,
    guard: afterSuccess,
    currentGeneration: 4,
  });
  assert(again.action === 'skip', again.action);
  assert(again.reason === 'already-committed', again.reason);
});

test('self-heal signature failure does not commit and skips own settle generation', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  const signature = parentStudentSelfHealUpdatesSignature(plan);
  const generation = 7;
  const afterFalse = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'attempt-failure',
    signature,
    currentGeneration: generation,
  });
  const afterThrow = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'attempt-failure',
    signature,
    currentGeneration: generation,
  });
  assert(afterFalse.lastCommittedSignature === '', 'ok=false does not commit');
  assert(afterThrow.lastCommittedSignature === '', 'throw does not commit');
  assert(afterFalse.lastFailedAtGeneration === parentSelfHealBlockedGenerationAfterFailure(generation), 'blocked gen');
  const settleRun = decideParentStudentSelfHealRun({
    updatesCount: plan.updates.length,
    signature,
    inFlight: false,
    guard: afterFalse,
    currentGeneration: generation + 1,
  });
  assert(settleRun.action === 'skip', settleRun.action);
  assert(settleRun.reason === 'awaiting-new-generation-after-failure', settleRun.reason);
});

test('self-heal signature retries the same plan after a later generation', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  const signature = parentStudentSelfHealUpdatesSignature(plan);
  const afterFailure = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'attempt-failure',
    signature,
    currentGeneration: 3,
  });
  const laterSnapshot = decideParentStudentSelfHealRun({
    updatesCount: plan.updates.length,
    signature,
    inFlight: false,
    guard: afterFailure,
    currentGeneration: 5,
  });
  assert(laterSnapshot.action === 'attempt', laterSnapshot.action);
});

test('self-heal in-flight blocks concurrent duplicate attempt', () => {
  const plan = planParentStudentSelfHeal(
    [parent({ studentSection: undefined })],
    [linkedStudent()]
  );
  const decision = decideParentStudentSelfHealRun({
    updatesCount: plan.updates.length,
    signature: parentStudentSelfHealUpdatesSignature(plan),
    inFlight: true,
    guard: EMPTY_PARENT_SELF_HEAL_GUARD,
    currentGeneration: 0,
  });
  assert(decision.action === 'skip', decision.action);
  assert(decision.reason === 'in-flight', decision.reason);
});

test('self-heal partial success with a new smaller signature still waits for a later generation', () => {
  const firstParent = parent({ id: 'prt-1', studentId: 'std-real', studentSection: undefined });
  const secondParent = parent({ id: 'prt-2', studentId: 'std-2', studentSection: undefined });
  const students = [
    linkedStudent({ id: 'std-real', parentId: 'prt-1' }),
    linkedStudent({ id: 'std-2', parentId: 'prt-2', name: 'الطالبة الثانية' }),
  ];
  const originalPlan = planParentStudentSelfHeal([firstParent, secondParent], students);
  assert(originalPlan.updates.length >= 2, 'at least two updates');
  const originalSignature = parentStudentSelfHealUpdatesSignature(originalPlan);
  const generation = 4;
  const afterPartialFailure = nextParentStudentSelfHealGuard(EMPTY_PARENT_SELF_HEAL_GUARD, {
    type: 'attempt-failure',
    signature: originalSignature,
    currentGeneration: generation,
  });
  const remainingParents = applyParentProjectionPatches([firstParent, secondParent], {
    ...originalPlan,
    updates: originalPlan.updates.filter((item) => item.parentId === 'prt-1'),
  });
  const remainingPlan = planParentStudentSelfHeal(remainingParents, students);
  assert(remainingPlan.updates.length === 1, 'failed item remains');
  assert(remainingPlan.updates[0].parentId === 'prt-2', 'remaining is the failed parent');
  const remainingSignature = parentStudentSelfHealUpdatesSignature(remainingPlan);
  assert(remainingSignature !== originalSignature, 'signature changed after partial success');
  const settleGeneration = parentSelfHealBlockedGenerationAfterFailure(generation);
  const blocked = decideParentStudentSelfHealRun({
    updatesCount: remainingPlan.updates.length,
    signature: remainingSignature,
    inFlight: false,
    guard: afterPartialFailure,
    currentGeneration: settleGeneration,
  });
  assert(blocked.action === 'skip', blocked.action);
  assert(blocked.reason === 'awaiting-new-generation-after-failure', blocked.reason);
  const later = decideParentStudentSelfHealRun({
    updatesCount: remainingPlan.updates.length,
    signature: remainingSignature,
    inFlight: false,
    guard: afterPartialFailure,
    currentGeneration: settleGeneration + 1,
  });
  assert(later.action === 'attempt', later.action);
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
