from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/graphql-to-ruby")
    page.wait_for_selector("#graphql-ruby-input")
    page.wait_for_timeout(500)

    # Click E-Commerce preset
    page.get_by_role("button", name="E-Commerce Catalog").click()
    page.wait_for_timeout(500)

    # Change construct style to Sorbet
    page.select_option("#ruby-construct-style", "sorbet")
    page.wait_for_timeout(500)

    # Change casing to camelCase
    page.select_option("#ruby-property-casing", "camelCase")
    page.wait_for_timeout(500)

    # Take screenshot of GraphQL to Ruby
    page.screenshot(path="/home/jules/verification/screenshots/graphql_to_ruby.png")
    page.wait_for_timeout(1000)

    # Navigate to SQL to Ruby
    page.goto("http://localhost:5173/en/outil/sql-to-ruby")
    page.wait_for_selector("#sql-ruby-input")
    page.wait_for_timeout(500)

    # Click E-Commerce Catalog
    page.get_by_role("button", name="E-Commerce Catalog").click()
    page.wait_for_timeout(500)

    # Change construct style to Dry-Types
    page.select_option("#sql-ruby-construct-style", "dry_struct")
    page.wait_for_timeout(500)

    # Take screenshot of SQL to Ruby
    page.screenshot(path="/home/jules/verification/screenshots/sql_to_ruby.png")
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
