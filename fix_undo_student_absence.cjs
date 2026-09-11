const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
    let targetStudent: Student | undefined;
    
    setStudents((prev) => {
      const updatedArray = prev.map((s) => {
        if (s.id !== studentId) return s;
        targetStudent = s;
        
        let missedLessons = Math.max(0, (s.totalMissedLessons || 0) - lessonsToUndo);
        // Sometimes days are directly undone
        let unexcusedDays = Math.max(0, (s.unexcusedAbsenceDays || 0) - daysToUndo);
        
        // Let's recalculate unexcusedDays based on missedLessons if lessons were specifically given
        if (lessonsToUndo > 0) {
           const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
           unexcusedDays = Math.floor(missedLessons / lessPerDay);
        } else if (daysToUndo > 0) {
           const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
           missedLessons = Math.max(0, (s.totalMissedLessons || 0) - (daysToUndo * lessPerDay));
        }
        
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
          warningLevel: newWarn
        };
      });
      centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updatedArray;
    });

    if (targetStudent && notifyParent) {
`;

code = code.replace(
  /let targetStudent: Student \| undefined;\s*if \(targetStudent && notifyParent\) \{/,
  replacement.trim() + ' {'
);

fs.writeFileSync(path, code);
