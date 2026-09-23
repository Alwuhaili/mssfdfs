/**
 * Parent / Guardian Dashboard Component
 * ثانوية ميسان للمتميزات
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentCertificateManager } from './StudentCertificateManager';
import { AcademicCalendarWidget } from './AcademicCalendarWidget';
import { SchoolHomeOverview } from './SchoolHomeOverview';
import { MessagingSystem } from './MessagingSystem';
import { GraduatesView } from './GraduatesView';
import { InteractiveChallengesManager } from './InteractiveChallengesManager';
import { StudentIDCardModal } from './StudentIDCardModal';
import { LessonPlanningHub } from './LessonPlanningHub';
import { OfficialExamSchedulesManager } from './OfficialExamSchedulesManager';
import { ParentClassTimetable } from './ParentClassTimetable';
import { getShieldThemeConfig } from '../data/shieldsData';
import {
  resolveActiveParentRecord,
  resolveLinkedStudentForParent,
} from '../utils/parentStudentLink';
import {
  CalendarCheck,
  FileCheck2,
  CircleDollarSign,
  Award,
} from 'lucide-react';

const LINKED_STUDENT_EMPTY = 'لا توجد طالبة مرتبطة بهذا الحساب.';

export const ParentDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { currentUser, students, parents, attendance, submissions, financial, lang } = useApp();

  const activeParentObj = useMemo(
    () => resolveActiveParentRecord(currentUser, parents),
    [currentUser, parents]
  );
  const linked = useMemo(
    () => resolveLinkedStudentForParent(activeParentObj, students),
    [activeParentObj, students]
  );
  const linkedStudentRecord = useMemo(
    () => (linked ? students.find((student) => student.id === linked.studentId) || null : null),
    [students, linked]
  );

  const daughterAttendance = linked
    ? attendance.filter((record) => record.studentId === linked.studentId)
    : [];
  const daughterSubmissions = linked
    ? submissions.filter((record) => record.studentId === linked.studentId)
    : [];
  const daughterFinancial = linked
    ? financial.filter((record) => record.studentId === linked.studentId)
    : [];

  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  if (!linked) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm font-arabic text-center space-y-2">
        <h2 className="text-lg font-black text-slate-900">{LINKED_STUDENT_EMPTY}</h2>
        <p className="text-sm text-slate-500">لا يمكن عرض الصف أو الشعبة أو الجدول أو السجلات الأكاديمية دون ربط معرف معتمد.</p>
      </div>
    );
  }

  const badgeTitles =
    linked.shieldsAndBadges && linked.shieldsAndBadges.length > 0
      ? linked.shieldsAndBadges.map((item) => item.title)
      : linked.badges || [];

  return (
    <div className="space-y-6 font-arabic">
      <div className="p-6 rounded-3xl bg-indigo-600 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-indigo-600/15">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
            👪
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold bg-white/20 text-white border border-white/20 px-2.5 py-0.5 rounded-full">
                {lang === 'ar' ? 'ولي أمر الطالبة:' : 'Parent of:'}
              </span>
              {linked.gradeLevel ? (
                <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  {linked.gradeLevel}
                </span>
              ) : null}
              {linked.section ? (
                <span className="text-[10px] font-bold bg-white/15 text-white border border-white/20 px-2.5 py-0.5 rounded-full">
                  شعبة {linked.section}
                </span>
              ) : null}
              {linked.fromAuthoritativeStudentRecord && typeof linked.gpa === 'number' ? (
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  معدل التميز: {linked.gpa}%
                </span>
              ) : null}
            </div>
            <h2 className="text-xl font-black mt-1 text-white">{linked.studentName || 'طالبة مرتبطة'}</h2>
            <p className="text-xs text-indigo-100">
              {lang === 'ar' ? 'متابعة الأداء الأكاديمي، الحضور والغياب، وسجل التكريم' : 'Academic & attendance parent portal'}
            </p>
            {badgeTitles.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {badgeTitles.slice(0, 3).map((title, idx) => {
                  const theme = getShieldThemeConfig(title);
                  return (
                    <span
                      key={idx}
                      className="text-[10px] font-black bg-slate-950/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm"
                    >
                      <span>{theme.icon}</span>
                      <span>{title}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {linkedStudentRecord ? (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsIdCardModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md transform hover:scale-105 cursor-pointer border border-amber-200"
              title="عرض وطباعة بطاقة الهوية التعريفية لابنتكم المتميزة"
            >
              <Award className="w-4.5 h-4.5 text-slate-950" />
              <span>البطاقة التعريفية والأوسمة 🪪</span>
            </button>
          </div>
        ) : null}
      </div>

      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub prefilteredGrade={linked.gradeLevel} />
      )}

      {activeTab === 'challenges' && <InteractiveChallengesManager />}
      {activeTab === 'graduates' && <GraduatesView />}
      {activeTab === 'certificates' && <StudentCertificateManager />}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <OfficialExamSchedulesManager userRole="parent" />
        </div>
      )}

      {activeTab === 'timetable' && <ParentClassTimetable linked={linked} />}

      {activeTab === 'overview' && <SchoolHomeOverview />}

      {(activeTab === 'overview' || activeTab === 'attendance') && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <span>سجل الحضور والغياب اليومي (تحديث فوري):</span>
              </h3>
            </div>
            {daughterAttendance.length === 0 ? (
              <p className="text-sm text-slate-500">لا تتوفر سجلات حضور لهذه الطالبة المرتبطة حالياً.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المادة الدراسية</th>
                      <th className="p-3">أستاذة المادة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daughterAttendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-slate-600">{att.date}</td>
                        <td className="p-3 font-bold text-slate-900">{att.subject}</td>
                        <td className="p-3 text-slate-700">{att.markedByTeacher}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              att.status === 'حاضرة'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <span>نتائج الامتحانات الإلكترونية المباشرة:</span>
            </h3>
            {daughterSubmissions.length === 0 ? (
              <p className="text-sm text-slate-500">لا تتوفر نتائج امتحانات لهذه الطالبة المرتبطة حالياً.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {daughterSubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{sub.gradeLevel}</span>
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        {sub.score} / {sub.totalPoints} ({sub.percentage}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">تاريخ التسليم: {sub.submittedAt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 font-arabic">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-600" />
              <span>كشف الموقف المالي والرسوم المدرسية للطالبة:</span>
            </h3>
          </div>
          {daughterFinancial.length === 0 ? (
            <p className="text-sm text-slate-500">لا تتوفر بيانات مالية لهذه الطالبة المرتبطة حالياً.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">نوع الرسم</th>
                    <th className="p-3">المبلغ الكلي المستحق</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3 bg-indigo-50/70 text-indigo-900 font-black">المبلغ المتبقي (تلقائي)</th>
                    <th className="p-3">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daughterFinancial.map((fin) => {
                    const remaining = Math.max(0, fin.totalAmount - fin.paidAmount);
                    return (
                      <tr key={fin.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{fin.feeType}</td>
                        <td className="p-3 font-mono text-slate-900 font-bold">{fin.totalAmount.toLocaleString()} IQD</td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">{fin.paidAmount.toLocaleString()} IQD</td>
                        <td className="p-3 font-mono font-bold bg-indigo-50/30">
                          {remaining === 0 ? (
                            <span className="text-emerald-700 font-bold">0 IQD (مكتمل)</span>
                          ) : (
                            <span className="text-amber-700 font-extrabold">{remaining.toLocaleString()} IQD</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              fin.status === 'مكتمل'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : fin.status === 'جزئي'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {fin.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <MessagingSystem embeddedMode={true} />
      )}

      <StudentIDCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        student={linkedStudentRecord}
      />
    </div>
  );
};
