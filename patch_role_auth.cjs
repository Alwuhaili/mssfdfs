const fs = require('fs');
let code = fs.readFileSync('src/components/RoleAuthModal.tsx', 'utf-8');

code = code.replace(
  "  supervisor: {\n    roleTitleAr: 'المشرف التربوي',",
  "  guest: {\n    roleTitleAr: 'زائر',\n    roleTitleEn: 'Guest',\n    iconStr: '👀',\n    defaultEmail: '',\n    defaultUsername: '',\n    defaultPhone: '',\n    defaultPasscode: '',\n  },\n  supervisor: {\n    roleTitleAr: 'المشرف التربوي',"
);
fs.writeFileSync('src/components/RoleAuthModal.tsx', code);
