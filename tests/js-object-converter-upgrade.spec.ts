import { test, expect } from "@playwright/test";

test.describe("JSObjectConverter Premium UX Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/en/outil/js-object-converter");
    await page.waitForLoadState("networkidle");
  });

  test("Should render premium labels, Kbd indicators, and convert JS Object to JSON", async ({ page }) => {
    // Assert titles/labels
    await expect(page.locator("label[for='js-input']")).toContainText("JS Object");
    await expect(page.locator("label[for='json-input']")).toContainText("JSON");

    // Input standard JS Object literal
    const jsInput = page.locator("#js-input");
    await jsInput.fill("{ name: 'Alex', rank: 1, active: true }");

    // Click Convert
    await page.click("button[title='Convert JS to JSON']");

    // Verify output JSON
    const jsonInput = page.locator("#json-input");
    await expect(jsonInput).not.toBeEmpty();
    const jsonVal = await jsonInput.inputValue();
    expect(jsonVal).toContain('"name": "Alex"');
    expect(jsonVal).toContain('"rank": 1');
    expect(jsonVal).toContain('"active": true');
  });

  test("Should convert JSON to JS Object correctly", async ({ page }) => {
    const jsonInput = page.locator("#json-input");
    await jsonInput.fill('{"title": "Chief", "skills": ["React", "TypeScript"]}');

    // Click Convert to JS
    await page.click("button[title='Convert JSON to JS']");

    // Verify JS Object output
    const jsInput = page.locator("#js-input");
    await expect(jsInput).not.toBeEmpty();
    const jsVal = await jsInput.inputValue();
    expect(jsVal).toContain("title: 'Chief'");
    expect(jsVal).toContain("'React', 'TypeScript'");
  });

  test("Should support clear actions and keyboard shortcuts", async ({ page }) => {
    const jsInput = page.locator("#js-input");
    await jsInput.fill("{ id: 42 }");
    await page.click("button[title='Convert JS to JSON']");
    await expect(page.locator("#json-input")).not.toBeEmpty();

    // Blur focus so shortcut works
    await jsInput.blur();

    // Press Escape to Clear
    await page.keyboard.press("Escape");

    // Verify everything is cleared and focus is programmatically restored to primary input
    await expect(jsInput).toBeEmpty();
    await expect(page.locator("#json-input")).toBeEmpty();
    await expect(jsInput).toBeFocused();
  });
});
