import type { GradeLevel, StudentCertificate } from '../types';
import {
  ACADEMIC_ERROR,
  AcademicDomainError,
  isEnteredGrade,
  readOverallGradeBySource,
  readSubjectGradeBySource,
  type AccelerationAttempt,
  type AccelerationExamKind,
  type AccelerationExamResult,
  type AccelerationPolicy,
  type AccelerationPolicySnapshot,
  type AcademicEnrollment,
  type EnrollmentFinalResult,
  type SubjectGradeSource,
} from '../types/academicHistory';

const THRESHOLD_KEYS = [
  'requiredFinalAverage',
  'minSubjectGrade',
  'aptitudePassingScore',
  'achievementPassingScore',
  'ministerialPassingGrade',
] as const;

type ThresholdKey = (typeof THRESHOLD_KEYS)[number];

export interface ResolvedPolicyThresholds {
  requiredFinalAverage?: number;
  minSubjectGrade?: number;
  aptitudePassingScore?: number;
  achievementPassingScore?: number;
  ministerialPassingGrade?: number;
  subjectGradeSource?: SubjectGradeSource;
  requiredExams: AccelerationExamKind[];
  ministerialExamSubjects: string[];
}

export function resultingGradeFromPolicy(policy: Pick<AccelerationPolicy, 'resultingGradeLevel' | 'targetGradeLevel'>): GradeLevel | undefined {
  return policy.resultingGradeLevel || policy.targetGradeLevel;
}

export function capturePolicySnapshot(policy: AccelerationPolicy): AccelerationPolicySnapshot {
  const resulting = resultingGradeFromPolicy(policy);
  if (!policy.targetExamGradeLevel || !resulting) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_SEMANTICS_INCOMPLETE,
      'لقطة السياسة تتطلب صف الامتحان وصف الناتج بشكل صريح.'
    );
  }
  return {
    policyId: policy.id,
    capturedAt: new Date().toISOString(),
    gradeLevel: policy.gradeLevel,
    targetExamGradeLevel: policy.targetExamGradeLevel,
    resultingGradeLevel: resulting,
    requiredFinalAverage: policy.requiredFinalAverage,
    minSubjectGrade: policy.minSubjectGrade,
    subjectGradeSource: policy.subjectGradeSource,
    aptitudePassingScore: policy.aptitudePassingScore,
    achievementPassingScore: policy.achievementPassingScore,
    ministerialPassingGrade: policy.ministerialPassingGrade,
    requiredExams: [...(policy.requiredExams || [])],
    ministerialExamSubjects: [...(policy.ministerialExamSubjects || [])],
    eligibilityRules: policy.eligibilityRules ? { ...policy.eligibilityRules } : undefined,
  };
}

function numericOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function resolvePolicyThresholds(
  policy: Pick<
    AccelerationPolicy,
    | 'requiredFinalAverage'
    | 'minSubjectGrade'
    | 'subjectGradeSource'
    | 'aptitudePassingScore'
    | 'achievementPassingScore'
    | 'ministerialPassingGrade'
    | 'requiredExams'
    | 'ministerialExamSubjects'
    | 'eligibilityRules'
  >
): { ok: true; thresholds: ResolvedPolicyThresholds } | { ok: false; code: string; reason: string } {
  const legacy = policy.eligibilityRules || {};
  const thresholds: ResolvedPolicyThresholds = {
    requiredExams: [...(policy.requiredExams || [])],
    ministerialExamSubjects: [...(policy.ministerialExamSubjects || [])],
    subjectGradeSource: policy.subjectGradeSource,
  };

  for (const key of THRESHOLD_KEYS) {
    const canonical = numericOrUndefined(policy[key]);
    const fromLegacy = numericOrUndefined(legacy[key]);
    if (canonical !== undefined && fromLegacy !== undefined && canonical !== fromLegacy) {
      return {
        ok: false,
        code: ACADEMIC_ERROR.POLICY_RULE_CONFLICT,
        reason: `تعارض بين القيمة المعتمدة والقيمة القديمة للحقل ${key}.`,
      };
    }
    const resolved = canonical !== undefined ? canonical : fromLegacy;
    if (resolved !== undefined) thresholds[key] = resolved;
  }

  if (thresholds.minSubjectGrade !== undefined && !thresholds.subjectGradeSource) {
    return {
      ok: false,
      code: ACADEMIC_ERROR.POLICY_CONFIGURATION_INCOMPLETE,
      reason: 'تم ضبط الحد الأدنى لدرجة المادة دون تحديد مصدر الدرجة (subjectGradeSource).',
    };
  }
  if (thresholds.requiredFinalAverage !== undefined && !thresholds.subjectGradeSource) {
    return {
      ok: false,
      code: ACADEMIC_ERROR.POLICY_CONFIGURATION_INCOMPLETE,
      reason: 'تم ضبط المعدل المطلوب دون تحديد مصدر الدرجة.',
    };
  }

  return { ok: true, thresholds };
}

export interface EligibilityEvaluation {
  eligible: boolean;
  reasons: string[];
  incomplete: boolean;
}

export function evaluateAccelerationEligibility(
  policy: AccelerationPolicy,
  certificate: StudentCertificate | null | undefined,
  sourceEnrollment: AcademicEnrollment
): EligibilityEvaluation {
  const reasons: string[] = [];
  if (policy.gradeLevel !== sourceEnrollment.gradeLevel) {
    reasons.push('صف السياسة لا يطابق صف القيد المصدر.');
  }
  const semantics = validateAccelerationGradeSemantics(policy);
  if (semantics.ok === false) reasons.push(semantics.reason);

  const resolved = resolvePolicyThresholds(policy);
  if (resolved.ok === false) {
    return { eligible: false, incomplete: true, reasons: [...reasons, resolved.reason] };
  }
  const { thresholds } = resolved;

  if (thresholds.minSubjectGrade !== undefined || thresholds.requiredFinalAverage !== undefined) {
    if (!certificate) {
      return {
        eligible: false,
        incomplete: true,
        reasons: [...reasons, 'لا توجد شهادة مطابقة لتقييم درجات الأهلية.'],
      };
    }
  }

  if (thresholds.requiredFinalAverage !== undefined && thresholds.subjectGradeSource) {
    const overall = certificate ? readOverallGradeBySource(certificate, thresholds.subjectGradeSource) : undefined;
    if (!isEnteredGrade(overall)) {
      return {
        eligible: false,
        incomplete: true,
        reasons: [...reasons, 'المعدل المطلوب غير مكتمل في مصدر الدرجة المحدد (صفر يعني غير مدخل).'],
      };
    }
    if (overall < thresholds.requiredFinalAverage) {
      reasons.push('المعدل العام أقل من الحد المطلوب في السياسة.');
    }
  }

  if (thresholds.minSubjectGrade !== undefined && thresholds.subjectGradeSource && certificate) {
    for (const subject of certificate.subjects || []) {
      const value = readSubjectGradeBySource(subject, thresholds.subjectGradeSource);
      if (!isEnteredGrade(value)) {
        return {
          eligible: false,
          incomplete: true,
          reasons: [...reasons, `درجة المادة (${subject.subjectName}) غير مكتملة في المصدر المحدد.`],
        };
      }
      if (value < thresholds.minSubjectGrade) {
        reasons.push(`المادة (${subject.subjectName}) أقل من الحد الأدنى المطلوب.`);
      }
    }
  }

  return { eligible: reasons.length === 0, incomplete: false, reasons };
}

export function validateAccelerationGradeSemantics(policy: Pick<
  AccelerationPolicy,
  'gradeLevel' | 'targetExamGradeLevel' | 'resultingGradeLevel' | 'targetGradeLevel'
>): { ok: true } | { ok: false; reason: string } {
  if (!policy.gradeLevel) {
    return { ok: false, reason: 'صف المصدر غير محدد في السياسة.' };
  }
  if (!policy.targetExamGradeLevel) {
    return { ok: false, reason: 'صف امتحان التسريع (targetExamGradeLevel) غير محدد.' };
  }
  const resulting = resultingGradeFromPolicy(policy);
  if (!resulting) {
    return { ok: false, reason: 'صف الناتج بعد التسريع غير محدد، ولن يُستنتج من صف الامتحان.' };
  }
  if (!policy.resultingGradeLevel && policy.targetGradeLevel && policy.targetGradeLevel === policy.targetExamGradeLevel) {
    return {
      ok: false,
      reason: 'targetGradeLevel يساوي صف الامتحان ولا يمكن استخدامه كصف ناتج.',
    };
  }
  return { ok: true };
}

export function createAccelerationAttempt(input: {
  studentId: string;
  sourceEnrollment: AcademicEnrollment;
  policy: AccelerationPolicy;
  now?: string;
}): AccelerationAttempt {
  const semantics = validateAccelerationGradeSemantics(input.policy);
  if (semantics.ok === false) {
    throw new AcademicDomainError(ACADEMIC_ERROR.ACCELERATION_SEMANTICS_INCOMPLETE, semantics.reason);
  }
  if (input.policy.gradeLevel !== input.sourceEnrollment.gradeLevel) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_SEMANTICS_INCOMPLETE,
      'لا يمكن الترشيح: صف السياسة لا يطابق صف القيد.'
    );
  }
  const snapshot = capturePolicySnapshot(input.policy);
  const now = input.now || new Date().toISOString();
  return {
    id: `acc-${input.studentId}-${input.sourceEnrollment.id}-${Date.now()}`,
    studentId: input.studentId,
    policyId: input.policy.id,
    sourceEnrollmentId: input.sourceEnrollment.id,
    sourceGradeLevel: input.sourceEnrollment.gradeLevel,
    targetExamGradeLevel: snapshot.targetExamGradeLevel,
    resultingGradeLevel: snapshot.resultingGradeLevel,
    policySnapshot: snapshot,
    status: 'nominated',
    examResults: [],
    finalResult: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

function snapshotAsPolicy(snapshot: AccelerationPolicySnapshot): AccelerationPolicy {
  return {
    id: snapshot.policyId,
    name: snapshot.policyId,
    gradeLevel: snapshot.gradeLevel,
    targetExamGradeLevel: snapshot.targetExamGradeLevel,
    resultingGradeLevel: snapshot.resultingGradeLevel,
    requiredFinalAverage: snapshot.requiredFinalAverage,
    minSubjectGrade: snapshot.minSubjectGrade,
    subjectGradeSource: snapshot.subjectGradeSource,
    aptitudePassingScore: snapshot.aptitudePassingScore,
    achievementPassingScore: snapshot.achievementPassingScore,
    ministerialPassingGrade: snapshot.ministerialPassingGrade,
    requiredExams: snapshot.requiredExams,
    ministerialExamSubjects: snapshot.ministerialExamSubjects,
    eligibilityRules: snapshot.eligibilityRules,
    createdAt: snapshot.capturedAt,
    updatedAt: snapshot.capturedAt,
  };
}

function passingScoreForKind(
  kind: AccelerationExamKind,
  thresholds: ResolvedPolicyThresholds
): number | undefined {
  if (kind === 'aptitude') return thresholds.aptitudePassingScore;
  if (kind === 'achievement') return thresholds.achievementPassingScore;
  return thresholds.ministerialPassingGrade;
}

export function calculateAccelerationResult(attempt: AccelerationAttempt): {
  finalResult: EnrollmentFinalResult;
  reasons: string[];
  incomplete: boolean;
} {
  const resolved = resolvePolicyThresholds(snapshotAsPolicy(attempt.policySnapshot));
  if (resolved.ok === false) {
    return { finalResult: 'pending', incomplete: true, reasons: [resolved.reason] };
  }
  const required = attempt.policySnapshot.requiredExams || [];
  const reasons: string[] = [];
  let incomplete = false;

  for (const kind of required) {
    const related = (attempt.examResults || []).filter((row) => row.kind === kind);
    if (kind === 'ministerial') {
      const subjects = attempt.policySnapshot.ministerialExamSubjects || [];
      if (subjects.length > 0) {
        for (const subjectName of subjects) {
          const row = related.find((item) => item.subjectName === subjectName);
          const outcome = evaluateExamRow(kind, row, resolved.thresholds);
          if (outcome.incomplete) incomplete = true;
          reasons.push(...outcome.reasons);
        }
        continue;
      }
    }
    const row = related[0];
    const outcome = evaluateExamRow(kind, row, resolved.thresholds);
    if (outcome.incomplete) incomplete = true;
    reasons.push(...outcome.reasons);
  }

  if (incomplete) return { finalResult: 'pending', incomplete: true, reasons };
  if (reasons.length > 0) return { finalResult: 'failed', incomplete: false, reasons };
  if (required.length === 0) {
    return {
      finalResult: 'pending',
      incomplete: true,
      reasons: ['لا توجد امتحانات مطلوبة في لقطة السياسة؛ لا يمكن اعتبار المحاولة ناجحة تلقائياً.'],
    };
  }
  return { finalResult: 'passed', incomplete: false, reasons: [] };
}

function evaluateExamRow(
  kind: AccelerationExamKind,
  row: AccelerationExamResult | undefined,
  thresholds: ResolvedPolicyThresholds
): { incomplete: boolean; reasons: string[] } {
  if (!row || !isEnteredGrade(row.score)) {
    return { incomplete: true, reasons: [`نتيجة امتحان (${kind}) غير مكتملة.`] };
  }
  const passing = passingScoreForKind(kind, thresholds);
  if (passing === undefined) {
    return {
      incomplete: true,
      reasons: [`امتحان (${kind}) مطلوب لكن حد النجاح غير مضبوط في لقطة السياسة.`],
    };
  }
  if (row.score < passing) {
    return { incomplete: false, reasons: [`امتحان (${kind}) دون حد النجاح المضبوط في السياسة.`] };
  }
  return { incomplete: false, reasons: [] };
}

export function assertPolicyDeletable(policyId: string, attempts: AccelerationAttempt[]): void {
  if (attempts.some((row) => row.policyId === policyId)) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.POLICY_DELETE_FORBIDDEN,
      'لا يمكن حذف سياسة مرتبطة بمحاولات تسريع قائمة.'
    );
  }
}

export function assertAttemptDeletable(attempt: AccelerationAttempt): void {
  if (attempt.status === 'approved' || attempt.resultingEnrollmentId) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ATTEMPT_DELETE_FORBIDDEN,
      'لا يمكن حذف محاولة تسريع معتمدة أو مرتبطة بقيد ناتج.'
    );
  }
}

export function buildCanonicalPolicyRecord(input: {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  targetExamGradeLevel: GradeLevel;
  resultingGradeLevel: GradeLevel;
  academicYear?: string;
  requiredFinalAverage?: number;
  minSubjectGrade?: number;
  subjectGradeSource?: SubjectGradeSource;
  aptitudePassingScore?: number;
  achievementPassingScore?: number;
  ministerialPassingGrade?: number;
  requiredExams: AccelerationExamKind[];
  ministerialExamSubjects?: string[];
  sourceReference?: string;
}): AccelerationPolicy {
  const semantics = validateAccelerationGradeSemantics(input);
  if (semantics.ok === false) {
    throw new AcademicDomainError(ACADEMIC_ERROR.ACCELERATION_SEMANTICS_INCOMPLETE, semantics.reason);
  }
  const now = new Date().toISOString();
  const policy: AccelerationPolicy = {
    id: input.id,
    name: input.name.trim(),
    academicYear: input.academicYear,
    gradeLevel: input.gradeLevel,
    targetExamGradeLevel: input.targetExamGradeLevel,
    resultingGradeLevel: input.resultingGradeLevel,
    requiredExams: [...input.requiredExams],
    ministerialExamSubjects: input.ministerialExamSubjects ? [...input.ministerialExamSubjects] : [],
    sourceReference: input.sourceReference?.trim() || undefined,
    subjectGradeSource: input.subjectGradeSource,
    createdAt: now,
    updatedAt: now,
  };
  if (input.requiredFinalAverage !== undefined) policy.requiredFinalAverage = input.requiredFinalAverage;
  if (input.minSubjectGrade !== undefined) policy.minSubjectGrade = input.minSubjectGrade;
  if (input.aptitudePassingScore !== undefined) policy.aptitudePassingScore = input.aptitudePassingScore;
  if (input.achievementPassingScore !== undefined) policy.achievementPassingScore = input.achievementPassingScore;
  if (input.ministerialPassingGrade !== undefined) policy.ministerialPassingGrade = input.ministerialPassingGrade;
  const resolved = resolvePolicyThresholds(policy);
  if (resolved.ok === false) {
    throw new AcademicDomainError(resolved.code as typeof ACADEMIC_ERROR.POLICY_RULE_CONFLICT, resolved.reason);
  }
  return policy;
}
