import {
  TimetableSlot,
  GradeSubjectQuota,
  GradeLevel,
  Teacher,
  Student,
  ALL_GRADES_LIST,
} from '../types';
import {
  DEFAULT_WORKING_DAYS,
  DEFAULT_PERIOD_TIMES,
  FREE_STUDY_SUBJECT,
  formatPeriodTimeSlot,
  getUniqueOccupiedTimetableCells,
  intersectWorkingDays,
  periodLabel,
  resolveTimetableSettings,
  type ResolvedTimetableSettings,
} from './timetableSettings';

/** @deprecated Default school working days only. Use resolveTimetableSettings().workingDays. */
export const WEEKDAY_LIST = DEFAULT_WORKING_DAYS;

export const PERIODS_TIMING = DEFAULT_PERIOD_TIMES.map((entry) => ({
  period: entry.period,
  timeSlot: formatPeriodTimeSlot(entry),
  label: periodLabel(entry.period),
}));

export interface GenerationResult {
  slots: TimetableSlot[];
  success: boolean;
  message: string;
  conflictDetails?: string[];
}

export const SECTIONS_LIST = ['أ', 'ب', 'جـ', 'د'];

/**
 * Helper to get all sections that currently have enrolled students for a specific grade.
 * If studentsList is empty/undefined, defaults to standard default ['أ'].
 */
export function getActiveGradeSectionsWithStudents(
  studentsList: Student[] = [],
  grade: GradeLevel
): string[] {
  if (!studentsList || studentsList.length === 0) {
    return ['أ'];
  }
  const enrolledSections = Array.from(
    new Set(
      studentsList
        .filter((s) => s.gradeLevel === grade)
        .map((s) => s.section || 'أ')
    )
  ).sort();

  return enrolledSections.length > 0 ? enrolledSections : ['أ'];
}

/**
 * Returns whether a given grade and section has any enrolled students.
 */
export function hasEnrolledStudents(
  studentsList: Student[] = [],
  grade: GradeLevel,
  section: string
): boolean {
  if (!studentsList || studentsList.length === 0) return true;
  const sec = section || 'أ';
  return studentsList.some(
    (s) => s.gradeLevel === grade && (s.section === sec || (!s.section && sec === 'أ'))
  );
}

/**
 * Filters out any timetable slots for sections that have 0 enrolled students.
 */
export function filterEmptySectionSlots(
  timetable: TimetableSlot[],
  studentsList: Student[] = []
): TimetableSlot[] {
  if (!studentsList || studentsList.length === 0) return timetable;
  return timetable.filter((slot) => {
    const sec = slot.section || 'أ';
    return hasEnrolledStudents(studentsList, slot.gradeLevel, sec);
  });
}

/**
 * Normalizes Arabic text by removing tatweel, diacritics, and standardizing alef/ya/taa-marboota
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // remove harakat
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Strips formal academic and professional honorifics from teacher names
 */
export function cleanTeacherTitle(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/^(أ\.د\.|أ\.د|أ\.|د\.|الاستاذة|الأستاذة|الاستاذ|الأستاذ|الست|المعلمة|المعلم|م\.|مدرس|مدرسة)\s*/gi, '')
    .trim();
}

export function normalizeTeacherName(name: string): string {
  return normalizeArabicText(cleanTeacherTitle(name));
}

/**
 * Robust equivalence checker for teacher names across different formats
 */
export function isSameTeacher(
  teacherA?: string,
  teacherB?: string,
  teachersList: Teacher[] = []
): boolean {
  if (!teacherA || !teacherB) return false;
  const rawA = teacherA.trim();
  const rawB = teacherB.trim();
  if (rawA === rawB) return true;

  const genericPlaceholders = [
    'إدارة المدرسة',
    'أستاذة المادة',
    'مدرس المادة',
    'دراسة حرة وتوجيه',
    'غير محدد',
    'إدارة الثانوية',
  ];
  if (genericPlaceholders.includes(rawA) || genericPlaceholders.includes(rawB)) {
    return false;
  }

  const cleanA = cleanTeacherTitle(rawA);
  const cleanB = cleanTeacherTitle(rawB);
  if (cleanA && cleanB && cleanA === cleanB) return true;

  const normA = normalizeArabicText(cleanA);
  const normB = normalizeArabicText(cleanB);
  if (normA && normB && normA === normB) return true;

  // Cross-reference with teachersList
  const tObjA = teachersList.find(
    (t) => t.id === rawA || t.name === rawA || normalizeArabicText(cleanTeacherTitle(t.name)) === normA
  );
  const tObjB = teachersList.find(
    (t) => t.id === rawB || t.name === rawB || normalizeArabicText(cleanTeacherTitle(t.name)) === normB
  );
  if (tObjA && tObjB && tObjA.id === tObjB.id) return true;

  // Legacy compound-name compatibility: only when one full name contains the other
  // and the shorter form has at least three tokens (avoids first-two-word false positives).
  if (normA.length >= 8 && normB.length >= 8) {
    const wordsA = normA.split(' ').filter(Boolean);
    const wordsB = normB.split(' ').filter(Boolean);
    const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB;
    const longer = wordsA.length <= wordsB.length ? wordsB : wordsA;
    if (shorter.length >= 3 && shorter.every((w) => longer.includes(w))) {
      return true;
    }
    if (normA.includes(normB) || normB.includes(normA)) {
      if (Math.min(wordsA.length, wordsB.length) >= 3) return true;
    }
  }

  return false;
}

export interface TeacherAgendaLesson {
  period: number;
  label: string;
  timeSlot: string;
  gradeLevel: string;
  section: string;
  subject: string;
  room: string;
  slotId: string;
  hasCollision: boolean;
}

export interface TeacherAgendaDay {
  day: string;
  isWorkingDay: boolean;
  totalPeriods: number;
  lessons: TeacherAgendaLesson[];
}

/**
 * Returns a clean, chronological daily agenda of all assigned lessons for a teacher
 */
export function getTeacherChronologicalAgenda(
  allSlots: TimetableSlot[],
  teacherName: string,
  subjectQuotas: GradeSubjectQuota[] = [],
  teachersList: Teacher[] = [],
  settings?: ResolvedTimetableSettings
): TeacherAgendaDay[] {
  const resolved = settings || resolveTimetableSettings();
  const allowedDays = getTeacherAvailableDays(teacherName, subjectQuotas, teachersList, resolved);

  return resolved.workingDays.map((day) => {
    const isWorkingDay = allowedDays.includes(day);
    const daySlots = allSlots.filter(
      (s) => s.day === day && isSameTeacher(s.teacherName, teacherName, teachersList)
    );

    daySlots.sort((a, b) => a.period - b.period);

    const lessons: TeacherAgendaLesson[] = daySlots.map((slot) => {
      const timeSlot = slot.timeSlot || getTimeSlotForPeriod(slot.period, resolved);
      const samePeriodSlots = daySlots.filter((s) => s.period === slot.period);
      return {
        period: slot.period,
        label: periodLabel(slot.period),
        timeSlot: timeSlot || `الحصة ${slot.period}`,
        gradeLevel: slot.gradeLevel,
        section: slot.section || 'أ',
        subject: slot.subject,
        room: slot.room || 'القاعة الدراسية',
        slotId: slot.id,
        hasCollision: samePeriodSlots.length > 1,
      };
    });

    return {
      day,
      isWorkingDay,
      totalPeriods: lessons.length,
      lessons,
    };
  });
}

/**
 * Resolves teacher's available days for teaching based on teacher object or quota object.
 * Returns default ALL_WEEKDAYS if not configured.
 */
export function getTeacherAvailableDays(
  teacherName: string,
  gradeQuotas: GradeSubjectQuota[] = [],
  teachersList: Teacher[] = [],
  settings?: ResolvedTimetableSettings
): string[] {
  const resolved = settings || resolveTimetableSettings();
  if (
    !teacherName ||
    teacherName === 'إدارة المدرسة' ||
    teacherName === 'أستاذة المادة' ||
    teacherName === 'مدرس المادة'
  ) {
    return [...resolved.workingDays];
  }

  const cleanName = teacherName.trim();
  const normalizedInput = normalizeTeacherName(cleanName);

  const matchedTeacher = teachersList.find((t) => {
    if (t.id === teacherName || t.name.trim() === cleanName) return true;
    const normTName = normalizeTeacherName(t.name);
    return (
      normTName === normalizedInput ||
      (normalizedInput.length >= 4 && (normTName.includes(normalizedInput) || normalizedInput.includes(normTName)))
    );
  });

  if (matchedTeacher && matchedTeacher.availableDays && matchedTeacher.availableDays.length > 0) {
    return intersectWorkingDays(matchedTeacher.availableDays, resolved.workingDays);
  }

  const matchedQuota = gradeQuotas.find((q) => {
    if (q.teacherName.trim() === cleanName) return true;
    const normQName = normalizeTeacherName(q.teacherName);
    return (
      normQName === normalizedInput ||
      (normalizedInput.length >= 4 && (normQName.includes(normalizedInput) || normalizedInput.includes(normQName)))
    );
  });

  if (matchedQuota && matchedQuota.availableDays && matchedQuota.availableDays.length > 0) {
    return intersectWorkingDays(matchedQuota.availableDays, resolved.workingDays);
  }

  return [...resolved.workingDays];
}

/**
 * Returns time slot string for a period number (e.g., 1 -> "08:00 - 08:45")
 */
export function getTimeSlotForPeriod(periodNumber: number, settings?: ResolvedTimetableSettings): string {
  const resolved = settings || resolveTimetableSettings();
  const match = resolved.periodTimes.find((p) => p.period === periodNumber);
  return formatPeriodTimeSlot(match) || PERIODS_TIMING.find((p) => p.period === periodNumber)?.timeSlot || '';
}

/**
 * Check if a teacher is busy at a given day and period in any slot of the school
 */
export function isTeacherBusyAtSlot(
  teacherName: string,
  day: string,
  period: number,
  allSlots: TimetableSlot[],
  excludeGrade?: GradeLevel,
  excludeSection?: string,
  teachersList: Teacher[] = []
): { isBusy: boolean; conflictingSlot?: TimetableSlot } {
  if (
    !teacherName ||
    teacherName === 'إدارة المدرسة' ||
    teacherName === 'أستاذة المادة' ||
    teacherName === 'مدرس المادة' ||
    teacherName === 'دراسة حرة وتوجيه'
  ) {
    return { isBusy: false };
  }

  for (const slot of allSlots) {
    if (slot.day === day && slot.period === period) {
      // Exclude current target grade and section from collision check
      if (
        excludeGrade &&
        excludeSection &&
        slot.gradeLevel === excludeGrade &&
        (slot.section === excludeSection || (!slot.section && excludeSection === 'أ'))
      ) {
        continue;
      }

      if (isSameTeacher(slot.teacherName, teacherName, teachersList)) {
        return { isBusy: true, conflictingSlot: slot };
      }
    }
  }
  return { isBusy: false };
}

/**
 * Structural collision report item
 */
export interface TimetableConflictItem {
  id: string;
  slotId1: string;
  slotId2: string;
  day: string;
  period: number;
  timeSlot: string;
  teacherName: string;
  class1: string;
  class2: string;
  subject1: string;
  subject2: string;
  description: string;
}

/**
 * Audits the complete school timetable for any teacher-period collisions or working day violations
 */
export type SchoolDayViolation = {
  slotId: string;
  day: string;
  period: number;
  teacherName: string;
  gradeLevel: string;
  section: string;
  subject: string;
};

export type PeriodRangeViolation = SchoolDayViolation;
export type TeacherAvailabilityViolation = SchoolDayViolation & { allowedDays: string[] };

/**
 * Audits the complete school timetable for teacher collisions, school-day, period-range, and teacher-availability issues.
 */
export function auditSchoolTimetableConflicts(
  timetable: TimetableSlot[],
  subjectQuotas: GradeSubjectQuota[] = [],
  teachersList: Teacher[] = [],
  settings?: ResolvedTimetableSettings
): {
  hasConflicts: boolean;
  totalConflicts: number;
  conflicts: TimetableConflictItem[];
  timeConflicts: TimetableConflictItem[];
  availabilityViolations: TeacherAvailabilityViolation[];
  teacherAvailabilityViolations: TeacherAvailabilityViolation[];
  schoolDayViolations: SchoolDayViolation[];
  periodRangeViolations: PeriodRangeViolation[];
  duplicateCells: Array<{ key: string; slotIds: string[] }>;
} {
  const resolved = settings || resolveTimetableSettings();
  const schoolDays = new Set(resolved.workingDays);
  const conflicts: TimetableConflictItem[] = [];
  const availabilityViolations: TeacherAvailabilityViolation[] = [];
  const schoolDayViolations: SchoolDayViolation[] = [];
  const periodRangeViolations: PeriodRangeViolation[] = [];
  const seenPairKeys = new Set<string>();

  const duplicateCells = getUniqueOccupiedTimetableCells(timetable)
    .filter((cell) => cell.slotIds.length > 1)
    .map((cell) => ({
      key: `${cell.gradeLevel}:::${cell.section}:::${cell.day}:::${cell.period}`,
      slotIds: cell.slotIds,
    }));

  for (let i = 0; i < timetable.length; i++) {
    const s1 = timetable[i];
    const baseMeta = {
      slotId: s1.id,
      day: s1.day,
      period: s1.period,
      teacherName: s1.teacherName,
      gradeLevel: s1.gradeLevel,
      section: s1.section || 'أ',
      subject: s1.subject,
    };

    if (!schoolDays.has(s1.day)) {
      schoolDayViolations.push(baseMeta);
    }
    if (!Number.isInteger(s1.period) || s1.period < 1 || s1.period > resolved.periodsPerDay) {
      periodRangeViolations.push(baseMeta);
    }

    if (
      !s1.teacherName ||
      s1.teacherName === 'إدارة المدرسة' ||
      s1.teacherName === 'أستاذة المادة' ||
      s1.teacherName === 'مدرس المادة'
    ) {
      continue;
    }

    const allowedDays = getTeacherAvailableDays(s1.teacherName, subjectQuotas, teachersList, resolved);
    if (schoolDays.has(s1.day) && !allowedDays.includes(s1.day)) {
      availabilityViolations.push({ ...baseMeta, allowedDays });
    }

    for (let j = i + 1; j < timetable.length; j++) {
      const s2 = timetable[j];
      if (s1.day === s2.day && s1.period === s2.period) {
        const isSameClass =
          s1.gradeLevel === s2.gradeLevel &&
          (s1.section === s2.section || (!s1.section && s2.section === 'أ') || (!s2.section && s1.section === 'أ'));
        if (isSameClass) continue;

        const sameById = Boolean(s1.teacherId && s2.teacherId && s1.teacherId === s2.teacherId);
        if (sameById || isSameTeacher(s1.teacherName, s2.teacherName, teachersList)) {
          const pairKey = [s1.id, s2.id].sort().join(':::');
          if (!seenPairKeys.has(pairKey)) {
            seenPairKeys.add(pairKey);
            const class1Str = `${s1.gradeLevel} (شعبة ${s1.section || 'أ'})`;
            const class2Str = `${s2.gradeLevel} (شعبة ${s2.section || 'أ'})`;
            conflicts.push({
              id: `conf-${s1.id}-${s2.id}`,
              slotId1: s1.id,
              slotId2: s2.id,
              day: s1.day,
              period: s1.period,
              timeSlot: s1.timeSlot || getTimeSlotForPeriod(s1.period, resolved),
              teacherName: s1.teacherName,
              class1: class1Str,
              class2: class2Str,
              subject1: s1.subject,
              subject2: s2.subject,
              description: `تضارب وقت الحصة: الأستاذ/ة (${s1.teacherName}) مكلف/ة بحصة في (${class1Str} - ${s1.subject}) وحصة في (${class2Str} - ${s2.subject}) في نفس اليوم (${s1.day}) والحصة (${s1.period})!`,
            });
          }
        }
      }
    }
  }

  const totalConflicts =
    conflicts.length + availabilityViolations.length + schoolDayViolations.length + periodRangeViolations.length;

  return {
    hasConflicts: totalConflicts > 0,
    totalConflicts,
    conflicts,
    timeConflicts: conflicts,
    availabilityViolations,
    teacherAvailabilityViolations: availabilityViolations,
    schoolDayViolations,
    periodRangeViolations,
    duplicateCells,
  };
}

/**
 * Returns a complete 5 days x 7 periods weekly schedule matrix for a specific teacher
 */
export interface TeacherWeeklyScheduleReport {
  teacherName: string;
  totalSlots: number;
  allowedDays: string[];
  items: Array<{
    day: string;
    period: number;
    timeSlot: string;
    matchingSlots: TimetableSlot[];
    isAvailableDay: boolean;
    hasCollision: boolean;
  }>;
}

/**
 * Returns a complete 5 days x 7 periods weekly schedule matrix and stats for a specific teacher
 */
export function getTeacherWeeklySchedule(
  allSlots: TimetableSlot[],
  teacherName: string,
  subjectQuotas: GradeSubjectQuota[] = [],
  teachersList: Teacher[] = [],
  settings?: ResolvedTimetableSettings
): TeacherWeeklyScheduleReport {
  const resolved = settings || resolveTimetableSettings();
  const allowedDays = getTeacherAvailableDays(teacherName, subjectQuotas, teachersList, resolved);
  const items: TeacherWeeklyScheduleReport['items'] = [];
  let totalSlots = 0;

  for (const day of resolved.workingDays) {
    const isAvail = allowedDays.includes(day);
    for (let p = 1; p <= resolved.periodsPerDay; p++) {
      const matchingSlots = allSlots.filter(
        (s) => s.day === day && s.period === p && isSameTeacher(s.teacherName, teacherName, teachersList)
      );
      if (matchingSlots.length > 0) {
        totalSlots += matchingSlots.length;
      }
      items.push({
        day,
        period: p,
        timeSlot: getTimeSlotForPeriod(p, resolved),
        matchingSlots,
        isAvailableDay: isAvail,
        hasCollision: matchingSlots.length > 1,
      });
    }
  }

  return {
    teacherName,
    totalSlots,
    allowedDays,
    items,
  };
}

/**
 * Generates an intelligent, 100% conflict-free weekly timetable according to all ministry & school constraints:
 * 1. Distributes subject periods across resolved school workingDays and periodsPerDay.
 * 2. Strict Teacher Available Days constraint (only schedules on working days).
 * 3. Strict Teacher Collision-Free constraint across all classes/sections in the entire school.
 * 4. Maximum 1 lesson per day per subject (unless weekly periods > available days).
 * 5. Multi-attempt randomized constraint satisfaction restart solver.
 */
export function generateSmartTimetable(
  targetGrade: GradeLevel | 'ALL',
  targetSection: string | 'ALL',
  allQuotas: GradeSubjectQuota[],
  existingTimetable: TimetableSlot[],
  teachersList: Teacher[] = [],
  studentsList: Student[] = [],
  settings?: ResolvedTimetableSettings
): GenerationResult {
  const resolved = settings || resolveTimetableSettings();
  const workingDays = resolved.workingDays;
  const periodsPerDay = resolved.periodsPerDay;
  const sectionCapacity = workingDays.length * periodsPerDay;
  const cleanedExisting = filterEmptySectionSlots(existingTimetable, studentsList);

  interface LessonUnit {
    subject: string;
    teacher: string;
    room: string;
    weeklyTotal: number;
    maxPerDay: number;
    availableDays: string[];
  }

  function solveSectionSlots(
    grade: GradeLevel,
    section: string,
    currentGlobalSlots: TimetableSlot[],
    maxAttempts = 500
  ): TimetableSlot[] | null {
    const gradeQuotas = allQuotas.filter((q) => q.gradeLevel === grade);
    if (gradeQuotas.length === 0) return null;

    const basePool: LessonUnit[] = [];
    gradeQuotas.forEach((q) => {
      const teacherDays = getTeacherAvailableDays(q.teacherName, gradeQuotas, teachersList, resolved);
      const numDays = teacherDays.length || workingDays.length;
      const maxDaily = q.weeklyPeriods <= numDays ? 1 : Math.ceil(q.weeklyPeriods / numDays);
      for (let i = 0; i < q.weeklyPeriods; i++) {
        basePool.push({
          subject: q.subjectName,
          teacher: q.teacherName,
          room: q.classroom || 'قاعة المتميزات',
          weeklyTotal: q.weeklyPeriods,
          maxPerDay: maxDaily,
          availableDays: teacherDays,
        });
      }
    });

    while (basePool.length < sectionCapacity) {
      basePool.push({
        subject: FREE_STUDY_SUBJECT,
        teacher: 'إدارة المدرسة',
        room: 'المكتبة المركزية',
        weeklyTotal: 1,
        maxPerDay: periodsPerDay,
        availableDays: [...workingDays],
      });
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const grid: Record<string, LessonUnit> = {};
      const dayCounts: Record<string, Record<string, number>> = {};
      for (const d of workingDays) dayCounts[d] = {};

      const pool = [...basePool];
      pool.sort(() => Math.random() - 0.5);
      pool.sort((a, b) => a.availableDays.length - b.availableDays.length);

      let placedAll = true;

      for (const item of pool) {
        const validPositions: Array<{ d: string; p: number; key: string }> = [];

        for (const d of item.availableDays) {
          if (!workingDays.includes(d)) continue;
          if ((dayCounts[d][item.subject] || 0) >= item.maxPerDay) continue;

          for (let p = 1; p <= periodsPerDay; p++) {
            const key = `${d}_${p}`;
            if (grid[key]) continue;

            const busy = isTeacherBusyAtSlot(
              item.teacher,
              d,
              p,
              currentGlobalSlots,
              grade,
              section,
              teachersList
            );

            if (!busy.isBusy) {
              validPositions.push({ d, p, key });
            }
          }
        }

        if (validPositions.length === 0) {
          placedAll = false;
          break;
        }

        const chosen = validPositions[Math.floor(Math.random() * validPositions.length)];
        grid[chosen.key] = item;
        dayCounts[chosen.d][item.subject] = (dayCounts[chosen.d][item.subject] || 0) + 1;
      }

      if (placedAll && Object.keys(grid).length === sectionCapacity) {
        const sectionSlots: TimetableSlot[] = [];
        for (const d of workingDays) {
          for (let p = 1; p <= periodsPerDay; p++) {
            const l = grid[`${d}_${p}`];
            if (l) {
              sectionSlots.push({
                id: `sch-${grade}-${section}-${d}-${p}-${Math.random().toString(36).substr(2, 4)}`,
                day: d,
                period: p,
                timeSlot: getTimeSlotForPeriod(p, resolved),
                gradeLevel: grade,
                section,
                subject: l.subject,
                teacherName: l.teacher,
                room: l.room,
              });
            }
          }
        }
        return sectionSlots;
      }
    }

    return null;
  }

  // Target single grade/section
  if (targetGrade !== 'ALL') {
    if (targetSection === 'ALL') {
      const activeSections = getActiveGradeSectionsWithStudents(studentsList, targetGrade);
      if (activeSections.length === 0) {
        return {
          slots: cleanedExisting.filter((s) => s.gradeLevel !== targetGrade),
          success: false,
          message: `⚠️ لا توجد أي طالبات مسجلات في (${targetGrade})، تم إيقاف توليد الجدول للشعب غير المأهولة.`,
        };
      }

      let runningTimetable = cleanedExisting.filter((s) => s.gradeLevel !== targetGrade);
      for (const sec of activeSections) {
        const generated = solveSectionSlots(targetGrade, sec, runningTimetable, 1000);
        if (!generated) {
          return {
            slots: existingTimetable,
            success: false,
            message: `⚠️ تعذر إكمال جدول (${targetGrade} - شعبة ${sec}) بدون تضارب. يرجى التحقق من حصص المدرسين وأيام دوامهم.`,
          };
        }
        runningTimetable = [...runningTimetable, ...generated];
      }

      const audit = auditSchoolTimetableConflicts(runningTimetable, allQuotas, teachersList, resolved);
      return {
        slots: runningTimetable,
        success: true,
        message: `تم توليد جدول أسبوعي نموذجي لـ (${targetGrade} - شعبة ${activeSections.join(' و ')}) بدون أي تعارض زمني للمدرسات بنجاح! 🎉 (${audit.totalConflicts === 0 ? '0 تضاربات ✓' : `يوجد ${audit.totalConflicts} تضاربات تم رصدها`})`,
      };
    }

    const activeSec = targetSection;
    if (studentsList && studentsList.length > 0 && !hasEnrolledStudents(studentsList, targetGrade, activeSec)) {
      return {
        slots: cleanedExisting.filter(
          (slot) => !(slot.gradeLevel === targetGrade && (slot.section === activeSec || (!slot.section && activeSec === 'أ')))
        ),
        success: false,
        message: `⚠️ لا توجد أي طالبات مسجلات في (${targetGrade} - شعبة ${activeSec}). تم منع توليد الجدول للشعب الخالية من الطالبات طبقاً للتعليمات.`,
      };
    }

    const otherGradeSlots = cleanedExisting.filter(
      (slot) => !(slot.gradeLevel === targetGrade && (slot.section === activeSec || (!slot.section && activeSec === 'أ')))
    );

    const generated = solveSectionSlots(targetGrade, activeSec, otherGradeSlots, 1000);

    if (!generated) {
      return {
        slots: existingTimetable,
        success: false,
        message: `⚠️ تعذر جدولة الحصص بالكامل لـ (${targetGrade} - شعبة ${activeSec}) بدون تضارب. يرجى التحقق من أيام دوام المدرسين وتوزيع الحصص.`,
      };
    }

    const fullResultSlots = [...otherGradeSlots, ...generated];
    const audit = auditSchoolTimetableConflicts(fullResultSlots, allQuotas, teachersList, resolved);

    return {
      slots: fullResultSlots,
      success: true,
      message: `تم توليد جدول أسبوعي نموذجي لـ (${targetGrade} - شعبة ${activeSec}) بدون أي تعارض زمني للمدرسات بنجاح! 🎉 (${audit.totalConflicts === 0 ? '0 تضاربات ✓' : `يوجد ${audit.totalConflicts} تضاربات تم رصدها`})`,
    };
  }

  // Full school generation with global restart solver
  // ONLY generate for grades & sections that actually have enrolled students!
  const targets: Array<{ grade: GradeLevel; section: string }> = [];

  for (const grade of ALL_GRADES_LIST) {
    if (allQuotas.some((q) => q.gradeLevel === grade)) {
      const activeSections = getActiveGradeSectionsWithStudents(studentsList, grade);
      for (const section of activeSections) {
        targets.push({ grade, section });
      }
    }
  }

  if (targets.length === 0) {
    return {
      slots: cleanedExisting,
      success: false,
      message: '⚠️ لا توجد أي شعب مأهولة بالطالبات ومحددة لها حصص دراسية لتوليد الجدول.',
    };
  }

  for (let globalAttempt = 1; globalAttempt <= 35; globalAttempt++) {
    const globalSchedule: TimetableSlot[] = [];
    let allSolved = true;

    for (const { grade, section } of targets) {
      const sectionSlots = solveSectionSlots(grade, section, globalSchedule, 400);
      if (sectionSlots) {
        globalSchedule.push(...sectionSlots);
      } else {
        allSolved = false;
        break;
      }
    }

    if (allSolved && globalSchedule.length === targets.length * sectionCapacity) {
      const audit = auditSchoolTimetableConflicts(globalSchedule, allQuotas, teachersList, resolved);
      return {
        slots: globalSchedule,
        success: true,
        message: `تم توليد الجدول الأسبوعي المدرسي الشامل لجميع الصفوف والشعب المأهولة فقط (${targets.length} شعبة مأهولة - ${globalSchedule.length} حصة) بنجاح تام مع الالتزام التام بأيام دوام المدرسين وبدون أي تعارض للمدرسات! 🌟 (فحص التضاربات: ${audit.totalConflicts === 0 ? '0 تضارب ✓' : `${audit.totalConflicts} تضارب`})`,
      };
    }
  }

  return {
    slots: cleanedExisting,
    success: false,
    message: '⚠️ تعذر توليد الجدول لجميع الصفوف دفعة واحدة تلقائياً. يرجى تجربة التوليد لكل صف على حدة.',
  };
}

/**
 * 1-Click Master Conflict Resolver:
 * Scans existing slots, detects any overlap or working day violations, and automatically swaps or reschedules them
 */
export function resolveAllTimetableConflicts(
  timetable: TimetableSlot[],
  subjectQuotas: GradeSubjectQuota[] = [],
  teachersList: Teacher[] = [],
  settings?: ResolvedTimetableSettings
): { resolvedTimetable: TimetableSlot[]; fixedCount: number; message: string } {
  const resolved = settings || resolveTimetableSettings();
  let slots = [...timetable];
  let fixedCount = 0;

  for (let pass = 0; pass < 10; pass++) {
    const audit = auditSchoolTimetableConflicts(slots, subjectQuotas, teachersList, resolved);
    if (!audit.hasConflicts) break;

    // 1. Fix working day violations
    for (const v of audit.availabilityViolations) {
      const slotIndex = slots.findIndex((s) => s.id === v.slotId);
      if (slotIndex === -1) continue;
      const targetSlot = slots[slotIndex];

      // Find a slot in the same class on an allowed day that can be swapped
      let swapped = false;
      for (let i = 0; i < slots.length; i++) {
        const candidate = slots[i];
        if (
          candidate.gradeLevel === targetSlot.gradeLevel &&
          candidate.section === targetSlot.section &&
          candidate.id !== targetSlot.id &&
          v.allowedDays.includes(candidate.day)
        ) {
          const candidateTeacherDays = getTeacherAvailableDays(candidate.teacherName, subjectQuotas, teachersList, resolved);
          if (candidateTeacherDays.includes(targetSlot.day)) {
            // Check non-collision for both
            const busyTargetOnCand = isTeacherBusyAtSlot(
              targetSlot.teacherName,
              candidate.day,
              candidate.period,
              slots.filter((s) => s.id !== targetSlot.id && s.id !== candidate.id),
              targetSlot.gradeLevel,
              targetSlot.section,
              teachersList
            );
            const busyCandOnTarget = isTeacherBusyAtSlot(
              candidate.teacherName,
              targetSlot.day,
              targetSlot.period,
              slots.filter((s) => s.id !== targetSlot.id && s.id !== candidate.id),
              targetSlot.gradeLevel,
              targetSlot.section,
              teachersList
            );

            if (!busyTargetOnCand.isBusy && !busyCandOnTarget.isBusy) {
              const tempSub = targetSlot.subject;
              const tempTeach = targetSlot.teacherName;
              const tempRoom = targetSlot.room;

              targetSlot.subject = candidate.subject;
              targetSlot.teacherName = candidate.teacherName;
              targetSlot.room = candidate.room;

              candidate.subject = tempSub;
              candidate.teacherName = tempTeach;
              candidate.room = tempRoom;

              swapped = true;
              fixedCount++;
              break;
            }
          }
        }
      }

      if (!swapped) {
        // Replace with free study slot if cannot swap
        targetSlot.subject = 'دراسة حرة وتوجيه';
        targetSlot.teacherName = 'إدارة المدرسة';
        targetSlot.room = 'المكتبة المركزية';
        fixedCount++;
      }
    }

    // 2. Fix teacher collisions
    for (const conf of audit.conflicts) {
      const s2Index = slots.findIndex((s) => s.id === conf.slotId2);
      if (s2Index === -1) continue;
      const s2 = slots[s2Index];
      const s2AllowedDays = getTeacherAvailableDays(s2.teacherName, subjectQuotas, teachersList, resolved);

      let swapped = false;
      for (let i = 0; i < slots.length; i++) {
        const candidate = slots[i];
        if (
          candidate.gradeLevel === s2.gradeLevel &&
          candidate.section === s2.section &&
          candidate.id !== s2.id &&
          s2AllowedDays.includes(candidate.day)
        ) {
          const candAllowedDays = getTeacherAvailableDays(candidate.teacherName, subjectQuotas, teachersList, resolved);
          if (candAllowedDays.includes(s2.day)) {
            const busyS2OnCand = isTeacherBusyAtSlot(
              s2.teacherName,
              candidate.day,
              candidate.period,
              slots.filter((s) => s.id !== s2.id && s.id !== candidate.id),
              s2.gradeLevel,
              s2.section,
              teachersList
            );
            const busyCandOnS2 = isTeacherBusyAtSlot(
              candidate.teacherName,
              s2.day,
              s2.period,
              slots.filter((s) => s.id !== s2.id && s.id !== candidate.id),
              s2.gradeLevel,
              s2.section,
              teachersList
            );

            if (!busyS2OnCand.isBusy && !busyCandOnS2.isBusy) {
              const tempSub = s2.subject;
              const tempTeach = s2.teacherName;
              const tempRoom = s2.room;

              s2.subject = candidate.subject;
              s2.teacherName = candidate.teacherName;
              s2.room = candidate.room;

              candidate.subject = tempSub;
              candidate.teacherName = tempTeach;
              candidate.room = tempRoom;

              swapped = true;
              fixedCount++;
              break;
            }
          }
        }
      }

      if (!swapped) {
        s2.subject = 'دراسة حرة وتوجيه';
        s2.teacherName = 'إدارة المدرسة';
        s2.room = 'المكتبة المركزية';
        fixedCount++;
      }
    }
  }

  const finalAudit = auditSchoolTimetableConflicts(slots, subjectQuotas, teachersList, resolved);
  return {
    resolvedTimetable: slots,
    fixedCount,
    message:
      finalAudit.totalConflicts === 0
        ? `تمت معالجة وإصلاح جميع التعارضات وتوزيع الحصص بنجاح (تم تعديل ${fixedCount} حصة)! أصبح الجدول خالياً تماماً من التضاربات بنسبة 100% ✓.`
        : `تم إصلاح ${fixedCount} تعارض، وما زال هناك ${finalAudit.totalConflicts} تضارب بحاجة لضبط يدوي أو إعادة التوليد.`,
  };
}
