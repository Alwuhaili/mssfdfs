import React, { useState } from 'react';
import {
  FolderOpen,
  GitBranch,
  GraduationCap,
  Info,
  Rocket,
  RotateCcw,
  Save,
  ScrollText,
  Shield,
  X,
} from 'lucide-react';
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

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function subjectGradeSourceLabel(source?: SubjectGradeSource | ''): string {
  if (source === 'finalGrade') return 'الدرجة النهائية';
  if (source === 'annualSaeiAvg') return 'معدل السعي السنوي';
  return 'غير محدد';
}

function examKindLabel(kind: AccelerationExamKind): string {
  if (kind === 'aptitude') return 'امتحان القدرة';
  if (kind === 'achievement') return 'امتحان التحصيل';
  if (kind === 'ministerial') return 'الامتحان الوزاري';
  return 'امتحان';
}

function subjectGradeRuleTypeLabel(policy: AccelerationPolicy): string {
  if (policy.subjectGradeRule) return 'قاعدة مركبة مع استثناءات';
  if (policy.minSubjectGrade !== undefined) return 'حد أدنى موحد لكل مادة';
  return 'غير محددة';
}

function formatCreatedAt(value?: string): string {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير محدد';
  return date.toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
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

  const selectSubjectGradeMode = (mode: '' | 'uniform' | 'composite') => {
    setForm((prev) => ({
      ...prev,
      subjectGradeMode: mode,
      minSubjectGrade: '',
      baselineMinimum: '',
      exceptionMinimum: '',
      maxExceptionSubjects: '',
    }));
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setMessage('');
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

  const ruleOptions: Array<{
    value: '' | 'uniform' | 'composite';
    title: string;
    description: string;
  }> = [
    {
      value: '',
      title: 'غير محددة',
      description: 'لم يتم تحديد قاعدة لدرجات المواد.',
    },
    {
      value: 'uniform',
      title: 'حد أدنى موحد لكل مادة',
      description: 'يشترط حصول الطالب على حد أدنى واحد لكل المواد.',
    },
    {
      value: 'composite',
      title: 'قاعدة مركبة مع استثناءات',
      description: 'تحديد حد طبيعي مع إمكانية استثناء عدد محدود من المواد.',
    },
  ];

  const examOptions: AccelerationExamKind[] = ['aptitude', 'achievement', 'ministerial'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5" dir="rtl">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">سياسات التسريع</h2>
              <p className="mt-1 text-sm text-slate-500">إدارة قواعد وضوابط التسريع الأكاديمي</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-5 py-5 text-sm sm:px-6">
          <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-slate-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
            <p>لا تُدرج حدود وزارية افتراضية. كل حد أو مرجع يُحفظ فقط إذا أدخلته الإدارة.</p>
          </div>

          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1.5 block font-bold text-slate-800">اسم السياسة</span>
                <input
                  className={FIELD_CLASS}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="مثال: سياسة التسريع للعام الدراسي"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-bold text-slate-800">السنة الدراسية (اختياري)</span>
                <input
                  className={FIELD_CLASS}
                  value={form.academicYear}
                  onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
                  placeholder="مثال: 2025-2026"
                />
              </label>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-violet-700" />
                <h3 className="text-base font-black text-slate-900">مسار التسريع الأكاديمي</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">1) صف المصدر</span>
                  <select
                    className={FIELD_CLASS}
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
                  <span className="mb-1.5 block font-bold text-slate-800">2) صف امتحان التسريع</span>
                  <select
                    className={FIELD_CLASS}
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
                  <span className="mb-1.5 block font-bold text-slate-800">3) الصف الناتج بعد النجاح</span>
                  <select
                    className={FIELD_CLASS}
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
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-700" />
                <h3 className="text-base font-black text-slate-900">المعايير الأكاديمية</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">المعدل المطلوب</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.requiredFinalAverage}
                    onChange={(event) => setForm({ ...form, requiredFinalAverage: event.target.value })}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">مصدر درجة المادة/المعدل</span>
                  <select
                    className={FIELD_CLASS}
                    value={form.subjectGradeSource}
                    onChange={(event) => setForm({ ...form, subjectGradeSource: event.target.value as SubjectGradeSource | '' })}
                  >
                    <option value="">غير محدد</option>
                    <option value="finalGrade">الدرجة النهائية</option>
                    <option value="annualSaeiAvg">معدل السعي السنوي</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">مرجع المصدر</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.sourceReference}
                    onChange={(event) => setForm({ ...form, sourceReference: event.target.value })}
                    placeholder="يُحفظ فقط إذا أُدخل"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-700" />
                <h3 className="text-base font-black text-slate-900">قاعدة درجات المواد</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {ruleOptions.map((option) => {
                  const selected = form.subjectGradeMode === option.value;
                  return (
                    <button
                      key={option.title}
                      type="button"
                      onClick={() => selectSubjectGradeMode(option.value)}
                      className={`rounded-2xl border p-4 text-right transition ${
                        selected
                          ? 'border-violet-500 bg-violet-100/80 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-violet-200'
                      }`}
                    >
                      <span className="mb-2 flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected ? 'border-violet-700' : 'border-slate-300'
                          }`}
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-violet-700" />}
                        </span>
                        <span className="font-black text-slate-900">{option.title}</span>
                      </span>
                      <span className="block text-xs leading-5 text-slate-600">{option.description}</span>
                    </button>
                  );
                })}
              </div>

              {form.subjectGradeMode === 'uniform' && (
                <div className="rounded-2xl border border-violet-100 bg-white p-4">
                  <label className="block">
                    <span className="mb-1.5 block font-bold text-slate-800">الحد الأدنى لدرجة المادة</span>
                    <input
                      className={FIELD_CLASS}
                      value={form.minSubjectGrade}
                      onChange={(event) => setForm({ ...form, minSubjectGrade: event.target.value })}
                    />
                  </label>
                </div>
              )}

              {form.subjectGradeMode === 'composite' && (
                <div className="space-y-3 rounded-2xl border border-violet-100 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label>
                      <span className="mb-1.5 block font-bold text-slate-800">الحد الطبيعي لكل مادة</span>
                      <input
                        className={FIELD_CLASS}
                        value={form.baselineMinimum}
                        onChange={(event) => setForm({ ...form, baselineMinimum: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className="mb-1.5 block font-bold text-slate-800">أدنى درجة مسموحة للاستثناء</span>
                      <input
                        className={FIELD_CLASS}
                        value={form.exceptionMinimum}
                        onChange={(event) => setForm({ ...form, exceptionMinimum: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className="mb-1.5 block font-bold text-slate-800">أقصى عدد للمواد المستثناة</span>
                      <input
                        className={FIELD_CLASS}
                        value={form.maxExceptionSubjects}
                        onChange={(event) => setForm({ ...form, maxExceptionSubjects: event.target.value })}
                      />
                    </label>
                  </div>
                  <p className="text-xs leading-6 text-slate-500">
                    مثال توضيحي فقط: إذا كان الحد الطبيعي 96، وحد الاستثناء 93، وأقصى عدد للاستثناءات 2، فيُسمح لمادتين كحد أقصى بدرجات من 93 إلى أقل من 96.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-violet-700" />
                <h3 className="text-base font-black text-slate-900">حدود الامتحانات</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">حد امتحان القدرة</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.aptitudePassingScore}
                    onChange={(event) => setForm({ ...form, aptitudePassingScore: event.target.value })}
                    placeholder="أدخل الحد عند اعتماده"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">حد امتحان التحصيل</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.achievementPassingScore}
                    onChange={(event) => setForm({ ...form, achievementPassingScore: event.target.value })}
                    placeholder="أدخل الحد عند اعتماده"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block font-bold text-slate-800">حد الامتحان الوزاري</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.ministerialPassingGrade}
                    onChange={(event) => setForm({ ...form, ministerialPassingGrade: event.target.value })}
                    placeholder="أدخل الحد عند اعتماده"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-700" />
                <h3 className="text-base font-black text-slate-900">الامتحانات المطلوبة</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {examOptions.map((kind) => {
                  const selected = form.requiredExams.includes(kind);
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => toggleExam(kind)}
                      className={`rounded-2xl border p-4 text-right font-bold transition ${
                        selected
                          ? 'border-violet-500 bg-violet-50 text-violet-900'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-violet-200'
                      }`}
                    >
                      {examKindLabel(kind)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <label className="block">
                <span className="mb-1.5 block text-base font-black text-slate-900">مواد الامتحان الوزاري</span>
                <p className="mb-2 text-xs text-slate-500">أدخل اسم كل مادة في سطر منفصل أو افصل بينها بفاصلة.</p>
                <textarea
                  className={`${FIELD_CLASS} min-h-28`}
                  rows={5}
                  value={form.ministerialExamSubjectsText}
                  onChange={(event) => setForm({ ...form, ministerialExamSubjectsText: event.target.value })}
                  placeholder="مثال: الرياضيات، الفيزياء، الكيمياء"
                />
              </label>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void handleSave()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-violet-800"
              >
                <Save className="h-4 w-4" />
                حفظ سياسة جديدة (حقول معتمدة فقط)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة الحقول
              </button>
            </div>
          </div>

          {message && (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">{message}</p>
          )}

          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-violet-700" />
              <h3 className="text-base font-black text-slate-900">السياسات المحفوظة</h3>
            </div>
            {policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <FolderOpen className="mb-3 h-8 w-8 text-slate-400" />
                <p className="font-bold text-slate-700">لا سياسات محفوظة.</p>
                <p className="mt-1 text-sm text-slate-500">ستظهر السياسات التي تعتمدها الإدارة هنا.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">#</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">اسم السياسة</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">السنة الدراسية</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">صف المصدر</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">صف الامتحان</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">الصف الناتج</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">المعدل</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">مصدر الدرجات</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">قاعدة المواد</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">الامتحانات</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">تاريخ الإنشاء</th>
                      <th className="whitespace-nowrap px-3 py-3 font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy, index) => (
                      <tr key={policy.id} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-3 py-3 text-slate-500">{index + 1}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-900">{policy.name}</td>
                        <td className="whitespace-nowrap px-3 py-3">{policy.academicYear || 'غير محددة'}</td>
                        <td className="whitespace-nowrap px-3 py-3">{policy.gradeLevel}</td>
                        <td className="whitespace-nowrap px-3 py-3">{policy.targetExamGradeLevel}</td>
                        <td className="whitespace-nowrap px-3 py-3">{policy.resultingGradeLevel}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {policy.requiredFinalAverage !== undefined ? policy.requiredFinalAverage : 'غير محدد'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{subjectGradeSourceLabel(policy.subjectGradeSource)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{subjectGradeRuleTypeLabel(policy)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {(policy.requiredExams || []).length > 0
                            ? (policy.requiredExams || []).map(examKindLabel).join('، ')
                            : 'غير محددة'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{formatCreatedAt(policy.createdAt)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <button
                            type="button"
                            className="font-bold text-rose-700 hover:underline"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
