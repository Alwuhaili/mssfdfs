import { getNextGradeLevel, type GradeLevel, type StudentCertificate } from '../types';
import {
  ACADEMIC_ERROR,
  AcademicDomainError,
  incrementAcademicYear,
  mapCertificateStatusToFinalResult,
  normalizeAcademicYear,
  type AcademicEnrollment,
  type AcademicTransitionAudit,
  type AccelerationAttempt,
  type CertificateWithEnrollmentLink,
  type EnrollmentFinalResult,
  type StudentAcademicRef,
} from '../types/academicHistory';

export function resolveCertificateEnrollment(
  certificate: CertificateWithEnrollmentLink,
  enrollments: AcademicEnrollment[]
): AcademicEnrollment | null {
  const explicitId = typeof certificate.academicEnrollmentId === 'string'
    ? certificate.academicEnrollmentId.trim()
    : '';
  if (explicitId) {
    return enrollments.find((row) => row.id === explicitId && row.studentId === certificate.studentId) || null;
  }

  const year = normalizeAcademicYear(certificate.academicYear);
  if (!year) return null;
  const matches = enrollments.filter(
    (row) =>
      row.studentId === certificate.studentId &&
      normalizeAcademicYear(row.academicYear) === year &&
      row.gradeLevel === certificate.gradeLevel &&
      !row.isDerived
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    return matches.find((row) => row.certificateId === certificate.id) || matches[0];
  }
  return null;
}

export function buildDerivedEnrollmentFromCertificate(
  certificate: StudentCertificate
): AcademicEnrollment | null {
  const academicYear = normalizeAcademicYear(certificate.academicYear);
  if (!academicYear || !certificate.studentId || !certificate.gradeLevel) return null;
  const now = certificate.issueDate || '';
  return {
    id: `derived-cert-${certificate.id}`,
    studentId: certificate.studentId,
    academicYear,
    gradeLevel: certificate.gradeLevel,
    attemptNumber: 1,
    enrollmentType: 'regular',
    status: 'closed',
    finalResult: mapCertificateStatusToFinalResult(certificate.status),
    transitionType: 'none',
    certificateId: certificate.id,
    isDerived: true,
    provenance: 'derived',
    createdAt: now,
    updatedAt: now,
  };
}

export function getStudentEnrollmentsWithLegacyFallback(
  persisted: AcademicEnrollment[],
  certificates: StudentCertificate[],
  studentId: string
): AcademicEnrollment[] {
  const owned = (persisted || []).filter((row) => row.studentId === studentId);
  const merged = [...owned];
  const seenDerived = new Set(owned.map((row) => row.id));

  for (const certificate of certificates || []) {
    if (certificate.studentId !== studentId) continue;
    const resolved = resolveCertificateEnrollment(certificate, owned);
    if (resolved) continue;
    const derived = buildDerivedEnrollmentFromCertificate(certificate);
    if (!derived) continue;
    if (seenDerived.has(derived.id)) continue;
    seenDerived.add(derived.id);
    merged.push(derived);
  }

  return merged.sort((a, b) => {
    const yearA = normalizeAcademicYear(a.academicYear) || '';
    const yearB = normalizeAcademicYear(b.academicYear) || '';
    if (yearA !== yearB) return yearA.localeCompare(yearB);
    if (a.gradeLevel !== b.gradeLevel) return String(a.gradeLevel).localeCompare(String(b.gradeLevel));
    return a.attemptNumber - b.attemptNumber;
  });
}

export function assertAuthoritativeCurrentEnrollment(
  student: StudentAcademicRef,
  source: AcademicEnrollment | null | undefined,
  options?: { allowSupersededForReplay?: boolean }
): AcademicEnrollment {
  if (!student?.currentEnrollmentId || !source) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
      'لا يمكن تنفيذ انتقال أكاديمي بدون قيد حالي موثّق.'
    );
  }
  if (source.studentId !== student.id) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
      'القيد المصدر لا يعود لنفس الطالبة.'
    );
  }
  if (source.isDerived || source.provenance === 'derived') {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN,
      'لا يجوز تحويل قيد مشتق/تاريخي إلى حالة الطالبة الحالية.'
    );
  }
  const isCurrent = source.id === student.currentEnrollmentId;
  if (!isCurrent && !options?.allowSupersededForReplay) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
      'القيد المصدر لا يطابق currentEnrollmentId للطالبة.'
    );
  }
  if (isCurrent && source.status !== 'active' && !options?.allowSupersededForReplay) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN,
      'لا يجوز تحوير قيد غير نشط باعتباره القيد الحالي.'
    );
  }
  return source;
}

export function assertEnrollmentDeletable(
  enrollment: AcademicEnrollment,
  student: StudentAcademicRef | undefined,
  related: AcademicEnrollment[]
): void {
  if (student?.currentEnrollmentId === enrollment.id) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ENROLLMENT_DELETE_FORBIDDEN,
      'لا يمكن حذف القيد الحالي الموثّق.'
    );
  }
  if (related.some((row) => row.previousEnrollmentId === enrollment.id || row.nextEnrollmentId === enrollment.id)) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ENROLLMENT_DELETE_FORBIDDEN,
      'لا يمكن حذف قيد مرتبط بسلسلة انتقالات.'
    );
  }
}

export interface PlannedAcademicTransition {
  kind: 'repeat' | 'regular_promotion' | 'acceleration_promotion';
  replay: boolean;
  sourceUpdate: AcademicEnrollment;
  nextEnrollment: AcademicEnrollment;
  studentPatch: {
    currentEnrollmentId: string;
    gradeLevel: GradeLevel;
    enrollmentYear: string;
  };
  audit: AcademicTransitionAudit;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeEnrollmentId(
  studentId: string,
  academicYear: string,
  gradeLevel: GradeLevel,
  attemptNumber: number,
  kind: string
): string {
  const gradeKey = encodeURIComponent(gradeLevel).replace(/%/g, '_');
  return `enr-${studentId}-${academicYear}-${gradeKey}-${attemptNumber}-${kind}`;
}

function makeAudit(
  studentId: string,
  sourceId: string,
  nextId: string,
  transitionType: PlannedAcademicTransition['sourceUpdate']['transitionType'],
  details: string,
  actorId?: string
): AcademicTransitionAudit {
  return {
    id: `aud-${studentId}-${nextId}`,
    studentId,
    sourceEnrollmentId: sourceId,
    nextEnrollmentId: nextId,
    transitionType,
    actorId,
    createdAt: nowIso(),
    details,
  };
}

export function detectExistingTransition(
  source: AcademicEnrollment,
  expectedNext: AcademicEnrollment,
  existingNext: AcademicEnrollment | undefined,
  student: StudentAcademicRef
): 'fresh' | 'idempotent' {
  if (!existingNext && student.currentEnrollmentId === source.id && !source.nextEnrollmentId) {
    return 'fresh';
  }

  const pointersMatch =
    existingNext &&
    existingNext.id === expectedNext.id &&
    existingNext.studentId === expectedNext.studentId &&
    existingNext.previousEnrollmentId === source.id &&
    source.nextEnrollmentId === existingNext.id &&
    student.currentEnrollmentId === existingNext.id &&
    existingNext.gradeLevel === expectedNext.gradeLevel &&
    normalizeAcademicYear(existingNext.academicYear) === normalizeAcademicYear(expectedNext.academicYear);

  if (pointersMatch) return 'idempotent';

  if (existingNext || source.nextEnrollmentId || student.currentEnrollmentId !== source.id) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACADEMIC_TRANSITION_CONFLICT,
      'تعارض في سلسلة الانتقال الأكاديمي المحفوظة.'
    );
  }
  return 'fresh';
}

export function planRepeatYearTransition(input: {
  student: StudentAcademicRef;
  source: AcademicEnrollment;
  existingNext?: AcademicEnrollment;
  actorId?: string;
}): PlannedAcademicTransition {
  const source = assertAuthoritativeCurrentEnrollment(input.student, input.source, {
    allowSupersededForReplay: Boolean(input.existingNext),
  });
  const nextYear = incrementAcademicYear(source.academicYear);
  if (!nextYear) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACADEMIC_YEAR_REQUIRED,
      'لا يمكن تكرار السنة بدون سنة دراسية موثّقة على القيد الحالي.'
    );
  }
  const nextEnrollment: AcademicEnrollment = {
    id: makeEnrollmentId(source.studentId, nextYear, source.gradeLevel, source.attemptNumber + 1, 'repeat'),
    studentId: source.studentId,
    academicYear: nextYear,
    gradeLevel: source.gradeLevel,
    attemptNumber: source.attemptNumber + 1,
    enrollmentType: 'repeat',
    status: 'active',
    finalResult: 'pending',
    transitionType: 'none',
    previousEnrollmentId: source.id,
    isDerived: false,
    provenance: 'authoritative',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const replay = detectExistingTransition(source, nextEnrollment, input.existingNext, input.student) === 'idempotent';
  const sourceUpdate: AcademicEnrollment = {
    ...source,
    status: 'superseded',
    transitionType: 'repeat',
    nextEnrollmentId: nextEnrollment.id,
    updatedAt: nowIso(),
  };
  return {
    kind: 'repeat',
    replay,
    sourceUpdate,
    nextEnrollment,
    studentPatch: {
      currentEnrollmentId: nextEnrollment.id,
      gradeLevel: source.gradeLevel,
      enrollmentYear: nextYear,
    },
    audit: makeAudit(source.studentId, source.id, nextEnrollment.id, 'repeat', 'repeat-year', input.actorId),
  };
}

export function planRegularPromotionTransition(input: {
  student: StudentAcademicRef;
  source: AcademicEnrollment;
  persistedFinalResult: EnrollmentFinalResult;
  callerIsSecondRound?: boolean;
  existingNext?: AcademicEnrollment;
  actorId?: string;
}): PlannedAcademicTransition {
  const source = assertAuthoritativeCurrentEnrollment(input.student, input.source, {
    allowSupersededForReplay: Boolean(input.existingNext),
  });
  void input.callerIsSecondRound;
  const persisted = input.persistedFinalResult;
  if (persisted !== source.finalResult && persisted !== undefined) {
    // Authoritative result is the Firestore value supplied as persistedFinalResult.
  }
  const authoritativeResult = persisted;
  if (authoritativeResult !== 'passed') {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN,
      'الترفيع النظامي يتطلب نتيجة نجاح موثّقة في Firestore وليس علماً من المستدعي.'
    );
  }
  const nextGrade = getNextGradeLevel(source.gradeLevel);
  const nextYear = incrementAcademicYear(source.academicYear);
  if (!nextYear) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACADEMIC_YEAR_REQUIRED,
      'لا يمكن الترفيع النظامي بدون سنة دراسية موثّقة على القيد الحالي.'
    );
  }
  const graduated = nextGrade === 'GRADUATED';
  const resultingGrade: GradeLevel = graduated ? source.gradeLevel : nextGrade;
  const nextEnrollment: AcademicEnrollment = {
    id: makeEnrollmentId(
      source.studentId,
      nextYear,
      resultingGrade,
      1,
      graduated ? 'graduated' : 'regular'
    ),
    studentId: source.studentId,
    academicYear: nextYear,
    gradeLevel: resultingGrade,
    attemptNumber: 1,
    enrollmentType: 'regular',
    status: graduated ? 'closed' : 'active',
    finalResult: graduated ? 'passed' : 'pending',
    transitionType: graduated ? 'graduated' : 'none',
    previousEnrollmentId: source.id,
    isDerived: false,
    provenance: 'authoritative',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const replay = detectExistingTransition(source, nextEnrollment, input.existingNext, input.student) === 'idempotent';
  const sourceUpdate: AcademicEnrollment = {
    ...source,
    finalResult: authoritativeResult,
    status: 'superseded',
    transitionType: graduated ? 'graduated' : 'regular_promotion',
    nextEnrollmentId: nextEnrollment.id,
    updatedAt: nowIso(),
  };
  return {
    kind: 'regular_promotion',
    replay,
    sourceUpdate,
    nextEnrollment,
    studentPatch: {
      currentEnrollmentId: nextEnrollment.id,
      gradeLevel: resultingGrade,
      enrollmentYear: nextYear,
    },
    audit: makeAudit(
      source.studentId,
      source.id,
      nextEnrollment.id,
      sourceUpdate.transitionType,
      'regular-promotion; callerIsSecondRound ignored',
      input.actorId
    ),
  };
}

export function planAccelerationPromotionTransition(input: {
  student: StudentAcademicRef;
  source: AcademicEnrollment;
  attempt: AccelerationAttempt;
  existingNext?: AcademicEnrollment;
  actorId?: string;
}): PlannedAcademicTransition {
  const source = assertAuthoritativeCurrentEnrollment(input.student, input.source, {
    allowSupersededForReplay: Boolean(input.existingNext) || input.attempt.status === 'approved',
  });
  const attempt = input.attempt;
  if (attempt.studentId !== source.studentId || attempt.sourceEnrollmentId !== source.id) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID,
      'محاولة التسريع لا تطابق قيد المصدر أو الطالبة.'
    );
  }
  if (attempt.sourceGradeLevel !== source.gradeLevel) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID,
      'صف المصدر في محاولة التسريع لا يطابق القيد الحالي.'
    );
  }

  const consistentReplay =
    attempt.status === 'approved' &&
    Boolean(attempt.resultingEnrollmentId) &&
    input.existingNext?.id === attempt.resultingEnrollmentId &&
    source.nextEnrollmentId === attempt.resultingEnrollmentId &&
    input.student.currentEnrollmentId === attempt.resultingEnrollmentId;

  if (attempt.status === 'approved') {
    if (!consistentReplay) {
      throw new AcademicDomainError(
        ACADEMIC_ERROR.ACADEMIC_TRANSITION_CONFLICT,
        'إعادة تنفيذ تسريع معتمد غير متسقة مع السلسلة المحفوظة.'
      );
    }
  } else if (attempt.status !== 'eligible') {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID,
      'ترفيع التسريع يتطلب حالة eligible، أو approved لإعادة تنفيذ متسقة فقط.'
    );
  }

  if (attempt.finalResult !== 'passed' && attempt.status !== 'approved') {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID,
      'نتيجة passed وحدها لا تكفي لإنشاء ترفيع تسريع.'
    );
  }

  const nextYear = incrementAcademicYear(source.academicYear);
  if (!nextYear) {
    throw new AcademicDomainError(
      ACADEMIC_ERROR.ACADEMIC_YEAR_REQUIRED,
      'لا يمكن ترفيع التسريع بدون سنة دراسية موثّقة على القيد الحالي.'
    );
  }

  const nextEnrollment: AcademicEnrollment = {
    id:
      attempt.resultingEnrollmentId ||
      makeEnrollmentId(source.studentId, nextYear, attempt.resultingGradeLevel, 1, 'accelerated'),
    studentId: source.studentId,
    academicYear: nextYear,
    gradeLevel: attempt.resultingGradeLevel,
    attemptNumber: 1,
    enrollmentType: 'accelerated',
    status: 'active',
    finalResult: 'pending',
    transitionType: 'none',
    previousEnrollmentId: source.id,
    accelerationAttemptId: attempt.id,
    isDerived: false,
    provenance: 'authoritative',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (!consistentReplay) {
    detectExistingTransition(source, nextEnrollment, input.existingNext, input.student);
  }

  const sourceUpdate: AcademicEnrollment = {
    ...source,
    status: 'superseded',
    transitionType: 'acceleration_promotion',
    nextEnrollmentId: nextEnrollment.id,
    accelerationAttemptId: attempt.id,
    updatedAt: nowIso(),
  };

  return {
    kind: 'acceleration_promotion',
    replay: Boolean(consistentReplay),
    sourceUpdate,
    nextEnrollment,
    studentPatch: {
      currentEnrollmentId: nextEnrollment.id,
      gradeLevel: attempt.resultingGradeLevel,
      enrollmentYear: nextYear,
    },
    audit: makeAudit(
      source.studentId,
      source.id,
      nextEnrollment.id,
      'acceleration_promotion',
      `acceleration:${attempt.id}`,
      input.actorId
    ),
  };
}
