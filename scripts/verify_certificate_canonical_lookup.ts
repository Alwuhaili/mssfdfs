import type { CurrentUser, GradeLevel, Parent, Student, StudentCertificate, Teacher } from '../src/types.ts';
import {
  filterCertificatesByStudentId,
  listPersistedCertificatesForRole,
  pickSelectedPersistedCertificate,
  resolveParentViewerStudentId,
  resolveStudentViewerStudentId,
  resolveTeacherCertificateScope,
  selectCanonicalCertificate,
} from '../src/utils/certificateCanonicalLookup.ts';

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

const cert = (partial: Partial<StudentCertificate>): StudentCertificate => ({
  id: 'cert-1',
  studentId: 'std-real',
  studentName: 'سارة أحمد',
  nationalId: '111',
  gradeLevel: 'الصف الرابع العلمي',
  section: 'ب',
  academicYear: '2026 - 2027',
  subjects: [
    {
      id: 'sub-1',
      subjectName: 'الرياضيات',
      firstTermAvg: 80,
      midYearGrade: 82,
      secondTermAvg: 84,
      annualSaeiAvg: 82,
      finalExamGrade: 85,
      finalGrade: 84,
      resitGrade: null,
      postResitGrade: 84,
    },
  ],
  overallFirstTermAvg: 80,
  overallMidYearGrade: 82,
  overallSecondTermAvg: 84,
  overallAnnualSaeiAvg: 82,
  overallFinalExamGrade: 85,
  overallFinalGrade: 84,
  status: 'ناجحة',
  appreciation: 'جيد جداً',
  issueDate: '2027-06-01',
  ...partial,
});

const student = (partial: Partial<Student>): Student => ({
  id: 'std-other',
  name: 'طالبة أخرى',
  nationalId: '999',
  parentName: 'ولي آخر',
  parentPhone: '07900000000',
  parentEmail: 'other-parent@example.com',
  gradeLevel: 'الصف السادس العلمي',
  section: 'أ',
  gpa: 90,
  status: 'منتظمة',
  enrollmentYear: '2026',
  ...partial,
});

const parent = (partial: Partial<Parent>): Parent => ({
  id: 'prt-1',
  name: 'ولي الأمر',
  phone: '07800000000',
  email: 'parent@example.com',
  studentId: 'std-real',
  studentName: 'سارة أحمد',
  gradeLevel: 'الصف الرابع العلمي',
  studentSection: 'ب',
  ...partial,
});

const teacher = (partial: Partial<Teacher>): Teacher => ({
  id: 'tch-1',
  name: 'مدرسة الفيزياء',
  subject: 'الفيزياء',
  email: 'teacher@example.com',
  phone: '07700000000',
  assignedGrades: ['الصف الرابع العلمي'],
  status: 'نشط',
  joinedDate: '2020-09-01',
  ...partial,
});

const user = (partial: Partial<CurrentUser>): CurrentUser => ({
  id: 'u-1',
  name: 'مستخدم',
  role: 'student',
  ...partial,
});

const persisted = [
  cert({}),
  cert({
    id: 'cert-year-prev',
    academicYear: '2025 - 2026',
    overallFinalGrade: 71,
    subjects: [
      {
        id: 'sub-1',
        subjectName: 'الرياضيات',
        firstTermAvg: 70,
        midYearGrade: 71,
        secondTermAvg: 72,
        annualSaeiAvg: 71,
        finalExamGrade: 70,
        finalGrade: 71,
        resitGrade: null,
        postResitGrade: 71,
      },
    ],
  }),
  cert({
    id: 'cert-other',
    studentId: 'std-other',
    studentName: 'طالبة أخرى',
    gradeLevel: 'الصف السادس العلمي',
    nationalId: '999',
    overallFinalGrade: 99,
  }),
];

const students = [
  student({
    id: 'std-real',
    name: 'سارة أحمد',
    parentId: 'prt-1',
    gradeLevel: 'الصف الرابع العلمي',
    section: 'ب',
  }),
  student({ id: 'std-other', name: 'طالبة أخرى' }),
];

test('1 admin, authorized teacher, student, and linked parent resolve the same persisted certificate', () => {
  const query = { studentId: 'std-real', academicYear: '2026 - 2027' };
  const adminCert = selectCanonicalCertificate(persisted, query);
  const studentId = resolveStudentViewerStudentId(user({ id: 'std-real', role: 'student', profileId: 'std-real' }), students);
  const parentId = resolveParentViewerStudentId(user({ id: 'prt-1', role: 'parent', profileId: 'prt-1' }), [parent({})], students);
  const teacherScope = resolveTeacherCertificateScope(user({ id: 'tch-1', role: 'teacher', profileId: 'tch-1' }), [teacher({})]);
  const studentList = listPersistedCertificatesForRole({
    role: 'student',
    certificates: persisted,
    students,
    currentUser: user({ id: 'std-real', role: 'student', profileId: 'std-real' }),
    academicYear: '2026 - 2027',
  });
  const parentList = listPersistedCertificatesForRole({
    role: 'parent',
    certificates: persisted,
    students,
    parents: [parent({})],
    currentUser: user({ id: 'prt-1', role: 'parent', profileId: 'prt-1' }),
    academicYear: '2026 - 2027',
  });
  const teacherList = listPersistedCertificatesForRole({
    role: 'teacher',
    certificates: persisted,
    teachers: [teacher({})],
    currentUser: user({ id: 'tch-1', role: 'teacher', profileId: 'tch-1' }),
    academicYear: '2026 - 2027',
    viewerStudentId: 'std-real',
  }).filter((row) => row.studentId === 'std-real');
  const adminList = listPersistedCertificatesForRole({
    role: 'admin',
    certificates: persisted,
    academicYear: '2026 - 2027',
  }).filter((row) => row.studentId === 'std-real');

  assert(adminCert?.id === 'cert-1', 'canonical');
  assert(studentId === 'std-real', 'student id');
  assert(parentId === 'std-real', 'parent id');
  assert(teacherScope.assignedGrades.includes('الصف الرابع العلمي' as GradeLevel), 'teacher scope');
  assert(studentList.length === 1 && studentList[0].id === 'cert-1', 'student list');
  assert(parentList.length === 1 && parentList[0].id === 'cert-1', 'parent list');
  assert(teacherList.length === 1 && teacherList[0].id === 'cert-1', 'teacher list');
  assert(adminList.length === 1 && adminList[0].id === 'cert-1', 'admin list');
  assert(studentList[0] === parentList[0] || studentList[0].overallFinalGrade === parentList[0].overallFinalGrade, 'same grades');
  assert(studentList[0].overallFinalGrade === 84, 'persisted grade');
});

test('2 other student cannot resolve the certificate', () => {
  const otherId = resolveStudentViewerStudentId(user({ id: 'std-other', role: 'student', profileId: 'std-other' }), students);
  const list = listPersistedCertificatesForRole({
    role: 'student',
    certificates: persisted,
    students,
    currentUser: user({ id: 'std-other', role: 'student', profileId: 'std-other' }),
  });
  assert(otherId === 'std-other', 'own id');
  assert(list.every((row) => row.studentId === 'std-other'), 'only own');
  assert(list.every((row) => row.id !== 'cert-1'), 'not sara');
  assert(selectCanonicalCertificate(list, { studentId: 'std-real', academicYear: '2026 - 2027' }) === null, 'cannot select other');
});

test('3 other parent cannot resolve the child certificate', () => {
  const otherParent = parent({ id: 'prt-2', studentId: 'std-other', email: 'parent@example.com', phone: '07800000000', name: 'ولي الأمر' });
  const childId = resolveParentViewerStudentId(user({ id: 'prt-2', role: 'parent', profileId: 'prt-2' }), [otherParent], students);
  const list = listPersistedCertificatesForRole({
    role: 'parent',
    certificates: persisted,
    students,
    parents: [otherParent],
    currentUser: user({ id: 'prt-2', role: 'parent', profileId: 'prt-2' }),
  });
  assert(childId === 'std-other', 'linked other child');
  assert(list.every((row) => row.studentId !== 'std-real'), 'no sara');
});

test('4 requested year is respected', () => {
  const prev = selectCanonicalCertificate(persisted, { studentId: 'std-real', academicYear: '2025-2026' });
  const current = selectCanonicalCertificate(persisted, { studentId: 'std-real', academicYear: '2026 - 2027' });
  assert(prev?.id === 'cert-year-prev', 'prev year');
  assert(current?.id === 'cert-1', 'current year');
  assert(prev?.overallFinalGrade === 71, 'prev grades');
  assert(current?.overallFinalGrade === 84, 'current grades');
});

test('5 missing certificate does not fabricate a result', () => {
  const empty = filterCertificatesByStudentId(persisted, 'std-missing');
  const selected = selectCanonicalCertificate(persisted, { studentId: 'std-missing', academicYear: '2026 - 2027' });
  const studentList = listPersistedCertificatesForRole({
    role: 'student',
    certificates: persisted,
    students,
    currentUser: user({ id: 'std-missing', role: 'student', profileId: 'std-missing' }),
  });
  assert(empty.length === 0, 'filter empty');
  assert(selected === null, 'select null');
  assert(studentList.length === 0, 'role list empty');
});

test('6 name/email/phone do not select another student', () => {
  const spoofed = resolveStudentViewerStudentId(
    user({
      id: 'unknown-user',
      role: 'student',
      name: 'سارة أحمد',
      email: 'other-parent@example.com',
      phone: '07900000000',
    }),
    students
  );
  assert(spoofed === null, 'no name match');
});

test('7 mismatched certificateId fail-closed', () => {
  const stolen = selectCanonicalCertificate(persisted, {
    studentId: 'std-real',
    certificateId: 'cert-other',
  });
  const ambiguous = selectCanonicalCertificate(persisted, { studentId: 'std-real' });
  assert(stolen === null, 'wrong id');
  assert(ambiguous === null, 'two years without explicit year/id');
});

test('8 teacher without assigned grades sees nothing', () => {
  const scoped = resolveTeacherCertificateScope(user({ id: 'tch-empty', role: 'teacher' }), [
    teacher({ id: 'tch-empty', assignedGrades: [] }),
  ]);
  const list = listPersistedCertificatesForRole({
    role: 'teacher',
    certificates: persisted,
    teachers: [teacher({ id: 'tch-empty', assignedGrades: [] })],
    currentUser: user({ id: 'tch-empty', role: 'teacher', profileId: 'tch-empty' }),
  });
  assert(scoped.assignedGrades.length === 0, 'no grades');
  assert(list.length === 0, 'empty list');
});

test('9 pickSelected never falls back to another student certificate', () => {
  const scoped = filterCertificatesByStudentId(persisted, 'std-real');
  assert(pickSelectedPersistedCertificate(scoped, 'cert-other') === null, 'foreign id ignored');
  assert(pickSelectedPersistedCertificate(scoped, null) === null, 'ambiguous unselected');
  assert(pickSelectedPersistedCertificate([persisted[0]], null)?.id === 'cert-1', 'single owned');
});

test('10 zero/unentered subject grades remain as persisted', () => {
  const withZero = cert({
    id: 'cert-zero',
    subjects: [
      {
        id: 'sub-z',
        subjectName: 'الفيزياء',
        firstTermAvg: 0,
        midYearGrade: null,
        secondTermAvg: 0,
        annualSaeiAvg: 0,
        finalExamGrade: 0,
        finalGrade: 0,
        resitGrade: null,
        postResitGrade: 0,
      },
    ],
  });
  const found = selectCanonicalCertificate([withZero], { studentId: 'std-real', certificateId: 'cert-zero' });
  assert(found?.subjects[0].firstTermAvg === 0, 'zero kept');
  assert(found?.subjects[0].midYearGrade === null, 'unentered kept');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
