import { test, expect } from '@playwright/test';

test.describe('GraphQL to Rust & JSON to Protobuf E2E Tests', () => {
  test('GraphQLToRust converts SDL to Rust structs correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-rust');

    const inputArea = page.locator('#graphql-rust-input');
    const outputArea = page.locator('#rust-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('pub struct Product');
    expect(outputText).toContain('pub enum Category');
    expect(outputText).toContain('#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]');

    // Test Casing change
    await page.selectOption('#casing-select', 'camelCase');
    const camelOutput = await outputArea.inputValue();
    expect(camelOutput).toContain('pub inStock: bool');

    // Test ID Scalar option
    await page.selectOption('#id-type-select', 'uuid::Uuid');
    const uuidOutput = await outputArea.inputValue();
    expect(uuidOutput).toContain('use uuid::Uuid;');
    expect(uuidOutput).toContain('pub id: uuid::Uuid');
  });

  test('GraphQLToRust applies presets correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-rust');

    const outputArea = page.locator('#rust-output');

    // Click User Management preset
    await page.click('button:has-text("User Management & Auth")');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('pub struct User');
    expect(outputText).toContain('pub enum UserRole');

    // Click Social Feed preset
    await page.click('button:has-text("Social Feed & Comments")');
    const feedOutput = await outputArea.inputValue();
    expect(feedOutput).toContain('pub struct Post');
    expect(feedOutput).toContain('pub enum FeedItem');
    expect(feedOutput).toContain('#[serde(untagged)]');
  });

  test('JSONToProtobuf converts JSON to proto3 and proto2 with options', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-protobuf');

    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#proto-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    let outputText = await outputArea.inputValue();
    expect(outputText).toContain('syntax = "proto3";');
    expect(outputText).toContain('package model;');
    expect(outputText).toContain('message RootObject');

    // Test gRPC service generation toggle
    const grpcCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await grpcCheckbox.check();
    outputText = await outputArea.inputValue();
    expect(outputText).toContain('service ModelService');
    expect(outputText).toContain('rpc GetRootObject');

    // Test explicit optional modifier
    const optionalCheckbox = page.locator('input[type="checkbox"]').first();
    await optionalCheckbox.check();
    outputText = await outputArea.inputValue();
    expect(outputText).toContain('optional int32 id = 1;');

    // Test preset selection
    await page.click('button:has-text("E-Commerce Order")');
    outputText = await outputArea.inputValue();
    expect(outputText).toContain('message RootObject');
    expect(outputText).toContain('message Items');
  });
});
