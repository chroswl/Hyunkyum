const sharp = require('sharp');
const fs = require('fs');

const svgCode = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#000000" rx="112" />
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="280" font-weight="normal" fill="#ffffff" letter-spacing="-10">HK</text>
</svg>
`;

async function run() {
  fs.writeFileSync('public/favicon.svg', svgCode);
  
  await sharp(Buffer.from(svgCode))
    .resize(512, 512)
    .png()
    .toFile('public/android-chrome-512x512.png');
    
  console.log("Generated 512x512");
}
run();
