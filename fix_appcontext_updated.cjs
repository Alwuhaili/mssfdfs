const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace `updated.` with `updateData.` inside `updateStudent`'s audit log
code = code.replace(/updated\.status/g, "updateData.status");

fs.writeFileSync(path, code);
