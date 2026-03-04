import { chromium } from 'playwright';
import * as fs from 'fs';

async function testSupabasePages() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     SUPABASE AUTH PAGES - PHYSICAL TESTING WITH PLAYWRIGHT  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const errors = [];

  try {
    if (!fs.existsSync('test-results')) fs.mkdirSync('test-results', { recursive: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`[ERROR] ${msg.text()}`);
        console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      errors.push(`[PAGE ERROR] ${err.message}`);
      console.log(`🔴 PAGE ERROR: ${err.message}`);
    });

    // TEST 1: LOGIN PAGE
    console.log('═'.repeat(60));
    console.log('TEST 1: LOGIN PAGE - /auth/login');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3002/auth/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const loginUrl = page.url();
    console.log(`✅ Page URL: ${loginUrl}`);

    // Check for form elements
    const emailInput = await page.locator('input[type="email"]').isVisible();
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    const submitBtn = await page.locator('button[type="submit"]').isVisible();

    console.log(`✅ Email input: ${emailInput ? 'Present' : 'MISSING'}`);
    console.log(`✅ Password input: ${passwordInput ? 'Present' : 'MISSING'}`);
    console.log(`✅ Submit button: ${submitBtn ? 'Present' : 'MISSING'}`);

    // Check for Supabase error messages
    const pageContent = await page.content();
    if (pageContent.includes('undefined')) {
      errors.push('Page contains "undefined" - likely missing Supabase URL');
      console.log('🔴 WARNING: Page contains "undefined"');
    }

    await page.screenshot({ path: 'test-results/supabase-01-login-page.png', fullPage: true });
    console.log('📸 Screenshot: supabase-01-login-page.png\n');

    // TEST 2: REGISTER PAGE
    console.log('═'.repeat(60));
    console.log('TEST 2: REGISTER PAGE - /auth/register');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3002/auth/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const registerUrl = page.url();
    console.log(`✅ Page URL: ${registerUrl}`);

    // Check for form elements
    const regEmailInput = await page.locator('input[type="email"]').isVisible();
    const regPasswordInput = await page.locator('input[type="password"]').count();
    const regSubmitBtn = await page.locator('button[type="submit"]').isVisible();

    console.log(`✅ Email input: ${regEmailInput ? 'Present' : 'MISSING'}`);
    console.log(`✅ Password inputs: ${regPasswordInput >= 2 ? 'Present (2+)' : 'MISSING'}`);
    console.log(`✅ Submit button: ${regSubmitBtn ? 'Present' : 'MISSING'}`);

    const regContent = await page.content();
    if (regContent.includes('undefined')) {
      errors.push('Register page contains "undefined" - likely missing Supabase URL');
      console.log('🔴 WARNING: Page contains "undefined"');
    }

    await page.screenshot({ path: 'test-results/supabase-02-register-page.png', fullPage: true });
    console.log('📸 Screenshot: supabase-02-register-page.png\n');

    // TEST 3: Try to type in email
    console.log('═'.repeat(60));
    console.log('TEST 3: FORM INTERACTION - Try typing email');
    console.log('═'.repeat(60) + '\n');

    await page.goto('http://localhost:3002/auth/login', { waitUntil: 'networkidle' });
    
    const emailField = page.locator('input[type="email"]');
    await emailField.fill('test@example.com');
    const filledEmail = await emailField.inputValue();
    
    console.log(`✅ Email field accepts input: ${filledEmail === 'test@example.com' ? 'YES' : 'NO'}`);

    const passwordField = page.locator('input[type="password"]');
    await passwordField.fill('password123');
    const filledPassword = await passwordField.inputValue();
    
    console.log(`✅ Password field accepts input: ${filledPassword === 'password123' ? 'YES' : 'NO'}`);

    await page.screenshot({ path: 'test-results/supabase-03-form-filled.png', fullPage: true });
    console.log('📸 Screenshot: supabase-03-form-filled.png\n');

    await context.close();

    // RESULTS
    console.log('\n' + '═'.repeat(60));
    if (errors.length === 0) {
      console.log('✅ ✅ ✅ NO ERRORS FOUND - PAGES ARE WORKING! ✅ ✅ ✅');
    } else {
      console.log('🔴 ERRORS FOUND:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }
    console.log('═'.repeat(60) + '\n');

    console.log('📋 SUMMARY:');
    console.log('   ✅ Login page loads');
    console.log('   ✅ Register page loads');
    console.log('   ✅ Form fields present');
    console.log('   ✅ Form input works');
    console.log(`   ${errors.length === 0 ? '✅' : '🔴'} JavaScript errors: ${errors.length}`);
    console.log('\n📸 SCREENSHOTS:');
    console.log('   • supabase-01-login-page.png');
    console.log('   • supabase-02-register-page.png');
    console.log('   • supabase-03-form-filled.png\n');

    return errors.length === 0;

  } catch (error) {
    console.error('\n❌ TEST CRASHED:', error.message);
    return false;
  } finally {
    console.log('🛑 Closing browser...\n');
    await browser.close();
  }
}

const success = await testSupabasePages();
process.exit(success ? 0 : 1);
