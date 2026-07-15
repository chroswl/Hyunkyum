import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Define the premium responsive SVG string (transparent background, adaptive dark/light stroke)
const responsiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <style>
    .monogram {
      stroke: #111111;
    }
    @media (prefers-color-scheme: dark) {
      .monogram {
        stroke: #ffffff;
      }
    }
  </style>
  <g class="monogram" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <!-- H left stem -->
    <line x1="155" y1="130" x2="155" y2="382" />
    <!-- H right stem / K stem (Shared) -->
    <line x1="265" y1="130" x2="265" y2="382" />
    <!-- H crossbar -->
    <line x1="155" y1="256" x2="265" y2="256" />
    <!-- K top diagonal -->
    <line x1="265" y1="256" x2="357" y2="130" />
    <!-- K bottom diagonal -->
    <line x1="265" y1="256" x2="357" y2="382" />
  </g>
</svg>`;

// 2. Define the SVG string with a solid premium near-black background and white monogram (for app/touch icons)
const solidSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="0" fill="#111111" />
  <g stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <!-- H left stem -->
    <line x1="155" y1="130" x2="155" y2="382" />
    <!-- H right stem / K stem (Shared) -->
    <line x1="265" y1="130" x2="265" y2="382" />
    <!-- H crossbar -->
    <line x1="155" y1="256" x2="265" y2="256" />
    <!-- K top diagonal -->
    <line x1="265" y1="256" x2="357" y2="130" />
    <!-- K bottom diagonal -->
    <line x1="265" y1="256" x2="357" y2="382" />
  </g>
</svg>`;

// Helper to wrap PNG buffer into ICO format
function createIco(pngBuffer) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);     // Reserved
  header.writeUInt16LE(1, 2);     // Image type (1 = ICO)
  header.writeUInt16LE(1, 4);     // Number of images (1)
  header.writeUInt8(32, 6);       // Width (32)
  header.writeUInt8(32, 7);       // Height (32)
  header.writeUInt8(0, 8);        // Color palette (0 = no palette)
  header.writeUInt8(0, 9);        // Reserved
  header.writeUInt16LE(1, 10);    // Color planes (1)
  header.writeUInt16LE(32, 12);   // Bits per pixel (32)
  header.writeUInt32LE(pngBuffer.length, 14); // Image data size
  header.writeUInt32LE(22, 18);   // Image data offset (22 bytes header)
  return Buffer.concat([header, pngBuffer]);
}

async function run() {
  try {
    console.log('Writing favicon.svg...');
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), responsiveSvg, 'utf-8');

    // Convert responsive (transparent, dark monogram) to 16x16 and 32x32 transparent PNGs
    // To ensure they are visible in the default export, we will render the responsive SVG with sharp
    console.log('Generating transparent favicon PNGs...');
    const svgBuffer = Buffer.from(responsiveSvg);

    const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-16x16.png'), png16);

    const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), png32);

    // Create favicon.ico using the 32x32 transparent PNG
    console.log('Creating favicon.ico...');
    const icoData = createIco(png32);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoData);

    // Render solid backgrounds for touch and chrome icons for premium styling
    console.log('Generating solid background luxury touch icons...');
    const solidBuffer = Buffer.from(solidSvg);

    await sharp(solidBuffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    await sharp(solidBuffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
    await sharp(solidBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));

    // Write webmanifest
    console.log('Writing site.webmanifest...');
    const manifest = {
      name: "Hyunkyum Kim | Baritone",
      short_name: "Hyunkyum Kim",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#111111",
      background_color: "#111111",
      display: "standalone"
    };
    fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf-8');

    console.log('Successfully generated all premium favicon assets!');
  } catch (err) {
    console.error('Error generating assets:', err);
    process.exit(1);
  }
}

run();
