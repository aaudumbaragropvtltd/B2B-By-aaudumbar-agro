/**
 * Google Cloud OAuth Setup Script for B2B Bharat
 * ================================================
 * This script creates Google Cloud OAuth 2.0 credentials
 * and configures them in Supabase for Google Sign-In.
 * 
 * Prerequisites: Run from the project directory (npm packages available)
 * Usage: node setup_google_oauth.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const readline = require('readline');

const SUPABASE_PROJECT_REF = 'ihsgymlxdgmdrtwlnetr';
const SUPABASE_REDIRECT_URI = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`;

// Google OAuth app credentials (for this setup tool only)
// We'll use Google's device authorization flow
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function httpsRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  B2B Bharat — Google OAuth Setup                    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  console.log('This script will help you set up Google Sign-In.\n');
  console.log('You need to create OAuth credentials in Google Cloud Console.');
  console.log('Follow these steps:\n');
  
  console.log('═══ STEP 1: Open Google Cloud Console ═══');
  console.log('Open this URL in your browser:');
  console.log('  https://console.cloud.google.com/apis/credentials\n');
  console.log('Sign in with: AAUDUMBARAGROPVTLTD@GMAIL.COM\n');
  
  await ask('Press ENTER when you\'re on the credentials page...');
  
  console.log('\n═══ STEP 2: Create OAuth Consent Screen ═══');
  console.log('1. Click "OAuth consent screen" in the left sidebar');
  console.log('2. Select "External" user type → Click "Create"');
  console.log('3. Fill in:');
  console.log('   • App name: B2B Bharat');
  console.log('   • User support email: AAUDUMBARAGROPVTLTD@GMAIL.COM');
  console.log('   • Developer contact email: AAUDUMBARAGROPVTLTD@GMAIL.COM');
  console.log('4. Click "Save and Continue" through all remaining steps');
  console.log('5. On the "Publishing status" step, click "Publish App"\n');
  
  await ask('Press ENTER when the consent screen is configured...');
  
  console.log('\n═══ STEP 3: Create OAuth 2.0 Client ID ═══');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"');
  console.log('3. Application type: "Web application"');
  console.log('4. Name: "B2B Bharat Supabase"');
  console.log('5. Under "Authorized redirect URIs", click "ADD URI" and enter:');
  console.log(`   ${SUPABASE_REDIRECT_URI}`);
  console.log('6. Click "Create"\n');
  console.log('7. A popup will show your Client ID and Client Secret.\n');
  
  const clientId = await ask('Paste your Client ID here: ');
  const clientSecret = await ask('Paste your Client Secret here: ');
  
  if (!clientId.trim() || !clientSecret.trim()) {
    console.log('\n❌ Client ID and Secret are required. Exiting.');
    rl.close();
    return;
  }
  
  console.log('\n═══ STEP 4: Update Supabase Google Provider ═══');
  console.log('Now go to your Supabase dashboard:');
  console.log(`  https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
  console.log('1. Click on "Google" provider');
  console.log(`2. Paste Client ID: ${clientId.trim()}`);
  console.log(`3. Paste Client Secret: ${clientSecret.trim()}`);
  console.log('4. Make sure "Enable Sign in with Google" is ON');
  console.log('5. Click "Save"\n');
  
  await ask('Press ENTER when done...');
  
  console.log('\n✅ Setup complete! Google Sign-In should now work.');
  console.log('Restart your dev server and test at http://localhost:3000/login\n');
  
  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  rl.close();
});
