import { test, expect } from '@playwright/test';

test.describe('SQL to Prisma Schema Generator Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-prisma');
  });

  test('converts SQL DDL with composite unique constraint into Prisma schema', async ({ page }) => {
    const inputArea = page.locator('#sql-prisma-input');
    const outputArea = page.locator('#prisma-schema-output');

    const sqlInput = `
CREATE TABLE organization_members (
  org_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  UNIQUE (org_id, user_id)
);
`;

    await inputArea.fill(sqlInput);

    await expect(outputArea).toHaveValue(/model OrganizationMembers/);
    await expect(outputArea).toHaveValue(/@@unique\(\[orgId, userId\]\)/);
  });

  test('toggles preset button aria-pressed state', async ({ page }) => {
    const ecommerceBtn = page.getByRole('button', { name: /Base de données E-Commerce|E-Commerce Database/i });
    const userAuthBtn = page.getByRole('button', { name: /Authentification & Rôles|User Auth & Roles/i });

    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');

    await userAuthBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clears input and resets preset active state on Escape shortcut', async ({ page }) => {
    const userAuthBtn = page.getByRole('button', { name: /Authentification & Rôles|User Auth & Roles/i });
    const inputArea = page.locator('#sql-prisma-input');

    await userAuthBtn.click();
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(inputArea).not.toHaveValue('');

    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
