from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate directly to the Cartesian Product Generator tool in English
    page.goto("http://localhost:5173/en/outil/cartesian-product")
    page.wait_for_timeout(1000)

    # Input elements
    list1 = page.locator("#cartesian-list-0")
    list2 = page.locator("#cartesian-list-1")
    list3 = page.locator("#cartesian-list-2")

    # Clear and fill them with some test items
    list1.fill("apple\nbanana")
    page.wait_for_timeout(500)

    list2.fill("sweet\nsour")
    page.wait_for_timeout(500)

    list3.fill("red\nyellow")
    page.wait_for_timeout(500)

    # Click the add list button to make 4 lists
    page.locator('button:has-text("Add List")').click()
    page.wait_for_timeout(500)

    # Fill the 4th list
    list4 = page.locator("#cartesian-list-3")
    list4.fill("juice\npie")
    page.wait_for_timeout(1000)

    # Select case mode Capitalize
    case_select = page.locator("#case-mode-select")
    case_select.select_option("capitalize")
    page.wait_for_timeout(1000)

    # Take screenshot at the key moment of full display
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        os.makedirs("/home/jules/verification/videos", exist_ok=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
