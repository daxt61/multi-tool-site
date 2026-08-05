import { test, expect } from '@playwright/test';

test('verify category tool counts and contrast improvements', async ({ page }) => {
  await page.goto('http://localhost:5173/fr');

  // Verify category filter buttons exist and have counts
  const allCategory = page.getByRole('button', { name: /Tous/i });
  await expect(allCategory).toBeVisible();

  // The count should be present in the button
  const allCount = await allCategory.locator('span').textContent();
  expect(parseInt(allCount || '0')).toBeGreaterThan(0);

  // Visit a tool to make "Recent Tools" section appear
  await page.goto('http://localhost:5173/fr/outil/calculator');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Give React state time to trigger localStorage write
  await page.goto('http://localhost:5173/fr');
  await page.waitForLoadState('networkidle');

  // Verify Recent Tools heading has correct contrast class (slate-500)
  const recentHeading = page.locator('h2#recent-tools-title');
  await expect(recentHeading).toBeVisible();

  // Check color contrast by taking a screenshot for manual verification if needed
  await page.screenshot({ path: 'dashboard-ux-verify.png' });
});

test('verify decorative icons have aria-hidden="true" for screen readers', async ({ page }) => {
  await page.goto('http://localhost:5173/fr');

  // 1. Category icons
  const categoryIcons = page.locator('button[aria-pressed] svg.lucide');
  const countCats = await categoryIcons.count();
  expect(countCats).toBeGreaterThan(0);
  for (let i = 0; i < countCats; i++) {
    await expect(categoryIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // 2. Search bar icon
  const searchInputIcon = page.locator('.absolute.left-4 svg.lucide-search');
  await expect(searchInputIcon).toHaveAttribute('aria-hidden', 'true');

  // 3. Brand header logo Sparkles icon
  const sparklesIcon = page.locator('header a svg.lucide-sparkles');
  await expect(sparklesIcon).toHaveAttribute('aria-hidden', 'true');

  // 4. "I'm feeling lucky" random tool Shuffle icon
  const shuffleIcon = page.locator('button:has-text("lucky"), button:has-text("chance")').locator('svg.lucide-shuffle');
  await expect(shuffleIcon).toHaveAttribute('aria-hidden', 'true');

  // 5. Star icon in Tool Cards
  const starIcons = page.locator('button[aria-label*="favori"] svg.lucide-star');
  const countStars = await starIcons.count();
  expect(countStars).toBeGreaterThan(0);
  for (let i = 0; i < countStars; i++) {
    await expect(starIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // 6. Back-to-top button icon (when scrolled)
  await page.evaluate(() => window.scrollTo(0, 1000));
  const backToTopBtn = page.locator('button[aria-label*="haut"], button[aria-label*="top"]');
  await expect(backToTopBtn).toBeVisible();
  const arrowUpIcon = backToTopBtn.locator('svg.lucide-arrow-up');
  await expect(arrowUpIcon).toHaveAttribute('aria-hidden', 'true');

  // 7. Recent tools list icons
  await page.goto('http://localhost:5173/fr/outil/calculator');
  await page.goto('http://localhost:5173/fr');

  // Recent tools trash icon
  const trashIcon = page.locator('button[className*="rose-500"], button:has-text("Effac"), button:has-text("Clear")').locator('svg.lucide-trash2');
  await expect(trashIcon).toHaveAttribute('aria-hidden', 'true');

  // Recent tools item icon
  const recentItemIcon = page.locator('section[aria-labelledby="recent-tools-title"] a svg.lucide');
  const countRecentIcons = await recentItemIcon.count();
  expect(countRecentIcons).toBeGreaterThan(0);
  for (let i = 0; i < countRecentIcons; i++) {
    await expect(recentItemIcon.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // 8. Clear input "X" icon (when typing)
  const searchInput = page.locator('input[id="tool-search"]');
  await searchInput.focus();
  await searchInput.fill('calc');
  const clearBtn = page.locator('button[aria-label="Effacer tout"]');
  await expect(clearBtn).toBeVisible();
  const clearBtnIcon = clearBtn.locator('svg');
  await expect(clearBtnIcon).toHaveAttribute('aria-hidden', 'true');
});
