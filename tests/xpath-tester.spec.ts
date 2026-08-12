import { test, expect } from '@playwright/test';

test.describe('XPath Tester E2E and DoS mitigation tests', () => {
  test('should parse and query valid XML successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xpath-tester');

    // Wait for the query bar and xml document textarea to be visible
    const queryInput = page.locator('#xpath-query');
    const xmlInput = page.locator('#xml-document');

    await expect(queryInput).toBeVisible();
    await expect(xmlInput).toBeVisible();

    // Fill valid XML and XPath expression
    await xmlInput.fill('<library><book><title>The Great Gatsby</title></book></library>');
    await queryInput.fill('//book/title/text()');

    // Wait for debounce execution
    await page.waitForTimeout(500);

    // Verify result is rendered
    const resultItem = page.locator('div.break-all', { hasText: 'The Great Gatsby' });
    await expect(resultItem).toBeVisible();
  });

  test('should show parsing error for malformed XML', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xpath-tester');

    const xmlInput = page.locator('#xml-document');
    await xmlInput.fill('<library><book><title>Unclosed Tag</title></book>'); // missing </library>

    await page.waitForTimeout(500);

    // Error alert should be visible
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
  });

  test('should enforce MAX_QUERY_LENGTH on XPath expression', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xpath-tester');

    const queryInput = page.locator('#xpath-query');
    const longQuery = '//book[' + 'price < 30 and '.repeat(100) + 'true()]'; // Over 1000 characters

    expect(longQuery.length).toBeGreaterThan(1000);

    await queryInput.fill(longQuery);
    await page.waitForTimeout(500);

    // Error alert indicating query is too long
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('XPath query is too long. Max limit is 1,000 characters.');
  });

  test('should truncate results if matches exceed MAX_RESULTS', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xpath-tester');

    const xmlInput = page.locator('#xml-document');
    const queryInput = page.locator('#xpath-query');

    // Generate XML with 1005 child nodes
    const childrenXml = '<child>node</child>'.repeat(1005);
    const largeXml = `<root>${childrenXml}</root>`;

    await xmlInput.fill(largeXml);
    await queryInput.fill('//child');

    await page.waitForTimeout(500);

    // Verify we have results up to 1001 items (1000 results + 1 truncation message)
    const resultCountText = page.locator('span:has-text("Query Results")');
    await expect(resultCountText).toContainText('(1001)');

    const truncationText = page.locator('div.break-all', { hasText: 'results truncated to 1,000 matches' });
    await expect(truncationText).toBeVisible();
  });
});
