const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("if (targetDecision) { {", "if (targetDecision) {");

fs.writeFileSync(path, code);
