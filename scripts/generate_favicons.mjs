import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  console.log('Generating Google Search compliant favicons and app icons...');

  const sourceImage = 'public/logo-circle.jpg';

  // 1. app/icon.png (Next.js App Router primary icon)
  await sharp(sourceImage)
    .resize(512, 512)
    .png()
    .toFile('app/icon.png');
  console.log('✓ Created app/icon.png (512x512)');

  // 2. app/apple-icon.png (Apple touch icon)
  await sharp(sourceImage)
    .resize(180, 180)
    .png()
    .toFile('app/apple-icon.png');
  console.log('✓ Created app/apple-icon.png (180x180)');

  // 3. public/icon-192.png & public/icon-512.png
  await sharp(sourceImage)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
  console.log('✓ Created public/icon-192.png (192x192)');

  await sharp(sourceImage)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
  console.log('✓ Created public/icon-512.png (512x512)');

  await sharp(sourceImage)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('✓ Created public/apple-touch-icon.png (180x180)');

  // 4. public/favicon.ico and app/favicon.ico (48x48 standard Google favicon size)
  const ico48Buffer = await sharp(sourceImage)
    .resize(48, 48)
    .png()
    .toBuffer();

  fs.writeFileSync('public/favicon.ico', ico48Buffer);
  fs.writeFileSync('app/favicon.ico', ico48Buffer);
  console.log('✓ Updated public/favicon.ico and app/favicon.ico (48x48 Googlebot compliant)');

  console.log('All icons successfully created!');
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
