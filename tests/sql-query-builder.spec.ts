import { test, expect } from "@playwright/test";

test.describe("Visual SQL Query Builder E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the SQL Query Builder tool
    await page.goto("http://localhost:5173/en/outil/sql-query-builder");
    await page.waitForLoadState("networkidle");
  });

  test("should load with default values and display compiled SQL in Postgres dialect", async ({ page }) => {
    // Verify name header exists
    await expect(page.locator("h1")).toContainText("Visual SQL Query Builder");

    // Verify default output is visible and is formatted as PostgreSQL (uses double quotes for tables/columns)
    const sqlOutput = page.locator("pre");
    await expect(sqlOutput).toBeVisible();
    await expect(sqlOutput).toContainText('SELECT');
    await expect(sqlOutput).toContainText('"orders"."id" AS "order_id"');
    await expect(sqlOutput).toContainText('FROM "orders"');
    await expect(sqlOutput).toContainText('INNER JOIN "users" ON "orders"."user_id" = "users"."id"');
    await expect(sqlOutput).toContainText('"orders"."status" = \'completed\'');
    await expect(sqlOutput).toContainText('ORDER BY "orders"."total" DESC');
  });

  test("should support switching dialects", async ({ page }) => {
    // Select MYSQL dialect
    const mysqlBtn = page.getByRole("button", { name: /MYSQL/i });
    await mysqlBtn.click();

    // Verify backticks are used in output
    const sqlOutput = page.locator("pre");
    await expect(sqlOutput).toContainText('`orders`.`id` AS `order_id`');

    // Select SQL Server (MSSQL)
    const mssqlBtn = page.getByRole("button", { name: /SQL Server/i });
    await mssqlBtn.click();

    // Verify square brackets are used
    await expect(sqlOutput).toContainText('[orders].[id] AS [order_id]');
  });

  test("should support preset template switching", async ({ page }) => {
    // Select Blogging Site preset
    const blogPresetBtn = page.getByRole("button", { name: /Blogging Site/i });
    await blogPresetBtn.click();

    // The output should adjust to posts and authors tables
    const sqlOutput = page.locator("pre");
    await expect(sqlOutput).toContainText('"posts"');
    await expect(sqlOutput).toContainText('"authors"');
    await expect(sqlOutput).toContainText('"posts"."author_id" = "authors"."id"');
  });

  test("should allow adding tables and columns dynamically", async ({ page }) => {
    // Input new table name
    const tableInput = page.getByPlaceholder("Add custom table name...");
    await tableInput.fill("payments");

    // Click Add Table
    const addTableBtn = page.getByRole("button", { name: /Add Table/i });
    await addTableBtn.click();

    // Newly added table should be present in the selector lists
    // Let's click the newly added table to activate configuration view
    const newTableBtn = page.getByRole("button", { name: /^payments \(\d+\)$|^payments$/i });
    await expect(newTableBtn).toBeVisible();
    await newTableBtn.click();

    // Check that we can configure it
    await expect(page.locator("h4", { hasText: "Configure Table:" })).toContainText("Configure Table: payments");

    // Add a new column 'amount' as DECIMAL
    const colInput = page.getByPlaceholder("New column name...");
    await colInput.fill("amount");

    // Select column type specifically inside the add column container
    const colTypeSelect = page.locator('input[placeholder="New column name..."] + select');
    await colTypeSelect.selectOption("DECIMAL");

    // Select sibling Add button inside the add column container
    const addColBtn = page.locator('input[placeholder="New column name..."] ~ button');
    await addColBtn.click();

    // Verify column was added successfully
    await expect(page.locator("span", { hasText: "amount (DECIMAL)" })).toBeVisible();
  });

  test("should handle reset to default state", async ({ page }) => {
    // Load Blog Preset first
    const blogPresetBtn = page.getByRole("button", { name: /Blogging Site/i });
    await blogPresetBtn.click();

    const sqlOutput = page.locator("pre");
    await expect(sqlOutput).toContainText('"posts"');

    // Click Reset
    const resetBtn = page.getByRole("button", { name: /Reset/i });
    await resetBtn.click();

    // Should return to default E-Commerce schema (orders, users, total > 0 etc.)
    await expect(sqlOutput).toContainText('"orders"');
    await expect(sqlOutput).toContainText('"orders"."status" = \'completed\'');
  });

  test("should copy to clipboard on clicking copy button", async ({ page }) => {
    // Click SQL Copy button (last copy button on page, to avoid header Copy Link)
    const copyBtn = page.locator("button:has-text('Copy')").last();
    await copyBtn.click();

    // Verify success toast exists or button text changes
    await expect(page.locator("text=Compiled SQL query copied to clipboard!")).toBeVisible();
  });

  test("should respond to Escape and C keys for reset and copy", async ({ page }) => {
    // Press C key to trigger copy shortcut
    await page.keyboard.press("c");
    await expect(page.locator("text=Compiled SQL query copied to clipboard!")).toBeVisible();

    // Change to Blog preset, then press Escape to reset
    const blogPresetBtn = page.getByRole("button", { name: /Blogging Site/i });
    await blogPresetBtn.click();
    const sqlOutput = page.locator("pre");
    await expect(sqlOutput).toContainText('"posts"');

    await page.keyboard.press("Escape");
    // Verify it is reset to standard e-commerce orders
    await expect(sqlOutput).toContainText('"orders"');
  });
});
