import { test, expect } from '@playwright/test';

test('verify SemVerAnalyzer functionalities', async ({ page }) => {
  // Navigation to the SemVer Analyzer tool path
  await page.goto('http://localhost:5173/fr/outil/semver-analyzer');

  // Verify header tabs are visible
  const analyzerTab = page.locator('button:has-text("Analyseur & Incrémenteur")');
  const comparatorTab = page.locator('button:has-text("Comparateur de Versions")');
  const rangesTab = page.locator('button:has-text("Testeur d\'Intervalles")');
  await expect(analyzerTab).toBeVisible();
  await expect(comparatorTab).toBeVisible();
  await expect(rangesTab).toBeVisible();

  // Test 1: Parser & Incrementor
  const input = page.locator('input#ver-input');
  await expect(input).toBeVisible();
  await input.fill('1.2.3-beta.1+build.104');

  // Verify breakdown
  const validBadge = page.locator('span:has-text("SemVer 2.0.0 Valide")');
  await expect(validBadge).toBeVisible();

  // Check Major, Minor, Patch details
  const majorText = page.locator('p:has-text("1")');
  await expect(majorText.first()).toBeVisible();

  // Click Major increment action
  const incrementMajorBtn = page.locator('button:has-text("Major (+1.0.0)")');
  await expect(incrementMajorBtn).toBeVisible();
  await incrementMajorBtn.click();

  // Value in input should have been incremented to 2.0.0
  const updatedValue = await input.inputValue();
  expect(updatedValue).toBe('2.0.0');

  // Test 2: Comparator Tab
  await comparatorTab.click();
  const compAInput = page.locator('input#comp-a');
  const compBInput = page.locator('input#comp-b');
  await expect(compAInput).toBeVisible();
  await expect(compBInput).toBeVisible();

  await compAInput.fill('1.8.2-alpha.5');
  await compBInput.fill('1.8.2-beta.2');

  // Result symbol should indicate lower precedence
  const comparisonSign = page.locator('#comparison-sign');
  await expect(comparisonSign).toBeVisible();
  const signText = await comparisonSign.textContent();
  expect(signText?.trim()).toBe('<');

  // Test 3: Ranges Tab
  await rangesTab.click();
  const rangeInput = page.locator('input#range-input');
  await expect(rangeInput).toBeVisible();
  await rangeInput.fill('^1.2.0');

  const textVersions = page.locator('textarea#test-versions');
  await expect(textVersions).toBeVisible();
  await textVersions.fill('1.2.3\n2.0.0');

  // Verify that 1.2.3 satisfies and 2.0.0 is excluded
  const satBadge = page.locator('span:has-text("Satisfait")');
  const excBadge = page.locator('span:has-text("Exclu")');
  await expect(satBadge).toBeVisible();
  await expect(excBadge).toBeVisible();
});
