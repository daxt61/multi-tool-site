import { test, expect } from '@playwright/test';

test.describe('GraphQL to ClickHouse Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-clickhouse');
  });

  test('renders initial layout and default conversion', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText('GraphQL to ClickHouse');

    const inputArea = page.locator('#graphql-clickhouse-input');
    const outputArea = page.locator('#clickhouse-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('CREATE TABLE IF NOT EXISTS `order`');
    expect(outputText).toContain('`id` UUID');
    expect(outputText).toContain('`total_amount` Float64');
    expect(outputText).toContain('ENGINE = MergeTree()');
    expect(outputText).toContain('ORDER BY (id)');
  });

  test('switches quick presets and updates selection state', async ({ page }) => {
    const telemetryBtn = page.getByRole('button', { name: /User Activity Telemetry/i });
    await expect(telemetryBtn).toBeVisible();
    await expect(telemetryBtn).toHaveAttribute('aria-pressed', 'false');

    await telemetryBtn.click();
    await expect(telemetryBtn).toHaveAttribute('aria-pressed', 'true');

    const outputArea = page.locator('#clickhouse-output');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('CREATE TABLE IF NOT EXISTS `user_event`');
    expect(outputText).toContain('`user_id` String');
    expect(outputText).toContain('`duration_ms` Int32');
  });

  test('handles configuration option changes (casing, engine, Nullable, custom ORDER BY)', async ({ page }) => {
    // Change casing to camelCase
    await page.selectOption('#graphql-clickhouse-casing', 'camelCase');
    // Change engine to ReplacingMergeTree
    await page.selectOption('#graphql-clickhouse-engine', 'ReplacingMergeTree');
    // Set custom ORDER BY
    await page.fill('#graphql-clickhouse-orderby', 'customerUuid, orderNumber');

    const outputArea = page.locator('#clickhouse-output');
    const outputText = await outputArea.inputValue();

    expect(outputText).toContain('CREATE TABLE IF NOT EXISTS `order`');
    expect(outputText).toContain('`customerUuid` String');
    expect(outputText).toContain('ENGINE = ReplacingMergeTree()');
    expect(outputText).toContain('ORDER BY (customerUuid, orderNumber)');
  });

  test('clears inputs when clicking Clear button', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();

    const inputArea = page.locator('#graphql-clickhouse-input');
    const outputArea = page.locator('#clickhouse-output');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
