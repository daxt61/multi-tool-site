import os
from playwright.sync_api import sync_playwright, expect

def main():
    os.makedirs('/home/jules/verification', exist_ok=True)

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # 1. Verify List Shuffler
        print("Navigating to List Shuffler...")
        page.goto("http://localhost:5173/en/outil/list-shuffler")
        page.wait_for_selector("#shuffler-input")

        # Fill in custom values or click preset
        print("Loading Numbers 1-20 preset...")
        page.click("button:has-text('Numbers 1-20')")
        page.wait_for_timeout(500)

        # Click shuffle
        print("Shuffling...")
        page.click("button:has-text('Shuffle')")
        page.wait_for_timeout(500)

        # Change delimiter to comma
        page.select_option("#shuffler-out-delim", "comma")
        page.wait_for_timeout(500)

        # Take a screenshot of the Shuffler
        screenshot_shuffler_path = "/home/jules/verification/list_shuffler.png"
        page.screenshot(path=screenshot_shuffler_path)
        print(f"List Shuffler screenshot saved to {screenshot_shuffler_path}")

        # 2. Verify List Cleaner
        print("Navigating to List Cleaner...")
        page.goto("http://localhost:5173/en/outil/list-cleaner")
        page.wait_for_selector("#list-input")

        # Fill in items
        page.fill("#list-input", "pear\napple\norange\napple\nbanana")
        page.wait_for_timeout(300)

        # Add prefix
        page.fill("#cleaner-prefix", "* ")
        page.click("button:has-text('Add')")
        page.wait_for_timeout(300)

        # Take a screenshot of the Cleaner
        screenshot_cleaner_path = "/home/jules/verification/list_cleaner.png"
        page.screenshot(path=screenshot_cleaner_path)
        print(f"List Cleaner screenshot saved to {screenshot_cleaner_path}")

        browser.close()

if __name__ == "__main__":
    main()
