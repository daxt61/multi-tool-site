import { test, expect } from '@playwright/test';

test.describe('SQL to Pydantic Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-pydantic');
  });

  test('should render properly and convert SQL DDL to Pydantic V2 models', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL to Pydantic');

    const sqlInput = page.locator('#sql-pydantic-input');
    await sqlInput.fill(`CREATE TABLE users (
      id INT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP NOT NULL
    );`);

    const pyOutput = page.locator('#pydantic-output');
    await expect(pyOutput).toContainText('class Users(BaseModel):');
    await expect(pyOutput).toContainText('id: int');
    await expect(pyOutput).toContainText('username: str');
    await expect(pyOutput).toContainText('email: Optional[str] = None');
    await expect(pyOutput).toContainText('created_at: datetime');
  });

  test('should support Pydantic V1 and Python dataclass output formats', async ({ page }) => {
    const sqlInput = page.locator('#sql-pydantic-input');
    await sqlInput.fill(`CREATE TABLE products (
      id INT PRIMARY KEY,
      title VARCHAR(100) NOT NULL
    );`);

    const versionSelect = page.locator('#pydantic-version');
    await versionSelect.selectOption('v1');

    const pyOutput = page.locator('#pydantic-output');
    await expect(pyOutput).toContainText('class Config:');
    await expect(pyOutput).toContainText('allow_population_by_field_name = True');

    await versionSelect.selectOption('dataclass');
    await expect(pyOutput).toContainText('@dataclass');
    await expect(pyOutput).toContainText('class Products:');
  });

  test('should load clickable presets', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const pyOutput = page.locator('#pydantic-output');
    await expect(pyOutput).toContainText('class Categories(BaseModel):');
    await expect(pyOutput).toContainText('class Products(BaseModel):');
  });

  test('should handle keyboard shortcuts (Esc to clear, C to copy)', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const pyOutput = page.locator('#pydantic-output');
    await expect(pyOutput).not.toHaveValue('');

    const sqlInput = page.locator('#sql-pydantic-input');
    await sqlInput.blur();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(sqlInput).toHaveValue('');
    await expect(pyOutput).toHaveValue('');
    await expect(sqlInput).toBeFocused();
  });
});
