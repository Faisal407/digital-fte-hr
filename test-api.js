import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  const requests = [];
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      requests.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
      console.log(`${response.request().method()} ${response.url()} -> ${response.status()}`);
    }
  });

  console.log('Opening https://digital-fte-hr.vercel.app/dashboard...\n');

  try {
    await page.goto('https://digital-fte-hr.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('Navigation timeout (expected for SPA)');
  }

  console.log('\n=== All API Requests Made ===');
  if (requests.length === 0) {
    console.log('❌ NO API REQUESTS WERE MADE');
  } else {
    requests.forEach(r => console.log(`${r.method} ${r.url} [${r.status}]`));
  }

  await page.waitForTimeout(2000);

  console.log('\n=== Page Title ===');
  console.log(await page.title());

  await browser.close();
})();
