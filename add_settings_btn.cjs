const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 bg-indigo-600/60 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-2xl border border-indigo-400 text-xs text-white font-bold shadow-md"
              >
                <Settings className="w-4 h-4" />
                <span>إعدادات الانضباط والغياب</span>
              </button>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs text-indigo-100">
                <Building className="w-4 h-4 text-amber-400" />
                <span>نظام انضباط المدارس الثانوية رقم 2 لسنة 1977 وتعديلاته</span>
              </div>
            </div>
`;

code = code.replace(
  /<div className="flex items-center gap-3 flex-wrap">\s*<div className="flex items-center gap-2 bg-white\/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white\/15 text-xs text-indigo-100">\s*<Building className="w-4 h-4 text-amber-400" \/>\s*<span>نظام انضباط المدارس الثانوية رقم 2 لسنة 1977 وتعديلاته<\/span>\s*<\/div>\s*<\/div>/,
  replacement.trim()
);

fs.writeFileSync(path, code);
