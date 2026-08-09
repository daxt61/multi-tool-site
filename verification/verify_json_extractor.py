from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the json-data-extractor tool
    page.goto("http://localhost:5173/en/outil/json-data-extractor")
    page.wait_for_timeout(1000)

    # Click the "App Configuration" preset button
    page.get_by_role("button", name="App Configuration").click()
    page.wait_for_timeout(1000)

    # Change Extraction Mode to Flat Keys
    page.get_by_role("button", name="Flat Keys").click()
    page.wait_for_timeout(1000)

    # Add advanced filter substring
    filter_input = page.locator("#filter-query-input")
    filter_input.fill("theme")
    page.wait_for_timeout(1000)

    # Screenshot the final state
    page.screenshot(path="/home/jules/verification/screenshots/json_extractor_verify.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
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
