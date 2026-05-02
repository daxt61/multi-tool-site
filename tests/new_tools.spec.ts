import { test, expect } from '@playwright/test';

test.describe('New CSS Tools', () => {
  test('CSS Triangle Generator works', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-triangle');
    await expect(page.getByRole('heading', { name: 'Triangle CSS' })).toBeVisible();

    // Check if the preview triangle is there
    const preview = page.locator('.relative.z-10');
    await expect(preview).toBeVisible();

    // Change direction
    await page.click('button[aria-label="Bas"]');
    const cssCode = page.locator('pre');
    await expect(cssCode).toContainText('border-top: 100px solid');
  });

  test('CSS Border Radius Generator works', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-border-radius');
    await expect(page.getByRole('heading', { name: 'Border Radius CSS' })).toBeVisible();

    const preview = page.locator('.bg-indigo-600.shadow-2xl');
    await expect(preview).toBeVisible();

    // Toggle independent mode
    await page.click('button:has-text("Liés")');
    await expect(page.locator('label:has-text("Haut-Droite")')).toBeVisible();

    // Change a value
    const topRightSlider = page.locator('#tr');
    await topRightSlider.fill('50');
    const cssCode = page.locator('pre');
    await expect(cssCode).toContainText('border-radius: 20px 50px 20px 20px;');
  });
});

test.describe('Upgraded Tools', () => {
  test('Text Transformer Zalgo effect', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/text-transformer');
    await page.fill('#transformer-input', 'Hello');
    await page.click('button:has-text("Zalgo")');

    const output = await page.locator('#transformer-output').textContent();
    // Zalgo text should be much longer than input due to combining characters
    expect(output?.length).toBeGreaterThan(10);
  });

  test('Lorem Ipsum HTML support', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/lorem-ipsum');
    await page.click('button:has-text("HTML")');

    const output = await page.locator('.bg-white.dark\\:bg-slate-950\\/50 p').first().textContent();
    expect(output).toContain('<p>');
    expect(output).toContain('</p>');
  });
});
