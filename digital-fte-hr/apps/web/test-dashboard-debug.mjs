import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-4p7hu0e48-faisal407s-projects.vercel.app';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[TEST] Starting dashboard fix verification...`);
    console.log(`[TEST] Target URL: ${VERCEL_URL}`);

    // Step 1: Navigate to login
    console.log(`[STEP 1] Navigating to login page...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    console.log(`[✓] Login page loaded`);

    // Debug: Show page title and all inputs
    const title = await page.title();
    console.log(`[DEBUG] Page title: ${title}`);
    
    const inputs = await page.locator('input').all();
    console.log(`[DEBUG] Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const visible = await input.isVisible().catch(() => false);
      console.log(`  [${i}] type=${type}, name=${name}, id=${id}, visible=${visible}`);
    }

    // Try to find visible input fields
    const visibleInputs = page.locator('input:visible');
    const count = await visibleInputs.count();
    console.log(`[DEBUG] Visible inputs: ${count}`);

    // Try different selectors for email
    console.log(`[STEP 2] Attempting to enter email...`);
    try {
      // Try by type
      await page.fill('input[type="email"]', EMAIL, { timeout: 5000 });
      console.log(`[✓] Email entered via type selector`);
    } catch (e) {
      try {
        // Try by name
        await page.fill('input[name*="email"]', EMAIL, { timeout: 5000 });
        console.log(`[✓] Email entered via name selector`);
      } catch (e2) {
        // Try first visible input
        const firstInput = page.locator('input[type="text"], input[type="email"]').first();
        await firstInput.fill(EMAIL, { timeout: 5000 });
        console.log(`[✓] Email entered via first input`);
      }
    }

    // Try different selectors for password
    console.log(`[STEP 3] Attempting to enter password...`);
    try {
      await page.fill('input[type="password"]', PASSWORD, { timeout: 5000 });
      console.log(`[✓] Password entered via type selector`);
    } catch (e) {
      try {
        await page.fill('input[name*="password"]', PASSWORD, { timeout: 5000 });
        console.log(`[✓] Password entered via name selector`);
      } catch (e2) {
        // List all inputs again
        const allInputs = await page.locator('input').all();
        console.log(`[ERROR] Could not find password input. Available inputs: ${allInputs.length}`);
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];
          const type = await input.getAttribute('type');
          console.log(`  [${i}] type=${type}`);
        }
      }
    }

  } catch (error) {
    console.log(`[✗] Test failed:`);
    console.log(error.message);
  } finally {
    await browser.close();
  }
}

test();
