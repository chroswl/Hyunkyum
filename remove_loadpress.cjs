const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

code = code.replace(
  /window\.dispatchEvent\(new CustomEvent\('pressChanged'\)\);/g,
  `// custom event removed`
);

code = code.replace(
  /useEffect\(\(\) => \{\s*loadPress\(\);\s*\/\/ Listen for press changes from admin panel or other panels\s*const handlePressChange = \(\) => \{\s*loadPress\(\);\s*\};\s*window\.addEventListener\('pressChanged', handlePressChange\);\s*return \(\) => window\.removeEventListener\('pressChanged', handlePressChange\);\s*\}, \[\]\);/g,
  `// loadPress is no longer needed on mount, propItems provides data`
);

fs.writeFileSync('src/components/PressSection.tsx', code);
