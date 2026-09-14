const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  "  supervisor: '1234',\n};",
  "  supervisor: '1234',\n  guest: '1234',\n};"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
