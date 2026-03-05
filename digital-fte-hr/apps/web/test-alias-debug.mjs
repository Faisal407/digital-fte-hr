import { chromium } from 'playwright';

const VERCEL_URL = 'https://web-one-ivory-84.vercel.app';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[TEST] Navigating to ${VERCEL_URL}/auth/login`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    
    console.log(`[STEP 1] Taking screenshot before form interaction...`);
    await page.screenshot({ path: 'alias-form-debug.png' });
    console.log(`✅ Screenshot saved`);

    console.log(`\n[STEP 2] Checking page elements...`);
    const inputCount = await page.locator('input').count();
    console.log(`Found ${inputCount} input elements`);

    // List all input details
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const visible = await input.isVisible();
      console.log(`  [${i}] type=${type}, id=${id}, name=${name}, visible=${visible}`);
    }

    console.log(`\n[STEP 3] Trying different selectors...`);
    
    // Try to fill with different selectors
    const selectors = [
      'input[type="email"]',
      '#email',
      'input[name*="email"]',
      'input[placeholder*="email"]',
    ];

    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`  Selector "${selector}": found ${count} elements`);
        if (count > 0) {
          const elem = page.locator(selector).first();
          const visible = await elem.isVisible();
          console.log(`    → First element visible: ${visible}`);
        }
      } catch (e) {
        console.log(`  Selector "${selector}": error - ${e.message}`);
      }
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
