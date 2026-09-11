const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('terminate')) {
  code = code.replace(
    /import \{ (.*?) disableNetwork \} from 'firebase\/firestore';/,
    "import { $1 disableNetwork, terminate } from 'firebase/firestore';"
  );
} else {
  code = code.replace(
    /import \{ (.*?) disableNetwork(.*?) \} from 'firebase\/firestore';/,
    "import { $1 disableNetwork, terminate$2 } from 'firebase/firestore';"
  );
}

// Replace all disableNetwork(db) with terminate(db)
code = code.replace(/disableNetwork\(db\)/g, 'terminate(db)');

// Remove try/catch since terminate returns a promise and we should just catch the promise
code = code.replace(/try \{ terminate\(db\); \} catch\(e\) \{\}/g, 'terminate(db).catch(() => {})');

fs.writeFileSync(path, code);
console.log('Fixed terminate');
