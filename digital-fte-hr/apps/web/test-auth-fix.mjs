import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-4p7hu0e48-faisal407s-projects.vercel.app';
const USERNAME = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.toString());
    console.log(`🔴 JS ERROR: ${error.toString()}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✨ FINAL TEST - Auth Context & Dashboard Protection');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Access dashboard directly (should redirect to login)
    console.log('📝 Step 1: Accessing dashboard without login...');
    await page.goto(`${VERCEL_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const currentUrl1 = page.url();
    console.log(`   URL after access: ${currentUrl1}`);
    if (currentUrl1.includes('/auth/login')) {
      console.log('   ✅ REDIRECTED TO LOGIN (correct!)\n');
    } else {
      console.log('   ❌ Did not redirect to login\n');
    }

    // Step 2: Fill login form
    console.log('📝 Step 2: Filling login form...');
    await page.locator('input[type="email"]').fill(USERNAME);
    console.log(`   ✅ Email filled: ${USERNAME}`);
    
    await page.locator('input[type="password"]').fill(PASSWORD);
    console.log(`   ✅ Password filled\n`);

    // Step 3: Submit login
    console.log('📝 Step 3: Submitting login...');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(4000);
    
    const currentUrl2 = page.url();
    console.log(`   Current URL: ${currentUrl2}\n`);

    // Step 4: Check for dashboard content
    console.log('📝 Step 4: Checking dashboard...');
    const hasSidebar = await page.locator('[data-testid="dashboard-sidebar"], nav, aside').isVisible().catch(() => false);
    const hasHeader = await page.locator('header').isVisible().catch(() => false);
    const hasContent = await page.locator('main').isVisible().catch(() => false);
    const hasError = await page.locator('text=Application error').isVisible().catch(() => false);

    console.log(`   Sidebar visible: ${hasSidebar ? '✅' : '❌'}`);
    console.log(`   Header visible: ${hasHeader ? '✅' : '❌'}`);
    console.log(`   Content visible: ${hasContent ? '✅' : '❌'}`);
    console.log(`   Application error: ${hasError ? '❌ ERROR!' : '✅ NONE'}\n`);

    // Step 5: Take screenshot
    await page.screenshot({ path: './auth-fix-result.png' });
    console.log('📸 Screenshot: ./auth-fix-result.png\n');

    // Summary
    console.log('='.repeat(70));
    if (!hasError && (hasSidebar || hasHeader || hasContent)) {
      console.log('✅ SUCCESS! Dashboard loads without errors after login!');
      console.log('='.repeat(70));
      console.log('\n🎉 THE FIX WORKS! Authentication context is working properly!\n');
    } else if (hasError) {
      console.log('❌ FAILED: Application error still showing\n');
    } else {
      console.log('⚠️  Dashboard structure not detected\n');
    }

    if (jsErrors.length === 0) {
      console.log('✅ NO JavaScript errors!\n');
    } else {
      console.log(`❌ JavaScript errors: ${jsErrors.length}\n`);
      jsErrors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('⏳ Browser staying open for 8 seconds...\n');
    await page.waitForTimeout(8000);
    await browser.close();
  }
}

test();
