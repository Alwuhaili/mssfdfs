import {
  canViewSchoolTimetable,
  filterTimetableForLinkedStudent,
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

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
