import React, { useState } from 'react';
import { Save, Shield, X } from 'lucide-react';
import { ALL_GRADES_LIST, type GradeLevel } from '../types';
import {
  type AccelerationExamKind,
  type AccelerationPolicy,
  type SubjectGradeSource,
} from '../types/academicHistory';
import { assertPolicyDeletable, buildCanonicalPolicyRecord } from '../services/accelerationService';
import type { AccelerationAttempt } from '../types/academicHistory';

interface AccelerationPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies?: AccelerationPolicy[];
  attempts?: AccelerationAttempt[];
  onSavePolicy?: (policy: AccelerationPolicy) => Promise<void> | void;
  onDeletePolicy?: (policyId: string) => Promise<void> | void;
}

const EMPTY_FORM = {
  name: '',
  academicYear: '',
  gradeLevel: '' as GradeLevel | '',
  targetExamGradeLevel: '' as GradeLevel | '',
  resultingGradeLevel: '' as GradeLevel | '',
  requiredFinalAverage: '',
  minSubjectGrade: '',
  subjectGradeMode: '' as '' | 'uniform' | 'composite',
  baselineMinimum: '',
  exceptionMinimum: '',
  maxExceptionSubjects: '',
  subjectGradeSource: '' as SubjectGradeSource | '',
  aptitudePassingScore: '',
  achievementPassingScore: '',
  ministerialPassingGrade: '',
  requiredExams: [] as AccelerationExamKind[],
  ministerialExamSubjectsText: '',
  sourceReference: '',
};

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export const AccelerationPoliciesModal: React.FC<AccelerationPoliciesModalProps> = ({
  isOpen,
  onClose,
  policies = [],
  attempts = [],
  onSavePolicy,
  onDeletePolicy,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const toggleExam = (kind: AccelerationExamKind) => {
    setForm((prev) => ({
      ...prev,
      requiredExams: prev.requiredExams.includes(kind)
        ? prev.requiredExams.filter((item) => item !== kind)
        : [...prev.requiredExams, kind],
    }));
  };

  const handleSave = async () => {
    setMessage('');
    try {
      if (!form.gradeLevel || !form.targetExamGradeLevel || !form.resultingGradeLevel || !form.name.trim()) {
        setMessage('الاسم وصف المصدر وصف الامتحان وصف الناتج مطلوبة صراحة.');
        return;
      }
      const minSubjectGrade =
        form.subjectGradeMode === 'uniform' ? parseOptionalNumber(form.minSubjectGrade) : undefined;
      const requiredFinalAverage = parseOptionalNumber(form.requiredFinalAverage);
      const subjectGradeRule =
        form.subjectGradeMode === 'composite'
          ? (() => {
              const baselineMinimum = parseOptionalNumber(form.baselineMinimum);
              const exceptionMinimum = parseOptionalNumber(form.exceptionMinimum);
              const maxExceptionSubjects = parseOptionalNumber(form.maxExceptionSubjects);
              if (
                baselineMinimum === undefined &&
                exceptionMinimum === undefined &&
                maxExceptionSubjects === undefined
              ) {
                return undefined;
              }
              return { baselineMinimum, exceptionMinimum, maxExceptionSubjects };
            })()
          : undefined;
      const policy = buildCanonicalPolicyRecord({
        id: `pol-${Date.now()}`,
        name: form.name,
        academicYear: form.academicYear.trim() || undefined,
        gradeLevel: form.gradeLevel,
        targetExamGradeLevel: form.targetExamGradeLevel,
        resultingGradeLevel: form.resultingGradeLevel,
        requiredFinalAverage,
        minSubjectGrade,
        subjectGradeRule,
        subjectGradeSource: form.subjectGradeSource || undefined,
        aptitudePassingScore: parseOptionalNumber(form.aptitudePassingScore),
        achievementPassingScore: parseOptionalNumber(form.achievementPassingScore),
        ministerialPassingGrade: parseOptionalNumber(form.ministerialPassingGrade),
        requiredExams: form.requiredExams,
        ministerialExamSubjects: form.ministerialExamSubjectsText
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
        sourceReference: form.sourceReference.trim() || undefined,
      });
      if (!onSavePolicy) {
        setMessage('حفظ السياسة غير موصول بعد إلى طبقة التطبيق.');
        return;
      }
      await onSavePolicy(policy);
      setForm(EMPTY_FORM);
      setMessage('تم حفظ السياسة بالقيم المدخلة فقط.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ السياسة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" dir="rtl">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Shield className="h-5 w-5 text-violet-700" />
            سياسات التسريع
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 text-sm">
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
            لا تُدرج حدود وزارية افتراضية. كل حد أو مرجع يُحفظ فقط إذا أدخلته الإدارة.
          </p>

          <label className="block">
            <span className="mb-1 block font-bold">اسم السياسة</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">السنة الدراسية (اختياري، بلا قيمة افتراضية)</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.academicYear}
              onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
              placeholder="YYYY-YYYY"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block font-bold">1) صف المصدر</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.gradeLevel}
                onChange={(event) => setForm({ ...form, gradeLevel: event.target.value as GradeLevel })}
              >
                <option value="">غير محدد</option>
                {ALL_GRADES_LIST.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block font-bold">2) صف امتحان التسريع</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.targetExamGradeLevel}
                onChange={(event) => setForm({ ...form, targetExamGradeLevel: event.target.value as GradeLevel })}
              >
                <option value="">غير محدد</option>
                {ALL_GRADES_LIST.map((grade) => (
                  <option key={`exam-${grade}`} value={grade}>{grade}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block font-bold">3) الصف الناتج بعد النجاح</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.resultingGradeLevel}
                onChange={(event) => setForm({ ...form, resultingGradeLevel: event.target.value as GradeLevel })}
              >
                <option value="">غير محدد</option>
                {ALL_GRADES_LIST.map((grade) => (
                  <option key={`res-${grade}`} value={grade}>{grade}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block font-bold">المعدل المطلوب</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.requiredFinalAverage}
                onChange={(event) => setForm({ ...form, requiredFinalAverage: event.target.value })}
              />
            </label>
            <label>
              <span className="mb-1 block font-bold">مصدر درجة المادة/المعدل</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.subjectGradeSource}
                onChange={(event) => setForm({ ...form, subjectGradeSource: event.target.value as SubjectGradeSource | '' })}
              >
                <option value="">غير محدد</option>
                <option value="finalGrade">finalGrade</option>
                <option value="annualSaeiAvg">annualSaeiAvg</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block font-bold">مرجع المصدر (يُحفظ فقط إذا أُدخل)</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.sourceReference}
                onChange={(event) => setForm({ ...form, sourceReference: event.target.value })}
              />
            </label>
          </div>

          <fieldset className="rounded-2xl border border-slate-200 p-3 space-y-3">
            <legend className="px-1 font-bold">قاعدة درجات المواد</legend>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.subjectGradeMode}
              onChange={(event) =>
                setForm({
                  ...form,
                  subjectGradeMode: event.target.value as '' | 'uniform' | 'composite',
                  minSubjectGrade: '',
                  baselineMinimum: '',
                  exceptionMinimum: '',
                  maxExceptionSubjects: '',
                })
              }
            >
              <option value="">غير محددة</option>
              <option value="uniform">حد أدنى موحد لكل مادة</option>
              <option value="composite">قاعدة مركبة مع استثناءات</option>
            </select>
            {form.subjectGradeMode === 'uniform' && (
              <label className="block">
                <span className="mb-1 block font-bold">الحد الأدنى لدرجة المادة</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.minSubjectGrade}
                  onChange={(event) => setForm({ ...form, minSubjectGrade: event.target.value })}
                />
              </label>
            )}
            {form.subjectGradeMode === 'composite' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  مثال: إذا كان الحد الطبيعي 96، وحد الاستثناء 93، وعدد الاستثناءات 2، فيسمح لمادتين كحد أقصى بدرجات من 93 إلى أقل من 96.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <label>
                    <span className="mb-1 block font-bold">الحد الطبيعي لكل مادة</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={form.baselineMinimum}
                      onChange={(event) => setForm({ ...form, baselineMinimum: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block font-bold">أدنى درجة مسموحة للاستثناء</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={form.exceptionMinimum}
                      onChange={(event) => setForm({ ...form, exceptionMinimum: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block font-bold">أقصى عدد للمواد المستثناة</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={form.maxExceptionSubjects}
                      onChange={(event) => setForm({ ...form, maxExceptionSubjects: event.target.value })}
                    />
                  </label>
                </div>
              </div>
            )}
          </fieldset>

          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block font-bold">حد امتحان القدرة</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.aptitudePassingScore}
                onChange={(event) => setForm({ ...form, aptitudePassingScore: event.target.value })}
              />
            </label>
            <label>
              <span className="mb-1 block font-bold">حد امتحان التحصيل</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.achievementPassingScore}
                onChange={(event) => setForm({ ...form, achievementPassingScore: event.target.value })}
              />
            </label>
            <label>
              <span className="mb-1 block font-bold">حد الامتحان الوزاري</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.ministerialPassingGrade}
                onChange={(event) => setForm({ ...form, ministerialPassingGrade: event.target.value })}
              />
            </label>
          </div>

          <fieldset className="rounded-2xl border border-slate-200 p-3">
            <legend className="px-1 font-bold">الامتحانات المطلوبة (بدون قائمة افتراضية)</legend>
            {(['aptitude', 'achievement', 'ministerial'] as AccelerationExamKind[]).map((kind) => (
              <label key={kind} className="ml-4 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requiredExams.includes(kind)}
                  onChange={() => toggleExam(kind)}
                />
                {kind}
              </label>
            ))}
          </fieldset>

          <label className="block">
            <span className="mb-1 block font-bold">مواد الامتحان الوزاري (سطر أو فاصلة لكل مادة)</span>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={3}
              value={form.ministerialExamSubjectsText}
              onChange={(event) => setForm({ ...form, ministerialExamSubjectsText: event.target.value })}
            />
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white"
          >
            <Save className="h-4 w-4" />
            حفظ سياسة جديدة (حقول معتمدة فقط)
          </button>

          <section>
            <h3 className="mb-2 font-bold">السياسات المحفوظة</h3>
            {policies.length === 0 && <p className="text-slate-500">لا سياسات محفوظة.</p>}
            {policies.map((policy) => (
              <div key={policy.id} className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-2">
                <div>
                  <div className="font-bold">{policy.name}</div>
                  <div className="text-xs text-slate-500">
                    مصدر {policy.gradeLevel} / امتحان {policy.targetExamGradeLevel} / ناتج {policy.resultingGradeLevel}
                  </div>
                  {policy.sourceReference && <div className="text-xs">مرجع: {policy.sourceReference}</div>}
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-700"
                  onClick={() => {
                    try {
                      assertPolicyDeletable(policy.id, attempts);
                      void onDeletePolicy?.(policy.id);
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : 'تعذر الحذف');
                    }
                  }}
                >
                  حذف
                </button>
              </div>
            ))}
          </section>

          {message && <p className="rounded-2xl bg-slate-50 px-4 py-3">{message}</p>}
        </div>
      </div>
    </div>
  );
};
