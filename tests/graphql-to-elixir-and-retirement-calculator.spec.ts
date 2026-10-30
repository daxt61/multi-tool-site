import { test, expect } from "@playwright/test";

test.describe("Retirement Calculator & GraphQL to Elixir Ecto Converter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/fr");
  });

  test("RetirementCalculator - presets, inputs, calculations, copy summary, clear & hotkeys", async ({ page }) => {
    await page.goto("http://localhost:5173/fr/outil/retirement-calculator");
    await expect(page.locator("h1")).toContainText("Retraite");

    // Check default calculation for 1980, month 1, 0 quarters (64 ans)
    await expect(page.getByText("64 ans").first()).toBeVisible();

    // Click 'Senior Career 1965' preset
    const seniorPreset = page.getByRole("button", { name: /Carrière avancée/i });
    await seniorPreset.click();
    await expect(seniorPreset).toHaveAttribute("aria-pressed", "true");

    // Verify updated inputs and calculation
    const yearInput = page.locator("#birth-year");
    await expect(yearInput).toHaveValue("1965");
    const monthSelect = page.locator("#birth-month");
    await expect(monthSelect).toHaveValue("3");
    const quartersInput = page.locator("#quarters");
    await expect(quartersInput).toHaveValue("140");

    // Check legal age calculation for 1965 (63 ans)
    await expect(page.getByText(/63 ans/).first()).toBeVisible();

    // Manual input edit clears active preset selection
    await yearInput.fill("1990");
    await expect(seniorPreset).toHaveAttribute("aria-pressed", "false");

    // Reset button
    const resetButton = page.getByRole("button", { name: /Réinitialiser/i });
    await resetButton.click();

    await expect(yearInput).toHaveValue("1980");
    await expect(monthSelect).toHaveValue("1");
    await expect(quartersInput).toHaveValue("0");

    // Test hotkeys inside container (Esc resets, C copies)
    await yearInput.focus();
    await yearInput.fill("1975");
    await page.keyboard.press("Escape");
    await expect(yearInput).toHaveValue("1980");

    // Focus preset button inside container and press C to copy summary
    await seniorPreset.focus();
    await page.keyboard.press("c");
    // Verify toast notification
    await expect(page.getByText(/Synthèse de retraite copiée/i)).toBeVisible();
  });

  test("GraphQLToElixir - conversion, presets, casing, options, copy, download, DoS limit & hotkeys", async ({ page }) => {
    await page.goto("http://localhost:5173/fr/outil/graphql-to-elixir");
    await expect(page.locator("h1")).toContainText("GraphQL en Elixir Ecto");

    const inputArea = page.locator("#graphql-elixir-input");
    const outputArea = page.locator("#elixir-output");

    // Check initial output with default preset
    await expect(outputArea).toContainText("defmodule MyApp.Product do");
    await expect(outputArea).toContainText("use Ecto.Schema");
    await expect(outputArea).toContainText("schema \"products\" do");
    await expect(outputArea).toContainText("@primary_key {:id, :binary_id, autogenerate: true}");
    await expect(outputArea).toContainText("timestamps()");
    await expect(outputArea).toContainText("def changeset(struct_or_changeset, attrs) do");

    // Test preset switching
    const userAuthPreset = page.getByRole("button", { name: /Gestion Utilisateurs/i });
    await userAuthPreset.click();
    await expect(userAuthPreset).toHaveAttribute("aria-pressed", "true");
    await expect(outputArea).toContainText("defmodule MyApp.User do");
    await expect(outputArea).toContainText("defmodule MyApp.UserRole do");

    // Test module prefix change
    const prefixInput = page.locator("#module-prefix");
    await prefixInput.fill("StoreCore");
    await expect(outputArea).toContainText("defmodule StoreCore.User do");

    // Test field casing change
    const casingSelect = page.locator("#field-casing");
    await casingSelect.selectOption("camelCase");
    await expect(outputArea).toContainText("field :avatarUrl, :string");

    // Manual input edit clears active preset
    await inputArea.focus();
    await inputArea.fill("type Simple {\n  id: ID!\n  title: String!\n}");
    await expect(userAuthPreset).toHaveAttribute("aria-pressed", "false");
    await expect(outputArea).toContainText("defmodule StoreCore.Simple do");

    // Test DoS length limit (> 100,000 chars)
    const hugeInput = "a".repeat(100001);
    await inputArea.fill(hugeInput);
    await expect(outputArea).toContainText("Erreur: La taille du schéma dépasse la limite autorisée");

    // Clear and test keyboard shortcuts
    const clearButton = page.getByRole("button", { name: /Effacer/i }).first();
    await clearButton.click();
    await expect(inputArea).toHaveValue("");

    // Load social feed preset and test Esc hotkey
    const socialPreset = page.getByRole("button", { name: /Flux Social/i });
    await socialPreset.click();
    await expect(inputArea).not.toHaveValue("");

    await inputArea.focus();
    await page.keyboard.press("Escape");
    await expect(inputArea).toHaveValue("");

    // Focus social preset button inside container and press C to copy code
    await socialPreset.click();
    await socialPreset.focus();
    await page.keyboard.press("c");
    await expect(page.getByText(/Code Elixir Ecto copié/i)).toBeVisible();
  });
});
