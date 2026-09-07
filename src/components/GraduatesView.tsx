/**
 * Graduates & Alumni Register Component
 * صفحة الخريجون - ثانوية ميسان للمتميزات
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { GraduateStudent } from '../types';
import {
  GraduationCap,
  Award,
  Crown,
  Search,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Printer,
  Download,
  Building2,
  UserCheck,
  X,
  CheckCircle2,
  Filter,
  Medal,
  BookOpen,
  Upload,
  Image as ImageIcon,
  Camera,
  Check,
  User,
  RotateCcw,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
];

const POPULAR_SPECIALTIES = [
  'كلية الطب البشري - جامعة بغداد',
  'كلية الطب العام - جامعة ميسان',
  'كلية طب الأسنان - جامعة ميسان',
  'كلية الصيدلة - جامعة ميسان',
  'هندسة الذكاء الاصطناعي وهندسة الحاسبات',
  'كلية الهندسة - قسم العمارة',
  'كلية الهندسة الكيمياوية والنفطية',
];

const HONOR_BADGES = [
  'وسام التميز الوزاري 🥇',
  'درع الطالبة الأولى على العراق 🏆',
  'وسام التفوق والامتياز الأكاديمي 🌟',
  'وسام الإبداع والبحث العلمي 💎',
  'شهادة شرف وريادة ثانوية ميسان 🎖️',
];

export const GraduatesView: React.FC<{ onOpenPromotionModal?: () => void }> = ({
  onOpenPromotionModal,
}) => {
  const { graduates, addGraduate, updateGraduate, deleteGraduate, role, lang } = useApp();

  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGraduate, setEditingGraduate] = useState<GraduateStudent | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<GraduateStudent, 'id'>>({
    name: '',
    graduationYear: '2026/2027',
    gpa: 99.0,
    section: 'أ',
    collegeOrSpecialty: 'كلية الطب البشري - جامعة بغداد',
    notes: 'طالبة متفوقة خريجة ثانوية ميسان للمتميزات',
    honorBadge: 'وسام التميز الوزاري 🥇',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  });

  // Get unique graduation years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(graduates.map((g) => g.graduationYear)));
    return years.sort().reverse();
  }, [graduates]);

  // Filter and Sort Graduates by Descending GPA (الأعلى معدلاً أولاً)
  const filteredGraduates = useMemo(() => {
    return graduates
      .filter((g) => {
        const matchesYear = selectedYear === 'ALL' || g.graduationYear === selectedYear;
        const matchesSearch =
          g.name.includes(searchQuery) ||
          (g.collegeOrSpecialty && g.collegeOrSpecialty.includes(searchQuery)) ||
          (g.notes && g.notes.includes(searchQuery));
        return matchesYear && matchesSearch;
      })
      .sort((a, b) => b.gpa - a.gpa); // Sorted by highest GPA
  }, [graduates, selectedYear, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (graduates.length === 0) return { total: 0, highestGpa: 0, avgGpa: 0, medicalAcceptances: 0 };
    const highestGpa = Math.max(...graduates.map((g) => g.gpa));
    const avgGpa = (graduates.reduce((acc, g) => acc + g.gpa, 0) / graduates.length).toFixed(1);
    const medicalAcceptances = graduates.filter(
      (g) => g.collegeOrSpecialty && (g.collegeOrSpecialty.includes('طب') || g.collegeOrSpecialty.includes('صيدلة'))
    ).length;
    return {
      total: graduates.length,
      highestGpa,
      avgGpa,
      medicalAcceptances,
    };
  }, [graduates]);

  // Process and optimize uploaded image
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 8 ميغابايت.');
      return;
    }
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to optimal dimensions (max 500x500)
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setFormData((prev) => ({ ...prev, avatar: dataUrl }));
        } else {
          setFormData((prev) => ({ ...prev, avatar: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveGraduate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingGraduate) {
      updateGraduate(editingGraduate.id, formData);
      setEditingGraduate(null);
      setSuccessToast(`تم تعديل بيانات الخريجة (${formData.name}) بنجاح ✓`);
    } else {
      addGraduate(formData);
      setIsAddModalOpen(false);
      setSuccessToast(`تمت إضافة الخريجة (${formData.name}) إلى السجل الذهبي بنجاح 🎓✓`);
    }

    setTimeout(() => setSuccessToast(null), 4000);

    // Reset Form
    setFormData({
      name: '',
      graduationYear: '2025/2026',
      gpa: 99.0,
      section: 'أ',
      collegeOrSpecialty: 'كلية الطب البشري - جامعة بغداد',
      notes: 'طالبة متفوقة خريجة ثانوية ميسان للمتميزات',
      honorBadge: 'وسام التميز الوزاري 🥇',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    });
  };

  const handleOpenEdit = (grad: GraduateStudent) => {
    setEditingGraduate(grad);
    setFormData({
      name: grad.name,
      graduationYear: grad.graduationYear,
      gpa: grad.gpa,
      section: grad.section || 'أ',
      collegeOrSpecialty: grad.collegeOrSpecialty || '',
      notes: grad.notes || '',
      honorBadge: grad.honorBadge || 'وسام التميز الوزاري 🥇',
      avatar: grad.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    });
  };

  const handleOpenAdd = () => {
    setEditingGraduate(null);
    setFormData({
      name: '',
      graduationYear: '2025/2026',
      gpa: 99.0,
      section: 'أ',
      collegeOrSpecialty: 'كلية الطب البشري - جامعة بغداد',
      notes: 'طالبة متفوقة خريجة ثانوية ميسان للمتميزات',
      honorBadge: 'وسام التميز الوزاري 🥇',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2 border border-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>السجل الذهبي للخريجات - ثانوية ميسان للمتميزات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>قائمة الخريجات المتفوقات (الخريجون)</span>
              <GraduationCap className="w-8 h-8 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              سجل الشرف للخريجات المتخرجات من ثانوية ميسان للمتميزات، مرتبة حسّب أعلى المعدلات الأكاديمية والتخصصات الجامعية الرفيعة.
            </p>
          </div>

          {/* Action Buttons for Admin */}
          <div className="flex flex-wrap items-center gap-3">
            {role === 'admin' && (
              <>
                {onOpenPromotionModal && (
                  <button
                    type="button"
                    onClick={onOpenPromotionModal}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>ترحيل ونقل الطالبات 🎓</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة خريجة للسجل الذهبي 🎓</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة السجل</span>
            </button>
          </div>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[11px] font-bold text-slate-400">إجمالي الخريجات</span>
            <span className="text-2xl font-black text-amber-400">{stats.total} خريجة</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[11px] font-bold text-slate-400">أعلى معدل تخرج</span>
            <span className="text-2xl font-black text-teal-400">{stats.highestGpa}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[11px] font-bold text-slate-400">متوسط معدل الدفعات</span>
            <span className="text-2xl font-black text-indigo-300">{stats.avgGpa}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[11px] font-bold text-slate-400">قبولات المجموعات الطبية</span>
            <span className="text-2xl font-black text-emerald-400">{stats.medicalAcceptances} قبول</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Years Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedYear('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedYear === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>جميع الدفعات ({graduates.length})</span>
          </button>

          {availableYears.map((yr) => {
            const count = graduates.filter((g) => g.graduationYear === yr).length;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedYear === yr
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>دفعة {yr} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم الخريجة أو الكلية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>

      </div>

      {/* Sorting Note */}
      <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-bold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <span>تم ترتيب الخريجات تلقائياً حسّب أعلى معدل تراكمي (تنازلياً من الأولى إلى الأقل).</span>
      </div>

      {/* Graduates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGraduates.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">لا توجد سجلات خريجات لعام أو بحث هذا المدخل</h3>
            <p className="text-xs text-slate-500">يمكنك استخدام زر إضافة خريجة أو تنفيذ نظام ترحيل الطالبات.</p>
          </div>
        ) : (
          filteredGraduates.map((grad, index) => {
            const isTop3 = index < 3;
            return (
              <div
                key={grad.id}
                className={`relative p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4 ${
                  index === 0
                    ? 'bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-300 dark:border-amber-700 shadow-xl ring-2 ring-amber-400/30'
                    : index === 1
                    ? 'bg-gradient-to-b from-slate-100/90 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-300 dark:border-slate-700 shadow-lg'
                    : index === 2
                    ? 'bg-gradient-to-b from-amber-900/10 to-white dark:from-slate-800/20 dark:to-slate-900 border-amber-800/30 dark:border-slate-800 shadow-lg'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md'
                }`}
              >
                
                {/* Top Badge Overlay */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-[11px] font-black border border-amber-400/30">
                    دفعة {grad.graduationYear}
                  </span>

                  {index === 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1">
                      🥇 المركز الأول ({grad.gpa}%)
                    </span>
                  )}
                  {index === 1 && (
                    <span className="px-3 py-1 rounded-full bg-slate-300 text-slate-900 font-black text-[11px] shadow-md flex items-center gap-1">
                      🥈 المركز الثاني ({grad.gpa}%)
                    </span>
                  )}
                  {index === 2 && (
                    <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-black text-[11px] shadow-md flex items-center gap-1">
                      🥉 المركز الثالث ({grad.gpa}%)
                    </span>
                  )}
                  {index >= 3 && (
                    <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-extrabold text-[11px] border border-teal-200 dark:border-teal-800">
                      معدل {grad.gpa}%
                    </span>
                  )}
                </div>

                {/* Graduate Avatar & Info */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2">
                  <div className="relative">
                    <img
                      src={grad.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={grad.name}
                      className={`w-28 h-28 rounded-full object-cover shadow-xl border-4 ${
                        index === 0
                          ? 'border-amber-400'
                          : index === 1
                          ? 'border-slate-300'
                          : index === 2
                          ? 'border-amber-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-900 text-white font-black text-xs shadow-md whitespace-nowrap">
                      {grad.gpa}%
                    </span>
                  </div>

                  <div className="pt-2 space-y-1">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {grad.name}
                    </h3>
                    {grad.section && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                        شعبة ({grad.section}) - متخرجة من المتميزات
                      </span>
                    )}
                  </div>
                </div>

                {/* College / Specialty Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-extrabold">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>القبول الجامعي والتخصص:</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-bold pr-6">
                    {grad.collegeOrSpecialty || 'كلية الطب البشري / الهندسة'}
                  </p>

                  {grad.honorBadge && (
                    <div className="flex items-center gap-1.5 pt-1 text-amber-700 dark:text-amber-300 font-bold">
                      <Medal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>الوسام:</span>
                      <span>{grad.honorBadge}</span>
                    </div>
                  )}

                  {grad.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700/50">
                      "{grad.notes}"
                    </p>
                  )}
                </div>

                {/* Admin Controls */}
                {role === 'admin' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(grad)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-500" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الخريجة (${grad.name})؟`)) {
                          deleteGraduate(grad.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold transition-colors cursor-pointer"
                      title="حذف الخريجة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Graduate Modal */}
      {(isAddModalOpen || editingGraduate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 text-right">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                    <span>{editingGraduate ? 'تعديل بيانات الخريجة المتفوقة' : 'إضافة خريجة جديدة إلى السجل الذهبي'}</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-300">
                    توثيق بيانات الطالبة المتفوقة في سجل شرف ثانوية ميسان للمتميزات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingGraduate(null);
                }}
                className="p-2 rounded-2xl bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGraduate} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Photo Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>الصورة الشخصية للطالبة الخريجة:</span>
                  </label>
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: '' })}
                      className="text-[11px] text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>إزالة الصورة</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Frame */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="صورة الخريجة"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 cursor-pointer"
                      title="رفع صورة جديدة"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dropzone / Upload controls */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-4 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        اضغطي هنا لرفع الصورة الشخصية أو اسحبي الملف وأفلتيه
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                        يدعم ملفات JPG, PNG, WebP (يتم الضبط والتحسين تلقائياً)
                      </p>
                    </div>

                    {imageError && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <span>⚠️ {imageError}</span>
                      </p>
                    )}

                    {/* Presets or URL */}
                    <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                      <span className="text-[10.5px] font-bold text-slate-500 shrink-0">أو نماذج جاهزة:</span>
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: url })}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 shrink-0 transition-transform ${
                            formData.avatar === url
                              ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/40'
                              : 'border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`نموذج ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الخريجة الكامل الرباعي واللقب:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: نغم علي كاظم الكعبي"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Graduation Year & GPA & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    دفعة وسنة التخرج:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    placeholder="2026/2027"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    المعدل الوزاري التراكمي (%):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="50"
                    max="102"
                    required
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    الشعبة في السادس:
                  </label>
                  <select
                    value={formData.section || 'أ'}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="أ">شعبة أ (متميزات)</option>
                    <option value="ب">شعبة ب (متميزات)</option>
                    <option value="جـ">شعبة جـ (متميزات)</option>
                    <option value="د">شعبة د (متميزات)</option>
                  </select>
                </div>
              </div>

              {/* College / Specialty */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  القبول الجامعي والتخصص الأكاديمي:
                </label>
                <input
                  type="text"
                  value={formData.collegeOrSpecialty}
                  onChange={(e) => setFormData({ ...formData, collegeOrSpecialty: e.target.value })}
                  placeholder="مثال: كلية الطب البشري - جامعة بغداد"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setFormData({ ...formData, collegeOrSpecialty: spec })}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Honor Badge */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  الوسام أو شارة التكريم بالسجل:
                </label>
                <input
                  type="text"
                  value={formData.honorBadge}
                  onChange={(e) => setFormData({ ...formData, honorBadge: e.target.value })}
                  placeholder="مثال: وسام التميز الوزاري 🥇"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {HONOR_BADGES.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setFormData({ ...formData, honorBadge: badge })}
                      className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800"
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes & Achievements */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  إنجازات إضافية وملاحظات الشرف:
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: الحاصلة على المركز الأول على مستوى المحافظة، فائزة بأولمبياد الرياضيات والفيزياء..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGraduate ? 'حفظ تعديلات الخريجة ✓' : 'إضافة الخريجة واعتمادها بالسجل الذهبي 🎓'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingGraduate(null);
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
