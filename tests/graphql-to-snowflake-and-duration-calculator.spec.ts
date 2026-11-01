import { test, expect } from "@playwright/test";

test.describe("Duration Calculator & GraphQL to Snowflake Converter Suite", () => {
  test("DurationCalculator - presets, mixed operations, keyboard shortcuts, reset, and toasts", async ({ page }) => {
    await page.goto("http://localhost:5173/fr/outil/duration-calculator");
    await expect(page.locator("h1")).toContainText("Durées");

    // Check initial state
    await expect(page.locator(".font-mono.tracking-tighter").first()).toContainText("00:00:00");

    // Load 'Workday & Lunch Break' preset
    const workdayPreset = page.getByRole("button", { name: /Workday & Lunch Break/i });
    await workdayPreset.click();
    await expect(workdayPreset).toHaveAttribute("aria-pressed", "true");

    // 8h30 - 45m = 7h45 (07:45:00)
    await expect(page.locator(".font-mono.tracking-tighter").first()).toContainText("07:45:00");
    await expect(page.getByText("465.00m")).toBeVisible();
    await expect(page.getByText("7.75h")).toBeVisible();

    // Load 'Pomodoro Study Blocks' preset (4 x 25m = 1h40 = 01:40:00)
    const pomodoroPreset = page.getByRole("button", { name: /Pomodoro Study Blocks/i });
    await pomodoroPreset.click();
    await expect(pomodoroPreset).toHaveAttribute("aria-pressed", "true");
    await expect(workdayPreset).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".font-mono.tracking-tighter").first()).toContainText("01:40:00");

    // Edit input manually: active preset should clear
    const firstHours = page.locator("#duration-hours-1");
    await firstHours.fill("2");
    await expect(pomodoroPreset).toHaveAttribute("aria-pressed", "false");

    // Test Esc reset hotkey inside container
    await firstHours.focus();
    await page.keyboard.press("Escape");
    await expect(page.locator(".font-mono.tracking-tighter").first()).toContainText("00:00:00");

    // Test C hotkey to copy inside container
    await workdayPreset.click();
    await workdayPreset.focus();
    await page.keyboard.press("c");
    await expect(page.getByText(/copié dans le presse-papier|copied to clipboard/i)).toBeVisible();

    // Test Reset button
    const resetBtn = page.getByRole("button", { name: /Réinitialiser/i });
    await resetBtn.click();
    await expect(page.locator(".font-mono.tracking-tighter").first()).toContainText("00:00:00");
  });

  test("GraphQLToSnowflake - conversion, table types, casing, cluster keys, presets, DoS limit, and hotkeys", async ({ page }) => {
    await page.goto("http://localhost:5173/fr/outil/graphql-to-snowflake");
    await expect(page.locator("h1")).toContainText("GraphQL en Snowflake");

    const inputArea = page.locator("#graphql-snowflake-input");
    const outputArea = page.locator("#snowflake-output");

    // Check default generated output (ecommerce preset)
    await expect(outputArea).toContainText("CREATE OR REPLACE TABLE USER");
    await expect(outputArea).toContainText("CREATE OR REPLACE TABLE ORDER");
    await expect(outputArea).toContainText("EMAIL VARCHAR(16777216) NOT NULL");
    await expect(outputArea).toContainText("TAGS ARRAY");
    await expect(outputArea).toContainText("METADATA VARIANT");
    await expect(outputArea).toContainText("PRIMARY KEY (ID)");
    await expect(outputArea).toContainText("CHECK (ROLE IN ('ADMIN', 'EDITOR', 'VIEWER', 'GUEST'))");

    // Test Table Type switch to TRANSIENT
    const tableTypeSelect = page.locator("#graphql-snowflake-table-type");
    await tableTypeSelect.selectOption("TRANSIENT");
    await expect(outputArea).toContainText("CREATE OR REPLACE TRANSIENT TABLE USER");

    // Test Table Type switch to HYBRID
    await tableTypeSelect.selectOption("HYBRID");
    await expect(outputArea).toContainText("CREATE OR REPLACE HYBRID TABLE USER");

    // Test casing switch to snake_case (Snowflake escapes lowercase identifiers in double quotes)
    const casingSelect = page.locator("#graphql-snowflake-casing");
    await casingSelect.selectOption("snake_case");
    await expect(outputArea).toContainText('CREATE OR REPLACE HYBRID TABLE "user"');
    await expect(outputArea).toContainText('"email" VARCHAR(16777216) NOT NULL');

    // Test Cluster By
    const clusterInput = page.locator("#graphql-snowflake-clusterby");
    await clusterInput.fill("created_at, role");
    await expect(outputArea).toContainText('CLUSTER BY ("created_at", "role")');

    // Test Preset switch to Sensor & IoT Telemetry
    const telemetryPreset = page.getByRole("button", { name: /Sensor & IoT Telemetry/i });
    await telemetryPreset.click();
    await expect(telemetryPreset).toHaveAttribute("aria-pressed", "true");
    await expect(outputArea).toContainText("device_metric");
    await expect(outputArea).toContainText("device_alert");

    // Test DoS character limit
    const hugeInput = "type Test {\n  id: ID!\n}\n" + "x".repeat(100001);
    await inputArea.fill(hugeInput);
    await expect(page.getByText(/dépasse la taille maximale|exceeds max allowable/i)).toBeVisible();

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole("button", { name: /Effacer/i }).first();
    await clearBtn.click();
    await expect(inputArea).toHaveValue("");
    await expect(inputArea).toBeFocused();

    // Test Esc hotkey to clear input
    await telemetryPreset.click();
    await expect(inputArea).not.toHaveValue("");
    await inputArea.focus();
    await page.keyboard.press("Escape");
    await expect(inputArea).toHaveValue("");

    // Test C hotkey to copy output
    await telemetryPreset.click();
    await telemetryPreset.focus();
    await page.keyboard.press("c");
    await expect(page.getByText(/copié dans le presse-papier|copied to clipboard/i)).toBeVisible();
  });
});
