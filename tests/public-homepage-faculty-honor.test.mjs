import {
  sanitizePublicFacultyItem,
  sanitizePublicHonorEntry,
  decidePublicFacultyInitialization,
  decidePublicHonorInitialization,
  lastYearHonorGpa,
  isEnrollmentEligibleForHonor2025,
  buildPublicHonorBoard,
  looksLikeHonorRollDemo,
  HONOR_ROLL_DEMO_NAMES,
} from '../src/utils/publicHomepageFacultyHonor.ts';
import { assertNoForbiddenPublicFields } from '../src/utils/publicHomepageProjection.ts';

let pass = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    pass++;
    console.log('PASS', name);
  } catch (err) {
    console.error('FAIL', name, err.message);
  }
}

function ok(value, message) {
  if (!value) throw new Error(message);
}

const INITIAL_TEACHERS_FIXTURE = [
  {
    id: 'tech-seed-1',
    name: 'مدرسة أولية',
    subject: 'رياضيات',
    email: 'seed@school.local',
    phone: '07700000000',
    authUid: 'uid-seed',
    username: 'seed-teacher',
  },
];

const privateTeacher = {
  id: 'tech-1',
  name: 'أ. سناء جاسم',
  subject: 'فيزياء',
  avatar: 'https://example.com/a.jpg',
  facultyRoleTitle: 'كبير مدرسي الفيزياء',
  facultyDegree: 'دكتوراه',
  researchCount: 6,
  booksCount: 3,
  gamesCount: 4,
  facultyAchievements: ['بحث محكم'],
  authUid: 'secret-uid',
  email: 'teacher@school.local',
  phone: '07711111111',
  username: 'sanaa',
  password: 'nope',
  status: 'نشط',
  address: 'ميسان',
  salary: 900000,
  notes: 'ملاحظة داخلية',
  lastLoginAt: '2026-01-01',
};

test('A faculty sanitizer excludes private teacher fields', () => {
  const item = sanitizePublicFacultyItem(privateTeacher);
  ok(item && item.id === 'tech-1', 'id kept');
  ok(item.name === 'أ. سناء جاسم', 'name kept');
  ok(item.subject === 'فيزياء', 'subject kept');
  ok(!('authUid' in item), 'authUid excluded');
  ok(!('email' in item), 'email excluded');
  ok(!('phone' in item), 'phone excluded');
  ok(!('username' in item), 'username excluded');
  ok(!('password' in item), 'password excluded');
  ok(!('status' in item), 'status excluded');
  ok(!('address' in item), 'address excluded');
  ok(!('salary' in item), 'salary excluded');
  ok(!('notes' in item), 'notes excluded');
  ok(assertNoForbiddenPublicFields(item).length === 0, 'no forbidden keys');
});

const privateHonor = {
  id: 'st-1',
  sourceId: 'st-1',
  sourceType: 'student',
  academicYear: '2025-2026',
  grade: 'الصف الأول المتوسط',
  rank: 1,
  name: 'زهراء',
  avatar: 'https://example.com/s.jpg',
  section: 'أ',
  gpa: 98.5,
  specialty: 'رياضيات',
  dream: 'طبيبة',
  authUid: 'stu-uid',
  parentId: 'prt-1',
  email: 'student@school.local',
  phone: '077222',
  address: 'البيت',
  birthDate: '2012-01-01',
  attendance: [{ date: 'x' }],
  grades: [{ subject: 'كيمياء', score: 40 }],
  disciplinaryNotes: 'سرّ',
  username: 'zahraa',
  notes: 'داخلي',
};

test('B honor sanitizer excludes private student/graduate fields', () => {
  const entry = sanitizePublicHonorEntry(privateHonor);
  ok(entry && entry.sourceId === 'st-1', 'sourceId kept');
  ok(entry.gpa === 98.5, 'public honor GPA kept');
  ok(!('authUid' in entry), 'authUid excluded');
  ok(!('parentId' in entry), 'parentId excluded');
  ok(!('email' in entry), 'email excluded');
  ok(!('phone' in entry), 'phone excluded');
  ok(!('address' in entry), 'address excluded');
  ok(!('birthDate' in entry), 'birth excluded');
  ok(!('attendance' in entry), 'attendance excluded');
  ok(!('grades' in entry), 'grades excluded');
  ok(!('disciplinaryNotes' in entry), 'discipline excluded');
  ok(!('username' in entry), 'account excluded');
  ok(!('notes' in entry), 'notes excluded');
});

const adminInit = {
  authenticated: true,
  role: 'admin',
  currentUserRole: 'admin',
  hydrated: true,
  authoritativeReceived: true,
  publicExists: false,
};

test('C INITIAL_TEACHERS cannot initialize public faculty', () => {
  const fromFixture = decidePublicFacultyInitialization({
    ...adminInit,
    teachers: INITIAL_TEACHERS_FIXTURE,
    initialTeachers: INITIAL_TEACHERS_FIXTURE,
    publicFaculty: [],
  });
  ok(!fromFixture.shouldWrite && fromFixture.reason === 'initial-data-blocked', fromFixture.reason);

  const emptyInitial = decidePublicFacultyInitialization({
    ...adminInit,
    teachers: [],
    initialTeachers: [],
    publicFaculty: [],
  });
  ok(!emptyInitial.shouldWrite, emptyInitial.reason);

  const guest = decidePublicFacultyInitialization({
    ...adminInit,
    authenticated: false,
    role: 'guest',
    currentUserRole: 'guest',
    teachers: [{ id: 'tech-1', name: 'واقعية' }],
    initialTeachers: INITIAL_TEACHERS_FIXTURE,
  });
  ok(!guest.shouldWrite, guest.reason);
});

test('D HONOR_ROLL_DATA cannot initialize official honorBoard', () => {
  const demoEntries = HONOR_ROLL_DEMO_NAMES.map((name, index) => ({
    sourceId: `demo-${index}`,
    sourceType: index < 15 ? 'student' : 'graduate',
    academicYear: '2025-2026',
    grade: 'الصف الأول المتوسط',
    rank: ((index % 3) + 1),
    name,
    avatar: '',
    section: 'أ',
    gpa: 99,
    specialty: 'x',
    dream: 'y',
  }));
  ok(looksLikeHonorRollDemo(demoEntries, HONOR_ROLL_DEMO_NAMES), 'demo names detected');

  const d = decidePublicHonorInitialization({
    ...adminInit,
    students: [],
    graduates: [],
    honorRollDemo: HONOR_ROLL_DEMO_NAMES,
    publicHonorBoard: [],
  });
  ok(!d.shouldWrite, `demo/empty must not publish: ${d.reason}`);
});

test('L current GPA is not used as last-year honor GPA fallback', () => {
  ok(lastYearHonorGpa({ gpa: 99.9 }) == null, 'current gpa ignored');
  ok(lastYearHonorGpa({ honorGpa2025_2026: 97.1, gpa: 40 }) === 97.1, 'explicit honor GPA used');
  ok(lastYearHonorGpa({ previousAcademicYearGpa: 88, gpa: 99 }) === 88, 'previous year GPA used');
});

test('M missing enrollmentYear does not silently qualify a student', () => {
  ok(!isEnrollmentEligibleForHonor2025({}), 'missing year ineligible');
  ok(!isEnrollmentEligibleForHonor2025({ enrollmentYear: '' }), 'empty year ineligible');
  ok(isEnrollmentEligibleForHonor2025({ enrollmentYear: '2025' }), '2025 eligible');
  ok(!isEnrollmentEligibleForHonor2025({ enrollmentYear: '2026' }), '2026 ineligible');
});

test('K current first intermediate is not ranked from current-year GPA', () => {
  const board = buildPublicHonorBoard(
    [
      {
        id: 'st-first',
        name: 'طالبات الصف الأول الحالي',
        gradeLevel: 'الصف الأول المتوسط',
        enrollmentYear: '2026',
        gpa: 99.9,
        status: 'منتظمة',
      },
    ],
    []
  );
  ok(
    !board.some((entry) => entry.grade === 'الصف الأول المتوسط'),
    'current first must not fill last-year first'
  );
});

test('J sixth-grade public honor data comes from graduates', () => {
  const board = buildPublicHonorBoard(
    [
      {
        id: 'st-sixth',
        name: 'طالبة سادس حالية',
        gradeLevel: 'الصف السادس العلمي',
        enrollmentYear: '2020',
        honorGpa2025_2026: 99.9,
        status: 'منتظمة',
      },
    ],
    [
      {
        id: 'grad-1',
        name: 'خريجة متفوقة',
        graduationYear: '2025/2026',
        gpa: 98.4,
        honorSection2025_2026: 'أ',
      },
    ]
  );
  const sixth = board.filter((entry) => entry.grade === 'الصف السادس العلمي');
  ok(sixth.length === 1, 'one sixth entry');
  ok(sixth[0].sourceType === 'graduate', 'source is graduate');
  ok(sixth[0].sourceId === 'grad-1', 'graduate id');
  ok(sixth[0].name === 'خريجة متفوقة', 'graduate name');
});

test('ranking mapping uses last-year GPA for promoted grades', () => {
  const board = buildPublicHonorBoard(
    [
      {
        id: 'st-second',
        name: 'من الصف الثاني الحالي',
        gradeLevel: 'الصف الثاني المتوسط',
        enrollmentYear: '2024',
        honorGpa2025_2026: 96.2,
        status: 'منتظمة',
      },
    ],
    []
  );
  const first = board.filter((entry) => entry.grade === 'الصف الأول المتوسط');
  ok(first.length === 1, 'last-year first comes from current second');
  ok(first[0].gpa === 96.2, 'uses honor GPA not current');
});

test('admin can decide to publish faculty when public missing', () => {
  const d = decidePublicFacultyInitialization({
    ...adminInit,
    teachers: [{ id: 'tech-1', name: 'واقعية' }],
    initialTeachers: INITIAL_TEACHERS_FIXTURE,
    publicFaculty: [],
  });
  ok(d.shouldWrite && d.reason === 'missing-or-incomplete', d.reason);
});

test('non-admin cannot initialize faculty or honorBoard', () => {
  for (const role of ['teacher', 'student', 'parent', 'supervisor']) {
    const faculty = decidePublicFacultyInitialization({
      ...adminInit,
      role,
      currentUserRole: role,
      teachers: [{ id: 'tech-1', name: 'واقعية' }],
      initialTeachers: INITIAL_TEACHERS_FIXTURE,
    });
    const honor = decidePublicHonorInitialization({
      ...adminInit,
      role,
      currentUserRole: role,
      students: [
        {
          id: 'st-second',
          name: 'أ',
          gradeLevel: 'الصف الثاني المتوسط',
          enrollmentYear: '2024',
          honorGpa2025_2026: 90,
        },
      ],
      graduates: [],
    });
    ok(!faculty.shouldWrite && faculty.reason === 'not-admin', `${role} faculty`);
    ok(!honor.shouldWrite && honor.reason === 'not-admin', `${role} honor`);
  }
});

test('HOME-018 drops data URL faculty and honor avatars', () => {
  const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';
  const faculty = sanitizePublicFacultyItem({
    ...privateTeacher,
    avatar: dataUrl,
  });
  const honor = sanitizePublicHonorEntry({
    ...privateHonor,
    avatar: dataUrl,
  });
  ok(faculty && faculty.name === 'أ. سناء جاسم', 'faculty name kept');
  ok(faculty.subject === 'فيزياء', 'faculty subject kept');
  ok(!faculty.avatar, 'faculty data URL dropped');
  ok(!('email' in faculty), 'faculty email still excluded');
  ok(honor && honor.name === 'زهراء', 'honor name kept');
  ok(!honor.avatar, 'honor data URL dropped');
  ok(!('phone' in honor), 'honor phone still excluded');
});

test('HOME-018 preserves HTTPS faculty and honor avatars', () => {
  const faculty = sanitizePublicFacultyItem(privateTeacher);
  const honor = sanitizePublicHonorEntry(privateHonor);
  ok(faculty.avatar.startsWith('https://'), 'faculty https kept');
  ok(honor.avatar.startsWith('https://'), 'honor https kept');
});

test('HOME-018 rejects javascript and blob faculty/honor avatars', () => {
  const faculty = sanitizePublicFacultyItem({ ...privateTeacher, avatar: 'javascript:alert(1)' });
  const honor = sanitizePublicHonorEntry({ ...privateHonor, avatar: 'blob:https://x/1' });
  ok(!faculty.avatar, 'faculty javascript dropped');
  ok(!honor.avatar, 'honor blob dropped');
});

if (pass !== total) {
  console.error(`FACULTY/HONOR PROJECTION TEST: FAIL ${pass}/${total}`);
  process.exit(1);
}
console.log(`FACULTY/HONOR PROJECTION TEST: PASS ${pass}/${total}`);
