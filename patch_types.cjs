const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace(
  "  isDirectress?: boolean;\n  assignedGrades: GradeLevel[];",
  "  isDirectress?: boolean;\n  systemRole?: 'مدير' | 'معاون' | 'مدرس';\n  assignedGrades: GradeLevel[];"
);
fs.writeFileSync('src/types.ts', code);
