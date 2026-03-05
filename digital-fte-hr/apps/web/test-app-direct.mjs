import { chromium } from 'playwright';

const VERCEL_URL = 'https://digital-fte-4p7hu0e48-faisal407s-projects.vercel.app';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[TEST] Checking app deployment...`);
    
    // Try main page
    console.log(`\n1. Checking root (/)...`);
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    const rootTitle = await page.title();
    const rootUrl = page.url();
    console.log(`   Title: "${rootTitle}"`);
    console.log(`   URL: ${rootUrl}`);
    
    // Try dashboard directly
    console.log(`\n2. Checking dashboard directly...`);
    await page.goto(`${VERCEL_URL}/dashboard`, { waitUntil: 'networkidle' });
    const dashboardTitle = await page.title();
    const dashboardUrl = page.url();
    console.log(`   Title: "${dashboardTitle}"`);
    console.log(`   URL: ${dashboardUrl}`);
    
    // Try our custom login
    console.log(`\n3. Checking /auth/login...`);
    await page.goto(`${VERCEL_URL}/auth/login`, { waitUntil: 'networkidle' });
    const loginTitle = await page.title();
    const loginUrl = page.url();
    console.log(`   Title: "${loginTitle}"`);
    console.log(`   URL: ${loginUrl}`);
    
    // Check page content
    const pageContent = await page.innerText('body');
    if (pageContent.includes('Supabase')) {
      console.log(`   ✓ Supabase login form found`);
    } else if (pageContent.includes('Vercel')) {
      console.log(`   ✗ Vercel auth page (not our app!)`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'deployment-check.png' });
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

test();
