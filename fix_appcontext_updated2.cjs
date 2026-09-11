const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// Undo the blind replace
code = code.replace(/updateData\.status/g, "updated.status");

// Fix updateStudent's parameter to be named `updated` instead of `updateData`
code = code.replace(/const updateStudent = \(id: string, updateData: Partial<Student>\) => \{/g, 
  "const updateStudent = (id: string, updated: Partial<Student>) => {");

// Change `updateData` to `updated` in updateStudent body if there's any left
code = code.replace(/return \{ \.\.\.s, \.\.\.updateData \};/g, "return { ...s, ...updated };");

fs.writeFileSync(path, code);
