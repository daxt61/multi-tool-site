import { test, expect } from '@playwright/test';

test.describe('Chmod Calculator Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Chmod Calculator
    await page.goto('http://localhost:5173/fr/outil/chmod');
  });

  test('applies presets correctly and updates permissions', async ({ page }) => {
    // Click on 600 preset button
    await page.getByRole('button', { name: /600/i }).click();

    // Verify octal display shows 600
    await expect(page.locator('text=600')).toBeVisible();

    // Click on 755 preset button
    await page.getByRole('button', { name: /755/i }).click();

    // Verify octal display shows 755
    await expect(page.locator('text=755')).toBeVisible();
  });

  test('clears permissions on Escape key press and restores focus', async ({ page }) => {
    // Click 755 preset first
    await page.getByRole('button', { name: /755/i }).click();
    await expect(page.locator('text=755')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Octal code should be 000
    await expect(page.locator('text=000')).toBeVisible();
  });

  test('copies octal code on C key press when unfocused', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Apply preset 755
    await page.getByRole('button', { name: /755/i }).click();

    // Press C
    await page.keyboard.press('c');

    // Verify sonner toast notification
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });
});
