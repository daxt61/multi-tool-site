from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the universal-encoder-decoder tool
    page.goto("http://localhost:5173/fr/outil/universal-encoder-decoder")
    page.wait_for_timeout(1000)

    # Type some customized text into the primary text input
    textarea = page.locator("textarea#text-textarea")
    textarea.fill("")
    page.wait_for_timeout(500)
    textarea.type("Vite + React!")
    page.wait_for_timeout(1000)

    # Let's change the Caesar Shift to 5
    slider = page.locator("input[type='range']")
    slider.fill("5")
    page.wait_for_timeout(1000)

    # Let's select Hex Prefix "0x"
    select_prefix = page.locator("select").first
    select_prefix.select_option("0x")
    page.wait_for_timeout(1000)

    # Type "0x410x420x43" in Hex and check text updates
    hex_area = page.locator("textarea#hex-textarea")
    hex_area.fill("")
    page.wait_for_timeout(500)
    hex_area.type("0x410x420x43")
    page.wait_for_timeout(1500)

    # Take screenshot of the finished visual state
    page.screenshot(path="/home/jules/verification/screenshots/universal_encoder_decoder.png")
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
