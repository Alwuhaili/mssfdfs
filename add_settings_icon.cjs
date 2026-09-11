const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Settings,')) {
  code = code.replace(/import \{/, 'import {\n  Settings,');
  fs.writeFileSync(path, code);
}
