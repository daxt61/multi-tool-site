import { test, expect } from '@playwright/test';

test.describe('Meta Tags Generator - Palette Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/meta-tags');
  });

  test('renders form controls with explicit labels and HTML output', async ({ page }) => {
    await expect(page.locator('#meta-title')).toBeVisible();
    await expect(page.locator('#meta-desc')).toBeVisible();
    await expect(page.locator('#meta-url')).toBeVisible();
    await expect(page.locator('#meta-image')).toBeVisible();
    await expect(page.locator('#html-output')).toBeVisible();
  });

  test('updates Google and Social previews live on user input', async ({ page }) => {
    await page.fill('#meta-title', 'Awesome Portfolio Site');
    await page.fill('#meta-desc', 'A great showcase of modern web projects.');
    await page.fill('#meta-url', 'https://awesome-portfolio.com');

    // Check Google and Social previews
    await expect(page.getByText('Awesome Portfolio Site').first()).toBeVisible();
    await expect(page.getByText('https://awesome-portfolio.com').first()).toBeVisible();
    await expect(page.getByText('A great showcase of modern web projects.').first()).toBeVisible();

    // Check code output
    const codeContent = await page.locator('#html-output').textContent();
    expect(codeContent).toContain('<title>Awesome Portfolio Site</title>');
    expect(codeContent).toContain('content="Awesome Portfolio Site"');
    expect(codeContent).toContain('content="A great showcase of modern web projects."');
    expect(codeContent).toContain('content="https://awesome-portfolio.com"');
  });

  test('triggers copy toast and visual feedback', async ({ page }) => {
    await page.fill('#meta-title', 'Test Title');
    const copyBtn = page.getByRole('button', { name: /^Copier C$/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    await expect(page.getByText(/Balises meta HTML copiées|HTML meta tags copied/i)).toBeVisible();
  });

  test('clears inputs and restores focus to #meta-title on clear action', async ({ page }) => {
    await page.fill('#meta-title', 'Temporary Title');
    await page.fill('#meta-desc', 'Temporary Description');

    const clearBtn = page.getByRole('button', { name: /Effacer|Clear/i });
    await clearBtn.click();

    await expect(page.locator('#meta-title')).toHaveValue('');
    await expect(page.locator('#meta-desc')).toHaveValue('');

    // Focus restored to title input
    await expect(page.locator('#meta-title')).toBeFocused();
    await expect(page.getByText(/Configuration des balises meta effacée|Meta tags configuration cleared/i)).toBeVisible();
  });

  test('supports Escape shortcut to clear and focus title input', async ({ page }) => {
    await page.fill('#meta-title', 'Title via Keyboard');
    await page.keyboard.press('Escape');

    await expect(page.locator('#meta-title')).toHaveValue('');
    await expect(page.locator('#meta-title')).toBeFocused();
  });

  test('supports C shortcut to copy HTML when unfocused', async ({ page }) => {
    await page.fill('#meta-title', 'Shortcut Title');
    // Blur active input
    await page.locator('#meta-title').blur();

    await page.keyboard.press('c');
    await expect(page.getByText(/Balises meta HTML copiées|HTML meta tags copied/i)).toBeVisible();
  });
});
