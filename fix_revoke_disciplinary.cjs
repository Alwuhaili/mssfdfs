const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
  const revokeDisciplinaryDecision = (decisionId: string, studentId: string, reason?: string) => {
    let targetStudentName = '';
    let targetParentId: string | undefined;
    let targetDecision: DisciplinaryDecision | undefined;
    
    setDisciplinaryDecisions((prev) => {
      const decisionIndex = prev.findIndex(d => d.id === decisionId);
      if (decisionIndex === -1) return prev;
      targetDecision = prev[decisionIndex];
      const updatedArray = [...prev];
      updatedArray[decisionIndex] = { ...targetDecision, status: 'مسحوب' };
      centralSyncService.directArrayMutation('disciplinaryDecisions', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });

    setStudents((prev) => {
      const updatedArray = prev.map(s => {
        if (s.id !== studentId) return s;
        targetStudentName = s.name;
        targetParentId = s.parentId;
        // Depending on decision type, we might not adjust absence days, 
        // as the decision is just a formal warning. 
        // But if it's a decision we retract, warningLevel remains calculated dynamically based on days!
        return s; 
      });
      return updatedArray;
    });
    
    if (targetDecision) {
`;

code = code.replace(
  /const revokeDisciplinaryDecision = \(decisionId: string, studentId: string, reason\?: string\) => \{[\s\n]*let targetStudentName = '';[\s\n]*let targetParentId: string \| undefined;[\s\n]*let targetDecision: DisciplinaryDecision \| undefined;[\s\n]*if \(targetDecision\) \{/,
  replacement.trim() + ' {'
);

fs.writeFileSync(path, code);
