const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /catch \(err\) \{\s*console\.error\('\[SyncService\] Direct mutation error:', err\);\s*return false;\s*\}/,
  `catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
        console.error('Firebase Quota Exceeded!');
      }
      console.error('[SyncService] Direct mutation error:', err);
      return false;
    }`
);

// Inject isQuotaExceeded check at start of methods
code = code.replace(
  /public async pushUpdates\([\s\S]*?\{/,
  (match) => match + `\n    if (this.isQuotaExceeded) return { success: false, message: 'تجاوز الحد اليومي لقاعدة البيانات' };`
);

code = code.replace(
  /public async directArrayMutation\([\s\S]*?\{/,
  (match) => match + `\n    if (this.isQuotaExceeded) return false;`
);

fs.writeFileSync(path, code);
console.log('Fixed Quota for Mutation');
