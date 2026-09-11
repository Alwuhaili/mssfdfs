const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const updateStudent = (id: string, updated: Partial<Student>) => {
    let studentName = '';
    setStudents((prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id === id) {
          studentName = s.name;
          return { ...s, ...updated };
        }
        return s;
      });
      centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });`;

const replaceStr = `  const updateStudent = (id: string, updated: Partial<Student>) => {
    let studentName = '';
    let targetStudent: Student | undefined;
    setStudents((prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id === id) {
          studentName = updated.name || s.name;
          targetStudent = { ...s, ...updated };
          return targetStudent;
        }
        return s;
      });
      centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });

    // Also update associated parent record if any
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

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully replaced updateStudent');
} else {
  console.log('Target string not found');
}
