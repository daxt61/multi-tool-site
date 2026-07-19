import { chromium } from 'playwright';
import { exec } from 'child_process';

async function run() {
  console.log('Starting visual verification for CSS to Tailwind CSS...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jules/verification/videos',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to the tool
    console.log('Navigating to CSS to Tailwind tool...');
    await page.goto('http://localhost:5173/en/outil/css-to-tailwind');
    await page.waitForTimeout(1000);

    // 2. Input CSS declarations
    console.log('Entering CSS style...');
    const inputArea = page.locator('#css-input');
    await inputArea.fill(`/* Card container styles */
.card-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 32px;
  background-color: #3b82f6;
  border-radius: 12px;
  box-sizing: border-box;
}
`);
    await page.waitForTimeout(1500);

    // 3. Take screenshot of mapped result
    console.log('Taking screenshot...');
    await page.screenshot({ path: '/home/jules/verification/screenshots/css_to_tailwind.png' });
    await page.waitForTimeout(1000);

    console.log('Verification completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await context.close();
    await browser.close();
  }
}

run();
