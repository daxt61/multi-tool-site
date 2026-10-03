import { test, expect } from '@playwright/test';

test.describe('GraphQL to Python Converter Tool Suite', () => {
  test('GraphQLToPython converts GraphQL SDL to Pydantic V2, Dataclasses, and Strawberry GraphQL models', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-python');
    await expect(page.locator('h1')).toContainText('GraphQL to Python');

    const inputArea = page.locator('#graphql-python-input');
    const outputArea = page.locator('#python-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 1. Test Preset Load
    const presetBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Check Toast
    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Loaded GraphQL preset!');

    // Check Pydantic V2 Output
    let outputText = await outputArea.inputValue();
    expect(outputText).toContain('from pydantic import BaseModel, Field');
    expect(outputText).toContain('class Category(BaseModel):');
    expect(outputText).toContain('class Product(BaseModel):');
    expect(outputText).toContain('class OrderStatus(str, enum.Enum):');
    expect(outputText).toContain('is_active: bool');

    // 2. Change Target Format to Python Dataclass
    const formatSelect = page.locator('#output-format');
    await formatSelect.selectOption('dataclass');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('import dataclasses');
    expect(outputText).toContain('@dataclasses.dataclass');
    expect(outputText).toContain('class Product:');

    // 3. Change Target Format to Strawberry GraphQL Types
    await formatSelect.selectOption('strawberry');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('import strawberry');
    expect(outputText).toContain('@strawberry.type');
    expect(outputText).toContain('@strawberry.input');
    expect(outputText).toContain('class CreateProductInput:');
    expect(outputText).toContain('@strawberry.enum');
    expect(outputText).toContain('class OrderStatus(enum.Enum):');

    // 4. Test Clear with Esc shortcut
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // 5. Test Custom Input with keyword escaping & aliases
    await inputArea.fill(`type User {\n  id: ID!\n  type: String!\n  class: String\n}`);
    await formatSelect.selectOption('pydantic_v2');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('class User(BaseModel):');
    expect(outputText).toContain('id: str');
    expect(outputText).toContain('type: str');
    expect(outputText).toContain('class_: str | None = Field(None, alias="class")');

    // 6. Test Copy button
    const copyBtn = page.getByRole('button', { name: /Copy/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Python code copied to clipboard!');
  });
});
