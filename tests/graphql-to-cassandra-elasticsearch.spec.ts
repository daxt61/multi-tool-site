import { test, expect } from '@playwright/test';

test.describe('GraphQL to Cassandra and Elasticsearch Converters', () => {
  test('GraphQLToCassandra converts SDL into Cassandra CQL schema', async ({ page }) => {
    await page.goto('/en/outil/graphql-to-cassandra');

    // Check title
    await expect(page.locator('h1')).toContainText('GraphQL to Cassandra CQL');

    // Load preset
    await page.click('button:has-text("IoT Sensor Telemetry")');

    // Verify textarea output
    const output = await page.inputValue('#cassandra-output');
    expect(output).toContain('CREATE KEYSPACE IF NOT EXISTS app_keyspace');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS sensor_reading');
    expect(output).toContain('sensor_id uuid');
    expect(output).toContain('reading_timestamp timestamp');
    expect(output).toContain('PRIMARY KEY (sensor_id)');

    // Test clear
    await page.click('button:has-text("Clear")');
    expect(await page.inputValue('#graphql-cassandra-input')).toBe('');
    expect(await page.inputValue('#cassandra-output')).toBe('');
  });

  test('GraphQLToElasticsearch converts SDL into Elasticsearch Index Mappings', async ({ page }) => {
    await page.goto('/en/outil/graphql-to-elasticsearch');

    // Check title
    await expect(page.locator('h1')).toContainText('GraphQL to Elasticsearch Mapping');

    // Load preset
    await page.click('button:has-text("E-Commerce Catalog")');

    // Verify textarea output
    const output = await page.inputValue('#elasticsearch-output');
    expect(output).toContain('"products"');
    expect(output).toContain('"properties"');
    expect(output).toContain('"title"');
    expect(output).toContain('"type": "text"');
    expect(output).toContain('"price"');
    expect(output).toContain('"type": "double"');

    // Test output mode change to cURL
    await page.selectOption('#es-output-mode', 'curl');
    const curlOutput = await page.inputValue('#elasticsearch-output');
    expect(curlOutput).toContain('curl -X PUT "http://localhost:9200/products"');

    // Test clear
    await page.click('button:has-text("Clear")');
    expect(await page.inputValue('#graphql-elasticsearch-input')).toBe('');
    expect(await page.inputValue('#elasticsearch-output')).toBe('');
  });
});
