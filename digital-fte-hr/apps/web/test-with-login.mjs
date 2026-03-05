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
  const browser = await chromium.launch({ headless: false }); // Show browser so you can see
  const context = await browser.createContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    console.log(`🔵 CONSOLE: [${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture JavaScript errors
  page.on('pageerror', error => {
    jsErrors.push(error.toString());
    console.log(`🔴 JS ERROR: ${error.toString()}`);
    console.log(`   Stack: ${error.stack}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING LOGIN WITH PLAYWRIGHT - SHOWING BROWSER');
  console.log('='.repeat(70) + '\n');
  console.log(`Username: ${USERNAME}`);
  console.log(`Password: ${PASSWORD}\n`);

  try {
    // Step 1: Load home page
    console.log('📝 Step 1: Loading home page...');
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-home.png` });
    console.log('✅ Home page loaded\n');

    // Step 2: Navigate to login
    console.log('📝 Step 2: Going to login page...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-login-page.png` });
    console.log('✅ Login page loaded\n');

    // Step 3: Try to find and fill email field
    console.log('📝 Step 3: Looking for email input...');
    const emailInputs = await page.locator('input[type="email"]').all();
    console.log(`   Found ${emailInputs.length} email inputs\n`);

    // Try different selectors
    const emailByName = await page.locator('input[name="email"]').isVisible().catch(() => false);
    const emailByPlaceholder = await page.locator('input[placeholder*="email" i]').isVisible().catch(() => false);
    
    console.log(`   Email by name: ${emailByName}`);
    console.log(`   Email by placeholder: ${emailByPlaceholder}\n`);

    // Step 4: Check page HTML for form structure
    console.log('📝 Step 4: Checking form structure...');
    const pageContent = await page.content();
    if (pageContent.includes('Configuration Required')) {
      console.log('❌ Configuration Required error found!\n');
    } else if (pageContent.includes('form') || pageContent.includes('input')) {
      console.log('✅ Form elements found\n');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-form-structure.png` });

    // Step 5: List all inputs on page
    console.log('📝 Step 5: All form inputs on page:');
    const allInputs = await page.locator('input').all();
    for (let i = 0; i < allInputs.length; i++) {
      const type = await allInputs[i].getAttribute('type');
      const name = await allInputs[i].getAttribute('name');
      const placeholder = await allInputs[i].getAttribute('placeholder');
      console.log(`   Input ${i+1}: type="${type}" name="${name}" placeholder="${placeholder}"`);
    }
    console.log();

    // Step 6: List all buttons on page
    console.log('📝 Step 6: All buttons on page:');
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      console.log(`   Button ${i+1}: "${text}"`);
    }
    console.log();

    // Step 7: Try to submit form (if it exists)
    console.log('📝 Step 7: Attempting to fill and submit form...');
    try {
      // Try common selectors
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible()) {
        console.log('   ✅ Email input found - filling...');
        await emailInput.fill(USERNAME);
        await page.waitForTimeout(500);
      } else {
        console.log('   ❌ Email input NOT visible');
      }

      if (await passwordInput.isVisible()) {
        console.log('   ✅ Password input found - filling...');
        await passwordInput.fill(PASSWORD);
        await page.waitForTimeout(500);
      } else {
        console.log('   ❌ Password input NOT visible');
      }

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-form-filled.png` });

      // Look for submit button
      const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Sign in"), button:has-text("Login")').first();
      if (await submitButton.isVisible()) {
        console.log('   ✅ Submit button found - clicking...\n');
        await submitButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-after-submit.png` });
      } else {
        console.log('   ❌ Submit button NOT found\n');
      }
    } catch (error) {
      console.log(`   ⚠️  Error during form submission: ${error.message}\n`);
    }

    // Step 8: Final screenshot
    console.log('📝 Step 8: Taking final screenshot...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-final.png` });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);
    console.log(`\n🔵 Console Messages (${consoleMessages.length}):`);
    consoleMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    
    console.log(`\n🔴 JavaScript Errors (${jsErrors.length}):`);
    if (jsErrors.length === 0) {
      console.log('   ✅ NO ERRORS!');
    } else {
      jsErrors.forEach((err, i) => console.log(`   ${i+1}. ${err}`));
    }

    console.log('\n💡 DIAGNOSIS:');
    if (jsErrors.length > 0) {
      console.log('❌ ISSUE FOUND: There are JavaScript errors causing the app to crash');
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    console.log('\n📂 BROWSER IS OPEN - Check the window to see what happened!\n');

    // Keep browser open for 10 seconds so user can see
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error);
  } finally {
    await context.close();
    await browser.close();
    console.log('Browser closed. Check screenshots in:', SCREENSHOTS_DIR);
  }
}

test();
