import { chromium } from 'playwright';

// Use the previous working deployment
const VERCEL_URL = 'https://digital-fte-lhzd0dp01-faisal407s-projects.vercel.app';
const USERNAME = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST: Login → Dashboard (checking for app errors)');
  console.log('='.repeat(70) + '\n');

  try {
    // Go to login
    console.log('📝 Step 1: Going to login...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('✅ Login page loaded\n');

    // Fill and submit
    console.log('📝 Step 2: Submitting login...');
    await page.locator('input[type="email"]').fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    console.log('   Waiting for authentication...\n');
    await page.waitForTimeout(5000);

    // Check result
    const hasAppError = await page.locator('text=Application error').isVisible().catch(() => false);
    const isOnDashboard = page.url().includes('/dashboard');

    console.log('📝 Step 3: Results:');
    console.log(`   Dashboard accessed: ${isOnDashboard ? '✅' : '❌'}`);
    console.log(`   Application error: ${hasAppError ? '❌ YES' : '✅ NONE'}`);
    console.log(`   Current URL: ${page.url()}\n`);

    if (isOnDashboard && !hasAppError) {
      console.log('🎉 SUCCESS! Dashboard works after login!\n');
    } else if (hasAppError) {
      console.log('❌ ERROR: Dashboard shows application error\n');
    }

    await page.screenshot({ path: './final-result.png' });
    console.log('📸 Screenshot: ./final-result.png\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
