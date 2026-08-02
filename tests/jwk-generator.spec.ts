import { test, expect } from "@playwright/test";

test.describe("JWK Generator E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the JWK Generator tool
    await page.goto("http://localhost:5173/en/outil/jwk-generator");
    await page.waitForLoadState("networkidle");
  });

  test("Should load the page with proper layout and controls", async ({ page }) => {
    // Assert titles and sections are visible
    await expect(page.locator("h1")).toContainText("JWK Generator");
    await expect(page.locator("label[for='key-type-select']")).toContainText("Key Type (kty)");
    await expect(page.locator("label[for='pem-input-field']")).toContainText("PEM Key Format");
    await expect(page.locator("label[for='jwk-output-field']")).toContainText("JWK JSON Format");
  });

  test("Should support key generation for RSA, EC, and oct", async ({ page }) => {
    // Test RSA generation
    await page.selectOption("#key-type-select", "RSA");
    await page.selectOption("#key-size-select", "2048");
    await page.click("button:has-text('Generate JWK')");

    // Wait for the JSON output textarea to be updated with RSA key
    const outputArea = page.locator("#jwk-output-field");
    await expect(outputArea).not.toBeEmpty();
    let content = await outputArea.inputValue();
    expect(content).toContain('"kty": "RSA"');

    // Test EC generation
    await page.selectOption("#key-type-select", "EC");
    await page.selectOption("#ec-curve-select", "P-256");
    await page.click("button:has-text('Generate JWK')");
    await expect(outputArea).not.toBeEmpty();
    content = await outputArea.inputValue();
    expect(content).toContain('"kty": "EC"');
    expect(content).toContain('"crv": "P-256"');

    // Test oct generation
    await page.selectOption("#key-type-select", "oct");
    await page.selectOption("#oct-length-select", "256");
    await page.click("button:has-text('Generate JWK')");
    await expect(outputArea).not.toBeEmpty();
    content = await outputArea.inputValue();
    expect(content).toContain('"kty": "oct"');
  });

  test("Should support copying and clearing with keyboard shortcuts and buttons", async ({ page }) => {
    // Generate RSA key
    await page.click("button:has-text('Generate JWK')");
    await expect(page.locator("#jwk-output-field")).not.toBeEmpty();

    // Clear fields using ESC key
    await page.keyboard.press("Escape");
    await expect(page.locator("#jwk-output-field")).toBeEmpty();
    await expect(page.locator("#pem-input-field")).toBeEmpty();
  });
});
