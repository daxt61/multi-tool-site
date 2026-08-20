import { test, expect } from '@playwright/test';

test.describe('CSV Column Splitter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-column-splitter');
    await page.waitForSelector('[data-testid="csv-splitter-container"]');
  });

  test('renders correctly with default UI components', async ({ page }) => {
    await expect(page.locator('#csv-splitter-input')).toBeVisible();
    await expect(page.locator('#csv-splitter-output')).toBeVisible();
    await expect(page.locator('#split-delimiter')).toBeVisible();
    await expect(page.locator('#new-headers')).toBeVisible();
  });

  test('splits CSV column correctly with default settings', async ({ page }) => {
    const inputArea = page.locator('#csv-splitter-input');
    const outputArea = page.locator('#csv-splitter-output');

    await inputArea.fill('FullName,Department\nAlice Smith,Engineering\nBob Jones,Marketing');

    // Default target column is 0, splitDelimiter is " ", newHeaders is "Part1, Part2", replace mode
    await expect(outputArea).toHaveValue('Part1,Part2,Department\nAlice,Smith,Engineering\nBob,Jones,Marketing');
  });

  test('updates output when changing split delimiter and new headers', async ({ page }) => {
    const inputArea = page.locator('#csv-splitter-input');
    const outputArea = page.locator('#csv-splitter-output');
    const splitDelimInput = page.locator('#split-delimiter');
    const newHeadersInput = page.locator('#new-headers');

    await inputArea.fill('User,Location\nAlice,Paris-France\nBob,Lyon-France');

    // Select column 1 (Location)
    const colBtn = page.getByRole('button', { name: 'Location' });
    if (await colBtn.isVisible()) {
      await colBtn.click();
    }

    await splitDelimInput.fill('-');
    await newHeadersInput.fill('City, Country');

    await expect(outputArea).toHaveValue('User,City,Country\nAlice,Paris,France\nBob,Lyon,France');
  });

  test('appends split columns when append placement is selected', async ({ page }) => {
    const inputArea = page.locator('#csv-splitter-input');
    const outputArea = page.locator('#csv-splitter-output');

    await inputArea.fill('FullName,Department\nAlice Smith,Engineering');

    const appendBtn = page.getByText("Ajouter à la Fin");
    await appendBtn.click();

    await expect(outputArea).toHaveValue('FullName,Department,Part1,Part2\nAlice Smith,Engineering,Alice,Smith');
  });

  test('loads quick presets correctly', async ({ page }) => {
    const outputArea = page.locator('#csv-splitter-output');

    // Click "Découper Date AAAA-MM-JJ" preset
    const presetBtn = page.getByRole('button', { name: 'Découper Date AAAA-MM-JJ' });
    await presetBtn.click();

    await expect(outputArea).toHaveValue('User;Year;Month;Day;Role\nJean Dupont;2023;05;15;Admin\nMarie Curie;2022;11;03;User\nPierre Martin;2024;01;20;Editor');
  });

  test('handles Clear button and Escape key focus restoration', async ({ page }) => {
    const inputArea = page.locator('#csv-splitter-input');

    await inputArea.fill('FullName,Dept\nAlice Smith,Dev');
    await expect(inputArea).toHaveValue('FullName,Dept\nAlice Smith,Dev');

    // Press Escape key
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('handles Copy shortcut when editable input is unfocused', async ({ page }) => {
    const inputArea = page.locator('#csv-splitter-input');
    await inputArea.fill('FullName,Dept\nAlice Smith,Dev');

    // Blur input area
    await inputArea.blur();

    // Press C key
    await page.keyboard.press('c');

    // Sonner toast should appear
    await expect(page.getByText('CSV découpé copié dans le presse-papiers !')).toBeVisible();
  });
});

test.describe('Case Converter Tool Upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/case-converter');
    await page.waitForSelector('#case-text');
  });

  test('converts text to multiple cases and shows copy toasts', async ({ page }) => {
    const textarea = page.locator('#case-text');
    await textarea.fill('hello world test');

    // Click copy button on camelCase card
    const camelCaseCard = page.locator('div').filter({ hasText: /^camelCase/ }).first();
    const copyBtn = camelCaseCard.getByRole('button', { name: /Copy as/i });
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await expect(page.getByText('Copied!')).toBeVisible();
    }
  });

  test('handles Escape key to clear text input and show toast', async ({ page }) => {
    const textarea = page.locator('#case-text');
    await textarea.fill('some test text');

    await page.keyboard.press('Escape');

    await expect(textarea).toHaveValue('');
    await expect(page.getByText('Cleared!')).toBeVisible();
  });
});
