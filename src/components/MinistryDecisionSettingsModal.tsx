/**
 * Ministry Decision Settings Modal
 * إعدادات قرار المساعدة ودرجات القرار الوزارية - ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Save,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Zap,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';

interface MinistryDecisionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinistryDecisionSettingsModal: React.FC<MinistryDecisionSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { decisionSettings, updateDecisionSettings, certificates, autoOptimizeDecisionMarksForCert, resetDecisionMarksForCert } = useApp();

  const [maxDecisionMarks, setMaxDecisionMarks] = useState<number>(10);
  const [decisionScopeMode, setDecisionScopeMode] = useState<'total_pool' | 'per_subject'>('total_pool');
  const [maxDecisionMarksPerSubject, setMaxDecisionMarksPerSubject] = useState<number>(10);
  const [maxResitSubjects, setMaxResitSubjects] = useState<number>(3);
  const [minPassingGrade, setMinPassingGrade] = useState<number>(50);
  const [autoApplyDecisionMarks, setAutoApplyDecisionMarks] = useState<boolean>(true);
  const [customInputValue, setCustomInputValue] = useState<string>('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (decisionSettings) {
      setMaxDecisionMarks(decisionSettings.maxDecisionMarks ?? 10);
      setDecisionScopeMode(decisionSettings.decisionScopeMode ?? 'total_pool');
      setMaxDecisionMarksPerSubject(decisionSettings.maxDecisionMarksPerSubject ?? 10);
      setMaxResitSubjects(decisionSettings.maxResitSubjects ?? 3);
      setMinPassingGrade(decisionSettings.minPassingGrade ?? 50);
      setAutoApplyDecisionMarks(decisionSettings.autoApplyDecisionMarks ?? true);
      setCustomInputValue(String(decisionSettings.maxDecisionMarks ?? 10));
    }
  }, [decisionSettings, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (value: number) => {
    setMaxDecisionMarks(value);
    setCustomInputValue(String(value));
  };

  const handleSave = () => {
    const finalMarks = Math.max(0, Number(customInputValue) || maxDecisionMarks);
    updateDecisionSettings({
      maxDecisionMarks: finalMarks,
      decisionScopeMode,
      maxDecisionMarksPerSubject: Math.max(1, maxDecisionMarksPerSubject),
      maxResitSubjects,
      minPassingGrade,
      autoApplyDecisionMarks,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleAutoApplyAll = () => {
    if (confirm(`هل تريد تطبيق درجات القرار التلقائية الذكية لكافة الطالبات حسب القرار الوزاري المحدد (${maxDecisionMarks} درجات ${decisionScopeMode === 'per_subject' ? 'لكل مادة' : 'لكافة المواد'})؟`)) {
      certificates.forEach((c) => {
        autoOptimizeDecisionMarksForCert(c.id);
      });
      alert('تم تطبيق درجات القرار التلقائية المساعدة لجميع الطالبات بنجاح!');
    }
  };

  const handleResetAll = () => {
    if (confirm('هل تريد إلغاء وإعادة ضبط كافة درجات القرار المضافة لجميع الطالبات؟')) {
      certificates.forEach((c) => {
        resetDecisionMarksForCert(c.id);
      });
      alert('تم إلغاء وإعادة ضبط درجات القرار لجميع الطالبات.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">إعدادات قرار المساعدة ودرجات القرار الوزارية</h2>
              <p className="text-xs text-slate-300">
                تحديد رصيد درجات القرار (5، 10، 15 درجة أو بقرار خاص) وطبيعة نطاقها (لكل المواد أم لكل مادة)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-right text-slate-800">
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث إعدادات قرارات المساعدة بنجاح وإعادة حساب جميع نتائج الشهادات!</span>
            </div>
          )}

          {/* Ministry Policy Highlights */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <span>ضوابط وزارة التربية العراقية لقرارات المساعدة:</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              تحدد وزارة التربية عدد درجات القرار المساعدة بحسب القرارات السنوية (غالبًا 5 درجات، أو 10 درجات، أو 15 درجة في الحالات الاستثنائية)، ويمكن تطبيقها كـ **رصيد كلي لكافة المواد** أو **درجات مخصصة لكل مادة**.
            </p>
          </div>

          {/* 1. Decision Marks Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>اختر عدد درجات القرار الوزاري المقرة:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[5, 10, 15].map((val) => {
                const isSelected = maxDecisionMarks === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectPreset(val)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 relative ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                    <span className="text-base font-black">{val} درجات</span>
                    <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {val === 5 ? 'قرار وزاري قياسي' : val === 10 ? 'قرار وزاري عام' : 'قرار استثنائي'}
                    </span>
                  </button>
                );
              })}

              {/* Custom Choice */}
              <div
                className={`p-2.5 rounded-2xl border transition flex flex-col justify-center ${
                  ![5, 10, 15].includes(maxDecisionMarks)
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-[11px] font-bold mb-1 text-center ${![5, 10, 15].includes(maxDecisionMarks) ? 'text-amber-300' : 'text-slate-700'}`}>
                  بحسب قرار الوزارة (مخصص)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={customInputValue}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setCustomInputValue(e.target.value);
                      setMaxDecisionMarks(num);
                    }}
                    placeholder="أدخل العدد"
                    className={`w-full px-2 py-1 rounded-xl font-bold text-xs text-center border ${
                      ![5, 10, 15].includes(maxDecisionMarks)
                        ? 'bg-white text-slate-900 border-emerald-400'
                        : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  />
                  <span className={`text-[10px] font-bold shrink-0 ${![5, 10, 15].includes(maxDecisionMarks) ? 'text-white' : 'text-slate-600'}`}>درجة</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Scope Selection ( لكل المواد vs لكل مادة ) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-black text-slate-900">
              نطاق وتطبيق درجات القرار:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecisionScopeMode('total_pool')}
                className={`p-3.5 rounded-2xl border text-right transition flex items-start gap-3 ${
                  decisionScopeMode === 'total_pool'
                    ? 'bg-teal-900 text-white border-teal-950 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${decisionScopeMode === 'total_pool' ? 'border-amber-400 bg-amber-400 text-teal-950' : 'border-slate-400'}`}>
                  {decisionScopeMode === 'total_pool' && <Check className="w-3.5 h-3.5 font-bold" />}
                </div>
                <div>
                  <p className="text-xs font-black">لكل المواد مجتمعة (رصيد كلي متاح)</p>
                  <p className={`text-[11px] mt-1 leading-relaxed ${decisionScopeMode === 'total_pool' ? 'text-teal-200' : 'text-slate-500'}`}>
                    يمنح الطالب رصيداً كلياً مقداره ({maxDecisionMarks}) درجات، يُوزع على المواد المكملة أو الراسبة بحسب الحاجة.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionScopeMode('per_subject')}
                className={`p-3.5 rounded-2xl border text-right transition flex items-start gap-3 ${
                  decisionScopeMode === 'per_subject'
                    ? 'bg-teal-900 text-white border-teal-950 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${decisionScopeMode === 'per_subject' ? 'border-amber-400 bg-amber-400 text-teal-950' : 'border-slate-400'}`}>
                  {decisionScopeMode === 'per_subject' && <Check className="w-3.5 h-3.5 font-bold" />}
                </div>
                <div>
                  <p className="text-xs font-black">لكل مادة بشكل مستقل (رصيد مخصص)</p>
                  <p className={`text-[11px] mt-1 leading-relaxed ${decisionScopeMode === 'per_subject' ? 'text-teal-200' : 'text-slate-500'}`}>
                    تستطيع كل مادة مكملة الحصول على مساعدة تصل إلى ({maxDecisionMarks}) درجات بشكل مستقل دون خصمها من بقية المواد.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Resit Subjects */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                أقصى عدد دروس رسوب ليكون الطالب مكملاً (دور ثاني)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={maxResitSubjects}
                  onChange={(e) => setMaxResitSubjects(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">دروس</span>
              </div>
              <p className="text-[11px] text-slate-500">في العراق: الرسوب في (1 إلى 3 دروس) يُعتبر إكمالاً.</p>
            </div>

            {/* Min Passing Grade */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                درجة النجاح الصغرى
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="40"
                  max="60"
                  value={minPassingGrade}
                  onChange={(e) => setMinPassingGrade(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">درجة</span>
              </div>
              <p className="text-[11px] text-slate-500">الحد الأدنى للنجاح هو (50) من 100.</p>
            </div>
          </div>

          {/* Current Active Rule Summary Box */}
          <div className="bg-emerald-950 text-white rounded-2xl p-4 border border-emerald-800 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>السياسة المعتمدة الحالية في النظام:</span>
            </div>
            <p className="text-xs font-bold leading-relaxed text-emerald-100">
              قرار وزارياً بقدر: <span className="text-amber-300 text-sm font-black">{maxDecisionMarks} درجات</span> — نطاق التطبيق: <span className="text-amber-300 font-black">{decisionScopeMode === 'per_subject' ? 'لكل مادة مستقلاً' : 'لكافة المواد مجتمعة'}</span>.
            </p>
          </div>

          {/* Quick Actions for Bulk Application */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800">إجراءات سريعة على سجّلات الطالبات:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAutoApplyAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>تطبيق درجات القرار تلقائياً لكافة الطالبات</span>
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>إلغاء وإعادة ضبط درجات القرار للجميع</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-900/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق الضوابط</span>
          </button>
        </div>
      </div>
    </div>
  );
};
