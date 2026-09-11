const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('disciplinarySettings,')) {
  code = code.replace(
    /decisionSettings,/,
    "decisionSettings,\n    disciplinarySettings,"
  );
  fs.writeFileSync(path, code);
  console.log('Fixed getFullPayload');
}
