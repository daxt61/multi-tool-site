import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to the newly implemented tool
    page.goto("http://localhost:5173/fr/outil/json-to-sql-ddl")
    page.wait_for_timeout(1000)

    # Click the standard sample preset loader button
    page.get_by_role("button", name="Standard 9-5").click()
    page.wait_for_timeout(1000)

    # Select SQLite dialect
    page.locator("#sql-dialect").select_option("sqlite")
    page.wait_for_timeout(1000)

    # Change table name
    page.locator("#sql-tableName").fill("sqlite_users_test")
    page.wait_for_timeout(1000)

    # Click copy button specifically with class to avoid strict mode violations
    page.locator('button:has(svg.lucide-copy)').click()
    page.wait_for_timeout(1000)

    # Take screenshot at key moment
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
