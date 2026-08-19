import { test, expect } from '@playwright/test';

test.describe('Sentinel: PHP Snippet Injection Mitigation', () => {
  test('JSONToPHP escapes malicious keys in fromArray array key access and comments', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-php');

    const maliciousJson = JSON.stringify({
      "foo' ] );\n system('id'); //": 1
    });

    await page.fill('#json-input', maliciousJson);

    await page.waitForTimeout(1000);

    const output = await page.inputValue('#php-output');

    // Check that single quotes are escaped in $data['...']
    expect(output).toContain("$data['foo\\' ] );\n system(\\'id\\'); //']");

    // Verify that NO unescaped malicious breakout code exists
    expect(output).not.toContain("$data['foo' ] );");
  });
});
