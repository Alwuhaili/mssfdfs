import type { GradeLevel, Parent, Student, TimetableSlot } from '../types';
import { canPersistTimetableWrites } from './timetableSettings';

export interface ParentLinkedStudent {
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  section?: string;
  gpa?: number;
  status?: Student['status'];
  badges?: string[];
  shieldsAndBadges?: Student['shieldsAndBadges'];
  /** True only when the local students list contained this exact id. */
  fromAuthoritativeStudentRecord: boolean;
}

export function resolveActiveParentRecord(
  currentUser:
    | {
        id?: string;
        profileId?: string;
        authUid?: string;
        parentObj?: Parent;
      }
    | null
    | undefined,
  parents: Parent[] = []
): Parent | null {
  if (!currentUser) return null;
  const matched = parents.find(
    (parent) =>
      (currentUser.profileId && parent.id === currentUser.profileId) ||
      (currentUser.id && parent.id === currentUser.id) ||
      (currentUser.authUid && parent.authUid === currentUser.authUid)
  );
  if (matched) return matched;
  return currentUser.parentObj || null;
}

export function resolveLinkedStudentForParent(
  parent: Parent | null | undefined,
  students: Student[] = []
): ParentLinkedStudent | null {
  const studentId = typeof parent?.studentId === 'string' ? parent.studentId.trim() : '';
  if (!parent || !studentId) return null;

  const fromList = students.find((student) => student.id === studentId);
  if (fromList) {
    const parentId = typeof parent.id === 'string' ? parent.id.trim() : '';
    const recordParentId = typeof fromList.parentId === 'string' ? fromList.parentId.trim() : '';
    if (parentId && recordParentId && recordParentId !== parentId) {
      return projectionFromParentDocument(parent, studentId);
    }
    return {
      studentId,
      studentName: fromList.name,
      gradeLevel: fromList.gradeLevel,
      section: fromList.section,
      gpa: fromList.gpa,
      status: fromList.status,
      badges: fromList.badges,
      shieldsAndBadges: fromList.shieldsAndBadges,
      fromAuthoritativeStudentRecord: true,
    };
  }

  return projectionFromParentDocument(parent, studentId);
}

function projectionFromParentDocument(parent: Parent, studentId: string): ParentLinkedStudent {
  const studentName = typeof parent.studentName === 'string' ? parent.studentName.trim() : '';
  const section =
    typeof parent.studentSection === 'string' && parent.studentSection.trim()
      ? parent.studentSection.trim()
      : undefined;
  return {
    studentId,
    studentName,
    gradeLevel: parent.gradeLevel,
    section,
    fromAuthoritativeStudentRecord: false,
  };
}

export function slotBelongsToLinkedClass(
  slot: TimetableSlot,
  linked: Pick<ParentLinkedStudent, 'gradeLevel' | 'section'> | null | undefined
): boolean {
  if (!linked?.gradeLevel || !linked.section) return false;
  if (slot.gradeLevel !== linked.gradeLevel) return false;
  const slotSection = typeof slot.section === 'string' ? slot.section.trim() : '';
  // Never infer missing timetable section as "أ".
  if (!slotSection) return false;
  // TimetableSlot has no documented shared-class meaning for "الكل"
  // (that token is used on exams/attendance reports). Do not treat it as شعبة أ or as a match.
  if (slotSection === 'الكل') return false;
  return slotSection === linked.section;
}

export function filterTimetableForLinkedStudent(
  timetable: TimetableSlot[] = [],
  linked: Pick<ParentLinkedStudent, 'gradeLevel' | 'section'> | null | undefined
): TimetableSlot[] {
  if (!linked?.gradeLevel || !linked.section) return [];
  return timetable.filter((slot) => slotBelongsToLinkedClass(slot, linked));
}

export function canViewSchoolTimetable(role?: string | null): boolean {
  return (
    role === 'admin' ||
    role === 'teacher' ||
    role === 'student' ||
    role === 'parent' ||
    role === 'principal' ||
    role === 'school_admin' ||
    role === 'supervisor'
  );
}

export type ParentSelfHealSkipCode =
  | 'UNLINKED'
  | 'MISSING_STUDENT'
  | 'CONFLICT'
  | 'AMBIGUOUS'
  | 'STUDENT_PARENT_ID_MISSING'
  | 'INVALID_STUDENT_SECTION'
  | 'UNCHANGED';

export interface ParentSelfHealUpdate {
  parentId: string;
  studentId: string;
  patch: {
    studentName?: string;
    gradeLevel?: GradeLevel;
    studentSection?: string;
  };
  reasons: string[];
}

export interface ParentSelfHealSkip {
  parentId: string;
  studentId?: string;
  code: ParentSelfHealSkipCode;
  reasons: string[];
}

export interface ParentSelfHealPlan {
  updates: ParentSelfHealUpdate[];
  unchanged: ParentSelfHealSkip[];
  conflicts: ParentSelfHealSkip[];
  unlinked: ParentSelfHealSkip[];
  missingStudents: ParentSelfHealSkip[];
  ambiguous: ParentSelfHealSkip[];
}

/**
 * Student.section is usable as Parent.studentSection only when it is a real class
 * section. Empty values and exam/report token "الكل" are never guessed as "أ".
 */
export function isUsableStudentSection(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== 'الكل';
}

export function parentStudentSelfHealUpdatesSignature(plan: Pick<ParentSelfHealPlan, 'updates'>): string {
  return JSON.stringify(
    plan.updates.map((item) => ({
      parentId: item.parentId,
      studentId: item.studentId,
      patch: item.patch,
    }))
  );
}

export interface ParentSelfHealGuardState {
  lastCommittedSignature: string;
  lastFailedSignature: string;
  lastFailedAtGeneration: number;
}

export type ParentSelfHealRunDecision =
  | { action: 'commit-empty'; reason: 'empty-plan'; signature: string }
  | { action: 'skip'; reason: 'in-flight' | 'already-committed' | 'awaiting-new-generation-after-failure' }
  | { action: 'attempt'; reason: 'ready'; signature: string };

export const EMPTY_PARENT_SELF_HEAL_GUARD: ParentSelfHealGuardState = {
  lastCommittedSignature: '',
  lastFailedSignature: '',
  lastFailedAtGeneration: -1,
};

/** Own pending-settle bumps generation by 1; block that one run so persist failure cannot spin. */
export function parentSelfHealBlockedGenerationAfterFailure(currentGeneration: number): number {
  return currentGeneration + 1;
}

export function decideParentStudentSelfHealRun(input: {
  updatesCount: number;
  signature: string;
  inFlight: boolean;
  guard: ParentSelfHealGuardState;
  currentGeneration: number;
}): ParentSelfHealRunDecision {
  if (input.updatesCount === 0) {
    return { action: 'commit-empty', reason: 'empty-plan', signature: input.signature };
  }
  if (input.inFlight) {
    return { action: 'skip', reason: 'in-flight' };
  }
  if (input.signature === input.guard.lastCommittedSignature) {
    return { action: 'skip', reason: 'already-committed' };
  }
  // Any failed attempt blocks every follow-up attempt (including a smaller
  // partial-success signature) until a later independent generation.
  if (
    input.guard.lastFailedAtGeneration >= 0 &&
    input.currentGeneration <= input.guard.lastFailedAtGeneration
  ) {
    return { action: 'skip', reason: 'awaiting-new-generation-after-failure' };
  }
  return { action: 'attempt', reason: 'ready', signature: input.signature };
}

export function nextParentStudentSelfHealGuard(
  guard: ParentSelfHealGuardState,
  event:
    | { type: 'empty-plan'; signature: string }
    | { type: 'attempt-success'; signature: string }
    | { type: 'attempt-failure'; signature: string; currentGeneration: number }
): ParentSelfHealGuardState {
  if (event.type === 'empty-plan') {
    return {
      ...guard,
      lastCommittedSignature: event.signature,
    };
  }
  if (event.type === 'attempt-success') {
    return {
      lastCommittedSignature: event.signature,
      lastFailedSignature: '',
      lastFailedAtGeneration: -1,
    };
  }
  return {
    ...guard,
    lastFailedSignature: event.signature,
    lastFailedAtGeneration: parentSelfHealBlockedGenerationAfterFailure(event.currentGeneration),
  };
}

export function canRunParentStudentSelfHeal(input: {
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeParents: boolean;
  authoritativeStudents: boolean;
  pendingParents: boolean;
  pendingStudents: boolean;
}): boolean {
  if (!canPersistTimetableWrites(input.role, input.currentUserRole)) return false;
  if (!input.hydrated) return false;
  if (!input.authoritativeParents || !input.authoritativeStudents) return false;
  if (input.pendingParents || input.pendingStudents) return false;
  return true;
}

function trimId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sameProjectionText(current: unknown, next: string): boolean {
  return typeof current === 'string' && current.trim() === next.trim();
}

/**
 * Pure planner. Identity is IDs only:
 * parent.studentId === student.id AND student.parentId === parent.id.
 * Empty Student.parentId is fail-closed (not a proven reverse link).
 * Name / email / phone / grade / section never create a link.
 */
export function planParentStudentSelfHeal(
  parents: Parent[] = [],
  students: Student[] = []
): ParentSelfHealPlan {
  const plan: ParentSelfHealPlan = {
    updates: [],
    unchanged: [],
    conflicts: [],
    unlinked: [],
    missingStudents: [],
    ambiguous: [],
  };

  const studentsById = new Map<string, Student>();
  for (const student of students) {
    const id = trimId(student?.id);
    if (id) studentsById.set(id, student);
  }

  const parentsByStudentId = new Map<string, string[]>();
  for (const parent of parents) {
    const studentId = trimId(parent?.studentId);
    if (!studentId) continue;
    const list = parentsByStudentId.get(studentId) || [];
    list.push(trimId(parent.id));
    parentsByStudentId.set(studentId, list);
  }

  const ambiguousStudentIds = new Set<string>();
  for (const [studentId, parentIds] of parentsByStudentId) {
    const unique = new Set(parentIds.filter(Boolean));
    if (unique.size > 1) ambiguousStudentIds.add(studentId);
  }

  for (const parent of parents) {
    const parentId = trimId(parent?.id);
    const studentId = trimId(parent?.studentId);
    if (!parentId) continue;

    if (!studentId) {
      plan.unlinked.push({
        parentId,
        code: 'UNLINKED',
        reasons: ['parent.studentId is missing; refusing name/email/phone/grade guess'],
      });
      continue;
    }

    if (ambiguousStudentIds.has(studentId)) {
      plan.ambiguous.push({
        parentId,
        studentId,
        code: 'AMBIGUOUS',
        reasons: ['more than one Parent.studentId points at the same Student'],
      });
      continue;
    }

    const student = studentsById.get(studentId);
    if (!student) {
      plan.missingStudents.push({
        parentId,
        studentId,
        code: 'MISSING_STUDENT',
        reasons: ['Parent.studentId does not match any Student.id'],
      });
      continue;
    }

    const studentParentId = trimId(student.parentId);
    if (!studentParentId) {
      plan.conflicts.push({
        parentId,
        studentId,
        code: 'STUDENT_PARENT_ID_MISSING',
        reasons: [
          'Student.parentId is empty; fail-closed because reverse ID link is unproven',
        ],
      });
      continue;
    }

    if (studentParentId !== parentId) {
      plan.conflicts.push({
        parentId,
        studentId,
        code: 'CONFLICT',
        reasons: ['Student.parentId exists and differs from Parent.id'],
      });
      continue;
    }

    const patch: ParentSelfHealUpdate['patch'] = {};
    const reasons: string[] = [];
    const studentName = typeof student.name === 'string' ? student.name.trim() : '';
    if (studentName && !sameProjectionText(parent.studentName, studentName)) {
      patch.studentName = studentName;
      reasons.push('stale_student_name');
    }
    if (student.gradeLevel && parent.gradeLevel !== student.gradeLevel) {
      patch.gradeLevel = student.gradeLevel;
      reasons.push('stale_grade_level');
    }

    if (!isUsableStudentSection(student.section)) {
      if (Object.keys(patch).length === 0) {
        plan.unchanged.push({
          parentId,
          studentId,
          code: 'INVALID_STUDENT_SECTION',
          reasons: ['Student.section is empty or الكل; refusing to guess studentSection'],
        });
        continue;
      }
      reasons.push('invalid_student_section_skipped');
    } else if (!sameProjectionText(parent.studentSection, student.section.trim())) {
      patch.studentSection = student.section.trim();
      reasons.push('missing_or_stale_student_section');
    }

    if (Object.keys(patch).length === 0) {
      plan.unchanged.push({
        parentId,
        studentId,
        code: 'UNCHANGED',
        reasons: ['projection already matches linked Student'],
      });
      continue;
    }

    plan.updates.push({ parentId, studentId, patch, reasons });
  }

  return plan;
}

export function applyParentProjectionPatches(
  parents: Parent[],
  plan: ParentSelfHealPlan
): Parent[] {
  if (plan.updates.length === 0) return parents;
  const byParentId = new Map(plan.updates.map((item) => [item.parentId, item.patch]));
  return parents.map((parent) => {
    const patch = byParentId.get(parent.id);
    return patch ? { ...parent, ...patch } : parent;
  });
}
