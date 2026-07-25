import { test, expect } from '@playwright/test';

test.describe('RobotsTxtGenerator DoS Mitigations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/robots-txt');
  });

  test('enforces MAX_RULES limit', async ({ page }) => {
    const addRuleButton = page.getByText('Ajouter un groupe de règles');

    // Default has 1 rule. Add 19 more to reach 20.
    for (let i = 0; i < 19; i++) {
      await addRuleButton.click();
    }

    // 21st click should trigger error
    await addRuleButton.click();
    await expect(page.getByText('Nombre maximal de groupes de règles atteint (20).')).toBeVisible();
  });

  test('enforces MAX_PATHS_PER_RULE limit', async ({ page }) => {
    const addPathButton = page.getByText('Ajouter').first(); // Disallow in first rule

    // Default has 1 disallow and 1 allow.
    // Disallow has 1 path. Add 19 more to reach 20.
    for (let i = 0; i < 19; i++) {
      await addPathButton.click();
    }

    // 21st path addition should trigger error
    await addPathButton.click();
    await expect(page.getByText('Nombre maximal de chemins atteint pour ce groupe (20).')).toBeVisible();
  });

  test('enforces MAX_LENGTH on sitemap input', async ({ page }) => {
    const sitemapInput = page.locator('#sitemap');
    const longString = 'a'.repeat(600);

    await sitemapInput.fill(longString);
    const value = await sitemapInput.inputValue();
    expect(value.length).toBe(500);
  });
});

test.describe('RobotsTxtGenerator Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/robots-txt');
  });

  test('clears input, shows toast, and programmatically restores focus on Escape or Clear button click', async ({ page }) => {
    const sitemapInput = page.locator('#sitemap');
    await sitemapInput.fill('https://example.com/sitemap.xml');

    const firstUAInput = page.locator('#ua-input-0');
    await firstUAInput.fill('MySpecialBot');

    const clearButton = page.locator('button:has(svg.lucide-trash2)');
    await clearButton.click();

    await expect(sitemapInput).toHaveValue('');
    await expect(firstUAInput).toHaveValue('*');

    // Check toast notification appeared
    await expect(page.getByText('Configuration réinitialisée !')).toBeVisible();

    // Verify that focus was programmatically restored
    await expect(firstUAInput).toBeFocused();

    // Modify values again to test Escape shortcut
    await sitemapInput.fill('https://example.com/other-sitemap.xml');
    await firstUAInput.fill('AnotherBot');

    await page.keyboard.press('Escape');

    await expect(sitemapInput).toHaveValue('');
    await expect(firstUAInput).toHaveValue('*');
    await expect(firstUAInput).toBeFocused();
  });

  test('copies output and shows toast on Copy button click or pressing C key', async ({ page }) => {
    const copyButton = page.locator('button:has(svg.lucide-copy)');
    await copyButton.click();

    await expect(page.getByText('Copié', { exact: true })).toBeVisible();
    await expect(page.getByText('Fichier robots.txt copié dans le presse-papiers !').first()).toBeVisible();

    await page.locator('body').click();
    await page.keyboard.press('c');

    await expect(page.getByText('Fichier robots.txt copié dans le presse-papiers !').first()).toBeVisible();
  });
});
