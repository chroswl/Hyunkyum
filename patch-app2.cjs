const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\s*const handleOpenModal = \(\) => setIsPortfolioModalOpen\(true\);\s*window\.addEventListener\('open-portfolio-modal', handleOpenModal\);\s*return \(\) => window\.removeEventListener\('open-portfolio-modal', handleOpenModal\);\s*\}, \[\]\);/,
  ""
);

content = content.replace(
  /const \[isPortfolioModalOpen, setIsPortfolioModalOpen\] = useState\(false\);/,
  ""
);

fs.writeFileSync('src/App.tsx', content);
