/**
 * Quick Edit Principal Name & Leadership Details Modal
 * مدرسة ثانوية ميسان للمتميزات - تعديل اسم وبيانات مديرة المدرسة والترويسة الرسمية
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Save,
  Crown,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Award,
  Stamp,
  FileCheck2,
  Building2,
  CalendarDays,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface QuickEditPrincipalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAdminModal?: () => void;
}

const HONORIFIC_PREFIXES = [
  { label: 'أ.د.', prefix: 'أ.د. ' },
  { label: 'د.', prefix: 'د. ' },
  { label: 'الأستاذة', prefix: 'الأستاذة ' },
  { label: 'المديرة', prefix: 'المديرة ' },
  { label: 'الست', prefix: 'الست ' },
  { label: 'دكتورة', prefix: 'دكتورة ' },
];

const SPECIALIZATION_PRESETS = [
  'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات',
  'دكتوراه في الفيزياء النانوية والتقنيات الحديثة',
  'دكتوراه في الرياضيات التطبيقية والحاسوب',
  'ماجستير الإدارة والقيادة التربوية المتقدمة',
  'دكتوراه المناهج وتقنيات الذكاء الاصطناعي',
  'ماجستير التوجيه والإرشاد التربوي للموهوبين',
];

export const QuickEditPrincipalModal: React.FC<QuickEditPrincipalModalProps> = ({
  isOpen,
  onClose,
  onOpenFullAdminModal,
}) => {
  const { schoolAdminData, updateSchoolAdminData, lang } = useApp();

  const [name, setName] = useState(schoolAdminData.principalName || 'الهام صبيح سعدون');
  const [badge, setBadge] = useState(schoolAdminData.principalBadge || 'المديرة الهام صبيح سعدون');
  const [title, setTitle] = useState(schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات');
  const [degree, setDegree] = useState(schoolAdminData.principalDegree || 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات');
  const [certName, setCertName] = useState(schoolAdminData.principalNameOnCert || schoolAdminData.principalName || 'الهام صبيح سعدون');
  const [syncCert, setSyncCert] = useState(true);
  const [syncTimetable, setSyncTimetable] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(schoolAdminData.principalName || 'الهام صبيح سعدون');
      setBadge(schoolAdminData.principalBadge || 'المديرة الهام صبيح سعدون');
      setTitle(schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات');
      setDegree(schoolAdminData.principalDegree || 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات');
      setCertName(schoolAdminData.principalNameOnCert || schoolAdminData.principalName || 'الهام صبيح سعدون');
      setSavedSuccess(false);
    }
  }, [isOpen, schoolAdminData]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim()) {
      const clean = val.trim();
      const parts = clean.split(' ');
      if (parts.length >= 2) {
        setBadge(`المديرة ${parts[0]} ${parts[1]}`);
      } else {
        setBadge(`المديرة ${clean}`);
      }
      if (syncCert) {
        setCertName(clean);
      }
    }
  };

  const applyPrefix = (prefix: string) => {
    let cleanName = name.trim();
    // remove existing prefixes if already present
    HONORIFIC_PREFIXES.forEach((p) => {
      if (cleanName.startsWith(p.prefix)) {
        cleanName = cleanName.substring(p.prefix.length).trim();
      }
    });
    const newName = `${prefix}${cleanName}`;
    handleNameChange(newName);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'الهام صبيح سعدون';
    const finalBadge = badge.trim() || `المديرة ${finalName}`;
    const finalTitle = title.trim() || 'مديرة ثانوية ميسان للمتميزات';
    const finalDegree = degree.trim() || 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات';
    const finalCertName = syncCert ? finalName : (certName.trim() || finalName);
    const finalTimetableName = syncTimetable ? finalName : finalCertName;

    updateSchoolAdminData({
      principalName: finalName,
      principalBadge: finalBadge,
      principalTitle: finalTitle,
      principalDegree: finalDegree,
      principalNameOnCert: finalCertName,
      principalNameOnTimetable: finalTimetableName,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      id="quick-edit-principal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm font-arabic overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-amber-200 shadow-inner">
              <Crown className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>تعديل اسم وبيانات مديرة المدرسة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold border border-white/30">
                  القيادة والإدارة
                </span>
              </h3>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                تحديث الاسم الرسمي المعتمد في كافة سجلات وشهادات ومخاطبات ثانوية ميسان للمتميزات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5" />
            <span>تم حفظ وتحديث اسم مديرة المدرسة بنجاح في كافة أرجاء المنصة والسجلات!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* 1. Main Name Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الاسم الكامل لمديرة المدرسة *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-inner transition-all"
                placeholder="مثال: الهام صبيح سعدون"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Crown className="w-4 h-4" />
                القيادة العليا
              </span>
            </div>

            {/* Quick Honorific Prefix Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                إضافة لقب سريع:
              </span>
              {HONORIFIC_PREFIXES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPrefix(item.prefix)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 transition-all hover:scale-105"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Badge & Title Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                شارة العرض المصغرة (البادج) *
              </label>
              <input
                type="text"
                required
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                placeholder="مثال: المديرة الهام صبيح سعدون"
              />
              <p className="text-[10px] text-slate-500">يظهر تحت الصورة الشخصية وفي بطاقات المعاينة</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المسمى القيادي والوظيفي *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                placeholder="مثال: مديرة ثانوية ميسان للمتميزات"
              />
              <p className="text-[10px] text-slate-500">المسمى المعتمد في التقارير والكتب الرسمية</p>
            </div>
          </div>

          {/* 3. Degree & Specialization */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>الدرجة العلمية والتخصص الأكاديمي للمديرة *</span>
            </label>
            <input
              type="text"
              required
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              placeholder="مثال: دكتوراه طرائق تدريس العلوم ورعاية المتفوقات"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SPECIALIZATION_PRESETS.slice(0, 3).map((spec, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDegree(spec)}
                  className={`px-2 py-0.5 rounded-md text-[11px] border transition-all ${
                    degree === spec
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Synchronization Toggles */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-indigo-950 dark:text-indigo-300 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              مزامنة وتطبيق الاسم في الوثائق والشهادات:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncCert}
                  onChange={(e) => setSyncCert(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  تحديث توقيع الشهادات المدرسية والنتائج
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncTimetable}
                  onChange={(e) => setSyncTimetable(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  تحديث توقيع جداول الدروس الأسبوعية
                </span>
              </label>
            </div>
          </div>

          {/* 5. Live Preview Stamp Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800/80 dark:to-slate-900 border border-amber-200 dark:border-slate-700 text-center space-y-2">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <Stamp className="w-3.5 h-3.5" />
              معاينة الختم والتوقيع الإداري الرسمي
            </span>
            <div className="py-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">{title}</p>
              <h4 className="text-base font-black text-amber-950 dark:text-amber-300 font-arabic mt-0.5">
                الأستاذة / {name || 'الهام صبيح سعدون'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{degree}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 text-[10px] font-bold text-amber-900 dark:text-amber-300 shadow-xs">
              <span>🏛️ ثانوية ميسان للمتميزات</span>
              <span>•</span>
              <span>وزارة التربية العراقية</span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {onOpenFullAdminModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullAdminModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>فتح لوحة بيانات الإدارة الشاملة</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتحديث اسم المديرة الآن</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
