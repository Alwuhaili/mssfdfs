const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const updateTeacher = \(id: string, updated: Partial<Teacher>\) => \{[\s\S]*?setTeachers\(\(prev\) => \{[\s\S]*?const updated = prev\.map\(\(t\) => \{[\s\S]*?if \(t\.id === id\) \{[\s\S]*?teacherName = t\.name;[\s\S]*?return \{ \.\.\.t, \.\.\.updated \};[\s\S]*?\}[\s\S]*?return t;[\s\S]*?\}\);[\s\S]*?centralSyncService\.directArrayMutation\('teachers', updated, \{ id: currentUser\?\.id \|\| role, name: currentUser\?\.name \|\| role, role \}\);[\s\S]*?return updated;[\s\S]*?\}\);/g,
  `const updateTeacher = (id: string, updateData: Partial<Teacher>) => {
    let teacherName = '';
    setTeachers((prev) => {
      const updatedArray = prev.map((t) => {
        if (t.id === id) {
          teacherName = t.name;
          return { ...t, ...updateData };
        }
        return t;
      });
      centralSyncService.directArrayMutation('teachers', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });`
);

code = code.replace(
  /const updateStudent = \(id: string, updated: Partial<Student>\) => \{[\s\S]*?setStudents\(\(prev\) => \{[\s\S]*?const updated = prev\.map\(\(s\) => \{[\s\S]*?if \(s\.id === id\) \{[\s\S]*?studentName = s\.name;[\s\S]*?return \{ \.\.\.s, \.\.\.updatedStudent \};[\s\S]*?\}[\s\S]*?return s;[\s\S]*?\}\);[\s\S]*?centralSyncService\.directArrayMutation\('students', updated, \{ id: currentUser\?\.id \|\| role, name: currentUser\?\.name \|\| role, role \}\);[\s\S]*?return updated;[\s\S]*?\}\);/g,
  `const updateStudent = (id: string, updateData: Partial<Student>) => {
    let studentName = '';
    setStudents((prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id === id) {
          studentName = s.name;
          return { ...s, ...updateData };
        }
        return s;
      });
      centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });`
);

fs.writeFileSync(path, code);
console.log('Fixed updates');
