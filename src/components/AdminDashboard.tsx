/**
 * Principal / Admin Dashboard Component
 * مدرسة ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_GRADES_LIST, GradeLevel } from '../types';
import { AddTeacherModal, AddStudentModal } from './AddUserModals';
import { EditUserModal } from './EditUserModal';
import { EditSchoolAdminModal } from './EditSchoolAdminModal';
import { QuickEditPrincipalModal } from './QuickEditPrincipalModal';
import { WeeklyTimetableModal } from './WeeklyTimetableModal';
import { StudentCertificateManager } from './StudentCertificateManager';
import { AcademicCalendarWidget } from './AcademicCalendarWidget';
import { SchoolHomeOverview } from './SchoolHomeOverview';
import { MessagingSystem } from './MessagingSystem';
import { GraduatesView } from './GraduatesView';
import { StudentPromotionModal } from './StudentPromotionModal';
import { DisciplinaryAttendancePanel } from './DisciplinaryAttendancePanel';
import { AttendanceHistoryReviewPanel } from './AttendanceHistoryReviewPanel';
import { InteractiveChallengesManager } from './InteractiveChallengesManager';
import { StudentIDCardModal } from './StudentIDCardModal';
import { DigitalLibraryHub } from './DigitalLibraryHub';
import { UploadPdfModal } from './UploadPdfModal';
import { ExamManagementHub } from './ExamManagementHub';
import { PlatformIntegrationsHub } from './PlatformIntegrationsHub';
import { AcademicReportsHub } from './AcademicReportsHub';
import { AuditLogViewer } from './AuditLogViewer';
import { UserManagementHub } from './UserManagementHub';
import { SupervisorManagementHub } from './SupervisorManagementHub';
import { LessonPlanningHub } from './LessonPlanningHub';
import { getShieldThemeConfig } from '../data/shieldsData';
import { dispatchCustomEvent } from '../utils/events';
import { downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import { isMaleTeacher, getTeacherAccountLabel } from '../utils/teacherUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  GraduationCap,
  FileCheck2,
  Building2,
  TrendingUp,
  UserPlus,
  Megaphone,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CircleDollarSign,
  BarChart3,
  Search,
  Plus,
  Send,
  Network,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Edit,
  Trash2,
  Lock,
  Ban,
  ShieldAlert,
  UserCheck,
  X,
  KeyRound,
  Crown,
  Sparkles,
  CalendarCheck,
  CalendarDays,
  Printer,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const {
    teachers,
    students,
    parents,
    supervisors,
    exams,
    submissions,
    announcements,
    financial,
    attendance,
    logAttendance,
    updateFinancialRecord,
    addFinancialRecord,
    deleteFinancialRecord,
    exportDataJSON,
    importDataJSON,
    resetToDefaultData,
    sendAnnouncement,
    updateTeacher,
    deleteTeacher,
    updateStudent,
    deleteStudent,
    updateParent,
    deleteParent,
    schoolAdminData,
    lang,
    t,
  } = useApp();

  const [isEditAdminDataOpen, setIsEditAdminDataOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedIdCardStudent, setSelectedIdCardStudent] = useState<any | null>(null);

  // Admin Attendance State
  const [attSubTab, setAttSubTab] = useState<'disciplinary' | 'review_edit' | 'daily'>('disciplinary');
  const [adminAttDate, setAdminAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminAttGrade, setAdminAttGrade] = useState<GradeLevel>('الصف السادس العلمي');
  const [adminAttSection, setAdminAttSection] = useState<string>('الكل');
  const [adminAttSubject, setAdminAttSubject] = useState<string>('الفيزياء المتقدمة');
  const [adminAttMap, setAdminAttMap] = useState<Record<string, 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isWeeklyTimetableOpen, setIsWeeklyTimetableOpen] = useState(false);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [isQuickEditPrincipalOpen, setIsQuickEditPrincipalOpen] = useState(false);
  const [isSupervisorHubOpen, setIsSupervisorHubOpen] = useState(false);
  const [editAdminInitialTab, setEditAdminInitialTab] = useState<
    'all' | 'photo' | 'principal' | 'vision' | 'achievements' | 'schoolInfo' | 'certBranding'
  >('all');

  // Edit & Delete User Modal States
  const [editModalConfig, setEditModalConfig] = useState<{
    isOpen: boolean;
    type: 'teacher' | 'student' | 'parent';
    data: any;
  }>({ isOpen: false, type: 'teacher', data: null });

  const [userToDelete, setUserToDelete] = useState<{
    type: 'teacher' | 'student' | 'parent';
    id: string;
    name: string;
  } | null>(null);

  // Announcement State
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancTarget, setAncTarget] = useState<'all' | 'teachers' | 'parents' | 'students' | any>('all');
  const [ancPriority, setAncPriority] = useState<'عادي' | 'هتـام' | 'عاجل'>('عاجل');

  // Financial Records State & Modal
  const [financialSearchQuery, setFinancialSearchQuery] = useState('');
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('all');
  const [financialGradeFilter, setFinancialGradeFilter] = useState<string>('all');
  const [financialModalConfig, setFinancialModalConfig] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    data?: any;
  }>({ isOpen: false, mode: 'add', data: null });

  const [financialToDelete, setFinancialToDelete] = useState<{
    id: string;
    studentName: string;
    feeType: string;
  } | null>(null);

  // Form state for financial modal
  const [finStudentId, setFinStudentId] = useState('');
  const [finStudentName, setFinStudentName] = useState('');
  const [finGradeLevel, setFinGradeLevel] = useState<any>('الصف السادس العلمي');
  const [finFeeType, setFinFeeType] = useState('رسوم التسجيل والكتب');
  const [finTotalAmount, setFinTotalAmount] = useState<number>(150000);
  const [finPaidAmount, setFinPaidAmount] = useState<number>(0);
  const [finDueDate, setFinDueDate] = useState('2026-09-01');

  const openAddFinancialModal = () => {
    const defaultStudent = students[0];
    setFinStudentId(defaultStudent ? defaultStudent.id : '');
    setFinStudentName(defaultStudent ? defaultStudent.name : '');
    setFinGradeLevel(defaultStudent ? defaultStudent.gradeLevel : 'الصف السادس العلمي');
    setFinFeeType('رسوم التسجيل والكتب');
    setFinTotalAmount(150000);
    setFinPaidAmount(0);
    setFinDueDate('2026-09-01');
    setFinancialModalConfig({ isOpen: true, mode: 'add', data: null });
  };

  const openEditFinancialModal = (record: any) => {
    setFinStudentId(record.studentId);
    setFinStudentName(record.studentName);
    setFinGradeLevel(record.gradeLevel);
    setFinFeeType(record.feeType);
    setFinTotalAmount(record.totalAmount);
    setFinPaidAmount(record.paidAmount);
    setFinDueDate(record.dueDate || '2026-09-01');
    setFinancialModalConfig({ isOpen: true, mode: 'edit', data: record });
  };

  const handleSaveFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finStudentName.trim() || !finFeeType.trim()) return;

    const total = Number(finTotalAmount) || 0;
    const paid = Number(finPaidAmount) || 0;
    const autoStatus = paid >= total && total > 0 ? 'مكتمل' : paid > 0 ? 'جزئي' : 'غير مدفوع';

    if (financialModalConfig.mode === 'edit' && financialModalConfig.data) {
      updateFinancialRecord(financialModalConfig.data.id, {
        studentId: finStudentId,
        studentName: finStudentName,
        gradeLevel: finGradeLevel,
        feeType: finFeeType,
        totalAmount: total,
        paidAmount: paid,
        status: autoStatus,
        dueDate: finDueDate,
        lastPaymentDate: paid > 0 ? new Date().toISOString().split('T')[0] : undefined,
      });
    } else {
      addFinancialRecord({
        studentId: finStudentId || `std-${Date.now()}`,
        studentName: finStudentName,
        gradeLevel: finGradeLevel,
        feeType: finFeeType,
        totalAmount: total,
        paidAmount: paid,
        status: autoStatus,
        dueDate: finDueDate,
        lastPaymentDate: paid > 0 ? new Date().toISOString().split('T')[0] : undefined,
      });
    }

    setFinancialModalConfig({ isOpen: false, mode: 'add', data: null });
  };

  // Backup Import Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Charts Data
  const gradeDistributionData = ALL_GRADES_LIST.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const avgGpa = gradeStudents.length
      ? Number((gradeStudents.reduce((sum, s) => sum + s.gpa, 0) / gradeStudents.length).toFixed(1))
      : 0;
    return {
      name: grade,
      count: gradeStudents.length,
      avgGpa: avgGpa > 0 ? avgGpa : 98.0,
    };
  });

  const financialSummaryData = [
    { name: 'مكتمل الدفع', value: financial.filter((f) => f.status === 'مكتمل').length },
    { name: 'جزئي', value: financial.filter((f) => f.status === 'جزئي').length },
    { name: 'غير مدفوع', value: financial.filter((f) => f.status === 'غير مدفوع').length },
  ];
  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  // Teacher sorting state: 'alpha-asc' (أ-ي), 'alpha-desc' (ي-أ), 'subject', 'default'
  const [teacherSortMode, setTeacherSortMode] = useState<'alpha-asc' | 'alpha-desc' | 'subject' | 'default'>('alpha-asc');

  const filteredTeachers = teachers
    .filter(
      (tech) =>
        tech.name.includes(searchQuery) ||
        tech.subject.includes(searchQuery) ||
        tech.phone.includes(searchQuery) ||
        (tech.email && tech.email.includes(searchQuery))
    )
    .sort((a, b) => {
      if (teacherSortMode === 'alpha-asc') {
        return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base', numeric: true });
      }
      if (teacherSortMode === 'alpha-desc') {
        return b.name.localeCompare(a.name, 'ar', { sensitivity: 'base', numeric: true });
      }
      if (teacherSortMode === 'subject') {
        return a.subject.localeCompare(b.subject, 'ar', { sensitivity: 'base', numeric: true });
      }
      return 0;
    });

  const filteredStudents = students
    .filter((std) => {
      const matchesSearch =
        !searchQuery ||
        std.name.includes(searchQuery) ||
        std.gradeLevel.includes(searchQuery) ||
        std.parentName.includes(searchQuery) ||
        (std.nationalId && std.nationalId.includes(searchQuery));

      const matchesGrade = selectedGradeFilter === 'all' || std.gradeLevel === selectedGradeFilter;
      const matchesSection = selectedSectionFilter === 'all' || std.section === selectedSectionFilter;

      return matchesSearch && matchesGrade && matchesSection;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' }));

  const gradeSectionStats = ALL_GRADES_LIST.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const secA = gradeStudents.filter((s) => s.section === 'أ').length;
    const secB = gradeStudents.filter((s) => s.section === 'ب').length;
    const secC = gradeStudents.filter((s) => s.section === 'ج' || s.section === 'جـ').length;
    const secD = gradeStudents.filter((s) => s.section === 'د').length;
    return {
      grade,
      total: gradeStudents.length,
      secA,
      secB,
      secC,
      secD,
    };
  });

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancContent) return;

    sendAnnouncement({
      title: ancTitle,
      content: ancContent,
      senderRole: 'admin',
      senderName: `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'} - إدارة المتميزات`,
      targetAudience: ancTarget,
      priority: ancPriority,
    });

    setAncTitle('');
    setAncContent('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = importDataJSON(text);
          if (success) {
            alert(lang === 'ar' ? 'تم استرجاع النسخة الاحتياطية بنجاح!' : 'Backup restored successfully!');
          } else {
            alert(lang === 'ar' ? 'خطأ في تنسيق الملف!' : 'Invalid backup format!');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Main Tab Render Switch */}

      {/* User Accounts & Passcode Management Tab (إدارة المستخدمين والرموز السرية للدخول) */}
      {(activeTab === 'users' || activeTab === 'user-management' || activeTab === 'accounts') && (
        <UserManagementHub />
      )}

      {/* Annual & Daily Curriculum Planning Hub (إعداد الخطة السنوية والخطة اليومية) */}
      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub />
      )}

      {/* Educational Supervisors Management Tab (إدارة المشرفين التربويين والاختصاصيين) */}
      {(activeTab === 'supervisors' || activeTab === 'supervision') && (
        <SupervisorManagementHub embeddedMode={true} />
      )}

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {/* Interactive Challenges & Competitions Tab */}
      {activeTab === 'challenges' && <InteractiveChallengesManager />}

      {/* Certificates & Grade Management Tab */}
      {activeTab === 'certificates' && <StudentCertificateManager />}

      {/* Official Exam Management & Electronic Grading Tab (الامتحانات وتصحيحها ورصد الدرجات) */}
      {activeTab === 'exams' && <ExamManagementHub userRole="admin" />}

      {/* Digital Library & Curriculum Management Tab (المكتبة والمحاضرات الرقمية) */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <DigitalLibraryHub
            userRole="admin"
            onOpenUploadModal={() => setIsUploadPdfModalOpen(true)}
          />
        </div>
      )}

      {/* Graduates Tab */}
      {activeTab === 'graduates' && (
        <GraduatesView onOpenPromotionModal={() => setIsPromotionModalOpen(true)} />
      )}

      {/* Overview Tab */}
      {(activeTab === 'overview' || !activeTab) && (
        <div className="space-y-6">

          {/* 1. School Main Homepage Overview Component (ثانوية ميسان للمتميزات) */}
          <SchoolHomeOverview />

          {/* 2. Hero Action Bar Tile (الإجراءات السريعة لإدارة المدرسة) */}
          <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'الإجراءات السريعة لإدارة المدرسة:' : 'Quick Administrative Actions:'}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">ثانوية ميسان للمتميزات - لوحة التحكم الشاملة</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsAddTeacherOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-indigo-950 font-bold text-xs shadow-sm hover:bg-indigo-50 flex items-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>{t.addTeacher}</span>
              </button>

              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t.addStudent}</span>
              </button>

              <button
                onClick={() => setIsQuickEditPrincipalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>{lang === 'ar' ? 'تعديل اسم مديرة المدرسة ✍️' : 'Edit Principal Name ✍️'}</span>
              </button>

              <button
                onClick={() => setIsSupervisorHubOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs shadow-md border border-indigo-400/30 flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'إدارة المشرفين التربويين 🏛️' : 'Educational Supervisors 🏛️'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  {supervisors.length}
                </span>
              </button>

              <button
                onClick={() => setIsWeeklyTimetableOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <CalendarDays className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'جدول الدروس الأسبوعي 🗓️' : 'Weekly Timetable 🗓️'}</span>
              </button>

              <button
                onClick={() => dispatchCustomEvent('switch-tab', { tab: 'users' })}
                className="px-4 py-2.5 rounded-2xl bg-indigo-950 hover:bg-slate-900 text-white font-black text-xs shadow-md border border-indigo-400/40 flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'إدارة المستخدمين والرموز 🔑' : 'Users & Passcodes 🔑'}</span>
              </button>

              <button
                onClick={() => {
                  setEditAdminInitialTab('all');
                  setIsEditAdminDataOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{lang === 'ar' ? 'تعديل بيانات الإدارة والرؤية 👑' : 'Edit Admin & Vision 👑'}</span>
              </button>

              <button
                onClick={exportDataJSON}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{t.exportBackup}</span>
              </button>
            </div>
          </div>

          {/* 3. Bento Grid Quick Stat Cards (البطاقات والاحصائيات) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{t.totalTeachers}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{teachers.length}</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {lang === 'ar' ? 'هيئة تدريسية عالية الكفاءة' : 'High quality faculty'}
                </span>
              </div>
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{t.totalStudents}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{students.length}</h3>
                <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-1">
                  <Award className="w-3 h-3" />
                  {lang === 'ar' ? 'طالبات متميزات متفوقات' : 'Gifted Girls'}
                </span>
              </div>
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{t.totalExams}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{exams.length}</h3>
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {lang === 'ar' ? 'تصحيح تلقائي مع منع الغش' : 'Auto-graded with anti-cheat'}
                </span>
              </div>
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{t.attendanceRate}</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">98.4%</h3>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                  {lang === 'ar' ? 'متابعة يومية وتنبيهات فورية' : 'Daily monitoring'}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* 3.5 Dedicated Principal & Administrative Leadership Card (بطاقة قيادة المدرسة وإدارة مديرة المدرسة) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-amber-500/30 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Left/Right info */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-md overflow-hidden">
                    <img
                      src={schoolAdminData.principalImageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80'}
                      alt={schoolAdminData.principalName || 'مديرة المدرسة'}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-amber-500 text-slate-950 rounded-full shadow-md">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                      🏛️ القيادة والإدارة المدرسية العليا
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      ثانوية ميسان للمتميزات
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>{schoolAdminData.principalName || 'الهام صبيح سعدون'}</span>
                    <span className="text-xs text-amber-400 font-medium">({schoolAdminData.principalBadge || `المديرة ${schoolAdminData.principalName || 'الهام صبيح سعدون'}`})</span>
                  </h3>

                  <p className="text-xs text-indigo-200 font-bold">
                    {schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات'}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{schoolAdminData.principalDegree || 'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsQuickEditPrincipalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Crown className="w-4 h-4 text-slate-950" />
                  <span>تعديل اسم وبيانات المديرة ✍️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSupervisorHubOpen(true)}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>المشرفين التربويين 🏛️ ({supervisors.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditAdminInitialTab('vision');
                    setIsEditAdminDataOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>الرؤية والرسالة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditAdminInitialTab('certBranding');
                    setIsEditAdminDataOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>توقيع الشهادات والوثائق</span>
                </button>
              </div>

            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class GPA Overview Bar Chart */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>
                  {lang === 'ar' ? 'متوسط المعدلات الدراسية حسب الصفوف:' : 'Average GPA per Grade Level:'}
                </span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[90, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px' }}
                    />
                    <Bar dataKey="avgGpa" fill="#4f46e5" radius={[8, 8, 0, 0]} name="المعدل الأكاديمي %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Status Pie Chart */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                <span>
                  {lang === 'ar' ? 'ملخص تحصيل الرسوم والاشتراكات المالية:' : 'Tuition & Fee Collections:'}
                </span>
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialSummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {financialSummaryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold">
                <span className="text-emerald-600">● مكتمل الدفع</span>
                <span className="text-amber-600">● جزئي</span>
                <span className="text-rose-600">● غير مدفوع</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Teachers Directory Tab */}
      {activeTab === 'teachers' && (
        <div className="space-y-4 font-arabic">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث عن مدرسة، المادة، أو رقم الهاتف...' : 'Search teachers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            {/* Alphabetical & Custom Sorting Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>ترتيب الأسماء:</span>
                </span>
                
                <button
                  type="button"
                  onClick={() => setTeacherSortMode('alpha-asc')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                    teacherSortMode === 'alpha-asc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                  title="ترتيب أسماء الهيئة التدريسية أبجدياً تصاعدياً (أ إلى ي)"
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  <span>أبجدياً (أ ← ي)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTeacherSortMode('alpha-desc')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                    teacherSortMode === 'alpha-desc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                  title="ترتيب أسماء الهيئة التدريسية أبجدياً تنازلياً (ي إلى أ)"
                >
                  <ArrowUpZA className="w-3.5 h-3.5" />
                  <span>أبجدياً (ي ← أ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTeacherSortMode('subject')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                    teacherSortMode === 'subject'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                  title="ترتيب حسب المادة الدراسية"
                >
                  <span>حسب المادة</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddTeacherOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.addTeacher}</span>
              </button>
            </div>
          </div>

          {/* Directory Summary Bar */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span className="font-semibold">
              إجمالي كادر الهيئة التدريسية: <strong className="text-slate-900 font-mono">{filteredTeachers.length}</strong> مدرسة
            </span>
            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {teacherSortMode === 'alpha-asc' && '🔤 مرتبة أبجدياً: تصاعدياً (أ - ي)'}
              {teacherSortMode === 'alpha-desc' && '🔤 مرتبة أبجدياً: تنازلياً (ي - أ)'}
              {teacherSortMode === 'subject' && '📚 مرتبة حسب المادة والتخصص'}
              {teacherSortMode === 'default' && '📋 الترتيب الافتراضي'}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer select-none hover:bg-indigo-50/60 transition-colors"
                    onClick={() => setTeacherSortMode(teacherSortMode === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc')}
                    title="انقري للترتيب الأبجدي"
                  >
                    <div className="flex items-center gap-1.5 text-indigo-950">
                      <span>{t.name} (الاسم الكامل)</span>
                      {teacherSortMode === 'alpha-asc' ? (
                        <ArrowDownAZ className="w-4 h-4 text-indigo-600" />
                      ) : teacherSortMode === 'alpha-desc' ? (
                        <ArrowUpZA className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer select-none hover:bg-indigo-50/60 transition-colors"
                    onClick={() => setTeacherSortMode(teacherSortMode === 'subject' ? 'alpha-asc' : 'subject')}
                    title="انقري للترتيب حسب المادة"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.subject}</span>
                      {teacherSortMode === 'subject' ? (
                        <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5">{t.phone}</th>
                  <th className="p-3.5">{lang === 'ar' ? 'الصفوف المكلفة بها' : 'Assigned Grades'}</th>
                  <th className="p-3.5">{t.status}</th>
                  <th className="p-3.5 text-center">{lang === 'ar' ? 'الإجراءات والتراخيص' : 'Actions & Permissions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{tech.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{tech.email}</div>
                    </td>
                    <td className="p-3.5 text-indigo-700 font-bold">{tech.subject}</td>
                    <td className="p-3.5 font-mono text-slate-600">{tech.phone}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {tech.assignedGrades.map((g) => (
                          <span
                            key={g}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit ${
                          tech.status === 'محظور'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : tech.status === 'مقيد الوصول'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : tech.status === 'في إجازة'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {tech.status === 'محظور' && <Ban className="w-3 h-3 text-rose-600" />}
                        {tech.status === 'مقيد الوصول' && <Lock className="w-3 h-3 text-amber-600" />}
                        {tech.status === 'نشط' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{tech.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit button */}
                        <button
                          onClick={() => setEditModalConfig({ isOpen: true, type: 'teacher', data: tech })}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                          title={getTeacherAccountLabel(tech, undefined, true)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Quick Status Toggle */}
                        {tech.status === 'نشط' ? (
                          <button
                            onClick={() => updateTeacher(tech.id, { status: 'مقيد الوصول' })}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all"
                            title={isMaleTeacher(tech) ? 'تقييد وصول المدرس' : 'تقييد وصول المدرسة'}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTeacher(tech.id, { status: 'نشط' })}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                            title="تنشيط الحساب وإلغاء القيد"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {tech.status !== 'محظور' ? (
                          <button
                            onClick={() => updateTeacher(tech.id, { status: 'محظور' })}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all"
                            title={isMaleTeacher(tech) ? 'حظر حساب المدرس' : 'حظر حساب المدرسة'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTeacher(tech.id, { status: 'نشط' })}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                            title="فك الحظر عن الحساب"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => setUserToDelete({ type: 'teacher', id: tech.id, name: tech.name })}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-all"
                          title={isMaleTeacher(tech) ? 'حذف حساب المدرس نهائياً' : 'حذف حساب المدرسة نهائياً'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Students Directory Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4 font-arabic">
          {/* Class & Section Breakdown Grid Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-xl space-y-4 border border-indigo-800/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
                  <GraduationCap className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>توزيع وإحصائيات الطالبات حسب الصفوف والشعب الدراسية</span>
                  </h3>
                  <p className="text-xs text-indigo-200">
                    اضغطي على أي صف دراسي أو شعبة (أ، ب، ج، د) لعرض قائمة وإحصائيات طالبتها فوراً
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                <span className="text-xs text-indigo-200">إجمالي طالبات المدرسة:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{students.length} طالبة</span>
              </div>
            </div>

            {/* Grade Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {gradeSectionStats.map((item) => {
                const isSelectedGrade = selectedGradeFilter === item.grade;
                return (
                  <div
                    key={item.grade}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                      isSelectedGrade
                        ? 'bg-indigo-600/40 border-indigo-400 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          if (isSelectedGrade && selectedSectionFilter === 'all') {
                            setSelectedGradeFilter('all');
                          } else {
                            setSelectedGradeFilter(item.grade);
                            setSelectedSectionFilter('all');
                          }
                        }}
                        className="font-bold text-xs text-indigo-100 hover:text-white flex items-center gap-1.5 text-right"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.grade}</span>
                      </button>

                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-white/15 text-white border border-white/10">
                        {item.total} طالبة
                      </span>
                    </div>

                    {/* Section Breakdown Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {(['أ', 'ب', 'ج', 'د'] as const).map((sec) => {
                        const secCount =
                          sec === 'أ'
                            ? item.secA
                            : sec === 'ب'
                            ? item.secB
                            : sec === 'ج'
                            ? item.secC
                            : item.secD;
                        const isSelectedSec = isSelectedGrade && selectedSectionFilter === sec;
                        return (
                          <button
                            key={sec}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelectedSec) {
                                setSelectedSectionFilter('all');
                              } else {
                                setSelectedGradeFilter(item.grade);
                                setSelectedSectionFilter(sec);
                              }
                            }}
                            className={`flex-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all border text-center flex items-center justify-between ${
                              isSelectedSec
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm scale-[1.03]'
                                : secCount > 0
                                ? 'bg-white/10 text-slate-100 border-white/10 hover:bg-indigo-500/40'
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span>شعبة ({sec})</span>
                            <span className="font-mono">{secCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Bar & Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث باسم الطالبة، الرقم الوطني، أو اسم ولي الأمر...' : 'Search students...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Select Grade Dropdown */}
              <select
                value={selectedGradeFilter}
                onChange={(e) => {
                  setSelectedGradeFilter(e.target.value);
                  if (e.target.value === 'all') setSelectedSectionFilter('all');
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">جميع الصفوف ({students.length} طالبة)</option>
                {ALL_GRADES_LIST.map((grade) => {
                  const cnt = students.filter((s) => s.gradeLevel === grade).length;
                  return (
                    <option key={grade} value={grade}>
                      {grade} ({cnt} طالبة)
                    </option>
                  );
                })}
              </select>

              {/* Select Section Dropdown */}
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">جميع الشعب</option>
                <option value="أ">شعبة أ</option>
                <option value="ب">شعبة ب</option>
                <option value="ج">شعبة ج</option>
                <option value="د">شعبة د</option>
              </select>

              <button
                onClick={() => setIsPromotionModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span>ترحيل ونقل الطالبات بين الصفوف 🎓</span>
              </button>

              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t.addStudent}</span>
              </button>
            </div>
          </div>

          {/* Active Filter Badge Bar */}
          {(selectedGradeFilter !== 'all' || selectedSectionFilter !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  المعروض حالياً:
                  {selectedGradeFilter !== 'all' && (
                    <span className="mx-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200">
                      {selectedGradeFilter}
                    </span>
                  )}
                  {selectedSectionFilter !== 'all' && (
                    <span className="mx-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                      شعبة ({selectedSectionFilter})
                    </span>
                  )}
                  {searchQuery && <span className="mx-1 text-slate-600">بحث: "{searchQuery}"</span>}
                  <span className="font-mono text-slate-600 mr-2">({filteredStudents.length} طالبة)</span>
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedGradeFilter('all');
                  setSelectedSectionFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-1 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء التصفية (عرض الجميع)</span>
              </button>
            </div>
          )}

          {/* Student Names Table */}
          {filteredStudents.length > 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t.name}</th>
                    <th className="p-3.5">{t.gradeLevel}</th>
                    <th className="p-3.5">{t.gpa}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'ولي الأمر ورقم الهاتف' : 'Parent Contact'}</th>
                    <th className="p-3.5">{t.status}</th>
                    <th className="p-3.5 text-center">{lang === 'ar' ? 'الإجراءات والتراخيص' : 'Actions & Permissions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{std.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">الرقم الوطني: {std.nationalId}</div>
                        {/* Badges preview */}
                        {((std.shieldsAndBadges && std.shieldsAndBadges.length > 0)
                          ? std.shieldsAndBadges.map((s) => s.title)
                          : (std.badges || [])
                        ).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {((std.shieldsAndBadges && std.shieldsAndBadges.length > 0)
                              ? std.shieldsAndBadges.map((s) => s.title)
                              : (std.badges || [])
                            ).slice(0, 2).map((bTitle, bIdx) => {
                              const bTheme = getShieldThemeConfig(bTitle);
                              return (
                                <span
                                  key={bIdx}
                                  className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md flex items-center gap-0.5"
                                  title={bTitle}
                                >
                                  <span>{bTheme.icon}</span>
                                  <span className="truncate max-w-[120px]">{bTitle}</span>
                                </span>
                              );
                            })}
                            {((std.shieldsAndBadges?.length || std.badges?.length || 0) > 2) && (
                              <span className="text-[9px] font-bold text-slate-500">
                                +{(std.shieldsAndBadges?.length || std.badges?.length || 0) - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-indigo-700 font-bold">
                        {std.gradeLevel} - شعبة ({std.section})
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{std.gpa}%</td>
                      <td className="p-3.5 text-slate-700">
                        <div>{std.parentName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{std.parentPhone}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit ${
                            std.status === 'محظورة'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : std.status === 'مقيدة الوصول'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : std.status === 'مؤجلة'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {std.status === 'محظورة' && <Ban className="w-3 h-3 text-rose-600" />}
                          {std.status === 'مقيدة الوصول' && <Lock className="w-3 h-3 text-amber-600" />}
                          {std.status === 'منتظمة' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{std.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Student ID Card & Shields Award Button */}
                          <button
                            onClick={() => setSelectedIdCardStudent(std)}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="عرض وطباعة البطاقة التعريفية وإدراج الدروع والأوسمة"
                          >
                            <span>🪪</span>
                            <span className="hidden sm:inline">البطاقة والأوسمة</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditModalConfig({ isOpen: true, type: 'student', data: std })}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                            title="تعديل بيانات الطالبة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Quick Restrict Toggle */}
                          {std.status === 'منتظمة' ? (
                            <button
                              onClick={() => updateStudent(std.id, { status: 'مقيدة الوصول' })}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all"
                              title="تقييد وصول الطالبة"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStudent(std.id, { status: 'منتظمة' })}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                              title="تنشيط الطالبة وإلغاء القيد"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Block/Ban Toggle */}
                          {std.status !== 'محظورة' ? (
                            <button
                              onClick={() => updateStudent(std.id, { status: 'محظورة' })}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all"
                              title="حظر حساب الطالبة"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStudent(std.id, { status: 'منتظمة' })}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                              title="فك الحظر عن الحساب"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => setUserToDelete({ type: 'student', id: std.id, name: std.name })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-all"
                            title="حذف سجل الطالبة نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200/80 rounded-3xl space-y-3 shadow-sm">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">
                لا توجد طالبات مطابقة للتصفية المختارة
              </h4>
              <p className="text-xs text-slate-400">
                جربي اختيار صف أو شعبة أخرى أو إلغاء فلتر التصفية
              </p>
              <button
                onClick={() => {
                  setSelectedGradeFilter('all');
                  setSelectedSectionFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
              >
                عرض جميع الطالبات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Parents Directory Tab */}
      {activeTab === 'parents' && (
        <div className="space-y-4 font-arabic">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>سجل أولياء الأمور وتراخيص المتابعة:</span>
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl font-bold border border-indigo-200">
              إجمالي أولياء الأمور: {parents.length}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">اسم ولي الأمر</th>
                  <th className="p-3.5">رقم الهاتف والبريد</th>
                  <th className="p-3.5">الطالبة التابعة</th>
                  <th className="p-3.5">الصف الدراسي</th>
                  <th className="p-3.5">حالة الحساب</th>
                  <th className="p-3.5 text-center">الإجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parents.map((prt) => (
                  <tr key={prt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{prt.name}</td>
                    <td className="p-3.5 text-slate-700">
                      <div className="font-mono">{prt.phone}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{prt.email}</div>
                    </td>
                    <td className="p-3.5 font-bold text-indigo-700">{prt.studentName}</td>
                    <td className="p-3.5 text-slate-600">{prt.gradeLevel}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit ${
                          prt.status === 'محظور'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : prt.status === 'مقيد الوصول'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {prt.status === 'محظور' && <Ban className="w-3 h-3 text-rose-600" />}
                        {prt.status === 'مقيد الوصول' && <Lock className="w-3 h-3 text-amber-600" />}
                        {(!prt.status || prt.status === 'نشط') && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{prt.status || 'نشط'}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditModalConfig({ isOpen: true, type: 'parent', data: prt })}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                          title="تعديل بيانات ولي الأمر"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {(!prt.status || prt.status === 'نشط') ? (
                          <button
                            onClick={() => updateParent(prt.id, { status: 'مقيد الوصول' })}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all"
                            title="تقييد الوصول"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateParent(prt.id, { status: 'نشط' })}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                            title="تنشيط الحساب"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {prt.status !== 'محظور' ? (
                          <button
                            onClick={() => updateParent(prt.id, { status: 'محظور' })}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all"
                            title="حظر ولي الأمر"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateParent(prt.id, { status: 'نشط' })}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                            title="فك الحظر"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setUserToDelete({ type: 'parent', id: prt.id, name: prt.name })}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-all"
                          title="حذف حساب ولي الأمر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Management Tab (Admin / Principal View) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 font-arabic">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner">
            <button
              onClick={() => setAttSubTab('disciplinary')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                attSubTab === 'disciplinary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>🚨 لائحة الإنذارات والغيابات وتبريرها</span>
            </button>

            <button
              onClick={() => setAttSubTab('review_edit')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                attSubTab === 'review_edit'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-300" />
              <span>📝 مراجعة وتدقيق وتعديل سجلات الأيام السابقة</span>
            </button>

            <button
              onClick={() => setAttSubTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                attSubTab === 'daily'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-indigo-300" />
              <span>📋 رصد وتثبيت الحضور اليومي للشعب</span>
            </button>
          </div>

          {/* Sub-tab 1: Disciplinary & Ministry Warnings Panel */}
          {attSubTab === 'disciplinary' && <DisciplinaryAttendancePanel />}

          {/* Sub-tab 2: Review and Edit Past Attendance Records Panel */}
          {attSubTab === 'review_edit' && <AttendanceHistoryReviewPanel />}

          {/* Sub-tab 3: Daily Class Attendance Recording */}
          {attSubTab === 'daily' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 font-arabic">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    <span>رصد وتتبع الحضور اليومي للطالبات (حسب الشعبة):</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تنسيق سجلات الحضور والغياب اليومي لجميع الصفوف والشعب مع صلاحيات الرصد المباشر من الإدارة
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Date */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold">التاريخ:</span>
                    <input
                      type="date"
                      value={adminAttDate}
                      onChange={(e) => setAdminAttDate(e.target.value)}
                      className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  {/* Grade Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold">الصف:</span>
                    <select
                      value={adminAttGrade}
                      onChange={(e) => setAdminAttGrade(e.target.value as GradeLevel)}
                      className="bg-transparent text-indigo-700 font-bold text-xs focus:outline-none cursor-pointer"
                    >
                      {ALL_GRADES_LIST.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Selector (الشعبة) */}
                  <div className="flex items-center gap-1.5 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-sm">
                    <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                      🏫 الشعبة:
                    </span>
                    <select
                      value={adminAttSection}
                      onChange={(e) => setAdminAttSection(e.target.value)}
                      className="bg-transparent text-indigo-900 font-extrabold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="الكل">الكل (جميع الشعب)</option>
                      <option value="أ">شعبة ( أ )</option>
                      <option value="ب">شعبة ( ب )</option>
                      <option value="جـ">شعبة ( جـ )</option>
                      <option value="د">شعبة ( د )</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Bulk Actions & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700">إجراءات سريعة للشعبة:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = students.filter((s) => s.gradeLevel === adminAttGrade && (adminAttSection === 'الكل' || s.section === adminAttSection));
                      const newMap = { ...adminAttMap };
                      filtered.forEach((std) => { newMap[std.id] = 'حاضرة'; });
                      setAdminAttMap(newMap);
                    }}
                    className="px-3 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-all shadow-sm"
                  >
                    ✅ تحديد الكل حاضر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = students.filter((s) => s.gradeLevel === adminAttGrade && (adminAttSection === 'الكل' || s.section === adminAttSection));
                      const newMap = { ...adminAttMap };
                      filtered.forEach((std) => { newMap[std.id] = 'غائبة'; });
                      setAdminAttMap(newMap);
                    }}
                    className="px-3 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-[11px] font-bold transition-all shadow-sm"
                  >
                    🚨 تحديد الكل غائب
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <span>طالبات الشعبة:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs border border-indigo-200">
                    {students.filter((s) => s.gradeLevel === adminAttGrade && (adminAttSection === 'الكل' || s.section === adminAttSection)).length} طالبة
                  </span>
                </div>
              </div>

              {/* Students Grid */}
              <div className="space-y-3">
                {(() => {
                  const filteredList = students.filter(
                    (s) => s.gradeLevel === adminAttGrade && (adminAttSection === 'الكل' || s.section === adminAttSection)
                  );

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="text-sm font-bold text-slate-600">
                          لا توجد طالبات مسجلات في {adminAttGrade} - {adminAttSection === 'الكل' ? 'جميع الشعب' : `شعبة (${adminAttSection})`}
                        </p>
                      </div>
                    );
                  }

                  return filteredList.map((std) => {
                    const currentStatus = adminAttMap[std.id] || 'حاضرة';
                    return (
                      <div
                        key={std.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 transition-all flex flex-wrap items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {std.section || 'أ'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{std.name}</h4>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-200">
                                شعبة ({std.section || 'أ'})
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5"> ولي الأمر: {std.parentName} ({std.parentPhone})</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(['حاضرة', 'غائبة', 'متأخرة', 'مجازة'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => setAdminAttMap({ ...adminAttMap, [std.id]: st })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                currentStatus === st
                                  ? st === 'حاضرة'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : st === 'غائبة'
                                    ? 'bg-rose-600 text-white shadow-md'
                                    : st === 'متأخرة'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">إرسال إشعار فوري وتحديث السجلات في نظام أولياء الأمور وتحديث مؤشرات الغياب</span>
                <button
                  onClick={() => {
                    const filtered = students.filter(
                      (s) => s.gradeLevel === adminAttGrade && (adminAttSection === 'الكل' || s.section === adminAttSection)
                    );
                    if (filtered.length === 0) return;
                    const records = filtered.map((std) => ({
                      date: adminAttDate,
                      studentId: std.id,
                      studentName: std.name,
                      gradeLevel: std.gradeLevel,
                      section: std.section || 'أ',
                      status: adminAttMap[std.id] || 'حاضرة',
                      subject: adminAttSubject,
                      markedByTeacher: 'إدارة المدرسة (المديرة)',
                      parentNotified: adminAttMap[std.id] === 'غائبة',
                    }));
                    logAttendance(records, {
                      teacherEmail: 'admin@maysan-gifted.edu.iq',
                      teacherName: 'إدارة المدرسة (المديرة)',
                    });
                    alert(`تم تثبيت تسجيل الحضور والغياب بنجاح لـ (${filtered.length}) طالبة وتحديث تراكم الغيابات ومستويات الإنذار الوزاري تلقائياً!`);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>حفظ وتثبيت الحضور للشعبة وتحديث المؤشرات</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'messages' && (
        <MessagingSystem embeddedMode={true} />
      )}

      {/* Financial Reports Tab */}
      {activeTab === 'financial' && (() => {
        const filteredFinancial = financial.filter((f) => {
          const matchesSearch =
            !financialSearchQuery ||
            f.studentName.toLowerCase().includes(financialSearchQuery.toLowerCase()) ||
            f.feeType.toLowerCase().includes(financialSearchQuery.toLowerCase());
          const matchesGrade = financialGradeFilter === 'all' || f.gradeLevel === financialGradeFilter;
          const matchesStatus = financialStatusFilter === 'all' || f.status === financialStatusFilter;
          return matchesSearch && matchesGrade && matchesStatus;
        });

        const totalRequired = financial.reduce((acc, item) => acc + item.totalAmount, 0);
        const totalPaid = financial.reduce((acc, item) => acc + item.paidAmount, 0);
        const totalRemaining = financial.reduce((acc, item) => acc + Math.max(0, item.totalAmount - item.paidAmount), 0);
        const collectionPercentage = totalRequired > 0 ? ((totalPaid / totalRequired) * 100).toFixed(1) : '100';

        return (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 font-arabic">
            
            {/* Header & Main Export & Add Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'إدارة التقارير المالية والرسوم الأكاديمية' : 'Financial Reports & Fee Management'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ar'
                    ? 'إمكانية تعديل السجلات المالية بالكامل مع احتساب المبلغ المتبقي وحالة السداد تلقائياً'
                    : 'Edit financial records with automatic balance and status calculations'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openAddFinancialModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إضافة سجل مالي جديد' : 'Add Fee Record'}</span>
                </button>

                <button
                  onClick={() => downloadTextOrAttachmentAsPdf('كشف_الحسابات_المالية_ثانوية_ميسان.pdf', 'كشف الحسابات والرسوم المالية الشامل', `كشف الحسابات والسجلات المالية الرسمية لثانوية ميسان للمتميزات\n\nتاريخ التصدير: ${new Date().toLocaleDateString('ar-IQ')}\nحالة السجلات: محدثة ومكتملة\n\nتتضمن هذا الملف كشوفات الرسوم الدراسية، أجور النقل المدرسي، الخدمات الإضافية، والاشتراكات المقررة.\n\nتم الإصدار والتنزيل إلكترونياً من لوحة الإدارة المالية.`)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="تنزيل كشف الحسابات المالية كملف PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تصدير كشف الحسابات' : 'Export Statement'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-sm transition-all cursor-pointer"
                  title="طباعة ورقية مباشرة لكشف الحسابات والرسوم المالية"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'طباعة ورقية (A4)' : 'Paper Print'}</span>
                </button>
              </div>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">إجمالي الرسوم الكلية المطلوب:</span>
                <span className="text-xl font-black font-mono text-slate-900 block">
                  {totalRequired.toLocaleString()} <span className="text-xs text-slate-500 font-normal">IQD</span>
                </span>
                <span className="text-[10px] text-slate-500 block">مستحقات كافة المراحل</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 block">إجمالي المبالغ المسددة والمدفوعة:</span>
                <span className="text-xl font-black font-mono text-emerald-700 block">
                  {totalPaid.toLocaleString()} <span className="text-xs text-emerald-600 font-normal">IQD</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block">مقبوضات الحسابات المدرسية</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">المبلغ المتبقي الكلي:</span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">تلقائي</span>
                </div>
                <span className="text-xl font-black font-mono text-amber-700 block">
                  {totalRemaining.toLocaleString()} <span className="text-xs text-amber-600 font-normal">IQD</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold block">محسوب (الكلي - المدفوع)</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                <span className="text-[11px] font-bold text-indigo-800 block">نسبة التحصيل المالي:</span>
                <span className="text-xl font-black font-mono text-indigo-700 block">
                  {collectionPercentage}%
                </span>
                <span className="text-[10px] text-indigo-700 font-bold block">مؤشر التحصيل الفعلي</span>
              </div>

            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث باسم الطالبة أو نوع الرسم المالي...' : 'Search by student name or fee...'}
                  value={financialSearchQuery}
                  onChange={(e) => setFinancialSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Grade Filter */}
                <select
                  value={financialGradeFilter}
                  onChange={(e) => setFinancialGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {ALL_GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={financialStatusFilter}
                  onChange={(e) => setFinancialStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">جميع حالات السداد</option>
                  <option value="مكتمل">مكتمل الدفع</option>
                  <option value="جزئي">سداد جزئي</option>
                  <option value="غير مدفوع">غير مدفوع</option>
                </select>
              </div>
            </div>

            {/* Financial Records Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t.name}</th>
                    <th className="p-3.5">{t.gradeLevel}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'نوع الرسم الدراسي' : 'Fee Type'}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'المبلغ الكلي (IQD)' : 'Total Amount'}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'المبلغ المدفوع (IQD)' : 'Paid Amount'}</th>
                    <th className="p-3.5 bg-indigo-50/70 text-indigo-900 font-black">
                      {lang === 'ar' ? 'المبلغ المتبقي (تلقائي)' : 'Remaining (Auto)'}
                    </th>
                    <th className="p-3.5">{t.status}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                    <th className="p-3.5 text-center">{lang === 'ar' ? 'الإجراءات والتعديل' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredFinancial.length > 0 ? (
                    filteredFinancial.map((f) => {
                      const remainingAmount = Math.max(0, f.totalAmount - f.paidAmount);
                      const isComplete = remainingAmount === 0 && f.totalAmount > 0;
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{f.studentName}</td>
                          <td className="p-3.5 text-indigo-700 font-medium">{f.gradeLevel}</td>
                          <td className="p-3.5 text-slate-700">{f.feeType}</td>
                          <td className="p-3.5 font-mono text-slate-900 font-bold">
                            {f.totalAmount.toLocaleString()} IQD
                          </td>
                          <td className="p-3.5 font-mono text-emerald-700 font-bold">
                            {f.paidAmount.toLocaleString()} IQD
                          </td>
                          {/* AUTO COMPUTED REMAINING AMOUNT CELL */}
                          <td className="p-3.5 font-mono font-bold bg-indigo-50/30">
                            {isComplete ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                0 IQD (مكتمل)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-extrabold flex items-center gap-1">
                                <span>{remainingAmount.toLocaleString()} IQD</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                f.status === 'مكتمل'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : f.status === 'جزئي'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">{f.dueDate || '2026-09-01'}</td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => openEditFinancialModal(f)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                                title="تعديل السجل المالي والمبالغ"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Quick Payment Add */}
                              <button
                                onClick={() => {
                                  const addPay = prompt(
                                    `تسديد دفعة مالية للطالبة (${f.studentName}):\nالمبلغ المتبقي الحالي: ${remainingAmount.toLocaleString()} دينار عراقي.\n\nأدخلي قيمة المبلغ الجديد المراد دفعه وتسديده:`
                                  );
                                  if (addPay && !isNaN(Number(addPay)) && Number(addPay) > 0) {
                                    const newPaid = f.paidAmount + Number(addPay);
                                    const newAutoStatus = newPaid >= f.totalAmount ? 'مكتمل' : 'جزئي';
                                    updateFinancialRecord(f.id, {
                                      paidAmount: newPaid,
                                      status: newAutoStatus,
                                      lastPaymentDate: new Date().toISOString().split('T')[0],
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                                title="إضافة دفعة سداد سريعة"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() =>
                                  setFinancialToDelete({
                                    id: f.id,
                                    studentName: f.studentName,
                                    feeType: f.feeType,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all"
                                title="حذف السجل المالي"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 space-y-2">
                        <CircleDollarSign className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-bold text-xs">لا توجد سجلات مالية مطابقة للبحث</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        );
      })()}

      {/* Backup & Security Tab */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ar' ? 'أمان البيانات وحفظ النسخ الاحتياطية السحابية:' : 'Data Security & Cloud Backup Settings:'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ar' ? 'توفير نسخة احتياطية دورية لضمان عدم فقدان السجلات الدراسية' : 'Regular backups prevent data loss'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <Download className="w-8 h-8 text-indigo-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">{t.exportBackup}</h4>
              <p className="text-xs text-slate-500">{lang === 'ar' ? 'تنزيل ملف JSON يحتوي جميع بيانات المدرسات والطالبات والدرجات' : 'Download JSON file containing all records'}</p>
              <button
                onClick={exportDataJSON}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
              >
                تصدير الآن
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">{t.importBackup}</h4>
              <p className="text-xs text-slate-500">{lang === 'ar' ? 'استرجاع البيانات من نسخة احتياطية سابقة' : 'Restore database from backup file'}</p>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                اختيار الملف
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-rose-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">{lang === 'ar' ? 'إعادة ضبط البيانات النموذجية' : 'Reset System Data'}</h4>
              <p className="text-xs text-slate-500">{lang === 'ar' ? 'إعادة تعيين قاعدة البيانات إلى البيانات النموذجية الأصلية' : 'Reset database to original default mock data'}</p>
              <button
                onClick={() => {
                  if (confirm(lang === 'ar' ? 'هل أنت متأكدة من إعادة ضبط البيانات لثانوية ميسان؟' : 'Are you sure you want to reset data?')) {
                    resetToDefaultData();
                  }
                }}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                إعادة ضبط البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External LMS & Platforms Integrations Tab */}
      {activeTab === 'integrations' && (
        <PlatformIntegrationsHub userRole="admin" />
      )}

      {/* Academic Reports & Statistical Analytics Hub */}
      {activeTab === 'reports' && (
        <AcademicReportsHub userRole="admin" />
      )}

      {/* Audit Log Viewer Tab */}
      {(activeTab === 'audit_logs' || activeTab === 'audit-logs' || activeTab === 'audit' || activeTab === 'logs') && (
        <AuditLogViewer />
      )}

      {/* Modals */}
      <AddTeacherModal isOpen={isAddTeacherOpen} onClose={() => setIsAddTeacherOpen(false)} />
      <AddStudentModal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalConfig.isOpen}
        onClose={() => setEditModalConfig({ ...editModalConfig, isOpen: false })}
        userType={editModalConfig.type}
        userData={editModalConfig.data}
      />

      {/* Confirm Delete User Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'ar' ? 'تأكيد حذف المستخدم نهائياً' : 'Confirm Permanent Deletion'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar'
                  ? `هل أنت متأكد من حذف حساب (${userToDelete.name}) نهائياً من سجلات المدرسة؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to permanently delete (${userToDelete.name})? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (userToDelete.type === 'teacher') deleteTeacher(userToDelete.id);
                  if (userToDelete.type === 'student') deleteStudent(userToDelete.id);
                  if (userToDelete.type === 'parent') deleteParent(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'ar' ? 'نعم، احذف الحساب' : 'Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Add Financial Record Modal */}
      {financialModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {financialModalConfig.mode === 'edit'
                      ? 'تعديل السجل المالي والرسوم للطالبة'
                      : 'إضافة سجل مالي رسم جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يتم احتساب المبلغ المتبقي وحالة السداد تلقائياً وبشكل موازٍ لمدخلاتك
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFinancialModalConfig({ isOpen: false, mode: 'add', data: null })}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinancial} className="space-y-4 text-xs">
              {/* Student Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الطالبة:</label>
                {financialModalConfig.mode === 'add' ? (
                  <select
                    value={finStudentId}
                    onChange={(e) => {
                      const selected = students.find((s) => s.id === e.target.value);
                      if (selected) {
                        setFinStudentId(selected.id);
                        setFinStudentName(selected.name);
                        setFinGradeLevel(selected.gradeLevel);
                      } else {
                        setFinStudentId(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- اختاري الطالبة من السجل المدرسي --</option>
                    {students.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.name} ({std.gradeLevel})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={finStudentName}
                    onChange={(e) => setFinStudentName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                )}
              </div>

              {/* Grade Level & Fee Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الصف الدراسي:</label>
                  <select
                    value={finGradeLevel}
                    onChange={(e) => setFinGradeLevel(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ALL_GRADES_LIST.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الرسم الدراسي:</label>
                  <input
                    type="text"
                    placeholder="مثال: رسوم الكتب، أنشطة المتميزات..."
                    value={finFeeType}
                    onChange={(e) => setFinFeeType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Total Amount & Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ الكلي المطلوب (دينار):</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={finTotalAmount}
                    onChange={(e) => setFinTotalAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المدفوع حالياً (دينار):</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={finPaidAmount}
                    onChange={(e) => setFinPaidAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Live Automatic Calculated Preview */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>احتساب المتبقي التلقائي المباشر:</span>
                  </span>
                  <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                    حساب آلي
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Auto Calculated Remaining Amount */}
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="text-[10px] text-slate-500 block">المبلغ المتبقي (تلقائياً):</span>
                    <span className="text-sm font-black font-mono text-indigo-700">
                      {Math.max(0, finTotalAmount - finPaidAmount).toLocaleString()} IQD
                    </span>
                  </div>

                  {/* Auto Calculated Status */}
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="text-[10px] text-slate-500 block">حالة السداد المحسوبة:</span>
                    <span
                      className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        finPaidAmount >= finTotalAmount && finTotalAmount > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : finPaidAmount > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {finPaidAmount >= finTotalAmount && finTotalAmount > 0
                        ? 'مكتمل الدفع ✓'
                        : finPaidAmount > 0
                        ? 'سداد جزئي ⏳'
                        : 'غير مدفوع ✕'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ الاستحقاق النهائي:</label>
                <input
                  type="date"
                  value={finDueDate}
                  onChange={(e) => setFinDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFinancialModalConfig({ isOpen: false, mode: 'add', data: null })}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{financialModalConfig.mode === 'edit' ? 'حفظ التعديلات' : 'إضافة السجل المالي'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Financial Record Dialog */}
      {financialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تأكيد حذف السجل المالي</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف سجل رسم ({financialToDelete.feeType}) للطالبة ({financialToDelete.studentName}) نهائياً؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setFinancialToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  deleteFinancialRecord(financialToDelete.id);
                  setFinancialToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف السجل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Supervisors Management Hub Modal */}
      <SupervisorManagementHub
        isOpen={isSupervisorHubOpen}
        onClose={() => setIsSupervisorHubOpen(false)}
      />

      {/* Quick Edit Principal Name & Leadership Modal */}
      <QuickEditPrincipalModal
        isOpen={isQuickEditPrincipalOpen}
        onClose={() => setIsQuickEditPrincipalOpen(false)}
        onOpenFullAdminModal={() => {
          setEditAdminInitialTab('all');
          setIsEditAdminDataOpen(true);
        }}
      />

      {/* Edit School Management & Vision Modal */}
      <EditSchoolAdminModal
        isOpen={isEditAdminDataOpen}
        onClose={() => setIsEditAdminDataOpen(false)}
        initialTab={editAdminInitialTab}
      />

      {/* Weekly Timetable Modal */}
      <WeeklyTimetableModal
        isOpen={isWeeklyTimetableOpen}
        onClose={() => setIsWeeklyTimetableOpen(false)}
      />

      {/* Student Promotion & Migration Modal */}
      <StudentPromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
      />

      {/* Official Student ID Card & Shields Management Modal */}
      <StudentIDCardModal
        isOpen={!!selectedIdCardStudent}
        onClose={() => setSelectedIdCardStudent(null)}
        student={selectedIdCardStudent}
      />

      {/* Upload Book / Lecture Modal */}
      <UploadPdfModal
        isOpen={isUploadPdfModalOpen}
        onClose={() => setIsUploadPdfModalOpen(false)}
        defaultSubject="الحاسوب"
      />

    </div>
  );
};
