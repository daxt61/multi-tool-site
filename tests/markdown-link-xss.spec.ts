import { test, expect } from '@playwright/test';

test.describe('Markdown Link XSS Sanitization', () => {
  test('MarkdownPreview sanitizes javascript: URLs', async ({ page }) => {
    await page.goto('/#markdown-preview');
    await page.waitForSelector('#markdown-input');

    // Input markdown with normal link and javascript: link
    const markdownText = '[Safe Link](https://example.com)\n[Malicious Link](javascript:alert(1))';
    await page.fill('#markdown-input', markdownText);

    // Safe link should render as <a> with target="_blank"
    const safeLink = page.locator('a:has-text("Safe Link")');
    await expect(safeLink).toBeVisible();
    await expect(safeLink).toHaveAttribute('href', 'https://example.com');

    // Malicious link should NOT render as <a> with javascript: href
    const maliciousLink = page.locator('a:has-text("Malicious Link")');
    await expect(maliciousLink).toHaveCount(0);

    // Instead, it should render as non-clickable span
    const fallbackSpan = page.locator('span:has-text("Malicious Link")');
    await expect(fallbackSpan).toBeVisible();
  });

  test('MarkdownToHTML sanitizes javascript: URLs', async ({ page }) => {
    await page.goto('/#markdown-to-html');
    await page.waitForSelector('#md-input');

    const markdownText = '[Safe Link](https://example.com)\n[Malicious Link](javascript:alert(1))';
    await page.fill('#md-input', markdownText);

    const htmlOutput = page.locator('textarea[readonly]');
    await expect(htmlOutput).toBeVisible();

    const outputText = await htmlOutput.inputValue();
    expect(outputText).toContain('<a href="https://example.com">Safe Link</a>');
    expect(outputText).not.toContain('href="javascript:alert(1)"');
    expect(outputText).not.toContain('<a href="javascript:');
    expect(outputText).toContain('Malicious Link');
  });
});
