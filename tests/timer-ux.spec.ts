import { test, expect } from '@playwright/test';

test('TimerTool UX and accessibility improvements', async ({ page, baseURL }) => {
  // Navigate to the Timer tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/timer`);

  // 1. Verify sound toggle accessibility
  const soundToggle = page.locator('button[aria-label="Désactiver le son"], button[aria-label="Activer le son"]');
  await expect(soundToggle).toBeVisible();
  const initialPressed = await soundToggle.getAttribute('aria-pressed');

  // Test keyboard shortcut 'M' for mute
  await page.keyboard.press('m');
  const afterMPressed = await soundToggle.getAttribute('aria-pressed');
  expect(afterMPressed).not.toBe(initialPressed);

  // 2. Verify localized "Next" button in Pomodoro mode
  await page.getByRole('button', { name: 'Pomodoro' }).click();
  const nextButton = page.getByRole('button', { name: 'Suivant' });
  await expect(nextButton).toBeVisible();

  // 3. Verify keyboard shortcut hints (kbd elements)
  const spaceHint = page.locator('kbd:has-text("Space")');
  await expect(spaceHint).toBeVisible();
  const rHint = page.locator('button:has-text("Reset"), button:has-text("Réinitialiser")').locator('kbd', { hasText: 'R' });
  await expect(rHint).toBeVisible();

  // 4. Verify sound toggle is still there in Pomodoro mode
  await expect(soundToggle).toBeVisible();
});
