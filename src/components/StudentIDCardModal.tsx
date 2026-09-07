import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student, StudentShieldBadge } from '../types';
import { PRESET_SHIELDS_AND_BADGES, getShieldThemeConfig } from '../data/shieldsData';
import { downloadElementAsPdf, downloadMultiElementsAsPdf } from '../utils/pdfExporter';
import {
  X,
  Printer,
  Download,
  Share2,
  Award,
  Shield,
  Sparkles,
  Plus,
  Trash2,
  QrCode,
  School,
  CheckCircle2,
  Calendar,
  User,
  ChevronRight,
  Eye,
  RotateCw,
  Medal,
  Crown,
  FileCheck2,
  Hash,
  Phone,
  Droplet,
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { lang, role, schoolAdminData, students, addShieldToStudent, removeShieldFromStudent, updateStudent } = useApp();

  const [activeView, setActiveView] = useState<'card' | 'manage'>('card');
  const [cardFace, setCardFace] = useState<'front' | 'back'>('front');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // Custom shield form state
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<StudentShieldBadge['type']>('shield');
  const [customCategory, setCustomCategory] = useState('الحاسوب والتكنولوجيا');
  const [customReason, setCustomReason] = useState('');
  const [customIssuedBy, setCustomIssuedBy] = useState('إدارة ثانوية ميسان للمتميزات');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customIcon, setCustomIcon] = useState('⚡');

  // Quick edit student attributes
  const [bloodType, setBloodType] = useState(student?.bloodType || 'O+');
  const [showBloodTypeEdit, setShowBloodTypeEdit] = useState(false);
  const [enrollmentYear, setEnrollmentYear] = useState(student?.enrollmentYear || '2026');
  const [showEnrollmentYearEdit, setShowEnrollmentYearEdit] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const frontExportRef = useRef<HTMLDivElement>(null);
  const backExportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time student reference from AppContext
  const currentStudent = (student && students) ? (students.find((s) => s.id === student.id) || student) : student;

  React.useEffect(() => {
    if (currentStudent) {
      setBloodType(currentStudent.bloodType || 'O+');
      setEnrollmentYear(currentStudent.enrollmentYear || '2026');
    }
  }, [currentStudent]);

  if (!isOpen || !student || !currentStudent) return null;

  const currentShields: StudentShieldBadge[] = currentStudent.shieldsAndBadges && currentStudent.shieldsAndBadges.length > 0
    ? currentStudent.shieldsAndBadges
    : (currentStudent.badges || []).map((bTitle, idx) => {
        const theme = getShieldThemeConfig(bTitle);
        return {
          id: `legacy-${idx}-${bTitle}`,
          title: bTitle,
          type: theme.type,
          category: theme.category,
          dateAwarded: '2026-08-15',
          issuedBy: theme.defaultIssuedBy,
          reason: theme.defaultReason,
          icon: theme.icon,
        };
      });

  const handleAddPresetShield = (preset: typeof PRESET_SHIELDS_AND_BADGES[0]) => {
    const alreadyHas = currentShields.some((s) => s.title === preset.title);
    if (alreadyHas) {
      alert(`الدرع / الوسام "${preset.title}" مدرج بالفعل في البطاقة التعريفية للطالبة!`);
      return;
    }

    addShieldToStudent(currentStudent.id, {
      title: preset.title,
      type: preset.type,
      category: preset.category,
      dateAwarded: new Date().toISOString().split('T')[0],
      issuedBy: preset.defaultIssuedBy,
      reason: preset.defaultReason,
      icon: preset.icon,
    });
  };

  const handleAddCustomShield = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    addShieldToStudent(currentStudent.id, {
      title: customTitle.trim(),
      type: customType,
      category: customCategory.trim() || 'تكريم وتميز علمي',
      dateAwarded: customDate || new Date().toISOString().split('T')[0],
      issuedBy: customIssuedBy.trim() || 'إدارة ثانوية ميسان للمتميزات',
      reason: customReason.trim() || 'تقدير للجهود المتميزة والموهبة الإبداعية',
      icon: customIcon || '🎖️',
    });

    setCustomTitle('');
    setCustomReason('');
  };

  const handleRemoveShield = (shieldId: string) => {
    if (confirm('هل أنتِ متأكدة من استبعاد هذا الدرع / الوسام من البطاقة التعريفية للطالبة؟')) {
      removeShieldFromStudent(currentStudent.id, shieldId);
    }
  };

  const handleSaveBloodType = () => {
    updateStudent(currentStudent.id, { bloodType });
    setShowBloodTypeEdit(false);
  };

  const handleSaveEnrollmentYear = () => {
    if (!enrollmentYear.trim()) return;
    updateStudent(currentStudent.id, { enrollmentYear: enrollmentYear.trim() });
    setShowEnrollmentYearEdit(false);
    setExportSuccessMsg('تم تحديث وحفظ سنة القبول بنجاح ✓');
    setTimeout(() => setExportSuccessMsg(''), 3500);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateStudent(currentStudent.id, { avatar: dataUrl });
        setExportSuccessMsg('تم رفع وتحديث صورة الطالبة بنجاح 📷✓');
        setTimeout(() => setExportSuccessMsg(''), 4000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل ترغبين في إزالة الصورة الحالية واستعادة الرمز الافتراضي للطالبة؟')) {
      updateStudent(currentStudent.id, { avatar: '' });
      setExportSuccessMsg('تمت استعادة الصورة الافتراضية');
      setTimeout(() => setExportSuccessMsg(''), 3000);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const fileName = `بطاقة_تعريفية_الوجه_والظهر_${currentStudent.name.replace(/\s+/g, '_')}_2026.pdf`;
      const frontEl = frontExportRef.current;
      const backEl = backExportRef.current;

      if (frontEl && backEl) {
        // Multi-page export: Page 1 = Front, Page 2 = Back
        const success = await downloadMultiElementsAsPdf([frontEl, backEl], {
          fileName,
          orientation: 'portrait',
          format: 'a4',
          scale: 2.5,
          quality: 0.98,
          marginMm: 10,
        });
        if (success) {
          setExportSuccessMsg('تم تصدير وتحميل البطاقة التعريفية (الوجه والظهر معاً) كملف PDF عالي الدقة بنجاح ✓');
          setTimeout(() => setExportSuccessMsg(''), 5000);
        }
      } else if (cardRef.current) {
        const success = await downloadElementAsPdf(cardRef.current, {
          fileName,
          orientation: 'portrait',
          format: 'a4',
          scale: 2.5,
          quality: 0.98,
          marginMm: 10,
        });
        if (success) {
          setExportSuccessMsg('تم تصدير وتحميل البطاقة التعريفية بنجاح ✓');
          setTimeout(() => setExportSuccessMsg(''), 4000);
        }
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const isManagementAllowed = role === 'admin' || role === 'teacher';

  /* FRONT FACE RENDERER */
  const renderCardFront = (isExportTarget = false) => (
    <div
      className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white relative font-arabic select-none"
      dir="rtl"
    >
      {/* Top Header Background Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 flex items-center justify-between border-b-2 border-amber-300 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇮🇶</span>
          <div className="text-right">
            <p className="text-[9px] font-black leading-tight text-slate-950 font-arabic">
              جمهورية العراق - وزارة التربية
            </p>
            <p className="text-[10px] font-extrabold text-slate-900 font-arabic">
              المديرية العامة لتربية ميسان
            </p>
          </div>
        </div>

        <div className="text-center px-1">
          <h1 className="text-xs sm:text-sm font-black text-slate-950 font-arabic leading-tight">
            {schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}
          </h1>
          <p className="text-[8px] sm:text-[8.5px] font-bold text-slate-900 font-sans leading-tight">
            {schoolAdminData.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/10 px-2 py-0.5 rounded-lg border border-slate-950/20">
          <Crown className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="text-[10px] font-black text-slate-950 font-arabic whitespace-nowrap">رعاية الموهوبات</span>
        </div>
      </div>

      {/* Sub-header Title Ribbon */}
      <div className="bg-slate-950 px-4 py-1 flex items-center justify-between text-[11px] font-black text-amber-300 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-arabic">بطاقة الهوية التعريفية وسجل التميز الأكاديمي</span>
        </div>
        <span className="font-sans text-slate-400 text-[10px]">العام الدراسي 2026 - 2027</span>
      </div>

      {/* Main Student Profile Body */}
      <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          
          {/* Student Avatar / Photo Box */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div
              onClick={() => !isExportTarget && fileInputRef.current?.click()}
              className={`group relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-950 to-slate-900 border-2 border-amber-400 flex flex-col items-center justify-center text-white shadow-lg overflow-hidden ${
                !isExportTarget ? 'cursor-pointer hover:border-amber-300 hover:shadow-amber-500/30' : ''
              }`}
              title={!isExportTarget ? 'انقري لتغيير ورفع صورة الطالبة من جهازك 📷' : undefined}
            >
              {currentStudent.avatar ? (
                <img
                  src={currentStudent.avatar}
                  alt={currentStudent.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <span className="text-4xl select-none">👩🏻‍🎓</span>
                </div>
              )}

              {/* Hover Overlay in interactive mode */}
              {!isExportTarget && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 text-center p-1">
                  <Camera className="w-6 h-6 mb-1 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black leading-tight text-white font-arabic">تغيير الصورة</span>
                  <span className="text-[8px] text-amber-300 font-arabic">رفع من الجهاز 📁</span>
                </div>
              )}

              {/* Bottom Distinction Ribbon */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-[9px] text-center py-0.5 shadow-sm font-arabic">
                طالبة متميزة
              </div>
            </div>

            {/* In interactive mode: show action buttons */}
            {!isExportTarget && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 cursor-pointer font-arabic"
                  title="تغيير الصورة من الجهاز"
                >
                  <Camera className="w-2.5 h-2.5 text-amber-400" />
                  <span>تغيير الصورة</span>
                </button>
                {currentStudent.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[10px] text-rose-300 hover:text-rose-200 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded-lg border border-slate-700 cursor-pointer font-arabic"
                    title="استعادة الصورة الافتراضية"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Student Info Details */}
          <div className="flex-1 text-center sm:text-right space-y-1.5 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-1">
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 font-arabic">
                الاسم الكامل للطالبة:
              </span>
              <span className="text-[10px] font-sans font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                معدل التميز: {currentStudent.gpa}%
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white font-arabic py-0.5">
              {currentStudent.name}
            </h2>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/80 text-right">
                <p className="text-[10px] text-slate-400 font-arabic">الصف والشعبة:</p>
                <p className="font-black text-indigo-200 mt-0.5 truncate font-arabic">{currentStudent.gradeLevel}</p>
                <p className="text-[10px] font-bold text-amber-300 font-arabic">شعبة ({currentStudent.section})</p>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/80 text-right">
                <p className="text-[10px] text-slate-400 font-arabic">الرقم الوطني الموحد:</p>
                <p className="font-sans font-black text-emerald-300 mt-0.5">{currentStudent.nationalId}</p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/60">
                  <p className="text-[10px] font-sans text-slate-300">
                    سنة القبول: <strong className="text-amber-300 font-mono font-bold">{currentStudent.enrollmentYear || '2026'}</strong>
                  </p>
                  {!isExportTarget && isManagementAllowed && (
                    <button
                      type="button"
                      onClick={() => setShowEnrollmentYearEdit(!showEnrollmentYearEdit)}
                      className="text-[9px] text-amber-400 hover:text-amber-300 font-bold underline font-arabic cursor-pointer"
                      title="تعديل سنة القبول"
                    >
                      تعديل ✍️
                    </button>
                  )}
                </div>
                {!isExportTarget && showEnrollmentYearEdit && (
                  <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-700">
                    <input
                      type="text"
                      value={enrollmentYear}
                      onChange={(e) => setEnrollmentYear(e.target.value)}
                      placeholder="مثال: 2022"
                      className="w-20 bg-slate-950 text-white font-mono text-[11px] px-2 py-0.5 rounded border border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEnrollmentYear}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer font-arabic"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEnrollmentYearEdit(false)}
                      className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: EARNED & INSERTED SHIELDS AND MEDALS */}
        <div className="bg-slate-950/90 rounded-2xl p-3 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-black text-amber-300 font-arabic">
                الدروع والأوسمة المعتمدة المدرجة في البطاقة ({currentShields.length}):
              </span>
            </div>
            <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800 font-arabic">
              سجل الشرف الرسمي 🎖️
            </span>
          </div>

          {currentShields.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {currentShields.map((sh) => {
                const theme = getShieldThemeConfig(sh.title);
                return (
                  <div
                    key={sh.id}
                    className={`p-2 rounded-xl bg-gradient-to-r ${theme.gradientBg} border ${theme.borderClass} flex items-center gap-2.5 shadow-sm`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-amber-400/40 flex items-center justify-center text-base shrink-0 shadow-inner">
                      {sh.icon || theme.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className={`text-xs font-black truncate font-arabic ${theme.textClass}`}>
                        {sh.title}
                      </h4>
                      <div className="flex items-center justify-between text-[9px] text-slate-300 font-medium font-arabic">
                        <span className="truncate">{sh.category || theme.category}</span>
                        <span className="font-sans text-slate-400 shrink-0">{sh.dateAwarded}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-slate-400 font-arabic">
              لم يتم إدراج أي دروع أو أوسمة في البطاقة بعد.
            </div>
          )}
        </div>

        {/* Bottom Footer Bar: Barcode, Signatures & Stamp */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg shrink-0">
              <QrCode className="w-8 h-8 text-slate-950" />
            </div>
            <div className="text-[9px] text-slate-400 leading-tight text-right">
              <p className="font-bold text-slate-300 font-arabic">الرقم الإحصائي: {schoolAdminData.statisticalNumberDefault || '2026/MS/8890'}</p>
              <p className="font-sans">كود التحقق: MS-{currentStudent.nationalId}</p>
            </div>
          </div>

          <div className="text-center bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <p className="text-[9px] text-slate-400 font-bold font-arabic">الختم والتوقيع الرسمي المعتمد</p>
            <p className="text-xs font-black text-amber-300 mt-0.5 font-arabic">
              المديرة: {schoolAdminData.principalName || 'إلهام صبيح سعدون'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  /* BACK FACE RENDERER */
  const renderCardBack = (isExportTarget = false) => (
    <div
      className="flex flex-col h-full bg-slate-900 text-white p-6 space-y-4 justify-between font-arabic select-none"
      dir="rtl"
    >
      {/* Back Header */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-right">
            <h3 className="text-xs font-black text-white font-arabic">
              {schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}
            </h3>
            <p className="text-[10px] text-slate-400 font-arabic">شعبة شؤون الطالبات ورعاية الموهبة والإبداع</p>
          </div>
        </div>
        <span className="text-xs font-sans font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-emerald-400">
          بطاقة رسمية معتمدة
        </span>
      </div>

      {/* Back Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-right">
          <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 font-arabic">
            <User className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>ولي الأمر:</span>
          </p>
          <p className="font-bold text-white text-xs font-arabic">{currentStudent.parentName}</p>
          <p className="font-sans text-slate-300 text-[11px] flex items-center gap-1 pt-1" dir="ltr">
            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{currentStudent.parentPhone}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-right">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 font-arabic">
              <Droplet className="w-3 h-3 text-rose-400 shrink-0" />
              <span>فصيلة الدم:</span>
            </p>
            {!isExportTarget && isManagementAllowed && (
              <button
                onClick={() => setShowBloodTypeEdit(!showBloodTypeEdit)}
                className="text-[9px] text-indigo-400 hover:underline font-arabic cursor-pointer"
              >
                تعديل
              </button>
            )}
          </div>
          {!isExportTarget && showBloodTypeEdit ? (
            <div className="flex items-center gap-1 pt-1">
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
              <button
                onClick={handleSaveBloodType}
                className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold font-arabic"
              >
                حفظ
              </button>
            </div>
          ) : (
            <p className="font-sans font-black text-rose-300 text-sm">{currentStudent.bloodType || 'O+'}</p>
          )}
          <p className="text-[10px] text-slate-400 font-arabic">العنوان: ميسان - العمارة</p>
        </div>
      </div>

      {/* Official Rules & Instructions */}
      <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300 leading-relaxed text-right">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold font-arabic">
          <Info className="w-4 h-4 shrink-0" />
          <span>تعليمات وضوابط البطاقة التعريفية:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400 font-arabic">
          <li>تعتبر هذه البطاقة وثيقة تعريفية وتكريمية رسمية صادرة عن ثانوية ميسان للمتميزات.</li>
          <li>توثق البطاقة الدروع والأوسمة المعتمدة والممنوحة للطالبة من قبل اللجان العلمية والإدارية.</li>
          <li>يجب إبراز البطاقة عند المشاركة في المسابقات، الأولمبياد العلمي، واستعارة الكتب من المكتبة.</li>
          <li>في حال العثور على هذه البطاقة يرجى تسليمها لإدارة المدرسة أو الاتصال بالرقم المثبت أعلاه.</li>
        </ul>
      </div>

      {/* Barcode Strip */}
      <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-arabic">
        <span>الرقم التسلسلي: {currentStudent.id}-2026</span>
        <span className="font-sans font-bold text-slate-300">MS-GIFTED-STUDENT-CARD</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-arabic">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Hidden Multi-Page PDF Export Target Elements */}
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: '620px',
            height: 'auto',
            pointerEvents: 'none',
            zIndex: -100,
          }}
        >
          <div
            ref={frontExportRef}
            id="export-card-front"
            className="w-[600px] min-h-[480px] bg-white rounded-3xl overflow-hidden border-4 border-amber-400 shadow-none m-4"
          >
            {renderCardFront(true)}
          </div>
          <div
            ref={backExportRef}
            id="export-card-back"
            className="w-[600px] min-h-[480px] bg-slate-900 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-none m-4"
          >
            {renderCardBack(true)}
          </div>
        </div>

        {/* Hidden file input for uploading from PC or Phone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Top Modal Navigation Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 text-lg">
              🪪
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-arabic">
                  البطاقة التعريفية والأوسمة
                </span>
                <span className="text-[10px] font-sans text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  ID: {currentStudent.nationalId}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5 font-arabic">
                <span>{currentStudent.name}</span>
                <span className="text-xs font-bold text-indigo-300">({currentStudent.gradeLevel} - شعبة {currentStudent.section})</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switch Buttons */}
            <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveView('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-arabic ${
                  activeView === 'card'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة البطاقة</span>
              </button>

              {isManagementAllowed && (
                <button
                  onClick={() => setActiveView('manage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-arabic ${
                    activeView === 'manage'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>إدراج الدروع والأوسمة ({currentShields.length})</span>
                </button>
              )}
            </div>

            {/* Print & Download Actions */}
            {activeView === 'card' && (
              <>
                <button
                  onClick={() => setCardFace((prev) => (prev === 'front' ? 'back' : 'front'))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-arabic"
                  title="قلب البطاقة للوجه الآخر"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{cardFace === 'front' ? 'الوجه الخلفي' : 'الوجه الأمامي'}</span>
                </button>

                <button
                  onClick={handlePrintCard}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer font-arabic"
                  title="طباعة البطاقة"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden sm:inline">طباعة</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer font-arabic"
                  title="تصدير وتحميل كـ PDF للوجه والظهر معاً"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'جاري تصدير الوجه والظهر...' : 'تصدير PDF (الوجه والظهر)'}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700/80 transition-all ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Success Alert */}
        {exportSuccessMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 p-2.5 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 font-arabic">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* VIEW 1: ID CARD PREVIEW */}
          {activeView === 'card' && (
            <div className="space-y-6">
              {/* Card Face Switcher Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs font-arabic">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    البطاقة التعريفية الرقمية الرسمية مزودة بالدروع والأوسمة المعتمدة وكود التحقق الرقمي. عند الضغط على تصدير PDF يتم تصدير الوجه والظهر معاً.
                  </span>
                </div>
                {isManagementAllowed && (
                  <button
                    onClick={() => setActiveView('manage')}
                    className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إدراج درع أو وسام جديد في البطاقة</span>
                  </button>
                )}
              </div>

              {/* PRINTABLE / EXPORTABLE ID CARD CONTAINER */}
              <div className="flex justify-center p-2">
                <div
                  ref={cardRef}
                  id="student-official-id-card"
                  className="w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl border-4 border-amber-400/80 overflow-hidden relative font-arabic print:shadow-none print:m-0 print:w-full print:border-amber-500"
                  style={{ minHeight: '480px' }}
                >
                  {cardFace === 'front' ? renderCardFront(false) : renderCardBack(false)}
                </div>
              </div>

              {/* Bottom Quick Flip Button & Dual-Side Indicator */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCardFace((prev) => (prev === 'front' ? 'back' : 'front'))}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md font-arabic"
                >
                  <RotateCw className="w-4 h-4 text-indigo-400" />
                  <span>انقر لقلب البطاقة ومعاينة {cardFace === 'front' ? 'الوجه الخلفي 🔄' : 'الوجه الأمامي 🔄'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200 border border-emerald-500/40 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md font-arabic"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>تحميل ملف PDF للوجهين معاً 📥</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: INSERT & MANAGE SHIELDS & BADGES (إدراج وإدارة الدروع والأوسمة) */}
          {activeView === 'manage' && (
            <div className="space-y-6">

              {/* STUDENT PHOTO MANAGEMENT CARD */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white font-arabic">
                        صورة الطالبة في البطاقة التعريفية
                      </h3>
                      <p className="text-xs text-slate-400 font-arabic">
                        يمكنك تغيير الصورة برفع ملف من جهاز الحاسوب أو الهاتف المحمول
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-16 rounded-xl bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {currentStudent.avatar ? (
                        <img
                          src={currentStudent.avatar}
                          alt={currentStudent.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl select-none">👩🏻‍🎓</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200 font-arabic">
                        {currentStudent.avatar ? 'تم تعيين صورة مخصصة للطالبة' : 'الصورة الافتراضية محددة حالياً'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-arabic">
                        تدعم صيغ PNG, JPG, JPEG, WEBP بجودة عالية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md font-arabic"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختيار صورة من الجهاز 📁</span>
                    </button>
                    {currentStudent.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-arabic"
                        title="استعادة الرمز الافتراضي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>استعادة الافتراضي</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* STUDENT ADMISSION YEAR & CARD ATTRIBUTES EDIT CARD */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white font-arabic">
                        سنة القبول والبيانات الرسمية للبطاقة التعريفية
                      </h3>
                      <p className="text-xs text-slate-400 font-arabic">
                        تعديل وتحديث سنة قبول الطالبة في ثانوية المتميزات وفصيلة الدم المدرجة بالبطاقة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Enrollment Year Input */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-right">
                    <label className="block text-xs font-bold text-slate-300 font-arabic flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>سنة القبول بالمدرسة:</span>
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        الحالية: {currentStudent.enrollmentYear || '2026'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={enrollmentYear}
                        onChange={(e) => setEnrollmentYear(e.target.value)}
                        placeholder="مثال: 2022"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEnrollmentYear}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-arabic transition-all cursor-pointer shadow-md"
                      >
                        حفظ التعديل ✓
                      </button>
                    </div>
                  </div>

                  {/* Blood Type Selector */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-right">
                    <label className="block text-xs font-bold text-slate-300 font-arabic flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-rose-400" />
                        <span>فصيلة الدم (الظهر):</span>
                      </span>
                      <span className="text-[10px] text-rose-300 font-mono font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                        الحالية: {currentStudent.bloodType || 'O+'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveBloodType}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-arabic transition-all cursor-pointer shadow-md"
                      >
                        حفظ الفصيلة ✓
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENTLY INSERTED SHIELDS SECTION */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white font-arabic">
                        الدروع والأوسمة المدرجة حالياً في بطاقة الطالبة ({currentShields.length})
                      </h3>
                      <p className="text-xs text-slate-400 font-arabic">
                        تظهر هذه الدروع مباشرة على الوجه الأمامي لبطاقة الهوية التعريفية للطالبة
                      </p>
                    </div>
                  </div>
                </div>

                {currentShields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentShields.map((sh) => {
                      const theme = getShieldThemeConfig(sh.title);
                      return (
                        <div
                          key={sh.id}
                          className={`p-3.5 rounded-2xl bg-gradient-to-r ${theme.gradientBg} border ${theme.borderClass} flex items-start justify-between gap-3 shadow-md`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
                              {sh.icon || theme.icon}
                            </div>
                            <div className="min-w-0 space-y-1 text-right">
                              <h4 className={`text-xs sm:text-sm font-black truncate font-arabic ${theme.textClass}`}>
                                {sh.title}
                              </h4>
                              <p className="text-[11px] text-slate-300 leading-snug font-arabic">{sh.reason || theme.defaultReason}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-1 font-arabic">
                                <span className="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                                  {sh.category || theme.category}
                                </span>
                                <span className="font-sans text-amber-300/80">{sh.dateAwarded}</span>
                                <span className="text-slate-400">المانح: {sh.issuedBy || theme.defaultIssuedBy}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveShield(sh.id)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition-all shrink-0 cursor-pointer"
                            title="استبعاد هذا الدرع من البطاقة التعريفية"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-2 font-arabic">
                    <Award className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">لم يتم إدراج أي أوسمة أو دروع للطالبة حتى الآن.</p>
                    <p className="text-[11px] text-slate-500">
                      اختاري من قائمة الأوسمة المعتمدة أدناه لإدراجها بنقرة واحدة في بطاقتها التعريفية.
                    </p>
                  </div>
                )}
              </div>

              {/* PRESET OFFICIAL SHIELDS AND BADGES CATALOG (1-CLICK INSERT) */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-amber-300 font-arabic">
                        الدروع والأوسمة الرسمية المعتمدة (إدراج فوري بنقرة واحدة)
                      </h3>
                      <p className="text-xs text-slate-400 font-arabic">
                        انقري على "إدراج في البطاقة ✓" لإضافة الدرع الرسمي فوراً إلى هوية الطالبة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESET_SHIELDS_AND_BADGES.map((preset) => {
                    const isAlreadyAdded = currentShields.some((s) => s.title === preset.title);
                    return (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-2xl bg-gradient-to-r ${preset.gradientBg} border ${preset.borderClass} flex flex-col justify-between gap-3 shadow-sm transition-all hover:scale-[1.01]`}
                      >
                        <div className="space-y-1.5 text-right">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xl">{preset.icon}</span>
                            <span className="text-[9px] font-bold bg-slate-900/80 px-2 py-0.5 rounded-full text-slate-300 border border-slate-800 font-arabic">
                              {preset.category}
                            </span>
                          </div>

                          <h4 className={`text-xs font-black ${preset.textClass} leading-snug font-arabic`}>
                            {preset.title}
                          </h4>

                          <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed font-arabic">
                            {preset.defaultReason}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          {isAlreadyAdded ? (
                            <div className="w-full py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-1 font-arabic">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>مدرج في البطاقة ✓</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddPresetShield(preset)}
                              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer font-arabic"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-950" />
                              <span>إدراج في البطاقة التعريفية</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM SHIELD / BADGE CREATOR FORM */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white font-arabic">
                      إدراج درع أو وسام خاص / مخصص
                    </h3>
                    <p className="text-xs text-slate-400 font-arabic">
                      يمكنكِ إدخال عنوان ومواصفات أي جائزة، تكريم وزاري، أو مسابقة خاصة لإدراجها في البطاقة
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddCustomShield} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    
                    {/* Shield Title */}
                    <div className="space-y-1 sm:col-span-2 text-right">
                      <label className="font-bold text-slate-300 font-arabic">مسمى الدرع أو الوسام:</label>
                      <input
                        type="text"
                        placeholder="مثال: ⚡ درع تورنغ للمبتكرات الرقمية أو وسام الإبداع الفصيح"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-arabic"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-1 text-right">
                      <label className="font-bold text-slate-300 font-arabic">الأيقونة الرمزية:</label>
                      <select
                        value={customIcon}
                        onChange={(e) => setCustomIcon(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-arabic"
                      >
                        <option value="⚡">⚡ درع البرمجة والتكنولوجيا</option>
                        <option value="🌟">🌟 وسام الرياضيات والذكاء</option>
                        <option value="🔬">🔬 وسام الفيزياء والكيمياء</option>
                        <option value="🌿">🌿 وسام العلوم والطب</option>
                        <option value="👑">👑 وسام بطلة التحديات</option>
                        <option value="🎨">🎨 درع الآداب والفنون</option>
                        <option value="🎖️">🎖️ درع التفوق الأكاديمي</option>
                        <option value="✨">✨ وسام الالتزام والمواظبة</option>
                        <option value="🏆">🏆 كأس الابتكار والموهبة</option>
                        <option value="🥇">🥇 وسام المركز الأول</option>
                        <option value="🥈">🥈 وسام المركز الثاني</option>
                        <option value="🥉">🥉 وسام المركز الثالث</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-1 text-right">
                      <label className="font-bold text-slate-300 font-arabic">المجال / القسم العلمي:</label>
                      <input
                        type="text"
                        placeholder="مثال: الحاسوب والتكنولوجيا، الرياضيات، العلوم..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-arabic"
                      />
                    </div>

                    {/* Issued By */}
                    <div className="space-y-1 text-right">
                      <label className="font-bold text-slate-300 font-arabic">الجهة المانحة للتكريم:</label>
                      <input
                        type="text"
                        placeholder="مثال: إدارة المدرسة / قسم الحاسوب"
                        value={customIssuedBy}
                        onChange={(e) => setCustomIssuedBy(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-arabic"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-1 text-right">
                      <label className="font-bold text-slate-300 font-arabic">تاريخ المنح:</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 font-sans"
                      />
                    </div>

                    {/* Reason */}
                    <div className="space-y-1 sm:col-span-3 text-right">
                      <label className="font-bold text-slate-300 font-arabic">سبب المنح وتفاصيل الإنجاز:</label>
                      <input
                        type="text"
                        placeholder="مثال: الفوز بالمركز الأول في مسابقة الذكاء الاصطناعي وتطوير المشاريع الرقمية"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400 font-arabic"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer font-arabic"
                    >
                      <Plus className="w-4 h-4 text-amber-300" />
                      <span>إدراج الدرع المخصص في البطاقة التعريفية 🎖️</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0 font-arabic">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>البطاقة التعريفية متزامنة مع السجل الأكاديمي ولوحة الشرف المدرسية.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView(activeView === 'card' ? 'manage' : 'card')}
              className="text-indigo-400 hover:underline font-bold cursor-pointer"
            >
              {activeView === 'card' ? 'الانتقال إلى لوحة إدراج الأوسمة 🎖️' : 'الرجوع لمعاينة البطاقة التعريفية 🪪'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
