from playwright.sync_api import sync_playwright
import time

def run_cuj(page):
    # Navigate to the SemVer Analyzer tool path
    page.goto("http://localhost:5173/fr/outil/semver-analyzer")
    page.set_viewport_size({"width": 1280, "height": 800})
    page.wait_for_timeout(1000)

    # Enter a custom version
    page.locator("input#ver-input").fill("2.4.1-alpha.3+build.204")
    page.wait_for_timeout(800)

    # Click the Minor increment button
    page.locator('button:has-text("Minor (+0.1.0)")').click()
    page.wait_for_timeout(1000)

    # Click the Comparator tab
    page.locator('button:has-text("Comparateur de Versions")').click()
    page.wait_for_timeout(800)

    # Fill versions to compare
    page.locator("input#comp-a").fill("3.0.0-rc.1")
    page.locator("input#comp-b").fill("3.0.0")
    page.wait_for_timeout(1000)

    # Take screenshot at this moment
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
