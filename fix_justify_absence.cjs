const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
    let targetStudent: Student | undefined;
    setStudents((prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudent = s;
        
        let missedLessons = Math.max(0, (s.totalMissedLessons || 0));
        let unexcusedDays = Math.max(0, (s.unexcusedAbsenceDays || 0) - excusedDays);
        let newExcusedDays = (s.excusedAbsenceDays || 0) + excusedDays;
        
        const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
        // If we justify days, we might want to subtract from missed lessons too
        missedLessons = Math.max(0, missedLessons - (excusedDays * lessPerDay));
        
        const first = disciplinarySettings?.firstWarningDays ?? 5;
        const final = disciplinarySettings?.finalWarningDays ?? 10;
        const expel = disciplinarySettings?.expulsionDays ?? 15;
        
        let newWarn: 'طبيعي' | 'إنذار أول' | 'إنذار نهائي' | 'مستحقة للفصل' = 'طبيعي';
        if (unexcusedDays >= expel) newWarn = 'مستحقة للفصل';
        else if (unexcusedDays >= final) newWarn = 'إنذار نهائي';
        else if (unexcusedDays >= first) newWarn = 'إنذار أول';
        
        return {
          ...s,
          totalMissedLessons: missedLessons,
          unexcusedAbsenceDays: unexcusedDays,
          excusedAbsenceDays: newExcusedDays,
          warningLevel: newWarn
        };
      });
      centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });

    if (targetStudent) {
`;

code = code.replace(
  /const targetStudent = students\.find\(\(s\) => s\.id === studentId\);\s*if \(targetStudent\) \{/,
  replacement.trim() + ' {'
);

fs.writeFileSync(path, code);
