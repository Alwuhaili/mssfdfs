const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /public async pushUpdates\(\s*updates: any,\s*sourceUser\?: \{\s*if \(this\.isQuotaExceeded\) return \{ success: false, message: 'تجاوز الحد اليومي لقاعدة البيانات' \}; id\?: string; name\?: string; role\?: string \},\s*clientVersion\?: number\s*\): Promise<SyncResponse> \{/,
  `public async pushUpdates(
    updates: any,
    sourceUser?: { id?: string; name?: string; role?: string },
    clientVersion?: number
  ): Promise<SyncResponse> {
    if (this.isQuotaExceeded) return { success: false, message: 'تجاوز الحد اليومي لقاعدة البيانات' };`
);

fs.writeFileSync(path, code);
console.log('Fixed syntax error');
