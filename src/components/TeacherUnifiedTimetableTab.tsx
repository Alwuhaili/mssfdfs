/**
 * Teacher Unified Weekly Timetable Component
 * جدول الحصص الأسبوعي الموحد للأستاذ/ة
 * ثانوية ميسان للمتميزات
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Teacher, TimetableSlot } from '../types';
import {
  WEEKDAY_LIST,
  PERIODS_TIMING,
  normalizeTeacherName,
  isSameTeacher,
  getTeacherWeeklySchedule,
  getTeacherChronologicalAgenda,
} from '../utils/timetableGenerator';
import {
  CalendarDays,
  Clock,
  Building2,
  BookOpen,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  Filter,
  Layers,
  ChevronDown,
  Info,
  Calendar,
  Coffee,
  Check,
  UserCheck,
  Maximize2,
  Sliders,
  ListOrdered,
  Grid3X3,
  Search,
  CheckCheck,
} from 'lucide-react';

interface TeacherUnifiedTimetableTabProps {
  activeTeacher?: Teacher | null;
  onOpenComprehensiveModal?: () => void;
}

export const TeacherUnifiedTimetableTab: React.FC<TeacherUnifiedTimetableTabProps> = ({
  activeTeacher,
  onOpenComprehensiveModal,
}) => {
  const {
    timetable,
    teachers,
    updateTeacher,
    subjectQuotas,
    role,
  } = useApp();

  const isManagement = role === 'admin' || (role as string) === 'principal' || (role as string) === 'school_admin';

  // Selected teacher state: default to active logged-in teacher or first in list
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (activeTeacher?.id) return activeTeacher.id;
    return teachers[0]?.id || '';
  });

  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'agenda' | 'matrix'>('agenda');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [hideEmptySlots, setHideEmptySlots] = useState<boolean>(false);
  const [isEditingWorkingDays, setIsEditingWorkingDays] = useState<boolean>(false);
  const [tempWorkingDays, setTempWorkingDays] = useState<string[]>([]);
  const [showSaveDaysFeedback, setShowSaveDaysFeedback] = useState<boolean>(false);

  // Find the selected teacher object
  const currentTeacher = useMemo(() => {
    return (
      teachers.find((t) => t.id === selectedTeacherId) ||
      teachers.find((t) => isSameTeacher(t.name, activeTeacher?.name, teachers)) ||
      activeTeacher ||
      teachers[0]
    );
  }, [teachers, selectedTeacherId, activeTeacher]);

  const teacherName = currentTeacher?.name || 'الأستاذة';

  // Filter teachers list by search query
  const filteredTeachers = useMemo(() => {
    if (!teacherSearchQuery.trim()) return teachers;
    const q = teacherSearchQuery.trim().toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subject && t.subject.toLowerCase().includes(q))
    );
  }, [teachers, teacherSearchQuery]);

  // Teacher available/working days
  const workingDays = useMemo(() => {
    if (currentTeacher?.availableDays && currentTeacher.availableDays.length > 0) {
      return currentTeacher.availableDays;
    }
    return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  }, [currentTeacher]);

  // Compute full weekly schedule matrix & agenda for the selected teacher
  const scheduleReport = useMemo(() => {
    return getTeacherWeeklySchedule(timetable, teacherName, subjectQuotas, teachers);
  }, [timetable, teacherName, subjectQuotas, teachers]);

  const chronologicalAgenda = useMemo(() => {
    return getTeacherChronologicalAgenda(timetable, teacherName, subjectQuotas, teachers);
  }, [timetable, teacherName, subjectQuotas, teachers]);

  // Gather stats
  const totalWeeklyPeriods = scheduleReport.totalSlots;

  // Calculate assigned grades and sections for this teacher
  const assignedGradesAndSections = useMemo(() => {
    const map = new Map<string, Set<string>>();
    timetable.forEach((slot) => {
      if (
        slot.teacherName &&
        isSameTeacher(slot.teacherName, teacherName, teachers)
      ) {
        if (!map.has(slot.gradeLevel)) {
          map.set(slot.gradeLevel, new Set());
        }
        if (slot.section) {
          map.get(slot.gradeLevel)?.add(slot.section);
        }
      }
    });
    return Array.from(map.entries()).map(([grade, sections]) => ({
      grade,
      sections: Array.from(sections).sort(),
    }));
  }, [timetable, teacherName, teachers]);

  // Daily distribution count
  const dailyBreakdown = useMemo(() => {
    return WEEKDAY_LIST.map((day) => {
      const isWorking = workingDays.includes(day);
      const slots = timetable.filter(
        (s) =>
          s.day === day &&
          s.teacherName &&
          isSameTeacher(s.teacherName, teacherName, teachers)
      );
      return {
        day,
        isWorking,
        count: slots.length,
        slots,
      };
    });
  }, [timetable, teacherName, workingDays, teachers]);

  // Detect off-day lessons or collisions
  const scheduleIssues = useMemo(() => {
    const issues: { type: 'off_day' | 'collision'; message: string; slot: TimetableSlot }[] = [];

    WEEKDAY_LIST.forEach((day) => {
      const isWorking = workingDays.includes(day);
      PERIODS_TIMING.forEach((p) => {
        const matching = timetable.filter(
          (s) =>
            s.day === day &&
            s.period === p.period &&
            s.teacherName &&
            isSameTeacher(s.teacherName, teacherName, teachers)
        );

        if (matching.length > 1) {
          matching.forEach((slot) => {
            issues.push({
              type: 'collision',
              message: `تضارب حصص: أكثر من حصة في الحصة (${p.label}) يوم (${day})`,
              slot,
            });
          });
        }

        if (matching.length > 0 && !isWorking) {
          matching.forEach((slot) => {
            issues.push({
              type: 'off_day',
              message: `حصة مجدولة في يوم عطلة/تفرغ للأستاذ (${day} - ${p.label}: ${slot.subject})`,
              slot,
            });
          });
        }
      });
    });

    return issues;
  }, [timetable, teacherName, workingDays, teachers]);

  // Handle opening working days editor
  const handleOpenDaysEditor = () => {
    setTempWorkingDays([...workingDays]);
    setIsEditingWorkingDays(true);
  };

  // Toggle day in editor
  const handleToggleDay = (day: string) => {
    if (tempWorkingDays.includes(day)) {
      if (tempWorkingDays.length === 1) return; // Must have at least 1 day
      setTempWorkingDays(tempWorkingDays.filter((d) => d !== day));
    } else {
      setTempWorkingDays([...tempWorkingDays, day]);
    }
  };

  // Save working days
  const handleSaveWorkingDays = () => {
    if (currentTeacher?.id) {
      updateTeacher(currentTeacher.id, {
        availableDays: tempWorkingDays,
      });
      setIsEditingWorkingDays(false);
      setShowSaveDaysFeedback(true);
      setTimeout(() => setShowSaveDaysFeedback(false), 3000);
    }
  };

  // Subject color badge helper
  const getSubjectBadgeStyle = (subject: string) => {
    if (subject.includes('رياضيات')) return 'from-indigo-500/20 to-blue-500/20 text-indigo-200 border-indigo-500/40';
    if (subject.includes('فيزياء')) return 'from-cyan-500/20 to-teal-500/20 text-cyan-200 border-cyan-500/40';
    if (subject.includes('كيمياء')) return 'from-amber-500/20 to-orange-500/20 text-amber-200 border-amber-500/40';
    if (subject.includes('أحياء')) return 'from-emerald-500/20 to-teal-500/20 text-emerald-200 border-emerald-500/40';
    if (subject.includes('حاسوب') || subject.includes('برمجة') || subject.includes('ذكاء')) return 'from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/40';
    if (subject.includes('إنجليزي') || subject.includes('فرنسي')) return 'from-sky-500/20 to-blue-500/20 text-sky-200 border-sky-500/40';
    if (subject.includes('عربي') || subject.includes('إسلامية')) return 'from-emerald-600/20 to-green-600/20 text-emerald-200 border-emerald-500/40';
    return 'from-slate-800 to-slate-700 text-slate-200 border-slate-600';
  };

  // Days to display based on filter
  const displayedDays = selectedDayFilter === 'all'
    ? WEEKDAY_LIST
    : WEEKDAY_LIST.filter((d) => d === selectedDayFilter);

  const displayedAgenda = chronologicalAgenda.filter((item) =>
    selectedDayFilter === 'all' ? true : item.day === selectedDayFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-arabic">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-300 shadow-inner shrink-0">
              <CalendarDays className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  جدول الحصص الأسبوعي الموحد للأستاذ/ة
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>توزيع معتمد وفق أيام الدوام</span>
                </span>
                {scheduleIssues.length === 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>خالٍ من التضارب 100%</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                عرض شامل لحصص دروس المدرس المختار فقط، موزعة بالتفصيل على أيام الأسبوع والحصص الدراسية والمختبرات.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="طباعة الجدول الأسبوعي للأستاذ"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>طباعة الجدول</span>
            </button>

            {onOpenComprehensiveModal && (
              <button
                onClick={onOpenComprehensiveModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                title="فتح محرر ومولد الجداول الشامل"
              >
                <Maximize2 className="w-4 h-4" />
                <span>الجدول المدرسي الشامل 🗓️</span>
              </button>
            )}
          </div>
        </div>

        {/* Teacher Selection & Working Days Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Teacher Selector */}
          <div className="md:col-span-6 lg:col-span-5 flex items-center gap-2.5">
            <label className="text-xs font-bold text-slate-300 shrink-0 flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>اختر المدرس:</span>
            </label>
            <div className="relative flex-1">
              <select
                value={currentTeacher?.id || selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-teal-500/50 text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                {filteredTeachers.map((t) => {
                  const teacherSlotCount = timetable.filter((s) =>
                    isSameTeacher(s.teacherName, t.name, teachers)
                  ).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subject} ({teacherSlotCount} حصة)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Teacher Attendance / Working Days Badge Display & Quick Edit */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-wrap items-center justify-between md:justify-end gap-2 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <CalendarCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="font-bold">أيام الدوام المقررة:</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {WEEKDAY_LIST.map((day) => {
                const isWorking = workingDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
                      isWorking
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                        : 'bg-slate-900 text-slate-600 border border-slate-800/80 line-through'
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>

            {/* Edit Working Days Button */}
            <button
              onClick={handleOpenDaysEditor}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
              title="تعديل أيام تواجد ودوام الأستاذ/ة"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              <span>تعديل أيام الدوام</span>
            </button>
          </div>
        </div>

        {/* Working Days Editor Modal / Inline Drawer */}
        {isEditingWorkingDays && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>تحديد أيام الدوام الأسبوعية للأستاذ/ة: ({teacherName})</span>
              </div>
              <span className="text-[11px] text-slate-400">انقر على الأيام لتفعيلها أو تعطيلها كأيام تفرغ</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {WEEKDAY_LIST.map((day) => {
                const isSelected = tempWorkingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-200 border-teal-400 shadow-md'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono">تفرغ</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setIsEditingWorkingDays(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveWorkingDays}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حفظ أيام الدوام</span>
              </button>
            </div>
          </div>
        )}

        {/* Save feedback toast */}
        {showSaveDaysFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم تحديث أيام الدوام الأسبوعية المعتمدة للأستاذ/ة بنجاح وحفظها بالنظام.</span>
          </div>
        )}

        {/* Conflict / Issues Alerts Banner */}
        {scheduleIssues.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>تنبيهات الجدول الأسبوعي للمدرس ({scheduleIssues.length} تنبيه):</span>
            </div>
            <ul className="space-y-1 text-xs text-rose-200/90 list-disc list-inside">
              {scheduleIssues.map((issue, idx) => (
                <li key={idx}>
                  {issue.message} — {issue.slot.gradeLevel} (شعبة {issue.slot.section || 'أ'})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4 Summary Stat KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>إجمالي الحصص الأسبوعية:</span>
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono flex items-baseline gap-1.5">
              <span>{totalWeeklyPeriods}</span>
              <span className="text-xs text-amber-400 font-sans font-normal">حصة / أسبوع</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>أيام الدوام الفعلية:</span>
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono flex items-baseline gap-1.5">
              <span>{workingDays.length}</span>
              <span className="text-xs text-slate-400 font-sans font-normal">من 5 أيام</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>المادة والتخصص:</span>
              <Layers className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm font-black text-teal-300 truncate">
              {currentTeacher?.subject || 'متعدد المواد'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>سلامة التوزيع وعدم التضارب:</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-emerald-300 truncate">
              {scheduleIssues.length === 0
                ? 'خالٍ من أي تضارب بنسبة 100%'
                : `${scheduleIssues.length} ملاحظات تحتاج تسوية`}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
        {/* View Mode Toggle: Agenda vs Matrix */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>عرض الأجندة والتوزيع الزمني اليومي</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>مصفوفة الجدول الأسبوعي (5 أيام × 7 حصص)</span>
          </button>
        </div>

        {/* Days Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span>تصفية الأيام:</span>
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDayFilter === 'all'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              كامل الأسبوع
            </button>
            {WEEKDAY_LIST.map((day) => {
              const isWorking = workingDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedDayFilter === day
                      ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                      : isWorking
                      ? 'bg-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>{day}</span>
                  {!isWorking && <span className="text-[9px] text-slate-500">(تفرغ)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hide Empty Periods Toggle */}
        {viewMode === 'matrix' && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideEmptySlots}
              onChange={(e) => setHideEmptySlots(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 focus:ring-teal-400 bg-slate-950 w-4 h-4 cursor-pointer"
            />
            <span>إخفاء الحصص الشاغرة</span>
          </label>
        )}
      </div>

      {/* VIEW 1: Chronological Daily Agenda View (عرض التوزيع الزمني المتسلسل للأستاذ المختار) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {displayedAgenda.map((agendaDay) => {
            return (
              <div
                key={agendaDay.day}
                className={`rounded-3xl border transition-all p-5 shadow-lg space-y-4 ${
                  agendaDay.isWorkingDay
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/70 border-slate-900 opacity-80'
                }`}
              >
                {/* Day Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl text-xs font-black ${
                        agendaDay.isWorkingDay
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{agendaDay.day}</h3>
                      <div className="text-[11px] text-slate-400">
                        {agendaDay.isWorkingDay ? (
                          <span className="text-teal-300 font-bold">يوم دوام وتدريس معتمد</span>
                        ) : (
                          <span className="text-slate-500">يوم تفرغ / عطلة للأستاذ/ة</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 ${
                        agendaDay.lessons.length > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {agendaDay.lessons.length} {agendaDay.lessons.length === 1 ? 'حصة مجدولة' : 'حصص مجدولة'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Lessons List for this Day */}
                {agendaDay.lessons.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-1">
                    <Coffee className="w-6 h-6 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">
                      {agendaDay.isWorkingDay
                        ? 'لا توجد حصص مجدولة للأستاذ/ة في هذا اليوم (يوم فراغ شاغر).'
                        : 'يوم تفرغ معتمد للأستاذ/ة وفق خطة الدوام الأسبوعية.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {agendaDay.lessons.map((lesson, idx) => {
                      return (
                        <div
                          key={lesson.slotId || idx}
                          className={`p-4 rounded-2xl border transition-all shadow-md space-y-2.5 relative overflow-hidden bg-gradient-to-br ${getSubjectBadgeStyle(
                            lesson.subject
                          )}`}
                        >
                          {/* Top Period Badge & Time */}
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 text-amber-300 font-black text-xs border border-amber-500/30">
                                {lesson.label}
                              </span>
                              <span className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-teal-400" />
                                <span>{lesson.timeSlot}</span>
                              </span>
                            </div>

                            {lesson.hasCollision && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>تضارب!</span>
                              </span>
                            )}
                          </div>

                          {/* Subject Title */}
                          <div className="font-black text-white text-sm leading-snug">
                            {lesson.subject}
                          </div>

                          {/* Class & Section */}
                          <div className="flex items-center gap-1.5 text-xs text-teal-200 font-bold">
                            <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>
                              {lesson.gradeLevel} (شعبة {lesson.section})
                            </span>
                          </div>

                          {/* Room / Lab */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{lesson.room}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Main 5-Day Weekly Timetable Matrix (مصفوفة الجدول الأسبوعي الشامل للأستاذ) */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl p-3">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-teal-300 font-black border-b border-slate-800">
                <th className="p-3.5 border-r border-slate-800 text-center w-36 sticky right-0 z-10 bg-slate-900">
                  اليوم / حالة الدوام
                </th>
                {PERIODS_TIMING.map((period) => (
                  <th key={period.period} className="p-3.5 border-r border-slate-800 text-center min-w-[140px]">
                    <div className="text-white font-extrabold">{period.label}</div>
                    <div className="text-[10px] text-teal-400 font-mono font-normal mt-0.5">{period.timeSlot}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {displayedDays.map((day) => {
                const isWorkingDay = workingDays.includes(day);
                const daySlots = timetable.filter(
                  (s) =>
                    s.day === day &&
                    s.teacherName &&
                    isSameTeacher(s.teacherName, teacherName, teachers)
                );

                return (
                  <tr
                    key={day}
                    className={`transition-colors ${
                      isWorkingDay ? 'hover:bg-slate-900/40' : 'bg-slate-950/90 opacity-80'
                    }`}
                  >
                    {/* Day and Presence Column */}
                    <td className="p-3.5 border-r border-slate-800 text-center bg-slate-900/80 sticky right-0 z-10 space-y-1.5">
                      <div className="font-black text-white text-sm">{day}</div>
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isWorkingDay
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isWorkingDay ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            <span>يوم دوام ({daySlots.length} حصص)</span>
                          </>
                        ) : (
                          <>
                            <Coffee className="w-3 h-3 text-rose-400" />
                            <span>يوم تفرغ معتمد</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 7 Period Slots for this Day */}
                    {PERIODS_TIMING.map((p) => {
                      const matchingSlots = daySlots.filter((s) => s.period === p.period);
                      const hasCollision = matchingSlots.length > 1;
                      const isOffDayLesson = matchingSlots.length > 0 && !isWorkingDay;

                      if (hideEmptySlots && matchingSlots.length === 0) {
                        return (
                          <td key={p.period} className="p-2 border-r border-slate-800/60 text-center align-middle">
                            <span className="text-slate-700 text-xs">—</span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={p.period}
                          className={`p-2.5 border-r border-slate-800/80 align-top transition-all ${
                            hasCollision
                              ? 'bg-rose-950/60 ring-2 ring-rose-500/80'
                              : isOffDayLesson
                              ? 'bg-amber-950/40 ring-1 ring-amber-500/60'
                              : matchingSlots.length > 0
                              ? 'bg-slate-900/40'
                              : isWorkingDay
                              ? 'bg-transparent'
                              : 'bg-slate-950/50'
                          }`}
                        >
                          {matchingSlots.length === 0 ? (
                            <div className="h-20 rounded-2xl border border-dashed border-slate-800/70 flex flex-col items-center justify-center p-2 text-center">
                              {isWorkingDay ? (
                                <span className="text-[11px] text-slate-500 font-bold">شاغر / فراغ</span>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                                  <Coffee className="w-3 h-3 text-slate-600" />
                                  <span>تفرغ</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {matchingSlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`p-3 rounded-2xl border transition-all shadow-md space-y-1.5 ${
                                    hasCollision
                                      ? 'bg-rose-900/60 border-rose-500 text-white'
                                      : isOffDayLesson
                                      ? 'bg-amber-900/50 border-amber-500 text-amber-100'
                                      : `bg-gradient-to-br ${getSubjectBadgeStyle(slot.subject)}`
                                  }`}
                                >
                                  {/* Subject Title */}
                                  <div className="font-black text-white text-xs leading-snug flex items-center justify-between gap-1">
                                    <span>{slot.subject}</span>
                                    <span className="text-[10px] text-amber-300 font-mono font-bold bg-slate-950/60 px-1.5 py-0.5 rounded">
                                      {p.label}
                                    </span>
                                  </div>

                                  {/* Grade Level & Section */}
                                  <div className="text-[11px] font-bold text-teal-200 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-teal-400 shrink-0" />
                                    <span className="truncate">
                                      {slot.gradeLevel} (شعبة {slot.section || 'أ'})
                                    </span>
                                  </div>

                                  {/* Classroom / Lab */}
                                  <div className="text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                                    <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">{slot.room || 'قاعة المتميزات'}</span>
                                  </div>
                                </div>
                              ))}

                              {/* Collision Warning Box */}
                              {hasCollision && (
                                <div className="p-1.5 rounded-lg bg-rose-950 border border-rose-500 text-[10px] font-black text-rose-300 text-center flex items-center justify-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>تضارب حصص متزامنة!</span>
                                </div>
                              )}

                              {/* Off Day Warning Box */}
                              {isOffDayLesson && (
                                <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-500 text-[10px] font-black text-amber-300 text-center flex items-center justify-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>حصة في يوم تفرغ</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Daily Breakdown and Assigned Curricula Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Load Distribution Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-white border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>توزيع الحصص على أيام الأسبوع:</span>
          </div>

          <div className="space-y-2.5">
            {dailyBreakdown.map((item) => (
              <div
                key={item.day}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">{item.day}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.isWorking
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {item.isWorking ? 'يوم دوام' : 'يوم تفرغ'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-amber-300">
                    {item.count} {item.count === 1 ? 'حصة' : 'حصص'}
                  </span>
                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min((item.count / 7) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Classes and Sections Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-white border-b border-slate-800 pb-3">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>الصفوف والشعب الموكلة للأستاذ/ة:</span>
          </div>

          {assignedGradesAndSections.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              لم يتم جدولة أي حصص للأستاذ/ة في الجدول المدرسي الحالي بعد.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedGradesAndSections.map((item) => (
                <div
                  key={item.grade}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">{item.grade}</span>
                    <span className="text-[11px] text-teal-300 font-bold">
                      {item.sections.length > 0
                        ? `الشعب: ${item.sections.map((s) => `شعبة ${s}`).join('، ')}`
                        : 'جميع الشعب'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              يتم تحديث هذا الجدول آلياً فور تعديل أو إعادة توليد الجدول المدرسي الشامل من قبل إدارة ثانوية ميسان للمتميزات.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
