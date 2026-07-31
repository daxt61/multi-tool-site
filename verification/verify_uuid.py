import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to UUID Generator tool page in French
    page.goto("http://localhost:5173/fr/outil/uuid-generator")
    page.wait_for_timeout(1000)

    # Change count to 3
    count_input = page.locator("#uuid-count")
    count_input.fill("3")
    page.wait_for_timeout(500)

    # Change version to UUID v7
    version_select = page.locator("#uuid-version")
    version_select.select_option("v7")
    page.wait_for_timeout(500)

    # Toggle "Majuscules"
    page.click('button:has-text("Majuscules")')
    page.wait_for_timeout(500)

    # Toggle "Accolades"
    page.click('button:has-text("Accolades")')
    page.wait_for_timeout(500)

    # Toggle "Inclure les Tirets" (disabling hyphens)
    page.click('button:has-text("Inclure les Tirets")')
    page.wait_for_timeout(500)

    # Fill prefix
    prefix_input = page.locator("#uuid-prefix")
    prefix_input.fill("PFX_")
    page.wait_for_timeout(500)

    # Fill suffix
    suffix_input = page.locator("#uuid-suffix")
    suffix_input.fill("_SFX")
    page.wait_for_timeout(500)

    # Click on Generate button
    page.click('button:has-text("Générer")')
    page.wait_for_timeout(1000)

    # Take screenshot of the result
    screenshot_path = "/home/jules/verification/screenshots/uuid_premium_verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    # Hold state for the video recording
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

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
