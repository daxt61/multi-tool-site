import { test, expect } from '@playwright/test';

test.describe('World Clock UX Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the World Clock tool (use specific locale to avoid confusion, but tool is same)
    await page.goto('http://localhost:5173/fr/outil/world-clock');
    // Wait for the main heading using a more robust selector
    await expect(page.locator('h1')).toContainText(/Horloge Mondiale/i);
  });

  test('should open "Add city" modal when "A" is pressed', async ({ page }) => {
    // Modal should not be present
    const modalHeading = page.locator('h3').filter({ hasText: /Ajouter une ville/i });
    await expect(modalHeading).not.toBeVisible();

    // Press 'a' (case insensitive 'A')
    await page.keyboard.press('a');

    // Modal should be visible
    await expect(modalHeading).toBeVisible();

    // Search input should be focused
    const searchInput = page.locator('input[placeholder="Rechercher une ville..."]');
    await expect(searchInput).toBeFocused();
  });

  test('should close modal and restore focus when Escape is pressed', async ({ page }) => {
    // Open modal by clicking the button
    const addBtn = page.locator('#add-clock-btn');
    await addBtn.click();
    const modalHeading = page.locator('h3').filter({ hasText: /Ajouter une ville/i });
    await expect(modalHeading).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(modalHeading).not.toBeVisible();

    // Focus should be restored to the Add Clock button
    await expect(addBtn).toBeFocused();
  });

  test('should show Remove button and focus ring when focused via keyboard', async ({ page }) => {
    // Wait for the first clock card to be visible
    const firstClock = page.locator('.group').filter({ has: page.locator('button[aria-label="Supprimer"]') }).first();
    await expect(firstClock).toBeVisible();
    const removeButton = firstClock.locator('button[aria-label="Supprimer"]');

    // Check initial state (opacity-0)
    await expect(removeButton).toHaveClass(/opacity-0/);

    // Focus the Add Clock button then tab to the first remove button
    const addBtn = page.locator('#add-clock-btn');
    await addBtn.focus();

    // Tab to reach the remove button
    await page.keyboard.press('Tab');

    await expect(removeButton).toBeFocused();

    // Check computed style for opacity (should be visible now)
    await expect(async () => {
      const opacity = await removeButton.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeGreaterThan(0.9);
    }).toPass();
  });

  test('should show keyboard shortcut hint "A"', async ({ page }) => {
    const addBtn = page.locator('#add-clock-btn');
    const kbdHint = addBtn.locator('kbd');
    await expect(kbdHint).toBeVisible();
    await expect(kbdHint).toHaveText('A');
  });
});
