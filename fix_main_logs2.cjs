const fs = require('fs');
const path = 'src/main.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const msg = args\.map\(String\)\.join\(' '\);/g,
  `const msg = args.map(a => (a instanceof Error ? a.message + ' ' + a.stack : typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');`
);

fs.writeFileSync(path, code);
console.log('Fixed error object serialization in interceptor');
