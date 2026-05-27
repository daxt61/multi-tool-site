import { test, expect } from "@playwright/test";

test("URL Encoder UX: keyboard shortcuts and focus management", async ({
  page,
}) => {
  await page.goto("http://localhost:5173/en/outil/url-encoder");

  const decodedTextarea = page.locator("#url-decoded");
  const encodedTextarea = page.locator("#url-encoded");
  const clearButton = page.getByRole("button", { name: /clear/i });

  // 1. Verify visible shortcut hints
  await expect(page.locator("kbd", { hasText: /^Esc$/ })).toBeVisible();
  await expect(page.locator("kbd", { hasText: /^C$/ })).toBeVisible();

  // 2. Enter text and verify bidirectional conversion
  await decodedTextarea.fill("hello world");
  await expect(encodedTextarea).toHaveValue("hello%20world");

  // 3. Test focus restoration after clearing
  await clearButton.click();
  await expect(decodedTextarea).toHaveValue("");
  await expect(encodedTextarea).toHaveValue("");
  await expect(decodedTextarea).toBeFocused();

  // 4. Test Escape shortcut (local)
  await decodedTextarea.fill("test escape");
  await page.keyboard.press("Escape");
  await expect(decodedTextarea).toHaveValue("");
  await expect(decodedTextarea).toBeFocused();

  // 5. Test global shortcuts (safe pattern)
  // Fill text first
  await decodedTextarea.fill("global shortcut");
  // Unfocus by clicking elsewhere (e.g. the header info)
  await page.getByText("Why encode?").click();
  await expect(decodedTextarea).not.toBeFocused();

  // Press Esc globally
  await page.keyboard.press("Escape");
  await expect(decodedTextarea).toHaveValue("");
  await expect(decodedTextarea).toBeFocused();

  // Fill again for copy test
  await decodedTextarea.fill("copy test");
  await page.getByText("Why encode?").click();

  // Press C globally
  // We can't easily verify the clipboard content in most CI environments without permissions,
  // but we can check if the button state changes (showing "Copied")
  await page.keyboard.press("c");
  await expect(page.getByText("Copied")).toBeVisible();
});
