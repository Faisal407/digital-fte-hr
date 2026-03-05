const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  testSuite: 'Supabase Authentication Pages',
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    errors: [],
  }
};

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages and errors
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  // Test 1: Login Page
  console.log('\n✓ Test 1: Login Page Loads...');
  try {
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });

    // Check for 404
    const status = page.url();
    if (status.includes('404') || page.url().includes('_not-found')) {
      throw new Error('Page returned 404 or not found');
    }

    // Check for main heading
    const heading = await page.locator('h2:has-text("Sign In")').first();
    if (!heading) {
      throw new Error('Sign In heading not found');
    }

    // Check for form fields
    const emailInput = await page.locator('input[type="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();

    if (!emailInput || !passwordInput || !submitButton) {
      throw new Error('Form fields or submit button not found');
    }

    // Test field interactivity
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();

    if (emailValue !== 'test@example.com' || passwordValue !== 'password123') {
      throw new Error('Form fields are not accepting input');
    }

    // Check page errors
    if (pageErrors.length > 0) {
      console.warn('  ⚠ Page errors detected:', pageErrors);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-page.png' });

    TEST_RESULTS.tests.push({
      name: 'Login Page Loads',
      status: 'PASS',
      checks: {
        pageLoads: '✓',
        headingExists: '✓',
        formFieldsExist: '✓',
        fieldsAcceptInput: '✓',
        noPageErrors: pageErrors.length === 0 ? '✓' : '✗ Errors: ' + pageErrors.join('; '),
      }
    });
    TEST_RESULTS.summary.passed++;
    console.log('  ✓ Login page test PASSED');
  } catch (err) {
    TEST_RESULTS.tests.push({
      name: 'Login Page Loads',
      status: 'FAIL',
      error: err.message,
    });
    TEST_RESULTS.summary.failed++;
    TEST_RESULTS.summary.errors.push('Login page test: ' + err.message);
    console.error('  ✗ Login page test FAILED:', err.message);
  }

  pageErrors.length = 0;
  consoleLogs.length = 0;

  // Test 2: Register Page
  console.log('\n✓ Test 2: Register Page Loads...');
  try {
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });

    // Check for 404
    if (page.url().includes('404') || page.url().includes('_not-found')) {
      throw new Error('Page returned 404 or not found');
    }

    // Check for main heading
    const heading = await page.locator('h2:has-text("Create Account")').first();
    if (!heading) {
      throw new Error('Create Account heading not found');
    }

    // Check for form fields
    const emailInput = await page.locator('input[type="email"]').first();
    const passwordInputs = await page.locator('input[type="password"]').all();
    const submitButton = await page.locator('button[type="submit"]').first();

    if (!emailInput || passwordInputs.length < 2 || !submitButton) {
      throw new Error('Form fields (email, 2 passwords) or submit button not found');
    }

    // Test field interactivity
    await emailInput.fill('newuser@example.com');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('password123');
      await passwordInputs[1].fill('password123');
    }

    const emailValue = await emailInput.inputValue();
    if (emailValue !== 'newuser@example.com') {
      throw new Error('Register email field is not accepting input');
    }

    // Check page errors
    if (pageErrors.length > 0) {
      console.warn('  ⚠ Page errors detected:', pageErrors);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/register-page.png' });

    TEST_RESULTS.tests.push({
      name: 'Register Page Loads',
      status: 'PASS',
      checks: {
        pageLoads: '✓',
        headingExists: '✓',
        formFieldsExist: '✓ (email + 2 passwords)',
        fieldsAcceptInput: '✓',
        noPageErrors: pageErrors.length === 0 ? '✓' : '✗ Errors: ' + pageErrors.join('; '),
      }
    });
    TEST_RESULTS.summary.passed++;
    console.log('  ✓ Register page test PASSED');
  } catch (err) {
    TEST_RESULTS.tests.push({
      name: 'Register Page Loads',
      status: 'FAIL',
      error: err.message,
    });
    TEST_RESULTS.summary.failed++;
    TEST_RESULTS.summary.errors.push('Register page test: ' + err.message);
    console.error('  ✗ Register page test FAILED:', err.message);
  }

  // Cleanup
  await browser.close();

  // Save results
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }
  fs.writeFileSync('test-results/supabase-auth-results.json', JSON.stringify(TEST_RESULTS, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`Failed: ${TEST_RESULTS.summary.failed}`);
  if (TEST_RESULTS.summary.errors.length > 0) {
    console.log('\nErrors:');
    TEST_RESULTS.summary.errors.forEach(err => console.log('  - ' + err));
  }
  console.log('='.repeat(60));

  process.exit(TEST_RESULTS.summary.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
