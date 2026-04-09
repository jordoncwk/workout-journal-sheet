import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dir, '..', 'icons');

function makeSvg(size) {
  const pad = size * 0.1;
  const r = size * 0.18;
  const fontSize = size * 0.38;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0f0f0f"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4dd9ec"/>
      <stop offset="100%" stop-color="#00bcd4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${r * 0.7}" ry="${r * 0.7}" fill="none" stroke="#00bcd4" stroke-width="${size * 0.018}" stroke-opacity="0.4"/>
  <text
    x="50%"
    y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    letter-spacing="${size * 0.02}"
    fill="url(#text-grad)"
  >WJ</text>
</svg>`;
}

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(join(iconsDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
