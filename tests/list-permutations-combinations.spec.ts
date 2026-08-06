import { test, expect } from "@playwright/test";

test.describe("Permutations & Combinations Generator E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard with french locale as default, then go directly to the tool path
    await page.goto("http://localhost:5173/en/outil/list-permutations-combinations");
    await page.waitForLoadState("networkidle");
  });

  test("should display headers, title, and initial result", async ({ page }) => {
    const title = page.locator("h1");
    await expect(title).toContainText("Permutations & Combinations Generator");

    // The default elements are "apple\nbanana\ncherry"
    // By default, permutations are selected, output is 6 permutations
    const outputArea = page.locator("#perm-comb-output");
    await expect(outputArea).toBeVisible();
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain("apple, banana, cherry");
    expect(outputVal).toContain("cherry, banana, apple");

    // Check possible results statistic
    const possibleResults = page.getByTestId("total-combinations-val");
    await expect(possibleResults).toContainText("6");
  });

  test("should support switching to Characters mode", async ({ page }) => {
    // Select Characters mode button
    await page.click("button:has-text('Characters')");

    // Set input as "xyz"
    const inputArea = page.locator("#perm-comb-input");
    await inputArea.fill("xyz");

    // Permutations of "xyz" without separators should be "xyz", "xzy", etc.
    const outputArea = page.locator("#perm-comb-output");
    await expect(outputArea).toBeVisible();
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain("xyz");
    expect(outputVal).toContain("zyx");
    expect(outputVal).not.toContain(",");
  });

  test("should support Combinations operation and custom subset K", async ({ page }) => {
    // Select Combinations operation
    await page.selectOption("#operation-select", "combinations");

    // Subset size k value select/input should exist, set it to 2
    const kInput = page.locator("#k-value-input");
    await kInput.fill("2");

    // Elements are apple, banana, cherry. Combinations of size 2:
    // (apple, banana), (apple, cherry), (banana, cherry)
    const outputArea = page.locator("#perm-comb-output");
    await expect(outputArea).toBeVisible();
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain("apple, banana");
    expect(outputVal).toContain("apple, cherry");
    expect(outputVal).toContain("banana, cherry");
    expect(outputVal).not.toContain("cherry, apple"); // order doesn't matter for combinations

    const possibleResults = page.getByTestId("total-combinations-val");
    await expect(possibleResults).toContainText("3");
  });

  test("should trigger local Escape keyboard key to clear input", async ({ page }) => {
    const inputArea = page.locator("#perm-comb-input");
    await inputArea.fill("something");
    await expect(inputArea).toHaveValue("something");

    // Focus input and press Escape
    await inputArea.focus();
    await page.keyboard.press("Escape");

    // Input should be empty
    await expect(inputArea).toHaveValue("");
  });
});
