import {
  assertNoForbiddenPublicFields,
  buildPublicSchoolInfo,
  collectLegacyHomepageDataUrlFields,
  decidePublicSchoolInfoInitialization,
  isPublicSchoolInfoComplete,
  parsePublicHomepageDocument,
  PUBLIC_HOMEPAGE_JSON_WARN_CHARS,
  publicHomepageImageFieldsAreHttpsOrEmpty,
  sanitizePublicGalleryList,
  sanitizePublicNewsList,
} from '../src/utils/publicHomepageProjection.ts';

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

test('E public projection excludes adminAuthUid and private fields', () => {
  const info = buildPublicSchoolInfo({
    adminAuthUid: 'secret-uid-should-never-publish',
    principalName: 'الهام صبيح سعدون',
    schoolWorkingHoursInfo: 'حتى 1:45 ظهراً',
    password: 'nope',
    email: 'private@school.local',
    students: [{ id: 'st-1' }],
  });
  ok(info.principalName === 'الهام صبيح سعدون', 'principal copied');
  ok(info.schoolWorkingHoursInfo.includes('1:45'), 'hours copied');
  ok(!('adminAuthUid' in info), 'adminAuthUid omitted');
  ok(!('password' in info), 'password omitted');
  ok(!('email' in info), 'email omitted');
  ok(!('students' in info), 'students omitted');
  const hits = assertNoForbiddenPublicFields(info);
  ok(hits.length === 0, `unexpected forbidden keys: ${hits.join(',')}`);
});

test('F news sanitizer keeps public fields only', () => {
  const news = sanitizePublicNewsList([
    {
      id: 'n1',
      title: 'مهرجان',
      category: 'مهرجانات',
      date: '2026',
      image: 'https://example.com/a.jpg',
      summary: 'ملخص',
      fullContent: 'تفاصيل',
      location: 'القاعة',
      organizer: 'الإدارة',
      adminAuthUid: 'no',
      parentPhone: 'no',
    },
  ]);
  ok(news.length === 1, 'one item');
  ok(news[0].title === 'مهرجان', 'title kept');
  ok(!('adminAuthUid' in news[0]), 'uid stripped');
  ok(!('parentPhone' in news[0]), 'phone stripped');
});

test('G gallery sanitizer keeps public fields only', () => {
  const gallery = sanitizePublicGalleryList([
    { id: 'g1', title: 'مختبر', category: 'المختبرات العلمية', url: 'https://example.com/g.jpg', date: '2026', desc: 'وصف', studentId: 'st-9' },
  ]);
  ok(gallery.length === 1, 'one item');
  ok(gallery[0].url.includes('example.com'), 'url kept');
  ok(!('studentId' in gallery[0]), 'studentId stripped');
});

test('parsePublicHomepageDocument never carries adminAuthUid', () => {
  const parsed = parsePublicHomepageDocument({
    adminAuthUid: 'leak',
    schoolInfo: { principalName: 'مديرة', adminAuthUid: 'leak2' },
    news: [],
    gallery: [],
  });
  ok(!('adminAuthUid' in parsed), 'top-level uid omitted');
  ok(!('adminAuthUid' in parsed.schoolInfo), 'schoolInfo uid omitted');
});

const INITIAL_SCHOOL_ADMIN_DATA = {
  principalName: 'الهام صبيح سعدون',
  principalBadge: 'المديرة الهام صبيح سعدون',
  principalTitle: 'مديرة ثانوية ميسان للمتميزات',
  principalDegree: 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات',
  principalImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  assistantPrincipalName: 'زينب علي الموسوي',
  assistantPrincipalTitle: 'معاونة شؤون الطالبات والتسجيل',
  academicSupervisorName: 'أ.د. حيدر جاسم الكناني',
  academicSupervisorTitle: 'المشرف الأكاديمي والتربوي المعتمد',
  visionMessage: 'رسالة أولية',
  achievements: ['إنجاز أولي'],
  schoolWorkingHoursInfo: 'من 8:00 صباحاً وحتى 1:30 ظهراً',
  schoolWorkingHoursDetail: 'طيلة أيام الأسبوع من (الأحد إلى الخميس)',
  schoolUniformInfo: 'الزي الأولي',
  schoolUniformDetail: 'تفاصيل الزي الأولية',
  schoolPolicyInfo: 'سياسة أولية',
  schoolPolicyDetail: 'تفاصيل السياسة الأولية',
  schoolNameEn: 'Maysan Secondary School For Distinguished Female Students',
};

const authoritativeAdminData = {
  ...INITIAL_SCHOOL_ADMIN_DATA,
  schoolWorkingHoursInfo: 'من 8:00 صباحاً وحتى 1:45 ظهراً',
  adminAuthUid: 'secret-admin-uid',
};

const baseInit = {
  authenticated: true,
  role: 'admin',
  currentUserRole: 'admin',
  hydrated: true,
  authoritativeReceived: true,
  pendingSchoolAdminWrite: false,
  schoolAdminData: authoritativeAdminData,
  initialSchoolAdminData: INITIAL_SCHOOL_ADMIN_DATA,
  publicExists: false,
  publicSchoolInfo: null,
};

test('A guest cannot initialize', () => {
  const d = decidePublicSchoolInfoInitialization({ ...baseInit, authenticated: false, role: 'guest', currentUserRole: 'guest' });
  ok(!d.shouldWrite && (d.reason === 'unauthenticated' || d.reason === 'guest'), d.reason);
});

test('B teacher/student/parent/supervisor cannot initialize', () => {
  for (const role of ['teacher', 'student', 'parent', 'supervisor']) {
    const d = decidePublicSchoolInfoInitialization({ ...baseInit, role, currentUserRole: role });
    ok(!d.shouldWrite && d.reason === 'not-admin', `${role}: ${d.reason}`);
  }
});

test('C admin can initialize when public schoolInfo is missing', () => {
  const d = decidePublicSchoolInfoInitialization(baseInit);
  ok(d.shouldWrite && d.reason === 'missing-or-incomplete', d.reason);
});

test('D INITIAL_SCHOOL_ADMIN_DATA cannot initialize public content', () => {
  const d = decidePublicSchoolInfoInitialization({
    ...baseInit,
    schoolAdminData: INITIAL_SCHOOL_ADMIN_DATA,
  });
  ok(!d.shouldWrite && d.reason === 'initial-data-blocked', d.reason);
});

test('pre-hydration React state cannot initialize', () => {
  const d = decidePublicSchoolInfoInitialization({
    ...baseInit,
    hydrated: false,
    authoritativeReceived: false,
  });
  ok(!d.shouldWrite, d.reason);
});

test('E adminAuthUid is excluded from public schoolInfo', () => {
  const info = buildPublicSchoolInfo(authoritativeAdminData);
  ok(!('adminAuthUid' in info), 'uid leaked');
  ok(info.schoolWorkingHoursInfo.includes('1:45'), 'authoritative hours used');
});

test('incomplete public schoolInfo can be initialized from authoritative data', () => {
  const d = decidePublicSchoolInfoInitialization({
    ...baseInit,
    publicExists: true,
    publicSchoolInfo: { schoolName: 'ثانوية ميسان للمتميزات' },
  });
  ok(!isPublicSchoolInfoComplete({ schoolName: 'ثانوية ميسان للمتميزات' }), 'fixture incomplete');
  ok(d.shouldWrite && d.reason === 'missing-or-incomplete', d.reason);
});

test('G repeated initialization with identical data performs no overwrite', () => {
  const expected = buildPublicSchoolInfo(authoritativeAdminData);
  const first = decidePublicSchoolInfoInitialization(baseInit);
  ok(first.shouldWrite, first.reason);
  const second = decidePublicSchoolInfoInitialization({
    ...baseInit,
    publicExists: true,
    publicSchoolInfo: expected,
  });
  ok(!second.shouldWrite && second.reason === 'already-current', second.reason);
});

const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('HOME-018 drops data URL school logo and principal image', () => {
  const info = buildPublicSchoolInfo({
    schoolName: 'ثانوية ميسان للمتميزات',
    schoolWorkingHoursInfo: 'من 8:00',
    schoolLogoUrl: DATA_URL,
    principalImageUrl: DATA_URL,
    principalName: 'الهام',
  });
  ok(!info.schoolLogoUrl, 'logo data URL dropped');
  ok(!info.principalImageUrl, 'principal data URL dropped');
  ok(info.principalName === 'الهام', 'non-image field kept');
  ok(info.schoolWorkingHoursInfo === 'من 8:00', 'hours kept');
});

test('HOME-018 preserves HTTPS school images', () => {
  const info = buildPublicSchoolInfo({
    schoolLogoUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/logo.jpg?alt=media&token=abc',
    principalImageUrl: 'https://example.com/principal.jpg',
  });
  ok(info.schoolLogoUrl.startsWith('https://'), 'logo https kept');
  ok(info.principalImageUrl.startsWith('https://'), 'principal https kept');
});

test('HOME-018 drops javascript and blob school images', () => {
  const info = buildPublicSchoolInfo({
    schoolLogoUrl: 'javascript:alert(1)',
    principalImageUrl: 'blob:https://example.com/uuid',
  });
  ok(!info.schoolLogoUrl, 'javascript logo dropped');
  ok(!info.principalImageUrl, 'blob principal dropped');
});

test('HOME-018 drops data URL news image and gallery url', () => {
  const news = sanitizePublicNewsList([
    { id: 'n1', title: 'مهرجان', category: 'مهرجانات', date: '2026', image: DATA_URL, summary: 'ملخص', fullContent: 'تفاصيل', location: 'القاعة', organizer: 'الإدارة' },
  ]);
  const gallery = sanitizePublicGalleryList([
    { id: 'g1', title: 'مختبر', category: 'المختبرات العلمية', url: DATA_URL, date: '2026', desc: 'وصف' },
  ]);
  ok(news[0].title === 'مهرجان', 'news title kept');
  ok(!news[0].image, 'news data URL dropped');
  ok(gallery[0].title === 'مختبر', 'gallery title kept');
  ok(!gallery[0].url, 'gallery data URL dropped');
});

test('HOME-018 projection payload cannot retain data URLs', () => {
  const parsed = parsePublicHomepageDocument({
    schoolInfo: { schoolLogoUrl: DATA_URL, principalImageUrl: 'blob:x', schoolWorkingHoursInfo: 'ساعات' },
    news: [{ id: 'n1', title: 'خبر', image: DATA_URL }],
    gallery: [{ id: 'g1', title: 'صورة', url: 'javascript:void(0)' }],
    faculty: [{ id: 't1', name: 'مدرسة', avatar: DATA_URL, subject: 'فيزياء' }],
    honorBoard: [{ sourceId: 's1', sourceType: 'student', grade: 'الصف الأول المتوسط', rank: 1, name: 'زهراء', avatar: DATA_URL, gpa: 99, section: 'أ' }],
  });
  ok(publicHomepageImageFieldsAreHttpsOrEmpty(parsed), 'all image fields https or empty');
  const packed = JSON.stringify(parsed);
  ok(packed.length < PUBLIC_HOMEPAGE_JSON_WARN_CHARS, 'projection stays far below warn size');
  ok(!packed.includes('data:image'), 'serialized public doc has no data URLs');
  const legacy = collectLegacyHomepageDataUrlFields({
    schoolInfo: { schoolLogoUrl: DATA_URL },
    news: [{ image: DATA_URL }],
  });
  ok(legacy.includes('schoolInfo.schoolLogoUrl'), 'legacy logo reported');
  ok(legacy.includes('news[0].image'), 'legacy news reported');
});

console.log(`PUBLIC HOMEPAGE PROJECTION TEST: ${pass}/${total} ${pass === total ? 'PASS' : 'FAIL'}`);
if (pass !== total) process.exit(1);
