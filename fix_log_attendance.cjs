const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
      // 4. Update Cumulative Student Absence & Warning Levels Automatically
      setStudents((prev) => {
        const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;
        const first = disciplinarySettings?.firstWarningDays ?? 5;
        const final = disciplinarySettings?.finalWarningDays ?? 10;
        const expel = disciplinarySettings?.expulsionDays ?? 15;
        
        const updatedArray = prev.map((s) => {
          const rec = newRecords.find(r => r.studentId === s.id || r.studentName === s.name);
          if (!rec) return s;
          
          let missedLessons = s.totalMissedLessons || 0;
          let unexcusedDays = s.unexcusedAbsenceDays || 0;
          let excusedDays = s.excusedAbsenceDays || 0;
          
          if (rec.status === 'غائبة') {
            missedLessons += 1;
            if (missedLessons > 0 && missedLessons % lessPerDay === 0) {
              unexcusedDays += 1;
            }
          } else if (rec.status === 'مجازة') {
            // we'll just track missed lessons for excused if needed, but keeping it simple
            // usually excusedAbsenceDays is full days, we'll increment if we reach the threshold
            const totalExcusedLessons = (s.excusedAbsenceDays || 0) * lessPerDay + 1;
            if (totalExcusedLessons % lessPerDay === 0) {
              excusedDays += 1;
            }
          }
          
          let newWarn = s.warningLevel || 'طبيعي';
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
  };
`;

code = code.replace(
  /\/\/\ 4\.\ Update Cumulative Student Absence \& Warning Levels Automatically[\s\n]*\}\s*\};/m,
  replacement.trim() + '\n'
);

fs.writeFileSync(path, code);
