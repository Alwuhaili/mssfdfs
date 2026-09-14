const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace(
  "export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'supervisor';",
  "export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'supervisor' | 'guest';"
);
fs.writeFileSync('src/types.ts', code);
