import { uploadToCloudinary, checkCloudinaryHealth } from '../services/cloudinary.js';

async function main() {
  console.log('1. Checking Cloudinary Health...');
  const health = await checkCloudinaryHealth();
  console.log('Health:', health);

  console.log('\n2. Testing Cloudinary Asset Upload...');
  const testSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
      <rect width="300" height="150" fill="#0f172a" rx="15"/>
      <circle cx="75" cy="75" r="45" fill="#10b981"/>
      <text x="150" y="70" font-family="Arial" font-size="20" font-weight="bold" fill="#ffffff">B2B BHARAT</text>
      <text x="150" y="95" font-family="Arial" font-size="12" fill="#94a3b8">Cloudinary Media CDN Live</text>
    </svg>
  `);

  const uploadResult = await uploadToCloudinary(testSvg, {
    folder: 'b2b-bharat/system-test',
    resourceType: 'image'
  });

  console.log('✅ UPLOAD SUCCESSFUL!');
  console.log('Secure CDN URL:', uploadResult.secure_url);
  console.log('Public ID:', uploadResult.public_id);
  console.log('Format:', uploadResult.format);
  console.log('Width x Height:', `${uploadResult.width}x${uploadResult.height}`);
  console.log('Bytes:', uploadResult.bytes);
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
