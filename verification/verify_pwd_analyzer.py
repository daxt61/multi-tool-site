from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the Password Analyzer tool in English
    page.goto("http://localhost:5173/en/outil/password-analyzer")
    page.wait_for_timeout(1000)

    # Find the password input field
    input_field = page.locator("#pwd-analyzer")
    expect_visible = input_field.is_visible()
    print(f"Password Analyzer Input visible: {expect_visible}")

    # Focus the input field and type a password
    input_field.focus()
    page.wait_for_timeout(500)
    page.keyboard.type("P@ssword123!")
    page.wait_for_timeout(1000)

    # Take a screenshot showing the analysis score and checks
    screenshot_dir = "/home/jules/verification/screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    screenshot_path = os.path.join(screenshot_dir, "pwd_analyzer_verified.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        videos_dir = "/home/jules/verification/videos"
        os.makedirs(videos_dir, exist_ok=True)
        context = browser.new_context(
            record_video_dir=videos_dir
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
            print("Finished CUJ recording successfully.")
