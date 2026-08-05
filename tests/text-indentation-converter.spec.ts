import { test, expect } from "@playwright/test";

test.describe("TextIndentationConverter Premium E2E Verification", () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    // Grant clipboard permissions to avoid headless browser permission blocks
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Navigate to the tool's page under French locale using base URL
    await page.goto(`${baseURL || "http://localhost:5173"}/fr/outil/text-indentation-converter`);
    await page.waitForLoadState("networkidle");
  });

  test("correctly converts tabs to spaces by default (leading indentation only)", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    await expect(inputArea).toBeVisible();

    // Fill with tab-indented text
    await inputArea.fill("\tclass Developer {\n\t\tconstructor() {}\n\t}");

    // Default configuration: Tabs to Spaces, Tab Size: 4, Only leading indentation
    const outputArea = page.locator("textarea#indent-output");
    await expect(outputArea).toHaveValue("    class Developer {\n        constructor() {}\n    }");
  });

  test("supports spaces to tabs conversion", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    const outputArea = page.locator("textarea#indent-output");

    // Select Spaces to Tabs mode
    const modeSelect = page.locator('button:has-text("Espaces en Tabulations")');
    await modeSelect.click();

    // Fill with space-indented text (4 spaces)
    await inputArea.fill("    const a = 1;\n        const b = 2;");

    // Output should convert groups of 4 spaces into single/double tabs
    await expect(outputArea).toHaveValue("\tconst a = 1;\n\t\tconst b = 2;");
  });

  test("supports adding indentation levels (add_indent mode)", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    const outputArea = page.locator("textarea#indent-output");

    // Select Increase Indentation mode
    const modeSelect = page.locator('button:has-text("Augmenter l\'Indentation")');
    await modeSelect.click();

    // Fill text
    await inputArea.fill("line1\nline2");

    // By default, adds 1 level of spaces (tabSize = 4 spaces) -> 4 spaces prepended
    await expect(outputArea).toHaveValue("    line1\n    line2");

    // Switch indent character to Tab
    const tabOption = page.getByRole('button', { name: 'Tabulations', exact: true });
    await tabOption.click();

    // Output should prepend 1 tab level
    await expect(outputArea).toHaveValue("\tline1\n\tline2");
  });

  test("supports removing indentation levels (remove_indent mode)", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    const outputArea = page.locator("textarea#indent-output");

    // Select Decrease Indentation mode
    const modeSelect = page.locator('button:has-text("Diminuer l\'Indentation")');
    await modeSelect.click();

    // Fill text with 4 spaces and 8 spaces leading indent
    await inputArea.fill("    line1\n        line2");

    // Tab size = 4 (default). Decreasing 1 level removes up to 4 spaces
    await expect(outputArea).toHaveValue("line1\n    line2");
  });

  test("supports trimming / cleaning whitespace (trim_indent mode)", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    const outputArea = page.locator("textarea#indent-output");

    // Select Trim Indentation mode
    const modeSelect = page.locator('button:has-text("Nettoyer l\'Indentation")');
    await modeSelect.click();

    // Fill text with leading and trailing spaces
    await inputArea.fill("  line1  \n   line2  ");

    // Default trim option is leading whitespace only
    await expect(outputArea).toHaveValue("line1  \nline2  ");

    // Change trim type to trailing spaces
    const trimSelect = page.locator("select#trim-type-select");
    await trimSelect.selectOption("trailing");
    await expect(outputArea).toHaveValue("  line1\n   line2");

    // Change trim type to both
    await trimSelect.selectOption("both");
    await expect(outputArea).toHaveValue("line1\nline2");
  });

  test("automatically detects existing indentation type and applies it", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");

    // Fill with text indented with 2 spaces
    await inputArea.fill("  const a = 1;\n    const b = 2;");

    // Detected element text should show "2 Espaces"
    const detectedBadge = page.locator("span.bg-slate-100");
    await expect(detectedBadge).toContainText("2 Espaces");

    // Click "Appliquer" button to use detected settings
    const useSettingsBtn = page.locator('button:has-text("Appliquer")');
    await useSettingsBtn.click();

    // The tab size select should have updated to 2 spaces
    const tabSizeSelect = page.locator("select#tab-size-select");
    await expect(tabSizeSelect).toHaveValue("2");
  });

  test("resets values with Escape key and retains focus", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    await inputArea.fill("some tabbed content\t\t");

    // Focus input area, then press Escape
    await inputArea.focus();
    await page.keyboard.press("Escape");

    // Input should be empty and focus is programmatically restored to input
    await expect(inputArea).toHaveValue("");
    await expect(inputArea).toBeFocused();
  });

  test("copies output using keyboard shortcut C when not focused on editables", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");
    await inputArea.fill("hello world\t");

    // Focus outside of the input areas (like the page title) to allow global short-cuts
    await page.locator("h1").first().click();

    // Press C
    await page.keyboard.press("c");

    // Verify sonner toast is triggered
    const toast = page.locator("[data-sonner-toast]").last();
    await expect(toast).toBeVisible();
  });

  test("enforces strict 100k character size limit with warning banner", async ({ page }) => {
    const inputArea = page.locator("textarea#indent-input");

    // Fill with slightly more than 100k characters
    const largeInput = " ".repeat(100001);
    await inputArea.fill(largeInput);

    // Alert banner should appear
    const alert = page.locator('div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("100");
  });
});
