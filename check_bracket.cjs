const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// just look at the last 100 lines
console.log(code.split('\n').slice(-30).join('\n'));
