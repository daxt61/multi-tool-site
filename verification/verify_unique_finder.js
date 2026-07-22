import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jules/verification/videos',
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Navigate to the tool
    console.log('Navigating to List Unique Finder...');
    await page.goto('http://localhost:5173/en/outil/list-unique-finder');
    await page.waitForTimeout(1000);

    // Fill sample list
    console.log('Filling input list...');
    const inputArea = page.locator('#unique-input');
    await inputArea.fill('apple\nbanana\napple\norange\nbanana\npear\n');
    await page.waitForTimeout(1000);

    // Select Frequency Count mode
    console.log('Selecting Frequency Count mode...');
    const freqButton = page.getByRole('button', { name: 'Frequency Count', exact: true });
    await freqButton.click();
    await page.waitForTimeout(1000);

    // Select Count formatting
    console.log('Selecting count-item template...');
    const templateSelect = page.locator('#template-select');
    await templateSelect.selectOption('count-item');
    await page.waitForTimeout(1000);

    // Sort by Count Descending
    console.log('Sorting by Count Descending...');
    const countDescButton = page.getByRole('button', { name: 'Count Descending', exact: true });
    await countDescButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot at final state
    console.log('Taking screenshot...');
    await page.screenshot({ path: '/home/jules/verification/screenshots/verification.png' });
    await page.waitForTimeout(1000);

    console.log('Verification completed successfully.');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
