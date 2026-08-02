import { test, expect } from '@playwright/test';

test.describe('XMLFormatter Premium UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the XML Formatter tool on French route
    await page.goto('http://localhost:5173/fr/outil/xml-formatter');
  });

  test('should load correctly and have proper accessible labels', async ({ page }) => {
    // Check if the page title / headers exist
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Formateur XML/i);

    // Check textarea with correct label association
    const editorLabel = page.locator('label[for="xml-input"]');
    await expect(editorLabel).toBeVisible();
    await expect(editorLabel).toContainText(/Éditeur XML/i);

    const textarea = page.locator('textarea#xml-input');
    await expect(textarea).toBeVisible();
  });

  test('should format/prettify valid XML input and trigger success toast', async ({ page }) => {
    const textarea = page.locator('textarea#xml-input');
    await textarea.fill('<root><child attr="val">Content</child></root>');

    const beautifyBtn = page.getByRole('button', { name: /Embellir/i });
    await expect(beautifyBtn).toBeEnabled();
    await beautifyBtn.click();

    // Verify output text formatting
    const formattedVal = await textarea.inputValue();
    expect(formattedVal).toContain('<root>\n  <child attr="val">Content</child>\n</root>');

    // Check sonner toast notification for formatting success
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.last()).toBeVisible();
    await expect(toast.last()).toContainText(/XML embelli avec succès/i);
  });

  test('should minify XML input and trigger success toast', async ({ page }) => {
    const textarea = page.locator('textarea#xml-input');
    await textarea.fill('<root>\n  <child attr="val">Content</child>\n</root>');

    const minifyBtn = page.getByRole('button', { name: /Minifier/i });
    await expect(minifyBtn).toBeEnabled();
    await minifyBtn.click();

    // Verify output is minified
    const minifiedVal = await textarea.inputValue();
    expect(minifiedVal).toBe('<root><child attr="val">Content</child></root>');

    // Check sonner toast notification for minify success
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.last()).toBeVisible();
    await expect(toast.last()).toContainText(/XML minifié avec succès/i);
  });

  test('should support Escape key to clear inputs and focus textarea', async ({ page }) => {
    const textarea = page.locator('textarea#xml-input');
    await textarea.fill('<something />');

    // Press escape on the focused input
    await textarea.press('Escape');

    // Textarea should be empty and focused
    const val = await textarea.inputValue();
    expect(val).toBe('');
    await expect(textarea).toBeFocused();

    // Check sonner toast notification for clear success
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.last()).toBeVisible();
    await expect(toast.last()).toContainText(/Entrées XML effacées/i);
  });

  test('should support state sharing through URL parameter', async ({ page }) => {
    // Generate base64 state data for `{ xml: '<hello />' }`
    const stateObj = { xml: '<hello />' };
    const b64 = btoa(encodeURIComponent(JSON.stringify(stateObj)).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));

    // Load URL with shared data
    await page.goto(`http://localhost:5173/fr/outil/xml-formatter?data=${b64}`);

    const textarea = page.locator('textarea#xml-input');
    await expect(textarea).toHaveValue('<hello />');
  });

  test('should display visual Kbd shortcut hints', async ({ page }) => {
    const escHint = page.locator('span:has-text("Esc")');
    const cHint = page.locator('span:has-text("C")');
    await expect(escHint.first()).toBeVisible();
    await expect(cHint.first()).toBeVisible();
  });
});
