const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Change debounce delay to 100 for all
content = content.replace(
  "const debounceDelay = role === 'admin' ? 250 : 1200;",
  "const debounceDelay = 100;"
);

// 2. Add beforeunload listener
const beforeUnloadCode = `
  // Prevent data loss on accidental refresh before sync completes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === 'syncing' || pushDebounceTimer.current) {
        e.preventDefault();
        e.returnValue = 'جاري حفظ البيانات في قاعدة البيانات... يرجى الانتظار للحظات لتجنب فقدان البيانات.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus]);
`;

if (!content.includes('handleBeforeUnload')) {
  content = content.replace(
    "  // Apply remote data securely to React state",
    beforeUnloadCode + "\n  // Apply remote data securely to React state"
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log("Patched AppContext.tsx");
