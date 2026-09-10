const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /setTeachers\(\(prev\) => \{\s*const target = prev\.find\(\(t\) => t\.id === id\);\s*if \(target\) deletedName = target\.name;\s*return prev\.filter\(\(t\) => t\.id !== id\);\s*\}\);/g,
  `setTeachers((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) deletedName = target.name;
      const updated = prev.filter((t) => t.id !== id);
      centralSyncService.directArrayMutation('teachers', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`
);

code = code.replace(
  /setStudents\(\(prev\) => \{\s*const target = prev\.find\(\(s\) => s\.id === id\);\s*if \(target\) deletedName = target\.name;\s*return prev\.filter\(\(s\) => s\.id !== id\);\s*\}\);/g,
  `setStudents((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) deletedName = target.name;
      const updated = prev.filter((s) => s.id !== id);
      centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });`
);

fs.writeFileSync(path, code);
console.log('Patched delete functions.');
