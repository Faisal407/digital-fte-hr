const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing Login Page...');
  await page.goto('http://localhost:3000/auth/login');

  await page.waitForLoadState('networkidle');
  const content = await page.content();
  const url = page.url();

  console.log('URL:', url);
  console.log('Contains "Sign In":', content.includes('Sign In'));
  console.log('Contains "Configuration Required":', content.includes('Configuration Required'));

  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }
  await page.screenshot({ path: 'test-results/login-screenshot.png' });

  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input elements\n');

  console.log('Testing Register Page...');
  await page.goto('http://localhost:3000/auth/register');
  await page.waitForLoadState('networkidle');

  const regContent = await page.content();
  console.log('URL:', page.url());
  console.log('Contains "Create Account":', regContent.includes('Create Account'));

  await page.screenshot({ path: 'test-results/register-screenshot.png' });
  const regInputs = await page.locator('input').all();
  console.log('Found', regInputs.length, 'input elements');

  await browser.close();
  console.log('\n✓ Tests completed - screenshots saved in test-results/');
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
