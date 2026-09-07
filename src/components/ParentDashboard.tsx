/**
 * Parent / Guardian Dashboard Component
 * ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { GradeLevel, Student } from '../types';
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
import { getShieldThemeConfig } from '../data/shieldsData';
import { dispatchCustomEvent } from '../utils/events';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileCheck2,
  CircleDollarSign,
  Megaphone,
  AlertOctagon,
  Award,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';

export const ParentDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { currentUser, students, parents, attendance, submissions, financial, announcements, lang, t } = useApp();

  // Find parent's student/daughter dynamically
  const activeParentObj =
    parents.find(
      (p) =>
        (currentUser?.id && p.id === currentUser.id) ||
        (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && p.phone === currentUser.phone)
    ) || currentUser?.parentObj;

  const daughter =
    students.find(
      (s) =>
        (activeParentObj && s.parentEmail.toLowerCase() === activeParentObj.email.toLowerCase()) ||
        (activeParentObj && s.parentPhone === activeParentObj.phone) ||
        (activeParentObj && s.parentName === activeParentObj.name) ||
        (currentUser?.studentObj && s.id === currentUser.studentObj.id)
    ) || students[0] || ({
      id: 'std-1',
      name: 'نغم علي الكعبي',
      nationalId: '1987654321',
      gradeLevel: 'الصف السادس العلمي' as GradeLevel,
      section: 'أ',
      parentName: 'علي الكعبي',
      parentPhone: '07801234567',
      parentEmail: 'parent@maysan.edu.iq',
      gpa: 99.4,
      status: 'منتظمة' as const,
      enrollmentYear: '2022',
      badges: ['⚡ درع تورنغ للمبتكرات الرقمية'],
    } as Student);

  const daughterAttendance = attendance.filter(
    (a) => a.studentId === daughter.id || a.studentName === daughter.name
  );
  const daughterSubmissions = submissions.filter(
    (s) => s.studentId === daughter.id || s.studentName === daughter.name
  );
  const daughterFinancial = financial.filter(
    (f) => f.studentId === daughter.id || f.studentName === daughter.name
  );

  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Daughter Status Banner */}
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
              <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                {daughter.gradeLevel}
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                معدل التميز: {daughter.gpa}%
              </span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white">{daughter.name}</h2>
            <p className="text-xs text-indigo-100">
              {lang === 'ar' ? 'متابعة الأداء الأكاديمي، الحضور والغياب، وسجل التكريم' : 'Academic & attendance parent portal'}
            </p>
            
            {/* Badges preview in Parent Portal */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {((daughter.shieldsAndBadges && daughter.shieldsAndBadges.length > 0)
                ? daughter.shieldsAndBadges.map((s) => s.title)
                : (daughter.badges || [])
              ).slice(0, 3).map((bTitle, idx) => {
                const theme = getShieldThemeConfig(bTitle);
                return (
                  <span
                    key={idx}
                    className="text-[10px] font-black bg-slate-950/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm"
                  >
                    <span>{theme.icon}</span>
                    <span>{bTitle}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

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
      </div>

      {/* Main Switch Tabs */}

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {/* Annual & Daily Curriculum Plans Tab */}
      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub prefilteredGrade={daughter?.gradeLevel} />
      )}

      {/* Challenges & Competitions Tab */}
      {activeTab === 'challenges' && <InteractiveChallengesManager />}

      {/* Graduates Tab */}
      {activeTab === 'graduates' && <GraduatesView />}

      {/* Certificates & Grade Management Tab */}
      {activeTab === 'certificates' && <StudentCertificateManager />}

      {/* Official Exam Schedules Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <OfficialExamSchedulesManager userRole="parent" />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && <SchoolHomeOverview />}

      {/* Overview & Attendance Tab */}
      {(activeTab === 'overview' || activeTab === 'attendance') && (
        <div className="space-y-6">
          
          {/* Attendance Log & Alerts */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <span>سجل الحضور والغياب اليومي (تحديث فوري):</span>
              </h3>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                نسبة الالتزام بالدوام: 100%
              </span>
            </div>

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
          </div>

          {/* Exam Results */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <span>نتائج الامتحانات الإلكترونية المباشرة:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {daughterSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{sub.gradeLevel} - امتحان الفيزياء</span>
                    <span className="font-mono font-black text-indigo-700 text-sm">
                      {sub.score} / {sub.totalPoints} ({sub.percentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">تاريخ التسليم: {sub.submittedAt}</p>
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-700 font-bold flex justify-between">
                    <span>تصحيح تلقائي فورى ✓</span>
                    <span>تنبيهات الغش: {sub.cheatViolationsCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Financial Status Tab */}
      {activeTab === 'financial' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 font-arabic">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-600" />
              <span>كشف الموقف المالي والرسوم المدرسية للطالبة:</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              إجمالي المتبقي: {daughterFinancial.reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.paidAmount), 0).toLocaleString()} IQD
            </span>
          </div>

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
        </div>
      )}

      {/* Messaging / Direct Mail Tab */}
      {activeTab === 'messages' && (
        <MessagingSystem embeddedMode={true} />
      )}

      {/* Official Student ID Card & Shields Modal */}
      <StudentIDCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        student={daughter}
      />

    </div>
  );
};
