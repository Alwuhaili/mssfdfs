const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \(targetStudent\) \{\s*\{/g, "if (targetStudent) {");
code = code.replace(/if \(targetDecision\) \{\s*\{/g, "if (targetDecision) {");
code = code.replace(/if \(targetStudent && notifyParent\) \{\s*\{/g, "if (targetStudent && notifyParent) {");

fs.writeFileSync(path, code);
