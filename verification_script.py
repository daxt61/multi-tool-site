from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:4173/en/outil/graphql-to-gorm")
    page.wait_for_timeout(1000)

    # Click E-Commerce Catalog preset
    page.get_by_role("button", name="E-Commerce Catalog").click()
    page.wait_for_timeout(1000)

    # Change dialect
    page.locator("#dialect").select_option("mysql")
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/graphql_to_gorm.png")

    # Navigate to VAT Calculator
    page.goto("http://localhost:4173/en/outil/vat-calculator")
    page.wait_for_timeout(1000)

    # Click Food preset
    page.get_by_role("button", name="Catering / Food").click()
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/vat_calculator.png")
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
