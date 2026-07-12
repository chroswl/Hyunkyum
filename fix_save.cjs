const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf-8');

code = code.replace(
  'export const saveBiographySettings = async (settings: BiographySettings) => {\n  const sanitized = JSON.parse(JSON.stringify(settings));\n  await setDoc(doc(db, "settings", "biography"), sanitized);\n};',
  "export const saveBiographySettings = async (settings: BiographySettings) => {\n  const sanitized = JSON.parse(JSON.stringify(settings));\n  if (!sanitized.timelineTitles) {\n    sanitized.timelineTitles = {};\n  }\n  await setDoc(doc(db, \"settings\", \"biography\"), sanitized);\n};"
);

fs.writeFileSync('src/firebase.ts', code);
