/**
 * Official Exam Schedules Manager
 * نظام إدارة جداول الامتحانات الرسمية
 * ثانوية ميسان للمتميزات
 * 
 * يتيح إنشاء وتعديل وحذف واعتماد جداول الامتحانات:
 * 1. امتحانات الفصل الأول
 * 2. امتحانات نصف السنة
 * 3. امتحانات الفصل الثاني
 * 4. الامتحانات النهائية (الدور الأول)
 * 5. الامتحانات النهائية الدور الثاني
 * 
 * الصلاحية: محصورة بالسيدة المديرة وإدارة المدرسة فقط (إضافة، تعديل، حذف)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ExamSchedule,
  ExamScheduleSlot,
  ExamTermType,
  EXAM_TERM_OPTIONS,
  ALL_GRADES_LIST,
  GradeLevel,
} from '../types';
import {
  DEFAULT_EXAM_INSTRUCTIONS,
  DEFAULT_EXAM_HALLS,
} from '../data/initialExamSchedules';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  Printer,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  BookOpen,
  Share2,
  CalendarCheck,
  Check,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface OfficialExamSchedulesManagerProps {
  userRole?: 'admin' | 'teacher' | 'supervisor' | 'student' | 'parent';
  compactMode?: boolean;
}

const IRAQI_EXAM_SUBJECTS = [
  'التربية الإسلامية والقرآن الكريم',
  'اللغة العربية (شامل القواعد والأدب والبلاغة)',
  'اللغة الإنجليزية (English for Iraq - Advanced)',
  'الرياضيات المتقدمة',
  'الفيزياء للمتميزين',
  'الكيمياء المتقدمة',
  'علم الأحياء (Biology)',
  'الحاسوب والذكاء الاصطناعي',
  'اللغة الفرنسية (French)',
  'الاجتماعيات (التاريخ، الجغرافيا، والوطنية)',
  'علم الأرض (الجيولوجيا)',
];

const WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export const OfficialExamSchedulesManager: React.FC<OfficialExamSchedulesManagerProps> = ({
  userRole,
  compactMode = false,
}) => {
  const {
    examSchedules,
    addExamSchedule,
    updateExamSchedule,
    deleteExamSchedule,
    duplicateExamSchedule,
    toggleExamSchedulePublish,
    schoolAdminData,
    role,
    currentUser,
    teachers,
  } = useApp();

  // Strict RBAC check: only admin / directress can add, edit, or delete
  const canManage = role === 'admin' || currentUser?.role === 'admin' || userRole === 'admin';

  // Filters & Tabs
  const [selectedTermFilter, setSelectedTermFilter] = useState<'all' | ExamTermType>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [deleteConfirmSchedule, setDeleteConfirmSchedule] = useState<ExamSchedule | null>(null);
  const [printModalSchedule, setPrintModalSchedule] = useState<ExamSchedule | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formTermType, setFormTermType] = useState<ExamTermType>('first_term');
  const [formTitle, setFormTitle] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState('2026 - 2027');
  const [formGradeLevels, setFormGradeLevels] = useState<GradeLevel[]>([...ALL_GRADES_LIST]);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDailyStartTime, setFormDailyStartTime] = useState('08:30 صباحاً');
  const [formExamDuration, setFormExamDuration] = useState('ساعتان ونصف (3 ساعات للرياضيات والفيزياء)');
  const [formCommitteeHead, setFormCommitteeHead] = useState(
    schoolAdminData.principalName || 'المديرة الهام صبيح سعدون'
  );
  const [formCommitteeMembers, setFormCommitteeMembers] = useState<string[]>([
    'معاونة شؤون الطالبات: أ. زينب علي الموسوي',
    'مسؤولة التدقيق الامتحاني: أ. دلال محمد عبد الحسين',
    'أستاذ الرياضيات المتقدمة: أ. محمد نعمة كاظم كريدي',
    'المشرف التربوي والأكاديمي: أ.د. حيدر جاسم الكناني',
  ]);
  const [formNotes, setFormNotes] = useState(
    'جدول امتحانات رسمي معتمد من مجلس إدارة ثانوية ميسان للمتميزات وقسم الامتحانات.'
  );
  const [formSlots, setFormSlots] = useState<ExamScheduleSlot[]>([]);
  const [formInstructions, setFormInstructions] = useState<string[]>([...DEFAULT_EXAM_INSTRUCTIONS]);
  const [formIsPublished, setFormIsPublished] = useState(true);

  // New slot buffer
  const [newSlotDay, setNewSlotDay] = useState('الأحد');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('08:30 ص - 11:00 ص');
  const [newSlotSubject, setNewSlotSubject] = useState(IRAQI_EXAM_SUBJECTS[0]);
  const [newSlotGrade, setNewSlotGrade] = useState<GradeLevel | 'all'>('all');
  const [newSlotHall, setNewSlotHall] = useState(DEFAULT_EXAM_HALLS[0]);
  const [newSlotNotes, setNewSlotNotes] = useState('');
  const [newSlotProctor1, setNewSlotProctor1] = useState(teachers[0]?.name || 'أ. زينب علي الموسوي');
  const [newSlotProctor2, setNewSlotProctor2] = useState(teachers[1]?.name || 'أ. مروة سلام الدراجي');

  // New instruction buffer
  const [customInstructionInput, setCustomInstructionInput] = useState('');

  // Default selected schedule
  const activeSchedule = useMemo(() => {
    if (activeScheduleId) {
      return examSchedules.find((s) => s.id === activeScheduleId) || examSchedules[0] || null;
    }
    return examSchedules[0] || null;
  }, [activeScheduleId, examSchedules]);

  // Filtered schedules list
  const filteredSchedules = useMemo(() => {
    return examSchedules.filter((sch) => {
      // Role visibility: published schedules visible to everyone, drafts only to admin
      if (!canManage && !sch.isPublished) return false;

      // Filter by term
      if (selectedTermFilter !== 'all' && sch.termType !== selectedTermFilter) return false;

      // Filter by grade
      if (selectedGradeFilter !== 'all') {
        const matchesGrade =
          sch.gradeLevels.includes(selectedGradeFilter as GradeLevel) ||
          sch.slots.some((s) => s.gradeLevel === 'all' || s.gradeLevel === selectedGradeFilter);
        if (!matchesGrade) return false;
      }

      // Filter by search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = sch.title.toLowerCase().includes(q);
        const matchesYear = sch.academicYear.toLowerCase().includes(q);
        const matchesSubject = sch.slots.some(
          (s) =>
            s.subject.toLowerCase().includes(q) ||
            (s.notes && s.notes.toLowerCase().includes(q)) ||
            (s.hallOrRoom && s.hallOrRoom.toLowerCase().includes(q))
        );
        if (!matchesTitle && !matchesYear && !matchesSubject) return false;
      }

      return true;
    });
  }, [examSchedules, selectedTermFilter, selectedGradeFilter, searchQuery, canManage]);

  // Open Create Modal
  const handleOpenCreateModal = (termPreset?: ExamTermType) => {
    if (!canManage) {
      setPermissionNotice('عذراً، صلاحية إنشاء وتعديل وحذف جداول الامتحانات محصورة بالسيدة المديرة وإدارة المدرسة فقط.');
      return;
    }

    const term = termPreset || 'first_term';
    const termOpt = EXAM_TERM_OPTIONS.find((t) => t.type === term);

    setEditingSchedule(null);
    setFormTermType(term);
    setFormTitle(`جدول ${termOpt?.label || 'الامتحانات'} للعام الدراسي 2026 - 2027`);
    setFormAcademicYear('2026 - 2027');
    setFormGradeLevels([...ALL_GRADES_LIST]);
    setFormStartDate(term === 'first_term' ? '2026-11-22' : term === 'mid_year' ? '2027-01-20' : '2027-05-16');
    setFormEndDate(term === 'first_term' ? '2026-12-10' : term === 'mid_year' ? '2027-02-03' : '2027-06-03');
    setFormDailyStartTime('08:30 صباحاً');
    setFormExamDuration('ساعتان ونصف (3 ساعات للرياضيات والفيزياء)');
    setFormCommitteeHead(schoolAdminData.principalName || 'المديرة الهام صبيح سعدون');
    setFormNotes('جدول امتحانات رسمي معتمد من إدارة ثانوية ميسان للمتميزات.');
    setFormInstructions([...DEFAULT_EXAM_INSTRUCTIONS]);
    setFormIsPublished(true);

    // Auto-seed template slots
    generateTemplateSlots(term);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sch: ExamSchedule) => {
    if (!canManage) {
      setPermissionNotice('عذراً، صلاحية تعديل جداول الامتحانات محصورة بالسيدة المديرة وإدارة المدرسة فقط.');
      return;
    }

    setEditingSchedule(sch);
    setFormTermType(sch.termType);
    setFormTitle(sch.title);
    setFormAcademicYear(sch.academicYear);
    setFormGradeLevels([...sch.gradeLevels]);
    setFormStartDate(sch.startDate);
    setFormEndDate(sch.endDate);
    setFormDailyStartTime(sch.dailyStartTime);
    setFormExamDuration(sch.examDuration);
    setFormCommitteeHead(sch.committeeHead);
    setFormCommitteeMembers([...(sch.committeeMembers || [])]);
    setFormNotes(sch.notes || '');
    setFormInstructions([...sch.instructions]);
    setFormSlots([...sch.slots]);
    setFormIsPublished(sch.isPublished);

    setIsCreateModalOpen(true);
  };

  // Generate Template Slots
  const generateTemplateSlots = (term: ExamTermType) => {
    const datesMap: Record<ExamTermType, string[]> = {
      first_term: [
        '2026-11-22',
        '2026-11-24',
        '2026-11-26',
        '2026-11-29',
        '2026-12-01',
        '2026-12-03',
        '2026-12-06',
        '2026-12-08',
        '2026-12-10',
      ],
      mid_year: [
        '2027-01-20',
        '2027-01-21',
        '2027-01-23',
        '2027-01-25',
        '2027-01-27',
        '2027-01-28',
        '2027-01-30',
        '2027-02-01',
        '2027-02-03',
      ],
      second_term: [
        '2027-04-18',
        '2027-04-20',
        '2027-04-22',
        '2027-04-25',
        '2027-04-27',
        '2027-04-29',
        '2027-05-02',
        '2027-05-04',
        '2027-05-06',
      ],
      final_round_1: [
        '2027-05-16',
        '2027-05-18',
        '2027-05-20',
        '2027-05-23',
        '2027-05-25',
        '2027-05-27',
        '2027-05-30',
        '2027-06-01',
        '2027-06-03',
      ],
      final_round_2: [
        '2027-09-02',
        '2027-09-04',
        '2027-09-06',
        '2027-09-08',
        '2027-09-11',
        '2027-09-13',
      ],
    };

    const targetDates = datesMap[term] || datesMap.first_term;
    const daysNameList = ['الأحد', 'الثلاثاء', 'الخميس', 'الأحد', 'الثلاثاء', 'الخميس', 'الأحد', 'الثلاثاء', 'الخميس'];

    const newSlots: ExamScheduleSlot[] = targetDates.map((dateStr, idx) => {
      const subject = IRAQI_EXAM_SUBJECTS[idx] || IRAQI_EXAM_SUBJECTS[0];
      const hall = DEFAULT_EXAM_HALLS[idx % DEFAULT_EXAM_HALLS.length];
      const p1 = teachers[idx % teachers.length]?.name || 'أ. زينب علي الموسوي';
      const p2 = teachers[(idx + 1) % teachers.length]?.name || 'أ. مروة سلام الدراجي';

      return {
        id: `gen-slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        dayName: daysNameList[idx % daysNameList.length],
        date: dateStr,
        time: subject.includes('الرياضيات') || subject.includes('الفيزياء') ? '08:30 ص - 11:30 ص' : '08:30 ص - 11:00 ص',
        subject: subject,
        gradeLevel: 'all',
        hallOrRoom: hall,
        notes:
          subject.includes('الرياضيات')
            ? 'جلب الأدوات الهندسية والآلة الحاسبة غير المبرمجة لصفوف الموهوبين'
            : subject.includes('الأحياء')
            ? 'الرسوم البيولوجية بالقلم الرصاص حصراً'
            : 'الامتحان شامل لكافة مفردات المنهج المعتمد',
        proctors: [p1, p2],
      };
    });

    setFormSlots(newSlots);
  };

  // Add Slot
  const handleAddSlot = () => {
    if (!newSlotSubject.trim()) return;
    const newSlot: ExamScheduleSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dayName: newSlotDay,
      date: newSlotDate || new Date().toISOString().split('T')[0],
      time: newSlotTime,
      subject: newSlotSubject,
      gradeLevel: newSlotGrade,
      hallOrRoom: newSlotHall,
      notes: newSlotNotes.trim() || undefined,
      proctors: [newSlotProctor1, newSlotProctor2].filter(Boolean),
    };
    setFormSlots([...formSlots, newSlot]);
    setNewSlotNotes('');
  };

  // Remove Slot
  const handleRemoveSlot = (id: string) => {
    setFormSlots(formSlots.filter((s) => s.id !== id));
  };

  // Add Instruction
  const handleAddInstruction = () => {
    if (!customInstructionInput.trim()) return;
    setFormInstructions([...formInstructions, customInstructionInput.trim()]);
    setCustomInstructionInput('');
  };

  // Remove Instruction
  const handleRemoveInstruction = (idx: number) => {
    setFormInstructions(formInstructions.filter((_, i) => i !== idx));
  };

  // Save Schedule (Create or Update)
  const handleSaveSchedule = () => {
    if (!canManage) {
      setPermissionNotice('عذراً، الصلاحية محصورة بالسيدة المديرة وإدارة المدرسة.');
      return;
    }

    if (!formTitle.trim()) {
      alert('يرجى كتابة عنوان رسمي للجدول الامتحاني.');
      return;
    }

    if (formSlots.length === 0) {
      alert('يرجى إضافة مادة امتحانية واحدة على الأقل في الجدول.');
      return;
    }

    if (editingSchedule) {
      // Update
      updateExamSchedule(editingSchedule.id, {
        title: formTitle.trim(),
        termType: formTermType,
        gradeLevels: formGradeLevels,
        academicYear: formAcademicYear.trim(),
        startDate: formStartDate || (formSlots[0] ? formSlots[0].date : ''),
        endDate: formEndDate || (formSlots[formSlots.length - 1] ? formSlots[formSlots.length - 1].date : ''),
        dailyStartTime: formDailyStartTime,
        examDuration: formExamDuration,
        committeeHead: formCommitteeHead,
        committeeMembers: formCommitteeMembers,
        notes: formNotes,
        instructions: formInstructions,
        slots: formSlots,
        isPublished: formIsPublished,
        status: formIsPublished ? 'معتمد ومُعلن' : 'مسودة',
      });
      setActiveScheduleId(editingSchedule.id);
    } else {
      // Create
      const created = addExamSchedule({
        title: formTitle.trim(),
        termType: formTermType,
        gradeLevels: formGradeLevels,
        academicYear: formAcademicYear.trim(),
        startDate: formStartDate || (formSlots[0] ? formSlots[0].date : ''),
        endDate: formEndDate || (formSlots[formSlots.length - 1] ? formSlots[formSlots.length - 1].date : ''),
        dailyStartTime: formDailyStartTime,
        examDuration: formExamDuration,
        committeeHead: formCommitteeHead,
        committeeMembers: formCommitteeMembers,
        notes: formNotes,
        instructions: formInstructions,
        slots: formSlots,
        isPublished: formIsPublished,
        status: formIsPublished ? 'معتمد ومُعلن' : 'مسودة',
        createdBy: currentUser?.name || schoolAdminData.principalName || 'إدارة ثانوية ميسان للمتميزات',
        createdRole: 'principal',
      });
      setActiveScheduleId(created.id);
    }

    setIsCreateModalOpen(false);
    setEditingSchedule(null);
  };

  // Delete Action
  const handleDeleteSchedule = () => {
    if (!deleteConfirmSchedule) return;
    if (!canManage) {
      setPermissionNotice('عذراً، صلاحية الحذف محصورة بالسيدة المديرة وإدارة المدرسة فقط.');
      setDeleteConfirmSchedule(null);
      return;
    }

    deleteExamSchedule(deleteConfirmSchedule.id);
    setDeleteConfirmSchedule(null);
    if (activeScheduleId === deleteConfirmSchedule.id) {
      setActiveScheduleId(null);
    }
  };

  // Duplicate Action
  const handleDuplicate = (id: string) => {
    if (!canManage) {
      setPermissionNotice('عذراً، صلاحية استنساخ الجداول محصورة بالسيدة المديرة والإدارة المدرسية فقط.');
      return;
    }
    duplicateExamSchedule(id);
  };

  // Print Action
  const handlePrint = (sch: ExamSchedule) => {
    setPrintModalSchedule(sch);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-arabic text-slate-800 dark:text-slate-100">
      {/* 1. Header Banner & Permissions Bar */}
      <div className="bg-gradient-to-l from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-indigo-950 shadow-md shadow-amber-400/20">
                <Award className="w-3.5 h-3.5" />
                اللجنة الامتحانية المركزية
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/15">
                <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                ثانوية ميسان للمتميزات
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                العام الدراسي: 2026 - 2027
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <CalendarCheck className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <span>جداول الامتحانات الرسمية المعتمدة لكافة الصفوف</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              إدارة وتنظيم مواعيد امتحانات الفصل الأول، نصف السنة، الفصل الثاني، والامتحانات النهائية والدور الثاني
              لجميع المراحل الدراسية مع توزيع القاعات والمراقبات والضوابط الامتحانية الوزارية.
            </p>

            {/* Permission status disclaimer */}
            <div className="pt-2 flex items-center gap-2">
              {canManage ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>صلاحية إدارة كاملة: متاح للسيدة المديرة والإدارة المدرسية إضافة، تعديل، وحذف الجداول الرسمية.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>وضع العرض والاطلاع الرسمي: الصلاحية الحصرية للتعديل والحذف والإضافة محصورة بالمديرة والإدارة.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Admin Actions */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0 w-full lg:w-auto">
              <button
                onClick={() => handleOpenCreateModal()}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-indigo-950 font-black text-sm shadow-lg shadow-amber-400/25 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span>إنشاء جدول امتحانات جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Permission Notice Toast / Alert */}
      {permissionNotice && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{permissionNotice}</span>
          </div>
          <button
            onClick={() => setPermissionNotice(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Five Exam Terms Tab Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>تصنيف الفترات الامتحانية الرسمية:</span>
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            عدد الجداول المسجلة: {examSchedules.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* All */}
          <button
            onClick={() => setSelectedTermFilter('all')}
            className={`p-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
              selectedTermFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            <span>كافة الفترات</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {examSchedules.length}
            </span>
          </button>

          {/* Five specific term buttons */}
          {EXAM_TERM_OPTIONS.map((opt) => {
            const count = examSchedules.filter((s) => s.termType === opt.type).length;
            const isSelected = selectedTermFilter === opt.type;

            return (
              <button
                key={opt.type}
                onClick={() => setSelectedTermFilter(opt.type)}
                className={`p-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{opt.icon}</span>
                  <span className="truncate">{opt.shortLabel}</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal">
                  {count > 0 ? `${count} جدول معتمد` : 'غير مدخل'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Grade Level & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">تصفية الصف:</span>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كافة الصفوف والمراحل الدراسية</option>
              {ALL_GRADES_LIST.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالمادة، اسم القاعة، أو الملاحظات..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Main View: List of Schedules & Active Schedule Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedules Cards Carousel / Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>الجداول المتاحة ({filteredSchedules.length})</span>
            </h3>

            {canManage && (
              <button
                onClick={() => handleOpenCreateModal(selectedTermFilter === 'all' ? 'first_term' : selectedTermFilter)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            )}
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-500">لا توجد جداول مطابقة للتصنيف الحالي.</p>
              {canManage && (
                <button
                  onClick={() => handleOpenCreateModal(selectedTermFilter === 'all' ? 'first_term' : selectedTermFilter)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء هذا الجدول الآن</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchedules.map((sch) => {
                const termOpt = EXAM_TERM_OPTIONS.find((t) => t.type === sch.termType);
                const isSelected = activeSchedule?.id === sch.id;

                return (
                  <div
                    key={sch.id}
                    onClick={() => setActiveScheduleId(sch.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-white dark:bg-slate-850 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{termOpt?.icon || '📅'}</span>
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              termOpt?.badgeBg || 'bg-slate-100'
                            } ${termOpt?.badgeText || 'text-slate-800'} ${
                              termOpt?.badgeBorder || 'border-slate-200'
                            }`}
                          >
                            {termOpt?.label}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                            {sch.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            sch.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {sch.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {sch.slots.length} مواد
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{sch.startDate} إلى {sch.endDate}</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{sch.dailyStartTime}</span>
                      </div>
                    </div>

                    {/* Quick action buttons for admin */}
                    {canManage && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(sch);
                          }}
                          title="طباعة رسمية منسقة"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(sch.id);
                          }}
                          title="استنساخ الجدول"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(sch);
                          }}
                          title="تعديل الجدول"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmSchedule(sch);
                          }}
                          title="حذف الجدول نهائياً"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Schedule View & Timetable (8 cols) */}
        <div className="lg:col-span-8">
          {activeSchedule ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-6">
              {/* Schedule Card Top Bar */}
              <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-850 dark:via-indigo-950/20 dark:to-slate-850 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white">
                        {EXAM_TERM_OPTIONS.find((t) => t.type === activeSchedule.termType)?.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        العام الدراسي: {activeSchedule.academicYear}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                          activeSchedule.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {activeSchedule.status}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {activeSchedule.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      رئيس اللجنة الامتحانية: <strong className="text-slate-800 dark:text-slate-200">{activeSchedule.committeeHead}</strong>
                      {activeSchedule.notes && (
                        <span className="block mt-1 text-slate-600 dark:text-slate-300 italic">
                          "{activeSchedule.notes}"
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handlePrint(activeSchedule)}
                      className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>معاينة وطباعة رسمية</span>
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => toggleExamSchedulePublish(activeSchedule.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            activeSchedule.isPublished
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {activeSchedule.isPublished ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>تحويل لمسودة خاصة</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>اعتماد ونشر للطلبة</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(activeSchedule)}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmSchedule(activeSchedule)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-all"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* KPI Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">فترة الامتحانات</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                        {activeSchedule.startDate}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">وقت البدء اليومي</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                        {activeSchedule.dailyStartTime}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">عدد الجلسات والمواد</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                        {activeSchedule.slots.length} مادة دراسية
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">المراحل المشمولة</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {activeSchedule.gradeLevels.length === ALL_GRADES_LIST.length
                          ? 'كافة الصفوف (المتوسطة والإعدادية)'
                          : `${activeSchedule.gradeLevels.length} صفوف`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day-by-Day Exam Table */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    <span>جدول المواد والتواريخ والقاعات الامتحانية:</span>
                  </h4>

                  <span className="text-xs text-slate-500">
                    يبدأ الامتحان الساعة 08:30 صباحاً
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">اليوم والتاريخ</th>
                        <th className="p-3.5">الوقت والمدة</th>
                        <th className="p-3.5">المادة الدراسية</th>
                        <th className="p-3.5">المرحلة المشمولة</th>
                        <th className="p-3.5">القاعة الامتحانية</th>
                        <th className="p-3.5">المراقبات والمشرفون</th>
                        <th className="p-3.5">التنبيهات والملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeSchedule.slots.map((slot, idx) => {
                        const isMathOrPhysics =
                          slot.subject.includes('الرياضيات') || slot.subject.includes('الفيزياء');

                        return (
                          <tr
                            key={slot.id}
                            className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${
                              isMathOrPhysics ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="p-3.5 font-bold font-mono text-slate-400">
                              {idx + 1}
                            </td>

                            <td className="p-3.5">
                              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="text-indigo-600 font-bold">{slot.dayName}</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                                {slot.date}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                                {slot.time}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-black text-indigo-950 dark:text-indigo-300 text-xs sm:text-sm block">
                                {slot.subject}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {slot.gradeLevel === 'all' ? 'كافة الصفوف' : slot.gradeLevel}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{slot.hallOrRoom || 'القاعة المركزية'}</span>
                              </span>
                            </td>

                            <td className="p-3.5">
                              {slot.proctors && slot.proctors.length > 0 ? (
                                <div className="space-y-0.5">
                                  {slot.proctors.map((proc, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="block text-[11px] text-slate-600 dark:text-slate-300 font-bold"
                                    >
                                      • {proc}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">اللجنة الامتحانية</span>
                              )}
                            </td>

                            <td className="p-3.5 max-w-xs">
                              {slot.notes ? (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block">
                                  {slot.notes}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Official Instructions Card */}
                {activeSchedule.instructions && activeSchedule.instructions.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-3 mt-6">
                    <h5 className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>الضوابط والتعليمات الامتحانية الرسمية الواجب اتباعها بدقة:</span>
                    </h5>

                    <ol className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200 list-decimal list-inside leading-relaxed">
                      {activeSchedule.instructions.map((inst, iIdx) => (
                        <li key={iIdx} className="font-medium">
                          {inst}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Committee Signatures & Official Stamp */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 mt-6">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      مسؤولة الكنترول والتدقيق
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      أ. دلال محمد عبد الحسين
                    </span>
                    <span className="text-[10px] text-slate-500">لجنة فحص الدفاتر الامتحانية</span>
                  </div>

                  <div className="text-center p-3 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 px-6">
                    <span className="text-[10px] font-black text-indigo-600 block uppercase tracking-wider">
                      ختم اللجنة الامتحانية المركزية
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mt-1">
                      ثانوية ميسان للمتميزات
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold block mt-0.5">
                      ✓ معتمد رسمياً
                    </span>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      رئيس اللجنة الامتحانية / مديرة المدرسة
                    </span>
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-300 block">
                      {activeSchedule.committeeHead}
                    </span>
                    <span className="text-[10px] text-slate-500">مصادق عليه وفق القرارات الوزارية</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-700 dark:text-slate-300">
                يرجى اختيار جدول امتحانات من القائمة لمعاينته
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                يمكنك التبديل بين فترات الفصل الأول، نصف السنة، الفصل الثاني، الامتحانات النهائية والدور الثاني.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE / EDIT EXAM SCHEDULE (ADMIN / PRINCIPAL ONLY)
          ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn font-arabic">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-indigo-950 rounded-xl shadow-md">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingSchedule ? 'تعديل جدول امتحانات رسمي' : 'إنشاء جدول امتحانات رسمي جديد'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    صلاحية السيدة المديرة وإدارة ثانوية ميسان للمتميزات
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Step A: Basic Metadata */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>1. البيانات الأساسية والفترة الامتحانية</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      نوع الامتحان / الفترة الامتحانية <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTermType}
                      onChange={(e) => {
                        const newTerm = e.target.value as ExamTermType;
                        setFormTermType(newTerm);
                        const opt = EXAM_TERM_OPTIONS.find((t) => t.type === newTerm);
                        if (!editingSchedule) {
                          setFormTitle(`جدول ${opt?.label || ''} للعام الدراسي ${formAcademicYear}`);
                          generateTemplateSlots(newTerm);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {EXAM_TERM_OPTIONS.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      العام الدراسي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      placeholder="مثلاً: 2026 - 2027"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      وقت بدء الامتحان اليومي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formDailyStartTime}
                      onChange={(e) => setFormDailyStartTime(e.target.value)}
                      placeholder="08:30 صباحاً"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      عنوان الجدول الرسمي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="مثال: جدول امتحانات نصف السنة للعام الدراسي 2026 - 2027"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      رئيس اللجنة الامتحانية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCommitteeHead}
                      onChange={(e) => setFormCommitteeHead(e.target.value)}
                      placeholder="المديرة الهام صبيح سعدون"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Grade levels inclusion */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    الصفوف المشمولة بهذا الجدول الامتحاني:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormGradeLevels([...ALL_GRADES_LIST])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        formGradeLevels.length === ALL_GRADES_LIST.length
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      كافة الصفوف (المتوسطة والإعدادية)
                    </button>

                    {ALL_GRADES_LIST.map((grade) => {
                      const isIncluded = formGradeLevels.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            if (isIncluded) {
                              setFormGradeLevels(formGradeLevels.filter((g) => g !== grade));
                            } else {
                              setFormGradeLevels([...formGradeLevels, grade]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isIncluded
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step B: Slots / Subjects Table */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CalendarCheck className="w-4 h-4" />
                    <span>2. جلسات ومواد الامتحان ({formSlots.length} مادة)</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => generateTemplateSlots(formTermType)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>إعادة توليد مواد المنهاج تلقائياً</span>
                  </button>
                </div>

                {/* Slots Table */}
                {formSlots.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">اليوم والتاريخ</th>
                          <th className="p-2.5">المادة</th>
                          <th className="p-2.5">التوقيت</th>
                          <th className="p-2.5">القاعة</th>
                          <th className="p-2.5">المراقبات</th>
                          <th className="p-2.5 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {formSlots.map((slot, idx) => (
                          <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">
                              <span className="font-bold text-indigo-600">{slot.dayName}</span>
                              <span className="text-[11px] font-mono text-slate-400 block">{slot.date}</span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100">
                              {slot.subject}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                              {slot.time}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-300">
                              {slot.hallOrRoom || 'القاعة المركزية'}
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                              {slot.proctors?.join('، ') || '-'}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(slot.id)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500 font-bold">
                    لا توجد مواد مضافة في هذا الجدول بعد.
                  </div>
                )}

                {/* Add a Slot Sub-form */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    + إضافة مادة امتحانية جديدة للجدول:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        اليوم
                      </label>
                      <select
                        value={newSlotDay}
                        onChange={(e) => setNewSlotDay(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {WEEK_DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        التاريخ (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        المادة الدراسية
                      </label>
                      <select
                        value={newSlotSubject}
                        onChange={(e) => setNewSlotSubject(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {IRAQI_EXAM_SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        وقت الامتحان
                      </label>
                      <input
                        type="text"
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        placeholder="08:30 ص - 11:00 ص"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        القاعة الامتحانية
                      </label>
                      <select
                        value={newSlotHall}
                        onChange={(e) => setNewSlotHall(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {DEFAULT_EXAM_HALLS.map((hall) => (
                          <option key={hall} value={hall}>
                            {hall}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        المراقبة الأولى
                      </label>
                      <select
                        value={newSlotProctor1}
                        onChange={(e) => setNewSlotProctor1(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.specialization || t.subject})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        المراقبة الثانية
                      </label>
                      <select
                        value={newSlotProctor2}
                        onChange={(e) => setNewSlotProctor2(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.specialization || t.subject})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إدراج المادة بالجدول</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step C: Official Instructions List */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>3. التعليمات والضوابط الامتحانية الرسمية للطالبات</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => setFormInstructions([...DEFAULT_EXAM_INSTRUCTIONS])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    استعادة التعليمات الوزارية الافتراضية
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formInstructions.map((inst, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {iIdx + 1}. {inst}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(iIdx)}
                        className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customInstructionInput}
                    onChange={(e) => setCustomInstructionInput(e.target.value)}
                    placeholder="إضافة تعليمات أو ملاحظة انضباطية جديدة..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInstruction();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold flex-shrink-0"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Step D: Publication Switch */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                    اعتماد ونشر الجدول فورياً للطالبات وأولياء الأمور
                  </span>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    عند التفعيل، سيظهر الجدول لجميع طالبات ومعلمات المدرسة مع إرسال إشعار فوري.
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                الصلاحية: مديرة المدرسة ولجنة الكنترول المركزي
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSchedule ? 'حفظ التعديلات' : 'اعتماد وإنشاء الجدول'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: DELETE CONFIRMATION (ADMIN / PRINCIPAL ONLY)
          ───────────────────────────────────────────────────────────── */}
      {deleteConfirmSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="p-3 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تأكيد الحذف النهائي للجدول الامتحاني
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                هل أنتِ متأكدة من حذف جدول (<strong>{deleteConfirmSchedule.title}</strong>)؟
                سيتم حذف كافة المواد ومواعيد القاعات المرتبطة به نهائياً من سجلات المدرسة.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>هذا الإجراء مسجل في سجل التدقيق الأمني الخاص بإدارة المدرسة.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSchedule(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteSchedule}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-black shadow-md shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: OFFICIAL PRINT & EXPORT VIEW (MINISTRY LETTERHEAD)
          ───────────────────────────────────────────────────────────── */}
      {printModalSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn font-arabic">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Controls Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black">معاينة الطباعة الرسمية للجدول الامتحاني</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerBrowserPrint}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-indigo-950 font-black text-xs hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الآن (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => setPrintModalSchedule(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content with Official Iraqi Ministry Header */}
            <div className="p-8 sm:p-12 overflow-y-auto flex-1 space-y-6 bg-white text-slate-950">
              {/* Ministry Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4 text-center">
                <div className="text-right space-y-0.5 text-xs font-bold">
                  <p>جمهورية العراق</p>
                  <p>وزارة التربية</p>
                  <p>المديرية العامة لتربية محافظة ميسان</p>
                  <p>قسم شؤون الامتحانات والتقويم التربوي</p>
                </div>

                <div className="space-y-1">
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center p-1 font-black text-xs">
                    شعار الوزارة
                  </div>
                  <h3 className="text-sm font-black text-slate-900">
                    ثانوية ميسان للمتميزات
                  </h3>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    اللجنة الامتحانية المركزية
                  </span>
                </div>

                <div className="text-left space-y-0.5 text-xs font-bold font-mono">
                  <p>العام: {printModalSchedule.academicYear}</p>
                  <p>الرقم: م.ت / {printModalSchedule.id.substring(0, 8)}</p>
                  <p>التاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 py-2">
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  {printModalSchedule.title}
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  يبدأ الامتحان في تمام الساعة ({printModalSchedule.dailyStartTime}) صباحاً لكافة القاعات الامتحانية
                </p>
              </div>

              {/* Table */}
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-900">
                    <tr>
                      <th className="p-2.5 border-l border-slate-900 text-center w-10">ت</th>
                      <th className="p-2.5 border-l border-slate-900">اليوم والتاريخ</th>
                      <th className="p-2.5 border-l border-slate-900">وقت الامتحان</th>
                      <th className="p-2.5 border-l border-slate-900">المادة الدراسية</th>
                      <th className="p-2.5 border-l border-slate-900">المرحلة المشمولة</th>
                      <th className="p-2.5 border-l border-slate-900">القاعة الامتحانية</th>
                      <th className="p-2.5">الملاحظات والتوجيهات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {printModalSchedule.slots.map((slot, idx) => (
                      <tr key={slot.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-2.5 border-l border-slate-300 text-center font-bold font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border-l border-slate-300 font-bold">
                          {slot.dayName} <span className="font-mono font-normal">({slot.date})</span>
                        </td>
                        <td className="p-2.5 border-l border-slate-300 font-mono font-bold">
                          {slot.time}
                        </td>
                        <td className="p-2.5 border-l border-slate-300 font-black text-sm">
                          {slot.subject}
                        </td>
                        <td className="p-2.5 border-l border-slate-300 font-medium">
                          {slot.gradeLevel === 'all' ? 'كافة الصفوف' : slot.gradeLevel}
                        </td>
                        <td className="p-2.5 border-l border-slate-300 font-medium">
                          {slot.hallOrRoom || 'القاعة المركزية'}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-700">
                          {slot.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              {printModalSchedule.instructions && printModalSchedule.instructions.length > 0 && (
                <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 space-y-1.5 text-xs text-slate-800">
                  <span className="font-black block text-slate-950 mb-1">
                    تنبيهات وضوابط انضباطية هامة:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    {printModalSchedule.instructions.slice(0, 6).map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 flex items-center justify-between text-center font-bold text-xs">
                <div className="space-y-1">
                  <p>مدقق الكنترول المركزي</p>
                  <p className="font-black pt-4">أ. دلال محمد عبد الحسين</p>
                </div>

                <div className="p-3 border-2 border-dashed border-slate-400 rounded-full w-24 h-24 flex items-center justify-center text-[10px] text-slate-500 font-black">
                  ختم الإدارة المدرسية
                </div>

                <div className="space-y-1">
                  <p>رئيس اللجنة الامتحانية / مديرة المدرسة</p>
                  <p className="font-black pt-4">{printModalSchedule.committeeHead}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
