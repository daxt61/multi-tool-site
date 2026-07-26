import { test, expect } from '@playwright/test';

test('verify JWTDecoder upgraded premium UX and shortcuts', async ({ page }) => {
  // Navigation to the JWT Decoder tool path
  await page.goto('http://localhost:5173/en/outil/jwt-decoder');

  const jwtInput = page.locator('textarea#jwt-input');
  await expect(jwtInput).toBeVisible();

  // Initially details shouldn't be visible
  await expect(page.locator('h3:has-text("Header")')).not.toBeVisible();

  // Fill in a valid sample JWT
  const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF5IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  await jwtInput.fill(sampleJwt);

  // Decoded areas should become visible
  const headerHeading = page.locator('h3:has-text("Header")');
  await expect(headerHeading).toBeVisible();

  const payloadHeading = page.locator('h3:has-text("Payload")');
  await expect(payloadHeading).toBeVisible();

  // Signature verification box should be visible
  const verificationLabel = page.locator('label:has-text("Signature Verification (HMAC)")');
  await expect(verificationLabel).toBeVisible();

  // Set the secret key input
  const secretInput = page.locator('input#jwt-secret-input');
  await expect(secretInput).toBeVisible();
  await secretInput.fill('your-256-bit-secret');

  // Check signature status changes or exists
  const statusBadge = page.locator('span:has-text("Invalid Signature")');
  await expect(statusBadge).toBeVisible();

  // Pressing Escape should reset inputs
  // Click on a non-editable element first to lose focus on editable inputs
  await headerHeading.click();
  await page.keyboard.press('Escape');

  // Input should be empty and refocused
  await expect(jwtInput).toHaveValue('');
  await expect(jwtInput).toBeFocused();
});
