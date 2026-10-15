import { test, expect } from '@playwright/test';

test.describe('Sentinel Security: SQL to Protobuf / Thrift Comment Breakout Prevention', () => {
  test('SQLToProtobuf: column names with newlines do not break out of single-line comment annotations', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-protobuf');
    await page.waitForLoadState('networkidle');

    // Input SQL CREATE TABLE where quoted column name contains newlines and injected Protobuf syntax
    await page.fill('#sql-proto-input', `
      CREATE TABLE users (
        "package\\nmessage MaliciousMessage {\\n  string injected = 1;\\n}" INT PRIMARY KEY
      );
    `);

    const output = await page.locator('#proto-output').inputValue();

    // Verify output maintains a single comment line without newline breakout
    expect(output).not.toContain('\nmessage MaliciousMessage');
    expect(output).toContain('// original: package message MaliciousMessage { string injected = 1; }');
  });

  test('SQLToThrift: column names with newlines do not break out of single-line comment annotations', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-thrift');
    await page.waitForLoadState('networkidle');

    // Input SQL CREATE TABLE where quoted column name contains newlines and injected Thrift syntax
    await page.fill('#sql-thrift-input', `
      CREATE TABLE users (
        "struct\\nstruct InjectedStruct {\\n  1: string payload;\\n}" INT PRIMARY KEY
      );
    `);

    const output = await page.locator('#thrift-output').inputValue();

    // Verify output maintains a single comment line without newline breakout
    expect(output).not.toContain('\nstruct InjectedStruct');
    expect(output).toContain('// original: struct struct InjectedStruct { 1: string payload; }');
  });
});
