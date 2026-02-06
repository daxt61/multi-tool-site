import time
from playwright.sync_api import sync_playwright, expect

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # 1. Verify Home Page and Random Tool button
            print("Navigating to home page...")
            page.goto("http://localhost:5173/", wait_until="networkidle")
            page.wait_for_selector("button[aria-label='Outil aléatoire']", timeout=10000)
            page.screenshot(path="verification/verification_home.png")

            # 2. Click Random Tool button
            print("Clicking random tool button...")
            page.click("button[aria-label='Outil aléatoire']")
            page.wait_for_url("**/outil/**", timeout=10000)

            # 3. Verify Share button on Tool Page
            print("Verifying share button...")
            page.wait_for_selector("button[aria-label='Partager cet outil']", timeout=10000)
            page.screenshot(path="verification/verification_tool.png")

            # 4. Verify Currency Converter Error (Mocking failure)
            print("Verifying currency converter error...")
            # We must use route BEFORE navigation or reload
            page.route("https://api.frankfurter.app/latest?from=EUR", lambda route: route.abort())
            page.goto("http://localhost:5173/outil/currency-converter", wait_until="networkidle")

            # Wait for error message to appear
            page.wait_for_selector("text=Erreur de mise à jour", timeout=10000)
            # Take full page screenshot
            page.screenshot(path="verification/verification_currency_error_full.png", full_page=True)
            print("Currency converter error verified")
        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
