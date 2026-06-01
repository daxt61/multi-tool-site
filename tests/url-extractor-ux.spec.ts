import { test, expect } from "@playwright/test";

test("URL Extractor UX: keyboard shortcuts and focus management", async ({
  page,
}) => {
  await page.goto("http://localhost:5173/en/outil/url-extractor");

  const textarea = page.locator("#extractor-input");
  const clearButton = page.getByRole("button", { name: /clear/i });

  // 1. Verify visible shortcut hints
  await expect(page.locator("kbd", { hasText: /^Esc$/ })).toBeVisible();
  await expect(page.locator("kbd", { hasText: /^C$/ })).toBeVisible();

  // 2. Enter text and verify extraction
  const sampleText = "Check out https://example.com and http://test.org/path";
  await textarea.fill(sampleText);
  await expect(page.getByText("2")).toBeVisible(); // Number of URLs found

  // 3. Test focus restoration after clicking Clear
  await clearButton.click();
  await expect(textarea).toHaveValue("");
  await expect(textarea).toBeFocused();

  // 4. Test Escape shortcut (local)
  await textarea.fill("test local escape https://abc.com");
  await page.keyboard.press("Escape");
  await expect(textarea).toHaveValue("");
  await expect(textarea).toBeFocused();

  // 5. Test global shortcuts (safe pattern)
  // Fill text first
  await textarea.fill("global shortcut https://global.com");
  // Unfocus by clicking elsewhere (e.g. the description or results title)
  await page.getByText("URLs Found").click();
  await expect(textarea).not.toBeFocused();

  // Press Esc globally
  await page.keyboard.press("Escape");
  await expect(textarea).toHaveValue("");
  await expect(textarea).toBeFocused();

  // Fill again for copy test
  await textarea.fill("copy test https://copy.me");
  await page.getByText("URLs Found").click();

  // Press C globally
  await page.keyboard.press("c");
  await expect(page.getByText("Copied")).toBeVisible();
});
