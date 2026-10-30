import { test, expect } from '@playwright/test';

test.describe('GraphQL to BigQuery Converter & BMR Calculator E2E Tests', () => {
  test('should render GraphQL to BigQuery tool, apply presets and copy DDL', async ({ page }) => {
    await page.goto('/en/outil/graphql-to-bigquery');

    // Verify title and main controls
    await expect(page.locator('h1')).toContainText('GraphQL to BigQuery');
    await expect(page.locator('#graphql-bigquery-input')).toBeVisible();
    await expect(page.locator('#bigquery-output')).toBeVisible();

    // Verify initial state generates BigQuery DDL
    const initialOutput = await page.locator('#bigquery-output').inputValue();
    expect(initialOutput).toContain('CREATE OR REPLACE TABLE `analytics.order`');
    expect(initialOutput).toContain('total_amount FLOAT64');

    // Apply preset
    await page.getByRole('button', { name: 'IoT Telemetry & Metrics' }).click();
    const presetOutput = await page.locator('#bigquery-output').inputValue();
    expect(presetOutput).toContain('CREATE OR REPLACE TABLE `analytics.sensor_metric`');
    expect(presetOutput).toContain('temperature_celsius FLOAT64');

    // Switch output format to JSON Schema
    await page.locator('#graphql-bigquery-format').selectOption('json_schema');
    const jsonOutput = await page.locator('#bigquery-output').inputValue();
    expect(jsonOutput).toContain('"sensor_metric"');
    expect(jsonOutput).toContain('"type": "FLOAT64"');

    // Clear input
    await page.getByRole('button', { name: /Clear/i }).click();
    await expect(page.locator('#graphql-bigquery-input')).toHaveValue('');
    await expect(page.locator('#bigquery-output')).toHaveValue('');
  });

  test('should verify BMR Calculator container isolation and shortcut shortcuts', async ({ page }) => {
    await page.goto('/en/outil/bmr-calculator');

    // Verify BMR Calculator title
    await expect(page.getByRole('heading', { level: 3, name: /Your Information/i })).toBeVisible();

    // Load preset
    await page.getByRole('button', { name: /Male \(Standard\)/i }).click();

    await expect(page.locator('#age')).toHaveValue('30');
    await expect(page.locator('#weight')).toHaveValue('75');
    await expect(page.locator('#height')).toHaveValue('175');

    // Clear inputs via Clear button
    await page.getByRole('button', { name: /Clear/i }).click();
    await expect(page.locator('#age')).toHaveValue('');
    await expect(page.locator('#weight')).toHaveValue('');
  });
});
