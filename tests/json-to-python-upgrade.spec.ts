import { test, expect } from '@playwright/test';

test.describe('JSON to Python Converter Micro-UX Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-python');
    await page.waitForLoadState('networkidle');
  });

  test('renders header, inputs, presets and default output', async ({ page }) => {
    await expect(page.locator('label[for="json-input"]')).toBeVisible();
    await expect(page.locator('label[for="python-output"]')).toBeVisible();

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#python-output');

    await expect(inputArea).not.toHaveValue('');
    await expect(outputArea).toContainText('@dataclass');
    await expect(outputArea).toContainText('class RootObject:');
  });

  test('switches quick-start presets and updates input and output', async ({ page }) => {
    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Order' });
    await expect(ecommerceBtn).toBeVisible();

    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#python-output');

    await expect(inputArea).toContainText('ORD-99281');
    await expect(outputArea).toContainText('order_id: str');
    await expect(outputArea).toContainText('shipping_address');
  });

  test('switches python class style from Dataclass to TypedDict', async ({ page }) => {
    const typedDictBtn = page.getByRole('button', { name: 'TypedDict (Python 3.8+)' });
    await typedDictBtn.click();
    await expect(typedDictBtn).toHaveAttribute('aria-pressed', 'true');

    const outputArea = page.locator('#python-output');
    await expect(outputArea).toContainText('from typing import TypedDict');
    await expect(outputArea).toContainText('class RootObject(TypedDict):');
    await expect(outputArea).not.toContainText('@dataclass');

    const dataclassBtn = page.getByRole('button', { name: 'Dataclasses (Python 3.7+)' });
    await dataclassBtn.click();
    await expect(dataclassBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toContainText('@dataclass');
  });

  test('clears input and restores focus using Clear button and Escape hotkey', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: /Clear|Effacer/i });
    await clearBtn.click();

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#python-output');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Type custom JSON and test Escape key reset
    await inputArea.fill('{"test_key": 123}');
    await expect(outputArea).toContainText('test_key: int');

    // Click outside input to blur, then press Escape
    await page.locator('body').click();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('copies python output using C shortcut key', async ({ page, context }) => {
    await page.evaluate(() => {
      (window as any).__lastClipboardText = '';
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).__lastClipboardText = text;
      };
    });

    await page.locator('#json-input').focus();
    await page.locator('body').click(); // Blur editable field
    await page.keyboard.press('c');

    const copiedText = await page.evaluate(() => (window as any).__lastClipboardText);
    expect(copiedText).toContain('@dataclass');
  });
});
