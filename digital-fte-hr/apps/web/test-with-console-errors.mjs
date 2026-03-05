import { chromium } from 'playwright';

const VERCEL_URL = 'https://web-one-ivory-84.vercel.app';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location().url
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
  });

  try {
    console.log(`Testing login with console capture...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Fill and submit
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    
    console.log(`Form submitted, waiting for error...`);
    await page.waitForTimeout(4000);

    console.log(`\n=== CONSOLE LOGS (${consoleLogs.length} entries) ===`);
    consoleLogs.forEach((log, i) => {
      if (log.type === 'error' || log.type === 'warning') {
        console.log(`[${log.type.toUpperCase()}] ${log.text}`);
      }
    });

    console.log(`\n=== PAGE ERRORS (${pageErrors.length} entries) ===`);
    pageErrors.forEach(err => {
      console.log(err);
    });

    if (pageErrors.length === 0 && consoleLogs.filter(l => l.type === 'error').length === 0) {
      console.log(`No obvious JavaScript errors detected`);
    }

  } catch (error) {
    console.log(`Playwright error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
