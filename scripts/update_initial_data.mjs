import fs from 'fs';

const generatedSlots = JSON.parse(fs.readFileSync('./scripts/generated_timetable.json', 'utf-8'));
let initialDataContent = fs.readFileSync('./src/data/initialData.ts', 'utf-8');

// Format slots as clean TypeScript
const slotsTs = 'export const INITIAL_TIMETABLE: TimetableSlot[] = ' + JSON.stringify(generatedSlots, null, 2) + ';\n';

// Replace INITIAL_TIMETABLE in initialData.ts
const regex = /export const INITIAL_TIMETABLE: TimetableSlot\[\] = \[[\s\S]*?\n\];/;
if (regex.test(initialDataContent)) {
  initialDataContent = initialDataContent.replace(regex, slotsTs.trim());
  fs.writeFileSync('./src/data/initialData.ts', initialDataContent, 'utf-8');
  console.log('Successfully updated INITIAL_TIMETABLE in src/data/initialData.ts with 420 slots!');
} else {
  console.error('Could not find INITIAL_TIMETABLE in src/data/initialData.ts');
}
