import fs from 'fs';

const ALL_GRADES = [
  'الصف السادس العلمي',
  'الصف الخامس العلمي',
  'الصف الرابع العلمي',
  'الصف الثالث المتوسط',
  'الصف الثاني المتوسط',
  'الصف الأول المتوسط',
];

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const PERIOD_TIMING = {
  1: '08:00 - 08:45',
  2: '08:50 - 09:35',
  3: '09:40 - 10:25',
  4: '10:30 - 11:15',
  5: '11:20 - 12:05',
  6: '12:10 - 12:55',
  7: '13:00 - 13:45',
};

// Section A and Section B Quotas matching school teacher assignments
const SECTION_QUOTAS = {
  'الصف السادس العلمي': {
    'أ': [
      { subject: 'الرياضيات والتفاضل', teacher: 'أ. مروة كمال الساعدي', periods: 5, room: 'قاعة المتميزات 1', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء المتقدمة', teacher: 'أ.د. رغد نصير البهادلي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء العضوية', teacher: 'د. زينب عبد الحسين الموسوي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء والوراثة', teacher: 'أ. سارة جليل المحمداوي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية والقواعد', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة المتميزات 1', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة المتميزات 1', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والذكاء الاصطناعي', teacher: 'محمد نعمة كاظم كريدي الوحيلي', periods: 2, room: 'مختبر الحاسوب الذكي', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ],
    'ب': [
      { subject: 'الرياضيات والتفاضل', teacher: 'أ. مروة كمال الساعدي', periods: 5, room: 'قاعة المتميزات 2', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء المتقدمة', teacher: 'أ.د. رغد نصير البهادلي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء العضوية', teacher: 'د. زينب عبد الحسين الموسوي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء والوراثة', teacher: 'أ. سارة جليل المحمداوي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية والقواعد', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة المتميزات 2', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة المتميزات 2', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والذكاء الاصطناعي', teacher: 'محمد نعمة كاظم كريدي الوحيلي', periods: 2, room: 'مختبر الحاسوب الذكي', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ]
  },
  'الصف الخامس العلمي': {
    'أ': [
      { subject: 'الرياضيات', teacher: 'أ. مروة كمال الساعدي', periods: 5, room: 'قاعة 5 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ.د. رغد نصير البهادلي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'د. زينب عبد الحسين الموسوي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء', teacher: 'أ. سارة جليل المحمداوي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة 5 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة 5 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والبرمجة', teacher: 'محمد نعمة كاظم كريدي الوحيلي', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ],
    'ب': [
      { subject: 'الرياضيات', teacher: 'أ. مروة كمال الساعدي', periods: 5, room: 'قاعة 5 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ.د. رغد نصير البهادلي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'د. زينب عبد الحسين الموسوي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء', teacher: 'أ. سارة جليل المحمداوي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة 5 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة 5 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والبرمجة', teacher: 'محمد نعمة كاظم كريدي الوحيلي', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ]
  },
  'الصف الرابع العلمي': {
    'أ': [
      { subject: 'الرياضيات', teacher: 'أ. علي كريم الربيعي', periods: 5, room: 'قاعة 4 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ. حيدر صباح اللامي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'أ. وسام جاسم التميمي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء', teacher: 'أ. هند كاظم الذهبي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة 4 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة 4 علمي أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. مريم عماد الكعبي', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ],
    'ب': [
      { subject: 'الرياضيات', teacher: 'أ. علي كريم الربيعي', periods: 5, room: 'قاعة 4 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ. حيدر صباح اللامي', periods: 5, room: 'مختبر الفيزياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'أ. وسام جاسم التميمي', periods: 5, room: 'مختبر الكيمياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'علم الأحياء', teacher: 'أ. هند كاظم الذهبي', periods: 5, room: 'قاعة الأحياء', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. فاطمة مرتضى الشمري', periods: 5, room: 'قاعة 4 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. رنا ضياء الزيدي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. خديجة عبد الرزاق البديري', periods: 3, room: 'قاعة 4 علمي ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. مريم عماد الكعبي', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ]
  },
  'الصف الثالث المتوسط': {
    'أ': [
      { subject: 'الرياضيات', teacher: 'أ. علي كريم الربيعي', periods: 5, room: 'قاعة 3 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ. حيدر صباح اللامي', periods: 4, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'أ. وسام جاسم التميمي', periods: 4, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الأحياء', teacher: 'أ. هند كاظم الذهبي', periods: 4, room: 'قاعة 3 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 3 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. نداء فاضل البياتي', periods: 4, room: 'قاعة 3 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 3, room: 'قاعة 3 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. عمر خالد السعد', periods: 2, room: 'مختبر الحاسوب', days: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ],
    'ب': [
      { subject: 'الرياضيات', teacher: 'أ. علي كريم الربيعي', periods: 5, room: 'قاعة 3 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الفيزياء', teacher: 'أ. حيدر صباح اللامي', periods: 4, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الكيمياء', teacher: 'أ. وسام جاسم التميمي', periods: 4, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الأحياء', teacher: 'أ. هند كاظم الذهبي', periods: 4, room: 'قاعة 3 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 3 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 4, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. نداء فاضل البياتي', periods: 4, room: 'قاعة 3 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 3, room: 'قاعة 3 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. عمر خالد السعد', periods: 2, room: 'مختبر الحاسوب', days: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
    ]
  },
  'الصف الثاني المتوسط': {
    'أ': [
      { subject: 'الرياضيات', teacher: 'أ. رشا فائق الدراجي', periods: 5, room: 'قاعة 2 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'العلوم العامة', teacher: 'أ. مروة سلام الفرطوسي', periods: 6, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 2 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. قاسم مهدي العتابي', periods: 4, room: 'قاعة 2 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 4, room: 'قاعة 2 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والبرمجة', teacher: 'أ. عمر خالد السعد', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الفنية والرياضية', teacher: 'أ. بشرى عبد الأمير', periods: 3, room: 'القاعة الرياضية', days: ['الأحد', 'الثلاثاء', 'الخميس'] },
    ],
    'ب': [
      { subject: 'الرياضيات', teacher: 'أ. رشا فائق الدراجي', periods: 5, room: 'قاعة 2 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'العلوم العامة', teacher: 'أ. ضحى رحيم العبادي', periods: 6, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 2 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. قاسم مهدي العتابي', periods: 4, room: 'قاعة 2 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 4, room: 'قاعة 2 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب والبرمجة', teacher: 'أ. عمر خالد السعد', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الفنية والرياضية', teacher: 'أ. بشرى عبد الأمير', periods: 3, room: 'القاعة الرياضية', days: ['الأحد', 'الثلاثاء', 'الخميس'] },
    ]
  },
  'الصف الأول المتوسط': {
    'أ': [
      { subject: 'الرياضيات', teacher: 'أ. رشا فائق الدراجي', periods: 5, room: 'قاعة 1 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'العلوم العامة', teacher: 'أ. هبة عادل الساعدي', periods: 6, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 1 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. قاسم مهدي العتابي', periods: 4, room: 'قاعة 1 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 4, room: 'قاعة 1 متوسط أ', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. عمر خالد السعد', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الفنية والرياضية', teacher: 'أ. أطياف حسن الخزاعي', periods: 3, room: 'القاعة الرياضية', days: ['الإثنين', 'الثلاثاء', 'الأربعاء'] },
    ],
    'ب': [
      { subject: 'الرياضيات', teacher: 'أ. رشا فائق الدراجي', periods: 5, room: 'قاعة 1 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'العلوم العامة', teacher: 'أ. هبة عادل الساعدي', periods: 6, room: 'مختبر العلوم', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة العربية', teacher: 'أ. مصطفى حميد الغراوي', periods: 5, room: 'قاعة 1 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'اللغة الإنجليزية', teacher: 'أ. أحمد صادق المياحي', periods: 5, room: 'قاعة اللغات', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الاجتماعيات', teacher: 'أ. قاسم مهدي العتابي', periods: 4, room: 'قاعة 1 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الإسلامية', teacher: 'أ. حسين شاكر العيداني', periods: 4, room: 'قاعة 1 متوسط ب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'الحاسوب', teacher: 'أ. مريم عماد الكعبي', periods: 3, room: 'مختبر الحاسوب', days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
      { subject: 'التربية الفنية والرياضية', teacher: 'أ. أطياف حسن الخزاعي', periods: 3, room: 'القاعة الرياضية', days: ['الإثنين', 'الثلاثاء', 'الأربعاء'] },
    ]
  }
};

function normalizeName(name) {
  if (!name) return '';
  return name.trim().replace(/^(أ\.د\.|أ\.د|أ\.|د\.|الاستاذة|الأستاذة|الاستاذ|الأستاذ)\s*/gi, '').trim();
}

function solveAllWithGlobalRestart() {
  const sections = ['أ', 'ب'];
  const targets = [];
  for (const grade of ALL_GRADES) {
    for (const section of sections) {
      targets.push({ grade, section });
    }
  }

  for (let globalAttempt = 1; globalAttempt <= 100; globalAttempt++) {
    const globalSchedule = [];
    let allSolved = true;

    for (const { grade, section } of targets) {
      let solved = false;
      const quotas = SECTION_QUOTAS[grade][section];

      for (let attempt = 0; attempt < 500; attempt++) {
        const grid = {};
        const dayCounts = {};
        for (const d of WEEKDAYS) dayCounts[d] = {};

        const pool = [];
        for (const q of quotas) {
          const numDays = q.days.length;
          const maxDaily = q.periods <= numDays ? 1 : Math.ceil(q.periods / numDays);
          for (let i = 0; i < q.periods; i++) {
            pool.push({
              subject: q.subject,
              teacher: q.teacher,
              room: q.room,
              allowedDays: q.days,
              maxDaily,
            });
          }
        }

        // Shuffle
        pool.sort(() => Math.random() - 0.5);
        pool.sort((a, b) => a.allowedDays.length - b.allowedDays.length);

        let placedAll = true;

        for (const item of pool) {
          const normT = normalizeName(item.teacher);
          const validPositions = [];

          for (const d of item.allowedDays) {
            if ((dayCounts[d][item.subject] || 0) >= item.maxDaily) continue;

            for (const p of PERIODS) {
              const key = `${d}_${p}`;
              if (grid[key]) continue;

              const busy = globalSchedule.some(
                (s) => s.day === d && s.period === p && normalizeName(s.teacherName) === normT
              );
              if (!busy) {
                validPositions.push({ d, p, key });
              }
            }
          }

          if (validPositions.length === 0) {
            placedAll = false;
            break;
          }

          const chosen = validPositions[Math.floor(Math.random() * validPositions.length)];
          grid[chosen.key] = item;
          dayCounts[chosen.d][item.subject] = (dayCounts[chosen.d][item.subject] || 0) + 1;
        }

        if (placedAll && Object.keys(grid).length === 35) {
          for (const d of WEEKDAYS) {
            for (const p of PERIODS) {
              const l = grid[`${d}_${p}`];
              if (l) {
                globalSchedule.push({
                  id: `sch-${grade}-${section}-${d}-${p}`,
                  day: d,
                  period: p,
                  timeSlot: PERIOD_TIMING[p],
                  gradeLevel: grade,
                  section,
                  subject: l.subject,
                  teacherName: l.teacher,
                  room: l.room,
                });
              }
            }
          }
          solved = true;
          break;
        }
      }

      if (!solved) {
        allSolved = false;
        break;
      }
    }

    if (allSolved) {
      console.log(`Global solver succeeded on run ${globalAttempt}! Total slots: ${globalSchedule.length}`);
      return globalSchedule;
    }
  }

  return null;
}

const finalSched = solveAllWithGlobalRestart();
if (finalSched) {
  console.log('\n======================================');
  console.log('SUCCESS! Total slots generated:', finalSched.length);

  let conflicts = 0;
  for (let i = 0; i < finalSched.length; i++) {
    for (let j = i + 1; j < finalSched.length; j++) {
      const s1 = finalSched[i];
      const s2 = finalSched[j];
      if (s1.day === s2.day && s1.period === s2.period) {
        if (s1.gradeLevel === s2.gradeLevel && s1.section === s2.section) {
          console.error('SAME CLASS COLLISION!', s1, s2);
          conflicts++;
        } else if (normalizeName(s1.teacherName) === normalizeName(s2.teacherName)) {
          console.error(`TEACHER COLLISION: ${s1.teacherName} on ${s1.day} P${s1.period}: ${s1.gradeLevel} (${s1.section}) vs ${s2.gradeLevel} (${s2.section})`);
          conflicts++;
        }
      }
    }
  }
  console.log('AUDITED CONFLICTS COUNT:', conflicts);

  // Check Computer Teacher
  console.log('\n--- Schedule for Computer Teacher (أ. عمر خالد السعد) ---');
  const omarSlots = finalSched.filter((s) => s.teacherName.includes('عمر خالد'));
  omarSlots.sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || a.period - b.period);
  omarSlots.forEach((s) => {
    console.log(`${s.day} - الحصة ${s.period}: ${s.gradeLevel} (شعبة ${s.section}) - ${s.subject}`);
  });

  fs.writeFileSync('./scripts/generated_timetable.json', JSON.stringify(finalSched, null, 2));
  console.log('\nSaved full timetable to ./scripts/generated_timetable.json');
}
