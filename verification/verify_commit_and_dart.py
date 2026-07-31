import os
from playwright.sync_api import sync_playwright

def run_verification(page):
    # 1. Verify Commit Message Generator
    print("Navigating to Commit Message Generator...")
    page.goto("http://localhost:5173/en/outil/commit-message-generator")
    page.wait_for_timeout(1000)

    # Fill in the form
    print("Filling commit subject and options...")
    page.locator("#commit-scope").fill("api-gateway")
    page.wait_for_timeout(500)
    page.locator("#commit-subject").fill("implement standard rate limiting policy")
    page.wait_for_timeout(500)
    page.locator("#commit-body").fill("Utilizes Redis to limit requests per API key to 100/min. Returns 429 on exhaustion.")
    page.wait_for_timeout(500)
    page.locator("#commit-issues").fill("Fixes #104, Closes #112")
    page.wait_for_timeout(500)

    # Click breaking checkbox
    page.locator("#commit-breaking").click()
    page.wait_for_timeout(500)
    page.locator("#commit-breaking-details").fill("removes backward compatibility for raw API key endpoints")
    page.wait_for_timeout(500)

    # Take screenshot of Commit Message Generator terminal state
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/commit_message_generator.png")
    print("Screenshot of Commit Message Generator saved.")

    # 2. Verify JSON to Dart Converter
    print("Navigating to JSON to Dart...")
    page.goto("http://localhost:5173/en/outil/json-to-dart")
    page.wait_for_timeout(1000)

    # Fill in JSON content
    print("Filling JSON input...")
    json_data = '{"id": 101, "username": "jane_doe", "emails": ["jane@example.com"], "profile": {"age": 28, "active": true}}'
    page.locator("#json-input").fill(json_data)
    page.wait_for_timeout(1000)

    # Turn on copyWith and toString
    # checkboxes are:
    # 0: null safety (checked by default)
    # 1: serialization (checked by default)
    # 2: copyWith (unchecked)
    # 3: toString (unchecked)
    print("Checking CopyWith and ToString...")
    checkboxes = page.locator("input[type='checkbox']")
    checkboxes.nth(2).click()
    page.wait_for_timeout(500)
    checkboxes.nth(3).click()
    page.wait_for_timeout(500)

    # Fill modifiers prefix/suffix
    page.locator("#prefix-mod").fill("User")
    page.wait_for_timeout(500)
    page.locator("#suffix-mod").fill("Dto")
    page.wait_for_timeout(1000)

    # Take screenshot of JSON to Dart terminal state
    page.screenshot(path="/home/jules/verification/screenshots/json_to_dart_upgraded.png")
    print("Screenshot of JSON to Dart saved.")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
    print("Verification completed successfully!")
