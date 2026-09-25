/**
 * Initial Mock Data for Maysan High School for Gifted Girls
 * ثانوية ميسان للمتميزات - العمارة - محافظة ميسان
 */

import {
  Teacher,
  Student,
  Parent,
  EducationalSupervisor,
  Exam,
  ExamSubmission,
  AttendanceRecord,
  Announcement,
  DirectMessage,
  LectureResource,
  TimetableSlot,
  GradeSubjectQuota,
  FinancialRecord,
  NotificationItem,
  StudentCertificate,
  CalendarEvent,
  SchoolAdminData,
  GraduateStudent,
  LibraryFolder,
} from '../types';

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_TEACHERS: Teacher[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_STUDENTS: Student[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_PARENTS: Parent[] = [];

/** Security Hardening V1: private academic data (including answer keys/schedules) is never bundled into the client. */
export const INITIAL_EXAMS: Exam[] = [];

export const INITIAL_SUBMISSIONS: ExamSubmission[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: '🌟 بدء التسجيل والتحضير لأولمبياد العلوم الوطني للمتميزات',
    content: 'تعلن إدارة ثانوية ميسان للمتميزات عن فتح باب الترشح لطالبات الصفوف الرابع والخامس والسادس العلمي للمشاركة في اولمبياد العلوم العراقي. يرجى مراجعة المعاونية العلمية.',
    senderRole: 'admin',
    senderName: 'إدارة مدرسة ثانوية ميسان للمتميزات',
    targetAudience: 'all',
    priority: 'عاجل',
    createdAt: '2026-08-01 08:00',
    readBy: ['std-1', 'std-2'],
  },
  {
    id: 'anc-2',
    title: '📅 جدول الامتحانات الشاملة - شهر آب 2026',
    content: 'إلى أعضاء الهيئة التدريسية والطالبات العزيزات، تم اعتماد جدول الامتحانات الإلكترونية والحضورية. نرجو من الجميع الالتزام بضوابط منع الغش الشارحة بالمنصة.',
    senderRole: 'admin',
    senderName: 'المديرة الهام صبيح سعدون',
    targetAudience: 'الصف السادس العلمي',
    priority: 'هتـام',
    createdAt: '2026-07-31 14:20',
    readBy: ['std-1'],
  },
  {
    id: 'anc-3',
    title: '🔔 تنبيه هام لأولياء أمور طالبات الخامس العلمي',
    content: 'يرجى مراجعة شعبة الحسابات والأكاديمية لتسلم بطاقات الدخول وتدقيق السجلات الفصلية خلال هذا الأسبوع.',
    senderRole: 'admin',
    senderName: 'إدارة المدرسة - قسم شؤون أولياء الأمور',
    targetAudience: 'parents',
    priority: 'عادي',
    createdAt: '2026-07-29 11:00',
    readBy: [],
  },
];

export const INITIAL_MESSAGES: DirectMessage[] = [];

export const INITIAL_LIBRARY_FOLDERS: LibraryFolder[] = [];

// Library content is created by authorized users; no operational resources are bundled.
export const INITIAL_LECTURES: LectureResource[] = [];

export const INITIAL_TIMETABLE: TimetableSlot[] = RAW_INITIAL_TIMETABLE.filter((slot) => {
  const sec = slot.section || 'أ';
  return INITIAL_STUDENTS.some(
    (s) => s.gradeLevel === slot.gradeLevel && (s.section === sec || (!s.section && sec === 'أ'))
  );
});

export const INITIAL_FINANCIAL: FinancialRecord[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_CERTIFICATES: StudentCertificate[] = [];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'امتحانات نصف السنة للعام الدراسي',
    description: 'انطلاق الامتحانات تحريرياً لكافة المراحل الدراسية في الثانوية',
    date: '2026-08-10',
    endDate: '2026-08-20',
    type: 'exam',
    targetGrade: 'الكل',
    location: 'القاعات الرئيسية',
    isImportant: true,
  },
  {
    id: 'evt-2',
    title: 'عطلة رسمية بمناسبة المولد / المناسبة الوطنية',
    description: 'عطلة رسمية لجميع كوادر وطالبات الثانوية',
    date: '2026-08-15',
    type: 'holiday',
    targetGrade: 'الكل',
    isImportant: true,
  },
  {
    id: 'evt-3',
    title: 'معرض العلوم والذكاء الاصطناعي للمتميزات',
    description: 'عرض المبادرات والمشاريع العلمية للطالبات الموهوبات بمحافظة ميسان',
    date: '2026-08-25',
    type: 'activity',
    targetGrade: 'الكل',
    location: 'قاعة الأنشطة الكبرى',
    isImportant: false,
  },
  {
    id: 'evt-4',
    title: 'اختبار شفهي - اللغة الإنجليزية المتقدمة',
    description: 'التقييم الشفهي والاستماع للصف السادس العلمي',
    date: '2026-08-08',
    type: 'exam',
    targetGrade: 'الصف السادس العلمي',
    location: 'مختبر اللغات',
    isImportant: false,
  },
  {
    id: 'evt-5',
    title: 'اجتماع مجلس الأمهات وأولياء الأمور',
    description: 'مناقشة الأداء الأكاديمي والخطط الفصلية للمتميزات',
    date: '2026-08-28',
    type: 'meeting',
    targetGrade: 'الكل',
    location: 'المسرح المدرسي',
    isImportant: true,
  },
  {
    id: 'evt-6',
    title: 'أولمبياد الرياضيات الإقليمي للموهوبين',
    description: 'المشاركة الفاعلة لطالبات الخامس والسادس العلمي',
    date: '2026-09-02',
    type: 'event',
    targetGrade: 'الصف الخامس العلمي',
    location: 'المركز الثقافي',
    isImportant: true,
  },
];

export const INITIAL_SCHOOL_ADMIN_DATA: SchoolAdminData = {
  principalName: 'الهام صبيح سعدون',
  principalBadge: 'المديرة الهام صبيح سعدون',
  principalTitle: 'مديرة ثانوية ميسان للمتميزات',
  principalDegree: 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات',
  principalImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  assistantPrincipalName: 'زينب علي الموسوي',
  assistantPrincipalTitle: 'معاونة شؤون الطالبات والتسجيل',
  academicSupervisorName: 'أ.د. حيدر جاسم الكناني',
  academicSupervisorTitle: 'المشرف الأكاديمي والتربوي المعتمد',
  visionMessage: 'إن ثانوية ميسان للمتميزات ليست مجرد مدرسة تلقن المناهج، بل هي بيئة حاضنة متكاملة تفجر طاقات الطالبات الإبداعية، وتمنحهن الأسلحة العلمية والتكنولوجية ليصبحن علماء ومهندسات وطبيبات يفتخر بهن العراق والعالم أجمع.',
  achievements: [
    'احراز المركز الأول وزاريًا في نسبة النجاح والتفوق لثلاث سنوات متتالية.',
    'تأسيس مختبر الذكاء الاصطناعي والروبوت الأول من نوعه في المحافظة.',
    'نشر 6 بحوث علمية محكمة في مجلات دولية حول رعاية الذكاء المتميز.',
    'نيل كتاب شكر وتقدير من وزير التربية لدعم الأنشطة العلمية والهندسية.',
  ],
  schoolWorkingHoursInfo: 'من 8:00 صباحاً وحتى 1:30 ظهراً',
  schoolWorkingHoursDetail: 'طيلة أيام الأسبوع من (الأحد إلى الخميس)',
  schoolUniformInfo: 'الصدرية الرصاصية (الرمادي) + قميص أبيض ناصع + حجاب أبيض + شعار المدرسة',
  schoolUniformDetail: 'مع حذاء أسود / رياضي مريح للأنشطة والرياضة',
  schoolPolicyInfo: 'انضباط أكاديمي عالي وحظر الهواتف الذكية',
  schoolPolicyDetail: 'تعزيز البحث العلمي والابتكار البرمجي ورعاية الموهوبين',
  strategicGoals: [
    'تأهيل طاقم تدريسي متخصص بعلوم الذكاء الاصطناعي والمناهج الدولية.',
    'التكامل الرقمي بنسبة 100% في الاختبارات والجداول والمتابعة الأبوية.',
    'تمكين 95%+ من الخريجات للالتحاق بكليات الطب والهندسة والتكنولوجيا.',
  ],
  schoolLogoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
  schoolNameEn: 'Maysan Secondary School For Distinguished Female Students',
  academicYearDefault: '2026 - 2027',
  statisticalNumberDefault: '2026/MS/8890',
  issueDateDefault: '2027-06-25',
  principalNameOnCert: 'الهام صبيح سعدون',
  auditorCommitteeMemberName: 'لجنة التدقيق والنتائج المدرسية',
  timetableSupervisorName: 'أ.د. حيدر جاسم الكناني',
  principalNameOnTimetable: 'الهام صبيح سعدون',
  examControlAuditorName: 'أ. دلال محمد عبد الحسين',
  examControlAuditorTitle: 'مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية',
};

export const INITIAL_SUBJECT_QUOTAS: GradeSubjectQuota[] = [
  // الصف السادس العلمي
  { id: 'q-6sci-1', gradeLevel: 'الصف السادس العلمي', subjectName: 'الرياضيات والتفاضل', weeklyPeriods: 5, teacherName: 'أ. مروة كمال الساعدي', classroom: 'قاعة المتميزات 1', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-2', gradeLevel: 'الصف السادس العلمي', subjectName: 'الفيزياء المتقدمة', weeklyPeriods: 5, teacherName: 'أ.د. رغد نصير البهادلي', classroom: 'مختبر الفيزياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-3', gradeLevel: 'الصف السادس العلمي', subjectName: 'الكيمياء العضوية', weeklyPeriods: 5, teacherName: 'د. زينب عبد الحسين الموسوي', classroom: 'مختبر الكيمياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-4', gradeLevel: 'الصف السادس العلمي', subjectName: 'علم الأحياء والوراثة', weeklyPeriods: 5, teacherName: 'أ. سارة جليل المحمداوي', classroom: 'قاعة الأحياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-5', gradeLevel: 'الصف السادس العلمي', subjectName: 'اللغة العربية والقواعد', weeklyPeriods: 5, teacherName: 'أ. فاطمة مرتضى الشمري', classroom: 'قاعة المتميزات 1', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-6', gradeLevel: 'الصف السادس العلمي', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 5, teacherName: 'أ. رنا ضياء الزيدي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-7', gradeLevel: 'الصف السادس العلمي', subjectName: 'التربية الإسلامية', weeklyPeriods: 3, teacherName: 'أ. خديجة عبد الرزاق البديري', classroom: 'قاعة المتميزات 1', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-6sci-8', gradeLevel: 'الصف السادس العلمي', subjectName: 'الحاسوب والذكاء الاصطناعي', weeklyPeriods: 2, teacherName: 'محمد نعمة كاظم كريدي الوحيلي', classroom: 'مختبر الحاسوب الذكي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },

  // الصف الخامس العلمي
  { id: 'q-5sci-1', gradeLevel: 'الصف الخامس العلمي', subjectName: 'الرياضيات', weeklyPeriods: 5, teacherName: 'أ. مروة كمال الساعدي', classroom: 'قاعة 5 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-2', gradeLevel: 'الصف الخامس العلمي', subjectName: 'الفيزياء', weeklyPeriods: 5, teacherName: 'أ.د. رغد نصير البهادلي', classroom: 'مختبر الفيزياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-3', gradeLevel: 'الصف الخامس العلمي', subjectName: 'الكيمياء', weeklyPeriods: 5, teacherName: 'د. زينب عبد الحسين الموسوي', classroom: 'مختبر الكيمياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-4', gradeLevel: 'الصف الخامس العلمي', subjectName: 'علم الأحياء', weeklyPeriods: 5, teacherName: 'أ. سارة جليل المحمداوي', classroom: 'قاعة الأحياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-5', gradeLevel: 'الصف الخامس العلمي', subjectName: 'اللغة العربية', weeklyPeriods: 5, teacherName: 'أ. فاطمة مرتضى الشمري', classroom: 'قاعة 5 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-6', gradeLevel: 'الصف الخامس العلمي', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 4, teacherName: 'أ. رنا ضياء الزيدي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-7', gradeLevel: 'الصف الخامس العلمي', subjectName: 'التربية الإسلامية', weeklyPeriods: 3, teacherName: 'أ. خديجة عبد الرزاق البديري', classroom: 'قاعة 5 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-5sci-8', gradeLevel: 'الصف الخامس العلمي', subjectName: 'الحاسوب والبرمجة', weeklyPeriods: 3, teacherName: 'محمد نعمة كاظم كريدي الوحيلي', classroom: 'مختبر الحاسوب', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },

  // الصف الرابع العلمي
  { id: 'q-4sci-1', gradeLevel: 'الصف الرابع العلمي', subjectName: 'الرياضيات', weeklyPeriods: 5, teacherName: 'أ. علي كريم الربيعي', classroom: 'قاعة 4 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-4sci-2', gradeLevel: 'الصف الرابع العلمي', subjectName: 'الفيزياء', weeklyPeriods: 5, teacherName: 'أ. حيدر صباح اللامي', classroom: 'مختبر الفيزياء', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-4sci-3', gradeLevel: 'الصف الرابع العلمي', subjectName: 'الكيمياء', weeklyPeriods: 5, teacherName: 'أ. وسام جاسم التميمي', classroom: 'مختبر الكيمياء', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الخميس'] },
  { id: 'q-4sci-4', gradeLevel: 'الصف الرابع العلمي', subjectName: 'علم الأحياء', weeklyPeriods: 5, teacherName: 'أ. هند كاظم الذهبي', classroom: 'قاعة الأحياء', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-4sci-5', gradeLevel: 'الصف الرابع العلمي', subjectName: 'اللغة العربية', weeklyPeriods: 5, teacherName: 'أ. فاطمة مرتضى الشمري', classroom: 'قاعة 4 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-4sci-6', gradeLevel: 'الصف الرابع العلمي', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 4, teacherName: 'أ. رنا ضياء الزيدي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-4sci-7', gradeLevel: 'الصف الرابع العلمي', subjectName: 'التربية الإسلامية', weeklyPeriods: 3, teacherName: 'أ. خديجة عبد الرزاق البديري', classroom: 'قاعة 4 علمي', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-4sci-8', gradeLevel: 'الصف الرابع العلمي', subjectName: 'الحاسوب', weeklyPeriods: 3, teacherName: 'أ. مريم عماد الكعبي', classroom: 'مختبر الحاسوب', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },

  // الصف الثالث المتوسط
  { id: 'q-3m-1', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الرياضيات', weeklyPeriods: 5, teacherName: 'أ. علي كريم الربيعي', classroom: 'قاعة 3 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-3m-2', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الفيزياء', weeklyPeriods: 4, teacherName: 'أ. حيدر صباح اللامي', classroom: 'مختبر العلوم', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-3m-3', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الكيمياء', weeklyPeriods: 4, teacherName: 'أ. وسام جاسم التميمي', classroom: 'مختبر العلوم', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الخميس'] },
  { id: 'q-3m-4', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الأحياء', weeklyPeriods: 4, teacherName: 'أ. هند كاظم الذهبي', classroom: 'قاعة 3 متوسط', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-3m-5', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'اللغة العربية', weeklyPeriods: 5, teacherName: 'أ. مصطفى حميد الغراوي', classroom: 'قاعة 3 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-3m-6', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 4, teacherName: 'أ. أحمد صادق المياحي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الأربعاء', 'الخميس'] },
  { id: 'q-3m-7', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الاجتماعيات', weeklyPeriods: 4, teacherName: 'أ. نداء فاضل البياتي', classroom: 'قاعة 3 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-3m-8', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'التربية الإسلامية', weeklyPeriods: 3, teacherName: 'أ. حسين شاكر العيداني', classroom: 'قاعة 3 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الخميس'] },
  { id: 'q-3m-9', gradeLevel: 'الصف الثالث المتوسط', subjectName: 'الحاسوب', weeklyPeriods: 2, teacherName: 'أ. عمر خالد السعد', classroom: 'مختبر الحاسوب', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },

  // الصف الثاني المتوسط
  { id: 'q-2m-1', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'الرياضيات', weeklyPeriods: 5, teacherName: 'أ. رشا فائق الدراجي', classroom: 'قاعة 2 متوسط', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-2m-2', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'العلوم العامة', weeklyPeriods: 6, teacherName: 'أ. مروة سلام الفرطوسي', classroom: 'مختبر العلوم', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-2m-3', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'اللغة العربية', weeklyPeriods: 5, teacherName: 'أ. مصطفى حميد الغراوي', classroom: 'قاعة 2 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-2m-4', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 5, teacherName: 'أ. أحمد صادق المياحي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الأربعاء', 'الخميس'] },
  { id: 'q-2m-5', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'الاجتماعيات', weeklyPeriods: 4, teacherName: 'أ. قاسم مهدي العتابي', classroom: 'قاعة 2 متوسط', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-2m-6', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'التربية الإسلامية', weeklyPeriods: 4, teacherName: 'أ. حسين شاكر العيداني', classroom: 'قاعة 2 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الخميس'] },
  { id: 'q-2m-7', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'الحاسوب والبرمجة', weeklyPeriods: 3, teacherName: 'أ. عمر خالد السعد', classroom: 'مختبر الحاسوب', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-2m-8', gradeLevel: 'الصف الثاني المتوسط', subjectName: 'التربية الفنية والرياضية', weeklyPeriods: 3, teacherName: 'أ. بشرى عبد الأمير', classroom: 'القاعة الرياضية', availableDays: ['الأحد', 'الثلاثاء', 'الخميس'] },

  // الصف الأول المتوسط
  { id: 'q-1m-1', gradeLevel: 'الصف الأول المتوسط', subjectName: 'الرياضيات', weeklyPeriods: 5, teacherName: 'أ. رشا فائق الدراجي', classroom: 'قاعة 1 متوسط', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-1m-2', gradeLevel: 'الصف الأول المتوسط', subjectName: 'العلوم العامة', weeklyPeriods: 6, teacherName: 'أ. هبة عادل الساعدي', classroom: 'مختبر العلوم', availableDays: ['الأحد', 'الإثنين', 'الأربعاء', 'الخميس'] },
  { id: 'q-1m-3', gradeLevel: 'الصف الأول المتوسط', subjectName: 'اللغة العربية', weeklyPeriods: 5, teacherName: 'أ. مصطفى حميد الغراوي', classroom: 'قاعة 1 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] },
  { id: 'q-1m-4', gradeLevel: 'الصف الأول المتوسط', subjectName: 'اللغة الإنجليزية', weeklyPeriods: 5, teacherName: 'أ. أحمد صادق المياحي', classroom: 'قاعة اللغات', availableDays: ['الأحد', 'الإثنين', 'الأربعاء', 'الخميس'] },
  { id: 'q-1m-5', gradeLevel: 'الصف الأول المتوسط', subjectName: 'الاجتماعيات', weeklyPeriods: 4, teacherName: 'أ. قاسم مهدي العتابي', classroom: 'قاعة 1 متوسط', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-1m-6', gradeLevel: 'الصف الأول المتوسط', subjectName: 'التربية الإسلامية', weeklyPeriods: 4, teacherName: 'أ. حسين شاكر العيداني', classroom: 'قاعة 1 متوسط', availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الخميس'] },
  { id: 'q-1m-7', gradeLevel: 'الصف الأول المتوسط', subjectName: 'الحاسوب', weeklyPeriods: 3, teacherName: 'أ. عمر خالد السعد', classroom: 'مختبر الحاسوب', availableDays: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'q-1m-8', gradeLevel: 'الصف الأول المتوسط', subjectName: 'التربية الفنية والرياضية', weeklyPeriods: 3, teacherName: 'أ. أطياف حسن الخزاعي', classroom: 'القاعة الرياضية', availableDays: ['الإثنين', 'الثلاثاء', 'الأربعاء'] },
];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_GRADUATES: GraduateStudent[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_SUPERVISORS: EducationalSupervisor[] = [];

