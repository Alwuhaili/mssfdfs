const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `status: 'غير مدفوع',
              dueDate: '2026-09-01',
            };`;

const replaceStr = `status: 'غير مدفوع' as const,
              dueDate: '2026-09-01',
            };`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully fixed type');
} else {
  console.log('Target string not found');
}
