const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  "const INITIAL_PASSCODES: Record<UserRole, string> = {\n  admin: '1234',\n  teacher: '1234',\n  student: '1234',\n  parent: '1234',\n  supervisor: '1234',\n};",
  "const INITIAL_PASSCODES: Record<UserRole, string> = {\n  admin: '1234',\n  teacher: '1234',\n  student: '1234',\n  parent: '1234',\n  supervisor: '1234',\n  guest: '',\n};"
);

code = code.replace(
  /parent: 'أولياء الأمور',\n\s*supervisor: 'المشرف التربوي',\n\s*};/g,
  "parent: 'أولياء الأمور',\n      supervisor: 'المشرف التربوي',\n      guest: 'زائر',\n    };"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
