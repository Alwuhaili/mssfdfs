const fs = require('fs');

const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

const newMethod = `

  /**
   * Instantly mutates an array in Firebase database/main
   */
  public async directArrayMutation(key: string, dataArray: any[], sourceUser?: any): Promise<boolean> {
    if (!this.isOnline) return false;
    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const docRef = doc(db, 'database/main');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
         const data = snapshot.data();
         const newVersion = (data.version || 0) + 1;
         await updateDoc(docRef, {
           [\`data.\${key}\`]: dataArray,
           version: newVersion,
           lastModified: new Date().toISOString(),
           lastSyncedBy: sourceUser || { id: 'admin-main', name: 'Direct Mutation', role: 'admin' },
           _timestamp: serverTimestamp()
         });
         this.currentVersion = newVersion;
         this.broadcastToTabs('SERVER_DATA_UPDATED', null, newVersion);
         return true;
      }
      return false;
    } catch (err) {
      console.error('[SyncService] Direct mutation error:', err);
      return false;
    }
  }
`;

if (!code.includes('directArrayMutation')) {
  code = code.replace('public async getServerStatus()', newMethod + '\n  public async getServerStatus()');
  fs.writeFileSync(path, code);
  console.log('Patched syncService.ts');
} else {
  console.log('Already patched');
}
