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
import {
  uploadLibraryFile,
  deleteLibraryFile,
  validateLibraryFile,
  getLibraryFileExtension,
} from '../services/storageService';
import { auth } from '../lib/firebase';

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newResource: LectureResource) => void;
  defaultSubject?: string;
  defaultGrade?: GradeLevel;
  defaultTeacherName?: string;
  defaultCategory?: LibraryCategory;

  // SECURITY_UPLOAD_PDF_AUTH_V1
  verifiedTeacherId?: string;
  verifiedTeacherRole?: string;
  authorizedSubject?: string;
  authorizedGrades?: GradeLevel[];
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
  verifiedTeacherId,
  verifiedTeacherRole,
  authorizedSubject,
  authorizedGrades,
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
    return '';
  }, [currentUser, defaultTeacherName, teachers]);

  // Derive initial subject from current user or defaults
  const autoResolvedSubject = useMemo(() => {
    if (authorizedSubject?.trim()) return authorizedSubject.trim();
    if (defaultSubject?.trim()) return defaultSubject.trim();

    // No arbitrary subject fallback.
    // handleSubmit will fail closed if no verified subject exists.
    return '';
  }, [authorizedSubject, defaultSubject]);

  // Derive initial grade
  const autoResolvedGrade = useMemo<GradeLevel>(() => {
    if (authorizedGrades && authorizedGrades.length > 0) {
      if (defaultGrade && authorizedGrades.includes(defaultGrade)) {
        return defaultGrade;
      }

      return authorizedGrades[0];
    }

    // UI-only placeholder. It grants no authorization.
    // handleSubmit fails closed when authorizedGrades is empty.
    return defaultGrade || ALL_GRADES[0];
  }, [authorizedGrades, defaultGrade]);

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
    // DIGITAL_LIBRARY_ORIGINAL_FILE_V2_2B
    try { validateLibraryFile(file); } catch (err: any) {
      setSelectedFile(null); setFileDataUrl(''); setIsReadingFile(false);
      setErrorMessage(err?.message || 'نوع الملف أو حجمه غير مسموح به في المكتبة الرقمية.'); return;
    }
    setSelectedFile(file); setFileDataUrl(''); setIsReadingFile(false);
    const sizeMB = file.size / (1024 * 1024);
    const readableSize = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.max(1, file.size / 1024).toFixed(0)} KB`;
    const extension = getLibraryFileExtension(file.name).toUpperCase() || 'FILE';
    setFileSizeText(`${extension} ${readableSize}`);
    if (!title.trim()) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim());
    try { if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(URL.createObjectURL(file)); }
    catch (err) { console.warn('Unable to create local preview URL:', err); setPreviewBlobUrl(''); }
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
    e.preventDefault(); setErrorMessage('');
    // DIGITAL_LIBRARY_FIREBASE_IDENTITY_V2_2B
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.uid) { setErrorMessage('يجب تسجيل الدخول بحساب Firebase موثق قبل رفع الملفات.'); return; }
    let tokenRole = '';
    try { const tokenResult = await firebaseUser.getIdTokenResult(true); tokenRole = String(tokenResult.claims?.role || '').trim(); }
    catch (err) { console.error('Firebase claims verification failed:', err); setErrorMessage('تعذر التحقق من صلاحيات الحساب. يرجى تسجيل الدخول من جديد.'); return; }
    const isAdminUploader = tokenRole === 'admin'; const isTeacherUploader = tokenRole === 'teacher';
    if (!isAdminUploader && !isTeacherUploader) { setErrorMessage('هذا الحساب غير مخول لرفع الملفات إلى المكتبة الرقمية.'); return; }
    if (!selectedFile) { setErrorMessage('يرجى اختيار ملف للرفع.'); return; }
    try { validateLibraryFile(selectedFile); } catch (err: any) { setErrorMessage(err?.message || 'نوع الملف أو حجمه غير مسموح به.'); return; }
    const finalSubject = (customSubject.trim() ? customSubject.trim() : subject).trim(); const finalGrade = gradeLevel;
    if (!finalSubject) { setErrorMessage('يرجى تحديد المادة الدراسية.'); return; }
    if (!finalGrade) { setErrorMessage('يرجى تحديد الصف الدراسي.'); return; }
    if (isTeacherUploader) {
      if (!verifiedTeacherId || verifiedTeacherRole !== 'teacher') { setErrorMessage('تعذر التحقق من ملف المدرس المرتبط بالحساب.'); return; }
      const teacherSubject = authorizedSubject?.trim(); const teacherGrades = authorizedGrades || [];
      if (!teacherSubject) { setErrorMessage('لا توجد مادة مخولة لهذا المدرس.'); return; }
      if (teacherGrades.length === 0) { setErrorMessage('لا توجد صفوف مخولة لهذا المدرس.'); return; }
      if (finalSubject !== teacherSubject) { setErrorMessage(`لا تملك صلاحية رفع محتوى لمادة (${finalSubject}).`); return; }
      if (!teacherGrades.includes(finalGrade)) { setErrorMessage(`لا تملك صلاحية رفع محتوى للصف (${finalGrade}).`); return; }
    }
    if (!title.trim()) { setErrorMessage('يرجى كتابة عنوان المورد التعليمي.'); return; }
    const finalTeacherName = teacherName.trim() || autoResolvedTeacherName || (isAdminUploader ? 'إدارة المدرسة' : 'أستاذ المادة');
    const extension = getLibraryFileExtension(selectedFile.name).toLowerCase();
    const resourceType: LectureResource['type'] = extension === 'pdf' ? 'pdf' : ['doc','docx'].includes(extension) ? 'doc' : ['ppt','pptx'].includes(extension) ? 'ppt' : ['xls','xlsx','csv'].includes(extension) ? 'sheet' : ['jpg','jpeg','png','webp','gif'].includes(extension) ? 'image' : ['mp4','webm','mov'].includes(extension) ? 'video' : ['mp3','wav','m4a'].includes(extension) ? 'audio' : extension === 'txt' ? 'text' : 'other';
    const resourceId = `lec-${Date.now()}-${Math.random().toString(36).slice(2,10)}`; setIsSubmitting(true); let uploadedStoragePath: string | undefined;
    try {
      const uploaded = await uploadLibraryFile(selectedFile, { uploaderId: firebaseUser.uid, resourceId }); uploadedStoragePath = uploaded.storagePath;
      const resourceData: Omit<LectureResource, 'id' | 'uploadedAt'> = {
        title: title.trim(), subject: finalSubject, teacherName: finalTeacherName, gradeLevel: finalGrade, type: resourceType,
        fileUrl: uploaded.downloadUrl, pdfDataUrl: undefined, storagePath: uploaded.storagePath, originalFileName: uploaded.originalFileName,
        fileExtension: uploaded.fileExtension, mimeType: uploaded.mimeType, fileSizeBytes: uploaded.fileSizeBytes, storageProvider: 'firebase',
        description: description.trim() || `مورد تعليمي في مادة ${finalSubject} للصف ${finalGrade}.`, fileSize: fileSizeText, category,
        pageCount: resourceType === 'pdf' ? Number(pageCount) || undefined : undefined, chapterOrUnit: chapterOrUnit || 'شامل المنهج',
        isOfficialBook: category === 'curriculum_book', sampleContentText: sampleContentText.trim() || `المورد التعليمي: ${title.trim()}\nالمادة: ${finalSubject}\nالصف: ${finalGrade}\nاسم الملف الأصلي: ${uploaded.originalFileName}`,
        chapters: [], downloadCount: 0, viewsCount: 0, academicYear: '2026 - 2027', uploaderId: firebaseUser.uid, uploaderName: finalTeacherName, uploaderRole: tokenRole,
      };
      const createdResource = addLecture(resourceData, { resourceId });
      if (!createdResource || createdResource.id !== resourceId) throw new Error('لم يتطابق معرف ملف Storage مع معرف مورد المكتبة.');
      setUploadSuccess(true); setTimeout(() => { setIsSubmitting(false); setUploadSuccess(false); if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl); onClose(); if (onSuccess) onSuccess(createdResource); }, 1000);
    } catch (err: any) {
      console.error('Digital Library V2.2B upload failed:', err);
      if (uploadedStoragePath) { try { await deleteLibraryFile(uploadedStoragePath); } catch (rollbackError) { console.error('Storage rollback failed:', rollbackError); } }
      setIsSubmitting(false); setErrorMessage(err?.message || 'حدث خطأ أثناء رفع الملف أو إنشاء سجل المكتبة.');
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
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.mp3,.wav,.m4a"
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


