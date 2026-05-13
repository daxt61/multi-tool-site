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
