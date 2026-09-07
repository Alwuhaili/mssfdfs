/**
 * Edit School Management Info & Vision of Excellence Modal
 * مدرسة ثانوية ميسان للمتميزات - تعديل بيانات إدارة المدرسة ورؤية التميز
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SchoolAdminData } from '../types';
import {
  X,
  Save,
  Crown,
  Sparkles,
  Trophy,
  Target,
  Shirt,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Upload,
  Image as ImageIcon,
  GraduationCap,
  Eye,
  Camera,
  RotateCcw,
  Clock,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  FileCheck2,
  School,
  Check,
  Users,
} from 'lucide-react';

interface EditSchoolAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'all' | 'photo' | 'principal' | 'vision' | 'achievements' | 'schoolInfo' | 'certBranding';
}

// Preset Academic Portraits for Principal
const PORTRAIT_PRESETS = [
  {
    label: 'بورتريه رسمية 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  },
  {
    label: 'بورتريه رسمية 2',
    url: 'https://images.unsplash.com/photo-1580894732468-058f74726304?w=500&auto=format&fit=crop&q=80',
  },
  {
    label: 'بورتريه أكاديمية 3',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&auto=format&fit=crop&q=80',
  },
  {
    label: 'بورتريه قيادية 4',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&auto=format&fit=crop&q=80',
  },
];

// Specialization presets
const SPECIALIZATION_PRESETS = [
  'دكتوراه طرائق تدريس العلوم ورعاية المتفوقات',
  'دكتوراه في الفيزياء النانوية والتقنيات الحديثة',
  'دكتوراه في الرياضيات التطبيقية والحاسوب',
  'ماجستير الإدارة والقيادة التربوية المتقدمة',
  'دكتوراه المناهج وتقنيات الذكاء الاصطناعي',
];

export const EditSchoolAdminModal: React.FC<EditSchoolAdminModalProps> = ({ isOpen, onClose, initialTab }) => {
  const { schoolAdminData, updateSchoolAdminData, supervisors, lang } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab within modal for complete structured navigation
  const [activeTab, setActiveTab] = useState<
    'all' | 'photo' | 'principal' | 'vision' | 'achievements' | 'schoolInfo' | 'certBranding'
  >(initialTab || 'all');

  const [principalName, setPrincipalName] = useState(schoolAdminData.principalName);
  const [principalBadge, setPrincipalBadge] = useState(schoolAdminData.principalBadge);
  const [principalTitle, setPrincipalTitle] = useState(schoolAdminData.principalTitle);
  const [principalDegree, setPrincipalDegree] = useState(schoolAdminData.principalDegree);
  const [principalImageUrl, setPrincipalImageUrl] = useState(schoolAdminData.principalImageUrl);
  const [assistantPrincipalName, setAssistantPrincipalName] = useState(
    schoolAdminData.assistantPrincipalName || 'زينب علي الموسوي'
  );
  const [assistantPrincipalTitle, setAssistantPrincipalTitle] = useState(
    schoolAdminData.assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'
  );
  const [academicSupervisorName, setAcademicSupervisorName] = useState(
    schoolAdminData.academicSupervisorName || 'أ.د. حيدر جاسم الكناني'
  );
  const [academicSupervisorTitle, setAcademicSupervisorTitle] = useState(
    schoolAdminData.academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'
  );
  const [visionMessage, setVisionMessage] = useState(schoolAdminData.visionMessage);
  const [achievements, setAchievements] = useState<string[]>(schoolAdminData.achievements || []);
  const [schoolWorkingHoursInfo, setSchoolWorkingHoursInfo] = useState(schoolAdminData.schoolWorkingHoursInfo || '');
  const [schoolWorkingHoursDetail, setSchoolWorkingHoursDetail] = useState(schoolAdminData.schoolWorkingHoursDetail || '');
  const [schoolUniformInfo, setSchoolUniformInfo] = useState(schoolAdminData.schoolUniformInfo || '');
  const [schoolUniformDetail, setSchoolUniformDetail] = useState(schoolAdminData.schoolUniformDetail || '');
  const [schoolPolicyInfo, setSchoolPolicyInfo] = useState(schoolAdminData.schoolPolicyInfo || '');
  const [schoolPolicyDetail, setSchoolPolicyDetail] = useState(schoolAdminData.schoolPolicyDetail || '');
  const [strategicGoals, setStrategicGoals] = useState<string[]>(schoolAdminData.strategicGoals || []);

  // Certificate Branding and Official Document fields
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(schoolAdminData.schoolLogoUrl || '');
  const [schoolNameEn, setSchoolNameEn] = useState(schoolAdminData.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students');
  const [academicYearDefault, setAcademicYearDefault] = useState(schoolAdminData.academicYearDefault || '2026 - 2027');
  const [statisticalNumberDefault, setStatisticalNumberDefault] = useState(schoolAdminData.statisticalNumberDefault || '2026/MS/8890');
  const [issueDateDefault, setIssueDateDefault] = useState(schoolAdminData.issueDateDefault || '2027-06-25');
  const [principalNameOnCert, setPrincipalNameOnCert] = useState(schoolAdminData.principalNameOnCert || schoolAdminData.principalName);
  const [auditorCommitteeMemberName, setAuditorCommitteeMemberName] = useState(schoolAdminData.auditorCommitteeMemberName || 'لجنة التدقيق والنتائج المدرسية');
  const [examControlAuditorName, setExamControlAuditorName] = useState(schoolAdminData.examControlAuditorName || 'أ. دلال محمد عبد الحسين');
  const [examControlAuditorTitle, setExamControlAuditorTitle] = useState(schoolAdminData.examControlAuditorTitle || 'مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية');
  const [timetableSupervisorName, setTimetableSupervisorName] = useState(schoolAdminData.timetableSupervisorName || 'أ.د. حيدر جاسم الكناني');

  const [newAchievement, setNewAchievement] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Auto-generate badge option when name changes if user wants
  const handleNameChange = (val: string) => {
    setPrincipalName(val);
    if (val.trim()) {
      const parts = val.trim().split(' ');
      if (parts.length >= 2) {
        setPrincipalBadge(`المديرة ${parts[0]} ${parts[1]}`);
      } else {
        setPrincipalBadge(`المديرة ${val}`);
      }
    }
  };

  // Handle local file upload for Principal Image
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPrincipalImageUrl(reader.result);
          setPhotoUploadSuccess(true);
          setTimeout(() => setPhotoUploadSuccess(false), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local file upload for School Logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSchoolLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrincipalName(schoolAdminData.principalName);
      setPrincipalBadge(schoolAdminData.principalBadge);
      setPrincipalTitle(schoolAdminData.principalTitle);
      setPrincipalDegree(schoolAdminData.principalDegree);
      setPrincipalImageUrl(
        schoolAdminData.principalImageUrl || PORTRAIT_PRESETS[0].url
      );
      setAssistantPrincipalName(
        schoolAdminData.assistantPrincipalName || 'زينب علي الموسوي'
      );
      setAssistantPrincipalTitle(
        schoolAdminData.assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'
      );
      setAcademicSupervisorName(
        schoolAdminData.academicSupervisorName || 'أ.د. حيدر جاسم الكناني'
      );
      setAcademicSupervisorTitle(
        schoolAdminData.academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'
      );
      setVisionMessage(schoolAdminData.visionMessage);
      setAchievements(schoolAdminData.achievements || []);
      setSchoolWorkingHoursInfo(schoolAdminData.schoolWorkingHoursInfo || 'من 8:00 صباحاً وحتى 1:30 ظهراً');
      setSchoolWorkingHoursDetail(schoolAdminData.schoolWorkingHoursDetail || 'طيلة أيام الأسبوع من (الأحد إلى الخميس)');
      setSchoolUniformInfo(schoolAdminData.schoolUniformInfo || 'الصدرية الرصاصية (الرمادي) + قميص أبيض ناصع + حجاب أبيض + شعار المدرسة');
      setSchoolUniformDetail(schoolAdminData.schoolUniformDetail || 'مع حذاء أسود / رياضي مريح للأنشطة والرياضة');
      setSchoolPolicyInfo(schoolAdminData.schoolPolicyInfo || 'انضباط أكاديمي عالي وحظر الهواتف الذكية');
      setSchoolPolicyDetail(schoolAdminData.schoolPolicyDetail || 'تعزيز البحث العلمي والابتكار البرمجي ورعاية الموهوبين');
      setStrategicGoals(schoolAdminData.strategicGoals || []);
      setSchoolLogoUrl(schoolAdminData.schoolLogoUrl || '');
      setSchoolNameEn(schoolAdminData.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students');
      setAcademicYearDefault(schoolAdminData.academicYearDefault || '2026 - 2027');
      setStatisticalNumberDefault(schoolAdminData.statisticalNumberDefault || '2026/MS/8890');
      setIssueDateDefault(schoolAdminData.issueDateDefault || '2027-06-25');
      setPrincipalNameOnCert(schoolAdminData.principalNameOnCert || schoolAdminData.principalName);
      setAuditorCommitteeMemberName(schoolAdminData.auditorCommitteeMemberName || 'لجنة التدقيق والنتائج المدرسية');
      setTimetableSupervisorName(schoolAdminData.timetableSupervisorName || 'أ.د. حيدر جاسم الكناني');
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setSaveSuccessNotice(false);
    }
  }, [isOpen, schoolAdminData, initialTab]);

  if (!isOpen) return null;

  const handleAddAchievement = () => {
    if (!newAchievement.trim()) return;
    setAchievements((prev) => [...prev, newAchievement.trim()]);
    setNewAchievement('');
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    setStrategicGoals((prev) => [...prev, newGoal.trim()]);
    setNewGoal('');
  };

  const handleRemoveGoal = (index: number) => {
    setStrategicGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: SchoolAdminData = {
      ...schoolAdminData,
      principalName,
      principalBadge,
      principalTitle,
      principalDegree,
      principalImageUrl,
      assistantPrincipalName,
      assistantPrincipalTitle,
      academicSupervisorName,
      academicSupervisorTitle,
      visionMessage,
      achievements,
      schoolWorkingHoursInfo,
      schoolWorkingHoursDetail,
      schoolUniformInfo,
      schoolUniformDetail,
      schoolPolicyInfo,
      schoolPolicyDetail,
      strategicGoals,
      schoolLogoUrl,
      schoolNameEn,
      academicYearDefault,
      statisticalNumberDefault,
      issueDateDefault,
      principalNameOnCert: principalNameOnCert || principalName,
      auditorCommitteeMemberName,
      examControlAuditorName,
      examControlAuditorTitle,
      timetableSupervisorName,
      principalNameOnTimetable: principalNameOnCert || principalName,
    };

    updateSchoolAdminData(updatedData);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md font-arabic overflow-hidden">
      {/* Modal Container with explicit max height and flex layout */}
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden animate-fadeIn">
        
        {/* 1. Modal Header (Fixed at top) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  تعديل بيانات ورؤية إدارة ثانوية ميسان للمتميزات
                </h2>
                <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  صلاحيات الإدارة والمديرة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل وتحديث صورة المديرة، الرؤية، الأهداف، الزي والدوام، والوثائق الإدارية المعتمدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-sm"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Tabs Bar (Sticky under header) */}
        <div className="shrink-0 bg-slate-950/70 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>عرض وتعديل الكل (شامل)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'photo'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>صورة المديرة والمعاينة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('principal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'principal'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>بيانات القيادة والتخصص</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vision')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'vision'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>رسالة ورؤية الإدارة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>الإنجازات والتكريمات ({achievements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schoolInfo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'schoolInfo'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>الدوام والزي والسياسات والأهداف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certBranding')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'certBranding'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>الوثائق والشهادات والشعار</span>
          </button>
        </div>

        {/* 3. Scrollable Modal Body (Contains full data sections) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <form id="edit-school-admin-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Success alert message if triggered */}
            {saveSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-black text-sm text-emerald-100">تم حفظ كافة البيانات وتحديثها بنجاح!</h4>
                  <p className="text-xs text-emerald-300">تم تطبيق التعديلات فوراً على اللوحة الرئيسية وكافة الأقسام المعتمدة.</p>
                </div>
              </div>
            )}

            {/* SECTION A: Principal Photo & Live Preview */}
            {(activeTab === 'all' || activeTab === 'photo') && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>صورة المديرة والمعاينة الحية المباشرة في اللوحة:</span>
                  </h3>
                  {photoUploadSuccess && (
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      تم رفع وتعيين الصورة بنجاح!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Live Preview Card */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900 border border-amber-500/30 text-center space-y-3 shadow-inner">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة كارت المديرة في الصفحة الرئيسية</span>
                    </span>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group cursor-pointer"
                      title="اضغط هنا لتغيير الصورة مباشرة من جهازك"
                    >
                      <img
                        src={principalImageUrl || PORTRAIT_PRESETS[0].url}
                        alt="معاينة المديرة"
                        className="w-40 h-40 sm:w-44 sm:h-44 rounded-3xl object-cover shadow-2xl border-4 border-amber-400/80 group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {/* Hover Camera Overlay */}
                      <div className="absolute inset-0 rounded-3xl bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-amber-300 font-extrabold text-xs backdrop-blur-xs">
                        <Camera className="w-8 h-8 text-amber-400 animate-bounce" />
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow">
                          اختيار صورة من جهازك
                        </span>
                      </div>
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-950 text-amber-300 text-[11px] font-bold border border-amber-400/50 shadow-md whitespace-nowrap flex items-center gap-1 pointer-events-none">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        {principalBadge || 'المديرة'}
                      </span>
                    </div>

                    <div className="pt-3 space-y-1">
                      <h4 className="font-black text-sm text-white">
                        {principalName || 'اسم المديرة'}
                      </h4>
                      <p className="text-xs text-teal-400 font-bold">
                        {principalTitle || 'المسمى القيادي'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {principalDegree || 'الدرجة العلمية والتخصص'}
                      </p>
                    </div>
                  </div>

                  {/* Photo Upload & Preset Controls */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        تحميل صورة شخصية جديدة من جهازك أو وضع رابط صورة خارجي:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={principalImageUrl}
                          onChange={(e) => setPrincipalImageUrl(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                        >
                          <Upload className="w-4 h-4 text-slate-950" />
                          <span>تحميل صورة</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        يمكنك اختيار ملف صورة عالي الدقة من جهازك (JPG, PNG, WEBP) أو إدخال رابط ويب مباشر.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="block text-xs font-semibold text-slate-400">
                          أو اختر صورة رمزية قيادية جاهزة:
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrincipalImageUrl(PORTRAIT_PRESETS[0].url)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-bold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>استعادة الصورة الافتراضية</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PORTRAIT_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPrincipalImageUrl(p.url)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                              principalImageUrl === p.url
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 font-bold'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            <img
                              src={p.url}
                              alt={p.label}
                              className="w-14 h-14 rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[11px]">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION B: Leadership, Principal, Assistant & Supervisor Official Signatures */}
            {(activeTab === 'all' || activeTab === 'principal') && (
              <div className="space-y-5">
                {/* 1. Principal Information Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>1. مديرة ثانوية ميسان للمتميزات (القيادة العليا):</span>
                    </h3>
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                      رئيسة الهيئة الإدارية
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        الاسم الكامل لمديرة المدرسة *
                      </label>
                      <input
                        type="text"
                        required
                        value={principalName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-bold"
                        placeholder="مثال: الهام صبيح سعدون"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['أ.د.', 'د.', 'الأستاذة', 'المديرة', 'الست'].map((pfx) => (
                          <button
                            key={pfx}
                            type="button"
                            onClick={() => {
                              let clean = principalName.trim();
                              ['أ.د. ', 'د. ', 'الأستاذة ', 'المديرة ', 'الست '].forEach((p) => {
                                if (clean.startsWith(p)) clean = clean.substring(p.length).trim();
                              });
                              handleNameChange(`${pfx} ${clean}`);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                          >
                            + {pfx}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        شارة العرض المصغرة (البادج أسفل الصورة) *
                      </label>
                      <input
                        type="text"
                        required
                        value={principalBadge}
                        onChange={(e) => setPrincipalBadge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                        placeholder="مثال: المديرة الهام صبيح سعدون"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        المسمى القيادي والوظيفي *
                      </label>
                      <input
                        type="text"
                        required
                        value={principalTitle}
                        onChange={(e) => setPrincipalTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                        placeholder="مثال: مديرة ثانوية ميسان للمتميزات"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        <span>تخصص واختصاص المديرة (الشهادة والدرجة العلمية) *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={principalDegree}
                        onChange={(e) => setPrincipalDegree(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                        placeholder="مثال: دكتوراه طرائق تدريس العلوم ورعاية المتفوقات"
                      />
                    </div>
                  </div>

                  {/* Specialization Preset Chips */}
                  <div className="pt-1">
                    <span className="block text-xs font-semibold text-slate-400 mb-2">
                      أو اختر اختصاصاً ودرجة أكاديمية سريعة:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATION_PRESETS.map((spec, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrincipalDegree(spec)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            principalDegree === spec
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Assistant Principal for Student Affairs & Academic Supervisor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Assistant for Student Affairs & Registration */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>2. معاونة شؤون الطالبات والتسجيل:</span>
                      </h3>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        تدقيق السجلات والتقارير
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                        اسم معاونة شؤون الطالبات والتسجيل *
                      </label>
                      <input
                        type="text"
                        required
                        value={assistantPrincipalName}
                        onChange={(e) => setAssistantPrincipalName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-bold"
                        placeholder="مثال: زينب علي الموسوي"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                        المسمى الوظيفي المعتمد
                      </label>
                      <input
                        type="text"
                        value={assistantPrincipalTitle}
                        onChange={(e) => setAssistantPrincipalTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="مثال: معاونة شؤون الطالبات والتسجيل"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>يتم اعتماد هذا الاسم في التوقيع الرسمي للتقارير الأكاديمية وسجلات القيد.</span>
                    </div>
                  </div>

                  {/* Academic & Educational Supervisor */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span>3. المشرف الأكاديمي والتربوي المعتمد:</span>
                      </h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        إشراف وزارة التربية
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                        اسم المشرف الأكاديمي والتربوي المعتمد *
                      </label>
                      <input
                        type="text"
                        required
                        value={academicSupervisorName}
                        onChange={(e) => {
                          setAcademicSupervisorName(e.target.value);
                          setTimetableSupervisorName(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                        placeholder="مثال: أ.د. حيدر جاسم الكناني"
                      />
                      {supervisors && supervisors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {supervisors.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setAcademicSupervisorName(s.name);
                                setTimetableSupervisorName(s.name);
                                if (s.title) setAcademicSupervisorTitle(s.title);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                                academicSupervisorName === s.name
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 font-bold'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {s.name} {s.isPrimary ? '👑' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                        المسمى الإشرافي الوزاري
                      </label>
                      <input
                        type="text"
                        value={academicSupervisorTitle}
                        onChange={(e) => setAcademicSupervisorTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="مثال: المشرف الأكاديمي والتربوي المعتمد"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>يظهر هذا الاسم في خانة الاعتماد والمطابقة الوزارية بالتقارير الأكاديمية.</span>
                    </div>
                  </div>

                </div>

                {/* 3. Live 3-Way Signatures Preview Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-amber-400" />
                      <span>معاينة حية مباشرة لبطاقات التواقيع الإدارية الثلاثية المعتمدة:</span>
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">
                      مظهر التقارير الأكاديمية
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs pt-1">
                    {/* Assistant Card */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        {assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'}
                      </span>
                      <div className="py-1 font-arabic text-indigo-300 font-bold text-xs italic">
                        {assistantPrincipalName || 'اسم المعاونة'}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">التوقيع والتدقيق الإداري</span>
                    </div>

                    {/* Supervisor Card */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        {academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'}
                      </span>
                      <div className="py-1 font-arabic text-emerald-300 font-bold text-xs italic">
                        {academicSupervisorName || 'اسم المشرف'}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">الاعتماد والمطابقة الوزارية</span>
                    </div>

                    {/* Principal Card */}
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                      <span className="text-[11px] font-bold text-amber-200 block">
                        {principalTitle || 'مديرة ثانوية ميسان للمتميزات'}
                      </span>
                      <div className="py-1 font-arabic text-amber-300 font-black text-xs italic">
                        {principalName || 'اسم المديرة'}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-bold flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>ختم الإدارة الرسمي المعتمد ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SECTION C: Vision & Principal Message */}
            {(activeTab === 'all' || activeTab === 'vision') && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>رسالة وكلمة الإدارة المدرسية الموجهة للطالبات وأولياء الأمور:</span>
                </h3>
                <textarea
                  rows={4}
                  required
                  value={visionMessage}
                  onChange={(e) => setVisionMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
                  placeholder="اكتبي رؤية المدرسة وكلمة المديرة الموجهة للطلبة والأهالي والمجتمع التربوي..."
                />
                <p className="text-[11px] text-slate-400">
                  تظهر هذه الرسالة في صدارة قسم الإدارة المدرسية بالصفحة الرئيسية للمنصة ويطلع عليها أعضاء الهيئة التدريسية والطالبات وأولياء الأمور.
                </p>
              </div>
            )}

            {/* SECTION D: Achievements & Honours */}
            {(activeTab === 'all' || activeTab === 'achievements') && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>أبرز إنجازات وتكريمات الإدارة المدرسية:</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    عدد الإنجازات الحالية: ({achievements.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                      <span className="flex items-center gap-2.5 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                        <span className="font-medium leading-relaxed">{ach}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all shrink-0"
                        title="حذف هذا الإنجاز"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {achievements.length === 0 && (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                      لم يتم إضافة أي إنجاز حتى الآن. أضف إنجازات المدرسة لتظهر في بطاقات التميز.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                    placeholder="إضافة إنجاز أو تكريم إداري/أكاديمي جديد..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة إنجاز</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION E: Working Hours, Uniform, Policy & Strategic Goals */}
            {(activeTab === 'all' || activeTab === 'schoolInfo') && (
              <div className="space-y-5">
                {/* Working Hours Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>أوقات وساعات الدوام الرسمي (تظهر في اللوحة الرئيسية):</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        ساعات الدوام اليومي:
                      </label>
                      <input
                        type="text"
                        value={schoolWorkingHoursInfo}
                        onChange={(e) => setSchoolWorkingHoursInfo(e.target.value)}
                        placeholder="مثال: من 8:00 صباحاً وحتى 1:30 ظهراً"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        أيام وأوقات العمل الأسبوعي:
                      </label>
                      <input
                        type="text"
                        value={schoolWorkingHoursDetail}
                        onChange={(e) => setSchoolWorkingHoursDetail(e.target.value)}
                        placeholder="مثال: طيلة أيام الأسبوع من (الأحد إلى الخميس)"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Uniform & Policy Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Official Uniform Card */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-teal-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <Shirt className="w-4 h-4 text-teal-400" />
                      <span>الزي الرسمي للمتميزات:</span>
                    </h3>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        مواصفات الزي الرئيسي المعتمد:
                      </label>
                      <textarea
                        rows={2}
                        value={schoolUniformInfo}
                        onChange={(e) => setSchoolUniformInfo(e.target.value)}
                        placeholder="مثال: الصدرية الرصاصية + قميص أبيض ناصع + حجاب أبيض + شعار المدرسة"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        ضوابط الأحذية والرياضة:
                      </label>
                      <input
                        type="text"
                        value={schoolUniformDetail}
                        onChange={(e) => setSchoolUniformDetail(e.target.value)}
                        placeholder="مثال: مع حذاء أسود / رياضي مريح للأنشطة"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Policy & Vision Card */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>سياسة ورؤية التفوق العلمي:</span>
                    </h3>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        السياسة العامة والانضباط:
                      </label>
                      <textarea
                        rows={2}
                        value={schoolPolicyInfo}
                        onChange={(e) => setSchoolPolicyInfo(e.target.value)}
                        placeholder="مثال: انضباط أكاديمي عالي وحظر الهواتف"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        رؤية التطوير والابتكار العلمي:
                      </label>
                      <input
                        type="text"
                        value={schoolPolicyDetail}
                        onChange={(e) => setSchoolPolicyDetail(e.target.value)}
                        placeholder="مثال: تعزيز البحث العلمي والابتكار البرمجي ورعاية الموهوبين"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Strategic Goals Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span>الأهداف الإستراتيجية لتطوير المدرسة والموهوبات:</span>
                    </h3>
                    <span className="text-xs font-bold text-slate-400">
                      عدد الأهداف: ({strategicGoals.length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {strategicGoals.map((goal, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                        <span className="text-slate-200 text-xs flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{goal}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(idx)}
                          className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all shrink-0"
                          title="حذف الهدف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {strategicGoals.length === 0 && (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                        لم يتم إضافة أي أهداف إستراتيجية حتى الآن.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGoal();
                        }
                      }}
                      placeholder="إضافة هدف إستراتيجي جديد..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddGoal}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة هدف</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION F: Official Document & Certificate Branding */}
            {(activeTab === 'all' || activeTab === 'certBranding') && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span>بيانات الترويسة والشهادات والوثائق الرسمية للمدرسة:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* School Logo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      شعار المدرسة الرسمي (يظهر في ترويسة الشهادات والكتب الرسمية):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={schoolLogoUrl}
                        onChange={(e) => setSchoolLogoUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        placeholder="رابط شعار المدرسة أو تحميل من جهازك..."
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                      >
                        <Upload className="w-4 h-4 text-slate-950" />
                        <span>تحميل الشعار</span>
                      </button>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      اسم المدرسة بالإنجليزية (للوثائق والشهادات)
                    </label>
                    <input
                      type="text"
                      value={schoolNameEn}
                      onChange={(e) => setSchoolNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      placeholder="Maysan Secondary School For Distinguished Female Students"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      العام الدراسي الافتراضي
                    </label>
                    <input
                      type="text"
                      value={academicYearDefault}
                      onChange={(e) => setAcademicYearDefault(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      placeholder="2026 - 2027"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      الرقم الإحصائي الافتراضي للكتاب/الشهادة
                    </label>
                    <input
                      type="text"
                      value={statisticalNumberDefault}
                      onChange={(e) => setStatisticalNumberDefault(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                      placeholder="2026/MYS/884"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      اسم المديرة المعتمد على التوقيع بالشهادات
                    </label>
                    <input
                      type="text"
                      value={principalNameOnCert}
                      onChange={(e) => setPrincipalNameOnCert(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      placeholder="د. الهام صبيح سعدون"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      عضو لجنة التدقيق والشهادات
                    </label>
                    <input
                      type="text"
                      value={auditorCommitteeMemberName}
                      onChange={(e) => setAuditorCommitteeMemberName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      placeholder="أدخل اسم عضو/رئيسة لجنة التدقيق..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                      مسؤولة الكنترول والتدقيق الامتحاني ورصد الدرجات
                    </label>
                    <input
                      type="text"
                      value={examControlAuditorName}
                      onChange={(e) => setExamControlAuditorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-amber-500/50 text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-400"
                      placeholder="أ. دلال محمد عبد الحسين"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      صفة ومسمى مسؤولة الكنترول والتدقيق
                    </label>
                    <input
                      type="text"
                      value={examControlAuditorTitle}
                      onChange={(e) => setExamControlAuditorTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      placeholder="مسؤولة الكنترول والتدقيق - لجنة فحص الدفاتر الامتحانية"
                    />
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* 4. Sticky Modal Footer (Fixed at bottom with clear action buttons) */}
        <div className="shrink-0 bg-slate-950/95 border-t border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>يتم حفظ جميع التعديلات محلياً وتحديث المنصة مباشرة</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="edit-school-admin-form"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>حفظ وتثبيت التعديلات المباشرة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
