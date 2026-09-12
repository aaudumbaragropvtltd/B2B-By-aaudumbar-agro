// ============================================================================
// MIGRATE LOCAL UPLOADS TO CLOUDINARY CDN
// ============================================================================
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.js';

async function migrate() {
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured. Please check .env.local');
    process.exit(1);
  }

  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsRoot)) {
    console.log('No local uploads directory found.');
    return;
  }

  console.log('🚀 Scanning public/uploads for media to migrate to Cloudinary...\n');

  const categories = fs.readdirSync(uploadsRoot);
  for (const cat of categories) {
    const catPath = path.join(uploadsRoot, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath);
    for (const file of files) {
      const filePath = path.join(catPath, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      console.log(`Uploading [${cat}] ${file} to Cloudinary...`);
      try {
        const buffer = fs.readFileSync(filePath);
        const res = await uploadToCloudinary(buffer, {
          folder: `b2b-bharat/${cat}`,
          publicId: path.parse(file).name
        });
        console.log(`✅ Success: ${res.secure_url}`);
      } catch (err) {
        console.error(`❌ Failed: ${file}`, err.message);
      }
    }
  }

  console.log('\n🎉 Local media migration to Cloudinary complete!');
}

migrate();
