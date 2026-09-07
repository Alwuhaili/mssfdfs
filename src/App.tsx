/**
 * Main Application Component for Maysan High School for Gifted Girls
 * ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { NotificationModal } from './components/NotificationModal';
import { MessagingModal } from './components/MessagingModal';
import { ExamTakingModal } from './components/ExamTakingModal';

const AppContent: React.FC = () => {
  const { role, activeTakingExam, setActiveTakingExam } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail && typeof e.detail.tab === 'string') {
        setActiveTab(e.detail.tab);
      }
    };
    const handleOpenNotif = () => setIsNotifOpen(true);
    const handleOpenMsg = () => setIsMsgOpen(true);

    window.addEventListener('switch-tab', handleSwitchTab as EventListener);
    window.addEventListener('open-notifications-modal', handleOpenNotif);
    window.addEventListener('open-messaging-modal', handleOpenMsg);

    return () => {
      window.removeEventListener('switch-tab', handleSwitchTab as EventListener);
      window.removeEventListener('open-notifications-modal', handleOpenNotif);
      window.removeEventListener('open-messaging-modal', handleOpenMsg);
    };
  }, []);

  // Modals state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--theme-bg,#f8fafc)] text-slate-800 dark:text-slate-100 flex flex-col font-arabic selection:bg-teal-500 selection:text-white transition-colors duration-300">
      
      {/* Top Bar Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenMessages={() => setIsMsgOpen(true)}
      />

      {/* Role-based Navigation Tabs */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {role === 'admin' && <AdminDashboard activeTab={activeTab} />}
        {role === 'teacher' && <TeacherDashboard activeTab={activeTab} />}
        {role === 'student' && <StudentDashboard activeTab={activeTab} />}
        {role === 'parent' && <ParentDashboard activeTab={activeTab} />}
        {role === 'supervisor' && <SupervisorDashboard activeTab={activeTab} />}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] dark:bg-slate-900 text-white py-6 text-center text-xs border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-200">
            جمهورية العراق - وزارة التربية - مديرية تربية ميسان - مدرسة ثانوية ميسان للمتميزات
          </p>
          <p className="text-[11px] text-slate-400">
            Maysan Secondary School For Distinguished Female Students © {new Date().getFullYear()} - All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <MessagingModal isOpen={isMsgOpen} onClose={() => setIsMsgOpen(false)} />

      {activeTakingExam && (
        <ExamTakingModal
          exam={activeTakingExam}
          onClose={() => setActiveTakingExam(null)}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
