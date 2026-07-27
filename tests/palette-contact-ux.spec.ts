import { test, expect } from '@playwright/test';

test('verify contact page accessibility, localization, and form submission', async ({ page }) => {
  // 1. Verify English Version
  await page.goto('http://localhost:5173/en/contact');

  // Verify Title & Subtitle in English
  const titleEn = page.locator('h1', { hasText: 'Contact' });
  await expect(titleEn).toBeVisible();

  const headerEn = page.locator('h2', { hasText: 'Contact us.' });
  await expect(headerEn).toBeVisible();

  // Verify label-to-input association in English (using 'for' attributes)
  const emailLabelEn = page.locator('label[for="contact-email"]');
  await expect(emailLabelEn).toBeVisible();
  await expect(emailLabelEn).toHaveText('Email');

  const emailInputEn = page.locator('input#contact-email');
  await expect(emailInputEn).toBeVisible();
  await expect(emailInputEn).toHaveAttribute('type', 'email');

  const messageLabelEn = page.locator('label[for="contact-message"]');
  await expect(messageLabelEn).toBeVisible();
  await expect(messageLabelEn).toHaveText('Message');

  const messageInputEn = page.locator('textarea#contact-message');
  await expect(messageInputEn).toBeVisible();

  // Verify Social media anchor tags are accessible
  const githubLink = page.locator('a[aria-label="GitHub Profile"]');
  await expect(githubLink).toBeVisible();
  await expect(githubLink).toHaveAttribute('href', 'https://github.com');
  await expect(githubLink).toHaveAttribute('target', '_blank');

  const twitterLink = page.locator('a[aria-label="Twitter Profile"]');
  await expect(twitterLink).toBeVisible();
  await expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
  await expect(twitterLink).toHaveAttribute('target', '_blank');

  // Fill and Submit form in English
  await emailInputEn.fill('test@example.com');
  await messageInputEn.fill('Hello from Playwright testing!');
  await page.screenshot({ path: 'verification/screenshots/contact_page_ux.png' });
  await page.locator('button[type="submit"]').click();

  // Verify English success state
  const successTitleEn = page.locator('h3', { hasText: 'Message sent!' });
  await expect(successTitleEn).toBeVisible();


  // 2. Verify French Version
  await page.goto('http://localhost:5173/fr/contact');

  // Verify Title & Subtitle in French
  const titleFr = page.locator('h1', { hasText: 'Contact' });
  await expect(titleFr).toBeVisible();

  const headerFr = page.locator('h2', { hasText: 'Contactez-nous.' });
  await expect(headerFr).toBeVisible();

  // Verify label-to-input association in French
  const emailLabelFr = page.locator('label[for="contact-email"]');
  await expect(emailLabelFr).toBeVisible();
  await expect(emailLabelFr).toHaveText('Email');

  const emailInputFr = page.locator('input#contact-email');
  await expect(emailInputFr).toBeVisible();

  // Verify Social media anchor tags are accessible in French
  const githubLinkFr = page.locator('a[aria-label="Profil GitHub"]');
  await expect(githubLinkFr).toBeVisible();

  const twitterLinkFr = page.locator('a[aria-label="Profil Twitter"]');
  await expect(twitterLinkFr).toBeVisible();

  // Fill and Submit form in French
  await emailInputFr.fill('test@exemple.com');
  const messageInputFr = page.locator('textarea#contact-message');
  await messageInputFr.fill('Bonjour de la part des tests Playwright !');
  await page.locator('button[type="submit"]').click();

  // Verify French success state
  const successTitleFr = page.locator('h3', { hasText: 'Message envoyé !' });
  await expect(successTitleFr).toBeVisible();
});
