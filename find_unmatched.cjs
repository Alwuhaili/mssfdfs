const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');
let openCount = 0;
let lastOpen = -1;
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      openCount++;
    } else if (line[j] === '}') {
      openCount--;
    }
  }
}
console.log('Final open count:', openCount);
