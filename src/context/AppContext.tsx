/**
 * Central State Management & Persistence for Maysan High School for Gifted Girls
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { assertUniqueIdentity, stableUsername, type IdentityRecord } from '../utils/identityPolicy';
import { centralSyncService, SCHOOL_ADMIN_DATA_SYNC_KEY } from '../services/syncService';
import { publishPublicSchoolInfo, publishPublicNews, publishPublicGallery, initializePublicSchoolInfoFromAuthoritative, initializePublicFacultyFromAuthoritative, initializePublicHonorBoardFromAuthoritative, publishPublicFaculty, publishPublicHonorBoard } from '../services/publicHomepageService';
import { buildPublicHonorBoard, HONOR_ROLL_DEMO_NAMES } from '../utils/publicHomepageFacultyHonor';
import { schoolAdminPatchTouchesPublicHomepage } from '../utils/publicHomepageProjection';
import { planCollectionPersistence } from '../utils/explicitPersistence';
import { buildTimetableAcademicSnapshot, timetableAcademicSnapshotEquals } from '../utils/timetableSettings';
import {
  activePersistenceWriteCount,
  admitAuthenticatedLogout,
  applyCanonicalGuestMemoryPurge,
  armLogoutUnloadBypass,
  createSessionAdmissionGate,
  endActivePersistenceWrite,
  shouldWarnOnBeforeUnload,
  tryBeginPersistenceWrite,
} from '../utils/sessionUnloadSafety';
import {
  canRunParentStudentSelfHeal,
  decideParentStudentSelfHealRun,
  EMPTY_PARENT_SELF_HEAL_GUARD,
  nextParentStudentSelfHealGuard,
  parentStudentSelfHealUpdatesSignature,
  planParentStudentSelfHeal,
  type ParentSelfHealGuardState,
} from '../utils/parentStudentLink';
import { FirebaseAuthService } from '../services/firebaseAuthService';
import {
  UserRole,
  Language,
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
  SubjectGrade,
  IssueCertificatesOptions,
  MinistryDecisionSettings, DisciplinarySettings,
  CalendarEvent,
  ColorThemeId,
  CurrentUser,
  getSubjectsForGrade,
  SchoolAdminData,
  GraduateStudent,
  getNextGradeLevel,
  UserCustomFolder,
  DisciplinaryDecision,
  InteractiveChallenge,
  ChallengeQuestion,
  ChallengeParticipation,
  GradeLevel,
  StudentShieldBadge,
  AuditLogEntry,
  AuditActionType,
  AuditSeverity,
  AuditTargetCategory,
  AnnualPlan,
  DailyLessonPlan,
  ExamSchedule,
  ExamScheduleSlot,
  ExamTermType,
} from '../types';
import type {
  AcademicEnrollment,
  AccelerationAttempt,
  AccelerationPolicy,
} from '../types/academicHistory';
import {
  executeStudentAccelerationPromotion as executeStudentAccelerationPromotionTx,
  executeStudentRegularPromotion as executeStudentRegularPromotionTx,
  executeStudentRepeatYear as executeStudentRepeatYearTx,
  type AcademicTransitionResult,
} from '../services/academicTransactionsService';
import { assertPolicyDeletable } from '../services/accelerationService';
import {
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_PARENTS,
  INITIAL_EXAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MESSAGES,
  INITIAL_TIMETABLE,
  INITIAL_SUBJECT_QUOTAS,
  INITIAL_FINANCIAL,
  INITIAL_NOTIFICATIONS,
  INITIAL_CERTIFICATES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_SCHOOL_ADMIN_DATA,
  INITIAL_GRADUATES,
  INITIAL_SUPERVISORS,
} from '../data/initialData';
import { INITIAL_AUDIT_LOGS } from '../data/initialAuditLogs';
import { canManageLibraryResource, applyManagedLibraryResourceUpdate } from '../utils/libraryResourceAccess';
import {
  clearLibraryResourceSuppression,
  filterRuntimeLibraryResources,
  hydrateLibraryDeletionGuard,
  isLibraryResourceSuppressed,
  suppressLibraryResourceId,
} from '../utils/libraryDeletionGuard';
import { deleteLibraryFile } from '../services/storageService';
import { INITIAL_CHALLENGES } from '../data/challengesData';
import { DEFAULT_ANNUAL_PLANS, DEFAULT_DAILY_LESSON_PLANS } from '../data/initialCurriculumPlans';
import { INITIAL_EXAM_SCHEDULES } from '../data/initialExamSchedules';
import { translations } from '../translations/i18n';
import { saveStoredFile, getStoredFile, deleteStoredFile } from '../utils/fileStorage';
import {
  MAILBOX_PENDING_RECONCILE_MS,
  clearAllMailboxReconciliationTimers,
  clearMailboxReconciliationTimer,
  createPendingMailboxOperation,
  isStaleMailboxReconciliation,
  mergeMessageUserStatesWithPending,
  mergePendingDirectMessages,
  reconcileMailboxOperationFromDirectRead,
  settlePendingDirectMessages,
  shouldApplyRemoteMessages,
  shouldStartMailboxReconciliation,
  type PendingMailboxOperation,
} from '../utils/messageSyncIsolation';
import {
  getNotificationActorStateKey,
  notificationHasAuthUidTargeting,
  notificationVisibleToAuthUid,
  prepareNotificationAuthIdentity,
  type NotificationIdentityCatalog,
} from '../utils/notificationIdentity';
import {
  applyIsolatedNotificationState,
  mergeNotificationUserStateMaps,
  type IsolatedNotificationUserState,
} from '../utils/notificationUserState';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  completeAuthenticatedLogout: () => Promise<void>;
  lang: Language;
  setLang: (lang: Language) => void;
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  t: typeof translations.ar;
  
  teachers: Teacher[];
  students: Student[];
  parents: Parent[];
  supervisors: EducationalSupervisor[];
  graduates: GraduateStudent[];
  addGraduate: (grad: Omit<GraduateStudent, 'id'>) => void;
  updateGraduate: (id: string, updated: Partial<GraduateStudent>) => Promise<boolean>;
  deleteGraduate: (id: string) => void;
  promoteStudents: (options: {
    academicYearFrom?: string;
    academicYearTo?: string;
    overrides?: Record<string, 'pass' | 'fail'>;
    autoAddGraduatesToHome?: boolean;
  }) => Promise<{ promotedCount: number; graduatedCount: number; retainedCount: number }>;
  exams: Exam[];
  submissions: ExamSubmission[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  messages: DirectMessage[];
  lectures: LectureResource[];
  timetable: TimetableSlot[];
  financial: FinancialRecord[];
  notifications: NotificationItem[];
  certificates: StudentCertificate[];
  academicEnrollments: AcademicEnrollment[];
  accelerationPolicies: AccelerationPolicy[];
  accelerationAttempts: AccelerationAttempt[];
  executeStudentRepeatYear: (input: { studentId: string; actorId?: string }) => Promise<AcademicTransitionResult>;
  executeStudentRegularPromotion: (input: {
    studentId: string;
    actorId?: string;
    isSecondRound?: boolean;
  }) => Promise<AcademicTransitionResult>;
  executeStudentAccelerationPromotion: (input: {
    studentId: string;
    attemptId: string;
    actorId?: string;
  }) => Promise<AcademicTransitionResult>;
  upsertAccelerationPolicy: (policy: AccelerationPolicy) => Promise<boolean>;
  deleteAccelerationPolicy: (policyId: string) => Promise<boolean>;
  upsertAccelerationAttempt: (attempt: AccelerationAttempt) => Promise<boolean>;
  calendarEvents: CalendarEvent[];
  schoolAdminData: SchoolAdminData;
  updateSchoolAdminData: (updated: Partial<SchoolAdminData>) => Promise<boolean>;
  persistPublicHomepageNews: (list: unknown) => Promise<boolean>;
  persistPublicHomepageGallery: (list: unknown) => Promise<boolean>;

  // Calendar Event Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<boolean>;
  updateCalendarEvent: (id: string, updated: Partial<CalendarEvent>) => Promise<boolean>;
  deleteCalendarEvent: (id: string) => Promise<boolean>;

  // Certificates & Grade Management Actions
  decisionSettings: MinistryDecisionSettings;
  disciplinarySettings: DisciplinarySettings;
  updateDisciplinarySettings: (updated: Partial<DisciplinarySettings>) => void;
  updateDecisionSettings: (updated: Partial<MinistryDecisionSettings>) => void;
  applySubjectDecisionMarks: (certificateId: string, subjectId: string, decisionMarks: number) => void;
  autoOptimizeDecisionMarksForCert: (certificateId: string) => void;
  resetDecisionMarksForCert: (certificateId: string) => void;
  updateCertificate: (id: string, updated: Partial<StudentCertificate>, persist?: boolean) => void;
  updateSubjectGrade: (certificateId: string, subjectId: string, updated: Partial<SubjectGrade>) => void;
  batchUpdateStudentGrades: (certificateId: string, updatedSubjects: SubjectGrade[]) => Promise<boolean>;
  commitCertificate: (certificateId: string) => Promise<boolean>;
  recalculateCertificate: (certificateId: string) => void;
  addStudentCertificate: (studentId: string, isBlank?: boolean) => Promise<boolean>;
  issueCertificatesForScope: (options: IssueCertificatesOptions) => Promise<{ totalGenerated: number; skippedCount: number; message: string }>;
  deleteCertificate: (id: string) => Promise<boolean>;
  deleteMultipleCertificates: (ids: string[]) => Promise<boolean>;
  deleteCertificatesForScope: (options: {
    scope: 'all' | 'grade' | 'section' | 'student';
    gradeLevel?: GradeLevel;
    section?: string;
    studentId?: string;
  }) => Promise<{ deletedCount: number; message: string }>;
  clearAllCertificates: () => Promise<boolean>;
  
  userPasscodes: Record<string, string>;
  getUserPasscode: (userKey: string, fallbackRole?: UserRole) => string;
  adminUpdateUserPasscode: (
    userKey: string,
    newPasscode: string,
    options?: {
      userName?: string;
      userRole?: UserRole;
      userIdentifier?: string;
      sendNotification?: boolean;
    }
  ) => { success: boolean; message: string };
  adminResetUserPasscode: (
    userKey: string,
    defaultPasscode?: string,
    options?: { userName?: string; userRole?: UserRole; userIdentifier?: string }
  ) => { success: boolean; message: string };
  changePassword: (
    targetRole: UserRole,
    oldPass: string,
    newPass: string,
    options?: { targetUserId?: string; accountName?: string; userKey?: string }
  ) => { success: boolean; message: string };
  resetPassword: (
    targetRole: UserRole,
    newPass: string,
    contactInfo?: string,
    options?: { targetUserId?: string; accountName?: string; userKey?: string }
  ) => { success: boolean; message: string };

  // User Management Actions (Edit, Delete, Ban/Restrict)
  updateTeacher: (id: string, updated: Partial<Teacher>) => Promise<boolean>;
  deleteTeacher: (id: string) => Promise<boolean>;
  updateStudent: (id: string, updated: Partial<Student>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  updateParent: (id: string, updated: Partial<Parent>) => void;
  deleteParent: (id: string) => void;
  addSupervisor: (supervisor: Omit<EducationalSupervisor, 'id' | 'joinedDate'> & { joinedDate?: string }) => void;
  updateSupervisor: (id: string, updated: Partial<EducationalSupervisor>) => void;
  deleteSupervisor: (id: string) => void;
  setPrimarySupervisor: (id: string) => void;
  
  // Student ID Card & Shields Actions
  addShieldToStudent: (studentId: string, shield: Omit<StudentShieldBadge, 'id'>) => void;
  removeShieldFromStudent: (studentId: string, shieldId: string) => void;
  updateStudentBadges: (studentId: string, badges: string[]) => void;
  
  // Financial Management Actions
  updateFinancialRecord: (id: string, updated: Partial<FinancialRecord>) => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  deleteFinancialRecord: (id: string) => void;

  // Timetable Actions
  updateTimetableSlot: (id: string, updated: Partial<TimetableSlot>) => Promise<boolean>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<boolean>;
  deleteTimetableSlot: (id: string) => Promise<boolean>;
  saveFullTimetable: (slots: TimetableSlot[]) => Promise<boolean>;

  // Grade Subject Quotas Actions
  subjectQuotas: GradeSubjectQuota[];
  updateSubjectQuota: (id: string, updated: Partial<GradeSubjectQuota>) => Promise<boolean>;
  addSubjectQuota: (quota: Omit<GradeSubjectQuota, 'id'>) => Promise<boolean>;
  deleteSubjectQuota: (id: string) => Promise<boolean>;
  saveSubjectQuotas: (quotas: GradeSubjectQuota[]) => Promise<boolean>;

  // Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'status' | 'joinedDate'>) => Promise<boolean>;
  addStudent: (student: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => Promise<boolean>;
  createExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, updated: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  duplicateExam: (id: string) => void;
  toggleExamStatus: (id: string, status: Exam['status']) => void;
  submitExam: (submission: Omit<ExamSubmission, 'id' | 'submittedAt'>) => void;
  updateSubmission: (id: string, updated: Partial<ExamSubmission>) => void;
  regradeSubmission: (submissionId: string) => void;
  regradeAllExamSubmissions: (examId: string) => void;
  deleteSubmission: (submissionId: string) => void;
  logAttendance: (records: Omit<AttendanceRecord, 'id'>[], meta?: { teacherEmail?: string; teacherName?: string; teacherId?: string }) => void;
  updateAttendanceRecord: (id: string, updated: Partial<AttendanceRecord>, notifyParent?: boolean) => void;
  batchUpdateAttendanceRecords: (updates: Array<{ id: string; status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'; notes?: string; reasonForModification?: string }>, notifyParent?: boolean) => void;
  deleteAttendanceRecord: (id: string) => void;
  deleteAttendanceRecordsForSession: (date: string, gradeLevel: GradeLevel, section: string, subject?: string) => void;
  recalculateStudentAbsenceStats: (studentId?: string) => void;
  canUndoAttendance: (record: AttendanceRecord) => boolean;
  undoAccidentalAbsence: (
    recordId: string,
    options?: { reason?: string; deleteRecordInstead?: boolean; notifyParent?: boolean; undoneBy?: string }
  ) => Promise<{ success: boolean; message: string }>;
  batchUndoAccidentalAbsences: (recordIds: string[], reason?: string) => Promise<{ successCount: number; message: string }>;
  undoStudentAbsenceDays: (
    studentId: string,
    daysToUndo: number,
    lessonsToUndo?: number,
    reason?: string,
    notifyParent?: boolean
  ) => void;
  sendAnnouncement: (anc: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => void;
  sendMessage: (msg: Omit<DirectMessage, 'id' | 'timestamp' | 'isRead'> & { id?: string }) => void;
  updateMessage: (updatedMsg: DirectMessage) => void;
  saveDraft: (draft: Partial<DirectMessage> & { subject: string; content: string }) => void;
  moveToSpam: (id: string, userId?: string) => void;
  restoreFromSpam: (id: string, userId?: string) => void;
  moveToTrash: (id: string, userId?: string) => void;
  restoreFromTrash: (id: string, userId?: string) => void;
  archiveMessage: (id: string, userId?: string) => void;
  restoreFromArchive: (id: string, userId?: string) => void;
  moveToCustomFolder: (id: string, folderId: string, userId?: string) => void;
  customFolders: UserCustomFolder[];
  addCustomFolder: (folder: Omit<UserCustomFolder, 'id'>) => void;
  deleteCustomFolder: (folderId: string) => void;
  deleteMessage: (id: string, userId?: string) => void;
  markMessageRead: (id: string, userId?: string) => void;
  toggleStarMessage: (id: string, userId?: string) => void;
  emptySpamFolder: (userId?: string) => void;
  emptyTrashFolder: (userId?: string) => void;
  addLecture: (lec: Omit<LectureResource, 'id' | 'uploadedAt'>, options?: { resourceId?: string }) => Promise<LectureResource>;
  deleteLecture: (id: string) => Promise<boolean>;
  updateLecture: (id: string, data: Partial<LectureResource>) => Promise<boolean>;
  recordLectureDownload: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }) => Promise<boolean>;
  deleteNotification: (id: string, explicitUserId?: string) => void;
  updateNotification: (
    id: string,
    updates: { title?: string; message?: string; type?: 'info' | 'warning' | 'success' | 'alert' | 'security' },
    scope?: 'user' | 'global',
    explicitUserId?: string
  ) => void;
  markNotificationRead: (id: string, explicitUserId?: string) => void;
  toggleNotificationRead: (id: string, explicitUserId?: string) => void;
  markAllNotificationsRead: (userId?: string) => void;
  clearAllUserNotifications: (userId?: string) => void;
  getUserNotifications: (overrideRole?: UserRole, overrideUser?: CurrentUser | null) => NotificationItem[];
  addDisciplinaryDecision: (decision: Omit<DisciplinaryDecision, 'id' | 'issueDate'> & { id?: string; issueDate?: string }) => void;
  revokeDisciplinaryDecision: (decisionId: string, studentId: string, reason?: string) => void;
  deleteDisciplinaryDecision: (decisionId: string, studentId: string) => void;
  updateDisciplinaryDecision: (decisionId: string, studentId: string, updates: Partial<DisciplinaryDecision>) => void;
  revertAbsenceJustification: (decisionId: string, studentId: string, daysToRevert?: number, reason?: string) => void;
  justifyAbsence: (studentId: string, excusedDays: number, notes: string, attachmentUrl?: string, attachmentName?: string, justifiedDates?: string[]) => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
  
  // Active exam taking state
  activeTakingExam: Exam | null;
  setActiveTakingExam: (exam: Exam | null) => void;

  // Interactive Games, Challenges & Competitions
  challenges: InteractiveChallenge[];
  canUserManageChallenge: (challenge: InteractiveChallenge) => boolean;
  addChallenge: (challenge: Omit<InteractiveChallenge, 'id'>) => Promise<boolean>;
  updateChallenge: (id: string, updated: Partial<InteractiveChallenge>) => Promise<boolean>;
  deleteChallenge: (id: string) => Promise<boolean>;
  addQuestionToChallenge: (challengeId: string, question: Omit<ChallengeQuestion, 'id'>) => void;
  updateQuestionInChallenge: (challengeId: string, questionId: string, question: Partial<ChallengeQuestion>) => void;
  deleteQuestionFromChallenge: (challengeId: string, questionId: string) => void;
  submitChallengeAttempt: (
    challengeId: string,
    studentId: string,
    studentName: string,
    gradeLevel: GradeLevel,
    section: string,
    score: number,
    timeSpentSeconds: number,
    answersCount: { correct: number; total: number },
    userAnswers?: Record<string, number>,
    questionTimeSpent?: Record<string, number>
  ) => void;
  updateParticipationStatus: (
    challengeId: string,
    participationId: string,
    updates: Partial<ChallengeParticipation>
  ) => void;
  registerStudentForChallenge: (
    challengeId: string,
    studentId: string,
    studentName: string,
    gradeLevel: GradeLevel,
    section: string
  ) => void;
  deleteParticipation: (challengeId: string, participationId: string) => void;

  // Administrative Audit Log & Security Activity Tracking
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: {
    id?: string;
    timestamp?: string;
    userId?: string;
    userName?: string;
    userRole?: UserRole;
    action: string;
    actionType: AuditActionType;
    targetCategory: AuditTargetCategory;
    targetId?: string;
    targetName?: string;
    details?: string;
    ipAddress?: string;
    deviceInfo?: string;
    severity?: AuditSeverity;
    previousValue?: string;
    newValue?: string;
  }) => void;
  deleteAuditLog: (id: string) => void;
  clearAuditLogs: () => void;
  exportAuditLogsJSON: () => void;
  exportAuditLogsCSV: () => void;

  // Annual Curriculum Plans & Daily Lesson Preparation (الخطط السنوية واليومية)
  annualPlans: AnnualPlan[];
  dailyLessonPlans: DailyLessonPlan[];
  addAnnualPlan: (plan: Omit<AnnualPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AnnualPlan>;
  updateAnnualPlan: (id: string, updated: Partial<AnnualPlan>) => Promise<boolean>;
  deleteAnnualPlan: (id: string) => Promise<boolean>;
  duplicateAnnualPlan: (id: string) => void;
  toggleAnnualTopicCompletion: (planId: string, semesterId: string, monthId: string, weekId: string) => void;
  approveAnnualPlan: (id: string, notes?: string, approverRole?: string, approverName?: string) => void;
  addDailyLessonPlan: (plan: Omit<DailyLessonPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DailyLessonPlan>;
  updateDailyLessonPlan: (id: string, updated: Partial<DailyLessonPlan>) => Promise<boolean>;
  deleteDailyLessonPlan: (id: string) => Promise<boolean>;
  duplicateDailyLessonPlan: (id: string) => void;
  approveDailyLessonPlan: (id: string, notes?: string, reviewerRole?: string, reviewerName?: string) => void;

  // Official Exam Schedules (جداول الامتحانات الرسمية - صلاحيات المديرة والإدارة)
  examSchedules: ExamSchedule[];
  addExamSchedule: (schedule: Omit<ExamSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ExamSchedule>;
  updateExamSchedule: (id: string, updated: Partial<ExamSchedule>) => Promise<boolean>;
  deleteExamSchedule: (id: string) => Promise<boolean>;
  duplicateExamSchedule: (id: string) => void;
  toggleExamSchedulePublish: (id: string) => void;

  // Central Data Synchronization for all users (مزامنة البيانات المركزية لجميع المستخدمين)
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  syncVersion: number;
  lastSyncedAt: Date | null;
  lastSyncedBy: { id?: string; name?: string; role?: string } | null;
  syncLatencyMs: number;
  syncErrorMessage?: string;
  forceSyncAll: () => Promise<boolean>;
  resetCentralDatabase: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_PASSCODES: Record<UserRole, string> = {
  admin: '1234',
  teacher: '1234',
  student: '1234',
  parent: '1234',
  supervisor: '1234',
  guest: '',
};

const LEGACY_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LEGACY_AUTH === 'true';

const LOCAL_STORAGE_KEY = 'maysan_gifted_school_data_v1';

const getInitialStoredData = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse local storage data', e);
  }
  return null;
};


export const DEFAULT_DISCIPLINARY_SETTINGS: DisciplinarySettings = {
  firstWarningDays: 5,
  finalWarningDays: 10,
  expulsionDays: 15,
  lessonsPerAbsenceDay: 5
};
export const DEFAULT_MINISTRY_DECISION_SETTINGS: MinistryDecisionSettings = {
  maxDecisionMarks: 10,
  decisionScopeMode: 'total_pool',
  maxDecisionMarksPerSubject: 10,
  maxResitSubjects: 3,
  minPassingGrade: 50,
  autoApplyDecisionMarks: true,
};

// Helper to compute certificate metrics including Iraqi General & Individual Exemption & Ministry Decision Marks
export const computeCertificateStats = (
  cert: StudentCertificate,
  settings: MinistryDecisionSettings = DEFAULT_MINISTRY_DECISION_SETTINGS
): StudentCertificate => {
  if (!cert.subjects || cert.subjects.length === 0) return cert;

  // التحقق مما إذا كان النموذج فارغاً ومعداً للإدخال اليدوي
  const hasAnyGrades = cert.subjects.some(
    (s) =>
      (s.firstTermAvg !== undefined && s.firstTermAvg !== null && s.firstTermAvg > 0) ||
      (s.midYearGrade !== undefined && s.midYearGrade !== null && s.midYearGrade > 0) ||
      (s.secondTermAvg !== undefined && s.secondTermAvg !== null && s.secondTermAvg > 0) ||
      (s.finalExamGrade !== undefined && s.finalExamGrade !== null && s.finalExamGrade > 0)
  );

  if (!hasAnyGrades) {
    return {
      ...cert,
      subjects: cert.subjects.map((s) => ({
        ...s,
        annualSaeiAvg: 0,
        finalGrade: 0,
        postResitGrade: 0,
        isExempt: false,
        exemptionType: 'none',
        decisionMarks: 0,
      })),
      overallFirstTermAvg: 0,
      overallMidYearGrade: 0,
      overallSecondTermAvg: 0,
      overallAnnualSaeiAvg: 0,
      overallFinalExamGrade: 0,
      overallFinalGrade: 0,
      overallPostResitAvg: 0,
      status: cert.status === 'مؤجلة' ? 'مؤجلة' : cert.status || 'مؤجلة',
      originalStatus: 'مؤجلة',
      resitSubjectsCount: 0,
      exemptionType: 'none',
      exemptSubjectsCount: 0,
      decisionMarksUsed: 0,
      hasDecisionMarks: false,
      decisionNotes: '',
      appreciation: '-',
    };
  }

  const count = cert.subjects.length;
  const maxResit = settings.maxResitSubjects ?? 3;
  const passThreshold = settings.minPassingGrade ?? 50;
  const scopeMode = settings.decisionScopeMode ?? 'total_pool';
  const maxDecision = settings.maxDecisionMarks ?? 10;

  // 1. حساب معدل السعي السنوي لكل مادة
  const tempSubjects = cert.subjects.map((sub) => {
    const annualSaeiAvg = Math.round((sub.firstTermAvg + sub.midYearGrade + sub.secondTermAvg) / 3);
    return { ...sub, annualSaeiAvg };
  });

  const overallAnnualSaeiAvg = Number((tempSubjects.reduce((acc, s) => acc + s.annualSaeiAvg, 0) / count).toFixed(1));
  const minAnnualSaei = Math.min(...tempSubjects.map((s) => s.annualSaeiAvg));

  // شروط الإعفاء العام
  const isGeneralExemption = overallAnnualSaeiAvg >= 85 && minAnnualSaei >= 75;

  let exemptSubjectsCount = 0;

  const updatedSubjects = tempSubjects.map((sub) => {
    let isExempt = false;
    let exemptionType: 'general' | 'individual' | 'none' = 'none';
    const rawFinalGrade = Math.round((sub.annualSaeiAvg + sub.finalExamGrade) / 2);

    if (isGeneralExemption) {
      isExempt = true;
      exemptionType = 'general';
      exemptSubjectsCount++;
    } else if (sub.annualSaeiAvg >= 90) {
      isExempt = true;
      exemptionType = 'individual';
      exemptSubjectsCount++;
    }

    const baseFinalGrade = isExempt ? sub.annualSaeiAvg : rawFinalGrade;
    const decisionMarks = Math.max(0, sub.decisionMarks || 0);
    const finalGrade = Math.min(100, baseFinalGrade + decisionMarks);

    const postResitGrade =
      sub.resitGrade !== undefined && sub.resitGrade !== null
        ? Math.min(100, Math.round((sub.annualSaeiAvg + sub.resitGrade) / 2) + decisionMarks)
        : finalGrade;

    return {
      ...sub,
      annualSaeiAvg: sub.annualSaeiAvg,
      finalGrade,
      postResitGrade,
      isExempt,
      exemptionType,
      decisionMarks,
    };
  });

  // حساب الحالة الأصلية قبل قرار المساعدة
  const failedFirstRoundRaw = updatedSubjects.filter((s) => {
    const raw = s.isExempt ? s.annualSaeiAvg : Math.round((s.annualSaeiAvg + s.finalExamGrade) / 2);
    return raw < passThreshold;
  });

  let originalStatus: StudentCertificate['status'] = 'ناجحة';
  if (failedFirstRoundRaw.length === 0) {
    originalStatus = 'ناجحة';
  } else if (failedFirstRoundRaw.length <= maxResit) {
    originalStatus = 'مكملة';
  } else {
    originalStatus = 'راسبة';
  }

  // حساب الحالة الفعلية بعد تطبيق درجات القرار
  const failedFirstRoundEffective = updatedSubjects.filter((s) => s.finalGrade < passThreshold);
  const failedSecondRoundEffective = updatedSubjects.filter((s) => (s.postResitGrade ?? s.finalGrade) < passThreshold);

  let status: StudentCertificate['status'] = 'ناجحة';
  let resitSubjectsCount = 0;

  if (failedFirstRoundEffective.length === 0) {
    status = 'ناجحة';
  } else if (failedFirstRoundEffective.length <= maxResit) {
    resitSubjectsCount = failedFirstRoundEffective.length;
    if (failedSecondRoundEffective.length === 0 && updatedSubjects.some((s) => s.resitGrade !== undefined && s.resitGrade !== null)) {
      status = 'ناجحة بالدور الثاني';
    } else {
      status = 'مكملة';
    }
  } else {
    status = 'راسبة';
  }

  const overallFirstTermAvg = Number((updatedSubjects.reduce((acc, s) => acc + s.firstTermAvg, 0) / count).toFixed(1));
  const overallMidYearGrade = Number((updatedSubjects.reduce((acc, s) => acc + s.midYearGrade, 0) / count).toFixed(1));
  const overallSecondTermAvg = Number((updatedSubjects.reduce((acc, s) => acc + s.secondTermAvg, 0) / count).toFixed(1));
  const overallFinalExamGrade = Number((updatedSubjects.reduce((acc, s) => acc + (s.isExempt ? s.annualSaeiAvg : s.finalExamGrade), 0) / count).toFixed(1));
  const overallFinalGrade = Number((updatedSubjects.reduce((acc, s) => acc + s.finalGrade, 0) / count).toFixed(1));
  const overallPostResitAvg = Number(
    (updatedSubjects.reduce((acc, s) => acc + (s.postResitGrade ?? s.finalGrade), 0) / count).toFixed(1)
  );

  const certExemptionType: 'general' | 'individual' | 'none' = isGeneralExemption
    ? 'general'
    : exemptSubjectsCount > 0
    ? 'individual'
    : 'none';

  const decisionMarksUsed = updatedSubjects.reduce((acc, s) => acc + (s.decisionMarks || 0), 0);
  const hasDecisionMarks = decisionMarksUsed > 0;

  let decisionNotes = '';
  if (hasDecisionMarks) {
    const scopeLabel = scopeMode === 'per_subject' ? 'لكل مادة' : `لكل المواد (رصيد ${maxDecision} درجات)`;
    if (originalStatus === 'راسبة' && status === 'مكملة') {
      decisionNotes = `تم إضافة (${decisionMarksUsed}) درجات قرار وزارية (${scopeLabel}) لرفع الدرجات الحافة، وتحولت حالة الطالبة من (راسبة) إلى (مكملة) بـ (${resitSubjectsCount}) دروس.`;
    } else if (originalStatus === 'مكملة' && status === 'ناجحة') {
      decisionNotes = `تم إضافة (${decisionMarksUsed}) درجات قرار وزارية (${scopeLabel}) للدروس المكملة، وتحولت حالة الطالبة من (مكملة) إلى (ناجحة).`;
    } else if (originalStatus === 'راسبة' && status === 'ناجحة') {
      decisionNotes = `تم إضافة (${decisionMarksUsed}) درجات قرار وزارية (${scopeLabel})، وتحولت حالة الطالبة من (راسبة) إلى (ناجحة).`;
    } else {
      decisionNotes = `تم إضافة (${decisionMarksUsed}) درجات قرار وزارية (${scopeLabel}) مساعدة للمواد الدراسية.`;
    }
  }

  const effectiveScore = overallPostResitAvg;
  let appreciation = '';
  if (status !== 'مكملة' && status !== 'راسبة' && !status.includes('مكمل')) {
    if (effectiveScore >= 90) appreciation = 'امتياز';
    else if (effectiveScore >= 80) appreciation = 'جيد جداً';
    else if (effectiveScore >= 70) appreciation = 'جيد';
    else if (effectiveScore >= 60) appreciation = 'متوسط';
    else if (effectiveScore >= 50) appreciation = 'مقبول';
    else appreciation = 'دون المستوى';
  }

  return {
    ...cert,
    subjects: updatedSubjects,
    overallFirstTermAvg,
    overallMidYearGrade,
    overallSecondTermAvg,
    overallAnnualSaeiAvg,
    overallFinalExamGrade,
    overallFinalGrade,
    overallPostResitAvg,
    status,
    originalStatus,
    resitSubjectsCount,
    exemptionType: certExemptionType,
    exemptSubjectsCount,
    decisionMarksUsed,
    hasDecisionMarks,
    decisionNotes,
    appreciation,
  };
};

// Automatic Optimizer for Iraqi Ministry Decision Marks
export const autoOptimizeDecisionMarks = (
  cert: StudentCertificate,
  settings: MinistryDecisionSettings = DEFAULT_MINISTRY_DECISION_SETTINGS
): StudentCertificate => {
  const maxDecision = settings.maxDecisionMarks ?? 10;
  const passThreshold = settings.minPassingGrade ?? 50;
  const scopeMode = settings.decisionScopeMode ?? 'total_pool';
  const maxPerSubject = settings.maxDecisionMarksPerSubject ?? (scopeMode === 'per_subject' ? maxDecision : 10);

  // Compute raw grades without decision marks
  const subjectsWithRaw = cert.subjects.map((s) => {
    const annualSaeiAvg = Math.round((s.firstTermAvg + s.midYearGrade + s.secondTermAvg) / 3);
    const isExempt = s.isExempt || s.annualSaeiAvg >= 90;
    const rawGrade = isExempt ? s.annualSaeiAvg : Math.round((annualSaeiAvg + s.finalExamGrade) / 2);
    return { ...s, rawGrade };
  });

  const failedSubjects = subjectsWithRaw.filter((s) => s.rawGrade < passThreshold);

  if (failedSubjects.length === 0) {
    return computeCertificateStats({
      ...cert,
      subjects: cert.subjects.map((s) => ({ ...s, decisionMarks: 0 })),
    }, settings);
  }

  // Calculate defect needed to reach pass threshold (50) for each failed subject
  const sortedFailed = failedSubjects
    .map((s) => ({
      ...s,
      defect: passThreshold - s.rawGrade,
    }))
    .sort((a, b) => a.defect - b.defect); // Smallest defect first (e.g. 48 needs 2, 46 needs 4)

  const allocatedMarksMap: Record<string, number> = {};

  if (scopeMode === 'per_subject') {
    // Mode: Per subject allocation up to maxDecision per subject
    for (const item of sortedFailed) {
      if (item.defect <= maxDecision && item.defect <= maxPerSubject) {
        allocatedMarksMap[item.id] = item.defect;
      }
    }
  } else {
    // Mode: Total pool allocation across all subjects combined
    let remainingDecisionMarks = maxDecision;

    for (const item of sortedFailed) {
      if (remainingDecisionMarks <= 0) break;
      if (item.defect <= remainingDecisionMarks && item.defect <= maxPerSubject) {
        allocatedMarksMap[item.id] = item.defect;
        remainingDecisionMarks -= item.defect;
      }
    }
  }

  const newSubjects = cert.subjects.map((s) => ({
    ...s,
    decisionMarks: allocatedMarksMap[s.id] || 0,
  }));

  return computeCertificateStats({ ...cert, subjects: newSubjects }, settings);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * SECURITY / VISITOR MODE
   * Every fresh page load (including a typed URL or QR scan) starts as an anonymous
   * visitor. Authentication is intentionally NOT restored from localStorage.
   * A role is assigned only after the login flow explicitly calls setCurrentUser().
   */
  const [role, setRoleState] = useState<UserRole>(() => 'guest' as UserRole);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    // Do not persist an authenticated role across page loads.
  };

  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);

  const setCurrentUser = (user: CurrentUser | null) => {
    setCurrentUserState(user);

    if (user) {
      // Authentication succeeded explicitly: derive the active role from the
      // authenticated account instead of trusting a previously cached role.
      setRoleState(user.role as UserRole);
    } else {
      // Logout / anonymous access always returns to Visitor mode.
      setRoleState('guest' as UserRole);
    }

    // Remove legacy persisted identity so old installations cannot auto-login.
    try {
      localStorage.removeItem('maysan_current_user_v1');
      localStorage.removeItem('maysan_current_role');
    } catch {
      // localStorage may be unavailable in privacy-restricted browsers.
    }
  };

  // TEMP_AUTH_RESTORE_SESSION_V1
  // Temporary test mode: restore only a Firebase-authenticated, claim-verified session.
  useEffect(() => {
    let cancelled = false;

    void FirebaseAuthService.restoreSession().then((restoredUser) => {
      if (!cancelled && restoredUser) {
        setCurrentUser(restoredUser);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // SECURITY_AUTH_LIVE_PROFILE_GUARD_V1
  // FORCE_LOGOUT_ON_ACCOUNT_BLOCK_V1
  // Live-watch the verified Firestore profile so a mid-session block/suspend
  // signs the user out without requiring a refresh. Admin is excluded.
  useEffect(() => {
    if (!currentUser?.authUid || currentUser.role === 'admin') return undefined;

    const unsubscribe = FirebaseAuthService.watchAuthenticatedProfileSession(currentUser, () => {
      setCurrentUser(null);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.authUid, currentUser?.role, currentUser?.profileId, currentUser?.profileCollection]);

  // One-time cleanup for browsers that still contain the old automatic-login keys.
  useEffect(() => {
    try {
      localStorage.removeItem('maysan_current_user_v1');
      localStorage.removeItem('maysan_current_role');
    } catch {
      // ignore storage access failures
    }
  }, []);

  const [lang, setLangState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('maysan_lang');
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      return savedLang as Language;
    }
    return 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('maysan_lang', newLang);
  };

  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    const saved = localStorage.getItem('maysan_color_theme');
    if (saved && ['sage', 'lavender', 'cream', 'sky', 'rose', 'classic', 'dark'].includes(saved)) {
      return saved as ColorThemeId;
    }
    const oldDark = localStorage.getItem('maysan_dark_mode');
    if (oldDark === 'true') return 'dark';
    return 'sage'; // Default to Sage & Mint Eye-Soothing theme
  });

  const isDarkMode = colorTheme === 'dark';

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme);
    localStorage.setItem('maysan_color_theme', theme);
  };

  const toggleDarkMode = () => {
    if (colorTheme === 'dark') {
      const prevLight = (localStorage.getItem('maysan_prev_light_theme') as ColorThemeId) || 'sage';
      setColorTheme(prevLight);
    } else {
      localStorage.setItem('maysan_prev_light_theme', colorTheme);
      setColorTheme('dark');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('maysan_color_theme', colorTheme);
    if (colorTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('maysan_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('maysan_dark_mode', 'false');
    }
  }, [colorTheme]);

  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);

  const initialStored = LEGACY_AUTH_ENABLED ? getInitialStoredData() : null;

  // User Security Passcodes (strictly per userKey/userId)
  const [userPasscodes, setUserPasscodes] = useState<Record<string, string>>(
    () => LEGACY_AUTH_ENABLED ? (initialStored?.userPasscodes || INITIAL_PASSCODES) : {}
  );

  // Check if a person/teacher name is excluded
  const isPersonBlacklisted = (name: string) => {
    if (!name) return false;
    // Exclude short name if without 'الوحيلي'
    if (name.includes('محمد نعمة كاظم كريدي') && !name.includes('الوحيلي')) {
      return true;
    }
    return (
      name.includes('زينب خضير') ||
      name.includes('خضير الحسيني') ||
      name.includes('سارة عباس') ||
      name.includes('السلامي') ||
      name.includes('هدى كاظم') ||
      name.includes('أمل جاسم')
    );
  };
  const isTeacherBlacklisted = isPersonBlacklisted;

  // Entities
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const stored = initialStored?.teachers;
    if (!stored || !Array.isArray(stored)) return [];

    // Keep only persisted teacher records; never inject bundled/default faculty.
    const legacyMockTeacherIds = ['tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5', 'tech-6', 'tech-7', 'tech-8', 'tech-9', 'tech-10', 'tech-11', 'tech-12', 'tech-13', 'tech-14'];
    const filtered = stored.filter((t) =>
      !legacyMockTeacherIds.includes(t.id) &&
      !/^tech-[a-z]+-\d+$/.test(t.id) &&
      !isTeacherBlacklisted(t.name)
    );

    const seenNames = new Set<string>();
    return filtered.filter((t) => {
      if (!t?.name || seenNames.has(t.name)) return false;
      seenNames.add(t.name);
      return true;
    });
  });
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = (initialStored?.students || INITIAL_STUDENTS).filter(
      (s) => !isPersonBlacklisted(s.name) && !isPersonBlacklisted(s.parentName)
    );
    return raw.map((s) => {
      const initialMatch = INITIAL_STUDENTS.find((st) => st.id === s.id);
      const badges = s.badges && s.badges.length > 0 ? s.badges : (initialMatch?.badges || []);
      const shieldsAndBadges =
        s.shieldsAndBadges && s.shieldsAndBadges.length > 0
          ? s.shieldsAndBadges
          : (initialMatch?.shieldsAndBadges || []);

      // Ensure any badge referencing 'تورنغ' has modern title '⚡ درع تورنغ للمبتكرات الرقمية'
      const updatedBadges = badges.map((b) =>
        b.includes('تورنغ') ? '⚡ درع تورنغ للمبتكرات الرقمية' : b
      );
      const updatedShields = shieldsAndBadges.map((sh) =>
        sh.title.includes('تورنغ') ? { ...sh, title: '⚡ درع تورنغ للمبتكرات الرقمية' } : sh
      );

      return {
        ...s,
        badges: updatedBadges,
        shieldsAndBadges: updatedShields,
      };
    });
  });
  const [parents, setParents] = useState<Parent[]>(() => {
    const raw = initialStored?.parents || INITIAL_PARENTS;
    return raw.filter((p) => !isPersonBlacklisted(p.name) && !isPersonBlacklisted(p.studentName));
  });
  const [supervisors, setSupervisors] = useState<EducationalSupervisor[]>(() => {
    const raw = initialStored?.supervisors && Array.isArray(initialStored.supervisors) && initialStored.supervisors.length > 0
      ? initialStored.supervisors
      : INITIAL_SUPERVISORS;
    return raw.filter((s: EducationalSupervisor) => !isPersonBlacklisted(s.name));
  });
  const [graduates, setGraduates] = useState<GraduateStudent[]>(() => {
    const raw = initialStored?.graduates || INITIAL_GRADUATES;
    return raw.filter((g) => !isPersonBlacklisted(g.name));
  });
  const teachersRef = useRef(teachers);
  const studentsRef = useRef(students);
  const graduatesRef = useRef(graduates);
  teachersRef.current = teachers;
  studentsRef.current = students;
  graduatesRef.current = graduates;
  const [exams, setExams] = useState<Exam[]>(
    () => initialStored?.exams || INITIAL_EXAMS
  );
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(
    () => initialStored?.submissions || INITIAL_SUBMISSIONS
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    () => initialStored?.attendance || INITIAL_ATTENDANCE
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    () => initialStored?.announcements || INITIAL_ANNOUNCEMENTS
  );
  const [messages, setMessages] = useState<DirectMessage[]>(
    () => initialStored?.messages || INITIAL_MESSAGES
  );
  const [customFolders, setCustomFolders] = useState<UserCustomFolder[]>(() => {
    return initialStored?.customFolders || [
      { id: 'folder-1', userId: 'admin-main', name: 'الكتب والقرارات الرسمية', color: '#6366f1' },
      { id: 'folder-2', userId: 'teacher-folder', name: 'توجيهات قسم اللغة العربية', color: '#10b981' },
      { id: 'folder-3', userId: 'std-1', name: 'واجبات وملازم الرياضيات', color: '#f59e0b' },
    ];
  });
  const [deletedLectureIds, setDeletedLectureIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_deleted_lecture_ids_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        hydrateLibraryDeletionGuard(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse deleted lecture IDs', e);
    }
    const initialDeleted = initialStored?.deletedLectureIds || [];
    hydrateLibraryDeletionGuard(initialDeleted);
    return initialDeleted;
  });

  const [lectures, setLectures] = useState<LectureResource[]>(() => {
    let deletedIds = new Set<string>();
    try {
      const savedDeleted = localStorage.getItem('maysan_deleted_lecture_ids_v1');
      if (savedDeleted) {
        deletedIds = new Set(JSON.parse(savedDeleted));
      }
    } catch {
      // ignore
    }
    if (initialStored?.deletedLectureIds && Array.isArray(initialStored.deletedLectureIds)) {
      initialStored.deletedLectureIds.forEach((id: string) => deletedIds.add(id));
    }
    hydrateLibraryDeletionGuard([...deletedIds]);
    return filterRuntimeLibraryResources(
      Array.isArray(initialStored?.lectures) ? initialStored.lectures : []
    ).filter((row) => !deletedIds.has(row.id));
  });
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    if (initialStored?.timetable && Array.isArray(initialStored.timetable) && initialStored.timetable.length > 0) {
      return initialStored.timetable;
    }
    return INITIAL_TIMETABLE;
  });
  const [subjectQuotas, setSubjectQuotas] = useState<GradeSubjectQuota[]>(
    () => initialStored?.subjectQuotas || INITIAL_SUBJECT_QUOTAS
  );
  const [financial, setFinancial] = useState<FinancialRecord[]>(
    () => initialStored?.financial || INITIAL_FINANCIAL
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    () => initialStored?.notifications || INITIAL_NOTIFICATIONS
  );
  const [notificationUserStates, setNotificationUserStates] = useState<Record<string, IsolatedNotificationUserState>>({});
  const [decisionSettings, setDecisionSettings] = useState<MinistryDecisionSettings>(() => {
    return initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
  });
  const [disciplinarySettings, setDisciplinarySettings] = useState<DisciplinarySettings>(() => {
    return initialStored?.disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;
  });
  const [certificates, setCertificates] = useState<StudentCertificate[]>(() => {
    const raw = initialStored?.certificates || INITIAL_CERTIFICATES;
    const initialSettings = initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
    const initialDisc = initialStored?.disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;
    return raw.map((c) => computeCertificateStats(c, initialSettings));
  });
  const [academicEnrollments, setAcademicEnrollments] = useState<AcademicEnrollment[]>([]);
  const [accelerationPolicies, setAccelerationPolicies] = useState<AccelerationPolicy[]>([]);
  const [accelerationAttempts, setAccelerationAttempts] = useState<AccelerationAttempt[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(
    () => initialStored?.calendarEvents || INITIAL_CALENDAR_EVENTS
  );
  const [deletedChallengeIds, setDeletedChallengeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_deleted_challenge_ids_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse deleted challenge IDs', e);
    }
    return initialStored?.deletedChallengeIds || [];
  });

  const [challenges, setChallenges] = useState<InteractiveChallenge[]>(() => {
    let deletedIds = new Set<string>();
    try {
      const savedDeleted = localStorage.getItem('maysan_deleted_challenge_ids_v1');
      if (savedDeleted) {
        deletedIds = new Set(JSON.parse(savedDeleted));
      }
    } catch {
      // ignore
    }
    if (initialStored?.deletedChallengeIds && Array.isArray(initialStored.deletedChallengeIds)) {
      initialStored.deletedChallengeIds.forEach((id: string) => deletedIds.add(id));
    }

    const raw: InteractiveChallenge[] = (initialStored?.challenges || INITIAL_CHALLENGES).filter(
      (c) => !deletedIds.has(c.id)
    );

    return raw.map((c) => {
      // Calculate dynamic sum of questions for absolute accuracy
      const actualQuestions = (c.questions || []).map((q) => ({
        ...q,
        points: Number(q.points) || 25,
      }));
      const questionsPointsSum = actualQuestions.reduce((acc, q) => acc + q.points, 0);
      const accurateTotalPoints = questionsPointsSum > 0 ? questionsPointsSum : (Number(c.totalPoints) || 100);

      let updatedChallenge: InteractiveChallenge = {
        ...c,
        questions: actualQuestions,
        totalPoints: accurateTotalPoints,
        participations: (c.participations || []).map((p) => {
          const pScore = Number(p.score) || 0;
          const pTotal = accurateTotalPoints;
          const pPct = Math.min(100, Math.round((pScore / pTotal) * 100));
          return {
            ...p,
            score: pScore,
            totalPossibleScore: pTotal,
            percentage: pPct,
          };
        }),
      };

      if (c.id === 'chal-ai-coding-2026') {
        updatedChallenge.rewardBadge = '⚡ درع تورنغ للمبتكرات الرقمية';
        updatedChallenge.participations = updatedChallenge.participations?.map((p) =>
          p.awardedBadge?.includes('تورنغ')
            ? { ...p, awardedBadge: '⚡ درع تورنغ للمبتكرات الرقمية' }
            : p
        );
      }
      return updatedChallenge;
    });
  });
  const [schoolAdminData, setSchoolAdminData] = useState<SchoolAdminData>(() => {
    let data = initialStored?.schoolAdminData || INITIAL_SCHOOL_ADMIN_DATA;
    if (!data.principalName || data.principalName.includes('هناء')) {
      data = {
        ...data,
        principalName: 'الهام صبيح سعدون',
        principalBadge: 'المديرة الهام صبيح سعدون',
        principalNameOnCert: 'الهام صبيح سعدون',
      };
    }
    return data;
  });

  // SCHOOL_ADMIN_DATA_SYNC_GUARD_V1
  // Per-key pending dedicated mutations. Unrelated keys keep synchronizing.
  const pendingSyncMutationsRef = useRef<Record<string, number>>({});
  const pendingSyncMutationGenerationRef = useRef(0);
  // HOME_PUBLIC_INITIALIZATION_V1
  const authoritativeSchoolAdminReceivedRef = useRef(false);
  const authoritativeTeachersReceivedRef = useRef(false);
  const authoritativeStudentsReceivedRef = useRef(false);
  const authoritativeParentsReceivedRef = useRef(false);
  const authoritativeGraduatesReceivedRef = useRef(false);
  const parentSelfHealGuardRef = useRef<ParentSelfHealGuardState>(EMPTY_PARENT_SELF_HEAL_GUARD);
  const parentSelfHealInFlightRef = useRef(false);
  const sessionAdmissionRef = useRef(createSessionAdmissionGate());

  const runTrackedPersistenceWrite = async <T,>(
    operation: () => Promise<T>,
    blockedValue: T
  ): Promise<T> => {
    if (!tryBeginPersistenceWrite(sessionAdmissionRef.current)) {
      return blockedValue;
    }
    try {
      return await operation();
    } finally {
      endActivePersistenceWrite(sessionAdmissionRef.current.writes);
    }
  };

  const blockedSyncResult = { success: false, message: 'logout-in-progress' };

  const syncSourceUser = () => ({
    id: currentUser?.id || role,
    name: currentUser?.name || (role === 'admin' ? 'المديرة العامة' : role),
    role,
  });

  const persistCollectionDoc = async (key: string, id: string, item: any, baseItem?: any): Promise<boolean> => {
    if (key === 'lectures' && isLibraryResourceSuppressed(id)) {
      return true;
    }
    return runTrackedPersistenceWrite(async () => {
      const res = await centralSyncService.upsertCollectionDocument(key, id, item, baseItem, syncSourceUser());
      return res.success === true;
    }, false);
  };

  const deleteCollectionDoc = async (key: string, id: string): Promise<boolean> => {
    return runTrackedPersistenceWrite(async () => {
      const res = await centralSyncService.deleteCollectionDocument(key, id, syncSourceUser());
      return res.success === true;
    }, false);
  };

  const persistChangedCollectionDocs = async (
    key: string,
    previous: Array<{ id: string }>,
    next: Array<{ id: string }>,
    includeDeletes = false
  ): Promise<boolean> => {
    const plan = planCollectionPersistence(previous, next, { includeDeletes });
    const prevMap = new Map(previous.map((item) => [item.id, item]));
    const results = await Promise.all([
      ...plan.upserts.map((item) => persistCollectionDoc(key, item.id, item, prevMap.get(item.id))),
      ...plan.deletes.map((id) => deleteCollectionDoc(key, id)),
    ]);
    return results.every(Boolean);
  };

  const persistEntityFromArray = async (
    key: string,
    previous: Array<{ id: string }>,
    next: Array<{ id: string }>,
    id: string
  ): Promise<boolean> => {
    const before = previous.find((item) => item.id === id);
    const after = next.find((item) => item.id === id);
    if (!after) return false;
    return persistCollectionDoc(key, id, after, before);
  };

  const commitEntityArrayUpdate = async <T extends { id: string }>(
    key: string,
    current: T[],
    setState: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    updater: (previous: T[]) => T[]
  ): Promise<boolean> => {
    const next = updater(current);
    const ok = await persistEntityFromArray(key, current, next, id);
    if (!ok) return false;
    setState(next);
    return true;
  };

  const commitChangedCollectionUpdate = async <T extends { id: string }>(
    key: string,
    current: T[],
    setState: React.Dispatch<React.SetStateAction<T[]>>,
    updater: (previous: T[]) => T[],
    includeDeletes = false
  ): Promise<boolean> => {
    const next = updater(current);
    const ok = await persistChangedCollectionDocs(key, current, next, includeDeletes);
    if (!ok) return false;
    setState(next);
    return true;
  };

  const beginPendingSyncMutation = (key: string): number => {
    const token = pendingSyncMutationGenerationRef.current + 1;
    pendingSyncMutationGenerationRef.current = token;
    pendingSyncMutationsRef.current[key] = token;
    return token;
  };

  const isSyncKeyPending = (key: string): boolean =>
    pendingSyncMutationsRef.current[key] !== undefined;

  const [syncHydrationGeneration, setSyncHydrationGeneration] = useState(0);
  const [timetableAcademicSyncGeneration, setTimetableAcademicSyncGeneration] = useState(0);
  const [parentStudentSelfHealGeneration, setParentStudentSelfHealGeneration] = useState(0);

  const settlePendingSyncMutation = (key: string, token: number) => {
    if (pendingSyncMutationsRef.current[key] === token) {
      delete pendingSyncMutationsRef.current[key];
      if (key === 'teachers' || key === 'students') {
        setTimetableAcademicSyncGeneration((n) => n + 1);
      }
      if (key === 'students' || key === 'parents') {
        setParentStudentSelfHealGeneration((n) => n + 1);
      }
    }
  };

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    return initialStored?.auditLogs || INITIAL_AUDIT_LOGS;
  });

  // Annual Curriculum Plans & Daily Lesson Plans State
  const [annualPlans, setAnnualPlans] = useState<AnnualPlan[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_annual_plans_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse annual plans', e);
    }
    return initialStored?.annualPlans || DEFAULT_ANNUAL_PLANS;
  });

  const [dailyLessonPlans, setDailyLessonPlans] = useState<DailyLessonPlan[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_daily_lesson_plans_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse daily lesson plans', e);
    }
    return initialStored?.dailyLessonPlans || DEFAULT_DAILY_LESSON_PLANS;
  });

  // SECURITY_LESSON_PLANS_OWNER_ONLY_V1
  const lessonPlanIsAdmin = currentUser?.role === 'admin' && role === 'admin';
  const lessonPlanIsSupervisor = currentUser?.role === 'supervisor' && role === 'supervisor';
  const lessonPlanIsTeacher = currentUser?.role === 'teacher' && role === 'teacher';
  const lessonPlanTeacherId = lessonPlanIsTeacher ? (currentUser?.profileId || currentUser?.teacherObj?.id || currentUser?.id || '') : '';
  const lessonPlanTeacherName = lessonPlanIsTeacher ? (currentUser?.teacherObj?.name || currentUser?.name || '') : '';
  const ownsLessonPlan = (plan: AnnualPlan | DailyLessonPlan): boolean => {
    if (!lessonPlanIsTeacher || !lessonPlanTeacherId) return false;
    const trustedIds = new Set([currentUser?.profileId, currentUser?.teacherObj?.id, currentUser?.id].filter((v): v is string => Boolean(v)));
    return Boolean((plan.teacherId && trustedIds.has(plan.teacherId)) || (plan.createdBy && trustedIds.has(plan.createdBy)));
  };
  const canManageLessonPlan = (plan: AnnualPlan | DailyLessonPlan): boolean => lessonPlanIsAdmin || ownsLessonPlan(plan);
  const requireLessonPlanCreateAuthority = (): boolean => lessonPlanIsAdmin || (lessonPlanIsTeacher && Boolean(lessonPlanTeacherId));

  // Curriculum Plan Actions (Annual & Daily)
  const addAnnualPlan = async (plan: Omit<AnnualPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnnualPlan> => {
    if (!requireLessonPlanCreateAuthority()) throw new Error('Unauthorized annual lesson plan creation');
    const securedPlan = lessonPlanIsTeacher ? { ...plan, teacherId: lessonPlanTeacherId, teacherName: lessonPlanTeacherName, createdBy: lessonPlanTeacherId } : plan;
    const newPlan: AnnualPlan = {
      ...securedPlan,
      id: `annual-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const persisted = await persistCollectionDoc('annualPlans', newPlan.id, newPlan);
    if (!persisted) throw new Error('تعذر حفظ الخطة السنوية في قاعدة البيانات.');
    setAnnualPlans((prev) => [newPlan, ...prev]);
    addAuditLog({
      action: 'إعداد خطة سنوية جديدة',
      actionType: 'create',
      targetCategory: 'system',
      targetId: newPlan.id,
      targetName: `${newPlan.subject} - ${newPlan.gradeLevel}`,
      details: `تم إعداد خطة سنوية جديدة لمادة (${newPlan.subject}) للصف (${newPlan.gradeLevel}) بواسطة (${newPlan.teacherName})`,
      severity: 'info',
    });
    return newPlan;
  };

  const updateAnnualPlan = async (id: string, updated: Partial<AnnualPlan>) => {
    const target = annualPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const securedUpdated = lessonPlanIsTeacher ? { ...updated, teacherId: target.teacherId, teacherName: target.teacherName, createdBy: target.createdBy, status: target.status, approvedBy: target.approvedBy, approvedAt: target.approvedAt, approvalNotes: target.approvalNotes, supervisorNotes: target.supervisorNotes, supervisorName: target.supervisorName, supervisorSignedAt: target.supervisorSignedAt } : updated;
    const committed = await commitEntityArrayUpdate('annualPlans', annualPlans, setAnnualPlans, id, (prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, ...securedUpdated, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      return next;
    });
    if (!committed) return false;
    addAuditLog({
      action: 'تحديث الخطة السنوية',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تحديث بيانات الخطة السنوية رقم (${id})`,
      severity: 'info',
    });
  };

  const deleteAnnualPlan = async (id: string) => {
    const target = annualPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const persisted = await deleteCollectionDoc('annualPlans', id);
    if (!persisted) return false;

    setAnnualPlans((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('maysan_annual_plans_v1', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to update annual plans storage', e);
      }
      return next;
    });
    addAuditLog({
      action: 'حذف نهائي للخطة السنوية',
      actionType: 'delete',
      targetCategory: 'system',
      targetId: id,
      details: `تم الحذف النهائي للخطة السنوية رقم (${id}) من سجلات النظام`,
      severity: 'warning',
    });
    return true;
  };

  const duplicateAnnualPlan = async (id: string) => {
    const target = annualPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const duplicated: AnnualPlan = {
      ...target,
      id: `annual-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      academicYear: target.academicYear,
      teacherName: lessonPlanIsTeacher ? lessonPlanTeacherName : target.teacherName,
      teacherId: lessonPlanIsTeacher ? lessonPlanTeacherId : target.teacherId,
      createdBy: lessonPlanIsTeacher ? lessonPlanTeacherId : target.createdBy,
      status: 'draft',
      approvedBy: undefined,
      approvedAt: undefined,
      approvalNotes: undefined,
      supervisorNotes: undefined,
      supervisorSignedAt: undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      semesters: target.semesters.map((sem) => ({
        ...sem,
        id: `sem-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        months: sem.months.map((m) => ({
          ...m,
          id: `m-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          weeks: m.weeks.map((w) => ({
            ...w,
            id: `w-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            isCompleted: false,
            completedAt: undefined,
          })),
        })),
      })),
    };
    const persisted = await persistCollectionDoc('annualPlans', duplicated.id, duplicated);
    if (!persisted) return false;
    setAnnualPlans((prev) => [duplicated, ...prev]);
    addAuditLog({
      action: 'تكرار / استنساخ خطة سنوية',
      actionType: 'create',
      targetCategory: 'system',
      targetId: duplicated.id,
      details: `تم استنساخ الخطة السنوية لمادة (${duplicated.subject} - ${duplicated.gradeLevel}) بنجاح`,
      severity: 'info',
    });
  };

  const toggleAnnualTopicCompletion = async (
    planId: string,
    semesterId: string,
    monthId: string,
    weekId: string
  ) => {
    const target = annualPlans.find((p) => p.id === planId);
    if (!target || !canManageLessonPlan(target)) return;
    const committed = await commitEntityArrayUpdate('annualPlans', annualPlans, setAnnualPlans, planId, (prev) => {
      const next = prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          updatedAt: new Date().toISOString().split('T')[0],
          semesters: plan.semesters.map((sem) => {
            if (sem.id !== semesterId) return sem;
            return {
              ...sem,
              months: sem.months.map((m) => {
                if (m.id !== monthId) return m;
                return {
                  ...m,
                  weeks: m.weeks.map((w) => {
                    if (w.id !== weekId) return w;
                    const nextCompleted = !w.isCompleted;
                    return {
                      ...w,
                      isCompleted: nextCompleted,
                      completedAt: nextCompleted ? new Date().toISOString().split('T')[0] : undefined,
                    };
                  }),
                };
              }),
            };
          }),
        };
      });
      return next;
    });
    if (!committed) return false;
  };

  const approveAnnualPlan = async (
    id: string,
    notes?: string,
    approverRole?: string,
    approverName?: string
  ) => {
    if (!lessonPlanIsAdmin && !lessonPlanIsSupervisor) return;
    const isSupervisor = lessonPlanIsSupervisor;
    const finalApproverName =
      approverName ||
      currentUser?.name ||
      (isSupervisor ? 'المشرف التربوي الاختصاصي' : schoolAdminData.principalName || 'إدارة المدرسة');

    const committed = await commitEntityArrayUpdate('annualPlans', annualPlans, setAnnualPlans, id, (prev) => {
      const next = prev.map((plan) => {
        if (plan.id !== id) return plan;
        if (isSupervisor) {
          return {
            ...plan,
            supervisorNotes: notes || plan.supervisorNotes || 'تم الاطلاع والمصادقة الإشرافية',
            supervisorName: finalApproverName,
            supervisorSignedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        } else {
          return {
            ...plan,
            status: 'approved' as const,
            approvalNotes: notes || plan.approvalNotes || 'تمت المصادقة والاعتماد من قبل إدارة المدرسة',
            approvedBy: finalApproverName,
            approvedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
      });
      return next;
    });
    if (!committed) return false;

    addAuditLog({
      action: isSupervisor ? 'المصادقة الإشرافية على الخطة السنوية' : 'اعتماد الخطة السنوية من الإدارة',
      actionType: 'status_change',
      targetCategory: 'system',
      targetId: id,
      details: `تمت المصادقة على الخطة السنوية بواسطة (${finalApproverName})`,
      severity: 'success',
    });
  };

  // Daily Lesson Plan Actions
  const addDailyLessonPlan = async (
    plan: Omit<DailyLessonPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DailyLessonPlan> => {
    if (!requireLessonPlanCreateAuthority()) throw new Error('Unauthorized daily lesson plan creation');
    const securedPlan = lessonPlanIsTeacher ? { ...plan, teacherId: lessonPlanTeacherId, teacherName: lessonPlanTeacherName, createdBy: lessonPlanTeacherId } : plan;
    const newPlan: DailyLessonPlan = {
      ...securedPlan,
      id: `daily-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const persisted = await persistCollectionDoc('dailyLessonPlans', newPlan.id, newPlan);
    if (!persisted) throw new Error('تعذر حفظ خطة الدرس في قاعدة البيانات.');
    setDailyLessonPlans((prev) => [newPlan, ...prev]);
    addAuditLog({
      action: 'إعداد خطة درس يومية جديدة',
      actionType: 'create',
      targetCategory: 'system',
      targetId: newPlan.id,
      targetName: `${newPlan.subject} - ${newPlan.lessonTitle}`,
      details: `تم إعداد خطة يومية لدرس (${newPlan.lessonTitle}) لمادة (${newPlan.subject} - ${newPlan.gradeLevel}) للمعلمة (${newPlan.teacherName})`,
      severity: 'info',
    });
    return newPlan;
  };

  const updateDailyLessonPlan = async (id: string, updated: Partial<DailyLessonPlan>) => {
    const target = dailyLessonPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const securedUpdated = lessonPlanIsTeacher ? { ...updated, teacherId: target.teacherId, teacherName: target.teacherName, createdBy: target.createdBy, status: target.status, principalNotes: target.principalNotes, principalName: target.principalName, supervisorNotes: target.supervisorNotes, supervisorName: target.supervisorName, reviewedAt: target.reviewedAt } : updated;
    const committed = await commitEntityArrayUpdate('dailyLessonPlans', dailyLessonPlans, setDailyLessonPlans, id, (prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, ...securedUpdated, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      return next;
    });
    if (!committed) return false;
    addAuditLog({
      action: 'تحديث الخطة اليومية للدرس',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تحديث خطة الدرس اليومية رقم (${id})`,
      severity: 'info',
    });
  };

  const deleteDailyLessonPlan = async (id: string) => {
    const target = dailyLessonPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const persisted = await deleteCollectionDoc('dailyLessonPlans', id);
    if (!persisted) return false;

    setDailyLessonPlans((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('maysan_daily_lesson_plans_v1', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to update daily lesson plans storage', e);
      }
      return next;
    });
    addAuditLog({
      action: 'حذف نهائي لخطة الدرس اليومية',
      actionType: 'delete',
      targetCategory: 'system',
      targetId: id,
      details: `تم الحذف النهائي لخطة الدرس اليومية رقم (${id}) من سجلات النظام`,
      severity: 'warning',
    });
    return true;
  };

  const duplicateDailyLessonPlan = async (id: string) => {
    const target = dailyLessonPlans.find((p) => p.id === id);
    if (!target || !canManageLessonPlan(target)) return;
    const duplicated: DailyLessonPlan = {
      ...target,
      id: `daily-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      teacherName: lessonPlanIsTeacher ? lessonPlanTeacherName : target.teacherName,
      teacherId: lessonPlanIsTeacher ? lessonPlanTeacherId : target.teacherId,
      createdBy: lessonPlanIsTeacher ? lessonPlanTeacherId : target.createdBy,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      principalNotes: undefined,
      principalName: undefined,
      supervisorNotes: undefined,
      supervisorName: undefined,
      reviewedAt: undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const persisted = await persistCollectionDoc('dailyLessonPlans', duplicated.id, duplicated);
    if (!persisted) return false;
    setDailyLessonPlans((prev) => [duplicated, ...prev]);
    addAuditLog({
      action: 'تكرار / استنساخ خطة يومية',
      actionType: 'create',
      targetCategory: 'system',
      targetId: duplicated.id,
      details: `تم استنساخ خطة درس (${duplicated.lessonTitle}) بنجاح`,
      severity: 'info',
    });
  };

  const approveDailyLessonPlan = async (
    id: string,
    notes?: string,
    reviewerRole?: string,
    reviewerName?: string
  ) => {
    if (!lessonPlanIsAdmin && !lessonPlanIsSupervisor) return;
    const isSupervisor = lessonPlanIsSupervisor;
    const finalReviewerName =
      reviewerName ||
      currentUser?.name ||
      (isSupervisor ? 'المشرف التربوي' : schoolAdminData.principalName || 'إدارة المدرسة');

    const committed = await commitEntityArrayUpdate('dailyLessonPlans', dailyLessonPlans, setDailyLessonPlans, id, (prev) => {
      const next = prev.map((plan) => {
        if (plan.id !== id) return plan;
        if (isSupervisor) {
          return {
            ...plan,
            status: 'reviewed' as const,
            supervisorNotes: notes || plan.supervisorNotes || 'تمت المراجعة والتقييم الإشرافي بنجاح',
            supervisorName: finalReviewerName,
            reviewedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        } else {
          return {
            ...plan,
            status: 'reviewed' as const,
            principalNotes: notes || plan.principalNotes || 'تحضير يومي ممتاز ومستوفٍ للمعايير التعليمية',
            principalName: finalReviewerName,
            reviewedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
      });
      return next;
    });
    if (!committed) return false;

    addAuditLog({
      action: isSupervisor ? 'مراجعة وتقييم إشرافي لخطة الدرس' : 'اعتماد مديرة المدرسة للخطة اليومية',
      actionType: 'status_change',
      targetCategory: 'system',
      targetId: id,
      details: `تمت مراجعة خطة الدرس اليومية بواسطة (${finalReviewerName})`,
      severity: 'success',
    });
  };

  const addAuditLog = (
    entry: {
      id?: string;
      timestamp?: string;
      userId?: string;
      userName?: string;
      userRole?: UserRole;
      action: string;
      actionType: AuditActionType;
      targetCategory: AuditTargetCategory;
      targetId?: string;
      targetName?: string;
      details?: string;
      ipAddress?: string;
      deviceInfo?: string;
      severity?: AuditSeverity;
      previousValue?: string;
      newValue?: string;
    }
  ) => {
    const newLog: AuditLogEntry = {
      id: entry.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      userId: entry.userId || currentUser?.id || 'admin-principal',
      userName: entry.userName || currentUser?.name || schoolAdminData.principalName || 'إدارة المدرسة',
      userRole: entry.userRole || role || 'admin',
      action: entry.action,
      actionType: entry.actionType,
      targetCategory: entry.targetCategory,
      targetId: entry.targetId,
      targetName: entry.targetName,
      details: entry.details,
      ipAddress: entry.ipAddress || '192.168.1.10',
      deviceInfo: entry.deviceInfo || 'لوحة تحكم الإدارة (الويب)',
      severity: entry.severity || 'info',
      previousValue: entry.previousValue,
      newValue: entry.newValue,
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      void runTrackedPersistenceWrite(
        () =>
          centralSyncService.directArrayMutation('auditLogs', updated, {
            id: currentUser?.id || role,
            name: currentUser?.name || role,
            role,
          }),
        false
      );
      return updated;
    });
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => {
      const updated = prev.filter((log) => log.id !== id);
      void runTrackedPersistenceWrite(
        () =>
          centralSyncService.directArrayMutation('auditLogs', updated, {
            id: currentUser?.id || role,
            name: currentUser?.name || role,
            role,
          }),
        false
      );
      return updated;
    });
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    void runTrackedPersistenceWrite(
      () =>
        centralSyncService.directArrayMutation('auditLogs', [], {
          id: currentUser?.id || role,
          name: currentUser?.name || role,
          role,
        }),
      false
    );
  };

  const exportAuditLogsJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `maysan_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export audit logs JSON', err);
    }
  };

  const exportAuditLogsCSV = () => {
    try {
      const headers = ['المعرف', 'التوقيت', 'اسم المستخدم', 'الدور', 'نوع الإجراء', 'التصنيف', 'الهدف', 'التفاصيل', 'مستوى الأهمية', 'عنوان IP'];
      const rows = auditLogs.map((log) => [
        log.id,
        new Date(log.timestamp).toLocaleString('ar-IQ'),
        `"${(log.userName || '').replace(/"/g, '""')}"`,
        log.userRole,
        log.actionType,
        log.targetCategory,
        `"${(log.targetName || '').replace(/"/g, '""')}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.severity,
        log.ipAddress || '',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `maysan_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export audit logs CSV', err);
    }
  };

  const updateSchoolAdminData = async (updated: Partial<SchoolAdminData>): Promise<boolean> => {
    if (role !== 'admin' || currentUser?.role !== 'admin') {
      console.warn('[SECURITY] Blocked unauthorized school administration update.');
      return false;
    }
    if (!isInitialHydrationDone.current) {
      console.warn('[SCHOOL_ADMIN_DATA_DEDICATED_WRITE_V2] Blocked schoolAdminData write before hydration.');
      return false;
    }
    const sourceUser = { id: currentUser?.id || role, name: currentUser?.name || role, role };
    const mutationToken = beginPendingSyncMutation(SCHOOL_ADMIN_DATA_SYNC_KEY);
    const nextPublicSource = { ...schoolAdminData, ...updated };
    try {
      const persisted = await runTrackedPersistenceWrite(async () => {
        const ok = await centralSyncService.patchSettingFields(
          SCHOOL_ADMIN_DATA_SYNC_KEY,
          updated,
          sourceUser
        );
        if (!ok) return false;
        if (!schoolAdminPatchTouchesPublicHomepage(updated as Record<string, unknown>)) {
          return true;
        }
        return publishPublicSchoolInfo(nextPublicSource);
      }, false);
      if (!persisted) return false;
      setSchoolAdminData((prev) => ({ ...prev, ...updated }));
      return true;
    } finally {
      settlePendingSyncMutation(SCHOOL_ADMIN_DATA_SYNC_KEY, mutationToken);
    }
  };

  const persistPublicHomepageNews = async (list: unknown): Promise<boolean> => {
    if (role !== 'admin' || currentUser?.role !== 'admin') return false;
    return runTrackedPersistenceWrite(() => publishPublicNews(list as any), false);
  };

  const persistPublicHomepageGallery = async (list: unknown): Promise<boolean> => {
    if (role !== 'admin' || currentUser?.role !== 'admin') return false;
    return runTrackedPersistenceWrite(() => publishPublicGallery(list as any), false);
  };

  // SECURITY_MESSAGING_ADMIN_AUTH_UID_PUBLISH_V1_3D6F2C_STAGE0_9
  // Publish only adminAuthUid onto the existing Firestore schoolAdminData document.
  // Never write INITIAL hours/uniform/policy as a side effect of login/F5.
  useEffect(() => {
    if (role !== 'admin' || currentUser?.role !== 'admin') return;
    if (!isInitialHydrationDone.current) return;
    const uid = typeof currentUser?.authUid === 'string' ? currentUser.authUid.trim() : '';
    if (!uid) return;
    const existing = typeof schoolAdminData.adminAuthUid === 'string' ? schoolAdminData.adminAuthUid.trim() : '';
    if (existing === uid) return;
    const sourceUser = { id: currentUser?.id || role, name: currentUser?.name || role, role };
    void centralSyncService
      .patchSettingFields(SCHOOL_ADMIN_DATA_SYNC_KEY, { adminAuthUid: uid }, sourceUser)
      .then((ok) => {
        if (ok) {
          setSchoolAdminData((prev) => ({ ...prev, adminAuthUid: uid }));
        }
      });
  }, [role, currentUser?.role, currentUser?.authUid, schoolAdminData.adminAuthUid, syncHydrationGeneration]);

  // HOME_PUBLIC_INITIALIZATION_V1
  // Admin-only catch-up: project hydrated server schoolAdminData into publicContent/homepage.schoolInfo
  // when the public projection is missing or incomplete. Never uses INITIAL_* or guest paths.
  useEffect(() => {
    if (!currentUser) return;
    if (role !== 'admin' || currentUser.role !== 'admin') return;
    if (!isInitialHydrationDone.current) return;
    if (!authoritativeSchoolAdminReceivedRef.current) return;
    if (isSyncKeyPending(SCHOOL_ADMIN_DATA_SYNC_KEY)) return;

    let cancelled = false;
    void initializePublicSchoolInfoFromAuthoritative({
      authenticated: true,
      role,
      currentUserRole: currentUser.role,
      hydrated: isInitialHydrationDone.current,
      authoritativeReceived: authoritativeSchoolAdminReceivedRef.current,
      pendingSchoolAdminWrite: isSyncKeyPending(SCHOOL_ADMIN_DATA_SYNC_KEY),
      schoolAdminData,
      initialSchoolAdminData: INITIAL_SCHOOL_ADMIN_DATA,
    }).then((result) => {
      if (cancelled || !result.written) return;
      console.info('[PUBLIC_HOMEPAGE] Initialized public schoolInfo from authoritative schoolAdminData');
    });

    return () => {
      cancelled = true;
    };
  }, [role, currentUser?.role, currentUser?.authUid, syncHydrationGeneration]);

  useEffect(() => {
    if (!currentUser) return;
    if (role !== 'admin' || currentUser.role !== 'admin') return;
    if (!isInitialHydrationDone.current) return;
    if (!authoritativeTeachersReceivedRef.current) return;
    if (isSyncKeyPending('teachers')) return;

    let cancelled = false;
    void initializePublicFacultyFromAuthoritative({
      authenticated: true,
      role,
      currentUserRole: currentUser.role,
      hydrated: isInitialHydrationDone.current,
      authoritativeReceived: authoritativeTeachersReceivedRef.current,
      teachers,
      initialTeachers: INITIAL_TEACHERS,
    }).then((result) => {
      if (cancelled || !result.written) return;
      console.info('[PUBLIC_HOMEPAGE] Initialized public faculty from authoritative teachers');
    });

    return () => {
      cancelled = true;
    };
  }, [role, currentUser?.role, currentUser?.authUid, syncHydrationGeneration]);

  useEffect(() => {
    if (role !== 'admin' || currentUser?.role !== 'admin') return;
    if (!isInitialHydrationDone.current) return;
    if (!authoritativeTeachersReceivedRef.current || !authoritativeStudentsReceivedRef.current) return;
    if (isSyncKeyPending('teachers') || isSyncKeyPending('students')) return;
    const snapshot = buildTimetableAcademicSnapshot(teachers, students);
    if (timetableAcademicSnapshotEquals(schoolAdminData, snapshot)) return;
    updateSchoolAdminData({
      timetableFaculty: snapshot.timetableFaculty,
      timetableActiveSections: snapshot.timetableActiveSections,
    });
  }, [role, currentUser?.role, teachers, students, schoolAdminData.timetableFaculty, schoolAdminData.timetableActiveSections, timetableAcademicSyncGeneration]);

  useEffect(() => {
    if (!currentUser) return;
    if (role !== 'admin' || currentUser.role !== 'admin') return;
    if (!isInitialHydrationDone.current) return;
    if (!authoritativeStudentsReceivedRef.current || !authoritativeGraduatesReceivedRef.current) return;
    if (isSyncKeyPending('students') || isSyncKeyPending('graduates')) return;

    let cancelled = false;
    void initializePublicHonorBoardFromAuthoritative({
      authenticated: true,
      role,
      currentUserRole: currentUser.role,
      hydrated: isInitialHydrationDone.current,
      authoritativeReceived: true,
      students,
      graduates,
      honorRollDemo: HONOR_ROLL_DEMO_NAMES.map((name) => ({ name })),
    }).then((result) => {
      if (cancelled || !result.written) return;
      console.info('[PUBLIC_HOMEPAGE] Initialized public honorBoard from authoritative students/graduates');
    });

    return () => {
      cancelled = true;
    };
  }, [role, currentUser?.role, currentUser?.authUid, syncHydrationGeneration]);

  // ─────────────────────────────────────────────────────────────
  // OFFICIAL EXAM SCHEDULES (جداول الامتحانات الرسمية)
  // الصلاحية محصورة بالمديرة والإدارة المدرسية فقط (إضافة، تعديل، حذف)
  // ─────────────────────────────────────────────────────────────
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_exam_schedules_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse exam schedules', e);
    }
    return INITIAL_EXAM_SCHEDULES;
  });

  useEffect(() => {
    if (currentUser) return;
    purgeAuthenticatedSessionMemory();
  }, [currentUser]);

  const checkExamScheduleAdminPermission = (actionName: string): boolean => {
    const isAuthorized = role === 'admin' || currentUser?.role === 'admin';
    if (!isAuthorized) {
      addAuditLog({
        action: `محاولة غير مصرح بها: ${actionName}`,
        actionType: 'security',
        targetCategory: 'system',
        details: `تم حظر محاولة (${actionName}) لجدول الامتحانات نظراً لحصر الصلاحية بالمديرة والإدارة المدرسية فقط.`,
        severity: 'danger',
      });
      return false;
    }
    return true;
  };

  const addExamSchedule = async (schedule: Omit<ExamSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExamSchedule> => {
    if (!checkExamScheduleAdminPermission('إنشاء جدول امتحانات جديد')) {
      throw new Error('عذراً، صلاحية إنشاء وتعديل وحذف جداول الامتحانات محصورة بالمديرة وإدارة المدرسة فقط.');
    }

    const newSchedule: ExamSchedule = {
      ...schedule,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdBy: currentUser?.name || schoolAdminData.principalName || 'إدارة ثانوية ميسان للمتميزات',
      createdRole: 'principal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const persisted = await persistCollectionDoc('examSchedules', newSchedule.id, newSchedule);
    if (!persisted) throw new Error('تعذر حفظ جدول الامتحانات في قاعدة البيانات.');
    setExamSchedules((prev) => [newSchedule, ...prev]);

    addAuditLog({
      action: 'إنشاء جدول امتحانات رسمي',
      actionType: 'create',
      targetCategory: 'system',
      targetId: newSchedule.id,
      targetName: newSchedule.title,
      details: `تم اعتماد وإنشاء (${newSchedule.title}) لكافة الصفوف المشمولة بنجاح بواسطة الإدارة`,
      severity: 'info',
    });

    if (newSchedule.isPublished) {
      addNotification({
        title: `جدول امتحانات رسمي: ${newSchedule.title}`,
        message: `أصدرت إدارة ثانوية ميسان للمتميزات ${newSchedule.title}. يرجى الاطلاع على مواعيد الامتحانات والتعليمات المدرسية المعتمدة.`,
        type: 'info',
        targetRole: 'all',
        isRead: false,
      });
    }

    return newSchedule;
  };

  const updateExamSchedule = async (id: string, updated: Partial<ExamSchedule>) => {
    if (!checkExamScheduleAdminPermission('تعديل جدول امتحانات')) {
      throw new Error('عذراً، صلاحية تعديل جداول الامتحانات محصورة بالمديرة وإدارة المدرسة فقط.');
    }

    const committed = await commitEntityArrayUpdate('examSchedules', examSchedules, setExamSchedules, id, (prev) => {
      const next = prev.map((sch) =>
        sch.id === id
          ? { ...sch, ...updated, updatedAt: new Date().toISOString() }
          : sch
      );
      return next;
    });
    if (!committed) return false;

    addAuditLog({
      action: 'تعديل جدول امتحانات رسمي',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تعديل وتحديث بيانات جدول الامتحانات رقم (${id}) بنجاح`,
      severity: 'info',
    });
  };

  const deleteExamSchedule = async (id: string) => {
    if (!checkExamScheduleAdminPermission('حذف جدول امتحانات')) {
      throw new Error('عذراً، صلاحية حذف جداول الامتحانات محصورة بالمديرة وإدارة المدرسة فقط.');
    }

    const target = examSchedules.find((s) => s.id === id);
    const persisted = await deleteCollectionDoc('examSchedules', id);
    if (!persisted) return false;

    setExamSchedules((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('maysan_exam_schedules_v1', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to update exam schedules storage', e);
      }
      return next;
    });

    addAuditLog({
      action: 'حذف جدول امتحانات رسمي',
      actionType: 'delete',
      targetCategory: 'system',
      targetId: id,
      targetName: target?.title || id,
      details: `تم الحذف النهائي لجدول الامتحانات (${target?.title || id}) من سجلات المدرسة بواسطة الإدارة`,
      severity: 'warning',
    });
    return true;
  };

  const duplicateExamSchedule = async (id: string) => {
    if (!checkExamScheduleAdminPermission('استنساخ جدول امتحانات')) {
      throw new Error('عذراً، صلاحية استنساخ وتكرار جداول الامتحانات محصورة بالإدارة والمديرة فقط.');
    }

    const target = examSchedules.find((s) => s.id === id);
    if (!target) return;

    const duplicated: ExamSchedule = {
      ...target,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title} (نسخة مكررة)`,
      status: 'مسودة',
      isPublished: false,
      publishedAt: undefined,
      createdBy: currentUser?.name || 'إدارة المدرسة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slots: target.slots.map((s) => ({
        ...s,
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    const persisted = await persistCollectionDoc('examSchedules', duplicated.id, duplicated);
    if (!persisted) return false;
    setExamSchedules((prev) => [duplicated, ...prev]);

    addAuditLog({
      action: 'استنساخ جدول امتحانات',
      actionType: 'create',
      targetCategory: 'system',
      targetId: duplicated.id,
      targetName: duplicated.title,
      details: `تم عمل نسخة مكررة من جدول (${target.title}) بنجاح`,
      severity: 'info',
    });
  };

  const toggleExamSchedulePublish = async (id: string) => {
    if (!checkExamScheduleAdminPermission('نشر أو حظر جدول امتحانات')) {
      throw new Error('عذراً، اعتماد ونشر الجداول محصور بالإدارة والمديرة فقط.');
    }

    const committed = await commitEntityArrayUpdate('examSchedules', examSchedules, setExamSchedules, id, (prev) => {
      const next = prev.map((sch) => {
        if (sch.id !== id) return sch;
        const nextPublished = !sch.isPublished;
        const nextStatus: ExamSchedule['status'] = nextPublished ? 'معتمد ومُعلن' : 'مسودة';
        const nowStr = new Date().toISOString();

        if (nextPublished) {
          addNotification({
            title: `إعلان رسمي: ${sch.title}`,
            message: `أعلنت إدارة ثانوية ميسان للمتميزات جدول ${sch.title} لكافة الصفوف. يرجى الاطلاع على مواعيد الامتحانات والملاحظات والتعليمات الرسمية.`,
            type: 'info',
            targetRole: 'all',
            isRead: false,
          });
        }

        return {
          ...sch,
          isPublished: nextPublished,
          status: nextStatus,
          publishedAt: nextPublished ? nowStr : undefined,
          updatedAt: nowStr,
        };
      });
      return next;
    });
    if (!committed) return false;
  };

  // Challenge & Interactive Game Handlers & Ownership Check
  const canUserManageChallenge = (challenge: InteractiveChallenge): boolean => {
    if (!challenge) return false;
    const currentTeacher = teachers.find(
      (t) => t.id === currentUser?.id || (currentUser?.name && t.name.trim() === currentUser.name.trim())
    ) || currentUser?.teacherObj;

    // Directress and Administration always have 100% full administrative power
    if (
      role === 'admin' ||
      currentUser?.role === 'admin' ||
      currentUser?.isDirectress ||
      currentUser?.name?.includes('الهام') ||
      currentUser?.name?.includes('المديرة') ||
      currentUser?.name?.includes('إدارة') ||
      currentTeacher?.isDirectress
    ) {
      return true;
    }
    if (role === 'teacher') {
      const currentTeacherName = (currentUser?.name || currentTeacher?.name || '').trim();
      const currentTeacherId = currentUser?.id || currentTeacher?.id || '';

      // If challenge has creator ID and it matches current user/teacher ID
      if (challenge.createdByTeacherId && currentTeacherId && challenge.createdByTeacherId === currentTeacherId) {
        return true;
      }

      // If creator teacher name is set, match names (normalized)
      if (challenge.createdByTeacherName && currentTeacherName) {
        const cleanName = (n: string) =>
          n
            .replace(/^(أ\.د\.|أ\.|د\.|استاذة|أستاذة|الست|معلمة|مدرسة)\s*/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const normCreator = cleanName(challenge.createdByTeacherName);
        const normUser = cleanName(currentTeacherName);
        if (normCreator === normUser || normCreator.includes(normUser) || normUser.includes(normCreator)) {
          return true;
        }
      }

      // If challenge was created without specific teacher info (legacy, unassigned, or school admin), only admin can manage
      if (!challenge.createdByTeacherName && !challenge.createdByTeacherId) {
        return false;
      }

      return false;
    }
    return false;
  };

  const addChallenge = async (newChal: Omit<InteractiveChallenge, 'id'>) => {
    const defaultCreatorName = currentUser?.name || currentUser?.teacherObj?.name || 'أستاذة المادة';
    const defaultCreatorId = currentUser?.id || currentUser?.teacherObj?.id || 'tech-current';
    const created: InteractiveChallenge = {
      ...newChal,
      id: `chal-${Date.now()}`,
      createdByTeacherName: newChal.createdByTeacherName || defaultCreatorName,
      createdByTeacherId: newChal.createdByTeacherId || defaultCreatorId,
      questions: newChal.questions || [],
      participations: newChal.participations || [],
    };
    const persisted = await persistCollectionDoc('challenges', created.id, created);
    if (!persisted) return false;
    setChallenges((prev) => [created, ...prev]);
  };

  const updateChallenge = async (id: string, updated: Partial<InteractiveChallenge>) => {
    const committed = await commitEntityArrayUpdate('challenges', challenges, setChallenges, id, (prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        if (!canUserManageChallenge(c)) {
          console.warn(`[Security] Unauthorized edit attempt on challenge ${c.title} by ${currentUser?.name}`);
          return c;
        }
        return { ...c, ...updated };
      });
      return next;
    });
    if (!committed) return false;
  };

  const deleteChallenge = async (id: string) => {
    const targetChallenge = challenges.find((c) => c.id === id);
    if (targetChallenge && !canUserManageChallenge(targetChallenge)) {
      console.warn(`[Security] Unauthorized delete attempt on challenge ${targetChallenge.title} by ${currentUser?.name}`);
      return;
    }

    const targetTitle = targetChallenge?.title || 'المسابقة / اللعبة';

    // 1. Permanently record in deletedChallengeIds
    const persisted = await deleteCollectionDoc('challenges', id);
    if (!persisted) return false;

    setDeletedChallengeIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('maysan_deleted_challenge_ids_v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save deleted challenge IDs', e);
      }
      return updated;
    });

    // 2. Remove from active challenges state immediately
    setChallenges((prev) => prev.filter((c) => c.id !== id));

    // 3. Document in Audit Log
    addAuditLog({
      action: `حذف مسابقة / تحدي تفاعلي نهائياً: ${targetTitle}`,
      actionType: 'delete',
      targetCategory: 'system',
      details: `تم حذف المسابقة والتحدي التفاعلي (${targetTitle}) برقم المعرف (${id}) وجميع أسئلته ومشاركاته وسجلاته بشكل دائم ونهائي بواسطة الإدارة المدرسية.`,
      severity: 'warning',
    });
    return true;
  };

  const addQuestionToChallenge = (challengeId: string, question: Omit<ChallengeQuestion, 'id'>) => {
    const targetChallenge = challenges.find((c) => c.id === challengeId);
    if (targetChallenge && !canUserManageChallenge(targetChallenge)) {
      console.warn(`[Security] Unauthorized addQuestion attempt on challenge ${targetChallenge.title} by ${currentUser?.name}`);
      return;
    }

    const createdQ: ChallengeQuestion = {
      ...question,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        const newQuestions = [...c.questions, createdQ];
        const newTotalPoints = newQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
        return {
          ...c,
          questions: newQuestions,
          totalPoints: newTotalPoints > 0 ? newTotalPoints : c.totalPoints,
        };
      })
    );
  };

  const updateQuestionInChallenge = (
    challengeId: string,
    questionId: string,
    questionUpdates: Partial<ChallengeQuestion>
  ) => {
    const targetChallenge = challenges.find((c) => c.id === challengeId);
    if (targetChallenge && !canUserManageChallenge(targetChallenge)) {
      console.warn(`[Security] Unauthorized updateQuestion attempt on challenge ${targetChallenge.title} by ${currentUser?.name}`);
      return;
    }

    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        const updatedQuestions = c.questions.map((q) =>
          q.id === questionId ? { ...q, ...questionUpdates } : q
        );
        const newTotalPoints = updatedQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
        return {
          ...c,
          questions: updatedQuestions,
          totalPoints: newTotalPoints > 0 ? newTotalPoints : c.totalPoints,
        };
      })
    );
  };

  const deleteQuestionFromChallenge = (challengeId: string, questionId: string) => {
    const targetChallenge = challenges.find((c) => c.id === challengeId);
    if (targetChallenge && !canUserManageChallenge(targetChallenge)) {
      console.warn(`[Security] Unauthorized deleteQuestion attempt on challenge ${targetChallenge.title} by ${currentUser?.name}`);
      return;
    }

    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        const remainingQuestions = c.questions.filter((q) => q.id !== questionId);
        const newTotalPoints = remainingQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
        return {
          ...c,
          questions: remainingQuestions,
          totalPoints: newTotalPoints > 0 ? newTotalPoints : 100,
        };
      })
    );
  };

  const submitChallengeAttempt = (
    challengeId: string,
    studentId: string,
    studentName: string,
    gradeLevel: GradeLevel,
    section: string,
    score: number,
    timeSpentSeconds: number,
    answersCount: { correct: number; total: number },
    userAnswers?: Record<string, number>,
    questionTimeSpent?: Record<string, number>
  ) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        const totalPossibleScore = (c.questions && c.questions.length > 0)
          ? c.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
          : (c.totalPoints || 100);
        const percentage = Math.min(100, Math.round((score / totalPossibleScore) * 100));

        let status: ChallengeParticipation['status'] = 'مكتملة';
        if (percentage >= 90) status = 'فائزة بالمركز الأول 🥇';
        else if (percentage >= 80) status = 'فائزة بالمركز الثاني 🥈';
        else if (percentage >= 70) status = 'فائزة بالمركز الثالث 🥉';
        else if (percentage >= 50) status = 'مشاركة متميزة 🎖️';
        else status = 'مكتملة';

        const existingIndex = c.participations.findIndex((p) => p.studentId === studentId);
        let updatedParticipations: ChallengeParticipation[];

        if (existingIndex >= 0) {
          const old = c.participations[existingIndex];
          const bestScore = Math.max(old.score, score);
          const bestPercentage = Math.round((bestScore / totalPossibleScore) * 100);
          const updatedItem: ChallengeParticipation = {
            ...old,
            score: bestScore,
            totalPossibleScore,
            percentage: bestPercentage,
            timeSpentSeconds: Math.min(old.timeSpentSeconds || 9999, timeSpentSeconds),
            completedAt: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }),
            answersCount,
            status,
            userAnswers: userAnswers || old.userAnswers,
            questionTimeSpent: questionTimeSpent || old.questionTimeSpent,
            awardedBadge: percentage >= 80 ? c.rewardBadge : old.awardedBadge,
          };
          updatedParticipations = [...c.participations];
          updatedParticipations[existingIndex] = updatedItem;
        } else {
          const newPart: ChallengeParticipation = {
            id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            challengeId: c.id,
            studentId,
            studentName,
            gradeLevel,
            section,
            status,
            score,
            totalPossibleScore,
            percentage,
            timeSpentSeconds,
            completedAt: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }),
            answersCount,
            awardedBadge: percentage >= 80 ? c.rewardBadge : undefined,
            userAnswers,
            questionTimeSpent,
          };
          updatedParticipations = [newPart, ...c.participations];
        }

        // Auto rank by score desc then timeSpentSeconds asc
        updatedParticipations.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timeSpentSeconds - b.timeSpentSeconds;
        });

        updatedParticipations = updatedParticipations.map((p, idx) => ({
          ...p,
          rank: idx + 1,
        }));

        return {
          ...c,
          participations: updatedParticipations,
        };
      })
    );
  };

  const updateParticipationStatus = (
    challengeId: string,
    participationId: string,
    updates: Partial<ChallengeParticipation>
  ) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        const updatedList = c.participations.map((p) => {
          if (p.id !== participationId) return p;
          const merged = { ...p, ...updates };
          if (updates.score !== undefined) {
            merged.percentage = Math.round(
              (merged.score / (merged.totalPossibleScore || c.totalPoints || 100)) * 100
            );
          }
          return merged;
        });
        return {
          ...c,
          participations: updatedList,
        };
      })
    );
  };

  const registerStudentForChallenge = (
    challengeId: string,
    studentId: string,
    studentName: string,
    gradeLevel: GradeLevel,
    section: string
  ) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        if (c.participations.some((p) => p.studentId === studentId)) return c;
        const newPart: ChallengeParticipation = {
          id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          challengeId: c.id,
          studentId,
          studentName,
          gradeLevel,
          section,
          status: 'مسجلة',
          score: 0,
          totalPossibleScore: c.totalPoints || 100,
          percentage: 0,
          timeSpentSeconds: 0,
        };
        return {
          ...c,
          participations: [newPart, ...c.participations],
        };
      })
    );
  };

  const deleteParticipation = (challengeId: string, participationId: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        return {
          ...c,
          participations: c.participations.filter((p) => p.id !== participationId),
        };
      })
    );
  };

  // Calendar Event Handlers
  const addCalendarEvent = async (newEvent: Omit<CalendarEvent, 'id'>) => {
    const created: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`,
    };
    const persisted = await persistCollectionDoc('calendarEvents', created.id, created);
    if (!persisted) return false;
    setCalendarEvents((prev) => [created, ...prev]);
  };

  const updateCalendarEvent = async (id: string, updated: Partial<CalendarEvent>) => {
    const committed = await commitEntityArrayUpdate('calendarEvents', calendarEvents, setCalendarEvents, id, (prev) => {
      const next = prev.map((evt) => (evt.id === id ? { ...evt, ...updated } : evt));
      return next;
    });
    if (!committed) return false;
  };

  const deleteCalendarEvent = async (id: string) => {
    const persisted = await deleteCollectionDoc('calendarEvents', id);
    if (!persisted) return false;

    setCalendarEvents((prev) => prev.filter((evt) => evt.id !== id));    return true;
  };

  // Hydrate stored files from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    const hydrateFiles = async () => {
      try {
        const updatedLectures = await Promise.all(
          lectures.map(async (lec) => {
            if (!lec.pdfDataUrl || lec.pdfDataUrl.startsWith('idb:')) {
              const fileRecord = await getStoredFile(lec.id);
              if (fileRecord && fileRecord.dataUrl) {
                return {
                  ...lec,
                  pdfDataUrl: fileRecord.dataUrl,
                  fileUrl: lec.fileUrl === '#' || !lec.fileUrl ? fileRecord.dataUrl : lec.fileUrl,
                };
              }
            }
            return lec;
          })
        );
        if (isMounted) {
          const hasChanges = updatedLectures.some(
            (l, idx) => l.pdfDataUrl !== lectures[idx]?.pdfDataUrl
          );
          if (hasChanges) {
            setLectures(filterRuntimeLibraryResources(updatedLectures));
          }
        }
      } catch (err) {
        console.warn('Failed to hydrate files from IndexedDB:', err);
      }
    };
    hydrateFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to LocalStorage only in explicitly-enabled development legacy mode.
  // Production security mode never persists private school records in browser localStorage.
  useEffect(() => {
    if (!LEGACY_AUTH_ENABLED) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('maysan_annual_plans_v1');
        localStorage.removeItem('maysan_daily_lesson_plans_v1');
        localStorage.removeItem('maysan_exam_schedules_v1');
      } catch { /* ignore restricted storage */ }
      return;
    }
    try {
      // Sanitize lectures for localStorage to avoid 5MB quota exhaustion
      const safeLectures = lectures.map((l) => {
        if (l.pdfDataUrl && l.pdfDataUrl.length > 500) {
          // Asynchronously persist full dataUrl to IndexedDB
          saveStoredFile(l.id, l.pdfDataUrl, {
            name: `${l.title}.pdf`,
            type: 'application/pdf',
          }).catch(console.error);

          return {
            ...l,
            pdfDataUrl: `idb:${l.id}`,
            fileUrl: l.fileUrl && l.fileUrl.length > 500 ? `idb:${l.id}` : l.fileUrl,
          };
        }
        return l;
      });

      const payload = {
        teachers,
        students,
        parents,
        supervisors,
        graduates,
        exams,
        submissions,
        attendance,
        announcements,
        messages,
        lectures: safeLectures,
        deletedLectureIds,
        deletedChallengeIds,
        timetable,
        subjectQuotas,
        financial,
        notifications,
        certificates,
        calendarEvents,
        challenges,
        ...(LEGACY_AUTH_ENABLED ? { userPasscodes } : {}),
        schoolAdminData,
        decisionSettings,
        auditLogs,
        annualPlans,
        dailyLessonPlans,
        examSchedules,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem('maysan_annual_plans_v1', JSON.stringify(annualPlans));
      localStorage.setItem('maysan_daily_lesson_plans_v1', JSON.stringify(dailyLessonPlans));
      localStorage.setItem('maysan_exam_schedules_v1', JSON.stringify(examSchedules));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [
    teachers,
    students,
    parents,
    supervisors,
    graduates,
    exams,
    submissions,
    attendance,
    announcements,
    messages,
    lectures,
    deletedLectureIds,
    deletedChallengeIds,
    timetable,
    subjectQuotas,
    financial,
    notifications,
    certificates,
    calendarEvents,
    challenges,
    schoolAdminData,
    decisionSettings,
    auditLogs,
    annualPlans,
    dailyLessonPlans,
    examSchedules,
  ]);

  // ─────────────────────────────────────────────────────────────
  // CENTRAL MULTI-USER DATA SYNCHRONIZATION (مزامنة البيانات لجميع المستخدمين)
  // ─────────────────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [syncVersion, setSyncVersion] = useState<number>(1);
  // D6-F1_SYNC_LIFECYCLE_STABILIZATION
  const syncVersionRef = useRef<number>(1);
  syncVersionRef.current = syncVersion;
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncedBy, setLastSyncedBy] = useState<{ id?: string; name?: string; role?: string } | null>(null);
  const [syncLatencyMs, setSyncLatencyMs] = useState<number>(0);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | undefined>(undefined);

  const isInitialHydrationDone = useRef<boolean>(false);
  // SECURITY_MESSAGING_USER_STATE_OVERLAY_V1_3D6C1
  const messageUserStateCacheRef = useRef<Record<string, any>>({});
  const messageUserStateOperationRef = useRef<Record<string, number>>({});
  // SECURITY_MESSAGING_USER_STATE_PENDING_GUARD_V1_3D6F2A
  // SECURITY_MESSAGING_PENDING_RECONCILE_V1_3D6F2C_STAGE0_1
  const messageUserStatePendingRef = useRef<Record<string, PendingMailboxOperation>>({});
  const messageUserStateReconcileTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const mailboxReconcileSessionRef = useRef(0);
  const pendingDirectMessagePersistRef = useRef<Record<string, DirectMessage>>({});

  const clearMailboxPendingRuntime = (messageId?: string) => {
    if (messageId) {
      clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, messageId);
      delete messageUserStatePendingRef.current[messageId];
      return;
    }
    mailboxReconcileSessionRef.current += 1;
    clearAllMailboxReconciliationTimers(messageUserStateReconcileTimersRef.current);
    messageUserStatePendingRef.current = {};
    pendingDirectMessagePersistRef.current = {};
  };


  // Warn only when a real persistence write has already started.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        !shouldWarnOnBeforeUnload({
          activePersistenceWrites: activePersistenceWriteCount(sessionAdmissionRef.current.writes),
          logoutUnloadBypass: sessionAdmissionRef.current.logoutUnloadBypass,
        })
      ) {
        return;
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Apply remote data securely to React state
  const overlayCurrentUserMessageStates = (remoteMessages: any[]) => {
    const targetUserId = getCurrentUserIdInContext();
    if (!targetUserId || !Array.isArray(remoteMessages)) return remoteMessages;
    const stateMap = messageUserStateCacheRef.current;
    return remoteMessages.map((message) => {
      if (!message || typeof message !== 'object' || !message.id) return message;
      const independentState = stateMap[message.id];
      if (!independentState) return message;
      const { messageId, ownerAuthUid, updatedAt, ...mailboxState } = independentState;
      return { ...message, userStates: { ...(message.userStates || {}), [targetUserId]: { ...(message.userStates?.[targetUserId] || {}), ...mailboxState } } };
    });
  };

  const applyRemoteData = (
    remoteData: any,
    remoteVersion: number,
    remoteLastSyncedBy?: any,
    options?: { applyMessages?: boolean }
  ) => {
    if (!remoteData || typeof remoteData !== 'object') return;

    if (Array.isArray(remoteData.teachers)) {
      authoritativeTeachersReceivedRef.current = true;
      if (!isSyncKeyPending('teachers')) setTeachers(remoteData.teachers);
    }
    let receivedParentStudentSnapshot = false;
    if (Array.isArray(remoteData.students)) {
      authoritativeStudentsReceivedRef.current = true;
      if (!isSyncKeyPending('students')) {
        setStudents(remoteData.students);
        receivedParentStudentSnapshot = true;
      }
    }
    if (Array.isArray(remoteData.parents)) {
      authoritativeParentsReceivedRef.current = true;
      if (!isSyncKeyPending('parents')) {
        setParents(remoteData.parents);
        receivedParentStudentSnapshot = true;
      }
    }
    if (receivedParentStudentSnapshot) {
      setParentStudentSelfHealGeneration((n) => n + 1);
    }
    if (Array.isArray(remoteData.supervisors)) setSupervisors(remoteData.supervisors);
    if (Array.isArray(remoteData.graduates)) {
      authoritativeGraduatesReceivedRef.current = true;
      if (!isSyncKeyPending('graduates')) setGraduates(remoteData.graduates);
    }
    if (Array.isArray(remoteData.exams)) setExams(remoteData.exams);
    if (Array.isArray(remoteData.submissions)) setSubmissions(remoteData.submissions);
    if (Array.isArray(remoteData.attendance)) setAttendance(remoteData.attendance);
    if (Array.isArray(remoteData.announcements)) setAnnouncements(remoteData.announcements);
    // SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
    if (
      options?.applyMessages !== false &&
      Array.isArray(remoteData.messages)
    ) {
      const mergedRemote = mergePendingDirectMessages(
        remoteData.messages,
        pendingDirectMessagePersistRef.current
      );
      pendingDirectMessagePersistRef.current = settlePendingDirectMessages(
        remoteData.messages,
        pendingDirectMessagePersistRef.current
      );
      setMessages(overlayCurrentUserMessageStates(mergedRemote));
    }
    if (Array.isArray(remoteData.deletedLectureIds)) {
      hydrateLibraryDeletionGuard(remoteData.deletedLectureIds);
      setDeletedLectureIds(remoteData.deletedLectureIds);
    }
    if (Array.isArray(remoteData.lectures)) {
      setLectures(filterRuntimeLibraryResources(remoteData.lectures));
    }
    if (Array.isArray(remoteData.deletedChallengeIds)) setDeletedChallengeIds(remoteData.deletedChallengeIds);
    if (Array.isArray(remoteData.timetable)) setTimetable(remoteData.timetable);
    if (Array.isArray(remoteData.subjectQuotas)) setSubjectQuotas(remoteData.subjectQuotas);
    if (Array.isArray(remoteData.financial)) setFinancial(remoteData.financial);
    if (Array.isArray(remoteData.notifications)) setNotifications(remoteData.notifications);
    if (Array.isArray(remoteData.certificates)) setCertificates(remoteData.certificates);
    if (Array.isArray(remoteData.academicEnrollments)) setAcademicEnrollments(remoteData.academicEnrollments);
    if (Array.isArray(remoteData.accelerationPolicies)) setAccelerationPolicies(remoteData.accelerationPolicies);
    if (Array.isArray(remoteData.accelerationAttempts)) setAccelerationAttempts(remoteData.accelerationAttempts);
    if (Array.isArray(remoteData.calendarEvents)) setCalendarEvents(remoteData.calendarEvents);
    if (Array.isArray(remoteData.challenges)) setChallenges(remoteData.challenges);
    // SCHOOL_ADMIN_DATA_SYNC_GUARD_V1
    if (remoteData.schoolAdminData) {
      authoritativeSchoolAdminReceivedRef.current = true;
      if (!isSyncKeyPending(SCHOOL_ADMIN_DATA_SYNC_KEY)) {
        setSchoolAdminData(remoteData.schoolAdminData);
      }
    }
    if (remoteData.decisionSettings) setDecisionSettings(remoteData.decisionSettings);
    if (remoteData.disciplinarySettings) setDisciplinarySettings(remoteData.disciplinarySettings);
    if (Array.isArray(remoteData.auditLogs)) setAuditLogs(remoteData.auditLogs);
    if (Array.isArray(remoteData.annualPlans)) setAnnualPlans(remoteData.annualPlans);
    if (Array.isArray(remoteData.dailyLessonPlans)) setDailyLessonPlans(remoteData.dailyLessonPlans);
    if (Array.isArray(remoteData.examSchedules)) setExamSchedules(remoteData.examSchedules);
    if (Array.isArray(remoteData.customFolders)) setCustomFolders(remoteData.customFolders);

    setSyncVersion(remoteVersion);
    setLastSyncedAt(new Date());
    if (remoteLastSyncedBy) setLastSyncedBy(remoteLastSyncedBy);
    setSyncStatus('synced');
  };

  // Initial Server Hydration & Seeding
  useEffect(() => {
    let isMounted = true;

    // Security Hardening V1: anonymous visitors must never hydrate private school data.
    // Public website data must live in the dedicated publicContent collection.
    if (!currentUser) {
      messageUserStateCacheRef.current = {};
      messageUserStateOperationRef.current = {};
      setNotificationUserStates({});
      clearMailboxPendingRuntime();
      isInitialHydrationDone.current = false;
      authoritativeSchoolAdminReceivedRef.current = false;
      authoritativeTeachersReceivedRef.current = false;
      authoritativeStudentsReceivedRef.current = false;
      authoritativeParentsReceivedRef.current = false;
      parentSelfHealGuardRef.current = EMPTY_PARENT_SELF_HEAL_GUARD;
      parentSelfHealInFlightRef.current = false;
      authoritativeGraduatesReceivedRef.current = false;
      setSyncStatus('synced');
      centralSyncService.stopRealtimeStream();
      return () => { isMounted = false; };
    }

    const initializeCentralSync = async () => {
      try {
        setSyncStatus('syncing');
        messageUserStateCacheRef.current = {};
        messageUserStateOperationRef.current = {};
        setNotificationUserStates({});
        clearMailboxPendingRuntime();
        try {
          messageUserStateCacheRef.current = await centralSyncService.readCurrentUserMessageStates();
        } catch (stateErr) {
          console.warn('[Messaging] Failed to load mailbox state:', stateErr);
        }
        try {
          const remoteNotifStates = await centralSyncService.readCurrentUserNotificationStates();
          if (isMounted) {
            setNotificationUserStates(mergeNotificationUserStateMaps(remoteNotifStates, {}));
          }
        } catch (stateErr) {
          console.warn('[Notifications] Failed to load user state:', stateErr);
        }
        if (!isMounted) return;
        const res = await centralSyncService.fetchServerData(undefined, true);
        if (!isMounted) return;

        if (res.success && res.data && Object.keys(res.data).length > 5) {
          applyRemoteData(res.data, res.version || 1, res.lastSyncedBy, {
            applyMessages: shouldApplyRemoteMessages({
              source: 'hydration',
              payloadHasMessages: Array.isArray(res.data.messages),
              realtimeActive: centralSyncService.isRealtimeStreamActive(),
            }),
          });
          isInitialHydrationDone.current = true;
          setSyncHydrationGeneration((n) => n + 1);
        } else {
          // Empty server: hydrate locally. Do not seed demo/default React state into Firestore.
          isInitialHydrationDone.current = true;
          setSyncHydrationGeneration((n) => n + 1);
          setSyncStatus('synced');
        }
      } catch (err: any) {
        console.warn('Initial sync error, continuing with local state:', err);
        setSyncStatus('offline');
        isInitialHydrationDone.current = true;
        setSyncHydrationGeneration((n) => n + 1);
      }
    };

    initializeCentralSync();

    // MESSAGING_REALTIME_LIFECYCLE_V1_3D4C
    // Start the Firebase realtime listeners only for an authenticated session.
    void centralSyncService.connectRealtimeStream();

    const refreshFromServer = async (force = false) => {
      if (!isInitialHydrationDone.current) return;
      if (!force && centralSyncService.isRealtimeStreamActive()) return;
      try {
        const res = await centralSyncService.fetchServerData(
          force ? undefined : syncVersionRef.current,
          force
        );
        if (!isMounted) return;
        if (res.success && !res.notModified && res.data) {
          applyRemoteData(res.data, res.version || syncVersionRef.current + 1, res.lastSyncedBy, {
            applyMessages: shouldApplyRemoteMessages({
              source: 'generic-fetch',
              payloadHasMessages: Array.isArray(res.data.messages),
              realtimeActive: centralSyncService.isRealtimeStreamActive(),
            }),
          });
        }
      } catch {
        // ignore
      }
    };

    // Real-time SSE and cross-tab sync channel
    const unsubscribeBroadcast = centralSyncService.subscribe(async (evt) => {
      if (evt.type === 'REALTIME_SERVER_UPDATE' && evt.payload) {
        // Instant Server-Sent Event push from server!
        applyRemoteData(evt.payload, evt.sourceVersion || syncVersionRef.current + 1, evt.lastSyncedBy, {
          applyMessages: shouldApplyRemoteMessages({
            source: 'realtime',
            payloadHasMessages: Array.isArray(evt.payload.messages),
            realtimeActive: centralSyncService.isRealtimeStreamActive(),
          }),
        });
      } else if (evt.type === 'DATABASE_RESET') {
        try {
          const res = await centralSyncService.fetchServerData(undefined, true);
          if (isMounted && res.success && res.data) {
            applyRemoteData(res.data, res.version || 1, res.lastSyncedBy, {
              applyMessages: shouldApplyRemoteMessages({
                source: 'generic-fetch',
                payloadHasMessages: Array.isArray(res.data.messages),
                realtimeActive: centralSyncService.isRealtimeStreamActive(),
              }),
            });
          }
        } catch {
          // ignore
        }
      } else if (evt.type === 'SERVER_DATA_UPDATED') {
        // Firestore onSnapshot already distributes canonical writes.
      } else if (evt.type === 'MESSAGE_USER_STATES_UPDATE' && evt.payload && typeof evt.payload === 'object') {
        // SECURITY_MESSAGING_USER_STATE_REALTIME_APPCONTEXT_V1_3D6F2A
        // SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
        const targetUserId = getCurrentUserIdInContext();
        if (targetUserId) {
          const remoteStates = evt.payload as Record<string, any>;
          const { merged, nextPending, confirmedIds } = mergeMessageUserStatesWithPending(
            remoteStates,
            messageUserStateCacheRef.current,
            messageUserStatePendingRef.current
          );
          confirmedIds.forEach((messageId) => {
            clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, messageId);
          });
          messageUserStatePendingRef.current = nextPending;
          messageUserStateCacheRef.current = merged;
          setMessages((prev) => overlayCurrentUserMessageStates(prev));
        }
      } else if (evt.type === 'NOTIFICATION_USER_STATES_UPDATE' && evt.payload && typeof evt.payload === 'object') {
        const uid = typeof currentUser?.authUid === 'string' ? currentUser.authUid.trim() : '';
        if (uid) {
          setNotificationUserStates((prev) => mergeNotificationUserStateMaps(evt.payload as Record<string, any>, prev));
        }
      } else if (evt.type === 'NETWORK_ONLINE') {
        setSyncStatus('synced');
        void centralSyncService.connectRealtimeStream();
        void refreshFromServer();
      } else if (evt.type === 'NETWORK_OFFLINE') {
        setSyncStatus('offline');
      }
    });

    const pollInterval = setInterval(() => {
      void refreshFromServer(false);
    }, 30000);

    const onWindowFocus = () => {
      void refreshFromServer(false);
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      isMounted = false;
      clearMailboxPendingRuntime();
      clearInterval(pollInterval);
      unsubscribeBroadcast();
      window.removeEventListener('focus', onWindowFocus);
      centralSyncService.stopRealtimeStream();
    };
  }, [currentUser?.authUid]);

  const forceSyncAll = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const fetchRes = await centralSyncService.fetchServerData(undefined, true);
      if (fetchRes.success && fetchRes.data) {
        applyRemoteData(fetchRes.data, fetchRes.version || syncVersion, fetchRes.lastSyncedBy, {
          applyMessages: shouldApplyRemoteMessages({
            source: 'generic-fetch',
            payloadHasMessages: Array.isArray(fetchRes.data.messages),
            realtimeActive: centralSyncService.isRealtimeStreamActive(),
          }),
        });
        setSyncVersion(fetchRes.version || syncVersion);
        setLastSyncedAt(new Date());
        setLastSyncedBy(fetchRes.lastSyncedBy || null);
        setSyncStatus('synced');
        setSyncErrorMessage(undefined);
        return true;
      }
      setSyncStatus('error');
      setSyncErrorMessage(fetchRes.message);
      return false;
    } catch (err: any) {
      console.warn('Manual sync failed:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message);
      return false;
    }
  };

  // Reset central database to defaults
  const resetCentralDatabase = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const resetRes = await runTrackedPersistenceWrite(
        () => centralSyncService.resetServerDatabase(),
        blockedSyncResult
      );
      if (resetRes.success) {
        resetToDefaultData();
        setSyncVersion(resetRes.version || 1);
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
        return true;
      }
      return false;
    } catch (err) {
      setSyncStatus('error');
      return false;
    }
  };

  // Ministry Decision Settings & Actions
  const updateDecisionSettings = async (updated: Partial<MinistryDecisionSettings>): Promise<boolean> => {
    const next = { ...decisionSettings, ...updated };
    const result = await runTrackedPersistenceWrite(
      () => centralSyncService.directObjectMutation('decisionSettings', next, syncSourceUser()),
      false
    );
    if (!result) return false;
    setDecisionSettings(next);
    setCertificates((certs) => certs.map((c) => computeCertificateStats(c, next)));
    return true;
  };

  const applySubjectDecisionMarks = async (certificateId: string, subjectId: string, decisionMarks: number) => {
    const committed = await commitEntityArrayUpdate('certificates', certificates, setCertificates, certificateId, (prev) => {
      const next = prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        const updatedSubjects = cert.subjects.map((s) =>
          s.id === subjectId ? { ...s, decisionMarks: Math.max(0, Math.min(10, decisionMarks)) } : s
        );
        return computeCertificateStats({ ...cert, subjects: updatedSubjects }, decisionSettings);
      });
      return next;
    });
    if (!committed) return false;
  };

  const autoOptimizeDecisionMarksForCert = async (certificateId: string) => {
    const committed = await commitEntityArrayUpdate('certificates', certificates, setCertificates, certificateId, (prev) => {
      const next = prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        return autoOptimizeDecisionMarks(cert, decisionSettings);
      });
      return next;
    });
    if (!committed) return false;
  };

  const resetDecisionMarksForCert = async (certificateId: string) => {
    const committed = await commitEntityArrayUpdate('certificates', certificates, setCertificates, certificateId, (prev) => {
      const next = prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        const clearedSubjects = cert.subjects.map((s) => ({ ...s, decisionMarks: 0 }));
        return computeCertificateStats({ ...cert, subjects: clearedSubjects }, decisionSettings);
      });
      return next;
    });
    if (!committed) return false;
  };

  // Certificate Actions
  const updateCertificate = async (id: string, updated: Partial<StudentCertificate>, persist = false) => {
    const next = ((prev: StudentCertificate[]) => {
      const next = prev.map((c) =>
        c.id === id ? computeCertificateStats({ ...c, ...updated }, decisionSettings) : c
      );
      return next;
    })(certificates);
    if (persist) {
      const committed = await persistEntityFromArray('certificates', certificates, next, id);
      if (!committed) return false;
    }
    setCertificates(next);
  };

  const updateSubjectGrade = (
    certificateId: string,
    subjectId: string,
    updated: Partial<SubjectGrade>
  ) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== certificateId) return cert;

        const subjectExistsById = cert.subjects.some((s) => s.id === subjectId);
        const subjectExistsByName = updated.subjectName
          ? cert.subjects.some(
              (s) =>
                s.subjectName.toLowerCase().trim() === updated.subjectName?.toLowerCase().trim()
            )
          : false;

        let updatedSubjects: SubjectGrade[];

        if (subjectExistsById) {
          updatedSubjects = cert.subjects.map((s) =>
            s.id === subjectId ? { ...s, ...updated } : s
          );
        } else if (subjectExistsByName && updated.subjectName) {
          updatedSubjects = cert.subjects.map((s) =>
            s.subjectName.toLowerCase().trim() === updated.subjectName?.toLowerCase().trim()
              ? { ...s, ...updated }
              : s
          );
        } else {
          // Subject does not exist yet in certificate, create a new SubjectGrade entry
          const newSub: SubjectGrade = {
            id: subjectId || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            subjectName: updated.subjectName || 'المادة الدراسية',
            firstTermAvg: updated.firstTermAvg ?? 0,
            midYearGrade: updated.midYearGrade ?? 0,
            secondTermAvg: updated.secondTermAvg ?? 0,
            annualSaeiAvg: 0,
            finalExamGrade: updated.finalExamGrade ?? 0,
            finalGrade: 0,
            resitGrade: updated.resitGrade ?? null,
            postResitGrade: 0,
            ...updated,
          };
          updatedSubjects = [...cert.subjects, newSub];
        }

        return computeCertificateStats({ ...cert, subjects: updatedSubjects }, decisionSettings);
      })
    );
  };

  const batchUpdateStudentGrades = async (
    certificateId: string,
    updatedSubjects: SubjectGrade[]
  ): Promise<boolean> => {
    let before: StudentCertificate | undefined;
    let snapshot: StudentCertificate | undefined;
    setCertificates((prev) => {
      before = prev.find((cert) => cert.id === certificateId);
      const next = prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        return computeCertificateStats({ ...cert, subjects: updatedSubjects }, decisionSettings);
      });
      snapshot = next.find((cert) => cert.id === certificateId);
      return next;
    });
    if (!snapshot) return false;
    return persistCollectionDoc('certificates', certificateId, snapshot, before);
  };

  const commitCertificate = async (certificateId: string): Promise<boolean> => {
    let before: StudentCertificate | undefined;
    setCertificates((prev) => {
      before = prev.find((cert) => cert.id === certificateId);
      return prev;
    });
    if (!before) return false;
    return persistCollectionDoc('certificates', certificateId, before);
  };

  const recalculateCertificate = async (certificateId: string) => {
    const committed = await commitEntityArrayUpdate('certificates', certificates, setCertificates, certificateId, (prev) => {
      const next = prev.map((cert) =>
        cert.id === certificateId ? computeCertificateStats(cert, decisionSettings) : cert
      );
      return next;
    });
    if (!committed) return false;
  };

  const addStudentCertificate = async (studentId: string, isBlank = false): Promise<boolean> => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const subjectsList = getSubjectsForGrade(student.gradeLevel);
    // CERTIFICATE_OFFICIAL_GRADES_ONLY_V2
    // A new official certificate starts without academic results.
    // Verified grades must be entered or imported separately.
    const defaultSubjects: SubjectGrade[] = subjectsList.map((subjectName, idx) => ({
      id: `sub-${student.id}-${idx + 1}`,
      subjectName,
      firstTermAvg: 0,
      midYearGrade: 0,
      secondTermAvg: 0,
      annualSaeiAvg: 0,
      finalExamGrade: 0,
      finalGrade: 0,
      resitGrade: null,
      postResitGrade: 0,
      decisionMarks: 0,
      isExempt: false,
      exemptionType: 'none',
      notes: '',
    }));

    const newCert: StudentCertificate = computeCertificateStats({
      id: `cert-${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      nationalId: student.nationalId,
      gradeLevel: student.gradeLevel,
      section: student.section,
      academicYear: schoolAdminData?.academicYear || '2026 - 2027',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'مؤجلة',
      appreciation: '-',
      overallFirstTermAvg: 0,
      overallMidYearGrade: 0,
      overallSecondTermAvg: 0,
      overallAnnualSaeiAvg: 0,
      overallFinalExamGrade: 0,
      overallFinalGrade: 0,
      overallPostResitAvg: 0,
      subjects: defaultSubjects,
      notes: 'نموذج شهادة رسمي جاهز للإدخال اليدوي للدرجات',
    }, decisionSettings);

    const ok = await persistCollectionDoc('certificates', newCert.id, newCert);
    if (!ok) return false;
    setCertificates((prev) => [...prev, newCert]);
    return true;
  };

  const issueCertificatesForScope = async (
    options: IssueCertificatesOptions
  ): Promise<{ totalGenerated: number; skippedCount: number; message: string }> => {
    const {
      scope,
      gradeLevel,
      section,
      studentId,
      studentIds,
      isBlankTemplate = true,
      overwriteExisting = false,
      customAcademicYear,
    } = options;

    let targetStudents: Student[] = [];

    if (scope === 'all') {
      targetStudents = [...students];
    } else if (scope === 'grade' && gradeLevel) {
      targetStudents = students.filter((s) => s.gradeLevel === gradeLevel);
    } else if (scope === 'section' && gradeLevel && section) {
      targetStudents = students.filter(
        (s) =>
          s.gradeLevel === gradeLevel &&
          (s.section === section || s.section.toLowerCase().trim() === section.toLowerCase().trim())
      );
    } else if (scope === 'student' && studentId) {
      const found = students.find((s) => s.id === studentId);
      if (found) targetStudents = [found];
    } else if (scope === 'selected' && studentIds && studentIds.length > 0) {
      targetStudents = students.filter((s) => studentIds.includes(s.id));
    }

    if (targetStudents.length === 0) {
      return {
        totalGenerated: 0,
        skippedCount: 0,
        message: 'لم يتم العثور على طالبات مسجلات في النطاق المطلوب.',
      };
    }

    let generatedCount = 0;
    let skippedCount = 0;
    const academicYear = customAcademicYear || schoolAdminData?.academicYear || '2026 - 2027';
    const normalizeAcademicYear = (value?: string) =>
      String(value || '')
        .trim()
        .replace(/\s+/g, '')
        .replace(/\//g, '-');
    const normalizedAcademicYear = normalizeAcademicYear(academicYear);
    const nowIso = new Date().toISOString().split('T')[0];

    const newOrUpdatedCerts: StudentCertificate[] = [];
    const targetStudentIds = new Set(targetStudents.map((s) => s.id));
    const targetNationalIds = new Set(
      targetStudents.map((s) => s.nationalId).filter((id): id is string => Boolean(id))
    );

    targetStudents.forEach((student, sIdx) => {
      const existingCert = certificates.find(
        (c) =>
          (c.studentId === student.id ||
            (Boolean(student.nationalId) && c.nationalId === student.nationalId)) &&
          normalizeAcademicYear(c.academicYear) === normalizedAcademicYear
      );

      if (existingCert && !overwriteExisting) {
        skippedCount++;
        return;
      }

      const subjectsList = getSubjectsForGrade(student.gradeLevel);
      // CERTIFICATE_OFFICIAL_GRADES_ONLY_V2
      // Bulk issuance creates empty official certificate records only.
      // Never derive subject grades from student.gpa.
      const subjects: SubjectGrade[] = subjectsList.map((subjectName, idx) => ({
        id: `sub-${student.id}-${idx + 1}`,
        subjectName,
        firstTermAvg: 0,
        midYearGrade: 0,
        secondTermAvg: 0,
        annualSaeiAvg: 0,
        finalExamGrade: 0,
        finalGrade: 0,
        resitGrade: null,
        postResitGrade: 0,
        decisionMarks: 0,
        isExempt: false,
        exemptionType: 'none',
        notes: '',
      }));

      const rawCert: StudentCertificate = {
        id: existingCert && overwriteExisting ? existingCert.id : `cert-${student.id}-${Date.now()}-${sIdx}`,
        studentId: student.id,
        studentName: student.name,
        nationalId: student.nationalId,
        gradeLevel: student.gradeLevel,
        section: student.section,
        academicYear,
        issueDate: nowIso,
        certificateModel: options.targetModel || 'model3_final_round1',
        status: 'مؤجلة',
        appreciation: '-',
        overallFirstTermAvg: 0,
        overallMidYearGrade: 0,
        overallSecondTermAvg: 0,
        overallAnnualSaeiAvg: 0,
        overallFinalExamGrade: 0,
        overallFinalGrade: 0,
        overallPostResitAvg: 0,
        subjects,
        notes: 'نموذج شهادة رسمي جاهز للإدخال اليدوي للدرجات',
      };

      const computed = computeCertificateStats(rawCert, decisionSettings);
      newOrUpdatedCerts.push(computed);
      generatedCount++;
    });

    const persistenceResults = await Promise.all(
      newOrUpdatedCerts.map((cert) => persistCollectionDoc('certificates', cert.id, cert))
    );
    if (!persistenceResults.every(Boolean)) {
      return { totalGenerated: 0, skippedCount, message: 'تعذر حفظ الشهادات في قاعدة البيانات. لم يتم اعتماد العملية.' };
    }

    setCertificates((prev) => {
      if (overwriteExisting) {
        const remaining = prev.filter((c) => {
          const belongsToTargetStudent =
            targetStudentIds.has(c.studentId) ||
            (Boolean(c.nationalId) && targetNationalIds.has(c.nationalId));

          const belongsToTargetAcademicYear =
            normalizeAcademicYear(c.academicYear) === normalizedAcademicYear;

          return !(belongsToTargetStudent && belongsToTargetAcademicYear);
        });
        return [...remaining, ...newOrUpdatedCerts];
      }
      return [...prev, ...newOrUpdatedCerts];
    });

    const scopeNameAr =
      scope === 'all'
        ? 'جميع طالبات المدرسة'
        : scope === 'grade'
        ? `طالبات ${gradeLevel}`
        : scope === 'section'
        ? `طالبات ${gradeLevel} (شعبة ${section})`
        : 'الطالبات المحددة';

    const message = `تم إصدار (${generatedCount}) شهادة مدرسية لـ (${scopeNameAr}) بنجاح.${
      skippedCount > 0 ? ` (تم تخطي ${skippedCount} طالبة لديهن شهادات مسبقة).` : ''
    }`;

    return { totalGenerated: generatedCount, skippedCount, message };
  };

  const deleteCertificate = async (id: string): Promise<boolean> => {
    const ok = await deleteCollectionDoc('certificates', id);
    if (!ok) return false;
    setCertificates((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  const deleteMultipleCertificates = async (ids: string[]): Promise<boolean> => {
    const results = await Promise.all(ids.map((id) => deleteCollectionDoc('certificates', id)));
    if (!results.every(Boolean)) return false;
    const idSet = new Set(ids);
    setCertificates((prev) => prev.filter((c) => !idSet.has(c.id)));
    return true;
  };

  const deleteCertificatesForScope = async (options: {
    scope: 'all' | 'grade' | 'section' | 'student';
    gradeLevel?: GradeLevel;
    section?: string;
    studentId?: string;
  }): Promise<{ deletedCount: number; message: string }> => {
    const { scope, gradeLevel, section, studentId } = options;
    const initialCount = certificates.length;
    let remaining = [...certificates];
    if (scope === 'all') remaining = [];
    else if (scope === 'grade' && gradeLevel) remaining = certificates.filter((c) => c.gradeLevel !== gradeLevel);
    else if (scope === 'section' && gradeLevel && section) remaining = certificates.filter((c) => !(c.gradeLevel === gradeLevel && (c.section === section || c.section?.toLowerCase().trim() === section.toLowerCase().trim())));
    else if (scope === 'student' && studentId) remaining = certificates.filter((c) => c.studentId !== studentId && c.id !== studentId);

    const remainingIds = new Set(remaining.map((certificate) => certificate.id));
    const certificatesToDelete = certificates.filter((certificate) => !remainingIds.has(certificate.id));
    const results = await Promise.all(certificatesToDelete.map((certificate) => deleteCollectionDoc('certificates', certificate.id)));
    if (!results.every(Boolean)) return { deletedCount: 0, message: 'تعذر حذف الشهادات من قاعدة البيانات. لم يتم اعتماد العملية.' };
    const deletedCount = initialCount - remaining.length;
    setCertificates(remaining);
    return { deletedCount, message: `تم حذف (${deletedCount}) شهادة مدرسية بنجاح.` };
  };

  const clearAllCertificates = async (): Promise<boolean> => {
    const results = await Promise.all(certificates.map((certificate) => deleteCollectionDoc('certificates', certificate.id)));
    if (!results.every(Boolean)) return false;
    setCertificates([]);
    return true;
  };

  // Password / Passcode Management Action - STRICT PER-USER ISOLATION
  const changePassword = (
    targetRole: UserRole,
    oldPass: string,
    newPass: string,
    options?: { targetUserId?: string; accountName?: string; userKey?: string }
  ): { success: boolean; message: string } => {
    const cleanOld = oldPass.trim();
    const cleanNew = newPass.trim();
    const specificKey = options?.userKey || options?.targetUserId || currentUser?.id || (targetRole === 'admin' ? 'admin-main' : undefined);

    // Determine current passcode specifically for this user account
    const currentPass =
      (specificKey && userPasscodes[specificKey]) ||
      (targetRole === 'admin' ? (userPasscodes['admin-main'] || userPasscodes['admin']) : undefined) ||
      '1234';

    // Verify current password strictly for this account
    if (cleanOld !== currentPass && cleanOld !== '1234') {
      return {
        success: false,
        message:
          lang === 'ar'
            ? 'كلمة المرور الحالية غير صحيحة، يرجى إدخال الرمز السري الحالي الصحيح لهذا الحساب.'
            : 'Current password is incorrect for this account.',
      };
    }

    if (!cleanNew || cleanNew.length < 4) {
      return {
        success: false,
        message:
          lang === 'ar'
            ? 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات أو رموز على الأقل.'
            : 'New password must be at least 4 characters long.',
      };
    }

    // Save passcode strictly for this individual user's key - NEVER overwrite other users or the general role group!
    setUserPasscodes((prev) => {
      const updated = { ...prev };
      if (specificKey) {
        updated[specificKey] = cleanNew;
      }
      if (targetRole === 'admin' || specificKey === 'admin' || specificKey === 'admin-main') {
        updated['admin'] = cleanNew;
        updated['admin-main'] = cleanNew;
      }
      return updated;
    });

    const roleTitles: Record<UserRole, string> = {
      admin: 'المديرة والإدارة المدرسية',
      teacher: 'الهيئة التدريسية',
      student: 'طالبات المتميزات',
      parent: 'أولياء الأمور',
      supervisor: 'المشرف التربوي',
      guest: 'زائر',
    };

    const targetUserId = options?.targetUserId || currentUser?.id || `user-${targetRole}`;
    const ownerName = options?.accountName || currentUser?.name || roleTitles[targetRole];
    const nowIso = new Date().toISOString();

    // STRICTLY TARGETED NOTIFICATION - Only for the account owner!
    const newNotif: NotificationItem = {
      id: `notif-sec-${Date.now()}`,
      type: 'security',
      title: lang === 'ar' ? '🔒 تنبيه أمني: تم تغيير كلمة السر لحسابك' : '🔒 Security Alert: Your Password Was Changed',
      message:
        lang === 'ar'
          ? `عزيزي/عزيزتي (${ownerName})، تم بنجاح تحديث وتغيير كلمة السر الخاصة بحسابك الفردي دون التأثير على بقية المستخدمين. تم تفعيل الرمز الجديد لحمايتك وأمان بياناتك.`
          : `Security Alert: The password for your individual account (${ownerName}) was changed successfully without affecting other users.`,
      createdAt: nowIso.replace('T', ' ').substring(0, 16),
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
      targetRole: targetRole,
      targetUserId: targetUserId,
      targetTeacherId: targetRole === 'teacher' ? targetUserId : undefined,
      targetStudentId: targetRole === 'student' ? targetUserId : undefined,
      targetParentId: targetRole === 'parent' ? targetUserId : undefined,
      isPrivateAccountSecurity: true, // STRICTLY isolated to this user account!
    };

    addNotification(newNotif);

    return {
      success: true,
      message:
        lang === 'ar'
          ? 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح وحفظ الرمز الجديد بأمان تام دون التأثير على بقية المستخدمين! 🔒'
          : 'Password changed successfully for your account without affecting other users!',
    };
  };

  const resetPassword = (
    targetRole: UserRole,
    newPass: string,
    contactInfo?: string,
    options?: { targetUserId?: string; accountName?: string; userKey?: string }
  ): { success: boolean; message: string } => {
    const cleanNew = newPass.trim();
    if (!cleanNew || cleanNew.length < 4) {
      return {
        success: false,
        message:
          lang === 'ar'
            ? 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.'
            : 'New password must be at least 4 characters long.',
      };
    }

    const specificKey = options?.userKey || options?.targetUserId || currentUser?.id || (targetRole === 'admin' ? 'admin-main' : undefined);

    setUserPasscodes((prev) => {
      const updated = { ...prev };
      if (specificKey) {
        updated[specificKey] = cleanNew;
      }
      if (targetRole === 'admin' || specificKey === 'admin' || specificKey === 'admin-main') {
        updated['admin'] = cleanNew;
        updated['admin-main'] = cleanNew;
      }
      return updated;
    });

    const roleTitles: Record<UserRole, string> = {
      admin: 'المديرة والإدارة المدرسية',
      teacher: 'الهيئة التدريسية',
      student: 'طالبات المتميزات',
      parent: 'أولياء الأمور',
      supervisor: 'المشرف التربوي',
      guest: 'زائر',
    };

    const targetUserId = options?.targetUserId || currentUser?.id || `user-${targetRole}`;
    const ownerName = options?.accountName || currentUser?.name || roleTitles[targetRole];
    const nowIso = new Date().toISOString();

    // STRICTLY TARGETED NOTIFICATION - Only for the account owner!
    const newNotif: NotificationItem = {
      id: `notif-sec-reset-${Date.now()}`,
      type: 'security',
      title: lang === 'ar' ? '🔑 تنبيه أمني: تم إعادة تعيين كلمة السر' : '🔑 Security: Password Reset',
      message:
        lang === 'ar'
          ? `عزيزي/عزيزتي (${ownerName})، تمت إعادة تعيين كلمة السر الخاصة بحسابك الفردي بنجاح عبر التحقق من (${contactInfo || 'البريد/الهاتف'}).`
          : `Password reset successfully for individual account (${ownerName}) via verified contact (${contactInfo || 'Email/Phone'}).`,
      createdAt: nowIso.replace('T', ' ').substring(0, 16),
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
      targetRole: targetRole,
      targetUserId: targetUserId,
      targetTeacherId: targetRole === 'teacher' ? targetUserId : undefined,
      targetStudentId: targetRole === 'student' ? targetUserId : undefined,
      targetParentId: targetRole === 'parent' ? targetUserId : undefined,
      isPrivateAccountSecurity: true, // STRICTLY isolated to this user account!
    };

    addNotification(newNotif);

    return {
      success: true,
      message:
        lang === 'ar'
          ? 'تمت إعادة تعيين كلمة المرور لحسابك الفردي بنجاح! يمكنكِ الآن الدخول باستخدام كلمة المرور الجديدة.'
          : 'Password reset successfully! You can now log in with your new password.',
    };
  };

  // Helper to read passcode for any user or role (strictly isolated per userKey)
  const getUserPasscode = (userKey: string, fallbackRole?: UserRole): string => {
    if (!LEGACY_AUTH_ENABLED) return '••••••••';
    if (userPasscodes && userPasscodes[userKey]) {
      return userPasscodes[userKey];
    }
    if (userKey === 'admin' || userKey === 'admin-main' || fallbackRole === 'admin') {
      if (userPasscodes && (userPasscodes['admin-main'] || userPasscodes['admin'])) {
        return userPasscodes['admin-main'] || userPasscodes['admin'];
      }
    }
    return '1234';
  };

  // Exclusive Admin function to update passcodes for any user or role directly
  const adminUpdateUserPasscode = (
    userKey: string,
    newPasscode: string,
    options?: {
      userName?: string;
      userRole?: UserRole;
      userIdentifier?: string;
      sendNotification?: boolean;
    }
  ): { success: boolean; message: string } => {
    if (!LEGACY_AUTH_ENABLED) {
      return { success: false, message: lang === 'ar' ? 'إدارة كلمات المرور المحلية معطلة. استخدم Firebase Authentication.' : 'Legacy local password management is disabled.' };
    }
    if (role !== 'admin') {
      return {
        success: false,
        message: lang === 'ar' ? 'هذا الإجراء متاح حصرياً للمديرة والإدارة المدرسية.' : 'Admin access required.',
      };
    }
    const cleanNew = newPasscode.trim();
    if (!cleanNew || cleanNew.length < 3) {
      return {
        success: false,
        message: lang === 'ar' ? 'يجب أن يتكون الرمز السري من 3 خانات أو أكثر.' : 'Passcode must be at least 3 characters long.',
      };
    }

    setUserPasscodes((prev) => {
      const updated = {
        ...prev,
        [userKey]: cleanNew,
      };
      if (userKey === 'admin' || userKey === 'admin-main') {
        updated['admin'] = cleanNew;
        updated['admin-main'] = cleanNew;
      }
      return updated;
    });

    const targetRole = options?.userRole || (['admin', 'teacher', 'student', 'parent', 'supervisor'].includes(userKey) ? (userKey as UserRole) : undefined);
    const targetUserName = options?.userName || userKey;

    // Log this action in Audit Logs
    addAuditLog({
      action: `تعديل الرمز السري للدخول للحساب (${targetUserName})`,
      actionType: 'update',
      targetCategory: 'users',
      targetId: userKey,
      targetName: targetUserName,
      details: `تم تحديث الرمز السري من قبل المديرة / الإدارة المدرسية للحساب (${targetUserName}) - المعرف: ${options?.userIdentifier || userKey}`,
      severity: 'warning',
    });

    if (options?.sendNotification !== false && targetRole) {
      const roleTitles: Record<UserRole, string> = {
        admin: 'المديرة والإدارة المدرسية',
        teacher: 'الهيئة التدريسية',
        student: 'طالبات المتميزات',
        parent: 'أولياء الأمور',
      supervisor: 'المشرف التربوي',
      guest: 'زائر',
    };
      const nowIso = new Date().toISOString();
      const newNotif: NotificationItem = {
        id: `notif-admin-pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'security',
        title: lang === 'ar' ? '🔑 إشعار إداري: تم تحديث رمز المرور لحسابك' : '🔑 Admin Notice: Account Passcode Updated',
        message:
          lang === 'ar'
            ? `عزيزي/عزيزتي (${targetUserName})، قامت إدارة المدرسة بتحديث الرمز السري الخاص بحسابك (${roleTitles[targetRole] || targetRole}). يرجى التواصل مع الإدارة لاستلام الرمز الجديد لحسابك.`
            : `School administration updated the login passcode for your account (${targetUserName}).`,
        createdAt: nowIso.replace('T', ' ').substring(0, 16),
        timestamp: lang === 'ar' ? 'الآن' : 'Just now',
        isRead: false,
        targetRole: targetRole,
        targetUserId: userKey,
        targetTeacherId: targetRole === 'teacher' ? userKey : undefined,
        targetStudentId: targetRole === 'student' ? userKey : undefined,
        targetParentId: targetRole === 'parent' ? userKey : undefined,
        isPrivateAccountSecurity: true,
      };
      addNotification(newNotif);
    }

    return {
      success: true,
      message:
        lang === 'ar'
          ? `تم تحديث وحفظ الرمز السري للحساب (${targetUserName}) بنجاح! 🔒`
          : `Passcode for (${targetUserName}) updated successfully!`,
    };
  };

  const adminResetUserPasscode = (
    userKey: string,
    defaultPasscode: string = '1234',
    options?: { userName?: string; userRole?: UserRole; userIdentifier?: string }
  ): { success: boolean; message: string } => {
    return adminUpdateUserPasscode(userKey, defaultPasscode, {
      ...options,
      sendNotification: true,
    });
  };

  const updateDisciplinarySettings = async (updated: Partial<DisciplinarySettings>): Promise<boolean> => {
    const finalSettings: DisciplinarySettings = { ...disciplinarySettings, ...updated };
    const persisted = await runTrackedPersistenceWrite(
      () => centralSyncService.directObjectMutation('disciplinarySettings', finalSettings, syncSourceUser()),
      false
    );
    if (!persisted) return false;
    setDisciplinarySettings(finalSettings);
    await recalculateStudentAbsenceStats(undefined, finalSettings);
    addAuditLog({
      action: 'تحديث إعدادات الانضباط والغياب',
      actionType: 'update',
      targetCategory: 'system',
      targetId: 'disciplinary-settings',
      targetName: 'إعدادات الانضباط',
      details: 'تم تعديل قوانين الحضور والإنذارات بنجاح',
      severity: 'warning'
    });
    return true;
  };


  // Document RTL/LTR Direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);
  const t = translations[lang];

  const isAdminActor = () => role === 'admin' && currentUser?.role === 'admin';

  const blockedAcademicWrite = (): AcademicTransitionResult => ({
    success: false,
    code: 'FORBIDDEN',
    message: 'هذه العملية الأكاديمية مخصصة للإدارة فقط.',
  });

  const executeStudentRepeatYear = async (input: {
    studentId: string;
    actorId?: string;
  }): Promise<AcademicTransitionResult> => {
    if (!isAdminActor()) return blockedAcademicWrite();
    if (!isInitialHydrationDone.current) {
      return { success: false, message: 'تعذر التنفيذ قبل اكتمال تحميل البيانات.' };
    }
    return executeStudentRepeatYearTx({
      studentId: input.studentId,
      actorId: input.actorId || currentUser?.id,
    });
  };

  const executeStudentRegularPromotion = async (input: {
    studentId: string;
    actorId?: string;
    isSecondRound?: boolean;
  }): Promise<AcademicTransitionResult> => {
    if (!isAdminActor()) return blockedAcademicWrite();
    if (!isInitialHydrationDone.current) {
      return { success: false, message: 'تعذر التنفيذ قبل اكتمال تحميل البيانات.' };
    }
    return executeStudentRegularPromotionTx({
      studentId: input.studentId,
      actorId: input.actorId || currentUser?.id,
      isSecondRound: input.isSecondRound,
    });
  };

  const executeStudentAccelerationPromotion = async (input: {
    studentId: string;
    attemptId: string;
    actorId?: string;
  }): Promise<AcademicTransitionResult> => {
    if (!isAdminActor()) return blockedAcademicWrite();
    if (!isInitialHydrationDone.current) {
      return { success: false, message: 'تعذر التنفيذ قبل اكتمال تحميل البيانات.' };
    }
    return executeStudentAccelerationPromotionTx({
      studentId: input.studentId,
      attemptId: input.attemptId,
      actorId: input.actorId || currentUser?.id,
    });
  };

  const upsertAccelerationPolicy = async (policy: AccelerationPolicy): Promise<boolean> => {
    if (!isAdminActor() || !policy?.id) {
      console.warn('[SECURITY] Blocked unauthorized acceleration policy write.');
      return false;
    }
    const previous = accelerationPolicies.find((row) => row.id === policy.id);
    const ok = await persistCollectionDoc('accelerationPolicies', policy.id, policy, previous);
    if (ok) {
      setAccelerationPolicies((prev) => {
        const index = prev.findIndex((row) => row.id === policy.id);
        if (index === -1) return [policy, ...prev];
        const next = [...prev];
        next[index] = policy;
        return next;
      });
    }
    return ok;
  };

  const deleteAccelerationPolicy = async (policyId: string): Promise<boolean> => {
    if (!isAdminActor() || !policyId) {
      console.warn('[SECURITY] Blocked unauthorized acceleration policy delete.');
      return false;
    }
    try {
      // Client/domain guard only. Authoritative server-side/transactional
      // referential enforcement for policy–attempt links is a future hardening item.
      assertPolicyDeletable(policyId, accelerationAttempts);
    } catch (error) {
      console.warn('[Academic] Policy delete blocked:', error);
      return false;
    }
    const ok = await deleteCollectionDoc('accelerationPolicies', policyId);
    if (ok) {
      setAccelerationPolicies((prev) => prev.filter((row) => row.id !== policyId));
    }
    return ok;
  };

  const upsertAccelerationAttempt = async (attempt: AccelerationAttempt): Promise<boolean> => {
    if (!isAdminActor() || !attempt?.id) {
      console.warn('[SECURITY] Blocked unauthorized acceleration attempt write.');
      return false;
    }
    const previous = accelerationAttempts.find((row) => row.id === attempt.id);
    const lockedByTransition = Boolean(
      previous && (previous.status === 'approved' || previous.resultingEnrollmentId)
    );
    const toPersist: AccelerationAttempt = !previous
      ? {
          ...(({ resultingEnrollmentId: _ignored, ...rest }) => rest)(attempt),
          status: attempt.status === 'approved' ? 'nominated' : attempt.status,
        }
      : lockedByTransition
        ? {
            ...previous,
            updatedAt: attempt.updatedAt || previous.updatedAt,
          }
        : {
            ...attempt,
            studentId: previous.studentId,
            policyId: previous.policyId,
            sourceEnrollmentId: previous.sourceEnrollmentId,
            sourceGradeLevel: previous.sourceGradeLevel,
            targetExamGradeLevel: previous.targetExamGradeLevel,
            resultingGradeLevel: previous.resultingGradeLevel,
            policySnapshot: previous.policySnapshot,
            createdAt: previous.createdAt,
            resultingEnrollmentId: previous.resultingEnrollmentId,
          };
    const ok = await persistCollectionDoc('accelerationAttempts', toPersist.id, toPersist, previous);
    if (ok) {
      setAccelerationAttempts((prev) => {
        const index = prev.findIndex((row) => row.id === toPersist.id);
        if (index === -1) return [toPersist, ...prev];
        const next = [...prev];
        next[index] = toPersist;
        return next;
      });
    }
    return ok;
  };

  const publishHonorFromLists = async (nextStudents: Student[], nextGraduates: GraduateStudent[]) => {
    if (!isAdminActor()) return;
    await publishPublicHonorBoard(buildPublicHonorBoard(nextStudents, nextGraduates));
  };

  // Actions
  const addTeacher = async (data: Omit<Teacher, 'id' | 'status' | 'joinedDate'>): Promise<boolean> => {
    if (!isAdminActor()) {
      console.warn('[SECURITY] Blocked unauthorized teacher create.');
      return false;
    }
    if (!isInitialHydrationDone.current) return false;
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newTeacher: Teacher = {
      ...data,
      id: `tech-${Date.now()}-${randSuffix}`,
      status: 'نشط',
      joinedDate: new Date().toISOString().split('T')[0],
      rating: 5.0,
    };
    const previous = teachersRef.current;
    const updated = [newTeacher, ...previous];
    const token = beginPendingSyncMutation('teachers');
    setTeachers(updated);
    teachersRef.current = updated;
    try {
      const ok = await persistCollectionDoc('teachers', newTeacher.id, newTeacher);
      if (!ok) {
        setTeachers(previous);
        teachersRef.current = previous;
        return false;
      }
      await publishPublicFaculty(updated);
      addAuditLog({
        action: `إضافة مدرسة جديدة: ${newTeacher.name}`,
        actionType: 'create',
        targetCategory: 'teachers',
        targetId: newTeacher.id,
        targetName: newTeacher.name,
        details: `تمت إضافة المدرسة لتدريس مادة (${newTeacher.subject}) للصفوف (${(newTeacher.assignedGrades || []).join('، ')})`,
        severity: 'success',
      });
      const notif: NotificationItem = {
        id: `notif-${Date.now()}-${randSuffix}`,
        title: lang === 'ar' ? 'انضمام مدرسة جديدة للهيئة التدريسية' : 'New Faculty Member Added',
        message: `${newTeacher.name} - ${newTeacher.subject}`,
        type: 'info',
        timestamp: lang === 'ar' ? 'الآن' : 'Just now',
        isRead: false,
      };
      addNotification(notif);
      return true;
    } finally {
      settlePendingSyncMutation('teachers', token);
    }
  };

  const identityRecords = (): IdentityRecord[] => [
    ...students.map((x) => ({ id: x.id, role: 'student' as const, email: x.email, phone: x.phone, nationalId: x.nationalId })),
    ...teachers.map((x) => ({ id: x.id, role: 'teacher' as const, email: x.email, phone: x.phone, nationalId: x.nationalId })),
    ...parents.map((x) => ({ id: x.id, role: 'parent' as const, email: x.email, phone: x.phone, nationalId: x.nationalId })),
    ...supervisors.map((x: any) => ({ id: x.id, role: 'supervisor' as const, email: x.email, phone: x.phone, nationalId: x.nationalId })),
  ];

  const addStudent = async (data: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }): Promise<boolean> => {
    if (!isAdminActor() || !isInitialHydrationDone.current) return false;
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const parentId = `prt-${Date.now()}-${randSuffix}`;
    const studentId = `std-${Date.now()}-${randSuffix}`;
    const existingIdentities = identityRecords();
    assertUniqueIdentity({ id: studentId, role: 'student', email: data.email, phone: data.phone, nationalId: data.nationalId }, existingIdentities);
    assertUniqueIdentity({ id: parentId, role: 'parent', email: data.parentEmail, phone: data.parentPhone }, existingIdentities);
    const newStudent: Student = { ...data, id: studentId, username: stableUsername('student', studentId), parentId, status: 'منتظمة', enrollmentYear: data.enrollmentYear?.trim() || '2026' };
    const newParent: Parent = { id: parentId, username: stableUsername('parent', parentId), name: data.parentName, phone: data.parentPhone, email: data.parentEmail, studentId, studentName: newStudent.name, gradeLevel: newStudent.gradeLevel, studentSection: newStudent.section };
    const fin: FinancialRecord = { id: `fin-${Date.now()}-${randSuffix}`, studentId, studentName: newStudent.name, gradeLevel: newStudent.gradeLevel, feeType: 'رسوم التسجيل والكتب', totalAmount: 120000, paidAmount: 0, status: 'غير مدفوع', dueDate: '2026-09-01' };

    const studentOk = await persistCollectionDoc('students', studentId, newStudent);
    if (!studentOk) return false;
    const parentOk = await persistCollectionDoc('parents', parentId, newParent);
    if (!parentOk) { await deleteCollectionDoc('students', studentId); return false; }
    const financialOk = await persistCollectionDoc('financial', fin.id, fin);
    if (!financialOk) {
      await Promise.all([deleteCollectionDoc('students', studentId), deleteCollectionDoc('parents', parentId)]);
      return false;
    }

    const nextStudents = [newStudent, ...studentsRef.current];
    setStudents(nextStudents); studentsRef.current = nextStudents;
    setParents((prev) => [newParent, ...prev]);
    setFinancial((prev) => [fin, ...prev]);
    await publishHonorFromLists(nextStudents, graduatesRef.current);
    addAuditLog({ action: `تسجيل طالبة جديدة: ${newStudent.name}`, actionType: 'create', targetCategory: 'students', targetId: studentId, targetName: newStudent.name, details: `تسجيل الطالبة في ${newStudent.gradeLevel} - شعبة (${newStudent.section}) مع ربط حساب ولي الأمر (${data.parentName})`, severity: 'success' });
    addNotification({ id: `notif-${Date.now()}-${randSuffix}`, title: lang === 'ar' ? 'تسجيل طالبة جديدة بالمدرسة' : 'New Gifted Student Registered', message: `${newStudent.name} (${newStudent.gradeLevel})`, type: 'success', timestamp: lang === 'ar' ? 'الآن' : 'Just now', isRead: false });
    return true;
  };

  // User Management Implementations
  const updateTeacher = async (id: string, updateData: Partial<Teacher>): Promise<boolean> => {
    // SECURITY_TEACHER_PROFILE_ADMIN_MANAGED_V1
    if (!isAdminActor()) {
      console.warn('[SECURITY] Blocked unauthorized teacher profile update.');
      return false;
    }
    if (!isInitialHydrationDone.current) return false;
    const previous = teachersRef.current;
    const target = previous.find((t) => t.id === id);
    if (!target) return false;
    const updatedArray = previous.map((t) => (t.id === id ? { ...t, ...updateData } : t));
    const token = beginPendingSyncMutation('teachers');
    setTeachers(updatedArray);
    teachersRef.current = updatedArray;
    try {
      const ok = await persistCollectionDoc('teachers', id, updatedArray.find((t) => t.id === id), target);
      if (!ok) {
        setTeachers(previous);
        teachersRef.current = previous;
        return false;
      }
      await publishPublicFaculty(updatedArray);
      addAuditLog({
        action: `تعديل بيانات المدرسة: ${target.name || id}`,
        actionType: 'update',
        targetCategory: 'teachers',
        targetId: id,
        targetName: target.name || id,
        details: `تم تحديث السجل والبيانات للمدرسة (${target.name})`,
        severity: 'info',
      });
      return true;
    } finally {
      settlePendingSyncMutation('teachers', token);
    }
  };

  const deleteTeacher = async (id: string): Promise<boolean> => {
    if (!isAdminActor()) {
      console.warn('[SECURITY] Blocked unauthorized teacher delete.');
      return false;
    }
    if (!isInitialHydrationDone.current) return false;
    const previous = teachersRef.current;
    const target = previous.find((t) => t.id === id);
    const updated = previous.filter((t) => t.id !== id);
    const token = beginPendingSyncMutation('teachers');
    setTeachers(updated);
    teachersRef.current = updated;
    try {
      const ok = await deleteCollectionDoc('teachers', id);
      if (!ok) {
        setTeachers(previous);
        teachersRef.current = previous;
        return false;
      }
      await publishPublicFaculty(updated);
      setUserPasscodes((prev) => {
        const copy = { ...prev };
        delete copy[`teacher-${id}`];
        return copy;
      });
      addAuditLog({
        action: `حذف حساب مدرسة: ${target?.name || id}`,
        actionType: 'delete',
        targetCategory: 'teachers',
        targetId: id,
        targetName: target?.name || id,
        details: `تم حذف حساب وبيانات المدرسة (${target?.name}) نهائياً من النظام`,
        severity: 'danger',
      });
      return true;
    } finally {
      settlePendingSyncMutation('teachers', token);
    }
  };

  const updateStudent = async (id: string, updated: Partial<Student>): Promise<boolean> => {
    if (!isAdminActor()) {
      console.warn('[SECURITY] Blocked unauthorized student update.');
      return false;
    }
    if (!isInitialHydrationDone.current) return false;
    const previousStudents = studentsRef.current;
    const currentStudent = previousStudents.find((s) => s.id === id);
    if (!currentStudent) return false;

    let targetStudent = { ...currentStudent, ...updated, username: currentStudent.username || stableUsername('student', id) };
    assertUniqueIdentity({ id, role: 'student', email: targetStudent.email, phone: targetStudent.phone, nationalId: targetStudent.nationalId }, identityRecords(), id);
    const existingParent = parents.find((p) => p.id === targetStudent.parentId || p.studentId === id);
    if (existingParent) {
      assertUniqueIdentity({ id: existingParent.id, role: 'parent', email: targetStudent.parentEmail, phone: targetStudent.parentPhone, nationalId: existingParent.nationalId }, identityRecords(), existingParent.id);
    }
    const studentName = targetStudent.name || id;

    let parentFound = false;
    let newParentId = targetStudent.parentId;
    let updatedParents = parents.map((p) => {
        if (p.id === targetStudent.parentId || p.studentId === id) {
            parentFound = true;
            return {
                ...p,
                username: p.username || stableUsername('parent', p.id),
                name: targetStudent.parentName,
                phone: targetStudent.parentPhone,
                email: targetStudent.parentEmail,
                studentName: targetStudent.name,
                gradeLevel: targetStudent.gradeLevel,
                studentSection: targetStudent.section,
            };
        }
        return p;
    });

    if (!parentFound && (targetStudent.parentName || targetStudent.parentPhone)) {
        newParentId = targetStudent.parentId || `prt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newParent = {
            id: newParentId,
            username: stableUsername('parent', newParentId),
            name: targetStudent.parentName || '',
            phone: targetStudent.parentPhone || '',
            email: targetStudent.parentEmail || '',
            studentId: targetStudent.id,
            studentName: targetStudent.name,
            gradeLevel: targetStudent.gradeLevel,
            studentSection: targetStudent.section,
        };
        updatedParents = [newParent as any, ...updatedParents];
        targetStudent.parentId = newParentId;
    }

    const updatedStudents = previousStudents.map((s) => (s.id === id ? targetStudent : s));

    let updatedFin = [...financial];
    const hasFin = updatedFin.some((f) => f.studentId === id);
    if (!hasFin) {
        const randSuffix = Math.random().toString(36).substring(2, 7);
        const fin = {
            id: `fin-${Date.now()}-${randSuffix}`,
            studentId: targetStudent.id,
            studentName: targetStudent.name,
            gradeLevel: targetStudent.gradeLevel,
            feeType: 'رسوم التسجيل والكتب',
            totalAmount: 120000,
            paidAmount: 0,
            status: 'غير مدفوع' as const,
            dueDate: '2026-09-01',
        };
        updatedFin = [fin, ...updatedFin];
    }

    const token = beginPendingSyncMutation('students');
    setStudents(updatedStudents);
    studentsRef.current = updatedStudents;
    try {
      const ok = await persistCollectionDoc('students', id, targetStudent, currentStudent);
      if (!ok) {
        setStudents(previousStudents);
        studentsRef.current = previousStudents;
        return false;
      }

      setParents(updatedParents);
      const linkedParent = updatedParents.find((p) => p.id === targetStudent.parentId || p.studentId === id);
      if (linkedParent) {
        const previousParent = parents.find((p) => p.id === linkedParent.id);
        const parentOk = await persistCollectionDoc('parents', linkedParent.id, linkedParent, previousParent);
        if (!parentOk) return false;
      }

      if (!hasFin) {
        setFinancial(updatedFin);
        const newFinancial = updatedFin.find((item) => !financial.some((old) => old.id === item.id));
        if (newFinancial) {
          const financialOk = await persistCollectionDoc('financial', newFinancial.id, newFinancial);
          if (!financialOk) return false;
        }
      }

      await publishHonorFromLists(updatedStudents, graduatesRef.current);

      addAuditLog({
        action: `تعديل بيانات الطالبة: ${studentName}`,
        actionType: updated.status ? 'status_change' : 'update',
        targetCategory: 'students',
        targetId: id,
        targetName: studentName,
        details: updated.status
          ? `تعديل حالة الطالبة (${studentName}) إلى [${updated.status}]`
          : `تحديث بيانات ومعلومات الطالبة (${studentName})`,
        severity: 'info',
      });
      return true;
    } finally {
      settlePendingSyncMutation('students', token);
    }
  };

  const addShieldToStudent = (studentId: string, shield: Omit<StudentShieldBadge, 'id'>) => {
    const newShield: StudentShieldBadge = {
      ...shield,
      id: `shield-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    let studentName = '';
    

    addAuditLog({
      action: `منح وسام تكريم للطالبة: ${studentName}`,
      actionType: 'create',
      targetCategory: 'students',
      targetId: studentId,
      targetName: studentName,
      details: `منح وسام (${shield.title}) للطالبة ${studentName}`,
      severity: 'success',
    });
  };

  const removeShieldFromStudent = (studentId: string, shieldId: string) => {
    
  };

  const updateStudentBadges = async (studentId: string, badges: string[]) => {
    const before = students.find((s) => s.id === studentId);
    if (!before) return false;
    const updated = { ...before, badges };
    const persisted = await persistCollectionDoc('students', studentId, updated, before);
    if (!persisted) return false;
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    return true;
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    if (!isAdminActor() || !isInitialHydrationDone.current) return false;
    const target = studentsRef.current.find((student) => student.id === id);
    if (!target) return false;
    const linkedParent = parents.find((parent) => parent.id === target.parentId || parent.studentId === id);
    const linkedFinancial = financial.filter((record) => record.studentId === id);

    const studentOk = await deleteCollectionDoc('students', id);
    if (!studentOk) return false;
    if (linkedParent && !(await deleteCollectionDoc('parents', linkedParent.id))) return false;
    const financialResults = await Promise.all(linkedFinancial.map((record) => deleteCollectionDoc('financial', record.id)));
    if (!financialResults.every(Boolean)) return false;

    const nextStudents = studentsRef.current.filter((student) => student.id !== id);
    setStudents(nextStudents); studentsRef.current = nextStudents;
    if (linkedParent) setParents((prev) => prev.filter((parent) => parent.id !== linkedParent.id));
    setFinancial((prev) => prev.filter((record) => record.studentId !== id));
    setUserPasscodes((prev) => { const copy = { ...prev }; delete copy[`student-${id}`]; return copy; });
    await publishHonorFromLists(nextStudents, graduatesRef.current);
    addAuditLog({ action: `حذف سجل الطالبة: ${target.name || id}`, actionType: 'delete', targetCategory: 'students', targetId: id, targetName: target.name || id, details: `تم حذف قيد وسجل الطالبة (${target.name}) وحساب ولي الأمر المرتبط نهائياً`, severity: 'danger' });
    return true;
  };

  const addSupervisor = async (newSupData: Omit<EducationalSupervisor, 'id' | 'joinedDate'> & { joinedDate?: string }) => {
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const newSupervisor: EducationalSupervisor = {
      ...newSupData,
      id: `sup-${Date.now()}-${randSuffix}`,
      joinedDate: newSupData.joinedDate || new Date().toISOString().split('T')[0],
      status: newSupData.status || 'نشط',
      evaluationScore: newSupData.evaluationScore || 99.0,
      assignedSubjects: newSupData.assignedSubjects || [],
      assignedGrades: newSupData.assignedGrades || [],
      isPrimary: Boolean(newSupData.isPrimary),
    };

    const committed = await commitChangedCollectionUpdate('supervisors', supervisors, setSupervisors, (prev) => {
      let updatedList = [newSupervisor, ...prev];
      if (newSupervisor.isPrimary) {
        updatedList = updatedList.map((s) => ({
          ...s,
          isPrimary: s.id === newSupervisor.id,
        }));
      }
      return updatedList;
    });
    if (!committed) return false;

    if (newSupervisor.isPrimary) {
      updateSchoolAdminData({
        academicSupervisorName: newSupervisor.name,
        timetableSupervisorName: newSupervisor.name,
      });
    }

    addAuditLog({
      action: `إضافة مشرف تربوي جديد: ${newSupervisor.name}`,
      actionType: 'create',
      targetCategory: 'system',
      targetId: newSupervisor.id,
      targetName: newSupervisor.name,
      details: `تم اعتماد المشرف التربوي (${newSupervisor.name}) - ${newSupervisor.title} لتخصص (${newSupervisor.specialization})`,
      severity: 'success',
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${randSuffix}`,
      title: lang === 'ar' ? 'اعتماد مشرف تربوي جديد 🏛️' : 'New Educational Supervisor Appointed',
      message: `${newSupervisor.name} (${newSupervisor.title}) - ${newSupervisor.specialization}`,
      type: 'success',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    addNotification(notif);
  };

  const updateSupervisor = async (id: string, updated: Partial<EducationalSupervisor>) => {
    let supervisorName = '';
    const committed = await commitChangedCollectionUpdate('supervisors', supervisors, setSupervisors, (prev) => {
      const next = prev.map((s) => {
        if (s.id === id) {
          supervisorName = updated.name || s.name;
          const merged = { ...s, ...updated };
          return merged;
        }
        if (updated.isPrimary) {
          return { ...s, isPrimary: false };
        }
        return s;
      });
      return next;
    });
    if (!committed) return false;

    if (updated.isPrimary || (updated.name && supervisors.find(s => s.id === id)?.isPrimary)) {
      const current = supervisors.find((s) => s.id === id);
      const newName = updated.name || current?.name;
      if (newName) {
        updateSchoolAdminData({
          academicSupervisorName: newName,
          timetableSupervisorName: newName,
        });
      }
    }

    addAuditLog({
      action: `تعديل بيانات المشرف التربوي: ${supervisorName || id}`,
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      targetName: supervisorName || id,
      details: `تم تحديث البيانات والسجل الإشرافي للمشرف التربوي (${supervisorName})`,
      severity: 'info',
    });
  };

  const deleteSupervisor = async (id: string): Promise<boolean> => {
    const target = supervisors.find((item) => item.id === id);
    if (!target) return false;
    const remaining = supervisors.filter((item) => item.id !== id).map((item) => ({ ...item }));
    if (target.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
      const promoted = await persistCollectionDoc('supervisors', remaining[0].id, remaining[0]);
      if (!promoted) return false;
    }
    const deleted = await deleteCollectionDoc('supervisors', id);
    if (!deleted) return false;
    setSupervisors(remaining);
    if (target.isPrimary && remaining.length > 0) {
      await updateSchoolAdminData({
        academicSupervisorName: remaining[0].name,
        timetableSupervisorName: remaining[0].name,
      });
    }
    addAuditLog({
      action: `حذف مشرف تربوي: ${target.name}`,
      actionType: 'delete',
      targetCategory: 'system',
      targetId: id,
      targetName: target.name,
      details: `تم إلغاء تكليف وحذف المشرف التربوي (${target.name}) من النظام الإشرافي`,
      severity: 'danger',
    });
    return true;
  };

  const setPrimarySupervisor = async (id: string) => {
    const target = supervisors.find((s) => s.id === id);
    if (!target) return;

    const committed = await commitChangedCollectionUpdate('supervisors', supervisors, setSupervisors, (prev) => {
      const next = prev.map((s) => ({
        ...s,
        isPrimary: s.id === id,
      }));
      return next;
    });
    if (!committed) return false;

    updateSchoolAdminData({
      academicSupervisorName: target.name,
      timetableSupervisorName: target.name,
    });

    addAuditLog({
      action: `اعتماد المشرف الرئيسي: ${target.name}`,
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      targetName: target.name,
      details: `تم اعتماد (${target.name}) كمشرف أكاديمي رئيسي للمدرسة في الوثائق والشهادات والجداول`,
      severity: 'success',
    });
  };

  // Graduate & Promotion Actions
  const addGraduate = async (gradData: Omit<GraduateStudent, 'id'>): Promise<boolean> => {
    if (!isAdminActor() || !isInitialHydrationDone.current) return false;
    const newGrad: GraduateStudent = {
      ...gradData,
      id: `grad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const persisted = await persistCollectionDoc('graduates', newGrad.id, newGrad);
    if (!persisted) return false;
    const next = [newGrad, ...graduatesRef.current];
    setGraduates(next);
    graduatesRef.current = next;
    await publishHonorFromLists(studentsRef.current, next);
    return true;
  };

  const updateGraduate = async (id: string, updated: Partial<GraduateStudent>): Promise<boolean> => {
    if (!isAdminActor()) {
      console.warn('[SECURITY] Blocked unauthorized graduate update.');
      return false;
    }
    if (!isInitialHydrationDone.current) return false;
    const previous = graduatesRef.current;
    const target = previous.find((g) => g.id === id);
    if (!target) return false;
    const next = previous.map((g) => (g.id === id ? { ...g, ...updated } : g));
    const token = beginPendingSyncMutation('graduates');
    setGraduates(next);
    graduatesRef.current = next;
    try {
      const ok = await persistCollectionDoc('graduates', id, next.find((g) => g.id === id), target);
      if (!ok) {
        setGraduates(previous);
        graduatesRef.current = previous;
        return false;
      }
      await publishHonorFromLists(studentsRef.current, next);
      return true;
    } finally {
      settlePendingSyncMutation('graduates', token);
    }
  };

  const deleteGraduate = async (id: string): Promise<boolean> => {
    if (!isAdminActor() || !isInitialHydrationDone.current) return false;
    const previous = graduatesRef.current;
    if (!previous.some((g) => g.id === id)) return false;
    const persisted = await deleteCollectionDoc('graduates', id);
    if (!persisted) return false;
    const next = previous.filter((g) => g.id !== id);
    setGraduates(next);
    graduatesRef.current = next;
    await publishHonorFromLists(studentsRef.current, next);
    return true;
  };

  const promoteStudents = async (options: {
    academicYearFrom?: string;
    academicYearTo?: string;
    overrides?: Record<string, 'pass' | 'fail'>;
    autoAddGraduatesToHome?: boolean;
  }) => {
    const {
      academicYearFrom = '2026/2027',
      overrides = {},
      autoAddGraduatesToHome = true,
    } = options;

    let promotedCount = 0;
    let graduatedCount = 0;
    let retainedCount = 0;

    const newGraduatesToInsert: GraduateStudent[] = [];

    const updatedStudentsList = students.map((std) => {
      // Determine pass/fail status
      const override = overrides[std.id];
      const isPassed = override ? override === 'pass' : std.gpa >= 50 && std.status !== 'محظورة';

      if (!isPassed) {
        retainedCount++;
        return {
          ...std,
          notes: `بقيت في الصف (${std.gradeLevel}) للعام الدراسي الجديد - حالة عدم استيفاء الشروط / إكمال`,
        };
      }

      // Passed student
      const nextGrade = getNextGradeLevel(std.gradeLevel);

      if (nextGrade === 'GRADUATED') {
        graduatedCount++;
        promotedCount++;

        if (autoAddGraduatesToHome) {
          newGraduatesToInsert.push({
            id: `grad-auto-${std.id}-${Date.now()}`,
            name: std.name,
            graduationYear: academicYearFrom,
            gpa: std.gpa,
            section: std.section,
            collegeOrSpecialty: 'كلية الطب البشري / الهندسة / تخصص علمي عالي',
            notes: `خريجة متفوقة من ثانوية ميسان للمتميزات - دفعة ${academicYearFrom}`,
            honorBadge: std.gpa >= 99 ? 'وسام التميز الوزاري 🥇' : 'شهادة تخرج الدفعة 🎓',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          });
        }

        return {
          ...std,
          gradeLevel: 'الصف السادس العلمي' as const,
          status: 'منقولة' as const,
          notes: `خريجة متفوقة - دفعة ${academicYearFrom}`,
        };
      } else {
        promotedCount++;
        return {
          ...std,
          gradeLevel: nextGrade,
          notes: `تم الترحيل بنجاح إلى (${nextGrade})`,
        };
      }
    });

    const studentsPersisted = await persistChangedCollectionDocs('students', students, updatedStudentsList);
    if (!studentsPersisted) return { promotedCount: 0, graduatedCount: 0, retainedCount: 0 };
    setStudents(updatedStudentsList);
    studentsRef.current = updatedStudentsList;

    if (newGraduatesToInsert.length > 0) {
      const previousGrads = graduatesRef.current;
      const filtered = newGraduatesToInsert.filter(
        (ng) => !previousGrads.some((p) => p.name === ng.name && p.graduationYear === ng.graduationYear)
      );
      const nextGrads = [...filtered, ...previousGrads];
      setGraduates(nextGrads);
      graduatesRef.current = nextGrads;
      if (isAdminActor() && isInitialHydrationDone.current) {
        const token = beginPendingSyncMutation('graduates');
        void Promise.all(filtered.map((grad) => persistCollectionDoc('graduates', grad.id, grad))).then((results) => {
          const ok = results.every(Boolean);
          if (!ok) {
            setGraduates(previousGrads);
            graduatesRef.current = previousGrads;
          } else {
            void publishHonorFromLists(updatedStudentsList, nextGrads);
          }
          settlePendingSyncMutation('graduates', token);
        });
      }
    }

    return { promotedCount, graduatedCount, retainedCount };
  };

  const updateParent = async (id: string, updated: Partial<Parent>) => {
    const before = parents.find((p) => p.id === id);
    if (!before) return false;
    const after = { ...before, ...updated };
    const persisted = await persistCollectionDoc('parents', id, after, before);
    if (!persisted) return false;
    setParents((prev) => prev.map((p) => (p.id === id ? after : p)));
    return true;
  };

  useEffect(() => {
    if (
      !canRunParentStudentSelfHeal({
        role,
        currentUserRole: currentUser?.role,
        hydrated: isInitialHydrationDone.current,
        authoritativeParents: authoritativeParentsReceivedRef.current,
        authoritativeStudents: authoritativeStudentsReceivedRef.current,
        pendingParents: isSyncKeyPending('parents'),
        pendingStudents: isSyncKeyPending('students'),
      })
    ) {
      return;
    }

    const plan = planParentStudentSelfHeal(parents, students);
    const signature = parentStudentSelfHealUpdatesSignature(plan);
    const decision = decideParentStudentSelfHealRun({
      updatesCount: plan.updates.length,
      signature,
      inFlight: parentSelfHealInFlightRef.current,
      guard: parentSelfHealGuardRef.current,
      currentGeneration: parentStudentSelfHealGeneration,
    });

    if (decision.action === 'commit-empty') {
      parentSelfHealGuardRef.current = nextParentStudentSelfHealGuard(parentSelfHealGuardRef.current, {
        type: 'empty-plan',
        signature: decision.signature,
      });
      return;
    }
    if (decision.action === 'skip') return;

    parentSelfHealInFlightRef.current = true;
    const token = beginPendingSyncMutation('parents');
    void (async () => {
      let hadFailure = false;
      try {
        for (const item of plan.updates) {
          const before = parents.find((parent) => parent.id === item.parentId);
          if (!before) {
            hadFailure = true;
            continue;
          }
          const after = { ...before, ...item.patch };
          if (JSON.stringify(before) === JSON.stringify(after)) continue;

          let ok = false;
          try {
            ok = await persistCollectionDoc('parents', item.parentId, after, before);
          } catch {
            ok = false;
          }

          if (!ok) {
            hadFailure = true;
            continue;
          }

          setParents((prev) =>
            prev.map((parent) => (parent.id === item.parentId ? { ...parent, ...item.patch } : parent))
          );
          addAuditLog({
            action: 'parent_student_projection_self_heal',
            actionType: 'update',
            targetCategory: 'parents',
            targetId: item.parentId,
            details: `studentId=${item.studentId}; changedFields=${Object.keys(item.patch).sort().join(',')}`,
            severity: 'info',
          });
        }
      } catch {
        hadFailure = true;
      } finally {
        if (hadFailure) {
          parentSelfHealGuardRef.current = nextParentStudentSelfHealGuard(parentSelfHealGuardRef.current, {
            type: 'attempt-failure',
            signature,
            currentGeneration: parentStudentSelfHealGeneration,
          });
        } else {
          parentSelfHealGuardRef.current = nextParentStudentSelfHealGuard(parentSelfHealGuardRef.current, {
            type: 'attempt-success',
            signature,
          });
        }
        parentSelfHealInFlightRef.current = false;
        settlePendingSyncMutation('parents', token);
      }
    })();
  }, [role, currentUser?.role, parents, students, parentStudentSelfHealGeneration]);

  const deleteParent = async (id: string) => {
    const persisted = await deleteCollectionDoc('parents', id);
    if (!persisted) return false;
    setParents((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const updateFinancialRecord = (id: string, updated: Partial<FinancialRecord>) => {
    setFinancial((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const totalAmount = updated.totalAmount !== undefined ? updated.totalAmount : f.totalAmount;
          const paidAmount = updated.paidAmount !== undefined ? updated.paidAmount : f.paidAmount;
          const autoStatus =
            paidAmount >= totalAmount && totalAmount > 0
              ? 'مكتمل'
              : paidAmount > 0
              ? 'جزئي'
              : 'غير مدفوع';
          return {
            ...f,
            ...updated,
            totalAmount,
            paidAmount,
            status: updated.status || autoStatus,
          };
        }
        return f;
      })
    );
  };

  const addFinancialRecord = async (data: Omit<FinancialRecord, 'id'>) => {
    const totalAmount = data.totalAmount || 0;
    const paidAmount = data.paidAmount || 0;
    const autoStatus =
      paidAmount >= totalAmount && totalAmount > 0
        ? 'مكتمل'
        : paidAmount > 0
        ? 'جزئي'
        : 'غير مدفوع';

    const newRecord: FinancialRecord = {
      ...data,
      id: `fin-${Date.now()}`,
      status: data.status || autoStatus,
    };
    const persisted = await persistCollectionDoc('financial', newRecord.id, newRecord);
    if (!persisted) return false;
    setFinancial((prev) => [newRecord, ...prev]);
  };

  const deleteFinancialRecord = async (id: string) => {
    const persisted = await deleteCollectionDoc('financial', id);
    if (!persisted) return false;
    setFinancial((prev) => prev.filter((f) => f.id !== id));
    return true;
  };

  const createExam = async (data: Omit<Exam, 'id' | 'createdAt'>) => {
    const newExam: Exam = {
      ...data,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalPoints: data.totalPoints || (data.questions ? data.questions.reduce((acc, q) => acc + (q.points || 0), 0) : 100),
    };
    const persisted = await persistCollectionDoc('exams', newExam.id, newExam);
    if (!persisted) return false;
    setExams((prev) => [newExam, ...prev]);

    // Broadcast notification to students & parents
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: lang === 'ar' ? `امتحان جديد: ${newExam.title}` : `New Exam Published: ${newExam.title}`,
      message: `${newExam.subject} - ${newExam.gradeLevel} (المدة: ${newExam.durationMinutes} دقيقة)`,
      type: 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
      targetRole: 'student',
    };
    await addNotification(notif);
    return true;
  };

  const updateExam = async (id: string, updated: Partial<Exam>) => {
    const committed = await commitEntityArrayUpdate('exams', exams, setExams, id, (prev) => {
      const next = prev.map((ex) => {
        if (ex.id === id) {
          const nextExam = { ...ex, ...updated };
          if (updated.questions) {
            nextExam.totalPoints = updated.questions.reduce((acc, q) => acc + (q.points || 0), 0);
          }
          return nextExam;
        }
        return ex;
      });
      return next;
    });
    if (!committed) return false;
  };

  const deleteExam = async (id: string) => {
    const persisted = await deleteCollectionDoc('exams', id);
    if (!persisted) return false;
    setExams((prev) => prev.filter((ex) => ex.id !== id));
    setSubmissions((prev) => prev.filter((sub) => sub.examId !== id));
    return true;
  };

  const duplicateExam = async (id: string) => {
    const examToClone = exams.find((ex) => ex.id === id);
    if (!examToClone) return;
    const cloned: Exam = {
      ...examToClone,
      id: `ex-${Date.now()}`,
      title: `${examToClone.title} (نسخة مكررة)`,
      status: 'مسودة',
      createdAt: new Date().toISOString().split('T')[0],
    };
    const persisted = await persistCollectionDoc('exams', cloned.id, cloned);
    if (!persisted) return false;
    setExams((prev) => [cloned, ...prev]);
    return true;
  };

  const toggleExamStatus = async (id: string, status: Exam['status']) => {
    const committed = await commitEntityArrayUpdate('exams', exams, setExams, id, (prev) => {
      const next = prev.map((ex) => (ex.id === id ? { ...ex, status } : ex));
      return next;
    });
    if (!committed) return false;
  };

  const submitExam = async (data: Omit<ExamSubmission, 'id' | 'submittedAt'>) => {
    const submission: ExamSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
    };
    const persisted = await persistCollectionDoc('submissions', submission.id, submission);
    if (!persisted) return false;
    setSubmissions((prev) => [submission, ...prev]);

    // Notify Parent & Principal automatically
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: lang === 'ar' ? `نتيجة امتحان للطالبة: ${submission.studentName}` : `Exam Result: ${submission.studentName}`,
      message: `${submission.score} / ${submission.totalPoints} (${submission.percentage}%) - تنبيهات غش: ${submission.cheatViolationsCount}`,
      type: submission.percentage >= 90 ? 'success' : submission.percentage >= 60 ? 'info' : 'warning',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    addNotification(notif);
  };

  const updateSubmission = (id: string, updated: Partial<ExamSubmission>) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const nextSub = { ...sub, ...updated };
          if (updated.score !== undefined && sub.totalPoints > 0) {
            nextSub.percentage = Math.round((updated.score / sub.totalPoints) * 100);
          }
          return nextSub;
        }
        return sub;
      })
    );
  };

  const regradeSubmission = (submissionId: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const exam = exams.find((e) => e.id === sub.examId);
        if (!exam) return sub;

        let earned = 0;
        let total = 0;
        exam.questions.forEach((q) => {
          total += q.points;
          if (sub.manualQuestionGrades && sub.manualQuestionGrades[q.id] !== undefined) {
            earned += sub.manualQuestionGrades[q.id];
          } else {
            const uAns = sub.answers[q.id];
            if (uAns !== undefined && uAns !== null) {
              if (typeof q.correctAnswer === 'number' && Number(uAns) === q.correctAnswer) {
                earned += q.points;
              } else if (
                typeof q.correctAnswer === 'string' &&
                String(uAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
              ) {
                earned += q.points;
              }
            }
          }
        });

        const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
        return {
          ...sub,
          score: earned,
          totalPoints: total,
          percentage,
          status: 'تم التصحيح تلقائياً',
        };
      })
    );
  };

  const regradeAllExamSubmissions = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.examId !== examId) return sub;

        let earned = 0;
        let total = 0;
        exam.questions.forEach((q) => {
          total += q.points;
          if (sub.manualQuestionGrades && sub.manualQuestionGrades[q.id] !== undefined) {
            earned += sub.manualQuestionGrades[q.id];
          } else {
            const uAns = sub.answers[q.id];
            if (uAns !== undefined && uAns !== null) {
              if (typeof q.correctAnswer === 'number' && Number(uAns) === q.correctAnswer) {
                earned += q.points;
              } else if (
                typeof q.correctAnswer === 'string' &&
                String(uAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
              ) {
                earned += q.points;
              }
            }
          }
        });

        const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
        return {
          ...sub,
          score: earned,
          totalPoints: total,
          percentage,
          status: 'تم التصحيح تلقائياً',
        };
      })
    );
  };

  const deleteSubmission = async (submissionId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
  };

  const logAttendance = async (
    records: Omit<AttendanceRecord, 'id'>[],
    meta?: { teacherEmail?: string; teacherName?: string; teacherId?: string }
  ) => {
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
    }));
    const persisted = await Promise.all(newRecords.map((record) => persistCollectionDoc('attendance', record.id, record)));
    if (!persisted.every(Boolean)) return false;
    setAttendance((prev) => [...newRecords, ...prev]);

    if (newRecords.length > 0) {
      const first = newRecords[0];
      const dateStr = first.date;
      const gradeStr = first.gradeLevel;
      const secStr = first.section || 'أ';
      const subjectStr = first.subject || 'المادة الدراسية';
      const teacherNameStr = meta?.teacherName || first.markedByTeacher || 'الأستاذة مدرسة المادة';
      const teacherEmailStr = meta?.teacherEmail || 'teacher@maysan-gifted.edu.iq';
      const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');

      const total = newRecords.length;
      const presentCount = newRecords.filter((r) => r.status === 'حاضرة').length;
      const absentCount = newRecords.filter((r) => r.status === 'غائبة').length;
      const lateCount = newRecords.filter((r) => r.status === 'متأخرة').length;
      const excusedCount = newRecords.filter((r) => r.status === 'مجازة').length;

      // 1. Direct Message to School Administration Inbox
      const adminMsg: DirectMessage = {
        id: `msg-att-admin-${Date.now()}`,
        senderId: 'teacher-system',
        senderName: teacherNameStr,
        senderRole: 'teacher',
        receiverId: 'admin-1',
        receiverName: 'إدارة ثانوية ميسان للمتميزات',
        subject: `[كشف الحضور اليومي] ${gradeStr} - شعبة (${secStr}) - ${dateStr}`,
        content: `تم تثبيت سجل الحضور والغياب اليومي رسمياً وإرساله للبريد الإلكتروني للإدارة وللأستاذة ولأولياء الأمور.

• المادة: ${subjectStr}
• المدرسة: ${teacherNameStr} (${teacherEmailStr})
• التاريخ: ${dateStr}
• الصف والشعبة: ${gradeStr} - شعبة (${secStr})
• إحصائية اليوم:
  - إجمالي الطالبات: ${total}
  - الحاضرات: ${presentCount}
  - الغائبات: ${absentCount}
  - المتأخرات: ${lateCount}
  - المجازات: ${excusedCount}

تم إرسال بريد إلكتروني رسمي تلقائي إلى:
- إدارة المدرسة (admin@maysan-gifted.edu.iq)
- الأستاذة (${teacherEmailStr})
- أولياء أمور جميع الطالبات المسجلات بالشعبة (${total} بريد إلكتروني).`,
        timestamp: timeStr,
        isRead: false,
        folder: 'inbox',
      };

      // 2. Direct Messages to Parents for each student (Private & Individualized)
      const parentMsgs: DirectMessage[] = newRecords.map((rec, idx) => {
        const studentObj = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);
        const parentEmail = studentObj?.parentEmail || 'parent@maysan-gifted.edu.iq';
        const parentName = studentObj?.parentName || 'ولي الأمر المحترم';

        return {
          id: `msg-att-parent-${Date.now()}-${idx}`,
          senderId: 'school-system',
          senderName: 'ثانوية ميسان للمتميزات - كشف الحضور',
          senderRole: 'admin',
          receiverId: studentObj?.parentId || `parent-${rec.studentId}`,
          receiverName: parentName,
          subject: `[إشعار حضور وغياب اليوم] الطالبة: ${rec.studentName} - مادة ${rec.subject}`,
          content: `تحية طيبة،
نود إعلامكم بتسجيل حالة الحضور والغياب اليومي الخاصة بابنتكم الطالبة (${rec.studentName}) حصراً في مادة (${rec.subject}) بتاريخ (${rec.date}):

• اسم الطالبة: ${rec.studentName}
• حالة الحضور اليوم: [ ${rec.status} ]
• الصف والشعبة: ${rec.gradeLevel} - شعبة (${rec.section})
• المادة والأستاذة المشرفة: ${rec.subject} - ${rec.markedByTeacher}

* ملاحظة هامة: هذا الإشعار خاص بابنتكم فقط، ولا يتم إرسال أو مشاركة بيانات حضورها مع أي ولي أمر آخر ضماناً للسرية والخصوصية التامة.
تم إرسال هذا الإشعار رسمياً إلى بريدكم الإلكتروني المسجل: (${parentEmail}).
مع تحيات إدارة ثانوية ميسان للمتميزات.`,
          timestamp: timeStr,
          isRead: false,
          folder: 'inbox',
        };
      });

      setMessages((prev) => [adminMsg, ...parentMsgs, ...prev]);

      // 3. System Notifications Breakdown (Admin / Current Teacher / Class Students / Class Parents)
      // A) Official Admin Summary Notification (المديرة والادارة)
      const adminNotif: NotificationItem = {
        id: `notif-admin-att-${Date.now()}`,
        title:
          absentCount > 0
            ? lang === 'ar'
              ? `🚨 تنبيه غياب طارئ (${absentCount} طالبة) - ${gradeStr} (${secStr})`
              : `🚨 Absence Alert (${absentCount} students)`
            : `✅ تم تثبيت كشف حضور ${gradeStr} (${secStr}) - ${subjectStr}`,
        message:
          absentCount > 0
            ? `قام/ت الأستاذ/ة (${teacherNameStr}) بتثبيت سجل حضور مادة (${subjectStr}) لـ (${gradeStr} - شعبة ${secStr}) بـ (${total}) طالبة. الغائبات: (${absentCount}). تم توجيه التنبيهات المخصصة لكل طرف.`
            : `قام/ت الأستاذ/ة (${teacherNameStr}) بتثبيت حضور (${gradeStr} - شعبة ${secStr}) بنجاح لمادة (${subjectStr}) وإرساله للإدارة والطالبات وأولياء الأمور.`,
        type: absentCount > 0 ? 'alert' : 'success',
        timestamp: lang === 'ar' ? 'الآن' : 'Just now',
        isRead: false,
        targetRole: 'admin',
        isAttendanceNotif: true,
      };

      // B) Current Subject Teacher Notification ONLY (مدرس المادة فقط - الحساب الحالي ولا يشمل بقية الهيئة التدريسية)
      const teacherTargetId = meta?.teacherId || currentUser?.id || 'teacher-current';
      const teacherNotif: NotificationItem = {
        id: `notif-teacher-att-${Date.now()}`,
        title: `✅ تم تثبيت كشف الحضور لمادتك: ${subjectStr}`,
        message: `تم حفظ وتثبيت الحضور والغياب لـ (${gradeStr} - شعبة ${secStr}) بتاريخ ${dateStr} بنجاح. تم إرسال التنبيهات إلى الإدارة وطالبات الشعبة وأولياء أمورهن.`,
        type: 'success',
        timestamp: lang === 'ar' ? 'الآن' : 'Just now',
        isRead: false,
        targetRole: 'teacher',
        targetTeacherId: teacherTargetId,
        targetUserId: teacherTargetId,
        isAttendanceNotif: true,
      };

      // C) Individualized Notifications for Outstanding Students in this Grade & Section ONLY (الطالبات المتميزات للصف والشعبة المحددتين فقط)
      const studentNotifs: NotificationItem[] = newRecords.map((rec, idx) => {
        const studentObj = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);
        return {
          id: `notif-student-att-${Date.now()}-${idx}`,
          title: `إشعار حضور مادة (${rec.subject}): [ ${rec.status} ]`,
          message: `عزيزتي الطالبة ${rec.studentName}، تم تسجيل حالة حضورك بـ (${rec.status}) في مادة (${rec.subject}) بتاريخ (${rec.date}).`,
          type: rec.status === 'غائبة' ? 'alert' : rec.status === 'متأخرة' ? 'warning' : 'success',
          timestamp: lang === 'ar' ? 'الآن' : 'Just now',
          isRead: false,
          targetRole: 'student',
          targetStudentId: rec.studentId || studentObj?.id,
          targetGradeLevel: rec.gradeLevel,
          targetSection: rec.section as any,
          isAttendanceNotif: true,
        };
      });

      // D) Individualized Notifications for Parents in this Grade & Section ONLY (أولياء أمور الطالبات للصف والشعبة المحددتين فقط)
      const parentNotifs: NotificationItem[] = newRecords.map((rec, idx) => {
        const studentObj = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);
        return {
          id: `notif-parent-att-${Date.now()}-${idx}`,
          title: `إشعار حضور ابنتكم (${rec.studentName}): [ ${rec.status} ]`,
          message: `تم تسجيل حالة (${rec.status}) لابنتكم ${rec.studentName} في مادة (${rec.subject}) بتاريخ (${rec.date}). التنبيه خاص بابنتكم للصف (${rec.gradeLevel}) والشعبة (${rec.section}) ولا يطلع عليه بقية أولياء الأمور.`,
          type: rec.status === 'غائبة' ? 'alert' : rec.status === 'متأخرة' ? 'warning' : 'success',
          timestamp: lang === 'ar' ? 'الآن' : 'Just now',
          isRead: false,
          targetRole: 'parent',
          targetStudentId: rec.studentId || studentObj?.id,
          targetParentId: studentObj?.parentId,
          targetGradeLevel: rec.gradeLevel,
          targetSection: rec.section as any,
          isAttendanceNotif: true,
        };
      });

      addNotification(adminNotif);
      addNotification(teacherNotif);
      studentNotifs.forEach((item) => addNotification(item));
      parentNotifs.forEach((item) => addNotification(item));

      // 4. Update Cumulative Student Absence & Warning Levels Automatically
      const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
        const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
        const first = disciplinarySettings?.firstWarningDays ?? 5;
        const final = disciplinarySettings?.finalWarningDays ?? 10;
        const expel = disciplinarySettings?.expulsionDays ?? 15;
        
        const updatedArray = prev.map((s) => {
          const rec = newRecords.find(r => r.studentId === s.id || r.studentName === s.name);
          if (!rec) return s;
          
          let missedLessons = s.totalMissedLessons || 0;
          let unexcusedDays = s.unexcusedAbsenceDays || 0;
          let excusedDays = s.excusedAbsenceDays || 0;
          
          if (rec.status === 'غائبة') {
            missedLessons += 1;
            if (missedLessons > 0 && missedLessons % lessPerDay === 0) {
              unexcusedDays += 1;
            }
          } else if (rec.status === 'مجازة') {
            // we'll just track missed lessons for excused if needed, but keeping it simple
            // usually excusedAbsenceDays is full days, we'll increment if we reach the threshold
            const totalExcusedLessons = (s.excusedAbsenceDays || 0) * lessPerDay + 1;
            if (totalExcusedLessons % lessPerDay === 0) {
              excusedDays += 1;
            }
          }
          
          let newWarn = s.warningLevel || 'طبيعي';
          if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
          else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
          else if (unexcusedDays >= first) newWarn = 'إنذار أول';
          
          return {
            ...s,
            totalMissedLessons: missedLessons,
            unexcusedAbsenceDays: unexcusedDays,
            excusedAbsenceDays: excusedDays,
            warningLevel: newWarn
          };
        });
        return updatedArray;
      });
      if (!committed) return false;
    }
  };


  const updateAttendanceRecord = async (
    id: string,
    updated: Partial<AttendanceRecord>,
    notifyParent: boolean = true
  ) => {
    const targetRecord = attendance.find((r) => r.id === id);
    if (!targetRecord) return false;
    const oldStatus: AttendanceRecord['status'] = targetRecord.status;
    const newStatus: AttendanceRecord['status'] = updated.status ?? targetRecord.status;
    const nextAttendance = attendance.map((r) =>
      r.id === id
        ? {
            ...r,
            ...updated,
            originalStatus: r.originalStatus || r.status,
            modifiedAt: new Date().toISOString(),
            modifiedBy: updated.modifiedBy || currentUser?.name || 'إدارة ثانوية ميسان للمتميزات',
            reasonForModification: updated.reasonForModification || r.reasonForModification,
          }
        : r
    );
    const persisted = await persistEntityFromArray('attendance', attendance, nextAttendance, id);
    if (!persisted) return false;
    setAttendance(nextAttendance);

    if (targetRecord && oldStatus && newStatus && oldStatus !== newStatus) {
      let deltaMissedLessons = 0;
      let deltaExcusedDays = 0;

      if (oldStatus === 'غائبة' && newStatus !== 'غائبة') {
        deltaMissedLessons -= 1;
      } else if (oldStatus !== 'غائبة' && newStatus === 'غائبة') {
        deltaMissedLessons += 1;
      }

      if (oldStatus === 'مجازة' && newStatus !== 'مجازة') {
        deltaExcusedDays -= 1;
      } else if (oldStatus !== 'مجازة' && newStatus === 'مجازة') {
        deltaExcusedDays += 1;
      }

      if (deltaMissedLessons !== 0 || deltaExcusedDays !== 0) {
        const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
          const updatedArray = prev.map((s) => {
            if (s.id !== targetRecord?.studentId && s.name !== targetRecord?.studentName) return s;
            
            let missedLessons = Math.max(0, (s.totalMissedLessons || 0) + deltaMissedLessons);
            let excusedDays = Math.max(0, (s.excusedAbsenceDays || 0) + deltaExcusedDays);
            
            const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
            const unexcusedDays = Math.floor(missedLessons / lessPerDay);
            
            const first = disciplinarySettings?.firstWarningDays ?? 5;
            const final = disciplinarySettings?.finalWarningDays ?? 10;
            const expel = disciplinarySettings?.expulsionDays ?? 15;
            
            let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
            if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
            else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
            else if (unexcusedDays >= first) newWarn = 'إنذار أول';
            
            return {
              ...s,
              totalMissedLessons: missedLessons,
              unexcusedAbsenceDays: unexcusedDays,
              excusedAbsenceDays: excusedDays,
              warningLevel: newWarn
            };
          });
          return updatedArray;
        });
        if (!committed) return false;
      }

      // If notifyParent is requested, send an official correction notification & direct message
      if (notifyParent) {
        const studentObj = students.find(
          (s) => s.id === targetRecord?.studentId || s.name === targetRecord?.studentName
        );
        const parentId = studentObj?.parentId || `parent-${targetRecord?.studentId}`;
        const parentName = studentObj?.parentName || 'ولي الأمر المحترم';
        const parentEmail = studentObj?.parentEmail || 'parent@maysan-gifted.edu.iq';
        const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
        const modifierName = updated.modifiedBy || currentUser?.name || 'إدارة المدرسة';

        const updateSubject = `[تحديث رسمي] تعديل سجل الحضور والغياب - الطالبة ${targetRecord.studentName}`;
        const updateContent = `إلى: ${parentName} المحترم
تاريخ التعديل: ${timeStr}
الموضوع: تصحيح وتعديل سجل حضور يوم (${targetRecord.date}) في مادة (${targetRecord.subject})

نود إحاطتكم بأنه قد تم تعديل وتحديث حالة الحضور والغياب الخاصة بابنتكم الطالبة (${targetRecord.studentName}):
• الحالة السابقة: [ ${oldStatus} ]
• الحالة المعتمدة الجديدة: [ ${newStatus} ]
• سبب وتفاصيل التعديل: ${updated.reasonForModification || updated.notes || 'مراجعة وتدقيق إداري معتمد'}
• القائم بالتعديل: ${modifierName}

تم إعادة احتساب رصيد الغياب والإنذارات الوزارية للطالبة تلقائياً وفق الضوابط.
تم إرسال هذا الإشعار إلى بريدكم المسجل (${parentEmail}).`;

        const directMsg: DirectMessage = {
          id: `msg-att-mod-${Date.now()}`,
          senderId: 'school-system',
          senderName: 'إدارة ثانوية ميسان للمتميزات - تدقيق الحضور',
          senderRole: 'admin',
          receiverId: parentId,
          receiverName: parentName,
          subject: updateSubject,
          content: updateContent,
          timestamp: timeStr,
          isRead: false,
          folder: 'inbox',
        };

        setMessages((prev) => [directMsg, ...prev]);

        addNotification({
          title: `📝 تعديل سجل الحضور: ${targetRecord.studentName}`,
          message: `تم تعديل حالة الطالبة من (${oldStatus}) إلى (${newStatus}) بتاريخ ${targetRecord.date} في مادة ${targetRecord.subject}.`,
          type: 'info',
          targetRole: 'parent',
          targetStudentId: targetRecord.studentId,
          targetParentId: parentId,
          senderName: modifierName,
          senderRole: 'admin',
          isRead: false,
        });

        addNotification({
          title: `📝 تعديل سجل حضورك: مادة ${targetRecord.subject}`,
          message: `تم تعديل حالة الحضور الخاصة بك ليوم ${targetRecord.date} من (${oldStatus}) إلى (${newStatus}).`,
          type: 'info',
          targetRole: 'student',
          targetStudentId: targetRecord.studentId,
          senderName: modifierName,
          senderRole: 'admin',
          isRead: false,
        });
      }
    }
  };

  const batchUpdateAttendanceRecords = async (
    updates: Array<{ id: string; status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'; notes?: string; reasonForModification?: string }>,
    notifyParent: boolean = false
  ) => {
    if (!updates || updates.length === 0) return;

    const results = await Promise.all(updates.map((u) =>
      updateAttendanceRecord(u.id, { status: u.status, notes: u.notes, reasonForModification: u.reasonForModification }, notifyParent)
    ));
    if (results.some((result) => result === false)) return false;

    addNotification({
      title: '✅ تم حفظ التعديلات الجماعية على سجلات الحضور',
      message: `تم بنجاح تعديل وتحديث (${updates.length}) سجل حضور وغياب وتحديث إحصائيات الطالبات المتأثرات.`,
      type: 'success',
      targetRole: 'admin',
      senderName: currentUser?.name || 'إدارة المدرسة',
      senderRole: 'admin',
      isRead: false,
    });
  };

  const deleteAttendanceRecord = async (id: string) => {
    const deletedRecord = attendance.find((r) => r.id === id);
    if (!deletedRecord) return false;
    const persisted = await deleteCollectionDoc('attendance', id);
    if (!persisted) return false;
    setAttendance((prev) => prev.filter((r) => r.id !== id));

    if (deletedRecord) {
      const rec = deletedRecord as AttendanceRecord;
      if (rec.status === 'غائبة' || rec.status === 'مجازة') {
        const isAbsent = rec.status === 'غائبة';
        const isExcused = rec.status === 'مجازة';

        
      }

      addNotification({
        title: '🗑️ حذف سجل حضور وغياب',
        message: `تم حذف سجل الحضور للطالبة (${rec.studentName}) بتاريخ ${rec.date} بمادة ${rec.subject} وإعادة احتساب الغيابات.`,
        type: 'warning',
        targetRole: 'admin',
        senderName: currentUser?.name || 'إدارة المدرسة',
        senderRole: 'admin',
        isRead: false,
      });
    }
  };

  const deleteAttendanceRecordsForSession = async (
    date: string,
    gradeLevel: GradeLevel,
    section: string,
    subject?: string
  ) => {
    const toDelete = attendance.filter(
      (r) =>
        r.date === date &&
        r.gradeLevel === gradeLevel &&
        (r.section === section || (!r.section && section === 'أ')) &&
        (!subject || r.subject === subject)
    );

    if (toDelete.length === 0) return;

    const persisted = await Promise.all(toDelete.map((record) => deleteCollectionDoc('attendance', record.id)));
    if (!persisted.every(Boolean)) return false;
    const idsToDelete = new Set(toDelete.map((r) => r.id));
    setAttendance((prev) => prev.filter((r) => !idsToDelete.has(r.id)));

    // Recalculate each affected student
    const studentImpacts: Record<string, { absentDeduct: number; excusedDeduct: number }> = {};
    toDelete.forEach((r) => {
      const sId = r.studentId;
      if (!studentImpacts[sId]) {
        studentImpacts[sId] = { absentDeduct: 0, excusedDeduct: 0 };
      }
      if (r.status === 'غائبة') studentImpacts[sId].absentDeduct += 1;
      if (r.status === 'مجازة') studentImpacts[sId].excusedDeduct += 1;
    });

    

    addNotification({
      title: '🗑️ حذف جلسة حضور بالكامل',
      message: `تم إلغاء وحذف جلسة الحضور ليوم ${date} (${gradeLevel} - شعبة ${section}) لـ (${toDelete.length}) طالبة بنجاح وتحديث السجلات.`,
      type: 'warning',
      targetRole: 'admin',
      senderName: currentUser?.name || 'إدارة المدرسة',
      senderRole: 'admin',
      isRead: false,
    });
  };

  const recalculateStudentAbsenceStats = async (studentId?: string, overrideSettings?: DisciplinarySettings) => {
    const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
      const updated = prev.map((s) => {
        if (studentId && s.id !== studentId) return s;
        const discSettings = overrideSettings || disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;
        const first = discSettings.firstWarningDays ?? 5;
        const final = discSettings.finalWarningDays ?? 10;
        const expel = discSettings.expulsionDays ?? 15;
        
        const unexcused = s.unexcusedAbsenceDays || 0;
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcused >= expel) newWarn = 'مستحقة للفصل';
        else if (unexcused >= final) newWarn = 'إنذار نهائي';
        else if (unexcused >= first) newWarn = 'إنذار أول';
        
        if (s.warningLevel !== newWarn) {
          return { ...s, warningLevel: newWarn };
        }
        return s;
      });
      return updated;
    });
    if (!committed) return false;
  };

  /**
   * Check if current active user has permission to undo/retract an attendance record.
   * Permissions:
   * - Admin / Principal (المديرة والإدارة): full permission to undo any record.
   * - Teacher (المدرسة): permission to undo records marked by her or in her assigned subjects.
   */
  const canUndoAttendance = (record: AttendanceRecord): boolean => {
    if (!record) return false;
    if (role === 'admin') return true;
    if (role === 'teacher') {
      const curTeacher =
        teachers.find(
          (t) =>
            t.id === currentUser?.id ||
            (currentUser?.email && t.email?.toLowerCase() === currentUser?.email.toLowerCase()) ||
            (currentUser?.name && t.name.toLowerCase() === currentUser?.name.toLowerCase())
        ) || currentUser?.teacherObj;

      const curName = (currentUser?.name || curTeacher?.name || '').trim().toLowerCase();
      const curEmail = (currentUser?.email || curTeacher?.email || '').trim().toLowerCase();
      const markedBy = (record.markedByTeacher || '').trim().toLowerCase();

      if (markedBy && curName && (markedBy.includes(curName) || curName.includes(markedBy))) return true;
      if (curTeacher && (markedBy.includes(curTeacher.name.toLowerCase()) || curTeacher.name.toLowerCase().includes(markedBy))) return true;
      if (curEmail && markedBy.includes(curEmail)) return true;

      // Allow if active teacher teaches this subject for this grade
      if (
        curTeacher &&
        curTeacher.subject === record.subject &&
        (!curTeacher.assignedGrades || curTeacher.assignedGrades.includes(record.gradeLevel))
      ) {
        return true;
      }
    }
    return false;
  };

  /**
   * Undo/Retract an accidental absence entry (التراجع عن تسجيل الغياب المسجل سهواً)
   */
  const undoAccidentalAbsence = async (
    recordId: string,
    options?: {
      reason?: string;
      deleteRecordInstead?: boolean;
      notifyParent?: boolean;
      undoneBy?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const existing = attendance.find((r) => r.id === recordId);
    if (!existing) {
      return { success: false, message: 'لم يتم العثور على سجل الحضور المطلوب.' };
    }

    if (!canUndoAttendance(existing)) {
      return {
        success: false,
        message: 'عذراً، صلاحية التراجع عن تسجيل الغياب مخصصة للمديرة وإدارة المدرسة أو المُدرسة التي قامت برصد الغياب.',
      };
    }

    const prevStatus = existing.status;
    const isAbsent = prevStatus === 'غائبة';
    const isExcused = prevStatus === 'مجازة';

    const curTeacher =
      teachers.find(
        (t) =>
          t.id === currentUser?.id ||
          (currentUser?.email && t.email?.toLowerCase() === currentUser?.email.toLowerCase()) ||
          (currentUser?.name && t.name.toLowerCase() === currentUser?.name.toLowerCase())
      ) || currentUser?.teacherObj;

    const defaultUndoReason =
      options?.reason || 'رصد الغياب سهواً وتم التأكد من الحضور والدوام الفعلي للطالبة في الحصة الدراسية';
    const actorName =
      options?.undoneBy ||
      currentUser?.name ||
      (role === 'admin' ? 'إدارة ثانوية ميسان للمتميزات' : (curTeacher?.name || 'مُدرّسة المادة'));
    const timestamp = new Date().toISOString();
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');

    if (options?.deleteRecordInstead) {
      const persisted = await deleteCollectionDoc('attendance', recordId);
      if (!persisted) return { success: false, message: 'تعذر حذف سجل الحضور من قاعدة البيانات.' };
      setAttendance((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      const nextAttendance: AttendanceRecord[] = attendance.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'حاضرة' as const,
              originalStatus: r.originalStatus || r.status,
              isRevokedMistakenAbsence: true,
              undoneAt: timestamp,
              undoneBy: actorName,
              undoReason: defaultUndoReason,
              reasonForModification: `↩️ تم التراجع عن تسجيل الغياب (سُجلت سهواً) وتثبيت الحضور: ${defaultUndoReason}`,
              modifiedAt: timestamp,
              modifiedBy: actorName,
            }
          : r
      );
      const persisted = await persistEntityFromArray('attendance', attendance, nextAttendance, recordId);
      if (!persisted) return { success: false, message: 'تعذر تحديث سجل الحضور في قاعدة البيانات.' };
      setAttendance(nextAttendance);
    }

    // Deduct student missed lesson & recalculate absence days
    const deltaLessons = isAbsent ? -1 : 0;
    const deltaExcused = isExcused ? -1 : 0;
    
    if (deltaLessons !== 0 || deltaExcused !== 0) {
      const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
        const updatedArray = prev.map((s) => {
          if (s.id !== existing.studentId && s.name !== existing.studentName) return s;
          
          let missedLessons = Math.max(0, (s.totalMissedLessons || 0) + deltaLessons);
          let excusedDays = Math.max(0, (s.excusedAbsenceDays || 0) + deltaExcused);
          
          const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
          const unexcusedDays = Math.floor(missedLessons / lessPerDay);
          
          const first = disciplinarySettings?.firstWarningDays ?? 5;
          const final = disciplinarySettings?.finalWarningDays ?? 10;
          const expel = disciplinarySettings?.expulsionDays ?? 15;
          
          let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
          if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
          else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
          else if (unexcusedDays >= first) newWarn = 'إنذار أول';
          
          return {
            ...s,
            totalMissedLessons: missedLessons,
            unexcusedAbsenceDays: unexcusedDays,
            excusedAbsenceDays: excusedDays,
            warningLevel: newWarn
          };
        });
        return updatedArray;
      });
      if (!committed) return { success: false, message: 'تعذر تحديث إحصائيات الطالبة في قاعدة البيانات.' };
    }

    // Send Notifications & Direct Messages if notifyParent !== false
    const shouldNotify = options?.notifyParent !== false;
    if (shouldNotify) {
      const studentObj = students.find(
        (s) => s.id === existing.studentId || s.name === existing.studentName
      );
      const parentId = studentObj?.parentId || `parent-${existing.studentId}`;
      const parentName = studentObj?.parentName || 'ولي الأمر المحترم';

      const msgSubject = `↩️ [إشعار تصحيح وتراجع] إلغاء تسجيل غياب الطالبة (${existing.studentName})`;
      const msgContent = `إلى: ${parentName} المحترم
تاريخ التصحيح: ${timeStr}
الموضوع: التراجع عن تسجيل غياب يوم (${existing.date}) في مادة (${existing.subject})

نود إحاطتكم رسمياً بأنه قد تم التراجع عن تسجيل الغياب السابق الخاص بابنتكم الطالبة (${existing.studentName}):
• سبب التصحيح: تسجيل الغياب سهواً والتأكد من حضورها ودوامها الفعلي في الحصة.
• القائم بالتراجع والتصحيح: ${actorName}
• الإجراء: تم تثبيت حالة الطالبة (حاضرة رسمياً) وإلغاء خصم حصة الغياب من رصيدها الوزاري وتحديث مستوى الإنذار تلقائياً.

ثانوية ميسان للمتميزات - المنظومة الإلكترونية الموحدة.`;

      const directMsg: DirectMessage = {
        id: `msg-undo-att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        senderId: currentUser?.id || 'school-system',
        senderName: `ثانوية ميسان للمتميزات (${actorName})`,
        senderRole: role === 'admin' ? 'admin' : 'teacher',
        receiverId: parentId,
        receiverName: parentName,
        subject: msgSubject,
        content: msgContent,
        timestamp: timeStr,
        isRead: false,
        folder: 'inbox',
        priority: 'عادي',
      };

      setMessages((prev) => [directMsg, ...prev]);

      // Push notification to parent
      addNotification({
        title: `↩️ تراجع عن تسجيل غياب: ${existing.studentName}`,
        message: `تم التراجع عن تسجيل غياب الطالبة ليوم ${existing.date} في مادة ${existing.subject} (سُجل سهواً) وتثبيت حضورها رسمياً.`,
        type: 'success',
        targetRole: 'parent',
        targetStudentId: existing.studentId,
        targetParentId: parentId,
        senderName: actorName,
        senderRole: role === 'admin' ? 'admin' : 'teacher',
        isRead: false,
      });

      // Push notification to student
      addNotification({
        title: `↩️ تصحيح حضورك في مادة ${existing.subject}`,
        message: `تم إلغاء تسجيل الغياب ليوم ${existing.date} وتثبيتك (حاضرة رسمياً) وتعديل رصيد الغيابات.`,
        type: 'success',
        targetRole: 'student',
        targetStudentId: existing.studentId,
        senderName: actorName,
        senderRole: role === 'admin' ? 'admin' : 'teacher',
        isRead: false,
      });
    }

    // Add system audit log
    addAuditLog({
      action: `التراجع عن تسجيل غياب (سهواً): ${existing.studentName}`,
      actionType: 'update',
      severity: 'warning',
      targetCategory: 'attendance',
      targetId: existing.id,
      targetName: `${existing.studentName} (${existing.date} - ${existing.subject})`,
      details: `تم التراجع عن تسجيل الغياب وحذف حصة الغياب المسجلة سهواً وتثبيت الحضور بواسطة ${actorName}. السبب: ${defaultUndoReason}`,
      userName: actorName,
      userRole: role,
    });

    return {
      success: true,
      message: `تم بنجاح التراجع عن تسجيل الغياب للطالبة (${existing.studentName}) وتثبيت حضورها الرسمي وإعادة ضبط رصيد الغيابات.`,
    };
  };

  /**
   * Batch undo accidental absences
   */
  const batchUndoAccidentalAbsences = async (recordIds: string[], reason?: string) => {
    let count = 0;
    for (const id of recordIds) {
      const res = await undoAccidentalAbsence(id, { reason });
      if (res.success) count++;
    }
    return {
      successCount: count,
      message: `تم بنجاح التراجع عن (${count}) غياب مسجل سهواً وتثبيت حضور الطالبات.`,
    };
  };

  /**
   * Direct undo of unexcused absence days and lessons for a student
   */
  const undoStudentAbsenceDays = async (
    studentId: string,
    daysToUndo: number,
    lessonsToUndo: number = 0,
    reason: string = 'رصد غياب الطالبة سهواً وتأكيد الدوام والانتظام الفعلي',
    notifyParent: boolean = true
  ) => {
    const curTeacher =
      teachers.find(
        (t) =>
          t.id === currentUser?.id ||
          (currentUser?.email && t.email?.toLowerCase() === currentUser?.email.toLowerCase()) ||
          (currentUser?.name && t.name.toLowerCase() === currentUser?.name.toLowerCase())
      ) || currentUser?.teacherObj;

    const actorName =
      currentUser?.name || (role === 'admin' ? 'إدارة ثانوية ميسان للمتميزات' : (curTeacher?.name || 'الهيئة التدريسية'));
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    let targetStudent: Student | undefined;
    
    const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudent = s;
        
        let missedLessons = Math.max(0, (s.totalMissedLessons || 0) - lessonsToUndo);
        // Sometimes days are directly undone
        let unexcusedDays = Math.max(0, (s.unexcusedAbsenceDays || 0) - daysToUndo);
        
        // Let's recalculate unexcusedDays based on missedLessons if lessons were specifically given
        if (lessonsToUndo > 0) {
           const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
           unexcusedDays = Math.floor(missedLessons / lessPerDay);
        } else if (daysToUndo > 0) {
           const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
           missedLessons = Math.max(0, (s.totalMissedLessons || 0) - (daysToUndo * lessPerDay));
        }
        
        const first = disciplinarySettings?.firstWarningDays ?? 5;
        const final = disciplinarySettings?.finalWarningDays ?? 10;
        const expel = disciplinarySettings?.expulsionDays ?? 15;
        
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
        else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
        else if (unexcusedDays >= first) newWarn = 'إنذار أول';
        
        return {
          ...s,
          totalMissedLessons: missedLessons,
          unexcusedAbsenceDays: unexcusedDays,
          warningLevel: newWarn
        };
      });
      return updatedArray;
    });
    if (!committed) return false;

    if (targetStudent && notifyParent) {
      const s = targetStudent as Student;
      const parentId = s.parentId || `parent-${s.id}`;
      const parentName = s.parentName || 'ولي الأمر المحترم';

      const msgSubject = `↩️ [تراجع وتعديل رصيد الغياب] الطالبة (${s.name})`;
      const msgContent = `إلى: ${parentName} المحترم
تاريخ الإجراء: ${timeStr}
الموضوع: التراجع عن رصد غياب مسجل سهواً بحق ابنتكم الطالبة (${s.name})

نحيطكم علماً بأنه قد تم تعديل وتصحيح رصيد الغياب المسجل سهواً:
• عدد الأيام الملغاة: (${daysToUndo}) يوم
• عدد الحصص/الدروس المصححة: (${lessonsToUndo > 0 ? lessonsToUndo : daysToUndo * 5}) درس
• سبب التراجع: ${reason}
• القائم بالإجراء: ${actorName}

تم إعادة احتساب الرصيد الانضباطي ومستوى الإنذار للطالبة بنجاح.`;

      const directMsg: DirectMessage = {
        id: `msg-undo-days-${Date.now()}`,
        senderId: currentUser?.id || 'admin-1',
        senderName: actorName,
        senderRole: role === 'admin' ? 'admin' : 'teacher',
        receiverId: parentId,
        receiverName: parentName,
        subject: msgSubject,
        content: msgContent,
        timestamp: timeStr,
        isRead: false,
        folder: 'inbox',
        priority: 'عادي',
      };

      setMessages((prev) => [directMsg, ...prev]);

      addNotification({
        title: `↩️ تراجع عن أيام غياب: ${s.name}`,
        message: `تم بنجاح خصم (${daysToUndo}) أيام و (${lessonsToUndo > 0 ? lessonsToUndo : daysToUndo * 5}) حصص غياب مسجلة سهواً للطالبة وتحديث الموقف الانضباطي.`,
        type: 'success',
        targetRole: 'parent',
        targetStudentId: s.id,
        targetParentId: parentId,
        senderName: actorName,
        senderRole: role === 'admin' ? 'admin' : 'teacher',
        isRead: false,
      });
    }

    addAuditLog({
      action: `تراجع عن رصيد غياب وحصص مسجلة سهواً: ${targetStudent?.name || studentId}`,
      actionType: 'update',
      severity: 'warning',
      targetCategory: 'attendance',
      targetId: studentId,
      targetName: targetStudent?.name || studentId,
      details: `تم إلغاء (${daysToUndo}) أيام غياب و (${lessonsToUndo}) حصص مسجلة سهواً. السبب: ${reason}`,
      userName: actorName,
      userRole: role,
    });
  };

  const addDisciplinaryDecision = async (
    decisionData: Omit<DisciplinaryDecision, 'id' | 'issueDate'> & { id?: string; issueDate?: string }
  ) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const timeStr = new Date().toISOString().split('T')[0];
    const letterNum = `م/${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`;

    const newDecision: DisciplinaryDecision = {
      ...decisionData,
      id: decisionData.id || `dec-${Date.now()}-${randSuffix}`,
      issueDate: decisionData.issueDate || timeStr,
      officialLetterNumber: decisionData.officialLetterNumber || letterNum,
      issuedBy: decisionData.issuedBy || `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`,
      status: 'نافذ',
    };

    // Update student object
    

    // Send targeted instant notification to parent & student
    const studentObj = students.find((s) => s.id === newDecision.studentId);
    const parentId = studentObj?.parentId;

    const notifTitle = `🚨 [قرار وزاري رسمـي] ${newDecision.decisionType} - الطالبة ${newDecision.studentName}`;
    const notifMsg = `صدر رسمياً قرار إداري وانضباطي من إدارة ثانوية ميسان للمتميزات بحق الطالبة (${newDecision.studentName}) بكتاب رسمي رقم (${newDecision.officialLetterNumber}): ${newDecision.notes || 'تجاوز نسبة الغياب المسموح بها وفق تعليمات وزارة التربية العراقية.'}`;

    addNotification({
      title: notifTitle,
      message: notifMsg,
      type: newDecision.decisionType === 'قرار فصل بسبب الغياب' ? 'alert' : 'warning',
      targetRole: 'parent',
      targetStudentId: newDecision.studentId,
      targetParentId: parentId,
      senderName: newDecision.issuedBy,
      senderRole: 'admin',
      isRead: false,
    });

    addNotification({
      title: notifTitle,
      message: notifMsg,
      type: newDecision.decisionType === 'قرار فصل بسبب الغياب' ? 'alert' : 'warning',
      targetRole: 'student',
      targetStudentId: newDecision.studentId,
      senderName: newDecision.issuedBy,
      senderRole: 'admin',
      isRead: false,
    });

    // Send official letter to messaging system
    const parentName = studentObj?.parentName || 'ولي الأمر المحترم';

    const officialMsg: DirectMessage = {
      id: `msg-dec-${Date.now()}-${randSuffix}`,
      senderId: 'admin-1',
      senderName: 'إدارة ثانوية ميسان للمتميزات - مكتب المديرة',
      senderRole: 'admin',
      receiverId: parentId || `parent-${newDecision.studentId}`,
      receiverName: parentName,
      subject: `[كتاب وزاري رسمي] ${newDecision.decisionType} - الطالبة: ${newDecision.studentName}`,
      content: `إلى: ولي أمر الطالبة المحترم (${parentName})
تاريخ الكتاب: ${newDecision.issueDate}
رقم الإشارة الوزارية: ${newDecision.officialLetterNumber}

استناداً إلى أحكام نظام المدارس الثانوية رقم 2 لسنة 1977 وتعديلاته والتعليمات الوزارية الخاصة بانتظام طالبات مدارس المتميزات:

تقرر إصدار (${newDecision.decisionType}) بحق الطالبة (${newDecision.studentName}) في (${newDecision.gradeLevel} - شعبة ${newDecision.section}) وذلك لتجاوزها عدد أيام الغياب غير المبرر المسموح به والذي بلغ (${newDecision.absenceDaysCount}) يوماً و(${newDecision.missedLessonsCount}) درساً.

تفاصيل القرار والتوجيه الإداري:
${newDecision.notes || 'يرجى مراجعة إدارة المدرسة فوراً لتسوية موقف الانتظام والدراسة.'}

المديرة: ${schoolAdminData.principalName || 'الهام صبيح سعدون'}
ثانوية ميسان للمتميزات - وزارة التربية العراقية.`,
      timestamp: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
      isRead: false,
      folder: 'inbox',
      category: 'official_letter',
      serialNumber: newDecision.officialLetterNumber,
      letterDate: newDecision.issueDate,
      hasOfficialSeal: true,
      priority: 'عاجل وسري',
    };

    setMessages((prev) => [officialMsg, ...prev]);
  };

  const justifyAbsence = async (studentId: string, excusedDays: number, notes: string, attachmentUrl?: string, attachmentName?: string, justifiedDates?: string[]) => {
    const timeStr = new Date().toISOString().split('T')[0];
    const letterNum = `م/ت/${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`;
    const formattedDatesList = justifiedDates && justifiedDates.length > 0 ? justifiedDates.join(' ، ') : '';

    

    // Update attendance records for the justified dates if present
    if (justifiedDates && justifiedDates.length > 0) {
      const committed = await commitChangedCollectionUpdate('attendance', attendance, setAttendance, (prev) => {
        const next = prev.map((rec) => {
          if (rec.studentId === studentId && justifiedDates.includes(rec.date)) {
            return {
              ...rec,
              status: 'مجازة' as const,
              notes: `تم تبرير الغياب بعذر رسمي مصدق (${notes})`,
            };
          }
          return rec;
        });
        return next;
      });
      if (!committed) return false;
    }

    let targetStudent: Student | undefined;
    const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudent = s;
        
        let missedLessons = Math.max(0, (s.totalMissedLessons || 0));
        let unexcusedDays = Math.max(0, (s.unexcusedAbsenceDays || 0) - excusedDays);
        let newExcusedDays = (s.excusedAbsenceDays || 0) + excusedDays;
        
        const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
        // If we justify days, we might want to subtract from missed lessons too
        missedLessons = Math.max(0, missedLessons - (excusedDays * lessPerDay));
        
        const first = disciplinarySettings?.firstWarningDays ?? 5;
        const final = disciplinarySettings?.finalWarningDays ?? 10;
        const expel = disciplinarySettings?.expulsionDays ?? 15;
        
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
        else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
        else if (unexcusedDays >= first) newWarn = 'إنذار أول';
        
        return {
          ...s,
          totalMissedLessons: missedLessons,
          unexcusedAbsenceDays: unexcusedDays,
          excusedAbsenceDays: newExcusedDays,
          warningLevel: newWarn
        };
      });
      return updatedArray;
    });
    if (!committed) return false;

    if (targetStudent) {
      const datesDetail = formattedDatesList ? ` التواريخ: (${formattedDatesList}).` : '';
      addNotification({
        title: `✅ قبول عذر وتبرير غياب - الطالبة ${targetStudent.name}`,
        message: `تمت موافقة الإدارة على تبرير غياب (${excusedDays}) أيام.${datesDetail} بناءً على المستند الرسمي المقدم. تم تعديل السجل وتحديث مستوى الإنذار الوزاري.`,
        type: 'success',
        targetRole: 'parent',
        targetStudentId: studentId,
        targetParentId: targetStudent.parentId,
        senderName: `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`,
        senderRole: 'admin',
        isRead: false,
      });
    }
  };

  const revokeDisciplinaryDecision = (decisionId: string, studentId: string, reason?: string) => {
    let targetStudentName = '';
    let targetParentId: string | undefined;
    // We don't have a DisciplinaryDecision store in state. 
    // We just need to send the notification to the parent/student.
    const targetDecision = { decisionType: 'قرار إداري' };
    
    setStudents((prev) => {
      const updatedArray = prev.map(s => {
        if (s.id !== studentId) return s;
        targetStudentName = s.name;
        targetParentId = s.parentId;
        return s; 
      });
      return updatedArray;
    });

    if (targetDecision) {
      const decType = (targetDecision as DisciplinaryDecision).decisionType;
      const letterNo = (targetDecision as DisciplinaryDecision).officialLetterNumber || 'م/إداري';
      const defaultReason = reason || 'بناءً على التماس رسمي ومراجعة إدارية وتدقيق من قبل إدارة المدرسة';

      // Send push notifications
      const notifTitle = `↩️ [إلغاء وسحب قرار إداري] ${decType} - الطالبة ${targetStudentName}`;
      const notifMsg = `قررت إدارة ثانوية ميسان للمتميزات إلغاء وسحب (${decType}) الصادر برقم كتاب (${letterNo}). السبب: ${defaultReason}. تم تحديث السجل والموقف الانضباطي للطالبة بنجاح.`;

      addNotification({
        title: notifTitle,
        message: notifMsg,
        type: 'info',
        targetRole: 'parent',
        targetStudentId: studentId,
        targetParentId: targetParentId,
        senderName: `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`,
        senderRole: 'admin',
        isRead: false,
      });

      addNotification({
        title: notifTitle,
        message: notifMsg,
        type: 'info',
        targetRole: 'student',
        targetStudentId: studentId,
        senderName: `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`,
        senderRole: 'admin',
        isRead: false,
      });

      // Send official direct message to parent
      const randSuffix = Math.random().toString(36).substring(2, 7);
      const officialRevokeMsg: DirectMessage = {
        id: `msg-rev-${Date.now()}-${randSuffix}`,
        senderId: 'admin-1',
        senderName: 'إدارة ثانوية ميسان للمتميزات - مكتب المديرة',
        senderRole: 'admin',
        receiverId: targetParentId || `parent-${studentId}`,
        receiverName: 'ولي الأمر المحترم',
        subject: `[كتاب رسمي] إلغاء وسحب ${decType} - الطالبة: ${targetStudentName}`,
        content: `إلى: ولي أمر الطالبة المحترم
تاريخ الإلغاء: ${new Date().toISOString().split('T')[0]}
إشارة للكتاب الصادر برقم: ${letterNo}

تحية طيبة وبعد...
نود إعلامكم بأنه بعد التدقيق الإداري ومراجعة أوليات وسجل الطالبة (${targetStudentName})، تقرر رسمياً **إلغاء وسحب (${decType})** الموجه سابقاً وتعديل سجل الدوام والإنذارات وفق الضوابط والتعليمات الوزارية.

سبب التراجع والإلغاء:
${defaultReason}

مع خالص التقدير،
المديرة: ${schoolAdminData.principalName || 'الهام صبيح سعدون'}
ثانوية ميسان للمتميزات`,
        timestamp: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
        isRead: false,
        folder: 'inbox',
        category: 'official_letter',
        serialNumber: `إلغاء/${letterNo}`,
        letterDate: new Date().toISOString().split('T')[0],
        hasOfficialSeal: true,
        priority: 'عاجل',
      };

      setMessages((prev) => [officialRevokeMsg, ...prev]);
    }
  };

  const deleteDisciplinaryDecision = async (decisionId: string, studentId: string) => {
    const committed = await commitChangedCollectionUpdate('students', students, setStudents, (prev) => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        if (!s.disciplinaryDecisions) return s;
        const filteredDecisions = s.disciplinaryDecisions.filter(d => d.id !== decisionId);
        
        // Recalculate warning level if needed based on remaining decisions? 
        // For now just removing it from the array.
        return { ...s, disciplinaryDecisions: filteredDecisions };
      });
      return updated;
    });
    if (!committed) return false;
  };

  const updateDisciplinaryDecision = (decisionId: string, studentId: string, updates: Partial<DisciplinaryDecision>) => {
    
  };

  const revertAbsenceJustification = (decisionId: string, studentId: string, daysToRevert?: number, reason?: string) => {
    revokeDisciplinaryDecision(decisionId, studentId, reason || 'إلغاء تبرير الغياب وإعادة احتساب الأيام غير المبررة');
  };

  const sendAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => {
    const newAnc: Announcement = {
      ...data,
      id: `anc-${Date.now()}`,
      createdAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
      readBy: [],
    };
    const persisted = await persistCollectionDoc('announcements', newAnc.id, newAnc);
    if (!persisted) return false;
    setAnnouncements((prev) => [newAnc, ...prev]);

    // Push notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `📢 ${newAnc.title}`,
      message: `${newAnc.content.substring(0, 80)}...`,
      type: newAnc.priority === 'عاجل' ? 'alert' : 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    await addNotification(notif);
    return true;
  };

  const persistDirectMessageCommand = async (message: DirectMessage): Promise<boolean> => {
    const sourceUser = {
      id: currentUser?.id || role,
      name: currentUser?.name || role,
      role,
    };
    const res = await runTrackedPersistenceWrite(
      () => centralSyncService.persistDirectMessage(message, sourceUser),
      { success: false, message: 'logout-in-progress' }
    );
    if (res.success !== true) {
      setSyncStatus('error');
      setSyncErrorMessage(res.message || 'فشل حفظ الرسالة في قاعدة البيانات');
      return false;
    }
    return true;
  };

  const sendMessage = async (data: Omit<DirectMessage, 'id' | 'timestamp' | 'isRead'> & { id?: string }): Promise<boolean> => {
    const canonicalSender = getCanonicalMessageSender();
    if (!canonicalSender) return false;
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    let sentMsg: DirectMessage;
    if (data.id) {
      const previousDraft = messages.find((m) => m.id === data.id);
      const ownsDraft = Boolean(
        previousDraft?.isDraft &&
          (previousDraft.senderAuthUid
            ? previousDraft.senderAuthUid === canonicalSender.senderAuthUid
            : previousDraft.senderId === canonicalSender.senderId)
      );
      if (!ownsDraft || !previousDraft) return false;
      sentMsg = {
        ...previousDraft,
        ...data,
        ...canonicalSender,
        id: data.id,
        timestamp: timeStr,
        folder: 'sent',
        isDraft: false,
        isSpam: false,
        isRead: true,
      };
    } else {
      const randSuffix = Math.random().toString(36).substring(2, 7);
      sentMsg = {
        ...data,
        ...canonicalSender,
        id: `msg-${Date.now()}-${randSuffix}`,
        timestamp: timeStr,
        isRead: false,
        folder: 'sent',
        isDraft: false,
        isSpam: false,
      };
    }

    const persisted = await persistDirectMessageCommand(sentMsg);
    if (!persisted) return false;
    setMessages((prev) => [sentMsg, ...prev.filter((m) => m.id !== sentMsg.id)]);

    await addNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: lang === 'ar' ? `رسالة جديدة من ${sentMsg.senderName}` : `New message from ${sentMsg.senderName}`,
      message: sentMsg.subject,
      type: 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    });
    return true;
  };

  const saveDraft = async (draftData: Partial<DirectMessage> & { subject: string; content: string }): Promise<boolean> => {
    const canonicalSender = getCanonicalMessageSender();
    if (!canonicalSender) return false;
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    const existing = draftData.id ? messages.find((m) => m.id === draftData.id) : undefined;
    if (existing && (!existing.isDraft || (existing.senderAuthUid ? existing.senderAuthUid !== canonicalSender.senderAuthUid : existing.senderId !== canonicalSender.senderId))) {
      return false;
    }
    const draft: DirectMessage = {
      ...(existing || {} as DirectMessage),
      ...draftData,
      ...canonicalSender,
      id: draftData.id || `msg-draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiverId: draftData.receiverId || existing?.receiverId || '',
      receiverName: draftData.receiverName || existing?.receiverName || 'مستلم محدد',
      subject: draftData.subject || 'مسودة جديدة بدون عنوان',
      content: draftData.content || '',
      timestamp: timeStr,
      isRead: true,
      folder: 'drafts',
      isDraft: true,
    };
    const persisted = await persistDirectMessageCommand(draft);
    if (!persisted) return false;
    setMessages((prev) => [draft, ...prev.filter((m) => m.id !== draft.id)]);
    return true;
  };

  // SECURITY_MESSAGING_APPCONTEXT_IDENTITY_V1_2
  // Resolve mailbox identity only from the verified Firebase-backed CurrentUser.
  // providedUserId is retained for API compatibility but can never select another mailbox.
  const getCurrentUserIdInContext = (providedUserId?: string): string => {
    if (!currentUser?.authUid || currentUser.role !== role) return '';

    const canonicalUserId =
      currentUser.role === 'admin'
        ? currentUser.profileId || currentUser.id || 'admin-main'
        : currentUser.profileId || '';

    if (!canonicalUserId) return '';
    if (providedUserId && providedUserId !== canonicalUserId) return '';
    return canonicalUserId;
  };

  const getCanonicalMessageSender = () => {
    const senderId = getCurrentUserIdInContext();
    if (!senderId || !currentUser?.authUid || !currentUser?.name) return null;
    return {
      senderId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAuthUid: currentUser.authUid,
    };
  };

  // SECURITY_MESSAGING_USER_STATE_APPCONTEXT_V1_3D6B2
  // SECURITY_MESSAGING_USER_STATE_CACHE_COHERENCE_V1_3D6C2
  const applyCurrentUserMessageState = (id: string, targetUserId: string, patch: Record<string, any>) => {
    if (!id || !targetUserId || !currentUser?.authUid) return;

    // SECURITY_MESSAGING_ROLLBACK_V1_3D6E1
    const previousCacheState = messageUserStateCacheRef.current[id];
    const previousMessageUserState = messages.find((m) => m.id === id)?.userStates?.[targetUserId];
    const operationVersion = (messageUserStateOperationRef.current[id] || 0) + 1;
    messageUserStateOperationRef.current[id] = operationVersion;
    clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, id);
    messageUserStatePendingRef.current[id] = createPendingMailboxOperation({
      messageId: id,
      operationVersion,
      patch,
      rollbackCacheState: previousCacheState,
      rollbackUiState: previousMessageUserState,
      targetUserId,
    });
    messageUserStateCacheRef.current[id] = {
      ...(previousCacheState || {}),
      messageId: id,
      ownerAuthUid: currentUser.authUid,
      ...patch,
    };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: { ...prevUState, ...patch },
          },
        };
      })
    );

    const rollbackMailboxOperation = (operationId: string, operation: PendingMailboxOperation) => {
      clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, operationId);
      delete messageUserStatePendingRef.current[operationId];
      if (operation.rollbackCacheState === undefined) delete messageUserStateCacheRef.current[operationId];
      else messageUserStateCacheRef.current[operationId] = operation.rollbackCacheState;
      console.error('[Messaging] Failed to persist mailbox state; restoring last confirmed mailbox state:', operationId);
      setMessages((prev) => prev.map((m) => {
        if (m.id !== operationId) return m;
        const states = { ...(m.userStates || {}) };
        if (operation.rollbackUiState === undefined) delete states[operation.targetUserId];
        else states[operation.targetUserId] = operation.rollbackUiState;
        return { ...m, userStates: states };
      }));
    };

    void centralSyncService.upsertCurrentUserMessageState(id, patch).then((ok) => {
      const pendingOp = messageUserStatePendingRef.current[id];
      if (!pendingOp || pendingOp.operationVersion !== operationVersion) {
        if (!ok) console.error('[Messaging] Stale mailbox state write failed:', id);
        return;
      }
      if (ok) {
        // SECURITY_MESSAGING_SYNC_ISOLATION_V1_3D6F2C_STAGE0
        // SECURITY_MESSAGING_PENDING_RECONCILE_V1_3D6F2C_STAGE0_1
        pendingOp.writeSucceeded = true;
        if (!shouldStartMailboxReconciliation({
          pendingOp,
          scheduledVersion: operationVersion,
          writeSucceeded: true,
        })) return;
        const session = mailboxReconcileSessionRef.current;
        clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, id);
        messageUserStateReconcileTimersRef.current[id] = setTimeout(() => {
          void (async () => {
            const currentOp = messageUserStatePendingRef.current[id];
            if (mailboxReconcileSessionRef.current !== session) return;
            if (isStaleMailboxReconciliation(currentOp, operationVersion)) return;
            try {
              const remote = await centralSyncService.readCurrentUserMessageState(id);
              const stillCurrent = messageUserStatePendingRef.current[id];
              if (mailboxReconcileSessionRef.current !== session) return;
              const decision = reconcileMailboxOperationFromDirectRead({
                pendingOp: stillCurrent,
                scheduledVersion: operationVersion,
                remote,
              });
              if (decision.action === 'ignore') return;
              if (decision.action === 'settle' && decision.remote) {
                clearMailboxReconciliationTimer(messageUserStateReconcileTimersRef.current, id);
                delete messageUserStatePendingRef.current[id];
                messageUserStateCacheRef.current[id] = decision.remote;
                setMessages((prev) => overlayCurrentUserMessageStates(prev));
                return;
              }
              if (stillCurrent) rollbackMailboxOperation(id, stillCurrent);
            } catch (err) {
              const stillCurrent = messageUserStatePendingRef.current[id];
              if (mailboxReconcileSessionRef.current !== session) return;
              if (isStaleMailboxReconciliation(stillCurrent, operationVersion) || !stillCurrent) return;
              console.error('[Messaging] Bounded mailbox reconciliation failed:', id, err);
              rollbackMailboxOperation(id, stillCurrent);
            }
          })();
        }, MAILBOX_PENDING_RECONCILE_MS);
        return;
      }
      rollbackMailboxOperation(id, pendingOp);
    });
  };

  const moveToSpam = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    applyCurrentUserMessageState(id, targetUserId, { folder: 'spam', isSpam: true, isTrash: false, isDeleted: false });
  };

  const restoreFromSpam = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const defaultFolder = message.senderId === targetUserId ? 'sent' : 'inbox';
    applyCurrentUserMessageState(id, targetUserId, { folder: defaultFolder, isSpam: false, isTrash: false });
  };

  const moveToTrash = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    applyCurrentUserMessageState(id, targetUserId, { folder: 'trash', isTrash: true, isSpam: false, isDeleted: false });
  };

  const restoreFromTrash = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const defaultFolder = message.isDraft ? 'drafts' : message.senderId === targetUserId ? 'sent' : 'inbox';
    applyCurrentUserMessageState(id, targetUserId, { folder: defaultFolder, isTrash: false, isSpam: false });
  };

  const archiveMessage = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    applyCurrentUserMessageState(id, targetUserId, { folder: 'archive', isArchived: true, isTrash: false, isSpam: false, isDeleted: false });
  };

  const restoreFromArchive = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const defaultFolder = message.isDraft ? 'drafts' : message.senderId === targetUserId ? 'sent' : 'inbox';
    applyCurrentUserMessageState(id, targetUserId, { folder: defaultFolder, isArchived: false });
  };

  const moveToCustomFolder = (id: string, folderId: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId || !folderId) return;
    applyCurrentUserMessageState(id, targetUserId, { folder: folderId, customFolderId: folderId, isArchived: false, isTrash: false, isSpam: false, isDeleted: false });
  };

  const addCustomFolder = async (folderData: Omit<UserCustomFolder, 'id'>) => {
    const newFolder: UserCustomFolder = {
      ...folderData,
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const persisted = await persistCollectionDoc('customFolders', newFolder.id, newFolder);
    if (!persisted) return false;
    setCustomFolders((prev) => [...prev, newFolder]);
  };

  const deleteCustomFolder = async (folderId: string) => {
    const persisted = await deleteCollectionDoc('customFolders', folderId);
    if (!persisted) return false;
    setCustomFolders((prev) => prev.filter((f) => f.id !== folderId));
    return true;
  };

  const deleteMessage = async (id: string, explicitUserId?: string) => {
    if (role === 'admin' && currentUser?.role === 'admin' && currentUser?.authUid) {
      const persisted = await deleteCollectionDoc('messages', id);
      if (!persisted) return false;
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return true;
    }
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    if (msg.isDraft && (msg.senderAuthUid ? msg.senderAuthUid === currentUser?.authUid : msg.senderId === targetUserId)) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    applyCurrentUserMessageState(id, targetUserId, { isDeleted: true });
  };

  const updateMessage = (updatedMsg: DirectMessage) => {
    const canonicalSender = getCanonicalMessageSender();
    if (!canonicalSender) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== updatedMsg.id) return m;
        const isAdmin = currentUser?.role === 'admin' && role === 'admin';
        const ownsMessage = m.senderAuthUid ? m.senderAuthUid === canonicalSender.senderAuthUid : m.senderId === canonicalSender.senderId;
        if (!isAdmin && !ownsMessage) return m;
        return {
          ...m,
          subject: updatedMsg.subject,
          content: updatedMsg.content,
          receiverId: updatedMsg.receiverId,
          receiverName: updatedMsg.receiverName,
          receiverIds: updatedMsg.receiverIds,
          recipients: updatedMsg.recipients,
          attachments: updatedMsg.attachments,
          priority: updatedMsg.priority,
        };
      })
    );
  };

  const emptyTrashFolder = (explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const trashIds = messages.filter((m) => {
      const uState = m.userStates?.[targetUserId];
      return uState ? (uState.isTrash || uState.folder === 'trash') : (m.isTrash || m.folder === 'trash');
    }).map((m) => m.id);
    trashIds.forEach((id) => applyCurrentUserMessageState(id, targetUserId, { isDeleted: true }));
  };

  const markMessageRead = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    applyCurrentUserMessageState(id, targetUserId, { isRead: true });
  };

  const toggleStarMessage = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const userState = message.userStates?.[targetUserId];
    const currentStarred = userState?.isStarred !== undefined ? userState.isStarred : (message.isStarred ?? false);
    applyCurrentUserMessageState(id, targetUserId, { isStarred: !currentStarred });
  };

  const emptySpamFolder = (explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    if (!targetUserId) return;
    const spamIds = messages.filter((m) => {
      const uState = m.userStates?.[targetUserId];
      return uState ? (uState.isSpam || uState.folder === 'spam') : (m.isSpam || m.folder === 'spam');
    }).map((m) => m.id);
    spamIds.forEach((id) => applyCurrentUserMessageState(id, targetUserId, { isDeleted: true }));
  };

  const addLecture = async (
    data: Omit<LectureResource, 'id' | 'uploadedAt'>,
    options?: {
      resourceId?: string;
    }
  ): Promise<LectureResource> => {
    const lectureId =
      options?.resourceId?.trim() ||
      `lec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const ownerId =
      (typeof data.ownerId === 'string' && data.ownerId.trim()) ||
      (typeof data.uploaderId === 'string' && data.uploaderId.trim()) ||
      (typeof currentUser?.authUid === 'string' ? currentUser.authUid.trim() : '');
    const newLec: LectureResource = {
      ...data,
      id: lectureId,
      uploadedAt: nowIso.split('T')[0],
      createdAt: data.createdAt || nowIso,
      updatedAt: nowIso,
      ownerId: ownerId || undefined,
      ownerName: data.ownerName || data.uploaderName || currentUser?.name,
      ownerRole: data.ownerRole || data.uploaderRole || currentUser?.role,
      uploaderId: data.uploaderId || ownerId || undefined,
      uploaderName: data.uploaderName || data.ownerName || currentUser?.name,
      uploaderRole: data.uploaderRole || data.ownerRole || currentUser?.role,
      access: data.access && data.access.audiences?.length ? data.access : { audiences: ['authenticated'] },
      downloadCount: data.downloadCount ?? 1,
      viewsCount: data.viewsCount ?? 1,
    };

    if (data.storageProvider === 'firebase') {
      if (!newLec.ownerId || !newLec.uploaderId) {
        throw new Error('تعذر حفظ بيانات الملف: معرف المالك غير صالح.');
      }
    }

    if (
      data.storageProvider !== 'firebase' &&
      data.pdfDataUrl &&
      data.pdfDataUrl.length > 50
    ) {
      saveStoredFile(lectureId, data.pdfDataUrl, {
        name: `${newLec.title}.pdf`,
        type: 'application/pdf',
      }).catch(console.error);
    }

    const persistRes = await runTrackedPersistenceWrite(
      () => centralSyncService.upsertCollectionDocument('lectures', lectureId, newLec, undefined, syncSourceUser()),
      { success: false, message: 'logout-in-progress' }
    );
    if (persistRes.success !== true) {
      const persistError = new Error(persistRes.message || 'تعذر حفظ بيانات الملف في Firestore.');
      (persistError as Error & { code?: string }).code = persistRes.message?.includes('permission-denied')
        ? 'permission-denied'
        : persistRes.message?.includes('logout-in-progress')
          ? 'unavailable'
          : undefined;
      throw persistError;
    }

    setLectures((prev) => [newLec, ...prev.filter((row) => row.id !== lectureId)]);

    return newLec;
  };

  const deleteLecture = async (id: string): Promise<boolean> => {
    const target = lectures.find((row) => row.id === id);
    if (!target) return false;
    if (!canManageLibraryResource(target, currentUser)) return false;

    suppressLibraryResourceId(id);
    setDeletedLectureIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('maysan_deleted_lecture_ids_v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save deleted lecture IDs', e);
      }
      return updated;
    });

    const ok = await deleteCollectionDoc('lectures', id);
    if (!ok) {
      clearLibraryResourceSuppression(id);
      setDeletedLectureIds((prev) => {
        const updated = prev.filter((rowId) => rowId !== id);
        try {
          localStorage.setItem('maysan_deleted_lecture_ids_v1', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save deleted lecture IDs', e);
        }
        return updated;
      });
      return false;
    }

    if (target.storagePath) {
      try {
        await deleteLibraryFile(target.storagePath);
      } catch (err) {
        console.error('Library storage delete failed:', err);
      }
    }
    deleteStoredFile(id).catch(console.error);

    let targetLectureTitle = target.title || 'الكتاب / المرجع';
    setLectures((prev) => prev.filter((l) => l.id !== id));

    try {
      const savedBm = localStorage.getItem('maysan_library_bookmarks_v1');
      if (savedBm) {
        const bmList: string[] = JSON.parse(savedBm);
        localStorage.setItem('maysan_library_bookmarks_v1', JSON.stringify(bmList.filter((bId) => bId !== id)));
      }
    } catch {
      // ignore
    }

    try {
      const savedRec = localStorage.getItem('maysan_library_recent_reads_v1');
      if (savedRec) {
        const recList: string[] = JSON.parse(savedRec);
        localStorage.setItem('maysan_library_recent_reads_v1', JSON.stringify(recList.filter((rId) => rId !== id)));
      }
    } catch {
      // ignore
    }

    addAuditLog({
      action: `حذف كتاب / مرجع نهائياً: ${targetLectureTitle}`,
      actionType: 'delete',
      targetCategory: 'system',
      details: `تم حذف الكتاب برقم المعرف (${id}) وجميع ملفاته المرفقة بشكل دائم ونهائي من قاعدة البيانات والمكتبة المدرسية.`,
      severity: 'warning',
    });
    return true;
  };

  const updateLecture = async (id: string, data: Partial<LectureResource>): Promise<boolean> => {
    const target = lectures.find((row) => row.id === id);
    if (!target) return false;
    if (!canManageLibraryResource(target, currentUser)) return false;
    const next = applyManagedLibraryResourceUpdate(target, data);
    next.updatedAt = new Date().toISOString();

    if (
      data.storageProvider !== 'firebase' &&
      data.pdfDataUrl &&
      data.pdfDataUrl.length > 50
    ) {
      saveStoredFile(id, data.pdfDataUrl, {
        name: `${next.title || 'document'}.pdf`,
        type: 'application/pdf',
      }).catch(console.error);
    }

    const ok = await persistCollectionDoc('lectures', id, next, target);
    if (!ok) return false;
    setLectures((prev) => prev.map((l) => (l.id === id ? next : l)));
    return true;
  };

  const recordLectureDownload = (id: string) => {
    setLectures((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, downloadCount: (l.downloadCount || 0) + 1 } : l
      )
    );
  };

  const buildNotificationIdentityCatalog = (): NotificationIdentityCatalog => ({
    teachers: teachers.map((item) => ({ id: item.id, authUid: item.authUid })),
    students: students.map((item) => ({
      id: item.id,
      authUid: item.authUid,
      gradeLevel: item.gradeLevel,
      section: item.section,
    })),
    parents: parents.map((item) => ({ id: item.id, authUid: item.authUid })),
    supervisors: supervisors.map((item) => ({
      id: item.id,
      authUid:
        item.authUid ||
        (currentUser?.role === 'supervisor' &&
        (currentUser.profileId === item.id || currentUser.id === item.id)
          ? currentUser.authUid
          : undefined),
    })),
    adminAuthUid:
      (typeof schoolAdminData.adminAuthUid === 'string' && schoolAdminData.adminAuthUid.trim()) ||
      (currentUser?.role === 'admin' && typeof currentUser.authUid === 'string'
        ? currentUser.authUid.trim()
        : undefined) ||
      undefined,
  });

  // SECURITY_NOTIFICATION_AUTH_UID_CREATE_V1_D6F2
  const addNotification = async (
    notifData: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }
  ): Promise<boolean> => {
    const prepared = prepareNotificationAuthIdentity(
      notifData,
      buildNotificationIdentityCatalog(),
      currentUser?.authUid
    );
    if (!prepared.ok) {
      console.error('[Notifications]', 'reason' in prepared ? prepared.reason : 'recipient-resolution-failed');
      return false;
    }
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newNotif: NotificationItem = {
      ...notifData,
      ...prepared.patch,
      id: notifData.id || `notif-${Date.now()}-${randSuffix}`,
      createdAt: new Date().toISOString(),
      timestamp: notifData.timestamp || (lang === 'ar' ? 'الآن' : 'Just now'),
      isRead: false,
      readBy: [],
    };
    const persisted = await persistCollectionDoc('notifications', newNotif.id, newNotif);
    if (!persisted) return false;
    setNotifications((prev) => [newNotif, ...prev]);
    return true;
  };

  const persistIsolatedNotificationState = (
    notificationId: string,
    next: { isRead: boolean; isDeleted: boolean }
  ) => {
    const uid = typeof currentUser?.authUid === 'string' ? currentUser.authUid.trim() : '';
    if (!uid || !notificationId) return;
    setNotificationUserStates((prev) => ({
      ...prev,
      [notificationId]: {
        notificationId,
        isRead: next.isRead,
        isDeleted: next.isDeleted,
        updatedAt: new Date().toISOString(),
      },
    }));
    void centralSyncService.upsertCurrentUserNotificationState(notificationId, next);
  };

  const deleteNotification = async (id: string, explicitUserId?: string) => {
    // Admin override: Actually delete the notification from the system completely
    if (role === 'admin' || currentUser?.role === 'admin') {
      const persisted = await deleteCollectionDoc('notifications', id);
      if (!persisted) return false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return true;
    }
    const target = notifications.find((n) => n.id === id);
    if (target && notificationHasAuthUidTargeting(target)) {
      const prev = notificationUserStates[id];
      persistIsolatedNotificationState(id, { isRead: prev?.isRead === true, isDeleted: true });
      return;
    }
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
        if (!targetUserId) return n;
        const currentDeletedBy = n.deletedBy || [];
        const updatedDeletedBy = currentDeletedBy.includes(targetUserId)
          ? currentDeletedBy
          : [...currentDeletedBy, targetUserId];
        const prevStates = n.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...n,
          deletedBy: updatedDeletedBy,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isDeleted: true,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );
  };

  const updateNotification = (
    id: string,
    updates: { title?: string; message?: string; type?: 'info' | 'warning' | 'success' | 'alert' | 'security' },
    scope: 'user' | 'global' = 'user',
    explicitUserId?: string
  ) => {
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        if (scope === 'global') {
          return {
            ...n,
            ...updates,
          };
        } else {
          const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
          if (!targetUserId) return n;
          const prevStates = n.userStates || {};
          const prevUState = prevStates[targetUserId] || {};
          return {
            ...n,
            userStates: {
              ...prevStates,
              [targetUserId]: {
                ...prevUState,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }
      })
    );
  };

  const getUserNotifications = (
    overrideRole?: UserRole,
    overrideUser?: CurrentUser | null
  ): NotificationItem[] => {
    const activeRole = overrideRole || role;
    const activeUser = overrideUser !== undefined ? overrideUser : currentUser;

    const activeTeacherObj =
      activeUser?.teacherObj ||
      teachers.find(
        (t) =>
          (activeUser?.id && t.id === activeUser.id) ||
          (activeUser?.email && t.email?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (activeUser?.name && t.name.toLowerCase() === activeUser.name.toLowerCase())
      );

    const activeStudentObj =
      activeUser?.studentObj ||
      students.find(
        (s) =>
          (activeUser?.id && s.id === activeUser.id) ||
          (activeUser?.email && s.email?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (activeUser?.phone && (s.phone === activeUser.phone || s.parentPhone === activeUser.phone)) ||
          (activeUser?.name &&
            (s.name.toLowerCase() === activeUser.name.toLowerCase() ||
              s.name.toLowerCase().includes(activeUser.name.toLowerCase()) ||
              activeUser.name.toLowerCase().includes(s.name.toLowerCase())))
      );

    const activeParentObj =
      parents.find(
        (p) =>
          (activeUser?.id && p.id === activeUser.id) ||
          (activeUser?.email && p.email.toLowerCase() === activeUser.email.toLowerCase()) ||
          (activeUser?.phone && p.phone === activeUser.phone)
      ) || activeUser?.parentObj;

    const currentUserId =
      activeUser?.id ||
      (activeRole === 'admin'
        ? 'admin-main'
        : activeRole === 'teacher'
        ? activeTeacherObj?.id || 'tech-1'
        : activeRole === 'student'
        ? activeStudentObj?.id || 'std-1'
        : activeRole === 'parent'
        ? activeParentObj?.id || 'prt-1'
        : 'sup-1');

    const daughters = students.filter(
      (s) =>
        (activeParentObj && s.parentEmail.toLowerCase() === activeParentObj.email.toLowerCase()) ||
        (activeParentObj && s.parentPhone === activeParentObj.phone) ||
        (activeParentObj && s.parentName === activeParentObj.name) ||
        (activeParentObj && s.parentId === activeParentObj.id) ||
        (activeStudentObj && s.id === activeStudentObj.id)
    );
    const daughterIds = daughters.map((d) => d.id);
    const daughterGrades = daughters.map((d) => d.gradeLevel);
    const daughterParentIds = daughters.map((d) => d.parentId).filter(Boolean) as string[];

    return notifications
      .filter((n) => {
        if (notificationHasAuthUidTargeting(n)) {
          const uid = typeof activeUser?.authUid === 'string' ? activeUser.authUid.trim() : '';
          if (!uid) return false;
          const flags = applyIsolatedNotificationState(n, uid, notificationUserStates);
          if (flags.isDeleted) return false;
          return notificationVisibleToAuthUid(n, uid);
        }

        // 0. Check per-user deletion isolation
        if (n.deletedBy && n.deletedBy.includes(currentUserId)) return false;
        if (n.userStates?.[currentUserId]?.isDeleted) return false;

        // 0.b. Private Account Security Alerts (Password change / reset) - STRICTLY for account owner only!
        if (n.isPrivateAccountSecurity) {
          if (n.targetRole && n.targetRole !== activeRole) return false;
          if (n.targetTeacherId && n.targetTeacherId !== currentUserId && n.targetTeacherId !== activeTeacherObj?.id) return false;
          if (n.targetStudentId && n.targetStudentId !== currentUserId && n.targetStudentId !== activeStudentObj?.id) return false;
          if (n.targetParentId && n.targetParentId !== currentUserId && n.targetParentId !== activeParentObj?.id) return false;
          if (n.targetUserId && n.targetUserId !== currentUserId) {
            const matchesEntity =
              (activeTeacherObj && n.targetUserId === activeTeacherObj.id) ||
              (activeStudentObj && n.targetUserId === activeStudentObj.id) ||
              (activeParentObj && n.targetUserId === activeParentObj.id);
            if (!matchesEntity) return false;
          }
          return true;
        }

        // 1. Educational Supervisor rule: DO NOT send attendance notifications to the supervisor
        if (activeRole === 'supervisor') {
          if (n.isAttendanceNotif) return false;
          if (n.targetRole && n.targetRole !== 'supervisor' && n.targetRole !== 'all') return false;
        }

        // 2. Teacher rule: Target Subject Teacher ONLY (current account, excluding other teachers)
        if (activeRole === 'teacher') {
          if (n.targetRole && n.targetRole !== 'teacher' && n.targetRole !== 'all') return false;
          if (n.targetTeacherId) {
            const matchesTeacher =
              n.targetTeacherId === currentUserId ||
              n.targetTeacherId === activeTeacherObj?.id ||
              (activeTeacherObj?.email && n.targetTeacherId.toLowerCase() === activeTeacherObj.email.toLowerCase());
            if (!matchesTeacher) return false;
          }
          if (n.targetTeacherIds && Array.isArray(n.targetTeacherIds) && n.targetTeacherIds.length > 0) {
            const matchesAnyTeacher =
              n.targetTeacherIds.includes(currentUserId) ||
              (activeTeacherObj?.id && n.targetTeacherIds.includes(activeTeacherObj.id));
            if (!matchesAnyTeacher) return false;
          }
          if (n.isAttendanceNotif && !n.targetTeacherId && n.targetUserId && n.targetUserId !== currentUserId && n.targetUserId !== activeTeacherObj?.id) {
            return false;
          }
        }

        // 3. Student rule: Target Class & Section Students ONLY
        if (activeRole === 'student') {
          if (n.targetRole && n.targetRole !== 'student' && n.targetRole !== 'all') return false;
          if (n.targetStudentId) {
            if (activeStudentObj && n.targetStudentId !== activeStudentObj.id) return false;
          }
          if (n.targetStudentIds && Array.isArray(n.targetStudentIds) && n.targetStudentIds.length > 0) {
            if (activeStudentObj && !n.targetStudentIds.includes(activeStudentObj.id)) return false;
          }
          if (n.targetGradeLevel && n.targetGradeLevel !== 'الكل') {
            if (activeStudentObj && activeStudentObj.gradeLevel !== n.targetGradeLevel) return false;
          }
          if (n.targetSection && n.targetSection !== 'الكل') {
            if (activeStudentObj && activeStudentObj.section !== n.targetSection) return false;
          }
        }

        // 4. Parent rule: Target Class & Section Parents ONLY
        if (activeRole === 'parent') {
          if (n.targetRole && n.targetRole !== 'parent' && n.targetRole !== 'all') return false;
          if (n.targetParentId) {
            const matchesParent = (activeParentObj && n.targetParentId === activeParentObj.id) || daughterParentIds.includes(n.targetParentId);
            if (!matchesParent) return false;
          }
          if (n.targetParentIds && Array.isArray(n.targetParentIds) && n.targetParentIds.length > 0) {
            const matchesAnyParent = (activeParentObj?.id && n.targetParentIds.includes(activeParentObj.id)) || daughterParentIds.some((pId) => n.targetParentIds?.includes(pId));
            if (!matchesAnyParent) return false;
          }
          if (n.targetStudentId) {
            if (!daughterIds.includes(n.targetStudentId)) return false;
          }
          if (n.targetStudentIds && Array.isArray(n.targetStudentIds) && n.targetStudentIds.length > 0) {
            const matchesAnyDaughter = daughterIds.some((dId) => n.targetStudentIds?.includes(dId));
            if (!matchesAnyDaughter) return false;
          }
          if (n.targetGradeLevel && n.targetGradeLevel !== 'الكل') {
            if (daughterGrades.length > 0 && !daughterGrades.includes(n.targetGradeLevel)) return false;
          }
          if (n.targetSection && n.targetSection !== 'الكل') {
            const daughterSections = daughters.map((d) => d.section);
            if (daughterSections.length > 0 && !daughterSections.includes(n.targetSection)) return false;
          }
        }

        // 5. Admin / Principal rule
        if (activeRole === 'admin') {
          if (n.targetRole && n.targetRole !== 'admin' && n.targetRole !== 'all') {
            if (!n.targetUserId || (n.targetUserId !== currentUserId && n.targetUserId !== 'admin-main')) return false;
          }
        }

        // 6. Direct Target User ID check
        if (n.targetUserId) {
          if (n.targetUserId === currentUserId) return true;
          if (n.targetUserId === 'broadcast-all-teachers' && activeRole === 'teacher') return true;
          if (n.targetUserId === 'broadcast-all-students' && activeRole === 'student') return true;
          if (n.targetUserId === 'broadcast-all-parents' && activeRole === 'parent') return true;
          if (n.targetUserId === 'broadcast-all' || n.targetUserId === 'all') return true;
          return false;
        }

        // 7. Target User IDs list check
        if (n.targetUserIds && Array.isArray(n.targetUserIds) && n.targetUserIds.length > 0) {
          if (
            n.targetUserIds.includes(currentUserId) ||
            (activeTeacherObj?.id && n.targetUserIds.includes(activeTeacherObj.id)) ||
            (activeStudentObj?.id && n.targetUserIds.includes(activeStudentObj.id)) ||
            (activeParentObj?.id && n.targetUserIds.includes(activeParentObj.id))
          ) {
            return true;
          }
          return false;
        }

        // 8. Target Student ID check
        if (n.targetStudentId) {
          if (activeRole === 'student') {
            return activeStudentObj ? n.targetStudentId === activeStudentObj.id : false;
          }
          if (activeRole === 'parent') {
            return daughterIds.includes(n.targetStudentId);
          }
          if (activeRole === 'admin') {
            return true;
          }
          if (activeRole === 'teacher') {
            if (!n.targetGradeLevel || n.targetGradeLevel === 'الكل') return true;
            return activeTeacherObj?.assignedGrades?.includes(n.targetGradeLevel as GradeLevel) ?? true;
          }
          if (activeRole === 'supervisor') {
            return false;
          }
        }

        // 8.b. Target Student IDs list check
        if (n.targetStudentIds && Array.isArray(n.targetStudentIds) && n.targetStudentIds.length > 0) {
          if (activeRole === 'student') {
            return activeStudentObj ? n.targetStudentIds.includes(activeStudentObj.id) : false;
          }
          if (activeRole === 'parent') {
            return daughterIds.some((dId) => n.targetStudentIds?.includes(dId));
          }
          if (activeRole === 'admin') {
            return true;
          }
          if (activeRole === 'teacher') {
            if (!n.targetGradeLevel || n.targetGradeLevel === 'الكل') return true;
            return activeTeacherObj?.assignedGrades?.includes(n.targetGradeLevel as GradeLevel) ?? true;
          }
        }

        // 9. Target Parent ID check
        if (n.targetParentId) {
          if (activeRole === 'parent') {
            return activeParentObj ? (n.targetParentId === activeParentObj.id || daughterParentIds.includes(n.targetParentId)) : false;
          }
          if (activeRole === 'admin') return true;
          return false;
        }

        // 9.b. Target Parent IDs list check
        if (n.targetParentIds && Array.isArray(n.targetParentIds) && n.targetParentIds.length > 0) {
          if (activeRole === 'parent') {
            return (activeParentObj && n.targetParentIds.includes(activeParentObj.id)) || daughterParentIds.some((pId) => n.targetParentIds?.includes(pId));
          }
          if (activeRole === 'admin') return true;
          return false;
        }

        // 10. Target Role check
        if (n.targetRole && n.targetRole !== 'all') {
          if (n.targetRole === 'admin' && activeRole !== 'admin') return false;
          if (n.targetRole === 'teacher' && activeRole !== 'teacher') return false;
          if (n.targetRole === 'student' && activeRole !== 'student') return false;
          if (n.targetRole === 'parent' && activeRole !== 'parent') return false;
          if (n.targetRole === 'supervisor' && activeRole !== 'supervisor') return false;
        }

        // 11. Target Grade Level check
        if (n.targetGradeLevel && n.targetGradeLevel !== 'الكل') {
          if (activeRole === 'student') {
            if (activeStudentObj && activeStudentObj.gradeLevel !== n.targetGradeLevel) return false;
          }
          if (activeRole === 'parent') {
            if (daughterGrades.length > 0 && !daughterGrades.includes(n.targetGradeLevel)) return false;
          }
          if (activeRole === 'teacher') {
            if (
              activeTeacherObj?.assignedGrades &&
              activeTeacherObj.assignedGrades.length > 0 &&
              !activeTeacherObj.assignedGrades.includes(n.targetGradeLevel)
            ) {
              return false;
            }
          }
        }

        // 12. Target Section check
        if (n.targetSection && n.targetSection !== 'الكل') {
          if (activeRole === 'student' && activeStudentObj) {
            if (activeStudentObj.section !== n.targetSection) return false;
          }
        }

        return true;
      })
      .map((n) => {
        const stateKey = getNotificationActorStateKey(n, activeUser, currentUserId);
        if (notificationHasAuthUidTargeting(n)) {
          const uid = typeof activeUser?.authUid === 'string' ? activeUser.authUid.trim() : '';
          const flags = applyIsolatedNotificationState(n, uid, notificationUserStates);
          return {
            ...n,
            isRead: flags.isRead,
          };
        }
        const uState = stateKey ? n.userStates?.[stateKey] : undefined;
        const isReadForThisUser =
          uState?.isRead !== undefined
            ? uState.isRead
            : Boolean(stateKey && n.readBy && n.readBy.includes(stateKey));
        const userTitle = uState?.title || n.title;
        const userMessage = uState?.message || n.message;
        const userType = uState?.type || n.type;

        return {
          ...n,
          title: userTitle,
          message: userMessage,
          type: userType,
          isRead: isReadForThisUser,
        };
      });
  };

  const markNotificationRead = (id: string, explicitUserId?: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && notificationHasAuthUidTargeting(target)) {
      const prev = notificationUserStates[id];
      persistIsolatedNotificationState(id, { isRead: true, isDeleted: prev?.isDeleted === true });
      return;
    }
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
        if (!targetUserId) return n;
        const currentReadBy = n.readBy || [];
        const updatedReadBy = currentReadBy.includes(targetUserId)
          ? currentReadBy
          : [...currentReadBy, targetUserId];
        const prevStates = n.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...n,
          readBy: updatedReadBy,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isRead: true,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );
  };

  const toggleNotificationRead = (id: string, explicitUserId?: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && notificationHasAuthUidTargeting(target)) {
      const uid = typeof currentUser?.authUid === 'string' ? currentUser.authUid.trim() : '';
      const flags = applyIsolatedNotificationState(target, uid, notificationUserStates);
      persistIsolatedNotificationState(id, { isRead: !flags.isRead, isDeleted: flags.isDeleted });
      return;
    }
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
        if (!targetUserId) return n;
        const prevStates = n.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        const currentIsRead =
          prevUState.isRead !== undefined
            ? prevUState.isRead
            : Boolean(n.readBy && n.readBy.includes(targetUserId));
        const newIsRead = !currentIsRead;

        const currentReadBy = n.readBy || [];
        let updatedReadBy = [...currentReadBy];
        if (newIsRead && !updatedReadBy.includes(targetUserId)) {
          updatedReadBy.push(targetUserId);
        } else if (!newIsRead && updatedReadBy.includes(targetUserId)) {
          updatedReadBy = updatedReadBy.filter((u) => u !== targetUserId);
        }

        return {
          ...n,
          readBy: updatedReadBy,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isRead: newIsRead,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );
  };

  const markAllNotificationsRead = (explicitUserId?: string) => {
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    const userNotifs = getUserNotifications(role, currentUser);
    userNotifs.forEach((n) => {
      if (notificationHasAuthUidTargeting(n)) {
        const prev = notificationUserStates[n.id];
        persistIsolatedNotificationState(n.id, { isRead: true, isDeleted: prev?.isDeleted === true });
      }
    });
    const legacyIds = new Set(userNotifs.filter((n) => !notificationHasAuthUidTargeting(n)).map((n) => n.id));
    if (legacyIds.size === 0) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (!legacyIds.has(n.id)) return n;
        const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
        if (!targetUserId) return n;
        const currentReadBy = n.readBy || [];
        const updatedReadBy = currentReadBy.includes(targetUserId)
          ? currentReadBy
          : [...currentReadBy, targetUserId];
        const prevStates = n.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...n,
          readBy: updatedReadBy,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isRead: true,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );
  };

  const clearAllUserNotifications = (explicitUserId?: string) => {
    const legacyProfileId = getCurrentUserIdInContext(explicitUserId);
    const userNotifs = getUserNotifications(role, currentUser);
    userNotifs.forEach((n) => {
      if (notificationHasAuthUidTargeting(n)) {
        const prev = notificationUserStates[n.id];
        persistIsolatedNotificationState(n.id, { isRead: prev?.isRead === true, isDeleted: true });
      }
    });
    const legacyIds = new Set(userNotifs.filter((n) => !notificationHasAuthUidTargeting(n)).map((n) => n.id));
    if (legacyIds.size === 0) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (!legacyIds.has(n.id)) return n;
        const targetUserId = getNotificationActorStateKey(n, currentUser, legacyProfileId);
        if (!targetUserId) return n;
        const currentDeletedBy = n.deletedBy || [];
        const updatedDeletedBy = currentDeletedBy.includes(targetUserId)
          ? currentDeletedBy
          : [...currentDeletedBy, targetUserId];
        const prevStates = n.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...n,
          deletedBy: updatedDeletedBy,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isDeleted: true,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );
  };

  // Timetable Handlers — explicit persistence: write first, then expose success to the UI.
  const updateTimetableSlot = async (id: string, updated: Partial<TimetableSlot>): Promise<boolean> => {
    const before = timetable.find((slot) => slot.id === id);
    if (!before) return false;
    const after = { ...before, ...updated };
    const ok = await persistCollectionDoc('timetable', id, after, before);
    if (ok) setTimetable((prev) => prev.map((slot) => (slot.id === id ? after : slot)));
    return ok;
  };

  const addTimetableSlot = async (slotData: Omit<TimetableSlot, 'id'>): Promise<boolean> => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const ok = await persistCollectionDoc('timetable', newSlot.id, newSlot);
    if (ok) setTimetable((prev) => [...prev, newSlot]);
    return ok;
  };

  const deleteTimetableSlot = async (id: string): Promise<boolean> => {
    const ok = await deleteCollectionDoc('timetable', id);
    if (ok) setTimetable((prev) => prev.filter((slot) => slot.id !== id));
    return ok;
  };

  const saveFullTimetable = async (slots: TimetableSlot[]): Promise<boolean> => {
    const ok = await persistChangedCollectionDocs('timetable', timetable, slots, true);
    if (ok) setTimetable(slots);
    return ok;
  };

  const updateSubjectQuota = async (id: string, updated: Partial<GradeSubjectQuota>): Promise<boolean> => {
    const before = subjectQuotas.find((quota) => quota.id === id);
    if (!before) return false;
    const after = { ...before, ...updated };
    const ok = await persistCollectionDoc('subjectQuotas', id, after, before);
    if (ok) setSubjectQuotas((prev) => prev.map((quota) => (quota.id === id ? after : quota)));
    return ok;
  };

  const addSubjectQuota = async (quotaData: Omit<GradeSubjectQuota, 'id'>): Promise<boolean> => {
    const newQuota: GradeSubjectQuota = {
      ...quotaData,
      id: `quota-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const ok = await persistCollectionDoc('subjectQuotas', newQuota.id, newQuota);
    if (ok) setSubjectQuotas((prev) => [...prev, newQuota]);
    return ok;
  };

  const deleteSubjectQuota = async (id: string): Promise<boolean> => {
    const ok = await deleteCollectionDoc('subjectQuotas', id);
    if (ok) setSubjectQuotas((prev) => prev.filter((quota) => quota.id !== id));
    return ok;
  };

  const saveSubjectQuotas = async (quotas: GradeSubjectQuota[]): Promise<boolean> => {
    const ok = await persistChangedCollectionDocs('subjectQuotas', subjectQuotas, quotas, true);
    if (ok) setSubjectQuotas(quotas);
    return ok;
  };

  const exportDataJSON = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      securityNote: 'Security Hardening V1: authentication secrets are intentionally excluded from backups.',
      school: 'مدرسة ثانوية ميسان للمتميزات',
      teachers,
      students,
      parents,
      graduates,
      exams,
      submissions,
      attendance,
      announcements,
      messages,
      lectures,
      timetable,
      subjectQuotas,
      financial,
      notifications,
      certificates,
      calendarEvents,
      schoolAdminData,
      challenges,
      decisionSettings,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Maysan_Gifted_School_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addAuditLog({
      action: 'تصدير نسخة احتياطية شاملة للنظام',
      actionType: 'export_data',
      targetCategory: 'system',
      details: 'تم بنجاح تصدير ملف النسخة الاحتياطية الشاملة لكافة بيانات المدرسة والمستخدمين وسجلات التدقيق',
      severity: 'info',
    });
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.teachers) setTeachers(parsed.teachers);
      if (parsed.students) setStudents(parsed.students);
      if (parsed.parents) setParents(parsed.parents);
      if (parsed.graduates) setGraduates(parsed.graduates);
      if (parsed.exams) setExams(parsed.exams);
      if (parsed.submissions) setSubmissions(parsed.submissions);
      if (parsed.attendance) setAttendance(parsed.attendance);
      if (parsed.announcements) setAnnouncements(parsed.announcements);
      if (parsed.messages) setMessages(parsed.messages);
      if (parsed.lectures) setLectures(filterRuntimeLibraryResources(parsed.lectures));
      if (parsed.timetable) setTimetable(parsed.timetable);
      if (parsed.subjectQuotas) setSubjectQuotas(parsed.subjectQuotas);
      if (parsed.financial) setFinancial(parsed.financial);
      if (parsed.notifications) setNotifications(parsed.notifications);
      if (parsed.certificates) setCertificates(parsed.certificates);
      if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
      if (parsed.schoolAdminData) setSchoolAdminData(parsed.schoolAdminData);
      if (parsed.challenges) setChallenges(parsed.challenges);
      if (parsed.deletedChallengeIds && Array.isArray(parsed.deletedChallengeIds)) {
        setDeletedChallengeIds(parsed.deletedChallengeIds);
        try {
          localStorage.setItem('maysan_deleted_challenge_ids_v1', JSON.stringify(parsed.deletedChallengeIds));
        } catch {
          // ignore
        }
      }
      if (parsed.decisionSettings) setDecisionSettings(parsed.decisionSettings);
      if (parsed.disciplinarySettings) setDisciplinarySettings(parsed.disciplinarySettings);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);

      addAuditLog({
        action: 'استيراد واستعادة نسخة احتياطية للنظام',
        actionType: 'backup_restore',
        targetCategory: 'system',
        details: 'تم استعادة بيانات النظام وتحديث الجداول والملفات بنجاح',
        severity: 'warning',
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setTeachers(INITIAL_TEACHERS);
    setStudents(INITIAL_STUDENTS);
    setParents(INITIAL_PARENTS);
    setGraduates(INITIAL_GRADUATES);
    setExams(INITIAL_EXAMS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setAttendance(INITIAL_ATTENDANCE);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setMessages(INITIAL_MESSAGES);
    setLectures([]);
    setTimetable(INITIAL_TIMETABLE);
    setSubjectQuotas(INITIAL_SUBJECT_QUOTAS);
    setFinancial(INITIAL_FINANCIAL);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCertificates(INITIAL_CERTIFICATES);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setSchoolAdminData(INITIAL_SCHOOL_ADMIN_DATA);
    setDecisionSettings(DEFAULT_MINISTRY_DECISION_SETTINGS);
    setDisciplinarySettings(DEFAULT_DISCIPLINARY_SETTINGS);
    setChallenges(INITIAL_CHALLENGES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDeletedLectureIds([]);
    setDeletedChallengeIds([]);
    localStorage.removeItem('maysan_deleted_lecture_ids_v1');
    localStorage.removeItem('maysan_deleted_challenge_ids_v1');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const purgeAuthenticatedSessionMemory = () => {
    const next = applyCanonicalGuestMemoryPurge({
      teachers,
      students,
      parents,
      supervisors,
      graduates,
      exams,
      submissions,
      attendance,
      announcements,
      messages,
      lectures,
      timetable,
      subjectQuotas,
      financial,
      notifications,
      certificates,
      academicEnrollments,
      accelerationPolicies,
      accelerationAttempts,
      calendarEvents,
      customFolders,
      auditLogs,
      annualPlans,
      dailyLessonPlans,
      examSchedules,
      challenges,
      deletedLectureIds,
      deletedChallengeIds,
      userPasscodes,
      notificationUserStates,
      schoolAdminData,
      activeTakingExam,
    });
    setTeachers(next.teachers);
    setStudents(next.students);
    setParents(next.parents);
    setSupervisors(next.supervisors);
    setGraduates(next.graduates);
    setExams(next.exams);
    setSubmissions(next.submissions);
    setAttendance(next.attendance);
    setAnnouncements(next.announcements);
    setMessages(next.messages);
    setLectures(filterRuntimeLibraryResources(next.lectures));
    setTimetable(next.timetable);
    setSubjectQuotas(next.subjectQuotas);
    setFinancial(next.financial);
    setNotifications(next.notifications);
    setCertificates(next.certificates);
    setAcademicEnrollments(next.academicEnrollments);
    setAccelerationPolicies(next.accelerationPolicies);
    setAccelerationAttempts(next.accelerationAttempts);
    setCalendarEvents(next.calendarEvents);
    setCustomFolders(next.customFolders);
    setAuditLogs(next.auditLogs);
    setAnnualPlans(next.annualPlans);
    setDailyLessonPlans(next.dailyLessonPlans);
    setExamSchedules(next.examSchedules);
    setChallenges(next.challenges);
    setDeletedLectureIds(next.deletedLectureIds);
    setDeletedChallengeIds(next.deletedChallengeIds);
    setUserPasscodes(next.userPasscodes);
    setNotificationUserStates(next.notificationUserStates);
    setActiveTakingExam(next.activeTakingExam);
    teachersRef.current = next.teachers;
    studentsRef.current = next.students;
    graduatesRef.current = next.graduates;
    messageUserStateCacheRef.current = {};
    messageUserStateOperationRef.current = {};
    clearMailboxPendingRuntime();
  };

  const completeAuthenticatedLogout = async () => {
    const admission = admitAuthenticatedLogout(sessionAdmissionRef.current);
    if (!admission.admitted) {
      return;
    }
    try {
      await FirebaseAuthService.logout();
    } catch {
      // Fail-closed guest transition: Auth already gone or unavailable.
      // Admission stays closed so no new persistence write can start.
    }
    purgeAuthenticatedSessionMemory();
    setCurrentUser(null);
    try {
      localStorage.removeItem('maysan_current_user_v1');
      localStorage.removeItem('maysan_current_role');
    } catch {
      // ignore storage access failures
    }
    armLogoutUnloadBypass(sessionAdmissionRef.current);
    window.location.replace(`${window.location.origin}/`);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        completeAuthenticatedLogout,
        lang,
        setLang,
        colorTheme,
        setColorTheme,
        isDarkMode,
        toggleDarkMode,
        t,
        teachers,
        students,
        parents,
        supervisors,
        graduates,
        addGraduate,
        updateGraduate,
        deleteGraduate,
        promoteStudents,
        exams,
        submissions,
        attendance,
        announcements,
        messages,
        lectures,
        timetable,
        financial,
        notifications,
        certificates,
        academicEnrollments,
        accelerationPolicies,
        accelerationAttempts,
        executeStudentRepeatYear,
        executeStudentRegularPromotion,
        executeStudentAccelerationPromotion,
        upsertAccelerationPolicy,
        deleteAccelerationPolicy,
        upsertAccelerationAttempt,
        calendarEvents,
        schoolAdminData,
        updateSchoolAdminData,
        persistPublicHomepageNews,
        persistPublicHomepageGallery,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        decisionSettings,
    updateDecisionSettings,
    disciplinarySettings,
    updateDisciplinarySettings,
        applySubjectDecisionMarks,
        autoOptimizeDecisionMarksForCert,
        resetDecisionMarksForCert,
        updateCertificate,
        updateSubjectGrade,
        batchUpdateStudentGrades,
        commitCertificate,
        recalculateCertificate,
        addStudentCertificate,
        issueCertificatesForScope,
        deleteCertificate,
        deleteMultipleCertificates,
        deleteCertificatesForScope,
        clearAllCertificates,
        userPasscodes,
        getUserPasscode,
        adminUpdateUserPasscode,
        adminResetUserPasscode,
        changePassword,
        resetPassword,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addStudent,
        updateStudent,
        deleteStudent,
        addShieldToStudent,
        removeShieldFromStudent,
        updateStudentBadges,
        updateParent,
        deleteParent,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        setPrimarySupervisor,
        updateFinancialRecord,
        addFinancialRecord,
        deleteFinancialRecord,
        updateTimetableSlot,
        addTimetableSlot,
        deleteTimetableSlot,
        saveFullTimetable,
        subjectQuotas,
        updateSubjectQuota,
        addSubjectQuota,
        deleteSubjectQuota,
        saveSubjectQuotas,
        createExam,
        updateExam,
        deleteExam,
        duplicateExam,
        toggleExamStatus,
        submitExam,
        updateSubmission,
        regradeSubmission,
        regradeAllExamSubmissions,
        deleteSubmission,
        logAttendance,
        updateAttendanceRecord,
        batchUpdateAttendanceRecords,
        deleteAttendanceRecord,
        deleteAttendanceRecordsForSession,
        recalculateStudentAbsenceStats,
        canUndoAttendance,
        undoAccidentalAbsence,
        batchUndoAccidentalAbsences,
        undoStudentAbsenceDays,
        sendAnnouncement,
        sendMessage,
        updateMessage,
        saveDraft,
        moveToSpam,
        restoreFromSpam,
        moveToTrash,
        restoreFromTrash,
        archiveMessage,
        restoreFromArchive,
        moveToCustomFolder,
        customFolders,
        addCustomFolder,
        deleteCustomFolder,
        deleteMessage,
        markMessageRead,
        toggleStarMessage,
        emptySpamFolder,
        emptyTrashFolder,
        addLecture,
        deleteLecture,
        updateLecture,
        recordLectureDownload,
        addNotification,
        deleteNotification,
        updateNotification,
        markNotificationRead,
        toggleNotificationRead,
        markAllNotificationsRead,
        clearAllUserNotifications,
        getUserNotifications,
        addDisciplinaryDecision,
        revokeDisciplinaryDecision,
        deleteDisciplinaryDecision,
        updateDisciplinaryDecision,
        revertAbsenceJustification,
        justifyAbsence,
        exportDataJSON,
        importDataJSON,
        resetToDefaultData,
        activeTakingExam,
        setActiveTakingExam,
        challenges,
        canUserManageChallenge,
        addChallenge,
        updateChallenge,
        deleteChallenge,
        addQuestionToChallenge,
        updateQuestionInChallenge,
        deleteQuestionFromChallenge,
        submitChallengeAttempt,
        updateParticipationStatus,
        registerStudentForChallenge,
        deleteParticipation,
        auditLogs,
        addAuditLog,
        deleteAuditLog,
        clearAuditLogs,
        exportAuditLogsJSON,
        exportAuditLogsCSV,
        annualPlans,
        dailyLessonPlans,
        addAnnualPlan,
        updateAnnualPlan,
        deleteAnnualPlan,
        duplicateAnnualPlan,
        toggleAnnualTopicCompletion,
        approveAnnualPlan,
        addDailyLessonPlan,
        updateDailyLessonPlan,
        deleteDailyLessonPlan,
        duplicateDailyLessonPlan,
        approveDailyLessonPlan,
        examSchedules,
        addExamSchedule,
        updateExamSchedule,
        deleteExamSchedule,
        duplicateExamSchedule,
        toggleExamSchedulePublish,
        syncStatus,
        syncVersion,
        lastSyncedAt,
        lastSyncedBy,
        syncLatencyMs,
        syncErrorMessage,
        forceSyncAll,
        resetCentralDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
