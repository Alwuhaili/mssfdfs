const fs = require('fs');
let code = fs.readFileSync('src/components/MessagingSystem.tsx', 'utf-8');

code = code.replace(
  "  const ROLE_ADMIN_TEMPLATES: Record<UserRole, AdminTemplateItem[]> = {\n    admin: [",
  "  const ROLE_ADMIN_TEMPLATES: Record<UserRole, AdminTemplateItem[]> = {\n    guest: [],\n    admin: ["
);

fs.writeFileSync('src/components/MessagingSystem.tsx', code);
