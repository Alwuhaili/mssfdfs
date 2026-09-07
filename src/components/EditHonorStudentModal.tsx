import React, { useState, useEffect, useRef } from 'react';
import { HonorStudent } from '../types';
import {
  X,
  Save,
  Crown,
  Sparkles,
  Star,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  User,
  Upload,
  Camera,
} from 'lucide-react';

interface EditHonorStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
  students: HonorStudent[];
  initialSelectedRank?: 1 | 2 | 3;
  onSaveStudent: (student: HonorStudent) => void;
  onResetDefault?: () => void;
}

const AVATAR_PRESETS = [
  { label: 'طالبة 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 4', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 5', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 6', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 7', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 8', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&auto=format&fit=crop&q=80' },
  { label: 'طالبة 9', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80' },
];

export const EditHonorStudentModal: React.FC<EditHonorStudentModalProps> = ({
  isOpen,
  onClose,
  grade,
  students,
  initialSelectedRank = 1,
  onSaveStudent,
  onResetDefault,
}) => {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [activeRank, setActiveRank] = useState<1 | 2 | 3>(initialSelectedRank);
  const [formData, setFormData] = useState<HonorStudent>({
    rank: 1,
    name: '',
    grade: grade,
    section: 'أ',
    gpa: 99.0,
    avatar: AVATAR_PRESETS[0].url,
    specialty: '',
    dream: '',
  });

  const [savedToast, setSavedToast] = useState(false);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setActiveRank(initialSelectedRank);
  }, [initialSelectedRank, isOpen]);

  useEffect(() => {
    const current = students.find((s) => s.rank === activeRank);
    if (current) {
      setFormData({ ...current });
    } else {
      setFormData({
        rank: activeRank,
        name: '',
        grade: grade,
        section: 'أ',
        gpa: 99.5,
        avatar: AVATAR_PRESETS[0].url,
        specialty: 'الرياضيات والذكاء الإصطناعي',
        dream: 'طبيبة ومخترعة مستقبلية',
      });
    }
  }, [activeRank, grade, students]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStudent(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 font-arabic">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>تعديل لوحة الشرف ({grade})</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-extrabold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  الإدارة فقط
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديث أسماء ومعدلات ومعلومات الطالبات المتفوقات في لوحة الأوائل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rank Selection Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            اختر المركز المطلوب تعديله:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([1, 2, 3] as const).map((rk) => {
              const isSelected = activeRank === rk;
              const studentAtRank = students.find((s) => s.rank === rk);
              return (
                <button
                  key={rk}
                  type="button"
                  onClick={() => setActiveRank(rk)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-1 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">
                      {rk === 1 ? '🥇 المركز الأول' : rk === 2 ? '🥈 المركز الثاني' : '🥉 المركز الثالث'}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {studentAtRank?.name || 'غير محدد'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Success Alert */}
        {savedToast && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
            <span>تم حفظ بيانات الطالبة بنجاح في لوحة الشرف! 🏆</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Student Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>اسم الطالبة الرباعي:</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الطالبة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* GPA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>المعدل الأكاديمي (%) :</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                <span>الشعبة:</span>
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="أ">شعبة (أ)</option>
                <option value="ب">شعبة (ب)</option>
                <option value="ج">شعبة (ج)</option>
                <option value="د">شعبة (د)</option>
              </select>
            </div>

            {/* Rank display */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>المركز الحالي:</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                {formData.rank === 1 ? 'المركز الأول 🥇' : formData.rank === 2 ? 'المركز الثاني 🥈' : 'المركز الثالث 🥉'}
              </div>
            </div>

          </div>

          {/* Avatar URL & File Upload & Presets */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>صورة الطالبة (تحميل من جهازك أو وضع رابط):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">اختر ملف صورة من جهازك أو اختر نموذجاً</span>
            </label>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all"
                title="تغيير صورة الطالبة - فتح مستكشف الملفات"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>تحميل صورة</span>
              </button>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              {Boolean(formData.avatar && formData.avatar.trim()) && (
                <div
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="اضغط لتغيير الصورة من جهازك"
                >
                  <img
                    src={formData.avatar}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 shadow"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 rounded-xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-amber-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-bold">نماذج صور:</span>
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: preset.url })}
                  className="relative group shrink-0"
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className={`w-8 h-8 rounded-lg object-cover border-2 transition-all ${
                      formData.avatar === preset.url ? 'border-amber-500 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Academic Specialty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>مجال التميز والأولمبياد:</span>
            </label>
            <input
              type="text"
              required
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="مثال: أولمبياد الرياضيات والذكاء الاصطناعي..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Future Dream */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>طموح المستقبل:</span>
            </label>
            <input
              type="text"
              required
              value={formData.dream}
              onChange={(e) => setFormData({ ...formData, dream: e.target.value })}
              placeholder="مثال: مهندسة برمجيات وطبيبة جراحة..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {onResetDefault && (
              <button
                type="button"
                onClick={onResetDefault}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط المصنع</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التغييرات 💾</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
