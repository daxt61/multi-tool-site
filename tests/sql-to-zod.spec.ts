import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Zod Schema Generator & SQL to Pydantic Fix', () => {
  test('SQL to Zod: converts SQL CREATE TABLE into Zod schemas', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-zod');
    await expect(page.locator('h1')).toContainText('SQL DDL en Zod');

    const inputArea = page.locator('#sql-zod-input');
    const outputArea = page.locator('#zod-output');

    await inputArea.fill(`CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  age INT
);`);

    await expect(outputArea).toContainText("export const usersSchema = z.object({");
    await expect(outputArea).toContainText("userId: z.string().uuid(),");
    await expect(outputArea).toContainText("email: z.string().email(),");
    await expect(outputArea).toContainText("age: z.number().int().nullable(),");
    await expect(outputArea).toContainText("export type Users = z.infer<typeof usersSchema>;");
  });

  test('SQL to Zod: applies presets, options, and handles clear shortcut', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-zod');

    const inputArea = page.locator('#sql-zod-input');
    const outputArea = page.locator('#zod-output');

    // Click preset
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();
    await expect(inputArea).toContainText('CREATE TABLE products');
    await expect(outputArea).toContainText('export const productsSchema = z.object({');

    // Change casing to snake_case
    await page.locator('#zod-casing').selectOption('snake_case');
    await expect(outputArea).toContainText('is_active:');

    // Change nullability mode to optional
    await page.locator('#zod-nullability').selectOption('optional');
    await expect(outputArea).toContainText('.optional()');

    // Test Esc shortcut
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('SQL to Pydantic: escapes Python reserved keywords as field names', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-pydantic');

    const inputArea = page.locator('#sql-pydantic-input');
    const outputArea = page.locator('#pydantic-output');

    await inputArea.fill(`CREATE TABLE items (
  id INT PRIMARY KEY,
  class VARCHAR(50) NOT NULL,
  from VARCHAR(50),
  type VARCHAR(50) NOT NULL
);`);

    // Should produce valid Python identifier names with underscore appended and Field alias
    await expect(outputArea).toContainText('id_: int = Field(alias="id")');
    await expect(outputArea).toContainText('class_: str = Field(alias="class")');
    await expect(outputArea).toContainText('from_: Optional[str] = Field(default=None, alias="from")');
    await expect(outputArea).toContainText('type_: str = Field(alias="type")');
  });
});
