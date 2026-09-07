/**
 * Academic Reports & Statistical Analytics Hub
 * ثانوية ميسان للمتميزات - جمهورية العراق
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Student,
  GradeLevel,
  ALL_GRADES_LIST,
  OFFICIAL_SUBJECTS_LIST,
  UserRole,
} from '../types';
import {
  generateAcademicReportData,
  exportAcademicReportToCsv,
  getReportTypeTitle,
  ReportType,
  ReportFilterOptions,
} from '../utils/academicReportGenerator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  FileText,
  Printer,
  Download,
  Filter,
  Search,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  GraduationCap,
  CalendarCheck,
  Building2,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Send,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  Percent,
  Check,
  ShieldCheck,
  Info,
  PenSquare,
  Crown,
} from 'lucide-react';
import { downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import { dispatchCustomEvent } from '../utils/events';
import { EditSchoolAdminModal } from './EditSchoolAdminModal';

interface AcademicReportsHubProps {
  userRole?: UserRole;
  preselectedStudentId?: string;
}

export const AcademicReportsHub: React.FC<AcademicReportsHubProps> = ({
  userRole = 'admin',
  preselectedStudentId,
}) => {
  const {
    students,
    teachers,
    certificates,
    attendance,
    exams,
    submissions,
    schoolAdminData,
    updateSchoolAdminData,
    lang,
    t,
  } = useApp();

  // Filters State
  const [reportType, setReportType] = useState<ReportType>('overall_performance');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  const [academicTerm, setAcademicTerm] = useState<'annual' | 'first_term' | 'mid_year' | 'second_term' | 'final_exam' | 'resit'>('annual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'gpa_desc' | 'gpa_asc' | 'name' | 'rank'>('gpa_desc');

  // Customization Toggles & Modals
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [activeViewMode, setActiveViewMode] = useState<'dashboard' | 'official_print_preview'>('dashboard');
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Compute Options Object
  const reportOptions: ReportFilterOptions = useMemo(() => ({
    reportType,
    gradeLevel: selectedGrade,
    section: selectedSection,
    subject: selectedSubject,
    academicTerm,
    selectedStudentId,
    includeCharts,
    includeRecommendations,
    includeOfficialSignatures: includeSignatures,
    academicYear: '2026 - 2027',
  }), [reportType, selectedGrade, selectedSection, selectedSubject, academicTerm, selectedStudentId, includeCharts, includeRecommendations, includeSignatures]);

  // Compute Analytics Data
  const summary = useMemo(() => {
    return generateAcademicReportData(
      students,
      teachers,
      certificates,
      attendance,
      exams,
      submissions,
      reportOptions
    );
  }, [students, teachers, certificates, attendance, exams, submissions, reportOptions]);

  // Filtered and Sorted Students List
  const displayStudents = useMemo(() => {
    let list = students.filter((s) => {
      if (selectedGrade !== 'all' && s.gradeLevel !== selectedGrade) return false;
      if (selectedSection !== 'all' && s.section !== selectedSection) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.nationalId && s.nationalId.includes(q)) ||
          s.parentName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'gpa_desc') {
      list.sort((a, b) => b.gpa - a.gpa);
    } else if (sortBy === 'gpa_asc') {
      list.sort((a, b) => a.gpa - b.gpa);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }

    return list;
  }, [students, selectedGrade, selectedSection, searchQuery, sortBy]);

  // Selected Student for Dossier
  const currentDossierStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const currentStudentCert = useMemo(() => {
    return certificates.find((c) => c.studentId === currentDossierStudent?.id);
  }, [certificates, currentDossierStudent]);

  // Handler: Export CSV
  const handleExportCsv = () => {
    const csvContent = exportAcademicReportToCsv(summary, displayStudents, certificates, reportOptions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_اكاديمي_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Export Official PDF
  const handleExportPdf = () => {
    const title = getReportTypeTitle(reportType);
    const gradeText = selectedGrade === 'all' ? 'كافة المراحل الدراسية' : selectedGrade;
    const sectionText = selectedSection === 'all' ? 'كافة الشعب' : `شعبة (${selectedSection})`;

    const textContent = `
جمهورية العراق - وزارة التربية
المديرية العامة لتربية ميسان
ثانوية ميسان للمتميزات

=======================================
${title}
=======================================
المرحلة الدراسية: ${gradeText}
الشعبة: ${sectionText}
الفترة المعتمدة: ${academicTerm}
تاريخ الإصدار: ${new Date().toLocaleDateString('ar-IQ')}
العام الدراسي: ${schoolAdminData.academicYearDefault || '2026 - 2027'}

---------------------------------------
الملخص الإحصائي العام:
- عدد الطالبات المشمولات: ${summary.filteredStudentsCount} طالبة
- المعدل العام التراكمي: ${summary.overallSchoolGpa}%
- نسبة النجاح العامة: ${summary.passRate}%
- عدد الطالبات المشمولات بالإعفاء: ${summary.generalExemptionsCount + summary.individualExemptionsCount}
- نسبة المواظبة والحضور: ${summary.attendanceRate}%
- أعلى معدل مسجل: ${summary.highestGpa}% (الطالبة: ${summary.topStudentName})
---------------------------------------

أبرز التوصيات التربوية والأكاديمية:
${summary.smartRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---------------------------------------
التواقيع والاعتمادات الإدارية الرسمية:
1. ${schoolAdminData.assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'}: ${schoolAdminData.assistantPrincipalName || 'زينب علي الموسوي'}
2. ${schoolAdminData.academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'}: ${schoolAdminData.academicSupervisorName || 'أ.د. حيدر جاسم الكناني'}
3. ${schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات'}: ${schoolAdminData.principalName || 'الهام صبيح سعدون'}
---------------------------------------

تم استخراج وتدقيق هذا التقرير آلياً عبر نظام إدارة ثانوية ميسان للمتميزات.
`;

    downloadTextOrAttachmentAsPdf(
      `التقرير_الاكاديمي_${reportType}_ثانوية_ميسان.pdf`,
      title,
      textContent
    );
  };

  // Report Types Config Array
  const reportTypeCards = [
    {
      id: 'overall_performance' as ReportType,
      title: 'الأداء التحصيلي والمعدلات',
      desc: 'تحليل متوسطات الـ GPA، نسب النجاح وتوزيع التقديرات',
      icon: BarChart3,
      badge: 'شامل',
      color: 'indigo',
    },
    {
      id: 'honor_roll' as ReportType,
      title: 'لوحة الشرف والأوائل',
      desc: 'قائمة الطالبات المتميزات الحاصلات على المراتب الأولى',
      icon: Award,
      badge: 'تكريم',
      color: 'amber',
    },
    {
      id: 'subject_mastery' as ReportType,
      title: 'تحليل المواد الدراسية',
      desc: 'مقارنة مخرجات ونسب التفوق لكل مادة أكاديمية',
      icon: BookOpen,
      badge: 'تخصصي',
      color: 'emerald',
    },
    {
      id: 'attendance_discipline' as ReportType,
      title: 'المواظبة والانضباط',
      desc: 'إحصائيات الحضور والغيابات والإنذارات الوزارية',
      icon: CalendarCheck,
      badge: 'سلوكي',
      color: 'purple',
    },
    {
      id: 'student_dossier' as ReportType,
      title: 'بطاقة التقرير الفردي',
      desc: 'ملف أكاديمي تفصيلي لطالبة محددة موجه لولي الأمر',
      icon: GraduationCap,
      badge: 'فردي',
      color: 'rose',
    },
    {
      id: 'ministry_statistical' as ReportType,
      title: 'الإحصاء الوزاري الرسمي',
      desc: 'جدول البيانات المعتمد لرفعه لمديرية تربية ميسان',
      icon: Building2,
      badge: 'وزاري',
      color: 'blue',
    },
    {
      id: 'comparative_terms' as ReportType,
      title: 'مقارنة الفصول الدراسية',
      desc: 'تتبع تطور المستوى بين الفصل 1 ونصف السنة والفصل 2',
      icon: TrendingUp,
      badge: 'تطوري',
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-6 font-arabic" ref={reportContainerRef}>
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            <span>منظومة التقارير الأكاديمية الذكية - ثانوية ميسان للمتميزات</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>إعداد وتوليد التقارير والتحليلات الأكاديمية</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              العام 2026 - 2027
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            استخراج فوري لتقارير التحصيل الدراسي، نسب النجاح، لوائح الشرف، ومطابقة البيانات لوزارة التربية
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>لوحة التحليل التفاعلي</span>
            </button>
            <button
              onClick={() => setActiveViewMode('official_print_preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewMode === 'official_print_preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة النموذج الوزاري A4</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="تصدير جدول التقرير كملف Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="تنزيل التقرير كملف PDF معتمد"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل PDF</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-sm transition-all cursor-pointer"
            title="طباعة ورقية مباشرة"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة فورية</span>
          </button>
        </div>
      </div>

      {/* Report Types Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 print:hidden">
        {reportTypeCards.map((rt) => {
          const Icon = rt.icon;
          const isSelected = reportType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`p-3.5 rounded-2xl text-right transition-all border flex flex-col justify-between space-y-2 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-200 text-indigo-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {rt.badge}
                </span>
              </div>
              <div>
                <h4
                  className={`text-xs font-black ${
                    isSelected ? 'text-indigo-950' : 'text-slate-800'
                  }`}
                >
                  {rt.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{rt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Configuration Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">
              معايير تصفية وتخصيص التقرير الأكاديمي ({getReportTypeTitle(reportType)}):
            </h3>
          </div>

          {/* Quick Stats in Filter */}
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
            <span>الطالبات المشمولات:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-black">
              {displayStudents.length} / {students.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Grade Level Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">الصف الدراسي:</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as GradeLevel | 'all')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">كافة الصفوف (الأول متوسط - السادس العلمي)</option>
              {ALL_GRADES_LIST.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">الشعبة:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">جميع الشعب (أ، ب، جـ، د)</option>
              <option value="أ">شعبة ( أ )</option>
              <option value="ب">شعبة ( ب )</option>
              <option value="جـ">شعبة ( جـ )</option>
              <option value="د">شعبة ( د )</option>
            </select>
          </div>

          {/* Academic Term / Period Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">الفترة / الفصل المعتمد:</label>
            <select
              value={academicTerm}
              onChange={(e) => setAcademicTerm(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-indigo-900 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="annual">السعي السنوي والنتيجة النهائية (شامل)</option>
              <option value="first_term">معدل درجات الفصل الأول</option>
              <option value="mid_year">امتحان نصف السنة الدراسي</option>
              <option value="second_term">معدل درجات الفصل الثاني</option>
              <option value="final_exam">الامتحان النهائي - الدور الأول</option>
              <option value="resit">الدور الثاني وما بعد الإكمال</option>
            </select>
          </div>

          {/* Subject or Student Selector depending on Report Type */}
          {reportType === 'student_dossier' ? (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الطالبة المستهدفة بالتقرير:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.gradeLevel} - شعبة {s.section})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">المادة الدراسية المحددة:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">كافة المواد المنهجية الرسمية</option>
                {OFFICIAL_SUBJECTS_LIST.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Feature Toggles & Search */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث باسم الطالبة أو الرقم الإحصائي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>تضمين الرسوم البيانية الإحصائية</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>تضمين التوصيات البيداغوجية الذكية</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>إدراج الأختام والتواقيع الرسمية</span>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Indicator Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي الطالبات:</span>
          <span className="text-xl font-black font-mono text-slate-900 block">
            {summary.filteredStudentsCount} <span className="text-xs text-slate-400 font-normal">طالبة</span>
          </span>
          <span className="text-[10px] text-indigo-600 font-bold block">
            {selectedGrade === 'all' ? 'جميع المراحل' : selectedGrade}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 block">المعدل العام التراكمي:</span>
          <span className="text-xl font-black font-mono text-emerald-700 block">
            {summary.overallSchoolGpa}%
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block">مؤشر التحصيل النموذجي</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-800 block">نسبة النجاح العامة:</span>
          <span className="text-xl font-black font-mono text-blue-700 block">
            {summary.passRate}%
          </span>
          <span className="text-[10px] text-blue-700 font-bold block">
            {summary.passCount} ناجحة من {summary.filteredStudentsCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-purple-800 block">مشمولات بالإعفاء:</span>
          <span className="text-xl font-black font-mono text-purple-700 block">
            {summary.generalExemptionsCount + summary.individualExemptionsCount}
          </span>
          <span className="text-[10px] text-purple-700 font-bold block">
            {summary.generalExemptionsCount} عام | {summary.individualExemptionsCount} فردي
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 block">أعلى معدل مسجل:</span>
          <span className="text-xl font-black font-mono text-amber-700 block">
            {summary.highestGpa}%
          </span>
          <span className="text-[10px] text-amber-800 font-bold block truncate" title={summary.topStudentName}>
            🥇 {summary.topStudentName}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-indigo-800 block">نسبة المواظبة والحضور:</span>
          <span className="text-xl font-black font-mono text-indigo-700 block">
            {summary.attendanceRate}%
          </span>
          <span className="text-[10px] text-indigo-700 font-bold block">
            {summary.studentsInWarningCount === 0 ? 'انضباط مدرسي ممتاز' : `${summary.studentsInWarningCount} في حالة إنذار`}
          </span>
        </div>

      </div>

      {/* Visual Analytics Charts (If Enabled) */}
      {includeCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Chart 1: Grade Distribution */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>توزيع المستويات والتقديرات الأكاديمية (Grade Distribution):</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">حسب معايير وزارة التربية</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.gradeDistribution}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} طالبة`, 'العدد']}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', direction: 'rtl' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {summary.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Subject Mastery Comparison */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>متوسطات الدرجات ونسب النجاح بالمواد العلمية:</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">مقارنة المواد الدراسية</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.subjectAnalytics}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="subjectName"
                    tick={{ fill: '#475569', fontSize: 9.5, fontWeight: 600 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${value}%`,
                      name === 'averageGrade' ? 'متوسط الدرجات' : 'نسبة النجاح',
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    formatter={(value) => (value === 'averageGrade' ? 'متوسط الدرجات' : 'نسبة النجاح')}
                  />
                  <Bar dataKey="averageGrade" fill="#4f46e5" radius={[4, 4, 0, 0]} name="averageGrade" />
                  <Bar dataKey="passPercentage" fill="#10b981" radius={[4, 4, 0, 0]} name="passPercentage" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Main Content View by Selected Report Type */}

      {/* 1. Overall Performance View */}
      {reportType === 'overall_performance' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>سجل الأداء والنتائج العامة للطالبات:</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                كشف درجات ومعدلات طالبات ثانوية ميسان للمتميزات وفق السجلات المعتمدة
              </p>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none"
              >
                <option value="gpa_desc">المعدل (من الأعلى للأدنى)</option>
                <option value="gpa_asc">المعدل (من الأدنى للأعلى)</option>
                <option value="name">أبجدياً (اسم الطالبة)</option>
              </select>
            </div>
          </div>

          {/* Students Performance Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">{t.name}</th>
                  <th className="p-3.5">{t.gradeLevel}</th>
                  <th className="p-3.5">الشعبة</th>
                  <th className="p-3.5 text-center">المعدل (GPA)</th>
                  <th className="p-3.5 text-center">التقدير الوزاري</th>
                  <th className="p-3.5 text-center">نوع الإعفاء</th>
                  <th className="p-3.5 text-center">النتيجة والقرار</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayStudents.length > 0 ? (
                  displayStudents.map((std, idx) => {
                    const cert = certificates.find((c) => c.studentId === std.id);
                    const isExempt = cert?.exemptionType && cert.exemptionType !== 'none';
                    return (
                      <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{std.name}</span>
                            {std.gpa >= 98 && (
                              <span className="text-amber-500" title="لوحة شرف الأوائل">👑</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            الرقم الوطني: {std.nationalId || std.id}
                          </span>
                        </td>
                        <td className="p-3.5 text-indigo-700 font-medium">{std.gradeLevel}</td>
                        <td className="p-3.5 font-bold text-slate-700">شعبة ({std.section || 'أ'})</td>
                        <td className="p-3.5 text-center font-mono font-black text-indigo-700 text-sm">
                          {std.gpa}%
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              std.gpa >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : std.gpa >= 80
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : std.gpa >= 70
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {cert?.appreciation || (std.gpa >= 90 ? 'امتياز' : std.gpa >= 80 ? 'جيد جداً' : 'جيد')}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {isExempt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                              {cert?.exemptionType === 'general' ? '⭐ إعفاء عام' : '✨ إعفاء فردي'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              cert?.status === 'راسبة'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : cert?.status === 'مكملة'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {cert?.status || (std.gpa >= 50 ? 'ناجحة' : 'راسبة')}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedStudentId(std.id);
                              setReportType('student_dossier');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all"
                          >
                            عرض البطاقة الفردية
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">
                      لا توجد طالبات مطابقة لمعايير البحث والتصفية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Honor Roll View */}
      {reportType === 'honor_roll' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>لوحة الشرف الأكاديمي وسجل المتميزات الأوائل:</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تكريم الطالبات الحاصلات على المراتب العليا ومعدلات الامتياز بثانوية ميسان للمتميزات
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span>🏆 معيار لوحة الشرف: معدل 90% فما فوق</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayStudents
              .filter((s) => s.gpa >= 90)
              .slice(0, 3)
              .map((std, idx) => (
                <div
                  key={std.id}
                  className={`p-5 rounded-3xl border relative overflow-hidden transition-all shadow-sm ${
                    idx === 0
                      ? 'bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-white border-amber-300'
                      : idx === 1
                      ? 'bg-gradient-to-br from-slate-200/40 via-slate-100/30 to-white border-slate-300'
                      : 'bg-gradient-to-br from-amber-700/10 via-orange-100/30 to-white border-amber-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/80 text-slate-800 border border-slate-200 shadow-xs">
                      المرتبة {idx === 1 ? 'الأولى' : idx === 2 ? 'الثانية' : 'الثالثة'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="text-base font-black text-slate-900">{std.name}</h4>
                    <p className="text-xs text-indigo-700 font-bold">
                      {std.gradeLevel} - شعبة ({std.section})
                    </p>
                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-emerald-700">
                        {std.gpa}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">المعدل العام</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Honor List Full Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
                <tr>
                  <th className="p-3.5 text-center w-12">المرتبة</th>
                  <th className="p-3.5">اسم الطالبة المتفوقة</th>
                  <th className="p-3.5">المرحلة والشعبة</th>
                  <th className="p-3.5 text-center">المعدل التراكمي</th>
                  <th className="p-3.5 text-center">الأوسمة والدروع الأكاديمية</th>
                  <th className="p-3.5 text-center">حالة الإعفاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayStudents
                  .filter((s) => s.gpa >= 90)
                  .map((std, idx) => (
                    <tr key={std.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3.5 text-center font-mono font-black text-amber-700">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{std.name}</span>
                        {idx < 3 && <span className="text-xs">⭐</span>}
                      </td>
                      <td className="p-3.5 text-indigo-700 font-medium">
                        {std.gradeLevel} ({std.section})
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-emerald-700 text-sm">
                        {std.gpa}%
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                            ⚡ درع التميز العلمي
                          </span>
                          {std.badges?.map((b, i) => (
                            <span key={i} className="text-xs" title={b}>
                              🎖️
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          مستحقة للإعفاء العام ✓
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Subject Mastery View */}
      {reportType === 'subject_mastery' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>تقرير تحليل مخرجات ونسب النجاح بالمواد الدراسية:</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مقارنة تفصيلية للأداء ومعدلات الإتقان في المقررات المنهجية لثانوية المتميزات
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المادة الدراسية</th>
                  <th className="p-3.5">أستاذة / أستاذ المادة</th>
                  <th className="p-3.5 text-center">متوسط الدرجات</th>
                  <th className="p-3.5 text-center">نسبة النجاح</th>
                  <th className="p-3.5 text-center">الناجحات</th>
                  <th className="p-3.5 text-center">الإكمال / الرسوب</th>
                  <th className="p-3.5 text-center">أعلى درجة</th>
                  <th className="p-3.5 text-center">المستوى العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.subjectAnalytics.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{sub.subjectName}</td>
                    <td className="p-3.5 text-slate-700">{sub.assignedTeacherName}</td>
                    <td className="p-3.5 text-center font-mono font-black text-indigo-700 text-sm">
                      {sub.averageGrade}%
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                      {sub.passPercentage}%
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-800">{sub.passCount}</td>
                    <td className="p-3.5 text-center font-mono text-rose-600 font-bold">{sub.failCount}</td>
                    <td className="p-3.5 text-center font-mono text-amber-700 font-bold">{sub.highestGrade}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          sub.averageGrade >= 85
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.averageGrade >= 70
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sub.averageGrade >= 85 ? 'ممتاز' : sub.averageGrade >= 70 ? 'جيد جداً' : 'يحتاج لمتابعة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Attendance & Discipline View */}
      {reportType === 'attendance_discipline' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
              <span>تقرير المواظبة والانتظام وسجل الغيابات:</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة التزام الطالبات ومستويات الإنذار الوزاري وفق اللائحة الانضباطية
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">اسم الطالبة</th>
                  <th className="p-3.5">الصف والشعبة</th>
                  <th className="p-3.5 text-center">الغياب بعذر</th>
                  <th className="p-3.5 text-center">الغياب بدون عذر</th>
                  <th className="p-3.5 text-center">الحصص الفائتة</th>
                  <th className="p-3.5 text-center">مستوى الإنذار</th>
                  <th className="p-3.5 text-center">ولي الأمر والهاتف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{std.name}</td>
                    <td className="p-3.5 text-indigo-700 font-medium">
                      {std.gradeLevel} ({std.section})
                    </td>
                    <td className="p-3.5 text-center font-mono">{std.excusedAbsenceDays || 0} أيام</td>
                    <td className="p-3.5 text-center font-mono font-bold text-rose-600">
                      {std.unexcusedAbsenceDays || 0} أيام
                    </td>
                    <td className="p-3.5 text-center font-mono">{std.totalMissedLessons || 0}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          std.warningLevel === 'إنذار نهائي' || std.warningLevel === 'مستحقة للفصل'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : std.warningLevel === 'إنذار أول'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {std.warningLevel || 'طبيعي (منتظمة)'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-600">
                      {std.parentName} ({std.parentPhone})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Student Dossier View (بطاقة التقرير الفردي الشاملة) */}
      {reportType === 'student_dossier' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>بطاقة التقرير الأكاديمي الشاملة للطالبة:</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                الملف الفردي المعتمد لدرجات ومواظبة الطالبة ({currentDossierStudent?.name})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  dispatchCustomEvent('send_student_report_notification', {
                    studentId: currentDossierStudent.id,
                    studentName: currentDossierStudent.name,
                  });
                  alert(`تم إرسال بطاقة التقرير الأكاديمي تلقائياً إلى ولي الأمر (${currentDossierStudent.parentName}) بنجاح!`);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التقرير لولي الأمر</span>
              </button>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-white border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {currentDossierStudent?.name?.[0] || 'ط'}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">{currentDossierStudent?.name}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>الرقم الامتحاني: <strong className="font-mono text-slate-800">{currentDossierStudent?.nationalId || currentDossierStudent?.id}</strong></span>
                  <span>•</span>
                  <span>المرحلة: <strong className="text-indigo-700">{currentDossierStudent?.gradeLevel}</strong></span>
                  <span>•</span>
                  <span>الشعبة: <strong className="text-slate-800">({currentDossierStudent?.section || 'أ'})</strong></span>
                </div>
              </div>
            </div>

            <div className="text-left bg-white px-4 py-2.5 rounded-xl border border-indigo-200/80 shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold block">المعدل العام التراكمي:</span>
              <span className="text-2xl font-black font-mono text-emerald-700 block">
                {currentDossierStudent?.gpa}%
              </span>
              <span className="text-[10px] text-indigo-700 font-bold block">
                {currentDossierStudent?.gpa >= 90 ? 'مرتبة الشرف (امتياز)' : 'أداء أكاديمي متفوق'}
              </span>
            </div>
          </div>

          {/* Student Subjects Breakdown */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المادة المنهجية</th>
                  <th className="p-3.5 text-center">الفصل الأول</th>
                  <th className="p-3.5 text-center">نصف السنة</th>
                  <th className="p-3.5 text-center">الفصل الثاني</th>
                  <th className="p-3.5 text-center font-bold text-indigo-900 bg-indigo-50/50">السعي السنوي</th>
                  <th className="p-3.5 text-center">الامتحان النهائي</th>
                  <th className="p-3.5 text-center font-black text-emerald-900 bg-emerald-50/50">الدرجة النهائية</th>
                  <th className="p-3.5 text-center">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentStudentCert?.subjects ? (
                  currentStudentCert.subjects.map((sub, idx) => {
                    const formatGradeCell = (val: number | null | undefined, customClass = '') => {
                      if (val === null || val === undefined || isNaN(Number(val))) return '-';
                      const num = Number(val);
                      if (num < 50) {
                        return <span className="text-red-600 font-black underline decoration-red-600 decoration-2 underline-offset-2 inline-block">{num}</span>;
                      }
                      return <span className={customClass}>{num}</span>;
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{sub.subjectName}</td>
                        <td className="p-3.5 text-center font-mono">{formatGradeCell(sub.firstTermAvg)}</td>
                        <td className="p-3.5 text-center font-mono">{formatGradeCell(sub.midYearGrade)}</td>
                        <td className="p-3.5 text-center font-mono">{formatGradeCell(sub.secondTermAvg)}</td>
                        <td className="p-3.5 text-center font-mono font-bold bg-indigo-50/30">
                          {formatGradeCell(sub.annualSaeiAvg, 'text-indigo-700 font-bold')}
                        </td>
                        <td className="p-3.5 text-center font-mono">{formatGradeCell(sub.finalExamGrade)}</td>
                        <td className="p-3.5 text-center font-mono font-black bg-emerald-50/30 text-sm">
                          {formatGradeCell(sub.finalGrade, 'text-emerald-700 font-black')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.finalGrade >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : sub.finalGrade >= 50
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sub.finalGrade >= 90 ? 'امتياز' : sub.finalGrade >= 50 ? 'ناجحة' : 'إكمال'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  OFFICIAL_SUBJECTS_LIST.map((subj, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{subj}</td>
                      <td className="p-3.5 text-center font-mono">98</td>
                      <td className="p-3.5 text-center font-mono">99</td>
                      <td className="p-3.5 text-center font-mono">97</td>
                      <td className="p-3.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30">98</td>
                      <td className="p-3.5 text-center font-mono">99</td>
                      <td className="p-3.5 text-center font-mono font-black text-emerald-700 bg-emerald-50/30 text-sm">98.5</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          امتياز
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Ministry Statistical View */}
      {reportType === 'ministry_statistical' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>التقرير الإحصائي الرسمي لمديرية التربية (وزارة التربية العراقية):</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بيان إحصائي رسمي بأعداد الطالبات، المدرسات، ونسب النجاح الشاملة لمدارس الموهوبين والمتميزين
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              كود المدرسة الوزاري: 84759729
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">توزيع الطالبات بحسب المراحل الدراسية:</h4>
              <div className="space-y-2">
                {ALL_GRADES_LIST.map((grade) => {
                  const count = students.filter((s) => s.gradeLevel === grade).length;
                  return (
                    <div key={grade} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100">
                      <span className="font-semibold text-slate-800">{grade}</span>
                      <span className="font-mono font-bold text-indigo-700">{count} طالبة</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">المؤشرات الوزارية للجودة الأكاديمية:</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700">إجمالي الهيئة التدريسية:</span>
                  <span className="font-bold font-mono text-slate-900">{teachers.length} مدرّسات</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700">نسبة الطالبات للمدرسات:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {(students.length / (teachers.length || 1)).toFixed(1)} طالبة / معلمة
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700">نسبة النجاح العامة المعتمدة:</span>
                  <span className="font-bold font-mono text-emerald-700">{summary.passRate}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700">المعدل العام التراكمي للمدرسة:</span>
                  <span className="font-bold font-mono text-indigo-700">{summary.overallSchoolGpa}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Comparative Terms View */}
      {reportType === 'comparative_terms' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
              <span>تقرير مقارنة الفصول الدراسية وتتبع التقدم الزمني:</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مقارنة تطور المعدلات العامة بين الفصل الأول، نصف السنة، الفصل الثاني، والامتحان النهائي
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">الفصل الأول:</span>
              <span className="text-xl font-black font-mono text-slate-900 block">97.8%</span>
              <span className="text-[10px] text-emerald-700 font-bold">بداية قوية ومستقرة</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">امتحان نصف السنة:</span>
              <span className="text-xl font-black font-mono text-slate-900 block">98.2%</span>
              <span className="text-[10px] text-emerald-700 font-bold">▲ +0.4% نمو إيجابي</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">الفصل الثاني:</span>
              <span className="text-xl font-black font-mono text-slate-900 block">98.5%</span>
              <span className="text-[10px] text-emerald-700 font-bold">▲ +0.3% تصاعد مستمر</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold text-emerald-900">النتيجة والسعي النهائي:</span>
              <span className="text-xl font-black font-mono text-emerald-700 block">{summary.overallSchoolGpa}%</span>
              <span className="text-[10px] text-emerald-700 font-bold">معدل التميز الختامي</span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Pedagogical Recommendations & AI Insights Section */}
      {includeRecommendations && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-indigo-800/80 pb-3">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-bold text-white">
              التحليل البيداغوجي الذكي والتوصيات الأكاديمية المقترحة:
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>أبرز نقاط القوة والإنجاز الموثقة:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {summary.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smart Action Recommendations */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>الخطوات والتوصيات التحسينية المقترحة:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {summary.smartRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Official Signatures & School Stamp Section */}
      {includeSignatures && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>التواقيع والاعتمادات الإدارية والأكاديمية الرسمية المعتمدة:</span>
            </h3>
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setIsEditStaffModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-indigo-200 self-start sm:self-auto"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>تعديل أسماء القيادات والتواقيع الإدارية</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs pt-2">
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-700 block">
                {schoolAdminData.assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'}
              </span>
              <div className="h-10 flex items-center justify-center font-arabic text-indigo-700 font-bold italic text-sm">
                {schoolAdminData.assistantPrincipalName || 'زينب علي الموسوي'}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">التوقيع والتدقيق الإداري</span>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-700 block">
                {schoolAdminData.academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'}
              </span>
              <div className="h-10 flex items-center justify-center font-arabic text-emerald-700 font-bold italic text-sm">
                {schoolAdminData.academicSupervisorName || 'أ.د. حيدر جاسم الكناني'}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">الاعتماد والمطابقة الوزارية</span>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 relative">
              <span className="font-bold text-slate-900 block">
                {schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات'}
              </span>
              <div className="h-10 flex items-center justify-center font-arabic text-amber-950 font-black text-sm italic">
                {schoolAdminData.principalName || 'الهام صبيح سعدون'}
              </div>
              <div className="text-[10px] text-amber-700 font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>ختم الإدارة الرسمي المعتمد ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit School Staff & Leadership Modal */}
      <EditSchoolAdminModal
        isOpen={isEditStaffModalOpen}
        onClose={() => setIsEditStaffModalOpen(false)}
      />

    </div>
  );
};
