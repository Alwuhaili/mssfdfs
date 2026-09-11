const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /await setDoc\(docRef, \{\s*version: newVersion,\s*lastModified: lastModified,\s*lastSyncedBy: lastSyncedBy,\s*data: mergedData,\s*_timestamp: serverTimestamp\(\)\s*\}\);/,
  `const safeMergedData = JSON.parse(JSON.stringify(mergedData));
      const safeLastSyncedBy = JSON.parse(JSON.stringify(lastSyncedBy));
      
      await setDoc(docRef, {
        version: newVersion,
        lastModified: lastModified,
        lastSyncedBy: safeLastSyncedBy,
        data: safeMergedData,
        _timestamp: serverTimestamp()
      });`
);

fs.writeFileSync(path, code);
console.log('Fixed pushUpdates');
