import { test, expect } from '@playwright/test';

test.describe('Onlinetools Inspired List Utilities', () => {
  test('List Separator Changer should convert comma to newline and back', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/list-separator-changer');

    // Check elements are present
    const inputArea = page.locator('#list-separator-input');
    await expect(inputArea).toBeVisible();

    // Fill input
    await inputArea.fill('one,two,three,four,five');

    // Click comma as input delimiter
    await page.getByRole('button', { name: 'Virgule (,)' }).first().click();

    // Click newline as output delimiter
    await page.getByRole('button', { name: 'Saut de ligne (\\n)' }).last().click();

    // Check converted output
    const outputArea = page.locator('#list-separator-output');
    await expect(outputArea).toHaveValue('one\ntwo\nthree\nfour\nfive');
  });

  test('List Reverser should reverse newline list to comma list', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/list-reverser');

    // Check elements are present
    const inputArea = page.locator('#list-reverse-input');
    await expect(inputArea).toBeVisible();

    // Fill input
    await inputArea.fill('apple\nbanana\norange');

    // Click newline as input delimiter
    await page.getByRole('button', { name: 'Saut de ligne (\\n)' }).first().click();

    // Click comma as output delimiter
    await page.getByRole('button', { name: 'Virgule (,)' }).last().click();

    // Check reversed output
    const outputArea = page.locator('#list-reverse-output');
    await expect(outputArea).toHaveValue('orange, banana, apple');
  });
});
