import type { CurrentUser, GradeLevel, Parent, Student, StudentCertificate, Teacher, UserRole } from '../types';
import { normalizeAcademicYear } from '../types/academicHistory';
import { resolveActiveParentRecord, resolveLinkedStudentForParent } from './parentStudentLink';

function trimId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function filterCertificatesByStudentId(
  certificates: StudentCertificate[] | null | undefined,
  studentId: string | null | undefined
): StudentCertificate[] {
  const id = trimId(studentId);
  if (!id) return [];
  return (certificates || []).filter((certificate) => trimId(certificate?.studentId) === id);
}

export function selectCanonicalCertificate(
  certificates: StudentCertificate[] | null | undefined,
  query: {
    studentId?: string | null;
    academicYear?: string | null;
    certificateId?: string | null;
  }
): StudentCertificate | null {
  const studentId = trimId(query.studentId);
  if (!studentId) return null;

  let matches = filterCertificatesByStudentId(certificates, studentId);

  const certificateId = trimId(query.certificateId);
  if (certificateId) {
    const byId = matches.filter((certificate) => trimId(certificate.id) === certificateId);
    if (byId.length !== 1) return null;
    return byId[0];
  }

  const year = normalizeAcademicYear(query.academicYear);
  if (year) {
    matches = matches.filter((certificate) => normalizeAcademicYear(certificate.academicYear) === year);
  }

  if (matches.length !== 1) return null;
  return matches[0];
}

export function uniqueCertificateAcademicYears(certificates: StudentCertificate[]): string[] {
  const years = new Set<string>();
  for (const certificate of certificates || []) {
    const year = normalizeAcademicYear(certificate.academicYear);
    if (year) years.add(year);
  }
  return [...years].sort();
}

export function resolveStudentViewerStudentId(
  currentUser: CurrentUser | null | undefined,
  students: Student[] = []
): string | null {
  if (!currentUser) return null;
  const candidates = [currentUser.profileId, currentUser.id, currentUser.studentObj?.id]
    .map(trimId)
    .filter(Boolean);
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (students.some((student) => trimId(student.id) === candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveParentViewerStudentId(
  currentUser: CurrentUser | null | undefined,
  parents: Parent[] = [],
  students: Student[] = []
): string | null {
  const parent = resolveActiveParentRecord(currentUser, parents);
  const linked = resolveLinkedStudentForParent(parent, students);
  const studentId = trimId(linked?.studentId);
  return studentId || null;
}

export function resolveTeacherCertificateScope(
  currentUser: CurrentUser | null | undefined,
  teachers: Teacher[] = []
): { teacher: Teacher | null; assignedGrades: GradeLevel[] } {
  if (!currentUser) return { teacher: null, assignedGrades: [] };
  const matched =
    teachers.find(
      (teacher) =>
        (currentUser.profileId && teacher.id === currentUser.profileId) ||
        (currentUser.id && teacher.id === currentUser.id) ||
        (currentUser.authUid && teacher.authUid === currentUser.authUid) ||
        (currentUser.teacherObj?.id && teacher.id === currentUser.teacherObj.id)
    ) || null;
  const teacher = matched || (currentUser.teacherObj?.id ? currentUser.teacherObj : null);
  const assignedGrades = Array.isArray(teacher?.assignedGrades) ? teacher.assignedGrades : [];
  return { teacher, assignedGrades };
}

export function listPersistedCertificatesForRole(input: {
  role: UserRole | string | null | undefined;
  certificates: StudentCertificate[] | null | undefined;
  students?: Student[];
  parents?: Parent[];
  teachers?: Teacher[];
  currentUser?: CurrentUser | null;
  academicYear?: string | null;
  viewerStudentId?: string | null;
}): StudentCertificate[] {
  const role = input.role || '';
  const certificates = input.certificates || [];
  let scoped: StudentCertificate[] = [];

  if (role === 'student') {
    const studentId =
      trimId(input.viewerStudentId) ||
      resolveStudentViewerStudentId(input.currentUser, input.students || []);
    scoped = filterCertificatesByStudentId(certificates, studentId);
  } else if (role === 'parent') {
    const studentId =
      trimId(input.viewerStudentId) ||
      resolveParentViewerStudentId(input.currentUser, input.parents || [], input.students || []);
    scoped = filterCertificatesByStudentId(certificates, studentId);
  } else if (role === 'teacher') {
    const { assignedGrades } = resolveTeacherCertificateScope(input.currentUser, input.teachers || []);
    if (assignedGrades.length === 0) {
      scoped = [];
    } else {
      scoped = certificates.filter((certificate) => assignedGrades.includes(certificate.gradeLevel));
    }
  } else if (role === 'admin' || role === 'supervisor') {
    scoped = [...certificates];
  }

  const year = normalizeAcademicYear(input.academicYear);
  if (year) {
    scoped = scoped.filter((certificate) => normalizeAcademicYear(certificate.academicYear) === year);
  }

  return scoped;
}

export function pickSelectedPersistedCertificate(
  scopedCertificates: StudentCertificate[],
  selectedCertId: string | null | undefined
): StudentCertificate | null {
  const id = trimId(selectedCertId);
  if (id) {
    return scopedCertificates.find((certificate) => trimId(certificate.id) === id) || null;
  }
  if (scopedCertificates.length === 1) return scopedCertificates[0];
  return null;
}
