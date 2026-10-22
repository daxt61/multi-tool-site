import { test, expect } from '@playwright/test';

test.describe('Sentinel Security & Palette Micro-UX: SQLToSequelize & SQLToPydantic', () => {
  test('SQLToSequelize escapes single quotes and backslashes in table names, field names, and string defaults', async ({ page }) => {
    await page.goto('/#sql-to-sequelize');

    const input = page.locator('#sql-sequelize-input');
    const output = page.locator('#sequelize-output');

    await input.fill(`
      CREATE TABLE \`user'table\` (
        id INT PRIMARY KEY,
        \`bad'field\` VARCHAR(50) DEFAULT 'some\\'val',
        created_at TIMESTAMP
      );
    `);

    const code = await output.inputValue();
    expect(code).toContain("field: 'bad\\'field'");
    expect(code).toContain("tableName: 'user\\'table'");
    expect(code).toContain("defaultValue: 'some\\'val'");
  });

  test('SQLToSequelize auto-clears active preset selection when input is manually edited', async ({ page }) => {
    await page.goto('/#sql-to-sequelize');

    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');

    const input = page.locator('#sql-sequelize-input');
    await input.focus();
    await page.keyboard.type(' ');

    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('SQLToPydantic tracks active preset and restores focus on clear', async ({ page }) => {
    await page.goto('/#sql-to-pydantic');

    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(ecommerceBtn).toBeVisible();
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');

    const pyOutput = page.locator('#pydantic-output');
    await expect(pyOutput).toContainText('class Categories(BaseModel):');

    const sqlInput = page.locator('#sql-pydantic-input');
    await sqlInput.focus();
    await page.keyboard.type(' -- custom comment');

    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Escape');
    await expect(sqlInput).toHaveValue('');
    await expect(pyOutput).toHaveValue('');
    await expect(sqlInput).toBeFocused();
  });
});
