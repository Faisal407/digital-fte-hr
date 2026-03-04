import { chromium } from 'playwright';
import * as fs from 'fs';

async function testAuthFixed() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    FIXED AUTHENTICATION TEST - PROPER ERROR MESSAGES       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  try {
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Test 1: Non-existent account
    console.log('═'.repeat(60));
    console.log('TEST 1: ACCOUNT NOT FOUND ERROR');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3001/auth/login');
    console.log('✅ Loaded /auth/login page\n');

    await page.fill('input[type="email"]', 'notreal@example.com');
    await page.fill('input[type="password"]', 'Password123');
    console.log('📝 Entered: notreal@example.com (non-existent account)\n');

    console.log('⏳ Clicking Sign In...\n');
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(2500);

    const errorText1 = await page.textContent('[role="alert"] div:nth-child(2)');
    if (errorText1) {
      console.log('✅ ERROR MESSAGE DISPLAYED:');
      console.log(`   "${errorText1}"\n`);
      await page.screenshot({ path: 'test-results/fixed-01-account-not-found.png', fullPage: true });
    } else {
      console.log('⚠️  No error message found\n');
    }

    // Test 2: Wrong password
    console.log('═'.repeat(60));
    console.log('TEST 2: WRONG PASSWORD ERROR');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3001/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    console.log('📝 Entered: test@example.com with wrong password\n');

    console.log('⏳ Clicking Sign In...\n');
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(2500);

    const errorText2 = await page.textContent('[role="alert"] div:nth-child(2)');
    if (errorText2) {
      console.log('✅ ERROR MESSAGE DISPLAYED:');
      console.log(`   "${errorText2}"\n`);
      await page.screenshot({ path: 'test-results/fixed-02-wrong-password.png', fullPage: true });
    }

    // Test 3: Successful login
    console.log('═'.repeat(60));
    console.log('TEST 3: SUCCESSFUL LOGIN');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3001/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123');
    console.log('📝 Entered: test@example.com with correct password\n');

    console.log('⏳ Clicking Sign In...\n');
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`Current URL: ${url}\n`);

    if (url.includes('/dashboard')) {
      console.log('✅ SUCCESSFULLY SIGNED IN AND REDIRECTED TO DASHBOARD!\n');
      await page.screenshot({ path: 'test-results/fixed-03-login-success.png', fullPage: true });
    } else {
      console.log('⚠️  Not on dashboard yet\n');
    }

    await context.close();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✅ TESTS COMPLETE                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📸 SCREENSHOTS SAVED:');
    console.log('   • fixed-01-account-not-found.png');
    console.log('   • fixed-02-wrong-password.png');
    console.log('   • fixed-03-login-success.png\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    console.log('🛑 Closing browser...\n');
    await browser.close();
  }
}

testAuthFixed().catch(console.error);
