import { test, expect } from '@playwright/test';

test.describe('Cron Generator Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to English version of the tool
    await page.goto('http://localhost:5173/en/outil/cron-generator');
  });

  test('renders standard UI and accessibility features', async ({ page }) => {
    // Verify the presence of basic labels
    await expect(page.locator('label[for="cron-minute"]')).toBeVisible();
    await expect(page.locator('label[for="cron-hour"]')).toBeVisible();
    await expect(page.locator('label[for="cron-dom"]')).toBeVisible();
    await expect(page.locator('label[for="cron-month"]')).toBeVisible();
    await expect(page.locator('label[for="cron-dow"]')).toBeVisible();

    // Verify main result container has aria-live to announce changes (scoped to region)
    const expressionDisplay = page.locator('[role="region"] [aria-live="polite"]').first();
    await expect(expressionDisplay).toBeVisible();
    await expect(expressionDisplay).toHaveText('* * * * *');
  });

  test('applies presets correctly and triggers sonner toast', async ({ page }) => {
    // Click on "Every 5 minutes" preset button
    const presetBtn = page.getByRole('button', { name: 'Every 5 minutes' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify the cron output was updated
    const expressionDisplay = page.locator('[role="region"] [aria-live="polite"]').first();
    await expect(expressionDisplay).toHaveText('*/5 * * * *');

    // Verify sonner success toast appears
    const toast = page.locator('ol[data-sonner-toaster] li').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Preset/i);
  });

  test('manually updating inputs triggers real-time expression and description updates', async ({ page }) => {
    // Update minute field
    const minuteInput = page.locator('#cron-minute');
    await minuteInput.fill('15');

    // Update hour field
    const hourInput = page.locator('#cron-hour');
    await hourInput.fill('12');

    // Verify the cron output is updated
    const expressionDisplay = page.locator('[role="region"] [aria-live="polite"]').first();
    await expect(expressionDisplay).toHaveText('15 12 * * *');
  });

  test('clears inputs and programmatically restores focus', async ({ page }) => {
    // Apply a preset first to change values
    await page.getByRole('button', { name: 'Every 5 minutes' }).click();

    const minuteInput = page.locator('#cron-minute');
    await expect(minuteInput).toHaveValue('*/5');

    // Click the clear button (we target the button containing the trash icon or text)
    const clearBtn = page.locator('button:has(svg.lucide-trash2)');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Verify inputs reset to '*'
    await expect(minuteInput).toHaveValue('*');
    await expect(page.locator('#cron-hour')).toHaveValue('*');

    // Verify focus is restored to the minute input
    await expect(minuteInput).toBeFocused();

    // Verify sonner success toast for clear event
    const toast = page.locator('ol[data-sonner-toaster] li').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/reset/i);
  });

  test('handles global Escape shortcut to reset inputs and restore focus', async ({ page }) => {
    // Apply a preset first
    await page.getByRole('button', { name: 'Every 5 minutes' }).click();

    const minuteInput = page.locator('#cron-minute');
    await expect(minuteInput).toHaveValue('*/5');

    // Focus away from editable elements (e.g. click body or non-interactive element)
    await page.locator('h1').first().click();

    // Trigger keypress 'Escape'
    await page.keyboard.press('Escape');

    // Verify inputs reset
    await expect(minuteInput).toHaveValue('*');
    await expect(minuteInput).toBeFocused();
  });

  test('handles global C shortcut to copy output expression when input is not focused', async ({ page }) => {
    // Trigger keypress 'c'
    await page.keyboard.press('c');

    // Verify sonner success toast for copying
    const toast = page.locator('ol[data-sonner-toaster] li').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/copied/i);
  });

  test('does not trigger Escape or C shortcuts when input fields are focused', async ({ page }) => {
    const minuteInput = page.locator('#cron-minute');
    await minuteInput.focus();

    // Press 'c' inside input field
    await page.keyboard.press('c');

    // Value should contain 'c' (or append it to value)
    await expect(minuteInput).toHaveValue('*c');

    // Toast should NOT appear (as we were typing)
    const toast = page.locator('ol[data-sonner-toaster] li');
    await expect(toast).not.toBeVisible();
  });
});
