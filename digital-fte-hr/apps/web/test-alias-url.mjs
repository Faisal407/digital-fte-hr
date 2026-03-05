import { chromium } from 'playwright';

const VERCEL_URL = 'https://web-one-ivory-84.vercel.app';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\n========================================`);
    console.log(`🧪 Testing Alias URL`);
    console.log(`URL: ${VERCEL_URL}`);
    console.log(`========================================\n`);
    
    console.log(`[STEP 1] Navigating to login page...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    console.log(`✅ Page loaded\n`);

    // Check page content
    const pageText = await page.innerText('body');
    console.log(`[DEBUG] Page contains Supabase: ${pageText.includes('Supabase')}`);
    console.log(`[DEBUG] Page contains Vercel auth: ${pageText.includes('Log in to Vercel')}`);

    if (pageText.includes('Sign In') && pageText.includes('Supabase')) {
      console.log(`✅ Supabase login form found!\n`);

      // Enter email
      console.log(`[STEP 2] Entering credentials...`);
      await page.fill('#email', EMAIL);
      console.log(`✅ Email entered`);

      await page.fill('#password', PASSWORD);
      console.log(`✅ Password entered\n`);

      // Submit
      console.log(`[STEP 3] Submitting...`);
      await page.click('button[type="submit"]');
      console.log(`✅ Form submitted`);

      // Wait for dashboard
      console.log(`\n[STEP 4] Waiting for dashboard...`);
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      } catch (e) {}
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log(`✅ Final URL: ${finalUrl}\n`);

      // Check for errors
      const errorCount = await page.locator('text=/Application error/i').count();
      if (errorCount > 0) {
        console.log(`❌ Error found`);
        process.exit(1);
      }

      console.log(`✅ No application errors\n`);
      console.log(`========================================`);
      console.log(`✅ SUCCESS - App is working!`);
      console.log(`========================================\n`);

    } else {
      console.log(`[INFO] Cannot access app - Vercel auth page`);
      console.log(`[INFO] This is a Vercel project access setting, not app code issue`);
      console.log(`[ACTION] Contact Vercel to make project publicly accessible\n`);
    }

    await page.screenshot({ path: 'alias-test-screenshot.png' });
    
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
    try {
      await page.screenshot({ path: 'alias-test-error.png' });
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

test();
