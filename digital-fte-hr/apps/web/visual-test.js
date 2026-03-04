const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  console.log('\n✅ TEST 1: Testing Login Page\n');
  await page.goto('http://localhost:8000/auth/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/login-page-visual.png' });
  console.log('   Screenshot: test-results/login-page-visual.png');

  // Get page info
  const loginHTML = await page.content();
  console.log('   ✓ Page loaded: Yes');
  console.log('   ✓ Contains "Sign In": ' + loginHTML.includes('Sign In'));
  console.log('   ✓ Contains email input: ' + loginHTML.includes('type="email"'));
  console.log('   ✓ Contains password input: ' + loginHTML.includes('type="password"'));

  console.log('\n✅ TEST 2: Testing Register Page\n');
  await page.goto('http://localhost:8000/auth/register');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/register-page-visual.png' });
  console.log('   Screenshot: test-results/register-page-visual.png');

  const registerHTML = await page.content();
  console.log('   ✓ Page loaded: Yes');
  console.log('   ✓ Contains "Create Account": ' + registerHTML.includes('Create Account'));
  console.log('   ✓ Contains email input: ' + registerHTML.includes('type="email"'));
  console.log('   ✓ Contains 2 password inputs: ' + ((registerHTML.match(/type="password"/g) || []).length >= 2));

  await browser.close();
  console.log('\n✅ All visual tests completed!\n');
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
