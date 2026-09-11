const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /this\.isQuotaExceeded = true;\s*terminate\(db\)\.catch\(\(\) => \{\}\)/g,
  `this.isQuotaExceeded = true;
          if (this.unsubscribeFirestore) {
            try { this.unsubscribeFirestore(); } catch(e) {}
          }
          terminate(db).catch(() => {})`
);

fs.writeFileSync(path, code);
console.log('Fixed unsubscribe');
