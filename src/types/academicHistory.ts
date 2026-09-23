import type { GradeLevel, Student, StudentCertificate, SubjectGrade } from '../types';

export const ACADEMIC_ENROLLMENTS_COLLECTION = 'academicEnrollments';
export const ACCELERATION_POLICIES_COLLECTION = 'accelerationPolicies';
export const ACCELERATION_ATTEMPTS_COLLECTION = 'accelerationAttempts';
export const ACADEMIC_TRANSITION_AUDITS_COLLECTION = 'academicTransitionAudits';

export const ACADEMIC_ERROR = {
  AUTHORITATIVE_ENROLLMENT_REQUIRED: 'AUTHORITATIVE_ENROLLMENT_REQUIRED',
  HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN: 'HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN',
  ACCELERATION_ATTEMPT_STATUS_INVALID: 'ACCELERATION_ATTEMPT_STATUS_INVALID',
  ACADEMIC_TRANSITION_CONFLICT: 'ACADEMIC_TRANSITION_CONFLICT',
  ACADEMIC_YEAR_REQUIRED: 'ACADEMIC_YEAR_REQUIRED',
  POLICY_CONFIGURATION_INCOMPLETE: 'POLICY_CONFIGURATION_INCOMPLETE',
  POLICY_RULE_CONFLICT: 'POLICY_RULE_CONFLICT',
  GRADE_DATA_INCOMPLETE: 'GRADE_DATA_INCOMPLETE',
  ENROLLMENT_DELETE_FORBIDDEN: 'ENROLLMENT_DELETE_FORBIDDEN',
  POLICY_DELETE_FORBIDDEN: 'POLICY_DELETE_FORBIDDEN',
  ATTEMPT_DELETE_FORBIDDEN: 'ATTEMPT_DELETE_FORBIDDEN',
  ACCELERATION_SEMANTICS_INCOMPLETE: 'ACCELERATION_SEMANTICS_INCOMPLETE',
} as const;

export type AcademicErrorCode = (typeof ACADEMIC_ERROR)[keyof typeof ACADEMIC_ERROR];

export class AcademicDomainError extends Error {
  code: AcademicErrorCode;
  constructor(code: AcademicErrorCode, message: string) {
    super(message);
    this.name = 'AcademicDomainError';
    this.code = code;
  }
}

export type EnrollmentType = 'regular' | 'repeat' | 'accelerated';
export type EnrollmentStatus = 'active' | 'closed' | 'superseded';
export type EnrollmentFinalResult = 'pending' | 'passed' | 'failed';
export type EnrollmentTransitionType =
  | 'none'
  | 'repeat'
  | 'regular_promotion'
  | 'acceleration_promotion'
  | 'graduated';
export type EnrollmentProvenance = 'authoritative' | 'derived' | 'imported';

export type AccelerationAttemptStatus =
  | 'nominated'
  | 'in_progress'
  | 'eligible'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type AccelerationExamKind = 'aptitude' | 'achievement' | 'ministerial';
export type SubjectGradeSource = 'finalGrade' | 'annualSaeiAvg';

export interface AcademicEnrollment {
  id: string;
  studentId: string;
  academicYear: string;
  gradeLevel: GradeLevel;
  attemptNumber: number;
  enrollmentType: EnrollmentType;
  status: EnrollmentStatus;
  finalResult: EnrollmentFinalResult;
  transitionType: EnrollmentTransitionType;
  previousEnrollmentId?: string;
  nextEnrollmentId?: string;
  certificateId?: string;
  accelerationAttemptId?: string;
  isDerived: boolean;
  provenance: EnrollmentProvenance;
  createdAt: string;
  updatedAt: string;
}

export type CertificateWithEnrollmentLink = StudentCertificate & {
  academicEnrollmentId?: string;
};

export interface AccelerationEligibilityRulesLegacy {
  requiredFinalAverage?: number;
  minSubjectGrade?: number;
  aptitudePassingScore?: number;
  achievementPassingScore?: number;
  ministerialPassingGrade?: number;
}

export interface AccelerationSubjectGradeRule {
  baselineMinimum?: number;
  exceptionMinimum?: number;
  maxExceptionSubjects?: number;
}

export interface AccelerationPolicy {
  id: string;
  name: string;
  academicYear?: string;
  gradeLevel: GradeLevel;
  targetExamGradeLevel: GradeLevel;
  resultingGradeLevel: GradeLevel;
  /** @deprecated Legacy alias of resultingGradeLevel only. Never an exam-grade alias. */
  targetGradeLevel?: GradeLevel;
  requiredFinalAverage?: number;
  minSubjectGrade?: number;
  subjectGradeSource?: SubjectGradeSource;
  subjectGradeRule?: AccelerationSubjectGradeRule;
  aptitudePassingScore?: number;
  achievementPassingScore?: number;
  ministerialPassingGrade?: number;
  requiredExams: AccelerationExamKind[];
  ministerialExamSubjects?: string[];
  sourceReference?: string;
  /** Read-only compatibility. New policies must not duplicate canonical values here. */
  eligibilityRules?: AccelerationEligibilityRulesLegacy;
  createdAt: string;
  updatedAt: string;
}

export interface AccelerationExamResult {
  kind: AccelerationExamKind;
  subjectName?: string;
  score?: number;
}

export interface AccelerationPolicySnapshot {
  policyId: string;
  capturedAt: string;
  gradeLevel: GradeLevel;
  targetExamGradeLevel: GradeLevel;
  resultingGradeLevel: GradeLevel;
  requiredFinalAverage?: number;
  minSubjectGrade?: number;
  subjectGradeSource?: SubjectGradeSource;
  subjectGradeRule?: AccelerationSubjectGradeRule;
  aptitudePassingScore?: number;
  achievementPassingScore?: number;
  ministerialPassingGrade?: number;
  requiredExams: AccelerationExamKind[];
  ministerialExamSubjects?: string[];
  eligibilityRules?: AccelerationEligibilityRulesLegacy;
}

export interface AccelerationAttempt {
  id: string;
  studentId: string;
  policyId: string;
  sourceEnrollmentId: string;
  sourceGradeLevel: GradeLevel;
  targetExamGradeLevel: GradeLevel;
  resultingGradeLevel: GradeLevel;
  policySnapshot: AccelerationPolicySnapshot;
  status: AccelerationAttemptStatus;
  examResults: AccelerationExamResult[];
  finalResult: EnrollmentFinalResult;
  resultingEnrollmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicTransitionAudit {
  id: string;
  studentId: string;
  sourceEnrollmentId: string;
  nextEnrollmentId: string;
  transitionType: EnrollmentTransitionType;
  actorId?: string;
  createdAt: string;
  details: string;
}

export type StudentAcademicRef = Pick<Student, 'id' | 'gradeLevel' | 'enrollmentYear'> & {
  currentEnrollmentId?: string;
};

const YEAR_PAIR_RE = /(\d{4})\s*[-/–—]\s*(\d{4})/;

export function normalizeAcademicYear(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(YEAR_PAIR_RE);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (end !== start + 1) return null;
  return `${start}-${end}`;
}

export function incrementAcademicYear(input: unknown): string | null {
  const normalized = normalizeAcademicYear(input);
  if (!normalized) return null;
  const [startRaw, endRaw] = normalized.split('-');
  const start = Number(startRaw);
  const end = Number(endRaw);
  return `${start + 1}-${end + 1}`;
}

export function isEnteredGrade(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function mapCertificateStatusToFinalResult(
  status: StudentCertificate['status'] | undefined
): EnrollmentFinalResult {
  if (status === 'ناجحة' || status === 'ناجحة بالدور الثاني') return 'passed';
  if (status === 'راسبة') return 'failed';
  return 'pending';
}

export function readSubjectGradeBySource(
  subject: SubjectGrade,
  source: SubjectGradeSource
): number | undefined {
  if (source === 'finalGrade') return subject.finalGrade;
  return subject.annualSaeiAvg;
}

export function readOverallGradeBySource(
  certificate: StudentCertificate,
  source: SubjectGradeSource
): number | undefined {
  if (source === 'finalGrade') return certificate.overallFinalGrade;
  return certificate.overallAnnualSaeiAvg;
}
