from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the local server
        page.goto("http://localhost:5173/en/outil/password-strength")

        # Wait for the input to load
        input_field = page.locator("#password-input")
        expect(input_field).to_be_visible()

        # Type some text to test
        input_field.fill("SuperSecureP@ss123!")

        # Wait a bit
        page.wait_for_timeout(1000)

        # Take a screenshot
        page.screenshot(path="/home/jules/verification/password-strength-verified.png")
        print("Screenshot saved to /home/jules/verification/password-strength-verified.png")
        browser.close()

if __name__ == "__main__":
    main()
