const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const recalculateStr = `
  const recalculateStudentAbsenceStats = (studentId?: string, overrideSettings?: DisciplinarySettings) => {
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (studentId && s.id !== studentId) return s;
        const discSettings = overrideSettings || disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;
        const first = discSettings.firstWarningDays ?? 5;
        const final = discSettings.finalWarningDays ?? 10;
        const expel = discSettings.expulsionDays ?? 15;
        
        const unexcused = s.unexcusedAbsenceDays || 0;
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcused >= expel) newWarn = 'مستحقة للفصل';
        else if (unexcused >= final) newWarn = 'إنذار نهائي';
        else if (unexcused >= first) newWarn = 'إنذار أول';
        
        if (s.warningLevel !== newWarn) {
          return { ...s, warningLevel: newWarn };
        }
        return s;
      });
      centralSyncService.directArrayMutation('students', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });
  };
`;

code = code.replace(
  /const recalculateStudentAbsenceStats = \(studentId\?: string\) => \{[\s\n]*\};/,
  recalculateStr.trim()
);

// updateDisciplinarySettings to call recalculateStudentAbsenceStats
code = code.replace(
  /const updateDisciplinarySettings = \(updated: Partial<DisciplinarySettings>\) => \{[\s\S]*?return newVal;\s*\}\);/,
  `const updateDisciplinarySettings = (updated: Partial<DisciplinarySettings>) => {
    let finalSettings: DisciplinarySettings;
    setDisciplinarySettings((prev) => {
      const newVal = { ...prev, ...updated };
      finalSettings = newVal;
      centralSyncService.pushUpdates({ disciplinarySettings: newVal }, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return newVal;
    });
    // Give state time to settle or pass explicit config
    setTimeout(() => {
      recalculateStudentAbsenceStats(undefined, updated as DisciplinarySettings);
    }, 100);`
);

fs.writeFileSync(path, code);
