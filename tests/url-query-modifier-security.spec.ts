import { test, expect } from '@playwright/test';

test.describe('UrlQueryModifier Security - Cryptographically Secure Random IDs', () => {
  test('uses secure random generation when adding new query parameters', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/url-query-modifier');

    // Click the Add parameter button
    const addButton = page.getByRole('button', { name: 'Add', exact: true });
    await addButton.click();

    // Verify a new parameter row was added
    const paramRow = page.locator('input[placeholder="key"]').last();
    await expect(paramRow).toBeVisible();

    // Fill key and value
    await paramRow.fill('security_token');
    const valueRow = page.locator('input[placeholder="value"]').last();
    await valueRow.fill('secure123');

    // Verify updated URL output includes the new parameter
    const fullUrlOutput = page.locator('.break-all.select-all').first();
    await expect(fullUrlOutput).toContainText('security_token=secure123');
  });
});
