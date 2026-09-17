const sharp = require('sharp');
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
  const svgBuf = fs.readFileSync('public/favicon.svg');

  const pngFiles = [
    { file: 'public/favicon-16x16.png', size: 16 },
    { file: 'public/favicon-32x32.png', size: 32 },
    { file: 'public/favicon-48x48.png', size: 48 },
    { file: 'public/favicon-96x96.png', size: 96 },
    { file: 'public/apple-touch-icon.png', size: 180 },
    { file: 'public/android-chrome-192x192.png', size: 192 },
    { file: 'public/android-chrome-512x512.png', size: 512 },
  ];

  for (const item of pngFiles) {
    await sharp(svgBuf)
      .resize(item.size, item.size)
      .png()
      .toFile(item.file);
    console.log(`Generated ${item.file} (${item.size}x${item.size})`);
  }

  execSync('convert public/favicon-16x16.png public/favicon-32x32.png public/favicon-48x48.png public/favicon.ico');
  console.log('Generated public/favicon.ico');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
