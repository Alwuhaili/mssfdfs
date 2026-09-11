const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    // Also remove parent linked record if any
    setParents((prev) => prev.filter((p) => p.studentId !== id));`;

const replaceStr = `    // Also remove parent linked record if any
    setParents((prev) => {
      const updated = prev.filter((p) => p.studentId !== id);
      centralSyncService.directArrayMutation('parents', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });
    setFinancial((prev) => {
      const updated = prev.filter((f) => f.studentId !== id);
      centralSyncService.directArrayMutation('financial', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully patched deleteStudent');
} else {
  console.log('Target string not found in deleteStudent');
}
