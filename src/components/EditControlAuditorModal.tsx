/**
 * EditControlAuditorModal Component
 * نافذة تعديل بيانات مسؤولة الكنترول والتدقيق ورصد الدرجات
 * ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Save,
  UserCheck,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EditControlAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newName: string) => void;
}

export const EditControlAuditorModal: React.FC<EditControlAuditorModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { schoolAdminData, updateSchoolAdminData, teachers, currentUser, role } = useApp();

  const currentAuditorName =
    schoolAdminData?.examControlAuditorName || 'أ. دلال محمد عبد الحسين';
  const currentAuditorTitle =
    schoolAdminData?.examControlAuditorTitle ||
    'مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية';

  const [auditorName, setAuditorName] = useState<string>(currentAuditorName);
  const [auditorTitle, setAuditorTitle] = useState<string>(currentAuditorTitle);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // RBAC check
  const isAdmin = role === 'admin' || currentUser?.role === 'admin';

  if (!isOpen) return null;

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) return;
    const found = teachers.find((t) => t.id === teacherId);
    if (found) {
      const formattedName = found.name.startsWith('أ.') || found.name.startsWith('د.') ? found.name : `أ. ${found.name}`;
      setAuditorName(formattedName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorName.trim()) {
      setErrorText('يرجى إدخال اسم مسؤولة الكنترول والتدقيق');
      return;
    }

    updateSchoolAdminData({
      examControlAuditorName: auditorName.trim(),
      examControlAuditorTitle: auditorTitle.trim() || 'مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية',
    });

    setIsSavedSuccess(true);
    if (onSaved) {
      onSaved(auditorName.trim());
    }

    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto font-arabic"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>تعديل مسؤولة الكنترول والتدقيق</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  صلاحية الإدارة
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديث الاسم والصفة الرسمية في كشوفات الرصد وجداول الامتحانات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning if not admin */}
        {!isAdmin && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <span>
              تنبيه: أنت لست في وضع الإدارة الكاملة. يرجى تسجيل الدخول بحساب المديرة أو الإدارة لاعتماد التعديلات رسمياً.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Selection from Teachers */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              اختيار سريع من كادر المدرسات:
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => handleTeacherSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">-- اختاري من قائمة الهيئة التدريسية أو اكتبي اسماً مخصصاً أدناه --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - ({t.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Direct Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              اسم مسؤولة الكنترول والتدقيق الامتحاني: <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={auditorName}
                onChange={(e) => {
                  setAuditorName(e.target.value);
                  setErrorText('');
                }}
                placeholder="مثال: أ. دلال محمد عبد الحسين"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
              />
            </div>
            {errorText && <p className="text-[11px] text-rose-400 font-bold">{errorText}</p>}
          </div>

          {/* Quick Name Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-bold">اقتراحات سريعة:</span>
            {['أ. دلال محمد عبد الحسين', 'أ. هدى كاظم التميمي', 'د. زينب عبد الحسين الموسوي', 'أ. سارة جليل المحمداوي'].map(
              (nameSuggestion) => (
                <button
                  key={nameSuggestion}
                  type="button"
                  onClick={() => {
                    setAuditorName(nameSuggestion);
                    setErrorText('');
                  }}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    auditorName === nameSuggestion
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {nameSuggestion}
                </button>
              )
            )}
          </div>

          {/* Committee Role & Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              الصفة الرسمية والمسمى باللجنة الامتحانية:
            </label>
            <input
              type="text"
              value={auditorTitle}
              onChange={(e) => setAuditorTitle(e.target.value)}
              placeholder="مثال: مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Information Callout */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>أثر التعديل في المنصة المدرسية:</span>
            </div>
            <ul className="text-[10px] text-slate-300 list-disc list-inside space-y-0.5 leading-relaxed pr-1">
              <li>يظهر الاسم المعتمد في ترويسة وتوقيعات كشوفات رصد درجات الامتحانات اليومية والفصلية.</li>
              <li>يُدرج تلقائياً في جداول الامتحانات الرسمية الخمسة المعتمدة لكافة الصفوف.</li>
              <li>يتم الحفظ الفوري في النظام وتحديث سجلات اللجنة الامتحانية المركزية.</li>
            </ul>
          </div>

          {/* Success Feedback Banner */}
          {isSavedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم حفظ واعتماد مسؤولة الكنترول والتدقيق بنجاح!</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التعديل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
