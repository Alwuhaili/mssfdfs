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

/** Security Hardening V1: private academic data (including answer keys/schedules) is never bundled into the client. */
export const RAW_INITIAL_TIMETABLE: TimetableSlot[] = [];

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

// Subject quotas are operational data managed by authorized users and persisted in Firestore.
// No teacher names or subject assignments are bundled in the client.
export const INITIAL_SUBJECT_QUOTAS: GradeSubjectQuota[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_GRADUATES: GraduateStudent[] = [];

/** Security Hardening V1: private identity data is never bundled into the public web application.
 * Load real records only after authenticated Firestore access. */
export const INITIAL_SUPERVISORS: EducationalSupervisor[] = [];

