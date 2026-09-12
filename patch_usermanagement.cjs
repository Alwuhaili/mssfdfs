const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementHub.tsx', 'utf-8');

// 1. Add updateTeacher to useApp
code = code.replace(
  "    adminResetUserPasscode,\n    setCurrentUser,\n  } = useApp();",
  "    adminResetUserPasscode,\n    setCurrentUser,\n    updateTeacher,\n  } = useApp();"
);

// 2. Add state for role editing
code = code.replace(
  "  const [showNewPasscode, setShowNewPasscode] = useState(true);",
  "  const [showNewPasscode, setShowNewPasscode] = useState(true);\n  const [editingRoleAccount, setEditingRoleAccount] = useState<UnifiedUserAccount | null>(null);\n  const [newRoleValue, setNewRoleValue] = useState<'مدير' | 'معاون' | 'مدرس'>('مدرس');"
);

// 3. Add handleSaveRole function
const saveRoleFunc = `
  const handleSaveRole = () => {
    if (!editingRoleAccount || editingRoleAccount.role !== 'teacher') return;
    const isDirectress = newRoleValue === 'مدير' || newRoleValue === 'معاون';
    updateTeacher(editingRoleAccount.userKey, {
      systemRole: newRoleValue,
      isDirectress
    });
    setEditingRoleAccount(null);
    showToast(lang === 'ar' ? 'تم تعديل صلاحيات المستخدم بنجاح ✅' : 'User role updated successfully ✅');
  };
`;
code = code.replace(
  "  const handleSavePasscode = (e: React.FormEvent) => {",
  saveRoleFunc + "\n  const handleSavePasscode = (e: React.FormEvent) => {"
);

// 4. Update the Teacher row rendering to show the current systemRole and a button
code = code.replace(
  "{/* Edit Passcode */}",
  `{/* Edit Role (Teachers Only) */}
  {acc.role === 'teacher' && (
    <button
      type="button"
      onClick={() => {
        setEditingRoleAccount(acc);
        setNewRoleValue(acc.rawObject?.systemRole || 'مدرس');
      }}
      className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1 transition-all"
      title="تعديل الصلاحيات والرتبة"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>الصلاحيات</span>
    </button>
  )}

  {/* Edit Passcode */}`
);

// 5. Show current systemRole in the role badge for teacher
// We need to carefully replace the role badge config.
// Let's find: teacher: { label: '👩‍🏫 هيئة تدريسية', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
const newTeacherBadge = "teacher: { label: acc.rawObject?.systemRole === 'مدير' ? '👑 مدير' : (acc.rawObject?.systemRole === 'معاون' ? '🌟 معاون' : '👩‍🏫 هيئة تدريسية'), bg: acc.rawObject?.isDirectress ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },";
code = code.replace(
  "teacher: { label: '👩‍🏫 هيئة تدريسية', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },",
  newTeacherBadge
);

// 6. Add the EditRoleModal JSX before the closing </div> of the component.
// The easiest is to inject it right before QuickEditPrincipalModal
const roleModalJSX = `
      {/* Edit Role Modal */}
      {editingRoleAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">تعديل الصلاحيات والرتبة</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{editingRoleAccount.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingRoleAccount(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر رتبة المستخدم:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoleValue('مدرس')}
                    className={\`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all \${newRoleValue === 'مدرس' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'}\`}
                  >
                    <Briefcase className={\`w-6 h-6 \${newRoleValue === 'مدرس' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}\`} />
                    <span className={\`text-xs font-bold \${newRoleValue === 'مدرس' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}\`}>مدرس</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoleValue('معاون')}
                    className={\`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all \${newRoleValue === 'معاون' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}\`}
                  >
                    <Sparkles className={\`w-6 h-6 \${newRoleValue === 'معاون' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}\`} />
                    <span className={\`text-xs font-bold \${newRoleValue === 'معاون' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}\`}>معاون</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoleValue('مدير')}
                    className={\`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all \${newRoleValue === 'مدير' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'}\`}
                  >
                    <Crown className={\`w-6 h-6 \${newRoleValue === 'مدير' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}\`} />
                    <span className={\`text-xs font-bold \${newRoleValue === 'مدير' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}\`}>مدير</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {newRoleValue === 'مدير' || newRoleValue === 'معاون' 
                    ? 'سيتم منح هذا المستخدم كافة صلاحيات الإدارة والمديرة (تعديل السجلات، الإشعارات العامة، صلاحيات متقدمة).' 
                    : 'سيتم تقليص صلاحيات هذا المستخدم إلى (مدرس) فقط وحجب صلاحيات الإدارة العليا عنه.'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingRoleAccount(null)}
                className="flex-1 py-3 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all transform hover:scale-[1.02]"
              >
                حفظ الصلاحيات
              </button>
            </div>
          </div>
        </div>
      )}
`;
code = code.replace(
  "<QuickEditPrincipalModal",
  roleModalJSX + "\n      <QuickEditPrincipalModal"
);

fs.writeFileSync('src/components/UserManagementHub.tsx', code);
