/**
 * Icon Generator Script for SmartThrift
 * 
 * Usage:
 * 1. Place your logo as 'logo-source.png' in the project root (1024x1024 recommended)
 * 2. Run: node scripts/generate-icons.js
 * 3. All icons will be generated in the public/ folder
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Source logo path (place your high-res logo here)
const SOURCE_LOGO = join(projectRoot, 'logo-source.png');

// Icon sizes needed for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Splash screen sizes for iOS
const SPLASH_SIZES = [
  { width: 320, height: 480, name: 'splash-320x480.png' },
  { width: 640, height: 960, name: 'splash-640x960.png' },
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
];

// Favicon sizes
const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
];

async function generateIcons() {
  console.log('🎨 SmartThrift Icon Generator');
  console.log('================================\n');

  // Check if source logo exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error('❌ Error: logo-source.png not found!');
    console.log('\n📝 Instructions:');
    console.log('1. Place your high-resolution logo (1024x1024 or larger) as "logo-source.png" in the project root');
    console.log('2. Run this script again: node scripts/generate-icons.js\n');
    process.exit(1);
  }

  console.log('✓ Source logo found!\n');

  try {
    // Generate PWA icons
    console.log('📱 Generating PWA icons...');
    for (const { size, name } of ICON_SIZES) {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(join(projectRoot, 'public', name));
      
      console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Generate favicons
    console.log('\n🔖 Generating favicons...');
    for (const { size, name } of FAVICON_SIZES) {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(join(projectRoot, 'public', name));
      
      console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Generate favicon.ico from 32x32 PNG
    console.log('\n🖼️  Generating favicon.ico...');
    await sharp(SOURCE_LOGO)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(join(projectRoot, 'public', 'favicon.ico'));
    console.log('  ✓ favicon.ico (32x32)');

    // Generate splash screens (logo centered on white background)
    console.log('\n📱 Generating splash screens...');
    for (const { width, height, name } of SPLASH_SIZES) {
      // Logo will be 40% of screen width
      const logoSize = Math.floor(width * 0.4);
      
      await sharp(SOURCE_LOGO)
        .resize(logoSize, logoSize, { fit: 'contain' })
        .toBuffer()
        .then(logoBuffer => {
          return sharp({
            create: {
              width: width,
              height: height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
            }
          })
          .composite([{
            input: logoBuffer,
            gravity: 'center'
          }])
          .png()
          .toFile(join(projectRoot, 'public', name));
        });
      
      console.log(`  ✓ ${name} (${width}x${height})`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('\n📂 Location: public/ folder');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Test locally: npm run dev');
    console.log('3. Hard refresh browser: Ctrl+Shift+R');
    console.log('4. Deploy to Vercel\n');

  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Make sure logo-source.png is a valid PNG/JPG file');
    console.log('- Recommended size: 1024x1024 or larger');
    console.log('- Ensure sharp package is installed: npm install sharp\n');
    process.exit(1);
  }
}

// Run the generator
generateIcons();

