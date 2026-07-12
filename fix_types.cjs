const fs = require('fs');

// 1. AdminHero.tsx
let adminHero = fs.readFileSync('src/components/admin/AdminHero.tsx', 'utf-8');
adminHero = adminHero.replace(/homeOverlayOpacity/g, "heroOffsetY"); // just map it to something or remove
adminHero = adminHero.replace(/homeBlurAmount/g, "heroTitleSize"); // dummy map, actually let's just remove them from properties array
// Actually let's just do precise regex replacement or use sed
