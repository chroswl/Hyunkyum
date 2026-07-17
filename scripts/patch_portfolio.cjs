const fs = require('fs');

let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

if (!code.includes('AdminPortfolio')) {
  code = code.replace(/import \{ SortableCollection/, "import AdminPortfolio from './admin/AdminPortfolio';\nimport { SortableCollection");
}

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
