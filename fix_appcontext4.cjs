const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const updateDisciplinarySettings = (updated: Partial<DisciplinarySettings>) => {
    let finalSettings: DisciplinarySettings;
    setDisciplinarySettings((prev) => {
      const newVal = { ...prev, ...updated };
      finalSettings = newVal;
      centralSyncService.pushUpdates({ disciplinarySettings: newVal }, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return newVal;
    });`;

const replaceStr = `  const updateDisciplinarySettings = (updated: Partial<DisciplinarySettings>) => {
    let finalSettings: DisciplinarySettings;
    setDisciplinarySettings((prev) => {
      const newVal = { ...prev, ...updated };
      finalSettings = newVal;
      centralSyncService.directObjectMutation('disciplinarySettings', newVal, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return newVal;
    });`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully updated AppContext.tsx updateDisciplinarySettings');
} else {
  console.log('Target string not found');
}
