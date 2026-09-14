const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');

code = code.replace(
  "{/* Direct Messages Icon */}",
  "{role !== 'guest' && (<>\n{/* Direct Messages Icon */}"
);

code = code.replace(
  "{/* Active Logged-in User Badge */}",
  "</>)}\n{/* Active Logged-in User Badge */}"
);

// We need to change the Role Switcher to Login Button for guests
const roleSwitcherCode = `
            {/* Role Switcher Menu / Login Button */}
            <div className="relative">
              {role === 'guest' ? (
                <button
                  onClick={() => {
                    setTargetAuthRole(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all border border-indigo-500"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all border border-indigo-500"
                >
                  <span>{activeRoleObj?.iconStr}</span>
                  <span className="hidden sm:inline">
                    {lang === 'ar' ? activeRoleObj?.titleAr : activeRoleObj?.titleEn}
                  </span>
                  <UserCheck className="w-4 h-4 text-white" />
                </button>
              )}
`;

code = code.replace(
  "{/* Role Switcher Menu */}\n            <div className=\"relative\">\n              <button\n                onClick={() => setShowRoleMenu(!showRoleMenu)}\n                className=\"flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all border border-indigo-500\"\n              >\n                <span>{activeRoleObj?.iconStr}</span>\n                <span className=\"hidden sm:inline\">\n                  {lang === 'ar' ? activeRoleObj?.titleAr : activeRoleObj?.titleEn}\n                </span>\n                <UserCheck className=\"w-4 h-4 text-white\" />\n              </button>",
  roleSwitcherCode
);

fs.writeFileSync('src/components/Header.tsx', code);
