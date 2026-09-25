import type { GradeLevel, SchoolAdminData, Student, Teacher, TimetableSlot } from '../types';
import { ALL_GRADES_LIST } from '../types';

export const CALENDAR_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

export type CalendarWeekday = (typeof CALENDAR_WEEKDAYS)[number];

export const DEFAULT_WORKING_DAYS: CalendarWeekday[] = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
];

export const DEFAULT_PERIODS_PER_DAY = 7;

export const DEFAULT_PERIOD_TIMES: PeriodTime[] = [
  { period: 1, startTime: '08:00', endTime: '08:45' },
  { period: 2, startTime: '08:50', endTime: '09:35' },
  { period: 3, startTime: '09:40', endTime: '10:25' },
  { period: 4, startTime: '10:30', endTime: '11:15' },
  { period: 5, startTime: '11:20', endTime: '12:05' },
  { period: 6, startTime: '12:10', endTime: '12:55' },
  { period: 7, startTime: '13:00', endTime: '13:45' },
];

export const ARABIC_PERIOD_LABELS = [
  'الحصة الأولى',
  'الحصة الثانية',
  'الحصة الثالثة',
  'الحصة الرابعة',
  'الحصة الخامسة',
  'الحصة السادسة',
  'الحصة السابعة',
  'الحصة الثامنة',
  'الحصة التاسعة',
  'الحصة العاشرة',
];

export interface PeriodTime {
  period: number;
  startTime?: string;
  endTime?: string;
}

export interface TimetableSettingsInput {
  workingDays?: unknown;
  periodsPerDay?: unknown;
  periodTimes?: unknown;
}

export interface ResolvedTimetableSettings {
  workingDays: CalendarWeekday[];
  periodsPerDay: number;
  periodTimes: PeriodTime[];
}

export interface TimetableFacultyProjection {
  id: string;
  name: string;
  subject: string;
  availableDays?: string[];
}

export interface ActiveGradeSection {
  gradeLevel: GradeLevel;
  section: string;
}

export interface OccupiedTimetableCell {
  gradeLevel: string;
  section: string;
  day: string;
  period: number;
  slotIds: string[];
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isCalendarWeekday(value: unknown): value is CalendarWeekday {
  return typeof value === 'string' && (CALENDAR_WEEKDAYS as readonly string[]).includes(value);
}

export function weekdayIndex(day: string): number {
  return (CALENDAR_WEEKDAYS as readonly string[]).indexOf(day);
}

export function normalizeWorkingDays(raw: unknown): CalendarWeekday[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const unique: CalendarWeekday[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isCalendarWeekday(item) || seen.has(item)) continue;
    seen.add(item);
    unique.push(item);
  }
  if (unique.length === 0) return null;
  unique.sort((a, b) => weekdayIndex(a) - weekdayIndex(b));
  return unique;
}

export function normalizePeriodsPerDay(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) {
    return null;
  }
  return raw;
}

export function normalizeTimeToken(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!TIME_RE.test(trimmed)) return undefined;
  const [h, m] = trimmed.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}

export function parseLegacyTimeSlot(slot: string | undefined): { startTime?: string; endTime?: string } {
  if (!slot) return {};
  const parts = slot.split(/\s*-\s*/);
  if (parts.length !== 2) return {};
  return {
    startTime: normalizeTimeToken(parts[0]),
    endTime: normalizeTimeToken(parts[1]),
  };
}

export function formatPeriodTimeSlot(entry: PeriodTime | undefined): string {
  if (!entry?.startTime || !entry?.endTime) return '';
  return `${entry.startTime} - ${entry.endTime}`;
}

export function periodLabel(period: number): string {
  return ARABIC_PERIOD_LABELS[period - 1] || `الحصة ${period}`;
}

export function normalizePeriodTimes(raw: unknown, periodsPerDay: number): PeriodTime[] {
  const byPeriod = new Map<number, PeriodTime>();
  for (const def of DEFAULT_PERIOD_TIMES) {
    if (def.period <= periodsPerDay) byPeriod.set(def.period, { ...def });
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const period = (item as PeriodTime).period;
      if (typeof period !== 'number' || !Number.isInteger(period) || period < 1) continue;
      const startTime = normalizeTimeToken((item as PeriodTime).startTime);
      const endTime = normalizeTimeToken((item as PeriodTime).endTime);
      byPeriod.set(period, { period, startTime, endTime });
    }
  }
  const result: PeriodTime[] = [];
  for (let period = 1; period <= periodsPerDay; period += 1) {
    const existing = byPeriod.get(period);
    result.push(existing ? { period, startTime: existing.startTime, endTime: existing.endTime } : { period });
  }
  return result;
}

export function resolveTimetableSettings(
  source?: SchoolAdminData | TimetableSettingsInput | null
): ResolvedTimetableSettings {
  const raw =
    source && typeof source === 'object' && 'timetableSettings' in source
      ? (source as SchoolAdminData).timetableSettings
      : (source as TimetableSettingsInput | undefined);
  const workingDays = normalizeWorkingDays(raw?.workingDays) || [...DEFAULT_WORKING_DAYS];
  const periodsPerDay = normalizePeriodsPerDay(raw?.periodsPerDay) ?? DEFAULT_PERIODS_PER_DAY;
  const periodTimes = normalizePeriodTimes(raw?.periodTimes, periodsPerDay);
  return { workingDays, periodsPerDay, periodTimes };
}

export function buildPeriodTimings(settings: ResolvedTimetableSettings): Array<{
  period: number;
  timeSlot: string;
  label: string;
}> {
  return settings.periodTimes.map((entry) => ({
    period: entry.period,
    timeSlot: formatPeriodTimeSlot(entry),
    label: periodLabel(entry.period),
  }));
}

export function intersectWorkingDays(days: string[] | undefined, schoolDays: readonly string[]): string[] {
  const school = new Set(schoolDays);
  if (!days || days.length === 0) return [...schoolDays];
  return schoolDays.filter((day) => days.includes(day));
}

export function getAllActiveGradeSections(studentsList: Student[] = []): ActiveGradeSection[] {
  const seen = new Set<string>();
  const result: ActiveGradeSection[] = [];
  for (const student of studentsList) {
    if (!student?.gradeLevel) continue;
    const section = student.section || 'أ';
    const key = `${student.gradeLevel}:::${section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ gradeLevel: student.gradeLevel, section });
  }
  result.sort((a, b) => {
    const gi = ALL_GRADES_LIST.indexOf(a.gradeLevel) - ALL_GRADES_LIST.indexOf(b.gradeLevel);
    if (gi !== 0) return gi;
    return a.section.localeCompare(b.section, 'ar');
  });
  return result;
}

export function sanitizeTimetableFacultyList(teachers: unknown): TimetableFacultyProjection[] {
  if (!Array.isArray(teachers)) return [];
  const result: TimetableFacultyProjection[] = [];
  const seen = new Set<string>();
  for (const item of teachers) {
    if (!item || typeof item !== 'object') continue;
    const id = typeof (item as Teacher).id === 'string' ? (item as Teacher).id.trim() : '';
    const name = typeof (item as Teacher).name === 'string' ? (item as Teacher).name.trim() : '';
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    const subject = typeof (item as Teacher).subject === 'string' ? (item as Teacher).subject.trim() : '';
    const availableDays = Array.isArray((item as Teacher).availableDays)
      ? (item as Teacher).availableDays!.filter((day) => typeof day === 'string')
      : undefined;
    result.push({ id, name, subject, availableDays });
  }
  return result;
}

export function sanitizeActiveSectionsProjection(raw: unknown): ActiveGradeSection[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: ActiveGradeSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const gradeLevel = (item as ActiveGradeSection).gradeLevel;
    const section = typeof (item as ActiveGradeSection).section === 'string' && (item as ActiveGradeSection).section.trim()
      ? (item as ActiveGradeSection).section.trim()
      : 'أ';
    if (!gradeLevel || !ALL_GRADES_LIST.includes(gradeLevel)) continue;
    const key = `${gradeLevel}:::${section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ gradeLevel, section });
  }
  return result;
}

export function isTimetableAcademicFieldPresent(
  schoolAdminData: SchoolAdminData | undefined,
  field: 'timetableFaculty' | 'timetableActiveSections'
): boolean {
  return Boolean(schoolAdminData && Object.prototype.hasOwnProperty.call(schoolAdminData, field));
}

export function facultyFromSubjectQuotas(
  subjectQuotas: Array<{ teacherName?: string; subjectName?: string; availableDays?: string[] }> = []
): TimetableFacultyProjection[] {
  const fromQuotas: TimetableFacultyProjection[] = [];
  const seen = new Set<string>();
  for (const quota of subjectQuotas) {
    const name = typeof quota.teacherName === 'string' ? quota.teacherName.trim() : '';
    if (!name || seen.has(name)) continue;
    seen.add(name);
    fromQuotas.push({
      id: `quota:${name}`,
      name,
      subject: typeof quota.subjectName === 'string' ? quota.subjectName.trim() : '',
      availableDays: Array.isArray(quota.availableDays)
        ? quota.availableDays.filter((day) => typeof day === 'string')
        : undefined,
    });
  }
  return fromQuotas;
}

export function resolveTimetableFaculty(
  schoolAdminData: SchoolAdminData | undefined,
  localTeachers: Teacher[] = [],
  subjectQuotas: Array<{ teacherName?: string; subjectName?: string; availableDays?: string[] }> = []
): TimetableFacultyProjection[] {
  if (isTimetableAcademicFieldPresent(schoolAdminData, 'timetableFaculty')) {
    return sanitizeTimetableFacultyList(schoolAdminData?.timetableFaculty);
  }
  const fromTeachers = sanitizeTimetableFacultyList(localTeachers);
  if (fromTeachers.length > 0) return fromTeachers;
  return facultyFromSubjectQuotas(subjectQuotas);
}

export function resolveActiveGradeSections(
  schoolAdminData: SchoolAdminData | undefined,
  students: Student[] = []
): ActiveGradeSection[] {
  if (isTimetableAcademicFieldPresent(schoolAdminData, 'timetableActiveSections')) {
    return sanitizeActiveSectionsProjection(schoolAdminData?.timetableActiveSections);
  }
  return getAllActiveGradeSections(students);
}

export function timetableAcademicSnapshotEquals(
  schoolAdminData: SchoolAdminData | undefined,
  snapshot: {
    timetableFaculty: TimetableFacultyProjection[];
    timetableActiveSections: ActiveGradeSection[];
  }
): boolean {
  if (
    !isTimetableAcademicFieldPresent(schoolAdminData, 'timetableFaculty') ||
    !isTimetableAcademicFieldPresent(schoolAdminData, 'timetableActiveSections')
  ) {
    return false;
  }
  return (
    JSON.stringify(schoolAdminData?.timetableFaculty) === JSON.stringify(snapshot.timetableFaculty) &&
    JSON.stringify(schoolAdminData?.timetableActiveSections) === JSON.stringify(snapshot.timetableActiveSections)
  );
}

/** Matches AppContext.updateSchoolAdminData / isAdminActor: admin profile only. */
export function canPersistTimetableWrites(role?: string | null, currentUserRole?: string | null): boolean {
  return role === 'admin' && currentUserRole === 'admin';
}

export function facultyAsTeacherList(faculty: TimetableFacultyProjection[]): Teacher[] {
  return faculty.map((item) => ({
    id: item.id,
    name: item.name,
    subject: item.subject,
    email: '',
    phone: '',
    assignedGrades: [],
    status: 'نشط',
    joinedDate: '',
    availableDays: item.availableDays,
  }));
}

export function calculateWeeklyCapacity(
  activeSectionsCount: number,
  workingDaysCount: number,
  periodsPerDay: number
): number {
  const a = Number.isFinite(activeSectionsCount) ? Math.max(0, activeSectionsCount) : 0;
  const d = Number.isFinite(workingDaysCount) ? Math.max(0, workingDaysCount) : 0;
  const p = Number.isFinite(periodsPerDay) ? Math.max(0, periodsPerDay) : 0;
  return a * d * p;
}

export function logicalCellKey(slot: Pick<TimetableSlot, 'gradeLevel' | 'section' | 'day' | 'period'>): string {
  return `${slot.gradeLevel}:::${slot.section || 'أ'}:::${slot.day}:::${slot.period}`;
}

export function getUniqueOccupiedTimetableCells(timetable: TimetableSlot[] = []): OccupiedTimetableCell[] {
  const map = new Map<string, OccupiedTimetableCell>();
  for (const slot of timetable) {
    if (!slot) continue;
    const key = logicalCellKey(slot);
    const existing = map.get(key);
    if (existing) {
      existing.slotIds.push(slot.id);
    } else {
      map.set(key, {
        gradeLevel: slot.gradeLevel,
        section: slot.section || 'أ',
        day: slot.day,
        period: slot.period,
        slotIds: [slot.id],
      });
    }
  }
  return Array.from(map.values());
}

export const FREE_STUDY_SUBJECT = 'دراسة حرة وتوجيه';

export function isAssignedLesson(slot: TimetableSlot): boolean {
  if (!slot?.subject || slot.subject === FREE_STUDY_SUBJECT) return false;
  if (!slot.teacherName || slot.teacherName === 'إدارة المدرسة' || slot.teacherName === 'أستاذة المادة' || slot.teacherName === 'مدرس المادة') {
    return false;
  }
  return true;
}

export function calculateTimetableUtilization(
  timetable: TimetableSlot[],
  activeSectionsCount: number,
  settings: ResolvedTimetableSettings
): {
  weeklyCapacity: number;
  occupiedCells: number;
  assignedLessons: number;
  emptyCells: number;
  duplicateCells: number;
  utilization: number;
} {
  const weeklyCapacity = calculateWeeklyCapacity(
    activeSectionsCount,
    settings.workingDays.length,
    settings.periodsPerDay
  );
  const occupied = getUniqueOccupiedTimetableCells(timetable);
  const occupiedCells = occupied.length;
  const duplicateCells = occupied.filter((cell) => cell.slotIds.length > 1).length;
  const assignedLessons = timetable.filter(isAssignedLesson).length;
  const emptyCells = Math.max(0, weeklyCapacity - occupiedCells);
  const utilization = weeklyCapacity > 0 ? occupiedCells / weeklyCapacity : 0;
  return { weeklyCapacity, occupiedCells, assignedLessons, emptyCells, duplicateCells, utilization };
}

export function buildTimetableAcademicSnapshot(
  teachers: Teacher[],
  students: Student[]
): {
  timetableFaculty: TimetableFacultyProjection[];
  timetableActiveSections: ActiveGradeSection[];
} {
  return {
    timetableFaculty: sanitizeTimetableFacultyList(teachers),
    timetableActiveSections: getAllActiveGradeSections(students),
  };
}
