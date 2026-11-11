import { test, expect } from '@playwright/test';

test.describe('OnlineTools List Utilities (ListItemWrapper & ListItemUnwrapper)', () => {
  const BASE_URL = 'http://localhost:5173';

  test.describe('List Item Wrapper (ListItemWrapper.tsx)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/en/outil/list-item-wrapper`);
      await page.waitForLoadState('networkidle');
    });

    test('renders default preset and wrapped output correctly', async ({ page }) => {
      const input = page.locator('#list-wrapper-input');
      const output = page.locator('#list-wrapper-output');

      await expect(input).toBeVisible();
      await expect(output).toBeVisible();

      // Check default preset (Types of Airplanes)
      await expect(output).toHaveValue(/Turboprop Aircraft\nPiston Aircraft\nNarrow Body Aircraft/);

      // Verify active preset state
      const defaultPresetBtn = page.getByRole('button', { name: /Types of Airplanes/i });
      await expect(defaultPresetBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('switches presets and updates prefixes and suffixes', async ({ page }) => {
      const output = page.locator('#list-wrapper-output');

      // Click Price List Preset
      const pricePresetBtn = page.getByRole('button', { name: /Price List/i });
      await pricePresetBtn.click();
      await expect(pricePresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify price list wrapping output
      await expect(output).toHaveValue(/product 1: 100€ \(EUR\)\nproduct 2: 200€ \(EUR\)/);

      // Click Italian Numbers Preset (Regex split + pipe join)
      const italianPresetBtn = page.getByRole('button', { name: /Italian Numbers/i });
      await italianPresetBtn.click();
      await expect(italianPresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify pipe delimited output
      await expect(output).toHaveValue(/numero uno \| numero due \| numero tre/);
    });

    test('manual input editing clears active preset selection', async ({ page }) => {
      const input = page.locator('#list-wrapper-input');
      const presetBtn = page.getByRole('button', { name: /Types of Airplanes/i });
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

      await input.fill('Rocket\nSpaceship');
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');

      const output = page.locator('#list-wrapper-output');
      await expect(output).toHaveValue('Rocket Aircraft\nSpaceship Aircraft');
    });

    test('supports custom left and right wrap text', async ({ page }) => {
      const input = page.locator('#list-wrapper-input');
      const leftWrap = page.locator('#left-wrap-input');
      const rightWrap = page.locator('#right-wrap-input');
      const output = page.locator('#list-wrapper-output');

      await input.fill('apple\nbanana\ncherry');
      await leftWrap.fill('<b>');
      await rightWrap.fill('</b>');

      await expect(output).toHaveValue('<b>apple</b>\n<b>banana</b>\n<b>cherry</b>');
    });
  });

  test.describe('List Item Unwrapper (ListItemUnwrapper.tsx)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/en/outil/list-item-unwrapper`);
      await page.waitForLoadState('networkidle');
    });

    test('renders default preset and unwrapped pure output correctly', async ({ page }) => {
      const input = page.locator('#list-unwrapper-input');
      const output = page.locator('#list-unwrapper-output');

      await expect(input).toBeVisible();
      await expect(output).toBeVisible();

      // Check default preset (Ordinal Numbers)
      await expect(output).toHaveValue(/^first\nsecond\nthird/);

      // Verify active preset state
      const defaultPresetBtn = page.getByRole('button', { name: /Ordinal Numbers/i });
      await expect(defaultPresetBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('switches presets and handles multi-prefix unwrapping', async ({ page }) => {
      const output = page.locator('#list-unwrapper-output');

      // Click Wedding Guests Preset
      const weddingPresetBtn = page.getByRole('button', { name: /Wedding Guests/i });
      await weddingPresetBtn.click();
      await expect(weddingPresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify honorific prefixes (Mr, Mrs, Miss, Ms) stripped and joined with comma
      await expect(output).toHaveValue(/Lewis, Lane, Lopez, Strait, William/);

      // Click Cake Flavors Preset
      const cakePresetBtn = page.getByRole('button', { name: /Cake Flavors/i });
      await cakePresetBtn.click();
      await expect(cakePresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify suffix stripped and dot joined
      await expect(output).toHaveValue(/Coffee\. Banana\. Funfetti\. Lemon/);
    });

    test('supports multilevel / recursive unwrapping', async ({ page }) => {
      const output = page.locator('#list-unwrapper-output');

      // Click Atmosphere Layers Preset (deep multilevel bullets)
      const layersPresetBtn = page.getByRole('button', { name: /Atmosphere Layers/i });
      await layersPresetBtn.click();
      await expect(layersPresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify nested ▪ bullets completely removed
      await expect(output).toHaveValue('troposphere\nstratosphere\nmesosphere\nthermosphere\nexosphere');
    });

    test('clearing input clears active preset state', async ({ page }) => {
      const input = page.locator('#list-unwrapper-input');
      const presetBtn = page.getByRole('button', { name: /Ordinal Numbers/i });
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

      await input.fill('custom test item');
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
