const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  /parent: 'أولياء الأمور',\n\s*supervisor: 'المشرف التربوي',/g,
  "parent: 'أولياء الأمور',\n      supervisor: 'المشرف التربوي',\n      guest: 'زائر',"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
