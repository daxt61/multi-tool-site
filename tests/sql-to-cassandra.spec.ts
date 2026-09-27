import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Apache Cassandra CQL Schema Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-cassandra');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool header and main elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL DDL to Apache Cassandra');
    await expect(page.locator('#sql-cassandra-input')).toBeVisible();
    await expect(page.locator('#cassandra-output')).toBeVisible();
    await expect(page.locator('#sql-cassandra-keyspace')).toHaveValue('store_keyspace');
  });

  test('converts default preset SQL DDL to Apache Cassandra CQL correctly', async ({ page }) => {
    await expect(page.locator('#cassandra-output')).not.toHaveValue('');
    const output = await page.locator('#cassandra-output').inputValue();
    expect(output).toContain('CREATE KEYSPACE IF NOT EXISTS store_keyspace');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS sensor_readings');
    expect(output).toContain('sensor_id text');
    expect(output).toContain('reading_timestamp timestamp');
    expect(output).toContain('PRIMARY KEY (sensor_id, reading_timestamp)');
  });

  test('switches quick start presets and updates output', async ({ page }) => {
    await page.click('button:has-text("User Auth & Sessions")');
    const input = await page.locator('#sql-cassandra-input').inputValue();
    expect(input).toContain('user_sessions');

    const output = await page.locator('#cassandra-output').inputValue();
    expect(output).toContain('CREATE TABLE IF NOT EXISTS user_sessions');
    expect(output).toContain('user_id text');
    expect(output).toContain('is_active boolean');
  });

  test('respects keyspace customization and toggle option', async ({ page }) => {
    await page.fill('#sql-cassandra-keyspace', 'custom_analytics');
    let output = await page.locator('#cassandra-output').inputValue();
    expect(output).toContain('CREATE KEYSPACE IF NOT EXISTS custom_analytics');
    expect(output).toContain('USE custom_analytics;');

    await page.uncheck('input[type="checkbox"]');
    output = await page.locator('#cassandra-output').inputValue();
    expect(output).not.toContain('CREATE KEYSPACE');
    expect(output).not.toContain('USE custom_analytics;');
  });

  test('handles custom partition and clustering keys', async ({ page }) => {
    await page.fill('#sql-cassandra-partition', 'sensor_id, status');
    await page.fill('#sql-cassandra-clustering', 'reading_timestamp');

    const output = await page.locator('#cassandra-output').inputValue();
    expect(output).toContain('PRIMARY KEY ((sensor_id, status), reading_timestamp)');
  });

  test('handles keyboard shortcuts (Esc clear and Ctrl+C copy)', async ({ page }) => {
    await page.focus('#sql-cassandra-input');
    await page.keyboard.press('Escape');

    await expect(page.locator('#sql-cassandra-input')).toHaveValue('');
    await expect(page.locator('#cassandra-output')).toHaveValue('');
    await expect(page.locator('#sql-cassandra-input')).toBeFocused();
  });
});
