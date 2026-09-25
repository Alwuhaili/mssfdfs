import fs from 'node:fs';

const checks: Array<[string, RegExp, string]> = [
  ['EditSchoolAdminModal.tsx', /\}, \[isOpen, initialTab\]\);/, 'school admin draft'],
  ['QuickEditPrincipalModal.tsx', /\}, \[isOpen\]\);/, 'principal draft'],
  ['EditCertificateHeaderModal.tsx', /\}, \[isOpen\]\);/, 'certificate header draft'],
  ['EditNewsEventsModal.tsx', /\}, \[isOpen\]\);/, 'news draft'],
  ['EditGalleryModal.tsx', /\}, \[isOpen\]\);/, 'gallery draft'],
  ['EditFacultyModal.tsx', /\}, \[isOpen, initialTeacherId, openInAddMode\]\);/, 'faculty draft'],
  ['EditLectureModal.tsx', /\}, \[lecture\?\.id, isOpen\]\);/, 'lecture draft'],
  ['EditUserModal.tsx', /\}, \[userData\?\.id, userType, isOpen\]\);/, 'user draft'],
  ['StudentManualGradesEditorModal.tsx', /\}, \[certificate\?\.id, isOpen\]\);/, 'grades draft'],
  ['MinistryDecisionSettingsModal.tsx', /\}, \[isOpen\]\);/, 'decision settings draft'],
  ['DisciplinarySettingsModal.tsx', /\}, \[isOpen\]\);/, 'disciplinary settings draft'],
  ['WeeklyTimetableModal.tsx', /\}, \[isOpen\]\);/, 'timetable admin draft'],
  ['UploadPdfModal.tsx', /\}, \[isOpen\]\);/, 'upload draft'],
];
let failed = 0;
for (const [file, pattern, label] of checks) {
  const source = fs.readFileSync(`src/components/${file}`, 'utf8');
  const ok = pattern.test(source);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} (${file})`);
  if (!ok) failed++;
}
const admin = fs.readFileSync('src/components/EditSchoolAdminModal.tsx', 'utf8');
for (const [label, bad] of [
  ['school admin effect must not depend on live schoolAdminData', /\[isOpen,\s*schoolAdminData/],
  ['school admin save must be awaited', /const ok = await updateSchoolAdminData\(/],
] as const) {
  const ok = label.includes('must not') ? !bad.test(admin) : bad.test(admin);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`Draft isolation verification passed: ${checks.length + 2}/${checks.length + 2}`);
