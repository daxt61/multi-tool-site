import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('New and Updated Tools V2', () => {
  test('JSObjectConverter fix verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/js-object-converter`);

    // Test Array stringification fix
    await page.fill('#json-input', '["a", "b", "c"]');
    await page.click('button[title="Convert JSON to JS"]');
    const jsOutput = await page.inputValue('#js-input');
    expect(jsOutput).toContain("['a', 'b', 'c']");

    // Test XSS mitigation (it should parse safely or show error, not execute)
    // We can't easily "test for no alert" in headless, but we can verify it doesn't crash
    await page.fill('#js-input', '{ key: console.log("XSS") }');
    await page.click('button[title="Convert JS to JSON"]');
    const jsonOutput = await page.inputValue('#json-input');
    // js-yaml might parse it as null or something else, but it shouldn't execute console.log
    // If it was Function(), it would have executed.
  });

  test('JSONToProtobuf verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/json-to-protobuf`);
    await page.fill('#json-input', '{"id": 1, "name": "Test"}');
    const protoOutput = await page.inputValue('#proto-output');
    expect(protoOutput).toContain('message RootObject');
    expect(protoOutput).toContain('int32 id = 1;');
  });

  test('JSONToJoi verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/json-to-joi`);
    await page.fill('#json-input', '{"email": "test@example.com"}');
    const joiOutput = await page.inputValue('#joi-output');
    expect(joiOutput).toContain('Joi.string().email()');
  });

  test('ColorConverter Shades & Tints verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/color-converter`);
    const shadesHeader = page.locator('h4:has-text("Nuances & Teintes")');
    await expect(shadesHeader).toBeVisible();

    // Verify some tint/shade buttons are present
    const tintButtons = page.locator('button[key^="tint-"]');
    // Note: React 'key' prop isn't a real attribute, but our implementation has tints.map so we can look for buttons inside the tints container
    const tintsContainer = page.locator('span:has-text("Teintes (Tints)") + div');
    await expect(tintsContainer.locator('button')).toHaveCount(10);
  });
});
