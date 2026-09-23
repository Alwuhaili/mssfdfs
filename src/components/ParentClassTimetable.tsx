import React, { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildPeriodTimings, resolveTimetableSettings } from '../utils/timetableSettings';
import { filterTimetableForLinkedStudent, type ParentLinkedStudent } from '../utils/parentStudentLink';

interface ParentClassTimetableProps {
  linked: ParentLinkedStudent;
}

export const ParentClassTimetable: React.FC<ParentClassTimetableProps> = ({ linked }) => {
  const { timetable, schoolAdminData } = useApp();
  const settings = useMemo(() => resolveTimetableSettings(schoolAdminData), [schoolAdminData]);
  const periods = useMemo(() => buildPeriodTimings(settings), [settings]);
  const days = settings.workingDays;
  const classSlots = useMemo(
    () => filterTimetableForLinkedStudent(timetable, linked),
    [timetable, linked]
  );

  if (!linked.section) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200 text-sm text-slate-600 font-arabic">
        لا يمكن عرض الجدول لأن شعبة الطالبة غير متوفرة في سجل ولي الأمر.
      </div>
    );
  }

  const getSlot = (day: string, period: number) =>
    classSlots.find((slot) => slot.day === day && slot.period === period);

  return (
    <div className="space-y-4 font-arabic">
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-700">
        <h3 className="text-white font-black flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-400" />
          <span>جدول الدروس الأسبوعي</span>
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          {linked.studentName} • {linked.gradeLevel} • شعبة {linked.section} • عرض فقط
        </p>
      </div>
      {classSlots.length === 0 ? (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 text-sm text-slate-600">
          لا توجد حصص معتمدة حالياً لصف وشعبة الطالبة المرتبطة بهذا الحساب.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950">
          <table className="w-full text-right text-xs min-w-[720px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3">الحصة</th>
                {days.map((day) => (
                  <th key={day} className="p-3 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.period} className="border-t border-slate-800">
                  <td className="p-3 text-amber-300 font-bold">
                    <div>{period.label}</div>
                    {period.timeSlot ? <div className="text-[10px] text-slate-400 font-mono">{period.timeSlot}</div> : null}
                  </td>
                  {days.map((day) => {
                    const slot = getSlot(day, period.period);
                    return (
                      <td key={day} className="p-2 text-center text-slate-100">
                        {slot ? (
                          <div>
                            <div className="font-black">{slot.subject}</div>
                            <div className="text-[10px] text-indigo-300">{slot.teacherName}</div>
                            {slot.room ? <div className="text-[10px] text-slate-400">{slot.room}</div> : null}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
