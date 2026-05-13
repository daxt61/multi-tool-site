import { test, expect } from '@playwright/test';

test('verify new tools and upgraded password generator', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Check if new tools are present in the search
  await page.fill('#tool-search', 'WhatsApp');
  await expect(page.getByRole('heading', { name: 'Lien WhatsApp' })).toBeVisible();

  await page.fill('#tool-search', 'Security');
  await expect(page.getByRole('heading', { name: 'Headers Sécurité' })).toBeVisible();

  // Verify WhatsApp Link Generator
  await page.goto('http://localhost:5173/fr/outil/whatsapp-link');
  await page.fill('#phone-number', '33612345678');
  await page.fill('#message', 'Hello World');
  await expect(page.getByText('https://wa.me/33612345678?text=Hello%20World')).toBeVisible();
  await page.screenshot({ path: 'whatsapp-tool.png' });

  // Verify Security Headers Generator
  await page.goto('http://localhost:5173/fr/outil/security-headers');
  await expect(page.getByText('CSP (Content Security Policy)')).toBeVisible();
  await page.screenshot({ path: 'security-headers-tool.png' });

  // Verify Upgraded Password Generator
  await page.goto('http://localhost:5173/fr/outil/password-generator');
  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible();

  // Toggle visibility
  await page.click('button[aria-label^="Afficher le mot de passe"]');
  const visiblePasswordInput = page.locator('input[type="text"]');
  await expect(visiblePasswordInput).toBeVisible();

  // Check that some strength feedback is visible
  await expect(page.locator('p.text-white\\/40.font-medium')).toBeVisible();
  await page.screenshot({ path: 'password-tool.png' });
});
