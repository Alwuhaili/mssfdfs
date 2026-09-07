import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Users,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  User,
  Star,
  FileText,
  Gamepad2,
  Upload,
  Camera,
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
} from 'lucide-react';

export interface FacultyMember {
  id: string;
  name: string;
  roleTitle: string;
  subject: string;
  avatar: string;
  degree: string;
  researchCount: number;
  booksCount: number;
  gamesCount: number;
  achievements: string[];
}

interface EditFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyList: FacultyMember[];
  onSaveFacultyList: (list: FacultyMember[]) => void;
  onResetDefault?: () => void;
  initialTeacherId?: string;
  openInAddMode?: boolean;
}

const AVATAR_PRESETS = [
  { label: 'أستاذة 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 3', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 5', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 6', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 7', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
  { label: 'أستاذة 8', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80' },
];

export const EditFacultyModal: React.FC<EditFacultyModalProps> = ({
  isOpen,
  onClose,
  facultyList,
  onSaveFacultyList,
  onResetDefault,
  initialTeacherId,
  openInAddMode = false,
}) => {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [localList, setLocalList] = useState<FacultyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<FacultyMember | null>(null);

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

  // Active form data
  const [formData, setFormData] = useState<FacultyMember>({
    id: '',
    name: '',
    roleTitle: '',
    subject: '',
    avatar: AVATAR_PRESETS[0].url,
    degree: '',
    researchCount: 0,
    booksCount: 0,
    gamesCount: 0,
    achievements: [''],
  });

  useEffect(() => {
    if (isOpen) {
      setLocalList(facultyList);
      if (openInAddMode) {
        createNewTeacher(facultyList);
      } else if (initialTeacherId && facultyList.some((f) => f.id === initialTeacherId)) {
        setSelectedId(initialTeacherId);
        const target = facultyList.find((f) => f.id === initialTeacherId);
        if (target) setFormData({ ...target });
      } else if (facultyList.length > 0) {
        setSelectedId(facultyList[0].id);
        setFormData({ ...facultyList[0] });
      } else {
        createNewTeacher(facultyList);
      }
    }
  }, [isOpen, facultyList, initialTeacherId, openInAddMode]);

  const handleSelectTeacher = (id: string) => {
    setSelectedId(id);
    const target = localList.find((f) => f.id === id);
    if (target) {
      setFormData({ ...target });
    }
  };

  const createNewTeacher = (baseList = localList) => {
    const newId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newTeacher: FacultyMember = {
      id: newId,
      name: 'أستاذة جديدة',
      roleTitle: 'مدرسة مادة أولى',
      subject: 'العلوم والأبحاث التخصصية',
      avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].url,
      degree: 'ماجستير علوم وتدريس',
      researchCount: 1,
      booksCount: 1,
      gamesCount: 1,
      achievements: ['إشراف على مشاريع الطالبات والابتكارات المدرسية والمهرجانات العلمية'],
    };
    const updated = [...baseList, newTeacher];
    setLocalList(updated);
    setSelectedId(newId);
    setFormData(newTeacher);
    onSaveFacultyList(updated);
    setSavedToast('تمت إضافة عضو هيئة تدريسية جديد! يمكنكِ تعديل بياناته الآن 📝');
    setTimeout(() => setSavedToast(null), 3000);
  };

  // Perform permanent teacher deletion
  const executeDeleteTeacher = (teacher: FacultyMember) => {
    const updated = localList.filter((f) => f.id !== teacher.id);
    setLocalList(updated);
    onSaveFacultyList(updated);

    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving faculty list after deletion', e);
    }

    if (updated.length > 0) {
      const nextTeacher = updated[0];
      setSelectedId(nextTeacher.id);
      setFormData({ ...nextTeacher });
    } else {
      setSelectedId('');
      setFormData({
        id: '',
        name: '',
        roleTitle: '',
        subject: '',
        avatar: AVATAR_PRESETS[0].url,
        degree: '',
        researchCount: 0,
        booksCount: 0,
        gamesCount: 0,
        achievements: [''],
      });
    }

    setDeleteConfirmTeacher(null);
    setSavedToast(`تم حذف الأستاذة (${teacher.name}) من الهيئة التدريسية بنجاح 🗑️`);
    setTimeout(() => setSavedToast(null), 3500);
  };

  // Sort faculty list alphabetically by full name
  const handleSortAlphabetically = (ascending: boolean = true) => {
    const sorted = [...localList].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base', numeric: true });
      return ascending ? cmp : -cmp;
    });
    setLocalList(sorted);
    onSaveFacultyList(sorted);
    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(sorted));
    } catch (e) {
      console.error('Error persisting sorted faculty list', e);
    }
    setSavedToast(
      ascending
        ? 'تم ترتيب أسماء الهيئة التدريسية أبجدياً (أ ← ي) وحفظ الترتيب بنجاح 🔤'
        : 'تم ترتيب أسماء الهيئة التدريسية أبجدياً (ي ← أ) وحفظ الترتيب بنجاح 🔤'
    );
    setTimeout(() => setSavedToast(null), 3500);
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAch = [...formData.achievements];
    newAch[index] = value;
    setFormData({ ...formData, achievements: newAch });
  };

  const handleAddAchievement = () => {
    setFormData({ ...formData, achievements: [...formData.achievements, ''] });
  };

  const handleRemoveAchievement = (index: number) => {
    if (formData.achievements.length <= 1) return;
    const newAch = formData.achievements.filter((_, i) => i !== index);
    setFormData({ ...formData, achievements: newAch });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Filter empty achievements
    const cleanedAchievements = formData.achievements.filter((a) => a.trim().length > 0);
    const updatedForm = {
      ...formData,
      achievements: cleanedAchievements.length > 0 ? cleanedAchievements : ['إنجازات أكاديمية ومشاركة بالمهرجانات والمعارض العلمية'],
    };

    let updatedList: FacultyMember[] = [];
    const exists = localList.some((item) => item.id === selectedId);
    if (exists) {
      updatedList = localList.map((item) => (item.id === selectedId ? updatedForm : item));
    } else {
      updatedList = [...localList, updatedForm];
    }

    setLocalList(updatedList);
    onSaveFacultyList(updatedList);

    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error persisting faculty list', e);
    }

    setSavedToast('تم حفظ وتحديث بيانات وإنجازات الهيئة التدريسية بنجاح! 🎓');
    setTimeout(() => {
      setSavedToast(null);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 font-arabic">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>تعديل الهيئة التدريسية والإنجازات الأكاديمية</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-extrabold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  المديرة والإدارة 🔒
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إضافة وحذف وتعديل بيانات المدرسات والبحوث والمؤلفات والألعاب والابتكارات
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

        {/* Teacher Selection List & Add New Button */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>اختر الأستاذة/المدرسة لتعديلها أو حذفها:</span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">({localList.length} أستاذة مسجلة)</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              {localList.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSortAlphabetically(true)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-teal-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
                    title="ترتيب أسماء الهيئة التدريسية أبجدياً (أ إلى ي)"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>أبجدياً (أ ← ي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSortAlphabetically(false)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-teal-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
                    title="ترتيب أسماء الهيئة التدريسية أبجدياً (ي إلى أ)"
                  >
                    <ArrowUpZA className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>أبجدياً (ي ← أ)</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => createNewTeacher()}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة أستاذة جديدة</span>
              </button>
            </div>
          </div>

          {localList.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold text-center space-y-2">
              <p>قائمة الهيئة التدريسية فارغة حالياً. اضغطي على زر إضافة أستاذة جديدة لإدراج كادر تدريسي.</p>
              <button
                type="button"
                onClick={() => createNewTeacher()}
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-teal-400"
              >
                + إضافة أستاذة الآن
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {localList.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center rounded-2xl border text-xs font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-400/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTeacher(item.id)}
                      className="px-3.5 py-2 flex items-center gap-2 text-right"
                    >
                      <img
                        src={item.avatar || AVATAR_PRESETS[0].url}
                        alt={item.name}
                        className="w-6 h-6 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="truncate max-w-[140px]">{item.name || 'بدون اسم'}</span>
                    </button>

                    {/* Quick direct delete icon on teacher chip */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmTeacher(item);
                      }}
                      className="p-1.5 ml-1 mr-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                      title={`حذف الأستاذة (${item.name})`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Success Alert */}
        {savedToast && (
          <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {/* Confirmation Modal for Deleting Teacher */}
        {deleteConfirmTeacher && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-rose-800 dark:text-rose-300">
                  تأكيد حذف الأستاذة ({deleteConfirmTeacher.name}) نهائياً
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  هل أنتِ متأكدة من حذف هذه الأستاذة وكافة إنجازاتها الأكاديمية من سجلات الهيئة التدريسية لمدرسة المتميزات؟
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmTeacher(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => executeDeleteTeacher(deleteConfirmTeacher)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، احذف الأستاذة الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Form for Active Selected Teacher */}
        {selectedId && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Teacher Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-500" />
                  <span>الاسم واللقب العلمي:</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل الاسم الثلاثي واللقب العلمي..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Role Title / Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-500" />
                  <span>الصفة والمنصب المدرسي:</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  placeholder="مثال: كبير مدرسي الفيزياء والعلوم الحديثة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                  <span>المادة والتخصص:</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="مثال: الفيزياء والفيزياء الفلكية..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Degree */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span>الشهادة والدرجة العلمية:</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="مثال: دكتوراه في فيزياء الحالة الصلبة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

            </div>

            {/* Counts Grid (Research, Books, Games) */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              
              {/* Research Count */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>عدد البحوث المحكمة:</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.researchCount}
                  onChange={(e) => setFormData({ ...formData, researchCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              {/* Books Count */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>عدد الكتب المؤلفة:</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.booksCount}
                  onChange={(e) => setFormData({ ...formData, booksCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              {/* Games Count */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>الألعاب التعليمية:</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.gamesCount}
                  onChange={(e) => setFormData({ ...formData, gamesCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

            </div>

            {/* Avatar URL & File Upload & Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
                  <span>صورة المدرسة (تحميل من جهازك أو اختيار نموذج):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">اختر ملف صورة من جهازك أو اضغط على نموذج</span>
              </label>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all"
                  title="تغيير صورة المدرسة - فتح مستكشف الملفات"
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
                      className="w-10 h-10 rounded-xl object-cover border-2 border-teal-400 shadow"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 rounded-xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-4 h-4 text-teal-300" />
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
                        formData.avatar === preset.url ? 'border-teal-500 scale-110 shadow-md ring-2 ring-teal-400/50' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements Dynamic Bullet List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>قائمة أبرز الإنجازات والأبحاث والابتكارات:</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة نقطة إنجاز</span>
                </button>
              </div>

              <div className="space-y-2">
                {formData.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-black text-teal-500">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={ach}
                      onChange={(e) => handleAchievementChange(idx, e.target.value)}
                      placeholder="أدخل إنجازاً علمياً أو بحثاً أو كتاباً..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {formData.achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="حذف هذه النقطة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Delete Current Teacher Button */}
                <button
                  type="button"
                  onClick={() => {
                    const current = localList.find((f) => f.id === selectedId) || formData;
                    setDeleteConfirmTeacher(current);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-extrabold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1.5 shadow-sm"
                  title="تفعيل حذف الأستاذة الحالية"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>حذف الأستاذة ({formData.name || 'الحالية'})</span>
                </button>

                {onResetDefault && (
                  <button
                    type="button"
                    onClick={onResetDefault}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة ضبط</span>
                  </button>
                )}
              </div>

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
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ بيانات الهيئة التدريسية 💾</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

