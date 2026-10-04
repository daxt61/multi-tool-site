import { test, expect } from '@playwright/test';

test.describe('GraphQL to Go Struct Converter Tool Suite', () => {
  test('GraphQLToGo converts GraphQL SDL to Go structs with custom tags and pointers', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-go');
    await expect(page.locator('h1')).toContainText('GraphQL to Go');

    const inputArea = page.locator('#graphql-go-input');
    const outputArea = page.locator('#go-output');

    // Check default placeholder / initial state
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Click E-Commerce Catalog preset button
    await page.click('button:has-text("E-Commerce Catalog")');

    // Verify converted Go code
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('package main');
    expect(outputText).toContain('type Product struct {');
    expect(outputText).toContain('Id string `json:"id"`');
    expect(outputText).toContain('Title string `json:"title"`');
    expect(outputText).toContain('Description *string `json:"description,omitempty"`');
    expect(outputText).toContain('Price float64 `json:"price"`');
    expect(outputText).toContain('IsActive bool `json:"is_active"`');
    expect(outputText).toContain('Tags []string `json:"tags"`');
    expect(outputText).toContain('OrderStatus string');
    expect(outputText).toContain('OrderStatusPENDING OrderStatus = "PENDING"');

    // Change package name
    const pkgInput = page.locator('#package-name');
    await pkgInput.fill('models');
    expect(await outputArea.inputValue()).toContain('package models');

    // Enable YAML and GORM tags
    const yamlCheckbox = page.locator('label').filter({ hasText: 'yaml' }).locator('input');
    await yamlCheckbox.check();

    const gormCheckbox = page.locator('label').filter({ hasText: 'gorm' }).locator('input');
    await gormCheckbox.check();

    await expect(outputArea).toHaveValue(/gorm:"column:title;not null"/);
    await expect(outputArea).toHaveValue(/yaml:"title"/);

    // Test Clear
    await page.keyboard.press('Escape');
    expect(await inputArea.inputValue()).toBe('');
    expect(await outputArea.inputValue()).toBe('');
  });
});
