import { test, expect } from '@playwright/test';

test.describe('Smoke tests for new and upgraded tools', () => {
  test('Social Media Bio Generator is accessible', async ({ page }) => {
    await page.goto('/en/outil/social-media-bio');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bio Generator');
    await expect(page.getByRole('button', { name: 'Generate New Bio' })).toBeVisible();
  });

  test('List to Checklist is accessible', async ({ page }) => {
    await page.goto('/en/outil/list-to-checklist');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('List to Checklist');
    await expect(page.getByLabel('Your List')).toBeVisible();
  });

  test('Number Converter upgrade check', async ({ page }) => {
    await page.goto('/en/outil/number-converter');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Base');
    await expect(page.getByText('Custom Base Conversion')).toBeVisible();
  });
});
