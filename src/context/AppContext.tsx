/**
 * Central State Management & Persistence for Maysan High School for Gifted Girls
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { centralSyncService } from '../services/syncService';
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
  MinistryDecisionSettings,
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
import {
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_PARENTS,
  INITIAL_EXAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MESSAGES,
  INITIAL_LECTURES,
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
import { ALL_IRAQI_CURRICULUM_BOOKS } from '../data/iraqiCurriculumBooks';
import { INITIAL_CHALLENGES } from '../data/challengesData';
import { DEFAULT_ANNUAL_PLANS, DEFAULT_DAILY_LESSON_PLANS } from '../data/initialCurriculumPlans';
import { INITIAL_EXAM_SCHEDULES } from '../data/initialExamSchedules';
import { translations } from '../translations/i18n';
import { saveStoredFile, getStoredFile, deleteStoredFile } from '../utils/fileStorage';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
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
  updateGraduate: (id: string, updated: Partial<GraduateStudent>) => void;
  deleteGraduate: (id: string) => void;
  promoteStudents: (options: {
    academicYearFrom?: string;
    academicYearTo?: string;
    overrides?: Record<string, 'pass' | 'fail'>;
    autoAddGraduatesToHome?: boolean;
  }) => { promotedCount: number; graduatedCount: number; retainedCount: number };
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
  calendarEvents: CalendarEvent[];
  schoolAdminData: SchoolAdminData;
  updateSchoolAdminData: (updated: Partial<SchoolAdminData>) => void;

  // Calendar Event Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updated: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Certificates & Grade Management Actions
  decisionSettings: MinistryDecisionSettings;
  updateDecisionSettings: (updated: Partial<MinistryDecisionSettings>) => void;
  applySubjectDecisionMarks: (certificateId: string, subjectId: string, decisionMarks: number) => void;
  autoOptimizeDecisionMarksForCert: (certificateId: string) => void;
  resetDecisionMarksForCert: (certificateId: string) => void;
  updateCertificate: (id: string, updated: Partial<StudentCertificate>) => void;
  updateSubjectGrade: (certificateId: string, subjectId: string, updated: Partial<SubjectGrade>) => void;
  batchUpdateStudentGrades: (certificateId: string, updatedSubjects: SubjectGrade[]) => void;
  recalculateCertificate: (certificateId: string) => void;
  addStudentCertificate: (studentId: string, isBlank?: boolean) => void;
  issueCertificatesForScope: (options: IssueCertificatesOptions) => { totalGenerated: number; skippedCount: number; message: string };
  deleteCertificate: (id: string) => void;
  deleteMultipleCertificates: (ids: string[]) => void;
  deleteCertificatesForScope: (options: {
    scope: 'all' | 'grade' | 'section' | 'student';
    gradeLevel?: GradeLevel;
    section?: string;
    studentId?: string;
  }) => { deletedCount: number; message: string };
  clearAllCertificates: () => void;
  
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
  updateTeacher: (id: string, updated: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
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
  updateTimetableSlot: (id: string, updated: Partial<TimetableSlot>) => void;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  deleteTimetableSlot: (id: string) => void;
  saveFullTimetable: (slots: TimetableSlot[]) => void;

  // Grade Subject Quotas Actions
  subjectQuotas: GradeSubjectQuota[];
  updateSubjectQuota: (id: string, updated: Partial<GradeSubjectQuota>) => void;
  addSubjectQuota: (quota: Omit<GradeSubjectQuota, 'id'>) => void;
  deleteSubjectQuota: (id: string) => void;
  saveSubjectQuotas: (quotas: GradeSubjectQuota[]) => void;

  // Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'status' | 'joinedDate'>) => void;
  addStudent: (student: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => void;
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
  ) => { success: boolean; message: string };
  batchUndoAccidentalAbsences: (recordIds: string[], reason?: string) => { successCount: number; message: string };
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
  addLecture: (lec: Omit<LectureResource, 'id' | 'uploadedAt'>) => void;
  deleteLecture: (id: string) => void;
  updateLecture: (id: string, data: Partial<LectureResource>) => void;
  recordLectureDownload: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }) => void;
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
  addChallenge: (challenge: Omit<InteractiveChallenge, 'id'>) => void;
  updateChallenge: (id: string, updated: Partial<InteractiveChallenge>) => void;
  deleteChallenge: (id: string) => void;
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
  addAnnualPlan: (plan: Omit<AnnualPlan, 'id' | 'createdAt' | 'updatedAt'>) => AnnualPlan;
  updateAnnualPlan: (id: string, updated: Partial<AnnualPlan>) => void;
  deleteAnnualPlan: (id: string) => void;
  duplicateAnnualPlan: (id: string) => void;
  toggleAnnualTopicCompletion: (planId: string, semesterId: string, monthId: string, weekId: string) => void;
  approveAnnualPlan: (id: string, notes?: string, approverRole?: string, approverName?: string) => void;
  addDailyLessonPlan: (plan: Omit<DailyLessonPlan, 'id' | 'createdAt' | 'updatedAt'>) => DailyLessonPlan;
  updateDailyLessonPlan: (id: string, updated: Partial<DailyLessonPlan>) => void;
  deleteDailyLessonPlan: (id: string) => void;
  duplicateDailyLessonPlan: (id: string) => void;
  approveDailyLessonPlan: (id: string, notes?: string, reviewerRole?: string, reviewerName?: string) => void;

  // Official Exam Schedules (جداول الامتحانات الرسمية - صلاحيات المديرة والإدارة)
  examSchedules: ExamSchedule[];
  addExamSchedule: (schedule: Omit<ExamSchedule, 'id' | 'createdAt' | 'updatedAt'>) => ExamSchedule;
  updateExamSchedule: (id: string, updated: Partial<ExamSchedule>) => void;
  deleteExamSchedule: (id: string) => void;
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
};

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
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('maysan_current_role');
    if (savedRole && ['admin', 'teacher', 'student', 'parent', 'supervisor'].includes(savedRole)) {
      return savedRole as UserRole;
    }
    return 'admin';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('maysan_current_role', newRole);
  };

  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('maysan_current_user_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: 'admin-main',
      name: 'إدارة ثانوية ميسان للمتميزات',
      role: 'admin',
      email: 'admin@maysan-gifted.edu.iq',
    };
  });

  const setCurrentUser = (user: CurrentUser | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('maysan_current_user_v1', JSON.stringify(user));
    } else {
      localStorage.removeItem('maysan_current_user_v1');
    }
  };

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

  const initialStored = getInitialStoredData();

  // User Security Passcodes (strictly per userKey/userId)
  const [userPasscodes, setUserPasscodes] = useState<Record<string, string>>(
    () => initialStored?.userPasscodes || INITIAL_PASSCODES
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
    const raw = stored && Array.isArray(stored) && stored.length > 0 ? stored : INITIAL_TEACHERS;
    // Filter out any legacy mock teachers that might have been cached in localStorage from old versions
    const legacyMockTeacherIds = ['tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5', 'tech-6', 'tech-7', 'tech-8', 'tech-9', 'tech-10', 'tech-11', 'tech-12', 'tech-13', 'tech-14'];
    let filtered = raw.filter((t) => 
      !legacyMockTeacherIds.includes(t.id) &&
      !isTeacherBlacklisted(t.name)
    );

    // Normalize any legacy names to the official full name
    filtered = filtered.map(t => {
      if (t.name.includes('محمد نعمة كاظم كريدي')) {
        return { ...t, name: 'محمد نعمة كاظم كريدي الوحيلي' };
      }
      return t;
    });
    
    // Ensure newly added official teacher 'محمد نعمة كاظم كريدي الوحيلي' is always included
    const mohammedTeacher = INITIAL_TEACHERS.find(t => t.id === 'tech-cs-mohammed');
    if (mohammedTeacher && !filtered.some(t => t.name === 'محمد نعمة كاظم كريدي الوحيلي' || t.id === 'tech-cs-mohammed')) {
      filtered = [mohammedTeacher, ...filtered];
    }

    // Deduplicate by name
    const seenNames = new Set<string>();
    filtered = filtered.filter(t => {
      if (seenNames.has(t.name)) return false;
      seenNames.add(t.name);
      return true;
    });

    return filtered.length > 0 ? filtered : INITIAL_TEACHERS.filter(t => !isTeacherBlacklisted(t.name));
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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse deleted lecture IDs', e);
    }
    return initialStored?.deletedLectureIds || [];
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

    const raw: LectureResource[] = (initialStored?.lectures || INITIAL_LECTURES).filter(
      (l) => !deletedIds.has(l.id)
    );
    // Map authoritative official Iraqi curriculum books
    const bookMap = new Map<string, LectureResource>();
    ALL_IRAQI_CURRICULUM_BOOKS.forEach((b) => {
      if (!deletedIds.has(b.id)) {
        bookMap.set(b.id, b);
      }
    });

    // Update existing entries with official books
    const cleanedRaw = raw.map((lec) => {
      if (bookMap.has(lec.id)) {
        return bookMap.get(lec.id)!;
      }
      return lec;
    });

    // Make sure all books from ALL_IRAQI_CURRICULUM_BOOKS are present EXCEPT deleted ones
    const existingIds = new Set(cleanedRaw.map((l) => l.id));
    ALL_IRAQI_CURRICULUM_BOOKS.forEach((b) => {
      if (!existingIds.has(b.id) && !deletedIds.has(b.id)) {
        cleanedRaw.push(b);
      }
    });

    return cleanedRaw;
  });
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    if (initialStored?.timetable && Array.isArray(initialStored.timetable) && initialStored.timetable.length >= 210) {
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
  const [decisionSettings, setDecisionSettings] = useState<MinistryDecisionSettings>(() => {
    return initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
  });
  const [certificates, setCertificates] = useState<StudentCertificate[]>(() => {
    const raw = initialStored?.certificates || INITIAL_CERTIFICATES;
    const initialSettings = initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
    return raw.map((c) => computeCertificateStats(c, initialSettings));
  });
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
    if (!data.schoolNameEn || data.schoolNameEn === 'Maysan High School for Gifted Girls') {
      data = { ...data, schoolNameEn: 'Maysan Secondary School For Distinguished Female Students' };
    }
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

  // Curriculum Plan Actions (Annual & Daily)
  const addAnnualPlan = (plan: Omit<AnnualPlan, 'id' | 'createdAt' | 'updatedAt'>): AnnualPlan => {
    const newPlan: AnnualPlan = {
      ...plan,
      id: `annual-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
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

  const updateAnnualPlan = (id: string, updated: Partial<AnnualPlan>) => {
    setAnnualPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updated, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addAuditLog({
      action: 'تحديث الخطة السنوية',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تحديث بيانات الخطة السنوية رقم (${id})`,
      severity: 'info',
    });
  };

  const deleteAnnualPlan = (id: string) => {
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
  };

  const duplicateAnnualPlan = (id: string) => {
    const target = annualPlans.find((p) => p.id === id);
    if (!target) return;
    const duplicated: AnnualPlan = {
      ...target,
      id: `annual-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      academicYear: target.academicYear,
      teacherName: currentUser?.name || target.teacherName,
      teacherId: currentUser?.id || target.teacherId,
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

  const toggleAnnualTopicCompletion = (
    planId: string,
    semesterId: string,
    monthId: string,
    weekId: string
  ) => {
    setAnnualPlans((prev) =>
      prev.map((plan) => {
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
      })
    );
  };

  const approveAnnualPlan = (
    id: string,
    notes?: string,
    approverRole?: string,
    approverName?: string
  ) => {
    const isSupervisor = approverRole === 'supervisor' || role === 'supervisor';
    const finalApproverName =
      approverName ||
      currentUser?.name ||
      (isSupervisor ? 'المشرف التربوي الاختصاصي' : schoolAdminData.principalName || 'إدارة المدرسة');

    setAnnualPlans((prev) =>
      prev.map((plan) => {
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
            status: 'approved',
            approvalNotes: notes || plan.approvalNotes || 'تمت المصادقة والاعتماد من قبل إدارة المدرسة',
            approvedBy: finalApproverName,
            approvedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
      })
    );

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
  const addDailyLessonPlan = (
    plan: Omit<DailyLessonPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): DailyLessonPlan => {
    const newPlan: DailyLessonPlan = {
      ...plan,
      id: `daily-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
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

  const updateDailyLessonPlan = (id: string, updated: Partial<DailyLessonPlan>) => {
    setDailyLessonPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updated, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addAuditLog({
      action: 'تحديث الخطة اليومية للدرس',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تحديث خطة الدرس اليومية رقم (${id})`,
      severity: 'info',
    });
  };

  const deleteDailyLessonPlan = (id: string) => {
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
  };

  const duplicateDailyLessonPlan = (id: string) => {
    const target = dailyLessonPlans.find((p) => p.id === id);
    if (!target) return;
    const duplicated: DailyLessonPlan = {
      ...target,
      id: `daily-plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      teacherName: currentUser?.name || target.teacherName,
      teacherId: currentUser?.id || target.teacherId,
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

  const approveDailyLessonPlan = (
    id: string,
    notes?: string,
    reviewerRole?: string,
    reviewerName?: string
  ) => {
    const isSupervisor = reviewerRole === 'supervisor' || role === 'supervisor';
    const finalReviewerName =
      reviewerName ||
      currentUser?.name ||
      (isSupervisor ? 'المشرف التربوي' : schoolAdminData.principalName || 'إدارة المدرسة');

    setDailyLessonPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== id) return plan;
        if (isSupervisor) {
          return {
            ...plan,
            status: 'reviewed',
            supervisorNotes: notes || plan.supervisorNotes || 'تمت المراجعة والتقييم الإشرافي بنجاح',
            supervisorName: finalReviewerName,
            reviewedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        } else {
          return {
            ...plan,
            status: 'reviewed',
            principalNotes: notes || plan.principalNotes || 'تحضير يومي ممتاز ومستوفٍ للمعايير التعليمية',
            principalName: finalReviewerName,
            reviewedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
      })
    );

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
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
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

  const updateSchoolAdminData = (updated: Partial<SchoolAdminData>) => {
    setSchoolAdminData((prev) => ({ ...prev, ...updated }));
    addAuditLog({
      action: 'تحديث بيانات ورؤية الإدارة المدرسية',
      actionType: 'settings_change',
      targetCategory: 'system',
      details: 'تم تحديث معلومات الإدارة المدرسية واسم المديرة أو الترويسة الرسمية بنجاح',
      severity: 'info',
    });
  };

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

  const addExamSchedule = (schedule: Omit<ExamSchedule, 'id' | 'createdAt' | 'updatedAt'>): ExamSchedule => {
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

  const updateExamSchedule = (id: string, updated: Partial<ExamSchedule>) => {
    if (!checkExamScheduleAdminPermission('تعديل جدول امتحانات')) {
      throw new Error('عذراً، صلاحية تعديل جداول الامتحانات محصورة بالمديرة وإدارة المدرسة فقط.');
    }

    setExamSchedules((prev) =>
      prev.map((sch) =>
        sch.id === id
          ? { ...sch, ...updated, updatedAt: new Date().toISOString() }
          : sch
      )
    );

    addAuditLog({
      action: 'تعديل جدول امتحانات رسمي',
      actionType: 'update',
      targetCategory: 'system',
      targetId: id,
      details: `تم تعديل وتحديث بيانات جدول الامتحانات رقم (${id}) بنجاح`,
      severity: 'info',
    });
  };

  const deleteExamSchedule = (id: string) => {
    if (!checkExamScheduleAdminPermission('حذف جدول امتحانات')) {
      throw new Error('عذراً، صلاحية حذف جداول الامتحانات محصورة بالمديرة وإدارة المدرسة فقط.');
    }

    const target = examSchedules.find((s) => s.id === id);
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
  };

  const duplicateExamSchedule = (id: string) => {
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

  const toggleExamSchedulePublish = (id: string) => {
    if (!checkExamScheduleAdminPermission('نشر أو حظر جدول امتحانات')) {
      throw new Error('عذراً، اعتماد ونشر الجداول محصور بالإدارة والمديرة فقط.');
    }

    setExamSchedules((prev) =>
      prev.map((sch) => {
        if (sch.id !== id) return sch;
        const nextPublished = !sch.isPublished;
        const nextStatus = nextPublished ? 'معتمد ومُعلن' : 'مسودة';
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
      })
    );
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

  const addChallenge = (newChal: Omit<InteractiveChallenge, 'id'>) => {
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
    setChallenges((prev) => [created, ...prev]);
  };

  const updateChallenge = (id: string, updated: Partial<InteractiveChallenge>) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (!canUserManageChallenge(c)) {
          console.warn(`[Security] Unauthorized edit attempt on challenge ${c.title} by ${currentUser?.name}`);
          return c;
        }
        return { ...c, ...updated };
      })
    );
  };

  const deleteChallenge = (id: string) => {
    const targetChallenge = challenges.find((c) => c.id === id);
    if (targetChallenge && !canUserManageChallenge(targetChallenge)) {
      console.warn(`[Security] Unauthorized delete attempt on challenge ${targetChallenge.title} by ${currentUser?.name}`);
      return;
    }

    const targetTitle = targetChallenge?.title || 'المسابقة / اللعبة';

    // 1. Permanently record in deletedChallengeIds
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
  const addCalendarEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const created: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`,
    };
    setCalendarEvents((prev) => [created, ...prev]);
  };

  const updateCalendarEvent = (id: string, updated: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, ...updated } : evt))
    );
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((evt) => evt.id !== id));
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
            setLectures(updatedLectures);
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

  // Save to LocalStorage on changes with safe handling for large files
  useEffect(() => {
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
        userPasscodes,
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
    userPasscodes,
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
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncedBy, setLastSyncedBy] = useState<{ id?: string; name?: string; role?: string } | null>(null);
  const [syncLatencyMs, setSyncLatencyMs] = useState<number>(0);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | undefined>(undefined);

  const isApplyingRemoteUpdate = useRef<boolean>(false);
  const isInitialHydrationDone = useRef<boolean>(false);
  const pushDebounceTimer = useRef<any>(null);

  // Apply remote data securely to React state
  const applyRemoteData = (remoteData: any, remoteVersion: number, remoteLastSyncedBy?: any) => {
    if (!remoteData || typeof remoteData !== 'object') return;
    isApplyingRemoteUpdate.current = true;

    if (Array.isArray(remoteData.teachers)) setTeachers(remoteData.teachers);
    if (Array.isArray(remoteData.students)) setStudents(remoteData.students);
    if (Array.isArray(remoteData.parents)) setParents(remoteData.parents);
    if (Array.isArray(remoteData.supervisors)) setSupervisors(remoteData.supervisors);
    if (Array.isArray(remoteData.graduates)) setGraduates(remoteData.graduates);
    if (Array.isArray(remoteData.exams)) setExams(remoteData.exams);
    if (Array.isArray(remoteData.submissions)) setSubmissions(remoteData.submissions);
    if (Array.isArray(remoteData.attendance)) setAttendance(remoteData.attendance);
    if (Array.isArray(remoteData.announcements)) setAnnouncements(remoteData.announcements);
    if (Array.isArray(remoteData.messages)) setMessages(remoteData.messages);
    if (Array.isArray(remoteData.lectures)) setLectures(remoteData.lectures);
    if (Array.isArray(remoteData.deletedLectureIds)) setDeletedLectureIds(remoteData.deletedLectureIds);
    if (Array.isArray(remoteData.deletedChallengeIds)) setDeletedChallengeIds(remoteData.deletedChallengeIds);
    if (Array.isArray(remoteData.timetable)) setTimetable(remoteData.timetable);
    if (Array.isArray(remoteData.subjectQuotas)) setSubjectQuotas(remoteData.subjectQuotas);
    if (Array.isArray(remoteData.financial)) setFinancial(remoteData.financial);
    if (Array.isArray(remoteData.notifications)) setNotifications(remoteData.notifications);
    if (Array.isArray(remoteData.certificates)) setCertificates(remoteData.certificates);
    if (Array.isArray(remoteData.calendarEvents)) setCalendarEvents(remoteData.calendarEvents);
    if (Array.isArray(remoteData.challenges)) setChallenges(remoteData.challenges);
    if (remoteData.userPasscodes) setUserPasscodes(remoteData.userPasscodes);
    if (remoteData.schoolAdminData) setSchoolAdminData(remoteData.schoolAdminData);
    if (remoteData.decisionSettings) setDecisionSettings(remoteData.decisionSettings);
    if (Array.isArray(remoteData.auditLogs)) setAuditLogs(remoteData.auditLogs);
    if (Array.isArray(remoteData.annualPlans)) setAnnualPlans(remoteData.annualPlans);
    if (Array.isArray(remoteData.dailyLessonPlans)) setDailyLessonPlans(remoteData.dailyLessonPlans);
    if (Array.isArray(remoteData.examSchedules)) setExamSchedules(remoteData.examSchedules);
    if (Array.isArray(remoteData.customFolders)) setCustomFolders(remoteData.customFolders);

    setSyncVersion(remoteVersion);
    setLastSyncedAt(new Date());
    if (remoteLastSyncedBy) setLastSyncedBy(remoteLastSyncedBy);
    setSyncStatus('synced');

    setTimeout(() => {
      isApplyingRemoteUpdate.current = false;
    }, 400);
  };

  // Build full payload for central store
  const getFullPayload = () => ({
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
    lectures: lectures.map((l) => ({
      ...l,
      pdfDataUrl: l.pdfDataUrl && l.pdfDataUrl.length > 500 ? `idb:${l.id}` : l.pdfDataUrl,
      fileUrl: l.fileUrl && l.fileUrl.length > 500 ? `idb:${l.id}` : l.fileUrl,
    })),
    deletedLectureIds,
    deletedChallengeIds,
    timetable,
    subjectQuotas,
    financial,
    notifications,
    certificates,
    calendarEvents,
    challenges,
    userPasscodes,
    schoolAdminData,
    decisionSettings,
    auditLogs,
    annualPlans,
    dailyLessonPlans,
    examSchedules,
    customFolders,
  });

  // Initial Server Hydration & Seeding
  useEffect(() => {
    let isMounted = true;

    const initializeCentralSync = async () => {
      try {
        setSyncStatus('syncing');
        const res = await centralSyncService.fetchServerData(undefined, true);
        if (!isMounted) return;

        if (res.success && res.data && Object.keys(res.data).length > 5) {
          applyRemoteData(res.data, res.version || 1, res.lastSyncedBy);
          isInitialHydrationDone.current = true;
        } else {
          // Server database needs initial seed from local authoritative data
          const payload = getFullPayload();
          const sourceUser = {
            id: currentUser?.id || role,
            name: currentUser?.name || (role === 'admin' ? 'المديرة العامة' : role),
            role: role,
          };
          const pushRes = await centralSyncService.pushUpdates(payload, sourceUser, 1);
          if (pushRes.success && pushRes.version) {
            setSyncVersion(pushRes.version);
            setLastSyncedAt(new Date());
            setLastSyncedBy(sourceUser);
            setSyncStatus('synced');
          }
          isInitialHydrationDone.current = true;
        }
      } catch (err: any) {
        console.warn('Initial sync error, continuing with local state:', err);
        setSyncStatus('offline');
        isInitialHydrationDone.current = true;
      }
    };

    initializeCentralSync();

    // Cross-tab real-time sync channel
    const unsubscribeBroadcast = centralSyncService.subscribe(async (evt) => {
      if (evt.type === 'SERVER_DATA_UPDATED' || evt.type === 'DATABASE_RESET') {
        try {
          const res = await centralSyncService.fetchServerData(undefined, true);
          if (isMounted && res.success && res.data) {
            applyRemoteData(res.data, res.version || 1, res.lastSyncedBy);
          }
        } catch {
          // ignore
        }
      } else if (evt.type === 'NETWORK_ONLINE') {
        setSyncStatus('synced');
        forceSyncAll();
      } else if (evt.type === 'NETWORK_OFFLINE') {
        setSyncStatus('offline');
      }
    });

    // Periodic check for updates from other users every 10 seconds
    const pollInterval = setInterval(async () => {
      if (!isInitialHydrationDone.current) return;
      try {
        const res = await centralSyncService.fetchServerData(syncVersion, false);
        if (!isMounted) return;

        if (res.success) {
          if (!res.notModified && res.data) {
            applyRemoteData(res.data, res.version || syncVersion + 1, res.lastSyncedBy);
          }
          setSyncStatus('synced');
          setSyncErrorMessage(undefined);
        }
      } catch {
        // offline or transient
      }
    }, 10000);

    // Refresh on window focus / tab switch
    const onWindowFocus = async () => {
      if (!isInitialHydrationDone.current) return;
      try {
        const res = await centralSyncService.fetchServerData(syncVersion, false);
        if (res.success && !res.notModified && res.data) {
          applyRemoteData(res.data, res.version || syncVersion + 1, res.lastSyncedBy);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      unsubscribeBroadcast();
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [syncVersion]);

  // Debounced auto-push to central server on local changes
  useEffect(() => {
    if (isApplyingRemoteUpdate.current) return;
    if (!isInitialHydrationDone.current) return;

    if (pushDebounceTimer.current) {
      clearTimeout(pushDebounceTimer.current);
    }

    setSyncStatus('syncing');

    pushDebounceTimer.current = setTimeout(async () => {
      try {
        const payload = getFullPayload();
        const sourceUser = {
          id: currentUser?.id || role,
          name: currentUser?.name || (role === 'admin' ? 'المديرة العامة' : role),
          role: role,
        };

        const res = await centralSyncService.pushUpdates(payload, sourceUser, syncVersion);
        if (res.success && res.version) {
          setSyncVersion(res.version);
          setLastSyncedAt(new Date());
          setLastSyncedBy(sourceUser);
          setSyncStatus('synced');
          setSyncErrorMessage(undefined);
        } else {
          setSyncStatus('error');
          setSyncErrorMessage(res.message);
        }
      } catch (err: any) {
        setSyncStatus('offline');
        setSyncErrorMessage(err.message);
      }
    }, 1500);

    return () => {
      if (pushDebounceTimer.current) clearTimeout(pushDebounceTimer.current);
    };
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
    userPasscodes,
    schoolAdminData,
    decisionSettings,
    auditLogs,
    annualPlans,
    dailyLessonPlans,
    examSchedules,
    customFolders,
  ]);

  // Manual Force Sync All
  const forceSyncAll = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      // First fetch latest from server
      const fetchRes = await centralSyncService.fetchServerData(undefined, true);
      if (fetchRes.success && fetchRes.data && Object.keys(fetchRes.data).length > 5) {
        applyRemoteData(fetchRes.data, fetchRes.version || syncVersion, fetchRes.lastSyncedBy);
      }

      // Then push current unified state
      const payload = getFullPayload();
      const sourceUser = {
        id: currentUser?.id || role,
        name: currentUser?.name || (role === 'admin' ? 'المديرة العامة' : role),
        role: role,
      };
      const pushRes = await centralSyncService.pushUpdates(payload, sourceUser);
      if (pushRes.success && pushRes.version) {
        setSyncVersion(pushRes.version);
        setLastSyncedAt(new Date());
        setLastSyncedBy(sourceUser);
        setSyncStatus('synced');
        return true;
      }
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
      const resetRes = await centralSyncService.resetServerDatabase();
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
  const updateDecisionSettings = (updated: Partial<MinistryDecisionSettings>) => {
    setDecisionSettings((prev) => {
      const next = { ...prev, ...updated };
      setCertificates((certs) => certs.map((c) => computeCertificateStats(c, next)));
      return next;
    });
  };

  const applySubjectDecisionMarks = (certificateId: string, subjectId: string, decisionMarks: number) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        const updatedSubjects = cert.subjects.map((s) =>
          s.id === subjectId ? { ...s, decisionMarks: Math.max(0, Math.min(10, decisionMarks)) } : s
        );
        return computeCertificateStats({ ...cert, subjects: updatedSubjects }, decisionSettings);
      })
    );
  };

  const autoOptimizeDecisionMarksForCert = (certificateId: string) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        return autoOptimizeDecisionMarks(cert, decisionSettings);
      })
    );
  };

  const resetDecisionMarksForCert = (certificateId: string) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        const clearedSubjects = cert.subjects.map((s) => ({ ...s, decisionMarks: 0 }));
        return computeCertificateStats({ ...cert, subjects: clearedSubjects }, decisionSettings);
      })
    );
  };

  // Certificate Actions
  const updateCertificate = (id: string, updated: Partial<StudentCertificate>) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === id ? computeCertificateStats({ ...c, ...updated }, decisionSettings) : c))
    );
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

  const batchUpdateStudentGrades = (
    certificateId: string,
    updatedSubjects: SubjectGrade[]
  ) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== certificateId) return cert;
        return computeCertificateStats(
          { ...cert, subjects: updatedSubjects },
          decisionSettings
        );
      })
    );
  };

  const recalculateCertificate = (certificateId: string) => {
    setCertificates((prev) =>
      prev.map((cert) => (cert.id === certificateId ? computeCertificateStats(cert, decisionSettings) : cert))
    );
  };

  const addStudentCertificate = (studentId: string, isBlank = false) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const subjectsList = getSubjectsForGrade(student.gradeLevel);
    const defaultSubjects: SubjectGrade[] = subjectsList.map((subjectName, idx) => {
      if (isBlank) {
        return {
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
        };
      }
      return {
        id: `sub-${Date.now()}-${idx + 1}`,
        subjectName,
        firstTermAvg: 90,
        midYearGrade: 92,
        secondTermAvg: 90,
        annualSaeiAvg: 91,
        finalExamGrade: 94,
        finalGrade: 93,
        resitGrade: null,
        postResitGrade: 93,
        decisionMarks: 0,
        isExempt: false,
        exemptionType: 'none',
        notes: '',
      };
    });

    const newCert: StudentCertificate = computeCertificateStats({
      id: `cert-${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      nationalId: student.nationalId,
      gradeLevel: student.gradeLevel,
      section: student.section,
      academicYear: schoolAdminData?.academicYear || '2026 - 2027',
      issueDate: new Date().toISOString().split('T')[0],
      status: isBlank ? 'مؤجلة' : 'ناجحة',
      appreciation: isBlank ? '-' : 'ممتاز',
      overallFirstTermAvg: 0,
      overallMidYearGrade: 0,
      overallSecondTermAvg: 0,
      overallAnnualSaeiAvg: 0,
      overallFinalExamGrade: 0,
      overallFinalGrade: 0,
      overallPostResitAvg: 0,
      subjects: defaultSubjects,
      notes: isBlank ? 'نموذج شهادة رسمي جاهز للإدخال اليدوي للدرجات' : undefined,
    }, decisionSettings);

    setCertificates((prev) => [...prev, newCert]);
  };

  const issueCertificatesForScope = (
    options: IssueCertificatesOptions
  ): { totalGenerated: number; skippedCount: number; message: string } => {
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
    const nowIso = new Date().toISOString().split('T')[0];

    const newOrUpdatedCerts: StudentCertificate[] = [];
    const targetStudentIds = new Set(targetStudents.map((s) => s.id));
    const targetNationalIds = new Set(targetStudents.map((s) => s.nationalId));

    targetStudents.forEach((student, sIdx) => {
      const existingCert = certificates.find(
        (c) => c.studentId === student.id || c.nationalId === student.nationalId
      );

      if (existingCert && !overwriteExisting) {
        skippedCount++;
        return;
      }

      const subjectsList = getSubjectsForGrade(student.gradeLevel);
      let subjects: SubjectGrade[];

      if (isBlankTemplate) {
        // نموذج شهادة فارغ للإدخال اليدوي أو الطباعة الورقية
        subjects = subjectsList.map((subjectName, idx) => ({
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
      } else {
        // شهادة بدرجات مقدرة بناء على معدل الطالبة
        const baseScore = Math.max(50, Math.min(100, Math.round(student.gpa || 92)));
        subjects = subjectsList.map((subjectName, idx) => {
          const jitter = (idx % 5) - 2;
          const subjectScore = Math.max(50, Math.min(100, baseScore + jitter));
          return {
            id: `sub-${student.id}-${idx + 1}`,
            subjectName,
            firstTermAvg: subjectScore,
            midYearGrade: subjectScore,
            secondTermAvg: subjectScore,
            annualSaeiAvg: subjectScore,
            finalExamGrade: subjectScore,
            finalGrade: subjectScore,
            resitGrade: null,
            postResitGrade: subjectScore,
            decisionMarks: 0,
            isExempt: false,
            exemptionType: 'none',
            notes: '',
          };
        });
      }

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
        status: isBlankTemplate ? 'مؤجلة' : 'ناجحة',
        appreciation: isBlankTemplate ? '-' : 'امتياز',
        overallFirstTermAvg: 0,
        overallMidYearGrade: 0,
        overallSecondTermAvg: 0,
        overallAnnualSaeiAvg: 0,
        overallFinalExamGrade: 0,
        overallFinalGrade: 0,
        overallPostResitAvg: 0,
        subjects,
        notes: isBlankTemplate ? 'نموذج شهادة رسمي جاهز للإدخال اليدوي للدرجات' : undefined,
      };

      const computed = computeCertificateStats(rawCert, decisionSettings);
      newOrUpdatedCerts.push(computed);
      generatedCount++;
    });

    setCertificates((prev) => {
      if (overwriteExisting) {
        const remaining = prev.filter(
          (c) => !targetStudentIds.has(c.studentId) && !targetNationalIds.has(c.nationalId)
        );
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

  const deleteCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
  };

  const deleteMultipleCertificates = (ids: string[]) => {
    const idSet = new Set(ids);
    setCertificates((prev) => prev.filter((c) => !idSet.has(c.id)));
  };

  const deleteCertificatesForScope = (options: {
    scope: 'all' | 'grade' | 'section' | 'student';
    gradeLevel?: GradeLevel;
    section?: string;
    studentId?: string;
  }): { deletedCount: number; message: string } => {
    const { scope, gradeLevel, section, studentId } = options;
    let initialCount = certificates.length;
    let remaining = [...certificates];

    if (scope === 'all') {
      remaining = [];
    } else if (scope === 'grade' && gradeLevel) {
      remaining = certificates.filter((c) => c.gradeLevel !== gradeLevel);
    } else if (scope === 'section' && gradeLevel && section) {
      remaining = certificates.filter(
        (c) => !(c.gradeLevel === gradeLevel && (c.section === section || c.section?.toLowerCase().trim() === section.toLowerCase().trim()))
      );
    } else if (scope === 'student' && studentId) {
      remaining = certificates.filter((c) => c.studentId !== studentId && c.id !== studentId);
    }

    const deletedCount = initialCount - remaining.length;
    setCertificates(remaining);

    const message = `تم حذف (${deletedCount}) شهادة مدرسية بنجاح.`;
    return { deletedCount, message };
  };

  const clearAllCertificates = () => {
    setCertificates([]);
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

    setNotifications((prev) => [newNotif, ...prev]);

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

    setNotifications((prev) => [newNotif, ...prev]);

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
      setNotifications((prev) => [newNotif, ...prev]);
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

  // Document RTL/LTR Direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];

  // Actions
  const addTeacher = (data: Omit<Teacher, 'id' | 'status' | 'joinedDate'>) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newTeacher: Teacher = {
      ...data,
      id: `tech-${Date.now()}-${randSuffix}`,
      status: 'نشط',
      joinedDate: new Date().toISOString().split('T')[0],
      rating: 5.0,
    };
    setTeachers((prev) => [newTeacher, ...prev]);

    addAuditLog({
      action: `إضافة مدرسة جديدة: ${newTeacher.name}`,
      actionType: 'create',
      targetCategory: 'teachers',
      targetId: newTeacher.id,
      targetName: newTeacher.name,
      details: `تمت إضافة المدرسة لتدريس مادة (${newTeacher.subject}) للصفوف (${(newTeacher.assignedGrades || []).join('، ')})`,
      severity: 'success',
    });

    // Push notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${randSuffix}`,
      title: lang === 'ar' ? 'انضمام مدرسة جديدة للهيئة التدريسية' : 'New Faculty Member Added',
      message: `${newTeacher.name} - ${newTeacher.subject}`,
      type: 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const addStudent = (data: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newStudent: Student = {
      ...data,
      id: `std-${Date.now()}-${randSuffix}`,
      status: 'منتظمة',
      enrollmentYear: data.enrollmentYear?.trim() || '2026',
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Auto add parent account link
    const newParent: Parent = {
      id: `prt-${Date.now()}-${randSuffix}`,
      name: data.parentName,
      phone: data.parentPhone,
      email: data.parentEmail,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
    };
    setParents((prev) => [newParent, ...prev]);

    // Create initial tuition financial record
    const fin: FinancialRecord = {
      id: `fin-${Date.now()}-${randSuffix}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
      feeType: 'رسوم التسجيل والكتب',
      totalAmount: 120000,
      paidAmount: 0,
      status: 'غير مدفوع',
      dueDate: '2026-09-01',
    };
    setFinancial((prev) => [fin, ...prev]);

    addAuditLog({
      action: `تسجيل طالبة جديدة: ${newStudent.name}`,
      actionType: 'create',
      targetCategory: 'students',
      targetId: newStudent.id,
      targetName: newStudent.name,
      details: `تسجيل الطالبة في ${newStudent.gradeLevel} - شعبة (${newStudent.section}) مع ربط حساب ولي الأمر (${data.parentName})`,
      severity: 'success',
    });

    // Push notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${randSuffix}`,
      title: lang === 'ar' ? 'تسجيل طالبة جديدة بالمدرسة' : 'New Gifted Student Registered',
      message: `${newStudent.name} (${newStudent.gradeLevel})`,
      type: 'success',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // User Management Implementations
  const updateTeacher = (id: string, updated: Partial<Teacher>) => {
    let teacherName = '';
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          teacherName = t.name;
          return { ...t, ...updated };
        }
        return t;
      })
    );

    addAuditLog({
      action: `تعديل بيانات المدرسة: ${teacherName || id}`,
      actionType: 'update',
      targetCategory: 'teachers',
      targetId: id,
      targetName: teacherName || id,
      details: `تم تحديث السجل والبيانات للمدرسة (${teacherName})`,
      severity: 'info',
    });
  };

  const deleteTeacher = (id: string) => {
    let deletedName = '';
    setTeachers((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) deletedName = target.name;
      return prev.filter((t) => t.id !== id);
    });

    addAuditLog({
      action: `حذف حساب مدرسة: ${deletedName || id}`,
      actionType: 'delete',
      targetCategory: 'teachers',
      targetId: id,
      targetName: deletedName || id,
      details: `تم حذف حساب وبيانات المدرسة (${deletedName}) نهائياً من النظام`,
      severity: 'danger',
    });
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    let studentName = '';
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          studentName = s.name;
          return { ...s, ...updated };
        }
        return s;
      })
    );

    addAuditLog({
      action: `تعديل بيانات الطالبة: ${studentName || id}`,
      actionType: updated.status ? 'status_change' : 'update',
      targetCategory: 'students',
      targetId: id,
      targetName: studentName || id,
      details: updated.status
        ? `تعديل حالة الطالبة (${studentName}) إلى [${updated.status}]`
        : `تحديث بيانات ومعلومات الطالبة (${studentName})`,
      severity: 'info',
    });
  };

  const addShieldToStudent = (studentId: string, shield: Omit<StudentShieldBadge, 'id'>) => {
    const newShield: StudentShieldBadge = {
      ...shield,
      id: `shield-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    let studentName = '';
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        studentName = s.name;
        const currentShields = s.shieldsAndBadges || [];
        const currentBadges = s.badges || [];
        const updatedBadges = currentBadges.includes(shield.title)
          ? currentBadges
          : [...currentBadges, shield.title];
        return {
          ...s,
          shieldsAndBadges: [newShield, ...currentShields],
          badges: updatedBadges,
        };
      })
    );

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
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const targetShield = s.shieldsAndBadges?.find((sb) => sb.id === shieldId);
        const filtered = (s.shieldsAndBadges || []).filter((sb) => sb.id !== shieldId);
        const updatedBadges = targetShield
          ? (s.badges || []).filter((b) => b !== targetShield.title)
          : s.badges;
        return {
          ...s,
          shieldsAndBadges: filtered,
          badges: updatedBadges,
        };
      })
    );
  };

  const updateStudentBadges = (studentId: string, badges: string[]) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, badges } : s))
    );
  };

  const deleteStudent = (id: string) => {
    let deletedName = '';
    setStudents((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) deletedName = target.name;
      return prev.filter((s) => s.id !== id);
    });
    // Also remove parent linked record if any
    setParents((prev) => prev.filter((p) => p.studentId !== id));

    addAuditLog({
      action: `حذف سجل الطالبة: ${deletedName || id}`,
      actionType: 'delete',
      targetCategory: 'students',
      targetId: id,
      targetName: deletedName || id,
      details: `تم حذف قيد وسجل الطالبة (${deletedName}) وحساب ولي الأمر المرتبط نهائياً`,
      severity: 'danger',
    });
  };

  // Educational Supervisors Management Implementations
  const addSupervisor = (newSupData: Omit<EducationalSupervisor, 'id' | 'joinedDate'> & { joinedDate?: string }) => {
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

    setSupervisors((prev) => {
      let updatedList = [newSupervisor, ...prev];
      if (newSupervisor.isPrimary) {
        updatedList = updatedList.map((s) => ({
          ...s,
          isPrimary: s.id === newSupervisor.id,
        }));
      }
      return updatedList;
    });

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
    setNotifications((prev) => [notif, ...prev]);
  };

  const updateSupervisor = (id: string, updated: Partial<EducationalSupervisor>) => {
    let supervisorName = '';
    setSupervisors((prev) => {
      return prev.map((s) => {
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
    });

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

  const deleteSupervisor = (id: string) => {
    let deletedName = '';
    let wasPrimary = false;
    setSupervisors((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) {
        deletedName = target.name;
        wasPrimary = Boolean(target.isPrimary);
      }
      const remaining = prev.filter((s) => s.id !== id);
      // If deleted was primary and remaining has elements, promote first to primary
      if (wasPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
        updateSchoolAdminData({
          academicSupervisorName: remaining[0].name,
          timetableSupervisorName: remaining[0].name,
        });
      }
      return remaining;
    });

    addAuditLog({
      action: `حذف مشرف تربوي: ${deletedName || id}`,
      actionType: 'delete',
      targetCategory: 'system',
      targetId: id,
      targetName: deletedName || id,
      details: `تم إلغاء تكليف وحذف المشرف التربوي (${deletedName}) من النظام الإشرافي`,
      severity: 'danger',
    });
  };

  const setPrimarySupervisor = (id: string) => {
    const target = supervisors.find((s) => s.id === id);
    if (!target) return;

    setSupervisors((prev) =>
      prev.map((s) => ({
        ...s,
        isPrimary: s.id === id,
      }))
    );

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
  const addGraduate = (gradData: Omit<GraduateStudent, 'id'>) => {
    const newGrad: GraduateStudent = {
      ...gradData,
      id: `grad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setGraduates((prev) => [newGrad, ...prev]);
  };

  const updateGraduate = (id: string, updated: Partial<GraduateStudent>) => {
    setGraduates((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
  };

  const deleteGraduate = (id: string) => {
    setGraduates((prev) => prev.filter((g) => g.id !== id));
  };

  const promoteStudents = (options: {
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

    setStudents(updatedStudentsList);

    if (newGraduatesToInsert.length > 0) {
      setGraduates((prev) => {
        const filtered = newGraduatesToInsert.filter(
          (ng) => !prev.some((p) => p.name === ng.name && p.graduationYear === ng.graduationYear)
        );
        return [...filtered, ...prev];
      });
    }

    return { promotedCount, graduatedCount, retainedCount };
  };

  const updateParent = (id: string, updated: Partial<Parent>) => {
    setParents((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const deleteParent = (id: string) => {
    setParents((prev) => prev.filter((p) => p.id !== id));
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

  const addFinancialRecord = (data: Omit<FinancialRecord, 'id'>) => {
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
    setFinancial((prev) => [newRecord, ...prev]);
  };

  const deleteFinancialRecord = (id: string) => {
    setFinancial((prev) => prev.filter((f) => f.id !== id));
  };

  const createExam = (data: Omit<Exam, 'id' | 'createdAt'>) => {
    const newExam: Exam = {
      ...data,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalPoints: data.totalPoints || (data.questions ? data.questions.reduce((acc, q) => acc + (q.points || 0), 0) : 100),
    };
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
    setNotifications((prev) => [notif, ...prev]);
  };

  const updateExam = (id: string, updated: Partial<Exam>) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id === id) {
          const nextExam = { ...ex, ...updated };
          if (updated.questions) {
            nextExam.totalPoints = updated.questions.reduce((acc, q) => acc + (q.points || 0), 0);
          }
          return nextExam;
        }
        return ex;
      })
    );
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((ex) => ex.id !== id));
    setSubmissions((prev) => prev.filter((sub) => sub.examId !== id));
  };

  const duplicateExam = (id: string) => {
    const examToClone = exams.find((ex) => ex.id === id);
    if (!examToClone) return;
    const cloned: Exam = {
      ...examToClone,
      id: `ex-${Date.now()}`,
      title: `${examToClone.title} (نسخة مكررة)`,
      status: 'مسودة',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExams((prev) => [cloned, ...prev]);
  };

  const toggleExamStatus = (id: string, status: Exam['status']) => {
    setExams((prev) => prev.map((ex) => (ex.id === id ? { ...ex, status } : ex)));
  };

  const submitExam = (data: Omit<ExamSubmission, 'id' | 'submittedAt'>) => {
    const submission: ExamSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
    };
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
    setNotifications((prev) => [notif, ...prev]);
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

  const deleteSubmission = (submissionId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
  };

  const logAttendance = (
    records: Omit<AttendanceRecord, 'id'>[],
    meta?: { teacherEmail?: string; teacherName?: string; teacherId?: string }
  ) => {
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
    }));
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

      setNotifications((prev) => [adminNotif, teacherNotif, ...studentNotifs, ...parentNotifs, ...prev]);

      // 4. Update Cumulative Student Absence & Warning Levels Automatically
      setStudents((prev) =>
        prev.map((s) => {
          const rec = newRecords.find((r) => r.studentId === s.id || r.studentName === s.name);
          if (!rec) return s;

          let newTotalLessons = s.totalMissedLessons || 0;
          let newExcused = s.excusedAbsenceDays || 0;

          if (rec.status === 'غائبة') {
            newTotalLessons += 1;
          } else if (rec.status === 'مجازة') {
            newExcused += 1;
          }

          const newUnexcused = Math.floor(newTotalLessons / 5);

          let newWarnLevel: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = s.warningLevel || 'طبيعي';
          if (newUnexcused >= 15) newWarnLevel = 'مستحقة للفصل';
          else if (newUnexcused >= 10) newWarnLevel = 'إنذار نهائي';
          else if (newUnexcused >= 5) newWarnLevel = 'إنذار أول';

          return {
            ...s,
            totalMissedLessons: newTotalLessons,
            unexcusedAbsenceDays: newUnexcused,
            excusedAbsenceDays: newExcused,
            warningLevel: newWarnLevel,
          };
        })
      );
    }
  };

  const updateAttendanceRecord = (
    id: string,
    updated: Partial<AttendanceRecord>,
    notifyParent: boolean = true
  ) => {
    let targetRecord: AttendanceRecord | undefined;
    let oldStatus: AttendanceRecord['status'] | undefined;
    let newStatus: AttendanceRecord['status'] | undefined;

    setAttendance((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (!existing) return prev;
      targetRecord = existing;
      oldStatus = existing.status;
      newStatus = updated.status ?? existing.status;

      return prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...updated,
          originalStatus: r.originalStatus || r.status,
          modifiedAt: new Date().toISOString(),
          modifiedBy: updated.modifiedBy || currentUser?.name || 'إدارة ثانوية ميسان للمتميزات',
          reasonForModification: updated.reasonForModification || r.reasonForModification,
        };
      });
    });

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
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== targetRecord?.studentId && s.name !== targetRecord?.studentName) return s;
            const curLessons = s.totalMissedLessons || 0;
            const curExcused = s.excusedAbsenceDays || 0;
            const newLessons = Math.max(0, curLessons + deltaMissedLessons);
            const newExcused = Math.max(0, curExcused + deltaExcusedDays);
            const newUnexcused = Math.floor(newLessons / 5);

            let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
            if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
            else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
            else if (newUnexcused >= 5) newWarn = 'إنذار أول';

            let newStatusVal = s.status;
            if (s.status === 'مفصولة بالغيابات' && newUnexcused < 15) {
              newStatusVal = 'منتظمة';
            }

            return {
              ...s,
              totalMissedLessons: newLessons,
              unexcusedAbsenceDays: newUnexcused,
              excusedAbsenceDays: newExcused,
              warningLevel: newWarn,
              status: newStatusVal,
            };
          })
        );
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

  const batchUpdateAttendanceRecords = (
    updates: Array<{ id: string; status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'; notes?: string; reasonForModification?: string }>,
    notifyParent: boolean = false
  ) => {
    if (!updates || updates.length === 0) return;

    updates.forEach((u) => {
      updateAttendanceRecord(u.id, { status: u.status, notes: u.notes, reasonForModification: u.reasonForModification }, notifyParent);
    });

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

  const deleteAttendanceRecord = (id: string) => {
    let deletedRecord: AttendanceRecord | undefined;

    setAttendance((prev) => {
      deletedRecord = prev.find((r) => r.id === id);
      return prev.filter((r) => r.id !== id);
    });

    if (deletedRecord) {
      const rec = deletedRecord as AttendanceRecord;
      if (rec.status === 'غائبة' || rec.status === 'مجازة') {
        const isAbsent = rec.status === 'غائبة';
        const isExcused = rec.status === 'مجازة';

        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== rec.studentId && s.name !== rec.studentName) return s;
            const curLessons = s.totalMissedLessons || 0;
            const curExcused = s.excusedAbsenceDays || 0;
            const newLessons = isAbsent ? Math.max(0, curLessons - 1) : curLessons;
            const newExcused = isExcused ? Math.max(0, curExcused - 1) : curExcused;
            const newUnexcused = Math.floor(newLessons / 5);

            let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
            if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
            else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
            else if (newUnexcused >= 5) newWarn = 'إنذار أول';

            return {
              ...s,
              totalMissedLessons: newLessons,
              unexcusedAbsenceDays: newUnexcused,
              excusedAbsenceDays: newExcused,
              warningLevel: newWarn,
            };
          })
        );
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

  const deleteAttendanceRecordsForSession = (
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

    setStudents((prev) =>
      prev.map((s) => {
        const impact = studentImpacts[s.id];
        if (!impact) return s;

        const curLessons = s.totalMissedLessons || 0;
        const curExcused = s.excusedAbsenceDays || 0;
        const newLessons = Math.max(0, curLessons - impact.absentDeduct);
        const newExcused = Math.max(0, curExcused - impact.excusedDeduct);
        const newUnexcused = Math.floor(newLessons / 5);

        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
        else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
        else if (newUnexcused >= 5) newWarn = 'إنذار أول';

        return {
          ...s,
          totalMissedLessons: newLessons,
          unexcusedAbsenceDays: newUnexcused,
          excusedAbsenceDays: newExcused,
          warningLevel: newWarn,
        };
      })
    );

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

  const recalculateStudentAbsenceStats = (studentId?: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (studentId && s.id !== studentId) return s;

        const studentRecords = attendance.filter((r) => r.studentId === s.id || r.studentName === s.name);
        const absentCount = studentRecords.filter((r) => r.status === 'غائبة').length;
        const excusedCount = studentRecords.filter((r) => r.status === 'مجازة').length;

        // Account for approved justifications in disciplinaryDecisions
        const justifiedDecisions = (s.disciplinaryDecisions || []).filter(
          (d) => d.decisionType === 'قبول عذر وتبرير غياب' && d.status === 'نافذ'
        );
        const totalJustifiedDays = justifiedDecisions.reduce((acc, d) => acc + (d.justifiedDaysCount || 0), 0);

        const totalLessons = Math.max(0, absentCount);
        const calculatedUnexcusedDays = Math.max(0, Math.floor(totalLessons / 5) - totalJustifiedDays);
        const calculatedExcusedDays = excusedCount + totalJustifiedDays;

        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (calculatedUnexcusedDays >= 15) newWarn = 'مستحقة للفصل';
        else if (calculatedUnexcusedDays >= 10) newWarn = 'إنذار نهائي';
        else if (calculatedUnexcusedDays >= 5) newWarn = 'إنذار أول';

        return {
          ...s,
          totalMissedLessons: totalLessons,
          unexcusedAbsenceDays: calculatedUnexcusedDays,
          excusedAbsenceDays: calculatedExcusedDays,
          warningLevel: newWarn,
        };
      })
    );
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
  const undoAccidentalAbsence = (
    recordId: string,
    options?: {
      reason?: string;
      deleteRecordInstead?: boolean;
      notifyParent?: boolean;
      undoneBy?: string;
    }
  ): { success: boolean; message: string } => {
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
      setAttendance((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setAttendance((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r;
          return {
            ...r,
            status: 'حاضرة',
            originalStatus: r.originalStatus || r.status,
            isRevokedMistakenAbsence: true,
            undoneAt: timestamp,
            undoneBy: actorName,
            undoReason: defaultUndoReason,
            reasonForModification: `↩️ تم التراجع عن تسجيل الغياب (سُجلت سهواً) وتثبيت الحضور: ${defaultUndoReason}`,
            modifiedAt: timestamp,
            modifiedBy: actorName,
          };
        })
      );
    }

    // Deduct student missed lesson & recalculate absence days
    const deltaLessons = isAbsent ? -1 : 0;
    const deltaExcused = isExcused ? -1 : 0;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== existing.studentId && s.name !== existing.studentName) return s;
        const curLessons = s.totalMissedLessons || 0;
        const curExcused = s.excusedAbsenceDays || 0;
        const newLessons = Math.max(0, curLessons + deltaLessons);
        const newExcused = Math.max(0, curExcused + deltaExcused);
        const newUnexcused = Math.floor(newLessons / 5);

        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
        else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
        else if (newUnexcused >= 5) newWarn = 'إنذار أول';

        let newStatus = s.status;
        if (s.status === 'مفصولة بالغيابات' && newUnexcused < 15) {
          newStatus = 'منتظمة';
        }

        return {
          ...s,
          totalMissedLessons: newLessons,
          unexcusedAbsenceDays: newUnexcused,
          excusedAbsenceDays: newExcused,
          warningLevel: newWarn,
          status: newStatus,
        };
      })
    );

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
  const batchUndoAccidentalAbsences = (recordIds: string[], reason?: string) => {
    let count = 0;
    recordIds.forEach((id) => {
      const res = undoAccidentalAbsence(id, { reason });
      if (res.success) count++;
    });
    return {
      successCount: count,
      message: `تم بنجاح التراجع عن (${count}) غياب مسجل سهواً وتثبيت حضور الطالبات.`,
    };
  };

  /**
   * Direct undo of unexcused absence days and lessons for a student
   */
  const undoStudentAbsenceDays = (
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

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudent = s;

        const currentUnexcused = s.unexcusedAbsenceDays || 0;
        const currentLessons = s.totalMissedLessons || 0;

        const effectiveDaysDeduct = Math.max(0, daysToUndo);
        const effectiveLessonsDeduct = lessonsToUndo > 0 ? lessonsToUndo : effectiveDaysDeduct * 5;

        const newUnexcused = Math.max(0, currentUnexcused - effectiveDaysDeduct);
        const newLessons = Math.max(0, currentLessons - effectiveLessonsDeduct);

        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
        else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
        else if (newUnexcused >= 5) newWarn = 'إنذار أول';

        let newStatus = s.status;
        if (s.status === 'مفصولة بالغيابات' && newUnexcused < 15) {
          newStatus = 'منتظمة';
        }

        return {
          ...s,
          unexcusedAbsenceDays: newUnexcused,
          totalMissedLessons: newLessons,
          warningLevel: newWarn,
          status: newStatus,
        };
      })
    );

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

  const addDisciplinaryDecision = (
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
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== newDecision.studentId) return s;
        const currentDecisions = s.disciplinaryDecisions || [];
        const updatedDecisions = [newDecision, ...currentDecisions];

        let newStatus = s.status;
        let newWarningLevel = s.warningLevel || 'طبيعي';

        if (newDecision.decisionType === 'قرار فصل بسبب الغياب') {
          newStatus = 'مفصولة بالغيابات';
          newWarningLevel = 'مستحقة للفصل';
        } else if (newDecision.decisionType === 'إنذار نهائي') {
          newWarningLevel = 'إنذار نهائي';
        } else if (newDecision.decisionType === 'إنذار أول') {
          newWarningLevel = 'إنذار أول';
        }

        return {
          ...s,
          status: newStatus,
          warningLevel: newWarningLevel,
          disciplinaryDecisions: updatedDecisions,
        };
      })
    );

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

  const justifyAbsence = (studentId: string, excusedDays: number, notes: string, attachmentUrl?: string, attachmentName?: string, justifiedDates?: string[]) => {
    const timeStr = new Date().toISOString().split('T')[0];
    const letterNum = `م/ت/${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`;
    const formattedDatesList = justifiedDates && justifiedDates.length > 0 ? justifiedDates.join(' ، ') : '';

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const oldUnexcused = s.unexcusedAbsenceDays || 0;
        const oldExcused = s.excusedAbsenceDays || 0;
        const newUnexcused = Math.max(0, oldUnexcused - excusedDays);
        const newExcused = oldExcused + excusedDays;

        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (newUnexcused >= 15) newWarn = 'مستحقة للفصل';
        else if (newUnexcused >= 10) newWarn = 'إنذار نهائي';
        else if (newUnexcused >= 5) newWarn = 'إنذار أول';

        const decNotes = formattedDatesList
          ? `تم تبرير غياب (${excusedDays}) أيام (${formattedDatesList}) بناءً على التقرير الطبي/العذر الرسمي المقدم. السبب: ${notes}`
          : `تم تبرير غياب (${excusedDays}) أيام بناءً على التقرير الطبي/العذر الرسمي المقدم. السبب: ${notes}`;

        const dec: DisciplinaryDecision = {
          id: `dec-just-${Date.now()}`,
          studentId: s.id,
          studentName: s.name,
          gradeLevel: s.gradeLevel,
          section: s.section,
          decisionType: 'قبول عذر وتبرير غياب',
          absenceDaysCount: newUnexcused,
          missedLessonsCount: newUnexcused * 5,
          issueDate: timeStr,
          issuedBy: `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`,
          officialLetterNumber: letterNum,
          notes: decNotes,
          attachmentUrl: attachmentUrl,
          attachmentName: attachmentName || (attachmentUrl ? 'مستند_عذر_طبي_رسمي.pdf' : undefined),
          justifiedDaysCount: excusedDays,
          justifiedDates: justifiedDates,
          status: 'نافذ',
        };

        return {
          ...s,
          unexcusedAbsenceDays: newUnexcused,
          excusedAbsenceDays: newExcused,
          warningLevel: newWarn,
          status: s.status === 'مفصولة بالغيابات' && newUnexcused < 15 ? 'منتظمة' : s.status,
          disciplinaryDecisions: [dec, ...(s.disciplinaryDecisions || [])],
        };
      })
    );

    // Update attendance records for the justified dates if present
    if (justifiedDates && justifiedDates.length > 0) {
      setAttendance((prev) =>
        prev.map((rec) => {
          if (rec.studentId === studentId && justifiedDates.includes(rec.date)) {
            return {
              ...rec,
              status: 'مجازة',
              notes: `تم تبرير الغياب بعذر رسمي مصدق (${notes})`,
            };
          }
          return rec;
        })
      );
    }

    const targetStudent = students.find((s) => s.id === studentId);
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
    let targetDecision: DisciplinaryDecision | undefined;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudentName = s.name;
        targetParentId = s.parentId;

        const currentDecisions = s.disciplinaryDecisions || [];
        const dec = currentDecisions.find((d) => d.id === decisionId);
        if (!dec) return s;
        targetDecision = dec;

        let unexcused = s.unexcusedAbsenceDays || 0;
        let excused = s.excusedAbsenceDays || 0;
        let status = s.status;

        // If revoking an excuse/justification, revert excused days back to unexcused
        if (dec.decisionType === 'قبول عذر وتبرير غياب') {
          const daysToRevert = dec.justifiedDaysCount || 1;
          excused = Math.max(0, excused - daysToRevert);
          unexcused = unexcused + daysToRevert;
        }

        // Remove the decision from student's active decisions
        const updatedDecisions = currentDecisions.filter((d) => d.id !== decisionId);

        // Recalculate warning level based on unexcused days
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcused >= 15) {
          newWarn = 'مستحقة للفصل';
        } else if (unexcused >= 10) {
          newWarn = 'إنذار نهائي';
        } else if (unexcused >= 5) {
          newWarn = 'إنذار أول';
        }

        // If status was 'مفصولة بالغيابات' and expulsion was revoked (or unexcused < 15), restore to 'منتظمة'
        if (status === 'مفصولة بالغيابات' && (dec.decisionType === 'قرار فصل بسبب الغياب' || unexcused < 15)) {
          status = 'منتظمة';
        }

        return {
          ...s,
          unexcusedAbsenceDays: unexcused,
          excusedAbsenceDays: excused,
          totalMissedLessons: unexcused * 5,
          warningLevel: newWarn,
          status,
          disciplinaryDecisions: updatedDecisions,
        };
      })
    );

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

  const deleteDisciplinaryDecision = (decisionId: string, studentId: string) => {
    revokeDisciplinaryDecision(decisionId, studentId, 'حذف السجل الإداري بطلب مباشر من إدارة المدرسة');
  };

  const updateDisciplinaryDecision = (decisionId: string, studentId: string, updates: Partial<DisciplinaryDecision>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const currentDecisions = s.disciplinaryDecisions || [];
        const updated = currentDecisions.map((d) => (d.id === decisionId ? { ...d, ...updates } : d));
        return { ...s, disciplinaryDecisions: updated };
      })
    );
  };

  const revertAbsenceJustification = (decisionId: string, studentId: string, daysToRevert?: number, reason?: string) => {
    revokeDisciplinaryDecision(decisionId, studentId, reason || 'إلغاء تبرير الغياب وإعادة احتساب الأيام غير المبررة');
  };

  const sendAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => {
    const newAnc: Announcement = {
      ...data,
      id: `anc-${Date.now()}`,
      createdAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
      readBy: [],
    };
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
    setNotifications((prev) => [notif, ...prev]);
  };

  const sendMessage = (data: Omit<DirectMessage, 'id' | 'timestamp' | 'isRead'> & { id?: string }) => {
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    if (data.id) {
      // If it was a draft being sent
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? {
                ...m,
                ...data,
                timestamp: timeStr,
                folder: 'sent',
                isDraft: false,
                isSpam: false,
                isRead: true,
              }
            : m
        )
      );
    } else {
      // New sent message
      const randSuffix = Math.random().toString(36).substring(2, 7);
      const newMsg: DirectMessage = {
        ...data,
        id: `msg-${Date.now()}-${randSuffix}`,
        timestamp: timeStr,
        isRead: false,
        folder: 'sent',
        isDraft: false,
        isSpam: false,
      };
      setMessages((prev) => [newMsg, ...prev]);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}-${randSuffix}`,
        title: lang === 'ar' ? `رسالة جديدة من ${newMsg.senderName}` : `New message from ${newMsg.senderName}`,
        message: newMsg.subject,
        type: 'info',
        timestamp: lang === 'ar' ? 'الآن' : 'Just now',
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const saveDraft = (draftData: Partial<DirectMessage> & { subject: string; content: string }) => {
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    if (draftData.id) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === draftData.id
            ? {
                ...m,
                ...draftData,
                timestamp: timeStr,
                folder: 'drafts',
                isDraft: true,
              }
            : m
        )
      );
    } else {
      const randSuffix = Math.random().toString(36).substring(2, 7);
      const newDraft: DirectMessage = {
        id: draftData.id || `msg-draft-${Date.now()}-${randSuffix}`,
        senderId: draftData.senderId || `user-${role}`,
        senderName: draftData.senderName || 'مستخدم المدرسة',
        senderRole: draftData.senderRole || role,
        receiverId: draftData.receiverId || '',
        receiverName: draftData.receiverName || 'مستلم محدد',
        subject: draftData.subject || 'مسودة جديدة بدون عنوان',
        content: draftData.content || '',
        timestamp: timeStr,
        isRead: true,
        folder: 'drafts',
        isDraft: true,
      };
      setMessages((prev) => [newDraft, ...prev]);
    }
  };

  const getCurrentUserIdInContext = (providedUserId?: string): string => {
    if (providedUserId) return providedUserId;
    if (currentUser?.id) return currentUser.id;
    if (role === 'admin') return 'admin-main';
    if (role === 'teacher') return 'tech-1';
    if (role === 'student') return 'std-1';
    if (role === 'parent') return 'prt-1';
    return 'sup-1';
  };

  const moveToSpam = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: 'spam',
              isSpam: true,
              isTrash: false,
              isDeleted: false,
            },
          },
        };
      })
    );
  };

  const restoreFromSpam = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        const defaultFolder = m.senderId === targetUserId ? 'sent' : 'inbox';
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: defaultFolder,
              isSpam: false,
              isTrash: false,
            },
          },
        };
      })
    );
  };

  const moveToTrash = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: 'trash',
              isTrash: true,
              isSpam: false,
              isDeleted: false,
            },
          },
        };
      })
    );
  };

  const restoreFromTrash = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        const defaultFolder = m.isDraft
          ? 'drafts'
          : m.senderId === targetUserId
          ? 'sent'
          : 'inbox';
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: defaultFolder,
              isTrash: false,
              isSpam: false,
            },
          },
        };
      })
    );
  };

  const archiveMessage = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: 'archive',
              isArchived: true,
              isTrash: false,
              isSpam: false,
              isDeleted: false,
            },
          },
        };
      })
    );
  };

  const restoreFromArchive = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        const defaultFolder = m.isDraft
          ? 'drafts'
          : m.senderId === targetUserId
          ? 'sent'
          : 'inbox';
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: defaultFolder,
              isArchived: false,
            },
          },
        };
      })
    );
  };

  const moveToCustomFolder = (id: string, folderId: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              folder: folderId,
              customFolderId: folderId,
              isArchived: false,
              isTrash: false,
              isSpam: false,
              isDeleted: false,
            },
          },
        };
      })
    );
  };

  const addCustomFolder = (folderData: Omit<UserCustomFolder, 'id'>) => {
    const newFolder: UserCustomFolder = {
      ...folderData,
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setCustomFolders((prev) => [...prev, newFolder]);
  };

  const deleteCustomFolder = (folderId: string) => {
    setCustomFolders((prev) => prev.filter((f) => f.id !== folderId));
  };

  const deleteMessage = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === id);
      if (!msg) return prev;

      // If it's a draft deleted by the sender, remove object from array
      if (msg.isDraft && msg.senderId === targetUserId) {
        return prev.filter((m) => m.id !== id);
      }

      // Mark as permanently deleted for targetUserId
      return prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isDeleted: true,
            },
          },
        };
      });
    });
  };

  const updateMessage = (updatedMsg: DirectMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
    );
  };

  const emptyTrashFolder = (explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        const uState = m.userStates?.[targetUserId];
        const inTrash = uState ? (uState.isTrash || uState.folder === 'trash') : (m.isTrash || m.folder === 'trash');
        if (!inTrash) return m;

        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isDeleted: true,
            },
          },
        };
      })
    );
  };

  const markMessageRead = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isRead: true,
            },
          },
        };
      })
    );
  };

  const toggleStarMessage = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        const currentStarred = prevUState.isStarred !== undefined ? prevUState.isStarred : (m.isStarred ?? false);
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isStarred: !currentStarred,
            },
          },
        };
      })
    );
  };

  const emptySpamFolder = (explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setMessages((prev) =>
      prev.map((m) => {
        const uState = m.userStates?.[targetUserId];
        const inSpam = uState ? (uState.isSpam || uState.folder === 'spam') : (m.isSpam || m.folder === 'spam');
        if (!inSpam) return m;

        const prevStates = m.userStates || {};
        const prevUState = prevStates[targetUserId] || {};
        return {
          ...m,
          userStates: {
            ...prevStates,
            [targetUserId]: {
              ...prevUState,
              isDeleted: true,
            },
          },
        };
      })
    );
  };

  const addLecture = (data: Omit<LectureResource, 'id' | 'uploadedAt'>) => {
    const lectureId = `lec-${Date.now()}`;
    const newLec: LectureResource = {
      ...data,
      id: lectureId,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadCount: data.downloadCount ?? 1,
      viewsCount: data.viewsCount ?? 1,
    };

    if (data.pdfDataUrl && data.pdfDataUrl.length > 50) {
      saveStoredFile(lectureId, data.pdfDataUrl, {
        name: `${newLec.title}.pdf`,
        type: 'application/pdf',
      }).catch(console.error);
    }

    setLectures((prev) => [newLec, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: lang === 'ar' ? `تم إضافة مرجع / كتاب جديد للمكتبة: ${newLec.title}` : `New Library Resource: ${newLec.title}`,
      message: `${newLec.subject} (${newLec.gradeLevel})`,
      type: 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const deleteLecture = (id: string) => {
    // 1. Delete stored attachment/PDF file from IndexedDB
    deleteStoredFile(id).catch(console.error);

    // 2. Track deleted ID permanently in state and localStorage so it is never reloaded
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

    // 3. Remove from active lectures state immediately
    let targetLectureTitle = 'الكتاب / المرجع';
    setLectures((prev) => {
      const target = prev.find((l) => l.id === id);
      if (target?.title) targetLectureTitle = target.title;
      return prev.filter((l) => l.id !== id);
    });

    // 4. Clean up bookmarks and recent reads from localStorage
    try {
      const savedBm = localStorage.getItem('maysan_library_bookmarks_v1');
      if (savedBm) {
        const bmList: string[] = JSON.parse(savedBm);
        const filteredBm = bmList.filter((bId) => bId !== id);
        localStorage.setItem('maysan_library_bookmarks_v1', JSON.stringify(filteredBm));
      }
    } catch {
      // ignore
    }

    try {
      const savedRec = localStorage.getItem('maysan_library_recent_reads_v1');
      if (savedRec) {
        const recList: string[] = JSON.parse(savedRec);
        const filteredRec = recList.filter((rId) => rId !== id);
        localStorage.setItem('maysan_library_recent_reads_v1', JSON.stringify(filteredRec));
      }
    } catch {
      // ignore
    }

    // 5. Add Audit Log
    addAuditLog({
      action: `حذف كتاب / مرجع نهائياً: ${targetLectureTitle}`,
      actionType: 'delete',
      targetCategory: 'system',
      details: `تم حذف الكتاب برقم المعرف (${id}) وجميع ملفاته المرفقة بشكل دائم ونهائي من قاعدة البيانات والمكتبة المدرسية.`,
      severity: 'warning',
    });
  };

  const updateLecture = (id: string, data: Partial<LectureResource>) => {
    if (data.pdfDataUrl && data.pdfDataUrl.length > 50) {
      saveStoredFile(id, data.pdfDataUrl, {
        name: `${data.title || 'document'}.pdf`,
        type: 'application/pdf',
      }).catch(console.error);
    }
    setLectures((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...data } : l))
    );
  };

  const recordLectureDownload = (id: string) => {
    setLectures((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, downloadCount: (l.downloadCount || 0) + 1 } : l
      )
    );
  };

  const addNotification = (
    notifData: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US');
    const newNotif: NotificationItem = {
      ...notifData,
      id: notifData.id || `notif-${Date.now()}-${randSuffix}`,
      createdAt: new Date().toISOString(),
      timestamp: notifData.timestamp || (lang === 'ar' ? 'الآن' : 'Just now'),
      isRead: false,
      readBy: [],
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const deleteNotification = (id: string, explicitUserId?: string) => {
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
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
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        if (scope === 'global') {
          return {
            ...n,
            ...updates,
          };
        } else {
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
        const uState = n.userStates?.[currentUserId];
        const isReadForThisUser =
          uState?.isRead !== undefined
            ? uState.isRead
            : Boolean(n.readBy && n.readBy.includes(currentUserId));
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
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
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
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
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
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    const userNotifs = getUserNotifications(role, currentUser);
    const userNotifIds = new Set(userNotifs.map((n) => n.id));

    setNotifications((prev) =>
      prev.map((n) => {
        if (!userNotifIds.has(n.id)) return n;
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
    const targetUserId = getCurrentUserIdInContext(explicitUserId);
    const userNotifs = getUserNotifications(role, currentUser);
    const userNotifIds = new Set(userNotifs.map((n) => n.id));

    setNotifications((prev) =>
      prev.map((n) => {
        if (!userNotifIds.has(n.id)) return n;
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

  // Timetable Handlers
  const updateTimetableSlot = (id: string, updated: Partial<TimetableSlot>) => {
    setTimetable((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const addTimetableSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTimetable((prev) => [...prev, newSlot]);
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable((prev) => prev.filter((s) => s.id !== id));
  };

  const saveFullTimetable = (slots: TimetableSlot[]) => {
    setTimetable(slots);
  };

  // Grade Subject Quota Handlers
  const updateSubjectQuota = (id: string, updated: Partial<GradeSubjectQuota>) => {
    setSubjectQuotas((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)));
  };

  const addSubjectQuota = (quotaData: Omit<GradeSubjectQuota, 'id'>) => {
    const newQuota: GradeSubjectQuota = {
      ...quotaData,
      id: `quota-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setSubjectQuotas((prev) => [...prev, newQuota]);
  };

  const deleteSubjectQuota = (id: string) => {
    setSubjectQuotas((prev) => prev.filter((q) => q.id !== id));
  };

  const saveSubjectQuotas = (quotas: GradeSubjectQuota[]) => {
    setSubjectQuotas(quotas);
  };

  const exportDataJSON = () => {
    const payload = {
      exportDate: new Date().toISOString(),
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
      userPasscodes,
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
      if (parsed.lectures) setLectures(parsed.lectures);
      if (parsed.timetable) setTimetable(parsed.timetable);
      if (parsed.subjectQuotas) setSubjectQuotas(parsed.subjectQuotas);
      if (parsed.financial) setFinancial(parsed.financial);
      if (parsed.notifications) setNotifications(parsed.notifications);
      if (parsed.certificates) setCertificates(parsed.certificates);
      if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
      if (parsed.userPasscodes) setUserPasscodes(parsed.userPasscodes);
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
    setLectures(INITIAL_LECTURES);
    setTimetable(INITIAL_TIMETABLE);
    setSubjectQuotas(INITIAL_SUBJECT_QUOTAS);
    setFinancial(INITIAL_FINANCIAL);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCertificates(INITIAL_CERTIFICATES);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setSchoolAdminData(INITIAL_SCHOOL_ADMIN_DATA);
    setDecisionSettings(DEFAULT_MINISTRY_DECISION_SETTINGS);
    setChallenges(INITIAL_CHALLENGES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDeletedLectureIds([]);
    setDeletedChallengeIds([]);
    localStorage.removeItem('maysan_deleted_lecture_ids_v1');
    localStorage.removeItem('maysan_deleted_challenge_ids_v1');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
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
        calendarEvents,
        schoolAdminData,
        updateSchoolAdminData,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        decisionSettings,
        updateDecisionSettings,
        applySubjectDecisionMarks,
        autoOptimizeDecisionMarksForCert,
        resetDecisionMarksForCert,
        updateCertificate,
        updateSubjectGrade,
        batchUpdateStudentGrades,
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
