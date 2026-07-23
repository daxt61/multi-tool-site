import { test, expect } from '@playwright/test';

test.describe('Tailwind CSS to CSS converter tool', () => {
  test('should load, convert utility classes, toggle config options, and clear', async ({ page }) => {
    // Navigate to the Tailwind to CSS page
    await page.goto('http://localhost:5173/en/outil/tailwind-to-css');

    // Verify Title
    await expect(page.locator('h1')).toContainText('Tailwind CSS to CSS');

    // Locate input textarea
    const inputArea = page.locator('#tailwind-input');
    await expect(inputArea).toBeVisible();

    // Fill sample Tailwind classes
    const classes = 'flex items-center justify-between p-4 bg-blue-500 rounded-md text-lg text-white font-bold';
    await inputArea.fill(classes);

    // Locate output area (represented by text or pre container)
    const outputContainer = page.locator('.w-full.h-80.p-6.bg-slate-900');
    await expect(outputContainer).toBeVisible();

    // Verify standard generated CSS (by default using REM)
    await page.waitForTimeout(300);
    let outputVal = await outputContainer.textContent();
    expect(outputVal).toContain('display: flex;');
    expect(outputVal).toContain('align-items: center;');
    expect(outputVal).toContain('justify-content: space-between;');
    expect(outputVal).toContain('padding: 1rem;');
    expect(outputVal).toContain('background-color: #3b82f6;');
    expect(outputVal).toContain('border-radius: 0.375rem;');
    expect(outputVal).toContain('font-size: 1.125rem;');
    expect(outputVal).toContain('color: #ffffff;');
    expect(outputVal).toContain('font-weight: 700;');

    // Toggle units to PX
    const pxButton = page.getByRole('button', { name: 'PX', exact: true });
    await pxButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputContainer.textContent();
    expect(outputVal).toContain('padding: 16px;');
    expect(outputVal).toContain('border-radius: 6px;');
    expect(outputVal).toContain('font-size: 18px;');

    // Toggle selector wrapping
    const selectorCheckbox = page.getByLabel('Wrap in CSS Selector');
    await selectorCheckbox.check();

    // Type a custom selector name
    const selectorNameInput = page.locator('#selector-name');
    await expect(selectorNameInput).toBeEnabled();
    await selectorNameInput.fill('.my-custom-btn');
    await page.waitForTimeout(300);

    outputVal = await outputContainer.textContent();
    expect(outputVal).toContain('.my-custom-btn {');
    expect(outputVal).toContain('  display: flex;');
    expect(outputVal).toContain('}');

    // Verify copy button works and triggers toast
    const copyButton = page.getByRole('button', { name: 'Copy', exact: true }).first();
    await copyButton.click();

    // Verify toast notification appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // Click "Clear" button
    const clearButton = page.getByRole('button', { name: /Clear/i }).first();
    await clearButton.click();

    // Verify textarea is empty and focused
    await expect(inputArea).toBeEmpty();
    await expect(inputArea).toBeFocused();
  });
});
