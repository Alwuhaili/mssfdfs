const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    // Also update associated parent record if any, or create it if missing
    if (targetStudent) {
      setParents((prev) => {`;

const replaceStr = `    // Also check and create financial record if missing
    if (targetStudent) {
      setFinancial((prevFin) => {
        const hasFin = prevFin.some(f => f.studentId === id);
        if (!hasFin) {
            const randSuffix = Math.random().toString(36).substring(2, 7);
            const fin = {
              id: \`fin-\${Date.now()}-\${randSuffix}\`,
              studentId: targetStudent!.id,
              studentName: targetStudent!.name,
              gradeLevel: targetStudent!.gradeLevel,
              feeType: 'رسوم التسجيل والكتب',
              totalAmount: 120000,
              paidAmount: 0,
              status: 'غير مدفوع',
              dueDate: '2026-09-01',
            };
            const updatedFin = [fin, ...prevFin];
            centralSyncService.directArrayMutation('financial', updatedFin, { id: currentUser?.id || role, name: currentUser?.name || role, role });
            return updatedFin;
        }
        return prevFin;
      });
    }

    // Also update associated parent record if any, or create it if missing
    if (targetStudent) {
      setParents((prev) => {`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully added finance check to updateStudent');
} else {
  console.log('Target string not found');
}
