const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
      {showSettingsModal && (
        <DisciplinarySettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}

      {/* Floating Success Toast Feedback */}
`;

code = code.replace(
  /\{\/\*\ Floating Success Toast Feedback\ \*\/\}/,
  replacement.trim()
);

fs.writeFileSync(path, code);
