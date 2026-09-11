const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('disableNetwork')) {
  code = code.replace(
    /import \{ (.*?) \} from 'firebase\/firestore';/,
    "import { $1, disableNetwork } from 'firebase/firestore';"
  );
  
  code = code.replace(
    /this\.isQuotaExceeded = true;/g,
    `this.isQuotaExceeded = true;
        try { disableNetwork(db); } catch(e) {}`
  );
  
  fs.writeFileSync(path, code);
  console.log('Added disableNetwork');
} else {
  console.log('Already added');
}
