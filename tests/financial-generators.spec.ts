import { test, expect } from '@playwright/test';

test.describe('Financial Generators Functionality', () => {
  test('CreditCardGenerator produces valid formatted numbers', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/credit-card-generator');

    // Click Generate button
    await page.click('button:has-text("Generate")');

    // Check if the card number is displayed and formatted
    const cardNumber = await page.textContent('.font-mono.font-bold.tracking-\\[0\\.2em\\]');
    expect(cardNumber).toMatch(/\d{4} \d{4} \d{4} \d{4}/); // Standard Visa/Mastercard format

    // Check expiry
    const expiry = await page.textContent('div:has-text("Expiry") + .font-mono.font-bold');
    expect(expiry).toMatch(/\d{2}\/\d{2}/);

    // Check CVV
    const cvv = await page.textContent('div:has-text("CVV") + .font-mono.font-bold');
    expect(cvv).toMatch(/\d{3,4}/);
  });

  test('IBANGenerator produces formatted IBANs', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/iban-generator');

    // Click Generate button
    await page.click('button:has-text("Generate")');

    // Check if IBAN is displayed
    const iban = await page.textContent('.font-mono.font-black.text-white');
    expect(iban).toMatch(/[A-Z]{2}\d{2}( \d{4}){4,}/); // Simplified check for spaces
  });
});
