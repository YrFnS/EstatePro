import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

const createIcon = async (size: number) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#D4A853"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${size * 0.4}" fill="white">EP</text>
  </svg>`;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`);
  
  console.log(`Created icon-${size}x${size}.png`);
};

(async () => {
  await createIcon(192);
  await createIcon(512);
  console.log('All PWA icons generated!');
})();
