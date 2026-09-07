import React, { useState } from 'react';
import {
  X,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Printer,
  Save,
  MessageSquare,
  Flame,
  Check,
  AlertCircle,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { ChallengeParticipation, InteractiveChallenge } from '../types';

interface StudentChallengeAttemptDetailsModalProps {
  challenge: InteractiveChallenge;
  participation: ChallengeParticipation;
  onClose: () => void;
  onUpdateTeacherNotes?: (notes: string) => void;
  isStaff?: boolean;
  canViewQuestions?: boolean;
}

export const StudentChallengeAttemptDetailsModal: React.FC<StudentChallengeAttemptDetailsModalProps> = ({
  challenge,
  participation,
  onClose,
  onUpdateTeacherNotes,
  isStaff = false,
  canViewQuestions = true,
}) => {
  const [teacherNotes, setTeacherNotes] = useState(participation.teacherNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const questions = challenge.questions || [];
  const userAnswers = participation.userAnswers || {};
  const questionTimeSpent = participation.questionTimeSpent || {};

  const totalPossiblePoints =
    questions.length > 0
      ? questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
      : challenge.totalPoints || 100;

  const handleSaveNotes = () => {
    if (!onUpdateTeacherNotes) return;
    setIsSavingNotes(true);
    onUpdateTeacherNotes(teacherNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 300);
  };

  const handlePrint = () => {
    window.print();
  };

  // Format seconds into Arabic readable duration
  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return '-';
    if (seconds < 60) return `${seconds} ثانية`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة ${secs > 0 ? `و ${secs} ثانية` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-arabic">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-amber-300 shadow-md">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  كشف إجابات ورصد درجات الطالبة بالتفصيل
                </span>
                {participation.rank && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono shadow-xs">
                    المركز #{participation.rank}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
                <span>{participation.studentName}</span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                تحدي: {challenge.title} • مادة: {challenge.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
              title="طباعة بطاقة إجابة الطالبة"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">طباعة الكشف</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Student Info Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>المرحلة والشعبة</span>
              </div>
              <div className="font-black text-slate-900 text-xs sm:text-sm">
                {participation.gradeLevel}
              </div>
              <div className="text-[11px] font-bold text-indigo-700 mt-0.5 font-mono">
                الشعبة: ({participation.section || 'أ'})
              </div>
            </div>

            {/* Total Score Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>الدرجة الكلية المحققة</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-black text-xl text-slate-950">
                    {participation.score}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {totalPossiblePoints}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                  {participation.percentage || Math.round((participation.score / totalPossiblePoints) * 100)}%
                </span>
              </div>
            </div>

            {/* Total Time Spent */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>الوقت الإجمالي المستغرق</span>
              </div>
              <div className="font-mono font-black text-base text-slate-900">
                {formatTime(participation.timeSpentSeconds)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                معدل {questions.length > 0 ? Math.round(participation.timeSpentSeconds / questions.length) : 0} ث/سؤال
              </div>
            </div>

            {/* Accuracy & Status */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>دقة الإجابات والحالة</span>
              </div>
              <div className="font-bold text-xs text-slate-900">
                {participation.answersCount?.correct ?? '-'} من أصل {questions.length} صحيحة
              </div>
              <div className="text-[11px] font-bold text-amber-700 truncate mt-0.5">
                {participation.status}
              </div>
            </div>
          </div>

          {/* Awarded Badge Banner if any */}
          {participation.awardedBadge && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border border-amber-300/80 flex items-center justify-between gap-3 text-amber-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-amber-800 font-bold block">الوسام الأكاديمي الممنوح للطالبة:</span>
                  <span className="font-black text-xs sm:text-sm text-amber-950">
                    {participation.awardedBadge}
                  </span>
                </div>
              </div>
              {participation.completedAt && (
                <span className="text-[11px] text-amber-800 font-mono font-bold shrink-0 bg-white/70 px-2.5 py-1 rounded-xl border border-amber-200">
                  تاريخ الإنجاز: {participation.completedAt}
                </span>
              )}
            </div>
          )}

          {/* Section: Question-by-Question Detailed Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>تفاصيل إجابات الطالبة بالسؤال والزمن والدرجة ({questions.length} أسئلة):</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                الحد الأقصى لكل سؤال: {challenge.timeLimitPerQuestionSeconds} ثانية
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const selectedOptIndex = userAnswers[q.id];
                const hasAnswered = selectedOptIndex !== undefined && selectedOptIndex !== null && selectedOptIndex >= 0;
                const isCorrect = hasAnswered && selectedOptIndex === q.correctOptionIndex;
                const earnedPoints = isCorrect ? (Number(q.points) || 25) : 0;
                const timeSpent = questionTimeSpent[q.id] || Math.round(participation.timeSpentSeconds / (questions.length || 1));

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all p-4 sm:p-5 bg-white shadow-xs space-y-3.5 ${
                      !hasAnswered
                        ? 'border-amber-200/90 bg-amber-50/20'
                        : isCorrect
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : 'border-rose-200 bg-rose-50/15'
                    }`}
                  >
                    {/* Top Question Meta Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-800">
                          السؤال {idx + 1}
                        </span>
                        {q.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {q.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : q.difficulty === 'hard'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {q.difficulty === 'easy'
                            ? 'مستوى سهل'
                            : q.difficulty === 'medium'
                            ? 'مستوى متوسط'
                            : q.difficulty === 'hard'
                            ? 'مستوى متقدم'
                            : 'مستوى عباقرة'}
                        </span>
                      </div>

                      {/* Question Points & Time Badges */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span>الزمن: {timeSpent}ث</span>
                        </span>

                        <span
                          className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>
                            {earnedPoints} / {q.points || 25} درجة
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Question Text & Content / Privacy Shield */}
                    {canViewQuestions ? (
                      <>
                        {/* Question Text */}
                        <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                          {q.questionText}
                        </div>

                        {/* Options List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isThisOptionChosenByStudent = selectedOptIndex === optIdx;
                            const isThisOptionCorrect = optIdx === q.correctOptionIndex;

                            let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                            let badge = null;

                            if (isThisOptionChosenByStudent && isThisOptionCorrect) {
                              cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs';
                              badge = (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  إجابة الطالبة (صحيحة)
                                </span>
                              );
                            } else if (isThisOptionChosenByStudent && !isThisOptionCorrect) {
                              cardStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs';
                              badge = (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-0.5">
                                  <X className="w-3 h-3" />
                                  إجابة الطالبة (خاطئة)
                                </span>
                              );
                            } else if (isThisOptionCorrect) {
                              cardStyle = 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold';
                              badge = (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  الإجابة النموذجية الصحيحة
                                </span>
                              );
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${cardStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {optIdx + 1}
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </div>
                                {badge}
                              </div>
                            );
                          })}
                        </div>

                        {!hasAnswered && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>لم تقم الطالبة باختيار أي خيار في هذا السؤال (انتهى وقت الإجابة).</span>
                          </div>
                        )}

                        {/* Explanation and Hint Footer */}
                        {q.explanation && (
                          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs space-y-1">
                            <span className="font-bold flex items-center gap-1 text-[11px] text-indigo-700">
                              <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                              التفسير والشرح العلمي المنهجي:
                            </span>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 text-slate-600">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          نص السؤال وبنك الخيارات والحلول النموذجية محجوبة (مقتصرة على الأستاذ(ة) المنشئ(ة) للتحدي فقط).
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher Guidance / Notes Section */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>توجيه وملاحظات المدرس/المدرسة للطالبة:</span>
              </h3>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  تم حفظ الملاحظات بنجاح
                </span>
              )}
            </div>

            {isStaff ? (
              <div className="space-y-2">
                <textarea
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="اكتب توجيهاتك للطالبة، نقاط القوة، والمفاهيم الموصى بمراجعتها لتعزيز تفوقها..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-800 focus:outline-none focus:border-indigo-500 min-h-[90px]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'جارٍ الحفظ...' : 'حفظ توجيهات المدرس'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                {participation.teacherNotes || 'لا توجد ملاحظات مسجلة من المدرس بعد.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            نظام رصد وتقييم التحديات التفاعلية • ثانوية ميسان للمتميزات
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
