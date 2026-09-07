/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'supervisor';

export type Language = 'ar' | 'en';

export type GradeLevel =
  | 'الصف الأول المتوسط'
  | 'الصف الثاني المتوسط'
  | 'الصف الثالث المتوسط'
  | 'الصف الرابع العلمي'
  | 'الصف الخامس العلمي'
  | 'الصف السادس العلمي';

export type Section = 'أ' | 'ب' | 'جـ' | 'د';

export const ALL_GRADES_LIST: GradeLevel[] = [
  'الصف الأول المتوسط',
  'الصف الثاني المتوسط',
  'الصف الثالث المتوسط',
  'الصف الرابع العلمي',
  'الصف الخامس العلمي',
  'الصف السادس العلمي',
];

export const GRADE_LEVELS = ALL_GRADES_LIST;

export const OFFICIAL_SUBJECTS_LIST: string[] = [
  'التربية الاسلامية',
  'اللغة العربية',
  'اللغة الكردية',
  'اللغة الانجليزية',
  'اللغة الفرنسية',
  'الاجتماعيات',
  'التربية الاخلاقية',
  'الرياضيات',
  'الحاسوب',
  'الفيزياء',
  'الكيمياء',
  'علم الاحياء',
  'علم الأرض (الجيولوجيا)',
  'جرائم حزب البعث',
  'التربية الفنية',
  'التربية الرياضية',
];

export const GRADE_SUBJECTS_MAP: Record<GradeLevel, string[]> = {
  'الصف الأول المتوسط': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'الاجتماعيات',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الأخلاقية',
    'التربية الفنية',
    'التربية الرياضية',
  ],
  'الصف الثاني المتوسط': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'الاجتماعيات',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الأخلاقية',
    'التربية الفنية',
    'التربية الرياضية',
  ],
  'الصف الثالث المتوسط': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'الاجتماعيات',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الأخلاقية',
    'التربية الفنية',
    'التربية الرياضية',
  ],
  'الصف الرابع العلمي': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الكردية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'جرائم حزب البعث',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الفنية',
    'التربية الرياضية',
  ],
  'الصف الخامس العلمي': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الكردية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الفنية',
    'التربية الرياضية',
  ],
  'الصف السادس العلمي': [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الكردية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'الرياضيات',
    'الحاسوب',
    'الفيزياء',
    'الكيمياء',
    'علم الأحياء',
    'التربية الفنية',
    'التربية الرياضية',
  ],
};

export function getSubjectsForGrade(gradeLevel: GradeLevel): string[] {
  return GRADE_SUBJECTS_MAP[gradeLevel] || GRADE_SUBJECTS_MAP['الصف الرابع العلمي'];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  gradeLevel?: GradeLevel; // For students
  subject?: string; // For teachers
  parentId?: string; // For students
  studentId?: string; // For parents (their child)
}

export interface EducationalSupervisor {
  id: string;
  name: string; // e.g. 'أ.د. حيدر جاسم الكناني'
  title: string; // e.g. 'المشرف الأكاديمي والتربوي المعتمد'
  specialization: string; // e.g. 'الفيزياء المتقدمة ورعاية المتفوقين'
  degree?: string; // e.g. 'دكتوراه في الفيزياء النظرية'
  email: string; // e.g. 'haider.supervisor@maysan.edu.iq'
  phone: string; // e.g. '07709988776'
  assignedSubjects: string[]; // e.g. ['الفيزياء', 'الرياضيات']
  assignedGrades: GradeLevel[]; // e.g. ['الصف السادس العلمي', 'الصف الخامس العلمي']
  status: 'نشط' | 'في مهمة رسمية' | 'في إجازة' | 'غير نشط';
  joinedDate: string; // e.g. '2021-09-01'
  evaluationScore?: number; // e.g. 99.8
  notes?: string;
  avatar?: string;
  isPrimary?: boolean; // Whether this is the primary supervisor for school documents & certificates
  supervisorType?: 'مشرف اختصاصي' | 'مشرف تربوي عام' | 'مشرف إدارة مدرسية' | 'مشرف جودة واعتماد';
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  subject?: string;
  gradeLevel?: GradeLevel;
  assignedGrades?: GradeLevel[];
  gender?: 'male' | 'female' | 'ذكر' | 'أنثى';
  avatar?: string;
  isDirectress?: boolean;
  teacherObj?: Teacher;
  studentObj?: Student;
  parentObj?: Parent;
  supervisorObj?: EducationalSupervisor;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  specialization?: string;
  email: string;
  phone: string;
  nationalId?: string;
  avatar?: string;
  isDirectress?: boolean;
  assignedGrades: GradeLevel[];
  assignedSections?: Section[];
  status: 'نشط' | 'في إجازة' | 'محظور' | 'مقيد الوصول';
  joinedDate: string;
  gender?: 'male' | 'female' | 'ذكر' | 'أنثى';
  rating?: number;
  availableDays?: string[]; // أيام التواجد والحصص الأسبوعية (e.g. ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'])
}

export interface DisciplinaryDecision {
  id: string;
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  section: string;
  decisionType: 'إنذار أول' | 'إنذار نهائي' | 'تعهد خطي' | 'قرار فصل بسبب الغياب' | 'قبول عذر وتبرير غياب';
  absenceDaysCount: number;
  missedLessonsCount: number;
  issueDate: string;
  issuedBy: string; // e.g. 'المديرة الهام صبيح سعدون'
  officialLetterNumber?: string;
  notes?: string;
  isReadByParent?: boolean;
  attachmentUrl?: string; // Data URL or URL of uploaded medical report / sick leave letter
  attachmentName?: string; // Name of uploaded document
  justifiedDaysCount?: number; // عدد الأيام المبررة إذا كان القرار قبول عذر
  justifiedDates?: string[]; // تواريخ الأيام التي تم تبريرها رسمياً
  status?: 'نافذ' | 'ملغي' | 'مسحوب'; // حالة القرار
  revokedAt?: string;
  revokedReason?: string;
  revokedBy?: string;
}

export interface StudentShieldBadge {
  id: string;
  title: string; // e.g. '⚡ درع تورنغ للمبتكرات الرقمية'
  type: 'shield' | 'medal' | 'badge' | 'trophy';
  category?: string; // e.g. 'الحاسوب والتكنولوجيا', 'الرياضيات والذكاء', 'العلوم والفيزياء'
  dateAwarded: string; // e.g. '2026-08-15'
  issuedBy: string; // e.g. 'إدارة المدرسة / الأستاذة إلهام صبيح سعدون'
  reason?: string; // e.g. 'الفوز بالمركز الأول في تحدي البرمجة والخوارزميات 2026'
  icon?: string; // e.g. '⚡' | '🏆' | '🥇' | '🔬' | '🌟' | '👑'
}

export interface Student {
  id: string;
  studentCode?: string;
  name: string;
  nationalId: string;
  phone?: string;
  email?: string;
  gradeLevel: GradeLevel;
  section: string; // أ / ب
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentId?: string;
  gpa: number; // e.g. 98.5
  status: 'منتظمة' | 'مؤجلة' | 'منقولة' | 'محظورة' | 'مقيدة الوصول' | 'مفصولة بالغيابات';
  enrollmentYear: string;
  notes?: string;
  avatar?: string;
  bloodType?: string;
  badges?: string[];
  shieldsAndBadges?: StudentShieldBadge[];
  unexcusedAbsenceDays?: number;
  excusedAbsenceDays?: number;
  totalMissedLessons?: number;
  warningLevel?: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل';
  disciplinaryDecisions?: DisciplinaryDecision[];
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  status?: 'نشط' | 'محظور' | 'مقيد الوصول';
}

export interface Question {
  id: string;
  text: string;
  options?: string[]; // For MCQ
  correctAnswer: string | number; // Index or string
  points: number;
  type: 'mcq' | 'true_false' | 'short_answer';
}

export interface AntiCheatConfig {
  enableTabSwitchDetection: boolean;
  maxTabSwitchesAllowed: number;
  enableFullScreenEnforcement: boolean;
  disableCopyPaste: boolean;
  timeLimitMinutes: number;
  randomizeQuestions: boolean;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  gradeLevel: GradeLevel;
  section?: Section | 'الكل' | string;
  durationMinutes: number;
  questions: Question[];
  totalPoints: number;
  antiCheat: AntiCheatConfig;
  status: 'قادم' | 'جاري' | 'مكتمل' | 'مسودة';
  dueDate: string;
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  section?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  timeTakenMinutes: number;
  cheatViolationsCount: number;
  answers: Record<string, string | number>;
  status: 'تم التصحيح تلقائياً' | 'تم التدقيق والتصحيح' | 'قيد المراجعة' | 'مصحح يدوياً';
  manualQuestionGrades?: Record<string, number>;
  adminNotes?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  section?: string; // شعبة الطالبة (أ، ب، جـ، د)
  status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
  subject: string;
  markedByTeacher: string;
  notes?: string;
  parentNotified: boolean;
  modifiedAt?: string;
  modifiedBy?: string;
  originalStatus?: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
  reasonForModification?: string;
  isRevokedMistakenAbsence?: boolean; // هل تم التراجع عن رصد الغياب المسجل سهواً
  undoneAt?: string; // تاريخ وساعة التراجع
  undoneBy?: string; // اسم من قام بالتراجع (المديرة/الإدارة/المُدرسة)
  undoReason?: string; // سبب التراجع (سجلت غائبة سهواً)
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  senderRole: UserRole;
  senderName: string;
  targetAudience: 'all' | 'teachers' | 'parents' | 'students' | GradeLevel;
  specificStudentId?: string;
  priority: 'عادي' | 'هتـام' | 'عاجل';
  createdAt: string;
  readBy: string[]; // user IDs
}

export type MessageFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash';

export interface UserCustomFolder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'doc' | 'image' | 'archive' | 'sheet';
  url?: string;
}

export interface MessageRecipient {
  id: string;
  name: string;
  rawName?: string;
  role?: UserRole;
  details?: string;
}

export interface UserMessageState {
  folder?: MessageFolder | string;
  isRead?: boolean;
  isStarred?: boolean;
  isTrash?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  customFolderId?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverIds?: string[];
  recipients?: MessageRecipient[];
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  folder?: MessageFolder;
  isDraft?: boolean;
  isSpam?: boolean;
  isStarred?: boolean;
  isTrash?: boolean;
  category?: 'direct' | 'official_letter' | 'parent_summons' | 'appreciation' | 'exception_request';
  priority?: 'عادي' | 'مهم' | 'عاجل' | 'عاجل وسري';
  serialNumber?: string;
  letterDate?: string;
  logoUrl?: string;
  copiesTo?: string[];
  attachments?: MessageAttachment[];
  hasOfficialSeal?: boolean;
  replyToId?: string;
  readAt?: string;
  userStates?: Record<string, UserMessageState>;
}

export type LibraryCategory =
  | 'curriculum_book'   // كتب المناهج والكتب المدرسية الرسمية
  | 'summary_notes'     // ملازم وملخصات ومذكرات المدرسات
  | 'exam_archive'      // أسئلة وحلول الامتحانات الوزارية
  | 'worksheet'         // أوراق عمل واختبارات تدريبية
  | 'lecture';          // محاضرات ودروس عامة

export type LibraryFolderType =
  | 'summary'        // ملخصات وملازم
  | 'exam'           // أسئلة وزارية وامتحانات
  | 'video'          // محاضرات فيديو وشروحات
  | 'worksheet'      // أوراق عمل وتدريبات
  | 'lab'            // تجارب ومختبرات علمية
  | 'enrichment'     // ملفات إثرائية وبحوث
  | 'curriculum'     // كتب المنهج الوزاري
  | 'custom';        // مجلد مخصص

export interface LibraryFolder {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: GradeLevel | 'الكل';
  folderType?: LibraryFolderType;
  icon?: string;
  color?: string;
  description?: string;
  createdByTeacherName?: string;
  createdByTeacherId?: string;
  createdByRole?: UserRole;
  createdAt?: string;
  isDefault?: boolean;
}

export interface ChapterItem {
  id: string;
  title: string;
  pageNumber: number;
  summary?: string;
}

export interface LectureResource {
  id: string;
  title: string;
  subject: string;
  teacherName: string;
  gradeLevel: GradeLevel;
  type: 'video' | 'pdf' | 'doc' | 'ppt';
  fileUrl: string;
  description: string;
  uploadedAt: string;
  fileSize?: string;
  category?: LibraryCategory;
  folderId?: string;
  subCategory?: string;
  pageCount?: number;
  chapterOrUnit?: string;
  isOfficialBook?: boolean;
  coverGradient?: string;
  pdfDataUrl?: string; // Real base64 PDF data URL if uploaded from disk
  videoUrl?: string; // Embedded video or player link
  sampleContentText?: string; // Rich formatted educational content for direct in-app reading
  chapters?: ChapterItem[]; // Table of contents
  downloadCount?: number;
  viewsCount?: number;
  academicYear?: string;
  publisher?: string;
  tags?: string[];
  uploaderId?: string;
  uploaderName?: string;
  uploaderRole?: UserRole;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس';
  period: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 7 دروس / حصص
  timeSlot: string; // e.g. "08:00 - 08:45" (45 دقيقة درس + 5 دقائق استراحة)
  gradeLevel: GradeLevel;
  section?: Section | string;
  subject: string;
  teacherName: string;
  room?: string;
}

export interface GradeSubjectQuota {
  id: string;
  gradeLevel: GradeLevel;
  subjectName: string;
  weeklyPeriods: number; // عدد الحصص الأسبوعية المحددة للمادة
  teacherName: string;   // اسم مدرسة / أستاذة المادة
  classroom?: string;    // القاعة أو المختبر المخصص
  availableDays?: string[]; // أيام التواجد والحصص المحددة للمدرس بهذه المادة
}

export interface FinancialRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  feeType: string;
  totalAmount: number; // IQD or USD
  paidAmount: number;
  status: 'مكتمل' | 'جزئي' | 'غير مدفوع';
  dueDate: string;
  lastPaymentDate?: string;
}

export interface UserNotificationState {
  isRead?: boolean;
  isDeleted?: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'success' | 'alert' | 'security';
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert' | 'security';
  timestamp?: string;
  createdAt?: string;
  isRead: boolean;
  readBy?: string[];
  deletedBy?: string[];
  userStates?: Record<string, UserNotificationState>;
  targetRole?: UserRole | 'all';
  targetUserId?: string;
  targetUserIds?: string[];
  targetStudentId?: string;
  targetStudentIds?: string[];
  targetParentId?: string;
  targetParentIds?: string[];
  targetTeacherId?: string;
  targetTeacherIds?: string[];
  isAttendanceNotif?: boolean;
  isPrivateAccountSecurity?: boolean;
  targetGradeLevel?: GradeLevel | 'الكل';
  targetSection?: Section | 'الكل';
  senderName?: string;
  senderRole?: UserRole;
  link?: string;
  targetAudienceScope?: 'personal' | 'category' | 'class' | 'public' | 'multi_user';
  isPinned?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SubjectGrade {
  id: string;
  subjectName: string;
  firstTermAvg: number; // معدل الفصل الأول (0-100)
  midYearGrade: number; // درجة نصف السنة (0-100)
  secondTermAvg: number; // معدل الفصل الثاني (0-100)
  annualSaeiAvg: number; // معدل السعي السنوي
  finalExamGrade: number; // درجة الامتحان النهائي - الدور الأول
  finalGrade: number; // معدل الدرجة النهائية - الدور الأول
  resitGrade?: number | null; // درجة الإكمال - الدور الثاني (اختياري)
  postResitGrade?: number | null; // معدل ما بعد الإكمال (الدرجة النهائية بعد الإكمال)
  decisionMarks?: number; // درجات القرار المضافة لهذه المادة (1-10 درجات)
  isExempt?: boolean; // معفاة من الامتحان النهائي
  exemptionType?: 'general' | 'individual' | 'none'; // نوع الإعفاء للمادة
  notes?: string;
}

export interface MinistryDecisionSettings {
  maxDecisionMarks: number; // عدد درجات القرار المتاحة (5، 10، 15، أو مخصص بحسب قرار الوزارة)
  decisionScopeMode: 'total_pool' | 'per_subject'; // نطاق القرار: 'total_pool' (إجمالي رصيد لكل المواد) أو 'per_subject' (رصيد مستقل لكل مادة)
  maxDecisionMarksPerSubject?: number; // السقف الأقصى لدرجات القرار للمادة الواحدة
  maxResitSubjects: number; // أقصى عدد دروس للإكمال قبل الرسوب (الافتراضي: 3 دروس)
  minPassingGrade: number; // حد النجاح الأدنى (الافتراضي: 50)
  autoApplyDecisionMarks: boolean; // التعديل والتطبيق الأوتوماتيكي لدرجات القرار
}

export type CertificateModelType =
  | 'model1_first_term'         // النموذج الأول: معدل درجات الفصل الأول فقط
  | 'model2_mid_year'           // النموذج الثاني: معدل درجات الفصل الأول ودرجة نصف السنة فقط
  | 'model3_annual_saei'        // النموذج الثالث: معدل الفصل الأول ونصف السنة والفصل الثاني والسعي السنوي والتقدير
  | 'model4_final_round1'       // النموذج الرابع: الشهادة المدرسية النهائية - الدور الأول
  | 'model5_makeup_post_resit'  // النموذج الخامس: الشهادة المدرسية - ما بعد الإكمال / الدور الثاني
  | 'model3_final_round1'       // للتوافق السابق (ترادف النموذج الرابع)
  | 'model4_makeup_post_resit'; // للتوافق السابق (ترادف النموذج الخامس)

export interface CertificateModelOption {
  id: CertificateModelType;
  titleAr: string;
  shortTitle: string;
  badgeTag: string;
  descAr: string;
  icon: string;
}

export const CERTIFICATE_MODELS: CertificateModelOption[] = [
  {
    id: 'model1_first_term',
    titleAr: 'الشهادة المدرسية - معدل درجات الفصل الأول',
    shortTitle: 'النموذج 1: الفصل الأول',
    badgeTag: 'معدل الفصل 1 فقط',
    descAr: 'يعرض معدل درجات الفصل الأول لكل مادة والمعدل العام للفصل الأول والتوقيعات الرسمية',
    icon: '🏅',
  },
  {
    id: 'model2_mid_year',
    titleAr: 'الشهادة المدرسية - معدل درجات الفصل الأول ودرجات نصف السنة',
    shortTitle: 'النموذج 2: نصف السنة',
    badgeTag: 'الفصل 1 + نصف السنة',
    descAr: 'يعرض معدل الفصل الأول ودرجة امتحان نصف السنة والمعدل العام والتوقيعات الرسمية',
    icon: '📑',
  },
  {
    id: 'model3_annual_saei',
    titleAr: 'الشهادة المدرسية - السعي السنوي',
    shortTitle: 'النموذج 3: السعي السنوي',
    badgeTag: 'السعي السنوي',
    descAr: 'يعرض معدل الفصل الأول ونصف السنة والفصل الثاني والسعي السنوي والتقدير والملاحظات',
    icon: '📊',
  },
  {
    id: 'model4_final_round1',
    titleAr: 'الشهادة المدرسية - النتيجة النهائية (الدور الأول)',
    shortTitle: 'النموذج 4: النهائي (دور 1)',
    badgeTag: 'الشهادة النهائية (دور 1)',
    descAr: 'يشمل الفصلين، نصف السنة، السعي السنوي، الامتحان النهائي، المعدل النهائي وقرار الإعفاء',
    icon: '🎓',
  },
  {
    id: 'model5_makeup_post_resit',
    titleAr: 'الشهادة المدرسية - الدور الثاني وما بعد الإكمال',
    shortTitle: 'النموذج 5: ما بعد الإكمال',
    badgeTag: 'الدور 2 + ما بعد الإكمال',
    descAr: 'يشمل كافة الدرجات بالإضافة لأعمدة درجة الإكمال وما بعد الإكمال والنتيجة بعد الدور الثاني',
    icon: '⚖️',
  },
];

export interface IssueCertificatesOptions {
  scope: 'all' | 'grade' | 'section' | 'student' | 'selected';
  gradeLevel?: GradeLevel;
  section?: string;
  studentId?: string;
  studentIds?: string[];
  isBlankTemplate?: boolean; // نموذج فارغ للإدخال اليدوي أو الطباعة الورقية
  overwriteExisting?: boolean; // استبدال الشهادة إذا كانت موجودة مسبقاً
  customAcademicYear?: string;
  targetModel?: CertificateModelType; // النموذج المستهدف للإصدار
}

export interface StudentCertificate {
  id: string;
  studentId: string;
  studentName: string;
  nationalId: string;
  gradeLevel: GradeLevel;
  section: string;
  academicYear: string; // e.g. "2026 - 2027"
  subjects: SubjectGrade[];
  overallFirstTermAvg: number; // معدل الفصل الأول العام
  overallMidYearGrade: number; // درجة نصف السنة العامة
  overallSecondTermAvg: number; // معدل الفصل الثاني العام
  overallAnnualSaeiAvg: number; // معدل السعي السنوي العام
  overallFinalExamGrade: number; // درجة الامتحان النهائي العامة
  overallFinalGrade: number; // معدل الدرجة النهائية العامة (الدور الأول)
  overallPostResitAvg?: number | null; // معدل ما بعد الإكمال العام
  status: 'ناجحة' | 'مكملة' | 'راسبة' | 'مؤجلة' | 'ناجحة بالدور الثاني';
  originalStatus?: 'ناجحة' | 'مكملة' | 'راسبة' | 'مؤجلة' | 'ناجحة بالدور الثاني'; // الحالة الأصلية قبل إضافة درجات القرار
  resitSubjectsCount?: number;
  exemptionType?: 'general' | 'individual' | 'none'; // نوع الإعفاء الشهادة
  exemptSubjectsCount?: number;
  decisionMarksUsed?: number; // إجمالي درجات القرار الوزاري المستخدمة
  hasDecisionMarks?: boolean; // هل تم إضافة درجات قرار
  decisionNotes?: string; // ملاحظات وتفاصيل القرار الوزاري
  appreciation: string; // e.g. "امتياز", "جيد جداً", "جيد", "مقبول"
  certificateModel?: CertificateModelType; // النموذج المختار افتراضياً
  issueDate: string;
  notes?: string;
}

export type CalendarEventType = 'exam' | 'holiday' | 'event' | 'activity' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // Optional end date YYYY-MM-DD
  type: CalendarEventType;
  targetGrade?: GradeLevel | 'الكل';
  location?: string;
  isImportant?: boolean;
}

// Eye-Soothing Color Themes
export type ColorThemeId =
  | 'sage'
  | 'lavender'
  | 'cream'
  | 'sky'
  | 'rose'
  | 'classic'
  | 'dark';

export interface ColorThemeOption {
  id: ColorThemeId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  badgeBg: string;
  accentColor: string;
  bgHex: string;
  badgeTagAr: string;
  badgeTagEn: string;
  isDark?: boolean;
}

export const COLOR_THEMES_LIST: ColorThemeOption[] = [
  {
    id: 'sage',
    nameAr: 'الزمردي والنعناع الهادئ',
    nameEn: 'Sage & Mint Calm',
    descAr: 'درجات النعناع الهادئة المأخوذة من الطبيعة لتقليل الإجهاد البصري أثناء القراءة والمتابعة',
    descEn: 'Soothing natural mint greens designed to minimize eye fatigue during extended viewing.',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    accentColor: '#0d9488',
    bgHex: '#edf6f2',
    badgeTagAr: 'طبيعي مريح 🌿',
    badgeTagEn: 'Natural Calm 🌿',
  },
  {
    id: 'lavender',
    nameAr: 'اللافندر والبنفسجي الناعم',
    nameEn: 'Soft Lavender Indigo',
    descAr: 'درجات اللافندر الناعمة والبنفسجي اللطيف لتجربة تصفح راقية ومريحة جداً للعين',
    descEn: 'Relaxing lavender and pastel indigo for a smooth, high-comfort reading experience.',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    accentColor: '#6366f1',
    bgHex: '#f4f3fb',
    badgeTagAr: 'بنفسجي مهدئ 💜',
    badgeTagEn: 'Soothing Lavender 💜',
  },
  {
    id: 'cream',
    nameAr: 'الكشمير والعاجي الدافئ (حماية العين)',
    nameEn: 'Warm Cream Cashmere (Eye Care)',
    descAr: 'خلفية دافئة خالية من سطوع الأبيض التفاعلي تشبه صفحات الكتب لمنع التعب البصري',
    descEn: 'Warm zero-glare sepia ivory background mimicking book pages for maximum eye comfort.',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#b45309',
    bgHex: '#faf6ef',
    badgeTagAr: 'حماية العين 👓',
    badgeTagEn: 'Zero Glare 👓',
  },
  {
    id: 'sky',
    nameAr: 'السماوي والفيروزي المهدئ',
    nameEn: 'Tranquil Sky Turquoise',
    descAr: 'ألوان السماء اللطيفة والفيروز الهادئ لإعطاء تركيز أعلى وإحساس بالنقاء والهدوء',
    descEn: 'Tranquil soft cyan and light blue hues for calm focus and mental clarity.',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    accentColor: '#0284c7',
    bgHex: '#f0f7fd',
    badgeTagAr: 'سماوي مهدئ ☁️',
    badgeTagEn: 'Tranquil Sky ☁️',
  },
  {
    id: 'rose',
    nameAr: 'الوردي الكوارتز الهادئ',
    nameEn: 'Soft Rose Quartz',
    descAr: 'لمسات الكوارتز الوردية الناعمة والدافئة المريحة للعين',
    descEn: 'Delicate blush rose quartz tones for a gentle, cozy atmosphere.',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    accentColor: '#be123c',
    bgHex: '#faf2f4',
    badgeTagAr: 'وردي لطيف 🌸',
    badgeTagEn: 'Soft Quartz 🌸',
  },
  {
    id: 'classic',
    nameAr: 'اللؤلؤي الكلاسيكي',
    nameEn: 'Classic Pearl Slate',
    descAr: 'المظهر الحيادي اللؤلؤي المتوازن والناصع الأنيق',
    descEn: 'Crisp, clean neutral slate background with balanced light contrast.',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#4f46e5',
    bgHex: '#f8fafc',
    badgeTagAr: 'لؤلؤي كلاسيكي 💎',
    badgeTagEn: 'Classic Pearl 💎',
  },
  {
    id: 'dark',
    nameAr: 'الوضع الليلي المخملي (الداكن)',
    nameEn: 'Velvet Dark Night Mode',
    descAr: 'خلفية داكنة مريحة للعين للقراءة والتصفح في البيئات المظلمة ليلاً',
    descEn: 'Deep soothing dark palette ideal for night reading and low-light environments.',
    badgeBg: 'bg-slate-900 text-amber-300 border-slate-700',
    accentColor: '#818cf8',
    bgHex: '#0b1329',
    badgeTagAr: 'ليلي مريح 🌙',
    badgeTagEn: 'Night Vision 🌙',
    isDark: true,
  },
];

export interface HonorStudent {
  rank: 1 | 2 | 3;
  name: string;
  grade: string;
  section: string;
  gpa: number;
  avatar: string;
  specialty: string;
  dream: string;
}

export interface GraduateStudent {
  id: string;
  name: string;
  graduationYear: string; // e.g. '2025/2026', '2024/2025'
  gpa: number; // e.g. 99.8
  section?: string;
  collegeOrSpecialty?: string;
  avatar?: string;
  notes?: string;
  rankInBatch?: number;
  honorBadge?: string;
}

export function getNextGradeLevel(currentGrade: GradeLevel): GradeLevel | 'GRADUATED' {
  switch (currentGrade) {
    case 'الصف الأول المتوسط':
      return 'الصف الثاني المتوسط';
    case 'الصف الثاني المتوسط':
      return 'الصف الثالث المتوسط';
    case 'الصف الثالث المتوسط':
      return 'الصف الرابع العلمي';
    case 'الصف الرابع العلمي':
      return 'الصف الخامس العلمي';
    case 'الصف الخامس العلمي':
      return 'الصف السادس العلمي';
    case 'الصف السادس العلمي':
      return 'GRADUATED';
    default:
      return currentGrade;
  }
}

export interface SchoolAdminData {
  principalName: string;
  principalBadge: string;
  principalTitle: string;
  principalDegree: string;
  principalImageUrl: string;
  assistantPrincipalName?: string;
  assistantPrincipalTitle?: string;
  academicSupervisorName?: string;
  academicSupervisorTitle?: string;
  visionMessage: string;
  achievements: string[];
  schoolWorkingHoursInfo?: string;
  schoolWorkingHoursDetail?: string;
  schoolUniformInfo?: string;
  schoolUniformDetail?: string;
  schoolPolicyInfo?: string;
  schoolPolicyDetail?: string;
  strategicGoals?: string[];
  // Certificate Branding & Official Header Settings
  schoolLogoUrl?: string;
  schoolNameAr?: string;
  schoolNameEn?: string;
  academicYear?: string;
  academicYearDefault?: string;
  statisticalNumberDefault?: string;
  issueDateDefault?: string;
  principalNameOnCert?: string;
  auditorCommitteeMemberName?: string;
  // Timetable Signatures & Official Approvals
  timetableSupervisorName?: string;
  principalNameOnTimetable?: string;
  // Examination Control & Audit Committee (مسؤولة الكنترول والتدقيق ورصد الدرجات)
  examControlAuditorName?: string;
  examControlAuditorTitle?: string;
}

export interface ChallengeQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'genius';
  hint?: string;
  timeSeconds?: number;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  section: string;
  status:
    | 'مسجلة'
    | 'مؤهلة'
    | 'قيد المنافسة'
    | 'مكتملة'
    | 'فائزة بالمركز الأول 🥇'
    | 'فائزة بالمركز الثاني 🥈'
    | 'فائزة بالمركز الثالث 🥉'
    | 'مشاركة متميزة 🎖️';
  score: number;
  totalPossibleScore: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt?: string;
  answersCount?: { correct: number; total: number };
  teacherNotes?: string;
  awardedBadge?: string;
  rank?: number;
  userAnswers?: Record<string, number>;
  questionTimeSpent?: Record<string, number>;
}

export interface InteractiveChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  type:
    | 'quiz_battle'
    | 'speed_challenge'
    | 'science_olympiad'
    | 'logic_puzzle'
    | 'hackathon'
    | 'interactive_game';
  subject: string;
  targetGrades: GradeLevel[];
  targetSections?: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  timeLimitPerQuestionSeconds: number;
  totalPoints: number;
  rewardBadge: string;
  rewardPoints: number;
  iconName?: string;
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';
  createdByTeacherName?: string;
  createdByTeacherId?: string;
  questions: ChallengeQuestion[];
  participations: ChallengeParticipation[];
}

export interface AttendanceDispatchReport {
  date: string;
  gradeLevel: GradeLevel;
  section: string;
  subject: string;
  teacherName: string;
  teacherEmail: string;
  adminEmail: string;
  totalStudents: number;
  stats: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  studentDetails: Array<{
    id: string;
    name: string;
    section: string;
    status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }>;
  dispatchedAt: string;
}

export type PlatformIntegrationId =
  | 'newton'
  | 'google_classroom'
  | 'ms_teams'
  | 'madrasati'
  | 'rest_api'
  | 'webhook_notifications'
  | 'oneroster_export';

export interface PlatformIntegrationConfig {
  id: PlatformIntegrationId;
  name: string;
  provider: 'iraq_ministry' | 'google' | 'microsoft' | 'madrasati' | 'custom_api' | 'lti';
  description: string;
  iconName: string;
  colorTheme: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncTime: string;
  syncedRecordsCount: number;
  autoSyncEnabled: boolean;
  syncIntervalHours: number;
  authConfig: {
    schoolCode?: string;
    apiKey?: string;
    apiSecret?: string;
    tenantId?: string;
    clientId?: string;
    webhookUrl?: string;
    environment?: 'production' | 'staging' | 'sandbox';
    syncGrades?: boolean;
    syncAttendance?: boolean;
    syncStudents?: boolean;
    syncLectures?: boolean;
    autoPushDailyAttendance?: boolean;
  };
}

export interface IntegrationSyncLog {
  id: string;
  platformId: PlatformIntegrationId;
  platformName: string;
  timestamp: string;
  action: 'export_grades' | 'import_students' | 'sync_attendance' | 'sync_lectures' | 'webhook_dispatch' | 'health_check';
  status: 'success' | 'warning' | 'error';
  recordsCount: number;
  details: string;
}

export interface IntegrationApiToken {
  id: string;
  title: string;
  token: string;
  scope: 'read_only' | 'grades_write' | 'attendance_dispatch' | 'full_access';
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

export interface IntegrationWebhook {
  id: string;
  name: string;
  targetUrl: string;
  secretKey: string;
  events: ('attendance.dispatched' | 'grades.published' | 'exam.created' | 'student.promoted')[];
  isEnabled: boolean;
  lastDispatchedAt?: string;
  deliverySuccessCount: number;
  deliveryFailureCount: number;
}

// ----------------------------------------------------
// System Audit Log & Administrative Activity Tracking
// ----------------------------------------------------
export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'auth'
  | 'status_change'
  | 'security'
  | 'grade_entry'
  | 'attendance_entry'
  | 'certificate_issue'
  | 'disciplinary_action'
  | 'backup_restore'
  | 'settings_change'
  | 'export_data'
  | 'import_data'
  | 'message_broadcast';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'danger';

export type AuditTargetCategory =
  | 'users'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'attendance'
  | 'grades'
  | 'exams'
  | 'certificates'
  | 'finances'
  | 'disciplinary'
  | 'system'
  | 'security'
  | 'library'
  | 'announcements';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "إضافة طالبة جديدة"
  actionType: AuditActionType;
  targetCategory: AuditTargetCategory;
  targetId?: string;
  targetName?: string;
  details: string; // Human-readable details
  ipAddress?: string; // e.g. "192.168.1.104"
  deviceInfo?: string; // e.g. "لوحة تحكم الإدارة (الويب)"
  severity: AuditSeverity;
  previousValue?: string;
  newValue?: string;
}

// ----------------------------------------------------
// Annual Curriculum Plans & Daily Lesson Preparation
// نظام إعداد الخطة السنوية والخطة اليومية لثانوية المتميزات
// ----------------------------------------------------

export interface AnnualWeekPlan {
  id: string;
  weekNumber: number; // 1, 2, 3, 4, etc.
  unitOrChapter: string; // e.g. "الفصل الأول: الأعداد المركبة"
  topics: string; // المفردات والمواضيع المنهجية
  periodsCount: number; // عدد الحصص المقررة
  labOrPractical?: string; // التجارب المختبرية والتطبيقات العملية
  notesOrActivities?: string; // الأنشطة الإثرائية والملاحظات
  isCompleted?: boolean; // تم إنجاز الخطة لهذا الأسبوع
  completedAt?: string;
}

export interface AnnualMonthPlan {
  id: string;
  monthName: string; // e.g. "تشرين الأول", "تشرين الثاني", "كانون الأول", "كانون الثاني", "شباط", "آذار", "نيسان", "أيار"
  weeks: AnnualWeekPlan[];
}

export interface AnnualSemesterPlan {
  id: string;
  semesterName: 'الفصل الدراسي الأول' | 'الفصل الدراسي الثاني';
  months: AnnualMonthPlan[];
}

export interface AnnualPlan {
  id: string;
  academicYear: string; // e.g. "2026 - 2027"
  subject: string;
  gradeLevel: GradeLevel;
  teacherId: string;
  teacherName: string;
  weeklyPeriodsCount: number; // عدد الحصص الأسبوعية المقررة للمادة
  generalObjectives: string[]; // الأهداف العامة السنوية للمادة
  giftedEnrichmentGoals: string[]; // أهداف رعاية الموهوبات والتفكير الإبداعي
  teachingMethods: string[]; // طرائق واستراتيجيات التدريس السنوية
  requiredAidsAndLabs: string[]; // الوسائل التعليمية والمختبرات
  assessmentStrategy: string[]; // أساليب التقويم والامتحانات الدورية
  semesters: AnnualSemesterPlan[]; // الفصل الدراسي الأول والثاني
  status: 'draft' | 'submitted' | 'approved' | 'returned';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  supervisorNotes?: string;
  supervisorName?: string;
  supervisorSignedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLessonPlan {
  id: string;
  annualPlanId?: string; // ربط مع الخطة السنوية
  annualWeekId?: string; // ربط مع أسبوع محدد في الخطة السنوية
  subject: string;
  gradeLevel: GradeLevel;
  section: Section | 'all';
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس
  periodNumber: number; // 1, 2, 3, 4, 5, 6
  unitOrChapter: string; // الوحدة / الفصل
  lessonTitle: string; // موضوع وعنوان الدرس
  textbookPages?: string; // أرقام الصفحات بالكتاب المنهجي
  
  // الأهداف السلوكية الإجرائية (ثلاثية الأبعاد)
  behavioralObjectives: {
    cognitive: string[]; // الأهداف المعرفية (أن تذكر، أن تحلل، أن تستنتج...)
    skill: string[];     // الأهداف المهارية (أن ترسم، أن تجري تجربة، أن تبرمج...)
    affective: string[]; // الأهداف الوجدانية (أن تقدر، أن تعتز، أن تبدي اهتماماً...)
  };

  priorKnowledgeHook: string; // التهيئة والتمهيد وربط الدرس بالمعارف السابقة
  
  teachingStrategies: string[]; // استراتيجيات التدريس: العصف الذهني، الاستقصاء، التعلم التعاوني، حل المشكلات...
  teachingAidsAndTools: string[]; // الوسائل التعليمية والتقنيات والمختبرات
  
  // سير وتنفيذ الدرس (الجدول الزمني للحصة 45 دقيقة)
  lessonSteps: {
    warmup: string;        // التهيئة وجذب الانتباه (5 دقائق)
    presentation: string;  // العرض والأنشطة التفاعلية والشرح (25 دقيقة)
    practicalApplication: string; // التطبيق العملي والمشاركة الصفية للمتميزات (10 دقائق)
    conclusion: string;    // الغلق وتلخيص الأفكار الرئيسية (5 دقائق)
  };

  formativeEvaluation: string[]; // التقويم التكويني والأسئلة الصفية
  homeworkAndEnrichment: string; // الواجب البيتي والتكليف الإثرائي لرعاية الموهبة
  teacherReflection?: string; // التأمل الذاتي للمعلمة بعد الحصة
  
  status: 'draft' | 'prepared' | 'completed' | 'reviewed';
  supervisorNotes?: string;
  supervisorName?: string;
  principalNotes?: string;
  principalName?: string;
  reviewedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// OFFICIAL EXAM SCHEDULES & EXAM PERIODS
// جداول الامتحانات الرسمية (الفصل الأول، نصف السنة، الفصل الثاني، النهائية، الدور الثاني)
// ─────────────────────────────────────────────────────────────

export type ExamTermType =
  | 'first_term'     // امتحانات الفصل الأول
  | 'mid_year'       // امتحانات نصف السنة
  | 'second_term'    // امتحانات الفصل الثاني
  | 'final_round_1'  // الامتحانات النهائية (الدور الأول)
  | 'final_round_2'; // الامتحانات النهائية الدور الثاني

export interface ExamTermOption {
  type: ExamTermType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const EXAM_TERM_OPTIONS: ExamTermOption[] = [
  {
    type: 'first_term',
    label: 'امتحانات الفصل الأول',
    shortLabel: 'الفصل الأول',
    description: 'جدول امتحانات نهاية الفصل الدراسي الأول لتقييم المخرجات المعرفية التراكمية',
    icon: '📘',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
  },
  {
    type: 'mid_year',
    label: 'امتحانات نصف السنة',
    shortLabel: 'نصف السنة',
    description: 'جدول الامتحانات الرسمية لنصف السنة الوزارية والمدرسية لكافة الصفوف والمراحل',
    icon: '❄️',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    type: 'second_term',
    label: 'امتحانات الفصل الثاني',
    shortLabel: 'الفصل الثاني',
    description: 'جدول امتحانات نهاية الفصل الدراسي الثاني وتحديد السعي السنوي المؤهل',
    icon: '📗',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    type: 'final_round_1',
    label: 'الامتحانات النهائية (الدور الأول)',
    shortLabel: 'النهائية - الدور الأول',
    description: 'جدول الامتحانات المدرسية والوزارية النهائية للعام الدراسي الدور الأول',
    icon: '🎓',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  {
    type: 'final_round_2',
    label: 'الامتحانات النهائية الدور الثاني',
    shortLabel: 'النهائية - الدور الثاني',
    description: 'جدول امتحانات الدور الثاني للطلبة المؤجلين والمكملين حسب القرارات الوزارية',
    icon: '🔄',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
  },
];

export interface ExamScheduleSlot {
  id: string;
  dayName: string; // السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس
  date: string; // YYYY-MM-DD
  time: string; // 08:30 ص - 11:00 ص
  subject: string; // اسم المادة: الرياضيات، الفيزياء، الكيمياء، ...
  gradeLevel: GradeLevel | 'all'; // الصف المخصص أو كافة الصفوف
  hallOrRoom?: string; // القاعة الامتحانية (مثلاً: القاعة المركزية، قاعة الخوارزمي)
  notes?: string; // ملاحظات وتنبيهات (إحضار الأدوات الهندسية، الآلة الحاسبة غير المبرمجة)
  proctors?: string[]; // المراقبون والمراقبات
}

export interface ExamSchedule {
  id: string;
  title: string; // مثلاً: جدول امتحانات نصف السنة للعام الدراسي 2026 - 2027
  termType: ExamTermType; // فصل أول، نصف سنة، فصل ثاني، نهائية، نهائية دور ثانٍ
  gradeLevels: GradeLevel[]; // الصفوف المشمولة بالجدول
  academicYear: string; // 2026 - 2027
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dailyStartTime: string; // وقت بدء الامتحان، مثلاً: 08:30 صباحاً
  examDuration: string; // مدة الامتحان، مثلاً: ساعتان ونصف (150 دقيقة)
  slots: ExamScheduleSlot[];
  instructions: string[]; // التعليمات والضوابط الامتحانية الرسمية للطالبات
  committeeHead: string; // رئيس اللجنة الامتحانية (المديرة: أ. دلال محمد عبد الحسين أو الهام صبيح سعدون)
  committeeMembers?: string[]; // أعضاء اللجنة الامتحانية
  notes?: string; // توجيهات إدارية
  status: 'معتمد ومُعلن' | 'مسودة' | 'مؤرشف';
  isPublished: boolean; // منشور للطالبات وأولياء الأمور
  publishedAt?: string;
  createdBy: string; // المنشئ (المديرة / الإدارة)
  createdRole: 'admin' | 'principal';
  createdAt: string;
  updatedAt: string;
}




