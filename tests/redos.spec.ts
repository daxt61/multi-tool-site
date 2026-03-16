import { test, expect } from '@playwright/test';

test('RegExTester ReDoS protection', async ({ page }) => {
  await page.goto('http://localhost:5173/outil/regex-tester');

  // Input a catastrophic backtracking pattern
  const regexInput = page.locator('#regex-input');
  await regexInput.fill('');
  await regexInput.type('(a+)+$');

  // Input a string that triggers backtracking
  const testTextInput = page.locator('#test-text');
  await testTextInput.fill('');
  await testTextInput.type('aaaaaaaaaaaaaaaaaaaaaaaaaa!');

  // Wait for the timeout and check for the error message
  const errorAlert = page.locator('.text-rose-500');
  await expect(errorAlert).toBeVisible({ timeout: 5000 });
  await expect(errorAlert).toContainText("L'exécution de la regex a pris trop de temps (ReDoS potentiel).");

  // Verify that the UI is still responsive by interacting with another element
  const copyButton = page.getByRole('button', { name: 'Copier', exact: true });
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await expect(page.getByText('Copié')).toBeVisible();
});
