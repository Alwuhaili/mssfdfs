const fs = require('fs');

const path = 'src/data/initialData.ts';
let code = fs.readFileSync(path, 'utf8');

const startIndex = code.indexOf('export const INITIAL_TEACHERS: Teacher[] = [');
const endIndex = code.indexOf('];', startIndex) + 2;

const newTeachersArray = `export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tech-cs-mohammed',
    name: 'محمد نعمة كاظم كريدي الوحيلي',
    subject: 'الحاسوب',
    email: 'mohammed.alwuhaili@maysan-gifted.edu.iq',
    phone: '07705555701',
    assignedGrades: ['الصف الأول المتوسط', 'الصف الثاني المتوسط', 'الصف الرابع العلمي', 'الصف الخامس العلمي'],
    assignedSections: ['أ', 'ب'],
    status: 'نشط',
    joinedDate: '2019-09-01',
    gender: 'male',
    rating: 5.0,
    availableDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  }
];`;

code = code.substring(0, startIndex) + newTeachersArray + code.substring(endIndex);
fs.writeFileSync(path, code);
console.log('Cleaned INITIAL_TEACHERS in source.');
