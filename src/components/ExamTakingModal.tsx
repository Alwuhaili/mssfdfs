/**
 * Interactive Online Exam Engine with Anti-Cheat & Auto-Grading
 * مدرسة ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Exam, Question } from '../types';
import { fireConfetti } from '../utils/confetti';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Maximize2,
  Minimize2,
  Send,
  Award,
  Sparkles,
  HelpCircle,
  Lock,
} from 'lucide-react';

export const ExamTakingModal: React.FC<{
  exam: Exam;
  onClose: () => void;
}> = ({ exam, onClose }) => {
  const { currentUser, students, submitExam, lang, t } = useApp();

  // Active student object derived dynamically from logged-in user
  const activeStudent =
    students.find(
      (s) =>
        (currentUser?.id && s.id === currentUser.id) ||
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && (s.phone === currentUser.phone || s.parentPhone === currentUser.phone)) ||
        (currentUser?.name && s.name.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser?.studentObj?.id && s.id === currentUser.studentObj.id)
    ) || students[0] || {
      id: 'std-1',
      name: 'نغم علي الكعبي',
      gradeLevel: 'الصف السادس العلمي',
    };

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Anti-Cheat: Detect Tab Switch or Window Blur
  useEffect(() => {
    if (isSubmitted || !exam.antiCheat.enableTabSwitchDetection) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationsCount((c) => {
          const newCount = c + 1;
          setShowViolationBanner(true);
          setTimeout(() => setShowViolationBanner(false), 4000);
          return newCount;
        });
      }
    };

    const handleBlur = () => {
      setViolationsCount((c) => {
        const newCount = c + 1;
        setShowViolationBanner(true);
        setTimeout(() => setShowViolationBanner(false), 4000);
        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSubmitted, exam.antiCheat]);

  // Prevent Copy / Paste / Context Menu if enabled
  useEffect(() => {
    if (isSubmitted || !exam.antiCheat.disableCopyPaste) return;

    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('contextmenu', preventDefault);

    return () => {
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, [isSubmitted, exam.antiCheat]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const handleSelectOption = (questionId: string, answer: string | number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const calculateScore = () => {
    let earned = 0;
    let total = 0;

    exam.questions.forEach((q) => {
      total += q.points;
      const uAns = userAnswers[q.id];
      if (uAns !== undefined && uAns !== null) {
        if (typeof q.correctAnswer === 'number' && Number(uAns) === q.correctAnswer) {
          earned += q.points;
        } else if (
          typeof q.correctAnswer === 'string' &&
          String(uAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
        ) {
          earned += q.points;
        }
      }
    });

    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { earned, total, pct };
  };

  const handleAutoSubmit = () => {
    if (isSubmitted) return;
    const { earned, total, pct } = calculateScore();
    setIsSubmitted(true);
    setFinalResult({ score: earned, total, percentage: pct });

    // Submit to central state
    submitExam({
      examId: exam.id,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      gradeLevel: exam.gradeLevel,
      score: earned,
      totalPoints: total,
      percentage: pct,
      timeTakenMinutes: Math.max(1, Math.round((exam.durationMinutes * 60 - timeLeftSeconds) / 60)),
      cheatViolationsCount: violationsCount,
      answers: userAnswers,
      status: 'تم التصحيح تلقائياً',
    });

    if (pct >= 85) {
      fireConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = exam.questions[currentQuestionIdx];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 font-arabic select-none overflow-y-auto"
    >
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col min-h-[80vh] overflow-hidden">
        
        {/* Anti-Cheat Violation Banner Popup */}
        {showViolationBanner && (
          <div className="bg-rose-600 text-white px-6 py-3 font-bold text-xs sm:text-sm flex items-center justify-between animate-bounce shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
              <span>
                {lang === 'ar'
                  ? `🚨 تحذير لمنع الغش: تم كشف مغادرة صفحة الامتحان! (إجمالي التنبيهات: ${violationsCount})`
                  : `🚨 Anti-cheat Alert: Tab switch detected! (Total: ${violationsCount})`}
              </span>
            </div>
            <span className="text-[10px] bg-rose-950 px-2 py-1 rounded">
              {lang === 'ar' ? 'تم تسجيل المخالفة للإدارة' : 'Logged'}
            </span>
          </div>
        )}

        {/* Exam Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border-b border-indigo-800/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  {exam.subject}
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {exam.gradeLevel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">{exam.title}</h3>
            </div>
          </div>

          {/* Controls & Timer */}
          {!isSubmitted && (
            <div className="flex items-center gap-3">
              {/* Violations Counter */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  violationsCount > 0
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {lang === 'ar' ? `تنبيهات الغش: ${violationsCount}` : `Warnings: ${violationsCount}`}
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-950 border border-indigo-500/40 text-amber-300 font-mono font-bold text-sm shadow-inner">
                <Clock className="w-4 h-4 animate-spin text-amber-400" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              {/* Fullscreen Enforcer Button */}
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title={lang === 'ar' ? 'ملء الشاشة لمنع التشتت' : 'Toggle Fullscreen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          
          {isSubmitted && finalResult ? (
            /* Results Screen */
            <div className="py-8 px-4 max-w-xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-600 text-indigo-950 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/40">
                <Award className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  {t.examCompleted}
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  {t.autoGraded}
                </p>
              </div>

              <div className="p-6 bg-slate-800/80 rounded-3xl border border-indigo-500/30 space-y-4">
                <div className="text-sm font-bold text-slate-300">{t.yourScore}</div>
                <div className="text-5xl font-black text-amber-300 font-mono">
                  {finalResult.score} <span className="text-2xl text-slate-400">/ {finalResult.total}</span>
                </div>
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-600/40 text-indigo-200 border border-indigo-500/40">
                  {lang === 'ar' ? `النسبة المئوية: ${finalResult.percentage}%` : `Score: ${finalResult.percentage}%`}
                </div>

                <div className="pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                  <span>{t.cheatViolationsDetected}</span>
                  <span className={`font-bold ${violationsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {violationsCount}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-indigo-950 font-bold text-sm shadow-xl shadow-amber-500/20"
              >
                {lang === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
              </button>
            </div>
          ) : (
            /* Active Question Screen */
            <div className="space-y-6">
              
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <span className="font-bold text-amber-300">
                  {lang === 'ar'
                    ? `السؤال ${currentQuestionIdx + 1} من أصل ${exam.questions.length}`
                    : `Question ${currentQuestionIdx + 1} of ${exam.questions.length}`}
                </span>
                <span className="text-slate-400">
                  {lang === 'ar' ? `الدرجة المستحقة: ${currentQ.points} درجة` : `Points: ${currentQ.points}`}
                </span>
              </div>

              {/* Question Text */}
              <div className="p-5 bg-slate-800/80 rounded-2xl border border-indigo-500/30 text-white font-medium text-base sm:text-lg leading-relaxed">
                {currentQ.text}
              </div>

              {/* Options */}
              {currentQ.type === 'mcq' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, idx)}
                        className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center gap-3 text-sm font-medium ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-amber-400 ring-2 ring-amber-400/50 font-bold shadow-lg'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-amber-400 text-indigo-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'true_false' && currentQ.options && (
                <div className="grid grid-cols-2 gap-4">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, idx)}
                        className={`p-5 rounded-2xl border text-center font-bold text-base transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'short_answer' && (
                <div>
                  <textarea
                    rows={3}
                    placeholder={lang === 'ar' ? 'اكتبي إجابتك هنا...' : 'Type answer here...'}
                    value={String(userAnswers[currentQ.id] || '')}
                    onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

              {/* Navigation Footer */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                >
                  {lang === 'ar' ? 'السؤال السابق' : 'Previous'}
                </button>

                <div className="flex items-center gap-1.5">
                  {exam.questions.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentQuestionIdx(i)}
                      className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                        currentQuestionIdx === i
                          ? 'bg-amber-400 ring-2 ring-amber-400/50'
                          : userAnswers[exam.questions[i].id] !== undefined
                          ? 'bg-indigo-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {currentQuestionIdx < exam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx((i) => i + 1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  >
                    {lang === 'ar' ? 'السؤال التالي' : 'Next Question'}
                  </button>
                ) : (
                  <button
                    onClick={handleAutoSubmit}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إنهاء وتسليم الامتحان' : 'Submit Exam'}</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
