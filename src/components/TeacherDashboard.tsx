/**
 * Teacher / Faculty Dashboard Component
 * ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GradeLevel, Question, AntiCheatConfig, ALL_GRADES_LIST, OFFICIAL_SUBJECTS_LIST, Section } from '../types';
import { dispatchCustomEvent } from '../utils/events';
import { AcademicCalendarWidget } from './AcademicCalendarWidget';
import { SchoolHomeOverview } from './SchoolHomeOverview';
import { MessagingSystem } from './MessagingSystem';
import { WeeklyTimetableModal } from './WeeklyTimetableModal';
import { TeacherUnifiedTimetableTab } from './TeacherUnifiedTimetableTab';
import { GraduatesView } from './GraduatesView';
import { InteractiveChallengesManager } from './InteractiveChallengesManager';
import { UploadPdfModal } from './UploadPdfModal';
import { DigitalLibraryReaderModal } from './DigitalLibraryReaderModal';
import { DigitalLibraryHub } from './DigitalLibraryHub';
import { ExamManagementHub } from './ExamManagementHub';
import { AcademicReportsHub } from './AcademicReportsHub';
import { AttendanceHistoryReviewPanel } from './AttendanceHistoryReviewPanel';
import { LessonPlanningHub } from './LessonPlanningHub';
import {
  isMaleTeacher,
  getCreatorSupervisorLabel,
  getSupervisorLabel,
  getTeacherSubjectTitle,
} from '../utils/teacherUtils';
import {
  FileCheck2,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  Plus,
  Send,
  ShieldAlert,
  Clock,
  Video,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Sparkles,
  HelpCircle,
  Eye,
  Mail,
  X,
  Building2,
  Printer,
  ShieldCheck,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  downloadElementAsPdf,
  downloadTextOrAttachmentAsPdf,
  exportAttendanceDispatchReportAsPdf,
} from '../utils/pdfExporter';
import { downloadDataUrlOrBlob } from '../utils/fileStorage';

export const TeacherDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const {
    currentUser,
    teachers,
    exams,
    createExam,
    submissions,
    students,
    logAttendance,
    lectures,
    addLecture,
    deleteLecture,
    recordLectureDownload,
    timetable,
    lang,
    t,
  } = useApp();

  // Derive logged-in teacher profile dynamically
  const activeTeacher =
    teachers.find(
      (tech) =>
        (currentUser?.id && tech.id === currentUser.id) ||
        (currentUser?.email && tech.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && tech.name.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser?.teacherObj?.id && tech.id === currentUser.teacherObj.id)
    ) || teachers[0];

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);

  // Create Exam Form state
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState(activeTeacher?.subject || 'الفيزياء المتقدمة');
  const [examGrade, setExamGrade] = useState<GradeLevel>(activeTeacher?.assignedGrades?.[0] || 'الصف السادس العلمي');
  const [examSection, setExamSection] = useState<Section | 'الكل'>('الكل');
  const [examDuration, setExamDuration] = useState(20);
  const [antiCheatConfig, setAntiCheatConfig] = useState<AntiCheatConfig>({
    enableTabSwitchDetection: true,
    maxTabSwitchesAllowed: 2,
    enableFullScreenEnforcement: true,
    disableCopyPaste: true,
    timeLimitMinutes: 20,
    randomizeQuestions: true,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-1',
      text: 'ما هي الشروط الواجب توافرها لتحقق حالة الرنين الكهربائي في دائرة التيار المتناوب RLC؟',
      options: [
        'تكون رادة الحث XL مساوية لـ XC المفاعلة السعوية',
        'تكون المقاومة R أعلى من Z',
        'ينعدم التردد تماماً',
        'تتضاعف القدرة الضائعة',
      ],
      correctAnswer: 0,
      points: 25,
      type: 'mcq',
    },
  ]);

  // Results Filtering & Sheet Modal state for Exams Tab
  const [resultFilterGrade, setResultFilterGrade] = useState<GradeLevel | 'الكل'>('الكل');
  const [resultFilterSection, setResultFilterSection] = useState<string>('الكل');
  const [resultFilterExamId, setResultFilterExamId] = useState<string>('الكل');
  const [resultSearchStudent, setResultSearchStudent] = useState<string>('');
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<{
    sub: any;
    exam: any;
    student: any;
  } | null>(null);

interface AttendanceDispatchReport {
  date: string;
  gradeLevel: GradeLevel;
  section: string;
  subject: string;
  teacherName: string;
  teacherEmail: string;
  adminEmail: string;
  totalStudents: number;
  stats: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  studentDetails: Array<{
    id: string;
    name: string;
    section: string;
    status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }>;
  dispatchedAt: string;
}

  // Attendance State
  const [teacherAttTab, setTeacherAttTab] = useState<'record' | 'review'>('record');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceGrade, setAttendanceGrade] = useState<GradeLevel>(activeTeacher?.assignedGrades?.[0] || 'الصف السادس العلمي');
  const [attendanceSection, setAttendanceSection] = useState<string>('الكل');
  const [attendanceSubject, setAttendanceSubject] = useState(activeTeacher?.subject || 'الفيزياء المتقدمة');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'>>({});
  const [dispatchReportModal, setDispatchReportModal] = useState<AttendanceDispatchReport | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Lecture Upload State
  const [lecTitle, setLecTitle] = useState('');
  const [lecSubject, setLecSubject] = useState(activeTeacher?.subject || 'الفيزياء المتقدمة');
  const [lecGrade, setLecGrade] = useState<GradeLevel>(activeTeacher?.assignedGrades?.[0] || 'الصف السادس العلمي');
  const [lecType, setLecType] = useState<'video' | 'pdf' | 'doc' | 'ppt'>('pdf');
  const [lecCategory, setLecCategory] = useState<string>('curriculum_book');
  const [lecUrl, setLecUrl] = useState('');
  const [lecDesc, setLecDesc] = useState('');

  // Modal and Filter States for Library
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [readingResource, setReadingResource] = useState<any | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [teacherLectureGradeFilter, setTeacherLectureGradeFilter] = useState<string>('all');
  const [teacherLectureSubjectFilter, setTeacherLectureSubjectFilter] = useState<string>('all');
  const [teacherCategoryFilter, setTeacherCategoryFilter] = useState<string>('all');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');

  const teacherAvailableSubjects = OFFICIAL_SUBJECTS_LIST;

  const teacherFilteredLectures = lectures.filter((lec) => {
    const matchesGrade = teacherLectureGradeFilter === 'all' || lec.gradeLevel === teacherLectureGradeFilter;
    const matchesCategory =
      teacherCategoryFilter === 'all' ||
      lec.category === teacherCategoryFilter ||
      (teacherCategoryFilter === 'curriculum_book' && lec.isOfficialBook);
    const matchesSubject =
      teacherLectureSubjectFilter === 'all' ||
      lec.subject === teacherLectureSubjectFilter ||
      (teacherLectureSubjectFilter === 'الرياضيات' && lec.subject.includes('الرياضيات')) ||
      (teacherLectureSubjectFilter === 'الفيزياء' && lec.subject.includes('الفيزياء')) ||
      (teacherLectureSubjectFilter === 'علم الاحياء' && (lec.subject.includes('الأحياء') || lec.subject.includes('الاحياء'))) ||
      (teacherLectureSubjectFilter === 'الحاسوب' && lec.subject.includes('الحاسوب')) ||
      (teacherLectureSubjectFilter === 'اللغة الانجليزية' && (lec.subject.includes('الانجليزية') || lec.subject.includes('الإنكليزية') || lec.subject.includes('الإنجليزية'))) ||
      (teacherLectureSubjectFilter === 'التربية الاسلامية' && (lec.subject.includes('الاسلامية') || lec.subject.includes('الإسلامية'))) ||
      (teacherLectureSubjectFilter === 'التربية الاخلاقية' && (lec.subject.includes('الاخلاقية') || lec.subject.includes('الأخلاقية')));
    const matchesSearch =
      !teacherSearchQuery.trim() ||
      lec.title.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      lec.subject.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      lec.description.toLowerCase().includes(teacherSearchQuery.toLowerCase());
    return matchesGrade && matchesCategory && matchesSubject && matchesSearch;
  });

  // Keep state synced when logged-in teacher changes
  React.useEffect(() => {
    if (activeTeacher) {
      setExamSubject(activeTeacher.subject);
      setAttendanceSubject(activeTeacher.subject);
      setLecSubject(activeTeacher.subject);
      if (activeTeacher.assignedGrades && activeTeacher.assignedGrades.length > 0) {
        setExamGrade(activeTeacher.assignedGrades[0]);
        setAttendanceGrade(activeTeacher.assignedGrades[0]);
        setLecGrade(activeTeacher.assignedGrades[0]);
      }
    }
  }, [activeTeacher?.id, activeTeacher?.subject]);

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: 'سؤال جديد...',
      options: ['خيار أ', 'خيار ب', 'خيار جـ', 'خيار د'],
      correctAnswer: 0,
      points: 25,
      type: 'mcq',
    };
    setQuestions([...questions, newQ]);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال عنوان الامتحان الشامل!' : 'Please enter an exam title!');
      return;
    }

    // Strict Subject & Assignment Validation
    const teacherSubject = activeTeacher?.subject || 'المادة الدراسية';
    const assignedGrades = activeTeacher?.assignedGrades && activeTeacher.assignedGrades.length > 0
      ? activeTeacher.assignedGrades
      : ALL_GRADES_LIST;
    const assignedSections = activeTeacher?.assignedSections && activeTeacher.assignedSections.length > 0
      ? activeTeacher.assignedSections
      : ['أ', 'ب', 'جـ', 'د'];

    if (!assignedGrades.includes(examGrade)) {
      alert(
        lang === 'ar'
          ? `عذراً، الصف (${examGrade}) ليس ضمن الصفوف الموكلة إليكِ تدريسها من إدارة المدرسة!`
          : `The grade (${examGrade}) is not assigned to you by school administration.`
      );
      return;
    }

    if (examSection !== 'الكل' && !assignedSections.includes(examSection as Section)) {
      alert(
        lang === 'ar'
          ? `عذراً، الشعبة (${examSection}) ليست ضمن الشعب الموكلة إليكِ من إدارة المدرسة!`
          : `The section (${examSection}) is not assigned to you.`
      );
      return;
    }

    createExam({
      title: examTitle,
      subject: teacherSubject,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      gradeLevel: examGrade,
      section: examSection,
      durationMinutes: examDuration,
      status: 'جاري',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalPoints: questions.reduce((acc, q) => acc + q.points, 0),
      antiCheat: antiCheatConfig,
      questions,
    });

    setExamTitle('');
    alert(
      lang === 'ar'
        ? `تم نشر امتحان مادة (${teacherSubject}) للصف (${examGrade} - شعبة ${examSection === 'الكل' ? 'جميع الشعب' : examSection}) بنجاح، وإشعار الطالبات فوراً!`
        : 'Exam published successfully!'
    );
  };

  const handleBulkMarkAttendance = (status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة') => {
    const filteredStudents = students.filter(
      (s) => s.gradeLevel === attendanceGrade && (attendanceSection === 'الكل' || s.section === attendanceSection)
    );
    const newMap = { ...attendanceMap };
    filteredStudents.forEach((std) => {
      newMap[std.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSaveAttendance = () => {
    const filteredStudents = students.filter(
      (s) => s.gradeLevel === attendanceGrade && (attendanceSection === 'الكل' || s.section === attendanceSection)
    );

    if (filteredStudents.length === 0) {
      alert(lang === 'ar' ? 'لا توجد طالبات مقيدات في هذا الصف والشعبة حالياً!' : 'No students found for this grade and section!');
      return;
    }

    const records = filteredStudents.map((std) => ({
      date: attendanceDate,
      studentId: std.id,
      studentName: std.name,
      gradeLevel: std.gradeLevel,
      section: std.section || 'أ',
      status: attendanceMap[std.id] || 'حاضرة',
      subject: attendanceSubject,
      markedByTeacher: activeTeacher.name,
      parentNotified: true,
    }));

    // Log & Save in local storage & send inbox alerts
    logAttendance(records, {
      teacherEmail: activeTeacher.email || 'teacher@maysan-gifted.edu.iq',
      teacherName: activeTeacher.name,
      teacherId: activeTeacher.id,
    });

    const presentCount = records.filter((r) => r.status === 'حاضرة').length;
    const absentCount = records.filter((r) => r.status === 'غائبة').length;
    const lateCount = records.filter((r) => r.status === 'متأخرة').length;
    const excusedCount = records.filter((r) => r.status === 'مجازة').length;

    const reportPayload: AttendanceDispatchReport = {
      date: attendanceDate,
      gradeLevel: attendanceGrade,
      section: attendanceSection,
      subject: attendanceSubject,
      teacherName: activeTeacher.name,
      teacherEmail: activeTeacher.email || 'teacher@maysan-gifted.edu.iq',
      adminEmail: 'admin@maysan-gifted.edu.iq',
      totalStudents: filteredStudents.length,
      stats: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
      },
      studentDetails: filteredStudents.map((std) => ({
        id: std.id,
        name: std.name,
        section: std.section || 'أ',
        status: (attendanceMap[std.id] || 'حاضرة') as 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة',
        parentName: std.parentName,
        parentPhone: std.parentPhone,
        parentEmail: std.parentEmail || 'parent@maysan-gifted.edu.iq',
      })),
      dispatchedAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
    };

    setDispatchReportModal(reportPayload);
  };

  const handlePrintCurrentAttendance = () => {
    const filteredStudents = students.filter(
      (s) => s.gradeLevel === attendanceGrade && (attendanceSection === 'الكل' || s.section === attendanceSection)
    );

    const records = filteredStudents.map((std) => ({
      id: std.id,
      name: std.name,
      section: std.section || 'أ',
      status: (attendanceMap[std.id] || 'حاضرة') as 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة',
      parentName: std.parentName,
      parentPhone: std.parentPhone,
      parentEmail: std.parentEmail || 'parent@maysan-gifted.edu.iq',
    }));

    const presentCount = records.filter((r) => r.status === 'حاضرة').length;
    const absentCount = records.filter((r) => r.status === 'غائبة').length;
    const lateCount = records.filter((r) => r.status === 'متأخرة').length;
    const excusedCount = records.filter((r) => r.status === 'مجازة').length;

    const reportPayload: AttendanceDispatchReport = {
      date: attendanceDate,
      gradeLevel: attendanceGrade,
      section: attendanceSection,
      subject: attendanceSubject,
      teacherName: activeTeacher.name,
      teacherEmail: activeTeacher.email || 'teacher@maysan-gifted.edu.iq',
      adminEmail: 'admin@maysan-gifted.edu.iq',
      totalStudents: filteredStudents.length,
      stats: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
      },
      studentDetails: records,
      dispatchedAt: new Date().toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US'),
    };

    setDispatchReportModal(reportPayload);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleUploadLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecTitle) return;

    const isMale = isMaleTeacher(activeTeacher || currentUser);
    const teacherRoleTitle = getTeacherSubjectTitle(activeTeacher || currentUser);
    const supervisorRoleLabel = getSupervisorLabel(activeTeacher || currentUser);

    const teacherNameFromUser =
      activeTeacher?.name || currentUser?.name || currentUser?.teacherObj?.name || teacherRoleTitle;

    addLecture({
      title: lecTitle,
      subject: lecSubject,
      teacherName: teacherNameFromUser,
      gradeLevel: lecGrade,
      type: lecType,
      category: (lecCategory as any) || 'curriculum_book',
      fileUrl: lecUrl || '#',
      description: lecDesc || `ملف تعليمي في مادة ${lecSubject} تم نشره بواسطة ${teacherNameFromUser}`,
      fileSize: '4.8 MB',
      pageCount: 120,
      isOfficialBook: lecCategory === 'curriculum_book',
      sampleContentText: `محتوى تم رفعه وتضمينه بواسطة ${supervisorRoleLabel}: ${teacherNameFromUser}.\n\nعنوان المرجع: ${lecTitle}\nالصف: ${lecGrade} | المادة: ${lecSubject}\n\nالوصف:\n${lecDesc || 'لا يوجد وصف إضافي'}`,
    });

    setLecTitle('');
    setLecDesc('');
    setLecUrl('');
    alert(
      lang === 'ar'
        ? `تم رفع وإضافة المرجع التعليمي (${lecTitle}) باسم ${supervisorRoleLabel} (${teacherNameFromUser}) بنجاح!`
        : 'Resource uploaded successfully!'
    );
  };

  return (
    <>
      <div className="space-y-6 font-arabic print:hidden">
      
      {/* Teacher Welcome Header */}
      <div className="p-6 rounded-3xl bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-600/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{t.teacher} - ثانوية ميسان للمتميزات</span>
          </div>
          <h2 className="text-xl font-black mt-1 text-white">{activeTeacher.name} - قسم {activeTeacher.subject}</h2>
          <p className="text-xs text-indigo-100 mt-1">
            {lang === 'ar' ? 'نظام إدارة الاختبارات الرقمية، تسجيل الحضور، ورفع المحاضرات التفاعلية' : 'Online exam portal, attendance tracking, & resources'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md transform hover:scale-105 cursor-pointer"
            title="عرض جدول الدروس الأسبوعي الشامل"
          >
            <CalendarDays className="w-4 h-4 text-slate-950" />
            <span>جدول الدروس 🗓️</span>
          </button>
        </div>
      </div>

      {/* Main Content Tabs */}

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {/* Annual & Daily Lesson Planning Hub (الخطة السنوية واليومية للمدرسين) */}
      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub defaultTeacherSubject={activeTeacher?.subject} />
      )}

      {/* Challenges & Competitions Tab */}
      {activeTab === 'challenges' && <InteractiveChallengesManager />}

      {/* Messages Tab */}
      {activeTab === 'messages' && <MessagingSystem embeddedMode={true} />}

      {/* Graduates Tab */}
      {activeTab === 'graduates' && <GraduatesView />}

      {/* Overview Tab */}
      {activeTab === 'overview' && <SchoolHomeOverview />}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <ExamManagementHub
          userRole="teacher"
          defaultTeacherSubject={activeTeacher?.subject}
          defaultTeacherName={activeTeacher?.name}
          defaultTeacherId={activeTeacher?.id}
        />
      )}

      {/* Academic Reports & Statistical Analytics Tab */}
      {activeTab === 'reports' && <AcademicReportsHub userRole="teacher" />}

      {/* Digital Library & Curriculum Management Tab (المكتبة والمحاضرات الرقمية) */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <DigitalLibraryHub
            userRole="teacher"
            onOpenUploadModal={() => setIsUploadPdfModalOpen(true)}
            theme="dark"
          />
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <TeacherUnifiedTimetableTab
          activeTeacher={activeTeacher}
          onOpenComprehensiveModal={() => setIsTimetableModalOpen(true)}
        />
      )}

      {/* Attendance Tracker Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl w-fit border border-slate-800 shadow-inner">
            <button
              onClick={() => setTeacherAttTab('record')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                teacherAttTab === 'record'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-emerald-300" />
              <span>📋 رصد وتثبيت الحضور اليومي</span>
            </button>

            <button
              onClick={() => setTeacherAttTab('review')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                teacherAttTab === 'review'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-teal-300" />
              <span>📝 مراجعة وتدقيق وتعديل سجلات الأيام السابقة</span>
            </button>
          </div>

          {teacherAttTab === 'review' ? (
            <AttendanceHistoryReviewPanel />
          ) : (
            <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                <span>{t.markAttendance} (رصد اليوم والتنبيه الفوري):</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ar' ? 'رصد الحضور والغياب اليومي حسب الصف والشعبة مع إشعارات أولياء الأمور' : 'Daily attendance tracker by grade and section'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold">التاريخ:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Grade Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold">الصف:</span>
                <select
                  value={attendanceGrade}
                  onChange={(e) => setAttendanceGrade(e.target.value as GradeLevel)}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {ALL_GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade} className="bg-slate-900 text-white">
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector (الشعبة) */}
              <div className="flex items-center gap-1.5 bg-teal-950/60 px-3.5 py-1.5 rounded-xl border border-teal-500/50 shadow-sm shadow-teal-500/10">
                <span className="text-[11px] text-teal-300 font-bold flex items-center gap-1">
                  🏫 الشعبة:
                </span>
                <select
                  value={attendanceSection}
                  onChange={(e) => setAttendanceSection(e.target.value)}
                  className="bg-transparent text-teal-200 font-extrabold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="الكل" className="bg-slate-900 text-white">الكل (جميع الشعب)</option>
                  <option value="أ" className="bg-slate-900 text-white">شعبة ( أ )</option>
                  <option value="ب" className="bg-slate-900 text-white">شعبة ( ب )</option>
                  <option value="جـ" className="bg-slate-900 text-white">شعبة ( جـ )</option>
                  <option value="د" className="bg-slate-900 text-white">شعبة ( د )</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Bulk Action Toolbar & Target Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">إجراء سريع للشعبة المحددة:</span>
              <button
                type="button"
                onClick={() => handleBulkMarkAttendance('حاضرة')}
                className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all shadow-sm"
              >
                ✅ تحديد الكل حاضر
              </button>
              <button
                type="button"
                onClick={() => handleBulkMarkAttendance('غائبة')}
                className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition-all shadow-sm"
              >
                🚨 تحديد الكل غائب
              </button>
              <button
                type="button"
                onClick={() => handleBulkMarkAttendance('متأخرة')}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all shadow-sm"
              >
                ⏰ تحديد الكل متأخر
              </button>
            </div>

            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span>الطالبات المستهدفات:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black">
                {students.filter((s) => s.gradeLevel === attendanceGrade && (attendanceSection === 'الكل' || s.section === attendanceSection)).length} طالبة
              </span>
            </div>
          </div>

          {/* Students Attendance List */}
          <div className="space-y-3">
            {(() => {
              const filteredList = students
                .filter(
                  (s) => s.gradeLevel === attendanceGrade && (attendanceSection === 'الكل' || s.section === attendanceSection)
                )
                .sort((a, b) => a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' }));

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                    <p className="text-sm font-bold text-slate-400">
                      لا توجد طالبات مسجلات في {attendanceGrade} - {attendanceSection === 'الكل' ? 'جميع الشعب' : `شعبة (${attendanceSection})`}
                    </p>
                    <p className="text-xs text-slate-500">يرجى اختيار شعبة أخرى أو تغيير الصف الدراسي.</p>
                  </div>
                );
              }

              return filteredList.map((std) => {
                const currentStatus = attendanceMap[std.id] || 'حاضرة';
                return (
                  <div
                    key={std.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-teal-500/40 transition-all flex flex-wrap items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center">
                        {std.section || 'أ'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{std.name}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-teal-300 text-[10px] font-extrabold border border-teal-500/30">
                            شعبة ({std.section || 'أ'})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5"> ولي الأمر: {std.parentName} ({std.parentPhone})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['حاضرة', 'غائبة', 'متأخرة', 'مجازة'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setAttendanceMap({ ...attendanceMap, [std.id]: st })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            currentStatus === st
                              ? st === 'حاضرة'
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : st === 'غائبة'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                : st === 'متأخرة'
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🔒 تنبيه إلكتروني سري وفردي لكل ولي أمر خاص بابنته فقط (دون الاطلاع على حضور بقية الطالبات)</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handlePrintCurrentAttendance}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 border border-indigo-400/30"
              >
                <Printer className="w-4 h-4 text-emerald-300" />
                <span>طباعة وحفظ كشف الحضور (A4 / PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>حفظ وتثبيت سجل الحضور اليومي وإرسال التنبيهات</span>
              </button>
            </div>
          </div>
        </div>
          )}
        </div>
      )}

      {/* Digital Library & Curriculum Management Tab */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <DigitalLibraryHub
            theme="dark"
            userRole="teacher"
            onOpenUploadModal={() => setIsUploadPdfModalOpen(true)}
            defaultGrade={activeTeacher?.assignedGrades?.[0] || 'all'}
          />
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-300" />
              <span>الجدول المدرسي الأسبوعي للهيئة التدريسية:</span>
            </h3>

            <button
              onClick={() => setIsTimetableModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all shrink-0"
            >
              <CalendarDays className="w-4 h-4 text-slate-950" />
              <span>عرض والتعديل على الجدول الأسبوعي الشامل (7 دروس) 🗓️</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-indigo-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">اليوم</th>
                  <th className="p-3">التوقيت والحصة</th>
                  <th className="p-3">الصف الدراسي والشعبة</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">المدرس</th>
                  <th className="p-3">القاعة الدراسية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {timetable.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{slot.day}</td>
                    <td className="p-3 font-mono text-amber-300">{slot.timeSlot} (الحصة {slot.period})</td>
                    <td className="p-3 text-indigo-200">
                      {slot.gradeLevel} {slot.section ? `(شعبة ${slot.section})` : ''}
                    </td>
                    <td className="p-3 text-slate-300">{slot.subject}</td>
                    <td className="p-3 text-indigo-300">{slot.teacherName}</td>
                    <td className="p-3 font-semibold text-emerald-400">{slot.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance & Email Dispatch Confirmation Report Modal */}
      {dispatchReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-right text-slate-100 max-h-[90vh] overflow-y-auto my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>تم التثبيت والحفظ والإرسال الإلكتروني بنجاح 📧</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <CalendarCheck className="w-6 h-6 text-emerald-400" />
                  <span>تقرير تثبيت الحضور اليومي وإشعار البريد الإلكتروني</span>
                </h2>
                <p className="text-xs text-slate-400">
                  كشف رسمي موثق صادِر عن ثانوية ميسان للمتميزات بتاريخ {dispatchReportModal.date} ({dispatchReportModal.dispatchedAt})
                </p>
              </div>

              <button
                onClick={() => setDispatchReportModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email & System Notification Dispatch Targets Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-800/90 border border-indigo-500/30 space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>تخصيص وتوجيه التنبيهات الفورية والبريد الإلكتروني:</span>
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  توجيه مخصص ومحمي 🔒
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Current Subject Teacher */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>مدرس المادة فقط:</span>
                  </div>
                  <div className="text-xs font-bold text-white">{dispatchReportModal.teacherName}</div>
                  <div className="text-[10px] font-mono text-slate-300 truncate">{dispatchReportModal.teacherEmail}</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>الحساب الحالي فقط</span>
                  </div>
                </div>

                {/* 2. Outstanding Students */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>طالبات الصف والشعبة:</span>
                  </div>
                  <div className="text-xs font-bold text-teal-200">
                    {dispatchReportModal.gradeLevel} - {dispatchReportModal.section === 'الكل' ? 'جميع الشعب' : `شعبة (${dispatchReportModal.section})`}
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">({dispatchReportModal.totalStudents}) طالبة مستهدفة</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>الطالبات المحددات فقط</span>
                  </div>
                </div>

                {/* 3. Parents */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>أولياء أمور الشعبة:</span>
                  </div>
                  <div className="text-xs font-bold text-sky-200">
                    أولياء أمور ({dispatchReportModal.totalStudents}) طالبة
                  </div>
                  <div className="text-[10px] text-slate-300">تنبيه فردي وسري لكل ولي أمر</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>أولياء الشعبة فقط</span>
                  </div>
                </div>

                {/* 4. Principal & School Admin */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>المديرة والإدارة:</span>
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate">{dispatchReportModal.adminEmail}</div>
                  <div className="text-[10px] text-amber-200">كشف شامل للمراجعة الإدارية</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تم تسليم الكشف</span>
                  </div>
                </div>
              </div>

              {/* Strict Exclusion Notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>تأكيد الأمان والسرية:</strong> تم استثناء بقية أعضاء الهيئة التدريسية، بقية الطالبات، بقية أولياء الأمور، والمشرف التربوي نهائياً من استقبال هذه التنبيهات.
                </span>
              </div>
            </div>

            {/* Attendance Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-[11px] text-slate-400 font-bold">إجمالي الطالبات</div>
                <div className="text-xl font-black text-white">{dispatchReportModal.totalStudents}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/80">
                <div className="text-[11px] text-emerald-400 font-bold">الحاضرات</div>
                <div className="text-xl font-black text-emerald-400">{dispatchReportModal.stats.present}</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/80">
                <div className="text-[11px] text-rose-400 font-bold">الغائبات</div>
                <div className="text-xl font-black text-rose-400">{dispatchReportModal.stats.absent}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-800/80">
                <div className="text-[11px] text-amber-400 font-bold">المتأخرات</div>
                <div className="text-xl font-black text-amber-400">{dispatchReportModal.stats.late}</div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-950/50 border border-indigo-800/80 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-indigo-300 font-bold">المجازات</div>
                <div className="text-xl font-black text-indigo-300">{dispatchReportModal.stats.excused}</div>
              </div>
            </div>

            {/* Student List Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">سجل طالبات الشعبة والبريد الإلكتروني الموجه لكل ولي أمر:</h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-indigo-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">الطالبة</th>
                      <th className="p-3">الشعبة</th>
                      <th className="p-3">حالة الحضور</th>
                      <th className="p-3">ولي الأمر</th>
                      <th className="p-3">البريد الإلكتروني المستهدف</th>
                      <th className="p-3 text-center">حالة الإرسال البريدي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dispatchReportModal.studentDetails.map((std) => (
                      <tr key={std.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3 font-bold text-white">{std.name}</td>
                        <td className="p-3 font-semibold text-teal-300">شعبة ({std.section})</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                              std.status === 'حاضرة'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : std.status === 'غائبة'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : std.status === 'متأخرة'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {std.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{std.parentName}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{std.parentEmail}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                            <Mail className="w-3 h-3" />
                            <span>تم الإرسال بنجاح ✉️</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={async () => {
                    if (isExportingPdf || !dispatchReportModal) return;
                    setIsExportingPdf(true);
                    try {
                      const success = await exportAttendanceDispatchReportAsPdf(dispatchReportModal);
                      if (!success) {
                        const reportEl = document.getElementById('teacher-attendance-printable-report');
                        if (reportEl) {
                          await downloadElementAsPdf(reportEl, {
                            fileName: `سجل_حضور_طالبات_${dispatchReportModal.gradeLevel.replace(/\s+/g, '_')}_${dispatchReportModal.section === 'الكل' ? 'جميع_الشعب' : `شعبة_${dispatchReportModal.section}`}_${dispatchReportModal.date}.pdf`,
                            scale: 2,
                          });
                        } else {
                          window.print();
                        }
                      }
                    } catch (err) {
                      console.error('PDF Export error:', err);
                      window.print();
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-emerald-200 animate-spin" />
                      <span>جاري إنشاء وتنزيل ملف PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-emerald-200" />
                      <span>تنزيل التقرير كملف PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>طباعة ورقية (A4)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDispatchReportModal(null)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
              >
                موافق، إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Printable Official Daily Attendance Report for A4 / PDF Export */}
      {dispatchReportModal && (
        <div
          id="teacher-attendance-printable-report"
          className="fixed -left-[9999px] top-0 w-[800px] bg-white text-slate-900 p-8 font-arabic z-[-1] pointer-events-none opacity-100 print:static print:left-0 print:z-[9999] print:inset-0 print:w-full print:p-8 print:pointer-events-auto print:block overflow-visible text-right"
        >
          {/* Official Iraqi Ministry Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-slate-800">جمهورية العراق - وزارة التربية</p>
              <p className="text-xs font-bold text-slate-800">المديرية العامة لتربية محافظة ميسان</p>
              <p className="text-sm font-black text-slate-950">ثانوية ميسان للمتميزات</p>
              <p className="text-[10px] text-slate-600 font-mono">نظام الحضور الرقمي المعتمد</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-[10px] text-slate-900 bg-slate-50">
                شعـار الثانويـة
              </div>
              <h1 className="text-base font-black text-slate-950 mt-1">سجل ورصد الحضور والغياب اليومي الرسمي</h1>
            </div>

            <div className="text-left text-xs space-y-1 font-mono text-slate-800">
              <p><span className="font-bold font-sans">التاريخ:</span> {dispatchReportModal.date}</p>
              <p><span className="font-bold font-sans">توقيت التوثيق:</span> {dispatchReportModal.dispatchedAt}</p>
              <p><span className="font-bold font-sans">الصف:</span> {dispatchReportModal.gradeLevel}</p>
              <p><span className="font-bold font-sans">الشعبة:</span> ({dispatchReportModal.section === 'الكل' ? 'جميع الشعب' : dispatchReportModal.section})</p>
            </div>
          </div>

          {/* Academic Info Banner */}
          <div className="grid grid-cols-4 gap-3 p-3 border border-slate-900 rounded-lg mb-4 text-xs bg-slate-50">
            <div>
              <span className="font-bold text-slate-600 block text-[10px]">المادة الدراسية:</span>
              <span className="font-black text-slate-950">{dispatchReportModal.subject}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px]">أستاذة المادة:</span>
              <span className="font-black text-slate-950">{dispatchReportModal.teacherName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px]">البريد الإلكتروني المعتمد:</span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">{dispatchReportModal.teacherEmail}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px]">إجمالي الطالبـات:</span>
              <span className="font-black text-slate-950">{dispatchReportModal.totalStudents} طالبة</span>
            </div>
          </div>

          {/* Attendance Statistics Bar */}
          <div className="grid grid-cols-4 gap-3 text-center mb-5 text-xs font-bold">
            <div className="p-2 border border-slate-900 bg-slate-100 text-slate-900 rounded-lg">
              الحاضرات: <span className="font-black text-sm">{dispatchReportModal.stats.present}</span>
            </div>
            <div className="p-2 border border-slate-900 bg-slate-100 text-slate-900 rounded-lg">
              الغائبات: <span className="font-black text-sm">{dispatchReportModal.stats.absent}</span>
            </div>
            <div className="p-2 border border-slate-900 bg-slate-100 text-slate-900 rounded-lg">
              المتأخرات: <span className="font-black text-sm">{dispatchReportModal.stats.late}</span>
            </div>
            <div className="p-2 border border-slate-900 bg-slate-100 text-slate-900 rounded-lg">
              المجازات: <span className="font-black text-sm">{dispatchReportModal.stats.excused}</span>
            </div>
          </div>

          {/* Attendance Table */}
          <table className="w-full text-right text-xs border-collapse border border-slate-900 mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black border-b border-slate-900">
                <th className="p-2 border border-slate-900 text-center w-8">ت</th>
                <th className="p-2 border border-slate-900">اسم الطالبة الثلاثي</th>
                <th className="p-2 border border-slate-900 text-center">الشعبة</th>
                <th className="p-2 border border-slate-900 text-center">حالة الحضور</th>
                <th className="p-2 border border-slate-900">اسم ولي الأمر</th>
                <th className="p-2 border border-slate-900">الهاتف</th>
                <th className="p-2 border border-slate-900">البريد المستهدف والإشعار</th>
              </tr>
            </thead>
            <tbody>
              {dispatchReportModal.studentDetails.map((std, idx) => (
                <tr key={std.id} className="border-b border-slate-900">
                  <td className="p-2 border border-slate-900 text-center font-bold">{idx + 1}</td>
                  <td className="p-2 border border-slate-900 font-black text-slate-950">{std.name}</td>
                  <td className="p-2 border border-slate-900 text-center font-bold">شعبة ({std.section})</td>
                  <td className="p-2 border border-slate-900 text-center font-black">
                    <span className={
                      std.status === 'حاضرة' ? 'text-slate-900' :
                      std.status === 'غائبة' ? 'text-rose-900 font-black underline' :
                      std.status === 'متأخرة' ? 'text-amber-900 font-bold' : 'text-indigo-900 font-bold'
                    }>
                      {std.status}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-900">{std.parentName}</td>
                  <td className="p-2 border border-slate-900 font-mono text-[11px]">{std.parentPhone}</td>
                  <td className="p-2 border border-slate-900 font-mono text-[10px] text-slate-700">
                    {std.parentEmail} (تم الإرسال ✉️)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Official Signatures Block */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs font-bold pt-6 border-t-2 border-slate-900 mt-auto">
            <div className="space-y-6">
              <p className="font-bold text-slate-800">أستاذة المادة</p>
              <p className="font-black text-sm text-slate-950">{dispatchReportModal.teacherName}</p>
              <p className="text-[10px] text-slate-600 font-mono">التوقيع: ................................</p>
            </div>
            <div className="space-y-4">
              <p className="font-bold text-slate-800">ختم ثانوية ميسان للمتميزات</p>
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-slate-900 flex items-center justify-center text-[9px] text-slate-700 font-black">
                الختم الرسمي
              </div>
            </div>
            <div className="space-y-6">
              <p className="font-bold text-slate-800">إدارة ثانوية ميسان للمتميزات</p>
              <p className="font-black text-sm text-slate-950">مديرة المدرسة</p>
              <p className="text-[10px] text-slate-600 font-mono">التوقيع: ................................</p>
            </div>
          </div>
        </div>
      )}
      {/* Weekly Timetable Modal */}
      <WeeklyTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        initialTab="teacher_schedules"
        initialTeacherName={activeTeacher?.name}
        isStaff={true}
      />

      {/* Upload PDF & Educational Resource Modal */}
      <UploadPdfModal
        isOpen={isUploadPdfModalOpen}
        onClose={() => setIsUploadPdfModalOpen(false)}
        defaultSubject={activeTeacher?.subject || currentUser?.subject}
        defaultGrade={activeTeacher?.assignedGrades?.[0] || currentUser?.gradeLevel}
        defaultTeacherName={activeTeacher?.name || currentUser?.name || currentUser?.teacherObj?.name}
      />

      {/* In-App PDF Reader Modal */}
      <DigitalLibraryReaderModal
        resource={readingResource}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setReadingResource(null);
        }}
      />
    </>
  );
};
