const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
    // Deduct student missed lesson & recalculate absence days
    const deltaLessons = isAbsent ? -1 : 0;
    const deltaExcused = isExcused ? -1 : 0;
    
    if (deltaLessons !== 0 || deltaExcused !== 0) {
      setStudents((prev) => {
        const updatedArray = prev.map((s) => {
          if (s.id !== existing.studentId && s.name !== existing.studentName) return s;
          
          let missedLessons = Math.max(0, (s.totalMissedLessons || 0) + deltaLessons);
          let excusedDays = Math.max(0, (s.excusedAbsenceDays || 0) + deltaExcused);
          
          const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
          const unexcusedDays = Math.floor(missedLessons / lessPerDay);
          
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
            excusedAbsenceDays: excusedDays,
            warningLevel: newWarn
          };
        });
        centralSyncService.directArrayMutation('students', updatedArray, { id: currentUser?.id || role, name: currentUser?.name || role, role });
        return updatedArray;
      });
    }
`;

code = code.replace(
  /\/\/\ Deduct student missed lesson \& recalculate absence days\n\s*const deltaLessons = isAbsent \? -1 : 0;\n\s*const deltaExcused = isExcused \? -1 : 0;\n\s*\n\s*/,
  replacement.trim() + '\n\n    '
);

fs.writeFileSync(path, code);
