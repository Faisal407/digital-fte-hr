#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🚀 VERCEL DEPLOYMENT AUTOMATION');
console.log('='.repeat(60) + '\n');

const cwd = process.cwd();
console.log(`📍 Current directory: ${cwd}\n`);

try {
  // Step 1: Verify build
  console.log('📦 Step 1: Verifying build...');
  if (!fs.existsSync('.next')) {
    console.log('   Running npm run build...');
    execSync('npm run build', { stdio: 'inherit', cwd });
  } else {
    console.log('   ✓ Build artifacts found');
  }
  console.log('   ✅ Build verified\n');

  // Step 2: Check Vercel CLI
  console.log('🔐 Step 2: Checking Vercel CLI authentication...');
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('   ✓ Already authenticated\n');
  } catch (err) {
    console.log('   ⚠️  Not authenticated yet');
    console.log('   Running: vercel login\n');
    execSync('vercel login', { stdio: 'inherit' });
  }

  // Step 3: Deploy to Vercel
  console.log('\n🚀 Step 3: Deploying to Vercel...\n');
  const deployOutput = execSync('vercel --prod --confirm', {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ DEPLOYMENT SUCCESSFUL!');
  console.log('='.repeat(60) + '\n');

  console.log('📋 Deployment Checklist:');
  console.log('   ✅ Code deployed to Vercel');
  console.log('   ⏭️  Add environment variables (see below)');
  console.log('   ⏭️  Redeploy after adding env vars');
  console.log('   ⏭️  Test authentication with Supabase\n');

  console.log('🔧 Environment Variables to Add in Vercel:');
  console.log('   1. NEXT_PUBLIC_SUPABASE_URL');
  console.log('   2. NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('   3. NEXTAUTH_URL');
  console.log('   4. NEXTAUTH_SECRET\n');

  console.log('📝 How to Add Environment Variables:');
  console.log('   1. Go to: https://vercel.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Add each variable');
  console.log('   5. Redeploy from Deployments tab\n');

  console.log('🎉 Your app is now LIVE on Vercel!');
  console.log('='.repeat(60) + '\n');

} catch (error) {
  console.error('\n❌ DEPLOYMENT FAILED\n');
  console.error(error.message);
  console.error('\n📞 Troubleshooting:');
  console.error('   1. Make sure you\'re logged into Vercel: vercel login');
  console.error('   2. Verify build works locally: npm run build');
  console.error('   3. Check internet connection');
  console.error('   4. Try again: npm run deploy\n');
  process.exit(1);
}
