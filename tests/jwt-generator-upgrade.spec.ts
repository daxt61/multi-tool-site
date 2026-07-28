import { test, expect } from '@playwright/test';

test('JWT Generator Upgrade E2E: Generation, Copy, Reset, and Keyboard Shortcuts', async ({ page }) => {
  // Go to JWT Generator tool
  await page.goto('http://localhost:5173/en/outil/jwt-generator');

  // Verify inputs are visible
  const secretInput = page.locator('#jwt-secret');
  const headerTextarea = page.locator('#jwt-header');
  const payloadTextarea = page.locator('#jwt-payload');

  await expect(secretInput).toBeVisible();
  await expect(headerTextarea).toBeVisible();
  await expect(payloadTextarea).toBeVisible();

  // Initially, signature is missing because secret is empty
  const pre = page.locator('.break-all');
  await expect(pre).toContainText('[Signature missing]');

  // Enter a secret key
  await secretInput.fill('my-super-secret-key-123456');

  // The [Signature missing] tag should disappear and we should have a signature now
  await expect(pre).not.toContainText('[Signature missing]');

  // Copy the token using the copy button inside the tool (which is the last button with lucide-copy or with Copy text)
  const copyBtn = page.locator('button:has-text("Copy")').last();
  await copyBtn.click();

  // Verification of sonner toast
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();

  // Test the Clear utility button
  const clearBtn = page.locator('button:has-text("Clear")');
  await clearBtn.click();

  // Inputs should be reset and secret input should be focused
  await expect(secretInput).toHaveValue('');
  await expect(secretInput).toBeFocused();
  await expect(pre).toContainText('[Signature missing]');

  // Fill secret input again
  await secretInput.fill('another-secret');

  // Press Escape on the secret input
  await page.keyboard.press('Escape');

  // Verify that it is cleared and focused again
  await expect(secretInput).toHaveValue('');
  await expect(secretInput).toBeFocused();
});

test('JWT Generator mitigates client-side DoS by enforcing MAX_LENGTH', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/jwt-generator');

  // Verify elements are loaded
  const payloadTextarea = page.locator('#jwt-payload');
  await expect(payloadTextarea).toBeVisible();

  // Create an extremely large payload
  const hugePayload = JSON.stringify({ sub: '1234567890', data: 'a'.repeat(100005) });

  // Fill with too long payload
  await payloadTextarea.fill(hugePayload);

  // Expect error alert to be visible and display length error
  const errorAlert = page.locator('div.bg-rose-50');
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toContainText("Input is too long. Limit of 100,000 characters.");

  // Clear/Reset and verify error disappears
  const clearBtn = page.locator('button:has-text("Clear")');
  await clearBtn.click();
  await expect(errorAlert).not.toBeVisible();
});
