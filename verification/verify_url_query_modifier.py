import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/url-query-modifier")
    page.wait_for_timeout(1000)

    # Modify the first parameter value
    first_val = page.locator('[aria-label="Param value 1"]')
    first_val.fill("playwright testing rocks")
    page.wait_for_timeout(1000)

    # Click Add button to add a new parameter
    add_btn = page.get_by_role("button", name="Add", exact=True)
    add_btn.click()
    page.wait_for_timeout(1000)

    # Fill in the newly added parameter
    page.locator('[aria-label^="Param key"]').last.fill("utm_medium")
    page.wait_for_timeout(500)
    page.locator('[aria-label^="Param value"]').last.fill("e2e_video_proof")
    page.wait_for_timeout(1000)

    # Take screenshot at key moment
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/url_query_modifier_verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
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
