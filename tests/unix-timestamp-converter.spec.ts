import { test, expect } from "@playwright/test";

test.describe("Unix Timestamp Converter Tool", () => {
  test("renders label association, keyboard hints, timestamp conversion, and toast notifications", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173/en/outil/unix-timestamp");

    const timestampInput = page.locator("#unix-timestamp-input");
    const label = page.locator("label[for='unix-timestamp-input']");
    const clearBtn = page.getByRole("button", { name: "Clear" });
    const convertDateHeader = page.getByRole("heading", { name: "Convert Date to Timestamp" });

    // 1. Verify label and input association
    await expect(label).toBeVisible();
    await expect(timestampInput).toBeVisible();

    // Clicking label focuses input
    await label.click();
    await expect(timestampInput).toBeFocused();

    // 2. Verify Kbd shortcut hints are visible
    await expect(page.locator("kbd", { hasText: /^N$/ })).toBeVisible();
    await expect(page.locator("kbd", { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator("kbd", { hasText: /^C$/ })).toBeVisible();

    // 3. Check current timestamp default value
    const initialValue = await timestampInput.inputValue();
    expect(initialValue.length).toBeGreaterThan(5);

    // 4. Test Clear button & focus restoration
    await clearBtn.click();
    await expect(timestampInput).toHaveValue("");
    await expect(timestampInput).toBeFocused();
    await expect(page.getByText("Timestamp input cleared!")).toBeVisible();

    // 5. Test entering timestamp and dates output
    await timestampInput.fill("1700000000");
    await expect(page.getByText("ISO 8601")).toBeVisible();
    await expect(page.getByText("2023-11-14T22:13:20.000Z")).toBeVisible();

    // 6. Test Escape key shortcut to clear input and restore focus
    await page.keyboard.press("Escape");
    await expect(timestampInput).toHaveValue("");
    await expect(timestampInput).toBeFocused();

    // 7. Test N key shortcut to use current time when not focused on editable input
    // Unfocus input by clicking the heading
    await convertDateHeader.click();
    await expect(timestampInput).not.toBeFocused();

    await page.keyboard.press("n");
    const newTs = await timestampInput.inputValue();
    expect(newTs.length).toBeGreaterThan(5);
    await expect(page.getByText("Updated to current timestamp!")).toBeVisible();

    // 8. Test C key shortcut to copy timestamp when unfocused
    await convertDateHeader.click();
    await expect(timestampInput).not.toBeFocused();

    await page.keyboard.press("c");
    await expect(page.getByText("Copied to clipboard!")).toBeVisible();
  });
});
