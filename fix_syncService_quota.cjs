const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('private isQuotaExceeded')) {
  code = code.replace(
    /class CentralSyncService \{/,
    "class CentralSyncService {\n  private isQuotaExceeded: boolean = false;"
  );
  fs.writeFileSync(path, code);
  console.log('Fixed syncService isQuotaExceeded');
}
