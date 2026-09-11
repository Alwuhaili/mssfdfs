const fs = require('fs');
const path = 'src/components/DataSyncModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// The incorrect part:
const badStr = `        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <X className="w-5 h-5" />
        </button>`;

const goodStr = `        <div className="p-4 sm:p-6 overflow-y-auto flex-1">`;

content = content.replace(badStr, goodStr);

fs.writeFileSync(path, content);
