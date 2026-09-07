import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { StudentCertificate } from '../types';

export interface DeleteCertificateTarget {
  type: 'single' | 'bulk' | 'scope';
  certificate?: StudentCertificate | null;
  certIds?: string[];
  scopeTitle?: string;
  count?: number;
}

interface DeleteCertificateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DeleteCertificateTarget | null;
  onConfirmDelete: () => void;
}

export const DeleteCertificateConfirmModal: React.FC<DeleteCertificateConfirmModalProps> = ({
  isOpen,
  onClose,
  target,
  onConfirmDelete,
}) => {
  if (!isOpen || !target) return null;

  const isSingle = target.type === 'single' && target.certificate;
  const isBulk = target.type === 'bulk';
  const isScope = target.type === 'scope';

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[120] print:hidden animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-5 text-slate-900 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-2xl text-rose-700 shadow-sm shrink-0">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>تأكيد حذف الشهادة المدرسية</span>
                <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-300">
                  إجراء حاسم
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                يرجى تأكيد رغبتك في حذف السجل من قاعدة بيانات المدرسة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Details Card */}
        {isSingle && target.certificate && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>بيانات الشهادة المراد حذفها:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-3 rounded-xl border border-rose-100">
              <div>
                <span className="text-slate-400 block text-[11px]">اسم الطالبة:</span>
                <span className="font-black text-slate-900 text-sm">{target.certificate.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الصف والشعبة:</span>
                <span className="font-bold text-indigo-700">{target.certificate.gradeLevel} (شعبة {target.certificate.section || 'أ'})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الرقم الوطني / الإحصائي:</span>
                <span className="font-mono font-bold text-slate-800">{target.certificate.nationalId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">العام الدراسي / النتيجة:</span>
                <span className="font-bold text-emerald-800">{target.certificate.academicYear} | {target.certificate.status}</span>
              </div>
            </div>
          </div>
        )}

        {isBulk && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>تنبيه حذف جماعي:</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                سيتم حذف عدد <span className="text-rose-600 font-black text-base">({target.certIds?.length || target.count || 0})</span> شهادة مدرسية محددة نهائياً.
              </p>
              <p className="text-slate-500 text-[11px]">
                سيتم مسح سجلات الدرجات للشهادات المحددة فقط، ولن يؤثر ذلك على باقي طالبات المدرسة.
              </p>
            </div>
          </div>
        )}

        {isScope && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>تنبيه تفريغ شهادات النطاق:</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                النطاق المستهدف: <span className="text-rose-700 font-black">{target.scopeTitle || 'كافة الشهادات'}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                سيتم إزالة وحذف الشهادات التابعة لهذا النطاق من النظام، مع إمكانية إعادة توليدها أو إصدارها كشهادات جديدة فارغة في أي وقت.
              </p>
            </div>
          </div>
        )}

        {/* Warning Note */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
          <span className="text-amber-500 text-base leading-none">⚠️</span>
          <span>
            ملاحظة: هذا الإجراء يحذف وثيقة الشهادة الحالية ويمكنك في أي وقت إعادة إصدار شهادة جديدة أو نموذج فارغ للطالبة من خلال زر <strong>"إصدار شهادات"</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            إلغاء الأمر
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-200" />
            <span>نعم، تأكيد الحذف نهائياً 🗑️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
