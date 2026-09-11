const fs = require('fs');
const path = 'src/components/DisciplinaryAttendancePanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import { Settings,\n  useState } from 'react';", "import React, { useState } from 'react';");
code = code.replace(/import\s*\{\s*ShieldAlert,/, "import { Settings, ShieldAlert,");

fs.writeFileSync(path, code);
