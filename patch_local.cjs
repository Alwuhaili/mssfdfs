const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `        const payload = getFullPayload();
        
        // --- OFFLINE FALLBACK ---
        // Always save to localStorage immediately to prevent data loss 
        // in case Firebase hits its daily quota limit.
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        } catch(e) {
          console.error("Local storage save failed", e);
        }
        
        const sourceUser = {`;

content = content.replace("        const payload = getFullPayload();\n        const sourceUser = {", replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched local storage fallback.");
