from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    print("Navigating to Gzip & Deflate tool...")
    page.goto("http://localhost:5173/en/outil/gzip-deflate")
    page.wait_for_timeout(1000)

    # Fill in some text
    print("Inputting text data...")
    input_text = page.locator("#gzip-input-text")
    input_text.fill("Playwright test verification for Gzip and Deflate. Premium UX layout looks amazing!")
    page.wait_for_timeout(1000)

    # Click format toggle to Deflate
    print("Toggling to Deflate algorithm...")
    page.locator('button:has-text("DEFLATE")').click()
    page.wait_for_timeout(1000)

    # Check stats panel
    print("Checking if stats panel is visible...")
    page.wait_for_selector("text=Original Size")

    # Take screenshot of final state
    screenshot_path = "verification_gzip_deflate.png"
    print(f"Saving screenshot to {screenshot_path}...")
    page.screenshot(path=screenshot_path)
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            print("Closing browser context...")
            context.close()
            browser.close()
        print("Verification complete.")
