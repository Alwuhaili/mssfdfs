const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    // Also update associated parent record if any
    if (targetStudent) {
      setParents((prev) => {
        let parentChanged = false;
        const updatedParents = prev.map((p) => {
          if (p.id === targetStudent!.parentId || p.studentId === id) {
            parentChanged = true;
            return {
              ...p,
              name: targetStudent!.parentName,
              phone: targetStudent!.parentPhone,
              email: targetStudent!.parentEmail,
              studentName: targetStudent!.name,
              gradeLevel: targetStudent!.gradeLevel,
            };
          }
          return p;
        });
        if (parentChanged) {
          centralSyncService.directArrayMutation('parents', updatedParents, { id: currentUser?.id || role, name: currentUser?.name || role, role });
        }
        return updatedParents;
      });
    }`;

const replaceStr = `    // Also update associated parent record if any, or create it if missing
    if (targetStudent) {
      setParents((prev) => {
        let parentChanged = false;
        let parentFound = false;
        const updatedParents = prev.map((p) => {
          if (p.id === targetStudent!.parentId || p.studentId === id) {
            parentFound = true;
            parentChanged = true;
            return {
              ...p,
              name: targetStudent!.parentName,
              phone: targetStudent!.parentPhone,
              email: targetStudent!.parentEmail,
              studentName: targetStudent!.name,
              gradeLevel: targetStudent!.gradeLevel,
            };
          }
          return p;
        });
        
        if (!parentFound && (targetStudent.parentName || targetStudent.parentPhone)) {
            const newParentId = targetStudent.parentId || \`prt-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`;
            const newParent = {
              id: newParentId,
              name: targetStudent.parentName || '',
              phone: targetStudent.parentPhone || '',
              email: targetStudent.parentEmail || '',
              studentId: targetStudent.id,
              studentName: targetStudent.name,
              gradeLevel: targetStudent.gradeLevel,
            };
            updatedParents.unshift(newParent as any);
            parentChanged = true;
            
            if (!targetStudent.parentId) {
               setStudents(currStudents => {
                   const stdUpdated = currStudents.map(s => s.id === id ? { ...s, parentId: newParentId } : s);
                   centralSyncService.directArrayMutation('students', stdUpdated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
                   return stdUpdated;
               });
            }
        }

        if (parentChanged) {
          centralSyncService.directArrayMutation('parents', updatedParents, { id: currentUser?.id || role, name: currentUser?.name || role, role });
        }
        return updatedParents;
      });
    }`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully replaced updateStudent');
} else {
  console.log('Target string not found');
}
