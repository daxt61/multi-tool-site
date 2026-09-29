import { test, expect } from '@playwright/test';

test('Stopwatch UX and accessibility improvements', async ({ page, baseURL }) => {
  // Navigate to the Stopwatch tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/stopwatch-pro`);

  // 1. Verify primary timer display
  const timerDisplay = page.locator('[role="timer"]');
  await expect(timerDisplay).toBeVisible();

  // 2. Verify start/pause control
  const startBtn = page.locator('#start-pause-btn');
  await expect(startBtn).toBeVisible();

  // 3. Test starting the stopwatch
  await startBtn.click();
  await page.waitForTimeout(300);

  // 4. Test lap recording
  const lapBtn = page.getByRole('button', { name: /Tour \(L\)/i }).first();
  await expect(lapBtn).toBeEnabled();
  await lapBtn.click();

  // Verify lap row added
  await expect(page.locator('tbody tr')).toHaveCount(1);

  // 5. Test Copy Time button
  const copyTimeBtn = page.getByRole('button', { name: /Copier \(C\)/i }).first();
  await expect(copyTimeBtn).toBeVisible();
  await copyTimeBtn.click();

  // Verify toast notification
  await expect(page.getByText(/Copié/i).first()).toBeVisible();

  // 6. Test pause & reset
  await startBtn.click(); // Pause
  const resetBtn = page.getByRole('button', { name: /Réinitialiser/i }).first();
  await expect(resetBtn).toBeEnabled();
  await resetBtn.click();

  // Verify reset toast and state
  await expect(page.getByText(/Réinitialiser/i).first()).toBeVisible();
  await expect(startBtn).toBeFocused();

  // 7. Test hotkey navigation (Space to start/pause, L for lap, Esc to clear)
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('l');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.keyboard.press('Space'); // Pause

  // Press Escape to reset
  await page.keyboard.press('Escape');
  await expect(startBtn).toBeFocused();
});
