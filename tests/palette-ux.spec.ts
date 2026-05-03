import { test, expect } from '@playwright/test';

test('verify recent tools in command menu', async ({ page }) => {
  // 1. Visit a tool to add it to recents
  await page.goto('http://localhost:5173/fr/outil/password-generator');
  await expect(page.getByRole('heading', { name: 'Mots de passe' })).toBeVisible();

  // 2. Go back home
  await page.goto('http://localhost:5173/fr');

  // 3. Open Command Menu (Ctrl+K)
  await page.keyboard.press('Control+k');

  // 4. Check if "Outils Récents" group is present
  const recentGroup = page.getByRole('group', { name: 'Outils Récents' });
  await expect(recentGroup).toBeVisible();

  // 5. Check if the tool is in the recent group
  await expect(recentGroup.getByText('Mots de passe')).toBeVisible();

  await page.screenshot({ path: 'command-menu-recents.png' });
});

test('verify localization of global elements', async ({ page }) => {
  await page.goto('http://localhost:5173/fr');

  // Check "Skip to content"
  const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' });
  await expect(skipLink).toBeVisible();

  // Check language toggle label
  const langToggle = page.getByRole('button', { name: 'Changer de langue' });
  await expect(langToggle).toBeVisible();

  // Switch to English
  await langToggle.click();
  await expect(page).toHaveURL(/.*\/en.*/);

  // Check English localization
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change language' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible();

  await page.screenshot({ path: 'localization-check.png' });
});
