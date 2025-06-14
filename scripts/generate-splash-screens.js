import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all the splash screen sizes we need
const splashSizes = [
  { width: 320, height: 480, name: 'splash-320x480' },    // iPhone 3GS
  { width: 640, height: 960, name: 'splash-640x960' },    // iPhone 4
  { width: 640, height: 1136, name: 'splash-640x1136' },  // iPhone 5/SE
  { width: 750, height: 1334, name: 'splash-750x1334' },  // iPhone 6/7/8
  { width: 1080, height: 1920, name: 'splash-1080x1920' }, // Most Android phones
  { width: 1242, height: 2208, name: 'splash-1242x2208' }, // iPhone 6+/7+/8+
  { width: 1125, height: 2436, name: 'splash-1125x2436' }, // iPhone X/XS/11 Pro
  { width: 1440, height: 2560, name: 'splash-1440x2560' }, // High-end Android phones
  { width: 1536, height: 2048, name: 'splash-1536x2048' }  // iPad
];

// Define all the icon sizes we need
const iconSizes = [
  { size: 72, name: 'icon-72x72' },
  { size: 96, name: 'icon-96x96' },
  { size: 128, name: 'icon-128x128' },
  { size: 144, name: 'icon-144x144' },
  { size: 152, name: 'icon-152x152' },
  { size: 192, name: 'icon-192x192' },
  { size: 384, name: 'icon-384x384' },
  { size: 512, name: 'icon-512x512' }
];

async function generateSplashScreens(inputImage) {
  console.log('Generating splash screens...');
  
  // Create public directory if it doesn't exist
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Generate splash screens
  for (const size of splashSizes) {
    try {
      await sharp(inputImage)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(path.join(publicDir, `${size.name}.png`));
      console.log(`Generated ${size.name}.png`);
    } catch (error) {
      console.error(`Error generating ${size.name}.png:`, error);
    }
  }

  // Generate icons
  for (const size of iconSizes) {
    try {
      await sharp(inputImage)
        .resize(size.size, size.size, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(path.join(publicDir, `${size.name}.png`));
      console.log(`Generated ${size.name}.png`);
    } catch (error) {
      console.error(`Error generating ${size.name}.png:`, error);
    }
  }

  console.log('All splash screens and icons generated successfully!');
}

// Check if input image is provided
const inputImage = process.argv[2];
if (!inputImage) {
  console.error('Please provide the path to your splash screen image as an argument.');
  console.error('Usage: node generate-splash-screens.js path/to/your/image.png');
  process.exit(1);
}

// Run the generation
generateSplashScreens(inputImage).catch(console.error); 