import { test, expect } from '@playwright/test';

test.describe('GraphQLToValibot and GradeCalculator Micro-UX E2E Tests', () => {

  test('GraphQLToValibot converts GraphQL SDL schema, loads presets, toggles options, and handles hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-valibot');

    await expect(page.locator('h1')).toContainText('GraphQL en Valibot');
    const input = page.locator('#graphql-valibot-input');
    const output = page.locator('#valibot-output');

    // Load E-Commerce preset
    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/type Category/);
    await expect(output).toHaveValue(/import \* as v from 'valibot'/);
    await expect(output).toHaveValue(/export const CategorySchema = v.object/);
    await expect(output).toHaveValue(/export type Category = v.InferOutput<typeof CategorySchema>/);

    // Load User Auth preset
    const userAuthBtn = page.getByRole('button', { name: 'Gestion Utilisateurs & Auth' });
    await userAuthBtn.click();
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(input).toHaveValue(/enum Role/);
    await expect(output).toHaveValue(/export const RoleSchema = v.enum/);

    // Change nullability mode
    const nullabilitySelect = page.locator('#nullability-mode');
    await nullabilitySelect.selectOption('nullish');
    await expect(output).toHaveValue(/v.nullish/);

    // Copy hotkey
    await input.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Schémas Valibot copiés dans le presse-papiers');

    // Escape clear hotkey
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('GradeCalculator handles interactive presets, calculations, focus, toasts, and hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/grade-calculator');

    await expect(page.locator('h1')).toContainText("Notes");

    // Load High School Preset
    const hsBtn = page.getByRole('button', { name: 'Lycée Standard' });
    await hsBtn.click();
    await expect(hsBtn).toHaveAttribute('aria-pressed', 'true');

    const grade0 = page.locator('#grade-0');
    const weight0 = page.locator('#weight-0');
    await expect(grade0).toHaveValue('14');
    await expect(weight0).toHaveValue('1');

    // Verify current average
    await expect(page.getByText('/ 20')).toBeVisible();

    // Load University Preset
    const uniBtn = page.getByRole('button', { name: 'Semestre Universitaire' });
    await uniBtn.click();
    await expect(uniBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(hsBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(grade0).toHaveValue('11');

    // Copy average hotkey
    await grade0.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Moyenne actuelle');

    // Reset hotkey and check focus
    await page.keyboard.press('Escape');
    await expect(grade0).toHaveValue('');
    await expect(uniBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(grade0).toBeFocused();
  });

});
