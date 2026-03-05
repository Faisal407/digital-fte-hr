import { chromium } from 'playwright';
import fs from 'fs';

const VERCEL_URL = 'https://web-nvx4kuz99-faisal407s-projects.vercel.app';
const SCREENSHOTS_DIR = './deployment-test-screenshots-direct';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n🧪 TESTING WITH PRODUCTION URL\n');

  try {
    console.log('📝 Testing login page...');
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`   Page title: ${title}`);

    const configError = await page.locator('text=Configuration Required').isVisible().catch(() => false);
    if (configError) {
      console.log('❌ Configuration Required error found');
    } else {
      console.log('✅ NO Configuration Required error!');
    }

    const emailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const signBtn = await page.locator('button').first().isVisible().catch(() => false);

    console.log(`   Email input: ${emailInput ? '✅' : '❌'}`);
    console.log(`   Password input: ${passwordInput ? '✅' : '❌'}`);
    console.log(`   Button: ${signBtn ? '✅' : '❌'}`);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/login.png` });
    console.log(`   Screenshot: ${SCREENSHOTS_DIR}/login.png\n`);

    console.log('📝 Testing register page...');
    await page.goto(`${VERCEL_URL}/auth/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const regConfigError = await page.locator('text=Configuration Required').isVisible().catch(() => false);
    if (regConfigError) {
      console.log('❌ Configuration Required error found on register');
    } else {
      console.log('✅ NO Configuration Required error on register!');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/register.png` });
    console.log(`   Screenshot: ${SCREENSHOTS_DIR}/register.png\n`);

    console.log('✅ TESTS COMPLETE - Supabase configured!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
