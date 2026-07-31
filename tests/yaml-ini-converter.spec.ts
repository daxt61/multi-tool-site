import { test, expect } from '@playwright/test';

test('YAML <> INI Converter functionality and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/yaml-ini`);

  const yamlInput = page.locator('#yaml-input');
  const iniInput = page.locator('#ini-input');

  // Verify elements exist
  await expect(yamlInput).toBeVisible();
  await expect(iniInput).toBeVisible();

  // Test Case 1: Preloaded value works correctly
  // The default value should be:
  // title: "Configuration Example"
  // ...
  // Let's verify that the output contains the corresponding flattened INI structure
  await expect(iniInput).toContainText('title="Configuration Example"');
  await expect(iniInput).toContainText('[database]');
  await expect(iniInput).toContainText('connection.host=localhost');

  // Test Case 2: Custom YAML to INI conversion
  await yamlInput.fill('app:\n  port: 8080\n  debug: false\n  allowed_hosts:\n    - "localhost"\n    - "example.com"');
  // It should automatically trigger YAML -> INI
  await expect(iniInput).toContainText('[app]');
  await expect(iniInput).toContainText('port=8080');
  await expect(iniInput).toContainText('debug=false');
  await expect(iniInput).toContainText('allowed_hosts=localhost, example.com');

  // Test Case 3: Custom INI to YAML conversion
  await iniInput.fill('[server]\nhost = "127.0.0.1"\nports = 80, 443\n\n[server.security]\nssl = true');
  // It should automatically trigger INI -> YAML
  await expect(yamlInput).toContainText('server:');
  await expect(yamlInput).toContainText('host: 127.0.0.1');
  await expect(yamlInput).toContainText('ports: 80, 443');
  await expect(yamlInput).toContainText('security:');
  await expect(yamlInput).toContainText('ssl: true');

  // Test Case 4: Prototype Pollution defense
  // Using dangerous keys should sanitize them properly
  await yamlInput.fill('__proto__:\n  polluted: "yes"\nconstructor:\n  name: "fake"\nprototype:\n  value: 42');
  await expect(iniInput).toContainText('[___proto__]');
  await expect(iniInput).toContainText('polluted=yes');
  await expect(iniInput).toContainText('[_constructor]');
  await expect(iniInput).toContainText('[_prototype]');

  // Test Case 5: Keyboard Shortcuts - Escape to clear and restore focus
  await yamlInput.focus();
  await page.keyboard.press('Escape');
  await expect(yamlInput).toHaveValue('');
  await expect(iniInput).toHaveValue('');
  await expect(yamlInput).toBeFocused();

  // Test Case 6: Copy keyboard shortcut when unfocused
  await yamlInput.fill('test: 1');
  await page.keyboard.press('Tab'); // Move focus away
  await page.keyboard.press('c');

  // Verify copy actions work without errors
  const copyBtn = page.locator('button:has(svg.lucide-copy)').first();
  await expect(copyBtn).toBeVisible();
});
