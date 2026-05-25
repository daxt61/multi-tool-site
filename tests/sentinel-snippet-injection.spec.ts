import { test, expect } from '@playwright/test';

test.describe('Sentinel: Snippet Injection Mitigation', () => {
  test('JSONToRust escapes malicious keys in #[serde(rename)]', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-rust');

    const maliciousJson = JSON.stringify({
      "foo\")]\npub evil: String,\n#[serde(rename=\"bar": 1
    });

    await page.fill('#json-input', maliciousJson);

    // Wait for conversion
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#rust-output');

    // Check that the key is properly escaped
    expect(output).toContain('rename = "foo\\")]\\npub evil: String,\\n#[serde(rename=\\"bar"');

    // Verify that NO unescaped malicious code exists
    expect(output).not.toContain('\npub evil: String,');
  });

  test('JSONToJava escapes malicious keys in @JsonProperty', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-java');

    // Enable Jackson annotations
    await page.click('button:has-text("Jackson")');

    const maliciousJson = JSON.stringify({
      "foo\");\n    public String evil;\n    @JsonProperty(\"bar": 1
    });

    await page.fill('#json-input', maliciousJson);
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#java-output');

    expect(output).toContain('@JsonProperty("foo\\");\\n    public String evil;\\n    @JsonProperty(\\"bar")');
    expect(output).not.toContain('\n    public String evil;');
  });

  test('JSONToTS escapes malicious keys in interface', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-ts');

    const maliciousJson = JSON.stringify({
      "foo\": any;\n  evil: any;\n  \"bar": 1
    });

    await page.fill('#json-input', maliciousJson);
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#ts-output');

    // In TS, we expect the key to be quoted and escaped.
    // Note: The key had a newline in it. In the output, it will appear as an actual newline
    // inside the quoted string if we didn't escape \n to \\n.
    // In JSONToTS, I didn't escape \n, only " and \.

    expect(output).toContain('"foo\\": any;');
    expect(output).toContain('evil: any;');
    expect(output).toContain('\\"bar": number;');
  });
});
