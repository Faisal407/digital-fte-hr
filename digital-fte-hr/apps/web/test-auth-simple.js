import { chromium } from 'playwright';
import * as fs from 'fs';

async function testAuthSimple() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  SIMPLE AUTHENTICATION TEST - SHOWING ACTUAL BEHAVIOR      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
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
    console.log('SCENARIO 1: Try to sign in with non-existent account');
    console.log('═'.repeat(60));

    await page.goto('http://localhost:3000/auth/login');
    console.log('✅ Loaded /auth/login page\n');

    await page.fill('input[type="email"]', 'notreal@example.com');
    await page.fill('input[type="password"]', 'Password123');
    console.log('📝 Entered email: notreal@example.com');
    console.log('📝 Entered password: Password123\n');

    await page.screenshot({ path: 'test-results/simple-01-form-filled.png' });

    console.log('⏳ Clicking Sign In button...\n');
    await page.click('button:has-text("Sign In")');

    // Wait for any response (redirect or error)
    await page.waitForTimeout(3000);

    const url1 = page.url();
    const pageContent1 = await page.content();

    console.log(`Current URL: ${url1}`);

    if (url1.includes('/dashboard')) {
      console.log('✅ Signed in successfully\n');
    } else {
      // Check for error messages on page
      const hasError = pageContent1.includes('Error') || pageContent1.includes('error');
      if (hasError) {
        console.log('✅ ERROR DISPLAYED on page');
        // Try to extract error text
        const errorText = await page.textContent('[role="alert"]');
        console.log(`   Error message: "${errorText}"\n`);
      } else {
        console.log('⚠️  No error displayed\n');
      }
    }

    await page.screenshot({ path: 'test-results/simple-02-after-login-attempt.png' });

    // Test 2: Correct credentials
    console.log('═'.repeat(60));
    console.log('SCENARIO 2: Sign in with correct credentials');
    console.log('═'.repeat(60));

    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123');
    console.log('📝 Entered email: test@example.com');
    console.log('📝 Entered password: Password123\n');

    console.log('⏳ Clicking Sign In button...\n');
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(3000);

    const url2 = page.url();
    console.log(`Current URL: ${url2}`);

    if (url2.includes('/dashboard')) {
      console.log('✅ SUCCESSFULLY SIGNED IN!');
      console.log('✅ Redirected to /dashboard\n');
    } else {
      console.log('⚠️  Still on login page\n');
    }

    await page.screenshot({ path: 'test-results/simple-03-login-result.png' });

    // Test 3: Register new account
    console.log('═'.repeat(60));
    console.log('SCENARIO 3: Create new account');
    console.log('═'.repeat(60));

    await page.goto('http://localhost:3000/auth/register');
    console.log('✅ Loaded /auth/register page\n');

    const uniqueEmail = `newuser${Date.now()}@example.com`;
    await page.fill('input[placeholder="John"]', 'John');
    await page.fill('input[placeholder="Doe"]', 'Doe');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Password123');

    // Find the confirm password field (second password field)
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(1).fill('Password123');

    // Check the terms checkbox
    await page.check('input[type="checkbox"]');

    console.log('📝 Entered first name: John');
    console.log('📝 Entered last name: Doe');
    console.log(`📝 Entered email: ${uniqueEmail}`);
    console.log('📝 Entered password: Password123');
    console.log('✅ Checked terms & conditions\n');

    await page.screenshot({ path: 'test-results/simple-04-register-form.png' });

    console.log('⏳ Clicking Create Account button...\n');
    await page.click('button:has-text("Create Account")');

    await page.waitForTimeout(3000);

    const url3 = page.url();
    const pageContent3 = await page.content();

    console.log(`Current URL: ${url3}`);

    if (url3.includes('/auth/login')) {
      console.log('✅ REDIRECTED to login page after successful registration!\n');
    } else if (pageContent3.includes('created') || pageContent3.includes('success')) {
      console.log('✅ SUCCESS message displayed\n');
    }

    await page.screenshot({ path: 'test-results/simple-05-register-result.png' });

    await context.close();

    console.log('═'.repeat(60));
    console.log('✨ AUTHENTICATION FLOW TEST COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📸 SCREENSHOTS:');
    console.log('   • simple-01-form-filled.png');
    console.log('   • simple-02-after-login-attempt.png');
    console.log('   • simple-03-login-result.png');
    console.log('   • simple-04-register-form.png');
    console.log('   • simple-05-register-result.png\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    console.log('🛑 Closing browser...\n');
    await browser.close();
  }
}

testAuthSimple().catch(console.error);
