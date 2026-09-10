const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// Function to inject directArrayMutation call after setX
function injectMutation(code, funcName, arrayName, setCall) {
  const regex = new RegExp(`const ${funcName} = \\(.*?\\) => \\{[\\s\\S]*?${setCall}\\(\\(prev\\) => \\(?(.*?)\\)?\\);`, 'g');
  return code.replace(regex, (match, newArrayLogic) => {
    // If it's a simple array like `[newTeacher, ...prev]` or `prev.filter(...)`
    // We can compute the new array instantly and use it for set and mutation.
    
    // Instead of doing complex AST parsing, let's just replace the setState call:
    return match.replace(
      new RegExp(`${setCall}\\(\\(prev\\) => \\(?(.*?)\\)?\\);`), 
      `${setCall}((prev) => {
      const updated = $1;
      // Instantly sync to firebase
      centralSyncService.directArrayMutation('${arrayName}', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`
    );
  });
}

code = injectMutation(code, 'addTeacher', 'teachers', 'setTeachers');
code = injectMutation(code, 'addStudent', 'students', 'setStudents');
code = injectMutation(code, 'deleteTeacher', 'teachers', 'setTeachers');
code = injectMutation(code, 'deleteStudent', 'students', 'setStudents');

// Wait, updateStudent and updateTeacher have block bodies inside setStudents!
// Let's do it manually for update functions:
code = code.replace(
  /setTeachers\(\(prev\) =>\s*prev\.map\(\(t\) => {[\s\S]*?}\)\s*\);/g,
  `setTeachers((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          teacherName = t.name;
          return { ...t, ...updated };
        }
        return t;
      });
      centralSyncService.directArrayMutation('teachers', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`
);

code = code.replace(
  /setStudents\(\(prev\) =>\s*prev\.map\(\(s\) => {[\s\S]*?}\)\s*\);/g,
  `setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          studentName = s.name;
          return { ...s, ...updatedStudent };
        }
        return s;
      });
      centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`
);

fs.writeFileSync(path, code);
console.log('Patched AppContext.tsx with direct mutations.');
