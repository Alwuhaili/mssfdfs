/**
 * Targeted Instant Notifications Panel & Dispatcher Modal
 * ثانوية ميسان للمتميزات
 * إدارة ذكية وموجهة للتنبيهات الفورية: خاصة بالحساب، فئوية، صفية، عامة، ومتعددة المستلمين
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GradeLevel, ALL_GRADES_LIST, UserRole, Section, NotificationItem } from '../types';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
  Send,
  Trash2,
  Search,
  Plus,
  Users,
  ShieldAlert,
  Sparkles,
  GraduationCap,
  Filter,
  Check,
  User,
  Clock,
  Edit3,
  Save,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Layers,
  Megaphone,
  Pin,
  HelpCircle,
  School,
  BookOpen,
  ArrowRight,
  Share2,
  Printer,
  ChevronDown,
} from 'lucide-react';

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    getUserNotifications,
    addNotification,
    deleteNotification,
    updateNotification,
    markNotificationRead,
    toggleNotificationRead,
    markAllNotificationsRead,
    clearAllUserNotifications,
    lang,
    t,
    role,
    currentUser,
    students,
    teachers,
    parents,
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<'feed' | 'compose'>('feed');
  const [feedScope, setFeedScope] = useState<'all' | 'personal' | 'class' | 'public' | 'unread'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing Notification state for current user
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editMsg, setEditMsg] = useState<string>('');

  // Form State for Instant Notification Dispatcher
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'alert' | 'security'>('info');
  const [targetAudience, setTargetAudience] = useState<
    | 'all'
    | 'students'
    | 'parents'
    | 'teachers'
    | 'supervisor'
    | 'grade_section'
    | 'multi_students'
    | 'multi_parents'
    | 'multi_teachers'
  >('all');

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('الصف السادس العلمي');
  const [selectedSection, setSelectedSection] = useState<Section | 'الكل'>('الكل');
  
  // Multi-recipient selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  const userNotifications = getUserNotifications();

  // Determine Active Account Info
  const activeTeacherObj =
    currentUser?.teacherObj ||
    teachers.find(
      (t) =>
        (currentUser?.id && t.id === currentUser.id) ||
        (currentUser?.email && t.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && t.name.toLowerCase() === currentUser.name.toLowerCase())
    );

  const activeStudentObj =
    currentUser?.studentObj ||
    students.find(
      (s) =>
        (currentUser?.id && s.id === currentUser.id) ||
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && (s.phone === currentUser.phone || s.parentPhone === currentUser.phone)) ||
        (currentUser?.name &&
          (s.name.toLowerCase() === currentUser.name.toLowerCase() ||
            s.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
            currentUser.name.toLowerCase().includes(s.name.toLowerCase())))
    );

  const activeParentObj =
    parents.find(
      (p) =>
        (currentUser?.id && p.id === currentUser.id) ||
        (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && p.phone === currentUser.phone)
    ) || currentUser?.parentObj;

  const currentUserId =
    currentUser?.id ||
    (role === 'admin'
      ? 'admin-main'
      : role === 'teacher'
      ? activeTeacherObj?.id || 'tech-1'
      : role === 'student'
      ? activeStudentObj?.id || 'std-1'
      : role === 'parent'
      ? activeParentObj?.id || 'prt-1'
      : 'sup-1');

  const daughters = students.filter(
    (s) =>
      (activeParentObj && s.parentEmail.toLowerCase() === activeParentObj.email.toLowerCase()) ||
      (activeParentObj && s.parentPhone === activeParentObj.phone) ||
      (activeParentObj && s.parentName === activeParentObj.name) ||
      (activeParentObj && s.parentId === activeParentObj.id) ||
      (activeStudentObj && s.id === activeStudentObj.id)
  );
  const daughterIds = daughters.map((d) => d.id);

  // Helper to determine notification scope relative to active user
  const isPersonalNotification = (n: NotificationItem) => {
    if (n.targetUserId === currentUserId) return true;
    if (n.targetUserIds && n.targetUserIds.includes(currentUserId)) return true;
    if (n.targetStudentId && role === 'student' && activeStudentObj && n.targetStudentId === activeStudentObj.id) return true;
    if (n.targetStudentIds && role === 'student' && activeStudentObj && n.targetStudentIds.includes(activeStudentObj.id)) return true;
    if (n.targetStudentId && role === 'parent' && daughterIds.includes(n.targetStudentId)) return true;
    if (n.targetStudentIds && role === 'parent' && daughterIds.some((id) => n.targetStudentIds?.includes(id))) return true;
    if (n.targetParentId && role === 'parent' && activeParentObj && n.targetParentId === activeParentObj.id) return true;
    if (n.targetTeacherId && role === 'teacher' && (n.targetTeacherId === currentUserId || n.targetTeacherId === activeTeacherObj?.id)) return true;
    if (n.targetTeacherIds && role === 'teacher' && (n.targetTeacherIds.includes(currentUserId) || (activeTeacherObj?.id && n.targetTeacherIds.includes(activeTeacherObj.id)))) return true;
    if (n.isAttendanceNotif) return true;
    return false;
  };

  const isClassOrRoleNotification = (n: NotificationItem) => {
    if (isPersonalNotification(n)) return false;
    if (n.targetGradeLevel && n.targetGradeLevel !== 'الكل') return true;
    if (n.targetSection && n.targetSection !== 'الكل') return true;
    if (n.targetRole && n.targetRole !== 'all') return true;
    return false;
  };

  const isPublicNotification = (n: NotificationItem) => {
    return (!n.targetRole || n.targetRole === 'all') &&
      (!n.targetGradeLevel || n.targetGradeLevel === 'الكل') &&
      (!n.targetSection || n.targetSection === 'الكل') &&
      !n.targetUserId &&
      !n.targetUserIds &&
      !n.targetStudentId &&
      !n.targetStudentIds &&
      !n.targetTeacherId &&
      !n.targetTeacherIds &&
      !n.targetParentId;
  };

  // Compute scope counts
  const personalCount = userNotifications.filter(isPersonalNotification).length;
  const classCount = userNotifications.filter(isClassOrRoleNotification).length;
  const publicCount = userNotifications.filter(isPublicNotification).length;
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  // Filtered Notifications based on Scope, Severity, Search
  const filteredNotifications = userNotifications
    .filter((n) => {
      // Scope Filter
      if (feedScope === 'personal' && !isPersonalNotification(n)) return false;
      if (feedScope === 'class' && !isClassOrRoleNotification(n)) return false;
      if (feedScope === 'public' && !isPublicNotification(n)) return false;
      if (feedScope === 'unread' && n.isRead) return false;

      // Severity Type Filter
      if (filterType !== 'all' && n.type !== filterType) return false;

      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchMsg = n.message?.toLowerCase().includes(q);
        const matchSender = n.senderName?.toLowerCase().includes(q);
        const matchGrade = n.targetGradeLevel?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchSender && !matchGrade) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort pinned first, then unread, then latest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      return 0;
    });

  const canDispatchNotifications = role === 'admin' || role === 'teacher' || role === 'supervisor';

  // Handling Multi-Select Toggles
  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleTeacherSelection = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudentsInGrade = (grade: GradeLevel) => {
    const gradeStudentIds = students.filter((s) => s.gradeLevel === grade).map((s) => s.id);
    setSelectedStudentIds((prev) => {
      const allSelected = gradeStudentIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !gradeStudentIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...gradeStudentIds]));
      }
    });
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    let targetRole: UserRole | 'all' = 'all';
    let targetGradeLevel: GradeLevel | undefined = undefined;
    let targetSectionVal: Section | 'الكل' | undefined = undefined;
    let targetStudentId: string | undefined = undefined;
    let targetStudentIds: string[] | undefined = undefined;
    let targetParentIds: string[] | undefined = undefined;
    let targetTeacherIds: string[] | undefined = undefined;
    let targetAudienceScope: 'personal' | 'category' | 'class' | 'public' | 'multi_user' = 'public';

    if (targetAudience === 'all') {
      targetRole = 'all';
      targetAudienceScope = 'public';
    } else if (targetAudience === 'students') {
      targetRole = 'student';
      targetAudienceScope = 'category';
    } else if (targetAudience === 'parents') {
      targetRole = 'parent';
      targetAudienceScope = 'category';
    } else if (targetAudience === 'teachers') {
      targetRole = 'teacher';
      targetAudienceScope = 'category';
    } else if (targetAudience === 'supervisor') {
      targetRole = 'supervisor';
      targetAudienceScope = 'category';
    } else if (targetAudience === 'grade_section') {
      targetRole = 'student';
      targetGradeLevel = selectedGrade;
      targetSectionVal = selectedSection;
      targetAudienceScope = 'class';
    } else if (targetAudience === 'multi_students') {
      if (selectedStudentIds.length === 0) {
        alert(lang === 'ar' ? 'يرجى اختيار طالبة واحدة على الأقل!' : 'Please select at least one student!');
        return;
      }
      targetRole = 'student';
      if (selectedStudentIds.length === 1) {
        targetStudentId = selectedStudentIds[0];
        targetAudienceScope = 'personal';
      } else {
        targetStudentIds = selectedStudentIds;
        targetAudienceScope = 'multi_user';
      }
    } else if (targetAudience === 'multi_parents') {
      if (selectedStudentIds.length === 0) {
        alert(lang === 'ar' ? 'يرجى اختيار طالبة لتوجيه الإشعار لولي أمرها!' : 'Please select at least one student to notify their parent!');
        return;
      }
      targetRole = 'parent';
      if (selectedStudentIds.length === 1) {
        const std = students.find((s) => s.id === selectedStudentIds[0]);
        targetStudentId = std?.id;
        targetParentIds = std?.parentId ? [std.parentId] : undefined;
        targetAudienceScope = 'personal';
      } else {
        targetStudentIds = selectedStudentIds;
        const pIds = selectedStudentIds
          .map((sId) => students.find((s) => s.id === sId)?.parentId)
          .filter(Boolean) as string[];
        targetParentIds = pIds;
        targetAudienceScope = 'multi_user';
      }
    } else if (targetAudience === 'multi_teachers') {
      if (selectedTeacherIds.length === 0) {
        alert(lang === 'ar' ? 'يرجى اختيار أستاذة واحدة على الأقل!' : 'Please select at least one teacher!');
        return;
      }
      targetRole = 'teacher';
      if (selectedTeacherIds.length === 1) {
        targetTeacherIds = selectedTeacherIds;
        targetAudienceScope = 'personal';
      } else {
        targetTeacherIds = selectedTeacherIds;
        targetAudienceScope = 'multi_user';
      }
    }

    const currentUserName =
      currentUser?.name ||
      (role === 'admin'
        ? 'إدارة ثانوية ميسان للمتميزات'
        : role === 'teacher'
        ? activeTeacherObj?.name || 'أستاذة المادة الدراسية'
        : 'المشرف التربوي');

    addNotification({
      title,
      message,
      type,
      targetRole,
      targetGradeLevel,
      targetSection: targetSectionVal,
      targetStudentId,
      targetStudentIds,
      targetParentIds,
      targetTeacherIds,
      senderName: currentUserName,
      senderRole: role,
      targetAudienceScope,
      isPinned,
      isRead: false,
    });

    setTitle('');
    setMessage('');
    setSelectedStudentIds([]);
    setSelectedTeacherIds([]);
    setIsPinned(false);
    setSendSuccessMsg(lang === 'ar' ? 'تم إرسال التنبيه الفوري بنجاح ووصوله للجهة المستهدفة بدقة!' : 'Instant alert dispatched successfully to target audience!');
    setTimeout(() => {
      setSendSuccessMsg(null);
      setActiveTab('feed');
    }, 1800);
  };

  const getTargetBadge = (n: NotificationItem) => {
    if (isPersonalNotification(n)) {
      return {
        label: lang === 'ar' ? 'خاص بحسابك شخصياً 🎯' : 'Directly for you 🎯',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (n.targetStudentIds && n.targetStudentIds.length > 1) {
      return {
        label: lang === 'ar' ? `طالبات محددات (${n.targetStudentIds.length}) 👩‍🎓` : `Selected Students (${n.targetStudentIds.length}) 👩‍🎓`,
        bg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      };
    }
    if (n.targetTeacherIds && n.targetTeacherIds.length > 0) {
      return {
        label: lang === 'ar' ? 'خاص بالمعلمات المحددة 👩‍🏫' : 'Targeted Teachers 👩‍🏫',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (n.targetGradeLevel && n.targetGradeLevel !== 'الكل') {
      const secStr = n.targetSection && n.targetSection !== 'الكل' ? ` - شعبة ${n.targetSection}` : '';
      return {
        label: `${n.targetGradeLevel}${secStr} 📚`,
        bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    }
    if (n.targetRole === 'student') return { label: lang === 'ar' ? 'فئة الطالبات 👩‍🎓' : 'Students 👩‍🎓', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    if (n.targetRole === 'parent') return { label: lang === 'ar' ? 'أولياء الأمور 👨‍👩‍👧' : 'Parents 👨‍👩‍👧', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    if (n.targetRole === 'teacher') return { label: lang === 'ar' ? 'الهيئة التدريسية 👩‍🏫' : 'Teachers 👩‍🏫', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
    if (n.targetRole === 'supervisor') return { label: lang === 'ar' ? 'المشرف التربوي 🏛️' : 'Supervisor 🏛️', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    return { label: lang === 'ar' ? 'إعلان عام لكافة المدرسة 📢' : 'School Broadcast 📢', bg: 'bg-slate-700/50 text-slate-300 border-slate-600/40' };
  };

  // Filtered Students list for dispatch selector
  const eligibleStudents = useMemo(() => {
    return students.filter((s) => {
      if (!studentSearchTerm) return true;
      const term = studentSearchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(term) ||
        s.gradeLevel.toLowerCase().includes(term) ||
        s.section.toLowerCase().includes(term) ||
        s.parentName.toLowerCase().includes(term)
      );
    });
  }, [students, studentSearchTerm]);

  // Filtered Teachers list for dispatch selector
  const eligibleTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (!teacherSearchTerm) return true;
      const term = teacherSearchTerm.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term);
    });
  }, [teachers, teacherSearchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 font-arabic animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-amber-400/10 text-amber-300 rounded-2xl border border-amber-500/30 shadow-inner">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{t.notifications}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {lang === 'ar' ? 'نظام التنبيهات الفورية الفعالة' : 'Live Smart Alert Center'}
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    {unreadCount} {lang === 'ar' ? 'جديد' : 'new'}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                {lang === 'ar'
                  ? 'تنبيهات مخصصة ودقيقة: خاصة بالحساب، حسب الفئة والصف، وعامة لكافة المدرسة'
                  : 'Targeted notifications: account-specific, grade/class level, and school-wide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'feed'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'سجل التنبيهات الواردة' : 'Inbox Alerts'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-indigo-300 text-[10px] border border-indigo-500/30">
                {userNotifications.length}
              </span>
            </button>

            {canDispatchNotifications && (
              <button
                onClick={() => setActiveTab('compose')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'compose'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/50'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إرسال تنبيه فوري موجه 📢' : 'Dispatch Targeted Alert 📢'}</span>
              </button>
            )}
          </div>

          {activeTab === 'feed' && userNotifications.some((n) => !n.isRead) && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all font-bold text-[11px]"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.markAllRead}</span>
            </button>
          )}
        </div>

        {/* Tab Content: Feed */}
        {activeTab === 'feed' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scope Filter Pill Bar */}
            <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFeedScope('all')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                    feedScope === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
                  <span className="text-[10px] opacity-75 font-mono">({userNotifications.length})</span>
                </button>

                <button
                  onClick={() => setFeedScope('personal')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                    feedScope === 'personal'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-300'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'خاصة بي 🎯' : 'Personal 🎯'}</span>
                  {personalCount > 0 && <span className="text-[10px] opacity-75 font-mono">({personalCount})</span>}
                </button>

                <button
                  onClick={() => setFeedScope('class')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                    feedScope === 'class'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-purple-300'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'صفي وفئتي 📚' : 'My Class/Role 📚'}</span>
                  {classCount > 0 && <span className="text-[10px] opacity-75 font-mono">({classCount})</span>}
                </button>

                <button
                  onClick={() => setFeedScope('public')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                    feedScope === 'public'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-teal-300'
                  }`}
                >
                  <Megaphone className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'عامة للمدرسة 📢' : 'Public 📢'}</span>
                  {publicCount > 0 && <span className="text-[10px] opacity-75 font-mono">({publicCount})</span>}
                </button>

                <button
                  onClick={() => setFeedScope('unread')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                    feedScope === 'unread'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
                  }`}
                >
                  <Bell className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'غير مقروءة' : 'Unread'}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">🔍 {lang === 'ar' ? 'كافة الأنواع' : 'All Types'}</option>
                  <option value="alert">🚨 {lang === 'ar' ? 'طارئ / عاجل' : 'Urgent Alert'}</option>
                  <option value="warning">⚠️ {lang === 'ar' ? 'تحذيري / إداري' : 'Warning'}</option>
                  <option value="success">✅ {lang === 'ar' ? 'تكريم / نجاح' : 'Success'}</option>
                  <option value="info">🔵 {lang === 'ar' ? 'إعلامي / عادي' : 'Info'}</option>
                  <option value="security">🛡️ {lang === 'ar' ? 'أمني / نظام' : 'Security'}</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'بحث سريع في نص التنبيه، العنوان، أو اسم المرسل أو المرحلة...'
                      : 'Search alert text, title, sender or grade...'
                  }
                  className="w-full pr-9 pl-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* User Isolation Info Note */}
            <div className="mx-5 mt-2.5 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[10px] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? `أنت تتصفح التنبيهات بصفتك (${currentUser?.name || role}). التنبيهات الخاصة بحسابك وقرارات الغياب معزولة ومحمية.`
                    : `Viewing alerts as (${currentUser?.name || role}). Your personal notices and attendance logs are isolated.`}
                </span>
              </div>
            </div>

            {/* Notifications Feed List */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-14 text-center text-slate-500 text-sm">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                  <p className="font-bold text-slate-400">
                    {lang === 'ar' ? 'لا توجد تنبيهات مطابقة لهذا الفلتر' : 'No matching notifications found'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'ar'
                      ? 'سيتم إشعارك فور ورود أي قرار، تنبيه غياب، أو إعلان رسمي جديد.'
                      : 'You will receive live notifications when new updates are issued.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  let icon = <Info className="w-4 h-4 text-blue-400" />;
                  let badgeBg = 'bg-blue-500/10 border-blue-500/30 text-blue-300';

                  if (n.type === 'alert') {
                    icon = <AlertOctagon className="w-4 h-4 text-rose-400" />;
                    badgeBg = 'bg-rose-500/15 border-rose-500/40 text-rose-300';
                  } else if (n.type === 'warning') {
                    icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
                    badgeBg = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
                  } else if (n.type === 'success') {
                    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                    badgeBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
                  } else if (n.type === 'security') {
                    icon = <ShieldAlert className="w-4 h-4 text-purple-400" />;
                    badgeBg = 'bg-purple-500/15 border-purple-500/40 text-purple-300';
                  }

                  const isEditingThis = editingId === n.id;
                  const targetInfo = getTargetBadge(n);

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!isEditingThis) markNotificationRead(n.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                        !n.isRead
                          ? 'bg-slate-800/95 border-indigo-500/40 shadow-lg ring-1 ring-indigo-500/20'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 opacity-90 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${badgeBg}`}>
                          {icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditingThis ? (
                            /* Inline Edit Form for Personal Account */
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-indigo-500/50 rounded-lg text-xs text-white focus:outline-none"
                                placeholder={lang === 'ar' ? 'عنوان التنبيه الخاص بك' : 'Your title'}
                              />
                              <textarea
                                value={editMsg}
                                onChange={(e) => setEditMsg(e.target.value)}
                                rows={2}
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-indigo-500/50 rounded-lg text-xs text-white focus:outline-none resize-none"
                                placeholder={lang === 'ar' ? 'نص التنبيه الخاص بك' : 'Your message'}
                              />
                              <div className="flex items-center gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                                >
                                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateNotification(n.id, { title: editTitle, message: editMsg }, 'user');
                                    setEditingId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] text-white font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'حفظ لحسابي' : 'Save'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Title, Pin & Time */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                                  )}
                                  {n.isPinned && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1">
                                      <Pin className="w-2.5 h-2.5 fill-amber-300" />
                                      <span>{lang === 'ar' ? 'مثبت' : 'Pinned'}</span>
                                    </span>
                                  )}
                                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {n.timestamp || 'الآن'}
                                </span>
                              </div>

                              {/* Content Body */}
                              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-arabic break-words">
                                {n.message}
                              </p>

                              {/* Footer Meta info & Target Scope Badge */}
                              <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-lg border font-bold ${targetInfo.bg}`}>
                                    {targetInfo.label}
                                  </span>

                                  {n.senderName && (
                                    <span className="text-slate-400">
                                      {lang === 'ar' ? 'المرسل:' : 'From:'} {n.senderName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* Toggle Read/Unread */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotificationRead(n.id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                                    title={
                                      n.isRead
                                        ? lang === 'ar'
                                          ? 'تحديد كغير مقروء لحسابي'
                                          : 'Mark as unread'
                                        : lang === 'ar'
                                        ? 'تحديد كمقروء لحسابي'
                                        : 'Mark as read'
                                    }
                                  >
                                    {n.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Edit Notification memo for current user */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(n.id);
                                      setEditTitle(n.title);
                                      setEditMsg(n.message);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                                    title={lang === 'ar' ? 'تعديل التنبيه لحسابي فقط' : 'Edit for my account'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Notification for current user */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(n.id);
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                    title={lang === 'ar' ? 'حذف التنبيه من حسابي فقط' : 'Delete for my account'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Tab Content: Compose / Dispatch Targeted Instant Notification */
          <form onSubmit={handleSendNotification} className="p-5 space-y-4 overflow-y-auto flex-1">
            {sendSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{sendSuccessMsg}</span>
              </div>
            )}

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'إرسال تنبيه فوري دقيق وموجه حسب الجمهور أو المستخدمين'
                      : 'Dispatch Highly Targeted Instant Alert'}
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ar' ? 'المرسل:' : 'Sender:'} {currentUser?.name || role}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {lang === 'ar' ? 'عنوان التنبيه الفوري' : 'Alert Title'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'مثال: تنبيه عاجل بشأن موعد امتحان الفيزياء / إشعار انضباطي رسمي'
                      : 'Alert Title...'
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {lang === 'ar' ? 'نص التنبيه والتفاصيل' : 'Message Details'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب تفاصيل التنبيه الذي سيصل فوراً ومباشرة للجهة المحددة...'
                      : 'Write the alert message details...'
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Audience Scope Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'تحديد نطاق والجهة المستهدفة بالتنبيه' : 'Target Audience Scope'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'all'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lang === 'ar' ? 'كافة منسوبي المدرسة' : 'All School Members'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'إشعار عام يصل للجميع' : 'General public alert'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('students')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'students'
                        ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                      <span>{lang === 'ar' ? 'فئة الطالبات فقط' : 'Students Only'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'جميع طالبات المدرسة' : 'All enrolled students'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('parents')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'parents'
                        ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ar' ? 'أولياء الأمور فقط' : 'Parents Only'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'كافة أولياء الأمور' : 'All parents'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('teachers')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'teachers'
                        ? 'bg-teal-600/30 border-teal-500 text-white ring-1 ring-teal-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      <span>{lang === 'ar' ? 'الهيئة التدريسية فقط' : 'Teachers Only'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'كافة معلمات المدرسة' : 'All faculty staff'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('grade_section')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'grade_section'
                        ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>{lang === 'ar' ? 'صف وشعبة محددة' : 'Specific Grade & Section'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'طالبات مرحلة وشعبة معينة' : 'Specific class students'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('multi_students')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'multi_students'
                        ? 'bg-rose-600/30 border-rose-500 text-white ring-1 ring-rose-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                      <span>{lang === 'ar' ? 'طالبة أو أكثر بالاسم' : 'Select Specific Students'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'تحديد طالبات محددات' : 'Custom student list'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('multi_parents')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'multi_parents'
                        ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ar' ? 'أولياء أمور طالبات محددات' : 'Parents of Students'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'توجيه لولي أمر طالبة/طالبات' : 'Target parent of student'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('multi_teachers')}
                    className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                      targetAudience === 'multi_teachers'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lang === 'ar' ? 'معلمات محددات بالاسم' : 'Select Specific Teachers'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar' ? 'تحديد معلمات محددات' : 'Custom teacher list'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Conditional: Grade & Section Selector */}
              {targetAudience === 'grade_section' && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-indigo-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {lang === 'ar' ? 'الصف الدراسي المستهدف' : 'Target Grade'}
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {ALL_GRADES_LIST.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {lang === 'ar' ? 'الشعبة' : 'Section'}
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="الكل">{lang === 'ar' ? 'كافة الشُعب (أ + ب)' : 'All Sections'}</option>
                      <option value="أ">{lang === 'ar' ? 'شعبة أ فقط' : 'Section A'}</option>
                      <option value="ب">{lang === 'ar' ? 'شعبة ب فقط' : 'Section B'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional: Multi-Students Selector */}
              {(targetAudience === 'multi_students' || targetAudience === 'multi_parents') && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        {targetAudience === 'multi_parents'
                          ? lang === 'ar'
                            ? 'اختر الطالبة لتوجيه التنبيه لولي أمرها'
                            : 'Select students to notify their parents'
                          : lang === 'ar'
                          ? 'اختر الطالبة أو الطالبات المستهدفات'
                          : 'Select target students'}
                      </span>
                    </label>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400">
                        {lang === 'ar' ? 'تم اختيار:' : 'Selected:'} {selectedStudentIds.length}
                      </span>
                      {selectedStudentIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds([])}
                          className="text-rose-400 hover:underline mr-1"
                        >
                          {lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder={lang === 'ar' ? 'بحث بالاسم، الصف، أو ولي الأمر...' : 'Search student...'}
                      className="w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Selected Chips */}
                  {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      {selectedStudentIds.map((sId) => {
                        const std = students.find((s) => s.id === sId);
                        if (!std) return null;
                        return (
                          <span
                            key={sId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-bold"
                          >
                            <span>{std.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleStudentSelection(sId)}
                              className="text-rose-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Students Grid List */}
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {eligibleStudents.slice(0, 30).map((std) => {
                      const isSelected = selectedStudentIds.includes(std.id);
                      return (
                        <div
                          key={std.id}
                          onClick={() => toggleStudentSelection(std.id)}
                          className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-rose-950/40 border-rose-500/60 text-white'
                              : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-rose-600 focus:ring-0 pointer-events-none"
                            />
                            <span className="font-bold">{std.name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({std.gradeLevel} - شعبة {std.section})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{std.parentName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conditional: Multi-Teachers Selector */}
              {targetAudience === 'multi_teachers' && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'اختر المعلمة أو المعلمات المستهدفات' : 'Select target teachers'}</span>
                    </label>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400">
                        {lang === 'ar' ? 'تم اختيار:' : 'Selected:'} {selectedTeacherIds.length}
                      </span>
                      {selectedTeacherIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherIds([])}
                          className="text-emerald-400 hover:underline mr-1"
                        >
                          {lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teacher Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      placeholder={lang === 'ar' ? 'بحث باسم المعلمة أو المادة...' : 'Search teacher...'}
                      className="w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Selected Chips */}
                  {selectedTeacherIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      {selectedTeacherIds.map((tId) => {
                        const tech = teachers.find((t) => t.id === tId);
                        if (!tech) return null;
                        return (
                          <span
                            key={tId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold"
                          >
                            <span>{tech.name} ({tech.subject})</span>
                            <button
                              type="button"
                              onClick={() => toggleTeacherSelection(tId)}
                              className="text-emerald-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Teachers Grid */}
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {eligibleTeachers.map((tech) => {
                      const isSelected = selectedTeacherIds.includes(tech.id);
                      return (
                        <div
                          key={tech.id}
                          onClick={() => toggleTeacherSelection(tech.id)}
                          className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                              : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-emerald-600 focus:ring-0 pointer-events-none"
                            />
                            <span className="font-bold">{tech.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{tech.subject}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Severity & Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Severity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {lang === 'ar' ? 'نوع ودرجة أهمية التنبيه' : 'Alert Severity'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="info">🔵 {lang === 'ar' ? 'إعلامي / عادي' : 'Info'}</option>
                    <option value="warning">⚠️ {lang === 'ar' ? 'تحذيري / إداري' : 'Warning'}</option>
                    <option value="alert">🚨 {lang === 'ar' ? 'طارئ جداً وعاجل' : 'Urgent Alert'}</option>
                    <option value="success">✅ {lang === 'ar' ? 'نجاح وتكريم إيجابي' : 'Success & Recognition'}</option>
                    <option value="security">🛡️ {lang === 'ar' ? 'أمني / نظام' : 'Security'}</option>
                  </select>
                </div>

                {/* Pinning Option */}
                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl mt-auto">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {lang === 'ar' ? 'تثبيت التنبيه في أعلى القائمة' : 'Pin at Top'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'ar' ? 'يظهر كإشعار ذو أولوية قصوى' : 'Highest priority'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('feed')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-600/30 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إرسال التنبيه الفوري الآن 📣' : 'Dispatch Alert Now 📣'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? `المستخدم الحالي: ${currentUser?.name || role}`
              : `Active user: ${currentUser?.name || role}`}
          </span>
          <div className="flex items-center gap-2">
            {activeTab === 'feed' && userNotifications.length > 0 && (
              <button
                onClick={() => clearAllUserNotifications()}
                className="text-rose-400 hover:text-rose-300 text-[11px] font-bold transition-colors"
              >
                {lang === 'ar' ? 'تفريغ التنبيهات من حسابي' : 'Clear for My Account'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
