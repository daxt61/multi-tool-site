import os
from playwright.sync_api import sync_playwright

os.makedirs('/home/jules/verification/videos', exist_ok=True)
os.makedirs('/home/jules/verification/screenshots', exist_ok=True)

def run_cuj(page):
    page.goto("http://localhost:5173/fr/outil/markdown-table-to-html")
    page.wait_for_timeout(1000)

    # Click employee directory preset
    page.get_by_role("button", name="Employee Directory").click()
    page.wait_for_timeout(500)

    # Change format mode to minified
    page.locator("#md-html-format").select_option("minified")
    page.wait_for_timeout(500)

    # Change align mode to inline-style
    page.locator("#md-html-align-mode").select_option("inline-style")
    page.wait_for_timeout(500)

    # Change format mode back to pretty
    page.locator("#md-html-format").select_option("pretty")
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
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
