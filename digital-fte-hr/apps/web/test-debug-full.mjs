import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-4p7hu0e48-faisal407s-projects.vercel.app';

async function test() {
  const browser = await chromium.launch({ headless: false }); // headless: false to see the browser
  const page = await browser.newPage();

  try {
    console.log(`[TEST] Navigating to login page...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    console.log(`[✓] Login page loaded`);
    console.log(`[INFO] Browser will stay open for 10 seconds so you can inspect it manually`);
    console.log(`[INFO] Check the browser window to see the login form structure`);
    
    // Wait 10 seconds for manual inspection
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log(`[✗] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
