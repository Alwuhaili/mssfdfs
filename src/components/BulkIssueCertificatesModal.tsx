import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Users,
  GraduationCap,
  Layers,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  School,
  Settings2,
  RefreshCw,
  Award,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_GRADES_LIST, GradeLevel, IssueCertificatesOptions, CertificateModelType, CERTIFICATE_MODELS, Student, StudentCertificate } from '../types';

interface BulkIssueCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const BulkIssueCertificatesModal: React.FC<BulkIssueCertificatesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    students,
    certificates,
    issueCertificatesForScope,
    deleteCertificatesForScope,
    clearAllCertificates,
    schoolAdminData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'issue' | 'delete'>('issue');
  const [scope, setScope] = useState<'all' | 'grade' | 'section' | 'student'>('all');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('الصف الرابع العلمي');
  const [selectedSection, setSelectedSection] = useState<string>('أ');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTargetModel, setSelectedTargetModel] = useState<CertificateModelType>('model4_final_round1');
  const [isBlankTemplate, setIsBlankTemplate] = useState<boolean>(true); // افتراضياً نموذج فارغ بدون درجات للإدخال اليدوي
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [customAcademicYear, setCustomAcademicYear] = useState<string>(
    schoolAdminData?.academicYear || '2026 - 2027'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Available sections for the selected grade
  const availableSections = useMemo(() => {
    const gradeStudents = students.filter((s) => s.gradeLevel === selectedGrade);
    const set = new Set<string>();
    gradeStudents.forEach((s) => {
      if (s.section) set.add(s.section);
    });
    const arr = Array.from(set);
    return arr.length > 0 ? arr : ['أ', 'ب', 'ج'];
  }, [students, selectedGrade]);

  // Target students matching the current scope filter (sorted alphabetically)
  const targetStudents = useMemo(() => {
    let list: Student[] = [];
    if (scope === 'all') {
      list = students;
    } else if (scope === 'grade') {
      list = students.filter((s) => s.gradeLevel === selectedGrade);
    } else if (scope === 'section') {
      list = students.filter(
        (s) =>
          s.gradeLevel === selectedGrade &&
          (s.section === selectedSection || s.section?.toLowerCase() === selectedSection?.toLowerCase())
      );
    } else if (scope === 'student') {
      const found = students.find((s) => s.id === selectedStudentId);
      list = found ? [found] : [];
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' }));
  }, [students, scope, selectedGrade, selectedSection, selectedStudentId]);

  // Students who already have a certificate issued
  const existingCertMap = useMemo(() => {
    const map = new Map<string, boolean>();
    certificates.forEach((c) => {
      map.set(c.studentId, true);
      if (c.nationalId) map.set(c.nationalId, true);
    });
    return map;
  }, [certificates]);

  // Existing matching certificates for delete operation (sorted alphabetically)
  const matchingExistingCerts = useMemo(() => {
    let list: StudentCertificate[] = [];
    if (scope === 'all') list = certificates;
    else if (scope === 'grade') list = certificates.filter((c) => c.gradeLevel === selectedGrade);
    else if (scope === 'section')
      list = certificates.filter(
        (c) =>
          c.gradeLevel === selectedGrade &&
          (c.section === selectedSection || c.section?.toLowerCase().trim() === selectedSection.toLowerCase().trim())
      );
    else if (scope === 'student')
      list = certificates.filter((c) => c.studentId === selectedStudentId || c.id === selectedStudentId);
    return [...list].sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' }));
  }, [certificates, scope, selectedGrade, selectedSection, selectedStudentId]);

  const targetExistingCount = useMemo(() => {
    return targetStudents.filter((s) => existingCertMap.has(s.id) || existingCertMap.has(s.nationalId)).length;
  }, [targetStudents, existingCertMap]);

  if (!isOpen) return null;

  const handleExecute = () => {
    setIsProcessing(true);
    setResultMessage(null);

    try {
      if (activeTab === 'issue') {
        const options: IssueCertificatesOptions = {
          scope,
          gradeLevel: scope === 'grade' || scope === 'section' ? selectedGrade : undefined,
          section: scope === 'section' ? selectedSection : undefined,
          studentId: scope === 'student' ? selectedStudentId : undefined,
          isBlankTemplate,
          overwriteExisting,
          customAcademicYear,
          targetModel: selectedTargetModel,
        };

        const res = issueCertificatesForScope(options);
        setResultMessage(res.message);
        if (onSuccess) {
          onSuccess(res.message);
        }

        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1200);
      } else {
        // Delete Mode
        const res = deleteCertificatesForScope({
          scope,
          gradeLevel: scope === 'grade' || scope === 'section' ? selectedGrade : undefined,
          section: scope === 'section' ? selectedSection : undefined,
          studentId: scope === 'student' ? selectedStudentId : undefined,
        });

        setResultMessage(res.message);
        if (onSuccess) {
          onSuccess(res.message);
        }

        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setResultMessage('حدث خطأ أثناء تنفيذ العملية، يرجى المحاولة ثانية.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn print:hidden">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 relative">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>إدارة وإصدار الشهادات المدرسية</span>
                <span className="text-[11px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  سجل إدارة الطالبات
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                إصدار أو حذف وتفريغ الشهادات المدرسية لجميع طالبات المدرسة، أو لصف، أو لشعبة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Issue vs Delete */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('issue');
              setResultMessage(null);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'issue'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>إصدار وتوليد الشهادات والنماذج ✨</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('delete');
              setResultMessage(null);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'delete'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-200" />
            <span>حذف وتفريغ الشهادات 🗑️</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* 1. نطاق العملية (Scope Selection) */}
          <div className="space-y-3">
            <label className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>1. حدد النطاق المستهدف:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  scope === 'all'
                    ? activeTab === 'delete'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-black shadow-xs'
                      : 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700 font-semibold'
                }`}
              >
                <School className={`w-5 h-5 ${scope === 'all' ? (activeTab === 'delete' ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`} />
                <span>جميع طالبات المدرسة</span>
                <span className="text-[10px] text-slate-500 font-mono">({students.length} طالبة)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('grade')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  scope === 'grade'
                    ? activeTab === 'delete'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-black shadow-xs'
                      : 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700 font-semibold'
                }`}
              >
                <GraduationCap className={`w-5 h-5 ${scope === 'grade' ? (activeTab === 'delete' ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`} />
                <span>صف دراسي محدد</span>
                <span className="text-[10px] text-slate-500">حسب المرحلة</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('section')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  scope === 'section'
                    ? activeTab === 'delete'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-black shadow-xs'
                      : 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700 font-semibold'
                }`}
              >
                <Users className={`w-5 h-5 ${scope === 'section' ? (activeTab === 'delete' ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`} />
                <span>شعبة معينة في صف</span>
                <span className="text-[10px] text-slate-500">الصف + الشعبة</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('student')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  scope === 'student'
                    ? activeTab === 'delete'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-black shadow-xs'
                      : 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700 font-semibold'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${scope === 'student' ? (activeTab === 'delete' ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`} />
                <span>طالبة فردية</span>
                <span className="text-[10px] text-slate-500">من السجل</span>
              </button>
            </div>
          </div>

          {/* Filters for Grade / Section / Student */}
          {(scope === 'grade' || scope === 'section') && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اختر الصف الدراسي:
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {ALL_GRADES_LIST.map((gr) => (
                      <option key={gr} value={gr}>
                        {gr}
                      </option>
                    ))}
                  </select>
                </div>

                {scope === 'section' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اختر الشعبة:
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableSections.map((sec) => (
                        <option key={sec} value={sec}>
                          شعبة ({sec})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {scope === 'student' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-700">
                اختر الطالبة من سجل إدارة الطالبات:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- اختر الطالبة (مرتبة أبجدياً) --</option>
                {[...students]
                  .sort((a, b) => a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' }))
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.gradeLevel} - شعبة {st.section || 'أ'}) [ID: {st.nationalId}]
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* If Active Tab is ISSUE: Show Template & Overwrite options */}
          {activeTab === 'issue' && (
            <>
              {/* 2. اختيار النموذج الرسمي من النماذج الأربعة */}
              <div className="space-y-3">
                <label className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>2. اختر النموذج الرسمي للشهادة المدرسية:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CERTIFICATE_MODELS.map((model) => {
                    const isSelected = selectedTargetModel === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setSelectedTargetModel(model.id)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-1 ring-amber-400/50'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        }`}
                      >
                        <div
                          className={`mt-0.5 p-2 rounded-xl text-base ${
                            isSelected ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {model.icon}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {model.titleAr}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isSelected
                                  ? 'bg-amber-200 text-amber-950 font-black'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {model.badgeTag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">
                            {model.descAr}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. نوع نموذج الشهادة للدرجات (Template Type) */}
              <div className="space-y-3">
                <label className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>3. حالة تعبئة الدرجات في النموذج:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Blank Template */}
                  <div
                    onClick={() => setIsBlankTemplate(true)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      isBlankTemplate
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl ${isBlankTemplate ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          نموذج فارغ للإدخال اليدوي 📝
                        </span>
                        <span className="bg-emerald-200 text-emerald-950 font-black text-[10px] px-2 py-0.2 rounded-full">
                          موصى به
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        يتم جلب بيانات الطالبة والصف والشعبة والمواد مع خانات درجات فارغة، لملء الدرجات يدوياً بالقلم أو عبر النظام.
                      </p>
                    </div>
                  </div>

                  {/* Option B: Pre-filled Template */}
                  <div
                    onClick={() => setIsBlankTemplate(false)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      !isBlankTemplate
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl ${!isBlankTemplate ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        نموذج بدرجات تقديرية جاهزة ✨
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        يتم توليد درجات أولية محسوبة على أساس معدل الطالبة مع إمكانية تعديلها لاحقاً.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. تفضيلات وخيارات المعالجة */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800 text-xs">
                      استبدال وتحديث الشهادات الموجودة مسبقاً للطالبات المستهدفات
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">العام الدراسي:</span>
                    <input
                      type="text"
                      value={customAcademicYear}
                      onChange={(e) => setCustomAcademicYear(e.target.value)}
                      className="w-28 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* If Active Tab is DELETE: Show Warning & Existing Count */}
          {activeTab === 'delete' && (
            <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>تأكيد نطاق حذف وتفريغ الشهادات:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                سيتم حذف عدد <strong className="text-rose-700 font-black text-sm font-mono">({matchingExistingCerts.length})</strong> شهادة مدرسية مسجلة حالياً في النظام لهذا النطاق.
              </p>
              <div className="text-[11px] text-rose-800 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                * ملاحظة: الحذف يزيل وثائق الشهادات فقط ولا يحذف ملفات الطالبات من سجل إدارة الطالبات، ويمكنك إعادة إصدار الشهادات في أي وقت.
              </div>
            </div>
          )}

          {/* Live Preview Summary Card */}
          {activeTab === 'issue' ? (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-black text-sm text-amber-300">
                    ملخص العملية الحالية:
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  سيتم إصدار <span className="font-extrabold text-white bg-emerald-500/30 px-2 py-0.5 rounded text-sm font-mono">{targetStudents.length}</span> شهادة مدرسية لـ (
                  <span className="font-bold text-amber-300">
                    {scope === 'all'
                      ? 'جميع طالبات المدرسة'
                      : scope === 'grade'
                      ? `${selectedGrade}`
                      : scope === 'section'
                      ? `${selectedGrade} - شعبة (${selectedSection})`
                      : targetStudents[0]?.name || 'الطالبة المحددة'}
                  </span>
                  ) بنموذج <span className="font-bold underline">{isBlankTemplate ? 'فارغ للإدخال اليدوي' : 'بدرجات مقدرة'}</span>.
                </p>
                {targetExistingCount > 0 && (
                  <p className="text-[11px] text-amber-300 font-medium">
                    * يوجد {targetExistingCount} طالبة مسجل لهن شهادات حالياً ({overwriteExisting ? 'سيتم تحديثها بالنموذج الجديد' : 'سيتم تخطيها للحفاظ على درجاتهن'}).
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isProcessing || targetStudents.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري الإصدار والتوليد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>تأكيد وإصدار الشهادات الآن ({targetStudents.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-black text-sm text-rose-300">
                    ملخص عملية الحذف:
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  سيتم حذف <span className="font-extrabold text-white bg-rose-600/60 px-2 py-0.5 rounded text-sm font-mono">{matchingExistingCerts.length}</span> شهادة مدرسية من السجل لـ (
                  <span className="font-bold text-amber-300">
                    {scope === 'all'
                      ? 'كافة طالبات المدرسة'
                      : scope === 'grade'
                      ? `${selectedGrade}`
                      : scope === 'section'
                      ? `${selectedGrade} - شعبة (${selectedSection})`
                      : 'الطالبة المحددة'}
                  </span>
                  ).
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isProcessing || matchingExistingCerts.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl transition transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-rose-200" />
                      <span>تأكيد حذف الشهادات الآن ({matchingExistingCerts.length}) 🗑️</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {resultMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
          <span>* يتم سحب الأسماء والبيانات الرسمية مباشرة من إدارة الطالبات.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
