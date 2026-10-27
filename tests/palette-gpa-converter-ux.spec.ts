import { test, expect } from '@playwright/test';

test.describe('GPA Converter Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('renders preset buttons with proper ARIA pressed attributes in English and French', async ({ page }) => {
    // Test English locale
    await page.goto('http://localhost:5173/en/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    const deansListBtn = page.getByRole('button', { name: "Dean's List (Straight A's)" });
    const balancedBtn = page.getByRole('button', { name: 'Balanced Semester' });
    const stemBtn = page.getByRole('button', { name: 'STEM Intensive' });

    await expect(deansListBtn).toBeVisible();
    await expect(balancedBtn).toBeVisible();
    await expect(stemBtn).toBeVisible();

    // Default active preset is false
    await expect(deansListBtn).toHaveAttribute('aria-pressed', 'false');

    // Click Dean's List preset
    await deansListBtn.click();
    await expect(deansListBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(balancedBtn).toHaveAttribute('aria-pressed', 'false');

    // Test French locale
    await page.goto('http://localhost:5173/fr/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    const frDeansListBtn = page.getByRole('button', { name: "Tableau d'Honneur (100% A)" });
    await expect(frDeansListBtn).toBeVisible();
    await frDeansListBtn.click();
    await expect(frDeansListBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clears active preset selection when course row or scale is edited manually', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    const deansListBtn = page.getByRole('button', { name: "Dean's List (Straight A's)" });
    await deansListBtn.click();
    await expect(deansListBtn).toHaveAttribute('aria-pressed', 'true');

    // Edit input credits manually
    const creditsInput = page.locator('#gpa-credits-0');
    await creditsInput.fill('5');

    // Preset active state should reset to false
    await expect(deansListBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('supports Escape shortcut when unfocused to reset inputs and restore focus', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    const stemBtn = page.getByRole('button', { name: 'STEM Intensive' });
    await stemBtn.click();

    // Blur inputs by clicking heading
    await page.locator('h3').first().click();

    // Press Escape when no input is focused
    await page.keyboard.press('Escape');

    // First select input should receive focus after reset
    const firstSelect = page.locator('#gpa-letter-0');
    await expect(firstSelect).toBeFocused();
  });

  test('supports C shortcut to copy GPA summary', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    // Blur inputs by clicking heading
    await page.locator('h3').first().click();

    // Press C to copy summary
    await page.keyboard.press('c');

    // Verify Copy button is visible
    const copyBtn = page.getByRole('button', { name: /Copied global GPA/i });
    await expect(copyBtn).toBeVisible();
  });

  test('explicit HTML labels and remove course buttons have accessible names', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/gpa-converter');
    await page.waitForSelector('#gpa-letter-0');

    const removeBtn = page.getByRole('button', { name: 'Remove course' }).first();
    await expect(removeBtn).toBeVisible();
  });
});
