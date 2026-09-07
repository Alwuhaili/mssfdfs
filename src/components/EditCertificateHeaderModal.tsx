/**
 * Edit Official Certificate Header & Branding Modal
 * تعديل ترويسة وشعار وهيدر الشهادة الرسمية لثانوية ميسان للمتميزات
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Save,
  Award,
  Upload,
  Calendar,
  Hash,
  UserCheck,
  Crown,
  FileCheck2,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
} from 'lucide-react';

interface EditCertificateHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset Logos for fast selection
const PRESET_LOGOS = [
  {
    name: 'الشعار الأكاديمي الشرفي الذهبي',
    url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'شعار وزارة التربية والتميز',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'الشعار العلمي العصري لميسان',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
  },
];

export const EditCertificateHeaderModal: React.FC<EditCertificateHeaderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { schoolAdminData, updateSchoolAdminData, updateCertificate, certificates, lang } = useApp();
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [schoolLogoUrl, setSchoolLogoUrl] = useState(
    schoolAdminData.schoolLogoUrl || PRESET_LOGOS[0].url
  );
  const [schoolNameEn, setSchoolNameEn] = useState(
    schoolAdminData.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students'
  );
  const [academicYearDefault, setAcademicYearDefault] = useState(
    schoolAdminData.academicYearDefault || '2026 - 2027'
  );
  const [statisticalNumberDefault, setStatisticalNumberDefault] = useState(
    schoolAdminData.statisticalNumberDefault || '2026/MS/8890'
  );
  const [issueDateDefault, setIssueDateDefault] = useState(
    schoolAdminData.issueDateDefault || '2027-06-25'
  );
  const [principalNameOnCert, setPrincipalNameOnCert] = useState(
    schoolAdminData.principalNameOnCert || schoolAdminData.principalName || 'الهام صبيح سعدون'
  );
  const [auditorCommitteeMemberName, setAuditorCommitteeMemberName] = useState(
    schoolAdminData.auditorCommitteeMemberName || 'رئيسة لجنة التدقيق والنتائج'
  );

  const [applyToAllCertificates, setApplyToAllCertificates] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSchoolLogoUrl(
        schoolAdminData.schoolLogoUrl || PRESET_LOGOS[0].url
      );
      setSchoolNameEn(
        schoolAdminData.schoolNameEn || 'Maysan Secondary School For Distinguished Female Students'
      );
      setAcademicYearDefault(
        schoolAdminData.academicYearDefault || '2026 - 2027'
      );
      setStatisticalNumberDefault(
        schoolAdminData.statisticalNumberDefault || '2026/MS/8890'
      );
      setIssueDateDefault(
        schoolAdminData.issueDateDefault || '2027-06-25'
      );
      setPrincipalNameOnCert(
        schoolAdminData.principalNameOnCert || schoolAdminData.principalName || 'الهام صبيح سعدون'
      );
      setAuditorCommitteeMemberName(
        schoolAdminData.auditorCommitteeMemberName || 'رئيسة لجنة التدقيق والنتائج'
      );
    }
  }, [isOpen, schoolAdminData]);

  if (!isOpen) return null;

  // File Upload handler (Local file -> Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update Global School Admin Settings
    updateSchoolAdminData({
      schoolLogoUrl,
      schoolNameEn,
      academicYearDefault,
      statisticalNumberDefault,
      issueDateDefault,
      principalNameOnCert,
      auditorCommitteeMemberName,
      principalName: principalNameOnCert || schoolAdminData.principalName,
    });

    // 2. If user checked "apply to all existing certificates", update each certificate
    if (applyToAllCertificates) {
      certificates.forEach((cert) => {
        updateCertificate(cert.id, {
          academicYear: academicYearDefault,
          issueDate: issueDateDefault,
        });
      });
    }

    alert(
      lang === 'ar'
        ? 'تم حفظ ترويسة الشهادة الرسمية وشعار المدرسة وأسماء اللجان بنجاح!'
        : 'Official certificate header, logo, and signees updated successfully!'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-arabic print:hidden">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden space-y-6 p-6 sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>إعدادات ترويسة الشهادة وشعار المدرسة الرسمي</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  معتمدة للطباعة A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                خصص شعار المدرسة الرسمي، الاسم بالإنجليزية، العام الدراسي، والجهات الموقعة على نتائج الطالبات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Logo & English School Name */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>شعار المدرسة الرسمي والاسم باللغة الإنجليزية:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold">المعاينة الحالية للشعار (اضغط للتغيير)</span>
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="relative group w-20 h-20 rounded-2xl bg-white border-2 border-amber-400/80 p-1 flex items-center justify-center overflow-hidden shadow-lg cursor-pointer"
                  title="اضغط لتغيير الشعار من مستكشف الملفات"
                >
                  {Boolean(schoolLogoUrl && schoolLogoUrl.trim()) ? (
                    <img
                      src={schoolLogoUrl}
                      alt="شعار المدرسة"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl font-black text-slate-900">م</span>
                  )}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Camera className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رابط صورة الشعار (Logo URL) أو رفع ملف الشعار:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={schoolLogoUrl}
                      onChange={(e) => setSchoolLogoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>رفع صورة</span>
                    </button>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Preset Logo Selector */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    أو اختر شعار جاهز عالي الدقة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LOGOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSchoolLogoUrl(p.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border font-bold flex items-center gap-1.5 transition-all ${
                          schoolLogoUrl === p.url
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <img src={p.url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>اسم المدرسة باللغة الإنجليزية (English School Name) *</span>
              </label>
              <input
                type="text"
                required
                value={schoolNameEn}
                onChange={(e) => setSchoolNameEn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                placeholder="Maysan Secondary School For Distinguished Female Students"
              />
            </div>
          </div>

          {/* Section 2: Academic Year, Statistical Number, and Issue Date */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>بيانات التوثيق (العام الدراسي، الرقم الإحصائي، والتاريخ):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>العام الدراسي *</span>
                </label>
                <input
                  type="text"
                  required
                  value={academicYearDefault}
                  onChange={(e) => setAcademicYearDefault(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="2026 - 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الرقم الإحصائي *</span>
                </label>
                <input
                  type="text"
                  required
                  value={statisticalNumberDefault}
                  onChange={(e) => setStatisticalNumberDefault(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="2026/MS/8890"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تاريخ صدور الشهادة *</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDateDefault}
                  onChange={(e) => setIssueDateDefault(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Signees (Principal & Auditor Committee) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>الجهات والتوقيعات الرسمية المعتمدة أسفل الشهادة:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>اسم مديرة ثانوية ميسان للمتميزات *</span>
                </label>
                <input
                  type="text"
                  required
                  value={principalNameOnCert}
                  onChange={(e) => setPrincipalNameOnCert(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="الهام صبيح سعدون"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>اسم عضو لجنة التدقيق والنتائج *</span>
                </label>
                <input
                  type="text"
                  required
                  value={auditorCommitteeMemberName}
                  onChange={(e) => setAuditorCommitteeMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="أدخل اسم رئيسة/عضو لجنة التدقيق والنتائج..."
                />
              </div>
            </div>
          </div>

          {/* Sync Option */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <input
              type="checkbox"
              id="applyToAll"
              checked={applyToAllCertificates}
              onChange={(e) => setApplyToAllCertificates(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="applyToAll" className="text-xs font-semibold text-slate-300 cursor-pointer">
              تطبيق العام الدراسي وتاريخ الصدور فوراً على جميع شهادات الطالبات المسجلة
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>حفظ وتطبيق التغييرات فوراً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
