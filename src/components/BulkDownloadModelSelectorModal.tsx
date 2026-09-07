import React, { useState } from 'react';
import {
  Download,
  X,
  FileCheck2,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Layers,
} from 'lucide-react';
import { CertificateModelType, CERTIFICATE_MODELS } from '../types';

interface BulkDownloadModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: (scope: 'all' | 'class', selectedModel: CertificateModelType, sortOrder: string) => void;
  totalSchoolStudentsCount: number;
  classStudentsCount: number;
  currentGradeFilter: string;
  initialScope?: 'all' | 'class';
  initialModel?: CertificateModelType;
  isExporting?: boolean;
  progressText?: string;
}

export const BulkDownloadModelSelectorModal: React.FC<BulkDownloadModelSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  totalSchoolStudentsCount,
  classStudentsCount,
  currentGradeFilter,
  initialScope = 'all',
  initialModel = 'model4_final_round1',
  isExporting = false,
  progressText = '',
}) => {
  const [selectedScope, setSelectedScope] = useState<'all' | 'class'>(initialScope);
  const [selectedModel, setSelectedModel] = useState<CertificateModelType>(
    initialModel === 'model3_final_round1' ? 'model4_final_round1' : initialModel
  );
  const [selectedSortOrder, setSelectedSortOrder] = useState<string>('name_asc');

  if (!isOpen) return null;

  const targetCount = selectedScope === 'all' ? totalSchoolStudentsCount : classStudentsCount;
  const currentModelObj = CERTIFICATE_MODELS.find(
    (m) => m.id === selectedModel || (selectedModel === 'model4_final_round1' && m.id === 'model4_final_round1')
  ) || CERTIFICATE_MODELS[3];

  const handleStartDownload = () => {
    onConfirmDownload(selectedScope, selectedModel, selectedSortOrder);
  };

  return (
    <div
      id="bulk-download-model-selector-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white relative flex-shrink-0">
          <button
            id="close-bulk-download-modal-btn"
            onClick={onClose}
            disabled={isExporting}
            className="absolute left-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>تصدير وطباعة الشهادات والنتائج (PDF)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                تحديد نموذج الشهادة لتنزيل شهادات كافة المدرسة
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                يرجى اختيار النموذج الوزاري المطلوب ليتم توليد وتنزيل ملف PDF موحد عالي الدقة لكافة الطالبات
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/50 text-slate-800">
          {/* Progress Indicator if Exporting */}
          {isExporting && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <div className="text-xs sm:text-sm font-bold">
                {progressText || 'جاري إعداد وتصدير ملف الـ PDF... يرجى الانتظار'}
              </div>
            </div>
          )}

          {/* Scope Selector (All School vs Class) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>نطاق التنزيل المطلوب:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="select-scope-all-btn"
                onClick={() => setSelectedScope('all')}
                disabled={isExporting}
                className={`p-3.5 rounded-xl border text-right transition flex items-start gap-3 cursor-pointer ${
                  selectedScope === 'all'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    selectedScope === 'all'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selectedScope === 'all' && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>🏢 شهادات كافة المدرسة بالكامل</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-black rounded-full">
                      {totalSchoolStudentsCount} طالبة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    تنزيل ملف PDF شامل يضم جميع طالبات المدرسة في كافة المراحل والشعب
                  </p>
                </div>
              </button>

              <button
                type="button"
                id="select-scope-class-btn"
                onClick={() => setSelectedScope('class')}
                disabled={isExporting}
                className={`p-3.5 rounded-xl border text-right transition flex items-start gap-3 cursor-pointer ${
                  selectedScope === 'class'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    selectedScope === 'class'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selectedScope === 'class' && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>🏫 الصف المحدد حالياً</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full">
                      {classStudentsCount} طالبة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentGradeFilter === 'all'
                      ? 'شهادات القائمة الحالية المعروضة'
                      : `شهادات مرحلة (${currentGradeFilter}) فقط`}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Model Cards Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>اختر نموذج الشهادة المطلوب لتطبيقه على كافة الطالبات:</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                5 نماذج معتمدة رسمياً
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {CERTIFICATE_MODELS.map((model) => {
                const isSelected =
                  selectedModel === model.id ||
                  (selectedModel === 'model4_final_round1' && model.id === 'model4_final_round1') ||
                  (selectedModel === 'model3_final_round1' && model.id === 'model4_final_round1');

                return (
                  <button
                    key={model.id}
                    type="button"
                    id={`select-cert-model-${model.id}`}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={isExporting}
                    className={`p-3.5 rounded-xl border text-right transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-500 text-slate-950 font-black'
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : null}
                      </div>

                      <div className="text-2xl flex-shrink-0">{model.icon}</div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm sm:text-base text-slate-900">
                            {model.shortTitle}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-black rounded-md ${
                              isSelected
                                ? 'bg-amber-200/90 text-amber-950'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {model.badgeTag}
                          </span>
                          {model.id === 'model4_final_round1' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                              ⭐ النموذج النهائي المعتمد
                            </span>
                          )}
                          {model.id === 'model3_annual_saei' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full">
                              📊 كشف السعي السنوي
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {model.descAr}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Order Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
              <span>ترتيب صفحات الشهادات في ملف الـ PDF:</span>
            </div>
            <select
              id="bulk-download-sort-order-select"
              value={selectedSortOrder}
              onChange={(e) => setSelectedSortOrder(e.target.value)}
              disabled={isExporting}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="name_asc">🔤 أبجدياً بأسماء الطالبات (أ ⬅️ ي) [الافتراضي]</option>
              <option value="name_desc">🔤 أبجدياً عكسي (ي ⬅️ أ)</option>
              <option value="grade_sec">🏫 حسب المرحلة والشعبة ثم الاسم</option>
              <option value="gpa_desc">🏆 حسب أعلى معدل (لوحة الأوائل)</option>
            </select>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl text-xs text-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ملخص التنزيل والتصدير المختار:</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              سيتم إنشاء ملف PDF عالي الدقة بمقاس A4 القياسي يتضمن <strong>{targetCount} طالبة</strong> باستخدام{' '}
              <strong className="text-indigo-900 underline decoration-indigo-300 font-black">
                {currentModelObj?.shortTitle || selectedModel}
              </strong>
              ، مع الحفاظ الكامل على نوع الخطوط العربية الرسمية المعتمدة (Cairo / Tajawal) والأختام والترويسة الوزارية.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            id="confirm-bulk-download-pdf-btn"
            onClick={handleStartDownload}
            disabled={isExporting || targetCount === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-lg shadow-indigo-900/30 cursor-pointer disabled:opacity-50 transform hover:scale-[1.02]"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>
              {isExporting
                ? 'جاري تجهيز وتنزيل الملف...'
                : `تنزيل شهادات ${selectedScope === 'all' ? 'كافة المدرسة' : 'الصف'} (${targetCount} طالبة - PDF) 📥`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
