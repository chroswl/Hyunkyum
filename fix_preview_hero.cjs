const fs = require('fs');
let prev = fs.readFileSync('src/components/admin/HeroPreview.tsx', 'utf-8');

// The original lines were using `theme.homeVideoType`, `theme.homeBgImageUrl`, `theme.homeVideoYoutubeUrl`, etc.
prev = prev.replace(/theme\.homeVideoType/g, "theme.homeBgType");
prev = prev.replace(/theme\.homeVideoYoutubeUrl/g, "theme.homeBg");
prev = prev.replace(/theme\.homeVideoVimeoUrl/g, "theme.homeBg");
prev = prev.replace(/theme\.homeVideoUrl/g, "theme.homeBg");
prev = prev.replace(/theme\.homeBgImageUrl/g, "theme.homeBg");
prev = prev.replace(/theme\.homeOverlayOpacity \|\| 60/g, "60");
prev = prev.replace(/theme\.homeBlurAmount \|\| 0/g, "0");

fs.writeFileSync('src/components/admin/HeroPreview.tsx', prev);
console.log("Fixed HeroPreview");
