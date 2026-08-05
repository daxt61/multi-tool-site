import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to the newly implemented text-indentation-converter tool
    page.goto("http://localhost:5173/fr/outil/text-indentation-converter")
    page.wait_for_timeout(1000)

    # 1. Fill input text area with a tab-indented Javascript class
    input_area = page.locator("textarea#indent-input")
    input_area.fill("\tclass IndentDemo {\n\t\tconstructor() {\n\t\t\tthis.indent = 'tab';\n\t\t}\n\t}")
    page.wait_for_timeout(1000)

    # 2. Wait for rendering and check auto-detected text badge
    # The output area should automatically convert tabs to spaces
    output_area = page.locator("textarea#indent-output")
    page.wait_for_timeout(1000)

    # 3. Switch Operational Mode to 'Espaces en Tabulations' (Spaces to Tabs)
    spaces_to_tabs_btn = page.locator('button:has-text("Espaces en Tabulations")')
    spaces_to_tabs_btn.click()
    page.wait_for_timeout(1000)

    # Fill input with spaces-indented text
    input_area.fill("  const sample = 1;\n    console.log(sample);")
    page.wait_for_timeout(1000)

    # 4. Switch operational mode to Increase Indentation
    increase_btn = page.locator('button:has-text("Augmenter l\'Indentation")')
    increase_btn.click()
    page.wait_for_timeout(1000)

    # 5. Take screenshot of the final state
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/indentation_converter.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
