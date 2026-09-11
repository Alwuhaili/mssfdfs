const fs = require('fs');
const path = 'src/context/AppContext.tsx';
const content = fs.readFileSync(path, 'utf8');

const applyMatch = content.match(/const applyRemoteData = [\s\S]*?getFullPayload/);
const payloadMatch = content.match(/const getFullPayload = \(\) => \(\{[\s\S]*?\}\);/);

console.log("applyRemoteData fields:");
const applyFields = [...applyMatch[0].matchAll(/remoteData\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
console.log([...new Set(applyFields)].sort());

console.log("\ngetFullPayload fields:");
const payloadStr = payloadMatch[0].replace(/lectures:[\s\S]*?\],/, 'lectures,');
const payloadFields = [...payloadStr.matchAll(/([a-zA-Z0-9_]+),/g)].map(m => m[1]);
console.log([...new Set(payloadFields)].sort());

