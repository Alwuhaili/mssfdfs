const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const \{\s*students,/g,
  "const {\n    disciplinarySettings,\n    students,"
);
fs.writeFileSync(path, code);
