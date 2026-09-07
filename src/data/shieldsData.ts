import { StudentShieldBadge } from '../types';

export interface PresetShieldBadge {
  id: string;
  title: string;
  type: 'shield' | 'medal' | 'badge' | 'trophy';
  category: string;
  defaultIssuedBy: string;
  defaultReason: string;
  icon: string;
  colorTheme: 'cyan' | 'amber' | 'purple' | 'emerald' | 'rose' | 'blue' | 'indigo';
  gradientBg: string;
  borderClass: string;
  textClass: string;
}

export const PRESET_SHIELDS_AND_BADGES: PresetShieldBadge[] = [
  {
    id: 'preset-turing',
    title: '⚡ درع تورنغ للمبتكرات الرقمية',
    type: 'shield',
    category: 'الحاسوب والتكنولوجيا',
    defaultIssuedBy: 'إدارة ثانوية ميسان للمتميزات / قسم الحاسوب',
    defaultReason: 'التميز البرمجي والابتكار في الخوارزميات وتطبيقات الذكاء الاصطناعي',
    icon: '⚡',
    colorTheme: 'cyan',
    gradientBg: 'from-cyan-950/80 via-slate-900 to-cyan-950/80',
    borderClass: 'border-cyan-400/40 hover:border-cyan-400',
    textClass: 'text-cyan-300',
  },
  {
    id: 'preset-khwarizmi',
    title: '🌟 وسام الخوارزمي الذهبي',
    type: 'medal',
    category: 'الرياضيات والذكاء',
    defaultIssuedBy: 'قسم الرياضيات للمتميزات',
    defaultReason: 'التفوق في الأولمبياد الرياضي والتفاضل والتكامل وحل المسائل المعقدة',
    icon: '🌟',
    colorTheme: 'amber',
    gradientBg: 'from-amber-950/80 via-slate-900 to-amber-950/80',
    borderClass: 'border-amber-400/40 hover:border-amber-400',
    textClass: 'text-amber-300',
  },
  {
    id: 'preset-curie',
    title: '🔬 وسام ماري كوري للفيزياء والكيمياء',
    type: 'medal',
    category: 'العلوم والفيزياء',
    defaultIssuedBy: 'قسم العلوم الطبيعية والمختبرات',
    defaultReason: 'التميز في التجارب المخبرية والفيزياء الحديثة والكيمياء التحليلية',
    icon: '🔬',
    colorTheme: 'purple',
    gradientBg: 'from-purple-950/80 via-slate-900 to-purple-950/80',
    borderClass: 'border-purple-400/40 hover:border-purple-400',
    textClass: 'text-purple-300',
  },
  {
    id: 'preset-ibnsina',
    title: '🌿 وسام ابن سينا للعلوم والطب',
    type: 'medal',
    category: 'الأحياء والطب',
    defaultIssuedBy: 'قسم علم الأحياء والبيئة',
    defaultReason: 'البحث العلمي المتميز في علم الوراثة والتشريح والعلوم الطبية',
    icon: '🌿',
    colorTheme: 'emerald',
    gradientBg: 'from-emerald-950/80 via-slate-900 to-emerald-950/80',
    borderClass: 'border-emerald-400/40 hover:border-emerald-400',
    textClass: 'text-emerald-300',
  },
  {
    id: 'preset-champion',
    title: '👑 وسام بطلة التحديات الشاملة',
    type: 'trophy',
    category: 'التميز الشامل',
    defaultIssuedBy: 'المديرة إلهام صبيح سعدون',
    defaultReason: 'تحقيق صدارة لوحة الشرف التراكمية في كافة التحديات العلمية المدرسية',
    icon: '👑',
    colorTheme: 'amber',
    gradientBg: 'from-amber-900 via-slate-950 to-amber-950',
    borderClass: 'border-amber-300 shadow-amber-500/20',
    textClass: 'text-amber-200',
  },
  {
    id: 'preset-academic-99',
    title: '🎖️ درع التفوق الأكاديمي والتحصيل الشامل',
    type: 'shield',
    category: 'التحصيل العلمي (99%+)',
    defaultIssuedBy: 'مجلس إدارة ثانوية ميسان للمتميزات',
    defaultReason: 'تحقيق معدل تراكمي استثنائي يتجاوز 99% في الامتحانات الوزارية والرسمية',
    icon: '🎖️',
    colorTheme: 'rose',
    gradientBg: 'from-rose-950/80 via-slate-900 to-rose-950/80',
    borderClass: 'border-rose-400/40 hover:border-rose-400',
    textClass: 'text-rose-300',
  },
  {
    id: 'preset-arabic-literature',
    title: '🎨 درع الإبداع والتميز اللغوي والأدبي',
    type: 'shield',
    category: 'اللغة العربية والآداب',
    defaultIssuedBy: 'قسم اللغة العربية والبلاغة',
    defaultReason: 'الإتقان الفصيح للبلاغة والإنشاء الأدبي والشعر والخط العربي',
    icon: '🎨',
    colorTheme: 'blue',
    gradientBg: 'from-blue-950/80 via-slate-900 to-blue-950/80',
    borderClass: 'border-blue-400/40 hover:border-blue-400',
    textClass: 'text-blue-300',
  },
  {
    id: 'preset-attendance-zero',
    title: '✨ وسام المواظبة والالتزام المثالي',
    type: 'badge',
    category: 'الانضباط والمواظبة',
    defaultIssuedBy: 'إدارة شؤون الطالبات',
    defaultReason: 'سجل انضباطي ومدرسي نموذجي خالٍ تماماً من الغياب أو التأخير',
    icon: '✨',
    colorTheme: 'emerald',
    gradientBg: 'from-emerald-950/80 via-slate-900 to-emerald-950/80',
    borderClass: 'border-emerald-400/40 hover:border-emerald-400',
    textClass: 'text-emerald-300',
  },
  {
    id: 'preset-innovation-leader',
    title: '🏆 درع ريادة الموهوبات والابتكار العلمي',
    type: 'trophy',
    category: 'الموهبة والابتكار',
    defaultIssuedBy: 'لجنة رعاية الموهوبات الوطنية',
    defaultReason: 'تقديم مشاريع علمية ابتكارية وبراءات تصميم رائدة',
    icon: '🏆',
    colorTheme: 'indigo',
    gradientBg: 'from-indigo-950/80 via-slate-900 to-indigo-950/80',
    borderClass: 'border-indigo-400/40 hover:border-indigo-400',
    textClass: 'text-indigo-300',
  },
  {
    id: 'preset-diplomacy-languages',
    title: '🌍 وسام الدبلوماسية واللغات الأجنبية',
    type: 'medal',
    category: 'اللغات العالمية',
    defaultIssuedBy: 'قسم اللغتين الإنجليزية والفرنسية',
    defaultReason: 'إتقان التحدث باللغتين الإنجليزية والفرنسية والترجمة الفورية',
    icon: '🌍',
    colorTheme: 'blue',
    gradientBg: 'from-sky-950/80 via-slate-900 to-sky-950/80',
    borderClass: 'border-sky-400/40 hover:border-sky-400',
    textClass: 'text-sky-300',
  },
  {
    id: 'preset-euclid-geometry',
    title: '📐 وسام إقليدس للهندسة الرياضية',
    type: 'medal',
    category: 'الرياضيات والهندسة',
    defaultIssuedBy: 'قسم الرياضيات للمتميزات',
    defaultReason: 'البراعة الفائقة في البراهين الهندسية والمجسمات الفضائية',
    icon: '📐',
    colorTheme: 'amber',
    gradientBg: 'from-amber-950/80 via-slate-900 to-amber-950/80',
    borderClass: 'border-amber-400/40 hover:border-amber-400',
    textClass: 'text-amber-300',
  },
  {
    id: 'preset-ibn-alhaytham',
    title: '🌌 وسام ابن الهيثم للبصريات والفلك',
    type: 'medal',
    category: 'الفيزياء والفلك',
    defaultIssuedBy: 'نادي الفلك والفيزياء التجريبية',
    defaultReason: 'استكشاف قوانين الضوء والبصريات وحركة الأجرام السماوية',
    icon: '🌌',
    colorTheme: 'cyan',
    gradientBg: 'from-cyan-950/80 via-slate-900 to-cyan-950/80',
    borderClass: 'border-cyan-400/40 hover:border-cyan-400',
    textClass: 'text-cyan-300',
  },
  {
    id: 'preset-gold-first',
    title: '🥇 وسام المركز الأول في التحديات العلمية',
    type: 'medal',
    category: 'المسابقات والبطولات',
    defaultIssuedBy: 'لجنة التحكيم العلمي',
    defaultReason: 'إحراز المرتبة الأولى في المنافسات العلمية بين الشعب والمراحل',
    icon: '🥇',
    colorTheme: 'amber',
    gradientBg: 'from-amber-900 via-slate-950 to-amber-950',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-300',
  },
  {
    id: 'preset-silver-second',
    title: '🥈 وسام المركز الثاني في التحديات العلمية',
    type: 'medal',
    category: 'المسابقات والبطولات',
    defaultIssuedBy: 'لجنة التحكيم العلمي',
    defaultReason: 'إحراز المرتبة الثانية بأداء متميز في التحديات العلمية',
    icon: '🥈',
    colorTheme: 'indigo',
    gradientBg: 'from-slate-800 via-slate-900 to-slate-800',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-200',
  },
  {
    id: 'preset-bronze-third',
    title: '🥉 وسام المركز الثالث في التحديات العلمية',
    type: 'medal',
    category: 'المسابقات والبطولات',
    defaultIssuedBy: 'لجنة التحكيم العلمي',
    defaultReason: 'إحراز المرتبة الثالثة والتميز في المنافسات المدرسية',
    icon: '🥉',
    colorTheme: 'amber',
    gradientBg: 'from-amber-950 via-slate-900 to-amber-950',
    borderClass: 'border-amber-700/60',
    textClass: 'text-amber-400',
  },
];

export function getShieldThemeConfig(title: string) {
  const matched = PRESET_SHIELDS_AND_BADGES.find((p) => title.includes(p.title) || p.title.includes(title));
  if (matched) return matched;

  if (title.includes('تورنغ') || title.includes('حاسوب') || title.includes('برمج')) {
    return PRESET_SHIELDS_AND_BADGES[0];
  }
  if (title.includes('خوارزمي') || title.includes('رياضيات')) {
    return PRESET_SHIELDS_AND_BADGES[1];
  }
  if (title.includes('كوري') || title.includes('فيزياء') || title.includes('كيمياء')) {
    return PRESET_SHIELDS_AND_BADGES[2];
  }
  if (title.includes('سينا') || title.includes('أحياء') || title.includes('طب')) {
    return PRESET_SHIELDS_AND_BADGES[3];
  }
  if (title.includes('بطلة') || title.includes('أول')) {
    return PRESET_SHIELDS_AND_BADGES[4];
  }

  return {
    id: 'custom',
    title,
    type: 'shield' as const,
    category: 'تكريم وتميز علمي',
    defaultIssuedBy: 'إدارة ثانوية ميسان للمتميزات',
    defaultReason: 'تقدير للجهود المتميزة والموهبة الإبداعية',
    icon: '🎖️',
    colorTheme: 'indigo' as const,
    gradientBg: 'from-indigo-950/80 via-slate-900 to-indigo-950/80',
    borderClass: 'border-indigo-400/40 hover:border-indigo-400',
    textClass: 'text-indigo-300',
  };
}
