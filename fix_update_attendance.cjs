const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
      if (deltaMissedLessons !== 0 || deltaExcusedDays !== 0) {
        setStudents((prev) => {
          const updatedArray = prev.map((s) => {
            if (s.id !== targetRecord?.studentId && s.name !== targetRecord?.studentName) return s;
            
            let missedLessons = Math.max(0, (s.totalMissedLessons || 0) + deltaMissedLessons);
            let excusedDays = Math.max(0, (s.excusedAbsenceDays || 0) + deltaExcusedDays);
            
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
  /if\s*\(\s*deltaMissedLessons\s*!==\s*0\s*\|\|\s*deltaExcusedDays\s*!==\s*0\s*\)\s*\{[\s\n]*\}/,
  replacement.trim()
);

fs.writeFileSync(path, code);
