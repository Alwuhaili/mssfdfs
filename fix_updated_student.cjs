const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// I will just remove the whole broken block `setStudents((prev) => { const updated = prev.map((s) => { if (s.id === id) { studentName = s.name; return { ...s, ...updatedStudent }; } return s; }); centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role }); return updated; });` everywhere it is inappropriately placed.

code = code.replace(/setStudents\(\(prev\) => \{\s*const updated = prev\.map\(\(s\) => \{\s*if \(s\.id === id\) \{\s*studentName = s\.name;\s*return \{ \.\.\.s, \.\.\.updatedStudent \};\s*\}\s*return s;\s*\}\);\s*centralSyncService\.directArrayMutation\('students', updated, \{ id: currentUser\?\.id \|\| role, name: currentUser\?\.name \|\| role, role \}\);\s*return updated;\s*\}\);/g, '');

fs.writeFileSync(path, code);
console.log('Removed broken updatedStudent blocks');
