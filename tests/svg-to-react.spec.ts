import { test, expect } from '@playwright/test';

test.describe('SVG to React Converter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the SVG to React tool page
    await page.goto('http://localhost:5173/en/outil/svg-to-react');
    await page.waitForLoadState('networkidle');
  });

  test('should load preset, convert to React TSX and React Native, handle copy/clear and toggles', async ({ page }) => {

    // Confirm initial state has SvgComponent TSX generated
    const outputArea = page.locator('textarea[readonly]');
    await expect(outputArea).toContainText('const SvgComponent');
    await expect(outputArea).toContainText('interface SvgProps');

    // Click on "Star Icon" preset button
    const starBtn = page.getByRole('button', { name: 'Star Icon' });
    await expect(starBtn).toBeVisible();
    await starBtn.click();

    // Verify Star Icon SVG coordinates (polygon points) are loaded in input
    const inputArea = page.locator('textarea[id="svg-input"]');
    await expect(inputArea).toContainText('polygon points="12 2 15.09 8.26');

    // Change Component Name
    const nameInput = page.locator('input[id="comp-name"]');
    await nameInput.clear();
    await nameInput.fill('StarRatingIcon');

    // Toggle options (while platform is Web, so all 4 checkboxes exist)
    const customSizeCheckbox = page.locator('input[type="checkbox"]').nth(3); // override size prop
    await customSizeCheckbox.uncheck();
    await expect(outputArea).not.toContainText('size = 24');

    // Change platform to React Native
    const nativeBtn = page.getByRole('button', { name: 'React Native' });
    await nativeBtn.click();

    // Verify react-native-svg components are imported and used
    await expect(outputArea).toContainText("import Svg, { SvgProps, Polygon } from 'react-native-svg'");
    await expect(outputArea).toContainText('const StarRatingIcon');

    // Test JavaScript (JSX) output instead of TypeScript
    const jsBtn = page.getByRole('button', { name: 'JavaScript (JSX)' });
    await jsBtn.click();
    await expect(outputArea).not.toContainText('interface CustomSvgProps');

    // Test Copy Action
    // Locating copy button by using has-text of translator or simple icon lookup
    const copyBtn = page.locator('button:has(svg.lucide-copy)').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Clean / Clear
    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await clearBtn.click();
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
