const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };`;

const replaceStr = `    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      centralSyncService.directArrayMutation('auditLogs', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => {
      const updated = prev.filter((log) => log.id !== id);
      centralSyncService.directArrayMutation('auditLogs', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return updated;
    });
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    centralSyncService.directArrayMutation('auditLogs', [], { id: currentUser?.id || role, name: currentUser?.name || role, role });
  };`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully updated AppContext.tsx audit logs');
} else {
  console.log('Target string not found for audit logs');
}
