const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

// Add quota exceeded flag
code = code.replace(
  /private isOnline: boolean = navigator\.onLine;/,
  `private isOnline: boolean = navigator.onLine;
  public isQuotaExceeded: boolean = false;`
);

// Prevent fetch
code = code.replace(
  /if \(!this\.isOnline\) \{/,
  `if (this.isQuotaExceeded) {
      return { success: false, message: 'تجاوز الحد اليومي المجاني لقاعدة البيانات' };
    }
    if (!this.isOnline) {`
);

// We need to inject this in fetchServerData and pushUpdates
// Let's do it using regex to inject the check at the start of fetchServerData, pushUpdates, directArrayMutation
function injectCheck(code, methodDecl) {
  return code.replace(
    methodDecl,
    methodDecl + `\n    if (this.isQuotaExceeded) return { success: false, message: 'الحد اليومي لتحديثات قاعدة البيانات استنفذ (Quota Exceeded).' };`
  );
}
function injectCheckMutation(code, methodDecl) {
  return code.replace(
    methodDecl,
    methodDecl + `\n    if (this.isQuotaExceeded) return false;`
  );
}

// Just catching it manually:
code = code.replace(
  /catch \(err: any\) \{/g,
  `catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
        console.error('Firebase Quota Exceeded!');
      }`
);

fs.writeFileSync(path, code);
console.log('Fixed Quota');
