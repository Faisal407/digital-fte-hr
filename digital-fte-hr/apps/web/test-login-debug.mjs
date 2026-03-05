import { chromium } from 'playwright';
import fs from 'fs';

const VERCEL_URL = 'https://digital-fte-lhzd0dp01-faisal407s-projects.vercel.app';
const SCREENSHOTS_DIR = './playwright-test-results';
const USERNAME = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let consoleMessages = [];
let jsErrors = [];

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(`🔵 CONSOLE: ${text}`);
  });

  // Capture JavaScript errors
  page.on('pageerror', error => {
    jsErrors.push(error.toString());
    console.log(`🔴 JS ERROR: ${error.toString()}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING LOGIN WITH PLAYWRIGHT');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Load login page
    console.log('📝 Step 1: Loading login page...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login-loaded.png` });
    console.log('✅ Login page loaded\n');

    // Step 2: Check for errors
    console.log('📝 Step 2: Checking for "Configuration Required" error...');
    const hasConfigError = await page.locator('text=Configuration Required').isVisible().catch(() => false);
    if (hasConfigError) {
      console.log('❌ Configuration Required error detected\n');
    } else {
      console.log('✅ No configuration error\n');
    }

    // Step 3: Find form elements
    console.log('📝 Step 3: Looking for form inputs...');
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const buttons = await page.locator('button').count();
    console.log(`   Email inputs: ${emailInputs}`);
    console.log(`   Password inputs: ${passwordInputs}`);
    console.log(`   Buttons: ${buttons}\n`);

    // Step 4: Fill form if inputs exist
    if (emailInputs > 0 && passwordInputs > 0) {
      console.log('📝 Step 4: Filling form...');
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      await emailInput.fill(USERNAME);
      console.log(`   ✅ Email filled: ${USERNAME}`);
      
      await passwordInput.fill(PASSWORD);
      console.log(`   ✅ Password filled: ${PASSWORD}\n`);

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-form-filled.png` });

      // Step 5: Click submit
      console.log('📝 Step 5: Submitting form...');
      const buttons = await page.locator('button').all();
      let foundSignIn = false;
      
      for (let btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('Sign In') || text.includes('Sign in') || text.includes('Login'))) {
          console.log(`   ✅ Found button: "${text}"`);
          await btn.click();
          foundSignIn = true;
          break;
        }
      }

      if (!foundSignIn) {
        console.log('   ⚠️  Could not find Sign In button, clicking first button\n');
        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click(); // Click last button (likely submit)
        }
      }

      // Wait for response
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-after-submit.png` });

      // Check if we got redirected
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      if (currentUrl.includes('dashboard')) {
        console.log('   ✅ Successfully logged in!\n');
      } else {
        console.log('   ❌ Still on login page - authentication failed\n');
      }
    } else {
      console.log('❌ Form inputs not found!\n');
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-no-form.png` });
    }

    // Step 6: Final page HTML
    console.log('📝 Step 6: Page content check...');
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log('❌ "Application error" found in page HTML\n');
      
      // Try to find error details
      const errorDiv = await page.locator('text=/Application error/i').first();
      if (await errorDiv.isVisible()) {
        const errorText = await errorDiv.textContent();
        console.log(`   Error text: ${errorText}\n`);
      }
    }

    // Step 7: Browser DevTools Console
    console.log('='.repeat(70));
    console.log('📊 CAPTURED CONSOLE MESSAGES');
    console.log('='.repeat(70));
    if (consoleMessages.length === 0) {
      console.log('✅ No console messages captured\n');
    } else {
      consoleMessages.forEach((msg, i) => console.log(`${i+1}. ${msg}`));
      console.log();
    }

    console.log('='.repeat(70));
    console.log('🔴 CAPTURED JAVASCRIPT ERRORS');
    console.log('='.repeat(70));
    if (jsErrors.length === 0) {
      console.log('✅ NO JAVASCRIPT ERRORS!\n');
    } else {
      jsErrors.forEach((err, i) => console.log(`${i+1}. ${err}`));
      console.log();
    }

    console.log('📸 Screenshots saved to: ' + SCREENSHOTS_DIR);
    console.log('\n⏳ Browser will stay open for 15 seconds...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
