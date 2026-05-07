import { test, expect } from '@playwright/test';

test('verify keyboard shortcut and shorthand hex in Color Contrast Checker', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/contrast-checker');

  const foregroundInput = page.locator('input[aria-label="Code hexadécimal de la couleur du texte"]');
  const backgroundInput = page.locator('input[aria-label="Code hexadécimal de la couleur de fond"]');
  const contrastValue = page.locator('.text-6xl.md\\:text-8xl.font-black.text-white.font-mono');

  // Test shorthand hex parsing
  await foregroundInput.fill('#000'); // Black
  await backgroundInput.fill('#FFF'); // White

  // Wait for calculation (it uses useMemo which is fast but let's be sure)
  await expect(contrastValue).toHaveText('21.00:1');

  // Test keyboard shortcut 'S' for swapping
  // Ensure we are not focused on an input so the shortcut triggers
  await foregroundInput.blur();
  await backgroundInput.blur();
  await page.keyboard.press('s');

  // Values should be swapped
  // The swapColors function uses the hex state which was set to #000 and #FFF
  // But setForeground(e.target.value.toUpperCase()) was called in onChange
  // Wait, I filled #000 and #FFF.
  // In the component: onChange={(e) => setForeground(e.target.value.toUpperCase())}
  // So it becomes #000 and #FFF in state.
  await expect(foregroundInput).toHaveValue('#FFF');
  await expect(backgroundInput).toHaveValue('#000');
  await expect(contrastValue).toHaveText('21.00:1');

  // Test shortcut does NOT trigger when typing in input
  await foregroundInput.focus();
  await page.keyboard.type('ABC');
  // It shouldn't have swapped back to #FFF immediately if we are typing
  await expect(backgroundInput).toHaveValue('#000');
});

test('verify English search discoverability', async ({ page }) => {
  await page.goto('http://localhost:5173/fr');

  const searchInput = page.locator('#tool-search');

  // Search for "Contrast" (English term) while in French interface
  await searchInput.fill('Contrast');

  // Should find the Contrast-mètre
  // Use a more specific locator to avoid sr-only text
  const result = page.locator('h4:has-text("Contrast-mètre")');
  await expect(result).toBeVisible();

  // Search for "Ratio" (English term/description keyword)
  await searchInput.clear();
  await searchInput.fill('Ratio');
  await expect(page.locator('h4:has-text("Contrast-mètre")')).toBeVisible();
});
