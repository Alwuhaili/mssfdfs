import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Teacher, Student, Parent, EducationalSupervisor, ALL_GRADES_LIST } from '../types';
import { ROLE_CREDENTIALS_DEMO } from './RoleAuthModal';
import { QuickEditPrincipalModal } from './QuickEditPrincipalModal';
import {
  Users,
  KeyRound,
  Shield,
  ShieldCheck,
  Crown,
  Search,
  Eye,
  EyeOff,
  Edit,
  RotateCcw,
  Copy,
  Check,
  Lock,
  Unlock,
  GraduationCap,
  Briefcase,
  UserCheck,
  Building,
  Sparkles,
  Printer,
  Download,
  AlertTriangle,
  Send,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Filter,
  ShieldAlert,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  SortAsc,
} from 'lucide-react';

interface UnifiedUserAccount {
  id: string;
  userKey: string;
  name: string;
  role: UserRole;
  identifier: string;
  secondaryIdentifier?: string;
  avatar?: string;
  extraInfo?: string;
  status?: string;
  rawObject?: Teacher | Student | Parent | EducationalSupervisor | any;
}

export const UserManagementHub: React.FC = () => {
  const {
    role,
    lang,
    teachers,
    students,
    parents,
    supervisors,
    schoolAdminData,
    userPasscodes,
    getUserPasscode,
    adminUpdateUserPasscode,
    adminResetUserPasscode,
    setCurrentUser,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [passcodeTypeFilter, setPasscodeTypeFilter] = useState<'all' | 'custom' | 'default'>('all');
  const [nameSortOrder, setNameSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [showAllGlobal, setShowAllGlobal] = useState(false);
  const [visiblePasscodeKeys, setVisiblePasscodeKeys] = useState<Record<string, boolean>>({});

  // Editing Passcode Modal State
  const [editingAccount, setEditingAccount] = useState<UnifiedUserAccount | null>(null);
  const [newPasscodeValue, setNewPasscodeValue] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(true);
  const [notifyAccountOwner, setNotifyAccountOwner] = useState(true);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copied feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    showToast(lang === 'ar' ? 'تم نسخ الرمز السري إلى الحافظة 📋' : 'Passcode copied to clipboard 📋');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleVisibility = (key: string) => {
    setVisiblePasscodeKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generate random 4-digit or 6-digit PIN
  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPasscodeValue(pin);
  };

  // Build unified user list
  const allAccounts: UnifiedUserAccount[] = useMemo(() => {
    const list: UnifiedUserAccount[] = [];

    // 1. Admin account
    list.push({
      id: 'user-admin',
      userKey: 'admin',
      name: `${schoolAdminData.principalName || 'الهام صبيح سعدون'} (مديرة المدرسة)`,
      role: 'admin',
      identifier: ROLE_CREDENTIALS_DEMO.admin.defaultEmail,
      secondaryIdentifier: ROLE_CREDENTIALS_DEMO.admin.defaultUsername,
      extraInfo: 'الإدارة المدرسية والقيادة التربوية',
      status: 'نشط',
    });

    // 2. Educational Supervisors
    if (supervisors && supervisors.length > 0) {
      supervisors.forEach((sup) => {
        list.push({
          id: sup.id,
          userKey: sup.id,
          name: sup.name,
          role: 'supervisor',
          identifier: sup.email || sup.phone || sup.id,
          secondaryIdentifier: sup.phone,
          avatar: sup.avatar,
          extraInfo: `${sup.title} • تخصص: ${sup.specialization}${sup.isPrimary ? ' (👑 المشرف الرئيسي)' : ''}`,
          status: sup.status || 'نشط',
          rawObject: sup,
        });
      });
    } else {
      // Fallback single supervisor
      list.push({
        id: 'user-supervisor',
        userKey: 'supervisor',
        name: 'المشرف التربوي الأقدم / مديرية تربية ميسان',
        role: 'supervisor',
        identifier: ROLE_CREDENTIALS_DEMO.supervisor.defaultEmail,
        secondaryIdentifier: ROLE_CREDENTIALS_DEMO.supervisor.defaultUsername,
        extraInfo: 'قسم الإشراف التربوي والاختصاصي',
        status: 'نشط',
      });
    }

    // 3. Teachers
    teachers.forEach((t) => {
      list.push({
        id: t.id,
        userKey: t.id,
        name: t.name,
        role: 'teacher',
        identifier: t.email || t.phone || t.nationalId || t.id,
        secondaryIdentifier: t.phone || t.nationalId,
        avatar: t.avatar,
        extraInfo: `مدرسة مادة ${t.subject || 'عامة'} • ${t.assignedGrades?.join(', ') || 'الصفوف المتميزة'}`,
        status: t.status || 'نشط',
        rawObject: t,
      });
    });

    // 4. Students
    students.forEach((s) => {
      list.push({
        id: s.id,
        userKey: s.id,
        name: s.name,
        role: 'student',
        identifier: s.nationalId || s.studentCode || s.email || s.id,
        secondaryIdentifier: s.email || s.phone,
        avatar: s.avatar,
        extraInfo: `${s.gradeLevel} • شعبة (${s.section || 'أ'}) • الرقم الوزاري: ${s.nationalId || '---'}`,
        status: s.status || 'منتظمة',
        rawObject: s,
      });
    });

    // 5. Parents
    parents.forEach((p) => {
      list.push({
        id: p.id,
        userKey: p.id,
        name: p.name,
        role: 'parent',
        identifier: p.email || p.phone || p.id,
        secondaryIdentifier: p.phone,
        extraInfo: `ولي أمر الطالبة: ${p.studentName || '---'} (${p.gradeLevel || ''})`,
        status: p.status || 'نشط',
        rawObject: p,
      });
    });

    return list;
  }, [teachers, students, parents, supervisors]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      // Role Filter
      if (selectedRoleFilter !== 'all' && acc.role !== selectedRoleFilter) {
        return false;
      }

      // Grade Filter
      if (selectedGradeFilter !== 'all') {
        if (acc.role === 'student' && acc.rawObject?.gradeLevel !== selectedGradeFilter) {
          return false;
        }
        if (acc.role === 'teacher' && !acc.rawObject?.assignedGrades?.includes(selectedGradeFilter)) {
          return false;
        }
        if (acc.role === 'parent' && acc.rawObject?.gradeLevel !== selectedGradeFilter) {
          return false;
        }
      }

      // Passcode type filter (custom vs default)
      const currentPin = getUserPasscode(acc.userKey, acc.role);
      const isCustom = userPasscodes && (userPasscodes[acc.userKey] || userPasscodes[acc.role]);
      if (passcodeTypeFilter === 'custom' && !isCustom) return false;
      if (passcodeTypeFilter === 'default' && isCustom && currentPin !== '1234') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchId = acc.identifier.toLowerCase().includes(q);
        const matchSecId = acc.secondaryIdentifier ? acc.secondaryIdentifier.toLowerCase().includes(q) : false;
        const matchExtra = acc.extraInfo ? acc.extraInfo.toLowerCase().includes(q) : false;
        return matchName || matchId || matchSecId || matchExtra;
      }

      return true;
    });
  }, [allAccounts, selectedRoleFilter, selectedGradeFilter, passcodeTypeFilter, searchQuery, userPasscodes, getUserPasscode]);

  // Alphabetical & Display Sorting
  const displayAccounts = useMemo(() => {
    if (nameSortOrder === 'default') {
      return filteredAccounts;
    }
    return [...filteredAccounts].sort((a, b) => {
      // Clean, robust Arabic alphabetical collation
      const cmp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base', numeric: true });
      return nameSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredAccounts, nameSortOrder]);

  // Summary counts
  const stats = useMemo(() => {
    const total = allAccounts.length;
    const teachersCount = teachers.length;
    const studentsCount = students.length;
    const parentsCount = parents.length;
    const customCount = Object.keys(userPasscodes || {}).length;

    return { total, teachersCount, studentsCount, parentsCount, customCount };
  }, [allAccounts, teachers, students, parents, userPasscodes]);

  const [isQuickEditPrincipalOpen, setIsQuickEditPrincipalOpen] = useState(false);

  // Open Edit Passcode Modal
  const openEditModal = (acc: UnifiedUserAccount) => {
    const currentPin = getUserPasscode(acc.userKey, acc.role);
    setEditingAccount(acc);
    setNewPasscodeValue(currentPin);
    setShowNewPasscode(true);
    setNotifyAccountOwner(true);
    setModalFeedback(null);
  };

  // Submit Passcode Update
  const handleSavePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const res = adminUpdateUserPasscode(editingAccount.userKey, newPasscodeValue, {
      userName: editingAccount.name,
      userRole: editingAccount.role,
      userIdentifier: editingAccount.identifier,
      sendNotification: notifyAccountOwner,
    });

    if (res.success) {
      setModalFeedback({ type: 'success', text: res.message });
      showToast(res.message);
      setTimeout(() => {
        setEditingAccount(null);
        setModalFeedback(null);
      }, 1200);
    } else {
      setModalFeedback({ type: 'error', text: res.message });
    }
  };

  // Reset to default 1234
  const handleResetToDefault = (acc: UnifiedUserAccount) => {
    if (
      window.confirm(
        lang === 'ar'
          ? `هل أنتِ متأكدة من إعادة تعيين الرمز السري لحساب (${acc.name}) إلى الرمز الافتراضي (1234)؟`
          : `Reset passcode for (${acc.name}) to default (1234)?`
      )
    ) {
      const res = adminResetUserPasscode(acc.userKey, '1234', {
        userName: acc.name,
        userRole: acc.role,
        userIdentifier: acc.identifier,
      });
      showToast(res.message);
    }
  };

  // Print Credentials Sheet
  const handlePrintCredentials = () => {
    window.print();
  };

  // Quick switch test login
  const handleTestLogin = (acc: UnifiedUserAccount) => {
    if (
      window.confirm(
        lang === 'ar'
          ? `هل ترغبين في التحويل التجريبي السريع والدخول بصلاحية حساب (${acc.name} - ${acc.role})؟`
          : `Switch session to (${acc.name})?`
      )
    ) {
      setCurrentUser({
        id: acc.id,
        name: acc.name,
        email: acc.identifier,
        role: acc.role,
        avatar: acc.avatar,
      });
      showToast(lang === 'ar' ? `تم تسجيل الدخول بحساب: ${acc.name}` : `Logged in as: ${acc.name}`);
    }
  };

  // Strict Admin Gate
  if (role !== 'admin') {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 font-arabic space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold">صلاحية محظورة — خاصة بالمديرة والإدارة فقط</h3>
        <p className="text-sm text-rose-700">لا تملكين الصلاحية الإدارية للاطلاع على بيانات ورموز المستخدمين.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-arabic animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner & Security Shield */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-10 -ms-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ar' ? 'صلاحية إدارية خاصة بالمديرة والإدارة المدرسية فقط 🔒' : 'Principal & Administration Confidential Access 🔒'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <KeyRound className="w-8 h-8 text-amber-400" />
              <span>{lang === 'ar' ? 'إدارة المستخدمين والرموز السرية للدخول' : 'User Accounts & Passcode Management'}</span>
            </h1>

            <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
              {lang === 'ar'
                ? 'لوحة التحكم المركزية للاطلاع المباشر على كلمات السر والرموز السرية للدخول لجميع مستخدمي المنصة (المدرسات، الطالبات، أولياء الأمور، الإشراف) وتعديلها وإعادة تعيينها فورياً.'
                : 'Central console for the Principal to view, edit, generate, and reset login passcodes for all platform accounts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAllGlobal(!showAllGlobal)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                showAllGlobal
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {showAllGlobal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-300" />}
              <span>{showAllGlobal ? (lang === 'ar' ? 'إخفاء كافة الرموز' : 'Hide All PINs') : (lang === 'ar' ? 'كشف كافة الرموز 👁️' : 'Reveal All PINs 👁️')}</span>
            </button>

            <button
              onClick={handlePrintCredentials}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>{lang === 'ar' ? 'طباعة بطاقات الدخول 🖨️' : 'Print Cards'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">{lang === 'ar' ? 'إجمالي الحسابات' : 'Total Accounts'}</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <span className="text-[10px] text-indigo-300">{lang === 'ar' ? 'حساب نشط في المنصة' : 'Active platform users'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">{lang === 'ar' ? 'الهيئة التدريسية' : 'Teachers'}</span>
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{stats.teachersCount}</div>
            <span className="text-[10px] text-emerald-200">{lang === 'ar' ? 'مدرسة ومدرس' : 'Teachers registered'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">{lang === 'ar' ? 'الطالبات المتميزات' : 'Students'}</span>
              <GraduationCap className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300 mt-1">{stats.studentsCount}</div>
            <span className="text-[10px] text-sky-200">{lang === 'ar' ? 'طالبة موهوبة' : 'Enrolled students'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">{lang === 'ar' ? 'أولياء الأمور' : 'Parents'}</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{stats.parentsCount}</div>
            <span className="text-[10px] text-amber-200">{lang === 'ar' ? 'ولي أمر مسجل' : 'Registered parents'}</span>
          </div>
        </div>
      </div>

      {/* 2. Global Role-Level Default Passcodes Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'ar' ? 'الرموز السرية العامة للأدوار (Default Role PINs)' : 'Default Role PINs'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar'
                ? 'تحديد وتعديل الرمز السري الافتراضي لكل فئة مستخدمين على المنصة (تطبق في حال لم يحدد رمز خاص للطالبة أو المدرسة):'
                : 'Manage the base default passcode assigned to each user role category:'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {(
            [
              { role: 'admin', titleAr: 'المديرة والإدارة', icon: '👑', color: 'indigo' },
              { role: 'teacher', titleAr: 'الهيئة التدريسية', icon: '👩‍🏫', color: 'emerald' },
              { role: 'student', titleAr: 'طالبات المتميزات', icon: '🎓', color: 'sky' },
              { role: 'parent', titleAr: 'أولياء الأمور', icon: '👪', color: 'amber' },
              { role: 'supervisor', titleAr: 'المشرف التربوي', icon: '🏛️', color: 'purple' },
            ] as const
          ).map((item) => {
            const rolePass = getUserPasscode(item.role, item.role);
            const isVisible = showAllGlobal || visiblePasscodeKeys[`role-${item.role}`];
            const isCustom = userPasscodes && Boolean(userPasscodes[item.role]);

            return (
              <div
                key={item.role}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.titleAr}</span>
                  </div>
                  {isCustom && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                      مخصص
                    </span>
                  )}
                </div>

                {/* Passcode Display Box */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white tracking-widest">
                      {isVisible ? rolePass : '••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(`role-${item.role}`)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title={isVisible ? 'إخفاء' : 'إظهار'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rolePass, `role-${item.role}`)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="نسخ"
                    >
                      {copiedKey === `role-${item.role}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() =>
                    openEditModal({
                      id: `role-${item.role}`,
                      userKey: item.role,
                      name: `الرمز الافتراضي لفئة (${item.titleAr})`,
                      role: item.role,
                      identifier: `جميع مستخدمي فئة ${item.titleAr}`,
                    })
                  }
                  className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل رمز الفئة</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main User Directory Table & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Search and Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالاسم، المعرف، الرقم الوطني، أو الهاتف...' : 'Search by name, ID, phone...'}
              className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'admin', label: '👑 المديرة' },
                { id: 'teacher', label: '👩‍🏫 المدرسات' },
                { id: 'student', label: '🎓 الطالبات' },
                { id: 'parent', label: '👪 أولياء الأمور' },
                { id: 'supervisor', label: '🏛️ الإشراف' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedRoleFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRoleFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Additional Grade, Passcode & Alphabetical Sort Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل المراحل والصفوف</option>
              {ALL_GRADES_LIST.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={passcodeTypeFilter}
              onChange={(e) => setPasscodeTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل حالات الرموز</option>
              <option value="custom">رموز مخصصة ومعدلة</option>
              <option value="default">الرمز الافتراضي (1234)</option>
            </select>

            {/* Alphabetical Sorting Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={nameSortOrder}
                onChange={(e) => setNameSortOrder(e.target.value as 'default' | 'asc' | 'desc')}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                title="ترتيب الأسماء أبجدياً"
              >
                <option value="default">ترتيب الأسماء: الافتراضي</option>
                <option value="asc">ترتيب أبجدياً: أ ← ي (تصاعدي)</option>
                <option value="desc">ترتيب أبجدياً: ي ← أ (تنازلي)</option>
              </select>
            </div>

            {/* Quick Toggle Button for Alphabetical Sort */}
            <button
              type="button"
              onClick={() => {
                setNameSortOrder((prev) => {
                  if (prev === 'default') return 'asc';
                  if (prev === 'asc') return 'desc';
                  return 'default';
                });
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                nameSortOrder === 'asc'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                  : nameSortOrder === 'desc'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700'
              }`}
              title="التبديل بين الترتيب الأبجدي تصاعدي وتنازلي والافتراضي"
            >
              {nameSortOrder === 'asc' ? (
                <>
                  <ArrowDownAZ className="w-4 h-4 text-white" />
                  <span>أبجدياً (أ - ي)</span>
                </>
              ) : nameSortOrder === 'desc' ? (
                <>
                  <ArrowUpAZ className="w-4 h-4 text-slate-950" />
                  <span>أبجدياً (ي - أ)</span>
                </>
              ) : (
                <>
                  <SortAsc className="w-4 h-4 text-indigo-500" />
                  <span>ترتيب أبجدي</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Counter & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <span>عرض </span>
              <strong className="text-slate-900 dark:text-white font-bold">{displayAccounts.length}</strong>
              <span> حساب من أصل </span>
              <strong className="text-slate-900 dark:text-white font-bold">{allAccounts.length}</strong>
            </div>

            {nameSortOrder !== 'default' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                {nameSortOrder === 'asc' ? (
                  <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <ArrowUpAZ className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>
                  مُرتب أبجدياً: {nameSortOrder === 'asc' ? 'تصاعدي من (أ إلى ي)' : 'تنازلي من (ي إلى أ)'}
                </span>
                <button
                  type="button"
                  onClick={() => setNameSortOrder('default')}
                  className="ms-1 px-1.5 py-0.5 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900 text-slate-400 hover:text-rose-600 transition-colors"
                  title="إلغاء الترتيب والرجوع للوضع الافتراضي"
                >
                  ✕ إلغاء
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">البيانات مؤمنة ومحدثة لحظياً</span>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <th
                  className="p-3.5 text-start cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors group"
                  onClick={() => {
                    setNameSortOrder((prev) => {
                      if (prev === 'default') return 'asc';
                      if (prev === 'asc') return 'desc';
                      return 'default';
                    });
                  }}
                  title="اضغط لترتيب الأسماء أبجدياً (أ - ي / ي - أ)"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang === 'ar' ? 'المستخدم / الحساب' : 'User / Account'}</span>
                    {nameSortOrder === 'asc' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                        <ArrowDownAZ className="w-3.5 h-3.5" />
                        <span>(أ - ي)</span>
                      </span>
                    ) : nameSortOrder === 'desc' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800">
                        <ArrowUpAZ className="w-3.5 h-3.5" />
                        <span>(ي - أ)</span>
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'الفئة والصلاحية' : 'Role'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'معرف الدخول (البريد / الرقم)' : 'Identifier'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'الرمز السري للدخول 🔑' : 'Passcode PIN 🔑'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-center">{lang === 'ar' ? 'الإجراءات والتعديل' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد حسابات مطابقة لمعايير البحث الحالية.' : 'No accounts matching criteria.'}
                  </td>
                </tr>
              ) : (
                displayAccounts.map((acc) => {
                  const passcode = getUserPasscode(acc.userKey, acc.role);
                  const isVisible = showAllGlobal || visiblePasscodeKeys[acc.userKey];
                  const isCustom = userPasscodes && (userPasscodes[acc.userKey] || userPasscodes[acc.role]);

                  const roleBadgeConfig = {
                    admin: { label: '👑 المديرة والإدارة', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
                    teacher: { label: '👩‍🏫 هيئة تدريسية', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
                    student: { label: '🎓 طالبة متميزة', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
                    parent: { label: '👪 ولي أمر', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
                    supervisor: { label: '🏛️ إشراف تربوي', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
                  }[acc.role];

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {acc.avatar ? (
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {acc.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{acc.name}</div>
                            {acc.extraInfo && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{acc.extraInfo}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold border ${roleBadgeConfig.bg}`}
                        >
                          {roleBadgeConfig.label}
                        </span>
                      </td>

                      {/* Identifier */}
                      <td className="p-3.5">
                        <div className="font-mono text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          {acc.identifier}
                        </div>
                        {acc.secondaryIdentifier && acc.secondaryIdentifier !== acc.identifier && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {acc.secondaryIdentifier}
                          </div>
                        )}
                      </td>

                      {/* Passcode with Eye Toggle & Copy */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white tracking-widest text-xs min-w-[3.5rem]">
                            {isVisible ? passcode : '••••'}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleVisibility(acc.userKey)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title={isVisible ? 'إخفاء الرمز' : 'إظهار الرمز'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5 text-indigo-500" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(passcode, acc.userKey)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="نسخ الرمز"
                          >
                            {copiedKey === acc.userKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isCustom
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isCustom ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                          <span>{isCustom ? 'رمز مخصص' : 'الافتراضي 1234'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Special Edit Principal Details for Admin Account */}
                          {acc.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => setIsQuickEditPrincipalOpen(true)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all transform hover:scale-105"
                              title="تعديل اسم وبيانات مديرة المدرسة"
                            >
                              <Crown className="w-3.5 h-3.5 text-slate-950" />
                              <span>اسم المديرة</span>
                            </button>
                          )}

                          {/* Edit Passcode */}
                          <button
                            type="button"
                            onClick={() => openEditModal(acc)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 transition-all"
                            title="تعديل الرمز السري لهذا المستخدم"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل الرمز</span>
                          </button>

                          {/* Reset to 1234 */}
                          <button
                            type="button"
                            onClick={() => handleResetToDefault(acc)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950 dark:hover:text-amber-300 text-slate-500 transition-colors"
                            title="إعادة تعيين إلى 1234"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Test Login */}
                          <button
                            type="button"
                            onClick={() => handleTestLogin(acc)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-slate-500 transition-colors"
                            title="تجربة الدخول بهذا الحساب"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Edit Passcode Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'تعديل الرمز السري للدخول' : 'Edit User Passcode'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingAccount.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingAccount(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* User Details Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">معرف الحساب:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{editingAccount.identifier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">الرمز الحالي:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {getUserPasscode(editingAccount.userKey, editingAccount.role)}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePasscode} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>الرمز السري الجديد (Passcode / PIN):</span>
                  </label>

                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>توليد رمز عشوائي 🎲</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPasscode ? 'text' : 'password'}
                    value={newPasscodeValue}
                    onChange={(e) => setNewPasscodeValue(e.target.value)}
                    placeholder="مثال: 5821 أو رمز سري جديد"
                    required
                    minLength={3}
                    className="w-full ps-4 pe-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasscode(!showNewPasscode)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  يتكون الرمز السري من 4 خانات على الأقل (أرقام أو حروف أو رموز).
                </p>
              </div>

              {/* Notification Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAccountOwner}
                  onChange={(e) => setNotifyAccountOwner(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    إرسال إشعار أمني لحساب المستخدم 🔔
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    إعلام صاحب الحساب بأن الإدارة قامت بتحديث رمز المرور.
                  </span>
                </div>
              </label>

              {/* Feedback Message */}
              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{modalFeedback.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>حفظ الرمز السري الجديد 🔒</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Edit Principal Modal */}
      <QuickEditPrincipalModal
        isOpen={isQuickEditPrincipalOpen}
        onClose={() => setIsQuickEditPrincipalOpen(false)}
      />
    </div>
  );
};
