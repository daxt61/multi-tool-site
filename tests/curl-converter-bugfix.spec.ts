import { test, expect } from '@playwright/test';

test.describe('cURL Converter Bugfix E2E Tests', () => {
  test('does not append body for GET requests in fetch and axios', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/curl-converter');

    // Input cURL GET command
    await page.locator('#curl-input').fill('curl https://api.example.com/v1/users');

    // Default language is fetch
    const fetchOutput = await page.locator('#output-area').inputValue();
    expect(fetchOutput).toContain('fetch("https://api.example.com/v1/users"');
    expect(fetchOutput).not.toContain('body:');

    // Switch to Axios
    await page.getByRole('button', { name: 'axios', exact: true }).click();
    const axiosOutput = await page.locator('#output-area').inputValue();
    expect(axiosOutput).toContain('axios({');
    expect(axiosOutput).not.toContain('data:');
  });

  test('handles empty payload for POST request in Java OkHttp and Kotlin OkHttp', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/curl-converter');

    // Input cURL POST request with no body
    await page.locator('#curl-input').fill('curl -X POST https://api.example.com/v1/login -H "Content-Type: application/json"');

    // Switch to Java OkHttp
    await page.getByRole('button', { name: 'Java OkHttp' }).click();
    const javaOutput = await page.locator('#output-area').inputValue();
    expect(javaOutput).toContain('RequestBody body = RequestBody.create(mediaType, "")');
    expect(javaOutput).toContain('.method("POST", body)');

    // Switch to Kotlin OkHttp
    await page.getByRole('button', { name: 'Kotlin OkHttp' }).click();
    const kotlinOutput = await page.locator('#output-area').inputValue();
    expect(kotlinOutput).toContain('val body = "".toRequestBody(mediaType)');
    expect(kotlinOutput).toContain('.method("POST", body)');
  });
});
