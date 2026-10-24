import { test, expect } from '@playwright/test';

test.describe('GraphQL to OpenAPI, SQLAlchemy, and Percentage Calculator Tools', () => {
  test('GraphQL to OpenAPI converts SDL schema correctly and supports preset switching', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-openapi');
    await expect(page.locator('h1')).toContainText('GraphQL to OpenAPI');

    // Check that preset is selected
    const ecommerceBtn = page.locator('button[aria-pressed="true"]');
    await expect(ecommerceBtn).toBeVisible();

    // Verify OpenAPI output textarea contains openapi: "3.0.3"
    const outputArea = page.locator('#openapi-output');
    await expect(outputArea).toHaveValue(/openapi: "3\.0\.3"/);
    await expect(outputArea).toHaveValue(/Product:/);

    // Switch preset to User Management & Auth
    const userAuthPreset = page.getByRole('button', { name: /User Management & Auth/i });
    await userAuthPreset.click();
    await expect(outputArea).toHaveValue(/User:/);

    // Change format to JSON
    const formatSelect = page.locator('#openapi-format');
    await formatSelect.selectOption('json');
    await expect(outputArea).toHaveValue(/"openapi": "3\.0\.3"/);

    // Test clear button
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();
    await clearBtn.click();
    const inputArea = page.locator('#graphql-openapi-input');
    await expect(inputArea).toHaveValue('');
  });

  test('GraphQL to SQLAlchemy converts SDL schema into Python ORM models correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-sqlalchemy');
    await expect(page.locator('h1')).toContainText('GraphQL to SQLAlchemy');

    // Verify output code
    const outputArea = page.locator('#sqlalchemy-output');
    await expect(outputArea).toHaveValue(/class Product\(Base\):/);
    await expect(outputArea).toHaveValue(/Mapped\[str\]/);
    await expect(outputArea).toHaveValue(/Mapped\[float\]/);

    // Switch version to 1.4
    const versionSelect = page.locator('#sqla-version');
    await versionSelect.selectOption('1.4');
    await expect(outputArea).toHaveValue(/Column\(Float/);

    // Switch preset to Blog CMS & Articles
    const blogPreset = page.getByRole('button', { name: /Blog CMS & Articles/i });
    await blogPreset.click();
    await expect(outputArea).toHaveValue(/class Article\(Base\):/);

    // Clear input
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();
    await clearBtn.click();
    const inputArea = page.locator('#graphql-sqlalchemy-input');
    await expect(inputArea).toHaveValue('');
  });

  test('Percentage Calculator calculation presets and micro-UX features work', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/percentage');
    await expect(page.locator('h1')).toContainText('Percentage');

    // Click VAT 20% preset
    const vatPreset = page.getByRole('button', { name: /Sales Tax \/ VAT \(20%\)/i });
    await vatPreset.click();

    // Verify values populated
    const percentInput = page.locator('#percent-val');
    const totalInput = page.locator('#total-val');
    await expect(percentInput).toHaveValue('20');
    await expect(totalInput).toHaveValue('150');

    // Check calculated result 20% of 150 = 30
    const resultText = page.locator('text=30').first();
    await expect(resultText).toBeVisible();

    // Click clear button
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();
    await clearBtn.click();
    await expect(percentInput).toHaveValue('');
    await expect(totalInput).toHaveValue('');
  });
});
