from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to Sleep Calculator first
    page.goto("http://localhost:5173/fr/outil/sleep-calculator")
    page.wait_for_timeout(1000)

    # Change wake up time to 08:00
    wake_up_input = page.locator("#wake-up-time")
    wake_up_input.fill("08:00")
    page.wait_for_timeout(1000)

    # Click reset button
    reset_btn = page.locator("button:has(svg.lucide-trash-2)")
    reset_btn.click()
    page.wait_for_timeout(1000)

    # Navigate to String Escaper
    page.goto("http://localhost:5173/fr/outil/string-escaper")
    page.wait_for_timeout(1000)

    # Fill text input
    text_input = page.locator("#string-input")
    text_input.fill("Hello \"World\" & others!")
    page.wait_for_timeout(1000)

    # Click copy button
    copy_btn = page.locator("button:has(svg.lucide-copy)")
    copy_btn.click()
    page.wait_for_timeout(1000)

    # Take screenshot of the state
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
