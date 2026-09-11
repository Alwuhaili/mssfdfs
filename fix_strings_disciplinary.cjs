const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/غياب 10 أيام \(50 درساً\) - إنذار نهائي واستدعاء ولي الأمر بتعهد خطي\./g, 
  `غياب {finalWarn} أيام ({finalWarn * lessPerDay} درساً) - إنذار نهائي واستدعاء ولي الأمر بتعهد خطي.`);

code = code.replace(/غياب 5 أيام غير مبررة \(25 درساً\) - يوجّه إنذار أول وإشعار ولي الأمر\./g,
  `غياب {firstWarn} أيام غير مبررة ({firstWarn * lessPerDay} درساً) - يوجّه إنذار أول وإشعار ولي الأمر.`);

code = code.replace(/تجاوز 15 يوماً من الغياب غير المبرر \/ 75 درساً/g,
  `تجاوز {expelDays} يوماً من الغياب غير المبرر / {expelDays * lessPerDay} درساً`);

code = code.replace(/⚠️ إنذار نهائي خطي وتعهد ولي أمر \(تجاوز 10 أيام\)/g,
  `⚠️ إنذار نهائي خطي وتعهد ولي أمر (تجاوز {finalWarn} أيام)`);

code = code.replace(/🚨 إنذار أول خطي في الغياب \(تجاوز 5 أيام\)/g,
  `🚨 إنذار أول خطي في الغياب (تجاوز {firstWarn} أيام)`);

code = code.replace(/⛔ قرار فصل نهائي بسبب الغياب \(تجاوز 15 يوماً\)/g,
  `⛔ قرار فصل نهائي بسبب الغياب (تجاوز {expelDays} يوماً)`);

// ensure we didn't leave literal `{firstWarn}` strings in normal strings
// Replace `{firstWarn}` inside normal JSX text nodes (which requires `{...}`)
code = code.replace(/>([^<]*)\{firstWarn\}([^<]*)</g, ">$1{firstWarn}$2<");

fs.writeFileSync(path, code);
console.log('Fixed strings');
