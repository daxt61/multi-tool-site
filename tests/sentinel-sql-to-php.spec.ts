import { test, expect } from '@playwright/test';

test.describe('Sentinel: SQL to PHP Namespace and Closing Tag Injection Mitigation', () => {
  test('SQLToPHP sanitizes malicious namespace inputs and neutralizes PHP closing tags in comments', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/sql-to-php');

    // 1. Fill SQL DDL with a column name containing PHP closing tags ?>
    const sqlInput = `CREATE TABLE users (
      id INT PRIMARY KEY,
      bad_col_?>_breakout VARCHAR(100) NOT NULL
    );`;

    await page.fill('#sql-php-input', sqlInput);

    // 2. Fill Namespace input with malicious breakout attempt containing newlines, semicolons, and PHP closing tags
    const maliciousNamespace = `App\\DTOs; ?> <?php system('id'); // \n\\MaliciousNamespace`;
    await page.fill('#namespace-input', maliciousNamespace);

    await page.waitForTimeout(500);

    const output = await page.inputValue('#php-output');

    // 3. Verify namespace is sanitized to valid identifier characters without newlines, semicolons, or unescaped ?> closing tags
    expect(output).toContain('namespace App\\DTOsphpsystemid\\MaliciousNamespace;');
    expect(output).not.toContain('namespace App\\DTOs;');
    expect(output).not.toContain('system(\'id\')');

    // 4. Verify single-line comment neutralizes ?> to ? > so PHP parser does not exit code block
    expect(output).toContain('// Original column: bad_col_? >_breakout');
    expect(output).not.toContain('// Original column: bad_col_?>_breakout');
  });
});
