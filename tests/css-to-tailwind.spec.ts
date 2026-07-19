import { test, expect } from '@playwright/test';

test.describe('CSS to Tailwind CSS Converter Functionality', () => {
  test('converts basic and complex CSS properties correctly', async ({ page }) => {
    // Navigate to the CSS to Tailwind tool
    await page.goto('http://localhost:5173/en/outil/css-to-tailwind');

    // 1. Check title visibility
    await expect(page.getByRole('heading', { name: 'CSS to Tailwind CSS', exact: true })).toBeVisible();

    const inputArea = page.locator('#css-input');
    const outputArea = page.locator('.w-full.h-80.p-6.bg-slate-900');

    // 2. Input CSS declarations
    const cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #3b82f6;
      padding: 16px 24px;
      margin-top: 20px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 1.25rem;
    `;
    await inputArea.fill(cssText);

    // 3. Verify standard classes are mapped
    await expect(outputArea).toContainText('flex');
    await expect(outputArea).toContainText('justify-center');
    await expect(outputArea).toContainText('items-center');
    await expect(outputArea).toContainText('bg-[#3b82f6]');
    await expect(outputArea).toContainText('py-4'); // padding vertical: 16px
    await expect(outputArea).toContainText('px-6'); // padding horizontal: 24px
    await expect(outputArea).toContainText('mt-5'); // margin-top: 20px (maps to 1.25rem which is 5 spacing)
    await expect(outputArea).toContainText('rounded-xl'); // border-radius: 12px
    await expect(outputArea).toContainText('font-bold');
    await expect(outputArea).toContainText('text-xl'); // font-size: 1.25rem

    // 4. Test formatting option
    const formatLabel = page.locator('label', { hasText: 'Format as JSX className' });
    await formatLabel.click();
    await expect(outputArea).toContainText('className="');

    // Disable formatting option to return to standard classes
    await formatLabel.click();
    await expect(outputArea).not.toContainText('className="');

    // 5. Test Copy action feedback
    const copyButton = page.getByRole('button', { name: 'Copy', exact: true });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    await expect(page.getByText('Copied').first()).toBeVisible();

    // 6. Test clearing via local Escape key handler
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
  });
});
