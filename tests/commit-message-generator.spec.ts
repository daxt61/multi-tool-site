import { test, expect } from '@playwright/test';

test('Commit Message Generator functionality and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/commit-message-generator`);

  const scopeInput = page.locator('#commit-scope');
  const subjectInput = page.locator('#commit-subject');
  const bodyTextarea = page.locator('#commit-body');
  const breakingCheckbox = page.locator('#commit-breaking');
  const issuesInput = page.locator('#commit-issues');
  const lowercaseCheckbox = page.locator('#pref-lowercase');
  const gitcmdCheckbox = page.locator('#pref-gitcmd');
  const outputPre = page.locator('#generated-commit-output');

  // Verify elements exist
  await expect(scopeInput).toBeVisible();
  await expect(subjectInput).toBeVisible();
  await expect(bodyTextarea).toBeVisible();
  await expect(breakingCheckbox).toBeVisible();
  await expect(issuesInput).toBeVisible();
  await expect(lowercaseCheckbox).toBeVisible();
  await expect(gitcmdCheckbox).toBeVisible();
  await expect(outputPre).toBeVisible();

  // Test Case 1: Initial state shows placeholder
  await expect(outputPre).toContainText('Waiting for a valid subject title...');

  // Test Case 2: Fill in a subject and check output format
  await subjectInput.fill('Add user authentication support');
  // Should default to lowercase subject first letter: "add user authentication support"
  await expect(outputPre).toHaveText('feat: add user authentication support');

  // Test Case 3: Turn off lowercase subject and check output
  await lowercaseCheckbox.click();
  await expect(outputPre).toHaveText('feat: Add user authentication support');

  // Test Case 4: Add a scope
  await scopeInput.fill('auth');
  await expect(outputPre).toHaveText('feat(auth): Add user authentication support');

  // Test Case 5: Fill body
  await bodyTextarea.fill('This adds support for MFA using TOTP.');
  await expect(outputPre).toContainText('feat(auth): Add user authentication support\n\nThis adds support for MFA using TOTP.');

  // Test Case 6: Check breaking change options
  await breakingCheckbox.click();
  const breakingDetailsInput = page.locator('#commit-breaking-details');
  await expect(breakingDetailsInput).toBeVisible();
  await breakingDetailsInput.fill('changes token model');
  await expect(outputPre).toContainText('feat(auth)!: Add user authentication support');
  await expect(outputPre).toContainText('BREAKING CHANGE: changes token model');

  // Test Case 7: Issue References
  await issuesInput.fill('Closes #42');
  await expect(outputPre).toContainText('Closes #42');

  // Test Case 8: Wrap in Git command
  await gitcmdCheckbox.click();
  await expect(outputPre).toContainText('git commit -m "');

  // Test Case 9: Keyboard shortcut Escape clears and focuses subject
  await subjectInput.focus();
  await page.keyboard.press('Escape');
  await expect(subjectInput).toHaveValue('');
  await expect(scopeInput).toHaveValue('');
  await expect(bodyTextarea).toHaveValue('');
  await expect(issuesInput).toHaveValue('');
  await expect(subjectInput).toBeFocused();
});
