import { test, expect } from '@playwright/test';

test.describe('CSV Column Extractor Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-extractor');
  });

  test('renders CSV column extractor tool correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/CSV Column Extractor/i);
    await expect(page.getByTestId('csv-extractor-container')).toBeVisible();
    await expect(page.locator('#csv-input')).toBeVisible();
    await expect(page.locator('#csv-output')).toBeVisible();
  });

  test('loads quick preset and extracts specific columns', async ({ page }) => {
    const inputTextArea = page.locator('#csv-input');
    const outputTextArea = page.locator('#csv-output');

    await page.getByText('E-Commerce Orders').click();

    await expect(inputTextArea).toContainText('OrderID,Customer,Email,Category,Total,Status');
    await expect(outputTextArea).toContainText('Customer,Email,Total');
  });

  test('toggles column selection and updates output', async ({ page }) => {
    const container = page.getByTestId('csv-extractor-container');
    const inputTextArea = page.locator('#csv-input');
    const outputTextArea = page.locator('#csv-output');

    await inputTextArea.fill('Name,Age,City\nAlice,30,New York\nBob,25,London');

    // Select Column 1 (Age)
    await container.getByRole('button', { name: 'Age', exact: true }).click();
    // Deselect Column 0 (Name)
    await container.getByRole('button', { name: 'Name', exact: true }).click();

    await expect(outputTextArea).toHaveValue('Age\n30\n25');
  });

  test('clears input and restores focus on Escape press', async ({ page }) => {
    const inputTextArea = page.locator('#csv-input');
    await inputTextArea.fill('id,value\n1,100');

    await page.keyboard.press('Escape');

    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });

  test('copies extracted output when C is pressed outside editable fields', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const inputTextArea = page.locator('#csv-input');
    await inputTextArea.fill('id,code\n1,ABC\n2,XYZ');

    // Unfocus textareas
    await page.locator('body').click();
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('id\n1\n2');
  });
});
