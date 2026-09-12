import { chromium } from 'playwright';

async function testSubmitFlow() {
  console.log('Launching browser to test full submission flow...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to product page...');
    await page.goto('http://localhost:3000/directory/product/75654d1a-3d1f-49f1-8272-05c900cf2ec9', { waitUntil: 'networkidle' });
    
    // Wait for animations
    await page.waitForTimeout(1500);

    console.log('Clicking "Buy Now" to open modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const buyBtn = btns.find(b => b.textContent.includes('Buy Now'));
      if (buyBtn) buyBtn.click();
    });

    await page.waitForTimeout(1000);

    console.log('Selecting Self Pickup option...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.font-bold'));
      const pickupCard = cards.find(c => c.textContent.includes('Self Pickup'));
      if (pickupCard) pickupCard.click();
    });

    await page.waitForTimeout(500);

    console.log('Filling out logistics form...');
    // Type arrival date
    await page.fill('input[name="arrivalDate"]', '2026-09-01');

    // Select visitor count (1 Person is default, so we just fill Person 1)
    await page.fill('input[name="p1Name"]', 'Test User');
    await page.fill('input[name="p1Phone"]', '9998887776');
    await page.fill('input[name="p1Aadhar"]', '123412341234');

    console.log('Submitting form...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.textContent.includes('Confirm Logistics'));
      if (confirmBtn) confirmBtn.click();
    });

    // Wait for the "Logistics Confirmed" success screen
    await page.waitForTimeout(2000);

    const successPath = 'C:/Users/rsevm/.gemini/antigravity-ide/brain/ea0df7ef-0595-42b7-92fa-7b9e30b5ba98/scratch/success_preview.png';
    console.log(`Taking success screenshot to ${successPath}...`);
    await page.screenshot({ path: successPath });
    
    console.log('Done!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testSubmitFlow();
