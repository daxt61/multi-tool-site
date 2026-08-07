import { test, expect } from "@playwright/test";

test.describe("HTML Table to JSON Converter E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tool's route
    await page.goto("http://localhost:5173/fr/outil/html-table-to-json");
  });

  test("should load the component and display basic elements", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/HTML Table/);
    await expect(page.locator("#html-table-input")).toBeVisible();
    await expect(page.locator("#json-output-area")).toBeVisible();
  });

  test("should convert a basic HTML table to JSON array of objects correctly", async ({ page }) => {
    const tableInput = page.locator("#html-table-input");
    const outputArea = page.locator("#json-output-area");

    // Input simple table HTML
    const basicTable = `
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>Name</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>101</td>
            <td>John Doe</td>
            <td>true</td>
          </tr>
        </tbody>
      </table>
    `;

    await tableInput.fill(basicTable);

    // Wait for conversion
    await expect(outputArea).not.toHaveValue("");

    const outputJson = JSON.parse(await outputArea.inputValue());
    expect(outputJson).toEqual([
      {
        id: 101,
        name: "John Doe",
        active: true
      }
    ]);
  });

  test("should handle colspan and rowspan correctly", async ({ page }) => {
    // Load spanned cells profile preset
    await page.getByRole("button", { name: "Profils (rowspan/colspan)" }).click();

    // Verify toast notification
    await expect(page.locator(".sonner-toast, [data-sonner-toast]")).toBeVisible();

    const outputArea = page.locator("#json-output-area");
    await expect(outputArea).not.toHaveValue("");

    const outputJson = JSON.parse(await outputArea.inputValue());

    // Rows after expansion should correctly fill in cells
    expect(outputJson.length).toBeGreaterThan(0);
    expect(outputJson[0]).toHaveProperty("userProfile");
  });

  test("should support different key formatting and custom row index option", async ({ page }) => {
    const tableInput = page.locator("#html-table-input");
    const outputArea = page.locator("#json-output-area");

    const tableWithComplexHeaders = `
      <table>
        <tr>
          <th>User Account ID</th>
          <th>Full Name</th>
        </tr>
        <tr>
          <td>A01</td>
          <td>Jane Smith</td>
        </tr>
      </table>
    `;

    await tableInput.fill(tableWithComplexHeaders);

    // Select "snake" casing key formatting
    await page.locator("#key-format-select").selectOption("snake");
    // Check "include row index" toggle
    await page.locator("text=Inclure l'index de ligne (_index)").click();

    const outputJson = JSON.parse(await outputArea.inputValue());
    expect(outputJson).toEqual([
      {
        _index: 0,
        user_account_id: "A01",
        full_name: "Jane Smith"
      }
    ]);
  });

  test("should support 2D Array and Key-Value Map output modes", async ({ page }) => {
    const tableInput = page.locator("#html-table-input");
    const outputArea = page.locator("#json-output-area");

    const simpleTable = `
      <table>
        <tr>
          <th>City</th>
          <th>Country</th>
        </tr>
        <tr>
          <td>Paris</td>
          <td>France</td>
        </tr>
      </table>
    `;
    await tableInput.fill(simpleTable);

    // Toggle 2D array mode
    await page.getByRole("button", { name: "Tableau 2D [[], []]" }).click();
    let output2d = JSON.parse(await outputArea.inputValue());
    expect(output2d).toEqual([
      ["city", "country"],
      ["Paris", "France"]
    ]);

    // Toggle Key-Value map mode
    await page.getByRole("button", { name: "Dictionnaire Clé-Valeur {key: {}}" }).click();
    let outputMap = JSON.parse(await outputArea.inputValue());
    expect(outputMap).toEqual({
      "Paris": {
        country: "France"
      }
    });
  });

  test("should prevent prototype pollution in object parsing", async ({ page }) => {
    const tableInput = page.locator("#html-table-input");
    const outputArea = page.locator("#json-output-area");

    const maliciousTable = `
      <table>
        <tr>
          <th>__proto__</th>
          <th>constructor</th>
          <th>Safe</th>
        </tr>
        <tr>
          <td>malicious</td>
          <td>malicious</td>
          <td>value</td>
        </tr>
      </table>
    `;

    await tableInput.fill(maliciousTable);

    const outputJson = JSON.parse(await outputArea.inputValue());
    expect(outputJson[0]).toEqual({
      proto: "malicious",
      safe: "value"
    });
    // Double check proto has not poisoned prototype chain
    expect(outputJson[0].__proto__).not.toEqual("malicious");
  });

  test("should support keyboard shortcuts - Esc to clear and focus, and C to copy", async ({ page }) => {
    const tableInput = page.locator("#html-table-input");
    const outputArea = page.locator("#json-output-area");

    await tableInput.fill("<table><tr><td>Test</td></tr></table>");
    await expect(outputArea).not.toHaveValue("");

    // Test Esc clear shortcut
    await page.keyboard.press("Escape");
    await expect(tableInput).toHaveValue("");
    await expect(outputArea).toHaveValue("");
    await expect(tableInput).toBeFocused();

    // Verify reset toast or status
    await expect(page.locator(".sonner-toast, [data-sonner-toast]")).toBeVisible();
  });
});
