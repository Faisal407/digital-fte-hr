import { chromium } from 'playwright';
import * as fs from 'fs';

async function testAuthDebug() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });

  try {
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto('http://localhost:3001/auth/login');
    console.log('✅ Login page loaded\n');

    await page.fill('input[type="email"]', 'notreal@example.com');
    await page.fill('input[type="password"]', 'Password123');
    console.log('📝 Form filled\n');

    await page.click('button:has-text("Sign In")');
    console.log('📍 Sign In button clicked\n');

    await page.waitForTimeout(3000);

    // Take screenshot to see what's on page
    await page.screenshot({ path: 'test-results/debug-01-after-click.png', fullPage: true });
    console.log('📸 Screenshot saved\n');

    // Get page content
    const allText = await page.textContent('body');
    console.log('=== PAGE CONTENT ===');
    console.log(allText ? allText.substring(0, 1000) : 'No text found');
    console.log('====================\n');

    // Check for error alerts
    const alertDivs = await page.locator('[role="alert"]').count();
    console.log(`Found ${alertDivs} alert elements\n`);

    if (alertDivs > 0) {
      for (let i = 0; i < alertDivs; i++) {
        const alertText = await page.locator('[role="alert"]').nth(i).textContent();
        console.log(`Alert ${i + 1}: "${alertText}"`);
      }
    }

    // Check for any error divs
    const errorDivs = await page.locator('[class*="destructive"]').count();
    console.log(`\nFound ${errorDivs} destructive elements`);

    // Check all divs with "Error" in text
    const errorText = await page.locator('text=/Error|error|Account|password/i').count();
    console.log(`Found ${errorText} elements with error-related text\n`);

    // List all visible text content
    const allVisibleText = await page.locator('body *:visible').allTextContents();
    console.log('=== VISIBLE TEXT ELEMENTS ===');
    allVisibleText.slice(0, 20).forEach((text, i) => {
      if (text.trim()) console.log(`${i}: ${text.trim()}`);
    });

    await context.close();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthDebug().catch(console.error);
