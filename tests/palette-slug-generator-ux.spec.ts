import { test, expect } from '@playwright/test';

test.describe('Slug Generator UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/slug-generator');
  });

  test('should associate label with source textarea and maintain focus on reset', async ({ page }) => {
    // Check explicitly associated label
    const label = page.locator('label[for="slug-source-input"]');
    await expect(label).toBeVisible();

    const textarea = page.locator('#slug-source-input');
    await expect(textarea).toBeVisible();

    // Type text into source textarea
    await textarea.fill('Hello World Test!');

    // Verify slug generation result
    await expect(page.locator('text=hello-world-test')).toBeVisible();

    // Click clear button
    const clearButton = page.getByRole('button', { name: /effacer|clear/i });
    await clearButton.click();

    // Verify textarea is empty and focused
    await expect(textarea).toHaveValue('');
    await expect(textarea).toBeFocused();
  });

  test('should render toggle buttons with aria-pressed state', async ({ page }) => {
    const lowercaseToggle = page.getByRole('button', { name: /all in lowercase|tout en minuscules/i });
    await expect(lowercaseToggle).toBeVisible();
    await expect(lowercaseToggle).toHaveAttribute('aria-pressed', 'true');

    // Toggle off
    await lowercaseToggle.click();
    await expect(lowercaseToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should trigger toast notification on copy and clear actions', async ({ page }) => {
    const textarea = page.locator('#slug-source-input');
    await textarea.fill('Sample Slug');

    // Click tool result copy button
    const copyButton = page.getByRole('button', { name: /^copier|^copy/i }).filter({ hasText: /copier|copy/i }).last();
    await copyButton.click();

    // Verify sonner toast appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();

    // Clear and verify toast
    const clearButton = page.getByRole('button', { name: /effacer|clear/i });
    await clearButton.click();
    await expect(toast.first()).toBeVisible();
  });
});
