import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  InteractiveChallenge,
  ChallengeQuestion,
  ChallengeParticipation,
  GradeLevel,
  ALL_GRADES_LIST,
} from '../types';
import {
  Gamepad2,
  Trophy,
  Award,
  Sparkles,
  Play,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Zap,
  Target,
  Users,
  Search,
  Filter,
  Flame,
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Medal,
  Crown,
  Eye,
  Lightbulb,
  X,
  Share2,
  Printer,
  Bookmark,
  TrendingUp,
  Lock,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { isMaleTeacher, getCreatorSupervisorLabel } from '../utils/teacherUtils';
import { ChallengeAnalyticsModal } from './ChallengeAnalyticsModal';
import { StudentChallengeAttemptDetailsModal } from './StudentChallengeAttemptDetailsModal';

interface InteractiveChallengesManagerProps {
  initialTab?: 'arena' | 'questions' | 'participations' | 'leaderboard';
}

export const InteractiveChallengesManager: React.FC<InteractiveChallengesManagerProps> = ({
  initialTab = 'arena',
}) => {
  const {
    challenges,
    canUserManageChallenge,
    addChallenge,
    updateChallenge,
    deleteChallenge,
    addQuestionToChallenge,
    updateQuestionInChallenge,
    deleteQuestionFromChallenge,
    submitChallengeAttempt,
    updateParticipationStatus,
    registerStudentForChallenge,
    deleteParticipation,
    role,
    currentUser,
    students,
    lang,
  } = useApp();

  const isStaff = role === 'admin' || role === 'teacher' || role === 'supervisor';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin' || currentUser?.role === 'admin' || currentUser?.isDirectress;
  const isSupervisor = role === 'supervisor' || currentUser?.role === 'supervisor';
  const isTeacher = role === 'teacher' || currentUser?.role === 'teacher';

  const canUserViewQuestionBank = (chal: InteractiveChallenge | null | undefined): boolean => {
    if (!chal) return false;
    if (isAdmin) return true;
    if (isSupervisor) return false;
    if (isTeacher) {
      return canUserManageChallenge(chal);
    }
    return false;
  };

  const questionBankChallenges = useMemo(() => {
    if (isAdmin) return challenges;
    if (isTeacher) return challenges.filter((c) => canUserManageChallenge(c));
    return [];
  }, [challenges, isAdmin, isTeacher, canUserManageChallenge]);

  const manageableChallenges = useMemo(() => {
    if (isAdmin) return challenges;
    if (isTeacher) return challenges.filter((c) => canUserManageChallenge(c));
    return [];
  }, [challenges, isAdmin, isTeacher, canUserManageChallenge]);

  const [activeTab, setActiveTab] = useState<'arena' | 'questions' | 'participations' | 'leaderboard'>(initialTab);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('الكل');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [participationSearchQuery, setParticipationSearchQuery] = useState<string>('');
  const [participationChallengeFilter, setParticipationChallengeFilter] = useState<string>('الكل');

  // Modals state
  const [activeGameChallenge, setActiveGameChallenge] = useState<InteractiveChallenge | null>(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<InteractiveChallenge | null>(null);
  
  const [selectedChallengeForQuestions, setSelectedChallengeForQuestions] = useState<string>(() => {
    if (isTeacher) {
      const myChal = challenges.find((c) => canUserManageChallenge(c));
      return myChal?.id || challenges[0]?.id || '';
    }
    return challenges[0]?.id || '';
  });

  // Keep selectedChallengeForQuestions synced
  useEffect(() => {
    if (questionBankChallenges.length > 0) {
      const exists = questionBankChallenges.some((c) => c.id === selectedChallengeForQuestions);
      if (!exists) {
        setSelectedChallengeForQuestions(questionBankChallenges[0].id);
      }
    }
  }, [questionBankChallenges, selectedChallengeForQuestions]);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ challengeId: string; question: ChallengeQuestion } | null>(null);

  const [isEditParticipationOpen, setIsEditParticipationOpen] = useState(false);
  const [editingParticipation, setEditingParticipation] = useState<{ challengeId: string; participation: ChallengeParticipation } | null>(null);
  const [isAddParticipationOpen, setIsAddParticipationOpen] = useState(false);

  // Analytics & Detailed Student Attempt Inspection Modals
  const [analyticsModalChallenge, setAnalyticsModalChallenge] = useState<InteractiveChallenge | null>(null);
  const [inspectedStudentAttempt, setInspectedStudentAttempt] = useState<{
    challenge: InteractiveChallenge;
    participation: ChallengeParticipation;
  } | null>(null);

  // Dedicated High-Security Deletion Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'challenge' | 'question' | 'participation';
    challengeId: string;
    questionId?: string;
    participationId?: string;
    title: string;
    subtitle?: string;
    details?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find active student object if student role
  const activeStudent = students.find((s) => s.id === currentUser?.id || s.email === currentUser?.email) || students[0];

  // Filtered challenges
  const filteredChallenges = challenges.filter((c) => {
    const matchSubject = selectedSubjectFilter === 'الكل' || c.subject === selectedSubjectFilter;
    const matchGrade =
      selectedGradeFilter === 'الكل' ||
      c.targetGrades.includes(selectedGradeFilter as GradeLevel);
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchGrade && matchSearch;
  });

  // Calculate high-level stats
  const totalQuestions = challenges.reduce((acc, c) => acc + (c.questions?.length || 0), 0);
  const totalParticipations = challenges.reduce((acc, c) => acc + (c.participations?.length || 0), 0);
  const totalHonors = challenges.reduce(
    (acc, c) =>
      acc +
      (c.participations?.filter((p) => p.status.includes('فائزة') || p.status.includes('متميزة')).length || 0),
    0
  );

  const currentSelectedChallenge = challenges.find((c) => c.id === selectedChallengeForQuestions) || challenges[0];

  // Distinct subjects list
  const subjectsList = ['الكل', ...Array.from(new Set(challenges.map((c) => c.subject)))];

  // Global Student Leaderboard calculation
  const studentLeaderboardMap: Record<
    string,
    {
      studentId: string;
      studentName: string;
      gradeLevel: GradeLevel;
      section: string;
      totalScore: number;
      totalChallengesCount: number;
      firstPlacesCount: number;
      badges: string[];
    }
  > = {};

  challenges.forEach((c) => {
    c.participations?.forEach((p) => {
      if (!studentLeaderboardMap[p.studentId]) {
        studentLeaderboardMap[p.studentId] = {
          studentId: p.studentId,
          studentName: p.studentName,
          gradeLevel: p.gradeLevel,
          section: p.section,
          totalScore: 0,
          totalChallengesCount: 0,
          firstPlacesCount: 0,
          badges: [],
        };
      }
      studentLeaderboardMap[p.studentId].totalScore += p.score || 0;
      studentLeaderboardMap[p.studentId].totalChallengesCount += 1;
      if (p.status.includes('الأول') || p.rank === 1) {
        studentLeaderboardMap[p.studentId].firstPlacesCount += 1;
      }
      if (p.awardedBadge && !studentLeaderboardMap[p.studentId].badges.includes(p.awardedBadge)) {
        studentLeaderboardMap[p.studentId].badges.push(p.awardedBadge);
      }
    });
  });

  const sortedLeaderboard = Object.values(studentLeaderboardMap).sort(
    (a, b) => b.totalScore - a.totalScore || b.firstPlacesCount - a.firstPlacesCount
  );

  return (
    <div className="space-y-6 font-arabic pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-amber-500/50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-amber-100">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Ribbon */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                منصة الموهوبات للألعاب والمنافسات التفاعلية
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Flame className="w-3.5 h-3.5 text-indigo-400" />
                تحديات حية وسريعة مع لوحة الصدارة
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 animate-pulse" />
              <span>الألعاب والمنافسات والتحديات التفاعلية</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              منظومة الأنشطة الإثرائية والمنافسات الأكاديمية لطالبات ثانوية ميسان للمتميزات. تتيح خوض المسابقات العلمية وألعاب سرعة البديهة، وإمكانية إضافة وتعديل الأسئلة وإدارة وتوثيق مشاركات وأوسمة الطالبات المتميزات.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">التحديات النشطة</span>
              <span className="text-lg font-black text-amber-300 font-mono">{challenges.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">بنك الأسئلة</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{totalQuestions}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">المشاركات المرصودة</span>
              <span className="text-lg font-black text-cyan-400 font-mono">{totalParticipations}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">الأوسمة والكؤوس</span>
              <span className="text-lg font-black text-purple-300 font-mono">{totalHonors}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar for Staff */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'arena'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>🎮 ساحة الألعاب والتحديات ({challenges.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 لوحة الصدارة والأوسمة</span>
            </button>

            {isStaff && (
              <>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'questions'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {isTeacher
                      ? `📝 بنك أسئلة تحدياتي (${questionBankChallenges.reduce((acc, c) => acc + (c.questions?.length || 0), 0)})`
                      : isSupervisor
                      ? '🔒 بنك الأسئلة (خاص بالمدرسين)'
                      : `📝 إضافة وتعديل الأسئلة (${totalQuestions})`}
                  </span>
                </button>

                {isAdmin ? (
                  <button
                    onClick={() => setActiveTab('participations')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'participations'
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>👥 تعديل المشاركات والنتائج ({totalParticipations})</span>
                  </button>
                ) : (
                  <div
                    title="تعديل المشاركات والنتائج خاص بحساب المديرة والإدارة فقط"
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed select-none opacity-80"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>🔒 تعديل المشاركات والنتائج (خاص بالمديرة والإدارة)</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Add Buttons */}
          {isStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingChallenge(null);
                  setIsCreateChallengeOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء تحدٍ جديد</span>
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setIsAddQuestionOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: SAHAT AL-AL'AB (INTERACTIVE ARENA) */}
      {activeTab === 'arena' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث في الألعاب والتحديات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {subjectsList.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj === 'الكل' ? 'جميع المواد العلمية' : subj}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="الكل">جميع المراحل والصفوف</option>
                {ALL_GRADES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              عرض ({filteredChallenges.length}) من إجمالي ({challenges.length}) مسابقة
            </span>
          </div>

          {/* Challenges Grid */}
          {filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((chal) => {
                const questionsCount = chal.questions?.length || 0;
                const participationsCount = chal.participations?.length || 0;
                
                // Check if current active student has participated
                const studentParticipation = chal.participations?.find(
                  (p) => p.studentId === activeStudent?.id || p.studentName === activeStudent?.name
                );

                const topWinner = chal.participations
                  ?.filter((p) => p.score > 0)
                  ?.sort((a, b) => b.score - a.score)[0];

                return (
                  <div
                    key={chal.id}
                    className="group relative rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-400/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Color Accent */}
                    <div
                      className={`h-2.5 w-full ${
                        chal.colorTheme === 'indigo'
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-700'
                          : chal.colorTheme === 'cyan'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-600'
                          : chal.colorTheme === 'purple'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                          : chal.colorTheme === 'emerald'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-700'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600'
                      }`}
                    />

                    <div className="p-5 space-y-4">
                      {/* Category & Status Tags */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 text-[11px]">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          {chal.category}
                        </span>
                        <span className="font-bold font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {chal.subject}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {chal.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">
                          {chal.description}
                        </p>
                      </div>

                      {/* Challenge Specs Grid */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الأسئلة</span>
                          <span className="font-black text-slate-900 font-mono flex items-center justify-center gap-0.5">
                            <BookOpen className="w-3 h-3 text-indigo-500" />
                            {questionsCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الزمن/سؤال</span>
                          <span className="font-black text-slate-900 font-mono flex items-center justify-center gap-0.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {chal.timeLimitPerQuestionSeconds}ث
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">المشاركات</span>
                          <span className="font-black text-slate-900 font-mono flex items-center justify-center gap-0.5">
                            <Users className="w-3 h-3 text-emerald-500" />
                            {participationsCount}
                          </span>
                        </div>
                      </div>

                      {/* Reward Badge Preview */}
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="flex-1 truncate">
                          <span className="text-[10px] text-amber-800 block font-bold">الجائزة والوسام:</span>
                          <span className="font-bold text-amber-950 text-[11px] truncate block">
                            {chal.rewardBadge}
                          </span>
                        </div>
                      </div>

                      {/* Top Winner Preview if available */}
                      {topWinner && (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-600">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            المتصدرة حالياً:
                          </span>
                          <span className="font-bold text-indigo-900 truncate max-w-[140px]">
                            {topWinner.studentName} ({topWinner.score} نقطة)
                          </span>
                        </div>
                      )}

                      {/* Creator & Ownership Information */}
                      <div className="flex items-center justify-between text-[11px] bg-slate-50/80 p-2 rounded-xl border border-slate-100 text-slate-600">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isMaleTeacher(chal.createdByTeacherName) ? 'المدرس المنشئ:' : 'المدرسة المنشئة:'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-indigo-950 truncate max-w-[140px]">
                            {chal.createdByTeacherName || 'إدارة المدرسة'}
                          </span>
                          {isStaff && (
                            canUserManageChallenge(chal) ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="أنت صاحب هذا التحدي (كامل الصلاحية)">
                                👑 إدارتك
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200" title={`خاص بـ (${chal.createdByTeacherName || (isMaleTeacher(chal.createdByTeacherName) ? 'المدرس المنشئ' : 'المدرسة المنشئة')})`}>
                                🔒 معاينة
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Student's personal participation indicator */}
                      {studentParticipation && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>حالتكِ: {studentParticipation.status}</span>
                          </span>
                          <span className="font-mono font-black text-emerald-800 text-xs bg-white px-2 py-0.5 rounded border border-emerald-300">
                            {studentParticipation.score} / {chal.questions && chal.questions.length > 0 ? chal.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0) : (chal.totalPoints || 100)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Footer */}
                    <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveGameChallenge(chal)}
                        disabled={questionsCount === 0}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          questionsCount > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{questionsCount > 0 ? 'بدء التحدي الآن 🚀' : 'لا توجد أسئلة بعد'}</span>
                      </button>

                      {isStaff && (
                        <div className="flex items-center gap-1">
                          <button
                            title="تحليلات ومقارنة الشعب والرسوم البيانية (Pie Chart) وكشف إجابات الطالبات"
                            onClick={() => setAnalyticsModalChallenge(chal)}
                            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span className="hidden sm:inline">تحليلات وإحصائيات</span>
                          </button>
                          {canUserViewQuestionBank(chal) ? (
                            <button
                              title="استعراض وإدارة بنك الأسئلة لهذا التحدي"
                              onClick={() => {
                                setSelectedChallengeForQuestions(chal.id);
                                setActiveTab('questions');
                              }}
                              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              title="بنك الأسئلة محجوب (لا يحق للهيئة التدريسية أو المشرفين الاطلاع على بنك الأسئلة لتحدي مدرس آخر)"
                              className="p-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center"
                            >
                              <Lock className="w-4 h-4 text-slate-400" />
                            </span>
                          )}
                          {canUserManageChallenge(chal) ? (
                            <>
                              <button
                                title="تعديل بيانات التحدي"
                                onClick={() => {
                                  setEditingChallenge(chal);
                                  setIsCreateChallengeOpen(true);
                                }}
                                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-amber-700 border border-slate-200 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                title="حذف المسابقة نهائياً"
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    type: 'challenge',
                                    challengeId: chal.id,
                                    title: chal.title,
                                    subtitle: `مادة: ${chal.subject} • ${chal.questions?.length || 0} أسئلة • ${chal.participations?.length || 0} مشاركة مسجلة`,
                                    details: `سيتم حذف هذا التحدي والمسابقة التفاعلية وكافة الأسئلة وبنك الاختبارات وسجلات مشاركات الطالبات المرتبطة به نهائياً ودائماً من قاعدة البيانات والمنظومة التعليمية.`,
                                  });
                                }}
                                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span
                              title={`خاص بالأستاذة المنشئة (${chal.createdByTeacherName || 'المدرسة المنشئة'}). لا يمكن تعديل تحديات الزملاء الآخرين.`}
                              className="p-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center"
                            >
                              <Lock className="w-4 h-4 text-slate-400" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-4">
              <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لا توجد ألعاب أو مسابقات مطابقة لخيارات البحث</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                يمكنكِ تعديل معايير الفلترة أو إضافة مسابقة وتحدٍ علمي جديد بواسطة أزرار الإدارة أعلاه.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTIONS BANK & QUESTION EDITOR */}
      {activeTab === 'questions' && isStaff && (
        isSupervisor ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-amber-200/90 shadow-md text-center space-y-4 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🔒
            </div>
            <h3 className="text-lg font-black text-slate-900">
              بنك الأسئلة محجوب عن المشرف التربوي
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
              بموجب ضوابط الخصوصية والأمان المعتمدة في ثانوية ميسان للمتميزات، لا يحق للمشرفين التربويين أو الزملاء في الهيئة التدريسية الاطلاع على بنك الأسئلة الخاص بتحديات المدرسين الآخرين. يحق للمدرس فقط استعراض وإدارة بنك الأسئلة للتحديات التي قام بإنشائها بنفسه.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('arena')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                العودة لساحة التحديات والإحصائيات
              </button>
            </div>
          </div>
        ) : isTeacher && questionBankChallenges.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
              📝
            </div>
            <h3 className="text-base font-black text-slate-900">
              لا توجد تحديات منشأة من قبلكِ حالياً
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              وفقاً لضوابط المنظومة، يمكنكِ استعراض وتعديل بنك الأسئلة فقط للتحديات والمسابقات التي قمتِ بإنشائها بنفسكِ. لا يحق الاطلاع على بنك أسئلة الزملاء الآخرين.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setEditingChallenge(null);
                  setIsCreateChallengeOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء تحدٍ جديد خاص بكِ ➕</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Challenge Selector Ribbon */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  {isTeacher ? 'اختاري أحد التحديات التي قمتِ بإنشائها لإدارة بنك أسئلته:' : 'اختاري التحدي / المسابقة لعرض وتعديل أسئلتها:'}
                </label>
                <select
                  value={selectedChallengeForQuestions}
                  onChange={(e) => setSelectedChallengeForQuestions(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-xs sm:text-sm focus:outline-none cursor-pointer"
                >
                  {(isAdmin ? challenges : questionBankChallenges).map((c) => {
                    const isMine = canUserManageChallenge(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.title} - ({c.questions?.length || 0} أسئلة) [{c.subject}] {isMine ? '👑 (إدارتكِ)' : `🔒 (${c.createdByTeacherName || 'مدرسة أخرى'})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {currentSelectedChallenge && canUserViewQuestionBank(currentSelectedChallenge) ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setIsAddQuestionOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة سؤال جديد لهذا التحدي ➕</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmModal({
                          type: 'challenge',
                          challengeId: currentSelectedChallenge.id,
                          title: currentSelectedChallenge.title,
                          subtitle: `مادة: ${currentSelectedChallenge.subject} • ${currentSelectedChallenge.questions?.length || 0} أسئلة • ${currentSelectedChallenge.participations?.length || 0} مشاركة مسجلة`,
                          details: `سيتم حذف هذا التحدي والمسابقة التفاعلية وكافة الأسئلة وبنك الاختبارات وسجلات مشاركات الطالبات المرتبطة به نهائياً ودائماً من قاعدة البيانات والمنظومة التعليمية.`,
                        });
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="حذف هذا التحدي بالكامل نهائياً"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>حذف التحدي نهائياً 🗑️</span>
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    title={`التعديل متاح فقط للأستاذة المنشئة (${currentSelectedChallenge?.createdByTeacherName || 'المدرسة المنشئة'})`}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-2 border border-slate-200 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>بنك الأسئلة محجوب (خاص بالمنشئة)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Non-owner Privacy Notice */}
            {currentSelectedChallenge && !canUserViewQuestionBank(currentSelectedChallenge) ? (
              <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3">
                <Lock className="w-10 h-10 text-amber-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">بنك الأسئلة محجوب</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  لا يحق للهيئة التدريسية أو المشرفين الاطلاع على بنك الأسئلة الخاص بتحدي لمدرس آخر.
                </p>
              </div>
            ) : currentSelectedChallenge ? (
              <>
                {/* Current Challenge Summary Banner */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold">
                        مادة: {currentSelectedChallenge.subject}
                      </span>
                      <span className="text-slate-400">
                        الصفوف المستهدفة: {currentSelectedChallenge.targetGrades.join(' ، ')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-bold">
                        المنشئة: {currentSelectedChallenge.createdByTeacherName || 'إدارة المدرسة'}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white">{currentSelectedChallenge.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">إجمالي الدرجات</span>
                      <span className="font-mono font-black text-amber-300">
                        {currentSelectedChallenge.questions && currentSelectedChallenge.questions.length > 0
                          ? currentSelectedChallenge.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
                          : (currentSelectedChallenge.totalPoints || 100)} نقطة
                      </span>
                    </div>
                    <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">عدد الأسئلة</span>
                      <span className="font-mono font-black text-emerald-300">
                        {currentSelectedChallenge.questions?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {currentSelectedChallenge.questions?.length > 0 ? (
                  <div className="space-y-4">
                    {currentSelectedChallenge.questions.map((q, idx) => {
                      const canEditThisQuestion = canUserManageChallenge(currentSelectedChallenge);
                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xs space-y-4 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                                تصنيف: {q.category || 'عام'}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                                  q.difficulty === 'easy'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : q.difficulty === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : q.difficulty === 'hard'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                مستوى: {q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'medium' ? 'متوسط' : q.difficulty === 'hard' ? 'متقدم' : 'عبقري 🧠'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
                                {q.points} نقطة
                              </span>
                              {canEditThisQuestion && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingQuestion({ challengeId: currentSelectedChallenge.id, question: q });
                                      setIsAddQuestionOpen(true);
                                    }}
                                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>تعديل</span>
                                  </button>
                                  <button
                                    title="حذف السؤال نهائياً"
                                    onClick={() => {
                                      setDeleteConfirmModal({
                                        type: 'question',
                                        challengeId: currentSelectedChallenge.id,
                                        questionId: q.id,
                                        title: `السؤال رقم ${idx + 1}: ${q.questionText}`,
                                        subtitle: `المستوى: ${q.difficulty} • النقاط: ${q.points}`,
                                        details: `سيتم حذف هذا السؤال التفاعلي وخياراته نهائياً من بنك أسئلة هذا التحدي.`,
                                      });
                                    }}
                                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Question Text */}
                          <div className="text-sm font-bold text-slate-900 whitespace-pre-wrap leading-relaxed">
                            {q.questionText}
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctOptionIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {oIdx + 1}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                  {isCorrect && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                      الإجابة الصحيحة ✓
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation if any */}
                          {q.explanation && (
                            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold text-indigo-900 block">التفسير العلمي للإجابة النموذجية:</span>
                                <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">لا توجد أسئلة مضافة لهذا التحدي حتى الآن</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      يمكنكِ البدء في بناء بنك الأسئلة التفاعلية عبر الضغط على زر إضافة سؤال جديد أعلاه.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )
      )}

      {/* TAB 3: PARTICIPATIONS MANAGEMENT (تعديل المشاركات والنتائج بالالعاب والمنافسات - خاص بالمديرة والإدارة) */}
      {activeTab === 'participations' && (
        !isAdmin ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-amber-200 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                🔒 تعديل المشاركات والنتائج خاص بحساب المديرة والإدارة فقط
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                عذراً، هذه الصلاحية مخصصة حصرياً لحساب مديرة المدرسة وإدارة النظام لضمان نزاهة ودقة السجلات والنتائج. لا يمكن لبقية المستخدمين تعديل أو حذف المشاركات والنتائج.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={() => setActiveTab('arena')}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                العودة إلى ساحة الألعاب والتحديات 🎮
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Participations Filter & Action Header */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>إدارة وتعديل مشاركات الطالبات في الألعاب والمنافسات:</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تعديل حالة المشاركة (مؤهلة، فائزة، قيد التنافس)، تفاصيل إجابة الطالبة والزمن المستغرق لكل سؤال، وتعيين الأوسمة الرسمية.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnalyticsModalChallenge(challenges[0])}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 shadow-xs flex items-center gap-2 transition-all"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>📊 لوحة التحليلات ومقارنة الشعب والصفوف (Pie Chart)</span>
                </button>

                <button
                  onClick={() => setIsAddParticipationOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل طالبة جديدة في مسابقة ➕</span>
                </button>
              </div>
            </div>

            {/* Quick Filters for Participations */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تصفية حسب المسابقة:</span>
                </div>
                <select
                  value={participationChallengeFilter}
                  onChange={(e) => setParticipationChallengeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="الكل">جميع التحديات والمسابقات ({challenges.length})</option>
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.participations?.length || 0} مشاركة)
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالبة أو الصف أو الشعبة..."
                  value={participationSearchQuery}
                  onChange={(e) => setParticipationSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* All Participations Flat List */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="py-3.5 px-4 font-bold">اسم الطالبة والمرحلة</th>
                    <th className="py-3.5 px-4 font-bold">المسابقة / التحدي</th>
                    <th className="py-3.5 px-4 font-bold text-center">حالة المشاركة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الدرجة والنقاط</th>
                    <th className="py-3.5 px-4 font-bold text-center">الوسام الممنوح</th>
                    <th className="py-3.5 px-4 font-bold text-center">المركز</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {challenges
                    .filter((c) => participationChallengeFilter === 'الكل' || c.id === participationChallengeFilter)
                    .flatMap((c) =>
                      (c.participations || []).map((p) => ({ c, p }))
                    )
                    .filter(({ p, c }) => {
                      if (!participationSearchQuery.trim()) return true;
                      const q = participationSearchQuery.trim().toLowerCase();
                      return (
                        (p.studentName || '').toLowerCase().includes(q) ||
                        (p.gradeLevel || '').toLowerCase().includes(q) ||
                        (p.section || '').toLowerCase().includes(q) ||
                        (c.title || '').toLowerCase().includes(q)
                      );
                    })
                    .map(({ c, p }) => {
                      const maxScore =
                        p.totalPossibleScore ||
                        (c.questions && c.questions.length > 0
                          ? c.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
                          : c.totalPoints || 100);
                      const percentage =
                        p.percentage !== undefined
                          ? p.percentage
                          : maxScore > 0
                          ? Math.round((p.score / maxScore) * 100)
                          : 0;

                      return (
                        <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900">{p.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {p.gradeLevel} (شعبة {p.section})
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-indigo-950">{c.title}</div>
                            <div className="text-[10px] text-slate-400">مادة: {c.subject}</div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                p.status.includes('الأول')
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-black'
                                  : p.status.includes('الثاني')
                                  ? 'bg-slate-100 text-slate-800 border-slate-300 font-black'
                                  : p.status.includes('الثالث')
                                  ? 'bg-amber-100/60 text-amber-900 border-amber-200'
                                  : p.status.includes('متميزة')
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : p.status === 'مؤهلة'
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          {/* الدرجة والنقاط على سطر واحد بشكل أنيق وواضح */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs font-mono">
                              <span className="font-black text-sm text-slate-950">
                                {p.score}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                / {maxScore}
                              </span>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 mr-0.5">
                                {percentage}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {p.awardedBadge ? (
                              <span className="inline-block text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 max-w-[160px] truncate">
                                {p.awardedBadge}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                            {p.rank ? `#${p.rank}` : '-'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setInspectedStudentAttempt({ challenge: c, participation: p })}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="عرض تفاصيل ورقة إجابة الطالبة والزمن المستغرق لكل سؤال"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>كشف الإجابات والزمن</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingParticipation({ challengeId: c.id, participation: p });
                                  setIsEditParticipationOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                title="حذف مشاركة الطالبة نهائياً"
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    type: 'participation',
                                    challengeId: c.id,
                                    participationId: p.id,
                                    title: `مشاركة الطالبة: ${p.studentName}`,
                                    subtitle: `مسابقة: ${c.title} • الدرجة: ${p.score} • الرتبة: ${p.rank ? `#${p.rank}` : '-'}`,
                                    details: `سيتم حذف سجل محاولة واختبار هذه الطالبة من نتائج المسابقة ولوحة الصدارة نهائياً ودائماً.`,
                                  });
                                }}
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
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
          </div>
        </div>
        )
      )}

      {/* TAB 4: LEADERBOARD & HONORS (لوحة الصدارة والأوسمة) */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Main Leaderboard Header Banner - High Contrast */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-400/50 shadow-2xl text-white flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-amber-400 px-3.5 py-1 rounded-full border border-amber-300 shadow-md">
                ⭐ سجل الشرف الأكاديمي للألعاب والتحديات
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 mt-1">
                <Trophy className="w-8 h-8 text-amber-400 drop-shadow-md" />
                <span className="text-amber-300">لوحة صدارة العباقرة والمتميزات</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-2xl leading-relaxed">
                الترتيب التراكمي للنقاط والأوسمة المحصودة من خلال خوض التحديات والمنافسات العلمية على مستوى المدرسة.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-3.5 px-5 rounded-2xl bg-slate-900/90 border border-amber-400/40 text-center shadow-lg">
                <span className="text-[11px] text-slate-300 font-bold block">إجمالي المتنافسات</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{sortedLeaderboard.length}</span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium Cards - High Contrast & Clear Fonts */}
          {sortedLeaderboard.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              {/* 2nd Place */}
              <div className="order-2 sm:order-1 p-6 rounded-3xl bg-white border-2 border-slate-300 shadow-xl text-center space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-300 text-slate-900 font-black text-2xl flex items-center justify-center mx-auto shadow-inner">
                  🥈
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-300 py-1 px-3.5 rounded-full inline-block">
                    المركز الثاني
                  </span>
                  <h4 className="text-lg font-black text-slate-950 mt-2">{sortedLeaderboard[1].studentName}</h4>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">{sortedLeaderboard[1].gradeLevel} (شعبة {sortedLeaderboard[1].section})</p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 text-center shadow-inner">
                  <span className="text-2xl font-mono font-black text-white block">
                    {sortedLeaderboard[1].totalScore}
                  </span>
                  <span className="text-xs text-slate-300 block font-bold mt-0.5">نقطة تميز</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 sm:order-2 p-7 rounded-3xl bg-gradient-to-b from-amber-50 via-amber-100/50 to-white border-2 border-amber-500 shadow-2xl text-center space-y-4 relative overflow-hidden flex flex-col justify-between transform sm:-translate-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-amber-500 text-slate-950 font-black text-3xl flex items-center justify-center mx-auto shadow-lg">
                  🥇
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 bg-amber-300 border border-amber-500 py-1 px-4 rounded-full inline-block shadow-xs">
                    👑 بطلة التحديات الأولى
                  </span>
                  <h4 className="text-xl font-black text-slate-950 mt-2">{sortedLeaderboard[0].studentName}</h4>
                  <p className="text-xs text-slate-800 font-bold mt-0.5">{sortedLeaderboard[0].gradeLevel} (شعبة {sortedLeaderboard[0].section})</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border-2 border-amber-400 text-center shadow-md">
                  <span className="text-3xl font-mono font-black text-amber-300 block">
                    {sortedLeaderboard[0].totalScore}
                  </span>
                  <span className="text-xs text-amber-200 block font-black mt-0.5">نقطة تميز شاملة</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 sm:order-3 p-6 rounded-3xl bg-white border-2 border-amber-600/40 shadow-xl text-center space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-black text-2xl flex items-center justify-center mx-auto shadow-inner">
                  🥉
                </div>
                <div>
                  <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 py-1 px-3.5 rounded-full inline-block">
                    المركز الثالث
                  </span>
                  <h4 className="text-lg font-black text-slate-950 mt-2">{sortedLeaderboard[2].studentName}</h4>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">{sortedLeaderboard[2].gradeLevel} (شعبة {sortedLeaderboard[2].section})</p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 text-center shadow-inner">
                  <span className="text-2xl font-mono font-black text-amber-300 block">
                    {sortedLeaderboard[2].totalScore}
                  </span>
                  <span className="text-xs text-slate-300 block font-bold mt-0.5">نقطة تميز</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table - Ultra Sharp Legibility */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-md">
            <div className="p-5 bg-slate-900 border-b border-slate-800 font-black text-sm text-white flex items-center justify-between">
              <span className="text-amber-300 flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-400" />
                قائمة تصنيف المتميزات التراكمية:
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                إجمالي المصنفات: ({sortedLeaderboard.length}) طالبة
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white border-b-2 border-slate-700 text-xs">
                    <th className="py-3.5 px-4 font-black text-center text-slate-100">الترتيب</th>
                    <th className="py-3.5 px-4 font-black text-slate-100">اسم الطالبة</th>
                    <th className="py-3.5 px-4 font-black text-slate-100">المرحلة والشعبة</th>
                    <th className="py-3.5 px-4 font-black text-center text-slate-100">عدد التحديات</th>
                    <th className="py-3.5 px-4 font-black text-center text-slate-100">المراكز الأولى 🥇</th>
                    <th className="py-3.5 px-4 font-black text-center text-slate-100">الأوسمة المحصودة</th>
                    <th className="py-3.5 px-4 font-black text-center text-slate-100">النقاط الكلية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedLeaderboard.map((item, idx) => (
                    <tr key={item.studentId} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-4 px-4 text-center font-mono font-black text-slate-950 text-sm">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>
                      <td className="py-4 px-4 font-black text-slate-950 text-sm">{item.studentName}</td>
                      <td className="py-4 px-4 text-slate-800 font-bold text-xs">
                        {item.gradeLevel} (شعبة {item.section})
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-black text-slate-950 text-sm">
                        {item.totalChallengesCount}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-black text-slate-950 text-xs bg-amber-400 border border-amber-500 px-3 py-1 rounded-xl shadow-xs inline-block">
                          {item.firstPlacesCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {item.badges.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-amber-400/40 shadow-xs"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-black text-sm text-white bg-indigo-900 px-4 py-1.5 rounded-xl border border-indigo-700 shadow-sm inline-block">
                          {item.totalScore} نقطة
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LIVE INTERACTIVE GAME PLAY ARENA */}
      {activeGameChallenge && (
        <InteractiveGamePlayModal
          challenge={activeGameChallenge}
          onClose={() => setActiveGameChallenge(null)}
          onCompleteAttempt={(score, timeSpent, answersCount, userAnswers, questionTimeSpent) => {
            submitChallengeAttempt(
              activeGameChallenge.id,
              activeStudent?.id || 'std-active',
              activeStudent?.name || 'طالبة متميزة',
              activeStudent?.gradeLevel || 'الصف السادس العلمي',
              activeStudent?.section || 'أ',
              score,
              timeSpent,
              answersCount,
              userAnswers,
              questionTimeSpent
            );
            showToast('تم حفظ نتيجتكِ وتسجيلكِ في لوحة الصدارة بنجاح! 🏆');
          }}
        />
      )}

      {/* MODAL 2: CHALLENGE ANALYTICS & SECTION COMPARISON DASHBOARD (PIE & BAR CHARTS) */}
      {analyticsModalChallenge && (
        <ChallengeAnalyticsModal
          challenge={analyticsModalChallenge}
          onClose={() => setAnalyticsModalChallenge(null)}
          onViewStudentAttempt={(participation) => {
            setInspectedStudentAttempt({
              challenge: analyticsModalChallenge,
              participation,
            });
          }}
        />
      )}

      {/* MODAL 3: STUDENT INDIVIDUAL ATTEMPT & PER-QUESTION TIME INSPECTION */}
      {inspectedStudentAttempt && (
        <StudentChallengeAttemptDetailsModal
          challenge={inspectedStudentAttempt.challenge}
          participation={inspectedStudentAttempt.participation}
          onClose={() => setInspectedStudentAttempt(null)}
          isStaff={isStaff}
          canViewQuestions={canUserViewQuestionBank(inspectedStudentAttempt.challenge)}
        />
      )}

      {/* MODAL 4: ADD / EDIT CHALLENGE MODAL */}
      {isCreateChallengeOpen && (
        <ChallengeFormModal
          challenge={editingChallenge}
          onClose={() => {
            setIsCreateChallengeOpen(false);
            setEditingChallenge(null);
          }}
          onSave={(data) => {
            if (editingChallenge) {
              updateChallenge(editingChallenge.id, data);
              showToast('تم تحديث بيانات المسابقة بنجاح ✨');
            } else {
              addChallenge(data as any);
              showToast('تم إنشاء المسابقة والتحدي التفاعلي بنجاح 🚀');
            }
            setIsCreateChallengeOpen(false);
            setEditingChallenge(null);
          }}
          onDelete={
            editingChallenge
              ? () => {
                  setDeleteConfirmModal({
                    type: 'challenge',
                    challengeId: editingChallenge.id,
                    title: editingChallenge.title,
                    subtitle: `مادة: ${editingChallenge.subject} • ${editingChallenge.questions?.length || 0} أسئلة • ${editingChallenge.participations?.length || 0} مشاركة مسجلة`,
                    details: `سيتم حذف هذا التحدي والمسابقة التفاعلية وكافة الأسئلة وبنك الاختبارات وسجلات مشاركات الطالبات المرتبطة به نهائياً ودائماً من قاعدة البيانات والمنظومة التعليمية.`,
                  });
                }
              : undefined
          }
        />
      )}

      {/* MODAL 3: ADD / EDIT QUESTION MODAL */}
      {isAddQuestionOpen && (
        <QuestionFormModal
          challengeId={editingQuestion?.challengeId || selectedChallengeForQuestions}
          question={editingQuestion?.question}
          onClose={() => {
            setIsAddQuestionOpen(false);
            setEditingQuestion(null);
          }}
          onSave={(targetChalId, qData) => {
            if (editingQuestion) {
              updateQuestionInChallenge(targetChalId, editingQuestion.question.id, qData);
              showToast('تم تحديث السؤال بنجاح ✨');
            } else {
              addQuestionToChallenge(targetChalId, qData as any);
              showToast('تمت إضافة السؤال الجديد لبنك الأسئلة بنجاح ➕');
            }
            setIsAddQuestionOpen(false);
            setEditingQuestion(null);
          }}
          onDelete={
            editingQuestion
              ? () => {
                  const currentChallenge = challenges.find((c) => c.id === editingQuestion.challengeId);
                  setDeleteConfirmModal({
                    type: 'question',
                    challengeId: editingQuestion.challengeId,
                    questionId: editingQuestion.question.id,
                    title: editingQuestion.question.questionText,
                    subtitle: `مسابقة: ${currentChallenge?.title || ''} • ${editingQuestion.question.points} نقطة`,
                    details: `سيتم حذف هذا السؤال التفاعلي بالكامل وبشكل نهائي من بنك أسئلة المسابقة وإعادة احتساب الدرجة الكلية.`,
                  });
                }
              : undefined
          }
        />
      )}

      {/* MODAL 4: EDIT PARTICIPATION MODAL */}
      {isEditParticipationOpen && editingParticipation && (
        <EditParticipationModal
          challengeId={editingParticipation.challengeId}
          participation={editingParticipation.participation}
          onClose={() => {
            setIsEditParticipationOpen(false);
            setEditingParticipation(null);
          }}
          onSave={(updated) => {
            updateParticipationStatus(editingParticipation.challengeId, editingParticipation.participation.id, updated);
            showToast('تم حفظ وتعديل بيانات المشاركة والرتبة بنجاح ✓');
            setIsEditParticipationOpen(false);
            setEditingParticipation(null);
          }}
        />
      )}

      {/* MODAL 5: REGISTER / ADD STUDENT TO CHALLENGE */}
      {isAddParticipationOpen && (
        <AddStudentToChallengeModal
          challenges={challenges}
          students={students}
          onClose={() => setIsAddParticipationOpen(false)}
          onRegister={(chalId, student) => {
            registerStudentForChallenge(
              chalId,
              student.id,
              student.name,
              student.gradeLevel,
              student.section
            );
            showToast(`تم تسجيل الطالبة "${student.name}" في المسابقة بنجاح! 🎯`);
            setIsAddParticipationOpen(false);
          }}
        />
      )}

      {/* MODAL 6: HIGH-SECURITY FINAL DELETION CONFIRMATION */}
      {deleteConfirmModal && (
        <DeleteConfirmModal
          data={deleteConfirmModal}
          onClose={() => setDeleteConfirmModal(null)}
          onConfirm={() => {
            if (deleteConfirmModal.type === 'challenge') {
              const targetId = deleteConfirmModal.challengeId;
              deleteChallenge(targetId);
              if (selectedChallengeForQuestions === targetId) {
                const remaining = challenges.filter((c) => c.id !== targetId);
                setSelectedChallengeForQuestions(remaining[0]?.id || '');
              }
              setIsCreateChallengeOpen(false);
              setEditingChallenge(null);
              showToast('تم حذف المسابقة والتحدي التفاعلي نهائياً من المنظومة بنجاح 🗑️');
            } else if (deleteConfirmModal.type === 'question' && deleteConfirmModal.questionId) {
              deleteQuestionFromChallenge(deleteConfirmModal.challengeId, deleteConfirmModal.questionId);
              setIsAddQuestionOpen(false);
              setEditingQuestion(null);
              showToast('تم حذف السؤال التفاعلي نهائياً من بنك الأسئلة بنجاح ✓');
            } else if (deleteConfirmModal.type === 'participation' && deleteConfirmModal.participationId) {
              deleteParticipation(deleteConfirmModal.challengeId, deleteConfirmModal.participationId);
              setIsEditParticipationOpen(false);
              setEditingParticipation(null);
              showToast('تم حذف سجل ومشاركة الطالبة نهائياً بنجاح ✓');
            }
            setDeleteConfirmModal(null);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: LIVE GAME PLAY MODAL
// ==========================================
interface InteractiveGamePlayModalProps {
  challenge: InteractiveChallenge;
  onClose: () => void;
  onCompleteAttempt: (
    score: number,
    timeSpentSeconds: number,
    answersCount: { correct: number; total: number },
    userAnswers: Record<string, number>,
    questionTimeSpent?: Record<string, number>
  ) => void;
}

const InteractiveGamePlayModal: React.FC<InteractiveGamePlayModalProps> = ({
  challenge,
  onClose,
  onCompleteAttempt,
}) => {
  const questions = challenge.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});
  const [currentQTimeSpent, setCurrentQTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimitPerQuestionSeconds || 30);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const currentQ = questions[currentQIndex];

  // Timer countdown per question
  useEffect(() => {
    if (isFinished || isAnswerSubmitted || !currentQ) return;

    if (timeLeft <= 0) {
      // Time up: auto submit wrong
      handleOptionSelect(-1);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setTotalTimeSpent((prev) => prev + 1);
      setCurrentQTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isAnswerSubmitted, currentQIndex, currentQ]);

  const handleOptionSelect = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optIndex);
    setIsAnswerSubmitted(true);

    const isCorrect = optIndex === currentQ?.correctOptionIndex;
    const earnedPoints = isCorrect ? (Number(currentQ?.points) || 25) : 0;

    if (isCorrect) {
      setScore((prev) => prev + earnedPoints);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));

    const timeForThisQ = Math.max(1, currentQTimeSpent);
    setQuestionTimeSpent((prev) => ({
      ...prev,
      [currentQ.id]: timeForThisQ,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
      setTimeLeft(challenge.timeLimitPerQuestionSeconds || 30);
      setCurrentQTimeSpent(0);
    } else {
      // Finished
      setIsFinished(true);
      const allUserAnswers = { ...userAnswers, [currentQ.id]: selectedOption ?? -1 };
      const finalQTimes = { ...questionTimeSpent, [currentQ.id]: Math.max(1, currentQTimeSpent) };
      const totalCorrect = Object.entries(allUserAnswers).filter(
        ([qId, ans]) => questions.find((q) => q.id === qId)?.correctOptionIndex === ans
      ).length;

      onCompleteAttempt(
        score,
        totalTimeSpent,
        { correct: totalCorrect, total: questions.length },
        allUserAnswers,
        finalQTimes
      );
    }
  };

  const handleRestart = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setQuestionTimeSpent({});
    setCurrentQTimeSpent(0);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
    setTimeLeft(challenge.timeLimitPerQuestionSeconds || 30);
    setTotalTimeSpent(0);
    setShowHint(false);
  };

  const totalPossiblePoints = questions.length > 0
    ? questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
    : (challenge.totalPoints || 100);
  const percentage = Math.min(100, Math.round((score / totalPossiblePoints) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl text-white shadow-2xl overflow-hidden font-arabic my-auto">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">{challenge.title}</h3>
              <p className="text-[11px] text-slate-400">مادة: {challenge.subject} | {challenge.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isFinished && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-500/40 text-amber-300 font-mono text-xs font-black">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>{score} نقطة</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GAME PLAY ARENA */}
        {!isFinished && currentQ ? (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Progress & Countdown Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>
                  السؤال ({currentQIndex + 1} من {questions.length})
                </span>
                <span
                  className={`font-mono font-black flex items-center gap-1 px-2.5 py-0.5 rounded-lg border ${
                    timeLeft <= 5
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-slate-800 text-amber-300 border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {timeLeft} ثانية
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Box */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-indigo-500/20 space-y-2 text-right">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {currentQ.points} نقطة
                </span>
                <span className="text-slate-400">تصنيف: {currentQ.category || 'عام'}</span>
              </div>
              <div className="text-base sm:text-lg font-black text-white leading-relaxed pt-1 whitespace-pre-wrap break-words">
                {currentQ.questionText}
              </div>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctOptionIndex;

                let btnClass = 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnClass = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-black';
                  } else if (isSelected && !isCorrect) {
                    btnClass = 'bg-rose-600/30 border-rose-500 text-rose-200 font-black';
                  } else {
                    btnClass = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`p-4 rounded-2xl border text-right text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-3 ${btnClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs flex items-center justify-center text-amber-300 font-black shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="whitespace-pre-wrap break-words">{opt}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post Answer Feedback & Explanation */}
            {isAnswerSubmitted && (
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-black flex items-center gap-1.5 ${
                      selectedOption === currentQ.correctOptionIndex
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {selectedOption === currentQ.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>إجابة صحيحة وممتازة! (+{currentQ.points} نقطة)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>إجابة غير دقيقة! الإجابة الصحيحة هي الخيار ({String.fromCharCode(65 + currentQ.correctOptionIndex)})</span>
                      </>
                    )}
                  </span>
                </div>
                {currentQ.explanation && (
                  <p className="text-xs text-slate-300 leading-relaxed font-medium pt-1 border-t border-indigo-500/20 whitespace-pre-wrap break-words">
                    💡 <span className="font-bold text-amber-300">التفسير العلمي:</span> {currentQ.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Hint Drawer for Gifted Students */}
            {currentQ.hint && !isAnswerSubmitted && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showHint ? 'إخفاء تلميح الذكاء' : 'عرض تلميح الذكاء للموهوبات'}</span>
                </button>
                {showHint && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 leading-relaxed whitespace-pre-wrap break-words">
                    🧠 {currentQ.hint}
                  </div>
                )}
              </div>
            )}

            {/* Next / Submit Button */}
            {isAnswerSubmitted && (
              <button
                onClick={handleNextQuestion}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <span>{currentQIndex + 1 < questions.length ? 'السؤال التالي ⚡' : 'عرض النتيجة النهائية 🏆'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        ) : isFinished ? (
          /* CELEBRATION FINISH SCREEN */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-4xl flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                اكتمل التحدي بنجاح
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                تهانينا يا مبدعة! أداء بطولي رائع 🌟
              </h2>
              <p className="text-xs text-slate-400">
                تم تسجيل نقاطكِ في لوحة الصدارة وتوثيق رصيدكِ في سجل التميز.
              </p>
            </div>

            {/* Result Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">الدرجة المحققة</span>
                <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                  {score} / {totalPossiblePoints}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">النسبة المئوية</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">{percentage}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">الوقت المستغرق</span>
                <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">{totalTimeSpent}ث</span>
              </div>
            </div>

            {/* Awarded Badge Banner if >= 80% */}
            {percentage >= 80 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold space-y-1">
                <span className="text-amber-400 font-black text-sm block">🎖️ تم فتح الوسام الرسمي بنجاح:</span>
                <span className="text-white font-extrabold text-sm">{challenge.rewardBadge}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة 🔁</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>إغلاق وعرض الترتيب 📊</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CREATE / EDIT CHALLENGE MODAL
// ==========================================
interface ChallengeFormModalProps {
  challenge: InteractiveChallenge | null;
  onClose: () => void;
  onSave: (data: Partial<InteractiveChallenge>) => void;
  onDelete?: () => void;
}

const ChallengeFormModal: React.FC<ChallengeFormModalProps> = ({ challenge, onClose, onSave, onDelete }) => {
  const { currentUser } = useApp();
  const [title, setTitle] = useState(challenge?.title || '');
  const [description, setDescription] = useState(challenge?.description || '');
  const [category, setCategory] = useState(challenge?.category || 'الرياضيات والمنطق');
  const [subject, setSubject] = useState(challenge?.subject || 'الرياضيات');
  const [type, setType] = useState<InteractiveChallenge['type']>(challenge?.type || 'quiz_battle');
  const [targetGrades, setTargetGrades] = useState<GradeLevel[]>(
    challenge?.targetGrades || ['الصف الرابع العلمي', 'الصف الخامس العلمي', 'الصف السادس العلمي']
  );
  const questionsSum = (challenge?.questions || []).reduce((acc, q) => acc + (Number(q.points) || 0), 0);
  const [timeLimit, setTimeLimit] = useState(challenge?.timeLimitPerQuestionSeconds || 30);
  const [totalPoints, setTotalPoints] = useState(
    questionsSum > 0 ? questionsSum : (challenge?.totalPoints || 100)
  );
  const [rewardBadge, setRewardBadge] = useState(
    challenge?.rewardBadge || '🏆 وسام التميز والإبداع الذهبي'
  );
  const [colorTheme, setColorTheme] = useState<InteractiveChallenge['colorTheme']>(
    challenge?.colorTheme || 'indigo'
  );

  const toggleGrade = (grade: GradeLevel) => {
    if (targetGrades.includes(grade)) {
      if (targetGrades.length > 1) {
        setTargetGrades(targetGrades.filter((g) => g !== grade));
      }
    } else {
      setTargetGrades([...targetGrades, grade]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const accurateTotalPoints = (challenge?.questions && challenge.questions.length > 0)
      ? challenge.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
      : (Number(totalPoints) || 100);

    onSave({
      title,
      description,
      category,
      subject,
      type,
      targetGrades,
      startDate: challenge?.startDate || new Date().toISOString().split('T')[0],
      endDate: challenge?.endDate || '2026-12-31',
      status: 'active',
      timeLimitPerQuestionSeconds: Number(timeLimit) || 30,
      totalPoints: accurateTotalPoints,
      rewardBadge,
      rewardPoints: 200,
      colorTheme,
      createdByTeacherId: challenge?.createdByTeacherId || (currentUser?.id || currentUser?.teacherObj?.id || 'tech-current'),
      createdByTeacherName: challenge?.createdByTeacherName || (currentUser?.name || currentUser?.teacherObj?.name || 'أستاذة المادة'),
      questions: challenge?.questions || [],
      participations: challenge?.participations || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 font-arabic my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">
              {challenge ? 'تعديل بيانات المسابقة / التحدي' : 'إنشاء مسابقة وتحدٍ تفاعلي جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Info Box */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
          <span className="font-bold flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>
              {isMaleTeacher(challenge?.createdByTeacherName || currentUser?.name)
                ? 'المدرس المنشئ المسؤول عن التحدي:'
                : 'المدرسة المنشئة المسؤولة عن التحدي:'}
            </span>
          </span>
          <span className="font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs">
            {challenge?.createdByTeacherName ||
              currentUser?.name ||
              currentUser?.teacherObj?.name ||
              (isMaleTeacher(currentUser) ? 'أستاذ المادة' : 'أستاذة المادة')}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان التحدي / المسابقة *</label>
            <input
              type="text"
              required
              placeholder="مثال: أولمبياد الرياضيات والتفكير الإبداعي للمتميزات 📐"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والأهداف العلمية *</label>
            <textarea
              rows={2}
              required
              placeholder="اكتبي نبذة تعريفية عن موضوع التحدي والمهارات المكتسبة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المادة العلمية *</label>
              <input
                type="text"
                required
                placeholder="مثال: الرياضيات، الفيزياء، الحاسوب..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الإثرائي *</label>
              <input
                type="text"
                required
                placeholder="مثال: الخوارزميات، المنطق، الكوانتم..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Grades Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الصفوف المشمولة بالمنافسة *</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_GRADES_LIST.map((grade) => {
                const isSelected = targetGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`p-2 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{grade}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الزمن لكل سؤال (ثانية)</label>
              <input
                type="number"
                min={10}
                max={180}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة الكلية</label>
              <input
                type="number"
                min={10}
                max={500}
                value={totalPoints}
                onChange={(e) => setTotalPoints(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
              />
              {challenge?.questions && challenge.questions.length > 0 && (
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-bold">
                    مجموع الأسئلة: <span className="font-mono text-indigo-700 font-black">{questionsSum}</span> نقطة
                  </span>
                  {totalPoints !== questionsSum && (
                    <button
                      type="button"
                      onClick={() => setTotalPoints(questionsSum)}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      مزامنة
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">السمة اللونية</label>
              <select
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              >
                <option value="indigo">نيلي (Indigo)</option>
                <option value="cyan">سماوي (Cyan)</option>
                <option value="purple">بنفسجي (Purple)</option>
                <option value="emerald">زمردي (Emerald)</option>
                <option value="amber">ذهبي (Amber)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الجائزة والوسام الممنوح 🏆</label>
            <input
              type="text"
              required
              placeholder="مثال: 🏆 وسام فيثاغورس الذهبي للعبقرية الرياضية"
              value={rewardBadge}
              onChange={(e) => setRewardBadge(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-bold text-amber-950 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {challenge && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="حذف هذه المسابقة نهائياً من المنظومة"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف نهائي للمسابقة 🗑️</span>
              </button>
            )}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {challenge ? 'حفظ التعديلات' : 'تثبيت وإنشاء المسابقة 🚀'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: ADD / EDIT QUESTION MODAL
// ==========================================
interface QuestionFormModalProps {
  challengeId: string;
  question?: ChallengeQuestion | null;
  onClose: () => void;
  onSave: (challengeId: string, data: Partial<ChallengeQuestion>) => void;
  onDelete?: () => void;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  challengeId,
  question,
  onClose,
  onSave,
  onDelete,
}) => {
  const { challenges, canUserManageChallenge } = useApp();
  const manageableChallenges = challenges.filter((c) => canUserManageChallenge(c));
  const [selectedChalId, setSelectedChalId] = useState<string>(() => {
    if (challengeId && canUserManageChallenge(challenges.find((c) => c.id === challengeId))) {
      return challengeId;
    }
    return manageableChallenges[0]?.id || challenges[0]?.id || '';
  });
  const [questionText, setQuestionText] = useState(question?.questionText || '');
  const [options, setOptions] = useState<string[]>(
    question?.options || ['', '', '', '']
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(
    question?.correctOptionIndex ?? 0
  );
  const [points, setPoints] = useState<number>(question?.points ?? 25);
  const [difficulty, setDifficulty] = useState<ChallengeQuestion['difficulty']>(
    question?.difficulty || 'medium'
  );
  const [category, setCategory] = useState(question?.category || '');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [hint, setHint] = useState(question?.hint || '');

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    // Filter non-empty options, make sure at least 2 options
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      alert('يرجى كتابة خيارين للإجابة على الأقل!');
      return;
    }

    onSave(selectedChalId, {
      questionText,
      options: cleanOptions,
      correctOptionIndex: Math.min(correctOptionIndex, cleanOptions.length - 1),
      points: Number(points) || 20,
      difficulty,
      category: category || 'عام',
      explanation,
      hint,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 font-arabic my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              {question ? 'تعديل السؤال التفاعلي' : 'إضافة سؤال جديد لبنك الأسئلة'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Challenge Selector if adding new */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المسابقة / التحدي المستهدف *</label>
            <select
              value={selectedChalId}
              onChange={(e) => setSelectedChalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-xs focus:outline-none"
            >
              {(manageableChallenges.length > 0 ? manageableChallenges : challenges).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.subject}) {c.createdByTeacherName ? `[${c.createdByTeacherName}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نص ومنطوق السؤال التفاعلي *
              </label>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                ✨ يحافظ على الأسطر والأبيات الشعرية والتنسيق
              </span>
            </div>

            {/* Quick Formatting & Math Symbol Toolbar */}
            <div className="mb-2 p-2 rounded-xl bg-slate-100/90 border border-slate-200/90 flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-[10px] text-slate-500 font-bold px-1">إدراج سريع:</span>
              
              {/* Insert Line Break / Verse / Numbering */}
              <button
                type="button"
                onClick={() => setQuestionText((prev) => prev + '\n')}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-bold transition-colors"
                title="إضافة سطر جديد أسفل النص"
              >
                ↵ سطر جديد
              </button>
              <button
                type="button"
                onClick={() => setQuestionText((prev) => prev + (prev.length > 0 && !prev.endsWith('\n') ? '\n1. ' : '1. '))}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-bold transition-colors"
                title="إضافة ترقيم بند"
              >
                🔢 ترقيم (1.)
              </button>
              <button
                type="button"
                onClick={() => setQuestionText((prev) => prev + ' ... / ... ')}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-bold transition-colors"
                title="فاصل شطري بيت شعري"
              >
                📜 شطر بيت شعري
              </button>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* Math & Scientific Symbols */}
              {[
                '²', '³', '√', 'π', '∑', '≠', '≤', '≥', '±', 'θ', 'λ', '∞', '×', '÷', '→', '∆', '°'
              ].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setQuestionText((prev) => prev + sym)}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-800 font-mono font-black flex items-center justify-center transition-colors text-xs"
                  title={`إدراج الرمز ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              required
              placeholder="اكتبي نص المسألة أو السؤال العلمي هنا... يمكنكِ الضغط على Enter لإضافة أسطر متعددة أو أبيات شعرية وسيحافظ النظام على تنسيقها بالكامل."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 whitespace-pre-wrap leading-relaxed min-h-[96px]"
            />

            {/* Live Formatted Preview Card */}
            {questionText.trim() && (
              <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-amber-900 font-black">
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>معاينة تنسيق منطوق السؤال (كما سيظهر للطالبات في التحدي):</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-normal">
                    {questionText.split('\n').length} {questionText.split('\n').length === 1 ? 'سطر واحد' : 'أسطر'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-slate-900 text-xs sm:text-sm font-black whitespace-pre-wrap break-words leading-relaxed text-right">
                  {questionText}
                </div>
              </div>
            )}
          </div>

          {/* Options List with Radio for Correct Answer */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>خيارات الإجابة (حددي الإجابة الصحيحة بالنقر على الدائرة) *</span>
              <span className="text-[11px] text-emerald-600 font-bold">🟢 الدائرة الخضراء = الإجابة الصحيحة</span>
            </label>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOptionIndex(idx)}
                  className={`w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-all ${
                    correctOptionIndex === idx
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </button>
                <input
                  type="text"
                  required={idx < 2}
                  placeholder={`الخيار (${String.fromCharCode(65 + idx)})`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    correctOptionIndex === idx
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة المخصصة للسؤال</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 25)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مستوى الصعوبة</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">متقدم</option>
                  <option value="genius">عبقري 🧠</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المحور / الفرع</label>
                <input
                  type="text"
                  placeholder="مثال: الجبر، الكم..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            {/* Quick Points Presets & Calculation Hint */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-[11px]">
                <span>خيارات الدرجة السريعة:</span>
                {[25, 20, 10, 50].map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPoints(pt)}
                    className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-black transition-all ${
                      points === pt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {pt} درجة
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-indigo-800 font-bold">
                🎯 4 أسئلة × {points} = <span className="font-mono font-black text-indigo-950">{4 * points}</span> درجة كليّة
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الشرح والتفسير العلمي النموذجي</label>
            <textarea
              rows={2}
              placeholder="خطوات الحل النموذجية التي تظهر للطالبة بعد الإجابة..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تلميح الذكاء (اختياري)</label>
            <input
              type="text"
              placeholder="تلميح ذكي يساعد الطالبة على التفكير..."
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {question && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="حذف هذا السؤال نهائياً من بنك الأسئلة"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف السؤال نهائياً 🗑️</span>
              </button>
            )}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {question ? 'حفظ تعديل السؤال' : 'إضافة السؤال للبنك ➕'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: EDIT PARTICIPATION MODAL
// ==========================================
interface EditParticipationModalProps {
  challengeId: string;
  participation: ChallengeParticipation;
  onClose: () => void;
  onSave: (data: Partial<ChallengeParticipation>) => void;
}

const EditParticipationModal: React.FC<EditParticipationModalProps> = ({
  participation,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<ChallengeParticipation['status']>(participation.status);
  const [score, setScore] = useState(participation.score);
  const [rank, setRank] = useState(participation.rank || 1);
  const [awardedBadge, setAwardedBadge] = useState(participation.awardedBadge || '');
  const [teacherNotes, setTeacherNotes] = useState(participation.teacherNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      score: Number(score),
      rank: Number(rank),
      awardedBadge,
      teacherNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 font-arabic my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">تعديل نتيجة ومشاركة الطالبة</h3>
              <p className="text-[11px] text-slate-500">{participation.studentName} ({participation.gradeLevel})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حالة المشاركة والتقدير الرسمي *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:outline-none"
            >
              <option value="فائزة بالمركز الأول 🥇">فائزة بالمركز الأول 🥇</option>
              <option value="فائزة بالمركز الثاني 🥈">فائزة بالمركز الثاني 🥈</option>
              <option value="فائزة بالمركز الثالث 🥉">فائزة بالمركز الثالث 🥉</option>
              <option value="مشاركة متميزة 🎖️">مشاركة متميزة 🎖️</option>
              <option value="مؤهلة">مؤهلة للمرحلة التالية ⚡</option>
              <option value="قيد المنافسة">قيد المنافسة ⏳</option>
              <option value="مكتملة">مكتملة ✓</option>
              <option value="مسجلة">مسجلة حديثاً</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة المحققة</label>
              <input
                type="number"
                min={0}
                max={500}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الترتيب / المركز</label>
              <input
                type="number"
                min={1}
                max={100}
                value={rank}
                onChange={(e) => setRank(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوسام الممنوح (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: 🏆 وسام فيثاغورس الذهبي للعبقرية الرياضية"
              value={awardedBadge}
              onChange={(e) => setAwardedBadge(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-bold text-amber-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وثناء المدرسة / الإدارة</label>
            <textarea
              rows={2}
              placeholder="كلمة إشادة وتقدير لأداء الطالبة..."
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all"
            >
              حفظ التعديلات وتثبيت النتيجة ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: ADD STUDENT TO CHALLENGE
// ==========================================
interface AddStudentToChallengeModalProps {
  challenges: InteractiveChallenge[];
  students: any[];
  onClose: () => void;
  onRegister: (challengeId: string, student: any) => void;
}

const AddStudentToChallengeModal: React.FC<AddStudentToChallengeModalProps> = ({
  challenges,
  students,
  onClose,
  onRegister,
}) => {
  const [selectedChalId, setSelectedChalId] = useState(challenges[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  const selectedChal = challenges.find((c) => c.id === selectedChalId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChal || !selectedStudent) return;
    onRegister(selectedChal.id, selectedStudent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 font-arabic my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">تسجيل طالبة في مسابقة وتحدٍ</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المسابقة / التحدي *</label>
            <select
              value={selectedChalId}
              onChange={(e) => setSelectedChalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اختيار الطالبة المتميزة *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.gradeLevel} (شعبة {s.section})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all"
            >
              تأكيد التسجيل الآن 🎯
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: HIGH-SECURITY DELETE CONFIRM MODAL
// ==========================================
interface DeleteConfirmModalProps {
  data: {
    type: 'challenge' | 'question' | 'participation';
    challengeId: string;
    questionId?: string;
    participationId?: string;
    title: string;
    subtitle?: string;
    details?: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ data, onClose, onConfirm }) => {
  const isChallenge = data.type === 'challenge';
  const isQuestion = data.type === 'question';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 space-y-5 font-arabic my-auto">
        <div className="flex items-start justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-950">
                {isChallenge
                  ? 'تأكيد الحذف النهائي للمسابقة والتحدي'
                  : isQuestion
                  ? 'تأكيد حذف السؤال التفاعلي'
                  : 'تأكيد حذف مشاركة الطالبة'}
              </h3>
              <p className="text-[11px] text-rose-700 font-bold">إجراء إداري دائم لا يمكن التراجع عنه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-rose-950">
                هل أنتِ متأكدة من رغبتكِ في الحذف النهائي؟
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                {data.details || 'سيتم حذف هذا العنصر بشكل نهائي ودائم من المنظومة وقاعدة البيانات.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-black text-slate-900 leading-relaxed whitespace-pre-wrap break-words max-h-36 overflow-y-auto">
              {data.title}
            </div>
            {data.subtitle && (
              <div className="text-[11px] font-bold text-slate-500">
                {data.subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            إلغاء وتراجع
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، حذف نهائياً 🗑️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

