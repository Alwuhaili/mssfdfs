const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const updateDecisionSettings = (updated: Partial<MinistryDecisionSettings>) => {
    setDecisionSettings((prev) => {
      const next = { ...prev, ...updated };
      setCertificates((certs) => certs.map((c) => computeCertificateStats(c, next)));
      return next;
    });
  };`;

const replaceStr = `  const updateDecisionSettings = (updated: Partial<MinistryDecisionSettings>) => {
    setDecisionSettings((prev) => {
      const next = { ...prev, ...updated };
      setCertificates((certs) => certs.map((c) => computeCertificateStats(c, next)));
      centralSyncService.directObjectMutation('decisionSettings', next, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return next;
    });
  };`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully updated AppContext.tsx updateDecisionSettings');
} else {
  console.log('Target string not found');
}
