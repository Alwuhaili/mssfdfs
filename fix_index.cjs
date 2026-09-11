const fs = require('fs');
const path = 'src/index.css';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('isQuotaExceeded')) {
  // Wait, let's inject a global window error listener in main.tsx instead.
}
