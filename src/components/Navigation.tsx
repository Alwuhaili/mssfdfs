/**
 * Role-Based Navigation Bar for Maysan High School for Gifted Girls
 */

import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck2,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  Megaphone,
  CircleDollarSign,
  BarChart3,
  ShieldCheck,
  Network,
  Award,
  Mail,
  Gamepad2,
  History,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { role, t, lang } = useApp();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = navContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // In RTL / LTR browsers, scrollLeft might be negative or positive
    const absScroll = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(absScroll < maxScroll - 2 || scrollLeft > 2);
    setCanScrollRight(absScroll > 2 || scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    checkScrollability();
    const el = navContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [role, activeTab]);

  // Scroll active tab into view gently
  useEffect(() => {
    if (navContainerRef.current) {
      const activeBtn = navContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = navContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const usersTab = {
    id: 'users',
    label: lang === 'ar' ? 'إدارة المستخدمين والرموز 🔑' : 'Users & Passcodes 🔑',
    icon: KeyRound,
  };

  const lessonPlansTab = {
    id: 'lesson_plans',
    label: lang === 'ar' ? 'الخطط السنوية واليومية 📋' : 'Annual & Daily Plans 📋',
    icon: ClipboardList,
  };

  const certTab = {
    id: 'certificates',
    label: lang === 'ar' ? 'الشهادات والنتائج' : 'Certificates & Grades',
    icon: Award,
  };

  const calendarTab = {
    id: 'calendar',
    label: lang === 'ar' ? 'التقويم الأكاديمي' : 'Academic Calendar',
    icon: CalendarDays,
  };

  const messagesTab = {
    id: 'messages',
    label: lang === 'ar' ? 'البريد والمراسلات' : 'Direct Mail',
    icon: Mail,
  };

  const graduatesTab = {
    id: 'graduates',
    label: lang === 'ar' ? 'الخريجون 🎓' : 'Graduates 🎓',
    icon: GraduationCap,
  };

  const challengesTab = {
    id: 'challenges',
    label: lang === 'ar' ? 'الألعاب والتحديات 🎮' : 'Games & Challenges 🎮',
    icon: Gamepad2,
  };

  const adminTabs = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    usersTab,
    lessonPlansTab,
    { id: 'lectures', label: t.navLectures, icon: BookOpen },
    challengesTab,
    calendarTab,
    messagesTab,
    graduatesTab,
    { id: 'teachers', label: t.navTeachers, icon: Users },
    { id: 'students', label: t.navStudents, icon: GraduationCap },
    { id: 'parents', label: lang === 'ar' ? 'أولياء الأمور' : 'Parents', icon: Users },
    { id: 'attendance', label: t.navAttendance, icon: CalendarCheck },
    certTab,
    { id: 'exams', label: t.navExams, icon: FileCheck2 },
    { id: 'reports', label: t.navReports, icon: BarChart3 },
    { id: 'financial', label: t.navFinancial, icon: CircleDollarSign },
    { id: 'audit_logs', label: lang === 'ar' ? 'سجل النشاط (Audit Log)' : 'Audit Log', icon: History },
    { id: 'backup', label: t.navBackup, icon: ShieldCheck },
    { id: 'integrations', label: t.navIntegrations, icon: Network },
  ];

  const teacherTabs = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    lessonPlansTab,
    challengesTab,
    calendarTab,
    messagesTab,
    graduatesTab,
    { id: 'exams', label: t.navExams, icon: FileCheck2 },
    { id: 'attendance', label: t.navAttendance, icon: CalendarCheck },
    { id: 'reports', label: t.navReports, icon: BarChart3 },
    { id: 'lectures', label: t.navLectures, icon: BookOpen },
    { id: 'timetable', label: t.navTimetable, icon: CalendarDays },
  ];

  const studentTabs = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    lessonPlansTab,
    challengesTab,
    calendarTab,
    messagesTab,
    graduatesTab,
    certTab,
    { id: 'exams', label: t.navExams, icon: FileCheck2 },
    { id: 'lectures', label: t.navLectures, icon: BookOpen },
    { id: 'timetable', label: t.navTimetable, icon: CalendarDays },
    { id: 'attendance', label: t.navAttendance, icon: CalendarCheck },
    { id: 'financial', label: t.navFinancial, icon: CircleDollarSign },
  ];

  const parentTabs = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    lessonPlansTab,
    challengesTab,
    calendarTab,
    messagesTab,
    graduatesTab,
    certTab,
    { id: 'attendance', label: t.navAttendance, icon: CalendarCheck },
    { id: 'exams', label: t.navExams, icon: FileCheck2 },
    { id: 'financial', label: t.navFinancial, icon: CircleDollarSign },
  ];

  const supervisorTabs = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    lessonPlansTab,
    { id: 'lectures', label: t.navLectures, icon: BookOpen },
    challengesTab,
    calendarTab,
    messagesTab,
    graduatesTab,
    certTab,
    { id: 'reports', label: t.navReports, icon: BarChart3 },
    { id: 'teachers', label: t.navTeachers, icon: Users },
    { id: 'integrations', label: t.navIntegrations, icon: Network },
  ];

  let currentTabs = adminTabs;
  if (role === 'teacher') currentTabs = teacherTabs;
  if (role === 'student') currentTabs = studentTabs;
  if (role === 'parent') currentTabs = parentTabs;
  if (role === 'supervisor') currentTabs = supervisorTabs;

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 text-slate-300 shadow-sm print:hidden relative group">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative flex items-center">
        {/* Scroll Right / Prev Button */}
        <button
          onClick={() => scrollByAmount(lang === 'ar' ? 'right' : 'left')}
          className="hidden sm:flex items-center justify-center p-1.5 rounded-lg bg-slate-800/90 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shrink-0 ml-1.5 shadow-md z-10 cursor-pointer"
          title="تمرير القائمة"
        >
          {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Scrollable Tabs Container with visible horizontal scrollbar */}
        <div
          ref={navContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto py-2.5 top-nav-scrollbar"
        >
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold ring-1 ring-indigo-400/50'
                    : 'hover:bg-slate-800/90 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Left / Next Button */}
        <button
          onClick={() => scrollByAmount(lang === 'ar' ? 'left' : 'right')}
          className="hidden sm:flex items-center justify-center p-1.5 rounded-lg bg-slate-800/90 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shrink-0 mr-1.5 shadow-md z-10 cursor-pointer"
          title="تمرير القائمة"
        >
          {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </nav>
  );
};
