from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/fire-calculator")
    page.wait_for_selector("#currentSavings")
    page.wait_for_timeout(500)

    # Click Lean FIRE preset
    page.get_by_role("button", name="Lean FIRE").click()
    page.wait_for_timeout(500)

    # Click Fat FIRE preset
    page.get_by_role("button", name="Fat FIRE").click()
    page.wait_for_timeout(500)

    # Click Copy Summary button
    page.get_by_role("button", name="Copy Summary").click()
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/fire_calculator_ux.png")
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
