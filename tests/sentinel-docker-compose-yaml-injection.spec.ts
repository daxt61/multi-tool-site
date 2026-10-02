import { test, expect } from '@playwright/test';

test.describe('Sentinel Security: Docker Compose Generator CRLF/YAML Injection Mitigation', () => {
  test('Sanitizes multiline inputs and prevents YAML directive/service structure breakout', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/docker-compose-generator');

    // Wait for the tool to render
    const pre = page.locator('pre code').first();
    await expect(pre).toBeVisible();

    // Target the Docker Image input field of the first service
    const imageInput = page.locator('input[placeholder="e.g. nginx:alpine"]').first();
    await imageInput.fill('nginx:alpine\nmalicious_service:\n  image: evil:latest');

    // Verify generated YAML output does NOT contain injected unindented service block or raw newlines in the image line
    const yamlOutput = await pre.textContent();
    expect(yamlOutput).not.toContain('\nmalicious_service:');
    expect(yamlOutput).toContain('image: nginx:alpinemalicious_service:  image: evil:latest');

    // Target the startup command field
    const commandInput = page.locator('input[placeholder="e.g. npm start"]').first();
    await commandInput.fill('npm start\n  entrypoint: /bin/sh');

    const updatedYaml = await pre.textContent();
    expect(updatedYaml).not.toContain('\n  entrypoint: /bin/sh');
    expect(updatedYaml).toContain('command: npm start  entrypoint: /bin/sh');
  });
});
