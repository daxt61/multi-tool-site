import { test, expect } from '@playwright/test';

test('verify Gitignore Generator functionalities and presets', async ({ page }) => {
  // Navigation to the Gitignore Generator tool path
  await page.goto('http://localhost:5173/en/outil/gitignore-generator');

  // Verify headers and search
  const heading = page.locator('h3:has-text("Presets")');
  await expect(heading).toBeVisible();

  const searchInput = page.locator('input#gitignore-preset-search');
  await expect(searchInput).toBeVisible();

  // Initially output is empty
  const preview = page.locator('textarea#gitignore-output-preview');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveValue('');

  // Toggle "Node.js" preset
  const nodeBtn = page.locator('button:has-text("Node.js")');
  await expect(nodeBtn).toBeVisible();
  await nodeBtn.click();

  // Output should now contain Node.js rules
  await expect(preview).toContainText('# Preset: Node.js');
  await expect(preview).toContainText('node_modules/');

  // Toggle "Python" preset
  const pythonBtn = page.locator('button:has-text("Python")');
  await expect(pythonBtn).toBeVisible();
  await pythonBtn.click();

  await expect(preview).toContainText('# Preset: Python');
  await expect(preview).toContainText('__pycache__/');

  // Fill in some custom rules
  const customArea = page.locator('textarea#gitignore-custom-rules');
  await expect(customArea).toBeVisible();
  await customArea.fill('.my-custom-ignore-rule');

  await expect(preview).toContainText('# Custom Rules');
  await expect(preview).toContainText('.my-custom-ignore-rule');

  // Click Copy button and verify toast
  // Since there can be multiple copy buttons (e.g. Header Share/Copy Link, etc),
  // target the button with lucide-copy icon that isn't the general page header link.
  const copyBtn = page.locator('button:has(svg.lucide-copy)').last();
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  const toast = page.locator('li[data-sonner-toast]');
  await expect(toast).toBeVisible();

  // Test reset / Escape shortcut
  await page.keyboard.press('Escape');
  await expect(preview).toHaveValue('');
  await expect(searchInput).toBeFocused();
});
