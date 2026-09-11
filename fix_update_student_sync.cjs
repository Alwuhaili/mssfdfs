const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const updateStudent = (id: string, updated: Partial<Student>) => {
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

    // Also check and create financial record if missing
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
              status: 'غير مدفوع' as const,
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
    }

    addAuditLog({
      action: \`تعديل بيانات الطالبة: \${studentName || id}\`,
      actionType: updated.status ? 'status_change' : 'update',
      targetCategory: 'students',
      targetId: id,
      targetName: studentName || id,
      details: updated.status
        ? \`تعديل حالة الطالبة (\${studentName}) إلى [\${updated.status}]\`
        : \`تحديث بيانات ومعلومات الطالبة (\${studentName})\`,
      severity: 'info',
    });
  };`;

const replaceStr = `  const updateStudent = (id: string, updated: Partial<Student>) => {
    // 1. Find the target student synchronously from the current state
    const currentStudent = students.find(s => s.id === id);
    if (!currentStudent) return; // Prevent crashes if student not found

    let targetStudent = { ...currentStudent, ...updated };
    const studentName = targetStudent.name || id;

    // 2. Check if parent needs to be created or updated
    let parentFound = false;
    let newParentId = targetStudent.parentId;
    let updatedParents = parents.map((p) => {
        if (p.id === targetStudent.parentId || p.studentId === id) {
            parentFound = true;
            return {
                ...p,
                name: targetStudent.parentName,
                phone: targetStudent.parentPhone,
                email: targetStudent.parentEmail,
                studentName: targetStudent.name,
                gradeLevel: targetStudent.gradeLevel,
            };
        }
        return p;
    });

    if (!parentFound && (targetStudent.parentName || targetStudent.parentPhone)) {
        newParentId = targetStudent.parentId || \`prt-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`;
        const newParent = {
            id: newParentId,
            name: targetStudent.parentName || '',
            phone: targetStudent.parentPhone || '',
            email: targetStudent.parentEmail || '',
            studentId: targetStudent.id,
            studentName: targetStudent.name,
            gradeLevel: targetStudent.gradeLevel,
        };
        updatedParents = [newParent as any, ...updatedParents];
        targetStudent.parentId = newParentId;
    }

    // 3. Update students array
    const updatedStudents = students.map(s => s.id === id ? targetStudent : s);
    
    // 4. Update financial record if missing
    let updatedFin = [...financial];
    const hasFin = updatedFin.some(f => f.studentId === id);
    if (!hasFin) {
        const randSuffix = Math.random().toString(36).substring(2, 7);
        const fin = {
            id: \`fin-\${Date.now()}-\${randSuffix}\`,
            studentId: targetStudent.id,
            studentName: targetStudent.name,
            gradeLevel: targetStudent.gradeLevel,
            feeType: 'رسوم التسجيل والكتب',
            totalAmount: 120000,
            paidAmount: 0,
            status: 'غير مدفوع' as const,
            dueDate: '2026-09-01',
        };
        updatedFin = [fin, ...updatedFin];
    }

    // 5. Apply the updates to state and sync
    setStudents(updatedStudents);
    centralSyncService.directArrayMutation('students', updatedStudents, { id: currentUser?.id || role, name: currentUser?.name || role, role });
    
    setParents(updatedParents);
    centralSyncService.directArrayMutation('parents', updatedParents, { id: currentUser?.id || role, name: currentUser?.name || role, role });
    
    if (!hasFin) {
        setFinancial(updatedFin);
        centralSyncService.directArrayMutation('financial', updatedFin, { id: currentUser?.id || role, name: currentUser?.name || role, role });
    }

    addAuditLog({
      action: \`تعديل بيانات الطالبة: \${studentName}\`,
      actionType: updated.status ? 'status_change' : 'update',
      targetCategory: 'students',
      targetId: id,
      targetName: studentName,
      details: updated.status
        ? \`تعديل حالة الطالبة (\${studentName}) إلى [\${updated.status}]\`
        : \`تحديث بيانات ومعلومات الطالبة (\${studentName})\`,
      severity: 'info',
    });
  };`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully fixed updateStudent async issue');
} else {
  console.log('Target string not found');
}
