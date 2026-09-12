import { chromium } from 'playwright';

async function captureScreen() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();

  console.log('Navigating to website...');
  await page.goto('http://localhost:3000/directory/product/75654d1a-3d1f-49f1-8272-05c900cf2ec9', { waitUntil: 'networkidle', timeout: 120000 });

  // Wait a moment for Framer Motion animations
  await page.waitForTimeout(1500);

  const screenshotPath = 'C:/Users/rsevm/.gemini/antigravity-ide/brain/3094e63b-a814-4db8-ab94-b7579ca74db0/scratch/product_preview.png';
  console.log(`Taking screenshot to ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log('Clicking Buy Now button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const buyNowBtn = buttons.find(b => b.textContent.includes('Buy Now'));
    if (buyNowBtn) buyNowBtn.click();
  });

  // Wait for modal animation
  await page.waitForTimeout(1000);

  const modalPath = 'C:/Users/rsevm/.gemini/antigravity-ide/brain/3094e63b-a814-4db8-ab94-b7579ca74db0/scratch/modal_preview.png';
  console.log(`Taking modal screenshot to ${modalPath}...`);
  await page.screenshot({ path: modalPath });

  console.log('Done!');
  await browser.close();
}

captureScreen().catch(console.error);
