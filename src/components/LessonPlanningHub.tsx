import React, { useState, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Check,
  AlertCircle,
  Share2,
  Download,
  Eye,
  Layers,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Flame,
  HelpCircle,
  BarChart3,
  BookmarkCheck,
  FolderOpen,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditUserModal } from './EditUserModal';
import { isMaleTeacher, getTeacherAccountLabel, getTeacherNoun } from '../utils/teacherUtils';
import {
  AnnualPlan,
  DailyLessonPlan,
  GradeLevel,
  AnnualSemesterPlan,
  AnnualMonthPlan,
  AnnualWeekPlan,
  GRADE_LEVELS
} from '../types';
import { IRAQI_SUBJECT_TEMPLATES } from '../data/initialCurriculumPlans';

interface Props {
  defaultView?: 'annual' | 'daily' | 'analytics';
  prefilteredSubject?: string;
  defaultTeacherSubject?: string;
  prefilteredGrade?: GradeLevel;
}

export interface SubjectCategoryGroup {
  category: string;
  subjects: string[];
}

export const SUBJECT_CATEGORIES: SubjectCategoryGroup[] = [
  {
    category: 'العلوم الطبيعية والرياضيات',
    subjects: [
      'الرياضيات',
      'الفيزياء',
      'الكيمياء',
      'علم الأحياء',
      'علم الأرض (الجيولوجيا)'
    ]
  },
  {
    category: 'اللغات والآداب',
    subjects: [
      'اللغة العربية',
      'اللغة الإنجليزية',
      'اللغة الفرنسية',
      'اللغة الكردية'
    ]
  },
  {
    category: 'الحاسوب وتكنولوجيا المعلومات',
    subjects: [
      'الحاسوب',
      'الحاسوب والذكاء الاصطناعي'
    ]
  },
  {
    category: 'العلوم الاجتماعية والإنسانية',
    subjects: [
      'الاجتماعيات',
      'التاريخ',
      'الجغرافيا',
      'التربية الوطنية'
    ]
  },
  {
    category: 'التربية الإسلامية والأخلاق والمنهاج الوزاري',
    subjects: [
      'التربية الإسلامية',
      'التربية الأخلاقية',
      'جرائم حزب البعث'
    ]
  },
  {
    category: 'الأنشطة ورعاية الموهبة والبحث العلمي',
    subjects: [
      'التربية الفنية',
      'التربية الرياضية',
      'البحث العلمي ورعاية الموهبة'
    ]
  }
];

export const ALL_SUBJECTS: string[] = [
  // العلوم الطبيعية والرياضيات
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'علم الأحياء',
  'علم الأرض (الجيولوجيا)',
  // اللغات والآداب
  'اللغة العربية',
  'اللغة الإنجليزية',
  'اللغة الفرنسية',
  'اللغة الكردية',
  // الحاسوب والتكنولوجيا
  'الحاسوب',
  'الحاسوب والذكاء الاصطناعي',
  // المواد الاجتماعية والإنسانية
  'الاجتماعيات',
  'التاريخ',
  'الجغرافيا',
  'التربية الوطنية',
  // التربية الإسلامية والأخلاق والمنهاج الوزاري
  'التربية الإسلامية',
  'التربية الأخلاقية',
  'جرائم حزب البعث',
  // الأنشطة والموهبة
  'التربية الفنية',
  'التربية الرياضية',
  'البحث العلمي ورعاية الموهبة'
];

export const LessonPlanningHub: React.FC<Props> = ({
  defaultView = 'annual',
  prefilteredSubject,
  defaultTeacherSubject,
  prefilteredGrade
}) => {
  const effectiveSubject = prefilteredSubject || defaultTeacherSubject;
  const {
    role,
    currentUser,
    teachers,
    annualPlans,
    dailyLessonPlans,
    addAnnualPlan,
    updateAnnualPlan,
    deleteAnnualPlan,
    duplicateAnnualPlan,
    toggleAnnualTopicCompletion,
    approveAnnualPlan,
    addDailyLessonPlan,
    updateDailyLessonPlan,
    deleteDailyLessonPlan,
    duplicateDailyLessonPlan,
    approveDailyLessonPlan,
    schoolAdminData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'annual' | 'daily' | 'analytics'>(defaultView);
  const [selectedGrade, setSelectedGrade] = useState<string>(prefilteredGrade || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>(prefilteredSubject || 'all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<'all' | 'mine' | string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAnnualModal, setShowAnnualModal] = useState(false);
  const [editingAnnualPlan, setEditingAnnualPlan] = useState<AnnualPlan | null>(null);
  const [viewingAnnualPlan, setViewingAnnualPlan] = useState<AnnualPlan | null>(null);

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [editingDailyPlan, setEditingDailyPlan] = useState<DailyLessonPlan | null>(null);
  const [viewingDailyPlan, setViewingDailyPlan] = useState<DailyLessonPlan | null>(null);

  // Permanent Delete Modal State (for Directress, Admin, and Plan Owner)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'annual' | 'daily';
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    teacherName: string;
  } | null>(null);

  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Approval Modal State
  const [approvalTarget, setApprovalTarget] = useState<{
    type: 'annual' | 'daily';
    id: string;
    title: string;
    isSupervisor: boolean;
  } | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Teacher Account Edit State (تعديل حساب المدرس أو المدرسة)
  const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<any>(null);
  const [isTeacherSelectModalOpen, setIsTeacherSelectModalOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  const handleOpenEditTeacher = (teacher: any) => {
    if (!teacher) {
      const fallback = teachers[0] || null;
      setTeacherToEdit(fallback);
    } else {
      setTeacherToEdit(teacher);
    }
    setIsTeacherSelectModalOpen(false);
    setIsEditTeacherModalOpen(true);
  };

  // 1. Management & Directress: Full permissions across the entire school
  const isManagement = useMemo(() => {
    if (!currentUser) return role === 'admin';
    const name = (currentUser.name || '').toLowerCase();
    return (
      role === 'admin' ||
      currentUser.role === 'admin' ||
      Boolean((currentUser as any).isDirectress) ||
      (currentUser as any).role === 'principal' ||
      currentUser.id === 'admin-main' ||
      currentUser.id === 'admin' ||
      name.includes('الهام') ||
      name.includes('إلهام') ||
      name.includes('المديرة') ||
      name.includes('إدارة') ||
      name.includes('ادارة')
    );
  }, [role, currentUser]);

  const isSupervisor = role === 'supervisor' || currentUser?.role === 'supervisor';
  const isTeacher = role === 'teacher' || currentUser?.role === 'teacher';

  // Active Teacher Profile for current user (when logged in as teacher)
  const activeTeacher = useMemo(() => {
    if (!currentUser) return null;
    return (
      teachers.find(
        (t) =>
          (t.id && t.id === currentUser.id) ||
          (currentUser.teacherObj?.id && t.id === currentUser.teacherObj.id) ||
          (currentUser.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.name && t.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      ) ||
      (currentUser.role === 'teacher' ? (currentUser.teacherObj as any) : null)
    );
  }, [currentUser, teachers]);

  // Ownership verification: Did the current teacher create this plan?
  const isPlanOwner = (plan: AnnualPlan | DailyLessonPlan): boolean => {
    if (!currentUser) return false;

    // Check by teacherId
    if (plan.teacherId) {
      if (currentUser.id && plan.teacherId === currentUser.id) return true;
      if (currentUser.teacherObj?.id && plan.teacherId === currentUser.teacherObj.id) return true;
      if (activeTeacher?.id && plan.teacherId === activeTeacher.id) return true;
    }

    // Check by createdBy if present
    if (plan.createdBy) {
      const cb = plan.createdBy;
      if (cb === currentUser.id || cb === currentUser.teacherObj?.id || cb === activeTeacher?.id) return true;
    }

    // Check by teacherName
    const planTeacher = (plan.teacherName || '').trim().toLowerCase();
    if (planTeacher) {
      if (currentUser.name && planTeacher === currentUser.name.trim().toLowerCase()) return true;
      if (currentUser.teacherObj?.name && planTeacher === currentUser.teacherObj.name.trim().toLowerCase()) return true;
      if (activeTeacher?.name && planTeacher === activeTeacher.name.trim().toLowerCase()) return true;
    }

    return false;
  };

  // Rule 1: Management (Directress & Admin) has ALL permissions (Add, Edit, Delete permanently, Duplicate, Approve, Toggle progress)
  // Rule 2: Subject Teacher can ONLY edit or delete plans they created; CANNOT edit or delete another teacher's plan
  const canEditPlan = (plan: AnnualPlan | DailyLessonPlan): boolean => {
    if (isManagement) return true;
    if (isTeacher) return isPlanOwner(plan);
    return false;
  };

  const canDeletePlan = (plan: AnnualPlan | DailyLessonPlan): boolean => {
    if (isManagement) return true;
    if (isTeacher) return isPlanOwner(plan);
    return false;
  };

  const canCreate = isManagement || isTeacher;

  const canToggleCompletion = (plan: AnnualPlan): boolean => {
    if (isManagement) return true;
    if (isTeacher) return isPlanOwner(plan);
    return false;
  };

  // Filtered Annual Plans
  const filteredAnnualPlans = useMemo(() => {
    return annualPlans.filter((plan) => {
      const matchGrade = selectedGrade === 'all' || plan.gradeLevel === selectedGrade;
      const cleanFilterSubj = selectedSubject.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const cleanPlanSubj = plan.subject.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const matchSubj =
        selectedSubject === 'all' ||
        plan.subject === selectedSubject ||
        cleanPlanSubj === cleanFilterSubj;
      const matchTeacher =
        selectedTeacherFilter === 'all'
          ? true
          : selectedTeacherFilter === 'mine'
          ? isPlanOwner(plan)
          : plan.teacherId === selectedTeacherFilter ||
            (plan.teacherName && plan.teacherName.toLowerCase().includes(selectedTeacherFilter.toLowerCase()));
      const matchSearch =
        searchQuery.trim() === '' ||
        plan.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchSubj && matchTeacher && matchSearch;
    });
  }, [annualPlans, selectedGrade, selectedSubject, selectedTeacherFilter, searchQuery, currentUser, activeTeacher]);

  // Filtered Daily Plans
  const filteredDailyPlans = useMemo(() => {
    return dailyLessonPlans.filter((plan) => {
      const matchGrade = selectedGrade === 'all' || plan.gradeLevel === selectedGrade;
      const cleanFilterSubj = selectedSubject.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const cleanPlanSubj = plan.subject.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const matchSubj =
        selectedSubject === 'all' ||
        plan.subject === selectedSubject ||
        cleanPlanSubj === cleanFilterSubj;
      const matchTeacher =
        selectedTeacherFilter === 'all'
          ? true
          : selectedTeacherFilter === 'mine'
          ? isPlanOwner(plan)
          : plan.teacherId === selectedTeacherFilter ||
            (plan.teacherName && plan.teacherName.toLowerCase().includes(selectedTeacherFilter.toLowerCase()));
      const matchSearch =
        searchQuery.trim() === '' ||
        plan.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchSubj && matchTeacher && matchSearch;
    });
  }, [dailyLessonPlans, selectedGrade, selectedSubject, selectedTeacherFilter, searchQuery, currentUser, activeTeacher]);

  // Calculate Progress for an annual plan
  const getPlanProgress = (plan: AnnualPlan) => {
    let totalWeeks = 0;
    let completedWeeks = 0;
    plan.semesters.forEach((sem) => {
      sem.months.forEach((m) => {
        m.weeks.forEach((w) => {
          totalWeeks += 1;
          if (w.isCompleted) completedWeeks += 1;
        });
      });
    });
    const percent = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
    return { totalWeeks, completedWeeks, percent };
  };

  // Handle Print Action
  const handlePrintPlan = (type: 'annual' | 'daily') => {
    window.print();
  };

  return (
    <div className="space-y-6" id="lesson-planning-hub-main">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  نظام إعداد الخطط السنوية واليومية
                </h1>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  منهاج المتميزات 2026-2027
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                التخطيط المنهجي الشامل، التحضير اليومي النموذجي، ومتابعة نسب تغطية المنهاج الدراسي
              </p>

              {/* Role & Permissions Badge */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {isManagement ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      حساب الإدارة والمديرة: كافة الصلاحيات مفعّلة (إضافة، تعديل، حذف نهائي، واعتماد لجميع الكوادر)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTeacherFilter !== 'all') {
                          const found = teachers.find((t) => t.id === selectedTeacherFilter);
                          if (found) {
                            handleOpenEditTeacher(found);
                            return;
                          }
                        }
                        setIsTeacherSelectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 shadow-xs transition cursor-pointer"
                      title={
                        selectedTeacherFilter !== 'all'
                          ? getTeacherAccountLabel(teachers.find((t) => t.id === selectedTeacherFilter), undefined, true)
                          : 'تعديل حساب المدرس أو المدرسة'
                      }
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {selectedTeacherFilter !== 'all'
                          ? getTeacherAccountLabel(teachers.find((t) => t.id === selectedTeacherFilter), undefined, true)
                          : 'تعديل حساب المدرس أو المدرسة'}
                      </span>
                    </button>
                  </>
                ) : isTeacher ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs font-bold border border-indigo-200 shadow-xs">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>
                      {getTeacherAccountLabel(activeTeacher || currentUser)} ({activeTeacher?.name || currentUser?.name}): تعديل وحذف الخطط التي أعددتها فقط، مع إمكانية استنساخ أي خطة كقالب
                    </span>
                    <button
                      type="button"
                      id="btn-edit-active-teacher-badge"
                      onClick={() => handleOpenEditTeacher(activeTeacher || teachers[0])}
                      className="mr-1 px-2.5 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title={getTeacherAccountLabel(activeTeacher || currentUser, undefined, true)}
                    >
                      <Edit className="w-3 h-3 text-indigo-600" />
                      <span>{getTeacherAccountLabel(activeTeacher || currentUser, undefined, true)}</span>
                    </button>
                  </span>
                ) : isSupervisor ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    حساب الإشراف الاختصاصي: صلاحيات المتابعة، المصادقة الرسمية، وتثبيت التوجيهات
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <>
                <button
                  id="btn-create-annual-plan"
                  onClick={() => {
                    setEditingAnnualPlan(null);
                    setShowAnnualModal(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  إعداد خطة سنوية
                </button>
                <button
                  id="btn-create-daily-plan"
                  onClick={() => {
                    setEditingDailyPlan(null);
                    setShowDailyModal(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  تحضير درس يومي
                </button>
              </>
            )}
            <button
              id="btn-edit-teacher-account-header"
              type="button"
              onClick={() => {
                if (isTeacher && activeTeacher) {
                  handleOpenEditTeacher(activeTeacher);
                } else if (selectedTeacherFilter !== 'all') {
                  const found = teachers.find((t) => t.id === selectedTeacherFilter);
                  handleOpenEditTeacher(found || teachers[0]);
                } else {
                  setIsTeacherSelectModalOpen(true);
                }
              }}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              title={
                isTeacher && activeTeacher
                  ? getTeacherAccountLabel(activeTeacher, undefined, true)
                  : selectedTeacherFilter !== 'all'
                  ? getTeacherAccountLabel(teachers.find((t) => t.id === selectedTeacherFilter), undefined, true)
                  : 'تعديل حساب المدرس أو المدرسة'
              }
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>
                {isTeacher && activeTeacher
                  ? getTeacherAccountLabel(activeTeacher, undefined, true)
                  : selectedTeacherFilter !== 'all'
                  ? getTeacherAccountLabel(teachers.find((t) => t.id === selectedTeacherFilter), undefined, true)
                  : 'تعديل حساب المدرس أو المدرسة'}
              </span>
            </button>
            <button
              onClick={() => handlePrintPlan(activeTab === 'daily' ? 'daily' : 'annual')}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 transition"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'annual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            الخطط السنوية للمناهج ({annualPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            التحضير اليومي للدروس ({dailyLessonPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            مؤشرات الإنجاز وتغطية المنهاج
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>تصفية:</span>
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">كافة الصفوف والمراحل</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">كافة المواد الدراسية ({ALL_SUBJECTS.length})</option>
            {SUBJECT_CATEGORIES.map((cat) => (
              <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                {cat.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Teacher Scope Filter */}
          {isTeacher && !isManagement ? (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedTeacherFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedTeacherFilter === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                كافة خطط المدرسة
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeacherFilter('mine')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedTeacherFilter === 'mine'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                خططي فقط
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">كافة المدرسين والمدرسات والكوادر</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
              {selectedTeacherFilter !== 'all' && (() => {
                const foundTeacher = teachers.find((t) => t.id === selectedTeacherFilter);
                const editLabel = getTeacherAccountLabel(foundTeacher, undefined, true);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (foundTeacher) handleOpenEditTeacher(foundTeacher);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title={editLabel}
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">{editLabel}</span>
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالمدرس أو المدرسة، المادة، أو العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
        </div>
      </div>

      {/* TAB 1: ANNUAL PLANS LIST */}
      {activeTab === 'annual' && (
        <div className="space-y-4">
          {filteredAnnualPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد خطط سنوية مطابقة للتصفية</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                يمكنك إضافة خطة سنوية جديدة لأي مادة وصف بالضغط على زر "إعداد خطة سنوية"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAnnualPlans.map((plan) => {
                const { totalWeeks, completedWeeks, percent } = getPlanProgress(plan);
                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Plan Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {plan.subject}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {plan.gradeLevel}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mt-1.5 flex items-center gap-1.5">
                            الخطة السنوية - العام الدراسي {plan.academicYear}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {plan.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              معتمدة وزارياً
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              قيد المراجعة
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teacher & Quota info */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400">{isMaleTeacher(plan.teacherName, (plan as any).teacherGender) ? 'المدرس: ' : 'المدرسة: '}</span>
                          <span className="font-bold text-slate-700">{plan.teacherName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">الحصص الأسبوعية: </span>
                          <span className="font-bold text-slate-700">{plan.weeklyPeriodsCount} حصص</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500 font-medium">نسبة إنجاز المفردات المنهجية:</span>
                          <span className="font-bold text-indigo-600">
                            {completedWeeks} من {totalWeeks} أسبوعاً ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Supervisors & Approvals */}
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        {plan.approvedBy && (
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                            <span>مصدقة الإدارة: {plan.approvedBy}</span>
                          </div>
                        )}
                        {plan.supervisorName && (
                          <div className="flex items-center gap-1.5 text-indigo-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>المشرف الاختصاصي: {plan.supervisorName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setViewingAnnualPlan(plan)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        عرض الخطة والمفردات
                      </button>

                      <div className="flex items-center gap-1">
                        {(isManagement || isSupervisor) && (
                          <button
                            onClick={() => {
                              setApprovalTarget({
                                type: 'annual',
                                id: plan.id,
                                title: `${plan.subject} - ${plan.gradeLevel}`,
                                isSupervisor: isSupervisor
                              });
                              setApprovalNotes(isSupervisor ? (plan.supervisorNotes || '') : (plan.approvalNotes || ''));
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title={isSupervisor ? 'المصادقة الإشرافية' : 'المصادقة والاعتماد الإداري'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {canCreate && (
                          <button
                            onClick={() => {
                              duplicateAnnualPlan(plan.id);
                              showToast(`تم استنساخ الخطة لمادة (${plan.subject}) بنجاح`);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                            title="استنساخ / تكرار الخطة كقالب"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}

                        {canEditPlan(plan) ? (
                          <button
                            onClick={() => {
                              setEditingAnnualPlan(plan);
                              setShowAnnualModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={isManagement ? "تعديل الخطة السنوية (صلاحية الإدارة)" : "تعديل خطتي السنوية"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        ) : isTeacher ? (
                          <span
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg inline-flex items-center"
                            title={
                              isMaleTeacher(plan.teacherName, (plan as any).teacherGender)
                                ? `خاص بالمدرس (${plan.teacherName}) - لا تملك صلاحية تعديل خطة مدرس آخر`
                                : `خاص بالمدرسة (${plan.teacherName}) - لا تملكين صلاحية تعديل خطة مدرسة أخرى`
                            }
                          >
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : null}

                        {canDeletePlan(plan) && (
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'annual',
                                id: plan.id,
                                title: `الخطة السنوية لمادة ${plan.subject}`,
                                subject: plan.subject,
                                gradeLevel: plan.gradeLevel,
                                teacherName: plan.teacherName,
                              });
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title={isManagement ? "حذف نهائي للخطة (صلاحية الإدارة والمديرة)" : "حذف خطتي السنوية نهائياً"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY LESSON PLANS LIST */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {filteredDailyPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد خطط دروس يومية مطابقة للتصفية</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                يمكنك إعداد دفتر تحضير يومي جديد لأي درس بالضغط على زر "تحضير درس يومي"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDailyPlans.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {lesson.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {lesson.gradeLevel} {lesson.section && `(شعبة ${lesson.section})`}
                          </span>
                          <span className="text-xs text-slate-400">
                            الحصة: {lesson.periodNumber}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mt-1.5">
                          {lesson.lessonTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{lesson.unitOrChapter}</p>
                      </div>

                      {/* Status */}
                      <div>
                        {lesson.status === 'reviewed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            تم التقييم الإداري
                          </span>
                        ) : lesson.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Check className="w-3.5 h-3.5" />
                            تم إنجاز الدرس
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            <Clock className="w-3.5 h-3.5" />
                            مُعَد للتدريس
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Teacher */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400">التاريخ: </span>
                        <span className="font-bold text-slate-700">{lesson.dayName} {lesson.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">{isMaleTeacher(lesson.teacherName, (lesson as any).teacherGender) ? 'المدرس: ' : 'المدرسة: '}</span>
                        <span className="font-bold text-slate-700">{lesson.teacherName}</span>
                      </div>
                    </div>

                    {/* Objectives summary */}
                    <div className="space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>الأهداف السلوكية: </span>
                        <span className="text-slate-500 font-normal">
                          {lesson.behavioralObjectives.cognitive.length} معرفي • {lesson.behavioralObjectives.skill.length} مهاري • {lesson.behavioralObjectives.affective.length} وجداني
                        </span>
                      </div>
                      {lesson.textbookPages && (
                        <div className="text-slate-500">
                          صفحات الكتاب المقرر: <span className="font-bold text-slate-700">{lesson.textbookPages}</span>
                        </div>
                      )}
                    </div>

                    {/* Review notes if any */}
                    {(lesson.principalNotes || lesson.supervisorNotes) && (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-0.5">
                        {lesson.principalNotes && (
                          <div>
                            <span className="font-bold">ملاحظات المديرة:</span> {lesson.principalNotes}
                          </div>
                        )}
                        {lesson.supervisorNotes && (
                          <div>
                            <span className="font-bold">ملاحظات المشرف:</span> {lesson.supervisorNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setViewingDailyPlan(lesson)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      عرض دفتر التحضير
                    </button>

                    <div className="flex items-center gap-1">
                      {(isManagement || isSupervisor) && (
                        <button
                          onClick={() => {
                            setApprovalTarget({
                              type: 'daily',
                              id: lesson.id,
                              title: `${lesson.subject} - ${lesson.lessonTitle}`,
                              isSupervisor: isSupervisor
                            });
                            setApprovalNotes(isSupervisor ? (lesson.supervisorNotes || '') : (lesson.principalNotes || ''));
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="اعتماد وتوثيق الملاحظات"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      {canCreate && (
                        <button
                          onClick={() => {
                            duplicateDailyLessonPlan(lesson.id);
                            showToast(`تم تكرار خطة درس (${lesson.lessonTitle}) بنجاح`);
                          }}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                          title="تكرار خطة الدرس كقالب"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}

                      {canEditPlan(lesson) ? (
                        <button
                          onClick={() => {
                            setEditingDailyPlan(lesson);
                            setShowDailyModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title={isManagement ? "تعديل خطة الدرس (صلاحية الإدارة)" : "تعديل خطة درسي"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : isTeacher ? (
                        <span
                          className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg inline-flex items-center"
                          title={
                            isMaleTeacher(lesson.teacherName, (lesson as any).teacherGender)
                              ? `خاص بالمدرس (${lesson.teacherName}) - لا تملك صلاحية تعديل خطة مدرس آخر`
                              : `خاص بالمدرسة (${lesson.teacherName}) - لا تملكين صلاحية تعديل خطة مدرسة أخرى`
                          }
                        >
                          <Lock className="w-4 h-4" />
                        </span>
                      ) : null}

                      {canDeletePlan(lesson) && (
                        <button
                          onClick={() => {
                            setDeleteTarget({
                              type: 'daily',
                              id: lesson.id,
                              title: `خطة درس (${lesson.lessonTitle})`,
                              subject: lesson.subject,
                              gradeLevel: lesson.gradeLevel,
                              teacherName: lesson.teacherName,
                            });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={isManagement ? "حذف نهائي لخطة الدرس (صلاحية الإدارة والمديرة)" : "حذف خطة درسي نهائياً"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & CURRICULUM COVERAGE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{annualPlans.length}</div>
                <div className="text-xs text-slate-500">إجمالي الخطط السنوية المعتمدة</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{dailyLessonPlans.length}</div>
                <div className="text-xs text-slate-500">إجمالي الدروس اليومية المحضرة</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">
                  {annualPlans.filter((p) => p.status === 'approved').length}
                </div>
                <div className="text-xs text-slate-500">خطط سنوية مصادقة ومطابقة للمعايير</div>
              </div>
            </div>
          </div>

          {/* Detailed Coverage by Subject Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              تقرير متابعة تغطية المناهج والمفردات الدراسية
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">المادة الدراسية</th>
                    <th className="py-3 px-4">الصف والمرحلة</th>
                    <th className="py-3 px-4">المدرس أو المدرسة</th>
                    <th className="py-3 px-4 text-center">الأسابيع المنجزة</th>
                    <th className="py-3 px-4 text-center">نسبة الإنجاز</th>
                    <th className="py-3 px-4 text-center">حالة الاعتماد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {annualPlans.map((plan) => {
                    const { totalWeeks, completedWeeks, percent } = getPlanProgress(plan);
                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-800">{plan.subject}</td>
                        <td className="py-3 px-4 text-slate-600">{plan.gradeLevel}</td>
                        <td className="py-3 px-4 text-slate-600">{plan.teacherName}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {completedWeeks} / {totalWeeks}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-indigo-600">{percent}%</span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {plan.status === 'approved' ? (
                            <span className="text-emerald-700 font-bold">معتمدة</span>
                          ) : (
                            <span className="text-amber-700 font-medium">قيد التدقيق</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED ANNUAL PLAN */}
      {viewingAnnualPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      الخطة السنوية - {viewingAnnualPlan.subject}
                    </h2>
                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {viewingAnnualPlan.gradeLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    العام الدراسي {viewingAnnualPlan.academicYear} • {isMaleTeacher(viewingAnnualPlan.teacherName, (viewingAnnualPlan as any).teacherGender) ? 'المدرس' : 'المدرسة'}: {viewingAnnualPlan.teacherName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingAnnualPlan(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
              {/* Official School Header Badge */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                <div className="font-bold text-slate-700 text-sm">
                  جمهورية العراق - وزارة التربية - المديرية العامة لتربية ميسان
                </div>
                <div className="font-black text-indigo-900 text-base">
                  ثانوية ميسان للمتميزات
                </div>
                <div className="text-slate-500 text-xs">
                  الخطة السنوية وتوزيع المفردات المنهجية المعتمدة
                </div>
              </div>

              {/* General Objectives & Enrichment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    الأهداف العامة للمنهاج
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {viewingAnnualPlan.generalObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <Award className="w-4 h-4 text-amber-600" />
                    أهداف الرعاية والإثراء للموهوبات
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {viewingAnnualPlan.giftedEnrichmentGoals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Semesters & Weekly Breakdown */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  مفردات المنهاج وتوزيع الأسابيع الدراسية
                </h4>

                {viewingAnnualPlan.semesters.map((sem) => (
                  <div key={sem.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between">
                      <span>{sem.semesterName}</span>
                    </div>

                    <div className="p-4 space-y-4">
                      {sem.months.map((m) => (
                        <div key={m.id} className="space-y-2">
                          <h5 className="font-bold text-indigo-700 text-xs bg-indigo-50/60 px-3 py-1 rounded-lg inline-block">
                            📅 {m.monthName}
                          </h5>

                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
                              <thead>
                                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                  <th className="p-2.5 text-center w-12">الأسبوع</th>
                                  <th className="p-2.5 w-40">الوحدة / الفصل</th>
                                  <th className="p-2.5">المفردات والمواضيع الدراسية</th>
                                  <th className="p-2.5">النشاط والتطبيق العملي / المختبر</th>
                                  <th className="p-2.5 text-center w-24">الإنجاز</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {m.weeks.map((w) => (
                                  <tr key={w.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 text-center font-bold text-slate-700">
                                      {w.weekNumber}
                                    </td>
                                    <td className="p-2.5 font-bold text-slate-800">
                                      {w.unitOrChapter}
                                    </td>
                                    <td className="p-2.5 text-slate-700">{w.topics}</td>
                                    <td className="p-2.5 text-slate-500">{w.labOrPractical || '—'}</td>
                                    <td className="p-2.5 text-center">
                                      {canToggleCompletion(viewingAnnualPlan) ? (
                                        <button
                                          onClick={() =>
                                            toggleAnnualTopicCompletion(
                                              viewingAnnualPlan.id,
                                              sem.id,
                                              m.id,
                                              w.id
                                            )
                                          }
                                          className={`inline-flex items-center justify-center p-1 rounded-lg transition ${
                                            w.isCompleted
                                              ? 'bg-emerald-100 text-emerald-700 font-bold'
                                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                          }`}
                                          title="تغيير حالة إنجاز الأسبوع"
                                        >
                                          {w.isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                          ) : (
                                            <Clock className="w-4 h-4" />
                                          )}
                                        </button>
                                      ) : w.isCompleted ? (
                                        <span className="text-emerald-700 font-bold">تم</span>
                                      ) : (
                                        <span className="text-slate-400">قيد التنفيذ</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Endorsements footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700">مصادقة إدارة المدرسة:</div>
                  <div className="text-slate-600">
                    {viewingAnnualPlan.approvedBy || schoolAdminData.principalName || 'إدارة المدرسة'}
                  </div>
                  {viewingAnnualPlan.approvalNotes && (
                    <div className="text-emerald-700 italic">"{viewingAnnualPlan.approvalNotes}"</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700">المصادقة الإشرافية:</div>
                  <div className="text-slate-600">
                    {viewingAnnualPlan.supervisorName || 'شعبة الإشراف الاختصاصي'}
                  </div>
                  {viewingAnnualPlan.supervisorNotes && (
                    <div className="text-indigo-700 italic">"{viewingAnnualPlan.supervisorNotes}"</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {canDeletePlan(viewingAnnualPlan) && (
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: 'annual',
                        id: viewingAnnualPlan.id,
                        title: `الخطة السنوية لمادة ${viewingAnnualPlan.subject}`,
                        subject: viewingAnnualPlan.subject,
                        gradeLevel: viewingAnnualPlan.gradeLevel,
                        teacherName: viewingAnnualPlan.teacherName,
                      });
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    حذف الخطة نهائياً
                  </button>
                )}
                {canEditPlan(viewingAnnualPlan) && (
                  <button
                    onClick={() => {
                      const planToModify = viewingAnnualPlan;
                      setViewingAnnualPlan(null);
                      setEditingAnnualPlan(planToModify);
                      setShowAnnualModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-indigo-200"
                  >
                    <Edit className="w-4 h-4 text-indigo-600" />
                    تعديل الخطة السنوية
                  </button>
                )}
                {(isManagement || isSupervisor) && (
                  <button
                    onClick={() => {
                      setApprovalTarget({
                        type: 'annual',
                        id: viewingAnnualPlan.id,
                        title: `${viewingAnnualPlan.subject} - ${viewingAnnualPlan.gradeLevel}`,
                        isSupervisor: isSupervisor
                      });
                      setApprovalNotes(isSupervisor ? (viewingAnnualPlan.supervisorNotes || '') : (viewingAnnualPlan.approvalNotes || ''));
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-emerald-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isSupervisor ? 'المصادقة الإشرافية' : 'المصادقة والاعتماد الإداري'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button
                  onClick={() => setViewingAnnualPlan(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED DAILY LESSON PLAN */}
      {viewingDailyPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      دفتر التحضير اليومي - {viewingDailyPlan.lessonTitle}
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {viewingDailyPlan.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingDailyPlan.gradeLevel} • شعبة ({viewingDailyPlan.section}) • الحصة {viewingDailyPlan.periodNumber} • {viewingDailyPlan.dayName} {viewingDailyPlan.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingDailyPlan(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-slate-400">{isMaleTeacher(viewingDailyPlan.teacherName, (viewingDailyPlan as any).teacherGender) ? 'المدرس:' : 'المدرسة:'}</div>
                  <div className="font-bold text-slate-800 text-sm">{viewingDailyPlan.teacherName}</div>
                </div>
                <div>
                  <div className="text-slate-400">الوحدة / الفصل:</div>
                  <div className="font-bold text-slate-800">{viewingDailyPlan.unitOrChapter}</div>
                </div>
                <div>
                  <div className="text-slate-400">صفحات الكتاب:</div>
                  <div className="font-bold text-slate-800">{viewingDailyPlan.textbookPages || 'محدد بالمنهج'}</div>
                </div>
                <div>
                  <div className="text-slate-400">الحالة:</div>
                  <div className="font-bold text-emerald-700">
                    {viewingDailyPlan.status === 'reviewed' ? 'معتمد وموثق' : 'جاهز للتدريس'}
                  </div>
                </div>
              </div>

              {/* Behavioral Objectives */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  الأهداف السلوكية للدرس (تصنيف بلوم)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
                    <div className="font-bold text-blue-900">1. الأهداف المعرفية (Cognitive):</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {viewingDailyPlan.behavioralObjectives.cognitive.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="font-bold text-emerald-900">2. الأهداف المهارية (Skill):</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {viewingDailyPlan.behavioralObjectives.skill.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="font-bold text-purple-900">3. الأهداف الوجدانية (Affective):</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {viewingDailyPlan.behavioralObjectives.affective.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Prior Hook & Strategies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1.5">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <Flame className="w-4 h-4 text-amber-600" />
                    التهيئة والتمهيد الحافز (Hook)
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    {viewingDailyPlan.priorKnowledgeHook || 'مراجعة المفاهيم السابقة وطرح سؤال تفكير ناقد.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    استراتيجيات التدريس والوسائل
                  </h4>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="font-bold">الاستراتيجيات: </span>
                      {viewingDailyPlan.teachingStrategies.join(' • ')}
                    </div>
                    <div>
                      <span className="font-bold">الوسائل والمختبر: </span>
                      {viewingDailyPlan.teachingAidsAndTools.join(' • ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson Execution Steps */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  خطوات سير الدرس والأنشطة الصفية (45 دقيقة)
                </h4>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">1. مرحلة التهيئة (5 دقائق):</div>
                    <p className="text-slate-700">{viewingDailyPlan.lessonSteps.warmup}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">2. مرحلة العرض والشرح (25 دقيقة):</div>
                    <p className="text-slate-700">{viewingDailyPlan.lessonSteps.presentation}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">3. التطبيق والممارسة الصفية (10 دقائق):</div>
                    <p className="text-slate-700">{viewingDailyPlan.lessonSteps.practicalApplication}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">4. الغلق والتقويم الختامي (5 دقائق):</div>
                    <p className="text-slate-700">{viewingDailyPlan.lessonSteps.conclusion}</p>
                  </div>
                </div>
              </div>

              {/* Homework & Reflection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1.5">
                  <h4 className="font-bold text-emerald-900 text-sm">الواجب البيتي والأنشطة الإثرائية:</h4>
                  <p className="text-slate-700">{viewingDailyPlan.homeworkAndEnrichment}</p>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1.5">
                  <h4 className="font-bold text-indigo-900 text-sm">التأمل الذاتي للمعلمة:</h4>
                  <p className="text-slate-700">{viewingDailyPlan.teacherReflection || 'تم استيفاء مخرجات الدرس بكفاءة عالية.'}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {canDeletePlan(viewingDailyPlan) && (
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: 'daily',
                        id: viewingDailyPlan.id,
                        title: `خطة درس (${viewingDailyPlan.lessonTitle})`,
                        subject: viewingDailyPlan.subject,
                        gradeLevel: viewingDailyPlan.gradeLevel,
                        teacherName: viewingDailyPlan.teacherName,
                      });
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    حذف الخطة نهائياً
                  </button>
                )}
                {canEditPlan(viewingDailyPlan) && (
                  <button
                    onClick={() => {
                      const lessonToModify = viewingDailyPlan;
                      setViewingDailyPlan(null);
                      setEditingDailyPlan(lessonToModify);
                      setShowDailyModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-indigo-200"
                  >
                    <Edit className="w-4 h-4 text-indigo-600" />
                    تعديل خطة الدرس
                  </button>
                )}
                {(isManagement || isSupervisor) && (
                  <button
                    onClick={() => {
                      setApprovalTarget({
                        type: 'daily',
                        id: viewingDailyPlan.id,
                        title: `${viewingDailyPlan.subject} - ${viewingDailyPlan.lessonTitle}`,
                        isSupervisor: isSupervisor
                      });
                      setApprovalNotes(isSupervisor ? (viewingDailyPlan.supervisorNotes || '') : (viewingDailyPlan.principalNotes || ''));
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-emerald-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isSupervisor ? 'المصادقة الإشرافية' : 'اعتماد وتقييم الدرس'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button
                  onClick={() => setViewingDailyPlan(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ANNUAL PLAN */}
      {showAnnualModal && (
        <AnnualPlanFormModal
          planToEdit={editingAnnualPlan}
          onClose={() => setShowAnnualModal(false)}
          onSave={(data) => {
            if (editingAnnualPlan) {
              updateAnnualPlan(editingAnnualPlan.id, data);
              showToast(`تم تحديث الخطة السنوية لمادة (${data.subject}) بنجاح`);
            } else {
              addAnnualPlan({
                ...data,
                createdBy: currentUser?.id || 'user-admin',
              });
              showToast(`تمت إضافة الخطة السنوية لمادة (${data.subject}) بنجاح`);
            }
            setShowAnnualModal(false);
          }}
          teachers={teachers}
          currentUserName={currentUser?.name || ''}
          currentUserId={currentUser?.id || ''}
          isManagement={isManagement}
          activeTeacher={activeTeacher}
        />
      )}

      {/* MODAL: CREATE / EDIT DAILY LESSON PLAN */}
      {showDailyModal && (
        <DailyLessonPlanFormModal
          planToEdit={editingDailyPlan}
          annualPlans={annualPlans}
          onClose={() => setShowDailyModal(false)}
          onSave={(data) => {
            if (editingDailyPlan) {
              updateDailyLessonPlan(editingDailyPlan.id, data);
              showToast(`تم تحديث خطة درس (${data.lessonTitle}) بنجاح`);
            } else {
              addDailyLessonPlan({
                ...data,
                createdBy: currentUser?.id || 'user-admin',
              });
              showToast(`تمت إضافة خطة درس (${data.lessonTitle}) بنجاح`);
            }
            setShowDailyModal(false);
          }}
          teachers={teachers}
          currentUserName={currentUser?.name || ''}
          currentUserId={currentUser?.id || ''}
          isManagement={isManagement}
          activeTeacher={activeTeacher}
        />
      )}

      {/* MODAL: PERMANENT DELETE CONFIRMATION (ADMIN & OWNER) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">
                  تأكيد الحذف النهائي
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {isManagement
                    ? 'صلاحية الإدارة المدرسية والمديرة'
                    : isMaleTeacher(deleteTarget.teacherName)
                    ? 'صلاحية المدرس (معدّ الخطة)'
                    : 'صلاحية المدرسة (معدّة الخطة)'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2 text-xs">
              <p className="text-slate-800 font-semibold">
                هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي وتام؟
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1 text-slate-700">
                <div>
                  <span className="text-slate-400">العنوان: </span>
                  <span className="font-bold text-slate-800">{deleteTarget.title}</span>
                </div>
                <div>
                  <span className="text-slate-400">المادة والمرحلة: </span>
                  <span className="font-bold text-slate-800">{deleteTarget.subject} ({deleteTarget.gradeLevel})</span>
                </div>
                <div>
                  <span className="text-slate-400">{isMaleTeacher(deleteTarget.teacherName) ? 'المدرس: ' : 'المدرسة: '}</span>
                  <span className="font-bold text-slate-800">{deleteTarget.teacherName}</span>
                </div>
              </div>
              <p className="text-rose-700 text-xs">
                ⚠️ تنبيه: سيتم حذف هذا السجل نهائياً وبشكل تام من النظام وقاعدة البيانات المحلية ولا يمكن استرجاعه.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === 'annual') {
                    deleteAnnualPlan(deleteTarget.id);
                    if (viewingAnnualPlan?.id === deleteTarget.id) setViewingAnnualPlan(null);
                    showToast(`تم حذف الخطة السنوية لمادة (${deleteTarget.subject}) بشكل نهائي`);
                  } else {
                    deleteDailyLessonPlan(deleteTarget.id);
                    if (viewingDailyPlan?.id === deleteTarget.id) setViewingDailyPlan(null);
                    showToast(`تم حذف خطة درس (${deleteTarget.title}) بشكل نهائي`);
                  }
                  setDeleteTarget(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                تأكيد الحذف النهائي الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: APPROVAL / SUPERVISOR NOTES */}
      {approvalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {approvalTarget.isSupervisor ? 'المصادقة الإشرافية' : 'الاعتماد الإداري'}
                </h3>
                <p className="text-xs text-slate-500">{approvalTarget.title}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                الملاحظات والتوجيهات الرسمية:
              </label>
              <textarea
                rows={4}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="اكتب التوجيهات أو إشادة الإدارة والإشراف..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (approvalTarget.type === 'annual') {
                    approveAnnualPlan(approvalTarget.id, approvalNotes, isSupervisor ? 'supervisor' : 'admin');
                    showToast('تمت المصادقة والاعتماد الإداري بنجاح');
                  } else {
                    approveDailyLessonPlan(approvalTarget.id, approvalNotes, isSupervisor ? 'supervisor' : 'admin');
                    showToast('تم اعتماد وتوثيق درس التحضير بنجاح');
                  }
                  setApprovalTarget(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                تأكيد المصادقة والاعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER ACCOUNT (تعديل حساب المدرس أو المدرسة) */}
      {isEditTeacherModalOpen && teacherToEdit && (
        <EditUserModal
          isOpen={isEditTeacherModalOpen}
          onClose={() => {
            setIsEditTeacherModalOpen(false);
            setTeacherToEdit(null);
          }}
          userType="teacher"
          userData={teacherToEdit}
        />
      )}

      {/* MODAL: SELECT TEACHER TO EDIT (تعديل حساب المدرس أو المدرسة) */}
      {isTeacherSelectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-arabic">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    تعديل حساب المدرس أو المدرسة
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر المدرس أو المدرسة لتعديل بيانات الحساب، التخصص، والمراحل المسندة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherSelectModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Search filter for teachers */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث باسم المدرس أو المدرسة أو التخصص..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Teachers list */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {teachers
                .filter((t) => {
                  if (!teacherSearchTerm.trim()) return true;
                  const term = teacherSearchTerm.trim().toLowerCase();
                  return (
                    (t.name && t.name.toLowerCase().includes(term)) ||
                    (t.subject && t.subject.toLowerCase().includes(term)) ||
                    (t.email && t.email.toLowerCase().includes(term))
                  );
                })
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0 border border-indigo-200">
                        {t.name ? t.name.charAt(0) : 'م'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-full font-semibold">
                            {t.subject || 'تدريسي'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {getTeacherAccountLabel(t)} • {t.email || t.phone || 'حساب كادر تعليمي'} • {t.assignedGrades?.length || 0} مراحل مسندة
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditTeacher(t)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs hover:shadow transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{getTeacherAccountLabel(t, undefined, true)}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUBCOMPONENT: ANNUAL PLAN FORM MODAL
// ============================================================================
interface AnnualFormProps {
  planToEdit: AnnualPlan | null;
  onClose: () => void;
  onSave: (data: Omit<AnnualPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  teachers: any[];
  currentUserName: string;
  currentUserId: string;
  isManagement?: boolean;
  activeTeacher?: any;
}

const AnnualPlanFormModal: React.FC<AnnualFormProps> = ({
  planToEdit,
  onClose,
  onSave,
  teachers,
  currentUserName,
  currentUserId,
  isManagement = false,
  activeTeacher
}) => {
  const [subject, setSubject] = useState(planToEdit?.subject || activeTeacher?.subject || 'الرياضيات');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(planToEdit?.gradeLevel || 'الصف السادس العلمي');
  const [academicYear, setAcademicYear] = useState(planToEdit?.academicYear || '2026 - 2027');
  const [teacherName, setTeacherName] = useState(planToEdit?.teacherName || activeTeacher?.name || currentUserName || 'أ. دلال محمد عبد الحسين');
  const [teacherId, setTeacherId] = useState(planToEdit?.teacherId || activeTeacher?.id || currentUserId || 't-math-1');
  const [weeklyPeriodsCount, setWeeklyPeriodsCount] = useState(planToEdit?.weeklyPeriodsCount || 5);
  const [generalObjectives, setGeneralObjectives] = useState<string[]>(
    planToEdit?.generalObjectives || [
      'تعميق الاستيعاب المفاهيمي للمنهاج وتنمية التفكير العلمي الاستدلالي.',
      'تطبيق المهارات والمسائل التنافسية وحل المشكلات.',
      'توظيف التقنيات الحديثة والمختبرات المدرسية المتقدمة.'
    ]
  );
  const [giftedEnrichmentGoals, setGiftedEnrichmentGoals] = useState<string[]>(
    planToEdit?.giftedEnrichmentGoals || [
      'حل مسائل الأولمبياد والمسابقات الإثرائية التنافسية.',
      'إجراء مشاريع استقصائية معملية وبحوث موهبة مبتكرة.'
    ]
  );
  const [semesters, setSemesters] = useState<AnnualSemesterPlan[]>(
    planToEdit?.semesters || [
      {
        id: 'sem-1',
        semesterName: 'الفصل الدراسي الأول',
        months: [
          {
            id: 'm-1',
            monthName: 'تشرين الأول (أكتوبر)',
            weeks: [
              {
                id: 'w-1',
                weekNumber: 1,
                unitOrChapter: 'الفصل الأول: المفاهيم الأساسية',
                topics: 'المفاهيم التأسيسية، القوانين العامة، والتمارين النموذجية.',
                periodsCount: 5,
                labOrPractical: 'تطبيق عملي ومحاكاة تفاعلية في المختبر',
                notesOrActivities: 'ورقة عمل استكشافية رقم (1)',
                isCompleted: false
              }
            ]
          }
        ]
      }
    ]
  );

  // 1-Click Load Iraqi Gifted Template
  const handleLoadTemplate = () => {
    const cleanSubj = subject.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
    const matchedKey = Object.keys(IRAQI_SUBJECT_TEMPLATES).find(
      (k) =>
        k.trim() === subject.trim() ||
        k.replace(/[أإآ]/g, 'ا').trim().toLowerCase() === cleanSubj ||
        subject.includes(k) ||
        k.includes(subject)
    );
    const tmpl =
      (matchedKey && IRAQI_SUBJECT_TEMPLATES[matchedKey]) ||
      IRAQI_SUBJECT_TEMPLATES[subject] ||
      IRAQI_SUBJECT_TEMPLATES['الرياضيات'];
    if (tmpl) {
      setWeeklyPeriodsCount(tmpl.weeklyPeriods);
      setGeneralObjectives(tmpl.generalObjectives);
      setGiftedEnrichmentGoals(tmpl.enrichmentGoals);

      // Generate structured 2-semester 8-month syllabus
      const newSemesters: AnnualSemesterPlan[] = [
        {
          id: 'sem-1',
          semesterName: 'الفصل الدراسي الأول',
          months: [
            {
              id: 'm-1',
              monthName: 'تشرين الأول (أكتوبر)',
              weeks: [
                {
                  id: 'w-1',
                  weekNumber: 1,
                  unitOrChapter: tmpl.sampleChapters[0]?.unit || 'الفصل الأول',
                  topics: tmpl.sampleChapters[0]?.topics || 'مفاهيم الوحدة وتأسيس القوانين',
                  periodsCount: tmpl.weeklyPeriods,
                  labOrPractical: tmpl.sampleChapters[0]?.lab || 'تطبيق عملي في المختبر',
                  notesOrActivities: 'ورقة عمل تفاعلية',
                  isCompleted: false
                },
                {
                  id: 'w-2',
                  weekNumber: 2,
                  unitOrChapter: tmpl.sampleChapters[0]?.unit || 'الفصل الأول',
                  topics: 'التطبيقات والمسائل التنافسية وحل التمارين',
                  periodsCount: tmpl.weeklyPeriods,
                  labOrPractical: 'جلسة عصف ذهني وحل المسائل غير النمطية',
                  notesOrActivities: 'تحدي الأسبوع',
                  isCompleted: false
                }
              ]
            },
            {
              id: 'm-2',
              monthName: 'تشرين الثاني (نوفمبر)',
              weeks: [
                {
                  id: 'w-3',
                  weekNumber: 3,
                  unitOrChapter: tmpl.sampleChapters[1]?.unit || 'الفصل الثاني',
                  topics: tmpl.sampleChapters[1]?.topics || 'المفاهيم المتقدمة والعلاقات الرياضية',
                  periodsCount: tmpl.weeklyPeriods,
                  labOrPractical: tmpl.sampleChapters[1]?.lab || 'استخدام اللوحة الذكية',
                  notesOrActivities: 'امتحان الشهر الأول',
                  isCompleted: false
                }
              ]
            }
          ]
        },
        {
          id: 'sem-2',
          semesterName: 'الفصل الدراسي الثاني',
          months: [
            {
              id: 'm-3',
              monthName: 'شباط (فبراير)',
              weeks: [
                {
                  id: 'w-4',
                  weekNumber: 4,
                  unitOrChapter: tmpl.sampleChapters[2]?.unit || 'الفصل الثالث',
                  topics: tmpl.sampleChapters[2]?.topics || 'التطبيقات المعمقة وحل المسائل',
                  periodsCount: tmpl.weeklyPeriods,
                  labOrPractical: tmpl.sampleChapters[2]?.lab || 'نمذجة حاسوبية ومعملية',
                  notesOrActivities: 'مشروع الفصل الثاني',
                  isCompleted: false
                }
              ]
            }
          ]
        }
      ];
      setSemesters(newSemesters);
    }
  };

  const handleAddObjective = () => {
    setGeneralObjectives([...generalObjectives, '']);
  };

  const handleAddEnrichment = () => {
    setGiftedEnrichmentGoals([...giftedEnrichmentGoals, '']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      academicYear,
      subject,
      gradeLevel,
      teacherId,
      teacherName,
      weeklyPeriodsCount,
      generalObjectives: generalObjectives.filter((o) => o.trim() !== ''),
      giftedEnrichmentGoals: giftedEnrichmentGoals.filter((g) => g.trim() !== ''),
      teachingMethods: [
        'التعلم القائم على حل المشكلات',
        'الاستقصاء العلمي والتحليلي للموهوبات',
        'العصف الذهني والعمل التشاركي'
      ],
      requiredAidsAndLabs: [
        'الشاشة الذكية التفاعلية',
        'المختبر العلمي ومختبر الذكاء الاصطناعي',
        'الكتاب المنهجي ودليل المتميزين'
      ],
      assessmentStrategy: [
        'امتحانات شهرية منتظمة',
        'تقويم الأداء العملي والواجبات الإثرائية'
      ],
      status: planToEdit?.status || 'draft',
      createdBy: planToEdit?.createdBy || currentUserId || activeTeacher?.id || 'admin',
      semesters
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {planToEdit ? 'تعديل الخطة السنوية' : 'إعداد خطة سنوية جديدة'}
              </h2>
              <p className="text-xs text-slate-400">منهاج ثانوية ميسان للمتميزات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {/* Quick Template loader */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-indigo-950 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                تحميل نموذج المنهاج المعتمد لمدارس المتميزين
              </div>
              <div className="text-slate-500 mt-0.5">
                تعبئة الأهداف وتوزيع الأسابيع تلقائياً حسب المادة المختارة
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition whitespace-nowrap"
            >
              تحميل النموذج التلقائي
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">المادة الدراسية:</label>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                  {ALL_SUBJECTS.length} مادة معتمدة
                </span>
              </div>
              <select
                value={isCustomSubject ? 'custom' : subject}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomSubject(true);
                    setSubject('');
                  } else {
                    setIsCustomSubject(false);
                    setSubject(e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {!ALL_SUBJECTS.includes(subject) && subject && !isCustomSubject && (
                  <option value={subject}>{subject} (المادة الحالية)</option>
                )}
                {SUBJECT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                    {cat.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">✍️ مادة أخرى (إدخال يدوي مخصص)...</option>
              </select>

              {isCustomSubject && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="اكتب اسم المادة الدراسية هنا..."
                    className="flex-1 p-2 bg-white border border-indigo-300 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSubject(false);
                      if (!subject) setSubject(activeTeacher?.subject || 'الرياضيات');
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">الصف والمرحلة:</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">العام الدراسي:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {isMaleTeacher(teacherName) ? 'المدرس (المعدّ):' : 'المدرسة (المعدّة):'}
              </label>
              {isManagement ? (
                <div className="space-y-1">
                  <select
                    value={teacherName}
                    onChange={(e) => {
                      const selName = e.target.value;
                      setTeacherName(selName);
                      const found = teachers.find((t: any) => t.name === selName);
                      if (found) setTeacherId(found.id);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={teacherName}>
                      {teacherName} ({isMaleTeacher(teacherName) ? 'المحدد' : 'المحددة'})
                    </option>
                    {teachers
                      .filter((t: any) => t.name !== teacherName)
                      .map((t: any) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.specialization || t.subject || (isMaleTeacher(t) ? 'مدرس' : 'مدرسة')})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-bold flex items-center justify-between">
                  <span>{teacherName}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    {getTeacherAccountLabel(activeTeacher || teacherName || currentUserName)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">عدد الحصص الأسبوعية:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={weeklyPeriodsCount}
                onChange={(e) => setWeeklyPeriodsCount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-sm">الأهداف العامة للمنهاج:</label>
              <button
                type="button"
                onClick={handleAddObjective}
                className="text-indigo-600 font-bold hover:underline"
              >
                + إضافة هدف
              </button>
            </div>
            {generalObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => {
                    const copy = [...generalObjectives];
                    copy[idx] = e.target.value;
                    setGeneralObjectives(copy);
                  }}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="نص الهدف العام..."
                />
                <button
                  type="button"
                  onClick={() => setGeneralObjectives(generalObjectives.filter((_, i) => i !== idx))}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Enrichment Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-sm">أهداف الإثراء ورعاية الموهوبات:</label>
              <button
                type="button"
                onClick={handleAddEnrichment}
                className="text-amber-600 font-bold hover:underline"
              >
                + إضافة هدف إثرائي
              </button>
            </div>
            {giftedEnrichmentGoals.map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const copy = [...giftedEnrichmentGoals];
                    copy[idx] = e.target.value;
                    setGiftedEnrichmentGoals(copy);
                  }}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="نص الهدف الإثرائي..."
                />
                <button
                  type="button"
                  onClick={() => setGiftedEnrichmentGoals(giftedEnrichmentGoals.filter((_, i) => i !== idx))}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              حفظ الخطة السنوية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// SUBCOMPONENT: DAILY LESSON PLAN FORM MODAL
// ============================================================================
interface DailyFormProps {
  planToEdit: DailyLessonPlan | null;
  annualPlans: AnnualPlan[];
  onClose: () => void;
  onSave: (data: Omit<DailyLessonPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  teachers: any[];
  currentUserName: string;
  currentUserId: string;
  isManagement?: boolean;
  activeTeacher?: any;
}

const DailyLessonPlanFormModal: React.FC<DailyFormProps> = ({
  planToEdit,
  annualPlans,
  onClose,
  onSave,
  teachers,
  currentUserName,
  currentUserId,
  isManagement = false,
  activeTeacher
}) => {
  const [subject, setSubject] = useState(planToEdit?.subject || activeTeacher?.subject || 'الرياضيات');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(planToEdit?.gradeLevel || 'الصف السادس العلمي');
  const [section, setSection] = useState<string>(planToEdit?.section || 'أ');
  const [teacherName, setTeacherName] = useState(planToEdit?.teacherName || activeTeacher?.name || currentUserName || 'أ. دلال محمد عبد الحسين');
  const [teacherId, setTeacherId] = useState(planToEdit?.teacherId || activeTeacher?.id || currentUserId || 't-math-1');
  const [date, setDate] = useState(planToEdit?.date || new Date().toISOString().split('T')[0]);
  const [dayName, setDayName] = useState(planToEdit?.dayName || 'الإثنين');
  const [periodNumber, setPeriodNumber] = useState(planToEdit?.periodNumber || 1);
  const [unitOrChapter, setUnitOrChapter] = useState(planToEdit?.unitOrChapter || 'الفصل الأول');
  const [lessonTitle, setLessonTitle] = useState(planToEdit?.lessonTitle || '');
  const [textbookPages, setTextbookPages] = useState(planToEdit?.textbookPages || 'ص 15 - 20');

  // Behavioral Objectives
  const [cognitiveObjs, setCognitiveObjs] = useState<string[]>(
    planToEdit?.behavioralObjectives.cognitive || [
      'أن تشرح الطالبة المفهوم الأساسي للدرس بدقة.',
      'أن تطبق الطالبة القانون الرياضي/العلمي في حل التمارين.'
    ]
  );
  const [skillObjs, setSkillObjs] = useState<string[]>(
    planToEdit?.behavioralObjectives.skill || [
      'أن ترسم الطالبة المخطط التوضيحي/التجربة في دفتر الواجبات.'
    ]
  );
  const [affectiveObjs, setAffectiveObjs] = useState<string[]>(
    planToEdit?.behavioralObjectives.affective || [
      'أن تبدي الطالبة اهتماماً وفضولاً علمياً تجاه موضوع الدرس.'
    ]
  );

  const [priorKnowledgeHook, setPriorKnowledgeHook] = useState(
    planToEdit?.priorKnowledgeHook || 'مراجعة المكتسبات السابقة وطرح مسألة افتتاحية محفزة للتفكير الناقد.'
  );
  const [teachingStrategies, setTeachingStrategies] = useState<string[]>(
    planToEdit?.teachingStrategies || ['الاستقصاء العلمي الموجه', 'العصف الذهني', 'حل المشكلات']
  );
  const [teachingAidsAndTools, setTeachingAidsAndTools] = useState<string[]>(
    planToEdit?.teachingAidsAndTools || ['الشاشة التفاعلية الذكية', 'الكتاب المنهجي', 'أوراق العمل']
  );

  // Lesson Steps
  const [warmup, setWarmup] = useState(
    planToEdit?.lessonSteps.warmup || 'التهيئة (5 د): تهيئة الأذهان ومناقشة السؤال الافتتاحي.'
  );
  const [presentation, setPresentation] = useState(
    planToEdit?.lessonSteps.presentation || 'العرض والشرح (25 د): عرض المفاهيم والقوانين والأمثلة التوضيحية.'
  );
  const [practicalApplication, setPracticalApplication] = useState(
    planToEdit?.lessonSteps.practicalApplication || 'التطبيق والممارسة (10 د): عمل المجموعات وحل التمارين التمايزية.'
  );
  const [conclusion, setConclusion] = useState(
    planToEdit?.lessonSteps.conclusion || 'الغلق والتقويم (5 د): تلخيص مخرجات الدرس وطرح بطاقة الخروج.'
  );

  const [homeworkAndEnrichment, setHomeworkAndEnrichment] = useState(
    planToEdit?.homeworkAndEnrichment || 'حل تمرينات نهاية الدرس بالكتاب + مسألة إثرائية للموهوبات.'
  );
  const [teacherReflection, setTeacherReflection] = useState(
    planToEdit?.teacherReflection || 'تفاعل ممتاز واستيعاب كامل للمفاهيم.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subject,
      gradeLevel,
      section: (section || 'أ') as any,
      teacherId,
      teacherName,
      date,
      dayName,
      periodNumber,
      unitOrChapter,
      lessonTitle: lessonTitle.trim() || `درس ${subject}`,
      textbookPages,
      behavioralObjectives: {
        cognitive: cognitiveObjs.filter((o) => o.trim() !== ''),
        skill: skillObjs.filter((s) => s.trim() !== ''),
        affective: affectiveObjs.filter((a) => a.trim() !== '')
      },
      priorKnowledgeHook,
      teachingStrategies,
      teachingAidsAndTools,
      lessonSteps: {
        warmup,
        presentation,
        practicalApplication,
        conclusion
      },
      formativeEvaluation: ['سؤال تقويم صفي لقياس الاستيعاب'],
      homeworkAndEnrichment,
      teacherReflection,
      status: planToEdit?.status || 'prepared',
      createdBy: planToEdit?.createdBy || currentUserId || activeTeacher?.id || 'admin'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {planToEdit ? 'تعديل خطة الدرس اليومية' : 'إعداد دفتر التحضير اليومي النموذجي'}
              </h2>
              <p className="text-xs text-slate-400">ثانوية ميسان للمتميزات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Teacher and Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {isMaleTeacher(teacherName) ? 'المدرس المكلف / المعد:' : 'المدرسة المكلفة / المعدة:'}
              </label>
              {isManagement ? (
                <select
                  value={teacherName}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setTeacherName(sel);
                    const found = teachers.find((t: any) => t.name === sel);
                    if (found) setTeacherId(found.id);
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value={teacherName}>
                    {teacherName} ({isMaleTeacher(teacherName) ? 'المحدد' : 'المحددة'})
                  </option>
                  {teachers
                    .filter((t: any) => t.name !== teacherName)
                    .map((t: any) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.specialization || t.subject || (isMaleTeacher(t) ? 'مدرس' : 'مدرسة')})
                      </option>
                    ))}
                </select>
              ) : (
                <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold flex items-center justify-between">
                  <span>{teacherName}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {getTeacherAccountLabel(activeTeacher || teacherName || currentUserName)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">اليوم:</label>
              <select
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">تاريخ الحصة:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Top details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">المادة الدراسية:</label>
              <select
                value={isCustomSubject ? 'custom' : subject}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomSubject(true);
                    setSubject('');
                  } else {
                    setIsCustomSubject(false);
                    setSubject(e.target.value);
                  }
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {!ALL_SUBJECTS.includes(subject) && subject && !isCustomSubject && (
                  <option value={subject}>{subject} (المادة الحالية)</option>
                )}
                {SUBJECT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                    {cat.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">✍️ مادة أخرى (إدخال يدوي)...</option>
              </select>

              {isCustomSubject && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="اكتب اسم المادة..."
                    className="flex-1 p-2 bg-white border border-emerald-300 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSubject(false);
                      if (!subject) setSubject(activeTeacher?.subject || 'الرياضيات');
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">الصف والمرحلة:</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">الشعبة:</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">الحصة / الفترة:</label>
              <input
                type="number"
                min={1}
                max={7}
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Lesson Title & Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">عنوان الدرس وموضوعه الأساسي:</label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: مبرهنة ديموافر وتطبيقات القوى الصحيحة"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">صفحات الكتاب المقرر:</label>
              <input
                type="text"
                value={textbookPages}
                onChange={(e) => setTextbookPages(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Objectives */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">الأهداف السلوكية للدرس:</h4>
            
            <div className="space-y-2">
              <label className="font-bold text-blue-900">الأهداف المعرفية (Cognitive):</label>
              {cognitiveObjs.map((c, i) => (
                <input
                  key={i}
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const cp = [...cognitiveObjs];
                    cp[i] = e.target.value;
                    setCognitiveObjs(cp);
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                />
              ))}
              <button
                type="button"
                onClick={() => setCognitiveObjs([...cognitiveObjs, ''])}
                className="text-blue-600 font-bold"
              >
                + إضافة هدف معرفي
              </button>
            </div>
          </div>

          {/* Lesson Execution Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">خطوات سير الدرس والأنشطة:</h4>
            <div className="space-y-2">
              <div>
                <label className="font-bold text-slate-700">1. التهيئة والتمهيد (5 دقائق):</label>
                <textarea
                  rows={2}
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">2. العرض والشرح (25 دقيقة):</label>
                <textarea
                  rows={2}
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">3. التطبيق والممارسة (10 دقائق):</label>
                <textarea
                  rows={2}
                  value={practicalApplication}
                  onChange={(e) => setPracticalApplication(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">4. الغلق والتقويم (5 دقائق):</label>
                <textarea
                  rows={2}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Homework & Reflection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">الواجب البيتي والأنشطة الإثرائية:</label>
              <textarea
                rows={2}
                value={homeworkAndEnrichment}
                onChange={(e) => setHomeworkAndEnrichment(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">التأمل الذاتي للمعلمة:</label>
              <textarea
                rows={2}
                value={teacherReflection}
                onChange={(e) => setTeacherReflection(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              حفظ خطة الدرس
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
