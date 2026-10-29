import { test, expect } from '@playwright/test';

test.describe('GraphQL to NATS JetStream and Aspect Ratio Calculator UX tests', () => {
  test('GraphQLToNats renders, handles presets, options, and conversion formats', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-nats');

    await expect(page.locator('#graphql-nats-input')).toBeVisible({ timeout: 10000 });

    // Verify preset selection
    const telemetryPreset = page.getByRole('button', { name: /Realtime Analytics Telemetry/i });
    await expect(telemetryPreset).toBeVisible();
    await telemetryPreset.click();

    await expect(telemetryPreset).toHaveAttribute('aria-pressed', 'true');

    // Input area should contain MetricRecorded
    const inputArea = page.locator('#graphql-nats-input');
    await expect(inputArea).toHaveValue(/MetricRecorded/);

    // Output area should contain NATS stream config JSON by default
    const outputArea = page.locator('#nats-output');
    await expect(outputArea).toHaveValue(/"name":\s*"ORDERS_STREAM"/);
    await expect(outputArea).toHaveValue(/orders\.metric_recorded/);

    // Switch output format to Go NATS
    const styleSelect = page.locator('#graphql-nats-style');
    await styleSelect.selectOption('go_nats');

    await expect(outputArea).toHaveValue(/package main/);
    await expect(outputArea).toHaveValue(/type MetricRecorded struct/);
    await expect(outputArea).toHaveValue(/github\.com\/nats-io\/nats\.go/);

    // Switch output format to Node.js nats.js
    await styleSelect.selectOption('node_nats');
    await expect(outputArea).toHaveValue(/import \{ connect, JSONCodec \} from 'nats'/);
    await expect(outputArea).toHaveValue(/js\.publish/);

    // Verify clear button
    const clearBtn = page.locator('button').filter({ hasText: /Clear|Effacer/i }).first();
    await clearBtn.click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(telemetryPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('AspectRatioCalculator supports presets, focus restoration, and manual edit state clearance', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/aspect-ratio');

    const widthInput = page.locator('#width');
    const heightInput = page.locator('#height');

    await expect(widthInput).toBeVisible({ timeout: 10000 });
    await expect(widthInput).toHaveValue('1920');
    await expect(heightInput).toHaveValue('1080');

    // Default 16:9 preset button should be active
    const ratio169Btn = page.getByRole('button', { name: /16:9/i });
    await expect(ratio169Btn).toHaveAttribute('aria-pressed', 'true');

    // Click 4:3 preset button
    const ratio43Btn = page.getByRole('button', { name: /4:3/i });
    await ratio43Btn.click();

    await expect(ratio43Btn).toHaveAttribute('aria-pressed', 'true');
    await expect(ratio169Btn).toHaveAttribute('aria-pressed', 'false');
    await expect(heightInput).toHaveValue('1440');

    // Editing width should clear active preset
    await widthInput.fill('2000');
    await expect(ratio43Btn).toHaveAttribute('aria-pressed', 'false');

    // Click Clear button
    const clearBtn = page.locator('button').filter({ hasText: /Clear|Effacer/i }).first();
    await clearBtn.click();

    await expect(widthInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');
    await expect(widthInput).toBeFocused();
  });
});
