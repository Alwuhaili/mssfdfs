import fs from 'fs';

// Read initialData.ts
const content = fs.readFileSync('./src/data/initialData.ts', 'utf-8');

// Extract teachers
const teacherMatches = content.match(/export const INITIAL_TEACHERS: Teacher\[\] = \[([\s\S]*?)\n\];/);
if (teacherMatches) {
  console.log('Teachers block found');
}
