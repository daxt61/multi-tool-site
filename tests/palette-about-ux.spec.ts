import { test, expect } from '@playwright/test';

test('About page premium UX, localization and accessibility verification', async ({ page, baseURL }) => {
  const url = `${baseURL || 'http://localhost:5173'}/fr/a-propos`;
  await page.goto(url);

  // 1. Verify French headings and content are visible
  await expect(page.getByRole('heading', { name: /La productivité/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /sans compromis/i })).toBeVisible();
  await expect(page.getByText('Notre Mission', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Accessibilité & Performance/i })).toBeVisible();

  // 2. Verify all decorative icons in the about page are hidden from screen readers
  const zaps = page.locator('svg.lucide-zap');
  if (await zaps.count() > 0) {
    await expect(zaps.first()).toHaveAttribute('aria-hidden', 'true');
  }

  const shieldChecks = page.locator('svg.lucide-shield-check');
  if (await shieldChecks.count() > 0) {
    await expect(shieldChecks.first()).toHaveAttribute('aria-hidden', 'true');
  }

  const globes = page.locator('svg.lucide-globe-2');
  if (await globes.count() > 0) {
    await expect(globes.first()).toHaveAttribute('aria-hidden', 'true');
  }

  const wrenches = page.locator('svg.lucide-wrench');
  if (await wrenches.count() > 0) {
    await expect(wrenches.first()).toHaveAttribute('aria-hidden', 'true');
  }

  // 3. Switch to English using the language toggle
  const langToggle = page.getByRole('button', { name: /Changer de langue/i });
  await expect(langToggle).toBeVisible();
  await langToggle.click();

  // 4. Verify URL has changed to English
  await expect(page).toHaveURL(/.*\/en\/a-propos.*/);

  // 5. Verify English headings and content are visible
  await expect(page.getByRole('heading', { name: /Productivity/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /without compromise/i })).toBeVisible();
  await expect(page.getByText('Our Mission', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Accessibility & Performance/i })).toBeVisible();
});
