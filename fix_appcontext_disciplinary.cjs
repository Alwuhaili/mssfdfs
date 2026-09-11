const fs = require('fs');
const path = 'src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('disciplinarySettings')) {
  // Add to AppContextProps
  code = code.replace(
    /decisionSettings: MinistryDecisionSettings;/,
    "decisionSettings: MinistryDecisionSettings;\n  disciplinarySettings: DisciplinarySettings;\n  updateDisciplinarySettings: (updated: Partial<DisciplinarySettings>) => void;"
  );
  
  // Add import
  code = code.replace(
    /MinistryDecisionSettings,/,
    "MinistryDecisionSettings, DisciplinarySettings,"
  );

  // Default settings
  const defaults = `
export const DEFAULT_DISCIPLINARY_SETTINGS: DisciplinarySettings = {
  firstWarningDays: 5,
  finalWarningDays: 10,
  expulsionDays: 15,
  lessonsPerAbsenceDay: 5
};
`;
  code = code.replace(
    /export const DEFAULT_MINISTRY_DECISION_SETTINGS/,
    defaults + "export const DEFAULT_MINISTRY_DECISION_SETTINGS"
  );
  
  // InitialState interface
  code = code.replace(
    /settings:\s*MinistryDecisionSettings\s*=\s*DEFAULT_MINISTRY_DECISION_SETTINGS\s*;/g,
    "settings: MinistryDecisionSettings = DEFAULT_MINISTRY_DECISION_SETTINGS;\n  discSettings: DisciplinarySettings = DEFAULT_DISCIPLINARY_SETTINGS;"
  );
  
  code = code.replace(
    /decisionSettings: initialStored\?\.decisionSettings \|\| DEFAULT_MINISTRY_DECISION_SETTINGS,/,
    "decisionSettings: initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS,\n      disciplinarySettings: initialStored?.disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS,"
  );

  // AppProvider state
  code = code.replace(
    /const \[decisionSettings, setDecisionSettings\] = useState<MinistryDecisionSettings>\(\(\) => \{([\s\S]*?)\}\);/,
    `const [decisionSettings, setDecisionSettings] = useState<MinistryDecisionSettings>(() => {
    return initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
  });
  const [disciplinarySettings, setDisciplinarySettings] = useState<DisciplinarySettings>(() => {
    return initialStored?.disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;
  });`
  );
  
  // AppProvider sync listener
  code = code.replace(
    /if \(remoteData\.decisionSettings\) setDecisionSettings\(remoteData\.decisionSettings\);/,
    "if (remoteData.decisionSettings) setDecisionSettings(remoteData.decisionSettings);\n    if (remoteData.disciplinarySettings) setDisciplinarySettings(remoteData.disciplinarySettings);"
  );

  // AppProvider context value
  code = code.replace(
    /decisionSettings,[\s\n]+updateDecisionSettings,/,
    "decisionSettings,\n    updateDecisionSettings,\n    disciplinarySettings,\n    updateDisciplinarySettings,"
  );
  
  // getFullPayload
  code = code.replace(
    /decisionSettings,(\s*)\}$/m,
    "decisionSettings,\n      disciplinarySettings,$1}"
  );

  // update wrapper
  const updateWrapper = `
  const updateDisciplinarySettings = (updated: Partial<DisciplinarySettings>) => {
    setDisciplinarySettings((prev) => {
      const newVal = { ...prev, ...updated };
      centralSyncService.pushUpdates({ disciplinarySettings: newVal }, { id: currentUser?.id || role, name: currentUser?.name || role, role });
      return newVal;
    });
    addAuditLog({
      action: 'تحديث إعدادات الانضباط والغياب',
      actionType: 'update',
      targetCategory: 'system',
      targetId: 'disciplinary-settings',
      targetName: 'إعدادات الانضباط',
      details: 'تم تعديل قوانين الحضور والإنذارات بنجاح',
      severity: 'warning'
    });
  };
`;
  code = code.replace(
    /const updateDecisionSettings = \([\s\S]*?addAuditLog\(\{[\s\S]*?\}\);\s*\};/,
    match => match + "\n" + updateWrapper
  );

  // Also inside useEffect for localStorage
  code = code.replace(
    /const initialSettings = initialStored\?\.decisionSettings \|\| DEFAULT_MINISTRY_DECISION_SETTINGS;/,
    `const initialSettings = initialStored?.decisionSettings || DEFAULT_MINISTRY_DECISION_SETTINGS;
    const initialDisc = initialStored?.disciplinarySettings || DEFAULT_DISCIPLINARY_SETTINGS;`
  );
  
  // also add to handleImportDatabase
  code = code.replace(
    /if \(parsed\.decisionSettings\) setDecisionSettings\(parsed\.decisionSettings\);/,
    "if (parsed.decisionSettings) setDecisionSettings(parsed.decisionSettings);\n      if (parsed.disciplinarySettings) setDisciplinarySettings(parsed.disciplinarySettings);"
  );
  code = code.replace(
    /setDecisionSettings\(DEFAULT_MINISTRY_DECISION_SETTINGS\);/,
    "setDecisionSettings(DEFAULT_MINISTRY_DECISION_SETTINGS);\n    setDisciplinarySettings(DEFAULT_DISCIPLINARY_SETTINGS);"
  );

  // Need to fix sync keys
  code = code.replace(
    /"decisionSettings", "examSchedules",/,
    `"decisionSettings", "disciplinarySettings", "examSchedules",`
  );

  fs.writeFileSync(path, code);
  console.log('Added disciplinarySettings to AppContext');
} else {
  console.log('Already added');
}
