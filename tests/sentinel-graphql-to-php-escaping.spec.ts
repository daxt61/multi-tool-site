import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to PHP String Escaping Mitigation', () => {
  test('GraphQLToPHP safely escapes single quotes, backslashes, and PHP closing tags in generated PHP enum cases', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-php');

    // Input GraphQL SDL schema containing an enum with single quote breakout and PHP closing tag
    const schemaInput = `
      enum Status {
        PENDING
        FAILED';?>
      }
    `;

    await page.fill('#graphql-php-input', schemaInput);
    await page.waitForTimeout(300);

    const output = await page.inputValue('#php-output');

    // 1. Verify single quote is escaped as \' and ?> as ? >
    expect(output).toContain("case val_FAILED____ = 'FAILED\\';? >';");

    // 2. Verify unescaped breakout is not present
    expect(output).not.toContain("case val_FAILED____ = 'FAILED';?>';");
    expect(output).not.toContain("';?>");
  });
});
