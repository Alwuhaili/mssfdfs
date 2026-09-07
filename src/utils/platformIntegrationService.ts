/**
 * Platform Integration & LMS Sync Service for Maysan High School for Gifted Girls
 * Handles bridges with Iraqi Newton Platform, Google Classroom, Microsoft Teams, LTI OneRoster, and REST API.
 */

import {
  PlatformIntegrationConfig,
  IntegrationSyncLog,
  IntegrationApiToken,
  IntegrationWebhook,
  Student,
  Teacher,
  StudentCertificate,
} from '../types';

export const INITIAL_PLATFORM_INTEGRATIONS: PlatformIntegrationConfig[] = [
  {
    id: 'newton',
    name: 'منصة نيوتن التعليمية الوزارية (جمهورية العراق)',
    provider: 'iraq_ministry',
    description: 'المزامنة المباشرة لقوائم الطالبات ودفتر الدرجات الرسمي وسجلات الغياب اليومي مع خوادم وزارة التربية العراقية.',
    iconName: 'NewtonFlag',
    colorTheme: 'blue',
    status: 'connected',
    lastSyncTime: 'اليوم، 09:30 صباحاً',
    syncedRecordsCount: 1420,
    autoSyncEnabled: true,
    syncIntervalHours: 4,
    authConfig: {
      schoolCode: 'IQ-MYS-GIFTED-8841',
      apiKey: 'newton_live_key_9942a78e41bc90a',
      environment: 'production',
      syncGrades: true,
      syncAttendance: true,
      syncStudents: true,
      syncLectures: false,
      autoPushDailyAttendance: true,
    },
  },
  {
    id: 'google_classroom',
    name: 'Google Classroom & Workspace for Education',
    provider: 'google',
    description: 'ربط الفصول الدراسية والمناهج، استيراد وتصدير الواجبات، ومزامنة حسابات الطالبات على نطاق المدرسة.',
    iconName: 'GoogleClassroom',
    colorTheme: 'emerald',
    status: 'connected',
    lastSyncTime: 'اليوم، 10:15 صباحاً',
    syncedRecordsCount: 890,
    autoSyncEnabled: true,
    syncIntervalHours: 6,
    authConfig: {
      clientId: 'maysan-gifted-9912.apps.googleusercontent.com',
      tenantId: 'maysan-gifted.edu.iq',
      environment: 'production',
      syncGrades: true,
      syncAttendance: false,
      syncStudents: true,
      syncLectures: true,
    },
  },
  {
    id: 'ms_teams',
    name: 'Microsoft Teams for Education (Office 365)',
    provider: 'microsoft',
    description: 'إدارة وتكامل القاعات الافتراضية، مزامنة الجداول الأسبوعية للبث التفاعلي المباشر، وسجلات حضور الحصص.',
    iconName: 'MSTeams',
    colorTheme: 'indigo',
    status: 'connected',
    lastSyncTime: 'أمس، 08:45 مساءً',
    syncedRecordsCount: 650,
    autoSyncEnabled: true,
    syncIntervalHours: 12,
    authConfig: {
      tenantId: 'maysan-gifted-edu.onmicrosoft.com',
      clientId: 'teams-app-client-554109',
      environment: 'production',
      syncGrades: false,
      syncAttendance: true,
      syncStudents: true,
      syncLectures: true,
    },
  },
  {
    id: 'madrasati',
    name: 'منصة مدرستي والمنظومة التعليمية الموحدة',
    provider: 'madrasati',
    description: 'تكامل بنك الأسئلة للموهوبات، مؤشرات الأداء والتقويم الأكاديمي، والمقررات الإثرائية المتخصصة.',
    iconName: 'Madrasati',
    colorTheme: 'amber',
    status: 'connected',
    lastSyncTime: 'منذ يومين',
    syncedRecordsCount: 420,
    autoSyncEnabled: false,
    syncIntervalHours: 24,
    authConfig: {
      schoolCode: 'MDR-MYS-7703',
      apiKey: 'mdr_sec_991823abce8472',
      environment: 'production',
      syncGrades: true,
      syncAttendance: false,
      syncStudents: true,
      syncLectures: true,
    },
  },
  {
    id: 'oneroster_export',
    name: 'معيار التبادل الموحد OneRoster & LTI 1.3',
    provider: 'lti',
    description: 'تصدير واستيراد سجلات المدرسة والمقررات بصيغ قياسية متوافقة مع أنظمة إدارة التعلم الدولية (Canvas, Moodle, Blackboard).',
    iconName: 'LtiStandard',
    colorTheme: 'purple',
    status: 'connected',
    lastSyncTime: 'اليوم، 11:00 صباحاً',
    syncedRecordsCount: 2150,
    autoSyncEnabled: true,
    syncIntervalHours: 24,
    authConfig: {
      schoolCode: 'ONEROSTER-MYS-V1.2',
      environment: 'production',
      syncGrades: true,
      syncAttendance: true,
      syncStudents: true,
      syncLectures: true,
    },
  },
];

export const INITIAL_API_TOKENS: IntegrationApiToken[] = [
  {
    id: 'tok_mobile_app',
    title: 'تطبيق هاتف ثانوية ميسان (Maysan Mobile App)',
    token: 'mys_live_tok_998410293481029348123984',
    scope: 'full_access',
    createdAt: '2026-01-15',
    lastUsed: 'منذ 5 دقائق',
    isActive: true,
  },
  {
    id: 'tok_parent_portal',
    title: 'بوابة أولياء الأمور والرسائل النصية SMS Gateway',
    token: 'mys_live_tok_parent_gateway_7718934',
    scope: 'attendance_dispatch',
    createdAt: '2026-02-01',
    lastUsed: 'اليوم، 08:30 ص',
    isActive: true,
  },
  {
    id: 'tok_supervisor_audit',
    title: 'واجهة التدقيق والرقابة للإشراف التربوي بميسان',
    token: 'mys_live_tok_sup_audit_3389102384',
    scope: 'read_only',
    createdAt: '2026-02-10',
    lastUsed: 'اليوم، 10:15 ص',
    isActive: true,
  },
];

export const INITIAL_WEBHOOKS: IntegrationWebhook[] = [
  {
    id: 'wh_attendance_instant',
    name: 'إرسال إشعار فوري لغياب وتأخر الطالبات (Webhook)',
    targetUrl: 'https://api.maysan-gifted.edu.iq/webhooks/attendance-alerts',
    secretKey: 'whsec_991823901823908129038',
    events: ['attendance.dispatched'],
    isEnabled: true,
    lastDispatchedAt: 'اليوم، 09:15 ص',
    deliverySuccessCount: 148,
    deliveryFailureCount: 0,
  },
  {
    id: 'wh_grade_publish',
    name: 'مزامنة اعتماد ونشر النتائج الوزارية (Webhook)',
    targetUrl: 'https://newton.moedu.gov.iq/api/v1/sync/maysan/grades-hook',
    secretKey: 'whsec_moe_iraq_88391209381',
    events: ['grades.published', 'student.promoted'],
    isEnabled: true,
    lastDispatchedAt: 'أمس، 02:00 م',
    deliverySuccessCount: 32,
    deliveryFailureCount: 0,
  },
];

export const INITIAL_SYNC_LOGS: IntegrationSyncLog[] = [
  {
    id: 'log-1',
    platformId: 'newton',
    platformName: 'منصة نيوتن الوزارية',
    timestamp: 'اليوم، 09:30 ص',
    action: 'sync_attendance',
    status: 'success',
    recordsCount: 320,
    details: 'تم بنجاح رفع وتأكيد سجل الحضور والغياب الصباحي لجميع المراحل (الأول المتوسط إلى السادس العلمي) لخوادم وزارة التربية.',
  },
  {
    id: 'log-2',
    platformId: 'google_classroom',
    platformName: 'Google Classroom',
    timestamp: 'اليوم، 08:45 ص',
    action: 'sync_lectures',
    status: 'success',
    recordsCount: 45,
    details: 'مزامنة 45 درساً وملف PDF تفاعلي مع فصول الفيزياء والكيمياء والرياضيات المتقدمة.',
  },
  {
    id: 'log-3',
    platformId: 'newton',
    platformName: 'منصة نيوتن الوزارية',
    timestamp: 'أمس، 04:15 م',
    action: 'export_grades',
    status: 'success',
    recordsCount: 180,
    details: 'تصدير درجات الفصل الدراسي الأول والقرارات الوزارية للمديرية العامة لتربية ميسان مع الاعتماد المشفر.',
  },
  {
    id: 'log-4',
    platformId: 'ms_teams',
    platformName: 'Microsoft Teams',
    timestamp: 'أمس، 01:20 م',
    action: 'health_check',
    status: 'success',
    recordsCount: 12,
    details: 'فحص الاتصال وتحديث جلسات البث المباشر للشعب (أ، ب، ج) بنجاح كامل وسرعة استجابة 42ms.',
  },
];

/**
 * Downloads a CSV package for Iraqi Newton Platform
 */
export function downloadNewtonGradesPackage(students: Student[], certificates: StudentCertificate[]) {
  const headers = [
    'الرقم الوزاري',
    'اسم الطالبة الرباعي واللقب',
    'الصف الدراسي',
    'الشعبة',
    'المعدل العام',
    'الدرجات والقرارات',
    'النتيجة الرسمية',
    'تاريخ التوثيق',
  ];

  const rows = students.map((std) => {
    const cert = certificates.find((c) => c.studentId === std.id);
    const avg = cert ? cert.overallFinalGrade : std.gpa;
    const result = cert ? cert.status : 'ناجحة بتفوق';
    const gradesBreakdown = cert
      ? cert.subjects.map((s) => `${s.subjectName}:${s.finalGrade}`).join(' | ')
      : 'درجات معتمدة';

    return [
      `"${std.nationalId || std.id}"`,
      `"${std.name}"`,
      `"${std.gradeLevel}"`,
      `"${std.section}"`,
      `"${avg}%"`,
      `"${gradesBreakdown}"`,
      `"${result}"`,
      `"${new Date().toLocaleDateString('ar-IQ')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `حزمة_مطابقة_درجات_نيوتن_الوزارية_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads OneRoster 1.2 CSV for Global LMS Systems
 */
export function downloadOneRosterPackage(students: Student[], teachers: Teacher[]) {
  const usersHeaders = [
    'sourcedId',
    'status',
    'dateLastModified',
    'enabledUser',
    'username',
    'givenName',
    'familyName',
    'role',
    'identifier',
    'email',
    'sms',
    'phone',
  ];

  const studentRows = students.map((s) =>
    [
      `"${s.id}"`,
      '"active"',
      `"${new Date().toISOString()}"`,
      '"true"',
      `"${s.email}"`,
      `"${s.name.split(' ')[0]}"`,
      `"${s.name.split(' ').slice(1).join(' ')}"`,
      '"student"',
      `"${s.nationalId || s.id}"`,
      `"${s.email}"`,
      `"${s.parentPhone}"`,
      `"${s.parentPhone}"`,
    ].join(',')
  );

  const teacherRows = teachers.map((t) =>
    [
      `"${t.id}"`,
      '"active"',
      `"${new Date().toISOString()}"`,
      '"true"',
      `"${t.email}"`,
      `"${t.name.split(' ')[0]}"`,
      `"${t.name.split(' ').slice(1).join(' ')}"`,
      '"teacher"',
      `"${t.id}"`,
      `"${t.email}"`,
      `"${t.phone}"`,
      `"${t.phone}"`,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [usersHeaders.join(','), ...studentRows, ...teacherRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `OneRoster_users_maysan_gifted_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
