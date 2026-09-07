import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Download,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  FileText,
  Bookmark,
  Share2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Award,
  List,
  LayoutGrid,
  FileCheck,
  BookMarked,
  Info,
  Clock,
  Eye,
  ArrowUpDown,
  RefreshCw,
  FolderOpen,
  School,
  X,
  Upload,
  BookCheck,
  Edit3,
  Trash2,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { LectureResource, GradeLevel, Teacher } from '../types';
import { useApp } from '../context/AppContext';
import { isMaleTeacher, getSupervisorLabel, getCreatorSupervisorLabel } from '../utils/teacherUtils';
import { downloadDataUrlOrBlob } from '../utils/fileStorage';
import { downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import { DigitalLibraryReaderModal } from './DigitalLibraryReaderModal';
import { EditLectureModal } from './EditLectureModal';
import { DeleteLectureModal } from './DeleteLectureModal';

const ALL_IRAQI_GRADES: GradeLevel[] = [
  'الصف السادس العلمي',
  'الصف الخامس العلمي',
  'الصف الرابع العلمي',
  'الصف الثالث المتوسط',
  'الصف الثاني المتوسط',
  'الصف الأول المتوسط',
];

const OFFICIAL_SUBJECTS = [
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'علم الاحياء',
  'العلوم العامة',
  'اللغة العربية',
  'اللغة الانجليزية',
  'الاجتماعيات',
  'التربية الاسلامية',
  'الحاسوب',
  'اللغة الفرنسية',
  'اللغة الكردية',
];

interface DigitalLibraryHubProps {
  theme?: 'light' | 'dark';
  userRole?: 'student' | 'teacher' | 'admin' | 'parent' | 'supervisor';
  onOpenUploadModal?: () => void;
  defaultGrade?: GradeLevel | 'all';
}

export const DigitalLibraryHub: React.FC<DigitalLibraryHubProps> = ({
  theme = 'light',
  userRole = 'student',
  onOpenUploadModal,
  defaultGrade = 'all',
}) => {
  const { lectures, teachers, recordLectureDownload, deleteLecture, currentUser } = useApp();
  const activeTeacher =
    currentUser?.teacherObj ||
    teachers.find(
      (t) =>
        (currentUser?.id && t.id === currentUser.id) ||
        (currentUser?.name && t.name.toLowerCase() === currentUser.name.toLowerCase())
    );

  // Filters State (as explicitly requested: 1. Teacher, 2. Subject, 3. Grade)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultGrade);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');
  const [showAllTeachersList, setShowAllTeachersList] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'views' | 'grade' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Horizontal Scroll Refs
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const teachersScrollRef = useRef<HTMLDivElement>(null);
  const subjectsScrollRef = useRef<HTMLDivElement>(null);
  const gradesScrollRef = useRef<HTMLDivElement>(null);

  const scrollHorizontal = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 260;
    ref.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Reader & Details Modal State
  const [readingResource, setReadingResource] = useState<LectureResource | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [selectedDetailBook, setSelectedDetailBook] = useState<LectureResource | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit & Delete Modals State
  const [editingLecture, setEditingLecture] = useState<LectureResource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [deletingLecture, setDeletingLecture] = useState<LectureResource | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Role resolution & permission check
  const effectiveRole = currentUser?.role || userRole;
  const isAdmin = effectiveRole === 'admin';
  const isSupervisor = effectiveRole === 'supervisor';
  const isDirectressOrAdmin = isAdmin;

  /**
   * Permission Rules:
   * - Administration / Directress (المديرة والإدارة): Full permissions for ALL books in the system.
   * - Teaching Staff (الهيئة التدريسية): Can ONLY edit/update/delete books they uploaded themselves.
   * - Educational Supervisor (المشرف التربوي): Read, view, download, save/bookmark, and share only. No edit/delete permissions.
   * - Students / Parents: Read, view, download, and bookmark only.
   */
  const checkCanModify = (lec: LectureResource): boolean => {
    // 1. Supervisor STRICTLY cannot modify or delete anything in the library
    if (isSupervisor) return false;

    // 2. Directress and School Admin have full access to everything
    if (isDirectressOrAdmin) return true;

    // 3. Teachers can only edit/delete their own uploaded books
    if (effectiveRole === 'teacher') {
      const currentTeacherId = currentUser?.id || currentUser?.teacherObj?.id || activeTeacher?.id;
      const currentTeacherName = (currentUser?.name || currentUser?.teacherObj?.name || activeTeacher?.name || '').trim().toLowerCase();

      // Check uploaderId match
      if (lec.uploaderId && currentTeacherId && (lec.uploaderId === currentTeacherId || lec.uploaderId === currentUser?.id)) {
        return true;
      }

      // Check uploaderName match
      if (lec.uploaderName && currentTeacherName) {
        const uploaderNorm = lec.uploaderName.trim().toLowerCase();
        if (uploaderNorm === currentTeacherName || currentTeacherName.includes(uploaderNorm) || uploaderNorm.includes(currentTeacherName)) {
          return true;
        }
      }

      // Check teacherName match against current logged-in teacher
      if (lec.teacherName && currentTeacherName) {
        const lecTeacherNorm = lec.teacherName.trim().toLowerCase();
        if (lecTeacherNorm === currentTeacherName || lecTeacherNorm.includes(currentTeacherName) || currentTeacherName.includes(lecTeacherNorm)) {
          return true;
        }
      }
    }

    return false;
  };

  // Toggle Bookmark
  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Copy Link notification
  const handleCopyLink = (lec: LectureResource) => {
    navigator.clipboard.writeText(`${window.location.origin}/#library-${lec.id}`);
    setCopiedId(lec.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct Teachers List compiled from all registered teachers & resources
  const allTeachersList = useMemo(() => {
    const teacherMap = new Map<string, {
      name: string;
      subject: string;
      assignedGrades?: GradeLevel[];
      count: number;
      isOfficialTeacher: boolean;
      gender?: 'male' | 'female';
    }>();

    const normalizeTeacherName = (name: string) => {
      if (!name) return '';
      const trimmed = name.trim();
      if (trimmed.includes('محمد نعمة كاظم كريدي')) {
        return 'محمد نعمة كاظم كريدي الوحيلي';
      }
      return trimmed;
    };

    const isExcludedTeacher = (name: string) => {
      if (!name) return false;
      const clean = name.trim();
      // Exclude short name without Al-Wuhaili
      if (clean.includes('محمد نعمة كاظم كريدي') && !clean.includes('الوحيلي')) {
        return true;
      }
      return (
        clean.includes('زينب خضير') ||
        clean.includes('خضير الحسيني') ||
        clean.includes('سارة عباس') ||
        clean.includes('السلامي') ||
        clean.includes('هدى كاظم') ||
        clean.includes('أمل جاسم') ||
        clean.includes('وزارة التربية') ||
        clean.includes('المديرية العامة للمناهج') ||
        clean.includes('مديرية المناهج')
      );
    };

    // Add registered teachers first
    teachers.forEach((t) => {
      const normalizedName = normalizeTeacherName(t.name);
      if (isExcludedTeacher(t.name) && t.name !== normalizedName) return;
      if (isExcludedTeacher(normalizedName)) return;

      const existing = teacherMap.get(normalizedName);
      if (existing) {
        return;
      }

      teacherMap.set(normalizedName, {
        name: normalizedName,
        subject: t.subject,
        assignedGrades: t.assignedGrades,
        count: 0,
        isOfficialTeacher: true,
        gender: (t.gender as 'male' | 'female') || (isMaleTeacher(normalizedName) ? 'male' : 'female'),
      });
    });

    // Tally from lectures
    lectures.forEach((lec) => {
      if (lec.teacherName) {
        const normalizedName = normalizeTeacherName(lec.teacherName);
        if (isExcludedTeacher(normalizedName)) return;

        const existing = teacherMap.get(normalizedName);
        if (existing) {
          existing.count += 1;
        } else {
          teacherMap.set(normalizedName, {
            name: normalizedName,
            subject: lec.subject || 'عام',
            count: 1,
            isOfficialTeacher: false,
            gender: isMaleTeacher(normalizedName) ? 'male' : 'female',
          });
        }
      }
    });

    return Array.from(teacherMap.values()).sort((a, b) => {
      if (a.isOfficialTeacher && !b.isOfficialTeacher) return -1;
      if (!a.isOfficialTeacher && b.isOfficialTeacher) return 1;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [teachers, lectures]);

  // Teachers filtered by currently selected subject (or all if subject is 'all')
  const visibleTeachers = useMemo(() => {
    let list = allTeachersList;

    if (selectedSubject !== 'all' && !showAllTeachersList) {
      const filteredBySub = list.filter(
        (t) => t.subject === selectedSubject || t.name === selectedTeacher
      );
      if (filteredBySub.length > 0) {
        list = filteredBySub;
      }
    }

    if (teacherSearchQuery.trim()) {
      const q = teacherSearchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          (t.assignedGrades || []).some((g) => g.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTeachersList, selectedSubject, showAllTeachersList, teacherSearchQuery, selectedTeacher]);

  // Distinct Subjects with counts
  const subjectsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lectures.forEach((lec) => {
      const sub = lec.subject || 'أخرى';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [lectures]);

  // Filtered and Sorted Lectures
  const filteredLectures = useMemo(() => {
    const selectedTeacherObj = allTeachersList.find((t) => t.name === selectedTeacher);

    return lectures
      .filter((lec) => {
        // 1. Teacher Filter
        if (selectedTeacher !== 'all') {
          const directMatch =
            lec.teacherName === selectedTeacher ||
            (lec.teacherName && (lec.teacherName.includes(selectedTeacher) || selectedTeacher.includes(lec.teacherName)));

          const subjectMatch =
            selectedTeacherObj &&
            selectedTeacherObj.subject &&
            lec.subject === selectedTeacherObj.subject;

          if (!directMatch && !subjectMatch) {
            return false;
          }
        }

        // 2. Subject Filter
        if (selectedSubject !== 'all' && lec.subject !== selectedSubject) {
          return false;
        }

        // 3. Grade Filter
        if (selectedGrade !== 'all' && lec.gradeLevel !== selectedGrade) {
          return false;
        }

        // 4. Category Filter
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'curriculum_book' && !lec.isOfficialBook && lec.category !== 'curriculum_book') {
            return false;
          }
          if (selectedCategory === 'summary_notes' && lec.category !== 'summary_notes') {
            return false;
          }
          if (selectedCategory === 'exam_archive' && lec.category !== 'exam_archive') {
            return false;
          }
          if (selectedCategory === 'worksheet' && lec.category !== 'worksheet') {
            return false;
          }
          if (selectedCategory === 'bookmarked' && !bookmarkedIds.includes(lec.id)) {
            return false;
          }
        }

        // 5. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = lec.title.toLowerCase().includes(q);
          const matchTeacher = (lec.teacherName || '').toLowerCase().includes(q);
          const matchSubject = (lec.subject || '').toLowerCase().includes(q);
          const matchGrade = (lec.gradeLevel || '').toLowerCase().includes(q);
          const matchDesc = (lec.description || '').toLowerCase().includes(q);
          const matchChapter = (lec.chapters || []).some((c) => c.title.toLowerCase().includes(q));

          if (!matchTitle && !matchTeacher && !matchSubject && !matchGrade && !matchDesc && !matchChapter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
        }
        if (sortBy === 'downloads') {
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        }
        if (sortBy === 'views') {
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        }
        if (sortBy === 'grade') {
          return a.gradeLevel.localeCompare(b.gradeLevel);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [lectures, selectedTeacher, selectedSubject, selectedGrade, selectedCategory, searchQuery, sortBy, bookmarkedIds, allTeachersList]);

  // Handle Download PDF with Full Official Formatting
  const handleDownload = async (lec: LectureResource) => {
    recordLectureDownload(lec.id);

    // If PDF binary data is attached in IndexedDB or memory
    if (lec.pdfDataUrl && lec.pdfDataUrl !== '#') {
      const ok = await downloadDataUrlOrBlob(lec.pdfDataUrl, `${lec.title}.pdf`);
      if (ok) return;
    }
    if (lec.fileUrl && lec.fileUrl !== '#' && !lec.fileUrl.startsWith('idb:')) {
      const ok = await downloadDataUrlOrBlob(lec.fileUrl, `${lec.title}.pdf`);
      if (ok) return;
    }

    // Generate comprehensive ministerial study guide PDF
    const chaptersText = (lec.chapters || [])
      .map((ch, idx) => `• ${ch.title} (ص ${ch.pageNumber})\n  ملخص: ${ch.summary || 'تغطية شاملة للمفاهيم والمسائل'}`)
      .join('\n\n');

    const fullPdfContent = `جمهورية العراق - وزارة التربية
المديرية العامة للمناهج والتعليم العام
ثانوية ميسان للمتميزات - المكتبة الرقمية المركزية
==================================================

العنوان المنهجي: ${lec.title}
المرحلة الدراسية: ${lec.gradeLevel}
المادة المقررة: ${lec.subject}
${getSupervisorLabel(lec.teacherName)}: ${lec.teacherName}
العام الدراسي: ${lec.academicYear || '2026 - 2027'}
حجم الملف التقديري: ${lec.fileSize || 'النسخة الكاملة'} | عدد الصفحات: ${lec.pageCount || 'شامل'}

--------------------------------------------------
الوصف والنبذة التعليمية:
${lec.description}

--------------------------------------------------
فهرس الفصول والوحدات المنهجية:
${chaptersText || 'شامل لكافة فصول ومفردات المنهاج المعتمد لوزارة التربية العراقية.'}

--------------------------------------------------
مقتطفات وشروحات نموذجية:
${lec.sampleContentText || 'تم إعداد هذا المرجع التعليمي وفق أحدث المقررات الوزارية لخدمة طالبات ثانوية ميسان للمتميزات.'}

--------------------------------------------------
تم تنزيل النسخة الرقمية بنجاح عبر بوابة المكتبة الرقمية الموحدة.
جميع الحقوق محفوظة © ثانوية ميسان للمتميزات.`;

    downloadTextOrAttachmentAsPdf(
      `${lec.title}.pdf`,
      lec.title,
      fullPdfContent
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedTeacher('all');
    setSelectedSubject('all');
    setSelectedGrade('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    selectedTeacher !== 'all' ||
    selectedSubject !== 'all' ||
    selectedGrade !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '';

  const isDark = theme === 'dark';

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} id="digital-library-hub">
      {/* Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-lg border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30'
            : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white border-indigo-700/50 shadow-indigo-950/20'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>المكتبة الرقمية والمناهج العراقية</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-100 text-xs font-bold backdrop-blur-xs">
                من الصف الأول المتوسط إلى السادس العلمي 📚
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight text-white">
              المكتبة والمحاضرات الرقمية الشاملة للمتميزات
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              تصفحي وحملي جميع الكتب المنهجية الرسمية لوزارة التربية العراقية، الملازم الوزارية، بنك الأسئلة والحلول النموذجية، وأوراق العمل لكافة المراحل الدراسية مع ميزة القراءة التفاعلية المباشرة.
            </p>
          </div>

          {/* Quick Stats Badges & Upload Button */}
          <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
                <span className="text-xl font-black text-amber-300 font-mono block leading-none">
                  {lectures.filter((l) => l.isOfficialBook || l.category === 'curriculum_book').length}
                </span>
                <span className="text-[10px] text-indigo-100 font-bold">كتاب منهجي</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
                <span className="text-xl font-black text-emerald-300 font-mono block leading-none">
                  {lectures.length}
                </span>
                <span className="text-[10px] text-indigo-100 font-bold">إجمالي المصادر</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
                <span className="text-xl font-black text-cyan-300 font-mono block leading-none">
                  {allTeachersList.length}
                </span>
                <span className="text-[10px] text-indigo-100 font-bold">مدرس ومشرف</span>
              </div>
            </div>

            {onOpenUploadModal && (effectiveRole === 'teacher' || effectiveRole === 'admin') && (
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all transform hover:scale-105 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>رفع كتاب أو ملزمة جديدة 📤</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role & Permissions Notice Bar */}
      {(effectiveRole === 'admin' || effectiveRole === 'supervisor' || effectiveRole === 'teacher') && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
            isDirectressOrAdmin
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200'
              : isSupervisor
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isDirectressOrAdmin ? (
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : isSupervisor ? (
              <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs text-lg">
                🏛️
              </div>
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 font-black text-xs sm:text-sm">
                <span>
                  {isDirectressOrAdmin
                    ? '👑 صلاحيات الإدارة المدرسية والمديرة (صلاحية كاملة):'
                    : isSupervisor
                    ? `🏛️ صلاحيات المشرف التربوي (${currentUser?.name || 'المشرف التربوي المعتمد'}):`
                    : `👩‍🏫 صلاحيات الهيئة التدريسية (${currentUser?.name || activeTeacher?.name || 'مدرسة المادة'}):`}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
                    isDirectressOrAdmin
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : isSupervisor
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                      : 'bg-emerald-600 text-white border-emerald-700'
                  }`}
                >
                  {isDirectressOrAdmin
                    ? 'تحكم وإدارة كاملة لكافة الكتب'
                    : isSupervisor
                    ? 'اطلاع، قراءة، تحميل، حفظ ومشاركة فقط (بدون حذف أو تعديل)'
                    : 'تعديل وحذف مرفوعاتكِ فقط'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">
                {isDirectressOrAdmin
                  ? 'تمتلكين الصلاحية الكاملة لتعديل، وتحديث، وحذف جميع الكتب والمناهج وملازم ومذكرات المدرسات في المنظومة.'
                  : isSupervisor
                  ? 'يحق لك الاطلاع الشامل، والقراءة التفاعلية المباشرة داخل المنصة، وتحميل وحفظ ومشاركة ملفات ومناهج المكتبة لغرض التدقيق والمتابعة الأكاديمية. لا تتوفر صلاحيات حذف أو تعديل المناهج والملازم.'
                  : 'يمكنكِ رفع كتب وملازم جديدة، وتعديل وتحديث وحذف الكتب والملازم التي قمتِ برفعها فقط. لا يمكنكِ تعديل أو حذف كتب بقية المدرسات.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🎯 THREE-TIER FILTERING SYSTEM (Teacher, Subject, Grade) */}
      {/* ======================================================== */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-sm space-y-5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Category Tabs (الكل والمصادر، الكتب المنهجية، ملازم وشروحات المدرسات، بنك الأسئلة، الخ) with Enhanced Scroll */}
        <div className="space-y-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-indigo-500" />
                <span>أقسام وتصنيفات المكتبة والمحاضرات:</span>
              </span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  (عرض الكل)
                </button>
              )}
            </div>

            {/* Scroll navigation buttons for Categories */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-indigo-200/70 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => scrollHorizontal(categoriesScrollRef, 'right')}
                className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                title="تمرير الأقسام لليمين"
                aria-label="تمرير الأقسام لليمين"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollHorizontal(categoriesScrollRef, 'left')}
                className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                title="تمرير الأقسام لليسار"
                aria-label="تمرير الأقسام لليسار"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Categories List */}
          <div className="relative">
            <div
              ref={categoriesScrollRef}
              className="flex items-center gap-2 overflow-x-auto horizontal-scroll-container pb-2 pt-1 scroll-smooth"
            >
              {[
                { id: 'all', label: '📚 الكل والمصادر', count: lectures.length },
                {
                  id: 'curriculum_book',
                  label: '📕 الكتب المنهجية الرسمية (الوزارة)',
                  count: lectures.filter((l) => l.category === 'curriculum_book' || l.isOfficialBook).length,
                },
                {
                  id: 'summary_notes',
                  label: '📝 ملازم وشروحات المدرسات',
                  count: lectures.filter((l) => l.category === 'summary_notes').length,
                },
                {
                  id: 'exam_archive',
                  label: '🎯 بنك الأسئلة والحلول الوزارية',
                  count: lectures.filter((l) => l.category === 'exam_archive').length,
                },
                {
                  id: 'worksheet',
                  label: '📑 أوراق العمل والتدريبات',
                  count: lectures.filter((l) => l.category === 'worksheet').length,
                },
                {
                  id: 'bookmarked',
                  label: '⭐ المفضلة والمحفوظة',
                  count: bookmarkedIds.length,
                },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600/30'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <span className="whitespace-nowrap">{cat.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isSelected
                          ? 'bg-indigo-800 text-white'
                          : isDark
                          ? 'bg-slate-900 text-slate-400'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1. FILTER 1: حسب مدرس المادة (TEACHER / SUPERVISOR) - First & Prominent */}
        <div className="space-y-2.5 bg-transparent p-3.5 rounded-2xl border border-indigo-200/60 dark:border-slate-700/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-4 h-4" />
                <span>
                  أولاً: تصفية حسب مدرس / مدرسة المادة
                  {selectedSubject !== 'all' && !showAllTeachersList
                    ? ` (مدرسو ${selectedSubject}: ${visibleTeachers.length})`
                    : ` (${allTeachersList.length} معلم ومعلمة)`}
                  :
                </span>
              </label>

              {selectedSubject !== 'all' && (
                <button
                  type="button"
                  onClick={() => setShowAllTeachersList((prev) => !prev)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200/80 dark:hover:bg-indigo-900/60 font-bold transition-all border border-indigo-200 dark:border-indigo-800/60"
                >
                  {showAllTeachersList ? `عرض مدرسي ${selectedSubject} فقط` : `عرض كل مدرسي المدرسة (${allTeachersList.length})`}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Teacher Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المدرس..."
                  className="w-36 sm:w-44 pr-7 pl-6 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 shadow-2xs"
                />
                {teacherSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeacherSearchQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Scroll buttons for Teachers */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-indigo-200/70 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => scrollHorizontal(teachersScrollRef, 'right')}
                  className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 transition-colors"
                  title="تمرير لليمين"
                  aria-label="تمرير قائمة المدرسين لليمين"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHorizontal(teachersScrollRef, 'left')}
                  className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 transition-colors"
                  title="تمرير لليسار"
                  aria-label="تمرير قائمة المدرسين لليسار"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedTeacher !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTeacher('all')}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" />
                  إلغاء التحديد
                </button>
              )}
            </div>
          </div>

          {/* Teacher Horizontal Scroll Container */}
          <div className="relative">
            <div
              ref={teachersScrollRef}
              className="flex items-center gap-2 overflow-x-auto horizontal-scroll-container pb-2 pt-1 scroll-smooth"
            >
              <button
                type="button"
                onClick={() => setSelectedTeacher('all')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedTeacher === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/30 font-black'
                    : isDark
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                    : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/90 shadow-2xs'
                }`}
              >
                <span>👨‍🏫👩‍🏫 الهيئة التدريسية كافة</span>
                <span className="text-[10px] opacity-80 font-mono">({lectures.length})</span>
              </button>

              {visibleTeachers.map((tech) => {
                const isSelected = selectedTeacher === tech.name;
                const isMale = isMaleTeacher(tech.name);
                return (
                  <button
                    key={tech.name}
                    type="button"
                    onClick={() => setSelectedTeacher(tech.name)}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/30 font-black'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                        : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/90 shadow-2xs'
                    }`}
                    title={`${tech.name} - مادة ${tech.subject}`}
                  >
                    <span>{isMale ? '👨‍🏫' : '👩‍🏫'}</span>
                    <span>{tech.name}</span>
                    {tech.subject && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-indigo-700 text-white font-medium'
                            : isDark
                            ? 'bg-slate-800 text-indigo-300'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium'
                        }`}
                      >
                        {tech.subject}
                      </span>
                    )}
                    {tech.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected
                            ? 'bg-indigo-800 text-white'
                            : isDark
                            ? 'bg-slate-800 text-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                        }`}
                      >
                        {tech.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {visibleTeachers.length === 0 && (
                <span className="text-xs text-slate-500 italic py-1 px-2">
                  لا يوجد مدرسون مطابقون للبحث.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. FILTER 2: حسب المادة الدراسية (SUBJECT FILTER) */}
        <div className="space-y-2.5 bg-transparent p-3.5 rounded-2xl border border-emerald-200/60 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
              <span>ثانياً: تصفية حسب المادة الدراسية:</span>
            </label>

            <div className="flex items-center gap-2">
              {/* Scroll buttons for Subjects */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-emerald-200/70 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => scrollHorizontal(subjectsScrollRef, 'right')}
                  className="p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 transition-colors"
                  title="تمرير لليمين"
                  aria-label="تمرير قائمة المواد لليمين"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHorizontal(subjectsScrollRef, 'left')}
                  className="p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 transition-colors"
                  title="تمرير لليسار"
                  aria-label="تمرير قائمة المواد لليسار"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedSubject !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  إظهار جميع المواد
                </button>
              )}
            </div>
          </div>

          {/* Subject Horizontal Scroll Container */}
          <div className="relative">
            <div
              ref={subjectsScrollRef}
              className="flex items-center gap-2 overflow-x-auto horizontal-scroll-container horizontal-scroll-emerald pb-2 pt-1 scroll-smooth"
            >
              <button
                type="button"
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedSubject === 'all'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30 font-black'
                    : isDark
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/90 shadow-2xs'
                }`}
              >
                <span>📖 جميع المواد</span>
              </button>

              {OFFICIAL_SUBJECTS.map((sub) => {
                const count = subjectsWithCounts[sub] || 0;
                const isSelected = selectedSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30 font-black'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                        : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <span>{sub}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected
                            ? 'bg-emerald-800 text-white'
                            : isDark
                            ? 'bg-slate-800 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. FILTER 3: حسب الصف الدراسي (GRADE LEVEL) - 1st Intermediate to 6th Preparatory */}
        <div className="space-y-2.5 bg-transparent p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
              <span>ثالثاً: تصفية حسب المرحلة والصف الدراسي (المناهج العراقية الرسمية):</span>
            </label>

            <div className="flex items-center gap-2">
              {/* Scroll buttons for Grades */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-amber-200/70 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => scrollHorizontal(gradesScrollRef, 'right')}
                  className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                  title="تمرير الصفوف لليمين"
                  aria-label="تمرير الصفوف لليمين"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHorizontal(gradesScrollRef, 'left')}
                  className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                  title="تمرير الصفوف لليسار"
                  aria-label="تمرير الصفوف لليسار"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedGrade !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedGrade('all')}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold shrink-0"
                >
                  إظهار جميع الصفوف
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <div
              ref={gradesScrollRef}
              className="flex items-center gap-2 overflow-x-auto horizontal-scroll-container horizontal-scroll-amber pb-2 pt-1 scroll-smooth"
            >
              <button
                type="button"
                onClick={() => setSelectedGrade('all')}
                className={`p-2.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center shrink-0 min-w-[110px] ${
                  selectedGrade === 'all'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30'
                    : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-white hover:bg-amber-50 hover:text-amber-700 text-slate-700 border border-slate-200/90 shadow-2xs'
                }`}
              >
                <span className="text-sm">🎓</span>
                <span className="whitespace-nowrap">جميع الصفوف</span>
                <span className="text-[10px] opacity-80 font-mono font-normal">({lectures.length} مرجع)</span>
              </button>

              {ALL_IRAQI_GRADES.map((grade) => {
                const count = lectures.filter((l) => l.gradeLevel === grade).length;
                const isSelected = selectedGrade === grade;
                const isMinisterial = grade.includes('السادس') || grade.includes('الثالث');
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`p-2.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shrink-0 min-w-[130px] ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30 font-black'
                        : isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-white hover:bg-amber-50 hover:text-amber-700 text-slate-700 border border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {isMinisterial && (
                      <span className="absolute top-1 right-1 text-[9px] bg-amber-400/30 text-amber-200 font-mono px-1 rounded">
                        وزاري
                      </span>
                    )}
                    <span className="text-sm">
                      {grade.includes('السادس')
                        ? '🌟'
                        : grade.includes('الخامس')
                        ? '📘'
                        : grade.includes('الرابع')
                        ? '📗'
                        : grade.includes('الثالث')
                        ? '🎯'
                        : grade.includes('الثاني')
                        ? '📙'
                        : '📕'}
                    </span>
                    <span className="leading-tight whitespace-nowrap">{grade}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-amber-700 text-white font-black'
                          : isDark
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search, Sort, and View Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Live Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحثي باسم الكتاب، موضوع الفصل، اسم المدرسة، أو المادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-10 py-2.5 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`w-full pr-10 pl-3 py-2.5 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-800 border border-slate-700 text-slate-200'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <option value="newest">الترتيب: الأحدث إضافة 📅</option>
                <option value="downloads">الترتيب: الأكثر تحميلاً 📥</option>
                <option value="views">الترتيب: الأكثر قراءة 👁️</option>
                <option value="grade">الترتيب: حسب الصف الدراسي 🎓</option>
                <option value="title">الترتيب: أبجدياً حسب العنوان 🔤</option>
              </select>
            </div>
          </div>

          {/* View Toggle and Reset */}
          <div className="md:col-span-3 flex items-center justify-between sm:justify-end gap-2">
            {/* View Mode */}
            <div
              className={`p-1 rounded-2xl border flex items-center gap-1 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="عرض شبكي للكتب"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="عرض قائمة تفصيلية"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-500/20"
                title="إعادة ضبط الفلاتر"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Pills Indicator */}
      <div className="flex flex-wrap items-center justify-between text-xs font-semibold px-1 gap-2">
        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          يتم عرض <strong className="text-indigo-600 dark:text-indigo-400 font-black">{filteredLectures.length}</strong>{' '}
          من إجمالي <strong className="font-mono">{lectures.length}</strong> كتاب ومرجع معتمد
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTeacher !== 'all' && (
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1">
              <span>👨‍🏫 المشرف: {selectedTeacher}</span>
              <button type="button" onClick={() => setSelectedTeacher('all')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}
          {selectedSubject !== 'all' && (
            <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1">
              <span>📚 المادة: {selectedSubject}</span>
              <button type="button" onClick={() => setSelectedSubject('all')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}
          {selectedGrade !== 'all' && (
            <span className="text-[11px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1">
              <span>🎓 الصف: {selectedGrade}</span>
              <button type="button" onClick={() => setSelectedGrade('all')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📚 BOOKS & LECTURES LISTINGS (Grid or List View)        */}
      {/* ======================================================== */}
      {filteredLectures.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLectures.map((lec) => {
              const isBookmarked = bookmarkedIds.includes(lec.id);
              const isOfficial = lec.isOfficialBook || lec.category === 'curriculum_book';

              return (
                <div
                  key={lec.id}
                  id={`library-${lec.id}`}
                  className={`rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:shadow-xl ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50'
                      : 'bg-white border-slate-200/90 hover:border-indigo-400 shadow-xs'
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Badges Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                            isOfficial
                              ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/30'
                              : lec.category === 'summary_notes'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                              : lec.category === 'exam_archive'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isOfficial
                            ? '📕 كتاب منهجي رسمي'
                            : lec.category === 'summary_notes'
                            ? '📝 ملزمة وملخص مدرسي'
                            : lec.category === 'exam_archive'
                            ? '🎯 أسئلة وحلول وزارية'
                            : '📑 ورقة عمل واختبار'}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                            isDark
                              ? 'bg-slate-800 text-emerald-400 border-slate-700'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {lec.subject}
                        </span>
                      </div>

                      {/* Bookmark, Share & Quick Edit Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {checkCanModify(lec) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLecture(lec);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all cursor-pointer"
                            title="تعديل وتحديث بيانات الكتاب والمحتوى"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {checkCanModify(lec) && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingLecture(lec);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف هذا الكتاب من المكتبة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleBookmark(lec.id)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-400 text-slate-950'
                              : isDark
                              ? 'bg-slate-800 text-slate-400 hover:text-amber-300'
                              : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                          }`}
                          title="حفظ في المفضلة"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(lec)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            copiedId === lec.id
                              ? 'bg-emerald-500 text-white'
                              : isDark
                              ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                          }`}
                          title="نسخ الرابط"
                        >
                          {copiedId === lec.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Book Title */}
                    <div className="space-y-1.5">
                      <h3 className="text-sm sm:text-base font-black leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {lec.title}
                      </h3>

                      {/* Metadata Chips: Grade, Pages, Size */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{lec.gradeLevel}</span>
                        </span>
                        {lec.pageCount && (
                          <>
                            <span>•</span>
                            <span className="font-mono">📄 {lec.pageCount} صفحة</span>
                          </>
                        )}
                        {lec.fileSize && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {lec.fileSize}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {lec.description || 'الكتاب المنهجي الرسمي المعتمد من وزارة التربية العراقية.'}
                    </p>

                    {/* Chapters Pill / Syllabus Drawer button */}
                    {lec.chapters && lec.chapters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDetailBook(lec)}
                        className={`w-full p-2 rounded-2xl text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isDark
                            ? 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border border-slate-700'
                            : 'bg-indigo-50/70 hover:bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>يحتوي على {lec.chapters.length} فصول ووحدات مقررة</span>
                        </span>
                        <span className="text-[10px] underline">عرض الفهرس 📖</span>
                      </button>
                    )}
                  </div>

                  {/* Footer with Supervisor info & Primary Action Buttons */}
                  <div
                    className={`p-4 sm:p-5 border-t space-y-3 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/80 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {isMaleTeacher(lec.teacherName) ? '👨‍🏫' : '👩‍🏫'}
                        </span>
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-none">
                            {getSupervisorLabel(lec.teacherName)}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {lec.teacherName}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono text-left">
                        <span>📥 {lec.downloadCount || 0}</span>
                        <span className="mx-1">•</span>
                        <span>👁️ {lec.viewsCount || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Read In-App (Canvas) + Download PDF */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Direct In-App Reader (Canvas, never blocked) */}
                      <button
                        type="button"
                        onClick={() => {
                          setReadingResource(lec);
                          setIsReaderOpen(true);
                        }}
                        className="px-3 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        title="قراءة واطلاع مباشر داخل المنصة"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>قراءة مباشرة 📖</span>
                      </button>

                      {/* Download PDF Directly */}
                      <button
                        type="button"
                        onClick={() => handleDownload(lec)}
                        className="px-3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        title="تنزيل ملف PDF إلى جهازك"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل PDF 📥</span>
                      </button>
                    </div>

                    {/* Teacher / Admin Management Controls for this Book */}
                    {checkCanModify(lec) && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLecture(lec);
                            setIsEditModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-amber-500/25 transition-all cursor-pointer"
                          title="تعديل بيانات وتحديث الكتاب"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>تعديل المرجع ✏️</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingLecture(lec);
                            setIsDeleteModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 border border-rose-500/25 transition-all cursor-pointer"
                          title="حذف هذا الكتاب نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف 🗑️</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View (Organized Table) */
          <div
            className={`rounded-3xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead
                  className={`font-black border-b ${
                    isDark
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-4">نوع المرجع</th>
                    <th className="p-4">عنوان الكتاب / المرجع</th>
                    <th className="p-4">الصف الدراسي</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">مدرس المادة المشرف</th>
                    <th className="p-4">الصفحات والحجم</th>
                    <th className="p-4 text-center">الإجراءات والتحميل</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-800'
                  }`}
                >
                  {filteredLectures.map((lec) => {
                    const isOfficial = lec.isOfficialBook || lec.category === 'curriculum_book';
                    return (
                      <tr
                        key={lec.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                              isOfficial
                                ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/30'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {isOfficial ? '📕 كتاب منهجي' : '📝 ملزمة دراسية'}
                          </span>
                        </td>
                        <td className="p-4 font-bold">
                          <div className="space-y-0.5">
                            <span className="font-black text-sm block">{lec.title}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {lec.description}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap font-semibold text-indigo-600 dark:text-indigo-400">
                          {lec.gradeLevel}
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                          {lec.subject}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-bold flex items-center gap-1">
                            <span>{isMaleTeacher(lec.teacherName) ? '👨‍🏫' : '👩‍🏫'}</span>
                            <span>{lec.teacherName}</span>
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                          {lec.pageCount ? `${lec.pageCount} ص` : 'كامل'} • {lec.fileSize || 'PDF'}
                        </td>
                        <td className="p-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setReadingResource(lec);
                                setIsReaderOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                              title="قراءة واطلاع مباشر"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>قراءة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(lec)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                              title="تحميل PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل</span>
                            </button>

                            {checkCanModify(lec) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLecture(lec);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold transition-colors cursor-pointer"
                                  title="تعديل وتحديث بيانات ومحتوى الكتاب"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingLecture(lec);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-bold transition-colors cursor-pointer"
                                  title="حذف هذا الكتاب من المكتبة"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div
          className={`py-16 px-6 text-center rounded-3xl border border-dashed space-y-3 ${
            isDark
              ? 'bg-slate-900/50 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-300 text-slate-500'
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            لا توجد كتب أو مراجع مطابقة لخيارات الفلترة المحددة
          </h3>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            يرجى تجربة تغيير اسم المدرس أو المادة أو الصف الدراسي، أو الضغط على زر إعادة ضبط الفلاتر للاطلاع على كافة محتويات المكتبة الرقمية.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة ضبط وعرض كافة المناهج</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📖 CHAPTER INDEX / DETAILS MODAL                         */}
      {/* ======================================================== */}
      {selectedDetailBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border space-y-5 max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  فهرس المنهاج الرسمي المعتمد
                </span>
                <h3 className="text-base font-black">{selectedDetailBook.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>🎓 {selectedDetailBook.gradeLevel}</span>
                  <span>•</span>
                  <span>📚 {selectedDetailBook.subject}</span>
                  <span>•</span>
                  <span>{getSupervisorLabel(selectedDetailBook.teacherName)}: {selectedDetailBook.teacherName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailBook(null)}
                className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>الفصول والموضوعات المقررة:</span>
              </h4>

              <div className="space-y-2.5">
                {selectedDetailBook.chapters && selectedDetailBook.chapters.length > 0 ? (
                  selectedDetailBook.chapters.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>{ch.title}</span>
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                          ص {ch.pageNumber}
                        </span>
                      </div>
                      {ch.summary && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {ch.summary}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    هذا الكتاب يحتوي على المنهج الموحد لوزارة التربية العراقية بكافة وحداته.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {checkCanModify(selectedDetailBook) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const targetBook = selectedDetailBook;
                        setSelectedDetailBook(null);
                        setEditingLecture(targetBook);
                        setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="تعديل وتحديث بيانات الكتاب"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>تعديل الكتاب ✏️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetBook = selectedDetailBook;
                        setSelectedDetailBook(null);
                        setDeletingLecture(targetBook);
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="حذف هذا الكتاب نهائياً من المكتبة وقاعدة البيانات"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف نهائي 🗑️</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setReadingResource(selectedDetailBook);
                    setSelectedDetailBook(null);
                    setIsReaderOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>فتح القراءة التفاعلية 📖</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(selectedDetailBook);
                    setSelectedDetailBook(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل PDF 📥</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📖 FULL IN-APP UNIVERSAL READER MODAL (HTML5 Canvas PDF) */}
      {/* ======================================================== */}
      <DigitalLibraryReaderModal
        isOpen={isReaderOpen}
        resource={readingResource}
        onClose={() => {
          setIsReaderOpen(false);
          setReadingResource(null);
        }}
      />

      {/* ======================================================== */}
      {/* ✏️ EDIT LECTURE / BOOK MODAL                            */}
      {/* ======================================================== */}
      <EditLectureModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLecture(null);
        }}
        lecture={editingLecture}
        isAdmin={isDirectressOrAdmin}
      />

      {/* ======================================================== */}
      {/* 🗑️ DELETE LECTURE / BOOK MODAL                          */}
      {/* ======================================================== */}
      <DeleteLectureModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingLecture(null);
        }}
        lecture={deletingLecture}
        isAdmin={isDirectressOrAdmin}
      />
    </div>
  );
};

export default DigitalLibraryHub;
