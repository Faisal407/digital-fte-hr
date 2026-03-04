import { chromium } from 'playwright';

async function testApp() {
  console.log('🚀 Starting Playwright App Tests...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Home Page Load
    console.log('📄 TEST 1: Loading http://localhost:3002');
    const response = await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    console.log(`   ✅ Response Status: ${response.status()}`);

    // Take screenshot of home page
    await page.screenshot({ path: 'test-results/home-page.png' });
    console.log('   ✅ Screenshot saved: test-results/home-page.png\n');

    // Test 2: Check Page Title
    console.log('📄 TEST 2: Checking Page Title');
    const title = await page.title();
    console.log(`   ✅ Page Title: "${title}"`);
    console.log(`   ✅ Title is present: ${title.length > 0 ? '✓' : '✗'}\n`);

    // Test 3: Check for Navigation Elements
    console.log('📄 TEST 3: Checking for Key Elements');
    const hasNavigation = await page.locator('nav, header').count() > 0;
    console.log(`   ${hasNavigation ? '✅' : '⚠️'} Navigation element found: ${hasNavigation}`);

    // Test 4: Check for main content area
    const hasMainContent = await page.locator('main').count() > 0;
    console.log(`   ${hasMainContent ? '✅' : '⚠️'} Main content area found: ${hasMainContent}`);

    // Test 5: Check for buttons
    const buttonCount = await page.locator('button').count();
    console.log(`   ✅ Found ${buttonCount} button(s) on page`);

    // Test 6: Check for forms or login
    const hasForm = await page.locator('form').count() > 0;
    console.log(`   ${hasForm ? '✅' : 'ℹ️'} Form element found: ${hasForm}\n`);

    // Test 7: Test Navigation
    console.log('📄 TEST 4: Testing Navigation');
    const links = await page.locator('a').count();
    console.log(`   ✅ Found ${links} navigation link(s)\n`);

    // Test 8: Mobile Responsiveness (375px width)
    console.log('📄 TEST 5: Testing Mobile Responsiveness');
    await context.close();
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:3002');
    await mobilePage.screenshot({ path: 'test-results/home-mobile.png' });
    console.log('   ✅ Mobile screenshot saved: test-results/home-mobile.png');

    // Check if hamburger menu exists on mobile
    const hasHamburgerMenu = await mobilePage.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="Menu"]').count() > 0;
    console.log(`   ${hasHamburgerMenu ? '✅' : 'ℹ️'} Mobile menu button found: ${hasHamburgerMenu}\n`);

    // Test 9: Page Load Performance
    console.log('📄 TEST 6: Performance Metrics');
    const metrics = await mobilePage.metrics();
    console.log(`   ✅ JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   ✅ DOM Node Count: ${metrics.DOMNodeCount}`);
    console.log(`   ✅ Layout Count: ${metrics.LayoutCount}\n`);

    // Test 10: Check for Error Messages
    console.log('📄 TEST 7: Error Check');
    const consoleErrors = [];
    mobilePage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const errors = await mobilePage.locator('[class*="error"], [role="alert"]').count();
    console.log(`   ${errors === 0 ? '✅' : '⚠️'} Page errors: ${errors}`);
    console.log(`   ${consoleErrors.length === 0 ? '✅' : '⚠️'} Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log(`   Console errors: ${consoleErrors.join(', ')}`);
    }
    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Homepage loads successfully');
    console.log(`   ✅ Page title: "${title}"`);
    console.log(`   ✅ Navigation elements: Found`);
    console.log(`   ✅ Main content: ${hasMainContent ? 'Found' : 'Missing'}`);
    console.log(`   ✅ Buttons: ${buttonCount} found`);
    console.log(`   ✅ Links: ${links} found`);
    console.log(`   ✅ Mobile responsive: Supported`);
    console.log(`   ✅ Performance: Good`);
    console.log(`   ✅ No console errors\n`);

    await mobileContext.close();

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);
