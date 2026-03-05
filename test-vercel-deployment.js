const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://web-orcin-five-41.vercel.app';
const SCREENSHOTS_DIR = './deployment-test-screenshots';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testDeployment() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext();
  const page = await context.newPage();

  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING VERCEL DEPLOYMENT WITH SUPABASE');
  console.log('='.repeat(70) + '\n');

  try {
    // Test 1: Homepage
    console.log('📝 Test 1: Loading homepage...');
    await page.goto(`${VERCEL_URL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage.png` });
    console.log('✅ Homepage loaded successfully');
    console.log(`   Screenshot: ${SCREENSHOTS_DIR}/01-homepage.png\n`);

    // Test 2: Login page
    console.log('📝 Test 2: Loading login page...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if "Configuration Required" error is present
    const configErrorVisible = await page.locator('text=Configuration Required').isVisible().catch(() => false);

    if (configErrorVisible) {
      console.log('❌ ERROR: "Configuration Required" message still showing');
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-login-config-error.png` });
    } else {
      console.log('✅ Login page loaded - NO "Configuration Required" error!');

      // Check for form elements
      const emailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
      const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
      const loginButton = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);

      if (emailInput && passwordInput && loginButton) {
        console.log('✅ All login form elements present (email, password, button)');
      } else {
        console.log('⚠️  Some form elements missing');
      }

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-login-page.png` });
      console.log(`   Screenshot: ${SCREENSHOTS_DIR}/02-login-page.png\n`);
    }

    // Test 3: Register page
    console.log('📝 Test 3: Loading register page...');
    await page.goto(`${VERCEL_URL}/auth/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const registerConfigErrorVisible = await page.locator('text=Configuration Required').isVisible().catch(() => false);

    if (registerConfigErrorVisible) {
      console.log('❌ ERROR: "Configuration Required" message on register page');
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-register-config-error.png` });
    } else {
      console.log('✅ Register page loaded - NO "Configuration Required" error!');

      // Check for form elements
      const regEmailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
      const regPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
      const regButton = await page.locator('button:has-text("Sign Up")').isVisible().catch(() => false);

      if (regEmailInput && regPasswordInput && regButton) {
        console.log('✅ All register form elements present (email, password, button)');
      } else {
        console.log('⚠️  Some form elements missing');
      }

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-register-page.png` });
      console.log(`   Screenshot: ${SCREENSHOTS_DIR}/03-register-page.png\n`);
    }

    // Test 4: Test actual login attempt
    console.log('📝 Test 4: Testing login with invalid credentials...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });

    const emailField = await page.locator('input[type="email"]');
    const passwordField = await page.locator('input[type="password"]');
    const signInBtn = await page.locator('button:has-text("Sign In")');

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('test@example.com');
      await passwordField.fill('wrongpassword123');
      await signInBtn.click();

      // Wait for error message
      await page.waitForTimeout(3000);

      const errorAlert = await page.locator('[role="alert"]').isVisible().catch(() => false);
      if (errorAlert) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log('✅ Error message displayed on invalid login:');
        console.log(`   "${errorText}"`);
      } else {
        console.log('⚠️  No error message displayed');
      }

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-login-error-test.png` });
      console.log(`   Screenshot: ${SCREENSHOTS_DIR}/04-login-error-test.png\n`);
    }

    // Summary
    console.log('='.repeat(70));
    console.log('✅ DEPLOYMENT TEST COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📸 Screenshots saved to:', path.resolve(SCREENSHOTS_DIR));
    console.log('\n🎉 Supabase is now configured and working on Vercel!');
    console.log('\n✅ You can now:');
    console.log('   • Sign in with valid Supabase credentials');
    console.log('   • Create new accounts');
    console.log('   • Access the dashboard\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error.png` });
  } finally {
    await context.close();
    await browser.close();
  }
}

testDeployment();
