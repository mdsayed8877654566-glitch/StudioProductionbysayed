import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateAssets() {
  const publicDir = path.join(process.cwd(), 'public');
  const svgPath = path.join(publicDir, 'logo.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('logo.svg not found in public/');
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate logo.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Generated public/logo.png (512x512)');

  // 2. Generate favicon-32x32.png and favicon-16x16.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. Generate og-image.png (1200x630) social sharing preview card
  // Dark zinc backdrop matching the brand identity, centered logo & Studio Production branding
  const logoForOg = await sharp(svgBuffer)
    .resize(320, 320)
    .png()
    .toBuffer();

  const ogSvgBackground = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#27272a" />
          <stop offset="60%" stop-color="#09090b" />
          <stop offset="100%" stop-color="#000000" />
        </radialGradient>
        <radialGradient id="orangeGlow" cx="50%" cy="35%" r="40%">
          <stop offset="0%" stop-color="#ea580c" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#09090b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bgGlow)" />
      <rect width="1200" height="630" fill="url(#orangeGlow)" />
      
      <!-- Border accent -->
      <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="#27272a" stroke-width="2" />
      
      <!-- Text elements -->
      <text x="600" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="2">
        STUDIO PRODUCTION
      </text>
      <text x="600" y="525" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#ea580c" letter-spacing="4">
        PREMIUM DIGITAL PRODUCTS MARKETPLACE
      </text>
      <text x="600" y="565" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500" fill="#71717a">
        studio-production-six.vercel.app
      </text>
    </svg>
  `);

  await sharp(ogSvgBackground)
    .composite([
      {
        input: logoForOg,
        top: 85,
        left: 440,
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('Generated public/og-image.png (1200x630)');
}

generateAssets().catch(console.error);
