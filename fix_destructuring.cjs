const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const \{\s*attendance,/g,
  "const {\n    disciplinarySettings,\n    attendance,"
);
fs.writeFileSync(path, code);
