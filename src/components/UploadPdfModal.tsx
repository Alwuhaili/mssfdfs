import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
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
  FileSpreadsheet,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { GradeLevel, LectureResource, LibraryCategory } from '../types';
import { useApp } from '../context/AppContext';
import {
  isMaleTeacher,
  getCreatorSupervisorLabel,
  getSupervisorLabel,
  getTeacherSubjectTitle,
} from '../utils/teacherUtils';
import { UniversalDocumentViewer } from './UniversalDocumentViewer';

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newResource: LectureResource) => void;
  defaultSubject?: string;
  defaultGrade?: GradeLevel;
  defaultTeacherName?: string;
  defaultCategory?: LibraryCategory;
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

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultSubject,
  defaultGrade,
  defaultTeacherName,
  defaultCategory,
}) => {
  const { currentUser, addLecture, teachers } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically resolve the creator / supervisor teacher name strictly from current user session
  const autoResolvedTeacherName = useMemo(() => {
    if (defaultTeacherName && defaultTeacherName.trim()) {
      return defaultTeacherName.trim();
    }
    if (currentUser?.teacherObj?.name && currentUser.teacherObj.name.trim()) {
      return currentUser.teacherObj.name.trim();
    }
    if (currentUser?.name && currentUser.name.trim()) {
      return currentUser.name.trim();
    }
    if (currentUser?.email) {
      const match = teachers?.find(
        (t) =>
          (currentUser?.id && t.id === currentUser.id) ||
          t.email.toLowerCase() === currentUser.email?.toLowerCase()
      );
      if (match?.name) return match.name;
    }
    if (teachers && teachers.length > 0) {
      return teachers[0].name;
    }
    return 'أستاذة المادة';
  }, [currentUser, defaultTeacherName, teachers]);

  // Derive initial subject from current user or defaults
  const autoResolvedSubject = useMemo(() => {
    if (defaultSubject) return defaultSubject;
    if (currentUser?.subject) return currentUser.subject;
    if (currentUser?.teacherObj?.subject) return currentUser.teacherObj.subject;
    return DEFAULT_SUBJECTS[0];
  }, [defaultSubject, currentUser]);

  // Derive initial grade
  const autoResolvedGrade = useMemo<GradeLevel>(() => {
    if (defaultGrade) return defaultGrade;
    if (currentUser?.gradeLevel) return currentUser.gradeLevel;
    if (currentUser?.assignedGrades && currentUser.assignedGrades.length > 0) {
      return currentUser.assignedGrades[0];
    }
    if (currentUser?.teacherObj?.assignedGrades && currentUser.teacherObj.assignedGrades.length > 0) {
      return currentUser.teacherObj.assignedGrades[0];
    }
    return 'الصف السادس العلمي';
  }, [defaultGrade, currentUser]);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(autoResolvedSubject);
  const [customSubject, setCustomSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(autoResolvedGrade);
  const [category, setCategory] = useState<LibraryCategory>(defaultCategory || 'summary_notes');
  const [chapterOrUnit, setChapterOrUnit] = useState('الفصل الأول');
  const [pageCount, setPageCount] = useState<number>(35);
  const [description, setDescription] = useState('');
  const [sampleContentText, setSampleContentText] = useState('');
  const [teacherName, setTeacherName] = useState(autoResolvedTeacherName);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [fileSizeText, setFileSizeText] = useState<string>('PDF 4.5 MB');
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [showInModalPreview, setShowInModalPreview] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sync state when modal opens or current user changes
  useEffect(() => {
    if (isOpen) {
      setTeacherName(autoResolvedTeacherName);
      if (defaultSubject) setSubject(defaultSubject);
      if (defaultGrade) setGradeLevel(defaultGrade);
      if (defaultCategory) setCategory(defaultCategory);
      setErrorMessage('');
      setShowInModalPreview(false);
    }
  }, [isOpen, autoResolvedTeacherName, defaultSubject, defaultGrade, defaultCategory]);

  // Clean up blob url on unmount or file clear
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file) return;

    setErrorMessage('');
    setSelectedFile(file);

    // Format size text
    const sizeInMB = file.size / (1024 * 1024);
    const sizeText = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    setFileSizeText(`${ext} ${sizeText}`);

    // Auto populate title if currently empty
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setTitle(cleanName);
    }

    // Create synchronous preview URL immediately
    try {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const newBlobUrl = URL.createObjectURL(file);
      setPreviewBlobUrl(newBlobUrl);
    } catch (e) {
      console.warn('Blob URL creation error:', e);
    }

    // Read as Data URL for offline/IndexedDB caching
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

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFileDataUrl('');
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
    }
    setShowInModalPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('يرجى كتابة عنوان المرجع أو الكتاب التعليمي!');
      return;
    }

    setIsSubmitting(true);

    const finalSubject = customSubject.trim() ? customSubject.trim() : subject;
    const isMale = isMaleTeacher(teacherName || autoResolvedTeacherName);
    const supervisorRoleLabel = getSupervisorLabel(teacherName || autoResolvedTeacherName);
    const fallbackTitle = isMale ? 'أستاذ المادة' : 'أستاذة المادة';
    const finalTeacherName = teacherName.trim() || autoResolvedTeacherName || fallbackTitle;

    // Use fileDataUrl if ready, or fallback to previewBlobUrl or generated descriptor
    const finalPdfUrl = fileDataUrl || previewBlobUrl || '#';

    const newResourceData: Omit<LectureResource, 'id' | 'uploadedAt'> = {
      title: title.trim(),
      subject: finalSubject,
      teacherName: finalTeacherName,
      gradeLevel,
      type: 'pdf',
      fileUrl: finalPdfUrl,
      pdfDataUrl: finalPdfUrl,
      description:
        description.trim() ||
        `ملف تعليمي ومورد رقمي بصيغة PDF في مادة ${finalSubject} لـ (${gradeLevel})، تم إعداده وتوفيره من قِبل ${finalTeacherName}.`,
      fileSize: fileSizeText,
      category,
      pageCount: Number(pageCount) || 30,
      chapterOrUnit: chapterOrUnit || 'شامل المنهج',
      isOfficialBook: category === 'curriculum_book',
      sampleContentText:
        sampleContentText.trim() ||
        `ملخص المورد التعليمي: ${title.trim()}\nالمادة: ${finalSubject} | الصف: ${gradeLevel}\n${supervisorRoleLabel}: ${finalTeacherName}\n\nيحتوي هذا الملف على شرح مفصل للمفاهيم الأساسية، ملخص القوانين والمسائل المحلولة، والتطبيقات النموذجية وفق المنهج الدراسي لثانوية ميسان للمتميزات.`,
      chapters: [
        {
          id: 'ch-1',
          title: `الوحدة الأولى: أساسيات ${finalSubject}`,
          pageNumber: 1,
          summary: 'المفاهيم والنظريات الأساسية للمقرر',
        },
        {
          id: 'ch-2',
          title: `الوحدة الثانية: التمارين والمسائل المحلولة`,
          pageNumber: Math.max(2, Math.round((Number(pageCount) || 30) * 0.3)),
          summary: 'أمثلة تطبيقية وتدريبات نموذجية',
        },
        {
          id: 'ch-3',
          title: `الوحدة الثالثة: الأسئلة الوزارية والمراجعة الشاملة`,
          pageNumber: Math.max(3, Math.round((Number(pageCount) || 30) * 0.7)),
          summary: 'بنك الأسئلة والحلول النموذجية المعتمدة',
        },
      ],
      downloadCount: 1,
      viewsCount: 1,
      academicYear: '2026 - 2027',
      uploaderId: currentUser?.id || currentUser?.teacherObj?.id || 'uploader-current',
      uploaderName: currentUser?.name || currentUser?.teacherObj?.name || finalTeacherName,
      uploaderRole: currentUser?.role || 'teacher',
    };

    try {
      addLecture(newResourceData);

      setUploadSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setUploadSuccess(false);
        onClose();
        if (onSuccess) {
          onSuccess({
            ...newResourceData,
            id: `lec-${Date.now()}`,
            uploadedAt: new Date().toISOString().split('T')[0],
          });
        }
      }, 1000);
    } catch (err: any) {
      console.error('Error adding lecture:', err);
      setIsSubmitting(false);
      setErrorMessage('حدث خطأ أثناء حفظ الملف، يرجى المحاولة مجدداً.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                رفع كتاب أو ملف تعليمي للمكتبة الرقمية (PDF)
              </h3>
              <p className="text-xs text-slate-500">
                إتاحة الكتب والملازم وأوراق العمل فورياً للطالبات في لوحة التحكم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-emerald-900">تم رفع ونشر الملف في المكتبة الرقمية بنجاح! 📚✨</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              أصبح بإمكان الطالبات الآن الاطلاع على الملف وقراءته وتحميله مباشرة من حساباتهن.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/80 hover:bg-indigo-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-emerald-900">
                    <div className="flex items-center gap-2.5 text-right">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        {isReadingFile ? (
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs block text-slate-900 truncate max-w-xs sm:max-w-sm">
                          {selectedFile.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-mono font-semibold">
                          <span>{fileSizeText}</span>
                          <span>•</span>
                          <span className="text-emerald-800 font-sans font-bold">
                            {isReadingFile ? 'جاري تجهيز الملف...' : 'جاهز للرفع والنشر'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {previewBlobUrl && (
                        <button
                          type="button"
                          onClick={() => setShowInModalPreview(!showInModalPreview)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 border border-indigo-200 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{showInModalPreview ? 'إخفاء المعاينة' : 'معاينة'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveSelectedFile}
                        className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-600 transition-colors"
                        title="حذف واختيار ملف آخر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* High-fidelity Live HTML5 Canvas Document Preview (Never blocked by Chrome/iframes) */}
                  {showInModalPreview && (previewBlobUrl || fileDataUrl || selectedFile) && (
                    <div
                      className="mt-3 overflow-hidden text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UniversalDocumentViewer
                        file={selectedFile}
                        url={previewBlobUrl || fileDataUrl}
                        fileName={selectedFile.name}
                        title={title || selectedFile.name}
                        maxHeight="340px"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    اسحبي وأفلتي ملف الـ PDF هنا، أو <span className="text-indigo-600 underline">انقري للاختيار من جهازكِ</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    يدعم ملفات PDF والكتب الإلكترونية والمستندات التعليمية (حتى 50 ميغابايت)
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الكتاب / المرجع التعليمي *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: كتاب الرياضيات للصف السادس العلمي - الجزء الأول"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category & Grade Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع وتصنيف المرجع *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LibraryCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="curriculum_book">📕 كتاب منهجي رسمي (وزارة التربية)</option>
                  <option value="summary_notes">
                    📝 ملزمة وملخص {isMaleTeacher(teacherName || autoResolvedTeacherName) ? 'أستاذ المادة' : 'أستاذة المادة'}
                  </option>
                  <option value="exam_archive">🎯 بنك الأسئلة والحلول الوزارية</option>
                  <option value="worksheet">📑 أوراق عمل واختبارات تدريبية</option>
                  <option value="lecture">🎥 محاضرة ومورد رقمي عام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الصف الدراسي المستهدف *
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {ALL_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject & Teacher Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المادة الدراسية *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {DEFAULT_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {getCreatorSupervisorLabel(teacherName || autoResolvedTeacherName)} *
                  </label>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>تلقائي من حسابك الحالي</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={
                      isMaleTeacher(teacherName || autoResolvedTeacherName)
                        ? 'اسم المدرس المشرف...'
                        : 'اسم المدرسة المشرفة...'
                    }
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 pl-9"
                  />
                  {teacherName !== autoResolvedTeacherName && (
                    <button
                      type="button"
                      onClick={() => setTeacherName(autoResolvedTeacherName)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 text-slate-500 text-[10px] flex items-center gap-1 cursor-pointer"
                      title="استعادة اسم المستخدم الحالي"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isMaleTeacher(autoResolvedTeacherName) ? 'المشرف الحالي:' : 'المشرفة الحالية:'}{' '}
                  <strong className="text-indigo-600 font-bold">{autoResolvedTeacherName}</strong>
                </p>
              </div>
            </div>

            {/* Chapter & Page Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الفصل / الباب / الوحدة الدراسية
                </label>
                <input
                  type="text"
                  placeholder="مثال: الفصل الثالث - التكامل وتطبيقاته"
                  value={chapterOrUnit}
                  onChange={(e) => setChapterOrUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عدد الصفحات التقديري
                </label>
                <input
                  type="number"
                  min={1}
                  max={1200}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نبذة ووصف محتوى الملف للطلبة
              </label>
              <textarea
                rows={2}
                placeholder="اكتبي ملخصاً عن الموضوعات التي يغطيها هذا الكتاب أو الملزمة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Sample Content Outline for direct in-app reading */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>ملخص المحتوى أو نص الدرس للقراءة الفورية داخل المنصة (اختياري)</span>
                <span className="text-[10px] text-indigo-600 font-bold">✨ ميزة العرض التفاعلي</span>
              </label>
              <textarea
                rows={3}
                placeholder="يمكنكِ إضافة نصوص القوانين أو الملاحظات الهامة ليتمكن الطالبات من قراءتها فوراً عبر القارئ المدمج..."
                value={sampleContentText}
                onChange={(e) => setSampleContentText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isReadingFile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting || isReadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التجهيز والنشر...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>حفظ ونشر الملف في المكتبة 📚</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
