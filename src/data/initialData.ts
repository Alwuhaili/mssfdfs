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
import { ALL_IRAQI_CURRICULUM_BOOKS } from './iraqiCurriculumBooks';

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

export const INITIAL_LIBRARY_FOLDERS: LibraryFolder[] = [
  // 1. ملخصات وملازم
  {
    id: 'folder-math-summaries',
    name: 'ملخصات وملازم الرياضيات',
    subject: 'الرياضيات',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'indigo',
    description: 'ملخصات القوانين، شروحات التفاضل والتكامل، والجداول الرياضية التفاعلية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-phys-summaries',
    name: 'ملخصات وملازم الفيزياء',
    subject: 'الفيزياء',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'blue',
    description: 'ملخصات المتسعات، الحث الكهرومغناطيسي، والبصريات مع الشروحات الذهبية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-chem-summaries',
    name: 'ملخصات وملازم الكيمياء',
    subject: 'الكيمياء',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'emerald',
    description: 'ملخصات الثرموداينمك، الاتزان الأيوني، والعضوية مع الجداول التلخيصية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-bio-summaries',
    name: 'ملخصات وملازم الأحياء',
    subject: 'علم الاحياء',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'teal',
    description: 'ملخصات علم الوراثة، الخلية، والتكاثر مع الرسوم النموذجية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-arab-summaries',
    name: 'ملخصات قواعد وأدب العربية',
    subject: 'اللغة العربية',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'amber',
    description: 'ملازم القواعد، شروحات النصوص الأدبية، والتطبيقات الإعرابية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-eng-summaries',
    name: 'ملخصات وحقيبة الإنكليزية',
    subject: 'اللغة الانجليزية',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'purple',
    description: 'English Study Guides, Grammar summaries, and Model essays',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-cs-summaries',
    name: 'ملازم ودليل الحاسوب والبرمجة',
    subject: 'الحاسوب',
    gradeLevel: 'الكل',
    folderType: 'summary',
    icon: '📝',
    color: 'cyan',
    description: 'الدليل الشامل في الخوارزميات، هياكل البيانات، والذكاء الاصطناعي وبايثون',
    isDefault: true,
    createdAt: '2026-08-01',
  },

  // 2. أسئلة وزارية وحلول نموذجية
  {
    id: 'folder-math-exams',
    name: 'أسئلة وزارية وحلول نموذجية',
    subject: 'الرياضيات',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'أرشيف الأسئلة الوزارية وسلم التصحيح المعتمد للدورين الأول والثاني',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-phys-exams',
    name: 'أسئلة وزارية ومسائل مكررة',
    subject: 'الفيزياء',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'بنك الأسئلة الوزارية وحلول المسائل الفيزيائية المكررة والأنشطة',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-chem-exams',
    name: 'أسئلة وزارية وحلول الكيمياء',
    subject: 'الكيمياء',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'أرشيف الامتحانات الوزارية في الكيمياء مع الأجوبة النموذجية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-bio-exams',
    name: 'أسئلة وزارية وحلول الأحياء',
    subject: 'علم الاحياء',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'بنك الأسئلة الوزارية والتعاليل والرسومات المقررة في الأحياء',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-arab-exams',
    name: 'أرشيف الأسئلة الوزارية للعربية',
    subject: 'اللغة العربية',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'نماذج الأسئلة الوزارية لقواعد اللغة العربية والأدب والنصوص',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-eng-exams',
    name: 'أسئلة وزارية للغة الإنكليزية',
    subject: 'اللغة الانجليزية',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'Past Ministerial English Exams & Model Solutions',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-cs-exams',
    name: 'أسئلة واختبارات الحاسوب الوزارية',
    subject: 'الحاسوب',
    gradeLevel: 'الكل',
    folderType: 'exam',
    icon: '🎯',
    color: 'rose',
    description: 'نماذج الاختبارات التخصصية والأسئلة الوزارية في علوم الحاسوب',
    isDefault: true,
    createdAt: '2026-08-01',
  },

  // 3. محاضرات فيديو وشروحات
  {
    id: 'folder-math-videos',
    name: 'محاضرات وشروحات فيديو',
    subject: 'الرياضيات',
    gradeLevel: 'الكل',
    folderType: 'video',
    icon: '🎬',
    color: 'indigo',
    description: 'فيديوهات تفاعلية لشرح المسائل المعقدة وتطبيقات التفاضل والتكامل',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-phys-videos',
    name: 'محاضرات وتجارب مرئية',
    subject: 'الفيزياء',
    gradeLevel: 'الكل',
    folderType: 'video',
    icon: '🎬',
    color: 'blue',
    description: 'شروحات وتجارب فيزيائية مصورة عالية الدقة',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-chem-videos',
    name: 'تجارب وشروحات فيديو',
    subject: 'الكيمياء',
    gradeLevel: 'الكل',
    folderType: 'video',
    icon: '🎬',
    color: 'emerald',
    description: 'تفاعلات كيميائية ومحاضرات تفاعلية مصورة',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-bio-videos',
    name: 'شروحات وأفلام علمية',
    subject: 'علم الاحياء',
    gradeLevel: 'الكل',
    folderType: 'video',
    icon: '🎬',
    color: 'teal',
    description: 'محاضرات مرئية في علم الخلية، الوراثة، وعلم الأجنة',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-cs-videos',
    name: 'شروحات مرئية في البرمجة',
    subject: 'الحاسوب',
    gradeLevel: 'الكل',
    folderType: 'video',
    icon: '🎬',
    color: 'cyan',
    description: 'دروس تطبيقية مسجلة في بايثون وبناء المشاريع الذكية',
    isDefault: true,
    createdAt: '2026-08-01',
  },

  // 4. تجارب ومختبرات علمية
  {
    id: 'folder-phys-labs',
    name: 'مختبر وتجارب الفيزياء',
    subject: 'الفيزياء',
    gradeLevel: 'الكل',
    folderType: 'lab',
    icon: '🔬',
    color: 'blue',
    description: 'كتيبات التجارب المعملية والأنشطة المقررة وزارياً',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-chem-labs',
    name: 'مختبر وتجارب الكيمياء',
    subject: 'الكيمياء',
    gradeLevel: 'الكل',
    folderType: 'lab',
    icon: '🔬',
    color: 'emerald',
    description: 'تجارب المعايرة، الكيمياء الكهربائية، والسلامة المخبرية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-bio-labs',
    name: 'مختبر الأحياء والمجهر',
    subject: 'علم الاحياء',
    gradeLevel: 'الكل',
    folderType: 'lab',
    icon: '🔬',
    color: 'teal',
    description: 'التشريح، فحص الشرائح المجهرية، والتجارب الوراثية',
    isDefault: true,
    createdAt: '2026-08-01',
  },

  // 5. أوراق عمل وتدريبات
  {
    id: 'folder-cs-worksheets',
    name: 'كراسات تدريب وبرمجة بايثون',
    subject: 'الحاسوب',
    gradeLevel: 'الكل',
    folderType: 'worksheet',
    icon: '📑',
    color: 'cyan',
    description: 'قوالب كود، تمارين تطبيقية، وتحديات برمجية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-math-worksheets',
    name: 'أوراق عمل واختبارات سريعة',
    subject: 'الرياضيات',
    gradeLevel: 'الكل',
    folderType: 'worksheet',
    icon: '📑',
    color: 'indigo',
    description: 'تدريبات يومية ومسائل إثرائية لتقوية المهارات الرياضية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'folder-eng-worksheets',
    name: 'أوراق عمل وتطبيقات لغوية',
    subject: 'اللغة الانجليزية',
    gradeLevel: 'الكل',
    folderType: 'worksheet',
    icon: '📑',
    color: 'purple',
    description: 'Practice Worksheets & Grammar Quizzes',
    isDefault: true,
    createdAt: '2026-08-01',
  },

  // 6. الكتب المنهجية الرسمية
  {
    id: 'folder-curriculum-books',
    name: 'الكتب المنهجية المعتمدة (الوزارة)',
    subject: 'عام لكافة المواد',
    gradeLevel: 'الكل',
    folderType: 'curriculum',
    icon: '📕',
    color: 'amber',
    description: 'المناهج الدراسية الرسمية المعتمدة لمدارس المتميزين من وزارة التربية',
    isDefault: true,
    createdAt: '2026-08-01',
  },
];

export const INITIAL_LECTURES: LectureResource[] = [
  // 1. جميع الكتب المنهجية الرسمية الصادرة من وزارة التربية العراقية (من الأول المتوسط إلى السادس الإعدادي)
  ...ALL_IRAQI_CURRICULUM_BOOKS.map(b => ({
    ...b,
    folderId: 'folder-curriculum-books',
    subCategory: 'كتب المنهج الوزاري الرسمي',
  })),

  // 2. الملازم والملخصات المعتمدة للمدرسات والمدرسين
  {
    id: 'notes-physics-amal',
    title: 'ملزمة الشرح الذهبي والأسئلة الوزارية - الفيزياء للصف السادس العلمي',
    subject: 'الفيزياء',
    teacherName: 'أ.د. رغد نصير البهادلي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'summary_notes',
    folderId: 'folder-phys-summaries',
    subCategory: 'ملخصات وملازم',
    fileUrl: '#',
    description: 'ملزمة تفصيلية تتضمن حلول جميع الأسئلة والمسائل الوزارية من عام 2013 حتى الدور التمهيدي 2025 مع رسوم توضيحية.',
    uploadedAt: '2026-08-01',
    fileSize: '11.5 MB',
    pageCount: 140,
    chapterOrUnit: 'الفصول (1 - 5)',
    downloadCount: 240,
    viewsCount: 610,
    sampleContentText: `ملزمة الفيزياء الذهبية للمتميزات - إعداد أ.د. رغد نصير البهادلي

قوانين الفصل الأول (المتسعات):
1. السعة: C = Q / V
2. العازل الكهربائي: C_k = k * C
3. الطاقة المختزنة: PE = 1/2 * Q * V = 1/2 * C * V^2

تنبيه وزاري مكرر: عند إدخال مادة عازلة والمتسعة متصلة بالمصدر يبقى فرق الجهد ثابتاً وتزداد الشحنة، بينما إذا كانت مفصولة تبقى الشحنة ثابتة ويقل فرق الجهد.`,
  },
  {
    id: 'notes-arabic-grammar',
    title: 'ملزمة القواعد والمفاهيم البلاغية والأدب للمرحلة الإعدادية',
    subject: 'اللغة العربية',
    teacherName: 'أ. فاطمة مرتضى الشمري',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'summary_notes',
    folderId: 'folder-arab-summaries',
    subCategory: 'ملخصات وملازم',
    fileUrl: '#',
    description: 'شرح أسلوب الاستفهام، النفي، الاستثناء، والتقديم والتأخير مع جداول إعرابية لأبيات الشعر والشواهد القرآنية.',
    uploadedAt: '2026-08-03',
    fileSize: '8.2 MB',
    pageCount: 95,
    downloadCount: 188,
    viewsCount: 450,
  },
  {
    id: 'notes-english-sixth',
    title: 'دليل وحقيبة التفوق في اللغة الإنكليزية: English for Iraq - Study Guide',
    subject: 'اللغة الانجليزية',
    teacherName: 'أ. رنا ضياء الزيدي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'summary_notes',
    folderId: 'folder-eng-summaries',
    subCategory: 'ملخصات وملازم',
    fileUrl: '#',
    description: 'ملخص شامل للقواعد (Conditionals, Passive, Reported Speech) والقطع الاستيعابية والإنشاءات الوزارية النموذجية.',
    uploadedAt: '2026-08-04',
    fileSize: '7.4 MB',
    pageCount: 88,
    downloadCount: 205,
    viewsCount: 520,
  },

  // 3. بنك الأسئلة الوزارية وحلول الامتحانات
  {
    id: 'exam-archive-math',
    title: 'الأرشيف الوزاري الشامل للرياضيات مع الأجوبة النموذجية (2015 - 2025)',
    subject: 'الرياضيات',
    teacherName: 'أ. مروة كمال الساعدي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'exam_archive',
    folderId: 'folder-math-exams',
    subCategory: 'أسئلة وزارية وحلول نموذجية',
    fileUrl: '#',
    description: 'تجميع مرتب موضوعياً لجميع الأسئلة الوزارية للدور الأول والثاني والثالث وخارج القطر مع سلم التصحيح المعتمد.',
    uploadedAt: '2026-08-05',
    fileSize: '15.6 MB',
    pageCount: 165,
    downloadCount: 310,
    viewsCount: 780,
  },
  {
    id: 'exam-archive-phys',
    title: 'بنك الأسئلة الوزارية وحلول المسائل الفيزيائية المكررة',
    subject: 'الفيزياء',
    teacherName: 'أ.د. رغد نصير البهادلي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'exam_archive',
    folderId: 'folder-phys-exams',
    subCategory: 'أسئلة وزارية وحلول نموذجية',
    fileUrl: '#',
    description: 'تغطية لكافة النشاطات المختبرية، التعاليل الفيزيائية، ومسائل الرنين والحث الكهرومغناطيسي المتكررة وزارياً.',
    uploadedAt: '2026-08-06',
    fileSize: '13.2 MB',
    pageCount: 120,
    downloadCount: 290,
    viewsCount: 640,
  },
  {
    id: 'exam-archive-3mid',
    title: 'بنك الأسئلة الوزارية للثالث المتوسط لجميع المواد (الدور الأول والثاني)',
    subject: 'الرياضيات',
    teacherName: 'أ. علي كريم الربيعي',
    gradeLevel: 'الصف الثالث المتوسط',
    type: 'pdf',
    category: 'exam_archive',
    folderId: 'folder-math-exams',
    subCategory: 'أسئلة وزارية وحلول نموذجية',
    fileUrl: '#',
    description: 'تجميع شامل لأسئلة الامتحانات الوزارية العامة لطلبة الثالث المتوسط للأعوام 2019-2025 مع الأجوبة النموذجية لمركز الفحص.',
    uploadedAt: '2026-08-06',
    fileSize: '18.4 MB',
    pageCount: 155,
    downloadCount: 410,
    viewsCount: 980,
  },

  // 4. أوراق عمل وتطبيقات تفاعلية
  {
    id: 'res-cs-mohammed-guide',
    title: 'الدليل الشامل في الخوارزميات وهياكل البيانات والبرمجة الحديثة (Python & C++)',
    subject: 'الحاسوب',
    teacherName: 'محمد نعمة كاظم كريدي الوحيلي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'pdf',
    category: 'summary_notes',
    folderId: 'folder-cs-summaries',
    subCategory: 'ملخصات وملازم',
    fileUrl: '#',
    description: 'ملزمة تخصصية وتطبيقية شاملة لشرح المنطق البرمجي، خوارزميات البحث والترتيب، وقواعد البيانات وتطبيقات الذكاء الاصطناعي وإعداد المشاريع المتميزة.',
    uploadedAt: '2026-08-10',
    fileSize: '7.8 MB',
    pageCount: 68,
    downloadCount: 195,
    viewsCount: 430,
    sampleContentText: `الدليل الشامل في علم الحاسوب والبرمجة للمتميزين
إعداد: محمد نعمة كاظم كريدي الوحيلي - مدرس مادة الحاسوب

الفصل الأول: المفاهيم الأساسية للخوارزميات والتعقيد الحسابي Big-O
الفصل الثاني: البرمجة كائنية التوجه Object-Oriented Programming (OOP)
الفصل الثالث: هياكل البيانات (المصفوفات، القوائم الموصولة، المكدسات، الطوابير، والأشجار)
الفصل الرابع: تطبيقات عملية في الذكاء الاصطناعي وتحليل البيانات بلغة بايثون Python
الفصل الخامس: أمن المعلومات وقواعد البيانات وتصميم الأنظمة`,
  },
  {
    id: 'ws-python-comp',
    title: 'كراس التدريب العملي: مستند البرمجة بلغة Python والذكاء الاصطناعي',
    subject: 'الحاسوب',
    teacherName: 'أ. مريم عماد الكعبي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'doc',
    category: 'worksheet',
    folderId: 'folder-cs-worksheets',
    subCategory: 'أوراق عمل واختبارات تدريبية',
    fileUrl: '#',
    description: 'قوالب كود وجداول واختبارات تطبيقية لإنشاء خوارزميات الذكاء الاصطناعي والشبكات العصبية.',
    uploadedAt: '2026-08-07',
    fileSize: '2.4 MB',
    pageCount: 45,
    downloadCount: 82,
    viewsCount: 190,
  },
  {
    id: 'lec-video-derivatives',
    title: 'محاضرة مرئية: تطبيقات التفاضل في إيجاد الثوابت والرسم البياني',
    subject: 'الرياضيات',
    teacherName: 'أ. مروة كمال الساعدي',
    gradeLevel: 'الصف السادس العلمي',
    type: 'video',
    category: 'lecture',
    folderId: 'folder-math-videos',
    subCategory: 'محاضرات وشروحات فيديو',
    fileUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'فيديو تفاعلي يحل 10 مسائل وزارية صعبة في رسم المنحنيات وإيجاد نقاط الانقلاب.',
    uploadedAt: '2026-08-08',
    fileSize: 'Video 1080p',
    pageCount: 1,
    downloadCount: 145,
    viewsCount: 520,
  },
];

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

