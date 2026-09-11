const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /centralSyncService\.directObjectMutation\('userPasscodes', copy, \{ id: currentUser\?\.id \|\| role, name: currentUser\?\.name \|\| role, role \}\);\n/g,
  ''
);

fs.writeFileSync(path, content);
