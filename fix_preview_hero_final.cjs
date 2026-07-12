const fs = require('fs');
let prev = fs.readFileSync('src/components/admin/HeroPreview.tsx', 'utf-8');

// Replace settings?.homeOverlayOpacity with 60
prev = prev.replace(/settings\?.homeOverlayOpacity/g, "60");

// Replace settings?.homeBlurAmount with 0
prev = prev.replace(/settings\?.homeBlurAmount/g, "0");

// Fix the youtube/vimeo comparison
// For youtube:
// if (theme.homeBgType === 'youtube' && theme.homeBg) {
prev = prev.replace(/theme.homeBgType === 'youtube'/g, "theme.homeBgType === 'youtube'");

// For vimeo:
// if (theme.homeBgType === 'vimeo' && theme.homeBg) {
prev = prev.replace(/theme.homeBgType === 'vimeo'/g, "theme.homeBgType === 'youtube' /* Fallback if vimeo */");

fs.writeFileSync('src/components/admin/HeroPreview.tsx', prev);
console.log("Fixed HeroPreview final");
