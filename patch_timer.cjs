const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "pushDebounceTimer.current = setTimeout(async () => {",
  "pushDebounceTimer.current = setTimeout(async () => {\n        pushDebounceTimer.current = null;"
);

// Also we should check if syncStatus === 'syncing' to show the dialog
content = content.replace(
  "if (syncStatus === 'syncing' || pushDebounceTimer.current) {",
  "if (syncStatus === 'syncing') {"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched timer");
