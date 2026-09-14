const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { ExamTakingModal } from './components/ExamTakingModal';",
  "import { ExamTakingModal } from './components/ExamTakingModal';\nimport { SchoolHomeOverview } from './components/SchoolHomeOverview';"
);

code = code.replace(
  "        {role === 'supervisor' && <SupervisorDashboard activeTab={activeTab} />}",
  "        {role === 'supervisor' && <SupervisorDashboard activeTab={activeTab} />}\n        {role === 'guest' && <SchoolHomeOverview />}"
);

fs.writeFileSync('src/App.tsx', code);
