const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  /parent: 'أولياء الأمور',\n\s*supervisor: 'المشرف التربوي',\n\s*};\n/g,
  "parent: 'أولياء الأمور',\n      supervisor: 'المشرف التربوي',\n      guest: 'زائر',\n    };\n"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
