import { test, expect } from '@playwright/test';

test.describe('JSON to Mermaid Diagram Generator UX & E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-mermaid');
  });

  test('should load the page and parse default JSON input into class diagram syntax', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('JSON to Mermaid Diagram');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#mermaid-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    await expect(outputArea).toContainText('classDiagram');
    await expect(outputArea).toContainText('class Root {');
    await expect(outputArea).toContainText('+object user');
  });

  test('should switch diagram modes: Class, Mindmap, Flowchart', async ({ page }) => {
    const outputArea = page.locator('#mermaid-output');

    // Mindmap mode
    const mindmapBtn = page.getByRole('button', { name: 'Mindmap', exact: true });
    await mindmapBtn.click();
    await expect(mindmapBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toContainText('mindmap');
    await expect(outputArea).toContainText('root((JSON))');

    // Flowchart mode
    const flowchartBtn = page.getByRole('button', { name: 'Flowchart', exact: true });
    await flowchartBtn.click();
    await expect(flowchartBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toContainText('graph TD');

    // Toggle Left-Right direction
    const lrBtn = page.getByRole('button', { name: 'Left-Right', exact: true });
    await lrBtn.click();
    await expect(lrBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toContainText('graph LR');
  });

  test('should load presets and verify output', async ({ page }) => {
    const outputArea = page.locator('#mermaid-output');

    // Load User Profile preset
    const userPresetBtn = page.getByRole('button', { name: /User Profile/i });
    await userPresetBtn.click();

    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
    await expect(userPresetBtn).toHaveAttribute('aria-pressed', 'true');

    await expect(outputArea).toContainText('class Profile {');
    await expect(outputArea).toContainText('+string fullName');

    // Load E-Commerce Order preset
    const orderPresetBtn = page.getByRole('button', { name: /E-Commerce Order/i });
    await orderPresetBtn.click();

    await expect(orderPresetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toContainText('class Order {');
  });

  test('should clear input and restore focus', async ({ page }) => {
    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#mermaid-output');

    const clearBtn = page.getByRole('button', { name: /Clear/i }).first();
    await clearBtn.click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('should test keyboard shortcuts: Escape to clear and "c" to copy', async ({ page }) => {
    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#mermaid-output');

    await inputArea.fill('{"test": true}');
    await expect(outputArea).toContainText('classDiagram');

    await inputArea.blur();

    // Escape shortcut clears inputs
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Fill again & blur
    await inputArea.fill('{"status": "ok"}');
    await inputArea.blur();

    // "c" shortcut copies output
    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  });

  test('should load in French route and verify localized strings', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-mermaid');

    await expect(page.locator('h1')).toContainText('JSON en Diagramme Mermaid');
    await expect(page.getByRole('button', { name: /Profil Utilisateur/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Diagramme de Classe/i })).toBeVisible();
  });
});
