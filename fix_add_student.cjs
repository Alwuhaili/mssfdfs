const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const addStudent = (data: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newStudent: Student = {
      ...data,
      id: \`std-\${Date.now()}-\${randSuffix}\`,
      status: 'منتظمة',
      enrollmentYear: data.enrollmentYear?.trim() || '2026',
    };
    setStudents((prev) => {
      const updated = [newStudent, ...prev];
      // Instantly sync to firebase
      centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });

    // Auto add parent account link
    const newParent: Parent = {
      id: \`prt-\${Date.now()}-\${randSuffix}\`,
      name: data.parentName,
      phone: data.parentPhone,
      email: data.parentEmail,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
    };
    setParents((prev) => [newParent, ...prev]);

    // Create initial tuition financial record
    const fin: FinancialRecord = {
      id: \`fin-\${Date.now()}-\${randSuffix}\`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
      feeType: 'رسوم التسجيل والكتب',
      totalAmount: 120000,
      paidAmount: 0,
      status: 'غير مدفوع',
      dueDate: '2026-09-01',
    };
    setFinancial((prev) => [fin, ...prev]);`;

const replaceStr = `  const addStudent = (data: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const parentId = \`prt-\${Date.now()}-\${randSuffix}\`;
    const newStudent: Student = {
      ...data,
      id: \`std-\${Date.now()}-\${randSuffix}\`,
      parentId,
      status: 'منتظمة',
      enrollmentYear: data.enrollmentYear?.trim() || '2026',
    };
    setStudents((prev) => {
      const updated = [newStudent, ...prev];
      // Instantly sync to firebase
      centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });

    // Auto add parent account link
    const newParent: Parent = {
      id: parentId,
      name: data.parentName,
      phone: data.parentPhone,
      email: data.parentEmail,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
    };
    setParents((prev) => {
      const updated = [newParent, ...prev];
      centralSyncService.directArrayMutation('parents', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });

    // Create initial tuition financial record
    const fin: FinancialRecord = {
      id: \`fin-\${Date.now()}-\${randSuffix}\`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
      feeType: 'رسوم التسجيل والكتب',
      totalAmount: 120000,
      paidAmount: 0,
      status: 'غير مدفوع',
      dueDate: '2026-09-01',
    };
    setFinancial((prev) => {
      const updated = [fin, ...prev];
      centralSyncService.directArrayMutation('financial', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully replaced addStudent');
} else {
  console.log('Target string not found');
}
