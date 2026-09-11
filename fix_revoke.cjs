const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
  const revokeDisciplinaryDecision = (decisionId: string, studentId: string, reason?: string) => {
    let targetStudentName = '';
    let targetParentId: string | undefined;
    // We don't have a DisciplinaryDecision store in state. 
    // We just need to send the notification to the parent/student.
    const targetDecision = { decisionType: 'قرار إداري' };
    
    setStudents((prev) => {
      const updatedArray = prev.map(s => {
        if (s.id !== studentId) return s;
        targetStudentName = s.name;
        targetParentId = s.parentId;
        return s; 
      });
      return updatedArray;
    });

    if (targetDecision) {
`;

code = code.replace(
  /const revokeDisciplinaryDecision = \(decisionId: string, studentId: string, reason\?: string\) => \{[\s\S]*?if \(targetDecision\) \{/,
  replacement.trim() + ' {'
);

fs.writeFileSync(path, code);
