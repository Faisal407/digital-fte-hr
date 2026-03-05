import { chromium } from 'playwright';

const VERCEL_URL = 'https://web-one-ivory-84.vercel.app';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Testing login error message...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill form
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);

    // Submit
    await page.click('button[type="submit"]');
    console.log(`Form submitted, waiting 5s...`);
    await page.waitForTimeout(5000);

    // Check for error messages/alerts
    const alerts = await page.locator('[role="alert"]').all();
    console.log(`\nFound ${alerts.length} alert elements`);
    
    for (let i = 0; i < alerts.length; i++) {
      const text = await alerts[i].innerText();
      console.log(`Alert ${i}: ${text}`);
    }

    // Check for destructive variant (error) alerts
    const errorAlerts = await page.locator('[role="alert"][class*="destructive"]').all();
    console.log(`\nFound ${errorAlerts.length} error alerts`);
    for (let i = 0; i < errorAlerts.length; i++) {
      const text = await errorAlerts[i].innerText();
      console.log(`Error Alert ${i}: ${text}`);
    }

    // Get all page text
    const pageText = await page.innerText('body');
    console.log(`\nFull page text length: ${pageText.length}`);
    
    // Look for error keywords
    if (pageText.includes('Invalid')) console.log(`✓ Contains "Invalid"`);
    if (pageText.includes('Error')) console.log(`✓ Contains "Error"`);
    if (pageText.includes('error')) console.log(`✓ Contains "error"`);
    if (pageText.includes('not found')) console.log(`✓ Contains "not found"`);
    if (pageText.includes('Application error')) console.log(`✗ Contains "Application error"`);
    if (pageText.includes('exception')) console.log(`✗ Contains "exception"`);

    // Take screenshot
    await page.screenshot({ path: 'login-error-check.png' });
    console.log(`\nScreenshot saved`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
