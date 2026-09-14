const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
code = code.replace(
  "    const savedRole = localStorage.getItem('maysan_current_role');\n    if (savedRole && ['admin', 'teacher', 'student', 'parent', 'supervisor'].includes(savedRole)) {\n      return savedRole as UserRole;\n    }\n    return 'admin';",
  "    const savedRole = localStorage.getItem('maysan_current_role');\n    if (savedRole && ['admin', 'teacher', 'student', 'parent', 'supervisor', 'guest'].includes(savedRole)) {\n      return savedRole as UserRole;\n    }\n    return 'guest';"
);
fs.writeFileSync('src/context/AppContext.tsx', code);
