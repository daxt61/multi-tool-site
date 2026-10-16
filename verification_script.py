from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to GraphQL to Mongoose tool
    page.goto("http://localhost:4173/en/outil/graphql-to-mongoose")
    page.wait_for_timeout(500)

    # Click Social Feed & Comments preset
    page.get_by_role("button", name="Social Feed & Comments").click()
    page.wait_for_timeout(500)

    # Take screenshot of Mongoose tool
    page.screenshot(path="/home/jules/verification/screenshots/mongoose_verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

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
