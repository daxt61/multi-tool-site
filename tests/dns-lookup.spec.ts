import { test, expect } from '@playwright/test';

test.describe('DNS Lookup & Resolver E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the newly created DNS Lookup tool English route
    await page.goto('http://localhost:5173/en/outil/dns-lookup');
  });

  test('should load the page and verify basic interface elements', async ({ page }) => {
    // Verify header title
    await expect(page.locator('h1')).toContainText('DNS Lookup & Resolver');

    // Verify inputs are visible
    const domainInput = page.locator('#domain-input');
    await expect(domainInput).toBeVisible();
    await expect(domainInput).toHaveAttribute('placeholder', 'example.com');

    // Verify record type selector
    const recordTypeSelect = page.locator('#record-type');
    await expect(recordTypeSelect).toBeVisible();
    await expect(recordTypeSelect).toHaveValue('A');

    // Verify action button is present and disabled since domain is empty
    const resolveBtn = page.locator('button:has-text("Resolve DNS")');
    await expect(resolveBtn).toBeVisible();
    await expect(resolveBtn).toBeDisabled();
  });

  test('should show validation error for invalid domain name formats', async ({ page }) => {
    const domainInput = page.locator('#domain-input');
    await domainInput.fill('invalid_domain_name#');

    // Check that button is enabled now that input is not empty
    const resolveBtn = page.locator('button:has-text("Resolve DNS")');
    await expect(resolveBtn).not.toBeDisabled();

    // Click resolve and wait for validation error
    await resolveBtn.click();
    const errorAlert = page.locator('.bg-rose-50, .dark\\:bg-rose-500\\/10');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Please enter a valid domain name');
  });

  test('should clear inputs, results and restore focus on clear or Escape click', async ({ page }) => {
    const domainInput = page.locator('#domain-input');
    await domainInput.fill('example.com');
    await expect(domainInput).toHaveValue('example.com');

    // Focus a checkbox or selector then trigger Escape key
    await page.keyboard.press('Escape');

    // Check that input is cleared and focused programmatically
    await expect(domainInput).toHaveValue('');
    await expect(domainInput).toBeFocused();
  });

  test('should load in French route and verify localized translations', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/dns-lookup');
    await expect(page.locator('h1')).toContainText('Résolution DNS');
    await expect(page.locator('label[for="domain-input"]')).toContainText('Nom de domaine');
    await expect(page.locator('label[for="record-type"]')).toContainText("Type d'enregistrement");
  });
});
