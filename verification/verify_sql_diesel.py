from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/fr/outil/sql-to-diesel")
    page.wait_for_timeout(1000)

    # Click Catalogue E-Commerce preset
    page.click('button:has-text("Catalogue E-Commerce")')
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification_sql_diesel.png")
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
