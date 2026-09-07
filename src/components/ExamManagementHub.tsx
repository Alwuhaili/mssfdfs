/**
 * Official Exam Management & Electronic Grading Hub
 * مدرسة ثانوية ميسان للمتميزات
 * إدارة وتصميم الامتحانات، التصحيح التلقائي، التدقيق اليدوي، ورصد درجات الطالبات
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Exam, ExamSubmission, Question, GradeLevel, Section, ALL_GRADES_LIST } from '../types';
import {
  FileCheck2,
  Plus,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Users,
  Search,
  Filter,
  Printer,
  Award,
  Sparkles,
  Save,
  HelpCircle,
  Check,
  X,
  FileText,
  BarChart2,
  Calendar,
  CalendarCheck,
  Building2,
  UserCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  Edit3,
} from 'lucide-react';
import { OfficialExamSchedulesManager } from './OfficialExamSchedulesManager';
import { EditControlAuditorModal } from './EditControlAuditorModal';

interface ExamManagementHubProps {
  userRole?: 'admin' | 'teacher' | 'supervisor';
  defaultTeacherSubject?: string;
  defaultTeacherName?: string;
  defaultTeacherId?: string;
}

// Preset Question Bank Samples for Quick Creation in Iraqi Curriculum
const PRESET_QUESTION_TEMPLATES: Record<string, Question[]> = {
  'الفيزياء المتقدمة': [
    {
      id: 'pq-1',
      text: 'ما هو الشرط الأساسي لتحقق حالة الرنين الكهربائي في دائرة RLC متوالية الربط؟',
      type: 'mcq',
      options: ['رادة الحث تساوي رادة السعة (XL = XC)', 'رادة الحث أكبر من رادة السعة', 'المقاومة R تساوي صفر', 'التردد الزاوي يساوي صفر'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-2',
      text: 'في دائرة التيار المتناوب المحتوية على متسعة ذات سعة صرف، يتقدم التيار على الفولطية بزاوية طور مقدارها 90 درجة.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-3',
      text: 'ما الفائدة العملية من استخدام ظاهرة الحث الكهرومغناطيسي في المولدات الكهربائية؟',
      type: 'mcq',
      options: ['تحويل الطاقة الميكانيكية إلى طاقة كهربائية', 'تحويل التيار المتناوب إلى مستمر', 'توليد حرارة عالية', 'تقليل المقاومة الكهربائية'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-4',
      text: 'يكون عامل القدرة (Power Factor) في دائرة مقاومة صرف مساوياً للواحد الصحيح.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
  ],
  'الرياضيات والتفاضل': [
    {
      id: 'pq-10',
      text: 'مشتقة الدالة f(x) = sin(2x) بالنسبة للمتغير x هي:',
      type: 'mcq',
      options: ['2 cos(2x)', '-2 cos(2x)', 'cos(2x)', '2 sin(2x)'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-11',
      text: 'إذا كانت المشتقة الثانية للدالة موجبة على فترة معينة، فإن منحني الدالة يكون مقعراً نحو الأعلى.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-12',
      text: 'قيمة التكامل المحدد ∫ من 0 إلى 2 للدالة 2x dx تساوي:',
      type: 'mcq',
      options: ['4', '2', '8', '16'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-13',
      text: 'مبرهنة رول تتحقق للدالة إذا كانت مستمرة وقابلة للاشتقاق وكانت قيمة f(a) = f(b).',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
  ],
  'الكيمياء العامة والعضوية': [
    {
      id: 'pq-20',
      text: 'ما هو نوع التهجين في ذرة الكربون لمركب الميثان CH4؟',
      type: 'mcq',
      options: ['sp³', 'sp²', 'sp', 'dsp²'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-21',
      text: 'قانون فرداي الأول ينص على أن كتلة أي مادة تترسب على الكاثود تتناسب طردياً مع كمية الكهربائية المارة.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-22',
      text: 'قيمة الأس الهيدروجيني pH للماء النقي عند درجة حرارة 25C تساوي:',
      type: 'mcq',
      options: ['7', '1', '14', '0'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-23',
      text: 'التفاعل الماص للحرارة تكون قيمة التغير في الإنثالبي (ΔH) له موجبة دائماً.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
  ],
  'علم الأحياء والوراثة': [
    {
      id: 'pq-30',
      text: 'ما هي العضية الخلوية المسؤولة عن تحرير الطاقة وتوليد ATP في الخلية؟',
      type: 'mcq',
      options: ['المايتوكوندريا', 'جهاز كولجي', 'الجسيمات الحالة', 'الرايبوسومات'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-31',
      text: 'الانقسام الاختزالي ينتج عنه أربع خلايا أحادية المجموعة الكروموسومية (1n).',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-32',
      text: 'تحدث عملية البناء الضوئي في النباتات داخل:',
      type: 'mcq',
      options: ['البلاستيدات الخضراء', 'الجدار الخلوي', 'النوية', 'الفجوة الغذائية'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-33',
      text: 'الكروموسومات تتضاعف خلال الطور البيني قبل بدء الانقسام الخلوي.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
  ],
  'علوم الحاسوب والذكاء الاصطناعي': [
    {
      id: 'pq-40',
      text: 'ما هي لغة البرمجة الأكثر شيوعاً في تطبيقات تعلم الآلة وعلم البيانات؟',
      type: 'mcq',
      options: ['Python', 'HTML', 'Assembly', 'Pascal'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-41',
      text: 'الخوارزمية هي مجموعة من الخطوات الرياضية والمنطقية المتسلسلة لحل مسألة معينة.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-42',
      text: 'في قواعد البيانات، يُستخدم المفتاح الأساسي (Primary Key) لتمييز كل سجل بشكل فريد.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-43',
      text: 'أي من التالي يُعتبر من خوارزميات التعلم الخاضع للإشراف (Supervised Learning)؟',
      type: 'mcq',
      options: ['الانحدار الخطي (Linear Regression)', 'K-Means Clustering', 'Apriori', 'PCA'],
      correctAnswer: 0,
      points: 25,
    },
  ],
  'اللغة العربية وقواعدها': [
    {
      id: 'pq-50',
      text: 'حرف النفي (لم) يختص بالدخول على الفعل المضارع فيجزمه ويقلب دلالته إلى الزمن الماضي.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-51',
      text: 'اسم الاستفهام (مَن) إذا تلاه فعل متعدٍ استوفى مفعوله، يُعرب في محل رفع:',
      type: 'mcq',
      options: ['مبتدأ', 'مفعول به مقدم وجوباً', 'خبر مقدم', 'حال'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-52',
      text: 'في أسلوب التوكيد، يُشترط في التوكيد المعنوي بـ (نفس، عين) أن تشتمل على ضمير يطابق المؤكد.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'pq-53',
      text: 'حكم تقديم الخبر على المبتدأ وجوباً إذا كان في المبتدأ ضمير يعود على بعض الخبر.',
      type: 'true_false',
      options: ['صحيح', 'خطأ'],
      correctAnswer: 0,
      points: 25,
    },
  ],
};

export const ExamManagementHub: React.FC<ExamManagementHubProps> = ({
  userRole = 'admin',
  defaultTeacherSubject,
  defaultTeacherName,
  defaultTeacherId,
}) => {
  const {
    currentUser,
    exams,
    submissions,
    students,
    teachers,
    createExam,
    updateExam,
    deleteExam,
    duplicateExam,
    toggleExamStatus,
    updateSubmission,
    regradeSubmission,
    regradeAllExamSubmissions,
    deleteSubmission,
    schoolAdminData,
    updateSchoolAdminData,
    examSchedules,
    lang,
  } = useApp();

  // Control & Audit Committee Modal state
  const [isEditAuditorModalOpen, setIsEditAuditorModalOpen] = useState(false);
  const canManage = userRole === 'admin' || currentUser?.role === 'admin';

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Active Sub-Tab: exams repository, electronic grading, create exam, or official schedules
  const [hubTab, setHubTab] = useState<'exams' | 'grading' | 'create' | 'schedules'>('exams');

  // Filters for Exams Repository
  const [examSearch, setExamSearch] = useState('');
  const [examFilterGrade, setExamFilterGrade] = useState<string>('الكل');
  const [examFilterSubject, setExamFilterSubject] = useState<string>('الكل');
  const [examFilterStatus, setExamFilterStatus] = useState<string>('الكل');

  // Filters for Grading Tab
  const [gradingExamId, setGradingExamId] = useState<string>('الكل');
  const [gradingFilterGrade, setGradingFilterGrade] = useState<string>('الكل');
  const [gradingFilterSection, setGradingFilterSection] = useState<string>('الكل');
  const [gradingSearchStudent, setGradingSearchStudent] = useState<string>('');
  const [gradingFilterCheatingOnly, setGradingFilterCheatingOnly] = useState<boolean>(false);

  // Modals state
  const [previewExamModal, setPreviewExamModal] = useState<Exam | null>(null);
  const [editExamModal, setEditExamModal] = useState<Exam | null>(null);
  const [auditSubmissionModal, setAuditSubmissionModal] = useState<ExamSubmission | null>(null);
  const [printSheetExamId, setPrintSheetExamId] = useState<string | null>(null);

  // Security & Deletion modals state
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [permissionNoticeModal, setPermissionNoticeModal] = useState<{
    exam: Exam;
    action: 'delete' | 'edit' | 'status';
    reason: string;
  } | null>(null);

  // Granular Permission Checker for Exams
  const getExamPermission = (exam: Exam) => {
    // 1. School Admin and Principal have full authority over all exams
    if (userRole === 'admin') {
      return {
        canDelete: true,
        canEdit: true,
        canToggleStatus: true,
        isOwner: true,
        roleLabel: 'مديرة المدرسة / الإدارة العامة (صلاحية كاملة)',
      };
    }

    // 2. Supervisor role is strictly for inspection and auditing
    if (userRole === 'supervisor') {
      return {
        canDelete: false,
        canEdit: false,
        canToggleStatus: false,
        isOwner: false,
        roleLabel: 'مشرف تربوي (اطلاع وتدقيق فقط)',
        reason: 'حساب المشرف الأكاديمي والتربوي مخصص للاطلاع والتدقيق والتقييم فقط، ولا يملك صلاحية حذف أو تعديل الامتحانات.',
      };
    }

    // 3. Teacher Role Check - Only the teacher who created the exam can delete/modify it
    const activeTeacherName = (defaultTeacherName || currentUser?.name || '').trim().toLowerCase();
    const activeTeacherId = defaultTeacherId || currentUser?.id || currentUser?.teacherObj?.id;
    const examTeacherName = (exam.teacherName || '').trim().toLowerCase();
    const examTeacherId = exam.teacherId;

    const idMatches = Boolean(activeTeacherId && examTeacherId && activeTeacherId === examTeacherId);
    const nameMatches = Boolean(
      activeTeacherName &&
      examTeacherName &&
      (examTeacherName === activeTeacherName ||
        examTeacherName.includes(activeTeacherName) ||
        activeTeacherName.includes(examTeacherName) ||
        activeTeacherName.split(' ').filter((w) => w.length > 2).some((w) => examTeacherName.includes(w)))
    );

    const isCreator = idMatches || nameMatches;

    if (isCreator) {
      return {
        canDelete: true,
        canEdit: true,
        canToggleStatus: true,
        isOwner: true,
        roleLabel: 'أستاذ المادة معد الامتحان (صلاحية الحذف والتعديل متاحة)',
      };
    }

    return {
      canDelete: false,
      canEdit: false,
      canToggleStatus: false,
      isOwner: false,
      roleLabel: 'خاص بمدرس(ة) آخر (صلاحية مقيدة)',
      reason: `هذا الامتحان من إعداد الأستاذ(ة): «${exam.teacherName || 'مدرس آخر'}». بصفتك مدرساً، يحق لك حذف وتعديل الامتحانات التي أنشأتها بنفسك فقط، بينما تحتفظ مديرة المدرسة والإدارة العامة بصلاحية الحذف الشامل لكافة المواد والصفوف.`,
    };
  };

  // New Exam Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState(defaultTeacherSubject || 'الفيزياء المتقدمة');
  const [formTeacherName, setFormTeacherName] = useState(
    defaultTeacherName || (userRole === 'admin' ? 'إدارة المدرسة / الإشراف العلمي' : 'أ. محمد نعمة كاظم كريدي الوحيلي')
  );
  const [formGrade, setFormGrade] = useState<GradeLevel>('الصف السادس العلمي');
  const [formSection, setFormSection] = useState<string>('الكل');
  const [formDuration, setFormDuration] = useState<number>(20);
  const [formDueDate, setFormDueDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [formAntiCheat, setFormAntiCheat] = useState({
    enableTabSwitchDetection: true,
    maxTabSwitchesAllowed: 2,
    enableFullScreenEnforcement: true,
    disableCopyPaste: true,
    timeLimitMinutes: 20,
    randomizeQuestions: true,
  });
  const [formQuestions, setFormQuestions] = useState<Question[]>(
    PRESET_QUESTION_TEMPLATES['الفيزياء المتقدمة'] || [
      {
        id: 'q-custom-1',
        text: 'السؤال الأول:',
        type: 'mcq',
        options: ['الخيار أ', 'الخيار ب', 'الخيار جـ', 'الخيار د'],
        correctAnswer: 0,
        points: 25,
      },
    ]
  );

  // Helper: List of unique subjects
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    exams.forEach((e) => subs.add(e.subject));
    teachers.forEach((t) => subs.add(t.subject));
    Object.keys(PRESET_QUESTION_TEMPLATES).forEach((k) => subs.add(k));
    return Array.from(subs).filter(Boolean);
  }, [exams, teachers]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      if (examFilterGrade !== 'الكل' && ex.gradeLevel !== examFilterGrade) return false;
      if (examFilterSubject !== 'الكل' && ex.subject !== examFilterSubject) return false;
      if (examFilterStatus !== 'الكل' && ex.status !== examFilterStatus) return false;
      if (examSearch.trim()) {
        const q = examSearch.toLowerCase().trim();
        const matchTitle = ex.title.toLowerCase().includes(q);
        const matchSub = ex.subject.toLowerCase().includes(q);
        const matchTeacher = ex.teacherName.toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchTeacher) return false;
      }
      return true;
    });
  }, [exams, examFilterGrade, examFilterSubject, examFilterStatus, examSearch]);

  // Filtered Submissions for Grading Hub
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const exam = exams.find((e) => e.id === sub.examId);
      const student = students.find((s) => s.id === sub.studentId || s.name === sub.studentName);
      const studentSection = student?.section || sub.section || exam?.section || 'أ';

      if (gradingExamId !== 'الكل' && sub.examId !== gradingExamId) return false;
      if (gradingFilterGrade !== 'الكل' && sub.gradeLevel !== gradingFilterGrade) return false;
      if (gradingFilterSection !== 'الكل' && studentSection !== gradingFilterSection) return false;
      if (gradingFilterCheatingOnly && (sub.cheatViolationsCount || 0) === 0) return false;
      if (gradingSearchStudent.trim()) {
        const q = gradingSearchStudent.toLowerCase().trim();
        const matchStudent = sub.studentName.toLowerCase().includes(q);
        const matchExam = exam?.title.toLowerCase().includes(q) || false;
        if (!matchStudent && !matchExam) return false;
      }
      return true;
    });
  }, [submissions, exams, students, gradingExamId, gradingFilterGrade, gradingFilterSection, gradingFilterCheatingOnly, gradingSearchStudent]);

  // Top Statistics Calculations
  const stats = useMemo(() => {
    const totalExams = exams.length;
    const activeExams = exams.filter((e) => e.status === 'جاري').length;
    const totalSubmissionsCount = submissions.length;
    const averageScorePct =
      submissions.length > 0
        ? Math.round(submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.length)
        : 0;
    const cheatAlerts = submissions.reduce((acc, s) => acc + (s.cheatViolationsCount || 0), 0);

    return {
      totalExams,
      activeExams,
      totalSubmissionsCount,
      averageScorePct,
      cheatAlerts,
    };
  }, [exams, submissions]);

  // Calculate stats for the currently selected grading exam
  const selectedExamGradingStats = useMemo(() => {
    if (gradingExamId === 'الكل') return null;
    const exam = exams.find((e) => e.id === gradingExamId);
    const examSubs = submissions.filter((s) => s.examId === gradingExamId);
    if (!exam || examSubs.length === 0) return null;

    const scores = examSubs.map((s) => s.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const passCount = examSubs.filter((s) => s.percentage >= 50).length;
    const passRate = Math.round((passCount / examSubs.length) * 100);

    return {
      examTitle: exam.title,
      totalStudents: examSubs.length,
      maxScore,
      minScore,
      avgScore,
      passRate,
      totalPoints: exam.totalPoints,
    };
  }, [gradingExamId, exams, submissions]);

  // Handle Preset Questions selection
  const handleApplyPresetTemplate = (subjectKey: string) => {
    const preset = PRESET_QUESTION_TEMPLATES[subjectKey];
    if (preset) {
      setFormQuestions(JSON.parse(JSON.stringify(preset)));
      setFormSubject(subjectKey);
      setFormTitle(`امتحان ${subjectKey} الشامل - الفصل الدراسي`);
    }
  };

  // Add a new question to the form
  const handleAddQuestionToForm = () => {
    const newQ: Question = {
      id: `q-custom-${Date.now()}`,
      text: `سؤال جديد ${formQuestions.length + 1}:`,
      type: 'mcq',
      options: ['الخيار الأول (صحيح)', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
      correctAnswer: 0,
      points: 20,
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  // Submit and Create New Exam
  const handleSaveCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('يرجى كتابة عنوان واضح للامتحان!');
      return;
    }
    if (formQuestions.length === 0) {
      alert('يرجى إضافة سؤال واحد على الأقل في الامتحان!');
      return;
    }

    const calculatedTotalPoints = formQuestions.reduce((acc, q) => acc + (q.points || 0), 0);
    const resolvedTeacherId = defaultTeacherId || currentUser?.id || currentUser?.teacherObj?.id || (userRole === 'teacher' ? 't-1' : '');
    const resolvedTeacherName = formTeacherName || defaultTeacherName || currentUser?.name || 'أ. محمد نعمة كاظم كريدي الوحيلي';

    createExam({
      title: formTitle.trim(),
      subject: formSubject,
      teacherId: resolvedTeacherId,
      teacherName: resolvedTeacherName,
      gradeLevel: formGrade,
      section: formSection === 'الكل' ? 'الكل' : (formSection as Section),
      durationMinutes: formDuration,
      status: 'جاري',
      dueDate: formDueDate,
      totalPoints: calculatedTotalPoints,
      antiCheat: formAntiCheat,
      questions: formQuestions,
    });

    showToast(`تم إنشاء ونشر امتحان (${formTitle}) بنسخته الرسمية بنجاح!`);
    setHubTab('exams');
    setFormTitle('');
  };

  // Safe Duplicate Exam Handler (Assigns ownership to current teacher if teacher role)
  const handleDuplicateExam = (exam: Exam) => {
    if (userRole === 'teacher') {
      const currentTeacherId = defaultTeacherId || currentUser?.id || currentUser?.teacherObj?.id || 't-1';
      const currentTeacherName = defaultTeacherName || currentUser?.name || formTeacherName;
      const cloned: Exam = {
        ...exam,
        id: `ex-${Date.now()}`,
        title: `${exam.title} (نسختي المكررة)`,
        teacherId: currentTeacherId,
        teacherName: currentTeacherName,
        status: 'مسودة',
        createdAt: new Date().toISOString().split('T')[0],
      };
      createExam(cloned);
      showToast(`تم استنساخ الامتحان بنجاح ونسبته إلى (${currentTeacherName}) مع منحك كامل صلاحيات الإدارة والحذف!`);
    } else {
      duplicateExam(exam.id);
      showToast(`تم إنشاء نسخة مكررة من امتحان (${exam.title}) بنجاح!`);
    }
  };

  // Safe Exam Deletion Executor
  const handleConfirmDeleteExam = () => {
    if (!examToDelete) return;
    const targetId = examToDelete.id;
    const targetTitle = examToDelete.title;
    deleteExam(targetId);
    setExamToDelete(null);
    showToast(`تم حذف امتحان (${targetTitle}) ودفاتر الإجابة المرتبطة به نهائياً بنجاح.`);
  };

  // Get Badge color based on percentage
  const getGradeBadge = (pct: number) => {
    if (pct >= 90) return { label: 'امتياز (متميز جداً)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (pct >= 80) return { label: 'جيد جداً', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    if (pct >= 70) return { label: 'جيد', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    if (pct >= 60) return { label: 'متوسط', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (pct >= 50) return { label: 'مقبول', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    return { label: 'راسب (يحتاج معالجة)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  return (
    <div className="space-y-6 font-arabic select-none">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>المنظومة المركزية لإدارة الامتحانات والتصحيح الإلكتروني</span>
              </span>
              <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                ثانوية ميسان للمتميزات
              </span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <FileCheck2 className="w-7 h-7 text-amber-400" />
              <span>إدارة الامتحانات والتصحيح ورصد الدرجات</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              تتيح للإدارة والهيئة التدريسية إنشاء الامتحانات الشاملة، إدارة بنوك الأسئلة، تفعيل قواعد مكافحة الغش الصارمة، التصحيح التلقائي والفوري، التدقيق اليدوي لدفاتر الطالبات، واستخراج كشوفات الدرجات الرسمية.
            </p>
          </div>

          {/* Quick Hub Tabs */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
            <button
              onClick={() => setHubTab('schedules')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                hubTab === 'schedules'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-indigo-950 font-black shadow-lg shadow-amber-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>جداول الامتحانات الرسمية ({examSchedules.length})</span>
            </button>
            <button
              onClick={() => setHubTab('exams')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                hubTab === 'exams'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>مستودع الامتحانات ({exams.length})</span>
            </button>
            <button
              onClick={() => setHubTab('grading')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                hubTab === 'grading'
                  ? 'bg-amber-400 text-indigo-950 shadow-lg shadow-amber-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>مركز التصحيح والتدقيق ({submissions.length})</span>
            </button>
            <button
              onClick={() => setHubTab('create')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                hubTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء امتحان جديد</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">الجداول المعتمدة</span>
              <span className="text-lg font-black text-amber-300 font-mono">{examSchedules.length}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">إجمالي الامتحانات</span>
              <span className="text-lg font-black text-white font-mono">{stats.totalExams}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">الامتحانات الجارية</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{stats.activeExams}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">الدفاتر المصححة</span>
              <span className="text-lg font-black text-amber-300 font-mono">{stats.totalSubmissionsCount}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">متوسط الدرجات العام</span>
              <span className="text-lg font-black text-teal-300 font-mono">{stats.averageScorePct}%</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">تنبيهات الغش المرصودة</span>
              <span className="text-lg font-black text-rose-400 font-mono">{stats.cheatAlerts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== TAB 1: EXAMS REPOSITORY ===================== */}
      {hubTab === 'exams' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم الامتحان، المادة، أو الأستاذ المشرف..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={examFilterGrade}
                onChange={(e) => setExamFilterGrade(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع الصفوف الدراسية</option>
                {ALL_GRADES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                value={examFilterSubject}
                onChange={(e) => setExamFilterSubject(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع المواد الدراسية</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={examFilterStatus}
                onChange={(e) => setExamFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع الحالات</option>
                <option value="جاري">جاري (نشط الآن)</option>
                <option value="قادم">قادم (مجدول)</option>
                <option value="مكتمل">مكتمل</option>
                <option value="مسودة">مسودة</option>
              </select>

              <button
                onClick={() => setHubTab('create')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>امتحان جديد</span>
              </button>
            </div>
          </div>

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((ex) => {
              const examSubmissions = submissions.filter((s) => s.examId === ex.id);
              const passSubmissions = examSubmissions.filter((s) => s.percentage >= 50);
              const passPct = examSubmissions.length > 0 ? Math.round((passSubmissions.length / examSubmissions.length) * 100) : 0;
              const perm = getExamPermission(ex);

              return (
                <div
                  key={ex.id}
                  className={`p-5 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group ${
                    perm.isOwner && userRole === 'teacher'
                      ? 'border-emerald-500/40 hover:border-emerald-400'
                      : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Tags */}
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <span className="text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 truncate">
                        {ex.subject}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={ex.status}
                          disabled={!perm.canToggleStatus}
                          onChange={(e) => {
                            if (!perm.canToggleStatus) {
                              setPermissionNoticeModal({
                                exam: ex,
                                action: 'status',
                                reason: perm.reason || 'لا تملك صلاحية لتغيير حالة هذا الامتحان.',
                              });
                              return;
                            }
                            toggleExamStatus(ex.id, e.target.value as any);
                            showToast(`تم تحديث حالة الامتحان إلى (${e.target.value}) بنجاح`);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            !perm.canToggleStatus ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                          } ${
                            ex.status === 'جاري'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : ex.status === 'قادم'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : ex.status === 'مكتمل'
                              ? 'bg-slate-700/50 text-slate-300 border-slate-600'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <option value="جاري" className="bg-slate-900 text-white">جاري (نشط)</option>
                          <option value="قادم" className="bg-slate-900 text-white">قادم (مجدول)</option>
                          <option value="مكتمل" className="bg-slate-900 text-white">مكتمل</option>
                          <option value="مسودة" className="bg-slate-900 text-white">مسودة</option>
                        </select>
                      </div>
                    </div>

                    {/* Title & Teacher & Ownership Badge */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {userRole === 'teacher' && (
                          perm.isOwner ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>امتحاني الخاص (متاح للحذف)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>مدرس آخر (للاطلاع فقط)</span>
                            </span>
                          )
                        )}
                        {userRole === 'admin' && (
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>صلاحية إدارة المدرسة والمديرة</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white leading-snug group-hover:text-indigo-300 transition-colors">
                        {ex.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>إعداد المدرس: <strong className="text-slate-200 font-semibold">{ex.teacherName}</strong></span>
                      </p>
                    </div>

                    {/* Meta Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">الصف والشعبة:</span>
                        <span className="font-bold text-amber-200">
                          {ex.gradeLevel} {ex.section && ex.section !== 'الكل' ? `(شعبة ${ex.section})` : '(الكل)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">المدة المقررة:</span>
                        <span className="font-bold text-teal-300 font-mono">{ex.durationMinutes} دقيقة</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">عدد الأسئلة والدرجة:</span>
                        <span className="font-bold text-white font-mono">
                          {ex.questions?.length || 0} أسئلة / {ex.totalPoints} د
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">الممتحنات والنجاح:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {examSubmissions.length} طالبة ({passPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Anti-Cheat Features summary */}
                    <div className="flex items-center gap-2 text-[10px] text-indigo-300 bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/20">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        مكافحة الغش: {ex.antiCheat?.enableTabSwitchDetection ? 'كشف التبويب' : ''} •{' '}
                        {ex.antiCheat?.enableFullScreenEnforcement ? 'شاشة كاملة' : ''} • منع النسخ
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setGradingExamId(ex.id);
                          setHubTab('grading');
                        }}
                        className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تصحيح الدفاتر ({examSubmissions.length})</span>
                      </button>

                      <button
                        onClick={() => setPreviewExamModal(ex)}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>معاينة الأسئلة</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        title="إعادة تصحيح كافة الدفاتر تلقائياً"
                        onClick={() => {
                          if (confirm(`هل ترغب في إعادة تصحيح كافة دفاتر (${ex.title}) تلقائياً حسب نموذج الإجابات المحدث؟`)) {
                            regradeAllExamSubmissions(ex.id);
                            showToast('تمت إعادة تصحيح جميع دفاتر الامتحان بنجاح!');
                          }
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 flex items-center justify-center gap-1 transition-all"
                      >
                        <RefreshCw className="w-3 h-3 text-teal-400" />
                        <span>إعادة تصحيح الكل</span>
                      </button>

                      <button
                        title={perm.canEdit ? 'تعديل الامتحان' : 'تعديل مقيد (صلاحية المدرس المنشئ أو الإدارة فقط)'}
                        onClick={() => {
                          if (!perm.canEdit) {
                            setPermissionNoticeModal({
                              exam: ex,
                              action: 'edit',
                              reason: perm.reason || 'لا تملك صلاحية لتعديل هذا الامتحان.',
                            });
                            return;
                          }
                          setEditExamModal(ex);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          perm.canEdit
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="استنساخ الامتحان"
                        onClick={() => handleDuplicateExam(ex)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="طباعة كشف الدرجات الرسمي"
                        onClick={() => setPrintSheetExamId(ex.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {perm.canDelete ? (
                        <button
                          title="حذف الامتحان (صلاحية مفعلة لك)"
                          onClick={() => setExamToDelete(ex)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      ) : (
                        <button
                          title="حذف مقيد (خاص بمدرس آخر - انقر لمعرفة الصلاحيات)"
                          onClick={() => {
                            setPermissionNoticeModal({
                              exam: ex,
                              action: 'delete',
                              reason: perm.reason || 'لا تملك صلاحية لحذف هذا الامتحان.',
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-500 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredExams.length === 0 && (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">لا توجد امتحانات مطابقة لمعايير البحث المحددة</p>
              <button
                onClick={() => {
                  setExamSearch('');
                  setExamFilterGrade('الكل');
                  setExamFilterSubject('الكل');
                  setExamFilterStatus('الكل');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-amber-300 hover:bg-slate-700 transition-all"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: GRADING & CORRECTION HUB ===================== */}
      {hubTab === 'grading' && (
        <div className="space-y-6">
          {/* Exam Summary Banner if an exam is selected */}
          {selectedExamGradingStats && (
            <div className="p-5 rounded-3xl bg-indigo-950/70 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  إحصائيات الامتحان المختار
                </span>
                <h3 className="text-lg font-black text-white mt-1">{selectedExamGradingStats.examTitle}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-center bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">الممتحنات</span>
                  <span className="text-base font-black text-white font-mono">{selectedExamGradingStats.totalStudents}</span>
                </div>
                <div className="text-center bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">أعلى درجة</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {selectedExamGradingStats.maxScore} / {selectedExamGradingStats.totalPoints}
                  </span>
                </div>
                <div className="text-center bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">المتوسط</span>
                  <span className="text-base font-black text-teal-300 font-mono">
                    {selectedExamGradingStats.avgScore} / {selectedExamGradingStats.totalPoints}
                  </span>
                </div>
                <div className="text-center bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">نسبة النجاح</span>
                  <span className="text-base font-black text-amber-300 font-mono">{selectedExamGradingStats.passRate}%</span>
                </div>

                <button
                  onClick={() => setPrintSheetExamId(gradingExamId)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة كشف الدرجات الرسمي</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Exam Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>الامتحان المستهدف:</span>
              </label>
              <select
                value={gradingExamId}
                onChange={(e) => setGradingExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع الامتحانات المعلنة ({exams.length})</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>الصف الدراسي:</span>
              </label>
              <select
                value={gradingFilterGrade}
                onChange={(e) => setGradingFilterGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع الصفوف الدراسية</option>
                {ALL_GRADES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>الشعبة:</span>
              </label>
              <select
                value={gradingFilterSection}
                onChange={(e) => setGradingFilterSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="الكل">جميع الشعب (أ، ب، جـ، د)</option>
                <option value="أ">شعبة (أ)</option>
                <option value="ب">شعبة (ب)</option>
                <option value="جـ">شعبة (جـ)</option>
                <option value="د">شعبة (د)</option>
              </select>
            </div>

            {/* Student Search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم الطالبة:</span>
              </label>
              <input
                type="text"
                placeholder="ابحث باسم الطالبة..."
                value={gradingSearchStudent}
                onChange={(e) => setGradingSearchStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Cheating Filter Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={gradingFilterCheatingOnly}
                  onChange={(e) => setGradingFilterCheatingOnly(e.target.checked)}
                  className="accent-rose-500 rounded"
                />
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>تنبيهات الغش فقط</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>دفاتر إجابات الطالبات والدرجات المرصودة</span>
                </h3>
                <span className="text-xs font-bold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                  {filteredSubmissions.length} دفتر امتحان
                </span>
              </div>

              {gradingExamId !== 'الكل' && (
                <button
                  onClick={() => {
                    if (confirm('هل ترغب في إعادة تصحيح جميع دفاتر هذا الامتحان تلقائياً؟')) {
                      regradeAllExamSubmissions(gradingExamId);
                      alert('تمت إعادة التصحيح بنجاح!');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-bold border border-teal-500/40 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة تصحيح الكل تلقائياً</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                    <th className="py-3 px-4">الطالبة</th>
                    <th className="py-3 px-4">الصف والشعبة</th>
                    <th className="py-3 px-4">الامتحان والمادة</th>
                    <th className="py-3 px-4 text-center">الدرجة المحرزة</th>
                    <th className="py-3 px-4 text-center">النسبة والتقدير</th>
                    <th className="py-3 px-4 text-center">تنبيهات الغش</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات والتدقيق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredSubmissions.map((sub) => {
                    const exam = exams.find((e) => e.id === sub.examId);
                    const student = students.find((s) => s.id === sub.studentId || s.name === sub.studentName);
                    const studentSection = student?.section || sub.section || exam?.section || 'أ';
                    const badge = getGradeBadge(sub.percentage);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Student Name */}
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                              {sub.studentName.charAt(0)}
                            </div>
                            <div>
                              <span>{sub.studentName}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {sub.submittedAt || 'مكتمل'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Grade & Section */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-bold text-amber-200">{sub.gradeLevel}</span>
                          <span className="block text-[11px] text-teal-300 font-bold">شعبة ({studentSection})</span>
                        </td>

                        {/* Exam Title */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-bold text-white block">{exam?.title || 'امتحان شامل'}</span>
                          <span className="text-[10px] text-amber-300">{exam?.subject}</span>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-base font-black font-mono text-white">
                            {sub.score}{' '}
                            <span className="text-xs text-slate-400 font-normal">/ {sub.totalPoints}</span>
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {sub.timeTakenMinutes || 15} دقيقة مستغرقة
                          </span>
                        </td>

                        {/* Percentage & Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-black font-mono text-amber-300">{sub.percentage}%</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                        </td>

                        {/* Cheat Violations */}
                        <td className="py-3.5 px-4 text-center">
                          {sub.cheatViolationsCount && sub.cheatViolationsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/40">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              <span>{sub.cheatViolationsCount} مخالفات غش</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>نزيه (0)</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                            {sub.status || 'تم التصحيح تلقائياً'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setAuditSubmissionModal(sub)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>تدقيق الدفتر</span>
                            </button>

                            <button
                              title="إعادة تصحيح الدفتر تلقائياً"
                              onClick={() => {
                                regradeSubmission(sub.id);
                                alert(`تمت إعادة تصحيح دفتر الطالبة (${sub.studentName}) بنجاح!`);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 transition-all"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              title="إتاحة إعادة الامتحان للطالبة (حذف الإجابة)"
                              onClick={() => {
                                if (confirm(`هل ترغب في حذف إجابة الطالبة (${sub.studentName}) وإتاحة فرصة جديدة لها لأداء الامتحان؟`)) {
                                  deleteSubmission(sub.id);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-white">لا توجد دفاتر امتحانات مطابقة لمعايير الفلترة المحددة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CREATE NEW EXAM WIZARD ===================== */}
      {hubTab === 'create' && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-400" />
                <span>تصميم وإنشاء امتحان إلكتروني ذكي (تصحيح آلي + منع الغش)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                قم بتعبئة بيانات الامتحان، ضبط خيارات مكافحة الغش، وإضافة الأسئلة مع تحديد نموذج الإجابة الصحيحة لحساب الدرجات تلقائياً فور تسليم الطالبة.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>نماذج سريعة من المنهج:</span>
              </span>
              {Object.keys(PRESET_QUESTION_TEMPLATES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPresetTemplate(key)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 text-[11px] font-bold border border-indigo-800 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveCreateExam} className="space-y-6">
            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الامتحان الشامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: امتحان الفيزياء الشامل - الفصل الثالث (التيار المتناوب)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المادة الدراسية *</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المعلم / الجهة المشرفة *</label>
                <input
                  type="text"
                  required
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الصف الدراسي المستهدف *</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value as GradeLevel)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {ALL_GRADES_LIST.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الشعبة المستهدفة *</label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="الكل">جميع الشعب (أ، ب، جـ، د)</option>
                  <option value="أ">شعبة أ فقط</option>
                  <option value="ب">شعبة ب فقط</option>
                  <option value="جـ">شعبة جـ فقط</option>
                  <option value="د">شعبة د فقط</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">مدة الامتحان (دقائق) *</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  required
                  value={formDuration}
                  onChange={(e) => setFormDuration(parseInt(e.target.value) || 20)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ انتهاء الصلاحية *</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Anti-Cheat Configuration Card */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-3">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>إعدادات وقواعد مكافحة الغش الصارمة (Anti-Cheating Rules):</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <label className="flex items-center gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAntiCheat.enableTabSwitchDetection}
                    onChange={(e) => setFormAntiCheat({ ...formAntiCheat, enableTabSwitchDetection: e.target.checked })}
                    className="accent-amber-400 rounded"
                  />
                  <span>كشف مغادرة التبويب والتنبيه تلقائياً</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAntiCheat.enableFullScreenEnforcement}
                    onChange={(e) => setFormAntiCheat({ ...formAntiCheat, enableFullScreenEnforcement: e.target.checked })}
                    className="accent-amber-400 rounded"
                  />
                  <span>فرض الشاشة الكاملة أثناء الاختبار</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAntiCheat.disableCopyPaste}
                    onChange={(e) => setFormAntiCheat({ ...formAntiCheat, disableCopyPaste: e.target.checked })}
                    className="accent-amber-400 rounded"
                  />
                  <span>منع النسخ واللصق والنقر الأيمن</span>
                </label>
              </div>
            </div>

            {/* Questions Builder Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>أسئلة الامتحان ونموذج الإجابة ({formQuestions.length})</span>
                  </h3>
                  <span className="text-[11px] text-amber-300 font-mono">
                    إجمالي الدرجة المحسوبة:{' '}
                    {formQuestions.reduce((acc, q) => acc + (q.points || 0), 0)} درجة
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestionToForm}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة سؤال جديد</span>
                </button>
              </div>

              <div className="space-y-4">
                {formQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black flex items-center justify-center border border-amber-400/30">
                          {qIdx + 1}
                        </span>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            setFormQuestions(
                              formQuestions.map((item, idx) =>
                                idx === qIdx
                                  ? {
                                      ...item,
                                      type: newType,
                                      options:
                                        newType === 'true_false'
                                          ? ['صحيح', 'خطأ']
                                          : newType === 'mcq'
                                          ? item.options || ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4']
                                          : undefined,
                                    }
                                  : item
                              )
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold cursor-pointer"
                        >
                          <option value="mcq">اختيار من متعدد (MCQ)</option>
                          <option value="true_false">صح أو خطأ (True / False)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400">الدرجة:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points}
                            onChange={(e) => {
                              const pts = parseInt(e.target.value) || 10;
                              setFormQuestions(
                                formQuestions.map((item, idx) => (idx === qIdx ? { ...item, points: pts } : item))
                              );
                            }}
                            className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-center"
                          />
                        </div>

                        {formQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormQuestions(formQuestions.filter((_, idx) => idx !== qIdx))}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <input
                      type="text"
                      required
                      placeholder={`نص السؤال رقم ${qIdx + 1}...`}
                      value={q.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormQuestions(
                          formQuestions.map((item, idx) => (idx === qIdx ? { ...item, text: val } : item))
                        );
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />

                    {/* Options & Answer Key */}
                    {q.type === 'mcq' && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 block">
                          الخيارات (حددي الخيار الصحيح للتصحيح التلقائي):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4']).map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                Number(q.correctAnswer) === optIdx
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.id || qIdx}`}
                                checked={Number(q.correctAnswer) === optIdx}
                                onChange={() => {
                                  setFormQuestions(
                                    formQuestions.map((item, idx) =>
                                      idx === qIdx ? { ...item, correctAnswer: optIdx } : item
                                    )
                                  );
                                }}
                                className="accent-emerald-400 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updatedOptions = [...(q.options || [])];
                                  updatedOptions[optIdx] = e.target.value;
                                  setFormQuestions(
                                    formQuestions.map((item, idx) =>
                                      idx === qIdx ? { ...item, options: updatedOptions } : item
                                    )
                                  );
                                }}
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-[11px] font-bold text-slate-400">الإجابة النموذجية الصحيحة:</span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-300">
                          <input
                            type="radio"
                            name={`tf-correct-${q.id || qIdx}`}
                            checked={Number(q.correctAnswer) === 0}
                            onChange={() => {
                              setFormQuestions(
                                formQuestions.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctAnswer: 0 } : item
                                )
                              );
                            }}
                            className="accent-emerald-400"
                          />
                          <span>صحيح</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-300">
                          <input
                            type="radio"
                            name={`tf-correct-${q.id || qIdx}`}
                            checked={Number(q.correctAnswer) === 1}
                            onChange={() => {
                              setFormQuestions(
                                formQuestions.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctAnswer: 1 } : item
                                )
                              );
                            }}
                            className="accent-rose-400"
                          />
                          <span>خطأ</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setHubTab('exams')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>نشر الامتحان رسمياً في المنصة</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== TAB 4: OFFICIAL EXAM SCHEDULES ===================== */}
      {hubTab === 'schedules' && (
        <div className="space-y-6">
          <OfficialExamSchedulesManager userRole={userRole} />
        </div>
      )}

      {/* ===================== MODAL: PREVIEW EXAM QUESTIONS ===================== */}
      {previewExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {previewExamModal.subject} • {previewExamModal.gradeLevel}
                </span>
                <h3 className="text-base font-black text-white mt-1">{previewExamModal.title}</h3>
              </div>
              <button
                onClick={() => setPreviewExamModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {previewExamModal.questions?.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>سؤال {idx + 1}:</span>
                    <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{q.points} درجة</span>
                  </div>
                  <p className="text-xs text-white font-medium">{q.text}</p>

                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            Number(q.correctAnswer) === optIdx
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono">
                            {optIdx + 1}
                          </span>
                          <span>{opt}</span>
                          {Number(q.correctAnswer) === optIdx && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 mr-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewExamModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT EXAM ===================== */}
      {editExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>تعديل الامتحان: {editExamModal.title}</span>
              </h3>
              <button
                onClick={() => setEditExamModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الامتحان</label>
                <input
                  type="text"
                  value={editExamModal.title}
                  onChange={(e) => setEditExamModal({ ...editExamModal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المادة</label>
                  <input
                    type="text"
                    value={editExamModal.subject}
                    onChange={(e) => setEditExamModal({ ...editExamModal, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المدة (دقائق)</label>
                  <input
                    type="number"
                    value={editExamModal.durationMinutes}
                    onChange={(e) => setEditExamModal({ ...editExamModal, durationMinutes: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditExamModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  updateExam(editExamModal.id, editExamModal);
                  setEditExamModal(null);
                  alert('تم حفظ تعديلات الامتحان بنجاح!');
                }}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 text-xs font-bold"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: AUDIT & GRADE STUDENT SUBMISSION ===================== */}
      {auditSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-slate-100">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  تدقيق دفتر إجابة الطالبة
                </span>
                <h3 className="text-lg font-black text-white mt-1">الطالبة: {auditSubmissionModal.studentName}</h3>
                <p className="text-xs text-slate-400">
                  {auditSubmissionModal.gradeLevel} • وقت التسليم: {auditSubmissionModal.submittedAt}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">الدرجة الكلية</span>
                  <span className="text-base font-black text-amber-300 font-mono">
                    {auditSubmissionModal.score} / {auditSubmissionModal.totalPoints}
                  </span>
                </div>
                <div className="text-center bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">النسبة المئوية</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {auditSubmissionModal.percentage}%
                  </span>
                </div>

                <button
                  onClick={() => setAuditSubmissionModal(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Anti-cheat violation banner */}
            {auditSubmissionModal.cheatViolationsCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  تم رصد ({auditSubmissionModal.cheatViolationsCount}) محاولات لمغادرة نافذة الامتحان أثناء الاختبار.
                </span>
              </div>
            )}

            {/* Question by Question Inspection */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {(() => {
                const exam = exams.find((e) => e.id === auditSubmissionModal.examId);
                if (!exam) return <p className="text-xs text-slate-400">بيانات الامتحان غير متوفرة</p>;

                return exam.questions.map((q, idx) => {
                  const studentAns = auditSubmissionModal.answers[q.id];
                  const isCorrect =
                    studentAns !== undefined &&
                    (typeof q.correctAnswer === 'number'
                      ? Number(studentAns) === q.correctAnswer
                      : String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase());

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">
                          سؤال {idx + 1}: {q.text}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-mono ${isCorrect ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'}`}>
                          {isCorrect ? `+${q.points} د (صحيح)` : `0 / ${q.points} د (خاطئ)`}
                        </span>
                      </div>

                      {q.options && (
                        <div className="text-xs space-y-1 pt-1 text-slate-300">
                          <div>
                            <span className="text-slate-400">إجابة الطالبة: </span>
                            <span className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {studentAns !== undefined && q.options[Number(studentAns)]
                                ? q.options[Number(studentAns)]
                                : studentAns !== undefined
                                ? String(studentAns)
                                : 'لم تُجب الطالبة'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              <span className="text-slate-400">الإجابة النموذجية الصحيحة: </span>
                              <span className="font-bold text-emerald-400">
                                {typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]
                                  ? q.options[q.correctAnswer]
                                  : String(q.correctAnswer)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Manual Grade Modification & Admin Notes */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">تعديل الدرجة يدوياً وتدوين ملاحظات الإدارة:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">الدرجة المعدلة (من {auditSubmissionModal.totalPoints})</label>
                  <input
                    type="number"
                    min={0}
                    max={auditSubmissionModal.totalPoints}
                    value={auditSubmissionModal.score}
                    onChange={(e) => {
                      const newScore = parseInt(e.target.value) || 0;
                      const newPct = Math.round((newScore / auditSubmissionModal.totalPoints) * 100);
                      setAuditSubmissionModal({
                        ...auditSubmissionModal,
                        score: newScore,
                        percentage: newPct,
                        status: 'مصحح يدوياً',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-black text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ملاحظات وتوجيهات الإدارة / المدرس للطالبة</label>
                  <input
                    type="text"
                    placeholder="مثال: إجابات ممتازة مع ضرورة التركيز على التعاليل الفيزيائية..."
                    value={auditSubmissionModal.adminNotes || ''}
                    onChange={(e) =>
                      setAuditSubmissionModal({ ...auditSubmissionModal, adminNotes: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAuditSubmissionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  updateSubmission(auditSubmissionModal.id, {
                    score: auditSubmissionModal.score,
                    percentage: auditSubmissionModal.percentage,
                    adminNotes: auditSubmissionModal.adminNotes,
                    status: 'تم التدقيق والتصحيح',
                    gradedBy: 'إدارة المدرسة / الهيئة التدريسية',
                    gradedAt: new Date().toLocaleDateString('ar-IQ'),
                  });
                  setAuditSubmissionModal(null);
                  alert(`تم اعتماد وتحديث دفتر الطالبة (${auditSubmissionModal.studentName}) بنجاح!`);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>اعتماد وتثبيت التصحيح</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: OFFICIAL PRINTABLE EXAM SHEET ===================== */}
      {printSheetExamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-8 space-y-6 shadow-2xl print:p-0">
            {/* Header with Iraqi Ministry Emblem */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="text-right space-y-0.5 text-xs font-bold">
                <p>جمهورية العراق</p>
                <p>وزارة التربية - المديرية العامة لتربية ميسان</p>
                <p className="text-sm font-black text-indigo-900">ثانوية ميسان للمتميزات للبنات</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-xs text-indigo-900 mx-auto">
                  شعار الوزارة
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1 block">كشف الدرجات الرسمي</span>
              </div>

              <div className="text-left space-y-0.5 text-xs font-bold font-mono">
                <p>العام الدراسي: 2026/2027</p>
                <p>التاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
                <p>اللجنة الامتحانية</p>
              </div>
            </div>

            {/* Exam Meta Info */}
            {(() => {
              const exam = exams.find((e) => e.id === printSheetExamId);
              const examSubs = submissions.filter((s) => s.examId === printSheetExamId);
              if (!exam) return null;

              return (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 grid grid-cols-3 gap-3 text-xs font-bold">
                    <div>
                      <span className="text-slate-500 block">عنوان الامتحان:</span>
                      <span className="text-indigo-950 font-black">{exam.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">المادة والصف:</span>
                      <span>
                        {exam.subject} - {exam.gradeLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">الأستاذ المشرف:</span>
                      <span>{exam.teacherName}</span>
                    </div>
                  </div>

                  {/* Student Marks Table */}
                  <table className="w-full text-right border-collapse text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                        <th className="py-2.5 px-3 border-l border-slate-300">ت</th>
                        <th className="py-2.5 px-3 border-l border-slate-300">اسم الطالبة الرباعي</th>
                        <th className="py-2.5 px-3 border-l border-slate-300">الشعبة</th>
                        <th className="py-2.5 px-3 border-l border-slate-300 text-center">
                          الدرجة رقماً (من {exam.totalPoints})
                        </th>
                        <th className="py-2.5 px-3 border-l border-slate-300 text-center">النسبة المئوية</th>
                        <th className="py-2.5 px-3 text-center">التقدير الرسمي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {examSubs.map((sub, idx) => {
                        const badge = getGradeBadge(sub.percentage);
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 border-l border-slate-300 font-mono text-center">{idx + 1}</td>
                            <td className="py-2 px-3 border-l border-slate-300 font-bold">{sub.studentName}</td>
                            <td className="py-2 px-3 border-l border-slate-300 text-center font-bold">
                              شعبة ({sub.section || 'أ'})
                            </td>
                            <td className="py-2 px-3 border-l border-slate-300 font-mono font-black text-center">
                              {sub.score}
                            </td>
                            <td className="py-2 px-3 border-l border-slate-300 font-mono font-bold text-center">
                              {sub.percentage}%
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{badge.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Signatures Row */}
                  <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-black text-slate-800">
                    <div className="space-y-8">
                      <p>مدرس المادة المشرف</p>
                      <p className="text-slate-500 font-normal">........................</p>
                    </div>
                    <div className="space-y-8">
                      <p>اللجنة الامتحانية والتدقيق</p>
                      <p className="text-slate-500 font-normal">........................</p>
                    </div>
                    <div className="space-y-8">
                      <p>مديرة المدرسة والختم الرسمي</p>
                      <p className="text-slate-500 font-normal">
                        {schoolAdminData?.principalName || 'أ. سحر علي المحمداوي'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setPrintSheetExamId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الكشف الفوري (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE EXAM CONFIRMATION ===================== */}
      {examToDelete && (() => {
        const relatedSubmissions = submissions.filter((s) => s.examId === examToDelete.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide block mb-1">
                    تأكيد حذف الامتحان
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">
                    هل أنت متأكد من رغبتك في حذف هذا الامتحان؟
                  </h3>
                </div>
              </div>

              {/* Exam Summary details */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">عنوان الامتحان:</span>
                  <span className="font-bold text-white text-sm">{examToDelete.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">المادة والمرحلة:</span>
                  <span className="font-bold text-amber-300">{examToDelete.subject} - {examToDelete.gradeLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">إعداد المدرس:</span>
                  <span className="font-bold text-slate-200">{examToDelete.teacherName}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">دفاتر الإجابات المسجلة:</span>
                  <span className="font-bold text-rose-400 font-mono">{relatedSubmissions.length} دفتر طالبة سيتم حذفها</span>
                </div>
              </div>

              <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/30 text-[11px] text-rose-200 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>تنبيه نهائي:</strong> سيتم حذف الامتحان وكافة سجلات ودفاتر إجابات الطالبات ودرجاتهن المرتبطة بهذا الامتحان نهائياً من النظام.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setExamToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleConfirmDeleteExam}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL: PERMISSION RESTRICTION NOTICE ===================== */}
      {permissionNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30 shrink-0">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                  نظام حماية الخصوصية والصلاحيات
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  إجراء مقيد لمعد الامتحان أو الإدارة فقط
                </h3>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                {permissionNoticeModal.reason}
              </p>
              <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-indigo-200 text-[11px]">
                <strong className="block text-indigo-300 font-bold mb-1">💡 هل ترغب في استخدام هذا الامتحان؟</strong>
                يمكنك الضغط على زر <strong>(استنساخ الامتحان)</strong> لإنشاء نسخة كاملة باسمك لتتمكن من التعديل عليها وحذفها وإدارتها بحرية كاملة.
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const targetExam = permissionNoticeModal.exam;
                  setPermissionNoticeModal(null);
                  handleDuplicateExam(targetExam);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <Copy className="w-4 h-4" />
                <span>استنساخ نسخة خاصة بي</span>
              </button>

              <button
                onClick={() => setPermissionNoticeModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TOAST NOTIFICATION BANNER ===================== */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
