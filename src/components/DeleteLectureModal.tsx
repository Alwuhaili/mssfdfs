import React, { useState } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { LectureResource } from '../types';
import { useApp } from '../context/AppContext';
import { getSupervisorLabel } from '../utils/teacherUtils';

interface DeleteLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: LectureResource | null;
  onSuccess?: () => void;
  isAdmin?: boolean;
}

export const DeleteLectureModal: React.FC<DeleteLectureModalProps> = ({
  isOpen,
  onClose,
  lecture,
  onSuccess,
  isAdmin = false,
}) => {
  const { deleteLecture, addNotification, currentUser } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !lecture) return null;

  if (currentUser?.role === 'supervisor') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto text-3xl">
            🏛️
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              صلاحيات المشرف التربوي - المكتبة والمحاضرات
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              عذراً، لا يمتلك المشرف التربوي صلاحية حذف الكتب أو الملازم أو المراجع من المكتبة الرقمية. يحق للمشرف الاطلاع والقراءة والتحميل والحفظ والمشاركة فقط.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      deleteLecture(lecture.id);

      addNotification({
        title: `تم حذف الكتاب / المرجع نهائياً: ${lecture.title}`,
        message: `تم حذف الملف ومحتواه بالكامل من المكتبة الرقمية وقاعدة البيانات بشكل نهائي ودائم.`,
        type: 'warning',
        timestamp: 'الآن',
        isRead: false,
      });

      setTimeout(() => {
        setIsDeleting(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 400);
    } catch (err) {
      console.error('Error deleting lecture:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-auto">
        {/* Top Warning Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تأكيد حذف الكتاب / المرجع
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                إجراء نهائي لإزالة الملف من المكتبة المدرسية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Box */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>تحذير أمني: هل أنتِ متأكدة من رغبتكِ في حذف هذا المرجع؟</span>
          </div>
          <p className="text-xs text-rose-700/90 dark:text-rose-400 leading-relaxed">
            سيتم إزالة هذا الكتاب ومحتواه وملف الـ PDF المرفق من المكتبة الرقمية ولن تتمكن الطالبات من قراءته أو تحميله لاحقاً.
          </p>
        </div>

        {/* Book Details Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">عنوان الكتاب / المرجع:</span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                {lecture.title}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lecture.gradeLevel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500">📚</span>
              <span>مادة {lecture.subject}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {getSupervisorLabel(lecture.teacherName)}: {lecture.teacherName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-500">
              <span>📄 {lecture.fileSize || 'PDF'}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ الحذف...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف نهائياً 🗑️</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
