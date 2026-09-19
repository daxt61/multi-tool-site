import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Java POJO Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-java');
  });

  test('renders tool elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL DDL en Java');
    await expect(page.locator('#sql-java-input')).toBeVisible();
    await expect(page.locator('#java-output')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Catalogue E-Commerce' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authentification & Rôles' })).toBeVisible();
  });

  test('converts SQL CREATE TABLE into JPA annotated Java POJO by default', async ({ page }) => {
    const inputSql = `
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP
      );
    `;

    await page.fill('#sql-java-input', inputSql);
    const output = await page.inputValue('#java-output');

    expect(output).toContain('@Entity');
    expect(output).toContain('@Table(name = "users")');
    expect(output).toContain('@Id');
    expect(output).toContain('@GeneratedValue(strategy = GenerationType.IDENTITY)');
    expect(output).toContain('@Column(name = "username", nullable = false)');
    expect(output).toContain('private String username;');
    expect(output).toContain('private Integer id;');
    expect(output).toContain('private Boolean isActive;');
    expect(output).toContain('private LocalDateTime createdAt;');
  });

  test('loads clickable presets and generates valid Java classes', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await expect(page.locator('#sql-java-input')).toContainText('CREATE TABLE categories');

    const output = await page.inputValue('#java-output');
    expect(output).toContain('public class Categories');
    expect(output).toContain('public class Products');
    expect(output).toContain('private BigDecimal price;');
  });

  test('supports Java 17+ Record mode', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await page.selectOption('#java-type-mode', 'record');

    const output = await page.inputValue('#java-output');
    expect(output).toContain('public record Categories(');
    expect(output).toContain('public record Products(');
  });

  test('supports Gson annotations mode', async ({ page }) => {
    await page.click('button:has-text("Authentification & Rôles")');
    await page.selectOption('#java-json-lib', 'gson');

    const output = await page.inputValue('#java-output');
    expect(output).toContain('import com.google.gson.annotations.SerializedName;');
    expect(output).toContain('@SerializedName("password_hash")');
  });

  test('handles keyboard shortcuts Esc (clear) and C (copy)', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await expect(page.locator('#sql-java-input')).not.toHaveValue('');

    // Focus body and trigger C (copy) shortcut
    await page.locator('body').focus();
    await page.keyboard.press('c');

    // Trigger Esc (clear) shortcut
    await page.keyboard.press('Escape');
    await expect(page.locator('#sql-java-input')).toHaveValue('');
    await expect(page.locator('#sql-java-input')).toBeFocused();
  });
});
