from playwright.sync_api import Page, expect, sync_playwright

def verify_tools(page: Page):
    # Verify CSV Column Extractor
    page.goto("http://localhost:5173/en/outil/csv-extractor")
    page.wait_for_selector('[data-testid="csv-extractor-container"]')
    page.get_by_text("E-Commerce Orders").click()
    page.screenshot(path="/home/jules/verification/csv_extractor.png")

    # Verify String Manipulator
    page.goto("http://localhost:5173/en/outil/string-manipulator")
    page.wait_for_selector('[data-testid="string-manipulator-container"]')
    page.get_by_text("Fixed-Width Columns").click()
    page.screenshot(path="/home/jules/verification/string_manipulator.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_tools(page)
        finally:
            browser.close()
