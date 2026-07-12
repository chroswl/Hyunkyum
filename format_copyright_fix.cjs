const fs = require('fs');
const frontendFiles = ['PortfolioGallery.tsx', 'SelectedPerformances.tsx', 'ImageCropperModal.tsx', 'BiographySection.tsx'];

frontendFiles.forEach(file => {
  let content = fs.readFileSync('src/components/' + file, 'utf-8');
  content = content.replace(/\{([a-zA-Z0-9_\.]*copyright)\.startsWith\('©'\) \? \1 : \`© \$\{\1( \? \(\1\.trim\(\)\.startsWith\('©'\) \? \1 : \`© \$\{\1\.trim\(\)\}\`\) : '')\}\`\}/g, 
    "{$1.trim().startsWith('©') ? $1 : `© ${$1.trim()}`}");
    
  // Also cleanup others
  content = content.replace(/\{([a-zA-Z0-9_\.]*copyright) \? \(\1\.trim\(\)\.startsWith\('©'\) \? \1 : \`© \$\{\1\.trim\(\)\}\`\) : ''\}/g,
    "{$1.trim().startsWith('©') ? $1 : `© ${$1.trim()}`}");
    
  fs.writeFileSync('src/components/' + file, content);
});
console.log("Fixed copyright");
