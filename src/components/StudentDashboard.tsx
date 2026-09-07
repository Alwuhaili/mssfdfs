/**
 * Student Dashboard Component
 * مدرسة ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessagingSystem } from './MessagingSystem';
import { StudentCertificateManager } from './StudentCertificateManager';
import { AcademicCalendarWidget } from './AcademicCalendarWidget';
import { SchoolHomeOverview } from './SchoolHomeOverview';
import { WeeklyTimetableModal } from './WeeklyTimetableModal';
import { GraduatesView } from './GraduatesView';
import { InteractiveChallengesManager } from './InteractiveChallengesManager';
import { StudentIDCardModal } from './StudentIDCardModal';
import { DigitalLibraryReaderModal } from './DigitalLibraryReaderModal';
import { DigitalLibraryHub } from './DigitalLibraryHub';
import { LessonPlanningHub } from './LessonPlanningHub';
import { OfficialExamSchedulesManager } from './OfficialExamSchedulesManager';
import { getShieldThemeConfig } from '../data/shieldsData';
import { dispatchCustomEvent } from '../utils/events';
import { downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import { downloadDataUrlOrBlob } from '../utils/fileStorage';
import {
  isMaleTeacher,
  getSupervisorLabel,
  getTeacherSubjectTitle,
} from '../utils/teacherUtils';
import {
  GraduationCap,
  FileCheck2,
  BookOpen,
  CalendarDays,
  CalendarCheck,
  Megaphone,
  Award,
  Clock,
  Play,
  Download,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  CircleDollarSign,
  Receipt,
  Mail,
  UserCheck,
  MessageSquare,
  CheckCircle,
  Building2,
  Users,
  User,
  Filter,
  Reply,
  Search,
} from 'lucide-react';
import { DirectMessage, ALL_GRADES_LIST, OFFICIAL_SUBJECTS_LIST, GradeLevel } from '../types';
import { isMessageDeletedForUser, isMessageTrashForUser } from '../utils/messageUtils';

export const StudentDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const {
    currentUser,
    students,
    teachers,
    parents,
    exams,
    submissions,
    announcements,
    lectures,
    recordLectureDownload,
    timetable,
    attendance,
    financial,
    schoolAdminData,
    messages,
    sendMessage,
    setActiveTakingExam,
    lang,
    t,
  } = useApp();

  // Active student object derived dynamically from logged-in user
  const activeStudent =
    students.find(
      (s) =>
        (currentUser?.id && s.id === currentUser.id) ||
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && (s.phone === currentUser.phone || s.parentPhone === currentUser.phone)) ||
        (currentUser?.name && (s.name.toLowerCase() === currentUser.name.toLowerCase() || currentUser.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(currentUser.name.toLowerCase()))) ||
        (currentUser?.studentObj?.id && s.id === currentUser.studentObj.id)
    ) ||
    currentUser?.studentObj ||
    (currentUser?.name
      ? {
          id: currentUser.id || 'std-current',
          name: currentUser.name,
          nationalId: '1987654321',
          gradeLevel: currentUser.gradeLevel || 'الصف السادس العلمي',
          section: 'أ',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          gpa: 99.6,
          status: 'منتظمة' as const,
          enrollmentYear: '2022',
        }
      : null) ||
    students[0];

  const activeStudentId = activeStudent.id || 'std-1';

  const studentSubmissions = submissions.filter(
    (sub) => sub.studentId === activeStudentId || sub.studentName === activeStudent.name
  );

  // Filter exams strictly declared by teaching staff for this student's gradeLevel and section
  const studentClassExams = exams.filter((ex) => {
    const matchesGrade = !ex.gradeLevel || ex.gradeLevel === activeStudent.gradeLevel;
    const matchesSection =
      !ex.section || ex.section === 'الكل' || ex.section === activeStudent.section;
    return matchesGrade && matchesSection;
  });

  const [selectedExamResult, setSelectedExamResult] = useState<{
    exam: any;
    submission: any;
  } | null>(null);

  // Student ID Card Modal State
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  // Exam Subtab: Official Schedules vs Class Exams
  const [studentExamSubTab, setStudentExamSubTab] = useState<'schedules' | 'class_exams'>('schedules');

  // Digital Library & Lecture Filters State
  const [selectedLectureGrade, setSelectedLectureGrade] = useState<string>('all');
  const [selectedLectureSubject, setSelectedLectureSubject] = useState<string>('all');
  const [selectedLectureType, setSelectedLectureType] = useState<string>('all');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string>('all');
  const [lectureSearch, setLectureSearch] = useState<string>('');
  const [readingResource, setReadingResource] = useState<any | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);

  const availableLectureSubjects = OFFICIAL_SUBJECTS_LIST;

  const filteredLectures = lectures.filter((lec) => {
    const matchesGrade = selectedLectureGrade === 'all' || lec.gradeLevel === selectedLectureGrade;
    const matchesCategory =
      selectedLibraryCategory === 'all' ||
      lec.category === selectedLibraryCategory ||
      (selectedLibraryCategory === 'curriculum_book' && lec.isOfficialBook);
    const matchesSubject =
      selectedLectureSubject === 'all' ||
      lec.subject === selectedLectureSubject ||
      (selectedLectureSubject === 'الرياضيات' && lec.subject.includes('الرياضيات')) ||
      (selectedLectureSubject === 'الفيزياء' && lec.subject.includes('الفيزياء')) ||
      (selectedLectureSubject === 'علم الاحياء' && (lec.subject.includes('الأحياء') || lec.subject.includes('الاحياء'))) ||
      (selectedLectureSubject === 'الحاسوب' && lec.subject.includes('الحاسوب')) ||
      (selectedLectureSubject === 'اللغة الانجليزية' && (lec.subject.includes('الانجليزية') || lec.subject.includes('الإنكليزية') || lec.subject.includes('الإنجليزية'))) ||
      (selectedLectureSubject === 'التربية الاسلامية' && (lec.subject.includes('الاسلامية') || lec.subject.includes('الإسلامية'))) ||
      (selectedLectureSubject === 'التربية الاخلاقية' && (lec.subject.includes('الاخلاقية') || lec.subject.includes('الأخلاقية')));
    const matchesType = selectedLectureType === 'all' || lec.type === selectedLectureType;
    const matchesQuery =
      !lectureSearch.trim() ||
      lec.title.toLowerCase().includes(lectureSearch.toLowerCase()) ||
      lec.subject.toLowerCase().includes(lectureSearch.toLowerCase()) ||
      lec.teacherName.toLowerCase().includes(lectureSearch.toLowerCase()) ||
      lec.description.toLowerCase().includes(lectureSearch.toLowerCase());
    return matchesGrade && matchesCategory && matchesSubject && matchesType && matchesQuery;
  });

  const studentAttendance = attendance.filter(
    (att) => att.studentId === activeStudentId || att.studentName === activeStudent.name
  );
  const studentFinancial = financial.filter(
    (f) => f.studentId === activeStudentId || f.studentName === activeStudent.name
  );

  // Student Messaging State
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [timetableSelectedGrade, setTimetableSelectedGrade] = useState<GradeLevel>(
    (activeStudent?.gradeLevel as GradeLevel) || 'الصف السادس العلمي'
  );
  const [timetableSelectedSection, setTimetableSelectedSection] = useState<string>(
    activeStudent?.section || 'أ'
  );

  useEffect(() => {
    if (activeStudent?.gradeLevel) {
      setTimetableSelectedGrade(activeStudent.gradeLevel as GradeLevel);
    }
    if (activeStudent?.section) {
      setTimetableSelectedSection(activeStudent.section);
    }
  }, [activeStudent]);

  const STUDENT_TIMETABLE_PERIODS = [
    { period: 1, label: 'الحصة الأولى', timeSlot: '08:00 - 08:45' },
    { period: 2, label: 'الحصة الثانية', timeSlot: '08:50 - 09:35' },
    { period: 3, label: 'الحصة الثالثة', timeSlot: '09:40 - 10:25' },
    { period: 4, label: 'الحصة الرابعة', timeSlot: '10:30 - 11:15' },
    { period: 5, label: 'الحصة الخامسة', timeSlot: '11:20 - 12:05' },
    { period: 6, label: 'الحصة السادسة', timeSlot: '12:10 - 12:55' },
    { period: 7, label: 'الحصة السابعة', timeSlot: '01:00 - 01:45' },
  ];

  const STUDENT_TIMETABLE_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] as const;

  const getStudentTabSlot = (day: string, period: number) => {
    return timetable.find(
      (slot) =>
        slot.day === day &&
        slot.period === period &&
        (!slot.gradeLevel || slot.gradeLevel === timetableSelectedGrade) &&
        (!slot.section || timetableSelectedSection === 'الكل' || slot.section === timetableSelectedSection)
    );
  };
  const [msgTargetCategory, setMsgTargetCategory] = useState<'admin' | 'teacher' | 'student'>('teacher');
  const [msgReceiverId, setMsgReceiverId] = useState<string>('');
  const [msgSubject, setMsgSubject] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');
  const [msgSentAlert, setMsgSentAlert] = useState<boolean>(false);

  // Auto select default recipient when target category changes
  useEffect(() => {
    if (msgTargetCategory === 'admin') {
      setMsgReceiverId('admin-main');
    } else if (msgTargetCategory === 'teacher' && teachers.length > 0) {
      if (!msgReceiverId || !teachers.some((t) => t.id === msgReceiverId)) {
        setMsgReceiverId(teachers[0].id);
      }
    } else if (msgTargetCategory === 'student') {
      const classmates = students.filter((s) => s.id !== activeStudentId);
      if (classmates.length > 0 && (!msgReceiverId || !classmates.some((s) => s.id === msgReceiverId))) {
        setMsgReceiverId(classmates[0].id);
      }
    }
  }, [msgTargetCategory, teachers, students, activeStudentId]);

  const handleStudentSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgReceiverId || !msgSubject || !msgContent) return;

    let receiverName = 'المستلم';
    if (msgTargetCategory === 'admin') {
      receiverName = `إدارة المدرسة والمديرة (${schoolAdminData.principalName || 'الهام صبيح سعدون'})`;
    } else if (msgTargetCategory === 'teacher') {
      const foundTeacher = teachers.find((t) => t.id === msgReceiverId);
      if (foundTeacher) receiverName = `${foundTeacher.name} (أستاذة ${foundTeacher.subject})`;
    } else if (msgTargetCategory === 'student') {
      const foundStudent = students.find((s) => s.id === msgReceiverId);
      if (foundStudent) receiverName = `${foundStudent.name} (${foundStudent.gradeLevel})`;
    }

    sendMessage({
      senderId: activeStudentId,
      senderName: activeStudent.name,
      senderRole: 'student',
      receiverId: msgReceiverId,
      receiverName,
      subject: msgSubject,
      content: msgContent,
    });

    setMsgSentAlert(true);
    setMsgSubject('');
    setMsgContent('');
    setTimeout(() => {
      setMsgSentAlert(false);
    }, 3000);
  };

  const handleReply = (msg: DirectMessage) => {
    const isSenderAdmin = msg.senderRole === 'admin' || msg.senderId === 'admin-main';
    const isSenderTeacher = msg.senderRole === 'teacher' || teachers.some((t) => t.id === msg.senderId);

    if (isSenderAdmin) {
      setMsgTargetCategory('admin');
      setMsgReceiverId('admin-main');
    } else if (isSenderTeacher) {
      setMsgTargetCategory('teacher');
      setMsgReceiverId(msg.senderId);
    } else {
      setMsgTargetCategory('student');
      setMsgReceiverId(msg.senderId);
    }

    setMsgSubject(`رد: ${msg.subject.replace(/^رد:\s*/, '')}`);
    const formElem = document.getElementById('student-msg-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter messages for current student
  const studentMessages = messages.filter((m) => {
    if (isMessageDeletedForUser(m, activeStudentId) || isMessageTrashForUser(m, activeStudentId)) return false;

    const isRelevant =
      m.senderId === activeStudentId ||
      m.receiverId === activeStudentId ||
      m.receiverIds?.includes(activeStudentId) ||
      m.recipients?.some((r) => r.id === activeStudentId) ||
      m.senderName === activeStudent.name ||
      m.receiverName.includes(activeStudent.name);
    if (!isRelevant) return false;

    if (msgFilter === 'admin') {
      return m.senderRole === 'admin' || m.receiverId === 'admin-main' || m.receiverName.includes('إدارة');
    }
    if (msgFilter === 'teacher') {
      return (
        m.senderRole === 'teacher' ||
        teachers.some((t) => t.id === m.receiverId || t.id === m.senderId || m.receiverName.includes(t.name))
      );
    }
    if (msgFilter === 'student') {
      return (
        (m.senderRole === 'student' && m.receiverId !== 'admin-main') ||
        students.some((s) => s.id !== activeStudentId && (s.id === m.senderId || s.id === m.receiverId))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Student Profile Card */}
      <div className="p-6 rounded-3xl bg-indigo-600 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-indigo-600/15">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
            🎓
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold bg-white/20 text-white border border-white/20 px-2.5 py-0.5 rounded-full">
                {activeStudent.gradeLevel} - شعبة ({activeStudent.section})
              </span>
              <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                طالبة متميزة
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                معدل التميز: {activeStudent.gpa}%
              </span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white">{activeStudent.name}</h2>
            
            {/* Shields & Badges Ribbon */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {((activeStudent.shieldsAndBadges && activeStudent.shieldsAndBadges.length > 0)
                ? activeStudent.shieldsAndBadges.map((s) => s.title)
                : (activeStudent.badges || [])
              ).slice(0, 3).map((badgeTitle, idx) => {
                const theme = getShieldThemeConfig(badgeTitle);
                return (
                  <span
                    key={idx}
                    className="text-[10px] font-black bg-slate-950/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm"
                  >
                    <span>{theme.icon}</span>
                    <span>{badgeTitle}</span>
                  </span>
                );
              })}
              {((activeStudent.shieldsAndBadges?.length || activeStudent.badges?.length || 0) > 3) && (
                <span className="text-[10px] font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full">
                  +{(activeStudent.shieldsAndBadges?.length || activeStudent.badges?.length || 0) - 3} أوسمة أخرى
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsIdCardModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md transform hover:scale-105 cursor-pointer border border-amber-200"
            title="عرض وطباعة البطاقة التعريفية وسجل الأوسمة والدروع"
          >
            <Award className="w-4.5 h-4.5 text-slate-950" />
            <span>البطاقة التعريفية والأوسمة 🪪</span>
          </button>

          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer border border-white/20"
            title="عرض جدول الدروس الأسبوعي الشامل"
          >
            <CalendarDays className="w-4 h-4 text-white" />
            <span>الجدول 🗓️</span>
          </button>
        </div>
      </div>

      {/* Quick Action Bar Tile for Student Dashboard (شريط الإجراءات السريعة للطالبة المتميزة) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              شريط الإجراءات السريعة للطالبة المتميزة:
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2.5 py-0.5 rounded-full">
            اختصارات سريعة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Quick Action 1: ID Card Modal */}
          <button
            onClick={() => setIsIdCardModalOpen(true)}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-between gap-2 transition-all shadow-sm transform hover:-translate-y-0.5 cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0 text-slate-950" />
              <span className="truncate">البطاقة التعريفية والأوسمة</span>
            </div>
            <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-md font-extrabold">🪪 عرض</span>
          </button>

          {/* Quick Action 2: Weekly Timetable Modal */}
          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer hover:border-amber-500/50"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">جدول الدروس الأسبوعي</span>
            </div>
            <span className="text-[10px] bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded-md font-extrabold">🗓️ 7 دروس</span>
          </button>

          {/* Quick Action 3: View Exams */}
          <button
            onClick={() => {
              dispatchCustomEvent('switch-tab', { tab: 'exams' });
              const examsTabBtn = document.querySelector('[data-tab="exams"]') as HTMLElement;
              if (examsTabBtn) examsTabBtn.click();
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer hover:border-indigo-500/50"
          >
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="truncate">الامتحانات والنتائج</span>
            </div>
            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded-md font-bold">
              {studentClassExams.length}
            </span>
          </button>

          {/* Quick Action 4: Digital Library */}
          <button
            onClick={() => {
              dispatchCustomEvent('switch-tab', { tab: 'lectures' });
              const lecturesTabBtn = document.querySelector('[data-tab="lectures"]') as HTMLElement;
              if (lecturesTabBtn) lecturesTabBtn.click();
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer hover:border-emerald-500/50"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">المكتبة الرقمية</span>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded-md font-bold">
              {lectures.length}
            </span>
          </button>

          {/* Quick Action 5: Messages */}
          <button
            onClick={() => {
              dispatchCustomEvent('switch-tab', { tab: 'messages' });
              const msgTabBtn = document.querySelector('[data-tab="messages"]') as HTMLElement;
              if (msgTabBtn) msgTabBtn.click();
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer hover:border-sky-500/50"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 shrink-0 text-sky-400" />
              <span className="truncate">المراسلة والتواصل</span>
            </div>
            <span className="text-[10px] text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded-md font-bold">
              💬 إرسال
            </span>
          </button>
        </div>
      </div>

      {/* Main Switch Tabs */}

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {/* Annual & Daily Curriculum Plans Tab */}
      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub prefilteredGrade={activeStudent.gradeLevel} />
      )}

      {/* Challenges & Interactive Games Tab */}
      {activeTab === 'challenges' && <InteractiveChallengesManager />}

      {/* Certificates & Grade Management Tab */}
      {activeTab === 'certificates' && <StudentCertificateManager />}

      {/* Graduates Tab */}
      {activeTab === 'graduates' && <GraduatesView />}

      {/* Digital Library & Lectures Tab (المكتبة والمحاضرات الرقمية) */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <DigitalLibraryHub userRole="student" />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SchoolHomeOverview />
        </div>
      )}

      {/* Exams & Auto-Grading Dedicated Tab */}
      {activeTab === 'exams' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 font-arabic">
          {/* Sub-tab Switcher: Official Schedules vs Class Exams */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setStudentExamSubTab('schedules')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  studentExamSubTab === 'schedules'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>جداول الامتحانات الرسمية المعتمدة</span>
              </button>

              <button
                onClick={() => setStudentExamSubTab('class_exams')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  studentExamSubTab === 'class_exams'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>الامتحانات الإلكترونية وتصحيح النتائج ({studentClassExams.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                {activeStudent.gradeLevel} - شعبة ({activeStudent.section})
              </span>
            </div>
          </div>

          {studentExamSubTab === 'schedules' ? (
            <OfficialExamSchedulesManager userRole="student" />
          ) : (
            <>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                  <span>الامتحانات الصفية والإلكترونية اليومية:</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تظهر هنا حصراً الامتحانات المعلنة رسمياً من الهيئة التدريسية والخاصة بصفكِ وشعبتكِ فقط مع نظام التصحيح الفوري.
                </p>
              </div>

          {studentClassExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {studentClassExams.map((ex) => {
                const hasSubmitted = studentSubmissions.some((s) => s.examId === ex.id);
                const subObj = studentSubmissions.find((s) => s.examId === ex.id);

                return (
                  <div
                    key={ex.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                          مادة: {ex.subject}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {ex.durationMinutes} دقيقة
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 leading-snug pt-1">{ex.title}</h4>

                      <div className="text-xs text-slate-600 space-y-1 font-medium pt-1 border-t border-slate-200/60">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400">المدرسة المشرفة:</span>
                          <span className="font-bold text-slate-800">{ex.teacherName}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400">مخصص لـ:</span>
                          <span className="font-bold text-indigo-900">
                            {ex.gradeLevel} {ex.section && ex.section !== 'الكل' ? `(شعبة ${ex.section})` : '(جميع الشعب)'}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400">إجمالي الدرجة الكلية:</span>
                          <span className="font-mono font-bold text-slate-900">{ex.totalPoints} درجة</span>
                        </p>
                      </div>
                    </div>

                    {hasSubmitted && subObj ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-800 font-black flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم إجراء الامتحان والتصحيح بنجاح ✓</span>
                          </span>
                          <span className="font-mono font-black text-emerald-950 text-base bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-xs">
                            {subObj.score} / {subObj.totalPoints}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium pt-1 border-t border-emerald-200/60">
                          <span>النسبة المئوية: {subObj.percentage}%</span>
                          <span className="font-mono text-slate-600">تاريخ التسليم: {subObj.submittedAt}</span>
                        </div>
                        <button
                          onClick={() => setSelectedExamResult({ exam: ex, submission: subObj })}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>عرض ورقة التصحيح والحل النموذجي</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTakingExam(ex)}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>بدء خوض الامتحان الإلكتروني الآن</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">لا توجد امتحانات إلكترونية معلنة حالياً لصفكِ وشعبتكِ</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                لم تقم الهيئة التدريسية بنشر أي امتحانات جديدة لـ ({activeStudent.gradeLevel} - شعبة {activeStudent.section}) حتى الآن. سيتم إشعاركِ تلقائياً فور إعلان أي امتحان جديد.
              </p>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Digital Library & PDF Curriculum Tab */}
      {activeTab === 'lectures' && (
        <DigitalLibraryHub
          theme="light"
          userRole="student"
          defaultGrade={activeStudent?.gradeLevel || 'all'}
        />
      )}

      {/* Timetable Schedule Tab */}
      {activeTab === 'timetable' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-xl space-y-6">
          {/* Top Banner Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
                  <CalendarDays className="w-6 h-6 text-amber-400" />
                  <span>جدول الدروس الأسبوعي الشامل 🗓️</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  الصف والشعبة الحاليين: {activeStudent.gradeLevel} ({activeStudent.section})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                جدول الحصص الأسبوعي الرسمي • من الأحد إلى الخميس • 7 دروس يومياً • 45 دقيقة لكل درس مع 5 دقائق استراحة بين الدروس
              </p>
            </div>

            <button
              onClick={() => setIsTimetableModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md transform hover:scale-105 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-slate-950" />
              <span>عرض ملء الشاشة والطباعة 🖨️</span>
            </button>
          </div>

          {/* Filter & Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-bold text-slate-300">الصف الدراسي:</label>
                <select
                  value={timetableSelectedGrade}
                  onChange={(e) => setTimetableSelectedGrade(e.target.value as GradeLevel)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400"
                >
                  {ALL_GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">الشعبة:</label>
                <select
                  value={timetableSelectedSection}
                  onChange={(e) => setTimetableSelectedSection(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-400"
                >
                  <option value="أ">شعبة أ</option>
                  <option value="ب">شعبة ب</option>
                  <option value="جـ">شعبة جـ</option>
                  <option value="د">شعبة د</option>
                  <option value="الكل">جميع الشعب</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setTimetableSelectedGrade((activeStudent.gradeLevel as GradeLevel) || 'الصف السادس العلمي');
                setTimetableSelectedSection(activeStudent.section || 'أ');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>صفوف طالبتي الحالية ({activeStudent.gradeLevel} - {activeStudent.section})</span>
            </button>
          </div>

          {/* Time Slot Overview Strip */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>نظام التوقيت (45 دقيقة للدرس + 5 دقائق استراحة):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-300">
              {STUDENT_TIMETABLE_PERIODS.map((p) => (
                <span key={p.period} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                  حـ{p.period}: <span className="text-amber-300 font-bold">{p.timeSlot}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Main 5-Day x 7-Period Interactive Timetable Matrix */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-inner">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-indigo-200 font-black border-b border-slate-800">
                  <th className="p-3 border-r border-slate-800 text-center w-28 bg-slate-900/90 sticky right-0 z-10">
                    الحصة / التوقيت
                  </th>
                  {STUDENT_TIMETABLE_WEEKDAYS.map((day) => (
                    <th key={day} className="p-3 text-center border-r border-slate-800 min-w-[150px]">
                      <span className="block text-white font-extrabold text-sm">{day}</span>
                      <span className="text-[10px] text-amber-400 font-mono font-normal">7 دروس متتالية</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {STUDENT_TIMETABLE_PERIODS.map((periodObj, pIdx) => (
                  <React.Fragment key={periodObj.period}>
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      {/* Time Slot Column */}
                      <td className="p-3 border-r border-slate-800 text-center bg-slate-900/90 sticky right-0 z-10 space-y-0.5">
                        <div className="font-extrabold text-amber-300 text-xs">{periodObj.label}</div>
                        <div className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {periodObj.timeSlot}
                        </div>
                        <div className="text-[9px] text-emerald-400 font-sans">45 دقيقة</div>
                      </td>

                      {/* 5 Weekday Columns (الأحد إلى الخميس) */}
                      {STUDENT_TIMETABLE_WEEKDAYS.map((day) => {
                        const slot = getStudentTabSlot(day, periodObj.period);
                        return (
                          <td key={`${day}-${periodObj.period}`} className="p-2 border-r border-slate-800/80 align-top">
                            {slot ? (
                              <div className="group relative p-3 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-amber-400/80 hover:bg-slate-900 transition-all shadow-sm space-y-1.5">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-black text-white text-xs block leading-snug">
                                    {slot.subject}
                                  </span>
                                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                                    #حـ{slot.period}
                                  </span>
                                </div>

                                <div className="space-y-0.5 text-[11px]">
                                  <div className="text-indigo-300 font-semibold flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{slot.teacherName}</span>
                                  </div>
                                  <div className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate">{slot.room || 'قاعة 1'}</span>
                                  </div>
                                </div>

                                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
                                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300 font-bold border border-slate-800">
                                    شعبة ({slot.section || timetableSelectedSection})
                                  </span>
                                  <span className="text-slate-400 text-[9px]">{slot.gradeLevel || timetableSelectedGrade}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full min-h-[85px] p-2 rounded-2xl border border-dashed border-slate-800/60 bg-slate-950/30 text-slate-500 flex flex-col items-center justify-center gap-1 text-xs">
                                <span className="text-[10px] font-mono text-slate-600">- فارغ -</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* 5 Minute Break Row between periods */}
                    {pIdx < STUDENT_TIMETABLE_PERIODS.length - 1 && (
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

          {/* Grade & Section Subject Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>ملخص المواد والهيئة التدريسية المخصصة لـ ({timetableSelectedGrade} - شعبة {timetableSelectedSection}):</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                إجمالي الدروس المسجلة: {timetable.filter(s => (!s.gradeLevel || s.gradeLevel === timetableSelectedGrade) && (!s.section || timetableSelectedSection === 'الكل' || s.section === timetableSelectedSection)).length} حصة أسبوعياً
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {Array.from(
                new Set(
                  timetable
                    .filter(
                      (s) =>
                        (!s.gradeLevel || s.gradeLevel === timetableSelectedGrade) &&
                        (!s.section || timetableSelectedSection === 'الكل' || s.section === timetableSelectedSection)
                    )
                    .map((s) => s.subject)
                )
              ).map((sub) => {
                const teacherName =
                  timetable.find((s) => s.subject === sub)?.teacherName || 'مدرسة المادة';
                return (
                  <div key={sub} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white">{sub}</span>
                    <span className="text-indigo-300 text-[11px]">{teacherName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Tab */}
      {activeTab === 'attendance' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <span>سجل الحضور والغياب الخاص بالطالبة:</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">المدرسة</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-600">{att.date}</td>
                    <td className="p-3 font-bold text-slate-900">{att.subject}</td>
                    <td className="p-3 text-slate-700">{att.markedByTeacher}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          att.status === 'حاضرة'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Financial Statement & Allocation Tab */}
      {activeTab === 'financial' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 font-arabic">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                <span>التخصيص المالي والرسوم الأكاديمية الخاصة بالطالبة:</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                كشف المبالغ المسددة والمبالغ المترتبة بذمتكِ لثانوية ميسان للمتميزات
              </p>
            </div>
            <button
              onClick={() =>
                alert(
                  lang === 'ar'
                    ? 'جاري تصدير وصل كشف الحساب المالي المعتمد للطالبة PDF...'
                    : 'Exporting Student Financial Statement PDF...'
                )
              }
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تصدير كشف الحساب المالي</span>
            </button>
          </div>

          {/* Student Financial Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-500 block">إجمالي الرسوم المطلوبة الكلية:</span>
              <span className="text-xl font-black font-mono text-slate-900 block">
                {studentFinancial.reduce((sum, f) => sum + f.totalAmount, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">IQD</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <span className="text-xs font-bold text-emerald-800 block">إجمالي المبالغ المدفوعة (المسددة):</span>
              <span className="text-xl font-black font-mono text-emerald-700 block">
                {studentFinancial.reduce((sum, f) => sum + f.paidAmount, 0).toLocaleString()} <span className="text-xs font-normal text-emerald-600">IQD</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
              <span className="text-xs font-bold text-amber-900 block">المبالغ المترتبة بذمتي (المتبقي):</span>
              <span className="text-xl font-black font-mono text-amber-700 block">
                {studentFinancial.reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.paidAmount), 0).toLocaleString()} <span className="text-xs font-normal text-amber-600">IQD</span>
              </span>
            </div>
          </div>

          {/* Detailed Financial Records Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">نوع الرسم الدراسي / البند</th>
                  <th className="p-3.5">المبلغ المطلـوب الكلي</th>
                  <th className="p-3.5">المبلغ المدفوع</th>
                  <th className="p-3.5 bg-indigo-50/80 text-indigo-900 font-black">المبلغ المترتب بذمتكِ (المتبقي)</th>
                  <th className="p-3.5">حالة السداد</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentFinancial.length > 0 ? (
                  studentFinancial.map((fin) => {
                    const remaining = Math.max(0, fin.totalAmount - fin.paidAmount);
                    return (
                      <tr key={fin.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{fin.feeType}</td>
                        <td className="p-3.5 font-mono text-slate-900 font-bold">{fin.totalAmount.toLocaleString()} IQD</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{fin.paidAmount.toLocaleString()} IQD</td>
                        <td className="p-3.5 font-mono font-bold bg-indigo-50/30">
                          {remaining === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              0 IQD (مكتمل الدفع ✓)
                            </span>
                          ) : (
                            <span className="text-amber-700 font-extrabold">
                              {remaining.toLocaleString()} IQD
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              fin.status === 'مكتمل'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : fin.status === 'جزئي'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {fin.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">{fin.dueDate || '2026-09-01'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      لا توجد مستحقات مالية مسجلة باسمكِ حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Direct Messaging & Communications Hub Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6 font-arabic">
          <MessagingSystem embeddedMode={true} />
        </div>
      )}

      {/* Exam Result Breakdown Modal */}
      {selectedExamResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-arabic">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                  مادة: {selectedExamResult.exam.subject}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  نتيجة وورقة تصحيح: {selectedExamResult.exam.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExamResult(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">الدرجة النهائية المحرزة</span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {selectedExamResult.submission.score} / {selectedExamResult.submission.totalPoints}
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-emerald-800 font-bold block">النسبة المئوية</span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {selectedExamResult.submission.percentage}%
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-700">تفاصيل الأسئلة والتصحيح التلقائي:</h4>
              {selectedExamResult.exam.questions?.map((q: any, idx: number) => {
                const studentAnsIndex = selectedExamResult.submission.answers?.[q.id];
                const isCorrect = studentAnsIndex === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isCorrect ? 'bg-slate-50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">السؤال {idx + 1}: {q.text}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? `إجابة صحيحة (${q.points}/${q.points})` : `إجابة خاطئة (0/${q.points})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isStudentChoice = studentAnsIndex === optIdx;
                        const isRightAnswer = q.correctAnswer === optIdx;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isRightAnswer) {
                          optClass = 'bg-emerald-100 border-emerald-300 font-bold text-emerald-900';
                        } else if (isStudentChoice && !isCorrect) {
                          optClass = 'bg-rose-100 border-rose-300 font-bold text-rose-900 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                          >
                            <span>{opt}</span>
                            {isRightAnswer && <span className="text-[10px] text-emerald-700 font-bold">✓ الحل النموذجي</span>}
                            {isStudentChoice && !isRightAnswer && <span className="text-[10px] text-rose-700 font-bold">إجابتكِ</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedExamResult(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Timetable Full Modal */}
      <WeeklyTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
      />

      {/* Official Student ID Card & Shields Modal */}
      <StudentIDCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        student={activeStudent}
      />

      {/* Digital Library In-App PDF Reader Modal */}
      <DigitalLibraryReaderModal
        resource={readingResource}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setReadingResource(null);
        }}
      />

    </div>
  );
};
