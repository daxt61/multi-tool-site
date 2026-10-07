import { test, expect } from '@playwright/test';

test.describe('GraphQL SDL to Java Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/fr/outil/graphql-to-java');
  });

  test('should render converter UI with options and title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('GraphQL en Java');
    await expect(page.locator('label[for="graphql-java-input"]')).toBeVisible();
    await expect(page.locator('label[for="java-output"]')).toBeVisible();
    await expect(page.locator('#package-name')).toHaveValue('com.example.graphql.model');
    await expect(page.locator('#construct-kind')).toHaveValue('class');
    await expect(page.locator('#annotation-kind')).toHaveValue('jackson');
  });

  test('should load preset and convert GraphQL SDL to Java Classes with Jackson and Lombok', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');

    const inputArea = page.locator('#graphql-java-input');
    await expect(inputArea).toContainText('type Product');

    const outputArea = page.locator('#java-output');
    await expect(outputArea).toContainText('package com.example.graphql.model;');
    await expect(outputArea).toContainText('import com.fasterxml.jackson.annotation.JsonProperty;');
    await expect(outputArea).toContainText('import lombok.Data;');
    await expect(outputArea).toContainText('@Data');
    await expect(outputArea).toContainText('public class Product');
    await expect(outputArea).toContainText('public enum OrderStatus');
  });

  test('should support converting GraphQL SDL to Java 17+ Records', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await page.selectOption('#construct-kind', 'record');

    const outputArea = page.locator('#java-output');
    await expect(outputArea).toContainText('public record Product(');
    await expect(outputArea).toContainText('@JsonProperty("title") String title');
    await expect(outputArea).not.toContainText('import lombok.Data;');
  });

  test('should support Gson annotations', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await page.selectOption('#annotation-kind', 'gson');

    const outputArea = page.locator('#java-output');
    await expect(outputArea).toContainText('import com.google.gson.annotations.SerializedName;');
    await expect(outputArea).toContainText('@SerializedName("title")');
  });

  test('should copy output and trigger success toast', async ({ page, context }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Target the copy button specifically in the output section header
    const outputSection = page.locator('label[for="java-output"]').locator('..').locator('..');
    await outputSection.locator('button:has-text("Copier")').click();

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Modèles Java copiés');
  });

  test('should clear inputs and restore focus on clear button click', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await page.click('button:has-text("Effacer")');

    await expect(page.locator('#graphql-java-input')).toHaveValue('');
    await expect(page.locator('#java-output')).toHaveValue('');
    await expect(page.locator('#graphql-java-input')).toBeFocused();
  });

  test('should handle keyboard shortcuts (Esc and C)', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    await expect(page.locator('#java-output')).not.toHaveValue('');

    // Click outside textareas to blur editable focus
    await page.click('h1');

    // Press 'c' to copy
    await page.keyboard.press('c');
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();

    // Press 'Escape' to clear
    await page.keyboard.press('Escape');
    await expect(page.locator('#graphql-java-input')).toHaveValue('');
    await expect(page.locator('#graphql-java-input')).toBeFocused();
  });

  test('should show error alert banner when input exceeds max length', async ({ page }) => {
    const hugeInput = 'type Test { id: ID! }\n' + 'a'.repeat(100005);
    await page.fill('#graphql-java-input', hugeInput);

    const errorBanner = page.locator('div.text-rose-600, div.text-rose-400');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('L\'entrée est trop longue');
  });
});
