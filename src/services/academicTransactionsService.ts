import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ACADEMIC_ENROLLMENTS_COLLECTION,
  ACADEMIC_ERROR,
  ACADEMIC_TRANSITION_AUDITS_COLLECTION,
  ACCELERATION_ATTEMPTS_COLLECTION,
  AcademicDomainError,
  type AccelerationAttempt,
  type AcademicEnrollment,
  type StudentAcademicRef,
} from '../types/academicHistory';
import {
  planAccelerationPromotionTransition,
  planRegularPromotionTransition,
  planRepeatYearTransition,
} from './academicHistoryService';

const STUDENTS_COLLECTION = 'students';

const safeDocId = (id: string): string => encodeURIComponent(id).replace(/%/g, '_');

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) next[key] = item;
  }
  return next as T;
}

export interface AcademicTransitionResult {
  success: boolean;
  replay?: boolean;
  code?: string;
  message?: string;
  nextEnrollmentId?: string;
}

function toResult(error: unknown): AcademicTransitionResult {
  if (error instanceof AcademicDomainError) {
    return { success: false, code: error.code, message: error.message };
  }
  const err = error as { code?: string; message?: string };
  return {
    success: false,
    code: err?.code,
    message: err?.message || 'فشل تنفيذ الانتقال الأكاديمي',
  };
}

function studentFromDoc(id: string, data: Record<string, unknown> | undefined): StudentAcademicRef {
  return {
    id,
    gradeLevel: data?.gradeLevel as StudentAcademicRef['gradeLevel'],
    enrollmentYear: typeof data?.enrollmentYear === 'string' ? data.enrollmentYear : '',
    currentEnrollmentId: typeof data?.currentEnrollmentId === 'string' ? data.currentEnrollmentId : undefined,
  };
}

/**
 * Authoritative write path. UI must call AppContext wrappers, not this module directly,
 * after AppContext is wired in a later patch.
 */
export async function executeStudentRepeatYear(input: {
  studentId: string;
  actorId?: string;
}): Promise<AcademicTransitionResult> {
  try {
    const result = await runTransaction(db, async (tx) => {
      const studentRef = doc(db, STUDENTS_COLLECTION, safeDocId(input.studentId));
      const studentSnap = await tx.get(studentRef);
      if (!studentSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'سجل الطالبة غير موجود.');
      }
      const student = studentFromDoc(input.studentId, studentSnap.data() as Record<string, unknown>);
      if (!student.currentEnrollmentId) {
        throw new AcademicDomainError(
          ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
          'لا يوجد قيد حالي موثّق للطالبة.'
        );
      }
      const sourceRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(student.currentEnrollmentId));
      const sourceSnap = await tx.get(sourceRef);
      if (!sourceSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'القيد الحالي غير موجود في Firestore.');
      }
      const source = sourceSnap.data() as AcademicEnrollment;
      const planned = planRepeatYearTransition({ student, source, actorId: input.actorId });
      const nextRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(planned.nextEnrollment.id));
      const nextSnap = await tx.get(nextRef);
      const existingNext = nextSnap.exists() ? (nextSnap.data() as AcademicEnrollment) : undefined;
      const confirmed = planRepeatYearTransition({
        student,
        source,
        existingNext,
        actorId: input.actorId,
      });
      tx.set(sourceRef, omitUndefined(confirmed.sourceUpdate as unknown as Record<string, unknown>));
      tx.set(nextRef, omitUndefined(confirmed.nextEnrollment as unknown as Record<string, unknown>));
      tx.set(studentRef, omitUndefined(confirmed.studentPatch as unknown as Record<string, unknown>), { merge: true });
      tx.set(
        doc(db, ACADEMIC_TRANSITION_AUDITS_COLLECTION, safeDocId(confirmed.audit.id)),
        omitUndefined(confirmed.audit as unknown as Record<string, unknown>)
      );
      return confirmed;
    });
    return {
      success: true,
      replay: result.replay,
      nextEnrollmentId: result.nextEnrollment.id,
    };
  } catch (error) {
    return toResult(error);
  }
}

export async function executeStudentRegularPromotion(input: {
  studentId: string;
  actorId?: string;
  isSecondRound?: boolean;
}): Promise<AcademicTransitionResult> {
  try {
    const result = await runTransaction(db, async (tx) => {
      const studentRef = doc(db, STUDENTS_COLLECTION, safeDocId(input.studentId));
      const studentSnap = await tx.get(studentRef);
      if (!studentSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'سجل الطالبة غير موجود.');
      }
      const student = studentFromDoc(input.studentId, studentSnap.data() as Record<string, unknown>);
      if (!student.currentEnrollmentId) {
        throw new AcademicDomainError(
          ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
          'لا يوجد قيد حالي موثّق للطالبة.'
        );
      }
      const sourceRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(student.currentEnrollmentId));
      const sourceSnap = await tx.get(sourceRef);
      if (!sourceSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'القيد الحالي غير موجود في Firestore.');
      }
      const source = sourceSnap.data() as AcademicEnrollment;
      const persistedFinalResult = source.finalResult;
      const planned = planRegularPromotionTransition({
        student,
        source,
        persistedFinalResult,
        callerIsSecondRound: input.isSecondRound,
        actorId: input.actorId,
      });
      const nextRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(planned.nextEnrollment.id));
      const nextSnap = await tx.get(nextRef);
      const existingNext = nextSnap.exists() ? (nextSnap.data() as AcademicEnrollment) : undefined;
      const confirmed = planRegularPromotionTransition({
        student,
        source,
        persistedFinalResult,
        callerIsSecondRound: input.isSecondRound,
        existingNext,
        actorId: input.actorId,
      });
      tx.set(sourceRef, omitUndefined(confirmed.sourceUpdate as unknown as Record<string, unknown>));
      tx.set(nextRef, omitUndefined(confirmed.nextEnrollment as unknown as Record<string, unknown>));
      tx.set(studentRef, omitUndefined(confirmed.studentPatch as unknown as Record<string, unknown>), { merge: true });
      tx.set(
        doc(db, ACADEMIC_TRANSITION_AUDITS_COLLECTION, safeDocId(confirmed.audit.id)),
        omitUndefined(confirmed.audit as unknown as Record<string, unknown>)
      );
      return confirmed;
    });
    return {
      success: true,
      replay: result.replay,
      nextEnrollmentId: result.nextEnrollment.id,
    };
  } catch (error) {
    return toResult(error);
  }
}

export async function executeAccelerationPromotionTransitionTx(input: {
  studentId: string;
  attemptId: string;
  actorId?: string;
}): Promise<AcademicTransitionResult> {
  try {
    const result = await runTransaction(db, async (tx) => {
      const studentRef = doc(db, STUDENTS_COLLECTION, safeDocId(input.studentId));
      const attemptRef = doc(db, ACCELERATION_ATTEMPTS_COLLECTION, safeDocId(input.attemptId));
      const studentSnap = await tx.get(studentRef);
      const attemptSnap = await tx.get(attemptRef);
      if (!studentSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'سجل الطالبة غير موجود.');
      }
      if (!attemptSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID, 'محاولة التسريع غير موجودة.');
      }
      const student = studentFromDoc(input.studentId, studentSnap.data() as Record<string, unknown>);
      const attempt = attemptSnap.data() as AccelerationAttempt;
      if (attempt.studentId !== input.studentId) {
        throw new AcademicDomainError(
          ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID,
          'محاولة التسريع لا تعود لهذه الطالبة.'
        );
      }
      if (!student.currentEnrollmentId) {
        throw new AcademicDomainError(
          ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED,
          'لا يوجد قيد حالي موثّق للطالبة.'
        );
      }
      const sourceRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(student.currentEnrollmentId));
      const sourceSnap = await tx.get(sourceRef);
      if (!sourceSnap.exists()) {
        throw new AcademicDomainError(ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED, 'القيد الحالي غير موجود في Firestore.');
      }
      const source = sourceSnap.data() as AcademicEnrollment;
      const planned = planAccelerationPromotionTransition({ student, source, attempt, actorId: input.actorId });
      const nextRef = doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(planned.nextEnrollment.id));
      const nextSnap = await tx.get(nextRef);
      const existingNext = nextSnap.exists() ? (nextSnap.data() as AcademicEnrollment) : undefined;
      const confirmed = planAccelerationPromotionTransition({
        student,
        source,
        attempt,
        existingNext,
        actorId: input.actorId,
      });
      tx.set(sourceRef, omitUndefined(confirmed.sourceUpdate as unknown as Record<string, unknown>));
      tx.set(nextRef, omitUndefined(confirmed.nextEnrollment as unknown as Record<string, unknown>));
      tx.set(studentRef, omitUndefined(confirmed.studentPatch as unknown as Record<string, unknown>), { merge: true });
      tx.set(
        attemptRef,
        omitUndefined({
          ...attempt,
          status: 'approved',
          finalResult: 'passed',
          resultingEnrollmentId: confirmed.nextEnrollment.id,
          updatedAt: new Date().toISOString(),
        } as unknown as Record<string, unknown>)
      );
      tx.set(
        doc(db, ACADEMIC_TRANSITION_AUDITS_COLLECTION, safeDocId(confirmed.audit.id)),
        omitUndefined(confirmed.audit as unknown as Record<string, unknown>)
      );
      return confirmed;
    });
    return {
      success: true,
      replay: result.replay,
      nextEnrollmentId: result.nextEnrollment.id,
    };
  } catch (error) {
    return toResult(error);
  }
}

export const executeStudentAccelerationPromotion = executeAccelerationPromotionTransitionTx;

export async function readEnrollmentDocument(id: string): Promise<AcademicEnrollment | null> {
  const snap = await getDoc(doc(db, ACADEMIC_ENROLLMENTS_COLLECTION, safeDocId(id)));
  return snap.exists() ? (snap.data() as AcademicEnrollment) : null;
}
