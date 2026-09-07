import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Zap,
  Trash2,
  Plus,
  ShieldCheck,
  User,
  School,
  GraduationCap,
} from 'lucide-react';
import { StudentCertificate, SubjectGrade, UserRole } from '../types';
import { useApp } from '../context/AppContext';

interface StudentManualGradesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificate | null;
  onSaved?: (updatedCert: StudentCertificate) => void;
  onDeleteCertificate?: (cert: StudentCertificate) => void;
}

export const StudentManualGradesEditorModal: React.FC<StudentManualGradesEditorModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onSaved,
  onDeleteCertificate,
}) => {
  const { batchUpdateStudentGrades, decisionSettings, role } = useApp();

  const [localSubjects, setLocalSubjects] = useState<SubjectGrade[]>([]);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (certificate) {
      // Clone subjects deep copy
      setLocalSubjects(
        certificate.subjects.map((sub) => ({
          ...sub,
          firstTermAvg: sub.firstTermAvg || 0,
          midYearGrade: sub.midYearGrade || 0,
          secondTermAvg: sub.secondTermAvg || 0,
          finalExamGrade: sub.finalExamGrade || 0,
          decisionMarks: sub.decisionMarks || 0,
          resitGrade: sub.resitGrade ?? null,
        }))
      );
    }
  }, [certificate]);

  // Compute live temporary metrics
  const liveComputed = useMemo(() => {
    if (!localSubjects || localSubjects.length === 0) {
      return {
        subjects: [],
        overallAnnualSaei: 0,
        overallFinalGrade: 0,
        overallPostResit: 0,
        status: 'مؤجلة',
        appreciation: '-',
        isGeneralExemption: false,
        hasAnyGrades: false,
      };
    }

    const hasAnyGrades = localSubjects.some(
      (s) =>
        (s.firstTermAvg && s.firstTermAvg > 0) ||
        (s.midYearGrade && s.midYearGrade > 0) ||
        (s.secondTermAvg && s.secondTermAvg > 0) ||
        (s.finalExamGrade && s.finalExamGrade > 0)
    );

    const count = localSubjects.length;
    const maxResit = decisionSettings?.maxResitSubjects ?? 3;
    const passThreshold = decisionSettings?.minPassingGrade ?? 50;

    const tempSubjects = localSubjects.map((sub) => {
      const first = Number(sub.firstTermAvg) || 0;
      const mid = Number(sub.midYearGrade) || 0;
      const second = Number(sub.secondTermAvg) || 0;
      const annualSaeiAvg = Math.round((first + mid + second) / 3);
      return { ...sub, annualSaeiAvg };
    });

    const overallAnnualSaeiAvg = count > 0
      ? Number((tempSubjects.reduce((acc, s) => acc + s.annualSaeiAvg, 0) / count).toFixed(1))
      : 0;

    const minAnnualSaei = tempSubjects.length > 0 ? Math.min(...tempSubjects.map((s) => s.annualSaeiAvg)) : 0;
    const isGeneralExemption = hasAnyGrades && overallAnnualSaeiAvg >= 85 && minAnnualSaei >= 75;

    const processedSubjects = tempSubjects.map((sub) => {
      let isExempt = false;
      let exemptionType: 'general' | 'individual' | 'none' = 'none';
      const finalExam = Number(sub.finalExamGrade) || 0;
      const rawFinalGrade = Math.round((sub.annualSaeiAvg + finalExam) / 2);

      if (hasAnyGrades) {
        if (isGeneralExemption) {
          isExempt = true;
          exemptionType = 'general';
        } else if (sub.annualSaeiAvg >= 90) {
          isExempt = true;
          exemptionType = 'individual';
        }
      }

      const baseFinalGrade = isExempt ? sub.annualSaeiAvg : rawFinalGrade;
      const decMarks = Math.max(0, Number(sub.decisionMarks) || 0);
      const finalGrade = Math.min(100, baseFinalGrade + decMarks);

      const postResitGrade =
        sub.resitGrade !== undefined && sub.resitGrade !== null
          ? Math.min(100, Math.round((sub.annualSaeiAvg + Number(sub.resitGrade)) / 2) + decMarks)
          : finalGrade;

      return {
        ...sub,
        annualSaeiAvg: sub.annualSaeiAvg,
        finalGrade,
        postResitGrade,
        isExempt,
        exemptionType,
        decisionMarks: decMarks,
      };
    });

    if (!hasAnyGrades) {
      return {
        subjects: processedSubjects,
        overallAnnualSaei: 0,
        overallFinalGrade: 0,
        overallPostResit: 0,
        status: 'مؤجلة (نموذج فارغ)',
        appreciation: '-',
        isGeneralExemption: false,
        hasAnyGrades: false,
      };
    }

    const failedFirstRound = processedSubjects.filter((s) => s.finalGrade < passThreshold);
    const failedSecondRound = processedSubjects.filter((s) => (s.postResitGrade ?? s.finalGrade) < passThreshold);

    let status = 'ناجحة';
    if (failedFirstRound.length === 0) {
      status = 'ناجحة';
    } else if (failedFirstRound.length <= maxResit) {
      if (failedSecondRound.length === 0 && processedSubjects.some((s) => s.resitGrade !== null && s.resitGrade !== undefined)) {
        status = 'ناجحة بالدور الثاني';
      } else {
        status = `مكملة (${failedFirstRound.length} دروس)`;
      }
    } else {
      status = `راسبة (${failedFirstRound.length} دروس)`;
    }

    const overallFinalGrade = Number(
      (processedSubjects.reduce((acc, s) => acc + s.finalGrade, 0) / count).toFixed(1)
    );
    const overallPostResit = Number(
      (processedSubjects.reduce((acc, s) => acc + (s.postResitGrade ?? s.finalGrade), 0) / count).toFixed(1)
    );

    let appreciation = '-';
    if (!status.includes('مكمل') && !status.includes('راسب')) {
      if (overallPostResit >= 90) appreciation = 'امتياز';
      else if (overallPostResit >= 80) appreciation = 'جيد جداً';
      else if (overallPostResit >= 70) appreciation = 'جيد';
      else if (overallPostResit >= 60) appreciation = 'متوسط';
      else if (overallPostResit >= 50) appreciation = 'مقبول';
      else appreciation = 'دون المستوى';
    }

    return {
      subjects: processedSubjects,
      overallAnnualSaei: overallAnnualSaeiAvg,
      overallFinalGrade,
      overallPostResit,
      status,
      appreciation,
      isGeneralExemption,
      hasAnyGrades: true,
    };
  }, [localSubjects, decisionSettings]);

  if (!isOpen || !certificate) return null;

  const handleInputChange = (
    index: number,
    field: 'firstTermAvg' | 'midYearGrade' | 'secondTermAvg' | 'finalExamGrade' | 'decisionMarks' | 'resitGrade',
    value: string
  ) => {
    setLocalSubjects((prev) => {
      const next = [...prev];
      const target = { ...next[index] };

      if (field === 'resitGrade') {
        target.resitGrade = value === '' ? null : Math.min(100, Math.max(0, Number(value)));
      } else if (field === 'decisionMarks') {
        target.decisionMarks = value === '' ? 0 : Math.min(10, Math.max(0, Number(value)));
      } else {
        target[field] = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
      }

      next[index] = target;
      return next;
    });
  };

  const handleClearAllGrades = () => {
    if (confirm('هل أنت متأكد من تفريغ جميع درجات المواد وجعل النموذج فارغاً تماماً؟')) {
      setLocalSubjects((prev) =>
        prev.map((sub) => ({
          ...sub,
          firstTermAvg: 0,
          midYearGrade: 0,
          secondTermAvg: 0,
          finalExamGrade: 0,
          annualSaeiAvg: 0,
          finalGrade: 0,
          resitGrade: null,
          postResitGrade: 0,
          decisionMarks: 0,
          isExempt: false,
          exemptionType: 'none',
        }))
      );
    }
  };

  const handleFillSampleGrades = () => {
    setLocalSubjects((prev) =>
      prev.map((sub, idx) => {
        const base = 85 + (idx % 12);
        return {
          ...sub,
          firstTermAvg: base,
          midYearGrade: base + 2,
          secondTermAvg: base + 1,
          finalExamGrade: base + 3,
          annualSaeiAvg: base + 1,
          finalGrade: base + 2,
          resitGrade: null,
          postResitGrade: base + 2,
          decisionMarks: 0,
        };
      })
    );
  };

  const handleSave = () => {
    batchUpdateStudentGrades(certificate.id, liveComputed.subjects);
    setIsSavedToast(true);
    if (onSaved) {
      onSaved({
        ...certificate,
        subjects: liveComputed.subjects,
        overallAnnualSaeiAvg: liveComputed.overallAnnualSaei,
        overallFinalGrade: liveComputed.overallFinalGrade,
        overallPostResitAvg: liveComputed.overallPostResit,
        status: (liveComputed.status.includes('ناجحة') ? (liveComputed.status.includes('دور ثاني') ? 'ناجحة بالدور الثاني' : 'ناجحة') : liveComputed.status.includes('مكمل') ? 'مكملة' : liveComputed.status.includes('راسب') ? 'راسبة' : 'مؤجلة') as any,
        appreciation: liveComputed.appreciation,
      });
    }

    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-fadeIn print:hidden">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden text-slate-800 relative">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  إدخال وتعديل درجات الطالبة: <span className="text-amber-300">{certificate.studentName}</span>
                </h2>
                <span className="bg-indigo-700/60 border border-indigo-400/30 text-indigo-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {certificate.gradeLevel} - شعبة ({certificate.section || 'أ'})
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {certificate.nationalId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                جدول إدخال الدرجات الفصلي والنهائي المباشر مع احتساب تلقائي للسعي السنوي والإعفاء ودرجات القرار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>حفظ واحتساب النتيجة ✅</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Summary Ribbon */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">حالة النتيجة الحالية:</span>
              <span
                className={`px-3 py-1 rounded-full font-black text-xs ${
                  liveComputed.status.includes('ناجحة')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : liveComputed.status.includes('مكمل')
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : liveComputed.status.includes('راسب')
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {liveComputed.status}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">معدل السعي السنوي:</span>
              <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-sm">
                {liveComputed.overallAnnualSaei}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">المعدل النهائي:</span>
              <span className="font-black text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 text-sm">
                {liveComputed.overallPostResit || liveComputed.overallFinalGrade}%
              </span>
            </div>

            {liveComputed.isGeneralExemption && (
              <span className="bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-xs">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>إعفاء عام معتمد</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAllGrades}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-bold text-xs transition cursor-pointer"
              title="تفريغ جميع الحقول لجعل الشهادة فارغة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ الحقول (فارغة)</span>
            </button>

            <button
              type="button"
              onClick={handleFillSampleGrades}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 font-bold text-xs transition cursor-pointer"
              title="تعبئة درجات تقديرية نموذجية"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>تعبئة درجات تقديرية</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Grade Entry Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">ت</th>
                  <th className="p-3.5 border-b border-slate-800">اسم المادة الدراسية</th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-indigo-950/60">
                    معدل الفصل الأول (100)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-indigo-950/60">
                    درجة نصف السنة (100)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-indigo-950/60">
                    معدل الفصل الثاني (100)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-emerald-950 font-black text-amber-300">
                    معدل السعي السنوي
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-slate-950">
                    الامتحان النهائي (دور 1)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-indigo-950 font-black">
                    الدرجة النهائية
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-teal-950 text-amber-300 font-bold">
                    درجة القرار (+)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-amber-950">
                    درجة الإكمال (دور 2)
                  </th>
                  <th className="p-3.5 border-b border-slate-800 text-center bg-emerald-950 font-black">
                    ما بعد الإكمال
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {liveComputed.subjects.map((sub, idx) => (
                  <tr key={sub.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{sub.subjectName}</span>
                      {sub.isExempt && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-black">
                          معفو
                        </span>
                      )}
                    </td>

                    {/* First Term Avg */}
                    <td className="p-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.firstTermAvg === 0 ? '' : sub.firstTermAvg}
                        placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'firstTermAvg', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </td>

                    {/* Mid Year Grade */}
                    <td className="p-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.midYearGrade === 0 ? '' : sub.midYearGrade}
                        placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'midYearGrade', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </td>

                    {/* Second Term Avg */}
                    <td className="p-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.secondTermAvg === 0 ? '' : sub.secondTermAvg}
                        placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'secondTermAvg', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </td>

                    {/* Annual Saei Avg (Computed Live) */}
                    <td className="p-2 text-center bg-emerald-50/60 font-black text-emerald-900">
                      {sub.annualSaeiAvg > 0 ? sub.annualSaeiAvg : '-'}
                    </td>

                    {/* Final Exam Grade */}
                    <td className="p-2 text-center">
                      {sub.isExempt ? (
                        <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2 py-1 rounded-md text-xs">
                          معفى
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={sub.finalExamGrade === 0 ? '' : sub.finalExamGrade}
                          placeholder="0"
                          onChange={(e) => handleInputChange(idx, 'finalExamGrade', e.target.value)}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      )}
                    </td>

                    {/* Final Grade (Computed Live) */}
                    <td
                      className={`p-2 text-center font-black ${
                        sub.finalGrade >= 50
                          ? 'text-indigo-900 bg-indigo-50/50'
                          : sub.finalGrade > 0
                          ? 'text-red-600 bg-rose-50 underline decoration-red-600 decoration-2 underline-offset-2'
                          : 'text-slate-400'
                      }`}
                    >
                      {sub.finalGrade > 0 ? sub.finalGrade : '-'}
                    </td>

                    {/* Decision Marks */}
                    <td className="p-2 text-center bg-teal-50/30">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={sub.decisionMarks === 0 ? '' : sub.decisionMarks}
                        placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'decisionMarks', e.target.value)}
                        className="w-14 px-1.5 py-1.5 border border-teal-300 bg-teal-50 text-teal-950 rounded-lg text-center font-black text-xs"
                      />
                    </td>

                    {/* Resit Grade (الدور الثاني) */}
                    <td className="p-2 text-center bg-amber-50/40">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.resitGrade === null || sub.resitGrade === undefined ? '' : sub.resitGrade}
                        placeholder="دور 2"
                        onChange={(e) => handleInputChange(idx, 'resitGrade', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-amber-300 bg-amber-50/80 text-amber-950 rounded-lg text-center font-black text-xs"
                      />
                    </td>

                    {/* Post Resit Grade */}
                    <td className="p-2 text-center font-black text-emerald-800 bg-emerald-50/40">
                      {sub.postResitGrade && sub.postResitGrade > 0 ? sub.postResitGrade : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {role === 'admin' && onDeleteCertificate && certificate && (
              <button
                type="button"
                onClick={() => onDeleteCertificate(certificate)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer"
                title="حذف هذه الشهادة نهائياً"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف الشهادة 🗑️</span>
              </button>
            )}
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              * اضغط زر "حفظ واحتساب النتيجة" لتحديث الشهادة وحفظها في قاعدة البيانات فوراً.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>حفظ التعديلات والدرجات ✅</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
