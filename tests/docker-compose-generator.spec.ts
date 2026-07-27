import { test, expect } from '@playwright/test';

test('Docker Compose Generator E2E: Presets, Service Configuration, Copy, and Reset', async ({ page }) => {
  // Go to Docker Compose Generator tool
  await page.goto('http://localhost:5173/en/outil/docker-compose-generator');

  // Verify header and preset elements are visible
  await expect(page.getByText('Templates / Presets')).toBeVisible();
  await expect(page.getByRole('button', { name: 'MERN Stack' })).toBeVisible();

  // Load the MERN preset
  await page.getByRole('button', { name: 'MERN Stack' }).click();

  // Verify that the output has frontend, backend and db services in the YAML
  const pre = page.locator('pre').first();
  await expect(pre).toContainText('frontend:');
  await expect(pre).toContainText('backend:');
  await expect(pre).toContainText('db:');

  // Test adding a custom service
  const addServiceBtn = page.getByRole('button', { name: 'Add Service', exact: true });
  await addServiceBtn.click();

  // A new service block should be added, verify with text "service4"
  await expect(pre).toContainText('service4:');

  // Test the reset functionality via the Reset button
  const resetBtn = page.getByRole('button', { name: 'Reset' }).first();
  await resetBtn.click();

  // Verify that the services have reset to the default ones (web)
  await expect(pre).toContainText('web:');
  await expect(pre).not.toContainText('frontend:');

  // Verify that pressing C key triggers copying when not focused on an input
  await page.keyboard.press('c');

  // Verify sonner success toast was fired
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
});
