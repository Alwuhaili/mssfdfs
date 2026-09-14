const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');
code = code.replace(
  "  if (role === 'supervisor') currentTabs = supervisorTabs;",
  "  if (role === 'supervisor') currentTabs = supervisorTabs;\n  if (role === 'guest') currentTabs = [{ id: 'overview', label: t.navOverview, icon: LayoutDashboard }];\n  if (role === 'guest') return null; // Or just return null to hide nav for guests"
);
fs.writeFileSync('src/components/Navigation.tsx', code);
