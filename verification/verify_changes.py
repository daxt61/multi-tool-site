from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    print("Navigating to JSON to Query tool...")
    page.goto("http://localhost:5173/fr/outil/json-to-query")
    page.wait_for_timeout(1000)

    # Fill in some JSON
    print("Inputting JSON data...")
    json_input = page.locator("#json-input")
    json_input.fill('{\n  "id": 101,\n  "tags": ["web", "utility", "dev"]\n}')
    page.wait_for_timeout(1000)

    # Toggle options - change array format to repeat
    print("Changing array format option...")
    page.select_option("#array-format", "repeat")
    page.wait_for_timeout(1000)

    # Sort keys alphabetically by clicking the first checkbox
    print("Sorting keys alphabetically...")
    page.locator('input[type="checkbox"]').first.click()
    page.wait_for_timeout(1000)

    # Take screenshot of final state
    screenshot_path = "/home/jules/verification/screenshots/verification.png"
    print(f"Saving screenshot to {screenshot_path}...")
    page.screenshot(path=screenshot_path)
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            print("Closing browser context...")
            context.close()
            browser.close()
        print("Verification complete.")
