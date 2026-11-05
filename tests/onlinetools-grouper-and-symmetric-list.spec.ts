import { test, expect } from '@playwright/test';

test.describe('OnlineTools List Utilities Suite: List Item Grouper & Symmetric List Creator', () => {
  test('List Item Grouper: Loads presets, changes group size, wrapping, padding, and copies output', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-item-grouper');
    await expect(page.locator('h1')).toContainText('Group List Items');

    // Test default preset (Alphabet Trigrams)
    const trigramBtn = page.getByRole('button', { name: 'Alphabet Trigrams (Size 3 + Pad)' });
    await expect(trigramBtn).toBeVisible();
    await expect(trigramBtn).toHaveAttribute('aria-pressed', 'true');

    const input = page.locator('#list-grouper-input');
    await expect(input).toHaveValue(/a;b;c;d;e/);

    const output = page.locator('#list-grouper-output');
    // Output should contain [a, b, c] and end with padded [y, z, _]
    await expect(output).toHaveValue(/\[a, b, c\]/);
    await expect(output).toHaveValue(/\[y, z, _\]/);

    // Switch to Hexagon Coordinates (Pairs)
    const vectorPresetBtn = page.getByRole('button', { name: 'Hexagon Coordinates (Pairs)' });
    await vectorPresetBtn.click();
    await expect(vectorPresetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveValue(/\(2\.5, 9\.33\);/);

    // Switch to Food Menu TSV
    const tsvPresetBtn = page.getByRole('button', { name: 'Food Menu 3-Column TSV' });
    await tsvPresetBtn.click();
    await expect(tsvPresetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveValue(/beef\tbuns\tcake/);

    // Manual change clears active preset
    await page.locator('#group-size-input').fill('2');
    await expect(tsvPresetBtn).toHaveAttribute('aria-pressed', 'false');

    // Test Copy button
    const copyBtn = page.getByTitle(/Copy/i);
    await copyBtn.click();
    await expect(page.locator('text=Grouped list copied to clipboard!')).toBeVisible();

    // Test Clear button
    const clearBtn = page.getByTitle(/Clear/i);
    await clearBtn.click();
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('Symmetric List Creator: Verifies mirrored, centered, and minimal symmetry modes', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/symmetric-list-creator');
    await expect(page.locator('h1')).toContainText('Create Symmetric List');

    // Default preset: Unicode Height Wave (Centered)
    const wavePresetBtn = page.getByRole('button', { name: 'Unicode Height Wave (Centered)' });
    await expect(wavePresetBtn).toBeVisible();
    await expect(wavePresetBtn).toHaveAttribute('aria-pressed', 'true');

    const input = page.locator('#symmetric-list-input');
    const output = page.locator('#symmetric-list-output');

    // Centered mode: last element █ is pivot and appears once
    await expect(output).toHaveValue(/▁ ▂ ▃ ▄ ▅ ▆ ▇ █ ▇ ▆ ▅ ▄ ▃ ▂ ▁/);

    // Switch to Classical Elements (Minimal mode)
    const elementsPresetBtn = page.getByRole('button', { name: 'Classical Elements (Minimal)' });
    await elementsPresetBtn.click();
    await expect(elementsPresetBtn).toHaveAttribute('aria-pressed', 'true');

    // Minimal symmetry on Fire\nAir\nWater\nEarth\nWater -> only appends Air\nFire
    await expect(output).toHaveValue(/Fire\nAir\nWater\nEarth\nWater\nAir\nFire/);

    // Switch to Greek Alphabet (Mirrored mode)
    const greekPresetBtn = page.getByRole('button', { name: 'Greek Alphabet (Mirrored)' });
    await greekPresetBtn.click();
    await expect(greekPresetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveValue(/Omega Omega/);

    // Switch to character delimiter with comma and join with comma-space
    await page.getByRole('button', { name: 'Character' }).click();
    await page.locator('#sym-delimiter-value').fill(',');
    await page.locator('#join-separator-input').fill(', ');

    // Manual input test: simple custom array
    await input.fill('a, b, c');
    // In mirrored mode, becomes a, b, c, c, b, a
    await page.getByRole('button', { name: /Mirrored Symmetry/i }).click();
    await expect(output).toHaveValue('a, b, c, c, b, a');

    // Switch to centered mode: becomes a, b, c, b, a
    await page.getByRole('button', { name: /Centered Symmetry/i }).click();
    await expect(output).toHaveValue('a, b, c, b, a');

    // Test Copy button
    const copyBtn = page.getByTitle(/Copy/i);
    await copyBtn.click();
    await expect(page.locator('text=Symmetric list copied to clipboard!')).toBeVisible();

    // Test Clear button
    const clearBtn = page.getByTitle(/Clear/i);
    await clearBtn.click();
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
