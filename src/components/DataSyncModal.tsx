/**
 * Central Data Synchronization Modal for All Users
 * نافذة إدارة ومراقبة المزامنة المركزية الموحدة لجميع المستخدمين
 * ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { centralSyncService } from '../services/syncService';
import {
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Server,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Award,
  MessageSquare,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  X,
  Zap,
  Activity,
  HardDrive,
} from 'lucide-react';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    role,
    currentUser,
    syncStatus,
    syncVersion,
    lastSyncedAt,
    lastSyncedBy,
    forceSyncAll,
    resetCentralDatabase,
    teachers,
    students,
    parents,
    certificates,
    exams,
    submissions,
    attendance,
    messages,
    announcements,
    lectures,
    challenges,
    annualPlans,
    dailyLessonPlans,
    examSchedules,
    timetable,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load server statistics on modal open
  useEffect(() => {
    if (!isOpen) return;
    loadStats();
  }, [isOpen]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await centralSyncService.getServerStatus();
      setServerStats(stats);
    } catch {
      // ignore
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);
    try {
      const ok = await forceSyncAll();
      if (ok) {
        setSyncSuccessMsg('تمت مزامنة جميع البيانات بنجاح مع الخادم المركزي ولكافة المستخدمين!');
        await loadStats();
      } else {
        setSyncErrorMsg('حدث تأخير أو تعذر في الاتصال بالخادم. يرجى إعادة المحاولة.');
      }
    } catch (err: any) {
      setSyncErrorMsg(err.message || 'فشلت المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const exportData = {
        meta: {
          exportedAt: new Date().toISOString(),
          version: syncVersion,
          school: 'ثانوية ميسان للمتميزات',
          exportedBy: currentUser?.name || role,
        },
        teachers,
        students,
        parents,
        certificates,
        exams,
        submissions,
        attendance,
        messages,
        announcements,
        lectures,
        challenges,
        annualPlans,
        dailyLessonPlans,
        examSchedules,
        timetable,
      };

      const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonStr);
      downloadAnchor.setAttribute(
        'download',
        `maysan_school_backup_v${syncVersion}_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSyncSuccessMsg('تم تصدير نسخة احتياطية موحدة وشاملة بنجاح.');
    } catch (e: any) {
      setSyncErrorMsg('فشل تصدير النسخة الاحتياطية: ' + e.message);
    }
  };

  const handleResetDatabase = async () => {
    setIsSyncing(true);
    try {
      const ok = await resetCentralDatabase();
      if (ok) {
        setSyncSuccessMsg('تمت إعادة ضبط قاعدة البيانات المركزية إلى الإعدادات الرسمية المعتمدة.');
        setShowResetConfirm(false);
        await loadStats();
      } else {
        setSyncErrorMsg('فشلت عملية إعادة التعيين.');
      }
    } catch (e: any) {
      setSyncErrorMsg(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const isAdmin = role === 'admin' || currentUser?.role === 'admin' || currentUser?.isDirectress;

  const entityBreakdown = [
    { label: 'الطالبات المتميزات', count: students.length, icon: Users, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
    { label: 'الكادر التدريسي', count: teachers.length, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
    { label: 'أولياء الأمور', count: parents.length, icon: ShieldCheck, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200' },
    { label: 'الشهادات المعتمدة', count: certificates.length, icon: Award, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
    { label: 'سجلات الحضور', count: attendance.length, icon: Clock, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
    { label: 'الامتحانات الإلكترونية', count: exams.length, icon: FileSpreadsheet, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
    { label: 'إجابات ومشاركات الطالبات', count: submissions.length, icon: CheckCircle2, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200' },
    { label: 'الرسائل والمراسلات', count: messages.length, icon: MessageSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
    { label: 'الخطط السنوية واليومية', count: annualPlans.length + dailyLessonPlans.length, icon: BookOpen, color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200' },
    { label: 'المكتبة والكتب المنهجية', count: lectures.length, icon: HardDrive, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200' },
    { label: 'التحديات العلمية والأسئلة', count: challenges.length, icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
    { label: 'جدول الحصص والامتحانات', count: timetable.length + examSchedules.length, icon: Calendar, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 text-right font-arabic relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>مزامنة وتوحيد البيانات لجميع المستخدمين</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                إصدار #{syncVersion}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                Firebase Realtime Sync
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              منظومة المزامنة الشاملة: أي إضافة أو حذف أو تعديل من المديرة والإدارة يُنفّذ فوراً لدى كافة المدرسات والطالبات وأولياء الأمور
            </p>
          </div>
        </div>

        {/* Real-time Admin Master Authority Banner */}
        <div className="p-3.5 mb-5 rounded-2xl bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="font-bold text-indigo-700 dark:text-indigo-400">سيادة قرارات الإدارة والمديرة العامة: </span>
            تتمتع عمليات الإدارة (إضافة كادر، تعديل طالبات، نشر جداول، رصد قرارات، أو حذف سجلات) بـ <strong>أولوية تنفيذ عليا وقاطعة</strong>، حيث تُبث التحديثات فوراً عبر قنوات البث الحي Server-Sent Events لتنعكس على شاشات كافة المستخدمين لحظياً وبدون أي تأخير.
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          syncStatus === 'synced'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : syncStatus === 'syncing'
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              syncStatus === 'synced'
                ? 'bg-emerald-600 text-white'
                : syncStatus === 'syncing'
                ? 'bg-indigo-600 text-white'
                : 'bg-amber-600 text-white'
            }`}>
              {syncStatus === 'synced' && <CheckCircle2 className="w-5 h-5" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
              {syncStatus !== 'synced' && syncStatus !== 'syncing' && <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-2">
                <span>
                  {syncStatus === 'synced'
                    ? 'البيانات متزامنة بالكامل مع الخادم المركزي'
                    : syncStatus === 'syncing'
                    ? 'جارِ رفع وتنزيل التحديثات لجميع المستخدمين...'
                    : 'حالة الحفظ المحلي (انقطاع الاتصال المؤقت)'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="text-xs opacity-80 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  آخر مزامنة:{' '}
                  {lastSyncedAt
                    ? new Date(lastSyncedAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'منذ قليل'}
                </span>
                {lastSyncedBy?.name && (
                  <span>
                    بواسطة: <strong>{lastSyncedBy.name}</strong> ({lastSyncedBy.role})
                  </span>
                )}
                {serverStats?.latencyMs !== undefined && (
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    استجابة الخادم: {serverStats.latencyMs} مللي ثانية
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة شاملة الآن ⚡'}</span>
          </button>
        </div>

        {/* Notifications / Alerts */}
        {syncSuccessMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}
        {syncErrorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{syncErrorMsg}</span>
          </div>
        )}

        {/* Synchronized Entities Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>السجلات المتزامنة لحظياً عبر كافة البوابات:</span>
            <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Server className="w-3 h-3" />
              الخادم المركزي المشترك
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {entityBreakdown.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {item.count}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles Synchronization Architecture */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-6">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>قنوات المزامنة المتعددة للأدوار:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">👑 الإدارة والمديرة</div>
              <div>نشر الإعلانات، اعتماد الشهادات، جداول الامتحانات، ومراقبة الحضور لحظياً.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">👩‍🏫 الهيئة التدريسية</div>
              <div>رصد الدرجات، تسجيل الغياب، إرسال الواجبات والتحديات، ومشاركة الملازم.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <div className="font-bold text-rose-600 dark:text-rose-400 mb-1">🎓 الطالبات وأولياء الأمور</div>
              <div>استلام الإشعارات، حل الامتحانات، استعراض الشهادات، ومراسلة الإدارة.</div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="تصدير ملف JSON يحتوي كافة بيانات المدرسة"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>تصدير نسخة احتياطية</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط المصنع</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

        {/* Admin Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-6 max-w-md w-full text-right font-arabic shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-2">
                تأكيد إعادة تعيين قاعدة البيانات المركزية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                هل أنتِ متأكدة من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية الرسمية المعتمدة للمدرسة؟ ستتم مزامنة هذا الإجراء لجميع المستخدمين.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetDatabase}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isSyncing ? 'جارِ التعيين...' : 'نعم، إعادة التعيين'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
