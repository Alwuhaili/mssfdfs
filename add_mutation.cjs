const fs = require('fs');
const path = 'src/services/syncService.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  public async directArrayMutation(key: string, dataArray: any[], sourceUser?: any): Promise<boolean> {`;

const newMethod = `  public async directObjectMutation(key: string, dataObj: any, sourceUser?: any): Promise<boolean> {
    if (this.isQuotaExceeded) return false;
    if (!this.isOnline) return false;
    try {
      const docRef = doc(db, 'database/main');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
         const data = snapshot.data();
         const newVersion = (data.version || 0) + 1;
         const safeDataObj = JSON.parse(JSON.stringify(dataObj));
         const safeSourceUser = JSON.parse(JSON.stringify(sourceUser || { id: 'admin-main', name: 'Direct Mutation', role: 'admin' }));
         
         await updateDoc(docRef, {
           [\`data.\${key}\`]: safeDataObj,
           version: newVersion,
           lastModified: new Date().toISOString(),
           lastSyncedBy: safeSourceUser,
           _timestamp: serverTimestamp()
         });
         this.currentVersion = newVersion;
         this.broadcastToTabs('SERVER_DATA_UPDATED', null, newVersion);
         return true;
      }
      return false;
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted')) {
        this.isQuotaExceeded = true;
      }
      return false;
    }
  }

`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, newMethod + targetStr);
  fs.writeFileSync(path, content);
  console.log('Successfully added directObjectMutation');
} else {
  console.log('Target string not found');
}
