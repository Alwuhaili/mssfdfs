import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Scale, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DisciplinarySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisciplinarySettingsModal: React.FC<DisciplinarySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { disciplinarySettings, updateDisciplinarySettings, role } = useApp();

  const [firstWarning, setFirstWarning] = useState(5);
  const [finalWarning, setFinalWarning] = useState(10);
  const [expulsion, setExpulsion] = useState(15);
  const [lessonsPerDay, setLessonsPerDay] = useState(5);

  useEffect(() => {
    if (disciplinarySettings) {
      setFirstWarning(disciplinarySettings.firstWarningDays ?? 5);
      setFinalWarning(disciplinarySettings.finalWarningDays ?? 10);
      setExpulsion(disciplinarySettings.expulsionDays ?? 15);
      setLessonsPerDay(disciplinarySettings.lessonsPerAbsenceDay ?? 5);
    }
  }, [disciplinarySettings, isOpen]);

  if (!isOpen || role !== 'admin') return null;

  const handleSave = () => {
    updateDisciplinarySettings({
      firstWarningDays: firstWarning,
      finalWarningDays: finalWarning,
      expulsionDays: expulsion,
      lessonsPerAbsenceDay: lessonsPerDay,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">إعدادات الانضباط والغياب</h3>
              <p className="text-xs text-slate-500">تعديل قوانين الإنذارات والفصل المدرسي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              تعديل هذه الأرقام سيؤثر فوراً على تقييم وتصنيف الطالبات في نظام الحضور والغياب (الإنذارات التلقائية، الاستحقاق للفصل).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>أيام الغياب لإصدار إنذار أول</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">الافتراضي: 5</span>
              </label>
              <input
                type="number"
                min={1}
                value={firstWarning}
                onChange={(e) => setFirstWarning(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>أيام الغياب لإصدار إنذار نهائي</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">الافتراضي: 10</span>
              </label>
              <input
                type="number"
                min={firstWarning + 1}
                value={finalWarning}
                onChange={(e) => setFinalWarning(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>أيام الغياب المسببة للفصل بالغياب</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">الافتراضي: 15</span>
              </label>
              <input
                type="number"
                min={finalWarning + 1}
                value={expulsion}
                onChange={(e) => setExpulsion(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-medium text-rose-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> حصص الغياب التي تمثل "يوم غياب واحد"</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">الافتراضي: 5</span>
              </label>
              <input
                type="number"
                min={1}
                value={lessonsPerDay}
                onChange={(e) => setLessonsPerDay(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-2">
                عدد الحصص (الدروس) المتراكمة التي تعادل يوماً واحداً من الغياب عند احتساب الرصيد.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-l from-amber-600 to-amber-500 shadow-lg shadow-amber-200 hover:shadow-xl hover:from-amber-700 hover:to-amber-600 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
