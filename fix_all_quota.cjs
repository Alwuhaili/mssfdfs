const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

// The issue is that the user's browser tabs are still open from BEFORE we added terminate(db)
// or onSnapshot itself is throwing errors but NOT catching them properly inside the listener.
// Let's also wrap the onSnapshot call itself in a try catch and add an unhandled error listener.

code = code.replace(
  /this\.unsubscribeFirestore = onSnapshot\(docRef, \(snapshot\) => \{([\s\S]*?)\}, \(err\) => \{([\s\S]*?)\}\);/g,
  `try {
        this.unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
          $1
        }, (err: any) => {
          $2
        });
      } catch (err: any) {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
          this.isQuotaExceeded = true;
          terminate(db).catch(() => {})
          console.error('Firebase Quota Exceeded!');
        }
      }`
);

fs.writeFileSync(path, code);
console.log('Fixed onSnapshot');
