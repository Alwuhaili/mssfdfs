import React, { useMemo, useState } from 'react';
import { AlertTriangle, GraduationCap, History, X, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_GRADES_LIST } from '../types';
import {
  type AccelerationAttempt,
  type AccelerationPolicy,
  type AcademicEnrollment,
} from '../types/academicHistory';
import { getStudentEnrollmentsWithLegacyFallback } from '../services/academicHistoryService';
import { createAccelerationAttempt, evaluateAccelerationEligibility } from '../services/accelerationService';

interface AcademicHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  enrollments?: AcademicEnrollment[];
  policies?: AccelerationPolicy[];
  attempts?: AccelerationAttempt[];
  onNominateAttempt?: (attempt: AccelerationAttempt) => Promise<void> | void;
}

export const AcademicHistoryModal: React.FC<AcademicHistoryModalProps> = ({
  isOpen,
  onClose,
  studentId,
  enrollments = [],
  policies = [],
  attempts = [],
  onNominateAttempt,
}) => {
  const {
    students,
    certificates,
    currentUser,
    executeStudentRepeatYear,
    executeStudentRegularPromotion,
    executeStudentAccelerationPromotion,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');

  const student = students.find((row) => row.id === studentId);
  const merged = useMemo(
    () => getStudentEnrollmentsWithLegacyFallback(enrollments, certificates, studentId),
    [enrollments, certificates, studentId]
  );
  const current = merged.find((row) => row.id === (student as { currentEnrollmentId?: string } | undefined)?.currentEnrollmentId);
  const studentAttempts = attempts.filter((row) => row.studentId === studentId);

  if (!isOpen) return null;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await fn();
      const payload = result as { success?: boolean; message?: string; code?: string };
      if (payload && payload.success === false) {
        setMessage(payload.message || payload.code || 'تعذر تنفيذ العملية');
      } else {
        setMessage('تم تنفيذ العملية الموثّقة.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تنفيذ العملية');
    } finally {
      setBusy(false);
    }
  };

  const handleNominate = async () => {
    if (!current || current.isDerived) {
      setMessage('الترشيح يتطلب قيداً موثّقاً حالياً، وليس سجلاً مشتقاً.');
      return;
    }
    const policy = policies.find((row) => row.id === selectedPolicyId);
    if (!policy) {
      setMessage('اختر سياسة تسريع محفوظة دون قيم افتراضية.');
      return;
    }
    const certificate = certificates.find((row) => row.id === current.certificateId)
      || certificates.find((row) => row.studentId === studentId && row.gradeLevel === current.gradeLevel);
    const eligibility = evaluateAccelerationEligibility(policy, certificate, current);
    if (eligibility.incomplete || !eligibility.eligible) {
      setMessage(eligibility.reasons.join(' ') || 'السياسة أو بيانات الدرجات غير مكتملة.');
      return;
    }
    try {
      const attempt = createAccelerationAttempt({
        studentId,
        sourceEnrollment: current,
        policy,
      });
      if (!onNominateAttempt) {
        setMessage('حفظ الترشيح غير موصول بعد. لم يُنشأ انتقال موثّق.');
        return;
      }
      await onNominateAttempt(attempt);
      setMessage('تم إنشاء الترشيح من بيانات السياسة فقط. الترفيع عملية منفصلة.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر الترشيح');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" dir="rtl">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <History className="h-5 w-5 text-indigo-600" />
              السجل الأكاديمي
            </h2>
            <p className="text-sm text-slate-500">{student?.name || studentId}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            القيود المشتقة من الشهادات تظهر بوضوح ولا تُستخدم كمصدر ترفيع. إنشاء قيد سابق يدوي معطّل في هذه المرحلة.
          </p>

          <section>
            <h3 className="mb-3 font-bold text-slate-800">القيود</h3>
            <div className="space-y-2">
              {merged.length === 0 && (
                <p className="text-sm text-slate-500">لا يوجد قيد موثّق أو شهادة قابلة للاشتقاق لهذه الطالبة.</p>
              )}
              {merged.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{row.gradeLevel}</strong>
                    <span className="text-xs text-slate-500">{row.academicYear}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span>محاولة {row.attemptNumber}</span>
                    <span>{row.enrollmentType}</span>
                    <span>{row.finalResult}</span>
                    {row.isDerived && <span className="rounded bg-slate-800 px-2 py-0.5 text-white">مشتق / derived</span>}
                    {current?.id === row.id && <span className="rounded bg-emerald-700 px-2 py-0.5 text-white">حالي</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              disabled={busy || !current || current.isDerived}
              onClick={() => run(() => executeStudentRepeatYear({ studentId, actorId: currentUser?.id }))}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              إعادة السنة (موثّق)
            </button>
            <button
              type="button"
              disabled={busy || !current || current.isDerived}
              onClick={() => run(() => executeStudentRegularPromotion({ studentId, actorId: currentUser?.id }))}
              className="rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              <GraduationCap className="ml-1 inline h-4 w-4" />
              ترفيع نظامي (موثّق)
            </button>
            <button
              type="button"
              disabled={busy || studentAttempts.every((row) => row.status !== 'eligible' && row.status !== 'approved')}
              onClick={() => {
                const attempt = studentAttempts.find((row) => row.status === 'eligible')
                  || studentAttempts.find((row) => row.status === 'approved');
                if (!attempt) return;
                run(() => executeStudentAccelerationPromotion({ studentId, attemptId: attempt.id, actorId: currentUser?.id }));
              }}
              className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              <Zap className="ml-1 inline h-4 w-4" />
              ترفيع تسريع (موثّق)
            </button>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-slate-800">ترشيح تسريع من سياسة محفوظة</h3>
            <div className="flex flex-col gap-3 md:flex-row">
              <select
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedPolicyId}
                onChange={(event) => setSelectedPolicyId(event.target.value)}
              >
                <option value="">بدون اختيار افتراضي</option>
                {policies
                  .filter((policy) => !current || policy.gradeLevel === current.gradeLevel)
                  .map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name} — امتحان: {policy.targetExamGradeLevel} — ناتج: {policy.resultingGradeLevel}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => void handleNominate()}
                className="rounded-xl border border-violet-300 px-4 py-2 text-sm font-bold text-violet-800"
              >
                ترشيح وفق السياسة
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              صف الامتحان يؤخذ من policy.targetExamGradeLevel فقط. لا تُدرج درجات امتحان وهمية هنا.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-slate-800">محاولات التسريع</h3>
            {studentAttempts.length === 0 && <p className="text-sm text-slate-500">لا محاولات محفوظة.</p>}
            {studentAttempts.map((attempt) => (
              <div key={attempt.id} className="mb-2 rounded-2xl border border-violet-100 px-4 py-3 text-xs">
                <div>الحالة: {attempt.status} / النتيجة: {attempt.finalResult}</div>
                <div>مصدر: {attempt.sourceGradeLevel}</div>
                <div>امتحان: {attempt.targetExamGradeLevel}</div>
                <div>ناتج: {attempt.resultingGradeLevel}</div>
              </div>
            ))}
          </section>

          {message && (
            <p className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </p>
          )}
          <p className="text-[11px] text-slate-400">الصفوف المعروفة في النظام: {ALL_GRADES_LIST.join('، ')}</p>
        </div>
      </div>
    </div>
  );
};
