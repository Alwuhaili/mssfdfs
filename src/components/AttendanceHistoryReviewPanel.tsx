import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_GRADES_LIST, GradeLevel, AttendanceRecord, Student } from '../types';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Edit3,
  Trash2,
  Printer,
  Download,
  Plus,
  RotateCcw,
  Check,
  AlertTriangle,
  FileText,
  UserCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Info,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Square,
  AlertOctagon,
} from 'lucide-react';

interface AttendanceHistoryReviewPanelProps {
  initialGradeFilter?: string;
  initialSectionFilter?: string;
  initialStudentFilter?: string;
  teacherModeOnly?: boolean;
}

export const AttendanceHistoryReviewPanel: React.FC<AttendanceHistoryReviewPanelProps> = ({
  initialGradeFilter = 'all',
  initialSectionFilter = 'all',
  initialStudentFilter = '',
  teacherModeOnly = false,
}) => {
  const {
    attendance,
    students,
    teachers,
    currentUser,
    role,
    updateAttendanceRecord,
    batchUpdateAttendanceRecords,
    deleteAttendanceRecord,
    deleteAttendanceRecordsForSession,
    recalculateStudentAbsenceStats,
    canUndoAttendance,
    undoAccidentalAbsence,
    batchUndoAccidentalAbsences,
    undoStudentAbsenceDays,
    schoolAdminData,
    lang,
  } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialStudentFilter);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGradeFilter);
  const [selectedSection, setSelectedSection] = useState<string>(initialSectionFilter);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [onlyModified, setOnlyModified] = useState(false);
  const [viewMode, setViewMode] = useState<'sessions' | 'table'>('sessions');

  // Multi-selection for bulk deletion and batch operations
  const [selectedRecordIds, setSelectedRecordIds] = useState<Record<string, boolean>>({});

  // Expanded Sessions in Accordion
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  // Modal States
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'>('حاضرة');
  const [editReason, setEditReason] = useState('تصحيح إداري معتمد وتدقيق من المدرسة');
  const [editNotifyParent, setEditNotifyParent] = useState(true);

  // Batch Edit Session Modal
  const [batchSessionData, setBatchSessionData] = useState<{
    sessionKey: string;
    date: string;
    gradeLevel: GradeLevel;
    section: string;
    subject: string;
    teacher: string;
    records: AttendanceRecord[];
  } | null>(null);
  const [batchChanges, setBatchChanges] = useState<
    Record<string, { status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'; notes: string }>
  >({});
  const [batchReason, setBatchReason] = useState('مراجعة وتدقيق سجلات الشعبة من قبل الإدارة');
  const [batchNotifyParents, setBatchNotifyParents] = useState(false);

  // Add Past Record Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecStudentId, setNewRecStudentId] = useState('');
  const [newRecDate, setNewRecDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRecSubject, setNewRecSubject] = useState('الفيزياء المتقدمة');
  const [newRecStatus, setNewRecStatus] = useState<'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'>('غائبة');
  const [newRecNotes, setNewRecNotes] = useState('تسجيل غياب سابق بأثر رجعي');

  // Print Official Report Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // In-App Deletion Confirmation Modal State (replaces blocking window.confirm)
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    type: 'single' | 'session' | 'batch_selected';
    record?: AttendanceRecord;
    session?: {
      sessionKey: string;
      date: string;
      gradeLevel: GradeLevel;
      section: string;
      subject: string;
      teacher: string;
      recordsCount: number;
    };
    selectedCount?: number;
  } | null>(null);

  // Dedicated In-App Undo Mistaken Absence Modal State (التراجع عن الغياب المسجل سهواً)
  const [undoModalData, setUndoModalData] = useState<{
    type: 'single' | 'batch';
    record?: AttendanceRecord;
    records?: AttendanceRecord[];
    sessionTitle?: string;
    reason: string;
    actionType: 'mark_present' | 'delete_record';
    notifyParent: boolean;
  } | null>(null);

  // Success Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Get current teacher subject/filter if in teacher mode
  const currentTeacherName = currentUser?.name || currentUser?.teacherObj?.name || '';
  const currentTeacherSubject = currentUser?.teacherObj?.subject || '';

  // Extract unique subjects from attendance
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    attendance.forEach((r) => {
      if (r.subject) subs.add(r.subject);
    });
    return Array.from(subs);
  }, [attendance]);

  // Filtered attendance records
  const filteredRecords = useMemo(() => {
    return attendance.filter((rec) => {
      if (
        teacherModeOnly &&
        currentTeacherName &&
        rec.markedByTeacher &&
        !rec.markedByTeacher.includes(currentTeacherName) &&
        rec.subject !== currentTeacherSubject
      ) {
        if (role !== 'admin') return false;
      }

      if (selectedGrade !== 'all' && rec.gradeLevel !== selectedGrade) return false;
      if (selectedSection !== 'all') {
        const recSec = rec.section || 'أ';
        if (recSec !== selectedSection) return false;
      }
      if (selectedSubject !== 'all' && rec.subject !== selectedSubject) return false;
      if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false;
      if (selectedDate && rec.date !== selectedDate) return false;
      if (onlyModified && !rec.modifiedAt) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesStudent = rec.studentName.toLowerCase().includes(q);
        const matchesTeacher = rec.markedByTeacher.toLowerCase().includes(q);
        const matchesNotes = (rec.notes || '').toLowerCase().includes(q);
        const matchesReason = (rec.reasonForModification || '').toLowerCase().includes(q);
        if (!matchesStudent && !matchesTeacher && !matchesNotes && !matchesReason) return false;
      }

      return true;
    });
  }, [
    attendance,
    teacherModeOnly,
    currentTeacherName,
    currentTeacherSubject,
    role,
    selectedGrade,
    selectedSection,
    selectedSubject,
    selectedStatus,
    selectedDate,
    onlyModified,
    searchQuery,
  ]);

  // Group records into Sessions (Date + Grade + Section + Subject)
  const groupedSessions = useMemo(() => {
    const map = new Map<
      string,
      {
        sessionKey: string;
        date: string;
        gradeLevel: GradeLevel;
        section: string;
        subject: string;
        teacher: string;
        records: AttendanceRecord[];
        presentCount: number;
        absentCount: number;
        lateCount: number;
        excusedCount: number;
        hasModified: boolean;
      }
    >();

    filteredRecords.forEach((r) => {
      const sec = r.section || 'أ';
      const key = `${r.date}__${r.gradeLevel}__${sec}__${r.subject}__${r.markedByTeacher}`;
      if (!map.has(key)) {
        map.set(key, {
          sessionKey: key,
          date: r.date,
          gradeLevel: r.gradeLevel,
          section: sec,
          subject: r.subject,
          teacher: r.markedByTeacher,
          records: [],
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          hasModified: false,
        });
      }

      const item = map.get(key)!;
      item.records.push(r);
      if (r.status === 'حاضرة') item.presentCount += 1;
      else if (r.status === 'غائبة') item.absentCount += 1;
      else if (r.status === 'متأخرة') item.lateCount += 1;
      else if (r.status === 'مجازة') item.excusedCount += 1;

      if (r.modifiedAt) item.hasModified = true;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredRecords]);

  // Overall Metrics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'حاضرة').length;
    const absent = filteredRecords.filter((r) => r.status === 'غائبة').length;
    const late = filteredRecords.filter((r) => r.status === 'متأخرة').length;
    const excused = filteredRecords.filter((r) => r.status === 'مجازة').length;
    const modified = filteredRecords.filter((r) => !!r.modifiedAt).length;

    const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;
    const absentPercent = total > 0 ? Math.round((absent / total) * 100) : 0;

    return { total, present, absent, late, excused, modified, presentPercent, absentPercent };
  }, [filteredRecords]);

  // Selected records count
  const selectedCount = useMemo(() => {
    return Object.values(selectedRecordIds).filter(Boolean).length;
  }, [selectedRecordIds]);

  // Selected absence records that can be undone
  const selectedAbsenceRecords = useMemo(() => {
    const selectedIds = Object.keys(selectedRecordIds).filter((id) => selectedRecordIds[id]);
    return attendance.filter(
      (r) =>
        selectedIds.includes(r.id) &&
        (r.status === 'غائبة' || r.status === 'مجازة' || r.status === 'متأخرة') &&
        canUndoAttendance(r)
    );
  }, [selectedRecordIds, attendance, canUndoAttendance]);

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSelectAllFiltered = () => {
    if (selectedCount === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedRecordIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredRecords.forEach((r) => {
        next[r.id] = true;
      });
      setSelectedRecordIds(next);
    }
  };

  const toggleSelectSessionRecords = (sessionRecords: AttendanceRecord[]) => {
    const allSelected = sessionRecords.every((r) => !!selectedRecordIds[r.id]);
    const next = { ...selectedRecordIds };
    sessionRecords.forEach((r) => {
      next[r.id] = !allSelected;
    });
    setSelectedRecordIds(next);
  };

  // Handle single record edit save
  const handleSaveSingleEdit = () => {
    if (!editingRecord) return;
    updateAttendanceRecord(
      editingRecord.id,
      {
        status: editStatus,
        reasonForModification: editReason,
        modifiedBy: currentUser?.name || 'إدارة المدرسة',
      },
      editNotifyParent
    );

    showToast(`✅ تم تعديل سجل الطالبة (${editingRecord.studentName}) بنجاح إلى (${editStatus}).`);
    setEditingRecord(null);
  };

  // Open batch edit modal for session
  const handleOpenBatchEdit = (session: (typeof groupedSessions)[0]) => {
    const initialChanges: Record<
      string,
      { status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'; notes: string }
    > = {};
    session.records.forEach((r) => {
      initialChanges[r.id] = {
        status: r.status,
        notes: r.notes || '',
      };
    });

    setBatchChanges(initialChanges);
    setBatchSessionData(session);
  };

  // Save batch edits
  const handleSaveBatchEdits = () => {
    if (!batchSessionData) return;

    const updatesToApply: Array<{
      id: string;
      status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
      notes?: string;
      reasonForModification?: string;
    }> = [];

    batchSessionData.records.forEach((r) => {
      const change = batchChanges[r.id];
      if (change && (change.status !== r.status || change.notes !== r.notes)) {
        updatesToApply.push({
          id: r.id,
          status: change.status,
          notes: change.notes,
          reasonForModification: batchReason,
        });
      }
    });

    if (updatesToApply.length > 0) {
      batchUpdateAttendanceRecords(updatesToApply, batchNotifyParents);
      showToast(`✅ تم حفظ وتثبيت تعديل (${updatesToApply.length}) سجل في جلسة الشعبة بنجاح.`);
    } else {
      showToast('ℹ️ لم يتم إجراء أي تغييرات على سجلات الجلسة.');
    }

    setBatchSessionData(null);
  };

  // Handle quick single status change
  const handleQuickStatusChange = (
    record: AttendanceRecord,
    newStatus: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة'
  ) => {
    if (record.status === newStatus) return;
    updateAttendanceRecord(
      record.id,
      {
        status: newStatus,
        reasonForModification: 'تعديل سريع ومباشر من لوحة التدقيق والمراجعة',
        modifiedBy: currentUser?.name || 'إدارة المدرسة',
      },
      true
    );
    showToast(`⚡ تم تغيير حالة الطالبة (${record.studentName}) إلى (${newStatus}).`);
  };

  // Confirm and execute deletions (Non-blocking & In-App)
  const handleConfirmExecuteDelete = () => {
    if (!deleteConfirmData) return;

    if (deleteConfirmData.type === 'single' && deleteConfirmData.record) {
      const rec = deleteConfirmData.record;
      deleteAttendanceRecord(rec.id);
      showToast(`🗑️ تم حذف سجل الحضور للطالبة (${rec.studentName}) وإعادة احتساب الإحصائيات.`);
    } else if (deleteConfirmData.type === 'session' && deleteConfirmData.session) {
      const sess = deleteConfirmData.session;
      deleteAttendanceRecordsForSession(sess.date, sess.gradeLevel, sess.section, sess.subject);
      showToast(
        `🗑️ تم حذف جلسة الحضور بالكامل ليوم ${sess.date} بمادة ${sess.subject} (${sess.recordsCount} طالبة) وتحديث رصيد الشعبة.`
      );
    } else if (deleteConfirmData.type === 'batch_selected') {
      const idsToDelete = Object.keys(selectedRecordIds).filter((id) => selectedRecordIds[id]);
      if (idsToDelete.length > 0) {
        idsToDelete.forEach((id) => {
          deleteAttendanceRecord(id);
        });
        setSelectedRecordIds({});
        showToast(`🗑️ تم حذف (${idsToDelete.length}) سجل محدد بنجاح وإعادة تدقيق رصيد الغيابات.`);
      }
    }

    setDeleteConfirmData(null);
  };

  // Confirm and execute Undo Accidental Absence (التراجع عن الغياب المسجل سهواً)
  const handleExecuteUndo = () => {
    if (!undoModalData) return;

    if (undoModalData.type === 'single' && undoModalData.record) {
      const rec = undoModalData.record;
      const res = undoAccidentalAbsence(rec.id, {
        reason: undoModalData.reason,
        deleteRecordInstead: undoModalData.actionType === 'delete_record',
        notifyParent: undoModalData.notifyParent,
        undoneBy: currentUser?.name || (role === 'admin' ? 'إدارة ثانوية ميسان للمتميزات' : 'مُدرّسة المادة'),
      });
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(`⚠️ ${res.message}`);
      }
    } else if (undoModalData.type === 'batch' && undoModalData.records && undoModalData.records.length > 0) {
      if (undoModalData.actionType === 'delete_record') {
        undoModalData.records.forEach((r) => {
          deleteAttendanceRecord(r.id);
        });
        showToast(`🗑️ تم حذف (${undoModalData.records.length}) سجل غياب مسجل سهواً وتعديل رصيد الطالبات.`);
      } else {
        const ids = undoModalData.records.map((r) => r.id);
        const res = batchUndoAccidentalAbsences(ids, undoModalData.reason);
        showToast(`↩️ ${res.message}`);
      }
      setSelectedRecordIds({});
    }

    setUndoModalData(null);
  };

  // Handle adding past retroactive attendance
  const handleSaveAddPastRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecStudentId) {
      showToast('⚠️ يرجى اختيار الطالبة أولاً');
      return;
    }
    const student = students.find((s) => s.id === newRecStudentId);
    if (!student) return;

    const teacherName = currentUser?.name || 'إدارة ثانوية ميسان للمتميزات';

    const newRecordItem: Omit<AttendanceRecord, 'id'> = {
      date: newRecDate,
      studentId: student.id,
      studentName: student.name,
      gradeLevel: student.gradeLevel,
      section: student.section || 'أ',
      status: newRecStatus,
      subject: newRecSubject,
      markedByTeacher: teacherName,
      notes: newRecNotes,
      parentNotified: true,
      modifiedAt: new Date().toISOString(),
      modifiedBy: teacherName,
      reasonForModification: 'تسجيل حضور/غياب بأثر رجعي من لوحة المراجعة',
    };

    const createdId = `att-rec-manual-${Date.now()}`;
    const fullRec: AttendanceRecord = { ...newRecordItem, id: createdId };

    updateAttendanceRecord(createdId, fullRec, true);
    recalculateStudentAbsenceStats(student.id);

    showToast(`✅ تم تسجيل حضور/غياب سابق للطالبة (${student.name}) بتاريخ ${newRecDate}.`);
    setIsAddModalOpen(false);
    setNewRecStudentId('');
  };

  // Export Filtered Table as CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('⚠️ لا توجد سجلات مطابقة للتصدير.');
      return;
    }

    const headers = [
      'التاريخ',
      'اسم الطالبة',
      'المرحلة الدراسية',
      'الشعبة',
      'المادة',
      'الحالة',
      'المدرسة المسجلة',
      'ملاحظات',
      'حالة التعديل',
      'القائم بالتعديل',
      'سبب التعديل',
    ];

    const rows = filteredRecords.map((r) => [
      r.date,
      `"${r.studentName}"`,
      `"${r.gradeLevel}"`,
      `"${r.section || 'أ'}"`,
      `"${r.subject}"`,
      `"${r.status}"`,
      `"${r.markedByTeacher}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.modifiedAt ? 'مُعدل' : 'أصلي',
      `"${(r.modifiedBy || '').replace(/"/g, '""')}"`,
      `"${(r.reasonForModification || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `سجل_مراجعة_الحضور_والغياب_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 تم تحميل كشف Excel بنجاح.');
  };

  // Toggle Session Expansion
  const toggleSession = (key: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expand all / Collapse all
  const toggleAllSessions = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    groupedSessions.forEach((s) => {
      next[s.sessionKey] = expand;
    });
    setExpandedSessions(next);
  };

  return (
    <div id="attendance-history-review-panel" className="space-y-6 font-arabic">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification-banner"
          className="fixed bottom-6 left-6 z-50 bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/30 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0 animate-pulse" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header with Actions */}
      <div
        id="attendance-review-header"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                مراجعة وتدقيق وتعديل سجلات أيام الحضور والغياب السابقة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إمكانية استعراض، وتعديل، وحذف السجلات المؤرشفة وتصحيحها مع تفعيل زر الحذف المباشر
                وإعادة احتساب الإنذارات الوزارية تلقائياً
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {selectedAbsenceRecords.length > 0 && (
            <button
              id="btn-undo-selected-absences"
              onClick={() =>
                setUndoModalData({
                  type: 'batch',
                  records: selectedAbsenceRecords,
                  reason: 'رصد الغياب سهواً وتأكيد الدوام والانتظام الفعلي للطالبات في الحصة',
                  actionType: 'mark_present',
                  notifyParent: true,
                })
              }
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all animate-in fade-in scale-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-amber-100" />
              <span>تراجع عن الغياب المحدد سهواً ({selectedAbsenceRecords.length})</span>
            </button>
          )}

          {selectedCount > 0 && (
            <button
              id="btn-delete-selected-records"
              onClick={() =>
                setDeleteConfirmData({
                  type: 'batch_selected',
                  selectedCount: selectedCount,
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all animate-in fade-in scale-100"
            >
              <Trash2 className="w-4 h-4 text-rose-100" />
              <span>حذف السجلات المحددة ({selectedCount})</span>
            </button>
          )}

          <button
            id="btn-add-past-record"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            تسجيل حضور/غياب سابق
          </button>

          <button
            id="btn-print-audit-report"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            طباعة كشف التدقيق
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            تصدير كشف Excel
          </button>

          <button
            id="btn-recalculate-all"
            onClick={() => {
              recalculateStudentAbsenceStats();
              showToast('🔄 تم إعادة تدقيق واحتساب إحصائيات الغياب والإنذارات لجميع الطالبات.');
            }}
            title="إعادة احتساب وتدقيق جميع الإنذارات والغيابات"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Stats Grid */}
      <div
        id="attendance-summary-stats-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>إجمالي السجلات</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">{groupedSessions.length} جلسات دراسية</div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs mb-1">
            <span>حالات الحضور</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
            {stats.present}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            نسبة الالتزام {stats.presentPercent}%
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs mb-1">
            <span>حالات الغياب</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-300">{stats.absent}</div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
            نسبة الغياب {stats.absentPercent}%
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs mb-1">
            <span>حالات التأخر</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300">{stats.late}</div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            تأخر مع تنبيه
          </div>
        </div>

        <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 text-xs mb-1">
            <span>الإجازات الرسمية</span>
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300">
            {stats.excused}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 mt-1">
            أعذار وإجازات
          </div>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs mb-1">
            <span>سجلات تم تعديلها</span>
            <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300">{stats.modified}</div>
          <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
            تمت مراجعتها وتدقيقها
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div
        id="attendance-filter-toolbar"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي عن اسم الطالبة، أو المدرسة، أو سبب التعديل..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Sessions vs Detailed Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'sessions'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              عرض الجلسات المؤرشفة ({groupedSessions.length})
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              جدول السجلات الفردية ({filteredRecords.length})
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Grade Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              المرحلة الدراسية
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="all">جميع المراحل الدراسية</option>
              {ALL_GRADES_LIST.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              الشعبة
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="all">جميع الشُعب</option>
              <option value="أ">شعبة (أ)</option>
              <option value="ب">شعبة (ب)</option>
              <option value="جـ">شعبة (جـ)</option>
              <option value="د">شعبة (د)</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              المادة الدراسية
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="all">جميع المواد الدراسية</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              حالة الحضور
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="all">جميع الحالات</option>
              <option value="حاضرة">🟢 حاضرة</option>
              <option value="غائبة">🔴 غائبة</option>
              <option value="متأخرة">🟡 متأخرة</option>
              <option value="مجازة">🟣 مجازة</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              تاريخ اليوم المحدد
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Tags, Selection Toolbar & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyModified(!onlyModified)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                onlyModified
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              عرض السجلات المعدلة فقط ({stats.modified})
            </button>

            <button
              onClick={toggleSelectAllFiltered}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                selectedCount > 0
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {selectedCount === filteredRecords.length && filteredRecords.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              {selectedCount > 0
                ? `إلغاء التحديد (${selectedCount}/${filteredRecords.length})`
                : `تحديد جميع السجلات (${filteredRecords.length})`}
            </button>

            {viewMode === 'sessions' && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => toggleAllSessions(true)}
                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-bold"
                >
                  فتح جميع الجلسات
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => toggleAllSessions(false)}
                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-bold"
                >
                  طي جميع الجلسات
                </button>
              </>
            )}
          </div>

          {(selectedGrade !== 'all' ||
            selectedSection !== 'all' ||
            selectedSubject !== 'all' ||
            selectedStatus !== 'all' ||
            selectedDate !== '' ||
            onlyModified ||
            searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedGrade('all');
                setSelectedSection('all');
                setSelectedSubject('all');
                setSelectedStatus('all');
                setSelectedDate('');
                setOnlyModified(false);
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Mode A (Sessions Accordion) vs Mode B (Detailed Table) */}
      {viewMode === 'sessions' ? (
        <div id="attendance-sessions-container" className="space-y-3.5">
          {groupedSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center">
              <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                لا توجد جلسات حضور تطابق معايير البحث
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                يرجى تغيير خيارات التصفية أو التاريخ، أو استخدام زر "تسجيل حضور/غياب سابق" لإضافة
                سجلات جديدة.
              </p>
            </div>
          ) : (
            groupedSessions.map((session) => {
              const isExpanded = !!expandedSessions[session.sessionKey];
              const isAllSessionSelected = session.records.every((r) => !!selectedRecordIds[r.id]);

              return (
                <div
                  key={session.sessionKey}
                  id={`session-card-${session.sessionKey}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Session Accordion Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-3.5 flex-1 cursor-pointer" onClick={() => toggleSession(session.sessionKey)}>
                      {/* Checkbox for Session Batch Selection */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectSessionRecords(session.records);
                        }}
                        title={isAllSessionSelected ? 'إلغاء تحديد الشعبة' : 'تحديد جميع طالبات الشعبة'}
                        className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {isAllSessionSelected ? (
                          <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                        )}
                      </button>

                      <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex flex-col items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black mt-0.5">
                          {session.date.split('-').slice(1).join('/')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {session.gradeLevel} - شعبة ({session.section})
                          </span>
                          <span className="px-2.5 py-0.5 bg-teal-100/80 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-[11px] font-bold rounded-full border border-teal-200 dark:border-teal-800">
                            {session.subject}
                          </span>
                          {session.hasModified && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              تم تدقيقه وتعديله
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                          <span>المدرسة المشرفة: {session.teacher}</span>
                          <span>•</span>
                          <span>التاريخ: {session.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Session Statistics Badges & Direct Controls */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40"
                          title="الحاضرات"
                        >
                          {session.presentCount} حاضرة
                        </span>
                        {session.absentCount > 0 && (
                          <span
                            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200/60 dark:border-rose-800/40"
                            title="الغائبات"
                          >
                            {session.absentCount} غائبة
                          </span>
                        )}
                        {session.lateCount > 0 && (
                          <span
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
                            title="المتأخرات"
                          >
                            {session.lateCount} متأخرة
                          </span>
                        )}
                        {session.excusedCount > 0 && (
                          <span
                            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200/60 dark:border-purple-800/40"
                            title="المجازات"
                          >
                            {session.excusedCount} مجازة
                          </span>
                        )}
                      </div>

                      {/* Delete Session Button (Fast & Direct in Header) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmData({
                            type: 'session',
                            session: {
                              sessionKey: session.sessionKey,
                              date: session.date,
                              gradeLevel: session.gradeLevel,
                              section: session.section,
                              subject: session.subject,
                              teacher: session.teacher,
                              recordsCount: session.records.length,
                            },
                          });
                        }}
                        title="حذف جلسة الحضور بالكامل"
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span className="hidden sm:inline">حذف الجلسة</span>
                      </button>

                      <div
                        onClick={() => toggleSession(session.sessionKey)}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Session Table & Bulk Actions */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800/80 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                      {/* Session Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span>
                            قائمة طالبات الشعبة المسجلات في الجلسة ({session.records.length} طالبة)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {session.records.some(
                            (r) => (r.status === 'غائبة' || r.status === 'مجازة' || r.status === 'متأخرة') && canUndoAttendance(r)
                          ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const absentRecs = session.records.filter(
                                  (r) => (r.status === 'غائبة' || r.status === 'مجازة' || r.status === 'متأخرة') && canUndoAttendance(r)
                                );
                                setUndoModalData({
                                  type: 'batch',
                                  records: absentRecs,
                                  sessionTitle: `${session.gradeLevel} - شعبة (${session.section}) • مادة ${session.subject} • تاريخ ${session.date}`,
                                  reason: 'التراجع عن غيابات الجلسة المسجلة سهواً وتثبيت دوام وحضور الطالبات',
                                  actionType: 'mark_present',
                                  notifyParent: true,
                                });
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>تراجع عن غيابات الجلسة (سهواً)</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBatchEdit(session);
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            تعديل جماعي لكشف الشعبة
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmData({
                                type: 'session',
                                session: {
                                  sessionKey: session.sessionKey,
                                  date: session.date,
                                  gradeLevel: session.gradeLevel,
                                  section: session.section,
                                  subject: session.subject,
                                  teacher: session.teacher,
                                  recordsCount: session.records.length,
                                },
                              });
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            حذف جميع سجلات الجلسة
                          </button>
                        </div>
                      </div>

                      {/* Students List in Session */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                              <th className="py-2.5 px-3 w-10">تحديد</th>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">اسم الطالبة</th>
                              <th className="py-2.5 px-3">حالة الحضور</th>
                              <th className="py-2.5 px-3">ملاحظات والتعديل</th>
                              <th className="py-2.5 px-3 text-center">تغيير مباشر وسريع</th>
                              <th className="py-2.5 px-3 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {session.records.map((rec, idx) => {
                              const studentObj = students.find(
                                (s) => s.id === rec.studentId || s.name === rec.studentName
                              );
                              const isSelected = !!selectedRecordIds[rec.id];

                              return (
                                <tr
                                  key={rec.id}
                                  className={`hover:bg-white dark:hover:bg-slate-800/50 transition-colors ${
                                    isSelected
                                      ? 'bg-teal-50/60 dark:bg-teal-950/30'
                                      : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleSelectRecord(rec.id)}
                                      className="p-1 text-slate-400 hover:text-teal-600"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                      {rec.studentName}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      هاتف ولي الأمر: {studentObj?.parentPhone || 'غير متوفر'}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                        rec.status === 'حاضرة'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                          : rec.status === 'غائبة'
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                          : rec.status === 'متأخرة'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                      }`}
                                    >
                                      {rec.status === 'حاضرة' && <Check className="w-3 h-3" />}
                                      {rec.status === 'غائبة' && <X className="w-3 h-3" />}
                                      {rec.status === 'متأخرة' && <Clock className="w-3 h-3" />}
                                      {rec.status === 'مجازة' && <FileText className="w-3 h-3" />}
                                      {rec.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                    {rec.notes || <span className="text-slate-400">-</span>}
                                    {rec.isRevokedMistakenAbsence ? (
                                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 mt-0.5">
                                        <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        <span>تم التراجع عن الغياب (سُجلت سهواً)</span>
                                      </div>
                                    ) : rec.modifiedAt ? (
                                      <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                                        ✏️ تم التعديل: {rec.reasonForModification || 'تدقيق إداري'}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {/* 1-Click Quick Status Switcher */}
                                    <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                      <button
                                        type="button"
                                        title="تغيير إلى حاضرة"
                                        onClick={() => handleQuickStatusChange(rec, 'حاضرة')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                          rec.status === 'حاضرة'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700'
                                        }`}
                                      >
                                        حاضرة
                                      </button>
                                      <button
                                        type="button"
                                        title="تغيير إلى غائبة"
                                        onClick={() => handleQuickStatusChange(rec, 'غائبة')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                          rec.status === 'غائبة'
                                            ? 'bg-rose-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700'
                                        }`}
                                      >
                                        غائبة
                                      </button>
                                      <button
                                        type="button"
                                        title="تغيير إلى متأخرة"
                                        onClick={() => handleQuickStatusChange(rec, 'متأخرة')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                          rec.status === 'متأخرة'
                                            ? 'bg-amber-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700'
                                        }`}
                                      >
                                        متأخرة
                                      </button>
                                      <button
                                        type="button"
                                        title="تغيير إلى مجازة"
                                        onClick={() => handleQuickStatusChange(rec, 'مجازة')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                          rec.status === 'مجازة'
                                            ? 'bg-purple-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700'
                                        }`}
                                      >
                                        مجازة
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {canUndoAttendance(rec) &&
                                        (rec.status === 'غائبة' ||
                                          rec.status === 'مجازة' ||
                                          rec.status === 'متأخرة') && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setUndoModalData({
                                                type: 'single',
                                                record: rec,
                                                reason:
                                                  'رصد الغياب سهواً وتأكيد الدوام والحضور الفعلي للطالبة في الحصة',
                                                actionType: 'mark_present',
                                                notifyParent: true,
                                              });
                                            }}
                                            title="التراجع عن تسجيل الغياب (سُجلت غائبة سهواً)"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/70 border border-amber-300/80 dark:border-amber-700/80 rounded-xl transition-all shadow-2xs"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            <span>تراجع (سهواً)</span>
                                          </button>
                                        )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingRecord(rec);
                                          setEditStatus(rec.status);
                                          setEditReason(
                                            rec.reasonForModification ||
                                              'تصحيح إداري معتمد وتدقيق من المدرسة'
                                          );
                                          setEditNotifyParent(true);
                                        }}
                                        title="تعديل تفصيلي للسجل"
                                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      {/* Activated Direct Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteConfirmData({
                                            type: 'single',
                                            record: rec,
                                          });
                                        }}
                                        title="حذف هذا السجل"
                                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
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
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Mode B: Detailed Flat Table */
        <div
          id="attendance-detailed-table-card"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>جميع السجلات الفردية المسترجعة ({filteredRecords.length} سجل)</span>
              {selectedCount > 0 && (
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full">
                  المحدد: {selectedCount}
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400">مرتبة تنازلياً حسب التاريخ الأحدث</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <th className="py-3 px-3 w-10">تحديد</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">اسم الطالبة والشعبة</th>
                  <th className="py-3 px-4">المرحلة والمادة</th>
                  <th className="py-3 px-4">المدرسة</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">ملاحظات / تدقيق</th>
                  <th className="py-3 px-4 text-center">تغيير سريع</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                      لا توجد سجلات مطابقة لمعايير البحث.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isSelected = !!selectedRecordIds[rec.id];

                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-teal-50/60 dark:bg-teal-950/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleSelectRecord(rec.id)}
                            className="p-1 text-slate-400 hover:text-teal-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {rec.date}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {rec.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            شعبة ({rec.section || 'أ'})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 dark:text-slate-300 font-bold">
                            {rec.subject}
                          </div>
                          <div className="text-[10px] text-slate-400">{rec.gradeLevel}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {rec.markedByTeacher}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              rec.status === 'حاضرة'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : rec.status === 'غائبة'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : rec.status === 'متأخرة'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {rec.notes || <span className="text-slate-400">-</span>}
                          {rec.isRevokedMistakenAbsence ? (
                            <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 mt-0.5">
                              <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>تم التراجع عن الغياب (سُجلت سهواً)</span>
                            </div>
                          ) : rec.modifiedAt ? (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 font-bold">
                              ✏️ مُعدل: {rec.reasonForModification || 'تدقيق'}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(rec, 'حاضرة')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                rec.status === 'حاضرة'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              حاضرة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(rec, 'غائبة')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                rec.status === 'غائبة'
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                              }`}
                            >
                              غائبة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(rec, 'متأخرة')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                rec.status === 'متأخرة'
                                  ? 'bg-amber-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                              }`}
                            >
                              متأخرة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(rec, 'مجازة')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                rec.status === 'مجازة'
                                  ? 'bg-purple-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                              }`}
                            >
                              مجازة
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canUndoAttendance(rec) &&
                              (rec.status === 'غائبة' ||
                                rec.status === 'مجازة' ||
                                rec.status === 'متأخرة') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUndoModalData({
                                      type: 'single',
                                      record: rec,
                                      reason:
                                        'رصد الغياب سهواً وتأكيد الدوام والحضور الفعلي للطالبة في الحصة',
                                      actionType: 'mark_present',
                                      notifyParent: true,
                                    });
                                  }}
                                  title="التراجع عن تسجيل الغياب (سُجلت غائبة سهواً)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/70 border border-amber-300/80 dark:border-amber-700/80 rounded-xl transition-all shadow-2xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>تراجع (سهواً)</span>
                                </button>
                              )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(rec);
                                setEditStatus(rec.status);
                                setEditReason(
                                  rec.reasonForModification ||
                                    'تصحيح إداري معتمد وتدقيق من المدرسة'
                                );
                                setEditNotifyParent(true);
                              }}
                              title="تعديل السجل"
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {/* Activated Direct Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmData({
                                  type: 'single',
                                  record: rec,
                                });
                              }}
                              title="حذف السجل"
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: In-App Dedicated Undo Mistaken Absence Dialog (التراجع عن الغياب المسجل سهواً) */}
      {undoModalData && (
        <div
          id="modal-undo-absence-confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {undoModalData.type === 'single'
                      ? 'التراجع عن تسجيل الغياب (سُجلت سهواً)'
                      : `التراجع الجماعي عن (${undoModalData.records?.length || 0}) غياب مسجل سهواً`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    صلاحية معتمدة: المديرة والإدارة المدرسية أو المُدرّسة راصدة الغياب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUndoModalData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Record info summary */}
              {undoModalData.type === 'single' && undoModalData.record && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">اسم الطالبة:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      {undoModalData.record.studentName}
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400">الصف والشعبة: </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {undoModalData.record.gradeLevel} ({undoModalData.record.section || 'أ'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">المادة: </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {undoModalData.record.subject}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">تاريخ الغياب: </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {undoModalData.record.date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">المدرسة الراصدة: </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {undoModalData.record.markedByTeacher}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {undoModalData.type === 'batch' && undoModalData.records && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  {undoModalData.sessionTitle && (
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      الجلسة: {undoModalData.sessionTitle}
                    </div>
                  )}
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    سيتم التراجع عن رصد الغياب وتثبيت الحضور لـ ({undoModalData.records.length}) طالبة:
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {undoModalData.records.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {r.studentName}
                        </span>
                        <span className="text-slate-400">{r.subject} - {r.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Type Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  نوع الإجراء المطلوب تنفيذه:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setUndoModalData((prev) =>
                        prev ? { ...prev, actionType: 'mark_present' } : null
                      )
                    }
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                      undoModalData.actionType === 'mark_present'
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>تثبيت "حاضرة رسمياً" وإلغاء الخصم</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      (موصى به) يعدل السجل إلى حاضرة ويلغي حصة الغياب من الرصيد والإنذارات
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUndoModalData((prev) =>
                        prev ? { ...prev, actionType: 'delete_record' } : null
                      )
                    }
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                      undoModalData.actionType === 'delete_record'
                        ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>حذف سجل الغياب الخاطئ تماماً</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      يمسح قيد الغياب كلياً من السجلات وكأنه لم يُرصد
                    </span>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  سبب التراجع والتصحيح:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[
                    'رصد الغياب سهواً وتأكيد الدوام والحضور الفعلي للطالبة في الحصة',
                    'خطأ غير مقصود في تحديد اسم الطالبة أثناء رصد القائمة',
                    'تصحيح مباشر معتمد ومؤكد من مديرة وإدارة المدرسة',
                  ].map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() =>
                        setUndoModalData((prev) => (prev ? { ...prev, reason: suggested } : null))
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        undoModalData.reason === suggested
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={undoModalData.reason}
                  onChange={(e) =>
                    setUndoModalData((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-200"
                  placeholder="أدخلي سبب التراجع بالتفصيل..."
                />
              </div>

              {/* Instant Notification Checkbox */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-3 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="undoNotifyCheck"
                    checked={undoModalData.notifyParent}
                    onChange={(e) =>
                      setUndoModalData((prev) =>
                        prev ? { ...prev, notifyParent: e.target.checked } : null
                      )
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-emerald-300"
                  />
                  <label
                    htmlFor="undoNotifyCheck"
                    className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    إرسال إشعار فوري لولي الأمر والطالبة بالتراجع عن تسجيل الغياب وتثبيت الحضور
                  </label>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUndoModalData(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteUndo}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تأكيد التراجع وتصحيح الغياب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: In-App Dedicated Deletion Confirmation Dialog */}
      {deleteConfirmData && (
        <div
          id="modal-delete-confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {deleteConfirmData.type === 'single'
                    ? 'تأكيد حذف سجل الحضور'
                    : deleteConfirmData.type === 'session'
                    ? 'تأكيد حذف جلسة الحضور بالكامل'
                    : `تأكيد حذف (${deleteConfirmData.selectedCount}) سجل محدد`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {deleteConfirmData.type === 'single' && deleteConfirmData.record && (
                    <>
                      هل ترغبين بالتأكيد في حذف سجل الطالبة (
                      <strong className="text-slate-800 dark:text-slate-200">
                        {deleteConfirmData.record.studentName}
                      </strong>
                      ) بتاريخ ({deleteConfirmData.record.date}) بمادة (
                      {deleteConfirmData.record.subject})؟
                    </>
                  )}
                  {deleteConfirmData.type === 'session' && deleteConfirmData.session && (
                    <>
                      هل ترغبين بالتأكيد في حذف جلسة كشف الحضور للشعبة (
                      <strong className="text-slate-800 dark:text-slate-200">
                        {deleteConfirmData.session.gradeLevel} - شعبة{' '}
                        {deleteConfirmData.session.section}
                      </strong>
                      ) بتاريخ ({deleteConfirmData.session.date}) بمادة (
                      {deleteConfirmData.session.subject}) التي تضم (
                      {deleteConfirmData.session.recordsCount}) طالبة؟
                    </>
                  )}
                  {deleteConfirmData.type === 'batch_selected' && (
                    <>
                      سيتم حذف جميع السجلات المحددة ({deleteConfirmData.selectedCount} سجل) نهائياً
                      من النظام.
                    </>
                  )}
                </p>
              </div>

              {/* Automatic Stats Recalculation Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3 rounded-2xl text-start text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>التحديث التلقائي الفوري:</strong> سيقوم النظام تلقائياً بإعادة احتساب
                  تراكم الدروس الفائتة، وأيام الغياب، ومستوى الإنذار الوزاري لجميع الطالبات
                  المتأثرات فور إتمام الحذف.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmData(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmExecuteDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Edit Single Record Modal */}
      {editingRecord && (
        <div
          id="modal-edit-single-attendance"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  تعديل وتصحيح سجل الحضور والغياب
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Student and Record Details Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {editingRecord.studentName}
                  </span>
                  <span className="text-slate-500 font-mono">{editingRecord.date}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <span>{editingRecord.gradeLevel}</span>
                  <span>-</span>
                  <span>شعبة ({editingRecord.section || 'أ'})</span>
                  <span>-</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">
                    {editingRecord.subject}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  المدرسة المسجلة: {editingRecord.markedByTeacher}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الحالة المعتمدة الجديدة *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['حاضرة', 'غائبة', 'متأخرة', 'مجازة'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        editStatus === st
                          ? st === 'حاضرة'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : st === 'غائبة'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : st === 'متأخرة'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'حاضرة' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {st === 'غائبة' && <XCircle className="w-3.5 h-3.5" />}
                      {st === 'متأخرة' && <Clock className="w-3.5 h-3.5" />}
                      {st === 'مجازة' && <FileText className="w-3.5 h-3.5" />}
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ministerial Impact Note */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-3 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>الأثر الإداري والوزاري:</strong> تعديل الحالة من (
                  {editingRecord.status}) إلى ({editStatus}) سيقوم تلقائياً بتحديث رصيد الغياب
                  والدروس الضائعة ومستوى الإنذار الوزاري للطالبة في قاعدة البيانات.
                </div>
              </div>

              {/* Reason for Modification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سبب وتفاصيل التعديل *
                </label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="اكتبي سبب تعديل السجل (مثال: خطأ في التسجيل، تقديم عذر طبي، تأخر مبرر...)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Parent Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyParentCheck"
                  checked={editNotifyParent}
                  onChange={(e) => setEditNotifyParent(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 focus:ring-offset-0 bg-slate-100 border-slate-300"
                />
                <label
                  htmlFor="notifyParentCheck"
                  className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  إرسال إشعار فوري وتحديث لولي أمر الطالبة عبر الرسائل والإشعارات
                </label>
              </div>
            </div>

            {/* Modal Footer with Save & Delete Record Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const toDel = editingRecord;
                  setEditingRecord(null);
                  setDeleteConfirmData({
                    type: 'single',
                    record: toDel,
                  });
                }}
                className="px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-2xl flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف هذا السجل</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSingleEdit}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
                >
                  حفظ وتثبيت التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Edit Session Modal */}
      {batchSessionData && (
        <div
          id="modal-batch-edit-session"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  تعديل جماعي لسجلات كشف الحضور للشعبة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {batchSessionData.gradeLevel} - شعبة ({batchSessionData.section}) • مادة{' '}
                  {batchSessionData.subject} • تاريخ {batchSessionData.date}
                </p>
              </div>
              <button
                onClick={() => setBatchSessionData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Fast Bulk Fill Actions */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تطبيق سريع على جميع طالبات الكشف:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...batchChanges };
                      batchSessionData.records.forEach((r) => {
                        next[r.id] = { ...next[r.id], status: 'حاضرة' };
                      });
                      setBatchChanges(next);
                    }}
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                  >
                    تحديد الكل حاضر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...batchChanges };
                      batchSessionData.records.forEach((r) => {
                        next[r.id] = { ...next[r.id], status: 'غائبة' };
                      });
                      setBatchChanges(next);
                    }}
                    className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-200 transition-colors"
                  >
                    تحديد الكل غائب
                  </button>
                </div>
              </div>

              {/* Student Rows Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">اسم الطالبة</th>
                      <th className="py-2.5 px-3 text-center">حالة الحضور</th>
                      <th className="py-2.5 px-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {batchSessionData.records.map((r, idx) => {
                      const cur = batchChanges[r.id] || { status: r.status, notes: r.notes || '' };

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {r.studentName}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                              {(['حاضرة', 'غائبة', 'متأخرة', 'مجازة'] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setBatchChanges((prev) => ({
                                      ...prev,
                                      [r.id]: { ...prev[r.id], status: st },
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                    cur.status === st
                                      ? st === 'حاضرة'
                                        ? 'bg-emerald-600 text-white'
                                        : st === 'غائبة'
                                        ? 'bg-rose-600 text-white'
                                        : st === 'متأخرة'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-purple-600 text-white'
                                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={cur.notes}
                              onChange={(e) =>
                                setBatchChanges((prev) => ({
                                  ...prev,
                                  [r.id]: { ...prev[r.id], notes: e.target.value },
                                }))
                              }
                              placeholder="ملاحظات..."
                              className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Batch Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب التعديل الجماعي للكشف
                </label>
                <input
                  type="text"
                  value={batchReason}
                  onChange={(e) => setBatchReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium"
                />
              </div>

              {/* Notification Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchNotifyCheck"
                  checked={batchNotifyParents}
                  onChange={(e) => setBatchNotifyParents(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-100 border-slate-300"
                />
                <label
                  htmlFor="batchNotifyCheck"
                  className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  إرسال إشعارات رسمية لأولياء أمور الطالبات اللواتي تغيرت حالتهن
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBatchSessionData(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveBatchEdits}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
              >
                حفظ وتثبيت التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Retroactive Past Attendance Modal */}
      {isAddModalOpen && (
        <div
          id="modal-add-past-record"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  تسجيل حضور أو غياب سابق بأثر رجعي
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddPastRecord} className="p-5 space-y-3.5">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الطالبة *
                </label>
                <select
                  required
                  value={newRecStudentId}
                  onChange={(e) => setNewRecStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="">-- اختاري الطالبة من القائمة --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.gradeLevel} - شعبة {s.section || 'أ'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ اليوم السابق *
                </label>
                <input
                  type="date"
                  required
                  value={newRecDate}
                  onChange={(e) => setNewRecDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المادة الدراسية *
                </label>
                <input
                  type="text"
                  required
                  value={newRecSubject}
                  onChange={(e) => setNewRecSubject(e.target.value)}
                  placeholder="الفيزياء المتقدمة، الرياضيات..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الحالة *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['حاضرة', 'غائبة', 'متأخرة', 'مجازة'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewRecStatus(st)}
                      className={`py-2 px-2 rounded-2xl text-xs font-bold border transition-all ${
                        newRecStatus === st
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو سبب التسجيل المتأخر
                </label>
                <input
                  type="text"
                  value={newRecNotes}
                  onChange={(e) => setNewRecNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-sm"
                >
                  حفظ وتثبيت السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Official Printable Audit Report */}
      {isPrintModalOpen && (
        <div
          id="modal-print-attendance-audit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  معاينة كشف تدقيق ومراجعة الحضور والغياب للطباعة الرسمية (A4)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الآن
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Canvas */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 font-sans space-y-6">
              {/* Iraqi Ministry Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-900">جمهورية العراق</div>
                  <div className="text-xs font-bold text-slate-900">وزارة التربية</div>
                  <div className="text-xs text-slate-800">المديرية العامة لتربية ميسان</div>
                  <div className="text-xs font-bold text-teal-900">ثانوية ميسان للمتميزات للبنات</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-slate-900 flex items-center justify-center p-1 font-bold text-[10px] text-center">
                    شعار الوزارة
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1">
                    كشف تدقيق ومراجعة سجلات الحضور والغياب
                  </div>
                  <div className="text-[11px] text-slate-600">
                    العام الدراسي {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                  </div>
                </div>

                <div className="text-left text-xs font-mono space-y-1 text-slate-700">
                  <div>العدد: ت/م/{Math.floor(100 + Math.random() * 900)}</div>
                  <div>التاريخ: {new Date().toLocaleDateString('ar-IQ')}</div>
                  <div>الصفة: كشف رسمي معتمد</div>
                </div>
              </div>

              {/* Scope & Statistics Header */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-center font-bold">
                <div>إجمالي السجلات: {stats.total}</div>
                <div className="text-emerald-700">حالات الحضور: {stats.present}</div>
                <div className="text-rose-700">حالات الغياب: {stats.absent}</div>
                <div className="text-blue-700">سجلات تم تعديلها: {stats.modified}</div>
              </div>

              {/* Table of Records */}
              <table className="w-full text-right text-xs border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                    <th className="p-2 border-l border-slate-300">#</th>
                    <th className="p-2 border-l border-slate-300">التاريخ</th>
                    <th className="p-2 border-l border-slate-300">اسم الطالبة</th>
                    <th className="p-2 border-l border-slate-300">المرحلة والشعبة</th>
                    <th className="p-2 border-l border-slate-300">المادة</th>
                    <th className="p-2 border-l border-slate-300">الحالة</th>
                    <th className="p-2 border-l border-slate-300">المدرسة</th>
                    <th className="p-2">ملاحظات التدقيق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.slice(0, 50).map((r, i) => (
                    <tr key={r.id}>
                      <td className="p-1.5 border-l border-slate-200 font-mono text-center">
                        {i + 1}
                      </td>
                      <td className="p-1.5 border-l border-slate-200 font-mono">{r.date}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold">{r.studentName}</td>
                      <td className="p-1.5 border-l border-slate-200">
                        {r.gradeLevel} ({r.section || 'أ'})
                      </td>
                      <td className="p-1.5 border-l border-slate-200">{r.subject}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold">{r.status}</td>
                      <td className="p-1.5 border-l border-slate-200">{r.markedByTeacher}</td>
                      <td className="p-1.5 text-[10px] text-slate-600">
                        {r.modifiedAt
                          ? `معدل: ${r.reasonForModification || 'تدقيق'}`
                          : r.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRecords.length > 50 && (
                <div className="text-center text-xs text-slate-500 italic">
                  تم عرض أول 50 سجل من إجمالي ({filteredRecords.length}) سجل في المعاينة للطباعة.
                </div>
              )}

              {/* Official Signatures & Seal Footer */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-bold border-t border-slate-300">
                <div className="space-y-6">
                  <div>معاونة شؤون الطالبات والتسجيل</div>
                  <div className="text-slate-700">زينب علي الموسوي</div>
                </div>

                <div className="space-y-4">
                  <div>ختم ثانوية ميسان للمتميزات</div>
                  <div className="w-16 h-16 mx-auto rounded-full border border-teal-800/40 flex items-center justify-center text-[9px] text-teal-800 font-serif">
                    الختم الرسمي
                  </div>
                </div>

                <div className="space-y-6">
                  <div>مديرة ثانوية ميسان للمتميزات</div>
                  <div className="text-slate-900 font-extrabold">
                    {schoolAdminData?.principalName || 'الهام صبيح سعدون'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
