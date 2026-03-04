const { chromium } = require('playwright');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting Playwright Tests for Auth Pages\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const results = { passed: 0, failed: 0, tests: [] };

  // Create test results directory
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }

  try {
    // TEST 1: Login Page Loads
    console.log('📝 TEST 1: Login Page Loads');
    await page.goto('http://localhost:8000/auth/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const loginURL = page.url();
    const loginContent = await page.content();

    const hasLoginHeading = loginContent.includes('Sign In');
    const hasEmailInput = loginContent.includes('type="email"');
    const hasPasswordInput = loginContent.includes('type="password"');
    const hasSubmitButton = loginContent.includes('type="submit"');

    console.log(`   URL: ${loginURL}`);
    console.log(`   ✓ Page loads: ${!loginURL.includes('404')}`);
    console.log(`   ✓ Sign In heading: ${hasLoginHeading}`);
    console.log(`   ✓ Email input exists: ${hasEmailInput}`);
    console.log(`   ✓ Password input exists: ${hasPasswordInput}`);
    console.log(`   ✓ Submit button exists: ${hasSubmitButton}`);

    await page.screenshot({ path: 'test-results/01-login-page-load.png' });

    if (loginURL.includes('404')) {
      results.tests.push({ test: 'Login Page Loads', status: 'FAIL', reason: '404 error' });
      results.failed++;
    } else if (hasLoginHeading && hasEmailInput && hasPasswordInput && hasSubmitButton) {
      results.tests.push({ test: 'Login Page Loads', status: 'PASS' });
      results.passed++;
      console.log('   ✅ TEST PASSED\n');
    } else {
      results.tests.push({ test: 'Login Page Loads', status: 'FAIL', reason: 'Missing form elements' });
      results.failed++;
      console.log('   ❌ TEST FAILED\n');
    }

    // TEST 2: Login Form Interactivity
    console.log('📝 TEST 2: Login Form Accepts Input');
    const emailInputLogin = await page.locator('input[type="email"]').first();
    const passwordInputLogin = await page.locator('input[type="password"]').first();

    if (emailInputLogin && passwordInputLogin) {
      await emailInputLogin.fill('test@example.com');
      await passwordInputLogin.fill('password123');

      const emailValue = await emailInputLogin.inputValue();
      const passwordValue = await passwordInputLogin.inputValue();

      const emailCorrect = emailValue === 'test@example.com';
      const passwordCorrect = passwordValue === 'password123';

      console.log(`   Email input value: ${emailValue}`);
      console.log(`   Password input value: ${passwordValue}`);
      console.log(`   ✓ Email accepts input: ${emailCorrect}`);
      console.log(`   ✓ Password accepts input: ${passwordCorrect}`);

      await page.screenshot({ path: 'test-results/02-login-form-filled.png' });

      if (emailCorrect && passwordCorrect) {
        results.tests.push({ test: 'Login Form Interactivity', status: 'PASS' });
        results.passed++;
        console.log('   ✅ TEST PASSED\n');
      } else {
        results.tests.push({ test: 'Login Form Interactivity', status: 'FAIL' });
        results.failed++;
        console.log('   ❌ TEST FAILED\n');
      }
    } else {
      results.tests.push({ test: 'Login Form Interactivity', status: 'FAIL', reason: 'Form inputs not found' });
      results.failed++;
      console.log('   ❌ TEST FAILED (inputs not found)\n');
    }

    // TEST 3: Register Page Loads
    console.log('📝 TEST 3: Register Page Loads');
    await page.goto('http://localhost:8000/auth/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const registerURL = page.url();
    const registerContent = await page.content();

    const hasRegisterHeading = registerContent.includes('Create Account');
    const hasRegisterEmail = registerContent.includes('Email Address');
    const hasPasswordFields = (registerContent.match(/type="password"/g) || []).length >= 2;

    console.log(`   URL: ${registerURL}`);
    console.log(`   ✓ Page loads: ${!registerURL.includes('404')}`);
    console.log(`   ✓ Create Account heading: ${hasRegisterHeading}`);
    console.log(`   ✓ Email field: ${hasRegisterEmail}`);
    console.log(`   ✓ Multiple password fields: ${hasPasswordFields}`);

    await page.screenshot({ path: 'test-results/03-register-page-load.png' });

    if (registerURL.includes('404')) {
      results.tests.push({ test: 'Register Page Loads', status: 'FAIL', reason: '404 error' });
      results.failed++;
    } else if (hasRegisterHeading && hasRegisterEmail && hasPasswordFields) {
      results.tests.push({ test: 'Register Page Loads', status: 'PASS' });
      results.passed++;
      console.log('   ✅ TEST PASSED\n');
    } else {
      results.tests.push({ test: 'Register Page Loads', status: 'FAIL', reason: 'Missing form elements' });
      results.failed++;
      console.log('   ❌ TEST FAILED\n');
    }

    // TEST 4: Register Form Interactivity
    console.log('📝 TEST 4: Register Form Accepts Input');
    const emailInputReg = await page.locator('input[type="email"]').first();
    const passwordInputsReg = await page.locator('input[type="password"]').all();

    if (emailInputReg && passwordInputsReg.length >= 2) {
      await emailInputReg.fill('newuser@example.com');
      await passwordInputsReg[0].fill('SecurePass123');
      await passwordInputsReg[1].fill('SecurePass123');

      const emailValue = await emailInputReg.inputValue();
      const password1Value = await passwordInputsReg[0].inputValue();
      const password2Value = await passwordInputsReg[1].inputValue();

      const emailCorrect = emailValue === 'newuser@example.com';
      const passwordsCorrect = password1Value === 'SecurePass123' && password2Value === 'SecurePass123';

      console.log(`   Email input value: ${emailValue}`);
      console.log(`   Password 1 value: ${password1Value}`);
      console.log(`   Password 2 value: ${password2Value}`);
      console.log(`   ✓ Email accepts input: ${emailCorrect}`);
      console.log(`   ✓ Password fields accept input: ${passwordsCorrect}`);

      await page.screenshot({ path: 'test-results/04-register-form-filled.png' });

      if (emailCorrect && passwordsCorrect) {
        results.tests.push({ test: 'Register Form Interactivity', status: 'PASS' });
        results.passed++;
        console.log('   ✅ TEST PASSED\n');
      } else {
        results.tests.push({ test: 'Register Form Interactivity', status: 'FAIL' });
        results.failed++;
        console.log('   ❌ TEST FAILED\n');
      }
    } else {
      results.tests.push({ test: 'Register Form Interactivity', status: 'FAIL', reason: 'Form inputs not found' });
      results.failed++;
      console.log('   ❌ TEST FAILED (inputs not found)\n');
    }

    // TEST 5: Verify Navigation Links
    console.log('📝 TEST 5: Navigation Links Exist');
    await page.goto('http://localhost:8000/auth/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const loginContent2 = await page.content();
    const hasSignUpLink = loginContent2.includes('/auth/register');
    const hasForgotLink = loginContent2.includes('/auth/forgot-password') || loginContent2.includes('Forgot password');

    console.log(`   ✓ Sign up link exists: ${hasSignUpLink}`);
    console.log(`   ✓ Forgot password link exists: ${hasForgotLink}`);

    if (hasSignUpLink) {
      results.tests.push({ test: 'Navigation Links', status: 'PASS' });
      results.passed++;
      console.log('   ✅ TEST PASSED\n');
    } else {
      results.tests.push({ test: 'Navigation Links', status: 'FAIL' });
      results.failed++;
      console.log('   ❌ TEST FAILED\n');
    }

  } catch (err) {
    console.error('❌ Test Error:', err.message);
    results.tests.push({ test: 'Suite Error', status: 'ERROR', error: err.message });
    results.failed++;
  }

  // Cleanup
  await browser.close();

  // Save results
  fs.writeFileSync('test-results/playwright-results.json', JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('='.repeat(60));
  console.log('\nScreenshots saved in test-results/');
  console.log('Full results in test-results/playwright-results.json\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
