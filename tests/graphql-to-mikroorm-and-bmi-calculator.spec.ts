import { test, expect } from '@playwright/test';

test.describe('BMI Calculator & GraphQL to MikroORM E2E Tests', () => {

  test.describe('BMI Calculator Micro-UX & Functionality', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('http://localhost:5173/en/outil/bmi-calculator');
      await page.waitForSelector('#weight');
    });

    test('renders quick start preset buttons with aria-pressed state', async ({ page }) => {
      const malePreset = page.getByRole('button', { name: /Standard Male|Homme Standard/i });
      await expect(malePreset).toHaveAttribute('aria-pressed', 'false');

      await malePreset.click();
      await expect(malePreset).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#weight')).toHaveValue('75');
      await expect(page.locator('#height')).toHaveValue('178');
    });

    test('clears active preset state when manual weight or height input is edited', async ({ page }) => {
      const malePreset = page.getByRole('button', { name: /Standard Male|Homme Standard/i });
      await malePreset.click();
      await expect(malePreset).toHaveAttribute('aria-pressed', 'true');

      await page.locator('#weight').fill('82');
      await expect(malePreset).toHaveAttribute('aria-pressed', 'false');
    });

    test('supports Escape shortcut to clear fields and restore focus to #weight', async ({ page }) => {
      await page.locator('#weight').fill('90');
      await page.locator('#height').fill('185');

      await page.keyboard.press('Escape');

      await expect(page.locator('#weight')).toHaveValue('');
      await expect(page.locator('#height')).toHaveValue('');
      await expect(page.locator('#weight')).toBeFocused();
    });

    test('explicit HTML labels associate correctly with inputs', async ({ page }) => {
      await expect(page.locator('label[for="weight"]')).toHaveText(/Weight|Poids/i);
      await expect(page.locator('label[for="height"]')).toHaveText(/Height|Taille/i);
    });
  });

  test.describe('GraphQL to MikroORM Converter', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('http://localhost:5173/en/outil/graphql-to-mikroorm');
      await page.waitForSelector('#graphql-mikroorm-input');
    });

    test('converts GraphQL SDL schema to MikroORM TypeScript entity classes', async ({ page }) => {
      const output = page.locator('#mikroorm-output');
      await expect(output).toContainText('@Entity()');
      await expect(output).toContainText('@PrimaryKey()');
      await expect(output).toContainText('export class Category');
      await expect(output).toContainText('export class Product');
      await expect(output).toContainText('@OneToMany(() => Product');
      await expect(output).toContainText('@ManyToOne(() => Category');
    });

    test('renders preset buttons with active selection tracking', async ({ page }) => {
      const presetUser = page.getByRole('button', { name: /User Management|Gestion Utilisateurs/i });
      await expect(presetUser).toHaveAttribute('aria-pressed', 'false');

      await presetUser.click();
      await expect(presetUser).toHaveAttribute('aria-pressed', 'true');

      const output = page.locator('#mikroorm-output');
      await expect(output).toContainText('export class User');
      await expect(output).toContainText('export class Post');
      await expect(output).toContainText('export enum UserRole');
    });

    test('clears input and restores focus on Escape key', async ({ page }) => {
      await page.locator('#graphql-mikroorm-input').focus();
      await page.keyboard.press('Escape');

      await expect(page.locator('#graphql-mikroorm-input')).toHaveValue('');
      await expect(page.locator('#graphql-mikroorm-input')).toBeFocused();
    });

    test('explicit HTML labels associate correctly with textareas', async ({ page }) => {
      await expect(page.locator('label[for="graphql-mikroorm-input"]')).toContainText(/GraphQL SDL/i);
      await expect(page.locator('label[for="mikroorm-output"]')).toContainText(/MikroORM/i);
    });
  });

});
