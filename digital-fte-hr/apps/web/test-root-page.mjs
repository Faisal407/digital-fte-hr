import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Testing root page...`);
    await page.goto('https://web-one-ivory-84.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const errorCount = await page.locator('text=/Application error/i').count();
    const content = await page.innerText('body');
    
    console.log(`Error found: ${errorCount > 0}`);
    console.log(`Page content length: ${content.length}`);
    console.log(`Contains "Login": ${content.includes('Login')}`);
    console.log(`Contains "Welcome": ${content.includes('Welcome')}`);
    
    if (content.includes('Application error')) {
      console.log(`\nError message: ${content}`);
    }
    
    await page.screenshot({ path: 'root-page-test.png' });
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
