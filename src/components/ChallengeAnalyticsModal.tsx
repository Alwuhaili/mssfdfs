import React, { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  Search,
  Printer,
  ChevronDown,
  UserCheck,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Percent,
  Flame,
  ArrowUpDown,
  GraduationCap,
  Download,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChallengeParticipation, InteractiveChallenge, GradeLevel, CurrentUser } from '../types';
import { StudentChallengeAttemptDetailsModal } from './StudentChallengeAttemptDetailsModal';

interface ChallengeAnalyticsModalProps {
  challenge: InteractiveChallenge;
  allChallenges?: InteractiveChallenge[];
  currentUser?: CurrentUser | null;
  onClose: () => void;
  onViewStudentAttempt?: (participation: ChallengeParticipation) => void;
  onUpdateParticipation?: (
    challengeId: string,
    participationId: string,
    updates: Partial<ChallengeParticipation>
  ) => void;
  onDeleteParticipation?: (challengeId: string, participationId: string) => void;
  onSelectAnotherChallenge?: (chal: InteractiveChallenge) => void;
}

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const ChallengeAnalyticsModal: React.FC<ChallengeAnalyticsModalProps> = ({
  challenge,
  allChallenges = [],
  currentUser,
  onClose,
  onViewStudentAttempt,
  onUpdateParticipation,
  onDeleteParticipation,
  onSelectAnotherChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'students' | 'questions'>('analytics');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('الكل');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'name' | 'rank'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pieMode, setPieMode] = useState<'sections' | 'performance' | 'grades'>('sections');

  // Selected student for detailed attempt inspection
  const [inspectedParticipation, setInspectedParticipation] = useState<ChallengeParticipation | null>(null);

  const isDirectressOrAdmin = currentUser?.role === 'admin' || currentUser?.isDirectress;
  const isSupervisor = currentUser?.role === 'supervisor';
  const isTeacher = currentUser?.role === 'teacher';

  const canViewQuestions = useMemo(() => {
    if (isDirectressOrAdmin) return true;
    if (isSupervisor) return false;
    if (isTeacher) {
      const currentTeacherName = (currentUser?.name || '').trim();
      const currentTeacherId = currentUser?.id || '';
      if (challenge.createdByTeacherId && currentTeacherId && challenge.createdByTeacherId === currentTeacherId) {
        return true;
      }
      if (challenge.createdByTeacherName && currentTeacherName) {
        const clean = (n: string) =>
          n.replace(/^(أ\.د\.|أ\.|د\.|استاذة|أستاذة|الست|معلمة|مدرسة)\s*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        const n1 = clean(challenge.createdByTeacherName);
        const n2 = clean(currentTeacherName);
        return n1 === n2 || n1.includes(n2) || n2.includes(n1);
      }
      return false;
    }
    return false;
  }, [currentUser, isDirectressOrAdmin, isSupervisor, isTeacher, challenge]);

  const participations = useMemo(() => challenge.participations || [], [challenge.participations]);
  const questions = useMemo(() => challenge.questions || [], [challenge.questions]);

  const totalPossiblePoints = useMemo(() => {
    return questions.length > 0
      ? questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
      : challenge.totalPoints || 100;
  }, [questions, challenge.totalPoints]);

  // Extract unique sections and grades from current participations
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    participations.forEach((p) => {
      if (p.section) set.add(p.section);
    });
    return Array.from(set).sort();
  }, [participations]);

  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    participations.forEach((p) => {
      if (p.gradeLevel) set.add(p.gradeLevel);
    });
    return Array.from(set);
  }, [participations]);

  // Filtered Participations
  const filteredParticipations = useMemo(() => {
    return participations
      .filter((p) => {
        if (selectedGradeFilter !== 'الكل' && p.gradeLevel !== selectedGradeFilter) return false;
        if (selectedSectionFilter !== 'الكل' && p.section !== selectedSectionFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.studentName.toLowerCase().includes(q) ||
            p.gradeLevel.toLowerCase().includes(q) ||
            (p.section && p.section.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rank') {
          return (a.rank || 999) - (b.rank || 999);
        }
        if (sortBy === 'score') {
          return sortDirection === 'desc' ? b.score - a.score : a.score - b.score;
        }
        if (sortBy === 'time') {
          return sortDirection === 'desc'
            ? b.timeSpentSeconds - a.timeSpentSeconds
            : a.timeSpentSeconds - b.timeSpentSeconds;
        }
        if (sortBy === 'name') {
          return a.studentName.localeCompare(b.studentName, 'ar');
        }
        return 0;
      });
  }, [participations, selectedGradeFilter, selectedSectionFilter, searchQuery, sortBy, sortDirection]);

  // Top Metrics (KPIs)
  const totalCount = participations.length;
  const avgScore = totalCount > 0 ? Math.round(participations.reduce((acc, p) => acc + (p.score || 0), 0) / totalCount) : 0;
  const avgPercentage = totalPossiblePoints > 0 ? Math.round((avgScore / totalPossiblePoints) * 100) : 0;
  const avgTimeSeconds = totalCount > 0 ? Math.round(participations.reduce((acc, p) => acc + (p.timeSpentSeconds || 0), 0) / totalCount) : 0;
  const passedCount = participations.filter((p) => (p.percentage || 0) >= 50).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const topWinner = participations.find((p) => p.rank === 1) || participations[0];

  // ==========================================
  // CHART DATA 1: SECTION COMPARISON (Bar & Pie)
  // ==========================================
  const sectionStats = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; totalTime: number; scores: number[] }> = {};
    participations.forEach((p) => {
      const secKey = `شعبة ${p.section || 'أ'}`;
      if (!map[secKey]) {
        map[secKey] = { count: 0, totalScore: 0, totalTime: 0, scores: [] };
      }
      map[secKey].count += 1;
      map[secKey].totalScore += p.score || 0;
      map[secKey].totalTime += p.timeSpentSeconds || 0;
      map[secKey].scores.push(p.score || 0);
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      'عدد الطالبات': data.count,
      'متوسط الدرجة': Math.round(data.totalScore / (data.count || 1)),
      'متوسط الزمن (ثانية)': Math.round(data.totalTime / (data.count || 1)),
      'الدرجة القصوى': Math.max(...data.scores, 0),
    }));
  }, [participations]);

  // CHART DATA 2: GRADE COMPARISON
  const gradeStats = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number; totalTime: number }> = {};
    participations.forEach((p) => {
      const gradeKey = p.gradeLevel || 'غير محدد';
      if (!map[gradeKey]) {
        map[gradeKey] = { count: 0, totalScore: 0, totalTime: 0 };
      }
      map[gradeKey].count += 1;
      map[gradeKey].totalScore += p.score || 0;
      map[gradeKey].totalTime += p.timeSpentSeconds || 0;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      'عدد الطالبات': data.count,
      'متوسط الدرجة': Math.round(data.totalScore / (data.count || 1)),
      'متوسط الزمن (ثانية)': Math.round(data.totalTime / (data.count || 1)),
    }));
  }, [participations]);

  // CHART DATA 3: PERFORMANCE TIERS (Pie Chart)
  const performanceTiers = useMemo(() => {
    const excellent = participations.filter((p) => (p.percentage || 0) >= 90).length;
    const veryGood = participations.filter((p) => (p.percentage || 0) >= 75 && (p.percentage || 0) < 90).length;
    const good = participations.filter((p) => (p.percentage || 0) >= 50 && (p.percentage || 0) < 75).length;
    const needFollowup = participations.filter((p) => (p.percentage || 0) < 50).length;

    return [
      { name: 'ممتاز وعباقرة (90-100%) 🥇', value: excellent, color: '#10b981' },
      { name: 'جيد جداً ومتميزات (75-89%) 🥈', value: veryGood, color: '#4f46e5' },
      { name: 'جيد وناجحات (50-74%) 🥉', value: good, color: '#f59e0b' },
      { name: 'بحاجة لمتابعة (<50%)', value: needFollowup, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [participations]);

  // Section Pie Chart Data
  const sectionPieData = useMemo(() => {
    return sectionStats.map((s, idx) => ({
      name: s.name,
      value: s['عدد الطالبات'],
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [sectionStats]);

  // Grade Pie Chart Data
  const gradePieData = useMemo(() => {
    return gradeStats.map((g, idx) => ({
      name: g.name,
      value: g['عدد الطالبات'],
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [gradeStats]);

  // Question Difficulty & Accuracy Analysis
  const questionAnalysis = useMemo(() => {
    return questions.map((q, idx) => {
      let correctCount = 0;
      let totalAnswered = 0;
      let totalTimeSpent = 0;

      participations.forEach((p) => {
        const studentAns = p.userAnswers?.[q.id];
        if (studentAns !== undefined && studentAns !== null && studentAns >= 0) {
          totalAnswered += 1;
          if (studentAns === q.correctOptionIndex) {
            correctCount += 1;
          }
        }
        if (p.questionTimeSpent?.[q.id]) {
          totalTimeSpent += p.questionTimeSpent[q.id];
        }
      });

      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const avgTime = totalAnswered > 0 ? Math.round(totalTimeSpent / totalAnswered) : 0;

      return {
        questionNumber: idx + 1,
        question: q,
        correctCount,
        totalAnswered,
        accuracy,
        avgTime,
      };
    });
  }, [questions, participations]);

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return '-';
    if (seconds < 60) return `${seconds}ث`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}د ${secs > 0 ? `${secs}ث` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-arabic">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-amber-300 shadow-md">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  لوحة تحليلات وإحصائيات التحدي ومقارنة الشعب
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مادة: {challenge.subject}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                {challenge.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  المدرس المنشئ: {challenge.createdByTeacherName || 'إدارة المدرسة'}
                </span>
                <span>•</span>
                <span>الدرجة الكلية: {totalPossiblePoints} نقطة</span>
                <span>•</span>
                <span>الأسئلة: {questions.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Challenge Switcher if multiple challenges exist */}
            {allChallenges.length > 1 && onSelectAnotherChallenge && (
              <div className="relative">
                <select
                  value={challenge.id}
                  onChange={(e) => {
                    const target = allChallenges.find((c) => c.id === e.target.value);
                    if (target) onSelectAnotherChallenge(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold focus:outline-none"
                >
                  {allChallenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
              title="طباعة التقرير والإحصائيات"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900 text-white flex items-center gap-2 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'analytics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>📊 الرسوم البيانية ومقارنة الصفوف والشعب</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'students'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📋 تفاصيل وإجابات الطالبات ({filteredParticipations.length})</span>
          </button>

          {canViewQuestions && (
            <button
              onClick={() => setActiveTab('questions')}
              className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'questions'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>🎯 تحليل صعوبة ودقة الأسئلة ({questions.length})</span>
            </button>
          )}
        </div>

        {/* Main Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>إجمالي المختبرات</span>
              </div>
              <div className="font-black font-mono text-2xl text-slate-900">
                {totalCount} <span className="text-xs font-arabic font-normal text-slate-500">طالبة</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                {availableSections.length} شعب مشاركة
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>متوسط الدرجات</span>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="font-black text-2xl text-slate-900">{avgScore}</span>
                <span className="text-xs text-slate-400">/ {totalPossiblePoints}</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5 font-mono">
                معدل {avgPercentage}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
                <span>نسبة النجاح والتفوق</span>
              </div>
              <div className="font-black font-mono text-2xl text-emerald-700">
                {passRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                {passedCount} طالبة تجاوزت 50%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>متوسط زمن الإجابة</span>
              </div>
              <div className="font-black font-mono text-2xl text-slate-900">
                {avgTimeSeconds} <span className="text-xs font-arabic font-normal text-slate-500">ثانية</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                {formatTime(avgTimeSeconds)} إجمالي
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-bold mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>المتصدرة الأولى 🥇</span>
              </div>
              {topWinner ? (
                <div>
                  <div className="font-black text-xs sm:text-sm text-slate-950 truncate">
                    {topWinner.studentName}
                  </div>
                  <div className="text-[11px] font-bold text-amber-900 font-mono mt-0.5">
                    {topWinner.score} نقطة ({topWinner.timeSpentSeconds}ث)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-bold">-</div>
              )}
            </div>
          </div>

          {/* TAB 1: VISUAL CHARTS & COMPARISONS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Section vs Section Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Bar Chart: Section Performance Comparison */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>مقارنة متوسط الدرجات والأداء بين الشعب:</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        مقارنة حية لمتوسط درجات الطالبات وسرعة الإجابة بين الشعب
                      </p>
                    </div>
                  </div>

                  {sectionStats.length > 0 ? (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectionStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, Math.max(totalPossiblePoints, 100)]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              direction: 'rtl',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar dataKey="متوسط الدرجة" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="الدرجة القصوى" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                      لا توجد بيانات كافية لعرض المقارنة بعد.
                    </div>
                  )}
                </div>

                {/* 2. Interactive Pie Chart */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-emerald-600" />
                        <span>الرسم التوضيحي (Pie Chart):</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        توزيع الطالبات بحسب الشعب ومستويات التميز
                      </p>
                    </div>

                    {/* Switch Mode Pill */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                      <button
                        onClick={() => setPieMode('sections')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          pieMode === 'sections' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-slate-600'
                        }`}
                      >
                        الشعب
                      </button>
                      <button
                        onClick={() => setPieMode('performance')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          pieMode === 'performance' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600'
                        }`}
                      >
                        مستويات الأداء
                      </button>
                      {availableGrades.length > 1 && (
                        <button
                          onClick={() => setPieMode('grades')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            pieMode === 'grades' ? 'bg-white text-purple-700 shadow-xs font-black' : 'text-slate-600'
                          }`}
                        >
                          الصفوف
                        </button>
                      )}
                    </div>
                  </div>

                  {participations.length > 0 ? (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              pieMode === 'sections'
                                ? sectionPieData
                                : pieMode === 'performance'
                                ? performanceTiers
                                : gradePieData
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(pieMode === 'sections'
                              ? sectionPieData
                              : pieMode === 'performance'
                              ? performanceTiers
                              : gradePieData
                            ).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              direction: 'rtl',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                      لا توجد مشاركات مسجلة بعد.
                    </div>
                  )}
                </div>
              </div>

              {/* Section Breakdown Cards */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>تفاصيل المعدلات التفاضلية بحسب الشعب:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {sectionStats.map((sec, idx) => (
                    <div
                      key={sec.name}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {sec.name}
                        </span>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                          {sec['عدد الطالبات']} طالبة
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>متوسط الدرجات:</span>
                          <span className="font-mono font-black text-indigo-700">
                            {sec['متوسط الدرجة']} / {totalPossiblePoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>متوسط السرعة (الزمن):</span>
                          <span className="font-mono font-bold text-slate-800">
                            {sec['متوسط الزمن (ثانية)']} ثانية
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>أعلى درجة محققة في الشعبة:</span>
                          <span className="font-mono font-black text-emerald-700">
                            {sec['الدرجة القصوى']} نقطة
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED STUDENTS LIST & PARTICIPATIONS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="بحث باسم الطالبة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedSectionFilter}
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="الكل">جميع الشعب</option>
                      {availableSections.map((sec) => (
                        <option key={sec} value={sec}>
                          شعبة {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {availableGrades.length > 1 && (
                    <select
                      value={selectedGradeFilter}
                      onChange={(e) => setSelectedGradeFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="الكل">جميع الصفوف</option>
                      {availableGrades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    عرض ({filteredParticipations.length}) من ({participations.length}) طالبة
                  </span>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b border-slate-800">
                        <th className="py-3.5 px-4 font-bold text-center">المركز</th>
                        <th className="py-3.5 px-4 font-bold">اسم الطالبة</th>
                        <th className="py-3.5 px-4 font-bold">الصف والشعبة</th>
                        <th className="py-3.5 px-4 font-bold text-center">الدرجة والنسبة</th>
                        <th className="py-3.5 px-4 font-bold text-center">الوقت المستغرق</th>
                        <th className="py-3.5 px-4 font-bold text-center">دقة الإجابات</th>
                        <th className="py-3.5 px-4 font-bold text-center">الوسام / الحالة</th>
                        <th className="py-3.5 px-4 font-bold text-center">ورقة الإجابة والتفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredParticipations.length > 0 ? (
                        filteredParticipations.map((p) => {
                          const totalCorrect = p.answersCount?.correct ?? '-';
                          return (
                            <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900">
                                {p.rank ? (
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                      p.rank === 1
                                        ? 'bg-amber-400 text-slate-950 font-black'
                                        : p.rank === 2
                                        ? 'bg-slate-200 text-slate-900 font-bold'
                                        : p.rank === 3
                                        ? 'bg-amber-100 text-amber-900 font-bold'
                                        : 'text-slate-500 font-bold'
                                    }`}
                                  >
                                    #{p.rank}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>

                              <td className="py-3.5 px-4 font-black text-slate-900">
                                {p.studentName}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="text-slate-800 font-bold text-xs">{p.gradeLevel}</div>
                                <div className="text-[11px] font-bold text-indigo-700 font-mono mt-0.5">
                                  شعبة ({p.section || 'أ'})
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs font-mono">
                                  <span className="font-black text-sm text-slate-950">
                                    {p.score}
                                  </span>
                                  <span className="text-xs text-slate-400 font-medium">
                                    / {totalPossiblePoints}
                                  </span>
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 mr-0.5">
                                    {p.percentage || Math.round((p.score / totalPossiblePoints) * 100)}%
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                  {formatTime(p.timeSpentSeconds)}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="font-mono font-bold text-xs text-slate-800">
                                  {totalCorrect} / {questions.length}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    p.status.includes('الأول')
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                      : p.status.includes('الثاني')
                                      ? 'bg-slate-100 text-slate-800 border-slate-300 font-black'
                                      : p.status.includes('الثالث')
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => setInspectedParticipation(p)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 mx-auto transition-all transform hover:scale-105"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>كشف الإجابات والزمن</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                            لا توجد طالبات مطابقة لمعايير البحث والتصفية.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUESTION-BY-QUESTION ACCURACY & DIFFICULTY MATRIX */}
          {activeTab === 'questions' && (
            canViewQuestions ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>تحليل استجابات الأسئلة ومعدل الصعوبة والزمن ({questions.length} أسئلة):</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      يوضح نسبة الإجابات الصحيحة والخاطئة ومتوسط الزمن المستغرق لكل سؤال من قبل جميع الطالبات
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionAnalysis.map((item) => (
                    <div
                      key={item.question.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-black text-xs flex items-center justify-center">
                            {item.questionNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-800">
                            السؤال رقم {item.questionNumber}
                          </span>
                          {item.question.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {item.question.category}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                          {item.question.points || 25} درجة
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 leading-relaxed line-clamp-2">
                        {item.question.questionText}
                      </div>

                      {/* Accuracy Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">نسبة الإجابة الصحيحة:</span>
                          <span className="font-mono font-black text-emerald-700">
                            {item.accuracy}% ({item.correctCount} من {item.totalAnswered} طالبة)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>متوسط زمن السؤال: <strong className="text-slate-900">{item.avgTime}ث</strong></span>
                        <span>الحد الأقصى: <strong className="text-slate-900">{challenge.timeLimitPerQuestionSeconds}ث</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-amber-200/90 shadow-md text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl">
                  🔒
                </div>
                <h3 className="text-base font-black text-slate-900">
                  بنك الأسئلة والتحليل التفصيلي محجوب
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  وفقاً لضوابط المنظومة، لا يحق للمشرفين التربويين أو الزملاء في الهيئة التدريسية الاطلاع على بنك الأسئلة أو تفاصيل الاستجابات الدقيقة الخاصة بتحدي لمدرس آخر.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            نظام رصد وتحليلات الألعاب والتحديات • ثانوية ميسان للمتميزات
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>

      {/* Sub-modal: Inspect Specific Student Attempt */}
      {inspectedParticipation && (
        <StudentChallengeAttemptDetailsModal
          challenge={challenge}
          participation={inspectedParticipation}
          onClose={() => setInspectedParticipation(null)}
          isStaff={true}
          canViewQuestions={canViewQuestions}
          onUpdateTeacherNotes={(notes) => {
            if (onUpdateParticipation) {
              onUpdateParticipation(challenge.id, inspectedParticipation.id, {
                teacherNotes: notes,
              });
            }
            setInspectedParticipation((prev) => (prev ? { ...prev, teacherNotes: notes } : null));
          }}
        />
      )}
    </div>
  );
};
