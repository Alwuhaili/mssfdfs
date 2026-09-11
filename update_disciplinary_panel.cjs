const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('DisciplinarySettingsModal')) {
  // Add import
  code = code.replace(
    /import \{ useApp \} from '\.\.\/context\/AppContext';/,
    "import { useApp } from '../context/AppContext';\nimport { DisciplinarySettingsModal } from './DisciplinarySettingsModal';"
  );
  
  // Add state for modal
  code = code.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    "const [searchQuery, setSearchQuery] = useState('');\n  const [showSettingsModal, setShowSettingsModal] = useState(false);"
  );

  // Replace hardcoded values with settings
  // Settings to use:
  // const firstWarn = disciplinarySettings?.firstWarningDays ?? 5;
  // const finalWarn = disciplinarySettings?.finalWarningDays ?? 10;
  // const expelDays = disciplinarySettings?.expulsionDays ?? 15;
  // const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;

  // Add the variables right inside the component
  code = code.replace(
    /const \{[\s\n]*students,[\s\n]*role,/,
    "const {\n    disciplinarySettings,\n    students,\n    role,"
  );

  code = code.replace(
    /const \[searchQuery, setSearchQuery\]/,
    `const firstWarn = disciplinarySettings?.firstWarningDays ?? 5;
  const finalWarn = disciplinarySettings?.finalWarningDays ?? 10;
  const expelDays = disciplinarySettings?.expulsionDays ?? 15;
  const lessPerDay = disciplinarySettings?.lessonsPerAbsenceDay ?? 5;

  const [searchQuery, setSearchQuery]`
  );

  // Now replace the usages
  // 1. In getStudentAbsenceBreakdown (wait, does it exist here or in AppContext? I didn't search. Let's see)
  
  // Replace warning logic string:
  // newUnexcused >= 15 ? ... : newUnexcused >= 10 ? ... : newUnexcused >= 5
  code = code.replace(/unexcused >= 15/g, 'unexcused >= expelDays');
  code = code.replace(/unexcused >= 10/g, 'unexcused >= finalWarn');
  code = code.replace(/unexcused >= 5/g, 'unexcused >= firstWarn');
  
  code = code.replace(/newUnexcused >= 15/g, 'newUnexcused >= expelDays');
  code = code.replace(/newUnexcused >= 10/g, 'newUnexcused >= finalWarn');
  code = code.replace(/newUnexcused >= 5/g, 'newUnexcused >= firstWarn');

  // Replace warning counts
  code = code.replace(
    /const expelledCount = students.filter\(\(s\) => s\.unexcusedAbsenceDays && s\.unexcusedAbsenceDays >= 15\)\.length;/g,
    "const expelledCount = students.filter((s) => s.unexcusedAbsenceDays && s.unexcusedAbsenceDays >= expelDays).length;"
  );
  
  // Check string literals in labels
  code = code.replace(/فصل بالغياب \(15\+ يوم\)/g, "فصل بالغياب ({expelDays}+ يوم)");
  code = code.replace(/إنذار نهائي \(10 أيام\)/g, "إنذار نهائي ({finalWarn} أيام)");
  code = code.replace(/إنذار أول \(5 أيام\)/g, "إنذار أول ({firstWarn} أيام)");
  
  code = code.replace(/🚨 إنذار نهائي خطي في الغياب \(تجاوز 10 أيام\)/g, "🚨 إنذار نهائي خطي في الغياب (تجاوز {finalWarn} أيام)");
  code = code.replace(/🚨 إنذار أول خطي في الغياب \(تجاوز 5 أيام\)/g, "🚨 إنذار أول خطي في الغياب (تجاوز {firstWarn} أيام)");
  code = code.replace(/⛔ قرار فصل نهائي بسبب الغياب \(تجاوز 15 يوماً\)/g, "⛔ قرار فصل نهائي بسبب الغياب (تجاوز {expelDays} يوماً)");
  
  code = code.replace(/تجاوز 15 يوماً غياب/g, "تجاوز {expelDays} يوماً غياب");
  code = code.replace(/غياب 5 أيام غير مبررة/g, "غياب {firstWarn} أيام غير مبررة");
  code = code.replace(/غياب 10 أيام غير مبررة/g, "غياب {finalWarn} أيام غير مبررة");
  
  // Replace lessons per day (5)
  code = code.replace(/days \* 5/g, "days * lessPerDay");
  code = code.replace(/lessonsToUndo > 0 \? lessonsToUndo : daysToUndo \* 5/g, "lessonsToUndo > 0 ? lessonsToUndo : daysToUndo * lessPerDay");
  
  // Math.floor(lessons / 5) -> Math.floor(lessons / lessPerDay)
  code = code.replace(/Math\.floor\(([^]+?) \/ 5\)/g, "Math.floor($1 / lessPerDay)");

  // Add the Settings Button in the header actions
  code = code.replace(
    /(<button[^>]*onClick=\{handlePrintGeneralReport\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
          {role === 'admin' && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="h-10 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Scale className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">إعدادات الانضباط</span>
            </button>
          )}`
  );

  // Add the modal component at the end of the return
  code = code.replace(
    /(<\/div>[\s\n]*)$/,
    `  <DisciplinarySettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    $1`
  );

  fs.writeFileSync(path, code);
  console.log('Fixed DisciplinaryAttendancePanel');
}
