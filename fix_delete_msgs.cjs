const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const deleteMessage = \(id: string, explicitUserId\?: string\) => \{/,
  `const deleteMessage = (id: string, explicitUserId?: string) => {
    // Admin override: Actually delete the message from the system completely
    if (role === 'admin' || currentUser?.role === 'admin') {
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== id);
        centralSyncService.directArrayMutation('messages', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
        return updated;
      });
      return;
    }`
);

content = content.replace(
  /const deleteNotification = \(id: string, explicitUserId\?: string\) => \{/,
  `const deleteNotification = (id: string, explicitUserId?: string) => {
    // Admin override: Actually delete the notification from the system completely
    if (role === 'admin' || currentUser?.role === 'admin') {
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        centralSyncService.directArrayMutation('notifications', updated, { id: currentUser?.id || role, name: currentUser?.name || role, role });
        return updated;
      });
      return;
    }`
);

fs.writeFileSync(path, content);
