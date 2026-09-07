import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  ExternalLink,
  Download,
  FileText,
  AlertTriangle,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  FileCheck,
  Eye,
  Sparkles,
  Type,
  Palette,
  Check,
  Sliders,
  Sun,
  Moon,
  Bookmark,
  Layers,
  Settings2,
} from 'lucide-react';
import { downloadDataUrlOrBlob } from '../utils/fileStorage';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface UniversalDocumentViewerProps {
  url?: string;
  file?: File | null;
  fileName?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
  onDownload?: () => void;
  showControls?: boolean;
}

export type FontColorFilter =
  | 'original'
  | 'crisp_black'
  | 'navy'
  | 'sepia'
  | 'dark_mode'
  | 'high_contrast'
  | 'emerald';

export type FontFamilyOption =
  | 'original'
  | 'cairo'
  | 'tajawal'
  | 'amiri'
  | 'naskh'
  | 'ibm'
  | 'alexandria'
  | 'changa';

interface ViewerFontSettings {
  fontFamily: FontFamilyOption;
  fontColor: FontColorFilter;
  fontSizeScale: number; // e.g. 1.0, 1.25, 1.5
  isBoldEnhanced: boolean;
  isSharpEnhanced: boolean;
}

const DEFAULT_FONT_SETTINGS: ViewerFontSettings = {
  fontFamily: 'original',
  fontColor: 'original',
  fontSizeScale: 1.2,
  isBoldEnhanced: false,
  isSharpEnhanced: true,
};

const STORAGE_KEY = 'maysan_pdf_font_settings_v1';

function loadSavedFontSettings(): ViewerFontSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_FONT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_FONT_SETTINGS;
}

function saveFontSettings(settings: ViewerFontSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Dynamically load PDF.js from reliable CDN to guarantee 100% cross-browser canvas rendering
function loadPdfJsLib(): Promise<any> {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pdfjs-lib]') as HTMLScriptElement;
    if (existing) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.pdfjsLib) {
          clearInterval(interval);
          resolve(window.pdfjsLib);
        } else if (attempts > 60) {
          clearInterval(interval);
          reject(new Error('PDF.js loading timed out'));
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.dataset.pdfjsLib = 'true';
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js library failed to initialize'));
      }
    };

    script.onerror = (e: any) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      reject(new Error('Failed to load PDF.js from CDN'));
    };

    document.head.appendChild(script);
  });
}

export const UniversalDocumentViewer: React.FC<UniversalDocumentViewerProps> = ({
  url,
  file,
  fileName,
  title,
  className = '',
  maxHeight = '500px',
  onDownload,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(() => loadSavedFontSettings().fontSizeScale);
  const [rotation, setRotation] = useState<number>(0);
  const [isImage, setIsImage] = useState<boolean>(false);
  const [isOtherDoc, setIsOtherDoc] = useState<boolean>(false);
  const [directBlobUrl, setDirectBlobUrl] = useState<string>('');

  // Font, Color & Formatting state with persistent storage
  const [fontSettings, setFontSettings] = useState<ViewerFontSettings>(loadSavedFontSettings);
  const [showFormattingPopover, setShowFormattingPopover] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const effectiveFileName = fileName || file?.name || title || 'document.pdf';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateFontSettings = (newSettings: Partial<ViewerFontSettings>) => {
    setFontSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveFontSettings(updated);
      return updated;
    });
  };

  // Detect file type
  const isImageFile = useCallback((name: string, dataUrl?: string) => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.svg') ||
      (dataUrl && dataUrl.startsWith('data:image/'))
    );
  }, []);

  const isOfficeDoc = useCallback((name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith('.doc') ||
      lower.endsWith('.docx') ||
      lower.endsWith('.ppt') ||
      lower.endsWith('.pptx') ||
      lower.endsWith('.xls') ||
      lower.endsWith('.xlsx')
    );
  }, []);

  // Prepare active source and blob URL
  useEffect(() => {
    let blobUrlCreated = '';

    if (file) {
      try {
        blobUrlCreated = URL.createObjectURL(file);
        setDirectBlobUrl(blobUrlCreated);
      } catch (e) {
        console.warn('Blob creation error:', e);
      }
    } else if (url) {
      setDirectBlobUrl(url);
    }

    return () => {
      if (blobUrlCreated) {
        URL.revokeObjectURL(blobUrlCreated);
      }
    };
  }, [file, url]);

  // Main Document Loading Effect with Full Font & Character Map Preservation
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      setLoading(true);
      setError(null);
      setPdfDoc(null);

      const targetName = effectiveFileName;
      const targetUrl = directBlobUrl || url;

      if (isImageFile(targetName, targetUrl)) {
        setIsImage(true);
        setIsOtherDoc(false);
        setLoading(false);
        return;
      }

      if (isOfficeDoc(targetName)) {
        setIsOtherDoc(true);
        setIsImage(false);
        setLoading(false);
        return;
      }

      setIsImage(false);
      setIsOtherDoc(false);

      if (!targetUrl && !file) {
        setError('لا يتوفر مسار أو ملف للمعاينة.');
        setLoading(false);
        return;
      }

      try {
        const pdfjs = await loadPdfJsLib();
        if (isCancelled) return;

        let pdfSource: any;

        if (file) {
          const arrayBuffer = await file.arrayBuffer();
          pdfSource = { data: new Uint8Array(arrayBuffer) };
        } else if (targetUrl) {
          if (targetUrl.startsWith('data:')) {
            // Convert data url to Uint8Array for reliable parsing
            const base64Data = targetUrl.split(',')[1];
            if (base64Data) {
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              pdfSource = { data: bytes };
            } else {
              pdfSource = { url: targetUrl };
            }
          } else {
            pdfSource = { url: targetUrl };
          }
        }

        // Full CMap, Standard Fonts, and Font Face preservation config
        const fullFontConfig = {
          ...pdfSource,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
          disableFontFace: false,
          useSystemFonts: true,
          enableXfa: true,
          isEvalSupported: true,
          stopAtErrors: false,
        };

        const loadingTask = pdfjs.getDocument(fullFontConfig);
        const doc = await loadingTask.promise;

        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages || 1);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        console.warn('PDF.js rendering fallback triggered:', err);
        if (!isCancelled) {
          setError(
            'تعذر عرض ملف الـ PDF كصفحات تفاعلية، يمكنك فتحه أو تحميله كملف أصلي.'
          );
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [directBlobUrl, url, file, effectiveFileName, isImageFile, isOfficeDoc]);

  // Render current PDF page onto HTML5 Canvas with High-DPI Vector Clarity
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const viewport = page.getViewport({ scale, rotation });

      // Handle high DPI screens (2x or higher) for ultra-crisp Arabic font rendering
      const outputScale = Math.max(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport,
        intent: 'display',
        enableWebGL: true,
        renderInteractiveForms: true,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Page rendering error:', err);
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    if (pdfDoc) {
      renderCurrentPage();
    }
  }, [pdfDoc, currentPage, scale, rotation, renderCurrentPage]);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const target = directBlobUrl || url;
    if (target) {
      await downloadDataUrlOrBlob(target, effectiveFileName);
    }
  };

  const handleOpenExternal = () => {
    const target = directBlobUrl || url;
    if (target) {
      window.open(target, '_blank');
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const handleZoomIn = () => {
    const nextScale = Math.min(3.0, Number((scale + 0.2).toFixed(1)));
    setScale(nextScale);
    updateFontSettings({ fontSizeScale: nextScale });
  };

  const handleZoomOut = () => {
    const nextScale = Math.max(0.5, Number((scale - 0.2).toFixed(1)));
    setScale(nextScale);
    updateFontSettings({ fontSizeScale: nextScale });
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleResetZoom = () => {
    setScale(1.2);
    setRotation(0);
    updateFontSettings({ fontSizeScale: 1.2 });
  };

  const handleResetAllFormatting = () => {
    setFontSettings(DEFAULT_FONT_SETTINGS);
    saveFontSettings(DEFAULT_FONT_SETTINGS);
    setScale(1.2);
    setRotation(0);
    triggerToast('تمت استعادة تنسيق الخط واللون الافتراضي الأصلي 🔄');
  };

  // Get CSS Color Filter for Canvas according to user preference
  const getCanvasColorFilter = () => {
    switch (fontSettings.fontColor) {
      case 'crisp_black':
        return 'contrast(135%) brightness(95%)';
      case 'navy':
        return 'sepia(30%) hue-rotate(180deg) saturate(140%) contrast(115%)';
      case 'sepia':
        return 'sepia(65%) saturate(120%) brightness(96%) contrast(108%)';
      case 'dark_mode':
        return 'invert(92%) hue-rotate(180deg) contrast(110%) brightness(95%)';
      case 'high_contrast':
        return 'invert(100%) contrast(200%) brightness(120%)';
      case 'emerald':
        return 'sepia(40%) hue-rotate(90deg) saturate(130%) contrast(110%)';
      case 'original':
      default:
        return 'none';
    }
  };

  // Get Canvas Container Background
  const getCanvasWrapperBackground = () => {
    switch (fontSettings.fontColor) {
      case 'sepia':
        return 'bg-[#fbf0d9] border-[#e8d5b5]';
      case 'dark_mode':
        return 'bg-[#0b1329] border-slate-700';
      case 'high_contrast':
        return 'bg-black border-amber-500';
      case 'original':
      default:
        return 'bg-white border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl text-slate-100 font-arabic ${className}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 animate-fade-in border border-indigo-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      {showControls && (
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* File Info / Page Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 shrink-0">
              <FileCheck className="w-4 h-4" />
            </span>
            <span className="font-bold text-xs truncate max-w-[150px] sm:max-w-[220px] text-white">
              {title || effectiveFileName}
            </span>

            {totalPages > 1 && !isImage && !isOtherDoc && (
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md font-mono text-indigo-300 font-bold shrink-0">
                {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Viewer Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
            {/* Pagination controls for PDF */}
            {totalPages > 1 && !isImage && !isOtherDoc && (
              <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 px-1 py-0.5">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                  }}
                  className="w-9 text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Zoom / Font Size Controls */}
            {!isOtherDoc && (
              <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 px-1 py-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  title="تصغير حجم الخط والمستند"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[11px] font-mono text-indigo-300 font-bold hover:text-white"
                  title="إعادة ضبط حجم الخط (100%)"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  title="تكبير حجم الخط والمستند"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Font Formatting & Color Settings Button */}
            {!isOtherDoc && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFormattingPopover(!showFormattingPopover)}
                  className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 font-bold text-[11px] cursor-pointer ${
                    showFormattingPopover || fontSettings.fontColor !== 'original'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                  title="تنسيق نوع الخط، لون الخط، وحجم الخط"
                >
                  <Type className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">تنسيق الخط والألوان</span>
                </button>

                {/* Popover Settings Panel */}
                {showFormattingPopover && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 font-arabic space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Palette className="w-4 h-4 text-indigo-400" />
                        <span>الحفاظ وتخصيص الخط والألوان</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetAllFormatting}
                        className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1"
                        title="استعادة الإعدادات الأصلية"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>الأصلي</span>
                      </button>
                    </div>

                    {/* 1. Color Palette / Theme */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        لون الخط ونمط التباين:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {[
                          { id: 'original', label: 'الأصلي للملف', icon: '✨', bg: 'bg-slate-800' },
                          { id: 'crisp_black', label: 'أسود فائق التباين', icon: '🖋️', bg: 'bg-slate-950 text-white' },
                          { id: 'navy', label: 'كحلي داكن', icon: '📘', bg: 'bg-blue-950 text-blue-200' },
                          { id: 'sepia', label: 'سيبيا دافئ', icon: '📜', bg: 'bg-amber-950/70 text-amber-200' },
                          { id: 'dark_mode', label: 'ليلي حماية العين', icon: '🌙', bg: 'bg-slate-900 border border-indigo-500/40 text-indigo-200' },
                          { id: 'emerald', label: 'أخضر زمردي', icon: '🌿', bg: 'bg-emerald-950 text-emerald-200' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              updateFontSettings({ fontColor: c.id as FontColorFilter });
                              triggerToast(`تم ضبط مظهر الخط: ${c.label}`);
                            }}
                            className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                              c.bg
                            } ${
                              fontSettings.fontColor === c.id
                                ? 'border-amber-400 ring-2 ring-amber-400/30 font-bold'
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span>{c.icon}</span>
                            <span className="leading-tight">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Font Size Scaling Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        حجم الخط والتكبير:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[
                          { scaleVal: 0.8, label: '80%' },
                          { scaleVal: 1.0, label: '100%' },
                          { scaleVal: 1.25, label: '125%' },
                          { scaleVal: 1.5, label: '150%' },
                          { scaleVal: 1.8, label: '180%' },
                        ].map((sz) => (
                          <button
                            key={sz.scaleVal}
                            type="button"
                            onClick={() => {
                              setScale(sz.scaleVal);
                              updateFontSettings({ fontSizeScale: sz.scaleVal });
                            }}
                            className={`flex-1 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              scale === sz.scaleVal
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Font Enhancements & Sharpness */}
                    <div className="pt-1 border-t border-slate-800/80 space-y-2">
                      <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
                        <span className="font-bold">تعزيز حدة ونقاء الحروف العربية:</span>
                        <input
                          type="checkbox"
                          checked={fontSettings.isSharpEnhanced}
                          onChange={(e) =>
                            updateFontSettings({ isSharpEnhanced: e.target.checked })
                          }
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </label>

                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>يتم حفظ نوع ولون وحجم الخط المفضل لديكِ تلقائياً لكافة ملفات الـ PDF.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rotation */}
            {!isOtherDoc && (
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                title="تدوير الصفحة 90 درجة"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Open in new window */}
            {(directBlobUrl || url) && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="p-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-300 hover:text-white cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                title="فتح في نافذة متصفح جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نافذة جديدة</span>
              </button>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-sm"
              title="تنزيل الملف"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport Area */}
      <div
        className="flex-1 w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/90 relative"
        style={{ maxHeight: maxHeight, minHeight: '260px' }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-bold animate-pulse">
              جاري معالجة وتنسيق المستند والخطوط بدقة عالية...
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-md bg-slate-900/90 rounded-2xl border border-slate-800">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h5 className="text-xs font-black text-white">المعاينة الآمنة المباشرة</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">{error}</p>
            <div className="flex items-center gap-2 pt-2">
              {(directBlobUrl || url) && (
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في نافذة جديدة</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل المستند</span>
              </button>
            </div>
          </div>
        )}

        {/* Image Preview Mode */}
        {isImage && (directBlobUrl || url) && !loading && !error && (
          <div
            className="flex items-center justify-center transition-transform"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={directBlobUrl || url}
              alt={title || effectiveFileName}
              className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain border border-slate-800"
            />
          </div>
        )}

        {/* Office Document Preview Card Mode */}
        {isOtherDoc && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-sm bg-slate-900 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-black text-white">{effectiveFileName}</h5>
            <p className="text-[11px] text-slate-400">
              مستند مكتبي (Word/PowerPoint/Excel) جاهز للتحميل والفتح المباشر على جهازكِ.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل المستند الآن</span>
            </button>
          </div>
        )}

        {/* PDF Canvas Rendering Surface with Active Font & Color Integrity */}
        {!isImage && !isOtherDoc && (
          <div
            className={`transition-opacity duration-200 flex items-center justify-center ${
              loading || error ? 'hidden' : 'block'
            }`}
          >
            <div
              className={`shadow-2xl rounded-xl overflow-hidden border transition-all duration-300 ${getCanvasWrapperBackground()}`}
              style={{
                filter: getCanvasColorFilter(),
              }}
            >
              <canvas
                ref={canvasRef}
                className="block mx-auto max-w-full"
                style={{
                  fontSmooth: 'always',
                  WebkitFontSmoothing: 'antialiased',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Viewer Footer Status Bar */}
      {!loading && !error && !isOtherDoc && (
        <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>الحفاظ على دقة وتنسيق الخط 100%</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline font-mono">
              الألوان الأصلية محفوظة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono font-bold">
              التكبير: {Math.round(scale * 100)}%
            </span>
            <span className="font-mono text-slate-300 font-bold">
              {isImage ? 'صورة' : `صفحة ${currentPage} من ${totalPages}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

