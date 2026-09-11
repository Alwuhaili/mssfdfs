const fs = require('fs');
const path = 'src/main.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('unhandledrejection')) {
  const inject = `
// Catch uncaught Firebase Quota errors globally
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.code === 'resource-exhausted' || event.reason?.message?.includes('Quota') || event.reason?.message?.includes('resource-exhausted')) {
    event.preventDefault(); // Prevent it from logging as uncaught error
    console.error('Firebase Quota Limit reached (caught globally). Going offline.');
    import('./lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ terminate }) => {
        terminate(db).catch(()=> {});
      });
    });
  }
});
`;
  
  code = code.replace(/import \{ createRoot \} from 'react-dom\/client';/, `import { createRoot } from 'react-dom/client';\n` + inject);
  fs.writeFileSync(path, code);
  console.log('Added global handler');
}
