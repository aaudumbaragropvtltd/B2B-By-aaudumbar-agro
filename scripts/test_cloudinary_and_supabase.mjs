// Diagnostic script for Supabase DB & Cloudinary Media CDN
import { v2 as cloudinary } from 'cloudinary';

console.log('==================================================');
console.log('   B2B BHARAT STORAGE & DATABASE ARCHITECTURE     ');
console.log('==================================================\n');

// 1. Check Supabase Configuration & Status
console.log('1. Checking Supabase Database Status...');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing.');
} else {
  console.log(`📡 Supabase Endpoint: ${supabaseUrl}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const start = Date.now();
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseKey },
      signal: controller.signal
    });
    clearTimeout(timeout);
    console.log(`ℹ️ Supabase Response Status: ${res.status} (${Date.now() - start}ms)`);
    if (res.status === 200 || res.status === 401) {
      console.log('✅ Supabase project endpoint is reachable.');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⚠️ Supabase connection TIMED OUT (>6s). The Supabase project may be PAUSED or rate-limited on free tier.');
      console.log('   👉 Please visit https://supabase.com/dashboard/project/ihsgymlxdgmdrtwlnetr to unpause/restore it.');
    } else {
      console.log(`⚠️ Supabase connection error: ${err.message}`);
    }
  }
}

console.log('\n--------------------------------------------------');

// 2. Check Cloudinary Configuration
console.log('2. Checking Cloudinary Media CDN Status...');
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
  if (cloudinaryUrl) {
    cloudinary.config({ cloudinary_url: cloudinaryUrl });
  } else {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }
  console.log(`☁️ Cloud Name: ${cloudName || '(from CLOUDINARY_URL)'}`);
  console.log(`🔑 API Key: ${apiKey ? apiKey.slice(0, 6) + '...' : '(from CLOUDINARY_URL)'}`);
  try {
    const ping = await cloudinary.api.ping();
    console.log(`✅ Cloudinary Ping Status: ${ping.status} (Connected!)`);
  } catch (err) {
    console.log(`⚠️ Cloudinary API ping failed: ${err.message}`);
  }
} else {
  console.log('ℹ️ Cloudinary is NOT yet configured in .env.local.');
  console.log('   Required variables in .env.local:');
  console.log('     CLOUDINARY_CLOUD_NAME=<your_cloud_name>');
  console.log('     CLOUDINARY_API_KEY=<your_api_key>');
  console.log('     CLOUDINARY_API_SECRET=<your_api_secret>');
  console.log('   Once added, all images, videos, and media files will automatically stream through Cloudinary CDN!');
}

console.log('\n==================================================\n');
