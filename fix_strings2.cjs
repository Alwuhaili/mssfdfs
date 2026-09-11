const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/<span>5 أيام غياب<\/span>/g, "<span>{firstWarn} أيام غياب</span>");
code = code.replace(/<span>10 أيام غياب<\/span>/g, "<span>{finalWarn} أيام غياب</span>");
code = code.replace(/<span>15 يوماً متصلاً<\/span>/g, "<span>{expelDays} يوماً متصلاً</span>");

// Also check line 976
code = code.replace(/غياب \{firstWarn\} أيام غير مبررة \(25 درساً\) - يوجّه إنذار أول وإشعار ولي الأمر\./g, 
  "غياب {firstWarn} أيام غير مبررة ({firstWarn * lessPerDay} درساً) - يوجّه إنذار أول وإشعار ولي الأمر.");

fs.writeFileSync(path, code);
