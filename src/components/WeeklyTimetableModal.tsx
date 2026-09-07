import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  X,
  Edit3,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Save,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Building2,
  Filter,
  RefreshCw,
  Info,
  ShieldCheck,
  Lock,
  Download,
  ListChecks,
  AlertCircle,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crown,
  School,
  FileCheck2,
  RotateCcw,
  Check,
  Layers,
  FileSpreadsheet,
  FileCheck,
  ListOrdered,
  Grid3X3,
  Coffee,
  CheckCheck,
  Calendar,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TimetableSlot, GradeLevel, GradeSubjectQuota, ALL_GRADES_LIST, OFFICIAL_SUBJECTS_LIST } from '../types';
import { INITIAL_SUBJECT_QUOTAS } from '../data/initialData';
import { downloadElementAsPdf, downloadMultiElementsAsPdf } from '../utils/pdfExporter';
import {
  generateSmartTimetable,
  getTeacherAvailableDays,
  normalizeTeacherName,
  isSameTeacher,
  auditSchoolTimetableConflicts,
  resolveAllTimetableConflicts,
  getTeacherWeeklySchedule,
  getTeacherChronologicalAgenda,
  getActiveGradeSectionsWithStudents,
  hasEnrolledStudents,
  filterEmptySectionSlots,
} from '../utils/timetableGenerator';

interface WeeklyTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'timetable' | 'teacher_schedules' | 'quotas';
  initialTeacherName?: string;
  initialGrade?: GradeLevel;
  initialSection?: string;
  isStaff?: boolean;
}

export const WEEKDAY_LIST = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
] as const;

export const PERIODS_TIMING = [
  { period: 1 as const, timeSlot: '08:00 - 08:45', label: 'الحصة الأولى' },
  { period: 2 as const, timeSlot: '08:50 - 09:35', label: 'الحصة الثانية' },
  { period: 3 as const, timeSlot: '09:40 - 10:25', label: 'الحصة الثالثة' },
  { period: 4 as const, timeSlot: '10:30 - 11:15', label: 'الحصة الرابعة' },
  { period: 5 as const, timeSlot: '11:20 - 12:05', label: 'الحصة الخامسة' },
  { period: 6 as const, timeSlot: '12:10 - 12:55', label: 'الحصة السادسة' },
  { period: 7 as const, timeSlot: '13:00 - 13:45', label: 'الحصة السابعة' },
];

export const WeeklyTimetableModal: React.FC<WeeklyTimetableModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  initialTeacherName,
  initialGrade,
  initialSection,
}) => {
  const {
    timetable,
    teachers,
    students,
    updateTeacher,
    updateTimetableSlot,
    addTimetableSlot,
    deleteTimetableSlot,
    saveFullTimetable,
    subjectQuotas,
    addSubjectQuota,
    updateSubjectQuota,
    deleteSubjectQuota,
    saveSubjectQuotas,
    schoolAdminData,
    updateSchoolAdminData,
    role,
  } = useApp();

  const canEdit = role === 'admin' || (role as string) === 'principal' || (role as string) === 'school_admin';

  const [activeTab, setActiveTab] = useState<'timetable' | 'teacher_schedules' | 'quotas'>(
    initialTab || 'timetable'
  );
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    initialGrade || 'الصف السادس العلمي'
  );

  // Academic Year State & Persistence
  const [academicYear, setAcademicYear] = useState<string>(
    () => schoolAdminData.academicYearDefault || '2026 - 2027'
  );
  const [tempAcademicYear, setTempAcademicYear] = useState<string>(academicYear);

  // Active enrolled sections for the currently selected grade
  const enrolledSectionsForSelectedGrade = useMemo(() => {
    const secs = Array.from(
      new Set(
        students
          .filter((s) => s.gradeLevel === selectedGrade)
          .map((s) => s.section || 'أ')
      )
    ).sort();
    return secs.length > 0 ? secs : ['أ'];
  }, [students, selectedGrade]);

  const [selectedSection, setSelectedSection] = useState<string>(() => {
    if (initialSection) return initialSection;
    return 'أ';
  });

  // Keep selectedSection aligned with enrolled sections
  useEffect(() => {
    if (selectedSection !== 'الكل' && !enrolledSectionsForSelectedGrade.includes(selectedSection)) {
      setSelectedSection(enrolledSectionsForSelectedGrade[0] || 'أ');
    }
  }, [selectedGrade, enrolledSectionsForSelectedGrade, selectedSection]);

  const studentsCountInCurrentSection = useMemo(() => {
    if (selectedSection === 'الكل') {
      return students.filter((s) => s.gradeLevel === selectedGrade).length;
    }
    return students.filter(
      (s) => s.gradeLevel === selectedGrade && (s.section === selectedSection || (!s.section && selectedSection === 'أ'))
    ).length;
  }, [students, selectedGrade, selectedSection]);

  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState<string>(
    initialTeacherName || teachers[0]?.name || 'م. عمر خالد السعد'
  );
  const [teacherScheduleViewMode, setTeacherScheduleViewMode] = useState<'agenda' | 'matrix'>('agenda');

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialTeacherName) setSelectedTeacherForSchedule(initialTeacherName);
      if (initialGrade) setSelectedGrade(initialGrade);
      if (initialSection) setSelectedSection(initialSection);
    }
  }, [isOpen, initialTab, initialTeacherName, initialGrade, initialSection]);

  // Timetable Signature & Approval Customization State
  const [supervisorName, setSupervisorName] = useState<string>(
    () => schoolAdminData.timetableSupervisorName || 'مسؤول إعداد الجدول المدرسي'
  );
  const [principalName, setPrincipalName] = useState<string>(
    () =>
      schoolAdminData.principalNameOnTimetable ||
      schoolAdminData.principalBadge ||
      schoolAdminData.principalName ||
      'أ.د. الهام صبيح سعدون'
  );
  const [showSignaturesEditor, setShowSignaturesEditor] = useState<boolean>(false);
  const [tempSupervisorName, setTempSupervisorName] = useState<string>(supervisorName);
  const [tempPrincipalName, setTempPrincipalName] = useState<string>(principalName);

  // Body scroll lock effect when modal or previews are open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Sync state if schoolAdminData changes externally
  useEffect(() => {
    if (schoolAdminData.academicYearDefault) {
      setAcademicYear(schoolAdminData.academicYearDefault);
      setTempAcademicYear(schoolAdminData.academicYearDefault);
    }
    if (schoolAdminData.timetableSupervisorName) {
      setSupervisorName(schoolAdminData.timetableSupervisorName);
      setTempSupervisorName(schoolAdminData.timetableSupervisorName);
    }
    if (schoolAdminData.principalNameOnTimetable || schoolAdminData.principalBadge || schoolAdminData.principalName) {
      const p = schoolAdminData.principalNameOnTimetable || schoolAdminData.principalBadge || schoolAdminData.principalName || 'أ.د. الهام صبيح سعدون';
      setPrincipalName(p);
      setTempPrincipalName(p);
    }
  }, [schoolAdminData, isOpen]);

  const [showConflictsModal, setShowConflictsModal] = useState<boolean>(false);
  const [activeEditingSlot, setActiveEditingSlot] = useState<TimetableSlot | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingTeacherPdf, setIsExportingTeacherPdf] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isTeacherPreviewOpen, setIsTeacherPreviewOpen] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [teacherPreviewZoom, setTeacherPreviewZoom] = useState<number>(85);
  const [previewPageTab, setPreviewPageTab] = useState<'all' | 'page1' | 'page2'>('all');

  // Edit Timetable Slot Form State
  const [editDay, setEditDay] = useState<typeof WEEKDAY_LIST[number]>('الأحد');
  const [editPeriod, setEditPeriod] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [editSubject, setEditSubject] = useState<string>('الرياضيات');
  const [editTeacher, setEditTeacher] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('قاعة المتميزات 1');

  // Edit Subject Quota Form State
  const [activeEditingQuota, setActiveEditingQuota] = useState<GradeSubjectQuota | null>(null);
  const [showQuotaForm, setShowQuotaForm] = useState<boolean>(false);
  const [quotaSubjectName, setQuotaSubjectName] = useState<string>('الرياضيات والتفاضل');
  const [quotaWeeklyPeriods, setQuotaWeeklyPeriods] = useState<number>(5);
  const [quotaTeacherName, setQuotaTeacherName] = useState<string>('');
  const [quotaClassroom, setQuotaClassroom] = useState<string>('قاعة المتميزات 1');

  // Filter subject quotas for selected grade
  const currentGradeQuotas = useMemo(
    () => subjectQuotas.filter((q) => q.gradeLevel === selectedGrade),
    [subjectQuotas, selectedGrade]
  );

  const totalWeeklyPeriodsForGrade = useMemo(
    () => currentGradeQuotas.reduce((sum, q) => sum + (Number(q.weeklyPeriods) || 0), 0),
    [currentGradeQuotas]
  );

  const allTeachersList = useMemo(() => {
    const list = teachers.map((t) => t.name).filter(Boolean);
    return list.length > 0 ? list : ['م. عمر خالد السعد', 'د. رنا عبد الحسين العبيدي'];
  }, [teachers]);

  if (!isOpen) return null;

  // Filter slots for selected grade & section
  const currentSlots = timetable.filter(
    (slot) =>
      slot.gradeLevel === selectedGrade &&
      (!slot.section || slot.section === selectedSection || selectedSection === 'الكل')
  );

  // Full school live conflict audit
  const schoolAudit = auditSchoolTimetableConflicts(timetable, subjectQuotas, teachers);

  const getSlot = (day: string, period: number) => {
    return currentSlots.find((s) => s.day === day && s.period === period);
  };

  const getScheduledCountForSubject = (subjName: string) => {
    return currentSlots.filter((s) => s.subject === subjName).length;
  };

  const handleOpenEditSlot = (day: typeof WEEKDAY_LIST[number], period: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    if (!canEdit) {
      setShowSuccessToast('🔒 التعديل متاح حصراً لمديرة المدرسة وإدارتها');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    const existing = getSlot(day, period);
    setEditDay(day);
    setEditPeriod(period);

    if (existing) {
      setActiveEditingSlot(existing);
      setEditSubject(existing.subject || 'الرياضيات');
      setEditTeacher(existing.teacherName || (teachers[0]?.name || ''));
      setEditRoom(existing.room || 'قاعة 1');
    } else {
      setActiveEditingSlot(null);
      setEditSubject('الرياضيات');
      setEditTeacher(teachers[0]?.name || 'أستاذة المادة');
      setEditRoom('قاعة 1');
    }
  };

  const handleSaveSlotForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const periodTimingObj = PERIODS_TIMING.find((p) => p.period === editPeriod);
    const timeSlotStr = periodTimingObj ? periodTimingObj.timeSlot : '08:00 - 08:45';

    if (activeEditingSlot) {
      updateTimetableSlot(activeEditingSlot.id, {
        day: editDay,
        period: editPeriod,
        timeSlot: timeSlotStr,
        gradeLevel: selectedGrade,
        section: selectedSection === 'الكل' ? 'أ' : selectedSection,
        subject: editSubject,
        teacherName: editTeacher,
        room: editRoom,
      });
      setShowSuccessToast('تم تحديث الحصة الدراسية بنجاح ⚡');
    } else {
      addTimetableSlot({
        day: editDay,
        period: editPeriod,
        timeSlot: timeSlotStr,
        gradeLevel: selectedGrade,
        section: selectedSection === 'الكل' ? 'أ' : selectedSection,
        subject: editSubject,
        teacherName: editTeacher,
        room: editRoom,
      });
      setShowSuccessToast('تم إضافة الحصة الدراسية إلى الجدول بنجاح ✨');
    }

    setActiveEditingSlot(null);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const handleDeleteSlot = (id: string) => {
    if (!canEdit) return;
    deleteTimetableSlot(id);
    setActiveEditingSlot(null);
    setShowSuccessToast('تم حذف الحصة الدراسية من الجدول');
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Quotas Form Actions
  const handleOpenAddQuota = () => {
    setActiveEditingQuota(null);
    setQuotaSubjectName('الرياضيات والتفاضل');
    setQuotaWeeklyPeriods(5);
    setQuotaTeacherName(teachers[0]?.name || 'مدرس المادة المعين');
    setQuotaClassroom('قاعة المتميزات 1');
    setShowQuotaForm(true);
  };

  const handleOpenEditQuota = (quota: GradeSubjectQuota) => {
    setActiveEditingQuota(quota);
    setQuotaSubjectName(quota.subjectName);
    setQuotaWeeklyPeriods(quota.weeklyPeriods);
    setQuotaTeacherName(quota.teacherName);
    setQuotaClassroom(quota.classroom || 'قاعة المتميزات 1');
    setShowQuotaForm(true);
  };

  const handleSaveQuotaForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (activeEditingQuota) {
      updateSubjectQuota(activeEditingQuota.id, {
        gradeLevel: selectedGrade,
        subjectName: quotaSubjectName,
        weeklyPeriods: Number(quotaWeeklyPeriods),
        teacherName: quotaTeacherName,
        classroom: quotaClassroom,
      });
      setShowSuccessToast('تم تحديث حصص المادة ومدرستها بنجاح ✨');
    } else {
      addSubjectQuota({
        gradeLevel: selectedGrade,
        subjectName: quotaSubjectName,
        weeklyPeriods: Number(quotaWeeklyPeriods),
        teacherName: quotaTeacherName,
        classroom: quotaClassroom,
      });
      setShowSuccessToast('تم إضافة خطة المادة والحصص بنجاح 🌟');
    }

    setShowQuotaForm(false);
    setActiveEditingQuota(null);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const handleDeleteQuota = (id: string) => {
    if (!canEdit) return;
    deleteSubjectQuota(id);
    setShowQuotaForm(false);
    setActiveEditingQuota(null);
    setShowSuccessToast('تم حذف المادة من خطة الحصص');
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Auto-generate smart weekly schedule for selected grade and section
  const handleAutoGenerateFromQuotas = () => {
    if (!canEdit) {
      setShowSuccessToast('🔒 الصلاحية محصورة بالمديرة والإدارة لتوليد وإعادة ضبط الجدول');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    if (currentGradeQuotas.length === 0) {
      setShowSuccessToast('⚠️ لم يتم تحديد خطة المواد والحصص لهذا الصف بعد!');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    const result = generateSmartTimetable(selectedGrade, selectedSection, subjectQuotas, timetable, teachers, students);
    if (result.success) {
      saveFullTimetable(result.slots);
      setShowSuccessToast(result.message);
    } else {
      setShowSuccessToast(result.message);
    }
    setTimeout(() => setShowSuccessToast(null), 4500);
  };

  // Auto-generate Master School-wide Timetable across ALL grades and sections with 0 teacher conflicts
  const handleAutoGenerateSchoolMaster = () => {
    if (!canEdit) {
      setShowSuccessToast('🔒 الصلاحية محصورة بالمديرة والإدارة لتوليد الجدول الشامل');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    const result = generateSmartTimetable('ALL', 'ALL', subjectQuotas, timetable, teachers, students);
    if (result.success) {
      saveFullTimetable(result.slots);
      setShowSuccessToast(result.message);
    } else {
      setShowSuccessToast(result.message);
    }
    setTimeout(() => setShowSuccessToast(null), 5000);
  };

  // 1-Click Master Conflict Resolver
  const handleResolveConflicts = () => {
    if (!canEdit) {
      setShowSuccessToast('🔒 الصلاحية محصورة بالمديرة والإدارة لتعديل وإصلاح الجدول');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }
    const res = resolveAllTimetableConflicts(timetable, subjectQuotas, teachers);
    saveFullTimetable(res.resolvedTimetable);
    setShowSuccessToast(res.message);
    setTimeout(() => setShowSuccessToast(null), 5000);
  };

  const handleOpenSignaturesEditor = () => {
    if (!canEdit) {
      setShowSuccessToast('🔒 تعديل التوقيعات والعام الدراسي محصور بحساب المديرة والإدارة فقط');
      setTimeout(() => setShowSuccessToast(null), 3500);
      return;
    }
    setTempAcademicYear(academicYear);
    setTempSupervisorName(supervisorName);
    setTempPrincipalName(principalName);
    setShowSignaturesEditor(true);
  };

  const handleSaveAcademicYear = (newYear: string) => {
    if (!canEdit) {
      setShowSuccessToast('🔒 تعديل العام الدراسي محصور بحساب المديرة والإدارة فقط');
      setTimeout(() => setShowSuccessToast(null), 3500);
      return;
    }
    const finalYear = newYear.trim() || '2026 - 2027';
    setAcademicYear(finalYear);
    setTempAcademicYear(finalYear);
    updateSchoolAdminData({
      academicYearDefault: finalYear,
    });
    setShowSuccessToast(`تم تحديث واعتماد العام الدراسي (${finalYear}) بنجاح ✓`);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

  const handleSaveSignatures = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEdit) {
      setShowSignaturesEditor(false);
      setShowSuccessToast('🔒 غير مصرح: تعديل التوقيعات محصور بحساب المديرة والإدارة فقط');
      setTimeout(() => setShowSuccessToast(null), 3500);
      return;
    }
    const finalYear = tempAcademicYear.trim() || '2026 - 2027';
    const finalSup = tempSupervisorName.trim() || 'مسؤول إعداد الجدول المدرسي';
    const finalPrinc = tempPrincipalName.trim() || 'أ.د. الهام صبيح سعدون';
    setAcademicYear(finalYear);
    setSupervisorName(finalSup);
    setPrincipalName(finalPrinc);
    updateSchoolAdminData({
      academicYearDefault: finalYear,
      timetableSupervisorName: finalSup,
      principalNameOnTimetable: finalPrinc,
    });
    setShowSignaturesEditor(false);
    setShowSuccessToast('تم حفظ واعتماد العام الدراسي وأسماء التوقيع لجدول الدروس بنجاح ✓');
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  const handleResetSignatures = () => {
    if (!canEdit) return;
    const defaultYear = '2026 - 2027';
    const defaultSup = 'مسؤول إعداد الجدول المدرسي';
    const defaultPrinc = 'أ.د. الهام صبيح سعدون';
    setTempAcademicYear(defaultYear);
    setTempSupervisorName(defaultSup);
    setTempPrincipalName(defaultPrinc);
    setAcademicYear(defaultYear);
    setSupervisorName(defaultSup);
    setPrincipalName(defaultPrinc);
    updateSchoolAdminData({
      academicYearDefault: defaultYear,
      timetableSupervisorName: defaultSup,
      principalNameOnTimetable: defaultPrinc,
    });
    setShowSuccessToast('تمت استعادة الإعدادات والعام الدراسي الافتراضي بنجاح ✓');
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Restore Official Ministerial Standard Quotas for Selected Grade Level
  const handleRestoreMinisterialQuotas = () => {
    if (!canEdit) {
      setShowSuccessToast('🔒 الصلاحية محصورة بالمديرة والإدارة لتعديل الخطة والأنصبة');
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }
    const standardForGrade = INITIAL_SUBJECT_QUOTAS.filter((q) => q.gradeLevel === selectedGrade);
    if (standardForGrade.length === 0) {
      setShowSuccessToast(`⚠️ لا توجد خطة وزارية افتراضية مسجلة لـ ${selectedGrade}`);
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    const otherGradeQuotas = subjectQuotas.filter((q) => q.gradeLevel !== selectedGrade);
    const regeneratedQuotas = standardForGrade.map((q) => ({
      ...q,
      id: `quota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    }));

    saveSubjectQuotas([...otherGradeQuotas, ...regeneratedQuotas]);
    setShowSuccessToast(`تمت استعادة وتطبيق الخطة الوزارية المعتمدة للأنصبة (${selectedGrade}) بنجاح 🏛️✓`);
    setTimeout(() => setShowSuccessToast(null), 4500);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const page1El = document.getElementById('timetable-pdf-page-1');
      const page2El = document.getElementById('timetable-pdf-page-2');

      const cleanGradeName = selectedGrade.replace(/\s+/g, '_');
      const cleanYearStr = academicYear.replace(/\s+/g, '').replace(/[-/]/g, '_');
      const fileNameStr = `وثيقة_جدول_الدروس_والانصبة_الاسبوعية_${cleanGradeName}_شعبة_${selectedSection}_${cleanYearStr}.pdf`;

      if (page1El && page2El) {
        const success = await downloadMultiElementsAsPdf([page1El, page2El], {
          fileName: fileNameStr,
          orientation: 'landscape',
          format: 'a4',
          scale: 2.2,
          quality: 0.98,
          marginMm: 4,
          fitToPage: true,
        });

        if (success) {
          setShowSuccessToast('تم تنزيل الوثيقة كملف PDF رسمي مكون من صفحتين (صفحة 1: جدول الدروس + صفحة 2: توزيع المواد والأنصبة) وحفظه بنجاح 📥✓');
        } else {
          window.print();
        }
      } else if (page1El) {
        const success = await downloadElementAsPdf(page1El, {
          fileName: fileNameStr,
          orientation: 'landscape',
          scale: 2.2,
          marginMm: 4,
          fitToPage: true,
        });
        if (success) {
          setShowSuccessToast('تم تنزيل جدول الدروس كملف PDF بنجاح 📥');
        } else {
          window.print();
        }
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setShowSuccessToast(null), 5000);
    }
  };

  const handleDownloadTeacherPdf = async () => {
    setIsExportingTeacherPdf(true);
    try {
      const teacherDocEl = document.getElementById('teacher-timetable-pdf-doc');
      const cleanTeacherName = (selectedTeacherForSchedule || 'الأستاذ').replace(/\s+/g, '_');
      const cleanYearStr = academicYear.replace(/\s+/g, '').replace(/[-/]/g, '_');
      const fileNameStr = `جدول_الحصص_الاسبوعي_الموحد_للاستاذ_${cleanTeacherName}_${cleanYearStr}.pdf`;

      if (teacherDocEl) {
        const success = await downloadElementAsPdf(teacherDocEl, {
          fileName: fileNameStr,
          orientation: 'landscape',
          format: 'a4',
          scale: 2.2,
          quality: 0.98,
          marginMm: 4,
          fitToPage: true,
        });

        if (success) {
          setShowSuccessToast(`تم تنزيل مصفوفة جدول الحصص الأسبوعي للأستاذ (${selectedTeacherForSchedule}) كملف PDF رسمي بنجاح 📥✓`);
        } else {
          window.print();
        }
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Teacher PDF export error:', err);
      window.print();
    } finally {
      setIsExportingTeacherPdf(false);
      setTimeout(() => setShowSuccessToast(null), 5000);
    }
  };

  /* Helper: Official Ministry & School Header */
  const renderOfficialHeader = (title: string, subtitle: string, pageBadge: string) => (
    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-4">
      {/* Right: Republic & Ministry */}
      <div className="text-right space-y-0.5 min-w-[210px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">🇮🇶</span>
          <span className="text-xs font-black text-slate-900">جمهورية العراق</span>
        </div>
        <p className="text-[10.5px] font-extrabold text-slate-900 leading-tight">
          وزارة التربية العراقية
        </p>
        <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
          المديرية العامة لتربية ميسان
        </p>
        <p className="text-[11.5px] font-black text-indigo-950 pt-0.5">
          {schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}
        </p>
      </div>

      {/* Center: School Seal & Official Title */}
      <div className="text-center space-y-0.5 flex-1 px-2">
        <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full shadow-xs">
          <Crown className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="text-[10px] font-black text-slate-900">رعاية الموهبة والتفوق العلمي</span>
        </div>
        <h1 className="text-sm sm:text-base font-black text-slate-950 tracking-normal pt-0.5">
          {title}
        </h1>
        <p className="text-[10.5px] font-bold text-slate-700">
          {subtitle}
        </p>
      </div>

      {/* Left: Metadata Box */}
      <div className="text-left text-xs space-y-0.5 font-mono min-w-[210px] bg-slate-50 p-2 rounded-xl border border-slate-200" dir="rtl">
        <div className="flex justify-between items-center text-[10.5px]">
          <span className="font-bold text-slate-600 font-arabic">الصف الدراسي:</span>
          <span className="font-black text-indigo-950 font-arabic">{selectedGrade}</span>
        </div>
        <div className="flex justify-between items-center text-[10.5px]">
          <span className="font-bold text-slate-600 font-arabic">الشعبة المعتمدة:</span>
          <span className="font-black text-emerald-800 font-arabic">شعبة ({selectedSection})</span>
        </div>
        <div className="flex justify-between items-center text-[10.5px]">
          <span className="font-bold text-slate-600 font-arabic">العام الدراسي:</span>
          <span className="font-mono font-black text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
            {academicYear}
          </span>
        </div>
        <div className="flex justify-between items-center text-[9.5px] text-slate-600 pt-0.5 border-t border-slate-200">
          <span className="font-bold font-arabic">الخطة الوزارية:</span>
          <span className="font-mono font-bold text-slate-900">35 حصة أسبوعياً</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
            {pageBadge}
          </span>
        </div>
      </div>
    </div>
  );

  /* Helper: Official Signatures and Administrative Stamp */
  const renderOfficialSignatures = () => (
    <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold pt-2 border-t-2 border-slate-900">
      <div className="space-y-0.5">
        <p className="font-bold text-slate-700 text-[11px]">مسؤول الجدول المدرسي والأنصبة</p>
        <p className="font-black text-xs text-slate-950">{supervisorName || 'مسؤول إعداد الجدول المدرسي'}</p>
        <p className="text-[9.5px] text-slate-500 font-mono pt-1">التوقيع: ................................</p>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-900 flex flex-col items-center justify-center p-0.5 text-center bg-indigo-50/50">
          <span className="text-[7.5px] font-black text-indigo-950 leading-tight">ثانوية ميسان للمتميزات</span>
          <span className="text-[7.5px] font-bold text-amber-800 font-mono leading-tight">الختم الإداري</span>
          <span className="text-[7px] font-black text-slate-700 leading-tight">معتمد رسمياً ✓</span>
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="font-bold text-slate-700 text-[11px]">مديرة ثانوية ميسان للمتميزات</p>
        <p className="font-black text-xs text-slate-950">
          {principalName || schoolAdminData.principalBadge || schoolAdminData.principalName || 'أ.د. الهام صبيح سعدون'}
        </p>
        <p className="text-[9.5px] text-slate-500 font-mono pt-1">التوقيع والختم: ................................</p>
      </div>
    </div>
  );

  /* Page 1: جدول الدروس الأسبوعي الشامل (Weekly Timetable) - ALL 7 PERIODS IN ONE PAGE */
  const renderPage1Timetable = (isExportTarget = false) => (
    <div
      className="bg-white text-slate-950 p-4 sm:p-5 font-arabic text-right space-y-2.5 rounded-2xl select-none"
      dir="rtl"
      style={{
        width: isExportTarget ? '1120px' : '100%',
        minWidth: isExportTarget ? '1120px' : '960px',
        color: '#020617',
        backgroundColor: '#ffffff',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
      }}
    >
      {/* Official Header */}
      {renderOfficialHeader(
        'جدول الدروس الأسبوعي وتوزيع الحصص',
        `وفق الخطة الوزارية والأنصبة التعليمية المعتمدة للعام الدراسي ${academicYear}`,
        'الصفحة 1 من 2'
      )}

      {/* Main Timetable Matrix */}
      <div className="overflow-hidden rounded-xl border-2 border-slate-900 shadow-xs">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black">
              <th className="py-2 px-2.5 border-l border-slate-700 text-center w-28 bg-slate-950 text-xs">
                الحصة / التوقيت
              </th>
              {WEEKDAY_LIST.map((day) => (
                <th key={day} className="py-2 px-2 border-l border-slate-700 text-center font-black text-xs sm:text-sm">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {PERIODS_TIMING.map((periodObj, pIdx) => (
              <tr key={periodObj.period} className={pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                {/* Period Time Slot */}
                <td className="py-1.5 px-2 border-l border-slate-900 text-center bg-slate-100/90 font-bold">
                  <div className="font-black text-slate-950 text-xs">{periodObj.label}</div>
                  <div className="font-mono text-[10px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300 mt-0.5">
                    {periodObj.timeSlot}
                  </div>
                </td>

                {/* Day Slots */}
                {WEEKDAY_LIST.map((day) => {
                  const slot = getSlot(day, periodObj.period);
                  return (
                    <td key={day} className="py-1.5 px-2 border-l border-slate-900 text-center align-middle">
                      {slot ? (
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-950 text-xs leading-tight">{slot.subject}</div>
                          <div className="text-[10px] font-extrabold text-indigo-900 flex items-center justify-center gap-1 leading-tight">
                            <span>{slot.teacherName || 'أستاذة المادة'}</span>
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono leading-tight">
                            {slot.room || 'قاعة 1'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Guidelines & Schedule Notes Bar */}
      <div className="py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-300 flex items-center justify-between text-[11px] text-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-bold">
            يبدأ الدوام الرسمي الساعة <strong>08:00 صباحاً</strong> • زمن الحصة 45 دقيقة مع 5 دقائق استراحة بين الحصص • تلتزم الهيئة التدريسية والطالبات بالتوقيتات المحددة.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          جدول معتمد وزارياً
        </span>
      </div>

      {/* Official Signatures Footer */}
      {renderOfficialSignatures()}
    </div>
  );

  /* Page 2: توزيع المواد الدراسية والأنصبة الأسبوعية للهيئة التدريسية (Teaching Quotas & Subject Distribution) */
  const renderPage2Quotas = (isExportTarget = false) => (
    <div
      className="bg-white text-slate-950 p-4 sm:p-5 font-arabic text-right space-y-2.5 rounded-2xl select-none"
      dir="rtl"
      style={{
        width: isExportTarget ? '1120px' : '100%',
        minWidth: isExportTarget ? '1120px' : '960px',
        color: '#020617',
        backgroundColor: '#ffffff',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
      }}
    >
      {/* Official Header */}
      {renderOfficialHeader(
        'جدول توزيع المواد الدراسية والأنصبة الأسبوعية للهيئة التدريسية',
        `وفق الخطة الوزارية والأنصبة المعتمدة لمدارس المتميزين للعام الدراسي ${academicYear} (${selectedGrade})`,
        'الصفحة 2 من 2'
      )}

      {/* Comprehensive Teaching Quotas & Distribution Matrix Table */}
      <div className="overflow-hidden rounded-xl border-2 border-slate-900">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black">
              <th className="py-2 px-2 border-l border-slate-700 text-center w-8">ت</th>
              <th className="py-2 px-2 border-l border-slate-700 text-right">المادة الدراسية المقررة</th>
              <th className="py-2 px-2 border-l border-slate-700 text-right">الأستاذة المكلفة بالتدريس</th>
              <th className="py-2 px-2 border-l border-slate-700 text-center w-24">النصاب المقرر</th>
              <th className="py-2 px-2 border-l border-slate-700 text-center w-24">الحصص بالجدول</th>
              <th className="py-2 px-2 border-l border-slate-700 text-center w-24">حالة النصاب</th>
              <th className="py-2 px-2 border-l border-slate-700 text-center">القاعة / المختبر</th>
              <th className="py-2 px-2 border-l border-slate-700 text-center">أيام التواجد والدوام</th>
              <th className="py-2 px-2 text-right">الملاحظات والتوجيهات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {currentGradeQuotas.map((q, idx) => {
              const count = getScheduledCountForSubject(q.subjectName);
              const daysList = getTeacherAvailableDays(q.teacherName, currentGradeQuotas, teachers);
              const daysStr = daysList.length === 5
                ? 'الأحد - الخميس (كامل الأسبوع)'
                : daysList.join('، ');

              return (
                <tr key={q.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                  <td className="py-1 px-1.5 border-l border-slate-300 text-center font-bold font-mono text-slate-700 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 font-black text-slate-950 text-xs">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{q.subjectName}</span>
                    </div>
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 font-extrabold text-indigo-950 text-xs">
                    {q.teacherName}
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 text-center font-mono font-black text-slate-900 text-xs">
                    {q.weeklyPeriods} حصص
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 text-center font-mono font-black text-emerald-800 text-xs">
                    {count} حصص
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 text-center">
                    {count === q.weeklyPeriods ? (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 font-black text-[9.5px] border border-emerald-300">
                        مكتمل 100% ✓
                      </span>
                    ) : count > q.weeklyPeriods ? (
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-black text-[9.5px] border border-amber-300">
                        زيادة {count - q.weeklyPeriods}
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-900 font-black text-[9.5px] border border-rose-300">
                        متبقي {q.weeklyPeriods - count}
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 text-center font-mono text-[10.5px] text-slate-700">
                    {q.classroom || 'قاعة المتميزات'}
                  </td>
                  <td className="py-1 px-2 border-l border-slate-300 text-center text-[10px] font-bold text-slate-700">
                    {daysStr}
                  </td>
                  <td className="py-1 px-2 text-[10px] text-slate-600 font-semibold">
                    وفق المنهاج الوزاري المكثف لمدارس المتميزين
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quotas & Laboratory Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-600">إجمالي الحصص الموزعة:</p>
          <p className="text-xs font-black text-slate-950">35 حصة أسبوعياً (100%)</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-600">عدد المواد المقررة:</p>
          <p className="text-xs font-black text-indigo-950">{currentGradeQuotas.length} مواد دراسية معتمدة</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-600">مطابقة الأنصبة الوزارية:</p>
          <p className="text-xs font-black text-emerald-800">معتمد ومحكم رسمياً ✓</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-600">المختبرات والقاعات العلمية:</p>
          <p className="text-[10.5px] font-black text-amber-900 truncate">مختبرات الأحياء، الكيمياء، الفيزياء والحاسوب</p>
        </div>
      </div>

      {/* Official Signatures Footer */}
      {renderOfficialSignatures()}
    </div>
  );

  /* Page: وثيقة جدول الحصص الأسبوعي الموحد للأستاذ (Teacher's Weekly Schedule Document) - ALL 7 PERIODS IN ONE PAGE */
  const renderTeacherScheduleOfficialDoc = (isExportTarget = false) => {
    const teacherObj = teachers.find(
      (t) => isSameTeacher(t.name, selectedTeacherForSchedule, teachers)
    );
    const teacherSchedule = getTeacherWeeklySchedule(
      timetable,
      selectedTeacherForSchedule,
      subjectQuotas,
      teachers
    );
    const allowedDays = teacherObj?.availableDays && teacherObj.availableDays.length > 0
      ? teacherObj.availableDays
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    // Check teacher-specific collisions
    let teacherConflictCount = 0;
    WEEKDAY_LIST.forEach((day) => {
      PERIODS_TIMING.forEach((p) => {
        const matchingSlots = timetable.filter(
          (s) =>
            s.day === day &&
            s.period === p.period &&
            s.teacherName &&
            isSameTeacher(s.teacherName, selectedTeacherForSchedule, teachers)
        );
        if (matchingSlots.length > 1) {
          teacherConflictCount += matchingSlots.length - 1;
        }
      });
    });

    return (
      <div
        className="bg-white text-slate-950 p-3 sm:p-4 font-arabic text-right space-y-2 rounded-2xl select-none"
        dir="rtl"
        style={{
          width: isExportTarget ? '1120px' : '100%',
          minWidth: isExportTarget ? '1120px' : '100%',
          maxWidth: isExportTarget ? '1120px' : '100%',
          color: '#020617',
          backgroundColor: '#ffffff',
          fontFamily: "'Cairo', 'Tajawal', sans-serif",
        }}
      >
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
          {/* Right: Republic & Ministry */}
          <div className="text-right space-y-0.5 min-w-[190px]">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-sm">🇮🇶</span>
              <span className="text-[11px] font-black text-slate-900">جمهورية العراق</span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-900 leading-tight">
              وزارة التربية العراقية
            </p>
            <p className="text-[10px] font-bold text-slate-800 leading-tight">
              المديرية العامة لتربية ميسان
            </p>
            <p className="text-[11px] font-black text-indigo-950 pt-0.5">
              {schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}
            </p>
          </div>

          {/* Center: School Seal & Official Title */}
          <div className="text-center space-y-0.5 flex-1 px-1">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full shadow-xs">
              <Crown className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="text-[9.5px] font-black text-slate-900">جدول الحصص والأنصبة الأسبوعية للأستاذ</span>
            </div>
            <h1 className="text-xs sm:text-sm font-black text-slate-950 tracking-normal pt-0.5">
              جدول الحصص الأسبوعي الموحد للأستاذ ({selectedTeacherForSchedule})
            </h1>
            <p className="text-[9.5px] font-bold text-slate-700">
              وفق الخطة الوزارية والأنصبة التدريسية المعتمدة للعام الدراسي {academicYear}
            </p>
          </div>

          {/* Left: Metadata Box */}
          <div className="text-left text-xs space-y-0.5 font-mono min-w-[200px] bg-slate-50 p-1.5 rounded-xl border border-slate-200" dir="rtl">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-600 font-arabic">اسم التدريسي/ة:</span>
              <span className="font-black text-indigo-950 font-arabic">{selectedTeacherForSchedule}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-600 font-arabic">المادة والتخصص:</span>
              <span className="font-black text-emerald-800 font-arabic">{teacherObj?.subject || 'متعدد المواد'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-600 font-arabic">إجمالي النصاب:</span>
              <span className="font-mono font-black text-indigo-900 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 text-[9.5px]">
                {teacherSchedule.totalSlots} حصة أسبوعياً
              </span>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-600 pt-0.5 border-t border-slate-200">
              <span className="font-bold font-arabic">فحص التضارب:</span>
              {teacherConflictCount === 0 ? (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-bold text-[8.5px]">
                  خالٍ من التضارب ✓
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 rounded font-bold text-[8.5px]">
                  يوجد {teacherConflictCount} تضارب ⚠️
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5-Day Weekly Matrix Table - ALL 7 PERIODS WITH FIXED COLUMNS */}
        <div className="border border-slate-900 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs border-collapse font-arabic table-fixed">
            <thead>
              <tr className="bg-slate-900 text-white font-black text-center text-xs">
                <th className="py-1.5 px-1 border-l border-slate-700 w-[13%] bg-slate-950">
                  <span className="text-[11px] text-amber-300 font-black">اليوم / التواجد</span>
                </th>
                {PERIODS_TIMING.map((p) => (
                  <th key={p.period} className="py-1.5 px-0.5 border-l border-slate-700 text-center w-[12.42%]">
                    <div className="font-black text-amber-300 text-[10.5px] leading-tight">{p.label}</div>
                    <div className="text-[8.5px] text-slate-300 font-mono font-normal leading-tight pt-0.5">{p.timeSlot}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {WEEKDAY_LIST.map((day, idx) => {
                const isDayAvailable = allowedDays.includes(day);
                const dayLessons = timetable.filter(
                  (s) =>
                    s.day === day &&
                    s.teacherName &&
                    isSameTeacher(s.teacherName, selectedTeacherForSchedule, teachers)
                );

                return (
                  <tr
                    key={day}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                  >
                    <td className="py-1 px-1 border-l border-slate-300 text-center bg-slate-100/90 font-bold">
                      <div className="font-black text-slate-950 text-[11px]">{day}</div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        ({dayLessons.length} حصص)
                      </div>
                      <span
                        className={`inline-block mt-0.5 px-1 py-0.2 rounded text-[8.5px] font-bold ${
                          isDayAvailable
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {isDayAvailable ? 'دوام رسمي ✓' : 'تفرغ'}
                      </span>
                    </td>

                    {PERIODS_TIMING.map((p) => {
                      const matchingSlots = timetable.filter(
                        (s) =>
                          s.day === day &&
                          s.period === p.period &&
                          s.teacherName &&
                          isSameTeacher(s.teacherName, selectedTeacherForSchedule, teachers)
                      );
                      const hasCollision = matchingSlots.length > 1;
                      const isUnscheduledDay = matchingSlots.length > 0 && !isDayAvailable;

                      return (
                        <td
                          key={p.period}
                          className={`py-0.5 px-0.5 border-l border-slate-300 text-center align-middle ${
                            hasCollision
                              ? 'bg-rose-50 border-2 border-rose-600'
                              : isUnscheduledDay
                              ? 'bg-amber-50 border border-amber-500'
                              : matchingSlots.length > 0
                              ? 'bg-indigo-50/50'
                              : 'bg-transparent'
                          }`}
                        >
                          {matchingSlots.length === 0 ? (
                            <span className="text-slate-400 font-mono text-[9px] block py-1">— فراغ —</span>
                          ) : (
                            <div className="space-y-0.5">
                              {matchingSlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`p-1 rounded-md border text-right space-y-0.5 shadow-xs ${
                                    hasCollision
                                      ? 'bg-rose-100 border-rose-400 text-rose-950'
                                      : isUnscheduledDay
                                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                                      : 'bg-white border-indigo-200 text-slate-900'
                                  }`}
                                  title={`${slot.subject} - ${slot.gradeLevel} (شعبة ${slot.section || 'أ'}) - ${slot.room || 'قاعة 1'}`}
                                >
                                  <div className="font-black text-indigo-950 text-[10px] truncate leading-tight">
                                    {slot.subject}
                                  </div>
                                  <div className="text-[9px] font-bold text-emerald-800 truncate leading-tight">
                                    {slot.gradeLevel} • ({slot.section || 'أ'})
                                  </div>
                                  <div className="text-[8px] text-slate-500 font-mono truncate leading-tight">
                                    {slot.room || 'قاعة 1'}
                                  </div>
                                </div>
                              ))}
                              {hasCollision && (
                                <div className="text-[7.5px] font-black text-rose-800 bg-rose-200 px-1 py-0.2 rounded border border-rose-400 truncate">
                                  ⚠️ تضارب حصص
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Teacher Quotas and Workload Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
            <p className="text-[9.5px] font-bold text-slate-600">إجمالي الحصص الموزعة:</p>
            <p className="text-[11px] font-black text-slate-950">{teacherSchedule.totalSlots} حصة أسبوعياً</p>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
            <p className="text-[9.5px] font-bold text-slate-600">أيام الدوام والتفرغ:</p>
            <p className="text-[11px] font-black text-indigo-950">{allowedDays.length} أيام دوام معتمدة</p>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
            <p className="text-[9.5px] font-bold text-slate-600">فحص التضارب والتعارض:</p>
            <p className={`text-[11px] font-black ${teacherConflictCount === 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              {teacherConflictCount === 0 ? 'خالٍ من التضارب رسميّاً ✓' : `يوجد ${teacherConflictCount} تعارض`}
            </p>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-300 space-y-0.5">
            <p className="text-[9.5px] font-bold text-slate-600">القاعات والمختبرات المخصصة:</p>
            <p className="text-[10px] font-black text-amber-900 truncate">قاعات ومختبرات ثانوية ميسان للمتميزات</p>
          </div>
        </div>

        {/* Official Signatures Footer */}
        {renderOfficialSignatures()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      
      {/* FULL-SCREEN DOCUMENT PREVIEW MODAL (المعاينة الشاملة قبل التنزيل أو الطباعة) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex flex-col font-arabic overflow-hidden animate-in fade-in duration-200">
          
          {/* Preview Navigation & Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>معاينة وثيقة جدول الدروس والأنصبة الرسمية قبل التنزيل</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    وثيقة رسمية من صفحتين منفصلتين (A4 أفقي)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  الصف: {selectedGrade} • شعبة ({selectedSection}) • العام الدراسي: <strong className="text-amber-300 font-mono">{academicYear}</strong>
                </p>
              </div>
            </div>

            {/* Middle: Page Selector Tabs & Grade/Section & Year Filters */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              
              {/* Page Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setPreviewPageTab('all')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewPageTab === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>الصفحتين معاً (PDF كامل)</span>
                </button>

                <button
                  onClick={() => setPreviewPageTab('page1')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewPageTab === 'page1'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>صفحة 1: جدول الدروس</span>
                </button>

                <button
                  onClick={() => setPreviewPageTab('page2')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewPageTab === 'page2'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>صفحة 2: توزيع المواد والأنصبة</span>
                </button>
              </div>

              {/* Academic Year Quick Switcher in Preview */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 border-r border-slate-700 pr-2 mr-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">العام الدراسي:</span>
                <select
                  value={['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'].includes(academicYear) ? academicYear : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      handleOpenSignaturesEditor();
                    } else {
                      handleSaveAcademicYear(e.target.value);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 text-amber-300 text-xs font-mono font-bold rounded-lg px-2 py-1"
                >
                  <option value="2024 - 2025">2024 - 2025</option>
                  <option value="2025 - 2026">2025 - 2026</option>
                  <option value="2026 - 2027">2026 - 2027</option>
                  <option value="2027 - 2028">2027 - 2028</option>
                  {!['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'].includes(academicYear) && (
                    <option value="custom">{academicYear} (مخصص)</option>
                  )}
                </select>
              </div>

              {/* Grade Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 border-r border-slate-700 pr-2 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">الصف:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1"
                >
                  {ALL_GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="font-bold">الشعبة:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-teal-300 text-xs font-bold rounded-lg px-2 py-1"
                >
                  <option value="أ">شعبة أ</option>
                  <option value="ب">شعبة ب</option>
                  <option value="جـ">شعبة جـ</option>
                  <option value="د">شعبة د</option>
                  <option value="الكل">جميع الشعب</option>
                </select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-r border-slate-700 pr-2 mr-1">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(z - 10, 45))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  title="تصغير المعاينة"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-amber-300 font-bold px-1">{previewZoom}%</span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(z + 10, 130))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  title="تكبير المعاينة"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewZoom(85)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    previewZoom === 85 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="ملائمة الحصص والصفحة كاملة للشاشة"
                >
                  ملائمة الصفحة الكاملة (85%)
                </button>
                <button
                  onClick={() => setPreviewZoom(100)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    previewZoom === 100 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="الحجم الأصلي 100%"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Action Buttons in Preview Bar */}
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleOpenSignaturesEditor}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="تعديل العام الدراسي واسم مسؤول الجدول المدرسي واسم المديرة على الوثيقة (خاص بالمديرة والإدارة)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل العام الدراسي والتوقيعات ✍️</span>
                </button>
              )}

              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 border border-emerald-400/40 shadow-lg shadow-emerald-600/30 cursor-pointer"
                title="تنزيل الوثيقة كملف PDF رسمي مكون من صفحتين وحفظه بالجهاز"
              >
                {isExportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'جاري إنشاء PDF الصفحتين...' : 'تنزيل PDF الآن (صفحتان منفصلتان) 📥'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="طباعة ورقية"
              >
                <Printer className="w-4 h-4 text-indigo-300" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                title="إغلاق المعاينة والرجوع للجدول"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Canvas Viewport */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center bg-slate-950/90 gap-8">
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-[1160px] w-full space-y-8"
            >
              {/* PAGE 1: Weekly Timetable */}
              {(previewPageTab === 'all' || previewPageTab === 'page1') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-amber-400" />
                      <span>الصفحة 1 من 2: وثيقة جدول الدروس الأسبوعي الشامل</span>
                    </span>
                    <span className="bg-slate-900 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px]">
                      A4 أفقي
                    </span>
                  </div>
                  <div className="shadow-2xl shadow-black/80 rounded-2xl ring-4 ring-amber-500/30 overflow-hidden bg-white">
                    {renderPage1Timetable(false)}
                  </div>
                </div>
              )}

              {/* PAGE 2: Teaching Quotas & Subject Distribution */}
              {(previewPageTab === 'all' || previewPageTab === 'page2') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 text-xs font-bold text-teal-300">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                      <span>الصفحة 2 من 2: توزيع المواد الدراسية والأنصبة الأسبوعية للهيئة التدريسية</span>
                    </span>
                    <span className="bg-slate-900 border border-teal-500/30 px-2 py-0.5 rounded-full text-[10px]">
                      A4 أفقي
                    </span>
                  </div>
                  <div className="shadow-2xl shadow-black/80 rounded-2xl ring-4 ring-teal-500/30 overflow-hidden bg-white">
                    {renderPage2Quotas(false)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom helper tip */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-center text-xs text-slate-400 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                تم فصل جدول الدروس (الصفحة 1) عن توزيع المواد والأنصبة التدريسية (الصفحة 2) وفق المعايير الإدارية والوزارية الرسمية لطباعة وتصدير PDF على ورق A4 أفقي.
              </span>
            </div>
            <button
              onClick={handleOpenSignaturesEditor}
              className="text-[11px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>تعديل أسماء المسؤول والمديرة</span>
            </button>
          </div>

        </div>
      )}

      {/* FULL-SCREEN TEACHER SCHEDULE DOCUMENT PREVIEW MODAL (معاينة جدول الأستاذ الموحد قبل التنزيل) */}
      {isTeacherPreviewOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex flex-col font-arabic overflow-hidden animate-in fade-in duration-200">
          
          {/* Teacher Preview Navigation & Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>معاينة مصفوفة جدول الحصص الأسبوعي للأستاذ قبل التنزيل</span>
                  <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedTeacherForSchedule}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  معاينة الوثيقة الرسمية لطباعة وتنزيل PDF بجودة عالية ومطابقة للمقاييس الوزارية
                </p>
              </div>
            </div>

            {/* Middle Controls: Teacher Selector & Zoom */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Teacher Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="font-bold">الأستاذ:</span>
                <select
                  value={selectedTeacherForSchedule}
                  onChange={(e) => setSelectedTeacherForSchedule(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-teal-300 text-xs font-bold rounded-lg px-2.5 py-1"
                >
                  {allTeachersList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-r border-slate-700 pr-2 mr-1">
                <button
                  onClick={() => setTeacherPreviewZoom((z) => Math.max(z - 10, 40))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  title="تصغير المعاينة"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-amber-300 font-bold px-1">{teacherPreviewZoom}%</span>
                <button
                  onClick={() => setTeacherPreviewZoom((z) => Math.min(z + 10, 130))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  title="تكبير المعاينة"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTeacherPreviewZoom(75)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    teacherPreviewZoom === 75 ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="ملائمة تامة للشاشات الصغيرة والمتوسطة (75%)"
                >
                  75%
                </button>
                <button
                  onClick={() => setTeacherPreviewZoom(85)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    teacherPreviewZoom === 85 ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="ملائمة الصفحة الكاملة A4 (85%)"
                >
                  ملائمة الصفحة الكاملة (85%)
                </button>
                <button
                  onClick={() => setTeacherPreviewZoom(100)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    teacherPreviewZoom === 100 ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="الحجم الأصلي 100%"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Action Buttons in Preview Bar */}
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleOpenSignaturesEditor}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="تعديل العام الدراسي واسم مسؤول الجدول واسم المديرة (خاص بالمديرة والإدارة)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل التوقيعات ✍️</span>
                </button>
              )}

              <button
                onClick={handleDownloadTeacherPdf}
                disabled={isExportingTeacherPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 border border-emerald-400/40 shadow-lg shadow-emerald-600/30 cursor-pointer"
                title="تنزيل جدول الأستاذ كملف PDF رسمي"
              >
                {isExportingTeacherPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExportingTeacherPdf ? 'جاري إنشاء PDF للأستاذ...' : 'تنزيل PDF للأستاذ الآن 📥'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="طباعة ورقية"
              >
                <Printer className="w-4 h-4 text-teal-300" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              <button
                onClick={() => setIsTeacherPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                title="إغلاق المعاينة والرجوع للجدول"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Canvas Viewport */}
          <div className="flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center bg-slate-950/90 gap-6">
            <div
              style={{
                transform: `scale(${teacherPreviewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="w-full max-w-[1140px] space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 text-xs font-bold text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <Grid3X3 className="w-4 h-4 text-teal-400" />
                    <span>مصفوفة جدول الحصص الأسبوعي الموحد للأستاذ ({selectedTeacherForSchedule}) • الحصص 1 إلى 7</span>
                  </span>
                  <span className="bg-slate-900 border border-teal-500/30 px-2 py-0.5 rounded-full text-[10px]">
                    A4 أفقي رسمي (صفحة واحدة متكاملة)
                  </span>
                </div>
                <div className="shadow-2xl shadow-black/80 rounded-2xl ring-4 ring-teal-500/30 overflow-x-auto bg-white">
                  {renderTeacherScheduleOfficialDoc(false)}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper tip */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-center text-xs text-slate-400 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                يتضمن جدول الأستاذ الموحد مصفوفة الحصص الأسبوعية (5 أيام × 7 حصص) مع فحص التضارب ومطابقة أيام الدوام والتفرغ والأنصبة المعتمدة.
              </span>
            </div>
            <span className="text-[11px] text-teal-300 font-mono">
              ثانوية ميسان للمتميزات
            </span>
          </div>

        </div>
      )}

      {/* EDIT SIGNATURES & DOCUMENT CONFIGURATION MODAL */}
      {canEdit && showSignaturesEditor && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-arabic animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>تعديل العام الدراسي وبيانات الاعتماد والتوقيع للوثيقة الرسمية</span>
              </h4>
              <button
                onClick={() => setShowSignaturesEditor(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSignatures} className="space-y-4">
              {/* Academic Year Setting */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>العام الدراسي المعتمد للوثيقة:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">مثال: 2026 - 2027</span>
                </label>
                <input
                  type="text"
                  required
                  value={tempAcademicYear}
                  onChange={(e) => setTempAcademicYear(e.target.value)}
                  placeholder="أدخل العام الدراسي (مثال: 2026 - 2027)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 mb-2"
                />

                {/* Quick Presets for Academic Year */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] text-slate-400">خيارات سريعة:</span>
                  {['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setTempAcademicYear(yr)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        tempAcademicYear === yr
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timetable Supervisor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  اسم مسؤول الجدول المدرسي والأنصبة:
                </label>
                <input
                  type="text"
                  required
                  value={tempSupervisorName}
                  onChange={(e) => setTempSupervisorName(e.target.value)}
                  placeholder="أدخل اسم مسؤول إعداد الجدول المدرسي..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Principal Name */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  اسم مديرة ثانوية ميسان للمتميزات:
                </label>
                <input
                  type="text"
                  required
                  value={tempPrincipalName}
                  onChange={(e) => setTempPrincipalName(e.target.value)}
                  placeholder="مثال: أ.د. الهام صبيح سعدون"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>تحديث فوري ومعتمد للوثائق الرسمية</span>
                </div>
                <p className="text-slate-300 text-[10.5px] leading-relaxed">
                  سيتم اعتماد العام الدراسي وأسماء التوقيع مباشرة في ترويسة وتذييل وثيقة المعاينة وتضمينها تلقائياً في ملف PDF المعتمد للتنزيل والطباعة.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ واعتماد التعديلات ✓</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSignatures}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="استعادة الإعدادات الافتراضية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>الافتراضي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignaturesEditor(false)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-6xl w-full p-4 sm:p-6 space-y-5 shadow-2xl text-right text-slate-100 max-h-[94vh] overflow-y-auto my-auto relative">
        
        {/* Toast Notification */}
        {showSuccessToast && (
          <div className="absolute top-4 left-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl animate-bounce flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
            <span>{showSuccessToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-white">
                  جدول الدروس الأسبوعي الشامل 🗓️
                </h2>
                {canEdit ? (
                  <button
                    onClick={handleOpenSignaturesEditor}
                    className="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-mono font-black border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="تعديل العام الدراسي وبيانات الاعتماد والتوقيع الرسمية (خاص بحساب المديرة والإدارة)"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>العام الدراسي: {academicYear}</span>
                    <Edit3 className="w-3 h-3 text-amber-400/80" />
                  </button>
                ) : (
                  <span
                    className="px-3 py-1 rounded-full bg-slate-800/80 text-amber-300/90 text-xs font-mono font-bold border border-slate-700/80 flex items-center gap-1.5 shadow-xs"
                    title={`العام الدراسي المعتمد: ${academicYear}`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>العام الدراسي: {academicYear}</span>
                  </span>
                )}
                {canEdit ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>صلاحية التعديل والتوليد مفعلة (المديرة والإدارة) ✏️</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/30 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>وضع العرض فقط • التعديل محصور بمديرة المدرسة والإدارة 🔒</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ثانوية ميسان للمتميزات • من الأحد إلى الخميس • 7 دروس يومياً (45 دقيقة للحصة)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* NEW: Preview before download button */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 border border-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              title="معاينة شكل الوثيقة الرسمية والجدول كاملاً قبل التنزيل"
            >
              <Eye className="w-4 h-4 text-slate-950" />
              <span>معاينة قبل التنزيل 📄</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 border border-emerald-500/30 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              title="تنزيل جدول الدروس كملف PDF وحفظه مباشرة في مجلد Downloads"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-emerald-200" />
              )}
              <span>{isExportingPdf ? 'جاري إنشاء PDF...' : 'تنزيل PDF'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
              title="طباعة الجدول ورقياً"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">طباعة ورقية</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Grade Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>جدول الدروس الأسبوعي (للصفوف)</span>
            </button>

            <button
              onClick={() => setActiveTab('teacher_schedules')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'teacher_schedules'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 border border-teal-400/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>جدول المدرس الموحد وعدم التضارب</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  schoolAudit.totalConflicts === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                }`}
              >
                {schoolAudit.totalConflicts === 0 ? '0 تضارب ✓' : `${schoolAudit.totalConflicts} تضارب ⚠️`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quotas')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'quotas'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>تحديد المواد والأنصبة وأيام الدوام</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono">
                {currentGradeQuotas.length}
              </span>
            </button>
          </div>

          {activeTab === 'timetable' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-bold text-slate-300">الصف الدراسي:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-400"
                >
                  {ALL_GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">الشعبة المعتمدة:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-400"
                >
                  {enrolledSectionsForSelectedGrade.map((sec) => {
                    const count = students.filter(
                      (s) => s.gradeLevel === selectedGrade && (s.section === sec || (!s.section && sec === 'أ'))
                    ).length;
                    return (
                      <option key={sec} value={sec}>
                        شعبة {sec} ({count} طالبة)
                      </option>
                    );
                  })}
                  {enrolledSectionsForSelectedGrade.length > 1 && (
                    <option value="الكل">
                      جميع الشعب ({students.filter((s) => s.gradeLevel === selectedGrade).length} طالبة)
                    </option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-300">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>طالبات الشعبة:</span>
                <span className={`font-mono font-bold ${studentsCountInCurrentSection > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {studentsCountInCurrentSection} طالبة
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Conflict Alert & Resolution Banner */}
        {schoolAudit.hasConflicts && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-black text-rose-200 text-sm flex items-center gap-2">
                  <span>⚠️ تم رصد {schoolAudit.totalConflicts} تضارب في الجدول المدرسي</span>
                  <span className="text-[11px] font-normal text-rose-300">
                    ({schoolAudit.conflicts.length} تضارب أوقات + {schoolAudit.availabilityViolations.length} مخالفة أيام دوام)
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  يوجد حصص متزامنة لنفس المدرس في أكثر من شعبة أو حصص في غير أيام دوام المدرس المقررة.
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResolveConflicts}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>معالجة وإصلاح التضاربات تلقائياً ⚡</span>
                </button>

                <button
                  onClick={handleAutoGenerateSchoolMaster}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة التوليد الشامل</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: WEEKLY TIMETABLE GRID */}
        {activeTab === 'timetable' && (
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            {canEdit && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-indigo-500/20 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>توليد ذكي لحصص الجدول (موزّع على أيام الأسبوع ومنع التعارض للمدرسات):</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoGenerateFromQuotas}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    title="توليد جدول ذكي لهذا الصف والشعبة موزّع على أيام الأسبوع دون تكرار يومي وبدون أي تعارض للمدرسات"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>توليد تلقائي لـ ({selectedGrade})</span>
                  </button>

                  <button
                    onClick={handleAutoGenerateSchoolMaster}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                    title="توليد الجدول المدرسي الشامل لكافة الصفوف والشعب ومنع أي تعارض زمني في أوقات الهيئة التدريسية"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد الجدول المدرسي الشامل 🌟</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Timetable Grid Container */}
            <div id="timetable-printable-area" className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-inner p-2">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-indigo-200 font-black border-b border-slate-800">
                    <th className="p-3 border-r border-slate-800 text-center w-28 bg-slate-900/90 sticky right-0 z-10">
                      الحصة / التوقيت
                    </th>
                    {WEEKDAY_LIST.map((day) => (
                      <th key={day} className="p-3 text-center border-r border-slate-800 min-w-[150px]">
                        <span className="block text-white font-extrabold text-sm">{day}</span>
                        <span className="text-[10px] text-amber-400 font-mono font-normal">7 دروس متتالية</span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {PERIODS_TIMING.map((periodObj, pIdx) => (
                    <React.Fragment key={periodObj.period}>
                      <tr className="hover:bg-slate-900/40 transition-colors">
                        {/* Time Slot Column */}
                        <td className="p-3 border-r border-slate-800 text-center bg-slate-900/80 sticky right-0 z-10 space-y-0.5">
                          <div className="font-extrabold text-amber-300 text-xs">{periodObj.label}</div>
                          <div className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            {periodObj.timeSlot}
                          </div>
                          <div className="text-[9px] text-emerald-400 font-sans">45 دقيقة</div>
                        </td>

                        {/* Days Columns */}
                        {WEEKDAY_LIST.map((day) => {
                          const slot = getSlot(day, periodObj.period);
                          return (
                            <td key={`${day}-${periodObj.period}`} className="p-2 border-r border-slate-800/80 align-top">
                              {slot ? (
                                <div className="group relative p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-amber-400/80 hover:bg-slate-800/90 transition-all shadow-sm space-y-1.5">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-black text-white text-xs block leading-snug">
                                      {slot.subject}
                                    </span>
                                    {canEdit && (
                                      <button
                                        onClick={() => handleOpenEditSlot(day, periodObj.period)}
                                        className="p-1 rounded-lg bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-300 transition-colors shrink-0 cursor-pointer"
                                        title="تعديل بيانات الحصة"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 text-[11px] text-indigo-200 font-bold">
                                    <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate">{slot.teacherName || 'أستاذة المادة'}</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                    <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">{slot.room || 'قاعة 1'}</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenEditSlot(day, periodObj.period)}
                                  disabled={!canEdit}
                                  className={`w-full h-20 rounded-2xl border border-dashed flex flex-col items-center justify-center p-2 gap-1 transition-all text-xs font-bold ${
                                    canEdit
                                      ? 'border-slate-800 hover:border-indigo-400/60 hover:bg-indigo-950/20 text-slate-500 hover:text-indigo-300 cursor-pointer'
                                      : 'border-slate-900 text-slate-700 cursor-default'
                                  }`}
                                >
                                  {canEdit ? (
                                    <>
                                      <Plus className="w-4 h-4 text-indigo-400/60" />
                                      <span>إضافة مادة</span>
                                    </>
                                  ) : (
                                    <span className="text-[11px] font-mono text-slate-700">-</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 5 Minute Break Indicator Row (Between periods) */}
                      {pIdx < PERIODS_TIMING.length - 1 && (
                        <tr className="bg-slate-950/90 text-slate-300 text-[10px]">
                          <td className="py-1 px-3 border-r border-slate-800 text-center font-mono text-emerald-400 font-bold bg-slate-900/40">
                            ☕ 5 د أستراحة
                          </td>
                          <td colSpan={5} className="py-1 px-4 text-center font-bold text-[10px] tracking-wider text-slate-300 bg-emerald-950/20 border-r border-slate-800/50">
                            فترة استراحة وتغيير القاعات الدراسية (5 دقائق)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grade Subjects & Quotas Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-xs text-white">
                    خطة المواد المحددة لـ ({selectedGrade}) ومطابقتها مع الحصص الموزعة:
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('quotas')}
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                >
                  <span>تعديل خطة المواد والمدرسين</span>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentGradeQuotas.length === 0 ? (
                <p className="text-xs text-slate-400">لم يتم إضافة خطة المواد الدراسية لهذا الصف بعد.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {currentGradeQuotas.map((q) => {
                    const scheduledCount = getScheduledCountForSubject(q.subjectName);
                    const isFullyScheduled = scheduledCount === q.weeklyPeriods;
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-extrabold text-white text-xs block truncate">{q.subjectName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isFullyScheduled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {scheduledCount} / {q.weeklyPeriods} حصص
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-400" />
                          <span>{q.teacherName}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: INDIVIDUAL TEACHER SCHEDULE & CONFLICT AUDITOR */}
        {activeTab === 'teacher_schedules' && (
          <div className="space-y-4">
            {/* Teacher Selection and Stats Bar */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-teal-300 text-sm flex items-center gap-2">
                    <span>جدول الحصص الأسبوعي الموحد للأستاذ/ة:</span>
                  </h3>
                  <p className="text-slate-300 text-xs">
                    عرض كافة الحصص المقررة للمدرس عبر جميع الصفوف والشعب والتحقق من عدم وجود أي تضارب زمني
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <label className="text-xs font-bold text-teal-200">اختر المدرس/ة:</label>
                <select
                  value={selectedTeacherForSchedule}
                  onChange={(e) => setSelectedTeacherForSchedule(e.target.value)}
                  className="bg-slate-900 border border-teal-500/40 text-white text-xs font-bold rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-teal-400 min-w-[200px]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Teacher Details & Live Matrix */}
            {(() => {
              const teacherObj = teachers.find(
                (t) => isSameTeacher(t.name, selectedTeacherForSchedule, teachers)
              );
              const teacherSchedule = getTeacherWeeklySchedule(
                timetable,
                selectedTeacherForSchedule,
                subjectQuotas,
                teachers
              );
              const chronologicalAgenda = getTeacherChronologicalAgenda(
                timetable,
                selectedTeacherForSchedule,
                subjectQuotas,
                teachers
              );
              const allowedDays = teacherObj?.availableDays && teacherObj.availableDays.length > 0
                ? teacherObj.availableDays
                : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

              let teacherConflictCount = 0;
              WEEKDAY_LIST.forEach((day) => {
                PERIODS_TIMING.forEach((p) => {
                  const matchingSlots = timetable.filter(
                    (s) =>
                      s.day === day &&
                      s.period === p.period &&
                      s.teacherName &&
                      isSameTeacher(s.teacherName, selectedTeacherForSchedule, teachers)
                  );
                  if (matchingSlots.length > 1) {
                    teacherConflictCount += matchingSlots.length - 1;
                  }
                });
              });

              return (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">المادة والتخصص:</span>
                      <span className="text-xs font-black text-indigo-300">{teacherObj?.subject || 'متعدد المواد'}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">إجمالي الحصص الأسبوعية:</span>
                      <span className="text-xs font-black text-amber-300 font-mono">
                        {teacherSchedule.totalSlots} حصة / أسبوع
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">أيام الدوام المعتمدة:</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {WEEKDAY_LIST.map((d) => {
                          const isAvail = allowedDays.includes(d);
                          return (
                            <span
                              key={d}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isAvail
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  : 'bg-slate-950 text-slate-600 line-through'
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">فحص التضارب:</span>
                      {teacherConflictCount === 0 ? (
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>خالٍ من التضارب ✓</span>
                        </span>
                      ) : (
                        <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>يوجد {teacherConflictCount} تضارب ⚠️</span>
                        </span>
                      )}
                    </div>
                  </div>

                    {/* Mode Switcher & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
                        <button
                          onClick={() => setTeacherScheduleViewMode('agenda')}
                          className={`px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            teacherScheduleViewMode === 'agenda'
                              ? 'bg-teal-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>عرض الأجندة والتوزيع الزمني اليومي</span>
                        </button>

                        <button
                          onClick={() => setTeacherScheduleViewMode('matrix')}
                          className={`px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            teacherScheduleViewMode === 'matrix'
                              ? 'bg-teal-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Grid3X3 className="w-3.5 h-3.5" />
                          <span>مصفوفة الجدول الأسبوعي (5 أيام × 7 حصص)</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setIsTeacherPreviewOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                          title="معاينة وثيقة مصفوفة الجدول الأسبوعي للأستاذ قبل التنزيل"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-950" />
                          <span>معاينة قبل التنزيل 👁️</span>
                        </button>

                        <button
                          onClick={handleDownloadTeacherPdf}
                          disabled={isExportingTeacherPdf}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer border border-emerald-500/30"
                          title="تنزيل جدول الأستاذ كملف PDF رسمي محفوظ"
                        >
                          {isExportingTeacherPdf ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-white" />
                          )}
                          <span>{isExportingTeacherPdf ? 'جاري التصدير...' : 'تنزيل PDF للأستاذ 📥'}</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-400" />
                          <span>طباعة</span>
                        </button>
                      </div>
                    </div>

                  {/* VIEW 1: Chronological Daily Agenda */}
                  {teacherScheduleViewMode === 'agenda' && (
                    <div className="space-y-3">
                      {chronologicalAgenda.map((agendaDay) => (
                        <div
                          key={agendaDay.day}
                          className={`rounded-2xl border p-4 space-y-3 ${
                            agendaDay.isWorkingDay
                              ? 'bg-slate-900/80 border-slate-800'
                              : 'bg-slate-950/70 border-slate-900 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">{agendaDay.day}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  agendaDay.isWorkingDay
                                    ? 'bg-teal-500/20 text-teal-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {agendaDay.isWorkingDay ? 'يوم دوام' : 'يوم تفرغ'}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {agendaDay.lessons.length} حصص
                            </span>
                          </div>

                          {agendaDay.lessons.length === 0 ? (
                            <div className="text-xs text-slate-500 py-2 text-center">
                              لا توجد حصص مجدولة في هذا اليوم
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {agendaDay.lessons.map((lesson, idx) => (
                                <div
                                  key={lesson.slotId || idx}
                                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      {lesson.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {lesson.timeSlot}
                                    </span>
                                  </div>
                                  <div className="font-black text-white">{lesson.subject}</div>
                                  <div className="text-teal-300 font-bold text-[11px] flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    <span>
                                      {lesson.gradeLevel} (شعبة {lesson.section})
                                    </span>
                                  </div>
                                  <div className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-amber-400" />
                                    <span>{lesson.room}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VIEW 2: 5-Day Matrix Table */}
                  {teacherScheduleViewMode === 'matrix' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-teal-300 font-black border-b border-slate-800">
                            <th className="p-3 border-r border-slate-800 text-center w-28">اليوم / التواجد</th>
                            {PERIODS_TIMING.map((p) => (
                              <th key={p.period} className="p-3 border-r border-slate-800 text-center">
                                <div>{p.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono font-normal">{p.timeSlot}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {WEEKDAY_LIST.map((day) => {
                            const isDayAvailable = allowedDays.includes(day);
                            return (
                              <tr
                                key={day}
                                className={`transition-colors ${
                                  isDayAvailable ? 'hover:bg-slate-900/40' : 'bg-slate-950/80 opacity-75'
                                }`}
                              >
                                <td className="p-3 border-r border-slate-800 text-center font-bold">
                                  <div className="text-white text-xs font-black">{day}</div>
                                  <span
                                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isDayAvailable
                                        ? 'bg-teal-500/20 text-teal-300'
                                        : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                  >
                                    {isDayAvailable ? 'يوم دوام ✓' : 'غير متواجد'}
                                  </span>
                                </td>

                                {PERIODS_TIMING.map((p) => {
                                  const matchingSlots = timetable.filter(
                                    (s) =>
                                      s.day === day &&
                                      s.period === p.period &&
                                      s.teacherName &&
                                      isSameTeacher(s.teacherName, selectedTeacherForSchedule, teachers)
                                  );
                                  const hasCollision = matchingSlots.length > 1;
                                  const isUnscheduledDay = matchingSlots.length > 0 && !isDayAvailable;

                                  return (
                                    <td
                                      key={p.period}
                                      className={`p-2.5 border-r border-slate-800 text-center align-top min-w-[120px] ${
                                        hasCollision
                                          ? 'bg-rose-950/60 border-2 border-rose-500'
                                          : isUnscheduledDay
                                          ? 'bg-amber-950/40 border border-amber-500'
                                          : matchingSlots.length > 0
                                          ? 'bg-indigo-950/30'
                                          : 'bg-transparent'
                                      }`}
                                    >
                                      {matchingSlots.length === 0 ? (
                                        <span className="text-slate-600 font-mono text-xs">— فراغ —</span>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {matchingSlots.map((slot) => (
                                            <div
                                              key={slot.id}
                                              className={`p-2 rounded-xl border text-right space-y-0.5 ${
                                                hasCollision
                                                  ? 'bg-rose-900/50 border-rose-500 text-white'
                                                  : isUnscheduledDay
                                                  ? 'bg-amber-900/50 border-amber-400 text-amber-200'
                                                  : 'bg-slate-900 border-indigo-500/30 text-white'
                                              }`}
                                            >
                                              <div className="font-black text-amber-300 text-xs truncate">
                                                {slot.subject}
                                              </div>
                                              <div className="text-[11px] font-bold text-teal-300 truncate">
                                                {slot.gradeLevel} (شعبة {slot.section || 'أ'})
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                {slot.room || 'قاعة المتميزات'}
                                              </div>
                                            </div>
                                          ))}

                                          {hasCollision && (
                                            <div className="text-[10px] font-black text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500">
                                              ⚠️ تضارب حصص متزامنة
                                            </div>
                                          )}

                                          {isUnscheduledDay && (
                                            <div className="text-[10px] font-black text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500">
                                              ⚠️ غير متواجد هذا اليوم
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: SUBJECT QUOTAS & TEACHER ASSIGNMENTS MANAGER */}
        {activeTab === 'quotas' && (
          <div className="space-y-4">
            {/* Ministerial Standard Plan Verification Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-black text-white flex items-center gap-2">
                    <span>الخطة الوزارية المعتمدة للأنصبة ({selectedGrade})</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      العام الدراسي: {academicYear}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    المعيار الوزاري لمدارس المتميزين: <strong>35 حصة أسبوعياً</strong> (7 حصص يومياً × 5 أيام دوام).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <div className="text-left font-mono">
                  <span className="text-[10.5px] text-slate-400 block">إجمالي الأنصبة:</span>
                  <span
                    className={`font-black text-sm ${
                      totalWeeklyPeriodsForGrade === 35
                        ? 'text-emerald-400'
                        : totalWeeklyPeriodsForGrade > 35
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {totalWeeklyPeriodsForGrade} / 35 حصة {totalWeeklyPeriodsForGrade === 35 ? '✓ (مطابق)' : ''}
                  </span>
                </div>

                {canEdit && (
                  <button
                    onClick={handleRestoreMinisterialQuotas}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 border border-teal-500/30 transition-all cursor-pointer shadow-xs"
                    title="استعادة توزيع المواد والأنصبة المعتمدة وزارياً لهذا الصف"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                    <span>استعادة الخطة الوزارية المعتمدة 🏛️</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="space-y-1">
                <h3 className="font-black text-amber-300 text-sm flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  <span>تخصيص المواد الدراسية وعدد الحصص الأسبوعية - {selectedGrade}</span>
                </h3>
                <p className="text-slate-300 text-xs">
                  تحديد عدد الحصص الأسبوعية المقررة لكل مادة دراسية واسم الأستاذة المشرفة عليها
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={handleOpenAddQuota}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مادة جديدة وحصصها</span>
                </button>
              )}
            </div>

            {/* Quotas List Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-2">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-indigo-200 font-black border-b border-slate-800">
                    <th className="p-3 border-r border-slate-800 text-center">المادة الدراسية</th>
                    <th className="p-3 border-r border-slate-800 text-center">عدد الحصص الأسبوعية</th>
                    <th className="p-3 border-r border-slate-800 text-center">اسم المدرس / الأستاذة</th>
                    <th className="p-3 border-r border-slate-800 text-center">القاعة / المختبر المخصص</th>
                    <th className="p-3 border-r border-slate-800 text-center">الحصص الموزعة بالجدول</th>
                    {canEdit && <th className="p-3 text-center">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {currentGradeQuotas.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="p-6 text-center text-slate-400 font-bold">
                        لا توجد مواد مسجلة لهذا الصف بعد. اضغط "إضافة مادة جديدة وحصصها" للبدء.
                      </td>
                    </tr>
                  ) : (
                    currentGradeQuotas.map((quota) => {
                      const scheduledCount = getScheduledCountForSubject(quota.subjectName);
                      return (
                        <tr key={quota.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 border-r border-slate-800 font-black text-white text-xs">
                            {quota.subjectName}
                          </td>
                          <td className="p-3 border-r border-slate-800 text-center font-mono font-bold text-amber-300 text-xs">
                            {quota.weeklyPeriods} حصص / أسبوع
                          </td>
                          <td className="p-3 border-r border-slate-800 text-center font-bold text-indigo-200">
                            {quota.teacherName}
                          </td>
                          <td className="p-3 border-r border-slate-800 text-center font-mono text-slate-300">
                            {quota.classroom || 'قاعة المتميزات'}
                          </td>
                          <td className="p-3 border-r border-slate-800 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                scheduledCount === quota.weeklyPeriods
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {scheduledCount} من {quota.weeklyPeriods} حصة
                            </span>
                          </td>
                          {canEdit && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenEditQuota(quota)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                                  title="تعديل المادة"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuota(quota.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                  title="حذف المادة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Teacher Availability Management Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-teal-300 font-black text-xs sm:text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span>تحديد أيّام دوام وحصص الهيئة التدريسية (أيام التدريس المتاحة)</span>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  تؤثر تلقائياً على توليد الجدول الذكي
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teachers.map((t) => {
                  const days = t.availableDays && t.availableDays.length > 0
                    ? t.availableDays
                    : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
                  
                  const handleToggleTeacherDay = (day: string) => {
                    if (!canEdit) return;
                    let newDays: string[];
                    if (days.includes(day)) {
                      if (days.length <= 1) return;
                      newDays = days.filter((d) => d !== day);
                    } else {
                      newDays = [...days, day];
                    }
                    updateTeacher(t.id, { availableDays: newDays });
                  };

                  return (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{t.name}</div>
                        <div className="text-[11px] text-indigo-300">{t.subject}</div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {WEEKDAY_LIST.map((day) => {
                          const isAvailable = days.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleToggleTeacherDay(day)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                isAvailable
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800 line-through hover:text-slate-400'
                              }`}
                              title={isAvailable ? `متاح يوم ${day}` : `غير متاح يوم ${day}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Edit / Add Quota Sub-Modal Form */}
            {canEdit && showQuotaForm && (
              <div className="p-5 rounded-2xl bg-slate-800/95 border border-amber-400/60 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    <span>
                      {activeEditingQuota ? 'تعديل خطة المادة والحصص' : 'إضافة مادة دراسية جديدة وتحديد حصصها'}: ({selectedGrade})
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowQuotaForm(false)}
                    className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveQuotaForm} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم المادة الدراسية *</label>
                    <input
                      type="text"
                      required
                      list="subjects-quota-list"
                      value={quotaSubjectName}
                      onChange={(e) => setQuotaSubjectName(e.target.value)}
                      placeholder="اسم المادة..."
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                    />
                    <datalist id="subjects-quota-list">
                      {OFFICIAL_SUBJECTS_LIST.map((subj) => (
                        <option key={subj} value={subj} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">عدد الحصص الأسبوعية *</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      required
                      value={quotaWeeklyPeriods}
                      onChange={(e) => setQuotaWeeklyPeriods(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs rounded-xl px-3 py-2 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم الأستاذة / المدرس *</label>
                    <input
                      type="text"
                      required
                      list="teachers-quota-list"
                      value={quotaTeacherName}
                      onChange={(e) => setQuotaTeacherName(e.target.value)}
                      placeholder="اسم الأستاذة..."
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                    />
                    <datalist id="teachers-quota-list">
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">القاعة / المختبر المخصص</label>
                    <input
                      type="text"
                      value={quotaClassroom}
                      onChange={(e) => setQuotaClassroom(e.target.value)}
                      placeholder="مثال: قاعة المتميزات 1"
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setShowQuotaForm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ المادة وتأكيد الحصص</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Edit / Add Slot Form Drawer for Tab 1 */}
        {canEdit && activeTab === 'timetable' && (activeEditingSlot || editDay) && (
          <div className="p-5 rounded-2xl bg-slate-800/95 border border-amber-400/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>
                  {activeEditingSlot ? 'تعديل الحصة الدراسية' : 'إضافة حصة دراسية جديدة'}: {editDay} (الحصة {editPeriod})
                </span>
              </h3>
              <span className="text-xs bg-slate-900 text-teal-300 px-3 py-1 rounded-xl font-bold border border-slate-700">
                {selectedGrade} - شعبة ({selectedSection})
              </span>
            </div>

            <form onSubmit={handleSaveSlotForm} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اليوم والحصة</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editDay}
                    onChange={(e) => setEditDay(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-bold"
                  >
                    {WEEKDAY_LIST.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(Number(e.target.value) as any)}
                    className="bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs rounded-xl px-2 py-2 font-bold"
                  >
                    {PERIODS_TIMING.map((p) => (
                      <option key={p.period} value={p.period}>
                        حصة {p.period} ({p.timeSlot})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المادة الدراسية *</label>
                <input
                  type="text"
                  required
                  list="subjects-list"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="اسم المادة..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                />
                <datalist id="subjects-list">
                  {OFFICIAL_SUBJECTS_LIST.map((subj) => (
                    <option key={subj} value={subj} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المدرس / أستاذة المادة *</label>
                <input
                  type="text"
                  required
                  list="teachers-list"
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  placeholder="اسم المدرس..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                />
                <datalist id="teachers-list">
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">القاعة / المختبر</label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder="مثال: قاعة المتميزات 1"
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2 font-bold"
                />
              </div>

              {(() => {
                if (
                  editTeacher &&
                  editTeacher !== 'إدارة المدرسة' &&
                  editTeacher !== 'أستاذة المادة' &&
                  editTeacher !== 'مدرس المادة'
                ) {
                  const allowedDays = getTeacherAvailableDays(editTeacher, subjectQuotas, teachers);
                  if (allowedDays.length > 0 && !allowedDays.includes(editDay)) {
                    return (
                      <div className="sm:col-span-2 lg:col-span-4 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          تنبيه: الأستاذ/ة <strong>{editTeacher}</strong> غير متواجد/ة يوم <strong>{editDay}</strong> حسب الجدول المعتمد. أيام الدوام المحددة له: ({allowedDays.join('، ')})
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
                {activeEditingSlot ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(activeEditingSlot.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحصة من الجدول</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveEditingSlot(null)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتثبيت الحصة الدراسية</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* DEDICATED HIGH-PRECISION PRINT & PDF CAPTURE CONTAINERS (OFFICIAL TWO-PAGE DOCUMENT LAYOUT & TEACHER SCHEDULE) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div id="timetable-pdf-page-1">
          {renderPage1Timetable(true)}
        </div>
        <div id="timetable-pdf-page-2">
          {renderPage2Quotas(true)}
        </div>
        <div id="teacher-timetable-pdf-doc">
          {renderTeacherScheduleOfficialDoc(true)}
        </div>
      </div>
    </div>
  );
};
