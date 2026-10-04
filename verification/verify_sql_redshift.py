from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/sql-to-redshift")
    page.wait_for_timeout(1000)

    # Click a quick preset
    page.locator('button:has-text("User Sessions & Event Analytics")').click()
    page.wait_for_timeout(1000)

    # Change DistStyle
    page.locator('#redshift-diststyle-select').select_option('KEY')
    page.wait_for_timeout(1000)

    # Change SortKey
    page.locator('#redshift-sortkey-select').select_option('COMPOUND')
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification_sql_redshift.png")
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
