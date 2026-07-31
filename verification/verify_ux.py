from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the main application in French
    page.goto("http://localhost:5173/fr")
    page.wait_for_timeout(1000)

    # Type into the search input to filter tools
    page.locator('input[id="tool-search"]').fill('calculateur')
    page.wait_for_timeout(1000)

    # Scroll down the page to trigger the back-to-top button
    page.evaluate("window.scrollTo(0, 800)")
    page.wait_for_timeout(1000)

    # Toggle the language to English using text content "EN"
    page.locator('button:has-text("EN")').click()
    page.wait_for_timeout(1000)

    # Take a screenshot representing the visual state
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
