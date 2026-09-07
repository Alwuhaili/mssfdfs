import { CurrentUser, Teacher } from '../types';

const MALE_NAME_KEYWORDS = [
  'محمد',
  'أحمد',
  'احمد',
  'علي',
  'حيدر',
  'حسين',
  'كرار',
  'مهدي',
  'عمر',
  'خالد',
  'مصطفى',
  'عبد',
  'يوسف',
  'عمار',
  'سامر',
  'حسام',
  'بشير',
  'فاضل',
  'زيد',
  'سجاد',
  'نعمة',
  'كاظم',
  'جاسم',
  'صادق',
  'جعفر',
  'مهند',
  'ضرغام',
  'وسام',
  'إبراهيم',
  'ابراهيم',
  'حسن',
  'محمود',
  'طارق',
  'ياسين',
  'هيثم',
  'ماجد',
  'سالم',
  'عدنان',
  'سلمان',
  'عباس',
  'قاسم',
  'ضياء',
  'ليث',
  'ميثم',
  'ماهر',
  'عادل',
  'نبيل',
  'سعد',
  'كريم',
  'عقيل',
  'علاء',
  'صباح',
  'وليد',
  'فلاح',
  'رياض',
  'مازن',
  'باسم',
  'قصي',
  'لؤي',
  'سامي',
  'بلال',
  'فارس',
  'منذر',
  'عصام',
  'طلال',
  'صفاء',
  'عطية',
  'شاكر',
  'حارث',
  'مؤيد',
  'غسان',
  'إياد',
  'اياد',
  'ثامر',
  'عثمان',
  'بلال',
  'فؤاد',
  'منير',
];

const FEMALE_PREFIXES_OR_NAMES = [
  'أستاذة',
  'استاذة',
  'مدرسة',
  'دكتورة',
  'ست ',
  'الآنسة',
  'الانسه',
  'السيدة',
  'السيده',
  'أمل',
  'امل',
  'زينب',
  'فاطمة',
  'فاطمه',
  'هدى',
  'مروة',
  'مروه',
  'سارة',
  'ساره',
  'نور',
  'زهراء',
  'مريم',
  'آية',
  'اية',
  'بنين',
  'تقى',
  'رغد',
  'رند',
  'دعاء',
  'سندس',
  'أسماء',
  'اسماء',
  'إلهام',
  'الهام',
  'رشا',
  'ريام',
  'شهد',
  'تبارك',
  'غدير',
  'هاجر',
  'سرى',
  'ضحى',
  'حوراء',
  'ولاء',
  'شيماء',
  'إيمان',
  'ايمان',
  'يسرى',
  'هبة',
  'هبه',
  'بشرى',
  'أريج',
  'نهى',
  'وفاء',
  'عبير',
  'سحر',
  'ندى',
  'ريم',
  'لمى',
  'ميس',
  'منى',
  'سها',
];

/**
 * Determines whether a teacher is male or female based on explicit gender, name heuristics, and titles.
 */
export function isMaleTeacher(
  teacherOrName?: any,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى'
): boolean {
  if (explicitGender === 'male' || explicitGender === 'ذكر') return true;
  if (explicitGender === 'female' || explicitGender === 'أنثى') return false;

  if (!teacherOrName) return false;

  if (typeof teacherOrName === 'object') {
    if (teacherOrName.gender === 'male' || teacherOrName.gender === 'ذكر') return true;
    if (teacherOrName.gender === 'female' || teacherOrName.gender === 'أنثى') return false;

    // Check nested teacherObj
    if ('teacherObj' in teacherOrName && teacherOrName.teacherObj) {
      if (teacherOrName.teacherObj.gender === 'male' || teacherOrName.teacherObj.gender === 'ذكر') return true;
      if (teacherOrName.teacherObj.gender === 'female' || teacherOrName.teacherObj.gender === 'أنثى') return false;
    }
  }

  const name = typeof teacherOrName === 'string' ? teacherOrName : teacherOrName.name || '';
  if (!name) return false;

  const normalized = name.trim();

  // Explicit female honorifics or common female prefixes take strong precedence
  if (
    normalized.startsWith('أستاذة') ||
    normalized.startsWith('استاذة') ||
    normalized.startsWith('مدرسة ') ||
    normalized.startsWith('دكتورة') ||
    normalized.startsWith('ست ') ||
    normalized.startsWith('السيدة ') ||
    normalized.startsWith('الآنسة ')
  ) {
    return false;
  }

  // Strip standard academic prefixes like أ.د. or د. or أ.
  const nameWithoutPrefix = normalized.replace(/^(أ\.د\.|أ\. د\.|أ\.|د\.|الأستاذة|الأستاذ|السيد|السيدة)\s*/, '').trim();
  const firstWord = nameWithoutPrefix.split(' ')[0] || '';

  // Check if first word is in female list
  if (FEMALE_PREFIXES_OR_NAMES.some((fn) => firstWord === fn || firstWord.startsWith(fn))) {
    return false;
  }

  // Check if first word is in male list
  if (MALE_NAME_KEYWORDS.some((mn) => firstWord === mn || firstWord.startsWith(mn))) {
    return true;
  }

  // Explicit male honorifics check
  if (
    normalized.startsWith('أستاذ ') ||
    normalized.startsWith('الأستاذ ') ||
    normalized.startsWith('السيد ')
  ) {
    const hasFemale = FEMALE_PREFIXES_OR_NAMES.some((fn) => normalized.includes(fn));
    if (!hasFemale) return true;
  }

  // Check if any word in the name matches male keywords
  const words = nameWithoutPrefix.split(' ');
  if (words.length > 0 && MALE_NAME_KEYWORDS.includes(words[0])) {
    return true;
  }

  return false;
}

/**
 * Returns dynamic creator/supervisor title:
 * "المدرس المنشئ / المشرف" (male) vs "المدرسة المنشئة / المشرفة" (female)
 */
export function getCreatorSupervisorLabel(
  teacherOrName?: Teacher | CurrentUser | string | null,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى',
  slashStyle: boolean = true
): string {
  const isMale = isMaleTeacher(teacherOrName, explicitGender);
  if (slashStyle) {
    return isMale ? 'المدرس المنشئ / المشرف' : 'المدرسة المنشئة / المشرفة';
  }
  return isMale ? 'المدرس المنشئ المشرف' : 'المدرسة المنشئة المشرفة';
}

/**
 * Returns supervisor label:
 * "المدرس المشرف" (male) vs "المدرسة المشرفة" (female)
 */
export function getSupervisorLabel(
  teacherOrName?: Teacher | CurrentUser | string | null,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى'
): string {
  const isMale = isMaleTeacher(teacherOrName, explicitGender);
  return isMale ? 'المدرس المشرف' : 'المدرسة المشرفة';
}

/**
 * Returns teacher role/title label:
 * "أستاذ المادة" (male) vs "أستاذة المادة" (female)
 */
export function getTeacherSubjectTitle(
  teacherOrName?: Teacher | CurrentUser | string | null,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى'
): string {
  const isMale = isMaleTeacher(teacherOrName, explicitGender);
  return isMale ? 'أستاذ المادة' : 'أستاذة المادة';
}

/**
 * Returns teacher noun:
 * "المدرس" if male
 * "المدرسة" if female
 */
export function getTeacherNoun(
  teacherOrName?: Teacher | CurrentUser | string | null,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى',
  definite: boolean = true
): string {
  const isMale = isMaleTeacher(teacherOrName, explicitGender);
  if (definite) {
    return isMale ? 'المدرس' : 'المدرسة';
  }
  return isMale ? 'مدرس' : 'مدرسة';
}

/**
 * Returns teacher account label according to gender:
 * - Male: "حساب المدرس" (or "تعديل حساب المدرس" when withEditPrefix is true)
 * - Female: "حساب المدرسة" (or "تعديل حساب المدرسة" when withEditPrefix is true)
 */
export function getTeacherAccountLabel(
  teacherOrName?: Teacher | CurrentUser | string | null,
  explicitGender?: 'male' | 'female' | 'ذكر' | 'أنثى',
  withEditPrefix: boolean = false
): string {
  const isMale = isMaleTeacher(teacherOrName, explicitGender);
  if (withEditPrefix) {
    return isMale ? 'تعديل حساب المدرس' : 'تعديل حساب المدرسة';
  }
  return isMale ? 'حساب المدرس' : 'حساب المدرسة';
}
