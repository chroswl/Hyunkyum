const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

code = code.replace(/onAdd=\{user \? \(\) => window\.dispatchEvent\(new CustomEvent\('add-portfolio-item'\)\); window\.dispatchEvent\(new CustomEvent\('open-portfolio-modal'\)\) : undefined\}/g, 
"onAdd={user ? () => { window.dispatchEvent(new CustomEvent('add-portfolio-item')); window.dispatchEvent(new CustomEvent('open-portfolio-modal')); } : undefined}");

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
