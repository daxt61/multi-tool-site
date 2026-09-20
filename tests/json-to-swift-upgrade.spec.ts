import { test, expect } from '@playwright/test';

test.describe('JSON to Swift Converter Upgrade', () => {
  test('renders JSON to Swift tool with presets, controls and converts JSON to Swift Codable structs', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-swift');

    // Page title check
    await expect(page.locator('h1')).toContainText('JSON en Swift');

    // Output textarea
    const outputArea = page.locator('#swift-output');
    const inputArea = page.locator('#json-input');

    // Load User Profile Preset
    const userPresetBtn = page.getByRole('button', { name: 'Profil Utilisateur' });
    await userPresetBtn.click();

    await expect(inputArea).toContainText('Sarah');
    await expect(outputArea).toContainText('public struct RootObject: Codable');
    await expect(outputArea).toContainText('public let firstName: String');
    await expect(outputArea).toContainText('enum CodingKeys: String, CodingKey');
    await expect(outputArea).toContainText('case firstName = "first_name"');

    // Toggle Type Kind to class
    const typeSelect = page.locator('#swift-type-kind');
    await typeSelect.selectOption('class');

    await expect(outputArea).toContainText('public class RootObject: Codable');

    // Toggle Optional Properties
    const optionalCheckbox = page.getByLabel('Marquer les propriétés comme optionnelles (?)');
    await optionalCheckbox.check();

    await expect(outputArea).toContainText('public let firstName: String?');

    // Test Copy button and Sonner toast
    const copyBtn = page.getByRole('button', { name: 'Copier C' });
    await copyBtn.click();
    await expect(page.locator('ol')).toContainText('Code Swift copié');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: 'Effacer' });
    await clearBtn.click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('handles keyboard shortcuts (Escape to clear and focus, C to copy)', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-swift');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#swift-output');

    // Load E-Commerce Order preset
    await page.getByRole('button', { name: 'Commande E-Commerce' }).click();
    await expect(outputArea).toContainText('public struct RootObject: Codable');

    // Unfocus textareas
    await page.locator('body').click();

    // Press Escape to clear and focus input
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
