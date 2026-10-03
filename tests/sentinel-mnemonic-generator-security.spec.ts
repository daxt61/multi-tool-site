import { test, expect } from '@playwright/test';

test.describe('Sentinel - MnemonicGenerator Sensitive Seed Phrase Injection Protection', () => {
  test('ignores pre-set seed phrase words passed via URL state and generates a fresh random BIP-39 seed phrase', async ({ page }) => {
    // Construct a base64 encoded URL state parameter containing pre-set trap seed words
    // JSON: {"words":["abandon","abandon","abandon","abandon","abandon","abandon","abandon","abandon","abandon","abandon","abandon","about"],"wordCount":12}
    const injectedState = {
      words: ["abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "about"],
      wordCount: 12
    };

    const encodedState = btoa(encodeURIComponent(JSON.stringify(injectedState)).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));

    await page.goto(`http://localhost:5173/fr/outil/mnemonic-generator?data=${encodedState}`);

    // Wait for the seed phrase words to render
    const wordBadges = page.locator('span.font-mono.font-bold');
    await expect(wordBadges.first()).toBeVisible();

    // Verify there are 12 words rendered
    await expect(wordBadges).toHaveCount(12);

    // Collect all word texts
    const wordsText = await wordBadges.allInnerTexts();

    // Sentinel: The generated seed phrase must NOT match the injected trap seed phrase
    // ["abandon", "abandon", "abandon", ...]
    const trapPhrase = injectedState.words.join(' ');
    const actualPhrase = wordsText.join(' ');

    expect(actualPhrase).not.toBe(trapPhrase);
  });
});
