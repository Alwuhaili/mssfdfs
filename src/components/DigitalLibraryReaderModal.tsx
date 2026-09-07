import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Search,
  Bookmark,
  BookmarkCheck,
  Sun,
  Moon,
  Sparkles,
  FileText,
  Layers,
  GraduationCap,
  Calendar,
  Share2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Highlighter,
  Eye,
  Info,
  ExternalLink,
  FileCheck,
  Type,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { LectureResource } from '../types';
import { downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import { downloadDataUrlOrBlob } from '../utils/fileStorage';
import {
  isMaleTeacher,
  getSupervisorLabel,
  getTeacherSubjectTitle,
} from '../utils/teacherUtils';
import { UniversalDocumentViewer } from './UniversalDocumentViewer';

interface DigitalLibraryReaderModalProps {
  resource: LectureResource | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (res: LectureResource) => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark' | 'contrast';

export type ReaderFontFamily =
  | 'cairo'
  | 'tajawal'
  | 'amiri'
  | 'naskh'
  | 'ibm'
  | 'alexandria'
  | 'changa';

export type ReaderTextColor =
  | 'default'
  | 'ink_black'
  | 'royal_blue'
  | 'emerald'
  | 'burgundy'
  | 'warm_brown'
  | 'gold';

interface ReaderFontPreferences {
  fontFamily: ReaderFontFamily;
  fontSize: number;
  textColor: ReaderTextColor;
  isBold: boolean;
  lineHeight: 'normal' | 'relaxed' | 'loose';
}

const DEFAULT_FONT_PREFS: ReaderFontPreferences = {
  fontFamily: 'cairo',
  fontSize: 16,
  textColor: 'default',
  isBold: false,
  lineHeight: 'relaxed',
};

const READER_PREFS_KEY = 'maysan_reader_font_prefs_v1';

function loadReaderFontPrefs(): ReaderFontPreferences {
  try {
    const raw = localStorage.getItem(READER_PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_FONT_PREFS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_FONT_PREFS;
}

function saveReaderFontPrefs(prefs: ReaderFontPreferences) {
  try {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export const DigitalLibraryReaderModal: React.FC<DigitalLibraryReaderModalProps> = ({
  resource,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Font customization and preservation state
  const [fontPrefs, setFontPrefs] = useState<ReaderFontPreferences>(loadReaderFontPrefs);
  const [isFontToolbarOpen, setIsFontToolbarOpen] = useState<boolean>(false);

  const updateFontPrefs = (partial: Partial<ReaderFontPreferences>) => {
    setFontPrefs((prev) => {
      const next = { ...prev, ...partial };
      saveReaderFontPrefs(next);
      return next;
    });
  };

  // Check if raw document/PDF URL exists
  const hasRawDocument = !!(
    resource?.pdfDataUrl &&
    resource.pdfDataUrl !== '#' &&
    !resource.pdfDataUrl.startsWith('idb:')
  ) || !!(
    resource?.fileUrl &&
    resource.fileUrl !== '#' &&
    !resource.fileUrl.startsWith('idb:')
  );

  const rawDocumentUrl =
    resource?.pdfDataUrl && resource.pdfDataUrl !== '#' && !resource.pdfDataUrl.startsWith('idb:')
      ? resource.pdfDataUrl
      : resource?.fileUrl && resource.fileUrl !== '#' && !resource.fileUrl.startsWith('idb:')
      ? resource.fileUrl
      : '';

  const [viewMode, setViewMode] = useState<'document' | 'interactive'>(
    hasRawDocument ? 'document' : 'interactive'
  );

  useEffect(() => {
    if (resource) {
      setCurrentPage(1);
      setActiveChapterIndex(0);
      setSearchQuery('');
      if (hasRawDocument) {
        setViewMode('document');
      } else {
        setViewMode('interactive');
      }
      // Load saved bookmark or notes from localStorage
      const savedNote = localStorage.getItem(`lib_note_${resource.id}`);
      if (savedNote) setStudentNotes(savedNote);
      const savedBookmark = localStorage.getItem(`lib_bm_${resource.id}`);
      setIsBookmarked(savedBookmark === 'true');
    }
  }, [resource, hasRawDocument]);

  if (!isOpen || !resource) return null;

  const totalPages = resource.pageCount || (resource.chapters ? resource.chapters.length * 15 : 45);

  const chapters =
    resource.chapters && resource.chapters.length > 0
      ? resource.chapters
      : [
          {
            id: 'ch-1',
            title: 'المقدمة والأهداف التعليمية للمادة',
            pageNumber: 1,
            summary: 'نظرة عامة على مفردات المنهج وخطة التعلم الأكاديمي',
          },
          {
            id: 'ch-2',
            title: `الفصل الأول: أساسيات ومفاهيم ${resource.subject}`,
            pageNumber: 5,
            summary: 'المفاهيم النظرية والتطبيقية والقوانين الجوهرية',
          },
          {
            id: 'ch-3',
            title: `الفصل الثاني: التطبيقات والمسائل النموذجية`,
            pageNumber: 18,
            summary: 'حلول تفصيلية للمسائل والأمثلة الوزارية',
          },
          {
            id: 'ch-4',
            title: `الفصل الثالث: التحليل العميق والاستنتاجات`,
            pageNumber: 32,
            summary: 'استراتيجيات التفكير الناقد والإثراء العلمي للمتميزات',
          },
          {
            id: 'ch-5',
            title: 'الأسئلة الوزارية الشاملة واختبارات المراجعة',
            pageNumber: Math.max(1, totalPages - 8),
            summary: 'نماذج امتحانية مركزية وأجوبة نموذجية',
          },
        ];

  const handleToggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    localStorage.setItem(`lib_bm_${resource.id}`, nextState ? 'true' : 'false');
    triggerToast(
      nextState
        ? 'تمت إضافة هذا المرجع لقائمة إشاراتكِ المرجعية ⭐'
        : 'تمت إزالة الإشارة المرجعية'
    );
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`lib_note_${resource.id}`, studentNotes);
    triggerToast('تم حفظ ملاحظاتكِ الدراسية بنجاح 📝');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDownloadPdf = async () => {
    if (onDownload) {
      onDownload(resource);
      triggerToast('جاري بدء تحميل ملف الـ PDF بنجاح 📥');
      return;
    }

    if (rawDocumentUrl) {
      const ok = await downloadDataUrlOrBlob(rawDocumentUrl, `${resource.title}.pdf`);
      if (ok) {
        triggerToast('تم تنزيل المستند الأصلي بنجاح 📥');
        return;
      }
    }

    const summaryText = `
المكتبة الرقمية والمناهج المدرسية - ثانوية ميسان للمتميزات
=====================================================
عنوان الكتاب / المرجع: ${resource.title}
المادة الدراسية: ${resource.subject}
الصف الدراسي: ${resource.gradeLevel}
${getSupervisorLabel(resource.teacherName)}: ${resource.teacherName}
تاريخ النشر والرفع: ${resource.uploadedAt}
عدد الصفحات: ${totalPages} صفحة
التصنيف: ${
      resource.category === 'curriculum_book'
        ? 'كتاب منهجي رسمي (وزارة التربية العراقية)'
        : resource.category === 'summary_notes'
        ? `ملزمة وملخص ${getTeacherSubjectTitle(resource.teacherName)} المعتمد`
        : resource.category === 'exam_archive'
        ? 'بنك الأسئلة والحلول الوزارية'
        : 'أوراق عمل واختبارات تدريبية'
    }

الوصف والمحتوى الأكاديمي:
${resource.description}

فصول ومفردات الكتاب:
${chapters.map((c, i) => `${i + 1}. ${c.title} (صفحة ${c.pageNumber}) - ${c.summary || ''}`).join('\n')}

محتوى المرجع الأكاديمي المستعرض:
${resource.sampleContentText || 'تم تحميل الكتاب والمورد الرقمي بصيغة PDF الرسمية المعتمدة لثانوية ميسان للمتميزات.'}
    `;

    downloadTextOrAttachmentAsPdf(`${resource.title}.pdf`, resource.title, summaryText);
    triggerToast('جاري بدء تحميل ملف الـ PDF بنجاح 📥');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleJumpToChapter = (chapterIdx: number, pageNum: number) => {
    setActiveChapterIndex(chapterIdx);
    setCurrentPage(pageNum);
  };

  // Theme Styling Classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#433422] border-[#e8d5b5]';
      case 'dark':
        return 'bg-slate-900 text-slate-100 border-slate-800';
      case 'contrast':
        return 'bg-black text-amber-300 border-amber-500/50';
      case 'light':
      default:
        return 'bg-white text-slate-800 border-slate-200';
    }
  };

  // Font family CSS class
  const getFontFamilyClass = () => {
    switch (fontPrefs.fontFamily) {
      case 'tajawal':
        return 'font-tajawal';
      case 'amiri':
        return 'font-amiri';
      case 'naskh':
        return 'font-naskh';
      case 'ibm':
        return 'font-ibm';
      case 'alexandria':
        return 'font-alexandria';
      case 'changa':
        return 'font-changa';
      case 'cairo':
      default:
        return 'font-cairo';
    }
  };

  // Text color class
  const getTextColorStyle = () => {
    switch (fontPrefs.textColor) {
      case 'ink_black':
        return 'text-slate-950 dark:text-slate-100';
      case 'royal_blue':
        return 'text-blue-900 dark:text-blue-200';
      case 'emerald':
        return 'text-emerald-950 dark:text-emerald-200';
      case 'burgundy':
        return 'text-rose-950 dark:text-rose-200';
      case 'warm_brown':
        return 'text-amber-950 dark:text-amber-200';
      case 'gold':
        return 'text-amber-600 dark:text-amber-300';
      case 'default':
      default:
        return '';
    }
  };

  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden font-arabic">
      <div
        className={`relative w-full ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-6xl h-[92vh] rounded-3xl'
        } bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Toast Alert */}
        {showToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 border border-indigo-400 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{showToast}</span>
          </div>
        )}

        {/* TOP READER CONTROLS HEADER */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                  {resource.category === 'curriculum_book'
                    ? 'كتاب منهجي'
                    : resource.category === 'summary_notes'
                    ? 'ملزمة دراسية'
                    : resource.category === 'exam_archive'
                    ? 'أسئلة وزارية'
                    : 'مرجع رقمي'}
                </span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2 py-0.5 rounded-md font-bold">
                  {resource.gradeLevel}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold hidden sm:inline-block">
                  مادة: {resource.subject}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white truncate max-w-md sm:max-w-xl">
                {resource.title}
              </h2>
            </div>
          </div>

          {/* View Mode Switcher */}
          {hasRawDocument && (
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('document')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'document'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>المستند المرفوع (PDF)</span>
              </button>
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'interactive'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>القراءة التفاعلية والملخص</span>
              </button>
            </div>
          )}

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            {/* Font & Typography Settings Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFontToolbarOpen(!isFontToolbarOpen)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  isFontToolbarOpen
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="تنسيق ونوع ولون وحجم الخط"
              >
                <Type className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">تنسيق الخط</span>
              </button>

              {/* Font Settings Dropdown Panel */}
              {isFontToolbarOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 font-arabic space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Palette className="w-4 h-4 text-indigo-400" />
                      <span>تخصيص وحفظ تنسيق الخط</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFontPrefs(DEFAULT_FONT_PREFS);
                        saveReaderFontPrefs(DEFAULT_FONT_PREFS);
                        triggerToast('تمت استعادة إعدادات الخط الافتراضية');
                      }}
                      className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>الافتراضي</span>
                    </button>
                  </div>

                  {/* Font Family Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      نوع الخط العربي المعتمد:
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {[
                        { id: 'cairo', label: 'القاهرة (Cairo)', fontClass: 'font-cairo' },
                        { id: 'tajawal', label: 'تجوال (Tajawal)', fontClass: 'font-tajawal' },
                        { id: 'amiri', label: 'النسخ الأميري (Amiri)', fontClass: 'font-amiri' },
                        { id: 'naskh', label: 'نوتو نسخ (Naskh)', fontClass: 'font-naskh' },
                        { id: 'ibm', label: 'آي بي إم (IBM)', fontClass: 'font-ibm' },
                        { id: 'alexandria', label: 'الإسكندرية (Alex)', fontClass: 'font-alexandria' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateFontPrefs({ fontFamily: f.id as ReaderFontFamily })}
                          className={`p-1.5 rounded-lg border text-right transition-all cursor-pointer ${f.fontClass} ${
                            fontPrefs.fontFamily === f.id
                              ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Stepper */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      حجم الخط ({fontPrefs.fontSize}px):
                    </label>
                    <div className="flex items-center gap-1">
                      {[13, 15, 17, 19, 22, 26].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateFontPrefs({ fontSize: sz })}
                          className={`flex-1 py-1 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                            fontPrefs.fontSize === sz
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      لون الخط المخصص:
                    </label>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {[
                        { id: 'default', label: 'تلقائي', color: 'bg-slate-700' },
                        { id: 'ink_black', label: 'حبري داكن', color: 'bg-slate-950 border-white/20' },
                        { id: 'royal_blue', label: 'كحلي', color: 'bg-blue-900' },
                        { id: 'emerald', label: 'زمردي', color: 'bg-emerald-800' },
                        { id: 'burgundy', label: 'عنابي', color: 'bg-rose-900' },
                        { id: 'warm_brown', label: 'بني سيبيا', color: 'bg-amber-900' },
                        { id: 'gold', label: 'ذهبي', color: 'bg-amber-600' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateFontPrefs({ textColor: c.id as ReaderTextColor })}
                          className={`p-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
                            fontPrefs.textColor === c.id
                              ? 'border-amber-400 ring-2 ring-amber-400/30 text-white font-bold'
                              : 'border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                          <span className="truncate">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatting Styles (Bold & Line Height) */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => updateFontPrefs({ isBold: !fontPrefs.isBold })}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                        fontPrefs.isBold
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      B عريض
                    </button>

                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                      {(['normal', 'relaxed', 'loose'] as const).map((lh) => (
                        <button
                          key={lh}
                          type="button"
                          onClick={() => updateFontPrefs({ lineHeight: lh })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            fontPrefs.lineHeight === lh
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lh === 'normal' ? 'مضغوط' : lh === 'relaxed' ? 'مريح' : 'متباعد'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Selector */}
            {viewMode === 'interactive' && (
              <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setTheme('light')}
                  title="مظهر نهاري فاتح"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    theme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  title="مظهر قراءة مريح (سيبيا)"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    theme === 'sepia' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-bold">📜</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  title="مظهر ليلي داكن"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    theme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTheme('contrast')}
                  title="تباين عالي"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    theme === 'contrast'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold">HC</span>
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {viewMode === 'interactive' && (
              <div className="hidden sm:flex items-center bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700 gap-1 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="تصغير الخط"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-indigo-300 font-bold px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="تكبير الخط"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Open Raw in New Tab */}
            {rawDocumentUrl && (
              <a
                href={rawDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white flex items-center justify-center"
                title="فتح المستند الأصلي في نافذة منفصلة"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isBookmarked ? 'إزالة من الإشارات المرجعية' : 'حفظ في الإشارات المرجعية'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Notes Toggle */}
            <button
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isNotesOpen
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="ملاحظاتي الدراسية على الكتاب"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="تحميل ملف PDF إلى جهازكِ"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">تحميل PDF</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hidden lg:flex items-center justify-center cursor-pointer"
              title="طباعة"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white cursor-pointer"
              title={isFullscreen ? 'تصغير الشاشة' : 'وضع ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              title="إغلاق القارئ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWER BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          {viewMode === 'document' && rawDocumentUrl ? (
            <div className="flex-1 w-full h-full bg-slate-950 flex flex-col p-2">
              <UniversalDocumentViewer
                url={rawDocumentUrl}
                fileName={resource.title}
                title={resource.title}
                className="w-full h-full border-0 rounded-2xl"
                maxHeight="100%"
                onDownload={handleDownloadPdf}
              />
            </div>
          ) : (
            <>
              {/* SIDEBAR: TABLE OF CONTENTS & CHAPTERS */}
              {isSidebarOpen && (
                <div className="w-64 sm:w-72 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                  <div className="p-3 border-b border-slate-200 bg-slate-100/80 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>فهرس الفصول والمواضيع</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-700">
                      {chapters.length} فصول
                    </span>
                  </div>

                  {/* Chapters List */}
                  <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                    {chapters.map((ch, idx) => {
                      const isActive = idx === activeChapterIndex;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => handleJumpToChapter(idx, ch.pageNumber)}
                          className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
                              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-indigo-50 hover:border-indigo-200 font-bold'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className={`${isActive ? 'text-indigo-200' : 'text-indigo-600'} font-black`}>
                              الفصل {idx + 1}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isActive ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600 font-mono'
                              }`}
                            >
                              ص {ch.pageNumber}
                            </span>
                          </div>
                          <span className="block leading-snug">{ch.title}</span>
                          {ch.summary && (
                            <p
                              className={`text-[10px] mt-1 line-clamp-2 leading-relaxed ${
                                isActive ? 'text-indigo-100 font-medium' : 'text-slate-500 font-normal'
                              }`}
                            >
                              {ch.summary}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Book Metadata Footer */}
                  <div className="p-3 bg-slate-100/90 border-t border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-bold">
                        {getSupervisorLabel(resource.teacherName)}:
                      </span>
                      <span className="font-semibold text-slate-900">{resource.teacherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">تاريخ النشر:</span>
                      <span className="font-mono text-slate-700">{resource.uploadedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">حجم الملف:</span>
                      <span className="font-mono text-slate-700">{resource.fileSize || 'PDF 5.2 MB'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN DOCUMENT CANVAS */}
              <div className={`flex-1 flex flex-col overflow-hidden ${getThemeClasses()}`}>
                {/* Sidebar toggle & page quick jumper */}
                <div className="p-2 border-b border-inherit flex items-center justify-between gap-2 text-xs bg-black/5">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="px-2.5 py-1 rounded-lg border border-inherit hover:bg-black/5 font-bold flex items-center gap-1 cursor-pointer"
                    title={isSidebarOpen ? 'إخفاء الفهرس' : 'إظهار الفهرس'}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isSidebarOpen ? 'إخفاء الفهرس' : 'إظهار الفهرس'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded border border-inherit disabled:opacity-40 hover:bg-black/5 cursor-pointer"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 font-mono font-bold text-xs">
                      <span>صفحة</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 1 && val <= totalPages) setCurrentPage(val);
                        }}
                        className="w-12 text-center py-0.5 border border-inherit rounded bg-inherit font-bold"
                      />
                      <span>من {totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded border border-inherit disabled:opacity-40 hover:bg-black/5 cursor-pointer"
                      title="الصفحة التالية"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {currentChapter.title}
                  </div>
                </div>

                {/* Document Content Viewport */}
                <div className={`flex-1 p-4 sm:p-8 overflow-y-auto ${getFontFamilyClass()} ${getTextColorStyle()}`}>
                  <div
                    className={`max-w-3xl mx-auto space-y-6 ${
                      fontPrefs.isBold ? 'font-bold' : ''
                    } ${
                      fontPrefs.lineHeight === 'loose'
                        ? 'leading-loose'
                        : fontPrefs.lineHeight === 'relaxed'
                        ? 'leading-relaxed'
                        : 'leading-normal'
                    }`}
                    style={{ fontSize: `${(zoomLevel / 100) * fontPrefs.fontSize}px` }}
                  >
                    {/* Book Header Cover Simulation */}
                    {currentPage === 1 && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white text-center space-y-4 shadow-xl border border-indigo-500/40">
                        <div className="inline-block px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                          جمهورية العراق • وزارة التربية • مديرية تربية ميسان
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-amber-300 leading-tight">
                          {resource.title}
                        </h1>
                        <div className="text-xs sm:text-sm text-indigo-200 font-bold">
                          مدرسة ثانوية ميسان للمتميزات • {resource.gradeLevel}
                        </div>
                        <div className="pt-3 border-t border-indigo-700/60 flex flex-wrap justify-center items-center gap-4 text-xs">
                          <span>
                            {getSupervisorLabel(resource.teacherName)}:{' '}
                            <strong>{resource.teacherName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            المادة: <strong>{resource.subject}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            العام الدراسي: <strong>2026 - 2027</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Chapter Title Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span>{currentChapter.title}</span>
                        <span className="font-mono">صفحة {currentPage}</span>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed font-medium">
                        {currentChapter.summary || resource.description}
                      </p>
                    </div>

                    {/* Rich Reader Text Content */}
                    <div className="space-y-4 leading-loose tracking-wide">
                      <p className="text-justify font-normal">
                        {resource.sampleContentText ||
                          `مرحباً بكِ طالباتنا العزيزات في مقرر (${resource.subject}) للصف (${resource.gradeLevel}). يتناول هذا المرجع العلمي شرحاً وافياً ومفصلاً لكافة المفاهيم الأساسية، بالإضافة إلى القوانين الرياضية والتطبيقات المعملية والأسئلة الوزارية النموذجية التي تضمن أعلى درجات التميز والإتقان.`}
                      </p>

                      <div className="p-5 rounded-2xl border border-dashed border-inherit bg-black/5 space-y-2">
                        <h4 className="font-black text-xs flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Sparkles className="w-4 h-4" />
                          <span>أهم الأفكار والملاحظات الذهبية للمتميزات في هذا الدرس:</span>
                        </h4>
                        <ul className="list-disc list-inside text-xs space-y-1.5 opacity-90">
                          <li>التركيز على فهم النظريات والاشتقاقات والقوانين قبل البدء في حل المسائل.</li>
                          <li>مراجعة الأمثلة النموذجية والمسائل الوزارية للسنوات السابقة بصورة دورية.</li>
                          <li>تدوين الملاحظات وتلخيص القوانين الهامة في خانة الملاحظات الدراسية الجانبية.</li>
                        </ul>
                      </div>

                      <p className="text-justify font-normal">
                        {`تم إعداد هذا المرجع التعليمي بإشراف مباشر من ${getSupervisorLabel(
                          resource.teacherName
                        )} (${resource.teacherName}) خصيصاً لطالبات ثانوية ميسان للمتميزات لتمكينهن من تحقيق المراتب الأولى في الامتحانات المدرسية والوزارية.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* NOTES SLIDEOUT DRAWER */}
          {isNotesOpen && (
            <div className="w-72 sm:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 p-4 space-y-3 z-20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Highlighter className="w-4 h-4 text-amber-400" />
                  <span>دفتر ملاحظاتي على الكتاب</span>
                </span>
                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="اكتبي هنا أسئلتكِ أو الملاحظات والنقاط الهامة أثناء قراءة المرجع..."
                className="flex-1 w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />

              <button
                onClick={handleSaveNotes}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                حفظ الملاحظات 💾
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
