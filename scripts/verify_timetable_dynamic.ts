import {
  CALENDAR_WEEKDAYS,
  DEFAULT_PERIODS_PER_DAY,
  DEFAULT_WORKING_DAYS,
  buildPeriodTimings,
  calculateTimetableUtilization,
  calculateWeeklyCapacity,
  facultyAsTeacherList,
  formatPeriodTimeSlot,
  getAllActiveGradeSections,
  getUniqueOccupiedTimetableCells,
  intersectWorkingDays,
  normalizePeriodTimes,
  normalizePeriodsPerDay,
  normalizeWorkingDays,
  resolveActiveGradeSections,
  resolveTimetableFaculty,
  resolveTimetableSettings,
  sanitizeTimetableFacultyList,
  buildTimetableAcademicSnapshot,
  canPersistTimetableWrites,
  timetableAcademicSnapshotEquals,
} from '../src/utils/timetableSettings.ts';
import { auditSchoolTimetableConflicts, generateSmartTimetable, isSameTeacher } from '../src/utils/timetableGenerator.ts';
import type { GradeLevel, Student, Teacher, TimetableSlot } from '../src/types.ts';

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

const slot = (partial: Partial<TimetableSlot>): TimetableSlot => ({
  id: partial.id || `id-${Math.random()}`,
  day: partial.day || 'الأحد',
  period: partial.period ?? 1,
  timeSlot: partial.timeSlot || '',
  gradeLevel: (partial.gradeLevel || 'الصف الرابع العلمي') as GradeLevel,
  section: partial.section || 'أ',
  subject: partial.subject || 'الحاسوب',
  teacherName: partial.teacherName || 'محمد نعمة كاظم كريدي الوحيلي',
  teacherId: partial.teacherId,
});

test('A missing timetableSettings uses Sunday-Thursday and 7 periods', () => {
  const resolved = resolveTimetableSettings(undefined);
  assert(resolved.workingDays.join() === DEFAULT_WORKING_DAYS.join(), 'default days');
  assert(resolved.periodsPerDay === DEFAULT_PERIODS_PER_DAY, 'default periods');
});

test('B Friday can be a working day', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  });
  assert(resolved.workingDays.includes('الجمعة'), 'friday');
  assert(!resolved.workingDays.includes('السبت'), 'saturday still off');
});

test('C Saturday can be a working day', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'],
  });
  assert(resolved.workingDays.includes('السبت'), 'saturday');
});

test('D Friday and Saturday can both be working', () => {
  const resolved = resolveTimetableSettings({ workingDays: [...CALENDAR_WEEKDAYS] });
  assert(resolved.workingDays.length === 7, 'all seven');
});

test('E Sunday holiday Friday working', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  });
  assert(!resolved.workingDays.includes('الأحد'), 'sunday off');
  assert(resolved.workingDays[0] === 'الإثنين', 'calendar order');
  assert(resolved.workingDays.includes('الجمعة'), 'friday on');
});

test('F four working days only', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'],
  });
  assert(resolved.workingDays.length === 4, 'four days');
});

test('G duplicate workingDays are uniqued in calendar order', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الخميس', 'الأحد', 'الأحد', 'السبت'],
  });
  assert(resolved.workingDays.join() === ['الأحد', 'الخميس', 'السبت'].join(), 'ordered unique');
});

test('H invalid workingDays fall back to Sunday-Thursday', () => {
  const resolved = resolveTimetableSettings({ workingDays: ['Monday', 'not-a-day'] });
  assert(resolved.workingDays.join() === DEFAULT_WORKING_DAYS.join(), 'invalid fallback');
});

test('I periodsPerDay 6', () => {
  assert(resolveTimetableSettings({ periodsPerDay: 6 }).periodsPerDay === 6, 'six');
});

test('J periodsPerDay 7', () => {
  assert(resolveTimetableSettings({ periodsPerDay: 7 }).periodsPerDay === 7, 'seven');
});

test('K periodsPerDay 8', () => {
  assert(resolveTimetableSettings({ periodsPerDay: 8 }).periodsPerDay === 8, 'eight');
});

test('L periodsPerDay 0 invalid', () => {
  assert(normalizePeriodsPerDay(0) === null, 'zero');
  assert(resolveTimetableSettings({ periodsPerDay: 0 }).periodsPerDay === 7, 'fallback 7');
});

test('M negative periods invalid', () => {
  assert(normalizePeriodsPerDay(-3) === null, 'negative');
});

test('N decimal periods invalid', () => {
  assert(normalizePeriodsPerDay(7.5) === null, 'decimal');
});

test('O 11x5x7 = 385', () => {
  assert(calculateWeeklyCapacity(11, 5, 7) === 385, '385');
});

test('P 20x6x7 = 840', () => {
  assert(calculateWeeklyCapacity(20, 6, 7) === 840, '840');
});

test('Q 24x6x8 = 1152', () => {
  assert(calculateWeeklyCapacity(24, 6, 8) === 1152, '1152');
});

test('R 10x4x6 = 240', () => {
  assert(calculateWeeklyCapacity(10, 4, 6) === 240, '240');
});

test('S no capacity ceiling in helper', () => {
  assert(calculateWeeklyCapacity(50, 7, 12) === 4200, 'unbounded');
});

test('T default period times 1..7 preserved', () => {
  const timings = buildPeriodTimings(resolveTimetableSettings(undefined));
  assert(timings.length === 7, 'seven timings');
  assert(timings[0].timeSlot === '08:00 - 08:45', 'p1');
  assert(timings[6].timeSlot === '13:00 - 13:45', 'p7');
});

test('U periodsPerDay 6 exposes 1..6', () => {
  const timings = buildPeriodTimings(resolveTimetableSettings({ periodsPerDay: 6 }));
  assert(timings.map((t) => t.period).join() === '1,2,3,4,5,6', '1-6');
});

test('V period 8 exists without invented time', () => {
  const timings = buildPeriodTimings(resolveTimetableSettings({ periodsPerDay: 8 }));
  assert(timings.length === 8, 'eight');
  assert(timings[7].period === 8, 'period 8');
  assert(timings[7].timeSlot === '', 'no invented clock');
  assert(timings[7].label.includes('8') || timings[7].label.includes('الثامنة'), 'label');
});

test('W custom time for period 8', () => {
  const resolved = resolveTimetableSettings({
    periodsPerDay: 8,
    periodTimes: [{ period: 8, startTime: '13:50', endTime: '14:35' }],
  });
  assert(formatPeriodTimeSlot(resolved.periodTimes[7]) === '13:50 - 14:35', 'custom 8');
});

test('X teacher time collision', () => {
  const settings = resolveTimetableSettings(undefined);
  const audit = auditSchoolTimetableConflicts(
    [
      slot({ id: 'a', day: 'الأحد', period: 1, gradeLevel: 'الصف الرابع العلمي', section: 'أ' }),
      slot({ id: 'b', day: 'الأحد', period: 1, gradeLevel: 'الصف الخامس العلمي', section: 'أ' }),
    ],
    [],
    [],
    settings
  );
  assert(audit.timeConflicts.length === 1, 'one collision');
});

test('Y teacher availability violation distinct from school holiday', () => {
  const settings = resolveTimetableSettings(undefined);
  const faculty: Teacher[] = [
    {
      id: 't1',
      name: 'محمد نعمة كاظم كريدي الوحيلي',
      subject: 'الحاسوب',
      email: '',
      phone: '',
      assignedGrades: [],
      status: 'نشط',
      joinedDate: '',
      availableDays: ['الأحد', 'الإثنين'],
    },
  ];
  const audit = auditSchoolTimetableConflicts(
    [slot({ id: 'thu', day: 'الخميس', period: 2 })],
    [],
    faculty,
    settings
  );
  assert(audit.teacherAvailabilityViolations.length === 1, 'teacher off');
  assert(audit.schoolDayViolations.length === 0, 'still a school day');
});

test('Z schoolDayViolation is separate', () => {
  const settings = resolveTimetableSettings(undefined);
  const audit = auditSchoolTimetableConflicts(
    [slot({ id: 'fri', day: 'الجمعة', period: 1 })],
    [],
    [],
    settings
  );
  assert(audit.schoolDayViolations.length === 1, 'friday school holiday');
  assert(audit.teacherAvailabilityViolations.length === 0, 'not teacher-off');
});

test('AA periodRangeViolation is separate', () => {
  const settings = resolveTimetableSettings({ periodsPerDay: 7 });
  const audit = auditSchoolTimetableConflicts(
    [slot({ id: 'p9', period: 9, day: 'الأحد' })],
    [],
    [],
    settings
  );
  assert(audit.periodRangeViolations.length === 1, 'period 9');
});

test('AB duplicate logical cell detected', () => {
  const cells = getUniqueOccupiedTimetableCells([
    slot({ id: '1', day: 'الأحد', period: 1, section: 'أ' }),
    slot({ id: '2', day: 'الأحد', period: 1, section: 'أ' }),
  ]);
  assert(cells.length === 1, 'unique');
  assert(cells[0].slotIds.length === 2, 'duplicate ids');
});

test('AC same dataset same audit regardless of unused role argument', () => {
  const settings = resolveTimetableSettings(undefined);
  const data = [slot({ id: 'x', day: 'الأحد', period: 1 })];
  const a = auditSchoolTimetableConflicts(data, [], [], settings);
  const b = auditSchoolTimetableConflicts(data, [], [], settings);
  assert(a.totalConflicts === b.totalConflicts, 'parity');
});

test('role faculty projection ignores extra PII fields', () => {
  const sanitized = sanitizeTimetableFacultyList([
    {
      id: 't1',
      name: 'أ. اختبار',
      subject: 'الحاسوب',
      email: 'secret@example.com',
      phone: '0770',
      nationalId: 'hidden',
      assignedGrades: [],
      status: 'نشط',
      joinedDate: '',
      availableDays: ['الأحد'],
    },
  ]);
  assert(!('email' in sanitized[0]), 'no email');
  assert(!('phone' in sanitized[0]), 'no phone');
  assert(sanitized[0].subject === 'الحاسوب', 'subject kept');
});

test('resolveTimetableFaculty prefers school projection over empty local teachers', () => {
  const resolved = resolveTimetableFaculty(
    {
      principalName: '',
      principalBadge: '',
      principalTitle: '',
      principalDegree: '',
      principalImageUrl: '',
      visionMessage: '',
      achievements: [],
      timetableFaculty: [{ id: 'cs1', name: 'محمد نعمة كاظم كريدي الوحيلي', subject: 'الحاسوب' }],
    },
    []
  );
  assert(resolved.length === 1 && resolved[0].subject === 'الحاسوب', 'projection used');
});

test('resolveTimetableFaculty falls back to subjectQuotas without PII', () => {
  const resolved = resolveTimetableFaculty(undefined, [], [
    { teacherName: 'أ. مروة كمال الساعدي', subjectName: 'الرياضيات', availableDays: ['الأحد', 'الجمعة'] },
  ]);
  assert(resolved.length === 1, 'quota faculty');
  assert(resolved[0].name === 'أ. مروة كمال الساعدي', 'name');
  assert(resolved[0].subject === 'الرياضيات', 'subject');
  assert(!('phone' in resolved[0]) && !('email' in resolved[0]), 'no PII');
});

test('AD-AH generator respects holiday and period bounds', () => {
  const settings = resolveTimetableSettings({
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'],
    periodsPerDay: 6,
  });
  const result = generateSmartTimetable(
    'الصف السادس العلمي',
    'أ',
    [
      {
        id: 'q1',
        gradeLevel: 'الصف السادس العلمي',
        subjectName: 'الحاسوب',
        weeklyPeriods: 2,
        teacherName: 'محمد نعمة كاظم كريدي الوحيلي',
      },
    ],
    [],
    [],
    [{ id: 's1', name: 'ط', gradeLevel: 'الصف السادس العلمي', section: 'أ' } as Student],
    settings
  );
  assert(result.success, result.message);
  assert(result.slots.every((s) => settings.workingDays.includes(s.day as any)), 'no holiday slots');
  assert(result.slots.every((s) => s.period >= 1 && s.period <= 6), 'period range');
  assert(result.slots.length === 4 * 6, 'section capacity 24');
});

test('AJ teacher days intersect school days', () => {
  const days = intersectWorkingDays(['الأحد', 'السبت'], ['الأحد', 'الإثنين']);
  assert(days.join() === 'الأحد', 'saturday dropped');
});

test('AK more sections do not require code changes', () => {
  const students = Array.from({ length: 20 }).map((_, i) => ({
    id: `s${i}`,
    name: `ط${i}`,
    gradeLevel: 'الصف الأول المتوسط',
    section: String.fromCharCode(1571 + (i % 10)),
  })) as Student[];
  const sections = getAllActiveGradeSections(students);
  assert(sections.length >= 1, 'dynamic count');
  assert(calculateWeeklyCapacity(sections.length, 5, 7) === sections.length * 35, 'scales');
});

test('isSameTeacher does not match on first two words only', () => {
  assert(
    isSameTeacher('محمد علي حسين', 'محمد علي كاظم') === false,
    'two-word false positive blocked'
  );
});

test('legacy three-token containment still matches', () => {
  assert(
    isSameTeacher('محمد نعمة كاظم', 'محمد نعمة كاظم كريدي الوحيلي') === true,
    'compound name'
  );
});

test('invalid periodTimes do not reset workingDays', () => {
  const resolved = resolveTimetableSettings({
    workingDays: ['الجمعة'],
    periodsPerDay: 8,
    periodTimes: [{ period: 'bad' as unknown as number, startTime: 'xx' }],
  });
  assert(resolved.workingDays.join() === 'الجمعة', 'days kept');
  assert(resolved.periodsPerDay === 8, 'periods kept');
});

test('normalization of empty workingDays uses default', () => {
  assert(normalizeWorkingDays([]) === null, 'empty');
});

test('utilization empty cells never negative', () => {
  const stats = calculateTimetableUtilization(
    Array.from({ length: 400 }).map((_, i) =>
      slot({ id: `s${i}`, day: 'الأحد', period: (i % 7) + 1, section: String(i) })
    ),
    1,
    resolveTimetableSettings(undefined)
  );
  assert(stats.emptyCells >= 0, 'non-negative');
});

test('facultyAsTeacherList has no phone/email secrets', () => {
  const list = facultyAsTeacherList([{ id: '1', name: 'أ', subject: 'حاسوب' }]);
  assert(list[0].phone === '' && list[0].email === '', 'blank contact');
});

function emptyAdmin(extra: Record<string, unknown> = {}) {
  return {
    principalName: '',
    principalBadge: '',
    principalTitle: '',
    principalDegree: '',
    principalImageUrl: '',
    visionMessage: '',
    achievements: [],
    ...extra,
  };
}

test('1 absent timetableFaculty uses legacy fallback', () => {
  const resolved = resolveTimetableFaculty(emptyAdmin(), [], [
    { teacherName: 'أ. مروة كمال الساعدي', subjectName: 'الرياضيات' },
  ]);
  assert(resolved.length === 1 && resolved[0].name === 'أ. مروة كمال الساعدي', 'quota fallback');
});

test('2 timetableFaculty [] is authoritative empty, no stale fallback', () => {
  const resolved = resolveTimetableFaculty(
    emptyAdmin({ timetableFaculty: [] }),
    [{ id: 't1', name: 'أ. قديم', subject: 'فيزياء', email: '', phone: '', assignedGrades: [], status: 'نشط', joinedDate: '' }],
    [{ teacherName: 'أ. مروة كمال الساعدي', subjectName: 'الرياضيات' }]
  );
  assert(resolved.length === 0, 'empty projection wins');
});

test('3 absent timetableActiveSections uses student fallback without inventing sections', () => {
  const none = resolveActiveGradeSections(emptyAdmin(), []);
  assert(none.length === 0, 'no dummy section');
  const some = resolveActiveGradeSections(emptyAdmin(), [
    { id: 's1', name: 'ط', gradeLevel: 'الصف الأول المتوسط', section: 'ب' } as Student,
  ]);
  assert(some.length === 1 && some[0].section === 'ب', 'from students');
});

test('4 timetableActiveSections [] is authoritative empty', () => {
  const resolved = resolveActiveGradeSections(
    emptyAdmin({ timetableActiveSections: [] }),
    [{ id: 's1', name: 'ط', gradeLevel: 'الصف الأول المتوسط', section: 'ب' } as Student]
  );
  assert(resolved.length === 0, 'empty sections wins');
});

test('5 faculty projection contains no PII', () => {
  const snapshot = buildTimetableAcademicSnapshot(
    [{
      id: 't1',
      name: 'أ. اختبار',
      subject: 'الحاسوب',
      email: 'secret@example.com',
      phone: '0770',
      assignedGrades: [],
      status: 'نشط',
      joinedDate: '',
      availableDays: ['الأحد'],
    } as Teacher],
    []
  );
  const keys = Object.keys(snapshot.timetableFaculty[0]).sort();
  assert(keys.every((k) => ['availableDays', 'id', 'name', 'subject'].includes(k)), keys.join(','));
});

test('6 active sections projection contains only gradeLevel+section', () => {
  const snapshot = buildTimetableAcademicSnapshot([], [
    { id: 's1', name: 'سرية', nationalId: 'x', phone: '1', gradeLevel: 'الصف الرابع العلمي', section: 'أ' } as Student,
  ]);
  assert(snapshot.timetableActiveSections.length === 1, 'one section');
  const keys = Object.keys(snapshot.timetableActiveSections[0]).sort();
  assert(keys.join() === 'gradeLevel,section', keys.join());
});

test('7 deleting last teacher can result in []', () => {
  const snapshot = buildTimetableAcademicSnapshot([], [
    { id: 's1', name: 'ط', gradeLevel: 'الصف الرابع العلمي', section: 'أ' } as Student,
  ]);
  assert(snapshot.timetableFaculty.length === 0, 'empty faculty');
});

test('8 deleting last active section can result in []', () => {
  const snapshot = buildTimetableAcademicSnapshot(
    [{ id: 't1', name: 'أ', subject: 'ح', email: '', phone: '', assignedGrades: [], status: 'نشط', joinedDate: '' } as Teacher],
    []
  );
  assert(snapshot.timetableActiveSections.length === 0, 'empty sections');
});

test('9 equality guard prevents unnecessary change', () => {
  const snapshot = buildTimetableAcademicSnapshot([], []);
  const stored = emptyAdmin({
    timetableFaculty: snapshot.timetableFaculty,
    timetableActiveSections: snapshot.timetableActiveSections,
  });
  assert(timetableAcademicSnapshotEquals(stored, snapshot) === true, 'equal skip');
  assert(timetableAcademicSnapshotEquals(emptyAdmin(), snapshot) === false, 'absent must write');
});

test('10 same projection resolves identically for different viewer roles', () => {
  const data = emptyAdmin({
    timetableFaculty: [{ id: 'cs1', name: 'محمد نعمة كاظم كريدي الوحيلي', subject: 'الحاسوب', availableDays: ['الأحد'] }],
    timetableActiveSections: [{ gradeLevel: 'الصف السادس العلمي', section: 'أ' }],
  });
  const adminView = resolveTimetableFaculty(data, [{ id: 'full', name: 'مخفي', subject: 'x', email: 'a', phone: '1', assignedGrades: [], status: 'نشط', joinedDate: '' }]);
  const studentView = resolveTimetableFaculty(data, []);
  const parentView = resolveTimetableFaculty(data, []);
  assert(JSON.stringify(adminView) === JSON.stringify(studentView), 'faculty parity');
  assert(JSON.stringify(studentView) === JSON.stringify(parentView), 'parent parity');
  const sectionsA = resolveActiveGradeSections(data, []);
  const sectionsB = resolveActiveGradeSections(data, [
    { id: 's9', name: 'ط', gradeLevel: 'الصف الأول المتوسط', section: 'ج' } as Student,
  ]);
  assert(JSON.stringify(sectionsA) === JSON.stringify(sectionsB), 'sections ignore local students');
});

test('11 admin editing capability = true', () => {
  assert(canPersistTimetableWrites('admin', 'admin') === true, 'admin');
});

test('12 principal editing capability = false', () => {
  assert(canPersistTimetableWrites('principal', 'principal') === false, 'principal');
});

test('13 school_admin editing capability = false', () => {
  assert(canPersistTimetableWrites('school_admin', 'school_admin') === false, 'school_admin');
});

test('14 teacher/student/parent editing capability = false', () => {
  assert(canPersistTimetableWrites('teacher', 'teacher') === false, 'teacher');
  assert(canPersistTimetableWrites('student', 'student') === false, 'student');
  assert(canPersistTimetableWrites('parent', 'parent') === false, 'parent');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
