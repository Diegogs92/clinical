const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/logo.svg');
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generar favicon.ico (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));

  // Generar icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Generar icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Generar apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('✅ Iconos generados correctamente');
}

generateIcons().catch(console.error);
