import React from 'react';
import { School, Award, Sparkles, Camera, QrCode, CheckCircle2, BookmarkCheck, ShieldCheck } from 'lucide-react';
import { StudentCertificate, SchoolAdminData, UserRole, CertificateModelType } from '../types';
import { useApp } from '../context/AppContext';

interface OfficialCertificateA4TemplateProps {
  cert: StudentCertificate;
  schoolAdminData: SchoolAdminData;
  role: UserRole;
  teacherSubject?: string;
  modelType?: CertificateModelType;
  certLogoFileInputRef?: React.RefObject<HTMLInputElement | null>;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isBatchPrint?: boolean;
}

export const OfficialCertificateA4Template: React.FC<OfficialCertificateA4TemplateProps> = ({
  cert,
  schoolAdminData,
  role,
  teacherSubject = '',
  modelType,
  certLogoFileInputRef,
  onLogoUpload,
  isBatchPrint = false,
}) => {
  const { decisionSettings } = useApp();
  const minPassingGrade = decisionSettings?.minPassingGrade ?? 50;
  const maxResitSubjects = decisionSettings?.maxResitSubjects ?? 3;

  // Determine if student has resit subjects or post-resit status
  const hasResitSubjects = cert.subjects.some((sub) => {
    if (sub.isExempt) return false;
    const grade = sub.finalGrade ?? 0;
    const hasResitValue = sub.resitGrade !== undefined && sub.resitGrade !== null && Number(sub.resitGrade) > 0;
    return grade < minPassingGrade || hasResitValue;
  });

  // Effective model type to render (handling legacy aliases)
  const rawModel =
    modelType ||
    cert.certificateModel ||
    (hasResitSubjects || cert.status === 'مكملة' || cert.status === 'ناجحة بالدور الثاني'
      ? 'model5_makeup_post_resit'
      : 'model4_final_round1');

  const effectiveModel: CertificateModelType =
    rawModel === 'model3_final_round1'
      ? 'model4_final_round1'
      : rawModel === 'model4_makeup_post_resit'
      ? 'model5_makeup_post_resit'
      : rawModel;

  const renderGradeValue = (val: number | null | undefined, customClass = '', suffix = '') => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return <span className="text-slate-400 font-normal">-</span>;
    }
    const num = Number(val);
    const isPassing = num >= 50;
    
    if (!isPassing) {
      // Remove any conflicting text color classes to guarantee it renders in prominent RED with an underline
      const sanitizedClass = customClass
        .replace(/text-[a-z0-9\/-]+/g, '')
        .replace(/bg-[a-z0-9\/-]+/g, '')
        .trim();

      return (
        <span
          className={`text-red-600 font-black underline decoration-red-600 decoration-2 underline-offset-2 inline-block ${sanitizedClass}`}
          title="درجة راسبة / إكمال (أقل من 50)"
        >
          {num}
          {suffix}
        </span>
      );
    }

    return (
      <span className={`${customClass ? customClass : 'text-slate-900 font-bold'}`}>
        {num}
        {suffix}
      </span>
    );
  };

  const getSubjectAppreciation = (grade: number | null | undefined): string => {
    if (grade === null || grade === undefined || isNaN(Number(grade))) return '-';
    const num = Number(grade);
    if (num >= 90) return 'امتياز';
    if (num >= 80) return 'جيد جداً';
    if (num >= 70) return 'جيد';
    if (num >= 60) return 'متوسط';
    if (num >= 50) return 'مقبول';
    return 'راسبة';
  };

  // First Term Result Calculation:
  // - 0 subjects < 50 => ناجحة
  // - 1..3 subjects < 50 => مكملة (مكملة بدرس واحد / بدرسين / بثلاث دروس)
  // - >= 4 subjects < 50 => راسبة
  const getFirstTermResult = () => {
    const subjects = cert.subjects || [];
    const failedSubjects = subjects.filter((s) => {
      const grade = s.firstTermAvg;
      return grade !== null && grade !== undefined && Number(grade) < 50;
    });
    const failedCount = failedSubjects.length;

    if (failedCount === 0) {
      return {
        status: 'ناجحة',
        statusTitle: 'ناجحة',
        statusDetail: 'ناجحة بالفصل الأول',
        failedCount: 0,
        failedSubjects: [] as string[],
        badgeClass: 'bg-emerald-200 text-emerald-950 border border-emerald-300',
        bannerStatus: 'ناجحة بالفصل الأول 🌟',
        bannerBadgeClass: 'text-emerald-300 font-extrabold',
        appreciation: getSubjectAppreciation(cert.overallFirstTermAvg),
      };
    } else if (failedCount >= 1 && failedCount <= 3) {
      let detail = 'مكملة بدرس واحد';
      if (failedCount === 2) detail = 'مكملة بدرسين';
      else if (failedCount === 3) detail = 'مكملة بثلاث دروس';

      return {
        status: 'مكملة',
        statusTitle: 'مكملة',
        statusDetail: detail,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-amber-200 text-amber-950 border border-amber-300',
        bannerStatus: `${detail} (${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-amber-300 font-extrabold',
        appreciation: 'إكمال',
      };
    } else {
      return {
        status: 'راسبة',
        statusTitle: 'راسبة',
        statusDetail: `راسبة بالفصل الأول (${failedCount} مواد)`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-rose-200 text-rose-950 border border-rose-300',
        bannerStatus: `راسبة بالفصل الأول (في ${failedCount} مواد: ${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-rose-300 font-extrabold',
        appreciation: 'رسوب',
      };
    }
  };

  // Mid Year Result Calculation:
  // - 0 subjects < 50 => ناجحة
  // - 1..3 subjects < 50 => مكملة (مكملة بدرس واحد / بدرسين / بثلاث دروس)
  // - >= 4 subjects < 50 => راسبة
  const getMidYearResult = () => {
    const subjects = cert.subjects || [];
    const failedSubjects = subjects.filter((s) => {
      const grade = s.midYearGrade;
      return grade !== null && grade !== undefined && Number(grade) < 50;
    });
    const failedCount = failedSubjects.length;

    if (failedCount === 0) {
      return {
        status: 'ناجحة',
        statusTitle: 'ناجحة',
        statusDetail: 'ناجحة بنصف السنة',
        failedCount: 0,
        failedSubjects: [] as string[],
        badgeClass: 'bg-emerald-200 text-emerald-950 border border-emerald-300',
        bannerStatus: 'ناجحة بنصف السنة 🌟',
        bannerBadgeClass: 'text-emerald-300 font-extrabold',
        appreciation: getSubjectAppreciation(cert.overallMidYearGrade),
      };
    } else if (failedCount >= 1 && failedCount <= 3) {
      let detail = 'مكملة بدرس واحد';
      if (failedCount === 2) detail = 'مكملة بدرسين';
      else if (failedCount === 3) detail = 'مكملة بثلاث دروس';

      return {
        status: 'مكملة',
        statusTitle: 'مكملة',
        statusDetail: detail,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-amber-200 text-amber-950 border border-amber-300',
        bannerStatus: `${detail} (${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-amber-300 font-extrabold',
        appreciation: 'إكمال',
      };
    } else {
      return {
        status: 'راسبة',
        statusTitle: 'راسبة',
        statusDetail: `راسبة بنصف السنة (${failedCount} مواد)`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-rose-200 text-rose-950 border border-rose-300',
        bannerStatus: `راسبة بنصف السنة (في ${failedCount} مواد: ${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-rose-300 font-extrabold',
        appreciation: 'رسوب',
      };
    }
  };

  // Annual Saei Result Calculation:
  // - 0 subjects < 50 => ناجحة
  // - 1..3 subjects < 50 => مكملة (مكملة بدرس واحد / بدرسين / بثلاث دروس)
  // - >= 4 subjects < 50 => راسبة
  const getAnnualSaeiResult = () => {
    const subjects = cert.subjects || [];
    const failedSubjects = subjects.filter((s) => {
      const saei =
        s.annualSaeiAvg !== undefined && s.annualSaeiAvg !== null && s.annualSaeiAvg > 0
          ? s.annualSaeiAvg
          : Math.round(((s.firstTermAvg || 0) + (s.midYearGrade || 0) + (s.secondTermAvg || 0)) / 3);
      return saei < 50;
    });
    const failedCount = failedSubjects.length;

    if (failedCount === 0) {
      let statusDetail = 'ناجحة بالسعي السنوي';
      if (cert.exemptionType === 'general') statusDetail = 'معفاة إعفاء عام 🌟';
      else if (cert.exemptionType === 'individual') statusDetail = `معفاة فردي (${cert.exemptSubjectsCount || 0} مواد)`;

      return {
        status: 'ناجحة',
        statusTitle: 'ناجحة',
        statusDetail,
        failedCount: 0,
        failedSubjects: [] as string[],
        badgeClass: 'bg-blue-200 text-blue-950 border border-blue-300',
        bannerStatus: cert.exemptionType === 'general' ? 'معفاة إعفاء عام 🌟' : 'ناجحة بالسعي السنوي ومؤهلة للامتحان النهائي ✨',
        bannerBadgeClass: 'text-emerald-300 font-extrabold',
        appreciation: getSubjectAppreciation(cert.overallAnnualSaeiAvg),
      };
    } else if (failedCount >= 1 && failedCount <= 3) {
      let detail = 'مكملة بدرس واحد';
      if (failedCount === 2) detail = 'مكملة بدرسين';
      else if (failedCount === 3) detail = 'مكملة بثلاث دروس';

      return {
        status: 'مكملة',
        statusTitle: 'مكملة',
        statusDetail: detail,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-amber-200 text-amber-950 border border-amber-300',
        bannerStatus: `${detail} بالسعي السنوي (${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-amber-300 font-extrabold',
        appreciation: 'إكمال',
      };
    } else {
      return {
        status: 'راسبة',
        statusTitle: 'راسبة',
        statusDetail: `راسبة بالسعي السنوي (${failedCount} مواد)`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-rose-200 text-rose-950 border border-rose-300',
        bannerStatus: `راسبة بالسعي السنوي (في ${failedCount} مواد: ${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-rose-300 font-extrabold',
        appreciation: 'رسوب',
      };
    }
  };

  // Final Round 1 Result Calculation (النموذج الرابع: الشهادة النهائية - الدور الأول):
  // - 0 subjects < minPassingGrade => ناجحة (مع دعم شارة بالقرار إذا تم استخدام درجات القرار)
  // - 1..maxResitSubjects => مكملة (مكملة بدرس واحد / بدرسين / بثلاث دروس)
  // - > maxResitSubjects => راسبة
  const getFinalRound1Result = () => {
    const subjects = cert.subjects || [];
    const failedSubjects = subjects.filter((s) => {
      const grade = s.finalGrade !== undefined && s.finalGrade !== null ? s.finalGrade : 0;
      return grade < minPassingGrade;
    });
    const failedCount = failedSubjects.length;
    const hasDecision = (cert.hasDecisionMarks && (cert.decisionMarksUsed || 0) > 0) || subjects.some((s) => (s.decisionMarks || 0) > 0);
    const totalDecisionMarks = cert.decisionMarksUsed || subjects.reduce((acc, s) => acc + (s.decisionMarks || 0), 0);

    if (failedCount === 0) {
      const isPassedByDecision = hasDecision && (cert.originalStatus === 'مكملة' || cert.originalStatus === 'راسبة' || totalDecisionMarks > 0);
      return {
        status: 'ناجحة',
        statusTitle: 'ناجحة',
        statusDetail: isPassedByDecision ? `ناجحة بالدور الأول (بالقرار: +${totalDecisionMarks})` : 'ناجحة بالدور الأول',
        failedCount: 0,
        failedSubjects: [] as string[],
        badgeClass: 'bg-emerald-200 text-emerald-950 border border-emerald-300',
        bannerStatus: isPassedByDecision ? `ناجحة بالدور الأول (بالقرار الوزاري 🌟 +${totalDecisionMarks} د)` : 'ناجحة بالدور الأول 🌟',
        bannerBadgeClass: 'text-emerald-400 font-extrabold',
        appreciation: getSubjectAppreciation(cert.overallFinalGrade),
      };
    } else if (failedCount >= 1 && failedCount <= maxResitSubjects) {
      let detail = 'مكملة بدرس واحد';
      if (failedCount === 2) detail = 'مكملة بدرسين';
      else if (failedCount === 3) detail = 'مكملة بثلاث دروس';
      else detail = `مكملة بـ (${failedCount}) دروس`;

      const isHelpedByDecision = hasDecision && cert.originalStatus === 'راسبة';

      return {
        status: 'مكملة',
        statusTitle: 'مكملة',
        statusDetail: isHelpedByDecision ? `${detail} (بالقرار)` : detail,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-amber-200 text-amber-950 border border-amber-300',
        bannerStatus: isHelpedByDecision
          ? `${detail} بالدور الأول بالقرار الوزاري (${failedSubjects.map((s) => s.subjectName).join('، ')})`
          : `${detail} بالدور الأول (${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-amber-300 font-extrabold',
        appreciation: 'إكمال',
      };
    } else {
      return {
        status: 'راسبة',
        statusTitle: 'راسبة',
        statusDetail: `راسبة بالدور الأول (${failedCount} مواد)`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-rose-200 text-rose-950 border border-rose-300',
        bannerStatus: `راسبة بالدور الأول (في ${failedCount} مواد: ${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-rose-300 font-extrabold',
        appreciation: 'رسوب',
      };
    }
  };

  // Model 5: Post-Resit (بعد الإكمال / الدور الثاني) Result Calculation:
  // - 0 subjects < minPassingGrade in post-resit grades => ناجحة (ناجحة بالدور الثاني / بعد الإكمال)
  // - 1..maxResitSubjects => مكملة (مكملة بعد الإكمال)
  // - > maxResitSubjects => راسبة (راسبة بعد الإكمال)
  const getPostResitResult = () => {
    const subjects = cert.subjects || [];
    const failedSubjects = subjects.filter((s) => {
      const effectiveGrade =
        s.postResitGrade !== undefined && s.postResitGrade !== null
          ? s.postResitGrade
          : s.finalGrade !== undefined && s.finalGrade !== null
          ? s.finalGrade
          : 0;
      return effectiveGrade < minPassingGrade;
    });
    const failedCount = failedSubjects.length;
    const effectiveAvg = cert.overallPostResitAvg ?? cert.overallFinalGrade;
    const hasDecision = (cert.hasDecisionMarks && (cert.decisionMarksUsed || 0) > 0) || subjects.some((s) => (s.decisionMarks || 0) > 0);

    if (failedCount === 0) {
      return {
        status: 'ناجحة',
        statusTitle: 'ناجحة',
        statusDetail: 'ناجحة بالدور الثاني (بعد الإكمال)',
        failedCount: 0,
        failedSubjects: [] as string[],
        badgeClass: 'bg-emerald-200 text-emerald-950 border border-emerald-300',
        bannerStatus: 'ناجحة بالدور الثاني (بعد الإكمال) ✨',
        bannerBadgeClass: 'text-emerald-400 font-extrabold',
        appreciation: getSubjectAppreciation(effectiveAvg),
      };
    } else if (failedCount >= 1 && failedCount <= maxResitSubjects) {
      let detail = 'مكملة بدرس واحد';
      if (failedCount === 2) detail = 'مكملة بدرسين';
      else if (failedCount === 3) detail = 'مكملة بثلاث دروس';
      else detail = `مكملة بـ (${failedCount}) دروس`;

      return {
        status: 'مكملة',
        statusTitle: 'مكملة',
        statusDetail: `${detail} بعد الإكمال`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-amber-200 text-amber-950 border border-amber-300',
        bannerStatus: `${detail} بعد الإكمال (${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-amber-300 font-extrabold',
        appreciation: 'إكمال',
      };
    } else {
      return {
        status: 'راسبة',
        statusTitle: 'راسبة',
        statusDetail: `راسبة بعد الإكمال (${failedCount} مواد)`,
        failedCount,
        failedSubjects: failedSubjects.map((s) => s.subjectName),
        badgeClass: 'bg-rose-200 text-rose-950 border border-rose-300',
        bannerStatus: `راسبة بعد الإكمال (في ${failedCount} مواد: ${failedSubjects.map((s) => s.subjectName).join('، ')})`,
        bannerBadgeClass: 'text-rose-300 font-extrabold',
        appreciation: 'رسوب',
      };
    }
  };

  const getOverallTermStatus = (avg: number | null | undefined, termTitle: string) => {
    if (avg === null || avg === undefined || isNaN(Number(avg))) {
      return {
        statusText: 'قيد التدقيق',
        appreciation: '-',
        isPassing: true,
      };
    }
    const num = Number(avg);
    const appreciation = getSubjectAppreciation(num);
    const isPassing = num >= 50;
    return {
      statusText: isPassing ? `ناجحة ب${termTitle}` : `راسبة ب${termTitle}`,
      appreciation,
      isPassing,
    };
  };

  // Header Title based on the active model
  const getCertificateTitle = () => {
    switch (effectiveModel) {
      case 'model1_first_term':
        return 'الشهادة المدرسية - معدل درجات الفصل الاول';
      case 'model2_mid_year':
        return 'الشهادة المدرسية - معدل درجات الفصل الاول ودرجات نصف السنة';
      case 'model3_annual_saei':
        return 'الشهادة المدرسية - السعي السنوي';
      case 'model4_final_round1':
      case 'model5_makeup_post_resit':
      default:
        return 'الشهادة المدرسية';
    }
  };

  return (
    <div
      className={`a4-cert-page bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-300 max-w-4xl mx-auto space-y-4 print:shadow-none print:border-none print:p-2 print:m-0 font-arabic relative overflow-hidden box-border model-${effectiveModel}`}
    >
      {/* Header Crest */}
      <div className="border-b-4 border-double border-slate-800 pb-3 text-center space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-2">
          {/* Right Header Text */}
          <div className="text-right space-y-0.5">
            <p className="font-extrabold text-sm">جمهورية العراق</p>
            <p>وزارة التربية</p>
            <p>المديرية العامة لتربية ميسان</p>
            <p className="text-indigo-950 font-extrabold">{schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}</p>
          </div>

          {/* School Logo & English Name */}
          <div className="text-center space-y-1">
            {certLogoFileInputRef && onLogoUpload && (
              <input
                ref={certLogoFileInputRef}
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="hidden"
              />
            )}
            <div
              onClick={() => certLogoFileInputRef?.current?.click()}
              className={`relative group inline-block ${certLogoFileInputRef ? 'cursor-pointer' : ''}`}
              title={certLogoFileInputRef ? 'اضغط لتغيير شعار المدرسة من جهازك' : ''}
            >
              {Boolean(schoolAdminData.schoolLogoUrl && schoolAdminData.schoolLogoUrl.trim()) ? (
                <img
                  src={schoolAdminData.schoolLogoUrl}
                  alt="شعار المدرسة"
                  className="w-16 h-16 mx-auto rounded-2xl object-contain border-2 border-amber-400 p-0.5 shadow-md bg-white group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl border-2 border-amber-400 shadow-md">
                  م
                </div>
              )}
              {certLogoFileInputRef && (
                <div className="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
                  <Camera className="w-5 h-5 text-amber-300" />
                </div>
              )}
            </div>
            {/* English School Name Under Logo */}
            <span className="text-[10px] tracking-wider uppercase font-mono text-slate-600 font-bold block">
              {schoolAdminData.schoolNameEn || 'Maysan High School for Gifted Girls'}
            </span>
          </div>

          {/* Left Header Info */}
          <div className="text-left space-y-0.5">
            <p>العام الدراسي: <span className="font-mono">{cert.academicYear || schoolAdminData.academicYearDefault || '2026 - 2027'}</span></p>
            <p>الرقم الإحصائي: <span className="font-mono">{cert.nationalId || schoolAdminData.statisticalNumberDefault || '2026/MS/8890'}</span></p>
            <p>التاريخ: <span className="font-mono">{cert.issueDate || schoolAdminData.issueDateDefault || '2027-06-25'}</span></p>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="mt-2 pt-2 border-t border-slate-300">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
            {getCertificateTitle()}
          </h2>
          {effectiveModel === 'model1_first_term' && (
            <p className="text-xs text-indigo-900 font-bold mt-0.5">
              كشف درجات ومعدلات الفصل الدراسي الأول
            </p>
          )}
          {effectiveModel === 'model2_mid_year' && (
            <p className="text-xs text-teal-900 font-bold mt-0.5">
              كشف درجات ومعدلات الفصل الأول وامتحانات نصف السنة
            </p>
          )}
          {effectiveModel === 'model3_annual_saei' && (
            <p className="text-xs text-blue-900 font-bold mt-0.5">
              كشف درجات ومعدلات السعي السنوي
            </p>
          )}
          {effectiveModel === 'model4_final_round1' && (
            <p className="text-xs text-slate-800 font-bold mt-0.5">
              النتيجة النهائية (الدور الأول)
            </p>
          )}
          {effectiveModel === 'model5_makeup_post_resit' && (
            <p className="text-xs text-slate-800 font-bold mt-0.5">
              النتيجة النهائية وما بعد الإكمال (الدور الثاني)
            </p>
          )}
        </div>
      </div>

      {/* Student Metadata Box */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 grid grid-cols-4 gap-3 text-xs font-bold">
        <div>
          <span className="text-slate-500 block text-[10px]">اسم الطالبة الرباعي واللقب:</span>
          <span className="text-sm text-slate-900 font-extrabold">{cert.studentName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">الصف الدراسي:</span>
          <span className="text-sm text-slate-900 font-extrabold">{cert.gradeLevel}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">الشعبة والفرع:</span>
          <span className="text-sm text-slate-900 font-extrabold">الفرع العلمي ({cert.section || 'أ'})</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">
            {effectiveModel === 'model1_first_term'
              ? 'النتيجة (الفصل الأول):'
              : effectiveModel === 'model2_mid_year'
              ? 'النتيجة (نصف السنة):'
              : effectiveModel === 'model3_annual_saei'
              ? 'النتيجة (السعي السنوي):'
              : 'النتيجة النهائية:'}
          </span>
          {effectiveModel === 'model1_first_term' ? (
            (() => {
              const firstTermRes = getFirstTermResult();
              return (
                <span
                  className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${firstTermRes.badgeClass}`}
                >
                  {firstTermRes.statusDetail}{' '}
                  {firstTermRes.status === 'ناجحة' && firstTermRes.appreciation && firstTermRes.appreciation !== '-'
                    ? `(${firstTermRes.appreciation})`
                    : ''}
                </span>
              );
            })()
          ) : effectiveModel === 'model2_mid_year' ? (
            (() => {
              const midRes = getMidYearResult();
              return (
                <span
                  className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${midRes.badgeClass}`}
                >
                  {midRes.statusDetail}{' '}
                  {midRes.status === 'ناجحة' && midRes.appreciation && midRes.appreciation !== '-'
                    ? `(${midRes.appreciation})`
                    : ''}
                </span>
              );
            })()
          ) : effectiveModel === 'model3_annual_saei' ? (
            (() => {
              const saeiRes = getAnnualSaeiResult();
              return (
                <span
                  className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${saeiRes.badgeClass}`}
                >
                  {saeiRes.statusDetail}{' '}
                  {saeiRes.status === 'ناجحة' && saeiRes.appreciation && saeiRes.appreciation !== '-'
                    ? `(${saeiRes.appreciation})`
                    : ''}
                </span>
              );
            })()
          ) : effectiveModel === 'model4_final_round1' ? (
            (() => {
              const finalRes = getFinalRound1Result();
              return (
                <span
                  className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${finalRes.badgeClass}`}
                >
                  {finalRes.statusDetail}{' '}
                  {finalRes.status === 'ناجحة' && finalRes.appreciation && finalRes.appreciation !== '-'
                    ? `(${finalRes.appreciation})`
                    : ''}
                </span>
              );
            })()
          ) : effectiveModel === 'model5_makeup_post_resit' ? (
            (() => {
              const postRes = getPostResitResult();
              return (
                <span
                  className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${postRes.badgeClass}`}
                >
                  {postRes.statusDetail}{' '}
                  {postRes.status === 'ناجحة' && postRes.appreciation && postRes.appreciation !== '-'
                    ? `(${postRes.appreciation})`
                    : ''}
                </span>
              );
            })()
          ) : (
            <span
              className={`inline-block px-3 py-0.5 rounded-md text-xs font-extrabold ${
                cert.status.includes('ناجحة')
                  ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                  : cert.status === 'مكملة'
                  ? 'bg-amber-200 text-amber-950 border border-amber-300'
                  : 'bg-rose-200 text-rose-950 border border-rose-300'
              }`}
            >
              {cert.status}{' '}
              {cert.status !== 'مكملة' && !cert.status.includes('مكمل') && cert.status !== 'راسبة' && cert.appreciation
                ? `(${cert.appreciation})`
                : ''}
            </span>
          )}
        </div>

        {/* Exemption Status Badges for Annual Saei and Final Models */}
        {(effectiveModel === 'model3_annual_saei' || effectiveModel === 'model4_final_round1' || effectiveModel === 'model5_makeup_post_resit') && (
          <>
            {cert.exemptionType === 'general' && (
              <div className="col-span-4 bg-emerald-100/90 border border-emerald-300 rounded-lg p-2.5 flex items-center justify-between text-emerald-950 font-black">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>قرار اللجنة الامتحانية: الطالبة مشمولة بالنظام الوزاري للإعفاء العام في كافة المواد الدراسية</span>
                </div>
                <span className="bg-emerald-800 text-white px-3 py-0.5 rounded-md text-xs font-bold shadow-2xs">
                  معفاة إعفاء عام
                </span>
              </div>
            )}
            {cert.exemptionType === 'individual' && (
              <div className="col-span-4 bg-teal-50 border border-teal-300 rounded-lg p-2.5 flex items-center justify-between text-teal-950 font-bold">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-700 shrink-0" />
                  <span>قرار اللجنة الامتحانية: الطالبة مشمولة بالإعفاء الفردي في ({cert.exemptSubjectsCount}) مواد دراسية (درجة السعي 90% فأكثر)</span>
                </div>
                <span className="bg-teal-800 text-white px-3 py-0.5 rounded-md text-xs font-bold shadow-2xs">
                  إعفاء فردي
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODEL 1: FIRST TERM AVERAGE ONLY (النموذج الأول)         */}
      {/* ========================================================= */}
      {effectiveModel === 'model1_first_term' && (
        <div className="space-y-3">
          <div className="overflow-hidden border-2 border-indigo-900 rounded-xl shadow-xs">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-950 text-white font-extrabold border-b-2 border-indigo-900">
                  <th className="p-2.5 border-l border-indigo-800 w-12 text-center">ت</th>
                  <th className="p-2.5 border-l border-indigo-800 text-right pr-4">المادة الدراسية</th>
                  <th className="p-2.5 border-l border-indigo-800 w-36 text-center">معدل درجة الفصل الأول</th>
                  <th className="p-2.5 border-l border-indigo-800 w-36 text-center">التقدير</th>
                  <th className="p-2.5 text-right pr-4">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {cert.subjects.map((sub, idx) => {
                  const isTeacherSubject =
                    role !== 'teacher' ||
                    sub.subjectName.toLowerCase().trim().includes(teacherSubject.toLowerCase().trim()) ||
                    teacherSubject.toLowerCase().trim().includes(sub.subjectName.toLowerCase().trim());
                  const appreciation = getSubjectAppreciation(sub.firstTermAvg);

                  return (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/20'}>
                      <td className="p-2.5 border-l border-slate-200 font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 text-right font-bold pr-4 text-slate-900">
                        {sub.subjectName}
                        {!isTeacherSubject && (
                          <span className="text-[10px] text-amber-700 font-normal mr-2">
                            (محجوبة للسرية)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 font-mono text-base font-extrabold text-indigo-950">
                        {isTeacherSubject ? renderGradeValue(sub.firstTermAvg, 'font-black text-indigo-950') : '🔒'}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 font-bold">
                        {isTeacherSubject ? (
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs ${
                              sub.firstTermAvg >= 90
                                ? 'bg-emerald-100 text-emerald-900 font-black'
                                : sub.firstTermAvg >= 75
                                ? 'bg-indigo-100 text-indigo-900'
                                : sub.firstTermAvg >= 50
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-rose-100 text-rose-900 font-bold'
                            }`}
                          >
                            {appreciation}
                          </span>
                        ) : (
                          '🔒'
                        )}
                      </td>
                      <td className="p-2.5 text-right pr-4 text-[11px] text-slate-600">
                        {sub.notes || (sub.firstTermAvg >= 90 ? 'متميزة ومواظبة' : 'مستمرة')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const firstTermRes = getFirstTermResult();
                  const hasFailedSubject = firstTermRes.failedCount > 0;
                  return (
                    <tr className="bg-indigo-950 text-white font-extrabold border-t-2 border-indigo-900">
                      <td colSpan={2} className="p-3 text-right pr-4 border-l border-indigo-800 font-black text-white text-sm">
                        المعدل العام للفصل الأول:
                      </td>
                      <td className="p-3 border-l border-indigo-800 font-mono text-center">
                        {hasFailedSubject ? (
                          <span className="text-rose-300 font-bold text-xs">
                            {firstTermRes.failedCount >= 4 ? 'لا يُحسب (يوجد رسوب)' : 'لا يُحسب (يوجد إكمال)'}
                          </span>
                        ) : (
                          renderGradeValue(cert.overallFirstTermAvg, 'text-amber-300 font-black text-lg', '%')
                        )}
                      </td>
                      <td colSpan={2} className="p-3 text-right pr-4 text-xs font-bold text-indigo-200">
                        التقدير العام للفصل الأول:{' '}
                        <strong className="text-amber-300 font-black mr-1 text-sm">
                          {hasFailedSubject ? '-' : getSubjectAppreciation(cert.overallFirstTermAvg)}
                        </strong>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Model 1 Appreciation Banner */}
          {(() => {
            const firstTermRes = getFirstTermResult();
            const hasFailedSubject = firstTermRes.failedCount > 0;
            return (
              <div className="bg-indigo-900 text-white p-3.5 rounded-xl flex items-center justify-between border border-indigo-800 shadow-sm">
                <div>
                  <span className="text-indigo-200 text-xs block font-semibold">معدل الفصل الأول الكلي:</span>
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {hasFailedSubject ? '-' : `${cert.overallFirstTermAvg || 0}%`}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-indigo-200 text-xs block font-semibold">التقدير:</span>
                  <span className="text-lg font-bold text-white">
                    {hasFailedSubject ? '-' : getSubjectAppreciation(cert.overallFirstTermAvg)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-indigo-200 text-xs block font-semibold">النتيجة في الفصل الأول:</span>
                  <span className={`text-sm font-extrabold ${firstTermRes.bannerBadgeClass}`}>
                    {firstTermRes.bannerStatus}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODEL 2: FIRST TERM + MID-YEAR ONLY (النموذج الثاني)      */}
      {/* ========================================================= */}
      {effectiveModel === 'model2_mid_year' && (
        <div className="space-y-3">
          <div className="overflow-hidden border-2 border-teal-900 rounded-xl shadow-xs">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-teal-950 text-white font-extrabold border-b-2 border-teal-900">
                  <th className="p-2.5 border-l border-teal-800 w-12 text-center">ت</th>
                  <th className="p-2.5 border-l border-teal-800 text-right pr-4">المادة الدراسية</th>
                  <th className="p-2.5 border-l border-teal-800 w-32 text-center">معدل الفصل الأول</th>
                  <th className="p-2.5 border-l border-teal-800 w-32 text-center">درجة نصف السنة</th>
                  <th className="p-2.5 border-l border-teal-800 w-28 text-center">التقدير</th>
                  <th className="p-2.5 text-right pr-4">الملاحظات والنتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {cert.subjects.map((sub, idx) => {
                  const isTeacherSubject =
                    role !== 'teacher' ||
                    sub.subjectName.toLowerCase().trim().includes(teacherSubject.toLowerCase().trim()) ||
                    teacherSubject.toLowerCase().trim().includes(sub.subjectName.toLowerCase().trim());
                  const appreciation = getSubjectAppreciation(sub.midYearGrade);

                  return (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/20'}>
                      <td className="p-2.5 border-l border-slate-200 font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 text-right font-bold pr-4 text-slate-900">
                        {sub.subjectName}
                        {!isTeacherSubject && (
                          <span className="text-[10px] text-amber-700 font-normal mr-2">
                            (محجوبة للسرية)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {isTeacherSubject ? renderGradeValue(sub.firstTermAvg) : '🔒'}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 font-mono text-base font-extrabold text-teal-950">
                        {isTeacherSubject ? renderGradeValue(sub.midYearGrade, 'font-black text-teal-950') : '🔒'}
                      </td>
                      <td className="p-2.5 border-l border-slate-200 font-bold">
                        {isTeacherSubject ? (
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs ${
                              sub.midYearGrade >= 90
                                ? 'bg-emerald-100 text-emerald-900 font-black'
                                : sub.midYearGrade >= 75
                                ? 'bg-teal-100 text-teal-900'
                                : sub.midYearGrade >= 50
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-rose-100 text-rose-900 font-bold'
                            }`}
                          >
                            {appreciation}
                          </span>
                        ) : (
                          '🔒'
                        )}
                      </td>
                      <td className="p-2.5 text-right pr-4 text-[11px] text-slate-600">
                        {sub.midYearGrade >= 50 ? (
                          <span className="text-emerald-700 font-bold">ناجحة بنصف السنة</span>
                        ) : (
                          <span className="text-rose-700 font-bold">مكملة / راسبة</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const midRes = getMidYearResult();
                  const hasFailedMid = midRes.failedCount > 0;
                  const firstTermRes = getFirstTermResult();
                  const hasFailedTerm1 = firstTermRes.failedCount > 0;

                  return (
                    <tr className="bg-teal-950 text-white font-extrabold border-t-2 border-teal-900">
                      <td colSpan={2} className="p-3 text-right pr-4 border-l border-teal-800 font-black text-white text-sm">
                        المعدل العام الكلي:
                      </td>
                      <td className="p-3 border-l border-teal-800 font-mono text-center">
                        {hasFailedTerm1 ? (
                          <span className="text-amber-200 font-bold text-xs" title="يوجد إكمال بالفصل الأول">-</span>
                        ) : (
                          renderGradeValue(cert.overallFirstTermAvg, 'text-amber-300 font-black text-sm', '%')
                        )}
                      </td>
                      <td className="p-3 border-l border-teal-800 font-mono text-center">
                        {hasFailedMid ? (
                          <span className="text-rose-300 font-bold text-xs">
                            {midRes.failedCount >= 4 ? 'لا يُحسب (يوجد رسوب)' : 'لا يُحسب (يوجد إكمال)'}
                          </span>
                        ) : (
                          renderGradeValue(cert.overallMidYearGrade, 'text-yellow-300 font-black text-base', '%')
                        )}
                      </td>
                      <td colSpan={2} className="p-3 text-right pr-4 text-xs font-bold text-teal-200">
                        التقدير العام لنصف السنة:{' '}
                        <strong className="text-yellow-300 font-black mr-1 text-sm">
                          {hasFailedMid ? '-' : getSubjectAppreciation(cert.overallMidYearGrade)}
                        </strong>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Model 2 Appreciation Banner */}
          {(() => {
            const midRes = getMidYearResult();
            const hasFailedMid = midRes.failedCount > 0;

            return (
              <div className="bg-teal-950 text-white p-3.5 rounded-xl flex items-center justify-between border border-teal-900 shadow-sm">
                <div>
                  <span className="text-teal-200 text-xs block font-semibold">معدل امتحانات نصف السنة:</span>
                  <span className="text-2xl font-black text-yellow-300 font-mono">
                    {hasFailedMid ? '-' : `${cert.overallMidYearGrade || 0}%`}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-teal-200 text-xs block font-semibold">التقدير:</span>
                  <span className="text-lg font-bold text-white">
                    {hasFailedMid ? '-' : getSubjectAppreciation(cert.overallMidYearGrade)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-teal-200 text-xs block font-semibold">نتيجة نصف السنة:</span>
                  <span className={`text-sm font-extrabold ${midRes.bannerBadgeClass}`}>
                    {midRes.bannerStatus}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODEL 3: ANNUAL SAEI (النموذج الثالث: السعي السنوي)       */}
      {/* ========================================================= */}
      {effectiveModel === 'model3_annual_saei' && (
        <div className="space-y-3">
          <div className="overflow-hidden border-2 border-blue-900 rounded-xl shadow-xs">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-blue-950 text-white font-extrabold border-b-2 border-blue-900">
                  <th className="p-2 border-l border-blue-800 w-10 text-center">ت</th>
                  <th className="p-2 border-l border-blue-800 text-right pr-3">المادة الدراسية</th>
                  <th className="p-2 border-l border-blue-800 w-24 text-center">معدل الفصل 1</th>
                  <th className="p-2 border-l border-blue-800 w-24 text-center">نصف السنة</th>
                  <th className="p-2 border-l border-blue-800 w-24 text-center">معدل الفصل 2</th>
                  <th className="p-2 border-l border-blue-800 w-28 text-center">السعي السنوي</th>
                  <th className="p-2 border-l border-blue-800 w-24 text-center">التقدير</th>
                  <th className="p-2 text-right pr-3">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {cert.subjects.map((sub, idx) => {
                  const isTeacherSubject =
                    role !== 'teacher' ||
                    sub.subjectName.toLowerCase().trim().includes(teacherSubject.toLowerCase().trim()) ||
                    teacherSubject.toLowerCase().trim().includes(sub.subjectName.toLowerCase().trim());
                  
                  // حساب السعي السنوي تلقائياً
                  const saei =
                    sub.annualSaeiAvg !== undefined && sub.annualSaeiAvg !== null && sub.annualSaeiAvg > 0
                      ? sub.annualSaeiAvg
                      : Math.round(((sub.firstTermAvg || 0) + (sub.midYearGrade || 0) + (sub.secondTermAvg || 0)) / 3);
                  
                  const appreciation = getSubjectAppreciation(saei);

                  return (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'}>
                      <td className="p-2 border-l border-slate-200 font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-l border-slate-200 text-right font-bold pr-3 text-slate-900">
                        {sub.subjectName}
                        {!isTeacherSubject && (
                          <span className="text-[10px] text-amber-700 font-normal mr-2">
                            (محجوبة للسرية)
                          </span>
                        )}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {isTeacherSubject ? renderGradeValue(sub.firstTermAvg) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {isTeacherSubject ? renderGradeValue(sub.midYearGrade) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {isTeacherSubject ? renderGradeValue(sub.secondTermAvg) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {isTeacherSubject ? renderGradeValue(saei) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-bold">
                        {isTeacherSubject ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              saei >= 90
                                ? 'bg-emerald-100 text-emerald-900 font-black'
                                : saei >= 75
                                ? 'bg-blue-100 text-blue-900 font-bold'
                                : saei >= 50
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-rose-100 text-rose-900 font-bold'
                            }`}
                          >
                            {appreciation}
                          </span>
                        ) : (
                          '🔒'
                        )}
                      </td>
                      <td className="p-2 text-right pr-3 text-[11px] text-slate-600">
                        {sub.notes || (
                          saei >= 90 ? (
                            <span className="text-emerald-700 font-bold">مشمولة بالإعفاء الفردي 🌟</span>
                          ) : saei >= 50 ? (
                            <span className="text-blue-700 font-bold">مؤهلة للامتحان النهائي</span>
                          ) : (
                            <span className="text-rose-700 font-bold">تحتاج لمتابعة ودعم</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const saeiRes = getAnnualSaeiResult();
                  const hasFailedSaei = saeiRes.failedCount > 0;
                  const firstTermRes = getFirstTermResult();
                  const midRes = getMidYearResult();

                  return (
                    <tr className="bg-blue-950 text-white font-extrabold border-t-2 border-blue-900">
                      <td colSpan={2} className="p-2.5 text-right pr-3 border-l border-blue-800 font-black text-white text-xs">
                        المعدل العام للسعي السنوي:
                      </td>
                      <td className="p-2.5 border-l border-blue-800 font-mono text-center">
                        {firstTermRes.failedCount > 0 ? (
                          <span className="text-amber-200 font-bold text-xs">-</span>
                        ) : (
                          renderGradeValue(cert.overallFirstTermAvg, 'text-amber-300 font-black text-xs', '%')
                        )}
                      </td>
                      <td className="p-2.5 border-l border-blue-800 font-mono text-center">
                        {midRes.failedCount > 0 ? (
                          <span className="text-amber-200 font-bold text-xs">-</span>
                        ) : (
                          renderGradeValue(cert.overallMidYearGrade, 'text-amber-300 font-black text-xs', '%')
                        )}
                      </td>
                      <td className="p-2.5 border-l border-blue-800 font-mono text-center">
                        {renderGradeValue(cert.overallSecondTermAvg, 'text-amber-300 font-black text-xs', '%')}
                      </td>
                      <td className="p-2.5 border-l border-blue-800 font-mono text-center">
                        {hasFailedSaei ? (
                          <span className="text-rose-300 font-bold text-xs">
                            {saeiRes.failedCount >= 4 ? 'لا يُحسب (يوجد رسوب)' : 'لا يُحسب (يوجد إكمال)'}
                          </span>
                        ) : (
                          renderGradeValue(cert.overallAnnualSaeiAvg, 'text-yellow-300 font-black text-sm', '%')
                        )}
                      </td>
                      <td colSpan={2} className="p-2.5 text-right pr-3 text-xs font-bold text-blue-200">
                        التقدير العام للسعي:{' '}
                        <strong className="text-yellow-300 font-black mr-1 text-xs">
                          {hasFailedSaei ? '-' : getSubjectAppreciation(cert.overallAnnualSaeiAvg)}
                        </strong>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Model 3 Appreciation Banner */}
          {(() => {
            const saeiRes = getAnnualSaeiResult();
            const hasFailedSaei = saeiRes.failedCount > 0;

            return (
              <div className="bg-blue-950 text-white p-3.5 rounded-xl flex items-center justify-between border border-blue-900 shadow-sm">
                <div>
                  <span className="text-blue-200 text-xs block font-semibold">معدل السعي السنوي العام:</span>
                  <span className="text-2xl font-black text-yellow-300 font-mono">
                    {hasFailedSaei ? '-' : `${cert.overallAnnualSaeiAvg || 0}%`}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-blue-200 text-xs block font-semibold">التقدير:</span>
                  <span className="text-lg font-bold text-white">
                    {hasFailedSaei ? '-' : getSubjectAppreciation(cert.overallAnnualSaeiAvg)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-blue-200 text-xs block font-semibold">قرار وحالة السعي السنوي:</span>
                  <span className={`text-sm font-extrabold ${saeiRes.bannerBadgeClass}`}>
                    {saeiRes.bannerStatus}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODEL 4 & 5: FINAL CERTIFICATES (ROUND 1 & RESIT)        */}
      {/* ========================================================= */}
      {(effectiveModel === 'model4_final_round1' || effectiveModel === 'model5_makeup_post_resit') && (
        <div className="space-y-3">
          {/* Official Table Breakdown */}
          <div className="overflow-hidden border-2 border-slate-800 rounded-xl">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold border-b-2 border-slate-800">
                  <th className="p-2 border-l border-slate-700 text-right pr-3">المادة الدراسية</th>
                  <th className="p-2 border-l border-slate-700">معدل الفصل 1</th>
                  <th className="p-2 border-l border-slate-700">نصف السنة</th>
                  <th className="p-2 border-l border-slate-700">معدل الفصل 2</th>
                  <th className="p-2 border-l border-slate-700">السعي السنوي</th>
                  <th className="p-2 border-l border-slate-700">النهائي (دور 1)</th>
                  <th className="p-2 border-l border-slate-700 font-extrabold">المعدل النهائي</th>
                  {effectiveModel === 'model5_makeup_post_resit' && (
                    <>
                      <th className="p-2 border-l border-slate-700 bg-amber-900/60">درجة الإكمال</th>
                      <th className="p-2 bg-emerald-900/60 font-extrabold">ما بعد الإكمال</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium">
                {cert.subjects.map((sub, idx) => {
                  const isTeacherSubject =
                    role !== 'teacher' ||
                    sub.subjectName.toLowerCase().trim().includes(teacherSubject.toLowerCase().trim()) ||
                    teacherSubject.toLowerCase().trim().includes(sub.subjectName.toLowerCase().trim());

                  return (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border-l border-slate-300 text-right font-bold pr-3 text-slate-900">
                        {sub.subjectName}
                        {!isTeacherSubject && (
                          <span className="text-[10px] text-amber-700 font-normal mr-2">
                            (محجوبة للسرية)
                          </span>
                        )}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono">
                        {isTeacherSubject ? renderGradeValue(sub.firstTermAvg) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono">
                        {isTeacherSubject ? renderGradeValue(sub.midYearGrade) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono">
                        {isTeacherSubject ? renderGradeValue(sub.secondTermAvg) : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold font-mono text-slate-900">
                        {isTeacherSubject ? renderGradeValue(sub.annualSaeiAvg, 'font-bold text-slate-900') : '🔒'}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-slate-900">
                        {isTeacherSubject ? (
                          sub.isExempt ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 font-black border border-emerald-300 inline-block text-[11px]">
                              معفو
                            </span>
                          ) : (
                            renderGradeValue(sub.finalExamGrade, 'font-medium text-slate-900')
                          )
                        ) : (
                          '🔒'
                        )}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold font-mono text-slate-900">
                        {isTeacherSubject ? (
                          sub.isExempt ? (
                            <span className="font-extrabold text-slate-900 inline-flex items-center gap-1">
                              {renderGradeValue(sub.finalGrade, 'font-bold text-slate-900')}
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 rounded font-bold border border-emerald-200">
                                (معفو)
                              </span>
                            </span>
                          ) : sub.decisionMarks && sub.decisionMarks > 0 ? (
                            <span className="font-extrabold text-slate-900 inline-flex items-center gap-1">
                              {renderGradeValue(sub.finalGrade, 'font-bold text-slate-900')}
                              <span
                                className="text-[9px] text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded font-black border border-amber-400 shadow-2xs"
                                title={`تمت إضافة (+${sub.decisionMarks}) درجات قرار مساعدة لهذه المادة`}
                              >
                                قرار (+{sub.decisionMarks})
                              </span>
                            </span>
                          ) : (
                            renderGradeValue(sub.finalGrade, 'font-bold text-slate-900')
                          )
                        ) : (
                          '🔒'
                        )}
                      </td>
                      {effectiveModel === 'model5_makeup_post_resit' && (
                        <>
                          <td className="p-2 border-l border-slate-300 font-mono bg-amber-50/40">
                            {isTeacherSubject
                              ? renderGradeValue(sub.resitGrade, 'font-bold text-amber-900')
                              : '🔒'}
                          </td>
                          <td className="p-2 font-mono bg-emerald-50/50">
                            {isTeacherSubject
                              ? renderGradeValue(sub.postResitGrade ?? sub.finalGrade, 'font-extrabold text-emerald-950')
                              : '🔒'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const finalRes = getFinalRound1Result();
                  const hasFailedFinal = finalRes.failedCount > 0;
                  const postRes = getPostResitResult();
                  const hasFailedPostRes = postRes.failedCount > 0;

                  return (
                    <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-800">
                      <td className="p-2.5 text-right pr-3 border-l border-slate-700 font-black text-white">المعدل العام الكلي:</td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {renderGradeValue(cert.overallFirstTermAvg, 'text-amber-300 font-black text-sm', '%')}
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {renderGradeValue(cert.overallMidYearGrade, 'text-amber-300 font-black text-sm', '%')}
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {renderGradeValue(cert.overallSecondTermAvg, 'text-amber-300 font-black text-sm', '%')}
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {renderGradeValue(cert.overallAnnualSaeiAvg, 'text-amber-300 font-black text-sm', '%')}
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {renderGradeValue(cert.overallFinalExamGrade, 'text-amber-300 font-black text-sm', '%')}
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono">
                        {hasFailedFinal ? (
                          <span className="text-rose-300 font-bold text-xs">
                            {finalRes.failedCount >= 4 ? 'لا يُحسب (يوجد رسوب)' : 'لا يُحسب (يوجد إكمال)'}
                          </span>
                        ) : (
                          renderGradeValue(cert.overallFinalGrade, 'text-yellow-300 font-black text-base', '%')
                        )}
                      </td>
                      {effectiveModel === 'model5_makeup_post_resit' && (
                        <>
                          <td className="p-2.5 border-l border-slate-700 font-mono text-amber-200">-</td>
                          <td className="p-2.5 font-mono bg-emerald-950 text-sm font-extrabold">
                            {hasFailedPostRes ? (
                              <span className="text-rose-300 font-bold text-xs">
                                {postRes.failedCount >= 4 ? 'لا يُحسب (يوجد رسوب)' : 'لا يُحسب (يوجد إكمال)'}
                              </span>
                            ) : (
                              renderGradeValue(cert.overallPostResitAvg ?? cert.overallFinalGrade, 'text-emerald-300 font-black', '%')
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Decision Notes if applied */}
          {(cert.decisionNotes || (cert.hasDecisionMarks && (cert.decisionMarksUsed || 0) > 0)) && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-2.5 text-xs text-amber-950 font-medium leading-relaxed flex items-start gap-2 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900">ملاحظة القرار الوزاري المعتمد: </span>
                <span>
                  {cert.decisionNotes ||
                    `تمت إضافة (${cert.decisionMarksUsed || 0}) درجات قرار وزارية مساعدة وفق الضوابط والتعليمات الامتحانية المقرة لرفع الدرجات الحافة وتحسين النتيجة.`}
                </span>
              </div>
            </div>
          )}

          {/* Appreciation Summary Banner */}
          {(() => {
            const finalRes = getFinalRound1Result();
            const hasFailedFinal = finalRes.failedCount > 0;
            const postRes = getPostResitResult();
            const hasFailedPostRes = postRes.failedCount > 0;

            const isModel5 = effectiveModel === 'model5_makeup_post_resit';
            const activeResult = isModel5 ? postRes : finalRes;
            const isFailedActive = isModel5 ? hasFailedPostRes : hasFailedFinal;

            return (
              <div className="bg-indigo-950 text-white p-3.5 rounded-xl flex items-center justify-between border border-indigo-900">
                <div>
                  <span className="text-indigo-200 text-xs block font-semibold">
                    {isModel5 ? 'المعدل النهائي (بعد الإكمال):' : 'المعدل العام للنهائي (دور 1):'}
                  </span>
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {isFailedActive
                      ? '-'
                      : isModel5
                      ? `${cert.overallPostResitAvg ?? cert.overallFinalGrade}%`
                      : `${cert.overallFinalGrade || 0}%`}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-indigo-200 text-xs block font-semibold">التقدير التكريمي:</span>
                  <span className="text-base sm:text-lg font-bold text-white">
                    {isFailedActive
                      ? '-'
                      : isModel5
                      ? postRes.appreciation
                      : finalRes.appreciation}
                  </span>
                </div>

                <div className="text-left">
                  <span className="text-indigo-200 text-xs block font-semibold">قرار اللجنة الامتحانية:</span>
                  <span className={`text-sm font-extrabold ${activeResult.bannerBadgeClass}`}>
                    {activeResult.bannerStatus}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* SIGNATURES & OFFICIAL SEALS (FOR ALL 4 MODELS)           */}
      {/* ========================================================= */}
      <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800 border-t border-slate-300">
        <div className="space-y-1.5">
          <p className="text-slate-500 text-[11px]">عضو لجنة التدقيق والنتائج</p>
          <p className="text-slate-900 font-black text-xs min-h-[18px]">
            {schoolAdminData.auditorCommitteeMemberName || 'رئيسة لجنة التدقيق والنتائج'}
          </p>
          <div className="pt-6">
            <p className="text-slate-400 font-normal text-[11px]">التوقيع: .....................</p>
          </div>
        </div>

        <div className="space-y-2">
          <div
            onClick={() => certLogoFileInputRef?.current?.click()}
            className={`w-16 h-16 mx-auto rounded-full border-2 border-dashed border-amber-500/70 bg-amber-50/40 flex flex-col items-center justify-center text-[10px] text-slate-700 p-1 space-y-0.5 shadow-sm ${
              certLogoFileInputRef ? 'cursor-pointer hover:scale-105 transition-transform group relative' : ''
            }`}
            title={certLogoFileInputRef ? 'اضغط لتغيير الشعار والختم من جهازك' : ''}
          >
            {Boolean(schoolAdminData.schoolLogoUrl && schoolAdminData.schoolLogoUrl.trim()) ? (
              <img src={schoolAdminData.schoolLogoUrl} alt="" className="w-7 h-7 object-contain opacity-80" referrerPolicy="no-referrer" />
            ) : (
              <QrCode className="w-6 h-6 text-slate-700" />
            )}
            <span className="font-extrabold text-[8px] text-amber-900">الختم الرسمي</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">كود التحقق: MS-{cert.nationalId}</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-slate-500 text-[11px]">مديرة ثانوية ميسان للمتميزات</p>
          <p className="text-slate-900 font-black text-xs min-h-[18px]">
            {schoolAdminData.principalNameOnCert || schoolAdminData.principalName || 'الهام صبيح سعدون'}
          </p>
          <div className="pt-6">
            <p className="text-slate-400 font-normal text-[11px]">التوقيع والختم: .....................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
