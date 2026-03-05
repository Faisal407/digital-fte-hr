import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-lhzd0dp01-faisal407s-projects.vercel.app';
const USERNAME = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let jsErrors = [];
  let consoleMessages = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(`🔵 ${text}`);
  });

  // Capture JavaScript errors
  page.on('pageerror', error => {
    jsErrors.push(error.toString());
    console.log(`🔴 JS ERROR: ${error.toString()}`);
    console.log(`   Stack: ${error.stack}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🧪 DASHBOARD ERROR DEBUG');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Go to login
    console.log('📝 Step 1: Opening login page...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('✅ Login page loaded\n');

    // Step 2: Fill and submit login form
    console.log('📝 Step 2: Logging in...');
    await page.locator('input[type="email"]').fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    console.log('   Waiting for authentication...\n');
    await page.waitForTimeout(4000);

    // Step 3: Check if dashboard loaded
    console.log('📝 Step 3: Checking dashboard page...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}\n`);

    // Step 4: Wait and capture any errors
    console.log('📝 Step 4: Waiting for errors...');
    await page.waitForTimeout(3000);

    const errorText = await page.locator('text=Application error').isVisible().catch(() => false);
    if (errorText) {
      console.log('❌ Application error detected\n');
    }

    // Step 5: Take screenshot
    await page.screenshot({ path: './dashboard-error.png' });
    console.log('📸 Screenshot: ./dashboard-error.png\n');

    // Step 6: Report errors
    console.log('='.repeat(70));
    console.log('📊 ERROR SUMMARY');
    console.log('='.repeat(70) + '\n');

    if (jsErrors.length === 0) {
      console.log('✅ NO JavaScript errors captured\n');
    } else {
      console.log(`🔴 JAVASCRIPT ERRORS (${jsErrors.length}):\n`);
      jsErrors.forEach((err, i) => {
        console.log(`${i+1}. ${err}\n`);
      });
    }

    console.log('='.repeat(70));
    console.log('💡 CONSOLE MESSAGES');
    console.log('='.repeat(70) + '\n');
    consoleMessages.forEach((msg, i) => {
      console.log(`${i+1}. ${msg}`);
    });

    console.log('\n⏳ Browser staying open for 10 seconds...\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
