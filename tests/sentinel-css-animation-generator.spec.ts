import { test, expect } from '@playwright/test';

test.describe('Sentinel CSS Animation Generator Security Tests', () => {
  test('Sanitizes malicious URL state parameters and falls back safely', async ({ page }) => {
    // Navigate with unsafe initial state parameters in URL or direct route
    const payload = encodeURIComponent(JSON.stringify({
      preset: '</style><script>window.__xss_test__=true</script>',
      timingFunction: 'expression(alert(1))',
      direction: 'invalid-dir',
      fillMode: 'invalid-fill',
      iterationCount: '999999',
      duration: 'invalid-num',
      delay: -100
    }));

    await page.goto(`http://localhost:5173/en/outil/css-animation?data=${payload}`);

    // Wait for the animation preview generator to load
    const durationInput = page.locator('#duration-input');
    await expect(durationInput).toBeVisible();

    // Verify injected script tag did NOT execute
    const xssExecuted = await page.evaluate(() => (window as any).__xss_test__);
    expect(xssExecuted).toBeUndefined();

    // Verify values fell back to safe defaults or clamped numbers
    await expect(durationInput).toHaveValue('1');
    const delayInput = page.locator('#delay-input');
    await expect(delayInput).toHaveValue('0');
  });
});
