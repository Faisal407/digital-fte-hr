import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-lhzd0dp01-faisal407s-projects.vercel.app';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let jsErrors = [];

  page.on('pageerror', error => {
    jsErrors.push({
      message: error.toString(),
      stack: error.stack
    });
    console.log(`🔴 JS ERROR: ${error.message}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🧪 DIRECT DASHBOARD ACCESS');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('📝 Accessing dashboard directly...\n');
    await page.goto(`${VERCEL_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    await page.waitForTimeout(2000);

    // Check what's on the page
    const appError = await page.locator('text=Application error').isVisible().catch(() => false);
    const errorAlert = await page.locator('[role="alert"]').first().isVisible().catch(() => false);
    const pageText = await page.locator('body').textContent();

    console.log(`Page shows app error: ${appError ? '❌ YES' : '✅ NO'}`);
    console.log(`Page has alert: ${errorAlert ? '⚠️ YES' : '✅ NO'}\n`);

    if (jsErrors.length > 0) {
      console.log('🔴 JAVASCRIPT ERRORS FOUND:\n');
      jsErrors.forEach((err, i) => {
        console.log(`${i+1}. ${err.message}`);
        console.log(`   Stack: ${err.stack.split('\n')[1]}\n`);
      });
    } else {
      console.log('✅ NO JavaScript errors!\n');
    }

    if (pageText && pageText.includes('Application error')) {
      console.log('❌ Page contains "Application error" text');
      // Try to find error details
      const errorElement = await page.locator('text=/Application error|error|Error/i').first();
      const errorContent = await errorElement.textContent().catch(() => '');
      console.log(`\nError content: ${errorContent}\n`);
    }

    await page.screenshot({ path: './dashboard-direct.png' });
    console.log('📸 Screenshot saved: ./dashboard-direct.png\n');

    console.log('⏳ Browser staying open for 5 seconds...\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Navigation error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
