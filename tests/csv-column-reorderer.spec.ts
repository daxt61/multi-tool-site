import { test, expect } from '@playwright/test';

test.describe('CSV Column Reorderer Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-column-reorderer');
    await page.waitForSelector('[data-testid="csv-reorder-container"]');
  });

  test('renders correctly with default UI components', async ({ page }) => {
    await expect(page.locator('#csv-reorder-input')).toBeVisible();
    await expect(page.locator('#csv-reorder-output')).toBeVisible();
  });

  test('reorders columns when moving up or down', async ({ page }) => {
    const inputArea = page.locator('#csv-reorder-input');
    const outputArea = page.locator('#csv-reorder-output');

    await inputArea.fill('FirstName,LastName,Department,ID\nAlice,Smith,Engineering,USR-101');

    // Default order: FirstName, LastName, Department, ID
    await expect(outputArea).toHaveValue('FirstName,LastName,Department,ID\nAlice,Smith,Engineering,USR-101');

    // Move second column (LastName) UP to first position
    const moveLastNameUp = page.getByRole('button', { name: 'Move LastName up' });
    await moveLastNameUp.click();

    await expect(outputArea).toHaveValue('LastName,FirstName,Department,ID\nSmith,Alice,Engineering,USR-101');
  });

  test('renames and toggles visibility of columns', async ({ page }) => {
    const inputArea = page.locator('#csv-reorder-input');
    const outputArea = page.locator('#csv-reorder-output');

    await inputArea.fill('FirstName,LastName,Department\nAlice,Smith,Engineering');

    // Disable Department column
    const hideDeptBtn = page.getByRole('button', { name: 'Disable Department' });
    await hideDeptBtn.click();

    // Custom header for FirstName
    const customFirstInput = page.locator('input[placeholder="En-tête personnalisée (optionnel)"]').first();
    await customFirstInput.fill('Given Name');

    await expect(outputArea).toHaveValue('Given Name,LastName\nAlice,Smith');
  });

  test('applies sorting utility actions (Sort A-Z, Reverse)', async ({ page }) => {
    const inputArea = page.locator('#csv-reorder-input');
    const outputArea = page.locator('#csv-reorder-output');

    await inputArea.fill('Zulu,Alpha,Charlie\n1,2,3');

    // Click Sort A-Z button ("Trier A-Z")
    await page.getByRole('button', { name: 'Trier A-Z' }).click();
    await expect(outputArea).toHaveValue('Alpha,Charlie,Zulu\n2,3,1');

    // Click Reverse Order button ("Inverser l'Ordre")
    await page.getByRole('button', { name: "Inverser l'Ordre" }).click();
    await expect(outputArea).toHaveValue('Zulu,Charlie,Alpha\n1,3,2');
  });

  test('loads quick presets correctly', async ({ page }) => {
    const outputArea = page.locator('#csv-reorder-output');

    // Click "Placer l'ID en Premier" preset
    const presetBtn = page.getByRole('button', { name: "Placer l'ID en Premier" });
    await presetBtn.click();

    await expect(outputArea).toHaveValue('ID,FirstName,LastName,Department\nUSR-101,Alice,Smith,Engineering\nUSR-102,Bob,Jones,Marketing\nUSR-103,Charlie,Brown,Finance');
  });

  test('handles Clear button and Escape key focus restoration', async ({ page }) => {
    const inputArea = page.locator('#csv-reorder-input');

    await inputArea.fill('Name,Dept\nAlice,Dev');
    await expect(inputArea).toHaveValue('Name,Dept\nAlice,Dev');

    // Press Escape key
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('handles Copy shortcut when editable input is unfocused', async ({ page }) => {
    const inputArea = page.locator('#csv-reorder-input');
    await inputArea.fill('Name,Dept\nAlice,Dev');

    // Blur input area
    await inputArea.blur();

    // Press C key
    await page.keyboard.press('c');

    // Sonner toast should appear
    await expect(page.getByText('CSV réorganisé copié dans le presse-papiers !')).toBeVisible();
  });
});
