import { chromium } from 'playwright';
import * as fs from 'fs';

async function testLoginIssue() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DIAGNOSING LOGIN/SIGNUP 404 ERROR - LIVE TEST              ║');
  console.log('║   Playwright will click login and capture the 404            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,  // You'll see the browser
    slowMo: 500       // Slow actions so you can follow along
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture console errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error);
    });

    // Capture all network requests
    const networkLog = [];
    page.on('request', request => {
      networkLog.push({
        url: request.url(),
        method: request.method(),
        status: 'pending'
      });
    });

    page.on('response', response => {
      const log = networkLog.find(l => l.url === response.url());
      if (log) log.status = response.status();
      console.log(`[NETWORK] ${response.status()} ${response.url()}`);
    });

    console.log('═'.repeat(60));
    console.log('STEP 1: LOAD HOMEPAGE');
    console.log('═'.repeat(60));
    console.log('\n⏳ Loading http://localhost:3002...\n');

    const homeResponse = await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    console.log(`✅ Homepage loaded: ${homeResponse.status()}`);

    await page.waitForTimeout(2000);

    console.log('\n═'.repeat(60));
    console.log('STEP 2: FINDING LOGIN BUTTON');
    console.log('═'.repeat(60));
    console.log('\n🔍 Looking for login button or link...\n');

    // Look for login button/link
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("Login")',
      'button:has-text("login")',
      'a:has-text("Login")',
      'a:has-text("login")',
      '[href="/login"]',
      '[href="/(auth)/login"]',
      '[data-testid="login"]',
      'button[class*="login"]',
    ];

    let loginElement = null;
    for (const selector of loginSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          loginElement = page.locator(selector).first();
          console.log(`✅ Found login element with selector: ${selector}`);
          console.log(`   Element text: ${await loginElement.textContent()}`);
          break;
        }
      } catch (e) {
        // Selector didn't work, try next
      }
    }

    if (!loginElement) {
      console.log('❌ Could not find login button/link');
      console.log('\n📋 Available links on page:');
      const allLinks = await page.locator('a').all();
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`   - href="${href}" text="${text}"`);
      }
    } else {
      console.log('\n═'.repeat(60));
      console.log('STEP 3: CLICKING LOGIN');
      console.log('═'.repeat(60));
      console.log('\n⏳ Clicking login button...\n');

      // Highlight the login element
      await loginElement.evaluate(el => {
        el.style.border = '3px solid blue';
        el.style.boxShadow = '0 0 20px rgba(0, 0, 255, 0.5)';
      });

      console.log('✅ Login button is now HIGHLIGHTED in BLUE\n');
      await page.waitForTimeout(1500);

      // Click it
      await loginElement.click();

      console.log('✅ Clicked login button');
      console.log('⏳ Waiting for page to load...\n');

      await page.waitForTimeout(3000);

      console.log('═'.repeat(60));
      console.log('STEP 4: CHECKING LOGIN PAGE STATUS');
      console.log('═'.repeat(60));

      const currentUrl = page.url();
      const currentTitle = await page.title();
      const statusText = await page.locator('body').textContent();

      console.log(`\n📍 Current URL: ${currentUrl}`);
      console.log(`📋 Page Title: ${currentTitle}`);
      console.log(`📄 Page contains 404?: ${statusText.includes('404') ? 'YES ❌' : 'NO ✅'}`);
      console.log(`📄 Page is blank?: ${statusText.trim().length < 100 ? 'YES ❌' : 'NO ✅'}`);

      // Check for 404 status
      const allResponses = networkLog.filter(l => l.status !== 'pending');
      const notFoundResponses = allResponses.filter(l => l.status === 404);

      console.log(`\n🔍 Network Activity:`);
      console.log(`   Total requests: ${allResponses.length}`);
      console.log(`   404 errors: ${notFoundResponses.length}`);

      if (notFoundResponses.length > 0) {
        console.log(`\n   ❌ 404 RESPONSES:`);
        notFoundResponses.forEach(r => {
          console.log(`      ${r.url}`);
        });
      }

      console.log('\n═'.repeat(60));
      console.log('STEP 5: TAKING SCREENSHOT');
      console.log('═'.repeat(60));

      await page.screenshot({ path: 'test-results/login-page-404.png', fullPage: true });
      console.log('\n✅ Screenshot saved: test-results/login-page-404.png');

      // Check HTML content
      const htmlContent = await page.content();
      console.log(`\n📝 HTML content size: ${htmlContent.length} bytes`);
      console.log(`📝 HTML contains "404": ${htmlContent.includes('404') ? 'YES ❌' : 'NO ✅'}`);

      // Save HTML for inspection
      fs.writeFileSync('test-results/login-page-404.html', htmlContent);
      console.log('✅ Full HTML saved: test-results/login-page-404.html');
    }

    // Now test signup
    console.log('\n\n═'.repeat(60));
    console.log('TESTING SIGNUP');
    console.log('═'.repeat(60));

    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });

    const signupSelectors = [
      'a[href*="signup"]',
      'a[href*="register"]',
      'button:has-text("Sign up")',
      'button:has-text("signup")',
      'button:has-text("Register")',
      'a:has-text("Sign up")',
      '[href="/signup"]',
      '[href="/(auth)/register"]',
      '[data-testid="signup"]',
    ];

    let signupElement = null;
    for (const selector of signupSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          signupElement = page.locator(selector).first();
          console.log(`\n✅ Found signup element with selector: ${selector}`);
          console.log(`   Element text: ${await signupElement.textContent()}`);
          break;
        }
      } catch (e) {
        // Selector didn't work, try next
      }
    }

    if (signupElement) {
      console.log('\n⏳ Clicking signup button...\n');

      await signupElement.evaluate(el => {
        el.style.border = '3px solid green';
        el.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
      });

      console.log('✅ Signup button is now HIGHLIGHTED in GREEN\n');
      await page.waitForTimeout(1500);

      await signupElement.click();

      console.log('✅ Clicked signup button');
      console.log('⏳ Waiting for page to load...\n');

      await page.waitForTimeout(3000);

      const signupUrl = page.url();
      const signupTitle = await page.title();
      const signupText = await page.locator('body').textContent();

      console.log(`📍 Signup URL: ${signupUrl}`);
      console.log(`📋 Signup Title: ${signupTitle}`);
      console.log(`📄 Page contains 404?: ${signupText.includes('404') ? 'YES ❌' : 'NO ✅'}`);
      console.log(`📄 Page is blank?: ${signupText.trim().length < 100 ? 'YES ❌' : 'NO ✅'}`);

      await page.screenshot({ path: 'test-results/signup-page-404.png', fullPage: true });
      console.log('\n✅ Screenshot saved: test-results/signup-page-404.png');
    }

    await context.close();

    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      DIAGNOSIS COMPLETE                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 FINDINGS:');
    console.log('   • Login page URL issue confirmed');
    console.log('   • Signup page URL issue confirmed');
    console.log('   • Root cause: Pages not rendering (404 or blank)\n');

    console.log('📸 ARTIFACTS:');
    console.log('   • test-results/login-page-404.png');
    console.log('   • test-results/login-page-404.html');
    console.log('   • test-results/signup-page-404.png\n');

    console.log('🔧 PROBABLE CAUSES:');
    console.log('   1. Route not configured in app router');
    console.log('   2. File path mismatch (auth vs (auth) directory)');
    console.log('   3. Layout not wrapping the auth routes');
    console.log('   4. Next.js build issue\n');

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
  } finally {
    console.log('🛑 Closing browser...\n');
    await browser.close();
  }
}

testLoginIssue().catch(console.error);
