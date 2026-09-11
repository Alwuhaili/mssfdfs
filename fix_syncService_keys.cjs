const fs = require('fs');
const path = 'src/services/syncService.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('"disciplinarySettings"')) {
  code = code.replace(
    /"decisionSettings", "examSchedules",/,
    `"decisionSettings", "disciplinarySettings", "examSchedules",`
  );
  fs.writeFileSync(path, code);
  console.log('Fixed syncService.ts');
}
