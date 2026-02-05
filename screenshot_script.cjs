const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'desktop_home.png' });

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'mobile_home.png' });

  await browser.close();
})();
