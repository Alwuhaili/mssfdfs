// HOMEPAGE_FACULTY_HONOR_PUBLIC_V1
// Sanitized faculty + 2025-2026 honor-board projections for publicContent/homepage.

export const HONOR_ACADEMIC_YEAR = '2025-2026';

export const HONOR_BOARD_GRADES = [
  'الصف الأول المتوسط',
  'الصف الثاني المتوسط',
  'الصف الثالث المتوسط',
  'الصف الرابع العلمي',
  'الصف الخامس العلمي',
  'الصف السادس العلمي',
] as const;

export const LAST_YEAR_TO_CURRENT_GRADE: Record<string, string> = {
  'الصف الأول المتوسط': 'الصف الثاني المتوسط',
  'الصف الثاني المتوسط': 'الصف الثالث المتوسط',
  'الصف الثالث المتوسط': 'الصف الرابع العلمي',
  'الصف الرابع العلمي': 'الصف الخامس العلمي',
  'الصف الخامس العلمي': 'الصف السادس العلمي',
};

export type PublicFacultyItem = {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  facultyRoleTitle: string;
  facultyDegree: string;
  researchCount: number;
  booksCount: number;
  gamesCount: number;
  facultyAchievements: string[];
};

export type PublicHonorEntry = {
  sourceId: string;
  sourceType: 'student' | 'graduate';
  academicYear: string;
  grade: string;
  rank: 1 | 2 | 3;
  name: string;
  avatar: string;
  section: string;
  gpa: number;
  specialty: string;
  dream: string;
};

import { sanitizePublicHttpsImageUrl } from './publicHomepageImageUrl';

const asTrimmedString = (value: unknown, max = 20000): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const asCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const asStringArray = (value: unknown, maxItems = 20): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asTrimmedString(item, 400))
    .filter(Boolean)
    .slice(0, maxItems);
};

const stableJson = (value: unknown): string => JSON.stringify(value);

export function sanitizePublicFacultyItem(teacher: any): PublicFacultyItem | null {
  if (!teacher || typeof teacher !== 'object') return null;
  const id = asTrimmedString(teacher.id, 80);
  const name = asTrimmedString(teacher.name, 120);
  if (!id || !name) return null;
  return {
    id,
    name,
    subject: asTrimmedString(teacher.subject, 160),
    avatar: sanitizePublicHttpsImageUrl(teacher.avatar),
    facultyRoleTitle: asTrimmedString(
      teacher.facultyRoleTitle || teacher.roleTitle || teacher.title || 'عضو الهيئة التدريسية',
      160
    ),
    facultyDegree: asTrimmedString(teacher.facultyDegree || teacher.degree || teacher.qualification, 160),
    researchCount: asCount(teacher.researchCount ?? teacher.facultyResearchCount),
    booksCount: asCount(teacher.booksCount ?? teacher.facultyBooksCount),
    gamesCount: asCount(teacher.gamesCount ?? teacher.facultyGamesCount),
    facultyAchievements: asStringArray(teacher.facultyAchievements || teacher.achievements),
  };
}

export function sanitizePublicFacultyList(teachers: unknown): PublicFacultyItem[] {
  if (!Array.isArray(teachers)) return [];
  return teachers.map(sanitizePublicFacultyItem).filter((item): item is PublicFacultyItem => Boolean(item)).slice(0, 80);
}

export function facultyProjectionEquals(left: unknown, right: unknown): boolean {
  return stableJson(sanitizePublicFacultyList(left)) === stableJson(sanitizePublicFacultyList(right));
}

export function looksLikeInitialTeachers(teachers: unknown, initialTeachers: unknown): boolean {
  return facultyProjectionEquals(teachers, initialTeachers);
}

export function lastYearHonorGpa(record: any): number | null {
  if (record?.honorGpa2025_2026 != null && record.honorGpa2025_2026 !== '') {
    const n = Number(record.honorGpa2025_2026);
    return Number.isFinite(n) ? n : null;
  }
  if (record?.previousAcademicYearGpa != null && record.previousAcademicYearGpa !== '') {
    const n = Number(record.previousAcademicYearGpa);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function graduateHonorGpa(record: any): number | null {
  if (record?.honorGpa2025_2026 != null && record.honorGpa2025_2026 !== '') {
    const n = Number(record.honorGpa2025_2026);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(record?.gpa);
  return Number.isFinite(n) ? n : null;
}

export function isEnrollmentEligibleForHonor2025(student: any): boolean {
  const year = Number.parseInt(String(student?.enrollmentYear ?? ''), 10);
  return Number.isFinite(year) && year <= 2025;
}

export function isFromHonorAcademicYear(year: unknown): boolean {
  const normalized = String(year ?? '').replace(/[^0-9]/g, '');
  return normalized.includes('2025') && normalized.includes('2026');
}

export function sanitizePublicHonorEntry(item: any): PublicHonorEntry | null {
  if (!item || typeof item !== 'object') return null;
  const sourceId = asTrimmedString(item.sourceId || item.studentId || item.graduateId, 80);
  const sourceType = item.sourceType === 'graduate' ? 'graduate' : item.sourceType === 'student' ? 'student' : null;
  const grade = asTrimmedString(item.grade, 80);
  const rank = Number(item.rank);
  const name = asTrimmedString(item.name, 120);
  const gpa = Number(item.gpa);
  if (!sourceId || !sourceType || !grade || !name) return null;
  if (rank !== 1 && rank !== 2 && rank !== 3) return null;
  if (!Number.isFinite(gpa)) return null;
  return {
    sourceId,
    sourceType,
    academicYear: asTrimmedString(item.academicYear, 20) || HONOR_ACADEMIC_YEAR,
    grade,
    rank: rank as 1 | 2 | 3,
    name,
    avatar: sanitizePublicHttpsImageUrl(item.avatar),
    section: asTrimmedString(item.section, 20),
    gpa,
    specialty: asTrimmedString(item.specialty, 200),
    dream: asTrimmedString(item.dream, 200),
  };
}

export function sanitizePublicHonorBoard(list: unknown): PublicHonorEntry[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizePublicHonorEntry).filter((item): item is PublicHonorEntry => Boolean(item)).slice(0, 24);
}

export function honorBoardEquals(left: unknown, right: unknown): boolean {
  return stableJson(sanitizePublicHonorBoard(left)) === stableJson(sanitizePublicHonorBoard(right));
}

export const HONOR_ROLL_DEMO_NAMES = [
  'مريم محمد الساعدي',
  'زينب أحمد الكعبي',
  'زهراء حيدر البهادلي',
  'آية مرتضى الموسوي',
  'فاطمة جاسم العبيدي',
  'رقية عمار الزبيدي',
  'هدى صادق التميمي',
  'نور الهدى كريم المحمداوي',
  'بنين علي الخزعلي',
  'زهراء خالد العلي',
  'طيبة فاضل السعدون',
  'شهد ثامر السوداني',
  'زينب سعد المحمداوي',
  'مريم حيدر الخزرجي',
  'دعاء حسين البهادلي',
  'نغم علي الكعبي',
  'فاطمة الزهراء عادل',
  'روان عمار الساعدي',
];

export function looksLikeHonorRollDemo(list: unknown, demo: unknown): boolean {
  const demoNames = Array.isArray(demo)
    ? demo
        .map((item: any) => asTrimmedString(typeof item === 'string' ? item : item?.name, 120))
        .filter(Boolean)
        .sort()
    : [];
  if (demoNames.length === 0) return false;
  const publishedNames = sanitizePublicHonorBoard(list).map((item) => item.name).sort();
  return stableJson(publishedNames) === stableJson(demoNames);
}

export function buildPublicHonorBoard(students: unknown, graduates: unknown): PublicHonorEntry[] {
  const studentList = Array.isArray(students) ? students : [];
  const graduateList = Array.isArray(graduates) ? graduates : [];
  const entries: PublicHonorEntry[] = [];

  for (const historicalGrade of HONOR_BOARD_GRADES) {
    if (historicalGrade === 'الصف السادس العلمي') {
      const top = graduateList
        .filter((graduate: any) => isFromHonorAcademicYear(graduate?.graduationYear))
        .map((graduate: any) => ({ graduate, gpa: graduateHonorGpa(graduate) }))
        .filter((row) => row.gpa != null)
        .sort((a, b) => {
          const gpaDiff = (b.gpa as number) - (a.gpa as number);
          if (gpaDiff !== 0) return gpaDiff;
          return String(a.graduate?.name || '').localeCompare(String(b.graduate?.name || ''), 'ar');
        })
        .slice(0, 3);

      top.forEach((row, index) => {
        const entry = sanitizePublicHonorEntry({
          sourceId: row.graduate.id,
          sourceType: 'graduate',
          academicYear: HONOR_ACADEMIC_YEAR,
          grade: historicalGrade,
          rank: index + 1,
          name: row.graduate.name,
          avatar: row.graduate.avatar,
          section: row.graduate.honorSection2025_2026,
          gpa: row.gpa,
          specialty: row.graduate.honorSpecialty,
          dream: row.graduate.honorDream,
        });
        if (entry) entries.push(entry);
      });
      continue;
    }

    const currentGrade = LAST_YEAR_TO_CURRENT_GRADE[historicalGrade];
    if (!currentGrade) continue;

    const top = studentList
      .filter((student: any) => student?.gradeLevel === currentGrade)
      .filter((student: any) => isEnrollmentEligibleForHonor2025(student))
      .filter((student: any) => !['محظورة', 'منقولة'].includes(String(student?.status || '')))
      .map((student: any) => ({ student, gpa: lastYearHonorGpa(student) }))
      .filter((row) => row.gpa != null)
      .sort((a, b) => {
        const gpaDiff = (b.gpa as number) - (a.gpa as number);
        if (gpaDiff !== 0) return gpaDiff;
        return String(a.student?.name || '').localeCompare(String(b.student?.name || ''), 'ar');
      })
      .slice(0, 3);

    top.forEach((row, index) => {
      const entry = sanitizePublicHonorEntry({
        sourceId: row.student.id,
        sourceType: 'student',
        academicYear: HONOR_ACADEMIC_YEAR,
        grade: historicalGrade,
        rank: index + 1,
        name: row.student.name,
        avatar: row.student.avatar,
        section: row.student.honorSection2025_2026 || row.student.previousSection,
        gpa: row.gpa,
        specialty: row.student.honorSpecialty,
        dream: row.student.honorDream,
      });
      if (entry) entries.push(entry);
    });
  }

  return entries;
}

export type PublicListInitDecision = {
  shouldWrite: boolean;
  reason: string;
};

const adminGate = (input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
}): PublicListInitDecision | null => {
  if (!input.authenticated) return { shouldWrite: false, reason: 'unauthenticated' };
  if (input.role === 'guest' || !input.role) return { shouldWrite: false, reason: 'guest' };
  if (input.role !== 'admin' || input.currentUserRole !== 'admin') {
    return { shouldWrite: false, reason: 'not-admin' };
  }
  if (!input.hydrated) return { shouldWrite: false, reason: 'not-hydrated' };
  if (!input.authoritativeReceived) return { shouldWrite: false, reason: 'no-authoritative-source' };
  return null;
};

export function decidePublicFacultyInitialization(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  teachers: unknown;
  initialTeachers: unknown;
  publicExists: boolean;
  publicFaculty?: unknown;
}): PublicListInitDecision {
  const blocked = adminGate(input);
  if (blocked) return blocked;
  if (!Array.isArray(input.teachers) || input.teachers.length === 0) {
    return { shouldWrite: false, reason: 'missing-source' };
  }
  if (looksLikeInitialTeachers(input.teachers, input.initialTeachers)) {
    return { shouldWrite: false, reason: 'initial-data-blocked' };
  }
  const expected = sanitizePublicFacultyList(input.teachers);
  if (expected.length === 0) return { shouldWrite: false, reason: 'empty-projection' };
  if (input.publicExists && facultyProjectionEquals(input.publicFaculty, expected)) {
    return { shouldWrite: false, reason: 'already-current' };
  }
  const publicList = sanitizePublicFacultyList(input.publicFaculty);
  if (!input.publicExists || publicList.length === 0) {
    return { shouldWrite: true, reason: 'missing-or-incomplete' };
  }
  return { shouldWrite: false, reason: 'public-complete' };
}

export function decidePublicHonorInitialization(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  students: unknown;
  graduates: unknown;
  honorRollDemo?: unknown;
  publicExists: boolean;
  publicHonorBoard?: unknown;
}): PublicListInitDecision {
  const blocked = adminGate(input);
  if (blocked) return blocked;
  const expected = buildPublicHonorBoard(input.students, input.graduates);
  if (expected.length === 0) return { shouldWrite: false, reason: 'empty-projection' };
  if (looksLikeHonorRollDemo(expected, input.honorRollDemo)) {
    return { shouldWrite: false, reason: 'demo-data-blocked' };
  }
  if (input.publicExists && honorBoardEquals(input.publicHonorBoard, expected)) {
    return { shouldWrite: false, reason: 'already-current' };
  }
  const publicList = sanitizePublicHonorBoard(input.publicHonorBoard);
  if (!input.publicExists || publicList.length === 0) {
    return { shouldWrite: true, reason: 'missing-or-incomplete' };
  }
  return { shouldWrite: false, reason: 'public-complete' };
}
