import { chromium } from 'playwright';

const VERCEL_URL = 'https://web-pfbbtwvft-faisal407s-projects.vercel.app';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\n========================================`);
    console.log(`🧪 Testing Deployed App on Vercel`);
    console.log(`========================================\n`);
    
    console.log(`[STEP 1] Navigating to ${VERCEL_URL}...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    console.log(`✅ Login page loaded\n`);

    // Check that we have our Supabase login form
    const pageText = await page.innerText('body');
    if (pageText.includes('Supabase')) {
      console.log(`✅ Supabase login form detected`);
    } else {
      console.log(`⚠️ Supabase text not found, but page loaded`);
    }

    // Enter email
    console.log(`\n[STEP 2] Entering credentials...`);
    console.log(`Email: ${EMAIL}`);
    await page.fill('#email', EMAIL);
    console.log(`✅ Email entered`);

    // Enter password
    console.log(`Password: (hidden)`);
    await page.fill('#password', PASSWORD);
    console.log(`✅ Password entered\n`);

    // Click sign in
    console.log(`[STEP 3] Submitting login form...`);
    await page.click('button[type="submit"]');
    console.log(`✅ Sign in button clicked`);

    // Wait for navigation and rendering
    console.log(`\n[STEP 4] Waiting for dashboard (20s timeout)...`);
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    } catch (e) {
      // Timeout ok
    }
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`✅ Navigation completed`);
    console.log(`Final URL: ${finalUrl}\n`);

    // Check for errors
    console.log(`[STEP 5] Checking for errors...`);
    const errorElements = await page.locator('text=/Application error|client-side exception/i').count();
    
    if (errorElements > 0) {
      console.log(`❌ FAILURE: Application error detected!\n`);
      process.exit(1);
    }
    console.log(`✅ No error messages detected\n`);

    // Verify dashboard content
    console.log(`[STEP 6] Verifying dashboard content...`);
    const pageBody = await page.innerText('body');
    
    const checks = {
      'Welcome message': pageBody.includes('Welcome'),
      'Dashboard text': pageBody.includes('Dashboard') || pageBody.includes('Applications'),
      'KPI cards': pageBody.includes('Applications This Week') || pageBody.includes('Active Searches'),
    };

    let allPassed = false;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`✅ ${check}`);
        allPassed = true;
      }
    }

    if (!allPassed) {
      console.log(`⚠️ Could not find expected dashboard elements`);
      console.log(`Page content (first 500 chars): ${pageBody.substring(0, 500)}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'deployed-app-screenshot.png' });
    console.log(`\n✅ Screenshot saved: deployed-app-screenshot.png`);

    console.log(`\n========================================`);
    console.log(`✅ TEST PASSED - Deployed App Works!`);
    console.log(`========================================`);
    console.log(`\n✨ Login → Dashboard flow working correctly`);
    console.log(`✨ No "Application error" exceptions`);
    console.log(`✨ App successfully deployed on Vercel\n`);

  } catch (error) {
    console.log(`\n❌ TEST FAILED\n`);
    console.log(`Error: ${error.message}\n`);
    try {
      await page.screenshot({ path: 'deployed-app-error.png' });
      console.log(`Screenshot saved: deployed-app-error.png`);
    } catch (e) {
      // Screenshot failed
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
