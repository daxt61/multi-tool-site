import { test, expect } from '@playwright/test';

test.describe('JSON to Avro Converter Upgrade UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-avro');
    await page.waitForLoadState('networkidle');
  });

  test('should render and convert default JSON to Avro schema reactively', async ({ page }) => {
    const outputArea = page.locator('#avro-output');
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('"type": "record"');
    expect(outputText).toContain('"name": "UserProfile"');
    expect(outputText).toContain('"namespace": "com.example.user"');
    expect(outputText).toContain('"name": "email"');
  });

  test('should load quick presets and update output', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Commande E-Commerce' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const outputArea = page.locator('#avro-output');
    await expect(outputArea).toHaveValue(/"name": "Order"/);
    await expect(outputArea).toHaveValue(/"namespace": "com.shop.orders"/);
  });

  test('should sanitize dangerous object keys and field names', async ({ page }) => {
    const inputArea = page.locator('#avro-json-input');
    await inputArea.fill(JSON.stringify({
      "__proto__": "polluted",
      "constructor": "dangerous",
      "123numeric": "valid_value",
      "user-name!": "john"
    }));

    const outputArea = page.locator('#avro-output');
    await page.waitForTimeout(400);

    const outputText = await outputArea.inputValue();
    expect(outputText).not.toContain('"__proto__"');
    expect(outputText).not.toContain('"constructor"');
    expect(outputText).toContain('"name": "f_123numeric"');
    expect(outputText).toContain('"name": "user_name_"');
  });

  test('should support clear action and keyboard shortcuts', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: /Effacer/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    const inputArea = page.locator('#avro-json-input');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Type a simple JSON
    await inputArea.fill('{"age": 30}');
    await page.waitForTimeout(300);

    // Press Esc when unfocused
    await inputArea.blur();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
