/**
 * Header Component for Maysan High School for Gifted Girls
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, DirectMessage } from '../types';
import {
  isMessageDeletedForUser,
  isMessageTrashForUser,
  isMessageSpamForUser,
  isMessageReadForUser,
} from '../utils/messageUtils';
import { RoleAuthModal } from './RoleAuthModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { COLOR_THEMES_LIST } from '../types';
import {
  GraduationCap,
  Bell,
  Globe,
  UserCheck,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  KeyRound,
  Moon,
  Sun,
  HelpCircle,
  Palette,
  Eye,
  X,
} from 'lucide-react';

export const Header: React.FC<{
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
}> = ({ onOpenNotifications, onOpenMessages }) => {
  const { role, setRole, currentUser, lang, setLang, colorTheme, isDarkMode, toggleDarkMode, t, notifications, getUserNotifications, messages, teachers, students, parents, schoolAdminData } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [targetAuthRole, setTargetAuthRole] = useState<UserRole | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const activeThemeObj = COLOR_THEMES_LIST.find((th) => th.id === colorTheme);

  const activeParentObj =
    parents.find(
      (p) =>
        (currentUser?.id && p.id === currentUser.id) ||
        (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && p.phone === currentUser.phone)
    ) || currentUser?.parentObj;

  const daughter =
    students.find(
      (s) =>
        (activeParentObj && s.parentEmail.toLowerCase() === activeParentObj.email.toLowerCase()) ||
        (activeParentObj && s.parentPhone === activeParentObj.phone) ||
        (activeParentObj && s.parentName === activeParentObj.name) ||
        (currentUser?.studentObj && s.id === currentUser.studentObj.id)
    ) || students[0];

  const userNotifications = getUserNotifications();

  const unreadNotifs = userNotifications.filter((n) => !n.isRead).length;

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
        (currentUser?.name && (s.name.toLowerCase() === currentUser.name.toLowerCase() || currentUser.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(currentUser.name.toLowerCase())))
    );

  const currentUserId =
    currentUser?.id ||
    (role === 'admin'
      ? 'admin-main'
      : role === 'teacher'
      ? activeTeacherObj?.id || 'teacher-default'
      : role === 'student'
      ? activeStudentObj?.id || students[0]?.id || 'std-default'
      : role === 'parent'
      ? activeParentObj?.id || parents[0]?.id || 'prt-default'
      : 'sup-1');

  const currentUserName =
    currentUser?.name ||
    (role === 'admin'
      ? 'إدارة ثانوية ميسان للمتميزات'
      : role === 'teacher'
      ? activeTeacherObj?.name || 'أستاذ المادة / الهيئة التدريسية'
      : role === 'student'
      ? activeStudentObj?.name || students[0]?.name || 'طالبة متميزة'
      : role === 'parent'
      ? activeParentObj?.name || parents[0]?.name || 'ولي أمر الطالبة'
      : 'المشرف التربوي');

  const isUserInboxMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (isMessageSpamForUser(m, currentUserId)) return false;
    if (m.isDraft || m.folder === 'drafts' || m.folder === 'sent') return false;

    // Role broadcasts
    if (m.receiverId === 'broadcast-all-teachers' && role === 'teacher') return true;
    if (m.receiverId === 'broadcast-all-students' && role === 'student') return true;
    if (m.receiverId === 'broadcast-all-parents' && role === 'parent') return true;

    // Multi-recipient array check
    if (m.receiverIds && Array.isArray(m.receiverIds) && m.receiverIds.includes(currentUserId)) return true;
    if (m.recipients && Array.isArray(m.recipients) && m.recipients.some((r) => r.id === currentUserId)) return true;

    // Comma-separated receiverId check
    if (m.receiverId && typeof m.receiverId === 'string' && m.receiverId.includes(',')) {
      if (m.receiverId.split(',').includes(currentUserId)) return true;
    }

    // Direct Receiver ID match
    if (m.receiverId && m.receiverId === currentUserId) return true;

    // Direct Receiver Name match
    if (currentUserName && m.receiverName && m.receiverName.toLowerCase().includes(currentUserName.toLowerCase())) return true;

    // Role-specific entity matches
    if (role === 'teacher' && activeTeacherObj) {
      if (m.receiverIds?.includes(activeTeacherObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeTeacherObj.id)) return true;
      if (m.receiverId === activeTeacherObj.id || (m.receiverName && m.receiverName.includes(activeTeacherObj.name))) return true;
    }

    if (role === 'student' && activeStudentObj) {
      if (m.receiverIds?.includes(activeStudentObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeStudentObj.id)) return true;
      if (m.receiverId === activeStudentObj.id || (m.receiverName && m.receiverName.includes(activeStudentObj.name))) return true;
    }

    if (role === 'parent' && activeParentObj) {
      if (m.receiverIds?.includes(activeParentObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeParentObj.id)) return true;
      if (m.receiverId === activeParentObj.id || (m.receiverName && m.receiverName.includes(activeParentObj.name))) return true;
      if (activeParentObj.phone && m.receiverId?.includes(`parent-${activeParentObj.phone}`)) return true;
      if (daughter && (m.receiverId?.includes(daughter.id) || m.receiverId?.includes(`parent-${daughter.id}`))) return true;
    }

    if (role === 'admin') {
      if (m.receiverId === 'admin-main' || m.receiverId === 'admin-1' || m.receiverIds?.includes('admin-main')) return true;
    }

    if (role === 'supervisor') {
      if (m.receiverId === 'sup-1' || m.receiverIds?.includes('sup-1')) return true;
    }

    return false;
  };

  const unreadMsgs = messages.filter((m) => isUserInboxMessage(m) && !isMessageReadForUser(m, currentUserId)).length;

  React.useEffect(() => {
    const handleOpenModal = () => setIsChangePasswordOpen(true);
    window.addEventListener('open-change-password-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-change-password-modal', handleOpenModal);
    };
  }, []);

  const rolesList: { id: UserRole; titleAr: string; titleEn: string; iconStr: string }[] = [
    { id: 'admin', titleAr: 'المديرة والإدارة', titleEn: 'Principal & Admin', iconStr: '👑' },
    { id: 'teacher', titleAr: 'الهيئة التدريسية', titleEn: 'Faculty Teacher', iconStr: '👩‍🏫' },
    { id: 'student', titleAr: 'الطالبات المتميزات', titleEn: 'Gifted Student', iconStr: '🎓' },
    { id: 'parent', titleAr: 'أولياء الأمور', titleEn: 'Parent / Guardian', iconStr: '👪' },
    { id: 'supervisor', titleAr: 'المشرف التربوي', titleEn: 'Educational Supervisor', iconStr: '🏛️' },
  ];

  const activeRoleObj = rolesList.find((r) => r.id === role);

  const handleInitiateRoleSwitch = (selectedRole: UserRole) => {
    setTargetAuthRole(selectedRole);
    setIsAuthModalOpen(true);
    setShowRoleMenu(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40 transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* School Brand / Crest */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 font-bold">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-arabic">
                  {lang === 'ar' ? 'ثانوية ميسان للمتميزات' : (schoolAdminData?.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students')}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                {t.schoolTagline}
              </p>
            </div>
          </div>

          {/* Right Controls: Role Switcher, Dark Mode, Notifications, Language */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title="تغيير اللغة / Change Language"
            >
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Direct Messages Icon */}
            <button
              onClick={onOpenMessages}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title={lang === 'ar' ? 'الرسائل المباشرة' : 'Direct Messages'}
            >
              <span className="text-base">💬</span>
              {unreadMsgs > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadMsgs}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title={t.notifications}
            >
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Active Logged-in User Badge */}
            {currentUser?.name && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate max-w-[170px]">{currentUser.name}</span>
              </div>
            )}

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all border border-indigo-500"
              >
                <span>{activeRoleObj?.iconStr}</span>
                <span className="hidden sm:inline">
                  {lang === 'ar' ? activeRoleObj?.titleAr : activeRoleObj?.titleEn}
                </span>
                <UserCheck className="w-4 h-4 text-white" />
              </button>

              {showRoleMenu && (
                <div
                  className={`absolute ${
                    lang === 'ar' ? 'left-0' : 'right-0'
                  } mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2.5 z-50 text-right font-arabic`}
                >
                  {/* Current Active User Info */}
                  {currentUser?.name && (
                    <div className="px-3 py-2 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-xl mb-2 border border-indigo-100 dark:border-indigo-900 text-right">
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">الحساب النشط حالياً:</div>
                      <div className="text-xs font-black text-indigo-950 dark:text-indigo-100">{currentUser.name}</div>
                      {currentUser.subject && (
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">قسم {currentUser.subject}</div>
                      )}
                    </div>
                  )}

                  <div className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>{t.switchRole}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      مؤمن بالرمز السري
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {rolesList.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleInitiateRoleSwitch(r.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          role === r.id
                            ? 'bg-indigo-600 text-white font-bold shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{r.iconStr}</span>
                          <span>{lang === 'ar' ? r.titleAr : r.titleEn}</span>
                        </div>
                        {role === r.id ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            رمز سري 🔒
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all border border-amber-200/70 dark:border-amber-800"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{lang === 'ar' ? 'تغيير كلمة السر لهذا الحساب' : 'Change Password'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setIsThemeModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[11px] font-bold transition-all border border-teal-200 dark:border-teal-800"
                    >
                      <Palette className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{lang === 'ar' ? 'تغيير ألوان الموقع (ألوان مريحة)' : 'Change Color Palette'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Role Authentication Modal */}
      <RoleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetRole={targetAuthRole}
        onSuccess={(newRole) => {
          setRole(newRole);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Eye-Soothing Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </header>
  );
};
