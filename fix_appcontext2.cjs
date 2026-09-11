const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const updateSchoolAdminData = (updated: Partial<SchoolAdminData>) => {
    setSchoolAdminData((prev) => ({ ...prev, ...updated }));
    addAuditLog({`;

const replaceStr = `  const updateSchoolAdminData = (updated: Partial<SchoolAdminData>) => {
    setSchoolAdminData((prev) => {
      const newData = { ...prev, ...updated };
      centralSyncService.directObjectMutation('schoolAdminData', newData, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return newData;
    });
    addAuditLog({`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully updated AppContext.tsx updateSchoolAdminData');
} else {
  console.log('Target string not found');
}
