const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /console\.warn\('\[SyncService\] Firebase onSnapshot error:', err\);/g,
  `if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
          this.isQuotaExceeded = true;
          console.error('Firebase Quota Exceeded in onSnapshot!');
          try { disableNetwork(db); } catch(e) {}
        }
        console.warn('[SyncService] Firebase onSnapshot error:', err);`
);

fs.writeFileSync(path, code);
console.log('Fixed snapshot');
