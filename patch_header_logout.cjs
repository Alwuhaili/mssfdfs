const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');

const logoutBtn = `
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        localStorage.removeItem('maysan_current_user_v1');
                        localStorage.removeItem('maysan_current_role');
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 text-xs font-bold transition-all border border-rose-200/70 dark:border-rose-800"
                    >
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
                    </button>
`;

code = code.replace(
  "                    <button\n                      onClick={() => {\n                        setShowRoleMenu(false);\n                        setIsChangePasswordOpen(true);\n                      }}",
  logoutBtn + "\n                    <button\n                      onClick={() => {\n                        setShowRoleMenu(false);\n                        setIsChangePasswordOpen(true);\n                      }}"
);

fs.writeFileSync('src/components/Header.tsx', code);
