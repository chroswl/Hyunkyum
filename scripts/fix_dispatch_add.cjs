const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

code = code.replace(/window\.dispatchEvent\(new CustomEvent\('add-portfolio-item'\)\)/g, "window.dispatchEvent(new CustomEvent('add-portfolio-item')); window.dispatchEvent(new CustomEvent('open-portfolio-modal'))");

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
