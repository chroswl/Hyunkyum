const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import PortfolioOverlayModal from './components/admin/PortfolioOverlayModal';\n",
  ""
);

content = content.replace(
  /const \[isPortfolioModalOpen, setIsPortfolioModalOpen\] = useState\(false\);/,
  ""
);

// We should also remove the event listeners for `open-portfolio-modal` in App.tsx. Let's find them.
content = content.replace(
  /const handleOpenPortfolioModal = \(\) => \{\s*setIsPortfolioModalOpen\(true\);\s*\};\s*window\.addEventListener\('open-portfolio-modal', handleOpenPortfolioModal as EventListener\);\s*return \(\) => \{\s*window\.removeEventListener\('open-portfolio-modal', handleOpenPortfolioModal as EventListener\);\s*\};/,
  ""
);

// We need to just regex replace the PortfolioOverlayModal block
content = content.replace(
  /\{user && isPortfolioModalOpen && \(\s*<PortfolioOverlayModal[\s\S]*?\/>\s*\)\}/,
  ""
);

fs.writeFileSync('src/App.tsx', content);

