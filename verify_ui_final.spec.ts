import { test, expect } from '@playwright/test';

test('verify home page and dark mode', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for the hero section
  await page.waitForSelector('h2');

  // Take screenshot of home page (Light Mode)
  await page.screenshot({ path: 'home-light.png' });

  // Switch to dark mode
  const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  await themeToggle.click();

  // Take screenshot immediately after click
  await page.screenshot({ path: 'home-after-click.png' });

  // Wait for html class to contain 'dark'
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'), { timeout: 5000 }).catch(() => console.log('Timeout waiting for dark class'));

  // Take screenshot of home page (Dark Mode)
  await page.screenshot({ path: 'home-dark.png' });

  // Search for Calculator
  await page.fill('input[placeholder*="Rechercher"]', 'Calculatrice');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'search-results.png' });

  // Click on Calculator tool card
  await page.click('h3:has-text("Calculatrice")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'after-tool-click.png' });

  // Wait for calculator to be visible (look for the "Standard" mode button)
  await page.waitForSelector('button:has-text("Standard")');

  // Take screenshot of Calculator (Dark Mode)
  await page.screenshot({ path: 'calculator-dark.png' });

  // Switch back to light mode
  await themeToggle.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'calculator-light.png' });
});
