import os
from playwright.sync_api import sync_playwright

def run_verification(page):
    # Navigate to Duration Calculator
    page.goto("http://localhost:5173/fr/outil/duration-calculator")
    page.wait_for_timeout(1000)

    # Click a duration preset
    page.get_by_role("button", name="Workday & Lunch Break").click()
    page.wait_for_timeout(1000)

    # Navigate to GraphQL to Snowflake Converter
    page.goto("http://localhost:5173/fr/outil/graphql-to-snowflake")
    page.wait_for_timeout(1000)

    # Click preset
    page.get_by_role("button", name="Sensor & IoT Telemetry").click()
    page.wait_for_timeout(1000)

    # Screenshot
    page.screenshot(path="verification/screenshots/verification_snowflake_duration.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("verification/videos", exist_ok=True)
    os.makedirs("verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
