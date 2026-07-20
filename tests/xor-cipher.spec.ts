import { test, expect } from "@playwright/test";

test.describe("XOR Cipher Tool", () => {
  test("performs repeating-key XOR correctly with Text input, Text key, Hex output", async ({ page }) => {
    // Navigate to the XOR Cipher page in English
    await page.goto("http://localhost:5173/en/outil/xor-cipher");

    // Verify title and basic descriptions are visible
    await expect(page.locator("h1")).toContainText("XOR Cipher");

    // Select input, key and output formats
    await page.selectOption("#input-format-select", "text");
    await page.selectOption("#key-format-select", "text");
    await page.selectOption("#output-format-select", "hex");

    // Locate the key, input and output elements
    const keyInput = page.locator("#xor-key-input");
    const inputTextArea = page.locator("#xor-input-textarea");
    const outputTextArea = page.locator("#xor-output-textarea");

    // Fill the inputs
    await keyInput.fill("key");
    await inputTextArea.fill("Hello");

    // Expected result: '23 00 15 07 0A'
    // 'H' (0x48) ^ 'k' (0x6B) = 0x23
    // 'e' (0x65) ^ 'e' (0x65) = 0x00
    // 'l' (0x6C) ^ 'y' (0x79) = 0x15
    // 'l' (0x6C) ^ 'k' (0x6B) = 0x07
    // 'o' (0x6F) ^ 'e' (0x65) = 0x0A
    await expect(outputTextArea).toHaveValue("23 00 15 07 0A");
  });

  test("handles malformed hex inputs with a validation warning", async ({ page }) => {
    await page.goto("http://localhost:5173/en/outil/xor-cipher");

    // Select hexadecimal input format
    await page.selectOption("#input-format-select", "hex");

    const inputTextArea = page.locator("#xor-input-textarea");

    // Fill with invalid characters
    await inputTextArea.fill("invalid hex characters");

    // Expect error alert to be shown
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Hex input contains invalid characters.");
  });

  test("can clear inputs using Clear button", async ({ page }) => {
    await page.goto("http://localhost:5173/en/outil/xor-cipher");

    const inputTextArea = page.locator("#xor-input-textarea");
    await inputTextArea.fill("Some dummy text");

    const clearButton = page.getByRole("button").filter({ hasText: "Clear" }).first();
    await clearButton.click();

    await expect(inputTextArea).toHaveValue("");
  });
});
