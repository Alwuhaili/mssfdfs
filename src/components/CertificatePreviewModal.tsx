import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  School,
  Trash2,
  Share2,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Award,
} from 'lucide-react';
import { StudentCertificate, SchoolAdminData, UserRole, CertificateModelType, CERTIFICATE_MODELS } from '../types';
import { OfficialCertificateA4Template } from './OfficialCertificateA4Template';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificate | null;
  certificatesList?: StudentCertificate[];
  onSelectCertificate?: (cert: StudentCertificate) => void;
  onDownloadPdf: (scope: 'selected' | 'class' | 'all', model?: CertificateModelType) => void;
  onSharePdf?: (model?: CertificateModelType) => void;
  onPrint: (cert?: StudentCertificate, model?: CertificateModelType) => void;
  onDeleteCertificate?: (cert: StudentCertificate) => void;
  schoolAdminData: SchoolAdminData;
  role: UserRole;
  teacherSubject?: string;
  isExportingPdf?: boolean;
  exportProgressText?: string;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  isOpen,
  onClose,
  certificate,
  certificatesList = [],
  onSelectCertificate,
  onDownloadPdf,
  onSharePdf,
  onPrint,
  onDeleteCertificate,
  schoolAdminData,
  role,
  teacherSubject = '',
  isExportingPdf = false,
  exportProgressText = '',
}) => {
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [selectedModel, setSelectedModel] = useState<CertificateModelType>(
    certificate?.certificateModel || 'model3_final_round1'
  );

  const sortedCertificatesList = React.useMemo(() => {
    return [...certificatesList].sort((a, b) =>
      a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' })
    );
  }, [certificatesList]);

  if (!isOpen || !certificate) return null;

  const currentIndex = sortedCertificatesList.findIndex((c) => c.id === certificate.id);
  const hasMultiple = sortedCertificatesList.length > 1;

  const handlePrevStudent = () => {
    if (hasMultiple && currentIndex > 0 && onSelectCertificate) {
      onSelectCertificate(sortedCertificatesList[currentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (hasMultiple && currentIndex < sortedCertificatesList.length - 1 && onSelectCertificate) {
      onSelectCertificate(sortedCertificatesList[currentIndex + 1]);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ناجحة' || status === 'ناجحة بالدور الثاني') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{status}</span>
        </span>
      );
    }
    if (status === 'مكملة') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn print:hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-100 relative">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-amber-300">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>معاينة النماذج الخمسة المعتمدة للشهادة المدرسية (A4)</span>
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    5 نماذج رسمية معتمدة
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                الطالبة: <span className="font-bold text-amber-300">{certificate.studentName}</span> | {certificate.gradeLevel} (شعبة {certificate.section || 'أ'})
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {onSharePdf && (
              <button
                onClick={() => onSharePdf(selectedModel)}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-950/40 transition cursor-pointer disabled:opacity-50"
                title="نشر ومشاركة الشهادة عبر وسائط النقل (واتساب/تليغرام/PDF)"
              >
                <Share2 className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">نشر ومشاركة 📲</span>
              </button>
            )}

            <button
              onClick={() => onDownloadPdf('selected', selectedModel)}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
              title="تنزيل وتخزين ملف الـ PDF فوراً على حاسوبك"
            >
              <Download className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>تنزيل PDF 📄</span>
            </button>

            <button
              onClick={() => onPrint(certificate, selectedModel)}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-950/40 transition cursor-pointer disabled:opacity-50"
              title="فتح نافذة الطباعة الورقية المباشرة"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>طباعة ورقية 🖨️</span>
            </button>

            {role === 'admin' && onDeleteCertificate && (
              <button
                onClick={() => onDeleteCertificate(certificate)}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-950/30 cursor-pointer disabled:opacity-50"
                title="حذف هذه الشهادة من قاعدة البيانات"
              >
                <Trash2 className="w-4 h-4 text-rose-200" />
                <span className="hidden sm:inline">حذف</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Models Selection Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-slate-400 font-extrabold flex items-center gap-1 whitespace-nowrap pl-2 border-l border-slate-800">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>اختر النموذج:</span>
            </span>

            <div className="flex items-center gap-1.5">
              {CERTIFICATE_MODELS.map((model) => {
                const isActive = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 ring-2 ring-amber-300/60'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white'
                    }`}
                    title={model.descAr}
                  >
                    <span>{model.icon}</span>
                    <span>{model.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom & Navigation Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Multi-Student Switcher */}
            {hasMultiple && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handlePrevStudent}
                  disabled={currentIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition cursor-pointer"
                  title="الطالبة السابقة (أبجدياً)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {onSelectCertificate ? (
                  <select
                    value={certificate.id}
                    onChange={(e) => {
                      const found = sortedCertificatesList.find((c) => c.id === e.target.value);
                      if (found) onSelectCertificate(found);
                    }}
                    className="bg-slate-950 text-amber-300 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none max-w-[170px] truncate cursor-pointer"
                    title="قائمة الطالبات مرتبة أبجدياً"
                  >
                    {sortedCertificatesList.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {i + 1}. {c.studentName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 font-bold text-amber-300 text-xs">
                    {currentIndex + 1} / {sortedCertificatesList.length}
                  </span>
                )}

                <button
                  onClick={handleNextStudent}
                  disabled={currentIndex >= sortedCertificatesList.length - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition cursor-pointer"
                  title="الطالبة التالية (أبجدياً)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.4, prev - 0.1))}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-amber-300 font-bold w-10 text-center text-xs">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.1))}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale(0.85)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition border-r border-slate-800 pr-1.5"
                title="إعادة الضبط"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Body - Live Canvas View */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/90 flex justify-center items-start relative min-h-[450px]">
          {isExportingPdf && (
            <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-amber-400 animate-spin" />
                <FileText className="w-7 h-7 text-amber-300 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-lg font-black text-white">{exportProgressText || 'جاري معالجة وتصدير الشهادة...'}</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md">
                سيتم حفظ ملف الـ PDF مباشرة وتلقائياً على حاسوبك في مجلد التنزيل Downloads.
              </p>
            </div>
          )}

          {/* Certificate A4 Canvas Container with Scaled Zoom */}
          <div
            className="transition-transform duration-200 ease-out origin-top shadow-2xl rounded-2xl"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <div className="bg-white rounded-2xl text-slate-900 shadow-2xl overflow-hidden pointer-events-auto">
              <OfficialCertificateA4Template
                cert={certificate}
                schoolAdminData={schoolAdminData}
                role={role}
                teacherSubject={teacherSubject}
                modelType={selectedModel}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <School className="w-4 h-4 text-indigo-400" />
            <span>{schoolAdminData.schoolNameAr || 'ثانوية ميسان للمتميزات'}</span>
            <span className="text-slate-600">•</span>
            <span>النموذج النشط: <strong className="text-amber-300 font-bold">{CERTIFICATE_MODELS.find(m => m.id === selectedModel)?.titleAr}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownloadPdf('selected', selectedModel)}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>تنزيل هذا النموذج كـ PDF</span>
            </button>

            <button
              onClick={() => onPrint(certificate, selectedModel)}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة ورقية</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
