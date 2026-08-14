import { test, expect } from '@playwright/test';

test.describe('JSON to XSD Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-xsd');
    await page.waitForLoadState('networkidle');
  });

  test('renders properly with controls and empty output', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('JSON en Schéma XSD');
    await expect(page.locator('#json-input')).toBeVisible();
    await expect(page.locator('#xsd-output')).toBeVisible();
    await expect(page.locator('#root-element-input')).toHaveValue('Root');
    await expect(page.locator('#target-namespace-input')).toHaveValue('http://example.org/schema');
  });

  test('converts valid JSON to XSD Schema correctly', async ({ page }) => {
    const jsonText = JSON.stringify({
      orderId: "ORD-100",
      itemCount: 3,
      price: 29.99,
      active: true,
      tags: ["express", "fragile"]
    }, null, 2);

    await page.fill('#json-input', jsonText);

    const xsdValue = await page.inputValue('#xsd-output');
    expect(xsdValue).toContain('<xs:schema');
    expect(xsdValue).toContain('name="Root"');
    expect(xsdValue).toContain('name="orderId" type="xs:string"');
    expect(xsdValue).toContain('name="itemCount" type="xs:integer"');
    expect(xsdValue).toContain('name="price" type="xs:decimal"');
    expect(xsdValue).toContain('name="active" type="xs:boolean"');
    expect(xsdValue).toContain('name="tags" type="xs:string" minOccurs="0" maxOccurs="unbounded"');
  });

  test('updates root element and namespace dynamically', async ({ page }) => {
    await page.fill('#json-input', JSON.stringify({ status: "OK" }));
    await page.fill('#root-element-input', 'ApiResponse');
    await page.fill('#target-namespace-input', 'https://api.mycompany.com/v1');

    const xsdValue = await page.inputValue('#xsd-output');
    expect(xsdValue).toContain('targetNamespace="https://api.mycompany.com/v1"');
    expect(xsdValue).toContain('name="ApiResponse"');
    expect(xsdValue).toContain('name="status" type="xs:string"');
  });

  test('applies interactive quick presets', async ({ page }) => {
    // Click on the E-Commerce Order preset button
    await page.click('button:has-text("Commande E-Commerce")');

    await expect(page.locator('#root-element-input')).toHaveValue('Order');
    const jsonValue = await page.inputValue('#json-input');
    expect(jsonValue).toContain('ORD-98214');

    const xsdValue = await page.inputValue('#xsd-output');
    expect(xsdValue).toContain('name="Order"');
    expect(xsdValue).toContain('name="customer"');
    expect(xsdValue).toContain('name="items" minOccurs="0" maxOccurs="unbounded"');
  });

  test('handles invalid JSON gracefully', async ({ page }) => {
    await page.fill('#json-input', '{ invalidJson: ');
    await expect(page.locator('text=Syntaxe JSON invalide')).toBeVisible();
    await expect(page.locator('#xsd-output')).toHaveValue('');
  });

  test('clears inputs with Escape key when focused', async ({ page }) => {
    await page.fill('#json-input', '{"test": true}');
    expect(await page.inputValue('#xsd-output')).not.toBe('');

    await page.focus('#json-input');
    await page.keyboard.press('Escape');

    await expect(page.locator('#json-input')).toHaveValue('');
    await expect(page.locator('#xsd-output')).toHaveValue('');
  });
});
