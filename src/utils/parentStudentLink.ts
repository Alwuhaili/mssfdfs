import type { GradeLevel, Parent, Student, TimetableSlot } from '../types';

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
