import { test, expect } from '@playwright/test';

test.describe('JSON to Rust & Kotlin Converters', () => {
  test('JSON to Rust converter upgrades and features', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-rust');

    await expect(page.locator('#json-input')).toBeVisible();
    await expect(page.locator('#rust-output')).toBeVisible();

    // Check presets loading
    const presetBtn = page.locator('button:has-text("Profil Utilisateur"), button:has-text("User Profile")').first();
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    await expect(page.locator('#json-input')).not.toHaveValue('');
    await expect(page.locator('#rust-output')).toContainText('pub struct RootObject');
    await expect(page.locator('#rust-output')).toContainText('serde');

    // Toggle option
    const cloneCheckbox = page.locator('input[type="checkbox"]').first();
    await cloneCheckbox.click();
    await expect(page.locator('#rust-output')).toBeVisible();

    // Test clear action & focus restoration
    const clearBtn = page.locator('button:has-text("Effacer"), button:has-text("Clear")').first();
    await clearBtn.click();
    await expect(page.locator('#json-input')).toHaveValue('');
    await expect(page.locator('#rust-output')).toHaveValue('');
    await expect(page.locator('#json-input')).toBeFocused();
  });

  test('JSON to Kotlin converter features and options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-kotlin');

    await expect(page.locator('#json-input')).toBeVisible();
    await expect(page.locator('#kotlin-output')).toBeVisible();

    // Test entering custom JSON
    const sampleJson = JSON.stringify({
      id: 42,
      product_name: "Kotlin Guide",
      is_available: true
    }, null, 2);

    await page.fill('#json-input', sampleJson);
    await expect(page.locator('#kotlin-output')).toContainText('data class RootObject');
    await expect(page.locator('#kotlin-output')).toContainText('@SerialName("product_name")');

    // Test changing framework to Jackson
    await page.selectOption('#kotlin-framework', 'jackson');
    await expect(page.locator('#kotlin-output')).toContainText('@JsonProperty("product_name")');

    // Test preset button
    const presetBtn = page.locator('button:has-text("Profil Utilisateur"), button:has-text("User Profile")').first();
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();
    await expect(page.locator('#kotlin-output')).toContainText('data class');

    // Clear and focus
    const clearBtn = page.locator('button:has-text("Effacer"), button:has-text("Clear")').first();
    await clearBtn.click();
    await expect(page.locator('#json-input')).toHaveValue('');
    await expect(page.locator('#json-input')).toBeFocused();
  });
});
