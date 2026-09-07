/**
 * Student Promotion & Year Migration Modal
 * نظام ترحيل ونقل الطالبات بين الصفوف والترقية الأكاديمية
 * ثانوية ميسان للمتميزات
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_GRADES_LIST, GradeLevel, getNextGradeLevel } from '../types';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw,
  Sparkles,
  UserCheck,
  Search,
  Filter,
  ShieldCheck,
  X,
  Crown,
  ChevronLeft,
  BookOpen,
  Info,
} from 'lucide-react';

interface StudentPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, promoteStudents, lang } = useApp();

  const [academicYearFrom, setAcademicYearFrom] = useState('2026/2027');
  const [academicYearTo, setAcademicYearTo] = useState('2027/2028');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoAddGraduates, setAutoAddGraduates] = useState(true);

  // Manual overrides per studentId: 'pass' | 'fail'
  const [overrides, setOverrides] = useState<Record<string, 'pass' | 'fail'>>({});

  // Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    promotedCount: number;
    graduatedCount: number;
    retainedCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesGrade = selectedGradeFilter === 'ALL' || s.gradeLevel === selectedGradeFilter;
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.section.includes(searchQuery) ||
      (s.notes && s.notes.includes(searchQuery));
    return matchesGrade && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: students.length,
    passing: students.filter((s) => {
      const ov = overrides[s.id];
      return ov ? ov === 'pass' : s.gpa >= 50 && s.status !== 'محظورة';
    }).length,
    failing: students.filter((s) => {
      const ov = overrides[s.id];
      return ov ? ov === 'fail' : s.gpa < 50 || s.status === 'محظورة';
    }).length,
    grade6Count: students.filter((s) => s.gradeLevel === 'الصف السادس العلمي').length,
  };

  const handleToggleOverride = (studentId: string, currentIsPass: boolean) => {
    setOverrides((prev) => ({
      ...prev,
      [studentId]: currentIsPass ? 'fail' : 'pass',
    }));
  };

  const handleExecutePromotion = () => {
    const res = promoteStudents({
      academicYearFrom,
      academicYearTo,
      overrides,
      autoAddGraduatesToHome: autoAddGraduates,
    });
    setResultSummary(res);
    setIsConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>نظام ترحيل ونقل الطالبات بين الصفوف الدراسية</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-extrabold">
                  العام الدراسي الجديد 🎓
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                ترحيل الطالبات الناجحات إلى الصف الأعلى، الإبقاء على الراسبات، ونقل الخريجات تلقائياً إلى سجل الخريجون
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
          
          {/* Result Success Banner */}
          {resultSummary && (
            <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-base font-extrabold">
                <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0" />
                <span>تم تنفيذ الترحيل الأكاديمي الشامل بنجاح!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
                  <span className="block text-slate-500 dark:text-slate-400">الطالبات المرحلات لصف أعلى</span>
                  <span className="text-lg font-black text-teal-600 dark:text-teal-300">{resultSummary.promotedCount} طالبة</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="block text-slate-500 dark:text-slate-400">خريجات الصف السادس العلمي</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-300">{resultSummary.graduatedCount} خريجة</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <span className="block text-slate-500 dark:text-slate-400">الباقيات في نفس الصف (رسوب/إكمال)</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-300">{resultSummary.retainedCount} طالبة</span>
                </div>
              </div>
              <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold text-center pt-1">
                تم تحديث الصفوف الدراسية في النظام وتمت إضافة الخريجات إلى صفحة "الخريجون" في الشاشة الرئيسية.
              </p>
            </div>
          )}

          {/* Academic Year Settings & Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                العام الدراسي الحالي (من):
              </label>
              <input
                type="text"
                value={academicYearFrom}
                onChange={(e) => setAcademicYearFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                العام الدراسي الجديد (إلى):
              </label>
              <input
                type="text"
                value={academicYearTo}
                onChange={(e) => setAcademicYearTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={autoAddGraduates}
                  onChange={(e) => setAutoAddGraduates(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  إضافة الناجحات من السادس تلقائياً لصفحة الخريجون 🎓
                </span>
              </label>
            </div>
          </div>

          {/* Progression Guide Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>خريطة الترحيل التلقائي للناجحات:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">1 متوسط ⬅ 2 متوسط</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">⬅</span>
              <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">2 متوسط ⬅ 3 متوسط</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">⬅</span>
              <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">3 متوسط ⬅ 4 علمي</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">⬅</span>
              <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">4 علمي ⬅ 5 علمي</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">⬅</span>
              <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">5 علمي ⬅ 6 علمي</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">⬅</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black">6 علمي ⬅ تخرج 🎓</span>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">مجموع الطالبات</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center">
              <span className="block text-[11px] font-bold text-teal-700 dark:text-teal-300">مؤهلات للترحيل (ناجحة)</span>
              <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">{stats.passing}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
              <span className="block text-[11px] font-bold text-rose-700 dark:text-rose-300">مكملة/راسبة (تظل بالصف)</span>
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{stats.failing}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
              <span className="block text-[11px] font-bold text-amber-800 dark:text-amber-300">طالبات السادس (الخريجات)</span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.grade6Count}</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            {/* Grade Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedGradeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGradeFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                جميع الصفوف ({students.length})
              </button>
              {ALL_GRADES_LIST.map((grade) => {
                const count = students.filter((s) => s.gradeLevel === grade).length;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGradeFilter(grade)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedGradeFilter === grade
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {grade} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم الطالبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

          </div>

          {/* Student Review Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">اسم الطالبة</th>
                    <th className="p-3">الصف الحالي</th>
                    <th className="p-3">الشعبة</th>
                    <th className="p-3 text-center">المعدل</th>
                    <th className="p-3 text-center">النتيجة الحالية</th>
                    <th className="p-3 text-center">الصف الجديد بعد الترحيل</th>
                    <th className="p-3 text-center">الإجراء المباشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        لا توجد طالبات مطابقة للبحث أو الفلتر المSelected.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const override = overrides[std.id];
                      const isPassed = override ? override === 'pass' : std.gpa >= 50 && std.status !== 'محظورة';
                      const nextGrade = getNextGradeLevel(std.gradeLevel);

                      return (
                        <tr
                          key={std.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            !isPassed ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <img
                              src={std.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={std.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                            />
                            <span>{std.name}</span>
                          </td>

                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                            {std.gradeLevel}
                          </td>

                          <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                            شعبة ({std.section})
                          </td>

                          <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                            {std.gpa}%
                          </td>

                          <td className="p-3 text-center">
                            {isPassed ? (
                              <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-extrabold text-[11px] border border-teal-300">
                                ناجحة ✓
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-[11px] border border-rose-300">
                                مكملة / راسبة ✗
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center font-extrabold">
                            {isPassed ? (
                              nextGrade === 'GRADUATED' ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                                  تخرج إلى الخريجون 🎓
                                </span>
                              ) : (
                                <span className="text-indigo-700 dark:text-indigo-300">
                                  {nextGrade}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500 line-through">
                                البقاء في ({std.gradeLevel})
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleOverride(std.id, isPassed)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-xs ${
                                isPassed
                                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                  : 'bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
                              }`}
                            >
                              {isPassed ? 'تغيير إلى: عدم ترحيل (رسوب)' : 'تغيير إلى: ترحيل (نجاح)'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="p-5 rounded-2xl bg-indigo-900 text-white space-y-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>جاهز لتطبيق الترحيل للعام الدراسي الجديد؟</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </h3>
              <p className="text-xs text-indigo-200">
                سيؤدي الضغط على الزر إلى تحديث صفوف جميع الطالبات المستحقات وتحويل طالبات السادس الناجحات إلى سجل الخريجات.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-400/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تنفيذ الترحيل السنوي الشامل 🚀</span>
            </button>
          </div>

        </div>

        {/* Confirmation Modal Overlay */}
        {isConfirming && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-20 animate-in fade-in">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                تأكيد تنفيذ الترحيل الأكاديمي العام
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                هل أنت متأكد من ترحيل <strong className="text-indigo-600">{stats.passing} طالبة</strong> إلى الصفوف العليا ونقل طالبات السادس الناجحات إلى صفحة الخريجات للعام الدراسي ({academicYearFrom})؟
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExecutePromotion}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  نعم، نفذ الترحيل الآن
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
