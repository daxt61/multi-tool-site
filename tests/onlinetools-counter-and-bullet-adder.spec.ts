import { test, expect } from '@playwright/test';

test.describe('OnlineTools List Utilities (List Item Counter & List Bullet Adder)', () => {
  const BASE_URL = 'http://localhost:5173';

  test.describe('List Item Counter (ListItemCounter.tsx)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/en/outil/list-item-counter`);
      await page.waitForLoadState('networkidle');
    });

    test('renders tool and initial preset correctly', async ({ page }) => {
      const input = page.locator('#list-counter-input');
      const output = page.locator('#list-counter-output');

      await expect(input).toBeVisible();
      await expect(output).toBeVisible();

      // Check default preset (Grocery Checklist)
      await expect(output).toHaveValue(/1\.\s+Apples\n2\.\s+Bananas\n3\.\s+Almond Milk/);

      // Verify active preset state
      const defaultPresetBtn = page.getByRole('button', { name: /Grocery Checklist/i });
      await expect(defaultPresetBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('switches presets and updates numbering systems', async ({ page }) => {
      const output = page.locator('#list-counter-output');

      // Click Roman Countdown Preset
      const romanPresetBtn = page.getByRole('button', { name: /Countdown in Roman/i });
      await romanPresetBtn.click();
      await expect(romanPresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify Roman countdown output
      await expect(output).toHaveValue(/#X:\s+Alpha\n#IX:\s+Beta\n#VIII:\s+Gamma/);

      // Click Alphabetical Column Preset
      const alphaPresetBtn = page.getByRole('button', { name: /Alphabetical Column/i });
      await alphaPresetBtn.click();
      await expect(alphaPresetBtn).toHaveAttribute('aria-pressed', 'true');

      // Verify alphabetical formatting
      await expect(output).toHaveValue(/\[a\]\s+white\n\[b\]\s+whitesmoke\n\[c\]\s+gainsboro/);
    });

    test('manual input clearing and typing clears active preset', async ({ page }) => {
      const input = page.locator('#list-counter-input');
      const output = page.locator('#list-counter-output');

      const presetBtn = page.getByRole('button', { name: /Grocery Checklist/i });
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

      // Manually change input
      await input.fill('One\nTwo\nThree');
      await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
      await expect(output).toHaveValue('1. One\n2. Two\n3. Three');
    });

    test('supports zero-indexing, custom join character, and copying', async ({ page }) => {
      const input = page.locator('#list-counter-input');
      const output = page.locator('#list-counter-output');
      const joinInput = page.locator('#join-separator-input');
      const startZeroCheckbox = page.getByLabel(/Start from Zero/i);

      await input.fill('Red\nGreen\nBlue');
      await startZeroCheckbox.check();
      await joinInput.fill(', ');

      await expect(output).toHaveValue('0. Red, 1. Green, 2. Blue');

      // Test copy button
      const copyBtn = page.getByTitle('Copy (C)');
      await copyBtn.click();
      await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    });
  });

  test.describe('List Bullet Adder (ListBulletAdder.tsx)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/en/outil/list-bullet-adder`);
      await page.waitForLoadState('networkidle');
    });

    test('renders tool and initial preset correctly', async ({ page }) => {
      const input = page.locator('#list-bullet-input');
      const output = page.locator('#list-bullet-output');

      await expect(input).toBeVisible();
      await expect(output).toBeVisible();

      // Check default preset (Workshop Checklist with •)
      await expect(output).toHaveValue(/• Establish goals\n• Put together a budget/);

      const defaultPresetBtn = page.getByRole('button', { name: /Workshop Checklist/i });
      await expect(defaultPresetBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('switches presets across arrows, checkmarks, and custom bullets', async ({ page }) => {
      const output = page.locator('#list-bullet-output');

      // Arrow words preset
      const arrowPresetBtn = page.getByRole('button', { name: /Top Lighted Arrow/i });
      await arrowPresetBtn.click();
      await expect(arrowPresetBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(output).toHaveValue(/➢ Cow\t➢ Egg\t➢ Bag/);

      // Music notes with custom ♫
      const musicPresetBtn = page.getByRole('button', { name: /Music Genres/i });
      await musicPresetBtn.click();
      await expect(musicPresetBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(output).toHaveValue(/♫ disco\n♫ blues\n♫ electro/);

      // Completed sprints with ✓
      const sprintPresetBtn = page.getByRole('button', { name: /Completed Sprints/i });
      await sprintPresetBtn.click();
      await expect(sprintPresetBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(output).toHaveValue(/✓ Database schema migration\n✓ OAuth2 Authentication/);
    });

    test('custom glyph input and copy action', async ({ page }) => {
      const input = page.locator('#list-bullet-input');
      const output = page.locator('#list-bullet-output');
      const glyphSelect = page.locator('#bullet-glyph-select');

      await input.fill('First Item\nSecond Item');
      await glyphSelect.selectOption('custom');

      const customInput = page.locator('#custom-bullet-input');
      await customInput.fill('🔥');

      await expect(output).toHaveValue('🔥 First Item\n🔥 Second Item');

      const copyBtn = page.getByTitle('Copy (C)');
      await copyBtn.click();
      await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    });
  });
});
