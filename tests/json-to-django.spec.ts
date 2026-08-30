import { test, expect } from '@playwright/test';

test.describe('JSON to Django Models Converter Premium E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-django');
  });

  test('renders tool title, form labels, controls, and options', async ({ page }) => {
    // Check main headings / labels
    await expect(page.locator('#json-input')).toBeVisible();
    await expect(page.locator('#django-output')).toBeVisible();

    // Check checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(4);
  });

  test('applies quick start presets and generates Django models with admin code', async ({ page }) => {
    const input = page.locator('#json-input');
    const output = page.locator('#django-output');

    // Click E-Commerce preset
    await page.click('button:has-text("Commande E-Commerce")');

    // Check input is populated with order JSON
    await expect(input).toHaveValue(/ORD-2025-8891/);

    // Check output contains generated models
    await expect(output).toHaveValue(/class Root\(models\.Model\):/);
    await expect(output).toHaveValue(/class Customer\(models\.Model\):/);
    await expect(output).toHaveValue(/from django\.contrib import admin/);
    await expect(output).toHaveValue(/@admin\.register\(Customer\)/);

    // Verify toast notification
    await expect(page.locator('[data-sonner-toast]').first()).toContainText('Préréglage chargé avec succès !');
  });

  test('toggles options to customize generated models', async ({ page }) => {
    const output = page.locator('#django-output');

    // Load User Account preset
    await page.click('button:has-text("Compte Utilisateur & Profil")');
    await expect(output).toHaveValue(/class Profile\(models\.Model\):/);
    await expect(output).toHaveValue(/class Meta:/);

    // Uncheck "Generate Meta options"
    const metaCheckbox = page.locator('label:has-text("Générer les options Meta") input[type="checkbox"]');
    await metaCheckbox.uncheck();

    // Verify Meta class is removed
    await expect(output).not.toHaveValue(/class Meta:/);
  });

  test('handles keyboard shortcuts: Esc to clear & focus, C to copy', async ({ page }) => {
    const input = page.locator('#json-input');
    const output = page.locator('#django-output');

    // Load Blog Post preset
    await page.click('button:has-text("Article de Blog & Commentaires")');
    await expect(input).not.toHaveValue('');
    await expect(output).toHaveValue(/class Root\(models\.Model\):/);

    // Press Escape to clear
    await page.keyboard.press('Escape');

    // Verify input and output are cleared and input is focused
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
    await expect(input).toBeFocused();

    // Re-populate and blur
    await page.click('button:has-text("Commande E-Commerce")');
    await expect(output).not.toHaveValue('');
    await input.blur();

    // Press C to copy output
    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toast]').first()).toContainText('Modèles Django copiés dans le presse-papiers !');
  });
});
