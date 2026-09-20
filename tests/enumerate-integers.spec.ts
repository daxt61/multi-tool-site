import { test, expect } from '@playwright/test';

test.describe('Enumerate Integers Tool', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/fr/outil/enumerate-integers');
    await page.waitForLoadState('networkidle');
  });

  test('should render Enumerate Integers interface correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Énumérateur d'Entiers|Enumerate Integers/i);
    await expect(page.locator('#enum-start')).toBeVisible();
    await expect(page.locator('#enum-count')).toBeVisible();
    await expect(page.locator('#enum-step')).toBeVisible();
    await expect(page.locator('#enum-output')).toBeVisible();
  });

  test('should generate default integer sequence from 1 to 20', async ({ page }) => {
    const val = await page.locator('#enum-output').inputValue();
    expect(val.startsWith('1\n2\n3')).toBeTruthy();
    expect(val.endsWith('20')).toBeTruthy();
  });

  test('should update output when configuration controls change', async ({ page }) => {
    // Change start value to 5, count to 3, step to 2
    await page.locator('#enum-start').fill('5');
    await page.locator('#enum-count').fill('3');
    await page.locator('#enum-step').fill('2');

    await expect(page.locator('#enum-output')).toHaveValue('5\n7\n9');
  });

  test('should apply quick start presets', async ({ page }) => {
    // Click Sequential IDs preset
    await page.getByRole('button', { name: /IDs Séquentiels/i }).click();
    await expect(page.locator('#enum-output')).toHaveValue(/id_1/);
    await expect(page.locator('#enum-output')).toHaveValue(/id_50/);

    // Click Hex Addresses preset
    await page.getByRole('button', { name: /Adresses Hexadécimales/i }).click();
    await expect(page.locator('#enum-output')).toHaveValue(/0x0000/);

    // Click Roman Chapters preset
    await page.getByRole('button', { name: /Chapitres Romains/i }).click();
    await expect(page.locator('#enum-output')).toHaveValue(/Chapter I/);
    await expect(page.locator('#enum-output')).toHaveValue(/Chapter XX/);
  });

  test('should support zero padding and custom prefix/suffix', async ({ page }) => {
    await page.locator('#enum-start').fill('1');
    await page.locator('#enum-count').fill('3');
    await page.locator('#enum-pad').fill('3');
    await page.locator('#enum-prefix').fill('IMG_');
    await page.locator('#enum-suffix').fill('.png');

    await expect(page.locator('#enum-output')).toHaveValue('IMG_001.png\nIMG_002.png\nIMG_003.png');
  });

  test('should copy output with copy button click', async ({ page }) => {
    const copyButton = page.getByRole('button', { name: 'Copier', exact: true });
    await copyButton.click();
    await expect(page.getByRole('button', { name: 'Copié', exact: true })).toBeVisible();
  });

  test('should reset inputs with Escape hotkey', async ({ page }) => {
    await page.getByRole('button', { name: /Chapitres Romains/i }).click();
    await expect(page.locator('#enum-prefix')).toHaveValue('Chapter ');

    await page.keyboard.press('Escape');
    await expect(page.locator('#enum-prefix')).toHaveValue('');
    await expect(page.locator('#enum-output')).toHaveValue(/1\n2\n3/);
  });
});
