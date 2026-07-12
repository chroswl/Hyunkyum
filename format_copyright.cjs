const fs = require('fs');

const frontendFiles = [
  'PortfolioGallery.tsx',
  'SelectedPerformances.tsx',
  'ImageCropperModal.tsx',
  'BiographySection.tsx'
];

frontendFiles.forEach(file => {
  let content = fs.readFileSync('src/components/' + file, 'utf-8');
  
  // Replace {copyright} with {(copyright && !copyright.startsWith('©')) ? `© ${copyright}` : copyright}
  content = content.replace(/\{([a-zA-Z0-9_\.]*copyright)\}/g, (match, p1) => {
    return `{${p1} ? (${p1}.trim().startsWith('©') ? ${p1} : \`© \${${p1}.trim()}\`) : ''}`;
  });

  fs.writeFileSync('src/components/' + file, content);
});
console.log("Updated copyright display");
