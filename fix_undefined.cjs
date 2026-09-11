const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /await updateDoc\(docRef, \{([\s\S]*?)\}\);/,
  `// Clean undefined values by round-tripping through JSON
         const safeDataArray = JSON.parse(JSON.stringify(dataArray));
         const safeSourceUser = JSON.parse(JSON.stringify(sourceUser || { id: 'admin-main', name: 'Direct Mutation', role: 'admin' }));
         
         await updateDoc(docRef, {
           [\`data.\${key}\`]: safeDataArray,
           version: newVersion,
           lastModified: new Date().toISOString(),
           lastSyncedBy: safeSourceUser,
           _timestamp: serverTimestamp()
         });`
);

fs.writeFileSync(path, code);
console.log('Fixed undefined in updateDoc');
