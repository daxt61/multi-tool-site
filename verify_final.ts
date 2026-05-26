import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Starting the dev server
  const { exec } = require('child_process');
  const server = exec('pnpm dev');

  try {
    // Wait for dev server
    let attempts = 0;
    while (attempts < 10) {
      try {
        await page.goto('http://localhost:5173/fr/outil/css-clamp-generator');
        break;
      } catch (e) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Check for "Résultat" instead of "COMMON.RESULT"
    const resultText = await page.textContent('h2');
    console.log('Result Header (FR):', resultText);

    await page.screenshot({ path: 'final_check_fr.png' });

    await page.goto('http://localhost:5173/en/outil/css-clamp-generator');
    const resultTextEn = await page.textContent('h2');
    console.log('Result Header (EN):', resultTextEn);
    await page.screenshot({ path: 'final_check_en.png' });

  } finally {
    server.kill();
    await browser.close();
  }
})();
