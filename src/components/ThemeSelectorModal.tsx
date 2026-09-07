/**
 * Eye-Soothing Color Theme Selector Modal Component
 * نافذة اختيار مجموعة الألوان الهادئة المريحة للعين
 * مدرسة ثانوية ميسان للمتميزات
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { COLOR_THEMES_LIST, ColorThemeId } from '../types';
import { Palette, CheckCircle2, Eye, Sparkles, X, Shield, Moon, Sun } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorTheme, setColorTheme, lang } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-arabic">
        
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {lang === 'ar' ? 'تغيير ألوان الموقع (ثيمات مريحة للعين)' : 'Eye-Soothing Color Schemes'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  حماية العين 👓
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'ar'
                  ? 'اختر النمط واللون المناسب لرؤيتك لمنع إجهاد العين وتسهيل القراءة والمتابعة'
                  : 'Select your preferred eye-comfort color theme to minimize glare and visual fatigue'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {lang === 'ar' ? 'الألوان المتاحة المريحة للعين:' : 'Available Eye-Care Color Themes:'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'يتم الحفظ تلقائياً لكل مستخدم' : 'Auto-saved to your browser preference'}
            </span>
          </div>

          {/* Theme Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {COLOR_THEMES_LIST.map((theme) => {
              const isSelected = colorTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setColorTheme(theme.id)}
                  className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-2 border-teal-600 bg-teal-50/60 dark:bg-slate-800 shadow-md ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  {/* Top Swatch Row */}
                  <div className="flex items-start justify-between w-full mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-xl border border-slate-300/60 shadow-sm flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.bgHex }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{lang === 'ar' ? theme.nameAr : theme.nameEn}</span>
                        </h4>
                      </div>
                    </div>

                    {/* Badge & Active Check */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                        {lang === 'ar' ? theme.badgeTagAr : theme.badgeTagEn}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {lang === 'ar' ? theme.descAr : theme.descEn}
                  </p>

                  {/* Bottom Color Palette Bar Indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      {theme.isDark ? (
                        <Moon className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{theme.isDark ? 'وضع داكن' : 'وضع هادئ'}</span>
                    </div>

                    <span className={isSelected ? 'text-teal-700 dark:text-teal-300 font-extrabold' : ''}>
                      {isSelected ? '✓ مفعّل حالياً' : 'انقري لتطبيق اللون'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Eye Health Care Notice */}
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 text-teal-900 dark:text-teal-200 text-xs font-semibold flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-950 dark:text-teal-100">
                نصيحة ثانوية ميسان للمتميزات لرعاية صحة العين:
              </p>
              <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                تساعد الألوان الهادئة مثل (الزمردي النعناعي) و(الكشمير العاجي) على تقليل الضوء الأزرق المباشر ومنع إجهاد العين في أوقات الدراسة والمتابعة الطويلة.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            اللون المختار حالياً:{' '}
            <span className="text-teal-600 dark:text-teal-400 font-extrabold">
              {COLOR_THEMES_LIST.find((t) => t.id === colorTheme)?.nameAr}
            </span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
