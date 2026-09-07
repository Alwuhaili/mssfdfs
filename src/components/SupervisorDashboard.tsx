/**
 * Educational Supervisor Dashboard Component
 * ثانوية ميسان للمتميزات
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { StudentCertificateManager } from './StudentCertificateManager';
import { AcademicCalendarWidget } from './AcademicCalendarWidget';
import { SchoolHomeOverview } from './SchoolHomeOverview';
import { MessagingSystem } from './MessagingSystem';
import { GraduatesView } from './GraduatesView';
import { InteractiveChallengesManager } from './InteractiveChallengesManager';
import { DigitalLibraryHub } from './DigitalLibraryHub';
import { ExamManagementHub } from './ExamManagementHub';
import { PlatformIntegrationsHub } from './PlatformIntegrationsHub';
import { AcademicReportsHub } from './AcademicReportsHub';
import { LessonPlanningHub } from './LessonPlanningHub';
import {
  Building2,
  BarChart3,
  Users,
  Network,
  ShieldCheck,
  CheckCircle2,
  Award,
  BookOpen,
} from 'lucide-react';

export const SupervisorDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { teachers, students, exams, submissions, lang, currentUser, supervisors } = useApp();

  // Determine current active supervisor
  const currentSupervisor =
    currentUser?.supervisorObj ||
    supervisors?.find((s) => s.id === currentUser?.id || s.email === currentUser?.email) ||
    supervisors?.find((s) => s.isPrimary) ||
    supervisors?.[0];

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Supervisor Header */}
      <div className="p-6 rounded-3xl bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-600/15">
        <div className="flex items-center gap-4">
          {currentSupervisor?.avatar ? (
            <img
              src={currentSupervisor.avatar}
              alt={currentSupervisor.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              🏛️
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Building2 className="w-4 h-4" />
              <span>لوحة المشرف الأكاديمي والتربوي — {currentSupervisor?.title || 'وزارة التربية'}</span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white">
              {currentSupervisor?.name || currentUser?.name || 'المشرف التربوي المعتمد'}
            </h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              {currentSupervisor?.specialization ? `التخصص: ${currentSupervisor.specialization} | ` : ''}
              {lang === 'ar' ? 'تدقيق الخطة الدراسية، أداء الهيئة التدريسية، وتقارير الامتحانات الشاملة' : 'Academic supervision & quality audit'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentSupervisor?.isPrimary && (
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Award className="w-4 h-4 text-amber-300" />
              <span>المشرف الاختصاصي العام</span>
            </span>
          )}
          <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-emerald-200 border border-white/20 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>مقياس الجودة: 99.8% (ممتاز)</span>
          </span>
        </div>
      </div>

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && <AcademicCalendarWidget />}

      {/* Annual & Daily Curriculum Plans Auditing Tab */}
      {(activeTab === 'lesson_plans' || activeTab === 'curriculum_plans' || activeTab === 'plans') && (
        <LessonPlanningHub />
      )}

      {/* Challenges & Competitions Tab */}
      {activeTab === 'challenges' && <InteractiveChallengesManager />}

      {/* Messages Tab */}
      {activeTab === 'messages' && <MessagingSystem embeddedMode={true} />}

      {/* Digital Library & Curriculum Management Tab */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <DigitalLibraryHub userRole="supervisor" />
        </div>
      )}

      {/* Graduates Tab */}
      {activeTab === 'graduates' && <GraduatesView />}

      {/* Certificates & Grade Management Tab */}
      {activeTab === 'certificates' && <StudentCertificateManager />}

      {/* Official Exam Management & Auditing Tab */}
      {activeTab === 'exams' && <ExamManagementHub userRole="supervisor" />}

      {/* External LMS & Platforms Integrations Tab */}
      {activeTab === 'integrations' && <PlatformIntegrationsHub userRole="supervisor" />}

      {/* Academic Reports & Statistical Analytics Tab */}
      {activeTab === 'reports' && <AcademicReportsHub userRole="supervisor" />}

      {/* Overview Cards */}
      {(activeTab === 'overview' || !activeTab) && (
        <div className="space-y-6">
          <SchoolHomeOverview />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold">عدد المدرسات الخاضعات للتقييم:</span>
              <h3 className="text-2xl font-black text-slate-900">{teachers.length} مدرسات</h3>
              <span className="text-[10px] text-emerald-700 font-bold block">جميع الخطط معتمدة 100%</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold">عدد الاختبارات الإلكترونية المصححة:</span>
              <h3 className="text-2xl font-black text-indigo-700 font-mono">{submissions.length} اختبـار</h3>
              <span className="text-[10px] text-slate-500 font-bold block">تصحيح تلقائي مع معايير منع الغش</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold">معدل تفوق الطالبات العام:</span>
              <h3 className="text-2xl font-black text-emerald-700 font-mono">98.6%</h3>
              <span className="text-[10px] text-amber-600 font-bold block">لوحة شرف متميزات ميسان</span>
            </div>
          </div>

          {/* Teachers Evaluation */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>سجل تقييم أداء الهيئة التدريسية:</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">اسم أستاذة المادة</th>
                    <th className="p-3.5">التخصص الأكاديمي</th>
                    <th className="p-3.5">الصفوف المكلفة بها</th>
                    <th className="p-3.5">تقييم المشرف التربوي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">{tech.name}</td>
                      <td className="p-3.5 text-slate-700">{tech.subject}</td>
                      <td className="p-3.5 text-slate-600">{tech.assignedGrades.join('، ')}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-600">
                        ⭐⭐⭐⭐⭐ ({tech.rating} / 5.0)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
