const fs = require('fs');
let code = fs.readFileSync('src/components/RoleAuthModal.tsx', 'utf-8');

code = code.replace(
  "{(targetRole === 'teacher' || (!targetRole && teachers.length > 0)) && (",
  "{(targetRole === 'teacher' && role !== 'guest') && ("
);
code = code.replace(
  "{(targetRole === 'student' || (!targetRole && students.length > 0)) && (",
  "{(targetRole === 'student' && role !== 'guest') && ("
);
code = code.replace(
  "{(targetRole === 'parent' || (!targetRole && parents.length > 0)) && (",
  "{(targetRole === 'parent' && role !== 'guest') && ("
);
code = code.replace(
  "{(targetRole === 'supervisor' || (!targetRole && supervisors && supervisors.length > 0)) && (",
  "{(targetRole === 'supervisor' && role !== 'guest') && ("
);

// We need to import `role` from useApp if it's not imported already.
// Let's check if role is destructured from useApp().
