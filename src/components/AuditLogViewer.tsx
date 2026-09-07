/**
 * Audit Log & System Activity Viewer Component
 * نظام سجل نشاط العمليات والرقابة الأمنية لثانوية ميسان للمتميزات
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogEntry, AuditActionType, AuditSeverity, AuditTargetCategory, UserRole } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Plus,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileJson,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Terminal,
  Lock,
  ArrowUpDown,
  BookOpen,
  GraduationCap,
  Users,
  CalendarCheck,
  FileCheck2,
  CircleDollarSign,
  Megaphone,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const {
    auditLogs = [],
    addAuditLog,
    deleteAuditLog,
    clearAuditLogs,
    exportAuditLogsJSON,
    exportAuditLogsCSV,
    schoolAdminData,
    currentUser,
    role,
    lang,
  } = useApp();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Manual Log Entry Modal State
  const [isAddManualLogOpen, setIsAddManualLogOpen] = useState(false);
  const [manualAction, setManualAction] = useState('');
  const [manualCategory, setManualCategory] = useState<AuditTargetCategory>('system');
  const [manualSeverity, setManualSeverity] = useState<AuditSeverity>('info');
  const [manualDetails, setManualDetails] = useState('');
  const [manualTargetName, setManualTargetName] = useState('');

  // Clear Confirmation Modal State
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Filtered and Sorted Logs
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Search Query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matches =
            log.action.toLowerCase().includes(query) ||
            log.userName.toLowerCase().includes(query) ||
            log.details.toLowerCase().includes(query) ||
            (log.targetName && log.targetName.toLowerCase().includes(query)) ||
            (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
            (log.deviceInfo && log.deviceInfo.toLowerCase().includes(query));
          if (!matches) return false;
        }

        // Category Filter
        if (selectedCategory !== 'all' && log.targetCategory !== selectedCategory) {
          return false;
        }

        // Action Type Filter
        if (selectedActionType !== 'all' && log.actionType !== selectedActionType) {
          return false;
        }

        // Role Filter
        if (selectedRole !== 'all' && log.userRole !== selectedRole) {
          return false;
        }

        // Severity Filter
        if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
          return false;
        }

        // Time Range Filter
        if (timeRange !== 'all') {
          const logDate = new Date(log.timestamp).getTime();
          const now = Date.now();
          if (timeRange === 'today') {
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            if (logDate < oneDayAgo) return false;
          } else if (timeRange === '7days') {
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            if (logDate < sevenDaysAgo) return false;
          } else if (timeRange === '30days') {
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
            if (logDate < thirtyDaysAgo) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [
    auditLogs,
    searchQuery,
    selectedCategory,
    selectedActionType,
    selectedRole,
    selectedSeverity,
    timeRange,
    sortOrder,
  ]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const todayCount = auditLogs.filter((l) => new Date(l.timestamp).getTime() >= oneDayAgo).length;
    const createCount = auditLogs.filter((l) => l.actionType === 'create').length;
    const updateCount = auditLogs.filter(
      (l) => l.actionType === 'update' || l.actionType === 'status_change' || l.actionType === 'grade_entry' || l.actionType === 'attendance_entry'
    ).length;
    const deleteCount = auditLogs.filter((l) => l.actionType === 'delete').length;
    const securityCount = auditLogs.filter(
      (l) => l.severity === 'danger' || l.severity === 'warning' || l.actionType === 'security'
    ).length;

    return { total, todayCount, createCount, updateCount, deleteCount, securityCount };
  }, [auditLogs]);

  // Helper for Severity Badges
  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>حرج / أمني</span>
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>تنبيه إداري</span>
          </span>
        );
      case 'success':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>نجاح العملية</span>
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>معلومات روتينية</span>
          </span>
        );
    }
  };

  // Helper for Category Icons
  const getCategoryIcon = (category: AuditTargetCategory) => {
    switch (category) {
      case 'students':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'teachers':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'parents':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'attendance':
        return <CalendarCheck className="w-4 h-4 text-amber-600" />;
      case 'exams':
      case 'grades':
        return <FileCheck2 className="w-4 h-4 text-blue-600" />;
      case 'certificates':
        return <FileCheck2 className="w-4 h-4 text-emerald-700" />;
      case 'finances':
        return <CircleDollarSign className="w-4 h-4 text-teal-600" />;
      case 'announcements':
        return <Megaphone className="w-4 h-4 text-orange-600" />;
      case 'disciplinary':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'security':
        return <Lock className="w-4 h-4 text-rose-700" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  // Helper for Category Name in Arabic
  const getCategoryNameAr = (category: AuditTargetCategory) => {
    const map: Record<AuditTargetCategory, string> = {
      users: 'إدارة المستخدمين',
      students: 'سجلات الطالبات',
      teachers: 'الهيئة التدريسية',
      parents: 'أولياء الأمور',
      attendance: 'الغياب والحضور',
      grades: 'الدرجات والتقييم',
      exams: 'الامتحانات الإلكترونية',
      certificates: 'الشهادات والنتائج',
      finances: 'الحسابات والرسوم',
      disciplinary: 'القرارات الانضباطية',
      system: 'النظام والنسخ الاحتياطي',
      security: 'الأمان والوصول',
      library: 'المكتبة الرقمية',
      announcements: 'الإعلانات والتعاميم',
    };
    return map[category] || category;
  };

  // Helper for Role Name in Arabic
  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">المديرة / الإدارة</span>;
      case 'teacher':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">مدرسة</span>;
      case 'student':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold">طالبة</span>;
      case 'parent':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">ولي أمر</span>;
      case 'supervisor':
        return <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold">مشرف تربوي</span>;
    }
  };

  // Handle Manual Log Submission
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAction.trim() || !manualDetails.trim()) return;

    addAuditLog({
      action: manualAction.trim(),
      actionType: 'settings_change',
      targetCategory: manualCategory,
      targetName: manualTargetName.trim() || 'توثيق إداري عام',
      details: manualDetails.trim(),
      severity: manualSeverity,
      userName: currentUser?.name || schoolAdminData.principalName || 'إدارة المدرسة',
      userId: currentUser?.id || 'admin-principal',
      userRole: role || 'admin',
      ipAddress: '192.168.1.10 (تسجيل إداري يدوي)',
      deviceInfo: 'لوحة تحكم الإدارة (الويب)',
    });

    setManualAction('');
    setManualDetails('');
    setManualTargetName('');
    setIsAddManualLogOpen(false);
  };

  // Format Date & Time in Arabic format
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        dateStr: date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' }),
        timeStr: date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  return (
    <div className="space-y-6 font-arabic animate-fadeIn">
      {/* 1. Header Banner & Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  سجل النشاط والرقابة الإدارية والأمنية (Audit Log)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  تتبع مباشر ومؤمن 🛡️
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                توثيق فوري لكافة العمليات والإجراءات التي يقوم بها المستخدمون في إدارة النظام مع تفاصيل الأجهزة والحسابات
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddManualLogOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
              title="إضافة قيد أو ملاحظة إدارية في السجل"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>إضافة توثيق إداري</span>
            </button>

            <button
              onClick={exportAuditLogsCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="تصدير السجل كملف Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={exportAuditLogsJSON}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="تصدير السجل كملف JSON"
            >
              <FileJson className="w-4 h-4" />
              <span>تصدير JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm print:hidden"
              title="طباعة تقرير الرقابة الإدارية"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة التقرير</span>
            </button>

            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all"
              title="تفريغ سجل العمليات"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>أرشفة وتفريغ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistical KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">إجمالي السجلات</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black font-mono text-slate-900">{stats.total}</p>
          <span className="text-[10px] text-slate-500 block">سجل موثق بالنظام</span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold">عمليات اليوم</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black font-mono text-indigo-900">{stats.todayCount}</p>
          <span className="text-[10px] text-indigo-600 font-bold block">خلال آخر 24 ساعة</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold">عمليات الإنشاء</span>
            <Plus className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black font-mono text-emerald-900">{stats.createCount}</p>
          <span className="text-[10px] text-emerald-600 font-bold block">إضافة طالبات / حسابات</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold">عمليات التعديل</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black font-mono text-blue-900">{stats.updateCount}</p>
          <span className="text-[10px] text-blue-600 font-bold block">درجات / حضور / بيانات</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold">عمليات الحذف</span>
            <Trash2 className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl font-black font-mono text-amber-900">{stats.deleteCount}</p>
          <span className="text-[10px] text-amber-700 font-bold block">إجراءات حساسة</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">الرقابة والأمان</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black font-mono text-rose-900">{stats.securityCount}</p>
          <span className="text-[10px] text-rose-600 font-bold block">تنبيهات وأذونات</span>
        </div>
      </div>

      {/* 3. Filter and Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم المستخدم، نوع العملية، الهدف، عنوان IP أو التفاصيل..."
              className="w-full pr-10 pl-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* View Switcher & Sorting */}
          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>عرض الجدول</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'timeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>المخطط الزمني</span>
              </button>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1 transition-all"
              title="تغيير ترتيب السجل زمنيًا"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">التصنيف الإداري:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">جميع التصنيفات ({auditLogs.length})</option>
              <option value="students">سجلات الطالبات</option>
              <option value="teachers">الهيئة التدريسية</option>
              <option value="parents">أولياء الأمور</option>
              <option value="attendance">الغياب والحضور</option>
              <option value="grades">الدرجات والتقييم</option>
              <option value="exams">الامتحانات الإلكترونية</option>
              <option value="certificates">الشهادات والنتائج</option>
              <option value="finances">الحسابات والرسوم</option>
              <option value="disciplinary">القرارات الانضباطية</option>
              <option value="system">النظام والنسخ الاحتياطي</option>
              <option value="security">الأمان والوصول</option>
              <option value="announcements">الإعلانات والتعاميم</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">نوع الإجراء:</label>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة أنواع الإجراءات</option>
              <option value="create">إنشاء وإضافة (Create)</option>
              <option value="update">تعديل وتحديث (Update)</option>
              <option value="delete">حذف (Delete)</option>
              <option value="auth">تسجيل دخول (Login)</option>
              <option value="status_change">تغيير حالة حساب (Status)</option>
              <option value="attendance_entry">رصد حضور وغياب</option>
              <option value="grade_entry">رصد درجات</option>
              <option value="certificate_issue">إصدار شهادات</option>
              <option value="disciplinary_action">إنذار / قرار إداري</option>
              <option value="export_data">تصدير بيانات / نسخ</option>
              <option value="security">أمان وحماية</option>
            </select>
          </div>

          {/* User Role Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">صفة المستخدم المنفذ:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الأدوار</option>
              <option value="admin">المديرة / الإدارة</option>
              <option value="teacher">المدرسات</option>
              <option value="student">الطالبات</option>
              <option value="parent">أولياء الأمور</option>
              <option value="supervisor">المشرف التربوي</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">مستوى الأهمية والخطورة:</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة المستويات</option>
              <option value="info">معلومات روتينية (Info)</option>
              <option value="success">نجاح العملية (Success)</option>
              <option value="warning">تنبيه إداري (Warning)</option>
              <option value="danger">حرج وأمني (Danger)</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">الفترة الزمنية:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة التواريخ</option>
              <option value="today">اليوم (آخر 24 ساعة)</option>
              <option value="7days">آخر 7 أيام</option>
              <option value="30days">آخر 30 يوم</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Log Content (Table View or Timeline View) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">المستخدم المنفذ</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">العملية والإجراء</th>
                  <th className="p-3.5">الهدف / المستهدف</th>
                  <th className="p-3.5">تفاصيل العملية</th>
                  <th className="p-3.5">مستوى الأهمية</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const { dateStr, timeStr } = formatDateTime(log.timestamp);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 text-xs">{timeStr}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{dateStr}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{log.userName}</span>
                          </div>
                          <div className="mt-0.5">{getRoleBadge(log.userRole)}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1">
                            {getCategoryIcon(log.targetCategory)}
                            <span>{getCategoryNameAr(log.targetCategory)}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block text-xs">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.actionType}</span>
                        </td>
                        <td className="p-3.5 text-indigo-700 font-bold whitespace-nowrap">
                          {log.targetName || '-'}
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{getSeverityBadge(log.severity)}</td>
                        <td className="p-3.5 text-center">
                          <div
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                              title="عرض كافة تفاصيل السجل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAuditLog(log.id)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition-all"
                              title="حذف هذا السجل"
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
                    <td colSpan={9} className="p-12 text-center text-slate-500 space-y-3">
                      <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                      <div>
                        <p className="font-bold text-sm text-slate-700">لا توجد سجلات مطابقة لمعايير البحث والفلترة</p>
                        <p className="text-xs text-slate-400 mt-1">جربي تغيير خيارات الفلترة أو مسح كلمة البحث</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="relative border-r-2 border-indigo-100 pr-6 space-y-6 mr-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const { dateStr, timeStr } = formatDateTime(log.timestamp);
                return (
                  <div
                    key={log.id}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                        log.severity === 'danger'
                          ? 'bg-rose-500 ring-4 ring-rose-100'
                          : log.severity === 'warning'
                          ? 'bg-amber-500 ring-4 ring-amber-100'
                          : log.severity === 'success'
                          ? 'bg-emerald-500 ring-4 ring-emerald-100'
                          : 'bg-indigo-600 ring-4 ring-indigo-100'
                      }`}
                    />

                    {/* Timeline Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 transition-all space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                            {getCategoryIcon(log.targetCategory)}
                            <span>{getCategoryNameAr(log.targetCategory)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(log.severity)}
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {dateStr} - {timeStr}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">{log.details}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>المنفذ:</span>
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          {getRoleBadge(log.userRole)}
                          {log.targetName && (
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              الهدف: {log.targetName}
                            </span>
                          )}
                        </div>

                        {log.ipAddress && (
                          <span className="font-mono text-slate-400 text-[10px]">
                            IP: {log.ipAddress} | {log.deviceInfo || 'الويب'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500">لا توجد سجلات في المخطط الزمني</div>
            )}
          </div>
        </div>
      )}

      {/* 5. Detailed Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">تفاصيل قيد النشاط والرقابة</h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {selectedLog.id}</span>
                </div>
              </div>
              {getSeverityBadge(selectedLog.severity)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">عنوان العملية والإجراء:</span>
                <p className="font-black text-sm text-slate-900">{selectedLog.action}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                    التصنيف: {getCategoryNameAr(selectedLog.targetCategory)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] font-mono">
                    النوع: {selectedLog.actionType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">المستخدم المنفذ:</span>
                  <p className="font-bold text-slate-900">{selectedLog.userName}</p>
                  <div>{getRoleBadge(selectedLog.userRole)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">التوقيت والتاريخ:</span>
                  <p className="font-mono font-bold text-slate-900">
                    {formatDateTime(selectedLog.timestamp).dateStr}
                  </p>
                  <p className="font-mono text-slate-600">{formatDateTime(selectedLog.timestamp).timeStr}</p>
                </div>
              </div>

              {selectedLog.targetName && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-indigo-800">العنصر / السجل المستهدف:</span>
                  <p className="font-bold text-indigo-950 text-xs">{selectedLog.targetName}</p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">شرح وتفاصيل التغيير:</span>
                <p className="text-slate-800 leading-relaxed font-medium">{selectedLog.details}</p>
              </div>

              {(selectedLog.previousValue || selectedLog.newValue) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 block">القيمة السابقة:</span>
                    <p className="font-mono text-rose-900 font-bold">{selectedLog.previousValue || '-'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 block">القيمة الجديدة:</span>
                    <p className="font-mono text-emerald-900 font-bold">{selectedLog.newValue || '-'}</p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span>عنوان IP:</span>
                  <span className="font-bold text-slate-900">{selectedLog.ipAddress || '192.168.1.10'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>بيئة النظام والجهاز:</span>
                  <span className="text-slate-700">{selectedLog.deviceInfo || 'الويب / نظام الإدارة'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Manual Log Entry Modal */}
      {isAddManualLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">إضافة توثيق إداري في سجل النشاط</h3>
                  <p className="text-[10px] text-slate-500">تسجيل إجراء يدوي رسمي من قبل إدارة المدرسة</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddManualLog} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">عنوان الإجراء أو القرار:</label>
                <input
                  type="text"
                  required
                  value={manualAction}
                  onChange={(e) => setManualAction(e.target.value)}
                  placeholder="مثال: مراجعة سجلات الحضور، تدقيق نتائج شعبة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">التصنيف الإداري:</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as AuditTargetCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="system">النظام والإدارة</option>
                    <option value="students">سجلات الطالبات</option>
                    <option value="teachers">الهيئة التدريسية</option>
                    <option value="attendance">الغياب والحضور</option>
                    <option value="exams">الامتحانات والدرجات</option>
                    <option value="disciplinary">القرارات الانضباطية</option>
                    <option value="security">الأمان والرقابة</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">مستوى الأهمية:</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value as AuditSeverity)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="info">معلومات روتينية</option>
                    <option value="success">نجاح وتأكيد</option>
                    <option value="warning">تنبيه إداري</option>
                    <option value="danger">قرار حرج / أمني</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">العنصر / الشخص المستهدف (اختياري):</label>
                <input
                  type="text"
                  value={manualTargetName}
                  onChange={(e) => setManualTargetName(e.target.value)}
                  placeholder="مثال: الصف السادس العلمي / أ. داليا أحمد..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">تفاصيل وملاحظات التوثيق الإداري:</label>
                <textarea
                  required
                  rows={3}
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="اكتبي تفاصيل ومبررات الإجراء للتسجيل الدائم في تقارير الرقابة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddManualLogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  حفظ في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Clear Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تأكيد أرشفة وتفريغ سجل العمليات</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكدة من تفريغ سجل العمليات الإدارية؟ يُنصح بتصدير نسخة احتياطية (CSV أو JSON) قبل المتابعة.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  clearAuditLogs();
                  setIsClearConfirmOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                نعم، تفريغ السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
