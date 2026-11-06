import { test, expect } from '@playwright/test';

test.describe('Onlinetools List Rotator & List Length Changer Tests', () => {
  const BASE_URL = 'http://localhost:5173';

  test('List Rotator - loads default preset, rotates forward/backward, and resets', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-rotator`);

    // Verify title and main elements
    await expect(page.locator('h1')).toContainText('Rotate a List');
    const input = page.locator('#list-rotator-input');
    const output = page.locator('#list-rotator-output');

    // Default preset is Hungarian Alphabet (size 44, step 22 forward)
    await expect(input).toBeVisible();
    await expect(output).toBeVisible();
    const defaultOutput = await output.inputValue();
    expect(defaultOutput).toContain('Ny, O, Ó');
    expect(defaultOutput).toContain('A, Á, B');

    // Switch to Days of the week preset
    const daysPresetBtn = page.getByRole('button', { name: 'Days of the Week Shift' });
    await daysPresetBtn.click();
    await expect(daysPresetBtn).toHaveAttribute('aria-pressed', 'true');

    // Monday-Sunday rotated forward by 3: Friday, Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday
    await expect(output).toHaveValue('Friday, Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday');

    // Switch direction to backward
    const backwardBtn = page.getByRole('button', { name: 'Left / Up' });
    await backwardBtn.click();
    // Monday-Sunday rotated backward by 3: Thursday, Friday, Saturday, Sunday, Monday, Tuesday, Wednesday
    await expect(output).toHaveValue('Thursday, Friday, Saturday, Sunday, Monday, Tuesday, Wednesday');

    // Test custom input with step 1 forward
    await page.getByRole('button', { name: 'Right / Down' }).click();
    await page.locator('#rotation-step-input').fill('1');
    await input.fill('one, two, three, four, five');
    await expect(output).toHaveValue('five, one, two, three, four');

    // Clear / Reset
    const clearBtn = page.getByTitle('Clear (Esc)');
    await clearBtn.click();
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('List Rotator - handles regex delimiter, join symbols, and hotkeys', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-rotator`);

    // Tree species preset (regex delimiter /\s+/, backward by 4, joiner " | ")
    const treePresetBtn = page.getByRole('button', { name: 'Tree Species Cyclic Shift' });
    await treePresetBtn.click();
    await expect(treePresetBtn).toHaveAttribute('aria-pressed', 'true');

    const output = page.locator('#list-rotator-output');
    const treeOutput = await output.inputValue();
    expect(treeOutput).toContain('Maple | Hornbeam | Birch | Chestnut | Pine | Arborvitae | Larch | Oak | Beech | Sycamore | Spruce | Basswood');

    // Test Esc hotkey to clear input
    await page.locator('#list-rotator-input').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#list-rotator-input')).toHaveValue('');
  });

  test('List Length Changer - expands and pads list with fillers from end and start', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-length-changer`);

    await expect(page.locator('h1')).toContainText('Change List Length');
    const input = page.locator('#list-length-changer-input');
    const output = page.locator('#list-length-changer-output');

    // Default preset is Goods Inventory (extend 9 items to 12 with "Unknown product" from end)
    await expect(input).toBeVisible();
    await expect(output).toBeVisible();
    const goodsOutput = await output.inputValue();
    expect(goodsOutput).toContain('Bed');
    expect(goodsOutput).toContain('Unknown product');
    const lines = goodsOutput.split('\n');
    expect(lines.length).toBe(12);
    expect(lines.slice(9)).toEqual(['Unknown product', 'Unknown product', 'Unknown product']);

    // Hex bytes buffer preset (pads 4 items to 8 with "0x00")
    const hexPresetBtn = page.getByRole('button', { name: '8-Byte Buffer Pad (Size 8)' });
    await hexPresetBtn.click();
    await expect(hexPresetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveValue('0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x00');

    // Change target length to 2 (contraction / truncation from end)
    await page.locator('#target-length-input').fill('2');
    await expect(output).toHaveValue('0xDE, 0xAD');

    // Switch to truncation from start
    await page.getByRole('button', { name: 'From Start', exact: true }).click();
    await expect(output).toHaveValue('0xBE, 0xEF');
  });

  test('List Length Changer - cycles multiple phone numbers from start', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-length-changer`);

    // Phone numbers preset (starts with 8 items, expands to 15 with 3 cycling items prepended from start)
    const phonePresetBtn = page.getByRole('button', { name: 'Cycle Phone Numbers' });
    await phonePresetBtn.click();

    const output = page.locator('#list-length-changer-output');
    const val = await output.inputValue();
    const rows = val.split('\n');
    expect(rows.length).toBe(15);
    expect(rows[0]).toBe('(111)-111-1111');
    expect(rows[1]).toBe('(222) 222-2222');
    expect(rows[2]).toBe('3-333-333-3333');
    expect(rows[3]).toBe('(111)-111-1111');
    expect(rows[7]).toBe('(808)-780-8093'); // First original item

    // Playlist shorten preset (regex delimiter, truncates to 6 items from end)
    const playlistPresetBtn = page.getByRole('button', { name: 'Holiday Playlist Truncation' });
    await playlistPresetBtn.click();
    await expect(output).toHaveValue('White Christmas, The Christmas Song, Frosty the Snowman, Sleigh Ride, Jingle Bells, Merry Christmas');
  });
});
