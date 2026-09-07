import React, { useState } from 'react';
import {
  X,
  Share2,
  MessageCircle,
  Send,
  Mail,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StudentCertificate, CertificateModelType, CERTIFICATE_MODELS } from '../types';
import { savePdfBlob, sharePdfFile } from '../utils/pdfExporter';

interface SharePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificate | null;
  initialModel?: CertificateModelType;
  onGeneratePdfBlob?: (model?: CertificateModelType) => Promise<{ blob: Blob; fileName: string } | null>;
}

export const SharePdfModal: React.FC<SharePdfModalProps> = ({
  isOpen,
  onClose,
  certificate,
  initialModel,
  onGeneratePdfBlob,
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedModel, setSelectedModel] = useState<CertificateModelType>(
    initialModel || certificate?.certificateModel || 'model3_final_round1'
  );

  if (!isOpen || !certificate) return null;

  const schoolName = 'ثانوية ميسان للمتميزات';
  const academicYear = certificate.academicYear || '2026 - 2027';
  const totalMarks = (certificate as any).totalMarks || (certificate.subjects?.reduce((acc: number, s: any) => acc + (s.finalGrade || s.midYearGrade || 0), 0) || 0);
  const average = (certificate as any).average || certificate.overallFinalGrade || certificate.overallMidYearGrade || 0;
  const currentModelObj = CERTIFICATE_MODELS.find((m) => m.id === selectedModel);
  const modelName = currentModelObj?.titleAr || 'الشهادة المدرسية';

  const shareTitle = `الشهادة والنتيجة الرسمية (${modelName}) للطالبة (${certificate.studentName}) - ${schoolName}`;
  const summaryText = `🎓 *النتيجة والشهادة الرسمية - ${schoolName}*
----------------------------------------
📜 النموذج: *${modelName}*
👤 الطالبة: ${certificate.studentName}
📚 الصف: ${certificate.gradeLevel} (${certificate.section ? `شعبة ${certificate.section}` : 'عام'})
📊 النتيجة: *${certificate.status}*
💯 المجموع الكلي: ${totalMarks}
⭐ المعدل العام: %${average}
📅 العام الدراسي: ${academicYear}
----------------------------------------
رمز الوثيقة الإلكترونية: ${certificate.id}
تم الإصدار والتوثيق رسمياً من المنظومة الإلكترونية لثانوية ميسان للمتميزات.`;

  const handleNativeShare = async () => {
    setIsProcessing(true);
    setStatusMsg('جاري تجهيز ملف الـ PDF وتفعيل نافذة المشاركة...');
    try {
      if (onGeneratePdfBlob) {
        const result = await onGeneratePdfBlob(selectedModel);
        if (result) {
          const success = await sharePdfFile(
            result.blob,
            result.fileName,
            shareTitle,
            summaryText
          );
          if (success) {
            setStatusMsg('تم فتح نافذة المشاركة بنجاح');
          }
        }
      } else if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: summaryText,
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsProcessing(true);
    setStatusMsg('جاري تحضير ملف الـ PDF وتجهيز واتساب...');
    try {
      if (onGeneratePdfBlob) {
        const result = await onGeneratePdfBlob(selectedModel);
        if (result) {
          await savePdfBlob(result.blob, result.fileName);
        }
      }
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('WhatsApp share error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTelegramShare = async () => {
    setIsProcessing(true);
    setStatusMsg('جاري تجهيز التليغرام...');
    try {
      if (onGeneratePdfBlob) {
        const result = await onGeneratePdfBlob(selectedModel);
        if (result) {
          await savePdfBlob(result.blob, result.fileName);
        }
      }
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent('https://maysan-school.edu.iq')}&text=${encodeURIComponent(summaryText)}`;
      window.open(tgUrl, '_blank');
    } catch (err) {
      console.error('Telegram share error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailShare = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(summaryText)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 relative">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-amber-300 border border-indigo-500/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>نشر ومشاركة الشهادة عبر وسائط النقل</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                الطالبة: <span className="text-amber-300 font-bold">{certificate.studentName}</span> ({certificate.gradeLevel})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Loading Bar */}
        {isProcessing && (
          <div className="px-6 py-2.5 bg-indigo-950/90 border-b border-indigo-800/80 flex items-center gap-2 text-xs text-amber-300 font-bold animate-pulse">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{statusMsg || 'جاري المعالجة...'}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Certificate Model Selector in Share Modal */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">النموذج المراد تصديره ومشاركته:</span>
              <span className="text-[11px] text-slate-400">
                {currentModelObj?.shortTitle || 'النموذج المحدد'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CERTIFICATE_MODELS.map((model) => {
                const isActive = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-2 rounded-xl text-[11px] font-bold text-right transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300/80 font-black'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{model.icon}</span>
                    <span className="truncate">{model.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            يمكنك مشاركة وتصدير النتيجة والشهادة الرسمية بملف <strong>PDF</strong> عالي الدقة مباشرة عبر منصات التواصل والتطبيقات المثبتة على جهازك:
          </p>

          {/* Share Grid Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Direct Web Share API with File Attachment */}
            <button
              onClick={handleNativeShare}
              disabled={isProcessing}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-between shadow-lg transition cursor-pointer disabled:opacity-50 group border border-emerald-400/30 col-span-1 sm:col-span-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-sm">المشاركة المباشرة كملف PDF</span>
                  <span className="text-[10px] text-emerald-100 font-normal">إرسال ملف PDF عبر التطبيقات المثبتة بالنظام</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              disabled={isProcessing}
              className="p-3.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 font-bold text-xs flex items-center gap-3 border border-emerald-600/40 transition cursor-pointer disabled:opacity-50"
            >
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="block font-black text-white">واتساب WhatsApp</span>
                <span className="text-[10px] text-emerald-300 font-normal">تنزيل الـ PDF ونشر النتيجة</span>
              </div>
            </button>

            {/* Telegram Share */}
            <button
              onClick={handleTelegramShare}
              disabled={isProcessing}
              className="p-3.5 rounded-2xl bg-sky-900/60 hover:bg-sky-800/80 text-sky-200 font-bold text-xs flex items-center gap-3 border border-sky-600/40 transition cursor-pointer disabled:opacity-50"
            >
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="block font-black text-white">تليغرام Telegram</span>
                <span className="text-[10px] text-sky-300 font-normal">نشر ومشاركة بضغطة زر</span>
              </div>
            </button>

            {/* Email Share */}
            <button
              onClick={handleEmailShare}
              disabled={isProcessing}
              className="p-3.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 font-bold text-xs flex items-center gap-3 border border-indigo-600/40 transition cursor-pointer disabled:opacity-50"
            >
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="block font-black text-white">البريد الإلكتروني Email</span>
                <span className="text-[10px] text-indigo-300 font-normal">إرسال التقرير الرسمي</span>
              </div>
            </button>

            {/* Copy Result Summary */}
            <button
              onClick={handleCopyText}
              disabled={isProcessing}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-3 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <div className="p-2 rounded-xl bg-slate-700 text-amber-300">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </div>
              <div className="text-right">
                <span className="block font-black text-white">
                  {copied ? 'تم النسخ للحافظة!' : 'نسخ نص النتيجة'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">نسخ التقرير للنسخ واللصق</span>
              </div>
            </button>

          </div>

          {/* Direct PDF Download Option */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={async () => {
                if (onGeneratePdfBlob) {
                  setIsProcessing(true);
                  setStatusMsg('جاري التنزيل المباشر كملف PDF...');
                  try {
                    const res = await onGeneratePdfBlob();
                    if (res) {
                      await savePdfBlob(res.blob, res.fileName);
                    }
                  } finally {
                    setIsProcessing(false);
                  }
                }
              }}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-800 transition cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تنزيل نسخة PDF مباشرة إلى جهازك (Downloads)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400">
          تطبيق الموثوقية الرسمية - ثانوية ميسان للمتميزات
        </div>

      </div>
    </div>
  );
};
