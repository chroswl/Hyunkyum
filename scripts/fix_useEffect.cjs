const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// The line is currently:
// window.addEventListener('keydown', handleKeyDown);
// return (

// I will insert `return () => window.removeEventListener('keydown', handleKeyDown);\n  }, [selectedItemIndex, filteredItems.length]);\n\n  `
// before the `return (`

code = code.replace(
  /window\.addEventListener\('keydown', handleKeyDown\);\n\s*return \(/,
  "window.addEventListener('keydown', handleKeyDown);\n    return () => window.removeEventListener('keydown', handleKeyDown);\n  }, [selectedItemIndex, filteredItems.length]);\n\n  return ("
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
