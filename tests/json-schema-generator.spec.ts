import { test, expect } from '@playwright/test';

test.describe('JSON Schema Generator E2E and UX', () => {
  test('should load in English and French and translate labels', async ({ page }) => {
    // English route
    await page.goto('http://localhost:5173/en/outil/json-schema');
    await expect(page.locator('label[for="json-input"]')).toContainText('JSON Input');
    await expect(page.locator('label[for="schema-output"]')).toContainText('Generated JSON Schema');

    // French route
    await page.goto('http://localhost:5173/fr/outil/json-schema');
    await expect(page.locator('label[for="json-input"]')).toContainText("JSON d'entrée");
    await expect(page.locator('label[for="schema-output"]')).toContainText('JSON Schema généré');
  });

  test('should generate a valid JSON Schema with option toggles', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-schema');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#schema-output');

    // Input some valid JSON
    const sampleJson = JSON.stringify({
      name: "Alice",
      age: 30,
      skills: ["React", "TypeScript"]
    }, null, 2);

    await inputArea.fill(sampleJson);

    // Verify basic schema generation (Draft-07, All Required)
    let outputText = await outputArea.textContent();
    expect(outputText).toContain('"http://json-schema.org/draft-07/schema#"');
    expect(outputText).toContain('"type": "object"');
    expect(outputText).toContain('"required": [');
    expect(outputText).toContain('"name"');
    expect(outputText).toContain('"age"');
    expect(outputText).toContain('"skills"');

    // Change draft version to Draft-04
    await page.selectOption('#draft-version', 'Draft-04');
    outputText = await outputArea.textContent();
    expect(outputText).toContain('"http://json-schema.org/draft-04/schema#"');

    // Change required fields mode to All Optional
    await page.click('#required-mode-optional');
    outputText = await outputArea.textContent();
    expect(outputText).not.toContain('"required"');

    // Toggle additional properties (disallow them)
    await page.click('text="Allow additional properties"');
    outputText = await outputArea.textContent();
    expect(outputText).toContain('"additionalProperties": false');

    // Toggle defaults (include defaults)
    await page.click('text="Include default values"');
    outputText = await outputArea.textContent();
    expect(outputText).toContain('"default": ""');
    expect(outputText).toContain('"default": 0');

    // Toggle examples (include examples)
    await page.click('text="Include example values"');
    outputText = await outputArea.textContent();
    expect(outputText).toContain('"examples"');
  });

  test('should clear inputs and focus textarea on Escape keypress', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-schema');

    const inputArea = page.locator('#json-input');
    await inputArea.fill('{"test": true}');

    // Focus input and press Escape (should clear and keep focus since we are on editable element)
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');

    // Fill again
    await inputArea.fill('{"test": true}');
    // Blur from editable element
    await page.locator('h3').first().click();
    // Press Escape (should clear input)
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    // And it should focus input programmatically
    await expect(inputArea).toBeFocused();
  });

  test('should trigger copy and show toast when C is pressed outside input', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-schema');

    const inputArea = page.locator('#json-input');
    await inputArea.fill('{"test": true}');

    // Focus h3 to blur
    await page.locator('h3').first().click();

    // Press 'c' to copy
    await page.keyboard.press('c');

    // Check if toast is displayed
    await expect(page.locator('text=Copied schema to clipboard!')).toBeVisible();
  });

  test('should sanitize keys matching prototype properties to prevent Prototype Pollution', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-schema');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#schema-output');

    // Input JSON with dangerous prototype property names
    const maliciousJson = JSON.stringify({
      "__proto__": "polluted",
      "constructor": "dangerous",
      "prototype": "unwanted"
    }, null, 2);

    await inputArea.fill(maliciousJson);

    const outputText = await outputArea.textContent();
    // The keys constructor and prototype must be prepended with an underscore
    expect(outputText).toContain('"_constructor"');
    expect(outputText).toContain('"_prototype"');
    expect(outputText).not.toContain('"constructor":');
    expect(outputText).not.toContain('"prototype":');
    expect(outputText).not.toContain('"__proto__":');
  });
});
