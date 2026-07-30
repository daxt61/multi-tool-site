import { test, expect } from '@playwright/test';

test.describe('Bencode Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/bencode-converter');
  });

  test('should render elements and default placeholders', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Convertisseur Bencode/i);

    const bencodeInput = page.locator('#bencode-input');
    await expect(bencodeInput).toHaveAttribute('placeholder', 'd3:bar4:spam3:fooi42ee');
  });

  test('should parse bencode into readable JSON', async ({ page }) => {
    const bencodeInput = page.locator('#bencode-input');
    const jsonOutput = page.locator('#json-output');

    // Enter a valid bencode string
    await bencodeInput.fill('d4:testi100e4:listli1ei2ei3eee');

    const jsonValue = await jsonOutput.inputValue();
    const parsed = JSON.parse(jsonValue);

    expect(parsed.test).toBe(100);
    expect(parsed.list).toEqual([1, 2, 3]);
  });

  test('should encode JSON into bencode string', async ({ page }) => {
    const bencodeInput = page.locator('#bencode-input');
    const jsonOutput = page.locator('#json-output');

    // Enter valid JSON string
    const sampleObj = { hello: 'world', count: 7 };
    await jsonOutput.fill(JSON.stringify(sampleObj, null, 2));

    // Bencode output should update
    await expect(bencodeInput).toHaveValue('d5:counti7e5:hello5:worlde');
  });

  test('should handle clear action and reset state', async ({ page }) => {
    const bencodeInput = page.locator('#bencode-input');
    const jsonOutput = page.locator('#json-output');

    await bencodeInput.fill('i42e');
    await expect(jsonOutput).toHaveValue('42');

    // Clear using standard button
    const clearBtn = page.locator('button:has-text("Effacer")');
    await clearBtn.click();

    await expect(bencodeInput).toBeEmpty();
    await expect(jsonOutput).toBeEmpty();
    await expect(bencodeInput).toBeFocused();
  });
});
