const fs = require('fs');
const path = 'src/types.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('DisciplinarySettings')) {
  code = code + `
export interface DisciplinarySettings {
  firstWarningDays: number;
  finalWarningDays: number;
  expulsionDays: number;
  lessonsPerAbsenceDay: number;
}
`;
  fs.writeFileSync(path, code);
  console.log('Added DisciplinarySettings');
} else {
  console.log('Already added');
}
