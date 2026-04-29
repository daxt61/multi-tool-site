import { test, expect } from '@playwright/test';

test('search input has an accessible label', async ({ page }) => {
  await page.goto('http://localhost:5173/outil/cursor-reference');
  // Check if the search input can be found by its label
  const searchInput = page.getByLabel('Rechercher un curseur');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute('id', 'cursor-search');
});

test('copy button is visible on focus for keyboard users', async ({ page }) => {
  await page.goto('http://localhost:5173/outil/cursor-reference');

  // Wait for the tool to load and render cards
  await page.waitForSelector('h4');

  // Find a cursor card by its heading 'default'
  const defaultHeading = page.getByRole('heading', { name: /^default$/ });
  const defaultCard = page.locator('div').filter({ has: defaultHeading }).first();

  // The copy button should be inside the card
  const copyButton = defaultCard.getByRole('button', { name: /Copier le CSS pour default/i });

  // Verify it has the expected classes
  await expect(copyButton).toHaveClass(/z-20/);
  await expect(copyButton).toHaveClass(/md:focus-visible:opacity-100/);

  // Focus the button
  await copyButton.focus();

  // We can also check if it's the active element
  const isActive = await page.evaluate((btn) => document.activeElement === btn, await copyButton.elementHandle());
  expect(isActive).toBe(true);
});
