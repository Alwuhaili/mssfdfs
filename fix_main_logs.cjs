const fs = require('fs');
const path = 'src/main.tsx';
let code = fs.readFileSync(path, 'utf8');

const interceptor = `
const originalError = console.error;
console.error = (...args) => {
  const msg = args.map(String).join(' ');
  if (msg.includes('resource-exhausted') || msg.includes('Quota') || msg.includes('maximum backoff delay')) {
    return; // Suppress Firebase quota spam
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.map(String).join(' ');
  if (msg.includes('resource-exhausted') || msg.includes('Quota') || msg.includes('maximum backoff delay')) {
    return; // Suppress Firebase quota spam
  }
  originalWarn.apply(console, args);
};
`;

if (!code.includes('originalError')) {
  code = code.replace(/import \{ ErrorBoundary \} from '\.\/components\/ErrorBoundary\.tsx';/, "import { ErrorBoundary } from './components/ErrorBoundary.tsx';\n" + interceptor);
  fs.writeFileSync(path, code);
  console.log('Added console interceptors');
} else {
  console.log('Already added');
}
