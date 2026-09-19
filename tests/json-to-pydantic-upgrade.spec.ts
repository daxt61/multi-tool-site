import { test, expect } from '@playwright/test';

test.describe('JSON to Pydantic Upgrade UX & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-pydantic');
  });

  test('should load presets correctly and update active aria-pressed state', async ({ page }) => {
    // Click User Profile preset
    await page.click('button:has-text("User Profile")');
    const inputVal = await page.inputValue('#json-input');
    expect(inputVal).toContain('"username": "alex99"');

    const pydanticOutput = await page.inputValue('#pydantic-output');
    expect(pydanticOutput).toContain('class Model(BaseModel):');
    expect(pydanticOutput).toContain('class Profile(BaseModel):');

    // Check active aria-pressed state
    const userPresetBtn = page.locator('button:has-text("User Profile")');
    await expect(userPresetBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should switch target format modes (V2, V1, Dataclasses)', async ({ page }) => {
    // Fill custom JSON
    await page.fill('#json-input', JSON.stringify({ user_id: 1, class: "A" }));

    // By default V2
    let output = await page.inputValue('#pydantic-output');
    expect(output).toContain('from pydantic import BaseModel, Field');
    expect(output).toContain('class_: str = Field(alias="class")');

    // Switch to V1
    await page.selectOption('#pydantic-version-select', 'v1');
    output = await page.inputValue('#pydantic-output');
    expect(output).toContain('class Config:');
    expect(output).toContain('allow_population_by_field_name = True');

    // Switch to Dataclasses
    await page.selectOption('#pydantic-version-select', 'dataclass');
    output = await page.inputValue('#pydantic-output');
    expect(output).toContain('@dataclass');
    expect(output).toContain('class_: str  # Original JSON key: class');
  });

  test('should escape Pydantic internal reserved fields like model_config in V2', async ({ page }) => {
    await page.click('button:has-text("API Config & Settings")');
    const output = await page.inputValue('#pydantic-output');

    // model_config reserved attribute should become model_config_
    expect(output).toContain('model_config_: str = Field(alias="model_config")');
    // Python keyword 'def' should become def_
    expect(output).toContain('def_: str = Field(alias="def")');
  });

  test('should clear inputs on Escape and restore focus to #json-input', async ({ page }) => {
    await page.click('button:has-text("User Profile")');
    await page.focus('body');
    await page.keyboard.press('Escape');

    const inputVal = await page.inputValue('#json-input');
    expect(inputVal).toBe('');

    // Verify focus restoration
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'json-input');
    expect(isFocused).toBe(true);
  });

  test('should copy output on key press C', async ({ page, context }) => {
    await page.click('button:has-text("User Profile")');
    await page.focus('body');

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.keyboard.press('c');

    // Verify toast is visible
    await expect(page.locator('text=Copied Pydantic models to clipboard!')).toBeVisible();
  });
});
