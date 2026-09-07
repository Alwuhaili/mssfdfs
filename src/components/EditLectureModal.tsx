import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Edit3,
  UploadCloud,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  GraduationCap,
  Sparkles,
  Layers,
  HelpCircle,
  Trash2,
  Eye,
  UserCheck,
  User,
  RotateCcw,
  Loader2,
  Save,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { GradeLevel, LectureResource, LibraryCategory, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import {
  isMaleTeacher,
  getCreatorSupervisorLabel,
  getSupervisorLabel,
  getTeacherSubjectTitle,
} from '../utils/teacherUtils';

interface EditLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: LectureResource | null;
  onSuccess?: (updatedResource: LectureResource) => void;
  userRole?: 'student' | 'teacher' | 'admin' | 'parent' | 'supervisor';
  isAdmin?: boolean;
}

const ALL_GRADES: GradeLevel[] = [
  'الصف الرابع العلمي',
  'الصف الخامس العلمي',
  'الصف السادس العلمي',
  'الصف الأول المتوسط',
  'الصف الثاني المتوسط',
  'الصف الثالث المتوسط',
];

const DEFAULT_SUBJECTS = [
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'علم الاحياء',
  'اللغة العربية',
  'اللغة الانجليزية',
  'الحاسوب',
  'التربية الاسلامية',
  'التربية الاخلاقية',
  'اللغة الفرنسية',
  'اللغة الكردية',
  'الاجتماعيات',
  'جرائم حزب البعث',
];

export const EditLectureModal: React.FC<EditLectureModalProps> = ({
  isOpen,
  onClose,
  lecture,
  onSuccess,
  userRole,
  isAdmin: isAdminProp,
}) => {
  const { currentUser, updateLecture, teachers } = useApp();
  const activeTeacher =
    currentUser?.teacherObj ||
    teachers.find(
      (t) =>
        (currentUser?.id && t.id === currentUser.id) ||
        (currentUser?.name && t.name.toLowerCase() === currentUser.name.toLowerCase())
    );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('الصف السادس العلمي');
  const [category, setCategory] = useState<LibraryCategory>('summary_notes');
  const [chapterOrUnit, setChapterOrUnit] = useState('الفصل الأول');
  const [pageCount, setPageCount] = useState<number>(35);
  const [description, setDescription] = useState('');
  const [sampleContentText, setSampleContentText] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // File replacement states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Populate form with existing lecture details
  useEffect(() => {
    if (lecture && isOpen) {
      setTitle(lecture.title || '');
      if (DEFAULT_SUBJECTS.includes(lecture.subject)) {
        setSubject(lecture.subject);
        setCustomSubject('');
      } else {
        setSubject('أخرى');
        setCustomSubject(lecture.subject || '');
      }
      setGradeLevel(lecture.gradeLevel || 'الصف السادس العلمي');
      setCategory(lecture.category || (lecture.isOfficialBook ? 'curriculum_book' : 'summary_notes'));
      setChapterOrUnit(lecture.chapterOrUnit || 'شامل المنهج');
      setPageCount(lecture.pageCount || 35);
      setDescription(lecture.description || '');
      setSampleContentText(lecture.sampleContentText || '');
      setTeacherName(lecture.teacherName || '');
      setFileSizeText(lecture.fileSize || 'PDF 4.5 MB');

      // Reset file upload replacement states
      setSelectedFile(null);
      setFileDataUrl('');
      setPreviewBlobUrl('');
      setErrorMessage('');
      setSaveSuccess(false);
    }
  }, [lecture, isOpen]);

  // Clean up blob url
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!isOpen || !lecture) return null;

  const handleFileProcess = (file: File) => {
    if (!file) return;
    setErrorMessage('');
    setSelectedFile(file);

    const sizeInMB = file.size / (1024 * 1024);
    const sizeText = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    setFileSizeText(`${ext} ${sizeText}`);

    try {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const newBlobUrl = URL.createObjectURL(file);
      setPreviewBlobUrl(newBlobUrl);
    } catch (e) {
      console.warn('Blob URL creation error:', e);
    }

    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setIsReadingFile(false);
      if (e.target?.result) {
        setFileDataUrl(e.target.result as string);
      }
    };
    reader.onerror = (err) => {
      setIsReadingFile(false);
      console.warn('FileReader error:', err);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveSelectedReplacement = () => {
    setSelectedFile(null);
    setFileDataUrl('');
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileSizeText(lecture.fileSize || 'PDF 4.5 MB');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('يرجى كتابة عنوان المرجع أو الكتاب التعليمي!');
      return;
    }

    setIsSubmitting(true);

    const finalSubject = subject === 'أخرى' && customSubject.trim() ? customSubject.trim() : subject;
    const finalTeacherName = teacherName.trim() || lecture.teacherName || 'أستاذة المادة';

    const updatedData: Partial<LectureResource> = {
      title: title.trim(),
      subject: finalSubject,
      teacherName: finalTeacherName,
      gradeLevel,
      category,
      chapterOrUnit: chapterOrUnit || 'شامل المنهج',
      pageCount: Number(pageCount) || 30,
      description: description.trim(),
      sampleContentText: sampleContentText.trim(),
      isOfficialBook: category === 'curriculum_book',
      fileSize: fileSizeText,
      lastModifiedAt: new Date().toISOString().split('T')[0],
      lastModifiedBy: currentUser?.name || currentUser?.teacherObj?.name || 'الإدارة',
    };

    // If new file was provided, update fileUrl and pdfDataUrl
    if (fileDataUrl || previewBlobUrl) {
      const newFileUrl = fileDataUrl || previewBlobUrl;
      updatedData.fileUrl = newFileUrl;
      updatedData.pdfDataUrl = newFileUrl;
    }

    try {
      updateLecture(lecture.id, updatedData);

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSaveSuccess(false);
        onClose();
        if (onSuccess) {
          onSuccess({
            ...lecture,
            ...updatedData,
          });
        }
      }, 900);
    } catch (err: any) {
      console.error('Error updating lecture:', err);
      setIsSubmitting(false);
      setErrorMessage('حدث خطأ أثناء حفظ التعديلات، يرجى المحاولة مجدداً.');
    }
  };

  const currentRole = currentUser?.role || userRole;
  const isAdmin = isAdminProp ?? (currentRole === 'admin');
  const isSupervisor = currentRole === 'supervisor';

  if (!isOpen || !lecture) return null;

  if (isSupervisor) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto text-3xl">
            🏛️
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              صلاحيات المشرف التربوي - المكتبة والمحاضرات
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              عذراً، يمتلك المشرف التربوي صلاحية الاطلاع الأكاديمي الشامل، القراءة المباشرة، تحميل الكتب وحفظها ومشاركتها فقط، ولا يمتلك صلاحية تعديل أو تحديث محتويات المكتبة الرقمية.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تعديل وتحديث بيانات الكتاب / المرجع
                </h3>
                {isAdmin ? (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>صلاحية إدارة كاملة</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>ملفك المرفوع</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تعديل العنوان، المادة، الصف الدراسي، الوصف، أو استبدال ملف الـ PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl text-xs flex items-center gap-3 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-black text-sm">تم حفظ وتحديث بيانات الكتاب بنجاح! 📚✨</h4>
              <p className="opacity-90">تم تحديث المرجع وتطبيقه فورياً في المكتبة الرقمية لكافة الطالبات.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 p-4 rounded-2xl text-xs flex items-center gap-3 animate-fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>عنوان المرجع أو الكتاب التعليمي: *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: كتاب الرياضيات المنهجي - الجزء الأول (2026/2027)"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>المادة الدراسية:</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {DEFAULT_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="أخرى">مادة أخرى (تحديد يدوي)...</option>
              </select>

              {subject === 'أخرى' && (
                <input
                  type="text"
                  placeholder="اكتب اسم المادة يدوياً..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full mt-2 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Grade Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <span>المرحلة والصف الدراسي:</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {ALL_GRADES.map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Chapter/Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>تصنيف ونوع المرجع:</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LibraryCategory)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="curriculum_book">📕 كتاب منهجي رسمي (وزاري)</option>
                <option value="summary_notes">📝 ملزمة وشروحات المدرسات</option>
                <option value="exam_archive">🎯 بنك الأسئلة والحلول الوزارية</option>
                <option value="worksheet">📑 أوراق عمل وتدريبات واختبارات</option>
                <option value="lecture">🎙️ ملخصات ومحاضرات تعليمية</option>
              </select>
            </div>

            {/* Chapter / Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>الوحدة أو الفصل الدراسي:</span>
              </label>
              <input
                type="text"
                value={chapterOrUnit}
                onChange={(e) => setChapterOrUnit(e.target.value)}
                placeholder="مثال: الفصل الأول / المنهج الكامل"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Teacher Name & Page Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teacher / Supervisor */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>المدرس / المشرف على المادة:</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                disabled={!isAdmin && userRole === 'teacher'}
                placeholder="اسم المدرسة أو المشرفة..."
                className={`w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !isAdmin && userRole === 'teacher'
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              />
              {!isAdmin && userRole === 'teacher' && (
                <p className="text-[10px] text-slate-400">اسم المدرسة مرتبط بحسابك الأكاديمي.</p>
              )}
            </div>

            {/* Page Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>عدد الصفحات التقريبي:</span>
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              نبذة توضيحية عن المرجع أو الملخص:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمحتويات الكتاب أو الملزمة..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Optional: Replace PDF File Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>استبدال أو تحديث ملف الـ PDF (اختياري):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                الملف الحالي: {lecture.fileSize || 'PDF'}
              </span>
            </div>

            {selectedFile ? (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 block truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {fileSizeText} • ملف بديل جديد جاهز للحفظ
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSelectedReplacement}
                  className="p-1.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 transition-colors cursor-pointer"
                  title="إلغاء الملف البديل والاحتفاظ بالملف الأصلي"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  انقري لرفع ملف PDF جديد بديل أو اسحبي الملف هنا
                </span>
                <span className="text-[10px] text-slate-400">
                  (إذا لم تقومي باختيار ملف جديد، سيتم الاحتفاظ بالملف الأصلي الحالي)
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isReadingFile}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ حفظ التحديثات...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات والتحديث 💾</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
